import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminHeader, LoadingOverlay, LoadingState } from '../component';
import {
  ChatMessage,
  MessageStudent,
  MessageParticipant,
  useGetMessageStudentsQuery,
  useGetMessagesQuery,
  useReadMessagesMutation,
  useSendMessageMutation,
} from '../store/api';
import { RootState } from '../store/store';
import { getFileUrl } from '../util/fileUrl';
import { AdminMessageScreenStyles as styles } from './styles/AdminMessageScreen.styles';

type Conversation = {
  participant: MessageParticipant;
  lastMessage?: ChatMessage;
  messages: ChatMessage[];
};

const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];
const KEYBOARD_COMPOSER_GAP = 32;

const formatMessageTime = (dateValue?: string) => {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getInitials = (name: string) =>
  (name || 'User')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const ParticipantAvatar = ({
  participant,
  fallbackName,
  size = 42,
}: {
  participant?: Pick<MessageParticipant, 'name' | 'profilePicPath'>;
  fallbackName: string;
  size?: number;
}) => {
  const name = participant?.name || fallbackName;
  const imageUrl = getFileUrl(participant?.profilePicPath);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
      )}
    </View>
  );
};

const sortByCreatedAt = (items: ChatMessage[]) =>
  [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return aTime - bTime;
  });

const getOtherParticipant = (message: ChatMessage, currentUserId: string) =>
  message.sendBy.id === currentUserId ? message.receivedTo : message.sendBy;

const StudentRow = ({
  student,
  onPress,
}: {
  student: MessageStudent;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.studentRow}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <ParticipantAvatar participant={student} fallbackName="Student" />
    <View style={styles.conversationBody}>
      <View style={styles.conversationTop}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {student.name}
        </Text>
      </View>
      <Text style={styles.conversationPreview} numberOfLines={1}>
        {student.studentId ?? `Level ${student.level ?? '-'}`}
      </Text>
    </View>
    {student.unreadMessageCount > 0 ? (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadBadgeText}>
          {student.unreadMessageCount > 99 ? '99+' : student.unreadMessageCount}
        </Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const MessageBubble = ({
  item,
  currentUserId,
}: {
  item: ChatMessage;
  currentUserId: string;
}) => {
  const isMine = item.sendBy.id === currentUserId;

  return (
    <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
      <View
        style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}
      >
        <Text style={[styles.messageText, isMine && styles.myMessageText]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
          {formatMessageTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
};

export default function AdminMessageScreen() {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const isStudent = useSelector((state: RootState) => state.common.isStudent);
  const adminId = useSelector((state: RootState) => state.common.adminId);
  const studentId = useSelector((state: RootState) => state.common.studentId);
  const studentName = useSelector(
    (state: RootState) => state.common.studentName,
  );
  const currentUserId = isAdmin ? adminId : studentId ?? '';
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(
    route.params?.studentId ?? null,
  );
  const [draft, setDraft] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [composerKeyboardOffset, setComposerKeyboardOffset] = useState(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const composerRef = useRef<View>(null);
  const keyboardTopRef = useRef<number | null>(null);
  const composerKeyboardOffsetRef = useRef(0);

  const {
    data: messages = [],
    isLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery(undefined, {
    skip: !isFocused || !currentUserId || (isAdmin && !activeRecipientId),
    // pollingInterval: 20000,
  });
  const {
    data: messageStudents = [],
    isLoading: isStudentListLoading,
    refetch: refetchMessageStudents,
  } = useGetMessageStudentsQuery(undefined, {
    skip: !isFocused || !isAdmin,
  });
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [readMessages] = useReadMessagesMutation();
  const composerBottomPadding = keyboardVisible
    ? 10
    : Math.max(10, insets.bottom);

  const sortedMessages = useMemo(() => sortByCreatedAt(messages), [messages]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!currentUserId) return [];

    const map = new Map<string, Conversation>();

    sortedMessages.forEach(message => {
      const participant = getOtherParticipant(message, currentUserId);
      const existing = map.get(participant.id);

      if (existing) {
        existing.messages.push(message);
        existing.lastMessage = message;
      } else {
        map.set(participant.id, {
          participant,
          lastMessage: message,
          messages: [message],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.lastMessage?.createdAt ?? 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
  }, [currentUserId, sortedMessages]);

  const selectedMessageStudent = useMemo(
    () => messageStudents.find(student => student.id === activeRecipientId),
    [activeRecipientId, messageStudents],
  );

  const studentAdminParticipant = useMemo(
    () =>
      sortedMessages
        .flatMap(message => [message.sendBy, message.receivedTo])
        .find(participant => participant.model === 'Admin'),
    [sortedMessages],
  );

  const activeConversation = useMemo(() => {
    if (isAdmin) {
      const existingConversation = conversations.find(
        item => item.participant.id === activeRecipientId,
      );

      if (existingConversation) return existingConversation;

      if (!selectedMessageStudent) return undefined;

      return {
        participant: {
          id: selectedMessageStudent.id,
          name: selectedMessageStudent.name,
          code: selectedMessageStudent.studentId,
          model: 'Student',
          profilePicPath: selectedMessageStudent.profilePicPath,
        },
        messages: [],
      };
    }

    if (!studentAdminParticipant) return undefined;

    return {
      participant: studentAdminParticipant,
      messages: sortedMessages.filter(
        message =>
          message.sendBy.id === studentAdminParticipant.id ||
          message.receivedTo.id === studentAdminParticipant.id,
      ),
      lastMessage: sortedMessages[sortedMessages.length - 1],
    };
  }, [
    activeRecipientId,
    conversations,
    isAdmin,
    selectedMessageStudent,
    sortedMessages,
    studentAdminParticipant,
  ]);

  const chatMessages = activeConversation?.messages ?? EMPTY_CHAT_MESSAGES;
  const invertedChatMessages = useMemo(
    () => [...chatMessages].reverse(),
    [chatMessages],
  );
  const activeParticipant = activeConversation?.participant;
  const activeParticipantCode =
    activeParticipant?.model === 'Admin' ? undefined : activeParticipant?.code;
  const canSend = draft.trim().length > 0 && Boolean(activeParticipant?.id);
  const scrollToChatBottom = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated });
    });
  }, []);

  const resetKeyboardCorrection = useCallback(() => {
    keyboardTopRef.current = null;
    composerKeyboardOffsetRef.current = 0;
    setKeyboardVisible(false);
    setComposerKeyboardOffset(0);
  }, []);

  const updateComposerKeyboardOffset = useCallback((keyboardTop: number) => {
    if (Platform.OS !== 'android') return;

    requestAnimationFrame(() => {
      composerRef.current?.measureInWindow((_, y, __, height) => {
        const composerBottom = y + height;
        const overlap = composerBottom + KEYBOARD_COMPOSER_GAP - keyboardTop;
        const nextOffset = Math.max(
          0,
          composerKeyboardOffsetRef.current + overlap,
        );

        if (Math.abs(nextOffset - composerKeyboardOffsetRef.current) < 1) {
          return;
        }

        composerKeyboardOffsetRef.current = nextOffset;
        setComposerKeyboardOffset(nextOffset);
      });
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    navigation.setOptions({
      tabBarStyle: activeRecipientId
        ? { display: 'none' }
        : {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
          },
    });

    return () => {
      navigation.setOptions({
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
        },
      });
    };
  }, [activeRecipientId, isAdmin, navigation]);

  useEffect(() => {
    if (chatMessages.length === 0) return;

    scrollToChatBottom(false);
    const firstTimer = setTimeout(() => scrollToChatBottom(false), 120);
    const secondTimer = setTimeout(() => scrollToChatBottom(true), 320);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, [activeRecipientId, chatMessages.length, scrollToChatBottom]);

  useEffect(() => {
    const keyboardShowSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      event => {
        setKeyboardVisible(true);
        keyboardTopRef.current = event.endCoordinates.screenY;
        composerKeyboardOffsetRef.current = 0;
        setComposerKeyboardOffset(0);

        if (Platform.OS === 'android') {
          setTimeout(
            () => updateComposerKeyboardOffset(event.endCoordinates.screenY),
            80,
          );
          setTimeout(
            () => updateComposerKeyboardOffset(event.endCoordinates.screenY),
            260,
          );
        }

        scrollToChatBottom(true);
      },
    );
    const keyboardHideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      resetKeyboardCorrection,
    );

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
    };
  }, [
    resetKeyboardCorrection,
    scrollToChatBottom,
    updateComposerKeyboardOffset,
  ]);

  useEffect(() => {
    if (!isFocused) return undefined;

    const readStudentId = isAdmin ? activeRecipientId : studentId;
    if (!readStudentId) return undefined;

    return () => {
      const data = isAdmin ? { studentId: readStudentId } : {};
      readMessages(data)
        .unwrap()
        .catch(() => undefined);
    };
  }, [activeRecipientId, isAdmin, isFocused, readMessages, studentId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isAdmin && !activeRecipientId) {
        await refetchMessageStudents();
      } else {
        await refetchMessages();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeRecipientId, isAdmin, refetchMessageStudents, refetchMessages]);

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || !activeParticipant?.id || isSending) return;

    try {
      setDraft('');
      await sendMessage({
        message,
        receivedTo: activeParticipant.id,
      }).unwrap();
      await refetchMessages();
    } catch {
      setDraft(message);
      Alert.alert('Message not sent', 'Please try again.');
    }
  };

  const handleSelectStudent = useCallback(
    (student: MessageStudent) => {
      setActiveRecipientId(student.id);

      if (student.unreadMessageCount <= 0) return;

      readMessages({ studentId: student.id })
        .unwrap()
        .catch(() => undefined);
    },
    [readMessages],
  );

  const handleChatBack = useCallback(() => {
    if (isAdmin) {
      setActiveRecipientId(null);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(
      CommonActions.navigate({
        name: 'Progress',
      }),
    );
  }, [isAdmin, navigation]);

  const renderAdminStudentList = () => (
    <View style={styles.studentListPane}>
      <FlatList
        data={messageStudents}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.studentList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
        renderItem={({ item }) => (
          <StudentRow
            student={item}
            onPress={() => handleSelectStudent(item)}
          />
        )}
        ListEmptyComponent={
          isStudentListLoading ? (
            <LoadingState label="Loading students..." />
          ) : (
            <View style={styles.emptyChat}>
              <MaterialIcons name="people-outline" size={42} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No students found</Text>
            </View>
          )
        }
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      {isAdmin && !activeRecipientId ? (
        <AdminHeader header="Messages" headerBackgroundColor="#F8F9FB" />
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isAdmin && !activeRecipientId ? (
          renderAdminStudentList()
        ) : (
          <View style={styles.content}>
            <View style={styles.chatPane}>
              <View
                style={[
                  styles.chatHeader,
                  Platform.OS === 'android' && {
                    paddingTop: insets.top,
                    minHeight: 62 + insets.top,
                  },
                ]}
              >
                {isAdmin || isStudent ? (
                  <TouchableOpacity
                    style={styles.chatBackButton}
                    onPress={handleChatBack}
                    activeOpacity={0.78}
                  >
                    <MaterialIcons
                      name="arrow-back"
                      size={22}
                      color="#1E293B"
                    />
                  </TouchableOpacity>
                ) : null}
                <ParticipantAvatar
                  participant={activeParticipant}
                  fallbackName={isAdmin ? 'Student' : 'Admin'}
                  size={38}
                />
                <View style={styles.chatHeaderText}>
                  <Text style={styles.chatName} numberOfLines={1}>
                    {activeParticipant?.name ??
                      (isAdmin ? 'Select a student' : 'Admin')}
                  </Text>
                  <Text style={styles.chatSubText} numberOfLines={1}>
                    {activeParticipantCode ??
                      (isStudent ? studentName || 'Student' : 'Conversation')}
                  </Text>
                </View>
              </View>

              <FlatList
                ref={listRef}
                data={invertedChatMessages}
                inverted
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <MessageBubble item={item} currentUserId={currentUserId} />
                )}
                contentContainerStyle={styles.messageList}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollToChatBottom(false)}
                onLayout={() => scrollToChatBottom(false)}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#4F46E5"
                    colors={['#4F46E5']}
                  />
                }
                ListEmptyComponent={
                  isLoading ? (
                    <LoadingState label="...." />
                  ) : (
                    <View style={styles.emptyChat}>
                      <MaterialIcons
                        name="chat-bubble-outline"
                        size={42}
                        color="#94A3B8"
                      />
                      <Text style={styles.emptyTitle}>No messages yet</Text>
                      <Text style={styles.emptyText}>
                        {activeParticipant?.id
                          ? 'Send the first message to start this chat.'
                          : 'Select a student to start chatting.'}
                      </Text>
                    </View>
                  )
                }
              />

              <View
                ref={composerRef}
                onLayout={() => {
                  if (
                    Platform.OS === 'android' &&
                    keyboardVisible &&
                    keyboardTopRef.current
                  ) {
                    updateComposerKeyboardOffset(keyboardTopRef.current);
                  }
                }}
                style={[
                  styles.composer,
                  { paddingBottom: composerBottomPadding },
                  Platform.OS === 'android' && composerKeyboardOffset > 0
                    ? { marginBottom: composerKeyboardOffset }
                    : null,
                ]}
              >
                <TextInput
                  style={styles.composerInput}
                  placeholder={
                    activeParticipant?.id
                      ? 'Type a message'
                      : 'Choose a chat first'
                  }
                  placeholderTextColor="#94A3B8"
                  value={draft}
                  onChangeText={setDraft}
                  onFocus={() => {
                    composerKeyboardOffsetRef.current = 0;
                    setComposerKeyboardOffset(0);
                    setTimeout(() => scrollToChatBottom(true), 300);
                  }}
                  onBlur={resetKeyboardCorrection}
                  multiline
                  blurOnSubmit={false}
                  editable={Boolean(activeParticipant?.id) && !isSending}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!canSend || isSending) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!canSend || isSending}
                  activeOpacity={0.82}
                >
                  <MaterialIcons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isSending} label="Sending message..." />
    </SafeAreaView>
  );
}
