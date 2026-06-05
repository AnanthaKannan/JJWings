import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';

import { AdminHeader, LoadingState } from '../component';
import {
  useGetAdminNotificationsQuery,
  useGetNotificationsQuery,
  Notification,
} from '../store/api';
import { RootState } from '../store/store';
import { clearNotificationAttention } from '../store/slices';

const formatNotificationTime = (dateValue?: string) => {
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

const NotificationCard = ({ item }: { item: Notification }) => (
  <View style={styles.card}>
    <View style={styles.iconWrap}>
      <MaterialIcons name="notifications" size={22} color="#2563EB" />
    </View>

    <View style={styles.cardBody}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title || 'Notification'}
        </Text>
        <Text style={styles.timeText}>{formatNotificationTime(item.createdAt)}</Text>
      </View>

      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  </View>
);

export default function NotificationsScreen() {
  const isFocused = useIsFocused();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const studentId = useSelector((state: RootState) => state.common.studentId);
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const routeStudentId = route.params?.studentId as string | undefined;
  const routeStudentName = route.params?.studentName as string | undefined;
  const isStudentNotificationReview = isAdmin && Boolean(routeStudentId);
  const targetStudentId = isStudentNotificationReview
    ? routeStudentId
    : studentId;
  const [refreshing, setRefreshing] = useState(false);
  const studentNotificationsQuery = useGetNotificationsQuery(
    { studentId: targetStudentId ?? '' },
    { skip: !isFocused || (!isStudentNotificationReview && isAdmin) || !targetStudentId },
  );
  const adminNotificationsQuery = useGetAdminNotificationsQuery(undefined, {
    skip: !isFocused || !isAdmin || isStudentNotificationReview,
  });
  const activeQuery = isAdmin && !isStudentNotificationReview
    ? adminNotificationsQuery
    : studentNotificationsQuery;
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = activeQuery;

  const headerTitle = isStudentNotificationReview
    ? `${routeStudentName ?? 'Student'} Notifications`
    : 'Notifications';
  const headerSubtitle = isStudentNotificationReview
    ? 'Notifications received by this student'
    : isAdmin
      ? 'Notifications sent to students'
      : 'Updates from your homework team';
  const emptyText = isStudentNotificationReview
    ? 'This student has not received notifications yet.'
    : isAdmin
      ? 'Sent notifications will appear here.'
      : 'New homework updates will appear here.';

  const canRefresh = (isAdmin && !isStudentNotificationReview) || Boolean(targetStudentId);

  const showLoader = isFocused && isLoading && notifications.length === 0;

  useEffect(() => {
    if (isFocused) {
      dispatch(clearNotificationAttention());
    }
  }, [dispatch, isFocused]);

  const onRefresh = useCallback(async () => {
    if (!canRefresh) return;

    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [canRefresh, refetch]);

  const header = isAdmin ? (
    <AdminHeader
      header={headerTitle}
      showBackButton={isStudentNotificationReview}
    />
  ) : (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
      </View>
      <View style={styles.headerIcon}>
        <MaterialIcons name="notifications-none" size={24} color="#2563EB" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />

      {header}

      <FlatList
        data={showLoader ? [] : notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
            progressBackgroundColor="#EEF2FF"
          />
        }
        renderItem={({ item }) => <NotificationCard item={item} />}
        ListEmptyComponent={
          showLoader ? (
            <LoadingState label="Loading notifications..." />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="notifications-off" size={42} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: '#EEF2FF',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#93C5FD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  messageText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 34,
    paddingHorizontal: 18,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
