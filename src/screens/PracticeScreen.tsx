import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { AdminHeader, LoadingState, StudentHeader } from '../component';
import {
  QuestionTask,
  useAssignPracticeQuestionsMutation,
  useGetHomeworksQuery,
  useGetPracticeQuestionsQuery,
  useUnassignPracticeQuestionsMutation,
} from '../store/api';
import { setQuestions } from '../store/slices';
import { RootState } from '../store/store';
import { HomeworkState } from '../util/enum';
import { BadgeType } from '../util/types';

type PracticeFilter = BadgeType | 'QUESTIONS';

interface PracticeCardProps {
  questionId: string;
  questionLabel?: string;
  homeworkId: string;
  question: string[];
  marks?: number[];
  state: BadgeType;
  result: boolean[];
  answer: number[];
  timer: number;
  oral: boolean;
  updatedAt?: string;
  isUnassigning?: boolean;
  onUnassign?: (questionId: string) => void;
}

const FILTERS: { label: string; value: PracticeFilter }[] = [
  { label: 'New', value: HomeworkState.NEW },
  { label: 'In Progress', value: HomeworkState.PROGRESS },
  { label: 'Completed', value: HomeworkState.COMPLETED },
  { label: 'Questions', value: 'QUESTIONS' },
];

const formatUpdatedTime = (dateValue?: string) => {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatTime = (seconds: number = 0) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
};

function PracticeCard({
  homeworkId,
  questionId,
  questionLabel,
  question,
  marks,
  state,
  result,
  answer,
  timer = 0,
  oral,
  updatedAt,
  isUnassigning = false,
  onUnassign,
}: PracticeCardProps) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const correctCount = result.filter(Boolean).length;
  const updatedTime = formatUpdatedTime(updatedAt);
  const hasMarks = Array.isArray(marks) && marks.length > 0;
  const totalMarks = hasMarks
    ? marks.reduce((total, mark) => total + mark, 0)
    : 0;
  const earnedMarks = hasMarks
    ? result.reduce((total, isCorrect, index) => {
        return total + (isCorrect ? marks[index] ?? 0 : 0);
      }, 0)
    : 0;

  const handleAttend = () => {
    dispatch(
      setQuestions({
        questions: question,
        marks,
        homeworkId,
        result,
        answer,
        questionId: questionLabel ?? questionId,
        timer,
        oral,
      }),
    );

    if (state === HomeworkState.COMPLETED) {
      navigation.navigate('QuizReview', {
        returnRouteName: 'PracticeScreen',
      });
      return;
    }

    navigation.navigate('Calculate', {
      returnRouteName: 'PracticeScreen',
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle}>{questionLabel ?? questionId}</Text>
          {state === HomeworkState.COMPLETED ? (
            <View>
              <View style={styles.completedCorrectRow}>
                <MaterialIcons name="check-circle" size={14} color="#22C55E" />
                <Text style={styles.questionCount}>
                  {hasMarks
                    ? `${earnedMarks}/${totalMarks} marks`
                    : `${correctCount}/${question.length} correct`}
                </Text>
              </View>
              <View style={styles.completedMetaRow}>
                {updatedTime.length > 0 && (
                  <Text style={styles.updatedText}>{updatedTime}</Text>
                )}
                <Text style={styles.timeText}>{formatTime(timer)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.questionRow}>
              <MaterialIcons name="assignment" size={14} color="#94A3B8" />
              <Text style={styles.questionCount}>
                {result.length}/{question.length} questions
              </Text>
              {updatedTime.length > 0 && (
                <Text style={styles.updatedText}>{updatedTime}</Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.attendBtn}
            activeOpacity={0.85}
            onPress={handleAttend}
          >
            <Text style={styles.attendBtnText}>
              {state !== HomeworkState.COMPLETED ? 'Attend' : 'View'}
            </Text>
          </TouchableOpacity>
          {state === HomeworkState.NEW && onUnassign && (
            <TouchableOpacity
              style={[styles.unassignBtn, isUnassigning && styles.disabledButton]}
              activeOpacity={0.85}
              onPress={() => onUnassign(questionId)}
              disabled={isUnassigning}
            >
              <Text style={styles.unassignBtnText}>
                {isUnassigning ? 'Removing' : 'Unassign'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(result.length / Math.max(question.length, 1)) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

function PracticeQuestionCard({
  item,
  isAssigning,
  onAssign,
}: {
  item: QuestionTask;
  isAssigning: boolean;
  onAssign: (questionId: string) => void;
}) {
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionCardHeader}>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle}>{item.questionId ?? item.id}</Text>
          <View style={styles.questionMetaRow}>
            <Text style={styles.levelPill}>Level {item.level ?? '-'}</Text>
            <Text style={styles.questionCount}>
              {item.question.length} questions
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.assignBtn, isAssigning && styles.disabledButton]}
          activeOpacity={0.85}
          onPress={() => onAssign(item.id)}
          disabled={isAssigning}
        >
          <MaterialIcons name="add-task" size={17} color="#FFFFFF" />
          <Text style={styles.assignBtnText}>Assign</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PracticeScreen() {
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const routeStudentId = route?.params?.studentId;
  const studentName = route?.params?.studentName;
  const isAdminReview = route?.params?.adminReview === true;
  const loggedInStudentId = useSelector(
    (state: RootState) => state.common.studentId,
  );
  const loggedInStudentLevel = useSelector(
    (state: RootState) => state.common.studentLevel,
  );
  const studentId = isAdminReview ? routeStudentId : loggedInStudentId;
  const defaultLevel =
    !isAdminReview && typeof loggedInStudentLevel === 'number'
      ? loggedInStudentLevel
      : null;
  const hasAppliedDefaultLevel = useRef(defaultLevel !== null);
  const [selectedFilter, setSelectedFilter] = useState<PracticeFilter>(
    isAdminReview ? HomeworkState.COMPLETED : HomeworkState.NEW,
  );
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(
    defaultLevel,
  );
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningQuestionId, setAssigningQuestionId] = useState<string | null>(
    null,
  );
  const [unassigningQuestionId, setUnassigningQuestionId] = useState<
    string | null
  >(null);
  const isQuestionsTab = selectedFilter === 'QUESTIONS';

  useEffect(() => {
    if (
      hasAppliedDefaultLevel.current ||
      isAdminReview ||
      typeof loggedInStudentLevel !== 'number'
    ) {
      return;
    }

    setSelectedLevel(loggedInStudentLevel);
    hasAppliedDefaultLevel.current = true;
  }, [isAdminReview, loggedInStudentLevel]);

  const {
    data: homeworks,
    isLoading: isHomeworksLoading,
    isFetching: isHomeworksFetching,
    refetch: refetchHomeworks,
  } = useGetHomeworksQuery(
    {
      studentId: studentId ?? '',
      state: isQuestionsTab ? HomeworkState.NEW : selectedFilter,
      type: 'practice',
    },
    {
      skip: !isFocused || !studentId || isQuestionsTab,
    },
  );

  const cleanSearch = search.trim();
  const {
    data: practiceQuestions,
    isLoading: isQuestionsLoading,
    isFetching: isQuestionsFetching,
    refetch: refetchQuestions,
  } = useGetPracticeQuestionsQuery(
    {
      ...(typeof selectedLevel === 'number' ? { level: selectedLevel } : {}),
      ...(cleanSearch.length > 0 ? { search: cleanSearch } : {}),
    },
    {
      skip: !isFocused || !isQuestionsTab,
    },
  );
  const [assignPracticeQuestions] = useAssignPracticeQuestionsMutation();
  const [unassignPracticeQuestions] = useUnassignPracticeQuestionsMutation();

  const filteredQuestions = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return (practiceQuestions ?? []).filter(question => {
      const matchesLevel =
        selectedLevel === null || Number(question.level) === selectedLevel;
      const questionText = question.question.join(' ').toLowerCase();
      const matchesSearch =
        searchText.length === 0 ||
        question.questionId?.toLowerCase().includes(searchText) ||
        questionText.includes(searchText) ||
        String(question.level ?? '').includes(searchText);

      return matchesLevel && matchesSearch;
    });
  }, [practiceQuestions, search, selectedLevel]);

  const showLoader =
    isFocused &&
    !refreshing &&
    (isQuestionsTab
      ? isQuestionsLoading || isQuestionsFetching
      : isHomeworksLoading || isHomeworksFetching);
  const filteredHomeworks = homeworks ?? [];

  const onRefresh = useCallback(async () => {
    if (!studentId && !isQuestionsTab) return;

    setRefreshing(true);
    try {
      if (isQuestionsTab) {
        await refetchQuestions();
      } else {
        await refetchHomeworks();
      }
    } finally {
      setRefreshing(false);
    }
  }, [isQuestionsTab, refetchHomeworks, refetchQuestions, studentId]);

  const handleAssignQuestion = async (questionId: string) => {
    if (!studentId) return;

    setAssigningQuestionId(questionId);
    try {
      await assignPracticeQuestions({
        questionIds: [questionId],
        studentId,
      }).unwrap();
      Alert.alert('Practice Assigned', 'The question is added to your practice.');
      setSelectedFilter(HomeworkState.NEW);
    } catch {
      Alert.alert('Assign Failed', 'Unable to assign this practice question.');
    } finally {
      setAssigningQuestionId(null);
    }
  };

  const handleUnassignQuestion = (questionId: string) => {
    if (!studentId || unassigningQuestionId) return;

    Alert.alert(
      'Unassign Practice?',
      'This will remove the question from the New practice list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            setUnassigningQuestionId(questionId);
            try {
              await unassignPracticeQuestions({
                questionIds: [questionId],
                studentId,
              }).unwrap();
              Alert.alert('Practice Unassigned', 'The question was removed.');
            } catch {
              Alert.alert(
                'Unassign Failed',
                'Unable to remove this practice question.',
              );
            } finally {
              setUnassigningQuestionId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      {isAdminReview ? (
        <AdminHeader
          header={`${studentName ?? 'Student'} Practice`}
          showBackButton={true}
          headerBackgroundColor="#EEF2FF"
        />
      ) : (
        <StudentHeader header="Practice" headerBackgroundColor="#EEF2FF" />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
            progressBackgroundColor="#EEF2FF"
          />
        }
      >
        <View style={styles.filterBar}>
          {FILTERS.map(filter => {
            const isSelected = selectedFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterButton,
                  isSelected && styles.filterButtonActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    isSelected && styles.filterButtonTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isQuestionsTab && (
          <View style={styles.questionFilters}>
            <View style={styles.searchWrapper}>
              <MaterialIcons name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search questions..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialIcons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.levelFilterButton,
                selectedLevel !== null && styles.levelFilterButtonActive,
              ]}
              activeOpacity={0.82}
              onPress={() => setIsLevelPickerOpen(true)}
            >
              <MaterialIcons name="filter-list" size={18} color="#64748B" />
              <Text style={styles.levelFilterText}>
                {selectedLevel === null ? 'All' : `L${selectedLevel}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showLoader && (
          <LoadingState
            label={isQuestionsTab ? 'Loading questions...' : 'Loading practice...'}
          />
        )}

        {!showLoader &&
          !isQuestionsTab &&
          filteredHomeworks.map(task => (
            <PracticeCard
              key={task.id}
              {...task}
              homeworkId={task.id}
              question={task?.question?.question ?? []}
              marks={task?.question?.marks}
              isUnassigning={unassigningQuestionId === task.questionId}
              onUnassign={handleUnassignQuestion}
            />
          ))}

        {!showLoader && isQuestionsTab && (
          <FlatList
            data={filteredQuestions}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <PracticeQuestionCard
                item={item}
                isAssigning={assigningQuestionId === item.id}
                onAssign={handleAssignQuestion}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No practice questions found</Text>
              </View>
            }
          />
        )}

        {!showLoader && !isQuestionsTab && filteredHomeworks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No {selectedFilter.toLowerCase()} practice
            </Text>
            {!isAdminReview && selectedFilter === HomeworkState.NEW && (
              <TouchableOpacity
                style={styles.emptyAction}
                activeOpacity={0.85}
                onPress={() => setSelectedFilter('QUESTIONS')}
              >
                <Text style={styles.emptyActionText}>Find Questions</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

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
              activeOpacity={0.82}
              onPress={() => {
                setSelectedLevel(null);
                setIsLevelPickerOpen(false);
              }}
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
                  activeOpacity={0.82}
                  onPress={() => {
                    setSelectedLevel(value);
                    setIsLevelPickerOpen(false);
                  }}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  filterButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  questionFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  searchWrapper: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    fontSize: 14,
    color: '#1E293B',
  },
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
  },
  levelFilterButtonActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  levelFilterText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  emptyAction: {
    marginTop: 14,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#93C5FD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  questionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 14,
  },
  completedCorrectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelPill: {
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  questionCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  updatedText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    marginTop: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 99,
  },
  attendBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3A8A',
    minWidth: 68,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  attendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  unassignBtn: {
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  unassignBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },
  assignBtn: {
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  assignBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
