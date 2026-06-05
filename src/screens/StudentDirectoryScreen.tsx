import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';

import {
  useGetStudentsQuery,
  useUpdateStudentHorizontalMutation,
} from '../store/api';
import { randomNumber } from '../util/fn';
import { AdminHeader, LoadingOverlay, LoadingState } from '../component';

// ─── Types ───────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  name: string;
  studentId?: string;
  fcmTokens: string[];
  assigned: number;
  completed: number;
  new: number;
  horizontal: boolean;
  success: number;
  failure: number;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const COLORS = [
  '#E8A87C',
  '#7EB8D4',
  '#F4C56A',
  '#B39DDB',
  '#80CBC4',
  '#EF9A9A',
  '#EF9A9A',
];

// ─── Avatar Component ─────────────────────────────────────────────────────────

const Avatar = ({ color, name }: { color: string; name: string }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('');
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials}</Text>
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
    <Text style={styles.progressLabel}>{label}</Text>
  </View>
);

const StudentRow = ({
  item,
  onViewPress,
}: {
  item: Student;
  onViewPress: () => void;
}) => (
  <View style={styles.row}>
    <View style={styles.studentInfo}>
      <Avatar color={COLORS[randomNumber(0, 6)]} name={item.name} />
      <View style={styles.nameBlock}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentMeta}>#{item.studentId ?? item.id}</Text>
      </View>
    </View>

    <View style={styles.progressCell}>
      <View style={styles.progressStats}>
        <ProgressStat
          label="Done"
          value={item.completed || 0}
          color="#22c55e"
        />
        <ProgressStat
          label="Assigned"
          value={item.assigned || 0}
          color="#4F46E5"
        />
        <ProgressStat label="New" value={item.new || 0} color="#f59e0b" />
      </View>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.viewAction} onPress={onViewPress}>
        <Text style={styles.viewActionText}>View</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Table Header ─────────────────────────────────────────────────────────────

const TableHeader = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.headerText, styles.studentHeader]}>STUDENT</Text>
    <Text style={[styles.headerText, styles.progressHeader]}>PROGRESS</Text>
    <Text style={[styles.headerText, styles.actionsHeader]}>ACTIONS</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>ðŸ”</Text>
    <Text style={styles.emptyText}>No students found</Text>
  </View>
);

export default function StudentDirectoryScreen() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const {
    data: students,
    isLoading,
    refetch,
  } = useGetStudentsQuery(undefined, {
    skip: !isFocused,
  });
  const [updateStudentHorizontal, { isLoading: isHorizontalUpdating }] =
    useUpdateStudentHorizontalMutation();

  const filtered = students?.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()),
  );
  const showLoader = isFocused && isLoading && !students;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleAssignPress = (student: Student) => {
    navigation.navigate('AssignHomework', {
      studentId: student.id,
      studentName: student.name,
    });
  };

  const handlePerformancePress = (student: Student) => {
    navigation.navigate('HomeworkScreen', {
      studentId: student.id,
      studentName: student.name,
      adminReview: true,
    });
  };

  const handleHorizontalPress = async (student: Student) => {
    await updateStudentHorizontal({
      studentId: student.id,
      horizontal: !student.horizontal,
    }).unwrap();
    // refetch();
  };

  const closeActionsModal = () => setSelectedStudent(null);

  const handleModalPerformancePress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    handlePerformancePress(selectedStudent);
  };

  const handleModalAssignPress = () => {
    if (!selectedStudent) return;

    closeActionsModal();
    handleAssignPress(selectedStudent);
  };

  const handleModalHorizontalPress = async () => {
    if (!selectedStudent) return;

    await handleHorizontalPress(selectedStudent);
    closeActionsModal();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      {/* Header */}
      <AdminHeader header="Student Directory" />

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, level, or ID..."
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

      {/* Table */}
      <View style={styles.tableCard}>
        <TableHeader />
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
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
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
      {/* <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity> */}
      <LoadingOverlay
        visible={isHorizontalUpdating}
        label="Updating student..."
      />
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

            <TouchableOpacity
              style={styles.modalSecondaryAction}
              onPress={handleModalPerformancePress}
            >
              <Text style={styles.modalSecondaryActionText}>Performance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalPrimaryAction}
              onPress={handleModalAssignPress}
            >
              <Text style={styles.modalPrimaryActionText}>Assign</Text>
            </TouchableOpacity>
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#2D3748' },
  clearIcon: { fontSize: 14, color: '#A0AEC0', paddingHorizontal: 4 },

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
    fontSize: 8,
    color: '#64748B',
    fontWeight: '700',
    lineHeight: 11,
    textAlign: 'center',
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
  modalSecondaryActionText: {
    fontSize: 14,
    color: '#4F46E5',
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

  // Separator
  separator: { height: 1, backgroundColor: '#F7F7FA' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#A0AEC0' },

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
