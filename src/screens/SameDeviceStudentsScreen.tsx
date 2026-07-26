import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
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

import {
  FloatingAddButton,
  LoadingOverlay,
  LoadingState,
  StudentHeader,
} from '../component';
import {
  SameDeviceStudent,
  useDeleteStudentDeviceIdMutation,
  useGetSameDeviceStudentsQuery,
  useLazyGetLoginQuery,
  useSwitchStudentLoginMutation,
} from '../store/api';
import { logout, setStudentCredentials } from '../store/slices';
import { RootState } from '../store/store';
import { clearSavedLoginCredentials } from '../util/authStorage';
import { getFileUrl } from '../util/fileUrl';
import { SameDeviceStudentsScreenStyles as styles } from './styles/SameDeviceStudentsScreen.styles';

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
}) => {
  const profilePicUrl = getFileUrl(student.profilePicPath);

  return (
    <TouchableOpacity
      style={[styles.card, isSwitching && styles.cardDisabled]}
      onPress={onPress}
      disabled={isDeleting || isSwitching}
      activeOpacity={0.82}
    >
      <View
        style={[styles.avatar, { backgroundColor: getAvatarColor(student.id) }]}
      >
        {profilePicUrl ? (
          <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
        )}
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
};

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
  const mockDeviceId = useSelector(
    (state: RootState) => state.common.mockDeviceId,
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
  const [switchStudentLogin, switchStudentRes] =
    useSwitchStudentLoginMutation();

  const isAddingStudent = loginRes.isFetching;
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
        await deleteStudentDeviceId({
          studentId: student.id,
          deviceId: mockDeviceId,
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
      mockDeviceId,
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
        deviceId: mockDeviceId,
      });

      if (
        !('data' in result) ||
        !result.data ||
        result.data.role !== 'student'
      ) {
        setLoginError('User Name or password incorrect.');
        return;
      }

      setIsAddModalOpen(false);
      setStudentLoginId('');
      setPassword('');
      setShowPassword(false);
      await refetch();
    } catch {
      setLoginError('User Name or password incorrect.');
    }
  }, [login, password, refetch, studentLoginId, mockDeviceId]);

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
            studentCode: result.studentCode,
            vertical: result.vertical,
            isStudent: true,
            studentName: result.name,
            studentLevel: result.level,
            studentProfilePic: result.profilePicPath,
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
      <StudentHeader header="Same Device Students" />

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
      <FloatingAddButton
        icon="person-add-alt"
        onPress={() => setIsAddModalOpen(true)}
      />
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
