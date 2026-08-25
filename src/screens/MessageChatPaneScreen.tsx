import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import {
  useIsFocused,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChatMessage,
  MessageStudent,
  useGetMessagesQuery,
  useSendGroupMessageMutation,
  useGetGroupMessagesQuery,
  useSendMessageMutation,
  useReadMessagesMutation,
} from '../store/api';
import {
  Avatar,
  MessageType,
  MessageTypeEnum,
  LoadingState,
} from '../component';
import MessageBubble from '../component/message/MessageBubble';
import { RootState } from '../store/store';
import { Group } from '../types';

type MessageChatPaneProps = {
  onBack: () => void;
  selectedStudentDetail: MessageStudent | null;
  selectedGroupDetail: Group | null;
};

export type ActiveParticipantType = {
  id: string;
  name: string;
  profilePicPath: string;
  model: MessageType;
};

export default function MessageChatPane({}: MessageChatPaneProps) {
  const insets = useSafeAreaInsets();
  const [activeParticipant, setActiveParticipant] = useState<{
    id: string;
    name: string;
    profilePicPath: string;
    model: string;
  } | null>(null);
  const {
    isAdmin,
    isStudent,
    adminId,
    studentId,
    studentName,
    studentProfilePic,
  } = useSelector((state: RootState) => state.common);

  const currentUserId = isAdmin ? adminId : studentId ?? '';
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const canSend = draft.trim().length > 0 && Boolean(activeParticipant?.id);
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [sendGroupMessage, { isLoading: isSendingGroup }] =
    useSendGroupMessageMutation();
  const [readMessages] = useReadMessagesMutation();

  const [padding, setPadding] = useState(Math.max(insets.bottom, 10));

  const isGroupChat = activeParticipant?.model === MessageTypeEnum.GROUP;

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const isFocused = useIsFocused();
  const {
    data: messageDetail,
    isLoading: isLoadingMessage,
    isFetching: isFetchingMessage,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { studentId: studentId || activeParticipant?.id || '' },
    {
      skip:
        !isFocused ||
        !currentUserId ||
        !(activeParticipant?.model === MessageTypeEnum.INDIVIDUAL),
    },
  );

  const {
    data: rawGroupMessages = [],
    isLoading: isLoadingGroupMessage,
    isFetching: isFetchingGroupMessage,
    refetch: refetchGroupMessages,
  } = useGetGroupMessagesQuery(
    { groupId: activeParticipant?.id || '' },
    {
      skip:
        !isFocused ||
        !currentUserId ||
        !activeParticipant?.id ||
        !(activeParticipant?.model === MessageTypeEnum.GROUP),
    },
  );

  const groupMessages = useMemo(() => {
    if (!rawGroupMessages) return [];
    const messagesRes: ChatMessage[] = rawGroupMessages.map(message => ({
      id: message._id,
      message: message.text,
      sendBy: {
        id: adminId,
        name: 'suerHero',
        model: 'admin',
      },
      receivedTo: {
        id: '',
        name: '',
        model: 'student',
      },
      createdAt: message.date,
      updatedAt: message.date,
    }));
    return messagesRes;
  }, [adminId, rawGroupMessages]);

  const isSendingAny = isSending || isSendingGroup || isFetchingMessage;

  useEffect(() => {
    const ap = route.params?.activeParticipant as ActiveParticipantType | null;

    if (ap) {
      setActiveParticipant({
        id: ap.id,
        name: ap.name,
        profilePicPath: ap.profilePicPath,
        model: ap.model,
      });
    } else if (isStudent) {
      const adminDetail = messageDetail?.adminDetails;
      setActiveParticipant({
        id: adminDetail?._id as string,
        name: adminDetail?.name as string,
        profilePicPath: adminDetail?.profilePicPath as string,
        model: MessageTypeEnum.INDIVIDUAL,
      });

      if (!adminDetail?._id) return;
      readMessages({ userId: adminDetail._id })
        .unwrap()
        .catch(() => undefined);
    }
  }, [
    route.params?.activeParticipant,
    isStudent,
    studentId,
    studentName,
    studentProfilePic,
    readMessages,
    messageDetail?.adminDetails,
    isFocused,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isGroupChat) {
      await refetchGroupMessages();
    } else {
      await refetchMessages();
    }
    setRefreshing(false);
  }, [isGroupChat, refetchMessages, refetchGroupMessages]);

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
      }
    } catch {
      setDraft(message);
      Alert.alert('Message not sent', 'Please try again.');
    }
  };

  const navigateToMessages = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
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
                onPress={navigateToMessages}
                activeOpacity={0.78}
              >
                <MaterialIcons name="arrow-back" size={22} color="#1E293B" />
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
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={isGroupChat ? groupMessages : messageDetail?.chatMessages}
            inverted
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble item={item} currentUserId={currentUserId} />
            )}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4F46E5"
                colors={['#4F46E5']}
              />
            }
            ListEmptyComponent={
              (isLoadingMessage ||
                isFetchingMessage ||
                isLoadingGroupMessage ||
                isFetchingGroupMessage) &&
              !isGroupChat ? (
                <LoadingState label="...." />
              ) : (
                <View style={styles.emptyChat}>
                  <MaterialIcons
                    name={isGroupChat ? 'campaign' : 'chat-bubble-outline'}
                    size={42}
                    color="#94A3B8"
                  />
                  <Text style={styles.emptyTitle}>
                    {isGroupChat ? 'Send a group message' : 'No messages yet'}
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

          <View style={[styles.composer, { paddingBottom: padding }]}>
            <TextInput
              style={styles.composerInput}
              placeholder={
                activeParticipant?.id
                  ? isGroupChat
                    ? 'Every student in this group will receive it individually.'
                    : 'Type a message'
                  : 'Choose a chat first'
              }
              placeholderTextColor="#94A3B8"
              value={draft}
              onChangeText={setDraft}
              multiline
              onFocus={() => setPadding(10)}
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
              {isSendingAny ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#EEF2FF',
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
  messageList: {
    flexGrow: 1,
    padding: 14,
    gap: 8,
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
    // elevation: 8,
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
});
