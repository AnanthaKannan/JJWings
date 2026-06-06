import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DeviceInfo from 'react-native-device-info';

import { LoadingOverlay, LoadingState } from '../component';
import {
  SameDeviceStudent,
  useDeleteStudentDeviceIdMutation,
  useGetSameDeviceStudentsQuery,
} from '../store/api';
import { logout } from '../store/slices';
import { RootState } from '../store/store';
import { clearSavedLoginCredentials } from '../util/authStorage';

const AVATAR_COLORS = [
  '#4F46E5',
  '#0F766E',
  '#B45309',
  '#2563EB',
  '#BE123C',
  '#7C3AED',
];

const getInitials = (name: string) =>
  (name || 'Student')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const getAvatarColor = (id: string) => {
  const total = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
};

const ItemSeparator = () => <View style={styles.separator} />;

const StudentCard = ({
  student,
  isDeleting,
  onDeletePress,
}: {
  student: SameDeviceStudent;
  isDeleting: boolean;
  onDeletePress: () => void;
}) => (
  <View style={styles.card}>
    <View
      style={[styles.avatar, { backgroundColor: getAvatarColor(student.id) }]}
    >
      <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
    </View>

    <View style={styles.studentInfo}>
      <Text style={styles.studentName} numberOfLines={1}>
        {student.name || 'Student'}
      </Text>
      <Text style={styles.studentMeta} numberOfLines={1}>
        #{student.studentId ?? student.id}
      </Text>
    </View>

    <View style={styles.countBadge}>
      <Text style={styles.countValue}>{student.deviceIds.length}</Text>
      <Text style={styles.countLabel}>devices</Text>
    </View>

    <TouchableOpacity
      style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
      onPress={onDeletePress}
      disabled={isDeleting}
      activeOpacity={0.82}
    >
      <MaterialIcons name="delete-outline" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

export default function SameDeviceStudentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null,
  );
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const loggedInStudentId = useSelector(
    (state: RootState) => state.common.studentId,
  );

  const {
    data: students = [],
    isLoading,
    refetch,
  } = useGetSameDeviceStudentsQuery(undefined, {
    skip: !isFocused,
    refetchOnMountOrArgChange: true,
  });

  const [deleteStudentDeviceId, { isLoading: isDeleting }] =
    useDeleteStudentDeviceIdMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const logoutCurrentStudent = useCallback(async () => {
    await clearSavedLoginCredentials();
    dispatch(logout());
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  }, [dispatch, navigation]);

  const deleteStudentFromDevice = useCallback(
    async (student: SameDeviceStudent) => {
      setDeletingStudentId(student.id);

      try {
        const deviceId = await DeviceInfo.getUniqueId();

        await deleteStudentDeviceId({
          studentId: student.id,
          deviceId,
        }).unwrap();

        if (student.id === loggedInStudentId) {
          await logoutCurrentStudent();
          return;
        }

        await refetch();
      } catch {
        Alert.alert(
          'Unable to delete',
          'Please try removing this student from the device again.',
        );
      } finally {
        setDeletingStudentId(null);
      }
    },
    [
      deleteStudentDeviceId,
      loggedInStudentId,
      logoutCurrentStudent,
      refetch,
    ],
  );

  const handleDeletePress = useCallback(
    (student: SameDeviceStudent) => {
      Alert.alert(
        'Delete from device?',
        `${student.name || 'This student'} will be removed from this device.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteStudentFromDevice(student);
            },
          },
        ],
      );
    },
    [deleteStudentFromDevice],
  );

  const showLoader = isFocused && isLoading && students.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Same Device Students</Text>
          <Text style={styles.headerSubtitle}>Students logged on this device</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="devices-other" size={22} color="#4F46E5" />
        </View>
      </View>

      {showLoader ? (
        <View style={styles.loaderWrap}>
          <LoadingState label="Loading same-device students..." />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            students.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
              progressBackgroundColor="#EEF2FF"
            />
          }
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              isDeleting={deletingStudentId === item.id}
              onDeletePress={() => handleDeletePress(item)}
            />
          )}
          ItemSeparatorComponent={ItemSeparator}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="devices" size={30} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptyText}>
                Students sharing logged devices will appear here.
              </Text>
            </View>
          }
        />
      )}
      <LoadingOverlay visible={isDeleting} label="Removing student..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FB',
  },
  headerTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderWrap: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '900',
  },
  studentMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  countBadge: {
    minWidth: 58,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  countValue: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  countLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.55,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
});
