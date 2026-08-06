import React, { useCallback, useState } from 'react';
import { Modal, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';

import {
  AdminHeader,
  LoadingOverlay,
  StudentHeader,
  ImageFeed,
  FloatingAddButton,
  CreatePostScreen,
} from '../component';
import { useGetFeedListQuery } from '../store/api';
import { RootState } from '../store/store';

export default function AchievementsScreen() {
  const isFocused = useIsFocused();
  const { isAdmin, adminName, adminProfilePic } = useSelector(
    (state: RootState) => state.common,
  );
  const [creatingPost, setCreatingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: feedList = [],
    isLoading,
    refetch,
  } = useGetFeedListQuery(undefined, { skip: !isFocused });

  const isBusy = isLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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
          onRefresh={onRefresh}
          refreshing={refreshing}
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
            userName={adminName}
            userAvatarUri={adminProfilePic}
            onClose={() => setCreatingPost(false)}
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
});
