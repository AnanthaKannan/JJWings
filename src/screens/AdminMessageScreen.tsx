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
  Keyboard,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AdminHeader,
  Filter,
  FloatingAddButton,
  LoadingOverlay,
  LoadingState,
  GroupRow,
  Avatar,
  StudentRow,
} from '../component';
import {
  ChatMessage,
  MessageStudent,
  MessageParticipant,
  useGetMessageStudentsQuery,
  useGetMessageGroupQuery,
  useGetMessagesQuery,
  useReadMessagesMutation,
  useDeleteMessageGroupMutation,
  useSendMessageMutation,
  useSendGroupMessageMutation,
} from '../store/api';
import { RootState } from '../store/store';
import { Group } from '../types';
import ReuseModal, { ReuseModalProps } from '../component/ReuseModal';
import MessageBubble from '../component/message/MessageBubble';

type Conversation = {
  participant: MessageParticipant;
  lastMessage?: ChatMessage;
  messages: ChatMessage[];
};

const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];
const KEYBOARD_COMPOSER_GAP = 32;

const sortByCreatedAt = (items: ChatMessage[]) =>
  [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return aTime - bTime;
  });

const getOtherParticipant = (message: ChatMessage, currentUserId: string) =>
  message.sendBy.id === currentUserId ? message.receivedTo : message.sendBy;

type MessageType = 'group' | 'individual';

const FILTERS: { label: string; value: MessageType }[] = [
  { label: 'Students', value: 'individual' },
  { label: 'Group', value: 'group' },
];

const MODAL_INITIAL: ReuseModalProps = {
  state: 'confirm',
  visible: false,
  title: '',
  description: '',
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
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] =
    useState<MessageType>('individual');
  const [modal, setModal] = useState<ReuseModalProps>(MODAL_INITIAL);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [composerKeyboardOffset, setComposerKeyboardOffset] = useState(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const composerRef = useRef<View>(null);
  const keyboardTopRef = useRef<number | null>(null);
  const composerKeyboardOffsetRef = useRef(0);

  const isChatOpen = Boolean(activeRecipientId || activeGroupId);

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
  const {
    data: messageGroups = [],
    isLoading: isGroupListLoading,
    refetch: refetchMessageGroups,
  } = useGetMessageGroupQuery(undefined, {
    skip: !isFocused || !isAdmin,
  });

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [sendGroupMessage, { isLoading: isSendingGroup }] =
    useSendGroupMessageMutation();
  const [deleteMessageGroup, { isLoading: isDeletingGroup }] =
    useDeleteMessageGroupMutation();
  const [readMessages] = useReadMessagesMutation();
  const isSendingAny = isSending || isSendingGroup;
  const isGroupActionLoading = isDeletingGroup;
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

  const selectedMessageGroup = useMemo(
    () => messageGroups.find(group => group._id === activeGroupId),
    [activeGroupId, messageGroups],
  );

  const studentAdminParticipant = useMemo(
    () =>
      sortedMessages
        .flatMap(message => [message.sendBy, message.receivedTo])
        .find(participant => participant.model === 'Admin'),
    [sortedMessages],
  );

  const activeConversation = useMemo(() => {
    if (isAdmin && activeGroupId) {
      if (!selectedMessageGroup) return undefined;

      return {
        participant: {
          id: selectedMessageGroup._id,
          name: selectedMessageGroup.groupName,
          code: `${selectedMessageGroup.studentCount} students`,
          model: 'Group' as const,
          profilePicPath: undefined,
        },
        // Group broadcasts are send-only here - replies come back to the
        // admin as individual student conversations, not into this thread.
        messages: [],
      };
    }

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
          model: 'Student' as const,
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
    activeGroupId,
    conversations,
    isAdmin,
    selectedMessageGroup,
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
  const isGroupChat = activeParticipant?.model === 'Group';
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
      tabBarStyle: isChatOpen
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
  }, [isChatOpen, isAdmin, navigation]);

  useEffect(() => {
    if (chatMessages.length === 0) return;

    scrollToChatBottom(false);
    const firstTimer = setTimeout(() => scrollToChatBottom(false), 120);
    const secondTimer = setTimeout(() => scrollToChatBottom(true), 320);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, [
    activeRecipientId,
    activeGroupId,
    chatMessages.length,
    scrollToChatBottom,
  ]);

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
    if (isAdmin && activeGroupId) return undefined; // group threads are send-only, nothing to mark read

    const readStudentId = isAdmin ? activeRecipientId : studentId;
    if (!readStudentId) return undefined;

    return () => {
      const data = isAdmin ? { studentId: readStudentId } : {};
      readMessages(data)
        .unwrap()
        .catch(() => undefined);
    };
  }, [
    activeRecipientId,
    activeGroupId,
    isAdmin,
    isFocused,
    readMessages,
    studentId,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isAdmin && !isChatOpen) {
        if (selectedFilter === 'group') {
          await refetchMessageGroups();
        } else {
          await refetchMessageStudents();
        }
      } else {
        await refetchMessages();
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    isAdmin,
    isChatOpen,
    selectedFilter,
    refetchMessageGroups,
    refetchMessageStudents,
    refetchMessages,
  ]);

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || !activeParticipant?.id || isSendingAny) return;

    try {
      setDraft('');

      if (isGroupChat) {
        await sendGroupMessage({
          message,
          groupId: activeParticipant.id,
        }).unwrap();
      } else {
        await sendMessage({
          message,
          receivedTo: activeParticipant.id,
        }).unwrap();
        await refetchMessages();
      }
    } catch {
      setDraft(message);
      Alert.alert('Message not sent', 'Please try again.');
    }
  };

  const handleSelectStudent = useCallback(
    (student: MessageStudent) => {
      setActiveGroupId(null);
      setActiveRecipientId(student.id);

      if (student.unreadMessageCount <= 0) return;

      readMessages({ studentId: student.id })
        .unwrap()
        .catch(() => undefined);
    },
    [readMessages],
  );

  const handleSelectGroup = useCallback((group: Group) => {
    setActiveRecipientId(null);
    setActiveGroupId(group._id);
  }, []);

  const handleChatBack = useCallback(() => {
    if (isAdmin) {
      setActiveRecipientId(null);
      setActiveGroupId(null);
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

  const handleFilterSelect = (value: MessageType) => {
    setSelectedFilter(value);
  };

  const creteNewGroup = () => {
    navigation.navigate('CreateMessageGroup');
  };

  const handleEditGroup = (group: Group) => {
    navigation.navigate('CreateMessageGroup', { group });
  };

  const deleteGroup = async (group: Group) => {
    try {
      await deleteMessageGroup(group._id).unwrap();
      setModal({
        visible: true,
        state: 'success',
        title: 'Group Deleted',
        description: `*${group.groupName}* has been deleted.`,
        onCancel: () => setModal(MODAL_INITIAL),
      });
    } catch (error) {
      console.error('Failed to delete group:', error);
      setModal({
        visible: true,
        state: 'failure',
        title: 'Group Not Deleted',
        description: 'Please try again.',
        onCancel: () => setModal(MODAL_INITIAL),
      });
    }
  };

  const confirmDeleteGroup = (group: Group) => {
    setModal({
      visible: true,
      state: 'confirm',
      title: 'Delete Group',
      description: `Do you want to delete *${group.groupName}*?`,
      confirmLabel: 'Delete',
      onConfirm: () => deleteGroup(group),
      onCancel: () => setModal(MODAL_INITIAL),
    });
  };

  const renderAdminList = () => (
    <View style={styles.studentListPane}>
      <Filter
        filters={FILTERS}
        onSelect={handleFilterSelect}
        selected={selectedFilter}
      />
      <FloatingAddButton onPress={creteNewGroup} />
      {selectedFilter === 'individual' ? (
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
                <MaterialIcons
                  name="people-outline"
                  size={42}
                  color="#94A3B8"
                />
                <Text style={styles.emptyTitle}>No students found</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={messageGroups}
          keyExtractor={item => item._id}
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
            <GroupRow
              group={item}
              onPress={() => handleSelectGroup(item)}
              onEdit={() => handleEditGroup(item)}
              onDelete={() => confirmDeleteGroup(item)}
            />
          )}
          ListEmptyComponent={
            isGroupListLoading ? (
              <LoadingState label="Loading groups..." />
            ) : (
              <View style={styles.emptyChat}>
                <MaterialIcons name="groups" size={42} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>
                  Tap the + button to create a group.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      {isAdmin && !isChatOpen ? (
        <AdminHeader header="Messages" headerBackgroundColor="#F8F9FB" />
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isAdmin && !isChatOpen ? (
          renderAdminList()
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
                {isGroupChat ? (
                  <Avatar name="" icon="groups" />
                ) : (
                  <Avatar
                    name={activeParticipant?.name || ''}
                    profilePic={activeParticipant?.profilePicPath}
                  />
                )}
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
                  isLoading && !isGroupChat ? (
                    <LoadingState label="...." />
                  ) : (
                    <View style={styles.emptyChat}>
                      <MaterialIcons
                        name={isGroupChat ? 'campaign' : 'chat-bubble-outline'}
                        size={42}
                        color="#94A3B8"
                      />
                      <Text style={styles.emptyTitle}>
                        {isGroupChat
                          ? 'Send a group message'
                          : 'No messages yet'}
                      </Text>
                      <Text style={styles.emptyText}>
                        {isGroupChat
                          ? 'Every student in this group will receive it individually.'
                          : activeParticipant?.id
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
                      ? isGroupChat
                        ? 'Message the whole group'
                        : 'Type a message'
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
                  editable={Boolean(activeParticipant?.id) && !isSendingAny}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!canSend || isSendingAny) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!canSend || isSendingAny}
                  activeOpacity={0.82}
                >
                  <MaterialIcons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
      <LoadingOverlay
        visible={isSendingAny || isGroupActionLoading}
        label={
          isGroupActionLoading
            ? 'Deleting group...'
            : isGroupChat
            ? 'Sending to group...'
            : 'Sending message...'
        }
      />
      <ReuseModal
        visible={modal.visible}
        state={modal.state}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        cancelLabel={modal.cancelLabel}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel ?? (() => setModal(MODAL_INITIAL))}
      />
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
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  groupActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDeleteButton: {
    backgroundColor: '#FEF2F2',
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
    zIndex: 2,
    elevation: 8,
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
