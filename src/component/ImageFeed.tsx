import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { useSelector } from 'react-redux';

import Avatar from './Avatar';
import PostActionsBar from './PostActionsBar';
import { Feed } from '../types';
import { getFileUrl } from '../util/fileUrl';
import { formatFeedDate } from '../util/fn';
import PostOptionsMenu from './PostOptionsMenu';
import { RootState } from '../store/store';
import { CommentBottomSheet } from '../component';
import {
  useDeleteFeedMutation,
  useToggleLikeMutation,
  useLazyGetParentCommentQuery,
  useCreateCommentMutation,
} from '../store/api';

export interface ImageFeedProps {
  images: Feed[];
  onLoadMore?: () => Promise<Feed[]>;
  aspectRatio?: number;
  refreshing: boolean;
  onRefresh: () => void;
}

const FeedImageItem: React.FC<{
  item: Feed;
  aspectRatio: number;
  onCommentPress: (feedId: string) => void;
}> = ({ item, aspectRatio, onCommentPress }) => {
  const [loaded, setLoaded] = useState(false);
  const { adminRoles, adminId } = useSelector(
    (state: RootState) => state.common,
  );
  const [deleteFeed, { isLoading: isDeleting }] = useDeleteFeedMutation();
  const [toggleLike] = useToggleLikeMutation();
  const handleDelete = async (feedId: string) => {
    try {
      await deleteFeed({ feedId }).unwrap();
    } catch (error) {
      console.error('Failed to delete feed', error);
      Alert.alert('Delete failed', 'Please try deleting the feed again.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headContainer}>
        <View style={styles.profile}>
          <Avatar
            color="#9b85f1"
            name={item.adminName}
            profilePic={item.adminPicPath}
          />
          <View>
            <Text style={styles.name}>{item.adminName} </Text>
            <Text style={styles.dateTime}>
              {formatFeedDate(item.createdAt)}
            </Text>
          </View>
        </View>
        {(adminRoles.includes('superadmin') || adminId === item.createdBy) && (
          <PostOptionsMenu
            // isPrivate={item.isPrivate}
            onDelete={() => handleDelete(item._id)}
            // onTogglePrivate={() => {}}
          />
        )}
      </View>

      {!!item.content && <Text style={styles.content}>{item.content}</Text>}
      {item.filePath && (
        <View style={[styles.imageBox, { aspectRatio }]}>
          {(!loaded || isDeleting) && (
            <View style={styles.placeholder}>
              <ActivityIndicator size="small" color="#8a8d91" />
            </View>
          )}

          <Image
            source={{ uri: getFileUrl(item.filePath) }}
            style={styles.image}
            resizeMode="cover"
            onLoadEnd={() => setLoaded(true)}
          />
        </View>
      )}

      <PostActionsBar
        likeCount={item.likeCount}
        commentCount={item.commentCount}
        reactions={{ count: 13, types: ['like', 'love'] }}
        onLikePress={async () => {
          await toggleLike({ feedId: item._id }).unwrap();
          return true;
        }}
        onCommentPress={() => onCommentPress(item._id)}
        liked={item.isLikedByMe}
      />
    </View>
  );
};

const ImageFeed: React.FC<ImageFeedProps> = ({
  images,
  onLoadMore,
  refreshing,
  onRefresh,
  aspectRatio = 1,
}) => {
  const [data, setData] = useState<Feed[]>(images);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<string>('');
  const [commentSheetVisible, setCommentSheetVisible] = useState(false);
  const [
    getComment,
    {
      data: comments,
      isLoading: isCommentLoading,
      isFetching: isCommentFetching,
    },
  ] = useLazyGetParentCommentQuery();
  const [createComment, { isLoading: isCommentCreating }] =
    useCreateCommentMutation();
  useEffect(() => {
    setData(images);
    setExhausted(false);
  }, [images]);

  const handleEndReached = useCallback(async () => {
    if (!onLoadMore || loadingMore || exhausted) return;
    setLoadingMore(true);
    try {
      const next = await onLoadMore();
      if (next.length === 0) {
        setExhausted(true);
      } else {
        setData(prev => [...prev, ...next]);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [onLoadMore, loadingMore, exhausted]);

  const onHandleComment = useCallback(
    (feedId: string) => {
      setCommentSheetVisible(true);
      getComment({ feedId });
      setSelectedFeedId(feedId);
    },
    [getComment],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Feed>) => (
      <FeedImageItem
        item={item}
        aspectRatio={aspectRatio}
        onCommentPress={(feedId: string) => onHandleComment(feedId)}
      />
    ),
    [aspectRatio, onHandleComment],
  );

  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        // Loads/renders items progressively rather than all at once
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
            progressBackgroundColor="#EEF2FF"
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#8a8d91" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      <CommentBottomSheet
        visible={commentSheetVisible}
        onSubmitComment={async content => {
          await createComment({
            feedId: selectedFeedId,
            content,
          });
        }}
        comments={comments}
        onClose={() => setCommentSheetVisible(false)}
        onEndReached={() => {}}
        loadingMore={false}
        commentLoading={
          isCommentLoading || isCommentFetching || isCommentCreating
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  card: {
    marginHorizontal: 5,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e6eb',
    overflow: 'hidden',
    // subtle FB-card elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  name: {
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 15,
    color: '#050505',
  },
  dateTime: {
    marginLeft: 10,
    fontSize: 10,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: 20,
    color: '#050505',
  },
  imageBox: {
    width: '100%',
    backgroundColor: '#e4e6eb',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e4e6eb',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingVertical: 20,
  },
  headContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default ImageFeed;
