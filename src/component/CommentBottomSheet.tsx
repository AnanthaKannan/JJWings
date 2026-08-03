import React, { useRef, useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItem,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const HALF_HEIGHT = SCREEN_HEIGHT * 0.5;
const FULL_HEIGHT = SCREEN_HEIGHT * 0.92;
const CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 0.8;
const EXPAND_THRESHOLD = 60;

export interface CommentItem {
  id: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface CommentBottomSheetProps {
  visible: boolean;
  comments: CommentItem[];
  onClose: () => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  onSubmitComment: (text: string) => Promise<void> | void;
  currentUserAvatar?: string;
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

const CommentRow: React.FC<{ item: CommentItem }> = ({ item }) => (
  <View style={styles.commentRow}>
    <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
    <View style={styles.commentBody}>
      <Text style={styles.userName}>
        {item.userName}
        <Text style={styles.timeText}>
          {' '}
          · {formatRelativeTime(item.createdAt)}
        </Text>
      </Text>
      <Text style={styles.commentText}>{item.content}</Text>
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
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const currentHeight = useRef(HALF_HEIGHT);
  const [sheetHeight, setSheetHeight] = useState(HALF_HEIGHT);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // tracks whether the FlatList is scrolled to the very top — only then
  // should a downward drag over the list be handed to the sheet instead of
  // being consumed as a normal scroll
  const listScrollOffset = useRef(0);

  const openToHeight = (height: number) => {
    currentHeight.current = height;
    setSheetHeight(height);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

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
  }, [visible]);

  const handleGestureMove = (gesture: PanResponderGestureState) => {
    if (gesture.dy > 0) {
      translateY.setValue(gesture.dy);
    } else if (currentHeight.current === HALF_HEIGHT) {
      const drag = Math.max(gesture.dy, -(FULL_HEIGHT - HALF_HEIGHT));
      translateY.setValue(drag);
    }
  };

  const handleGestureRelease = (gesture: PanResponderGestureState) => {
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
      onPanResponderRelease: (_, gesture) => handleGestureRelease(gesture),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // secondary drag zone: the list area itself — only takes over from the
  // list's native scrolling when the drag is clearly vertical AND
  // (dragging up, to expand) OR (dragging down while already at the top
  // of the list, to collapse/close) — otherwise the list scrolls normally
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
      onPanResponderRelease: (_, gesture) => handleGestureRelease(gesture),
    }),
  ).current;

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitComment(trimmed);
      setInputText('');
    } catch (err) {
      // keep the text so the user doesn't lose what they typed
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem: ListRenderItem<CommentItem> = ({ item }) => (
    <CommentRow item={item} />
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
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onEndReachedThreshold={0.4}
              onEndReached={onEndReached}
              ListFooterComponent={
                loadingMore ? (
                  <Text style={styles.loadingMoreText}>Loading more…</Text>
                ) : null
              }
            />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.inputBar}>
              {currentUserAvatar ? (
                <Image
                  source={{ uri: currentUserAvatar }}
                  style={styles.inputAvatar}
                />
              ) : null}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#8a8d91"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() || isSubmitting}
                hitSlop={8}
                style={styles.sendButton}
              >
                <MaterialIcons
                  name="send"
                  size={22}
                  color={inputText.trim() ? '#1877F2' : '#c4c7cc'}
                />
              </TouchableOpacity>
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
  commentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#e4e6eb',
  },
  commentBody: {
    flex: 1,
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
