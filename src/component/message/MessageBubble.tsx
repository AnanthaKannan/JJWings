import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { ChatMessage } from '../../store/api';
import { getFileUrl } from '../../util/fileUrl';

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

const MessageBubble = ({
  item,
  currentUserId,
  playingMessageId,
  deletingMessageId,
  onPlayVoice,
  onDelete,
}: {
  item: ChatMessage;
  currentUserId: string;
  playingMessageId?: string | null;
  deletingMessageId?: string | null;
  onPlayVoice?: (item: ChatMessage) => void;
  onDelete?: (item: ChatMessage) => void;
}) => {
  const isMine = item.sendBy.id === currentUserId;
  const voiceUrl = getFileUrl(item.voiceUrl);
  const isVoice = voiceUrl.length > 0;
  const isPlaying = playingMessageId === item.id;
  const isDeleting = deletingMessageId === item.id;
  const durationLabel =
    typeof item.voiceDuration === 'number' && item.voiceDuration > 0
      ? `${Math.max(1, Math.round(item.voiceDuration / 1000))}s`
      : 'Voice';

  return (
    <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
      <View
        style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}
      >
        {isVoice ? (
          <TouchableOpacity
            style={styles.voiceRow}
            onPress={() => onPlayVoice?.(item)}
            disabled={!onPlayVoice}
            activeOpacity={0.75}
          >
            <View style={[styles.voiceIcon, isMine && styles.myVoiceIcon]}>
              <MaterialIcons
                name={isPlaying ? 'stop' : 'play-arrow'}
                size={19}
                color={isMine ? '#4F46E5' : '#FFFFFF'}
              />
            </View>
            <View style={styles.voiceTextWrap}>
              <Text style={[styles.voiceTitle, isMine && styles.myMessageText]}>
                {durationLabel}
              </Text>
              {item.message ? (
                <Text
                  style={[
                    styles.messageText,
                    styles.voiceCaption,
                    isMine && styles.myMessageText,
                  ]}
                >
                  {item.message}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {item.message}
          </Text>
        )}
        <View style={styles.metaRow}>
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {formatMessageTime(item.createdAt)}
          </Text>
          {isMine && onDelete ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(item)}
              disabled={isDeleting}
              hitSlop={8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#C7D2FE" />
              ) : (
                <MaterialIcons
                  name="delete-outline"
                  size={15}
                  color="#C7D2FE"
                />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
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
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  myMessageTime: {
    color: '#C7D2FE',
  },
  metaRow: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  deleteButton: {
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  voiceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 130,
  },
  voiceIcon: {
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 9,
    width: 32,
  },
  myVoiceIcon: {
    backgroundColor: '#FFFFFF',
  },
  voiceTextWrap: {
    flex: 1,
  },
  voiceTitle: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
  },
  voiceCaption: {
    marginTop: 2,
  },
});
