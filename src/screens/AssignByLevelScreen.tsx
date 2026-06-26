import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  AdminHeader,
  BottomLodeMore,
  EmptyData,
  LoadingOverlay,
} from '../component';
import {
  AssignmentStudentResult,
  AssignHomeworkResult,
  QuestionTask,
  useAssignHomeworkMutation,
  useGetQuestionsQuery,
} from '../store/api';

type AssignmentTypeFilter = 'homework' | 'exam';

const LEVELS = Array.from({ length: 11 }, (_, level) => level);

const getAssignmentTypeLabel = (type: AssignmentTypeFilter) =>
  type === 'exam' ? 'Exam' : 'Homework';

const getAssignmentTypeIcon = (type: AssignmentTypeFilter) =>
  type === 'exam' ? 'fact-check' : 'assignment';

const getStudentLabel = (student: AssignmentStudentResult) =>
  `${student.name || 'Student'}${
    student.studentId ? ` (${student.studentId})` : ''
  }`;

const getQuestionLabels = (
  questions: AssignmentStudentResult['assignedQuestions'],
  fallbackIds: string[],
) => {
  const labels = questions.map(question => question.questionId ?? question.id);
  return labels.length > 0 ? labels : fallbackIds;
};

const QuestionRow = ({
  item,
  selected,
  onToggle,
}: {
  item: QuestionTask;
  selected: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity
    style={[styles.questionRow, selected && styles.questionRowSelected]}
    activeOpacity={0.78}
    onPress={onToggle}
  >
    <View style={[styles.countPill, selected && styles.countPillSelected]}>
      <Text style={[styles.countText, selected && styles.countTextSelected]}>
        {item.question.length}
      </Text>
    </View>
    <View style={styles.questionContent}>
      <Text style={styles.questionTitle}>{item.questionId ?? item.id}</Text>
      <View style={styles.questionMetaRow}>
        <MaterialIcons name="school" size={13} color="#4F46E5" />
        <Text style={styles.questionMetaText}>
          Level {typeof item.level === 'number' ? item.level : '-'}
        </Text>
      </View>
    </View>
    <View style={styles.checkbox}>
      {selected ? (
        <View style={styles.checkboxChecked}>
          <MaterialIcons name="check" size={14} color="#FFFFFF" />
        </View>
      ) : (
        <View style={styles.checkboxUnchecked} />
      )}
    </View>
  </TouchableOpacity>
);

export default function AssignByLevelScreen() {
  const isFocused = useIsFocused();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] =
    useState<AssignmentTypeFilter>('homework');
  const [page, setPage] = useState(1);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set());
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const [assignmentResult, setAssignmentResult] =
    useState<AssignHomeworkResult | null>(null);

  const cleanSearch = search.trim();
  const {
    data: questionsData,
    isLoading,
    isFetching,
  } = useGetQuestionsQuery(
    {
      type: typeFilter,
      ...(cleanSearch.length > 0 ? { search: cleanSearch } : {}),
      page,
    },
    {
      skip: !isFocused,
    },
  );
  const [assignHomework, { isLoading: isAssigning }] =
    useAssignHomeworkMutation();
  useEffect(() => {
    setPage(1);
  }, [typeFilter, cleanSearch]);

  const questions = useMemo(
    () => questionsData?.questions ?? [],
    [questionsData?.questions],
  );
  const hasMorePages = questionsData?.meta.hasNextPage === true;
  const isLoadingMore = isFetching && !isLoading && page > 1;

  const filteredQuestions = useMemo(() => {
    const searchText = cleanSearch.toLowerCase();

    return questions.filter(question => {
      if (searchText.length === 0) return true;

      return (
        question.id.toLowerCase().includes(searchText) ||
        question.questionId?.toLowerCase().includes(searchText) ||
        question.question.some(item =>
          item.toLowerCase().includes(searchText),
        ) ||
        String(question.level ?? '').includes(searchText)
      );
    });
    // .sort((a, b) =>
    //   (a.questionId ?? a.id).localeCompare(b.questionId ?? b.id),
    // );
  }, [cleanSearch, questions]);

  const hasQuestions = filteredQuestions.length > 0;
  const allQuestionsSelected =
    hasQuestions &&
    filteredQuestions.every(question => selectedQuestionIds.has(question.id));
  const selectedTypeLabel = getAssignmentTypeLabel(typeFilter).toLowerCase();
  const canAssign = selectedQuestionIds.size > 0 && selectedLevels.size > 0;
  const showLoader = isFocused && isLoading && questions.length === 0;
  const selectedLevelList = useMemo(
    () => Array.from(selectedLevels).sort((a, b) => a - b),
    [selectedLevels],
  );
  const selectedLevelLabel =
    selectedLevelList.length === 0
      ? 'Select levels'
      : selectedLevelList.length <= 4
      ? selectedLevelList.map(level => `L${level}`).join(', ')
      : `${selectedLevelList.length} levels selected`;
  const newlyAssignedStudents = assignmentResult
    ? assignmentResult.students.filter(
        student => student.assignedQuestionIds.length > 0,
      )
    : [];
  const alreadyAssignedStudents = assignmentResult
    ? assignmentResult.students.filter(
        student => student.skippedQuestionIds.length > 0,
      )
    : [];

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLevel = (level: number) => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const toggleAllQuestions = () => {
    setSelectedQuestionIds(
      allQuestionsSelected
        ? new Set()
        : new Set(filteredQuestions.map(question => question.id)),
    );
  };

  const handleTypeChange = (type: AssignmentTypeFilter) => {
    setTypeFilter(type);
    setSelectedQuestionIds(new Set());
    setPage(1);
  };

  const onReachBottom = () => {
    if (!showLoader && !isLoadingMore && hasMorePages) {
      setPage(prev => prev + 1);
    }
  };

  const handleAssign = async () => {
    if (!canAssign || isAssigning) return;

    const questionIds = Array.from(selectedQuestionIds);
    const levels = Array.from(selectedLevels).sort((a, b) => a - b);

    try {
      const result = await assignHomework({
        questionIds,
        levels,
      }).unwrap();

      setSelectedQuestionIds(new Set());
      setSelectedLevels(new Set());
      setAssignmentResult(result);
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'error' in err
          ? String(err.error)
          : 'Failed to assign questions. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F8" />
      <AdminHeader header="Assign by Level" />

      <FlatList
        data={showLoader ? [] : filteredQuestions}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={onReachBottom}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${selectedTypeLabel} questions`}
                placeholderTextColor="#A0AEC0"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialIcons name="close" size={17} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.typeFilterRow}>
              {(['homework', 'exam'] as AssignmentTypeFilter[]).map(type => {
                const isSelected = typeFilter === type;

                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeFilterButton,
                      isSelected && styles.typeFilterButtonActive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => handleTypeChange(type)}
                  >
                    <MaterialIcons
                      name={getAssignmentTypeIcon(type)}
                      size={17}
                      color={isSelected ? '#2563EB' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.typeFilterText,
                        isSelected && styles.typeFilterTextActive,
                      ]}
                    >
                      {getAssignmentTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.levelSection}>
              <Text style={styles.sectionTitle}>Student Levels</Text>
              <TouchableOpacity
                style={styles.multiSelectButton}
                activeOpacity={0.84}
                onPress={() => setIsLevelPickerOpen(true)}
              >
                <View style={styles.multiSelectIconBox}>
                  <MaterialIcons name="groups" size={18} color="#4F46E5" />
                </View>
                <View style={styles.multiSelectCopy}>
                  <Text
                    style={[
                      styles.multiSelectValue,
                      selectedLevelList.length === 0 &&
                        styles.multiSelectPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedLevelLabel}
                  </Text>
                  <Text style={styles.multiSelectHint}>
                    {selectedLevelList.length === 0
                      ? 'Choose one or more student levels'
                      : 'Tap to edit selected levels'}
                  </Text>
                </View>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={22}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Questions</Text>
                <Text style={styles.sectionMeta}>
                  {filteredQuestions.length} total
                </Text>
              </View>
              <TouchableOpacity
                style={styles.selectAllButton}
                activeOpacity={0.82}
                onPress={toggleAllQuestions}
                disabled={!hasQuestions}
              >
                <Text style={styles.selectAllText}>
                  {allQuestionsSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <QuestionRow
            item={item}
            selected={selectedQuestionIds.has(item.id)}
            onToggle={() => toggleQuestion(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyData
            showLoader={showLoader}
            loadingMessage="Loading questions..."
            emptyTitle="No questions found"
            emptyText=""
            icon="search-off"
          />
        }
        ListFooterComponent={
          <BottomLodeMore loading={questionsData?.meta.hasNextPage} />
        }
      />

      {canAssign && (
        <View style={styles.footer}>
          <View style={styles.footerCopy}>
            <Text style={styles.footerLabel}>READY</Text>
            <Text style={styles.footerText}>
              {selectedQuestionIds.size} question
              {selectedQuestionIds.size > 1 ? 's' : ''} to {selectedLevels.size}{' '}
              level{selectedLevels.size > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.assignButton,
              isAssigning && styles.assignButtonBusy,
            ]}
            activeOpacity={0.86}
            onPress={handleAssign}
            disabled={isAssigning}
          >
            <Text style={styles.assignButtonText}>
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Text>
            {!isAssigning && (
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}

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
              <View>
                <Text style={styles.levelModalTitle}>Select Levels</Text>
                <Text style={styles.levelModalSubtitle}>
                  {selectedLevelList.length} selected
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsLevelPickerOpen(false)}
              >
                <MaterialIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={styles.levelOptionGrid}>
              {LEVELS.map(level => {
                const isSelected = selectedLevels.has(level);

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelOption,
                      isSelected && styles.levelOptionSelected,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => toggleLevel(level)}
                  >
                    <Text
                      style={[
                        styles.levelOptionText,
                        isSelected && styles.levelOptionTextSelected,
                      ]}
                    >
                      Level {level}
                    </Text>
                    {isSelected ? (
                      <MaterialIcons
                        name="check-circle"
                        size={18}
                        color="#4F46E5"
                      />
                    ) : (
                      <View style={styles.levelOptionEmpty} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.levelModalActions}>
              <TouchableOpacity
                style={styles.levelClearButton}
                activeOpacity={0.82}
                onPress={() => setSelectedLevels(new Set())}
              >
                <Text style={styles.levelClearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.levelDoneButton}
                activeOpacity={0.86}
                onPress={() => setIsLevelPickerOpen(false)}
              >
                <Text style={styles.levelDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={assignmentResult !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignmentResult(null)}
      >
        <View style={styles.resultModalBackdrop}>
          <View style={styles.resultModal}>
            <View style={styles.resultModalHeader}>
              <View style={styles.resultTitleRow}>
                <View style={styles.resultIconBox}>
                  <MaterialIcons
                    name="assignment-turned-in"
                    size={20}
                    color="#15803D"
                  />
                </View>
                <View style={styles.resultTitleCopy}>
                  <Text style={styles.resultModalTitle}>
                    Assignment Details
                  </Text>
                  <Text style={styles.resultModalSubtitle}>
                    {assignmentResult?.message ?? 'Questions assigned'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setAssignmentResult(null)}
              >
                <MaterialIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>
                  {newlyAssignedStudents.length}
                </Text>
                <Text style={styles.resultStatLabel}>New students</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>
                  {alreadyAssignedStudents.length}
                </Text>
                <Text style={styles.resultStatLabel}>Already assigned</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>
                  {assignmentResult?.notifications?.sentCount ?? 0}
                </Text>
                <Text style={styles.resultStatLabel}>Notified</Text>
              </View>
            </View>
            <Text style={styles.resultCountSummary}>
              {assignmentResult?.assignedCount ?? 0} question assignment
              {(assignmentResult?.assignedCount ?? 0) === 1
                ? ''
                : 's'} added, {assignmentResult?.skippedCount ?? 0} already
              existed.
            </Text>

            <ScrollView
              style={styles.resultScroll}
              contentContainerStyle={styles.resultScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>
                  Now assigned to {newlyAssignedStudents.length} student
                  {newlyAssignedStudents.length === 1 ? '' : 's'}
                </Text>
                {newlyAssignedStudents.length > 0 ? (
                  newlyAssignedStudents.map(student => {
                    const labels = getQuestionLabels(
                      student.assignedQuestions,
                      student.assignedQuestionIds,
                    );

                    return (
                      <View
                        key={`assigned-${student.id}`}
                        style={styles.resultStudentRow}
                      >
                        <View style={styles.resultStudentTop}>
                          <Text style={styles.resultStudentName}>
                            {getStudentLabel(student)}
                          </Text>
                          <Text style={styles.resultStudentLevel}>
                            Level{' '}
                            {typeof student.level === 'number'
                              ? student.level
                              : '-'}
                          </Text>
                        </View>
                        <Text style={styles.resultQuestionText}>
                          {labels.join(', ')}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.resultEmptyText}>
                    No new students received these questions.
                  </Text>
                )}
              </View>

              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>
                  Already assigned for {alreadyAssignedStudents.length} student
                  {alreadyAssignedStudents.length === 1 ? '' : 's'}
                </Text>
                {alreadyAssignedStudents.length > 0 ? (
                  alreadyAssignedStudents.map(student => {
                    const labels = getQuestionLabels(
                      student.skippedQuestions,
                      student.skippedQuestionIds,
                    );

                    return (
                      <View
                        key={`skipped-${student.id}`}
                        style={styles.resultStudentRow}
                      >
                        <View style={styles.resultStudentTop}>
                          <Text style={styles.resultStudentName}>
                            {getStudentLabel(student)}
                          </Text>
                          <Text style={styles.resultStudentLevel}>
                            Level{' '}
                            {typeof student.level === 'number'
                              ? student.level
                              : '-'}
                          </Text>
                        </View>
                        <Text style={styles.resultQuestionText}>
                          {labels.join(', ')}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.resultEmptyText}>
                    No duplicate assignments were found.
                  </Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.resultDoneButton}
              activeOpacity={0.86}
              onPress={() => setAssignmentResult(null)}
            >
              <Text style={styles.resultDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={isAssigning} label="Assigning questions..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF0F8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  searchBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    fontSize: 14,
    color: '#1E293B',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  typeFilterButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  typeFilterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
  },
  typeFilterTextActive: {
    color: '#1D4ED8',
  },
  levelSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#1A202C',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  multiSelectButton: {
    marginTop: 10,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  multiSelectIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiSelectCopy: {
    flex: 1,
    minWidth: 0,
  },
  multiSelectValue: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  multiSelectPlaceholder: {
    color: '#94A3B8',
  },
  multiSelectHint: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectAllButton: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '900',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  questionRowSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  countPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  countPillSelected: {
    backgroundColor: '#4F46E5',
  },
  countText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
  questionContent: {
    flex: 1,
    minWidth: 0,
  },
  questionTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  questionMetaText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
  },
  checkbox: {
    marginLeft: 10,
  },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
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
    paddingTop: 44,
    gap: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  footerCopy: {
    flex: 1,
  },
  footerLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footerText: {
    color: '#1A202C',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  assignButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  assignButtonBusy: {
    backgroundColor: '#64748B',
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
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
    maxWidth: 360,
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
    marginBottom: 14,
  },
  levelModalTitle: {
    color: '#1A202C',
    fontSize: 17,
    fontWeight: '900',
  },
  levelModalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOptionGrid: {
    gap: 8,
  },
  levelOption: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  levelOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  levelOptionText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '900',
  },
  levelOptionTextSelected: {
    color: '#4F46E5',
  },
  levelOptionEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  levelModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  levelClearButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelClearText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
  },
  levelDoneButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  resultModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  resultModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '84%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  resultModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  resultTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  resultModalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  resultModalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  resultStat: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  resultStatValue: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '900',
  },
  resultStatLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  resultCountSummary: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 14,
  },
  resultScroll: {
    maxHeight: 390,
  },
  resultScrollContent: {
    paddingBottom: 4,
    gap: 14,
  },
  resultSection: {
    gap: 8,
  },
  resultSectionTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  resultStudentRow: {
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  resultStudentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  resultStudentName: {
    flex: 1,
    minWidth: 0,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  resultStudentLevel: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '900',
  },
  resultQuestionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  resultEmptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 4,
  },
  resultDoneButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  resultDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
