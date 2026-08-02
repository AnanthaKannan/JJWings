import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface ReactionSummary {
  /** Total number of likes/reactions shown next to the badges */
  count: number;
  /**
   * Which reaction badges to show, in stacking order (first item is on top).
   * Extend this union as you add more reaction types.
   */
  types: Array<'like' | 'love'>;
}

export interface PostActionsBarProps {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  /** Top-right reaction summary (the small overlapping circles + count) */
  reactions?: ReactionSummary;
  /** Whether the current user has already liked the post — tints the Like label/icon */
  liked?: boolean;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onSharePress?: () => void;
}

const PostActionsBar: React.FC<PostActionsBarProps> = ({
  likeCount,
  commentCount,
  liked = false,
  onLikePress,
  onCommentPress,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLikePress}
          hitSlop={8}
        >
          <MaterialIcons
            name={liked ? 'thumb-up' : 'thumb-up-off-alt'}
            size={20}
            color={liked ? '#1877F2' : '#65676b'}
          />
          <Text style={[styles.actionText, liked && styles.actionTextActive]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCommentPress}
          hitSlop={8}
        >
          <MaterialIcons name="chat-bubble-outline" size={20} color="#65676b" />
          <Text style={styles.actionText}>{commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderTopColor: '#f0f2f5',
    borderTopWidth: 1,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  badgeStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  reactionsCount: {
    marginLeft: 6,
    fontSize: 13,
    color: '#65676b',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#65676b',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#1877F2',
  },
  shareIcon: {
    transform: [{ scaleX: -1 }],
  },
});

export default PostActionsBar;
