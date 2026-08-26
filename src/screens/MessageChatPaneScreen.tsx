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
  PermissionsAndroid,
  AppState,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
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
  useDeleteMessageMutation,
  useUploadVoiceMessageMutation,
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
import { getFileUrl } from '../util/fileUrl';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const recordingTimeRef = useRef(0);

  const canSend = draft.trim().length > 0 && Boolean(activeParticipant?.id);
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [sendGroupMessage, { isLoading: isSendingGroup }] =
    useSendGroupMessageMutation();
  const [readMessages] = useReadMessagesMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [uploadVoiceMessage, { isLoading: isUploadingVoice }] =
    useUploadVoiceMessageMutation();

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
      voiceUrl: message.voiceUrl ?? message.voicePath,
      voiceDuration: message.voiceDuration,
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

  const isSendingAny =
    isSending || isSendingGroup || isFetchingMessage || isUploadingVoice;

  useEffect(() => {
    return () => {
      AudioRecorderPlayer.removeRecordBackListener();
      AudioRecorderPlayer.removePlayBackListener();
      AudioRecorderPlayer.removePlaybackEndListener();
      AudioRecorderPlayer.stopPlayer().catch(() => undefined);
      AudioRecorderPlayer.stopRecorder().catch(() => undefined);
    };
  }, []);

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
    if (!message || !activeParticipant?.id || isSendingAny || isRecording) {
      return;
    }
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

  const requestRecordPermission = async () => {
    if (Platform.OS !== 'android') return true;
    if (AppState.currentState !== 'active') return false;

    try {
      const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
      const alreadyGranted = await PermissionsAndroid.check(permission);

      if (alreadyGranted) return true;

      const result = await PermissionsAndroid.request(permission, {
        title: 'Microphone permission',
        message: 'JJWings needs microphone access to record voice messages.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      });

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Failed to request microphone permission', error);
      return false;
    }
  };

  const sendVoiceMessage = async (uri: string, duration: number) => {
    if (!activeParticipant?.id) return;

    const extension = Platform.OS === 'ios' ? 'm4a' : 'mp4';
    const voiceUrl = await uploadVoiceMessage({
      uri,
      name: `voice-message-${Date.now()}.${extension}`,
      mimeType: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
    }).unwrap();

    if (!voiceUrl) {
      throw new Error('Voice upload failed');
    }

    const message = draft.trim();
    setDraft('');

    if (isGroupChat) {
      await sendGroupMessage({
        groupId: activeParticipant.id,
        message: message || undefined,
        voiceUrl,
        voiceDuration: duration,
      }).unwrap();
    } else {
      await sendMessage({
        receivedTo: activeParticipant.id,
        message: message || undefined,
        voiceUrl,
        voiceDuration: duration,
      }).unwrap();
    }
  };

  const handleStartRecording = async () => {
    if (!activeParticipant?.id || isSendingAny || isRecording) return;

    try {
      const hasPermission = await requestRecordPermission();
      if (!hasPermission) {
        Alert.alert(
          'Microphone blocked',
          'Please allow microphone access to record voice messages.',
        );
        return;
      }

      await AudioRecorderPlayer.stopPlayer().catch(() => undefined);
      AudioRecorderPlayer.removePlayBackListener();
      AudioRecorderPlayer.removePlaybackEndListener();
      setPlayingMessageId(null);
      recordingTimeRef.current = 0;
      setRecordingTime(0);
      AudioRecorderPlayer.setSubscriptionDuration(0.2);
      AudioRecorderPlayer.addRecordBackListener(recording => {
        const position = recording.currentPosition ?? 0;
        recordingTimeRef.current = position;
        setRecordingTime(position);
      });
      await AudioRecorderPlayer.startRecorder();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start voice recording', error);
      Alert.alert('Recording failed', 'Please try recording again.');
    }
  };

  const handleStopRecording = async (shouldSend = true) => {
    if (!isRecording) return;

    try {
      const uri = await AudioRecorderPlayer.stopRecorder();
      AudioRecorderPlayer.removeRecordBackListener();
      const duration = recordingTimeRef.current;
      setIsRecording(false);
      setRecordingTime(0);

      if (!shouldSend) return;

      if (duration < 800) {
        Alert.alert('Too short', 'Hold a little longer before sending.');
        return;
      }

      await sendVoiceMessage(uri, duration);
    } catch (error) {
      console.error('Failed to send voice message', error);
      Alert.alert('Voice message not sent', 'Please try again.');
    }
  };

  const handlePlayVoice = async (item: ChatMessage) => {
    const voiceUrl = getFileUrl(item.voiceUrl);
    if (!voiceUrl) return;

    try {
      if (playingMessageId === item.id) {
        await AudioRecorderPlayer.stopPlayer();
        AudioRecorderPlayer.removePlayBackListener();
        AudioRecorderPlayer.removePlaybackEndListener();
        setPlayingMessageId(null);
        return;
      }

      await AudioRecorderPlayer.stopPlayer().catch(() => undefined);
      AudioRecorderPlayer.removePlayBackListener();
      AudioRecorderPlayer.removePlaybackEndListener();
      setPlayingMessageId(item.id);
      AudioRecorderPlayer.addPlaybackEndListener(() => {
        AudioRecorderPlayer.removePlaybackEndListener();
        AudioRecorderPlayer.removePlayBackListener();
        setPlayingMessageId(null);
      });
      await AudioRecorderPlayer.startPlayer(voiceUrl);
    } catch (error) {
      console.error('Failed to play voice message', error);
      setPlayingMessageId(null);
      Alert.alert(
        'Playback failed',
        'Please try playing this voice message again.',
      );
    }
  };

  const deleteSelectedMessage = async (item: ChatMessage) => {
    setDeletingMessageId(item.id);
    try {
      await deleteMessage({
        messageId: item.id,
        groupId: isGroupChat ? activeParticipant?.id : undefined,
      }).unwrap();
    } catch (error) {
      console.error('Failed to delete message', error);
      Alert.alert('Unable to delete', 'Please try again.');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleDeleteMessage = (item: ChatMessage) => {
    Alert.alert(
      'Delete message?',
      'This message will be removed from the chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSelectedMessage(item),
        },
      ],
    );
  };

  const navigateToMessages = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoider}
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
              <MessageBubble
                item={item}
                currentUserId={currentUserId}
                playingMessageId={playingMessageId}
                deletingMessageId={deletingMessageId}
                onPlayVoice={handlePlayVoice}
                onDelete={handleDeleteMessage}
              />
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
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
                (!activeParticipant?.id || isSendingAny) &&
                  styles.composerButtonDisabled,
              ]}
              onPress={
                isRecording
                  ? () => handleStopRecording(true)
                  : handleStartRecording
              }
              disabled={!activeParticipant?.id || isSendingAny}
              activeOpacity={0.82}
            >
              {isUploadingVoice ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <MaterialIcons
                  name={isRecording ? 'stop' : 'keyboard-voice'}
                  size={21}
                  color={isRecording ? '#FFFFFF' : '#4F46E5'}
                />
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.composerInput}
              placeholder={
                isRecording
                  ? `Recording ${Math.max(
                      1,
                      Math.round(recordingTime / 1000),
                    )}s`
                  : activeParticipant?.id
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
              editable={
                Boolean(activeParticipant?.id) && !isSendingAny && !isRecording
              }
            />
            {isRecording ? (
              <TouchableOpacity
                style={styles.cancelRecordButton}
                onPress={() => handleStopRecording(false)}
                activeOpacity={0.82}
              >
                <MaterialIcons name="close" size={20} color="#B91C1C" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!canSend || isSendingAny || isRecording) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!canSend || isSendingAny || isRecording}
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
  keyboardAvoider: {
    flex: 1,
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
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  micButtonRecording: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  composerButtonDisabled: {
    opacity: 0.48,
  },
  cancelRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
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
