import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';

import {
  AdminHeader,
  AdminMessageList,
  LoadingOverlay,
  MessageChatPane,
  MessageType,
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
} from '../store/api';
import { RootState } from '../store/store';
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler';
import { Group } from '../types';
import ReuseModal, { ReuseModalProps } from '../component/ReuseModal';

type Conversation = {
  participant: MessageParticipant;
  lastMessage?: ChatMessage;
  messages: ChatMessage[];
};

const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];
const KEYBOARD_COMPOSER_GAP = 32;

const getOtherParticipant = (message: ChatMessage, currentUserId: string) =>
  message.sendBy.id === currentUserId ? message.receivedTo : message.sendBy;

const getInitialMessageFilter = (filter?: string): MessageType =>
  filter === 'group' ? 'group' : 'individual';

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
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const adminId = useSelector((state: RootState) => state.common.adminId);
  const studentId = useSelector((state: RootState) => state.common.studentId);
  const currentUserId = isAdmin ? adminId : studentId ?? '';
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(
    route.params?.studentId ?? null,
  );
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<MessageType>(() =>
    getInitialMessageFilter(route.params?.filter),
  );
  const [modal, setModal] = useState<ReuseModalProps>(MODAL_INITIAL);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [composerKeyboardOffset, setComposerKeyboardOffset] = useState(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const composerRef = useRef<View>(null);
  const keyboardTopRef = useRef<number | null>(null);
  const composerKeyboardOffsetRef = useRef(0);

  const [selectedStudentDetail, setSelectedStudentDetail] =
    useState<MessageStudent | null>(null);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<Group | null>(
    null,
  );

  const isChatOpen = Boolean(selectedStudentDetail || selectedGroupDetail);

  useEffect(() => {
    setSelectedFilter(getInitialMessageFilter(route.params?.filter));
  }, [route.params?.filter]);

  const { data: messages = [], refetch: refetchMessages } = useGetMessagesQuery(
    { studentId: activeRecipientId || '' },
    {
      skip: !isFocused || !currentUserId || (isAdmin && !activeRecipientId),
    },
  );

  const {
    data: messageStudents = [],
    isLoading: isStudentListLoading,
    refetch: refetchMessageStudents,
  } = useGetMessageStudentsQuery(undefined, {
    skip: !isFocused || !isAdmin,
  });
  const {
    data: groupList = [],
    isLoading: isGroupListLoading,
    refetch: refetchGroupList,
  } = useGetMessageGroupQuery(undefined, {
    skip: !isFocused || !isAdmin || !(selectedFilter === 'group'),
  });

  const [deleteMessageGroup, { isLoading: isDeletingGroup }] =
    useDeleteMessageGroupMutation();
  const [readMessages] = useReadMessagesMutation();
  const isGroupActionLoading = isDeletingGroup;

  // const sortedMessages = useMemo(() => sortByCreatedAt(messages), [messages]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!currentUserId) return [];

    const map = new Map<string, Conversation>();

    messages.forEach(message => {
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
  }, [currentUserId, messages]);

  const selectedMessageStudent = useMemo(
    () => messageStudents.find(student => student.id === activeRecipientId),
    [activeRecipientId, messageStudents],
  );

  const selectedMessageGroup = useMemo(
    () => groupList.find(group => group._id === activeGroupId),
    [activeGroupId, groupList],
  );

  const studentAdminParticipant = useMemo(
    () =>
      messages
        .flatMap(message => [message.sendBy, message.receivedTo])
        .find(participant => participant.model === 'Admin'),
    [messages],
  );

  const activeConversation = useMemo(() => {
    if (isAdmin && activeGroupId) {
      if (!selectedMessageGroup) return undefined;

      return {
        participant: {
          id: selectedMessageGroup._id,
          name: selectedMessageGroup.groupName,
          code: `${selectedMessageGroup.studentIds.length} students`,
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
      messages: messages.filter(
        message =>
          message.sendBy.id === studentAdminParticipant.id ||
          message.receivedTo.id === studentAdminParticipant.id,
      ),
      lastMessage: messages[messages.length - 1],
    };
  }, [
    activeRecipientId,
    activeGroupId,
    conversations,
    isAdmin,
    selectedMessageGroup,
    selectedMessageStudent,
    messages,
    studentAdminParticipant,
  ]);

  const chatMessages = activeConversation?.messages ?? EMPTY_CHAT_MESSAGES;
  const activeParticipant = activeConversation?.participant;
  const isGroupChat = activeParticipant?.model === 'Group';
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
    if (!isAdmin) return;

    const parent = navigation.getParent(); // Tab navigator

    parent?.setOptions({
      tabBarStyle: isChatOpen
        ? { display: 'none' }
        : {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
          },
    });

    return () => {
      parent?.setOptions({
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
          await refetchGroupList();
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
    refetchGroupList,
    refetchMessageStudents,
    refetchMessages,
  ]);

  const handleSelectStudent = useCallback(
    (student: MessageStudent) => {
      setSelectedStudentDetail(student);
      setSelectedGroupDetail(null);

      if (student.unreadMessageCount <= 0) return;

      readMessages({ studentId: student.id })
        .unwrap()
        .catch(() => undefined);
    },
    [readMessages],
  );

  const handleSelectGroup = useCallback((group: Group) => {
    setSelectedStudentDetail(null);
    setSelectedGroupDetail(group);
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

  useAndroidBackHandler(handleChatBack);

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
          <AdminMessageList
            selectedFilter={selectedFilter}
            students={messageStudents}
            groups={groupList}
            refreshing={refreshing}
            isStudentListLoading={isStudentListLoading}
            isGroupListLoading={isGroupListLoading}
            onRefresh={onRefresh}
            onFilterSelect={handleFilterSelect}
            onCreateGroup={creteNewGroup}
            onSelectStudent={handleSelectStudent}
            onSelectGroup={handleSelectGroup}
            onEditGroup={handleEditGroup}
            onDeleteGroup={confirmDeleteGroup}
          />
        ) : (
          <MessageChatPane
            selectedStudentDetail={selectedStudentDetail}
            selectedGroupDetail={selectedGroupDetail}
            composerRef={composerRef}
            draft={draft}
            composerKeyboardOffset={composerKeyboardOffset}
            keyboardVisible={keyboardVisible}
            keyboardTopRef={keyboardTopRef}
            setDraft={setDraft}
            onBack={handleChatBack}
            onResetKeyboardCorrection={resetKeyboardCorrection}
            onUpdateComposerKeyboardOffset={updateComposerKeyboardOffset}
          />
        )}
      </KeyboardAvoidingView>
      <LoadingOverlay
        visible={isGroupActionLoading}
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
});
