import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Animated,
  PanResponder,
  PanResponderGestureState,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItem,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';

import { Comment } from '../types';
import Avatar from './Avatar';
import LoadingState from './LoadingState';
import PostOptionsMenu from './PostOptionsMenu';
import { RootState } from '../store/store';
import { setModal, resetModal } from '../store/slices';
import { useDeleteCommentMutation } from '../store/api';
import LoadingOverlay from './LoadingOverlay';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const HALF_HEIGHT = SCREEN_HEIGHT * 0.5;
const FULL_HEIGHT = SCREEN_HEIGHT * 0.92;
const CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 0.8;
const EXPAND_THRESHOLD = 60;
const MAX_COMMENT_LENGTH = 1000;

export interface CommentBottomSheetProps {
  visible: boolean;
  comments: Comment[] | undefined;
  onClose: () => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  /** Called with the typed text when the user taps send. Should resolve once the comment is posted. */
  onSubmitComment: (text: string) => Promise<void> | void;
  /** Current user's avatar shown next to the input box */
  currentUserAvatar?: string;
  commentLoading: boolean;
}

const formatRelativeTime = (isoDate: string): string => {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = Math.max(now - then, 0);

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return `${weeks}w`;
};

const CommentRow: React.FC<{
  item: Comment;
  userId: string;
  onDelete: (commentId: string, content: string) => void;
}> = ({ item, userId, onDelete }) => (
  <View style={styles.commentRow}>
    <Avatar
      name={item.userDetail.name}
      profilePic={item.userDetail.profilePicPath}
    />
    <View style={styles.commentBody}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.userName}>
          {item.userDetail.name}
          <Text style={styles.timeText}>
            · {formatRelativeTime(item.createdAt)}
          </Text>
        </Text>
        {item.userDetail._id === userId && (
          <PostOptionsMenu
            icon="more-horiz"
            onDelete={() => onDelete(item._id, item.content)}
          />
        )}
      </View>

      <Text style={styles.commentText}>{item.content}</Text>
      {!item.approved && (
        <Text style={[styles.timeText, { marginTop: 5 }]}>
          Once approved by admin, it will be visible to everyone.
        </Text>
      )}
    </View>
  </View>
);

const CommentBottomSheet: React.FC<CommentBottomSheetProps> = ({
  visible,
  comments,
  onClose,
  onEndReached,
  loadingMore = false,
  onSubmitComment,
  currentUserAvatar,
  commentLoading,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const currentHeight = useRef(HALF_HEIGHT);
  const [sheetHeight, setSheetHeight] = useState(HALF_HEIGHT);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { studentId, adminId } = useSelector(
    (state: RootState) => state.common,
  );

  const isOverLimit = inputText.length > MAX_COMMENT_LENGTH;
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();
  const dispatch = useDispatch();

  // tracks whether the FlatList is scrolled to the very top — only then
  // should a downward drag over the list be handed to the sheet instead of
  // being consumed as a normal scroll
  const listScrollOffset = useRef(0);

  const openToHeight = useCallback(
    (height: number) => {
      currentHeight.current = height;
      setSheetHeight(height);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    },
    [translateY],
  );

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      openToHeight(HALF_HEIGHT);
    }
  }, [visible, openToHeight, translateY]);

  const handleGestureMove = (gesture: PanResponderGestureState) => {
    if (gesture.dy > 0) {
      translateY.setValue(gesture.dy);
    } else if (currentHeight.current === HALF_HEIGHT) {
      const drag = Math.max(gesture.dy, -(FULL_HEIGHT - HALF_HEIGHT));
      translateY.setValue(drag);
    }
  };

  const HandleGestureRelease = (gesture: PanResponderGestureState) => {
    const draggedDown = gesture.dy;
    const draggedUp = -gesture.dy;
    const fastFlickDown = gesture.vy > VELOCITY_THRESHOLD;
    const fastFlickUp = gesture.vy < -VELOCITY_THRESHOLD;

    if (draggedDown > CLOSE_THRESHOLD || fastFlickDown) {
      closeSheet();
      return;
    }

    if (
      currentHeight.current === HALF_HEIGHT &&
      (draggedUp > EXPAND_THRESHOLD || fastFlickUp)
    ) {
      openToHeight(FULL_HEIGHT);
      return;
    }

    if (
      currentHeight.current === FULL_HEIGHT &&
      draggedDown > 40 &&
      !fastFlickUp
    ) {
      openToHeight(HALF_HEIGHT);
      return;
    }

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  // primary drag zone: handle + header — claims the gesture immediately,
  // no minimum movement required, so it feels responsive right away
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => handleGestureMove(gesture),
      onPanResponderRelease: (_, gesture) => HandleGestureRelease(gesture),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // secondary drag zone: the list area itself — only takes over from the
  // list's native scrolling when dragging down while already at the top
  // of the list (to collapse/close), or dragging up while at half height
  // (to expand) — otherwise the list scrolls normally
  const listPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        const isVertical =
          Math.abs(gesture.dy) > 10 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5;
        if (!isVertical) return false;

        const draggingDown = gesture.dy > 0;
        const draggingUp = gesture.dy < 0;

        if (draggingDown && listScrollOffset.current <= 0) return true;
        if (draggingUp && currentHeight.current === HALF_HEIGHT) return true;
        return false;
      },
      onPanResponderMove: (_, gesture) => handleGestureMove(gesture),
      onPanResponderRelease: (_, gesture) => HandleGestureRelease(gesture),
    }),
  ).current;

  const handleSend = async () => {
    const trimmed = inputText.trim();

    if (!trimmed) return;
    if (trimmed.length > MAX_COMMENT_LENGTH) return;

    setIsSubmitting(true);
    try {
      await onSubmitComment(trimmed);
      setInputText('');
    } catch {
      Alert.alert('Comment Failed', 'Fail to add comment. try later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string, content: string) => {
    dispatch(
      setModal({
        state: 'confirm',
        visible: true,
        title: 'Are you sure?',
        description: `Do you want to delete this comment? \n *${content}*`,
        onCancel: () => {
          dispatch(resetModal());
        },
        onConfirm: async () => {
          try {
            await deleteComment({ commentId }).unwrap();
            dispatch(
              setModal({
                state: 'success',
                visible: true,
                title: 'Comment Deleted',
                description: 'Comment has been deleted successfully.',
                onDone: () => {
                  dispatch(resetModal());
                },
              }),
            );
          } catch {
            dispatch(
              setModal({
                state: 'failure',
                visible: true,
                title: 'Failed to Delete Comment',
                description:
                  'Something went wrong while deleting the comment. Please try again later.',
                onDone: () => {
                  dispatch(resetModal());
                },
              }),
            );
          }
        },
      }),
    );
  };

  const renderItem: ListRenderItem<Comment> = ({ item }) => (
    <CommentRow
      item={item}
      userId={studentId || adminId}
      onDelete={handleDeleteComment}
    />
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    listScrollOffset.current = e.nativeEvent.contentOffset.y;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...headerPanResponder.panHandlers}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Comments</Text>
            </View>
          </View>

          <View style={styles.listWrapper} {...listPanResponder.panHandlers}>
            <FlatList
              data={comments}
              keyExtractor={item => item._id}
              renderItem={renderItem}
              contentContainerStyle={[
                styles.listContent,
                comments?.length === 0 && styles.listContentEmpty,
              ]}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onEndReachedThreshold={0.4}
              onEndReached={onEndReached}
              ListEmptyComponent={
                commentLoading ? (
                  <LoadingState label="Loading comment..." />
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialIcons
                      name="chat-bubble-outline"
                      size={40}
                      color="#c4c7cc"
                    />
                    <Text style={styles.emptyStateText}>No comments yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Be the first to comment
                    </Text>
                  </View>
                )
              }
              ListFooterComponent={
                loadingMore ? (
                  <Text style={styles.loadingMoreText}>Loading more…</Text>
                ) : null
              }
            />
          </View>

          <LoadingOverlay visible={isDeleting} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {isOverLimit ? (
              <Text style={styles.errorText}>
                Comment is too long ({inputText.length}/{MAX_COMMENT_LENGTH})
              </Text>
            ) : null}
            <View style={styles.inputBar}>
              {currentUserAvatar ? (
                <Image
                  source={{ uri: currentUserAvatar }}
                  style={styles.inputAvatar}
                />
              ) : null}
              <View
                style={[
                  styles.inputWrapper,
                  isOverLimit && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#8a8d91"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() || isOverLimit || isSubmitting}
                hitSlop={8}
                style={styles.sendButton}
              >
                <MaterialIcons
                  name="send"
                  size={22}
                  color={
                    inputText.trim() && !isOverLimit ? '#1877F2' : '#c4c7cc'
                  }
                />
              </TouchableOpacity>
            </View>
            <View>
              <Text style={styles.commentVisibleText}>
                Your comment will be published once it is approved by the admin.
              </Text>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d0d3d9',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: '#050505',
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentBody: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#050505',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#65676b',
  },
  commentText: {
    fontSize: 14,
    color: '#050505',
    marginTop: 2,
    lineHeight: 19,
  },
  loadingMoreText: {
    textAlign: 'center',
    color: '#65676b',
    fontSize: 13,
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#65676b',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#8a8d91',
    marginTop: 4,
  },
  errorText: {
    color: '#e0245e',
    fontSize: 12,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  commentVisibleText: {
    fontSize: 12,
    paddingHorizontal: 14,
    paddingBottom: 4,
    color: '#8a8d91',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    backgroundColor: '#fff',
  },
  inputAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#e4e6eb',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    maxHeight: 100,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: '#e0245e',
  },
  textInput: {
    fontSize: 14,
    color: '#050505',
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
    maxHeight: 90,
  },
  sendButton: {
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
});

export default CommentBottomSheet;
