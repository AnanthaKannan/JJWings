import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
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
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  AdminHeader,
  BottomLodeMore,
  LoadingState,
  StudentHeader,
} from '../component';
import {
  Homework,
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
import { PracticeScreenStyles as styles } from './styles/PracticeScreen.styles';

type PracticeFilter = BadgeType | 'QUESTIONS';
type PracticeListItem = Homework | QuestionTask;

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
              style={[
                styles.unassignBtn,
                isUnassigning && styles.disabledButton,
              ]}
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
            {
              width: `${(result.length / Math.max(question.length, 1)) * 100}%`,
            },
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
  const [page, setPage] = useState(1);
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
    data: homeworksData,
    isLoading: isHomeworksLoading,
    isFetching: isHomeworksFetching,
    refetch: refetchHomeworks,
  } = useGetHomeworksQuery(
    {
      studentId: studentId ?? '',
      state: isQuestionsTab ? HomeworkState.NEW : selectedFilter,
      type: 'practice',
      page,
    },
    {
      skip: !isFocused || !studentId || isQuestionsTab,
    },
  );

  const cleanSearch = search.trim();
  const {
    data: practiceQuestionsData,
    isLoading: isQuestionsLoading,
    isFetching: isQuestionsFetching,
    refetch: refetchQuestions,
  } = useGetPracticeQuestionsQuery(
    {
      ...(typeof selectedLevel === 'number' ? { level: selectedLevel } : {}),
      ...(cleanSearch.length > 0 ? { search: cleanSearch } : {}),
      page,
    },
    {
      skip: !isFocused || !isQuestionsTab,
    },
  );
  const [assignPracticeQuestions] = useAssignPracticeQuestionsMutation();
  const [unassignPracticeQuestions] = useUnassignPracticeQuestionsMutation();
  const practiceQuestions = useMemo(
    () => practiceQuestionsData?.questions ?? [],
    [practiceQuestionsData?.questions],
  );

  const filteredQuestions = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return practiceQuestions.filter(question => {
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
    (isQuestionsTab ? isQuestionsLoading : isHomeworksLoading);
  const filteredHomeworks = homeworksData?.homeworks ?? [];
  const activeMeta = isQuestionsTab
    ? practiceQuestionsData?.meta
    : homeworksData?.meta;
  const isLoadingMore =
    page > 1 &&
    (isQuestionsTab ? isQuestionsFetching : isHomeworksFetching) &&
    !showLoader;
  const hasMorePages = activeMeta?.hasNextPage === true;

  useEffect(() => {
    setPage(1);
  }, [cleanSearch, isQuestionsTab, selectedFilter, selectedLevel, studentId]);

  const onRefresh = useCallback(async () => {
    if (!studentId && !isQuestionsTab) return;

    setRefreshing(true);
    try {
      if (page === 1) {
        if (isQuestionsTab) {
          await refetchQuestions();
        } else {
          await refetchHomeworks();
        }
      } else {
        setPage(1);
      }
    } finally {
      setRefreshing(false);
    }
  }, [isQuestionsTab, page, refetchHomeworks, refetchQuestions, studentId]);

  const onReachBottom = useCallback(() => {
    if (!isLoadingMore && hasMorePages && !showLoader) {
      setPage(prev => prev + 1);
    }
  }, [hasMorePages, isLoadingMore, showLoader]);

  const handleAssignQuestion = async (questionId: string) => {
    if (!studentId) return;

    setAssigningQuestionId(questionId);
    try {
      await assignPracticeQuestions({
        questionIds: [questionId],
        studentId,
      }).unwrap();
      Alert.alert(
        'Practice Assigned',
        'The question is added to your practice.',
      );
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

      <FlatList
        style={styles.scroll}
        data={
          (showLoader
            ? []
            : isQuestionsTab
            ? filteredQuestions
            : filteredHomeworks) as PracticeListItem[]
        }
        keyExtractor={item => item.id}
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
        onEndReached={onReachBottom}
        onEndReachedThreshold={0.2}
        ListHeaderComponent={
          <View>
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
                    onPress={() => {
                      setSelectedFilter(filter.value);
                      setPage(1);
                    }}
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
                label={
                  isQuestionsTab
                    ? 'Loading questions...'
                    : 'Loading practice...'
                }
              />
            )}
          </View>
        }
        renderItem={({ item }) =>
          isQuestionsTab ? (
            <PracticeQuestionCard
              item={item as QuestionTask}
              isAssigning={assigningQuestionId === item.id}
              onAssign={handleAssignQuestion}
            />
          ) : (
            <PracticeCard
              {...(item as Homework)}
              homeworkId={item.id}
              question={(item as Homework)?.question?.question ?? []}
              marks={(item as Homework)?.question?.marks}
              isUnassigning={unassigningQuestionId === item.questionId}
              onUnassign={handleUnassignQuestion}
            />
          )
        }
        ListEmptyComponent={
          !showLoader ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {isQuestionsTab
                  ? 'No practice questions found'
                  : `No ${selectedFilter.toLowerCase()} practice`}
              </Text>
              {!isQuestionsTab &&
                !isAdminReview &&
                selectedFilter === HomeworkState.NEW && (
                  <TouchableOpacity
                    style={styles.emptyAction}
                    activeOpacity={0.85}
                    onPress={() => setSelectedFilter('QUESTIONS')}
                  >
                    <Text style={styles.emptyActionText}>Find Questions</Text>
                  </TouchableOpacity>
                )}
            </View>
          ) : null
        }
        ListFooterComponent={<BottomLodeMore loading={hasMorePages} />}
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
