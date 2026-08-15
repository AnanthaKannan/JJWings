import React, { Dispatch, RefObject, SetStateAction } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { ChatMessage, MessageParticipant } from '../../store/api';
import Avatar from '../Avatar';
import LoadingState from '../LoadingState';
import MessageBubble from './MessageBubble';

type MessageChatPaneProps = {
  listRef: RefObject<FlatList<ChatMessage> | null>;
  composerRef: RefObject<View | null>;
  messages: ChatMessage[];
  currentUserId: string;
  activeParticipant?: MessageParticipant;
  isAdmin: boolean;
  isStudent: boolean;
  isGroupChat: boolean;
  isLoadingMessage: boolean;
  isFetchingMessage: boolean;
  refreshing: boolean;
  draft: string;
  canSend: boolean;
  isSending: boolean;
  composerBottomPadding: number;
  composerKeyboardOffset: number;
  keyboardVisible: boolean;
  keyboardTopRef: RefObject<number | null>;
  setDraft: Dispatch<SetStateAction<string>>;
  onBack: () => void;
  onSend: () => void;
  onRefresh: () => void;
  onScrollToBottom: (animated?: boolean) => void;
  onResetKeyboardCorrection: () => void;
  onUpdateComposerKeyboardOffset: (keyboardTop: number) => void;
  topInset: number;
};

export default function MessageChatPane({
  listRef,
  composerRef,
  messages,
  currentUserId,
  activeParticipant,
  isAdmin,
  isStudent,
  isGroupChat,
  isLoadingMessage,
  isFetchingMessage,
  refreshing,
  draft,
  canSend,
  isSending,
  composerBottomPadding,
  composerKeyboardOffset,
  keyboardVisible,
  keyboardTopRef,
  setDraft,
  onBack,
  onSend,
  onRefresh,
  onScrollToBottom,
  onResetKeyboardCorrection,
  onUpdateComposerKeyboardOffset,
  topInset,
}: MessageChatPaneProps) {
  return (
    <View style={styles.content}>
      <View style={styles.chatPane}>
        <View
          style={[
            styles.chatHeader,
            Platform.OS === 'android' && {
              paddingTop: topInset,
              minHeight: 62 + topInset,
            },
          ]}
        >
          {isAdmin || isStudent ? (
            <TouchableOpacity
              style={styles.chatBackButton}
              onPress={onBack}
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
          data={messages}
          inverted
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageBubble item={item} currentUserId={currentUserId} />
          )}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => onScrollToBottom(false)}
          onLayout={() => onScrollToBottom(false)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
            />
          }
          ListEmptyComponent={
            (isLoadingMessage || isFetchingMessage) && !isGroupChat ? (
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

        <View
          ref={composerRef}
          onLayout={() => {
            if (
              Platform.OS === 'android' &&
              keyboardVisible &&
              keyboardTopRef.current
            ) {
              onUpdateComposerKeyboardOffset(keyboardTopRef.current);
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
              onResetKeyboardCorrection();
              setTimeout(() => onScrollToBottom(true), 300);
            }}
            onBlur={onResetKeyboardCorrection}
            multiline
            blurOnSubmit={false}
            editable={Boolean(activeParticipant?.id) && !isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!canSend || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={onSend}
            disabled={!canSend || isSending}
            activeOpacity={0.82}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
