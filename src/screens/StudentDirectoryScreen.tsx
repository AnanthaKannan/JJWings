import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  useGetStudentsQuery,
  useUpdateStudentMutation,
  useResetPasswordMutation,
} from '../store/api';
import { randomNumber } from '../util/fn';
import {
  AdminHeader,
  FloatingAddButton,
  LoadingOverlay,
  LoadingState,
} from '../component';
import { getFileUrl } from '../util/fileUrl';
import ReuseModal from '../component/ReuseModal';
import { ReuseModalProps } from '../component/ReuseModal';
import { StudentDirectoryScreenStyles as styles } from './styles/StudentDirectoryScreen.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  name: string;
  studentId?: string;
  level?: number;
  profilePicPath?: string;
  fcmTokens: string[];
  assigned: number;
  completed: number;
  new: number;
  progress: number;
  horizontal: boolean;
  success: number;
  failure: number;
  isDeleted?: boolean;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const StudentSeparator = () => <View style={styles.separator} />;

const COLORSX = [
  '#E8A87C',
  '#7EB8D4',
  '#F4C56A',
  '#B39DDB',
  '#80CBC4',
  '#EF9A9A',
  '#EF9A9A',
];

// ─── Avatar Component ─────────────────────────────────────────────────────────

const Avatar = ({
  color,
  name,
  profilePic,
}: {
  color: string;
  name: string;
  profilePic?: string;
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('');
  const profilePicUrl = getFileUrl(profilePic);

  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      {profilePicUrl ? (
        <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{initials}</Text>
      )}
    </View>
  );
};

// ─── Accuracy Badge ───────────────────────────────────────────────────────────

// ─── Student Row ──────────────────────────────────────────────────────────────

const ProgressStat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View style={[styles.progressStat, { backgroundColor: color + '14' }]}>
    <Text style={[styles.progressValue, { color }]}>{value}</Text>
    <Text
      style={styles.progressLabel}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {label}
    </Text>
  </View>
);

const StudentRow = ({
  item,
  onViewPress,
  onRevert,
}: {
  item: Student;
  onViewPress: () => void;
  onRevert: () => void;
}) => (
  <View style={[styles.row, item.isDeleted && styles.deletedRow]}>
    <View style={styles.studentInfo}>
      <Avatar
        color={item.isDeleted ? '#E2E8F0' : COLORSX[randomNumber(0, 6)]}
        name={item.name}
        profilePic={item.profilePicPath}
      />
      <View style={styles.nameBlock}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentMeta}>#{item.studentId ?? item.id}</Text>
        <Text style={styles.studentLevel}>
          Level {typeof item.level === 'number' ? item.level : '-'}
        </Text>
      </View>
    </View>

    <View style={styles.progressCell}>
      <View style={styles.progressStats}>
        {item.isDeleted && (
          <Text style={styles.deletedLabel}>Pending delete</Text>
        )}
        {item.isDeleted !== true && (
          <ProgressStat
            label="Done"
            value={item.completed || 0}
            color="#22c55e"
          />
        )}
        {item.isDeleted !== true && (
          <ProgressStat
            label="Progress"
            value={item.progress || 0}
            color="#4F46E5"
          />
        )}
        {item.isDeleted !== true && (
          <ProgressStat label="New" value={item.new || 0} color="#f59e0b" />
        )}
      </View>
    </View>

    <View style={styles.actions}>
      {item.isDeleted ? (
        <TouchableOpacity
          style={styles.revertButton}
          onPress={onRevert}
          activeOpacity={0.82}
        >
          <MaterialIcons name="restore" size={16} color="#047857" />
          <Text style={styles.revertButtonText}>Revert</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.viewAction} onPress={onViewPress}>
          <Text style={styles.viewActionText}>View</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─── Table Header ─────────────────────────────────────────────────────────────

const TableHeader = ({ count }: { count: number }) => (
  <View style={styles.tableHeader}>
    <Text style={[styles.headerText, styles.studentHeader]}>
      STUDENT {count}
    </Text>
    <Text style={[styles.headerText, styles.progressHeader]}>PROGRESS</Text>
    <Text style={[styles.headerText, styles.actionsHeader]}>ACTIONS</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>🔍</Text>
    <Text style={styles.emptyText}>No students found</Text>
  </View>
);

const modalInitial: ReuseModalProps = {
  state: 'confirm',
  visible: false,
  title: '',
  description: '',
};

const TouchableBtn = ({
  onPress,
  text,
}: {
  onPress: () => void;
  text: string;
}) => {
  return (
    <TouchableOpacity style={styles.modalSecondaryAction} onPress={onPress}>
      <Text style={styles.modalSecondaryActionText}>{text}</Text>
    </TouchableOpacity>
  );
};

export default function StudentDirectoryScreen() {
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [page, setPage] = useState(1);
  const [loadingMorePage, setLoadingMorePage] = useState<number | null>(null);
  const [modal, setModal] = useState<ReuseModalProps>(modalInitial);

  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const {
    data: { students = [], meta } = {},
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetStudentsQuery(
    {
      ...(selectedLevel === null ? {} : { level: selectedLevel }),
      page,
    },
    {
      skip: !isFocused,
    },
  );
  const [updateStudent, { isLoading: isHorizontalUpdating }] =
    useUpdateStudentMutation();
  const [resetPassword, { isLoading: isResetPasswordLoading }] =
    useResetPasswordMutation();

  // Reset to page 1 whenever the level filter changes
  useEffect(() => {
    setPage(1);
    setLoadingMorePage(null);
  }, [selectedLevel]);

  useEffect(() => {
    if (
      loadingMorePage !== null &&
      (meta?.page === loadingMorePage || isError)
    ) {
      setLoadingMorePage(null);
    }
  }, [isError, loadingMorePage, meta?.page]);

  const filtered = students.filter(s => {
    const cleanSearch = search.trim().toLowerCase();
    const matchesSearch =
      cleanSearch.length === 0 ||
      s.name.toLowerCase().includes(cleanSearch) ||
      s.studentId?.toLowerCase().includes(cleanSearch) ||
      s.id.toLowerCase().includes(cleanSearch) ||
      String(s.level ?? '').includes(cleanSearch);

    return matchesSearch;
  });

  const showLoader = isFocused && isLoading && students.length === 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (page === 1) {
        await refetch();
      } else {
        setPage(1);
      }
    } finally {
      setRefreshing(false);
    }
  }, [page, refetch]);

  const onReachStudentsBottom = useCallback(() => {
    if (!isFetching && meta?.hasNextPage === true) {
      const nextPage = meta.page + 1;

      setLoadingMorePage(nextPage);
      setPage(nextPage);
    }
  }, [isFetching, meta]);

  const handleAssignPress = (student: Student) => {
    navigation.navigate('AssignHomework', {
      studentId: student.id,
      studentName: student.name,
      level: student.level,
    });
  };

  const handleProgressPress = (student: Student) => {
    navigation.navigate('StudentProgress', {
      studentId: student.id,
      studentName: student.name,
      adminReview: true,
    });
  };

  const handleHomeworkPress = (student: Student) => {
    navigation.navigate('HomeworkScreen', {
      studentId: student.id,
      studentName: student.name,
      adminReview: true,
      type: 'homework',
    });
  };

  const handlePracticePress = (student: Student) => {
    navigation.navigate('PracticeScreen', {
      studentId: student.id,
      studentName: student.name,
      adminReview: true,
    });
  };

  const handleExamPress = (student: Student) => {
    navigation.navigate('HomeworkScreen', {
      studentId: student.id,
      studentName: student.name,
      adminReview: true,
      type: 'exam',
    });
  };

  const handleHorizontalPress = async (student: Student) => {
    await updateStudent({
      studentId: student.id,
      horizontal: !student.horizontal,
    }).unwrap();
  };

  const deleteOrUndoStudent = async (student: Student, isDeleted: boolean) => {
    let title = 'Student deleted!';
    let description = `The deletion process for *${student.name}* has been initiated successfully.
\nThe student will be permanently deleted in *2 days*.
\nIf needed, you can restore the student at any time within this 2-day period.`;

    if (isDeleted === false) {
      description = `The *${student.name}* has been restored successfully.`;
      title = 'Student Restore!';
    }
    try {
      await updateStudent({
        studentId: student.id,
        isDeleted,
      }).unwrap();

      setModal({
        visible: true,
        state: 'success',
        title,
        description,
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      setModal({
        visible: true,
        state: 'failure',
        title,
        description:
          'Unable to do the operation right now. Please try again later.',
      });
    } finally {
      closeActionsModal();
    }
  };

  const closeActionsModal = () => setSelectedStudent(null);

  const handleModalPerformancePress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    handleProgressPress(selectedStudent);
  };

  const handleModalHomeworkPress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    handleHomeworkPress(selectedStudent);
  };

  const handleModalPracticePress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    handlePracticePress(selectedStudent);
  };

  const handleModalExamPress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    handleExamPress(selectedStudent);
  };

  const handleModalAssignPress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    handleAssignPress(selectedStudent);
  };

  const handleModalNotificationsPress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    navigation.navigate('StudentNotifications', {
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
    });
  };

  const handleModalEditPress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    navigation.navigate('AddStudent', {
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      level: selectedStudent.level,
    });
  };

  const handleModalHorizontalPress = async () => {
    if (!selectedStudent) return;

    await handleHorizontalPress(selectedStudent);
    closeActionsModal();
  };

  const handleResetPassword = async () => {
    if (!selectedStudent) return;
    try {
      const response = await resetPassword({
        studentId: selectedStudent.id,
      }).unwrap();

      const password = response?.data?.password;
      const message = response?.message;
      setModal({
        visible: true,
        state: 'success',
        title: 'Password Reset',
        description: `${message}\n\nNew password: *${password}*`,
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      setModal({
        visible: true,
        state: 'failure',
        title: 'Password Reset',
        description: 'Unable to reset password right now. Please try again.',
      });
    } finally {
      closeActionsModal();
    }
  };

  const handleModalResetPasswordPress = async () => {
    if (!selectedStudent) return;
    setModal({
      visible: true,
      state: 'confirm',
      onConfirm: () => handleResetPassword(),
      title: 'Confirm Password Reset',
      description: `This will reset the password for *${selectedStudent.name}* and generate a new temporary password. Do you want to continue?`,
    });
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    setModal({
      visible: true,
      state: 'confirm',
      onConfirm: () => deleteOrUndoStudent(selectedStudent, true),
      title: 'Are you sure, do you want to delete the student.',
      description: `This will be delete *${selectedStudent.name}'s* all the record. `,
    });
  };

  const confirmRevert = (student: Student) => {
    setModal({
      visible: true,
      state: 'confirm',
      onConfirm: () => deleteOrUndoStudent(student, false),
      title: 'Revert Student Delete',
      description: `Do you want to restore *${student.name}*? This will cancel the pending delete request.`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      {/* Header */}
      <AdminHeader header="Student Directory" />

      {/* Search */}
      <View style={styles.filterRow}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#A0AEC0"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.levelFilterButton,
            selectedLevel !== null && styles.levelFilterButtonActive,
          ]}
          onPress={() => setIsLevelPickerOpen(true)}
          activeOpacity={0.82}
        >
          <MaterialIcons
            name="filter-list"
            size={18}
            color={selectedLevel === null ? '#64748B' : '#475569'}
          />
          <Text
            style={[
              styles.levelFilterText,
              selectedLevel !== null && styles.levelFilterTextActive,
            ]}
          >
            {selectedLevel === null ? 'All' : `L${selectedLevel}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <View style={styles.tableCard}>
        <TableHeader count={meta?.total ?? 0} />
        {showLoader && <LoadingState label="Loading students..." />}
        <FlatList
          data={showLoader ? [] : filtered}
          keyExtractor={item => item.id}
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
            <StudentRow
              item={item}
              onViewPress={() => setSelectedStudent(item)}
              onRevert={() => confirmRevert(item)}
            />
          )}
          ItemSeparatorComponent={StudentSeparator}
          showsVerticalScrollIndicator={false}
          onEndReached={onReachStudentsBottom}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            meta?.hasNextPage === true ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color="#4F46E5" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            showLoader ? null : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            )
          }
        />
      </View>

      {/* FAB */}
      <FloatingAddButton
        icon="person-add"
        onPress={() =>
          navigation.navigate('AdminStudents', {
            screen: 'AddStudent',
          })
        }
      />
      {/* <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity> */}
      <LoadingOverlay
        visible={isHorizontalUpdating || isResetPasswordLoading}
        label={
          isResetPasswordLoading
            ? 'Resetting password...'
            : 'Updating student...'
        }
      />

      <ReuseModal
        visible={modal.visible}
        state={modal.state}
        title={modal.title}
        description={modal.description}
        onConfirm={modal.onConfirm}
        onCancel={() => {
          setModal(modalInitial);
        }}
      />
      <Modal
        visible={isLevelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLevelPickerOpen(false)}
      >
        <Pressable
          style={styles.levelModalBackdrop}
          onPress={() => setIsLevelPickerOpen(false)}
        >
          <Pressable style={styles.levelModal}>
            <View style={styles.levelModalHeader}>
              <Text style={styles.levelModalTitle}>Filter Level</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsLevelPickerOpen(false)}
              >
                <MaterialIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.levelAllOption,
                selectedLevel === null && styles.levelOptionActive,
              ]}
              onPress={() => {
                setSelectedLevel(null);
                setIsLevelPickerOpen(false);
              }}
              activeOpacity={0.82}
            >
              <Text
                style={[
                  styles.levelOptionText,
                  selectedLevel === null && styles.levelOptionTextActive,
                ]}
              >
                All Levels
              </Text>
            </TouchableOpacity>
            <View style={styles.levelGrid}>
              {Array.from({ length: 11 }, (_, value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.levelOption,
                    selectedLevel === value && styles.levelOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedLevel(value);
                    setIsLevelPickerOpen(false);
                  }}
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.levelOptionText,
                      selectedLevel === value && styles.levelOptionTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={selectedStudent !== null}
        transparent
        animationType="fade"
        onRequestClose={closeActionsModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeActionsModal}>
          <Pressable style={styles.actionsModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedStudent?.name ?? 'Student'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  #{selectedStudent?.studentId ?? selectedStudent?.id ?? ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeActionsModal}
              >
                <Text style={styles.modalCloseText}>X</Text>
              </TouchableOpacity>
            </View>

            <TouchableBtn
              text="Assign Questions"
              onPress={handleModalAssignPress}
            />
            <TouchableBtn
              text="Progress"
              onPress={handleModalPerformancePress}
            />
            <TouchableBtn text="Homework" onPress={handleModalHomeworkPress} />
            <TouchableBtn text="Practice" onPress={handleModalPracticePress} />
            <TouchableBtn text="Exam" onPress={handleModalExamPress} />
            <TouchableBtn
              text="Notifications"
              onPress={handleModalNotificationsPress}
            />
            <TouchableBtn text="Edit" onPress={handleModalEditPress} />

            <TouchableOpacity
              style={[
                styles.modalHorizontalAction,
                selectedStudent?.horizontal && styles.horizontalActionActive,
                isHorizontalUpdating && styles.actionDisabled,
              ]}
              onPress={handleModalHorizontalPress}
              disabled={isHorizontalUpdating}
            >
              <Text
                style={[
                  styles.modalHorizontalActionText,
                  selectedStudent?.horizontal &&
                    styles.horizontalActionTextActive,
                ]}
              >
                {selectedStudent?.horizontal ? 'Vertical' : 'Horizontal'}
              </Text>
            </TouchableOpacity>
            <TouchableBtn
              text="Reset Password"
              onPress={handleModalResetPasswordPress}
            />
            <TouchableOpacity
              style={styles.modalDangerAction}
              onPress={handleDeleteStudent}
            >
              <Text style={styles.modalDangerActionText}>Delete</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
