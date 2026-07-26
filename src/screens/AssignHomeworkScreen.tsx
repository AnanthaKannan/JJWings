import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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

import {
  AdminHeader,
  BottomLodeMore,
  EmptyData,
  LoadingOverlay,
} from '../component';
import {
  useAssignHomeworkMutation,
  useGetAvailableQuestionsQuery,
} from '../store/api';
import { AssignHomeworkScreenStyles as styles } from './styles/AssignHomeworkScreen.styles';

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
  const [page, setPage] = useState(1);
  const {
    data: tasksData,
    isLoading,
    isFetching,
  } = useGetAvailableQuestionsQuery(
    {
      studentId: studentId ?? '',
      type: typeFilter,
      ...(selectedLevel === null ? {} : { level: selectedLevel }),
      page,
    },
    {
      skip: !isFocused || !studentId,
    },
  );
  const [assignHomework, { isLoading: isAssigning }] =
    useAssignHomeworkMutation();
  const showLoader = isFocused && isLoading;
  const selectedTypeLabel = getAssignmentTypeLabel(typeFilter).toLowerCase();
  const selectedTypeDisplayLabel = getAssignmentTypeLabel(typeFilter);
  const tasks = tasksData?.questions ?? [];
  const hasMorePages = tasksData?.meta.hasNextPage === true;
  const isLoadingMore = isFetching && !isLoading && page > 1;

  useEffect(() => {
    setSelectedLevel(studentLevel);
    setTypeFilter('homework');
    setSelectedIds(new Set());
    setPage(1);
  }, [studentId, studentLevel]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, selectedLevel]);

  const filtered = tasks.filter(task => {
    return (
      task.id.toLowerCase().includes(search.toLowerCase()) ||
      task.questionId?.toLowerCase().includes(search.toLowerCase()) ||
      task.question.some(question =>
        question.toLowerCase().includes(search.toLowerCase()),
      )
    );
  });
  // .sort((a, b) => a.id.localeCompare(b.id));
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
    setPage(1);
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
          onEndReached={() => {
            if (!showLoader && !isLoadingMore && hasMorePages) {
              setPage(prev => prev + 1);
            }
          }}
          onEndReachedThreshold={0.2}
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
                  <Text style={styles.totalBadgeNum}>
                    {tasksData?.meta?.total ?? 0}
                  </Text>
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
            <EmptyData
              showLoader={showLoader}
              loadingMessage="Loading tasks..."
              emptyTitle="No questions found"
              emptyText=""
              icon="search-off"
            />
          }
          ListFooterComponent={<BottomLodeMore loading={hasMorePages} />}
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
      <LoadingOverlay visible={isAssigning} label="Assigning homework..." />
    </SafeAreaView>
  );
}
