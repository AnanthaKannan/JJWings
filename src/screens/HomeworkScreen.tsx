import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  View,
  Text,
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
  StudentHeader,
} from '../component';
import { HomeworkScreenStyles as styles } from './styles/HomeworkScreen.styles';

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
            <View style={styles.questionRow}>
              <Text style={styles.questionIcon}>📋</Text>
              <Text style={styles.questionCount}>
                {result.length}/{question.length} questions
              </Text>
              {updatedTime.length > 0 && (
                <Text style={styles.updatedText}>• {updatedTime}</Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.actionRow}>
          {/* Attend button — hidden for COMPLETED */}
          {canUseAction && (
            <TouchableOpacity
              style={styles.attendBtn}
              activeOpacity={0.85}
              onPress={handleAttend}
            >
              <Text style={styles.attendBtnText}>
                {state !== HomeworkState.COMPLETED ? 'Attend' : 'View'}
              </Text>
            </TouchableOpacity>
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
