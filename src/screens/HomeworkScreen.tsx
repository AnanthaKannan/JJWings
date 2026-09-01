import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../store/store';
import {
  Homework,
  useGetHomeworksQuery,
  useUnassignHomeworkMutation,
} from '../store/api';
import { setQuestions } from '../store/slices';
import { BadgeType } from '../util/types';
import { HomeworkState } from '../util/enum';
import {
  AdminHeader,
  BottomLodeMore,
  LoadingOverlay,
  LoadingState,
  OptionsMenu,
  StudentHeader,
} from '../component';
import { createPdf } from '../util/pdfGenerator';

interface HomeworkCardProps {
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
  isAdminReview?: boolean;
  studentId?: string;
  studentName?: string;
  contentType?: 'homework' | 'exam';
  isUnassigning?: boolean;
  onDownloadPress: () => void;
  onUnassign?: (questionId: string) => void;
}

const FILTERS: { label: string; value: BadgeType }[] = [
  { label: 'New', value: HomeworkState.NEW },
  { label: 'In Progress', value: HomeworkState.PROGRESS },
  { label: 'Completed', value: HomeworkState.COMPLETED },
];

function HomeworkCard({
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
  isAdminReview = false,
  studentId,
  studentName,
  contentType = 'homework',
  isUnassigning = false,
  onDownloadPress,
  onUnassign,
}: HomeworkCardProps) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const canUseAction = !isAdminReview || state === HomeworkState.COMPLETED;
  const correctCount = result.filter(Boolean).length;
  const hasMarks = Array.isArray(marks) && marks.length > 0;
  const totalMarks = hasMarks
    ? marks.reduce((total, mark) => total + mark, 0)
    : 0;
  const earnedMarks = hasMarks
    ? result.reduce((total, isCorrect, index) => {
        return total + (isCorrect ? marks[index] ?? 0 : 0);
      }, 0)
    : 0;

  const formatTime = (seconds: number = 0) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60)
      .toString()
      .padStart(2, '0');
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  };

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

  const updatedTime = formatUpdatedTime(updatedAt);

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
        preferGoBack: true,
        type: contentType,
        returnToHomeworkParams: isAdminReview
          ? {
              studentId,
              studentName,
              adminReview: true,
              type: contentType,
            }
          : undefined,
      });
    } else {
      navigation.navigate('Calculate');
    }
  };

  return (
    <View style={styles.card}>
      {/* Title & subtitle */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle}>{questionLabel ?? questionId}</Text>
          {state === HomeworkState.COMPLETED ? (
            <View>
              <View style={styles.completedCorrectRow}>
                <Text style={styles.questionIcon}>✅</Text>
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
                <Text style={styles.timeText}>⏱ {formatTime(timer)}</Text>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <View style={styles.questionRow}>
                <Text style={styles.questionIcon}>📋</Text>
                <Text style={styles.questionCount}>
                  {result.length}/{question.length} questions
                </Text>
                {updatedTime.length > 0 && (
                  <Text style={styles.updatedText}>• {updatedTime}</Text>
                )}
              </View>
            </View>
          )}
        </View>
        <View style={styles.actionRow}>
          {canUseAction && (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={styles.attendBtn}
                activeOpacity={0.85}
                onPress={handleAttend}
              >
                <Text style={styles.attendBtnText}>
                  {state !== HomeworkState.COMPLETED ? 'Attend' : 'View'}
                </Text>
              </TouchableOpacity>
              <OptionsMenu
                options={[
                  {
                    key: 'download',
                    label: 'Download',
                    icon: 'download',
                    onPress: onDownloadPress,
                  },
                ]}
              />
            </View>
          )}
          {isAdminReview && state === HomeworkState.NEW && onUnassign && (
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

      {/* Progress bar (only for IN PROGRESS) */}
      {
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(result.length / question.length) * 100}%` },
            ]}
          />
        </View>
      }
    </View>
  );
}

export default function HomeworkScreen() {
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const routeStudentId = route?.params?.studentId;
  const studentName = route?.params?.studentName;
  const isAdminReview = route?.params?.adminReview === true;
  const contentType = route?.params?.type === 'exam' ? 'exam' : 'homework';
  const contentLabel = contentType === 'exam' ? 'examination' : 'homework';
  const screenTitle = contentType === 'exam' ? 'Examination' : 'Homework';
  const [selectedFilter, setSelectedFilter] = useState<BadgeType>(
    isAdminReview ? HomeworkState.COMPLETED : HomeworkState.NEW,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [unassigningQuestionId, setUnassigningQuestionId] = useState<
    string | null
  >(null);
  const loggedInStudentId = useSelector(
    (state: RootState) => state.common.studentId,
  );
  const studentId = isAdminReview ? routeStudentId : loggedInStudentId;

  const {
    data: homeworks,
    isLoading,
    isFetching,
    refetch,
  } = useGetHomeworksQuery(
    {
      studentId: studentId ?? '',
      state: selectedFilter,
      type: contentType,
      page,
    },
    {
      skip: !isFocused || !studentId,
    },
  );
  const [unassignHomework, { isLoading: isUnassigning }] =
    useUnassignHomeworkMutation();

  const filteredHomeworks = homeworks?.homeworks ?? [];
  const emptyStateLabel = selectedFilter.toLowerCase();
  const showLoader = isFocused && isLoading && !refreshing;
  const isLoadingMore = isFetching && !isLoading && page > 1;
  const hasMorePages = homeworks?.meta.hasNextPage === true;

  useEffect(() => {
    setPage(1);
  }, [selectedFilter, contentType, studentId]);

  const onRefresh = useCallback(async () => {
    if (!studentId) return;

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
  }, [refetch, page, studentId]);

  const onReachBottom = useCallback(() => {
    if (!showLoader && !isLoadingMore && hasMorePages) {
      setPage(prev => prev + 1);
    }
  }, [hasMorePages, isLoadingMore, showLoader]);

  const handleUnassignQuestion = (questionId: string) => {
    if (!studentId || unassigningQuestionId) return;

    Alert.alert(
      'Unassign?',
      `Remove this ${contentLabel} from ${studentName ?? 'the student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          onPress: async () => {
            setUnassigningQuestionId(questionId);
            try {
              await unassignHomework({
                studentId,
                questionIds: [questionId],
              }).unwrap();
              Alert.alert('Unassigned', `The ${contentLabel} was removed.`);
            } catch {
              Alert.alert(
                'Unassign Failed',
                `Unable to remove this ${contentLabel}.`,
              );
            } finally {
              setUnassigningQuestionId(null);
            }
          },
        },
      ],
    );
  };

  const handleDownloadPress = (item: Homework) => {
    createPdf(item.question?.question || []);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      {isAdminReview ? (
        <AdminHeader
          header={`${studentName ?? 'Student'} Performance`}
          showBackButton={true}
          headerBackgroundColor="#EEF2FF"
        />
      ) : (
        <StudentHeader header={screenTitle} headerBackgroundColor="#EEF2FF" />
      )}
      <FlatList
        style={styles.scroll}
        data={showLoader ? [] : filteredHomeworks}
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

            {showLoader && (
              <LoadingState label={`Loading ${contentLabel}...`} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <HomeworkCard
            {...item}
            homeworkId={item.id}
            question={item?.question?.question ?? []}
            marks={item?.question?.marks}
            isAdminReview={isAdminReview}
            studentId={studentId}
            studentName={studentName}
            contentType={contentType}
            isUnassigning={unassigningQuestionId === item.questionId}
            onUnassign={handleUnassignQuestion}
            onDownloadPress={() => handleDownloadPress(item)}
          />
        )}
        ListEmptyComponent={
          !showLoader ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No {emptyStateLabel} {contentLabel}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={<BottomLodeMore loading={hasMorePages} />}
      />
      <LoadingOverlay
        visible={isUnassigning}
        label={`Removing ${contentLabel}...`}
      />
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

  /* Header */
  header: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 30,
    color: '#2563EB',
    lineHeight: 32,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
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
    paddingHorizontal: 6,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
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
    fontWeight: '600',
  },
  /* Card */
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
    position: 'relative',
  },

  /* Badge */
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Icon */
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconText: {
    fontSize: 22,
  },

  /* Card text */
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  actionRow: {
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 15,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  updatedText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  questionIcon: {
    fontSize: 12,
  },
  questionCount: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Progress */
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 99,
  },

  /* Attend button */
  attendBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E3A8A',
    minWidth: 68,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  attendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  unassignBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: 82,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  unassignBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
});
