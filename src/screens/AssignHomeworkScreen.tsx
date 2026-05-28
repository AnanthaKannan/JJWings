import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { LoadingState } from '../component';
import {
  useAssignHomeworkMutation,
  useGetAvailableQuestionsQuery,
  useGetHomeworksQuery,
  useGetQuestionsQuery,
} from '../store/api';
import { HomeworkState } from '../util/enum';

type Task = {
  id: string;
  questionId?: string;
  question: string[];
};

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
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const studentName = route?.params?.studentName ?? 'Student';
  const studentId = route?.params?.studentId;
  const showAssignedOnly = route?.params?.showAssigned === true;
  const { data: allTasks = [], isLoading: isLoadingAllTasks } =
    useGetQuestionsQuery(undefined, {
      skip: !isFocused || !showAssignedOnly,
      refetchOnMountOrArgChange: true,
    });
  const { data: availableTasks = [], isLoading: isLoadingAvailableTasks } =
    useGetAvailableQuestionsQuery(
      { studentId: studentId ?? '' },
      {
        skip: !isFocused || !studentId || showAssignedOnly,
        refetchOnMountOrArgChange: true,
      },
    );
  const tasks = showAssignedOnly ? allTasks : availableTasks;
  const isLoading = showAssignedOnly
    ? isLoadingAllTasks
    : isLoadingAvailableTasks;
  const {
    data: newHomeworks = [],
    isLoading: isLoadingNewHomeworks,
    refetch: refetchNewHomeworks,
  } =
    useGetHomeworksQuery(
      { studentId: studentId ?? '', state: HomeworkState.NEW },
      {
        skip: !isFocused || !studentId,
        refetchOnMountOrArgChange: true,
      },
    );
  const {
    data: progressHomeworks = [],
    isLoading: isLoadingProgressHomeworks,
    refetch: refetchProgressHomeworks,
  } =
    useGetHomeworksQuery(
      { studentId: studentId ?? '', state: HomeworkState.PROGRESS },
      {
        skip: !isFocused || !studentId,
        refetchOnMountOrArgChange: true,
      },
    );
  const {
    data: completedHomeworks = [],
    isLoading: isLoadingCompletedHomeworks,
    refetch: refetchCompletedHomeworks,
  } =
    useGetHomeworksQuery(
      { studentId: studentId ?? '', state: HomeworkState.COMPLETED },
      {
        skip: !isFocused || !studentId,
        refetchOnMountOrArgChange: true,
      },
    );
  const [assignHomework, { isLoading: isAssigning }] =
    useAssignHomeworkMutation();
  const isLoadingAssignments =
    isLoadingNewHomeworks ||
    isLoadingProgressHomeworks ||
    isLoadingCompletedHomeworks;
  const showLoader = isFocused && (isLoading || isLoadingAssignments);
  const assignedQuestionIds = new Set(
    [...newHomeworks, ...progressHomeworks, ...completedHomeworks].map(
      homework => homework.questionId,
    ),
  );

  const filtered = tasks
    .filter(task => {
      if (showAssignedOnly && !assignedQuestionIds.has(task.id)) return false;

      return (
        task.id.toLowerCase().includes(search.toLowerCase()) ||
        task.questionId?.toLowerCase().includes(search.toLowerCase()) ||
        task.question.some(question =>
          question.toLowerCase().includes(search.toLowerCase()),
        )
      );
    })
    .sort((a, b) => {
      const aAssigned = assignedQuestionIds.has(a.id);
      const bAssigned = assignedQuestionIds.has(b.id);

      if (aAssigned === bAssigned) return a.id.localeCompare(b.id);
      return aAssigned ? 1 : -1;
    });
  const availableFilteredTasks = filtered.filter(
    task => !assignedQuestionIds.has(task.id),
  );
  const hasAvailableTasks = availableFilteredTasks.length > 0;
  const allAvailableSelected =
    hasAvailableTasks &&
    availableFilteredTasks.every(task => selectedIds.has(task.id));

  const toggleSelect = (id: string) => {
    if (showAssignedOnly) return;
    if (assignedQuestionIds.has(id)) return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (showAssignedOnly) return;

    const allIds = new Set(availableFilteredTasks.map(task => task.id));
    setSelectedIds(allAvailableSelected ? new Set() : allIds);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0 || isAssigning) return;

    if (!studentId) {
      Alert.alert('Error', 'Student ID is missing. Please try again.');
      return;
    }

    const questionIds = Array.from(selectedIds);
    const names = tasks
      .filter(task => selectedIds.has(task.id))
      .map(task => task.questionId ?? task.id)
      .join(', ');

    try {
      await Promise.all(
        questionIds.map(questionId =>
          assignHomework({
            studentId,
            questionId,
          }).unwrap(),
        ),
      );
      await Promise.all([
        refetchNewHomeworks(),
        refetchProgressHomeworks(),
        refetchCompletedHomeworks(),
      ]);
      setSelectedIds(new Set());

      Alert.alert(
        'Assignment Confirmed',
        `Assigned to ${studentName}:\n${names}`,
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

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homework Lab</Text>
        <View style={styles.avatar} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
                  {showAssignedOnly
                    ? 'Assigned Homework for '
                    : 'Assign Homework to '}
                  <Text style={styles.pageTitleAccent}>{studentName}</Text>
                </Text>
              </View>

              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search tasks or questions"
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

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {showAssignedOnly ? 'Assigned' : 'Available'}
                  </Text>
                  <Text style={styles.sectionTitle}>Tasks</Text>
                </View>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeNum}>{filtered.length}</Text>
                  <Text style={styles.totalBadgeLabel}>Total</Text>
                </View>
                <TouchableOpacity
                  onPress={selectAll}
                  style={styles.selectAllBtn}
                  disabled={showAssignedOnly || !hasAvailableTasks}
                >
                  <Text style={styles.selectAllText}>
                    {showAssignedOnly
                      ? 'Assigned'
                      : allAvailableSelected
                      ? 'Deselect All'
                      : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TaskRow
              item={item}
              selected={selectedIds.has(item.id)}
              disabled={showAssignedOnly || assignedQuestionIds.has(item.id)}
              onToggle={() => toggleSelect(item.id)}
            />
          )}
          ListEmptyComponent={
            showLoader ? (
              <LoadingState label="Loading tasks..." />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={40} color="#CBD5E0" />
                <Text style={styles.emptyText}>
                  {showAssignedOnly ? 'No assigned homework found' : 'No tasks found'}
                </Text>
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
                  style={{ marginLeft: 6 }}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
});
