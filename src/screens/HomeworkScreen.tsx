import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../store/store';
import { useGetHomeworksQuery } from '../store/api';
import { setQuestions } from '../store/slices';
import { BadgeType } from '../util/types';
import { HomeworkState } from '../util/enum';

interface HomeworkCardProps {
  questionId: string;
  homeworkId: string;
  question: string[];
  state: BadgeType;
  result: boolean[];
  answer: number[];
  timer: number;
  isAdminReview?: boolean;
}

const BADGE_STYLES: Record<BadgeType, { bg: string; text: string }> = {
  PROGRESS: { bg: '#3B82F6', text: '#FFFFFF' },
  NEW: { bg: '#F59E0B', text: '#FFFFFF' },
  COMPLETED: { bg: '#10B981', text: '#FFFFFF' },
};

const FILTERS: { label: string; value: BadgeType }[] = [
  { label: 'New', value: HomeworkState.NEW },
  { label: 'In Progress', value: HomeworkState.PROGRESS },
  { label: 'Completed', value: HomeworkState.COMPLETED },
];

function HomeworkCard({
  homeworkId,
  questionId,
  question,
  state,
  result,
  answer,
  timer = 0,
  isAdminReview = false,
}: HomeworkCardProps) {
  const badgeStyle = BADGE_STYLES[state];
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const canUseAction = !isAdminReview || state === HomeworkState.COMPLETED;

  const handleAttend = () => {
    dispatch(
      setQuestions({
        questions: question,
        homeworkId,
        result,
        answer,
        questionId,
        timer,
      }),
    );

    if (state === HomeworkState.COMPLETED) {
      navigation.navigate('QuizReview');
    } else {
      navigation.navigate('Calculate');
    }
  };

  return (
    <View style={styles.card}>
      {/* Title & subtitle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={styles.cardTitle}>{questionId}</Text>
          <View style={styles.questionRow}>
            <Text style={styles.questionIcon}>📋</Text>
            <Text style={styles.questionCount}>
              {result.length}/{question.length} questions
            </Text>
          </View>
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
  const routeStudentId = route?.params?.studentId;
  const studentName = route?.params?.studentName;
  const isAdminReview = route?.params?.adminReview === true;
  const [selectedFilter, setSelectedFilter] = useState<BadgeType>(
    isAdminReview ? HomeworkState.COMPLETED : HomeworkState.NEW,
  );
  const loggedInStudentId = useSelector(
    (state: RootState) => state.common.studentId,
  );
  const studentId = isAdminReview ? routeStudentId : loggedInStudentId;

  const { data: homeworks, error } = useGetHomeworksQuery(
    { studentId: studentId ?? '' },
    {
      skip: !studentId,
      refetchOnMountOrArgChange: true,
    },
  );

  console.log('--------------------', homeworks, error);

  const filteredHomeworks =
    homeworks?.filter(homework => homework.state === selectedFilter) ?? [];
  const emptyStateLabel = selectedFilter.toLowerCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isAdminReview
              ? `${studentName ?? 'Student'} Performance`
              : 'Homework'}
          </Text>
          {/* <Text style={styles.headerSubtitle}>
            You have {tasks.length} tasks to explore today
          </Text> */}
        </View>

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

        {/* Cards */}
        {filteredHomeworks.map(task => (
          <HomeworkCard
            key={task.id}
            {...task}
            homeworkId={task.id}
            question={task?.question?.question ?? []}
            isAdminReview={isAdminReview}
          />
        ))}

        {filteredHomeworks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {emptyStateLabel} homework</Text>
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
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
    paddingRight: 90, // avoid overlap with badge
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  questionIcon: {
    fontSize: 12,
  },
  questionCount: {
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
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
  },
  attendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
