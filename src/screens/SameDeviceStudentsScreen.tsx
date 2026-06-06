import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  useLazyGetLoginQuery,
  useSwitchStudentLoginMutation,
  useUpdateStudentDeviceIdMutation,
} from '../store/api';
import { logout, setStudentCredentials } from '../store/slices';
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
  isSwitching,
  onPress,
  onDeletePress,
}: {
  student: SameDeviceStudent;
  isDeleting: boolean;
  isSwitching: boolean;
  onPress: () => void;
  onDeletePress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.card, isSwitching && styles.cardDisabled]}
    onPress={onPress}
    disabled={isDeleting || isSwitching}
    activeOpacity={0.82}
  >
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
      onPress={event => {
        event.stopPropagation();
        onDeletePress();
      }}
      disabled={isDeleting}
      activeOpacity={0.82}
    >
      <MaterialIcons name="delete-outline" size={20} color="#B91C1C" />
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function SameDeviceStudentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentLoginId, setStudentLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
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
  const [login, loginRes] = useLazyGetLoginQuery();
  const [updateStudentDeviceId, updateDeviceRes] =
    useUpdateStudentDeviceIdMutation();
  const [switchStudentLogin, switchStudentRes] =
    useSwitchStudentLoginMutation();

  const isAddingStudent = loginRes.isFetching || updateDeviceRes.isLoading;
  const isSwitchingStudent = switchStudentRes.isLoading;
  const canSubmitAdd = studentLoginId.trim().length > 0 && password.length > 0;

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
        console.log('studentId', student.id, 'deviceId', deviceId);
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
    [deleteStudentDeviceId, loggedInStudentId, logoutCurrentStudent, refetch],
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

  const closeAddModal = useCallback(() => {
    if (isAddingStudent) return;

    setIsAddModalOpen(false);
    setStudentLoginId('');
    setPassword('');
    setShowPassword(false);
    setLoginError('');
  }, [isAddingStudent]);

  const handleAddStudent = useCallback(async () => {
    const cleanStudentId = studentLoginId.trim();

    if (!cleanStudentId || !password) {
      setLoginError('User Name or password incorrect.');
      return;
    }

    setLoginError('');

    try {
      const result = await login({
        username: cleanStudentId,
        password,
      });

      if (
        !('data' in result) ||
        !result.data ||
        result.data.role !== 'student'
      ) {
        setLoginError('User Name or password incorrect.');
        return;
      }

      const deviceId = await DeviceInfo.getUniqueId();

      await updateStudentDeviceId({
        deviceId,
        authToken: result.data.token,
      }).unwrap();

      setIsAddModalOpen(false);
      setStudentLoginId('');
      setPassword('');
      setShowPassword(false);
      await refetch();
    } catch {
      setLoginError('User Name or password incorrect.');
    }
  }, [login, password, refetch, studentLoginId, updateStudentDeviceId]);

  const handleStudentPress = useCallback(
    async (student: SameDeviceStudent) => {
      if (student.id === loggedInStudentId) {
        navigation.navigate('Progress');
        return;
      }

      try {
        const result = await switchStudentLogin({
          studentId: student.id,
        }).unwrap();

        if (result.role !== 'student') {
          Alert.alert('Unable to switch', 'Only student accounts can be used.');
          return;
        }

        dispatch(
          setStudentCredentials({
            studentId: result.id,
            vertical: result.vertical,
            isStudent: true,
            studentName: result.name,
            token: result.token,
          }),
        );

        await clearSavedLoginCredentials();

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Progress' } }],
          }),
        );
      } catch {
        Alert.alert(
          'Unable to switch',
          'Please try opening this student again.',
        );
      }
    },
    [dispatch, loggedInStudentId, navigation, switchStudentLogin],
  );

  const showLoader = isFocused && isLoading && students.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Same Device Students</Text>
          <Text style={styles.headerSubtitle}>
            Students logged on this device
          </Text>
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
              isSwitching={isSwitchingStudent}
              onPress={() => handleStudentPress(item)}
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
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalOpen(true)}
        activeOpacity={0.86}
      >
        <MaterialIcons name="person-add-alt" size={25} color="#FFFFFF" />
      </TouchableOpacity>
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAddModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeAddModal}>
          <Pressable style={styles.loginCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Student</Text>
                <Text style={styles.modalSubtitle}>
                  Login to add this device
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeAddModal}
                disabled={isAddingStudent}
              >
                <MaterialIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Explorer ID</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. JJ099"
                placeholderTextColor="#AABDD4"
                value={studentLoginId}
                onChangeText={text => {
                  setStudentLoginId(text);
                  setLoginError('');
                }}
                autoCapitalize="none"
                editable={!isAddingStudent}
              />
            </View>

            <Text style={styles.inputLabel}>Secret Code</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#AABDD4"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setLoginError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isAddingStudent}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                disabled={isAddingStudent}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            {loginError.length > 0 && (
              <Text style={styles.errorText}>{loginError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!canSubmitAdd || isAddingStudent) && styles.submitButtonOff,
              ]}
              onPress={handleAddStudent}
              disabled={!canSubmitAdd || isAddingStudent}
              activeOpacity={0.86}
            >
              <Text style={styles.submitButtonText}>
                {isAddingStudent ? 'Adding...' : 'Add to Device'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <LoadingOverlay
        visible={isSwitchingStudent}
        label="Switching student..."
      />
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
    gap: 10,
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
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  modalTitle: {
    color: '#1A2259',
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2259',
    marginBottom: 8,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A2259',
    fontWeight: '500',
    padding: 0,
  },
  eyeIcon: {
    minWidth: 38,
    fontSize: 13,
    color: '#1A3A6B',
    fontWeight: '800',
    textAlign: 'right',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: '#1A3A6B',
    borderRadius: 18,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  submitButtonOff: {
    backgroundColor: '#A0AECC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
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
  cardDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
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
