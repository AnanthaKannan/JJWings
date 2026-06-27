import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
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
import { COLORS } from './../util/index';

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

const STATE_NAME = {
  PASSWORD_RESET: 'password-reset',
  DELETE_STUDENT: 'delete-student',
};

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
  name: '',
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
    }
    try {
      await updateStudent({
        studentId: student.id,
        isDeleted,
      }).unwrap();

      setModal({
        name: '',
        visible: true,
        state: 'success',
        title,
        description,
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      setModal({
        name: '',
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
        name: '',
        visible: true,
        state: 'success',
        title: 'Password Reset',
        description: `${message}\n\nNew password: *${password}*`,
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      setModal({
        name: '',
        visible: true,
        state: 'failure',
        title: 'Password Reset',
        description: 'Unable to reset password right now. Please try again.',
      });
    } finally {
      closeActionsModal();
    }
  };

  const handleOnConfirm = () => {
    if (!selectedStudent) return;
    if (modal.name === STATE_NAME.PASSWORD_RESET) {
      handleResetPassword();
    } else if (modal.name === STATE_NAME.DELETE_STUDENT) {
      deleteOrUndoStudent(selectedStudent, true);
    }
  };

  const handleModalResetPasswordPress = async () => {
    if (!selectedStudent) return;

    setModal({
      name: STATE_NAME.PASSWORD_RESET,
      visible: true,
      state: 'confirm',
      title: 'Confirm Password Reset',
      description: `This will reset the password for *${selectedStudent.name}* and generate a new temporary password. Do you want to continue?`,
    });
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    setModal({
      name: STATE_NAME.DELETE_STUDENT,
      visible: true,
      state: 'confirm',
      title: 'Are you sure, do you want to delete the student.',
      description: `This will be delete *${selectedStudent.name}'s* all the record. `,
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
              onRevert={() => deleteOrUndoStudent(item, false)}
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
        onConfirm={() => handleOnConfirm()}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  deletedRow: {
    opacity: 0.7,
  },
  deletedLabel: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FB',
  },
  menuButton: { padding: 4 },
  menuIcon: { fontSize: 18 },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { color: '#fff', fontWeight: '700', fontSize: 14 },
  brandName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellButton: { padding: 4 },
  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E0',
  },

  // Title
  titleSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    lineHeight: 18,
  },

  // Search
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  searchWrapper: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    fontSize: 14,
    color: '#2D3748',
  },
  clearIcon: { fontSize: 14, color: '#A0AEC0', paddingHorizontal: 4 },
  levelFilterButton: {
    height: 48,
    minWidth: 78,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  levelFilterButtonActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  levelFilterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  levelFilterTextActive: {
    color: '#475569',
  },

  // Table Card
  tableCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },

  // Table Header
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 0.8,
  },
  studentHeader: {
    flex: 2,
  },
  progressHeader: {
    flex: 2.4,
  },
  actionsHeader: {
    flex: 1.4,
    textAlign: 'right',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  studentInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  nameBlock: { flex: 1 },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A202C',
    lineHeight: 17,
  },
  studentMeta: { fontSize: 11, color: '#A0AEC0', marginTop: 1 },
  studentLevel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '700',
  },

  // Accuracy
  accuracyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 54,
  },
  accuracyText: { fontSize: 12, fontWeight: '700' },

  progressCell: {
    flex: 2.4,
    gap: 6,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 4,
  },
  progressStat: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  progressLabel: {
    width: '100%',
    fontSize: 8,
    color: '#64748B',
    fontWeight: '700',
    lineHeight: 11,
    textAlign: 'center',
  },

  revertButton: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  revertButtonText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },

  // Actions
  actions: {
    flex: 1.4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 5,
  },
  viewAction: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewActionText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '800',
  },
  horizontalActionActive: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  horizontalActionTextActive: {
    color: '#0F766E',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  actionsModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A202C',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '900',
  },
  modalSecondaryAction: {
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalDangerAction: {
    borderRadius: 10,
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalSecondaryActionText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '800',
  },
  modalDangerActionText: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '800',
  },
  modalPrimaryAction: {
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalPrimaryActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalNotificationAction: {
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalNotificationActionText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '800',
  },
  modalEditAction: {
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalEditActionText: {
    fontSize: 14,
    color: '#7E22CE',
    fontWeight: '800',
  },
  modalHorizontalAction: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalHorizontalActionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '800',
  },
  levelModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  levelModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  levelModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelModalTitle: {
    color: '#1A202C',
    fontSize: 17,
    fontWeight: '900',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelAllOption: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  levelOption: {
    width: 48,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOptionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  levelOptionText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '900',
  },
  levelOptionTextActive: {
    color: '#FFFFFF',
  },

  // Separator
  separator: { height: 1, backgroundColor: '#F7F7FA' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#A0AEC0' },

  // Footer loader (pagination spinner)
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 26, lineHeight: 30 },

  // Bottom Tab
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#A0AEC0', marginTop: 3, fontWeight: '500' },
  tabLabelActive: { color: '#4F46E5', fontWeight: '700' },
  tabDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  },
});
