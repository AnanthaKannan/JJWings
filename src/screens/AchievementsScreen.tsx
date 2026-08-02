import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import {
  AdminHeader,
  LoadingOverlay,
  LoadingState,
  StudentHeader,
  ImageFeed,
  FloatingAddButton,
  CreatePostScreen,
} from '../component';
import {
  Achievement,
  useDeleteAchievementMutation,
  useGetAchievementsQuery,
  useUploadAchievementMutation,
  useGetFeedListQuery,
} from '../store/api';
import { IMAGE_UPLOAD_LIMITS } from '../config/imageUpload';
import { RootState } from '../store/store';
import { getFileUrl } from '../util/fileUrl';
import { formatUploadLimit } from '../util/formatUploadLimit';
import { compressAchievementImage } from '../util/profileImage';

const { width: screenWidth } = Dimensions.get('window');
const carouselWidth = Math.max(screenWidth - 32, 280);

const getAchievementImageUrl = (item: Achievement) =>
  getFileUrl(item.url ?? item.path) ?? item.url ?? item.path ?? '';

export default function AchievementsScreen() {
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const [creatingPost, setCreatingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    data: achievements = [],
    // isLoading,
    // isFetching,
    refetch,
  } = useGetAchievementsQuery();

  const {
    data: feedList = [],
    isLoading,
    isFetching,
    // refetch,
  } = useGetFeedListQuery();

  const [uploadAchievement, uploadResult] = useUploadAchievementMutation();
  const [deleteAchievement, deleteResult] = useDeleteAchievementMutation();
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const isBusy =
    isPreparingImage || uploadResult.isLoading || deleteResult.isLoading;
  const showLoader = isLoading && achievements.length === 0;

  const visibleAchievements = useMemo(
    () => achievements.filter(item => getAchievementImageUrl(item).length > 0),
    [achievements],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const nextIndex = viewableItems[0]?.index;
      if (typeof nextIndex === 'number') {
        setActiveIndex(nextIndex);
      }
    },
  ).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleUpload = async () => {
    try {
      const [file] = await pick({
        allowMultiSelection: false,
        type: [types.images],
      });

      if (!file?.uri) {
        Alert.alert('No image selected', 'Please choose an image to upload.');
        return;
      }

      setIsPreparingImage(true);
      const compressedImage = await compressAchievementImage({
        uri: file.uri,
        fileName: file.name ?? undefined,
      });

      await uploadAchievement({
        file: {
          uri: compressedImage.uri,
          type: compressedImage.type,
          name: compressedImage.name,
        },
      }).unwrap();

      Alert.alert('Uploaded', 'Achievement image uploaded successfully.');
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }

      console.error('Failed to upload achievement image', error);
      Alert.alert(
        'Upload failed',
        error instanceof Error &&
          error.message === 'ACHIEVEMENT_IMAGE_TOO_LARGE'
          ? `Please choose a smaller image. Achievement images must be under ${formatUploadLimit(
              IMAGE_UPLOAD_LIMITS.achievementMaxBytes,
            )}.`
          : 'Please try uploading the achievement image again.',
      );
    } finally {
      setIsPreparingImage(false);
    }
  };

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
            onPosted={() => setCreatingPost(false)}
          />
        </Modal>

        {isAdmin && <FloatingAddButton onPress={() => setCreatingPost(true)} />}

        {/* <View style={styles.carouselCard}>
          {showLoader ? (
            <LoadingState label="Loading achievements..." />
          ) : (
            <FlatList
              data={visibleAchievements}
              keyExtractor={item => item.id}
              style={styles.carouselList}
              contentContainerStyle={
                visibleAchievements.length === 0
                  ? styles.emptyListContent
                  : undefined
              }
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={carouselWidth}
              decelerationRate="fast"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing || isFetching}
                  onRefresh={onRefresh}
                  tintColor="#4F46E5"
                  colors={['#4F46E5']}
                  progressBackgroundColor="#EEF2FF"
                />
              }
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              renderItem={({ item }) => {
                const imageUrl = getAchievementImageUrl(item);

                return (
                  <View style={styles.slide}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.achievementImage}
                      resizeMode="cover"
                    />
                    {isAdmin && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item)}
                        activeOpacity={0.82}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={21}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="emoji-events"
                    size={42}
                    color="#94A3B8"
                  />
                  <Text style={styles.emptyTitle}>No achievements yet</Text>
                  <Text style={styles.emptyText}>
                    {isAdmin
                      ? 'Upload celebration images to share them here.'
                      : 'Celebration images will appear here soon.'}
                  </Text>
                </View>
              }
            />
          )}

          {visibleAchievements.length > 1 && (
            <View style={styles.dots}>
              {visibleAchievements.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.dot,
                    index === activeIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View> */}
      </View>

      <LoadingOverlay visible={isBusy} label="Updating achievements..." />
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
