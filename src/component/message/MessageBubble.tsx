import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChatMessage } from '../../store/api';

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
    alignSelf: 'flex-end',
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  myMessageTime: {
    color: '#C7D2FE',
  },
});
