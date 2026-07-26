import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
import { AssignByLevelScreenStyles as styles } from './styles/AssignByLevelScreen.styles';

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
