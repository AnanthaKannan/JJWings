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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
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

type Conversation = {
  participant: MessageParticipant;
  lastMessage?: ChatMessage;
  messages: ChatMessage[];
};

const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];

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
  participant?: Pick<
    MessageParticipant,
    'name' | 'profilePic' | 'profilePicPath'
  >;
  fallbackName: string;
  size?: number;
}) => {
  const name = participant?.name || fallbackName;
  const imageUrl = getFileUrl(
    participant?.profilePicPath ?? participant?.profilePic,
  );

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
          {student.unreadMessageCount > 99
            ? '99+'
            : student.unreadMessageCount}
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
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const {
    data: messages = [],
    isLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery(undefined, {
    skip: !isFocused || !currentUserId || (isAdmin && !activeRecipientId),
    pollingInterval: 20000,
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
          profilePic: selectedMessageStudent.profilePic,
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
    if (!isFocused) return undefined;

    const readStudentId = isAdmin ? activeRecipientId : studentId;
    if (!readStudentId) return undefined;

    return () => {
      readMessages({ studentId: readStudentId })
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
              <View style={styles.chatHeader}>
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
                    <LoadingState label="Loading messages..." />
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

              <View style={styles.composer}>
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
                  multiline
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  studentListPane: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  studentList: {
    padding: 14,
    gap: 10,
  },
  studentRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  threadPane: {
    maxHeight: 230,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 12,
  },
  threadTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '900',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  threadList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  conversationRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conversationRowActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  conversationBody: {
    flex: 1,
    marginLeft: 10,
  },
  conversationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationName: {
    flex: 1,
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  conversationTime: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  conversationPreview: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    alignSelf: 'center',
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  chatPane: {
    flex: 1,
  },
  chatHeader: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chatBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  chatHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  chatName: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '900',
  },
  chatSubText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  messageList: {
    flexGrow: 1,
    padding: 14,
    gap: 8,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  myBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 3,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    alignSelf: 'flex-end',
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  myMessageTime: {
    color: '#C7D2FE',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  composerInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    color: '#1E293B',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  avatar: {
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyChat: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  emptySmall: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptySmallText: {
    color: '#64748B',
    fontWeight: '700',
  },
});
