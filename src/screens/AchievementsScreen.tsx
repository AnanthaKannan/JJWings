import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

import {
  AdminHeader,
  LoadingOverlay,
  StudentHeader,
  ImageFeed,
  FloatingAddButton,
  CreatePostScreen,
} from '../component';
import {
  Achievement,
  useDeleteAchievementMutation,
  useGetFeedListQuery,
} from '../store/api';
import { RootState } from '../store/store';

const { width: screenWidth } = Dimensions.get('window');
const carouselWidth = Math.max(screenWidth - 32, 280);

export default function AchievementsScreen() {
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const [creatingPost, setCreatingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: feedList = [],
    isLoading,
    isFetching,
    // refetch,
  } = useGetFeedListQuery();

  const [deleteAchievement, deleteResult] = useDeleteAchievementMutation();
  const isBusy = isLoading || deleteResult.isLoading;

  // const onRefresh = useCallback(async () => {
  //   setRefreshing(true);
  //   try {
  //     await refetch();
  //   } finally {
  //     setRefreshing(false);
  //   }
  // }, [refetch]);

  const handleDelete = (item: Achievement) => {
    Alert.alert('Delete achievement image?', 'This image will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAchievement(item.id).unwrap();
          } catch (error) {
            console.error('Failed to delete achievement image', error);
            Alert.alert(
              'Delete failed',
              'Please try deleting the achievement image again.',
            );
          }
        },
      },
    ]);
  };

  const header = isAdmin ? (
    <AdminHeader header="Feeds" />
  ) : (
    <StudentHeader header="Feeds" headerBackgroundColor="#EEF2FF" />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      {header}

      <View style={styles.content}>
        <ImageFeed
          images={feedList}
          aspectRatio={1080 / 1350}
          // onLoadMore={async () => {
          //   // fetch next page from your API here
          //   return [
          //     { id: '4', url: 'https://picsum.photos/id/1020/1080/1350' },
          //   ];
          // }}
        />

        <Modal
          visible={creatingPost}
          animationType="fade"
          onRequestClose={() => setCreatingPost(false)}
        >
          <CreatePostScreen
            userName="Sree Kannan"
            onClose={() => setCreatingPost(false)}
            // onPosted={() => setCreatingPost(false)}
          />
        </Modal>

        {isAdmin && <FloatingAddButton onPress={() => setCreatingPost(true)} />}
      </View>

      <LoadingOverlay visible={isBusy} label="Updating Feeds..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  uploadButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  carouselCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  carouselList: {
    flex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  slide: {
    width: carouselWidth,
    height: '100%',
    padding: 12,
  },
  achievementImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  deleteButton: {
    position: 'absolute',
    top: 22,
    right: 22,
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    width: 18,
    backgroundColor: '#4F46E5',
  },
  emptyState: {
    width: carouselWidth,
    flex: 1,
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
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
});
