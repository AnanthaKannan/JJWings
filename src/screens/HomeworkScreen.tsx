import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

type BadgeType = 'IN PROGRESS' | 'NEW' | 'COMPLETED';

interface HomeworkCardProps {
  icon: string;
  title: string;
  questionCount: number;
  badge: BadgeType;
  progress?: number; // 0 to 1, only for IN PROGRESS
}

const BADGE_STYLES: Record<BadgeType, { bg: string; text: string }> = {
  'IN PROGRESS': { bg: '#3B82F6', text: '#FFFFFF' },
  NEW: { bg: '#F59E0B', text: '#FFFFFF' },
  COMPLETED: { bg: '#10B981', text: '#FFFFFF' },
};

function HomeworkCard({
  icon,
  title,
  questionCount,
  badge,
  progress,
}: HomeworkCardProps) {
  const badgeStyle = BADGE_STYLES[badge];

  return (
    <View style={styles.card}>
      {/* Badge */}
      <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
        <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
          {badge}
        </Text>
      </View>

      {/* Icon */}
      <View style={styles.iconWrapper}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      {/* Title & subtitle */}
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.questionRow}>
        <Text style={styles.questionIcon}>📋</Text>
        <Text style={styles.questionCount}>{questionCount} questions</Text>
      </View>

      {/* Progress bar (only for IN PROGRESS) */}
      {progress !== undefined && (
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      )}

      {/* Attend button — hidden for COMPLETED */}
      {badge !== 'COMPLETED' && (
        <TouchableOpacity style={styles.attendBtn} activeOpacity={0.85}>
          <Text style={styles.attendBtnText}>Attend</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeworkScreen() {
  const tasks: HomeworkCardProps[] = [
    {
      icon: '⊞',
      title: 'Visual Abacus Level 2',
      questionCount: 25,
      badge: 'IN PROGRESS',
      progress: 0.35,
    },
    {
      icon: '⭐',
      title: 'Speed Mental Math',
      questionCount: 15,
      badge: 'NEW',
    },
    {
      icon: '✓',
      title: 'Basic Addition Drills',
      questionCount: 20,
      badge: 'COMPLETED',
    },
  ];

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
          <Text style={styles.headerTitle}>Homework</Text>
          <Text style={styles.headerSubtitle}>
            You have {tasks.length} tasks to explore today
          </Text>
        </View>

        {/* Cards */}
        {tasks.map((task, index) => (
          <HomeworkCard key={index} {...task} />
        ))}
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
    paddingHorizontal: 20,
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
    marginBottom: 16,
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
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 50,
  },
  attendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
