import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { AdminHeader, LoadingOverlay, LoadingState } from '../component';
import {
  useAssignHomeworkMutation,
  useGetAvailableQuestionsQuery,
  useSendNotificationMutation,
} from '../store/api';

type Task = {
  id: string;
  questionId?: string;
  question: string[];
  level?: number;
};

type AssignmentTypeFilter = 'homework' | 'exam';

const getAssignmentTypeLabel = (type: AssignmentTypeFilter) => {
  if (type === 'exam') return 'Exam';
  return 'Homework';
};

const getAssignmentTypeIcon = (type: AssignmentTypeFilter) => {
  if (type === 'exam') return 'fact-check';
  return 'assignment';
};

const getAssignmentNotificationHeader = (type: AssignmentTypeFilter) =>
  `New ${getAssignmentTypeLabel(type).toLowerCase()} assigned`;

const TaskRow = ({
  item,
  selected,
  disabled,
  onToggle,
}: {
  item: Task;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.taskRow,
      selected && styles.taskRowSelected,
      disabled && styles.taskRowDisabled,
    ]}
    onPress={onToggle}
    disabled={disabled}
    activeOpacity={0.75}
  >
    <View style={[styles.codePill, selected && styles.codePillSelected]}>
      <Text style={[styles.codeText, selected && styles.codeTextSelected]}>
        {item.question.length}
      </Text>
    </View>

    <View style={styles.taskContent}>
      <View style={styles.taskTitleRow}>
        <Text style={[styles.taskId, disabled && styles.taskTextDisabled]}>
          {item.questionId ?? item.id}
        </Text>
        {disabled && (
          <View style={styles.assignedBadge}>
            <Text style={styles.assignedBadgeText}>Assigned</Text>
          </View>
        )}
      </View>
      <View style={styles.taskMetaRow}>
        <MaterialIcons name="school" size={13} color="#4F46E5" />
        <Text style={styles.taskLevelText}>
          Level {typeof item.level === 'number' ? item.level : '-'}
        </Text>
      </View>
      {/* <Text style={styles.taskDesc} numberOfLines={2}>
        {item.question.join(', ')}
      </Text> */}
    </View>

    <TouchableOpacity
      onPress={onToggle}
      style={styles.checkbox}
      disabled={disabled}
    >
      {selected ? (
        <View style={styles.checkboxChecked}>
          <MaterialIcons name="check" size={14} color="#fff" />
        </View>
      ) : disabled ? (
        <View style={styles.checkboxDisabled}>
          <MaterialIcons name="lock" size={12} color="#94A3B8" />
        </View>
      ) : (
        <View style={styles.checkboxUnchecked} />
      )}
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function AssignHomeworkScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const studentName = route?.params?.studentName ?? 'Student';
  const studentId = route?.params?.studentId;
  const studentLevel =
    typeof route?.params?.level === 'number' ? route.params.level : null;
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(
    studentLevel,
  );
  const [typeFilter, setTypeFilter] =
    useState<AssignmentTypeFilter>('homework');
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: tasks = [], isLoading } = useGetAvailableQuestionsQuery(
    {
      studentId: studentId ?? '',
      type: typeFilter,
      ...(selectedLevel === null ? {} : { level: selectedLevel }),
    },
    {
      skip: !isFocused || !studentId,
    },
  );
  const [assignHomework, { isLoading: isAssigning }] =
    useAssignHomeworkMutation();
  const [sendNotification, { isLoading: isSendingNotification }] =
    useSendNotificationMutation();
  const showLoader = isFocused && isLoading;
  const selectedTypeLabel = getAssignmentTypeLabel(typeFilter).toLowerCase();
  const selectedTypeDisplayLabel = getAssignmentTypeLabel(typeFilter);

  useEffect(() => {
    setSelectedLevel(studentLevel);
    setTypeFilter('homework');
    setSelectedIds(new Set());
  }, [studentId, studentLevel]);

  const filtered = tasks
    .filter(task => {
      return (
        task.id.toLowerCase().includes(search.toLowerCase()) ||
        task.questionId?.toLowerCase().includes(search.toLowerCase()) ||
        task.question.some(question =>
          question.toLowerCase().includes(search.toLowerCase()),
        )
      );
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const hasAvailableTasks = filtered.length > 0;
  const allAvailableSelected =
    hasAvailableTasks && filtered.every(task => selectedIds.has(task.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(filtered.map(task => task.id));
    setSelectedIds(allAvailableSelected ? new Set() : allIds);
  };

  const handleLevelFilterChange = (level: number | null) => {
    setSelectedLevel(level);
    setSelectedIds(new Set());
    setIsLevelPickerOpen(false);
  };

  const handleTypeFilterChange = (type: AssignmentTypeFilter) => {
    setTypeFilter(type);
    setSelectedIds(new Set());
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0 || isAssigning) return;

    if (!studentId) {
      Alert.alert('Error', 'Student ID is missing. Please try again.');
      return;
    }

    const questionIds = Array.from(selectedIds);
    const selectedHomeworkNames = tasks
      .filter(task => selectedIds.has(task.id))
      .map(task => task.questionId ?? task.id);
    const names = selectedHomeworkNames.join(', ');

    try {
      await assignHomework({
        studentId,
        questionIds,
      }).unwrap();

      await sendNotification({
        studentIds: [
          {
            id: studentId,
          },
        ],
        messageHeader: getAssignmentNotificationHeader(typeFilter),
        messageBody: `You've got ${questionIds.length} ${selectedTypeLabel} assignment(s): ${names}`,
      }).unwrap();

      setSelectedIds(new Set());

      Alert.alert(
        'Assignment Confirmed',
        `${selectedTypeDisplayLabel} assigned to ${studentName}:\n${names}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'error' in err
          ? String(err.error)
          : 'Failed to assign homework. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />
      <AdminHeader header="Homework Lab" showBackButton={true} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={showLoader ? [] : filtered}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>
                  Assign Homework to{' '}
                  <Text style={styles.pageTitleAccent}>{studentName}</Text>
                </Text>
              </View>

              <View style={styles.searchFilterRow}>
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${selectedTypeLabel} or questions`}
                    placeholderTextColor="#B0B8C8"
                    value={search}
                    onChangeText={setSearch}
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <MaterialIcons name="close" size={16} color="#94A3B8" />
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
                    color={selectedLevel === null ? '#64748B' : '#4F46E5'}
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

              <View style={styles.typeFilterRow}>
                {(['homework', 'exam'] as AssignmentTypeFilter[]).map(type => {
                  const isSelected = typeFilter === type;
                  const label = getAssignmentTypeLabel(type);
                  const iconName = getAssignmentTypeIcon(type);

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeFilterButton,
                        isSelected && styles.typeFilterButtonActive,
                      ]}
                      onPress={() => handleTypeFilterChange(type)}
                      activeOpacity={0.82}
                    >
                      <MaterialIcons
                        name={iconName}
                        size={17}
                        color={isSelected ? '#2563EB' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.typeFilterText,
                          isSelected && styles.typeFilterTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Available</Text>
                  <Text style={styles.sectionTitle}>
                    {typeFilter === 'exam' ? 'Exams' : 'Tasks'}
                  </Text>
                </View>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeNum}>{filtered.length}</Text>
                  <Text style={styles.totalBadgeLabel}>Total</Text>
                </View>
                <TouchableOpacity
                  onPress={selectAll}
                  style={styles.selectAllBtn}
                  disabled={!hasAvailableTasks}
                >
                  <Text style={styles.selectAllText}>
                    {allAvailableSelected ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TaskRow
              item={item}
              selected={selectedIds.has(item.id)}
              disabled={false}
              onToggle={() => toggleSelect(item.id)}
            />
          )}
          ListEmptyComponent={
            showLoader ? (
              <LoadingState label="Loading tasks..." />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={40} color="#CBD5E0" />
                <Text style={styles.emptyText}>No tasks found</Text>
              </View>
            )
          }
        />

        {selectedIds.size > 0 && (
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>SELECTION</Text>
              <Text style={styles.footerCount}>
                {selectedIds.size} Task{selectedIds.size > 1 ? 's' : ''}{' '}
                Selected
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmBtn, isAssigning && styles.confirmBtnBusy]}
              onPress={handleConfirm}
              disabled={isAssigning}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>
                {isAssigning ? 'Assigning...' : 'Confirm\nAssignment'}
              </Text>
              {!isAssigning && (
                <MaterialIcons
                  name="arrow-forward"
                  size={18}
                  color="#fff"
                  style={styles.confirmIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
              onPress={() => handleLevelFilterChange(null)}
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
                  onPress={() => handleLevelFilterChange(value)}
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
      <LoadingOverlay
        visible={isAssigning || isSendingNotification}
        label="Assigning homework..."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C4B5D6',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  titleSection: { marginBottom: 18 },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 32,
  },
  pageTitleAccent: {
    color: '#4F46E5',
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelFilterButton: {
    height: 44,
    minWidth: 78,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelFilterButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  levelFilterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  levelFilterTextActive: {
    color: '#4F46E5',
  },
  typeFilterRow: {
    flexDirection: 'row',
    marginBottom: 18,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  typeFilterButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
  },
  typeFilterButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  typeFilterText: {
    flexShrink: 1,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
  },
  typeFilterTextActive: {
    color: '#1D4ED8',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1A202C',
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 20,
  },
  totalBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  totalBadgeNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 16,
  },
  totalBadgeLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#C7D2FE',
    letterSpacing: 0.5,
  },
  selectAllBtn: { marginLeft: 'auto' },
  selectAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    textAlign: 'right',
    lineHeight: 15,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskRowSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  taskRowDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.68,
  },
  codePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codePillSelected: {
    backgroundColor: '#4F46E5',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  codeTextSelected: {
    color: '#fff',
  },
  taskContent: { flex: 1 },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 3,
  },
  taskTextDisabled: {
    color: '#64748B',
  },
  assignedBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 3,
  },
  assignedBadgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskLevelText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '700',
  },
  taskDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  checkbox: { marginLeft: 10 },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E0',
  },
  checkboxDisabled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  footerLeft: { flex: 1 },
  footerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  footerCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A202C',
    marginTop: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnBusy: {
    backgroundColor: '#64748B',
  },
  confirmText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  confirmIcon: {
    marginLeft: 6,
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
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
});
