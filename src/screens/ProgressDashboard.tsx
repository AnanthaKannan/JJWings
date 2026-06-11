import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { useGetScoreQuery } from '../store/api';
import { RootState } from '../store/store';
import { formatDuration } from '../util/fn';
import { APP_VERSION } from '../util/version';
import { AdminHeader, LoadingState, StudentHeader } from '../component';

const { width } = Dimensions.get('window');

// ── Animated Stat Circle ──────────────────────────────────────────────
interface StatCircleProps {
  value: string | number;
  label: string;
  color: string;
  bgColor: string;
  delay?: number;
}

const StatCircle: React.FC<StatCircleProps> = ({
  value,
  label,
  color,
  bgColor,
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -4,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounceAnim, delay, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.statCircle,
        { backgroundColor: bgColor, borderColor: color },
        {
          transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
        },
      ]}
    >
      <Text style={[styles.statCircleValue, { color }]}>{value}</Text>
      <Text style={[styles.statCircleLabel, { color }]}>{label}</Text>
    </Animated.View>
  );
};

// ── Animated Accuracy Bar ──────────────────────────────────────────────
interface AccuracyBarProps {
  percent: number;
}

const AccuracyBar: React.FC<AccuracyBarProps> = ({ percent }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Reset and re-animate whenever percent changes (e.g. after refresh)
    widthAnim.setValue(0);
    Animated.timing(widthAnim, {
      toValue: percent,
      duration: 1400,
      delay: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [glowAnim, percent, widthAnim]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width: barWidth }]}>
        <Animated.View style={[styles.barShine, { opacity: glowAnim }]} />
      </Animated.View>
      {[...Array(5)].map((_, i) => (
        <View
          key={i}
          style={[styles.barDot, { left: `${(i + 1) * 16}%` as any }]}
        />
      ))}
    </View>
  );
};

// ── Floating Star ──────────────────────────────────────────────────────
interface FloatingStarProps {
  style?: object;
  delay?: number;
  color?: string;
}

const FloatingStar: React.FC<FloatingStarProps> = ({
  style,
  delay = 0,
  color = '#FFD700',
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000 + delay * 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000 + delay * 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [delay, floatAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.floatingStar,
        style,
        { color, transform: [{ translateY: floatAnim }, { rotate }] },
      ]}
    >
      ★
    </Animated.Text>
  );
};

// ── Pulse Badge ────────────────────────────────────────────────────────
interface PulseBadgeProps {
  icon: string;
  value: string | number;
  label: string;
  correct?: boolean;
}

const PulseBadge: React.FC<PulseBadgeProps> = ({
  icon,
  value,
  label,
  correct = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const color = correct ? '#22c55e' : '#ef4444';
  const bg = correct ? '#dcfce7' : '#fee2e2';

  return (
    <Animated.View
      style={[
        styles.pulseBadge,
        { backgroundColor: bg, borderColor: color },
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Text style={[styles.pulseBadgeIcon, { color }]}>{icon}</Text>
      <Text style={[styles.pulseBadgeValue, { color }]}>{value}</Text>
      <Text style={[styles.pulseBadgeLabel, { color }]}>{label}</Text>
    </Animated.View>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────
const ProgressDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const routeStudentId = route?.params?.studentId;
  const routeStudentName = route?.params?.studentName;
  const isAdminReview = route?.params?.adminReview === true;
  const loggedInStudentId = useSelector(
    (state: RootState) => state.common.studentId,
  );
  const loggedInStudentName = useSelector(
    (state: RootState) => state.common.studentName,
  );
  const studentId = isAdminReview ? routeStudentId : loggedInStudentId;
  const studentName = isAdminReview
    ? routeStudentName ?? 'Student'
    : loggedInStudentName;
  const headerAnim = useRef(new Animated.Value(-60)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(80)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [countUp, setCountUp] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: score,
    isLoading,
    refetch: refetchScore,
  } = useGetScoreQuery(
    { studentId: studentId ?? '' },
    { skip: !isFocused || !studentId },
  );
  const showLoader = isFocused && isLoading && !score;

  const assigned = score?.assigned ?? 0;
  const done = score?.completed ?? 0;
  const newHomework = score?.new ?? 0;
  const working = score?.progress ?? 0;
  const correct = score?.success ?? 0;
  const wrong = score?.failure ?? 0;
  const practiceAssigned = score?.practiceAssigned ?? 0;
  const practiceDone = score?.practiceCompleted ?? 0;
  const practiceNew = score?.practiceNew ?? 0;
  const practiceWorking = score?.practiceProgress ?? 0;
  const practiceCorrect = score?.practiceSuccess ?? 0;
  const practiceWrong = score?.practiceFailure ?? 0;
  const totalSolved = correct + wrong;
  const accuracy =
    totalSolved > 0 ? Math.round((correct / totalSolved) * 1000) / 10 : 0;
  const practiceTotalSolved = practiceCorrect + practiceWrong;
  const practiceAccuracy =
    practiceTotalSolved > 0
      ? Math.round((practiceCorrect / practiceTotalSolved) * 1000) / 10
      : 0;
  const learningHours = formatDuration(score?.timeTaken ?? 0);
  const practiceLearningHours = formatDuration(score?.practiceTimeTaken ?? 0);
  const dashboardTitle = `${studentName.trim() || 'Your'}'s Progress Dashboard`;

  const navigateToPractice = () => {
    if (isAdminReview) {
      navigation.navigate('PracticeScreen', {
        studentId,
        studentName,
        adminReview: true,
      });
      return;
    }

    navigation.navigate('Practice');
  };

  // ── Pull-to-refresh handler ──────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchScore();
    } finally {
      setRefreshing(false);
    }
  }, [refetchScore]);

  // ── Count-up effect — re-runs when totalSolved changes after refresh ─
  useEffect(() => {
    setCountUp(0);
    if (totalSolved === 0) return;
    let count = 0;
    const step = Math.max(1, Math.ceil(totalSolved / 45));
    const interval = setInterval(() => {
      count += step;
      if (count >= totalSolved) {
        setCountUp(totalSolved);
        clearInterval(interval);
      } else {
        setCountUp(count);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [totalSolved]);

  // ── Mount animations (run once) ──────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(cardSlide, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [cardOpacity, cardSlide, headerAnim, headerOpacity, waveAnim]);

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      {isAdminReview ? (
        <AdminHeader
          header={`${studentName.trim() || 'Student'} Progress`}
          showBackButton={true}
          headerBackgroundColor="#4F46E5"
        />
      ) : (
        <StudentHeader header="" headerBackgroundColor="#4F46E5" />
      )}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={['#4F46E5', '#6366F1']} // Android
            progressBackgroundColor="#EEF2FF" // Android spinner bg
            title="Updating your stats…" // iOS only
            titleColor="#4F46E5" // iOS only
          />
        }
      >
        {/* Decorative floating elements */}
        <FloatingStar
          style={styles.floatingStarTop}
          delay={0}
          color="#FBBF24"
        />
        <FloatingStar
          style={styles.floatingStarMiddle}
          delay={2}
          color="#FB7185"
        />
        <FloatingStar
          style={styles.floatingStarLeft}
          delay={1}
          color="#A78BFA"
        />

        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerAnim }], opacity: headerOpacity },
          ]}
        >
          <View style={styles.waveContainer} pointerEvents="none">
            <Animated.View
              style={[
                styles.waveBg,
                { transform: [{ translateX: waveTranslate }] },
              ]}
            />
          </View>

          <View style={styles.headerContent}>
            <Text style={styles.headerEmoji}>🚀</Text>
            <View style={styles.headerTextWrap}>
              <Text
                style={styles.headerTitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {dashboardTitle}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Cards */}
        {showLoader ? (
          <View style={styles.loaderWrap}>
            <LoadingState label="Loading progress..." />
          </View>
        ) : (
          <Animated.View
            style={{
              transform: [{ translateY: cardSlide }],
              opacity: cardOpacity,
            }}
          >
            {/* Homework Status Card */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardEmoji}>📚</Text>
                <Text style={styles.cardTitle}>Homework Status</Text>
              </View>
              <View style={styles.circleRow}>
                <StatCircle
                  value={assigned}
                  label="ASSIGNED"
                  color="#6366F1"
                  bgColor="#EEF2FF"
                  delay={200}
                />

                <StatCircle
                  value={newHomework}
                  label="NEW"
                  color="#2563EB"
                  bgColor="#DBEAFE"
                  delay={400}
                />

                <StatCircle
                  value={working}
                  label="WORKING"
                  color="#D97706"
                  bgColor="#FEF3C7"
                  delay={600}
                />
                <StatCircle
                  value={done}
                  label="DONE"
                  color="#059669"
                  bgColor="#D1FAE5"
                  delay={800}
                />
              </View>
            </View>

            {/* Performance Stats Card */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardEmoji}>📊</Text>
                <Text style={styles.cardTitle}>Homework Performance</Text>
              </View>

              <View style={styles.statsTopRow}>
                <View>
                  <Text style={styles.statsSmallLabel}>Accuracy</Text>
                  <Text style={styles.accuracyValue}>{accuracy}%</Text>
                </View>
                <View style={styles.statsRight}>
                  <Text style={styles.statsSmallLabel}>Total Solved</Text>
                  <Text style={styles.totalSolvedValue}>
                    {countUp.toLocaleString()}
                  </Text>
                </View>
              </View>

              <AccuracyBar percent={accuracy} />

              <View style={styles.badgeRow}>
                <PulseBadge
                  icon="✅"
                  value={correct}
                  label="CORRECT"
                  correct={true}
                />
                <PulseBadge
                  icon="❌"
                  value={wrong}
                  label="WRONG"
                  correct={false}
                />
              </View>
            </View>

            {/* Learning Time Card */}
            <View style={[styles.card, styles.timeCard]}>
              <View style={styles.timeCardInner}>
                <Text style={styles.timeIcon}>⏳</Text>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>LEARNING TIME</Text>
                  <Text style={styles.timeValue}>{learningHours} Hours</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewLogBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (isAdminReview) {
                    navigation.navigate('HomeworkScreen', {
                      studentId,
                      studentName,
                      adminReview: true,
                      type: 'homework',
                    });
                    return;
                  }

                  navigation.navigate('Homework');
                }}
              >
                <Text style={styles.viewLogText}>📋 View Homework</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardEmoji}>🧠</Text>
                <Text style={styles.cardTitle}>Practice Status</Text>
              </View>
              <View style={styles.circleRow}>
                <StatCircle
                  value={practiceAssigned}
                  label="ASSIGNED"
                  color="#7C3AED"
                  bgColor="#F3E8FF"
                  delay={200}
                />

                <StatCircle
                  value={practiceNew}
                  label="NEW"
                  color="#0891B2"
                  bgColor="#CFFAFE"
                  delay={400}
                />

                <StatCircle
                  value={practiceWorking}
                  label="WORKING"
                  color="#CA8A04"
                  bgColor="#FEF9C3"
                  delay={600}
                />
                <StatCircle
                  value={practiceDone}
                  label="DONE"
                  color="#16A34A"
                  bgColor="#DCFCE7"
                  delay={800}
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardEmoji}>🎯</Text>
                <Text style={styles.cardTitle}>Practice Performance</Text>
              </View>

              <View style={styles.statsTopRow}>
                <View>
                  <Text style={styles.statsSmallLabel}>Accuracy</Text>
                  <Text style={styles.accuracyValue}>{practiceAccuracy}%</Text>
                </View>
                <View style={styles.statsRight}>
                  <Text style={styles.statsSmallLabel}>Total Solved</Text>
                  <Text style={styles.totalSolvedValue}>
                    {practiceTotalSolved.toLocaleString()}
                  </Text>
                </View>
              </View>

              <AccuracyBar percent={practiceAccuracy} />

              <View style={styles.badgeRow}>
                <PulseBadge
                  icon="✅"
                  value={practiceCorrect}
                  label="CORRECT"
                  correct={true}
                />
                <PulseBadge
                  icon="❌"
                  value={practiceWrong}
                  label="WRONG"
                  correct={false}
                />
              </View>
            </View>

            <View style={[styles.card, styles.practiceTimeCard]}>
              <View style={styles.timeCardInner}>
                <Text style={styles.timeIcon}>🧩</Text>
                <View style={styles.timeInfo}>
                  <Text style={styles.practiceTimeLabel}>PRACTICE TIME</Text>
                  <Text style={styles.timeValue}>
                    {practiceLearningHours} Hours
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.practiceLogBtn}
                activeOpacity={0.85}
                onPress={navigateToPractice}
              >
                <Text style={styles.viewLogText}>🧠 View Practice</Text>
              </TouchableOpacity>
            </View>

            {/* Fun motivational card */}
            <View style={[styles.card, styles.cheerCard]}>
              <Text style={styles.cheerEmoji}>🎉</Text>
              <Text style={styles.cheerText}>Fantastic work this week!</Text>
              <Text style={styles.cheerSub}>
                Keep it up and earn your next badge 🏅
              </Text>
            </View>

            <Text style={styles.versionText}>v{APP_VERSION}</Text>
            <View style={styles.bottomSpacer} />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    backgroundColor: '#4F46E5',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  waveContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  waveBg: {
    position: 'absolute',
    width: width * 2.5,
    height: 200,
    bottom: -80,
    left: -20,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerEmoji: {
    fontSize: 48,
    marginRight: 6,
  },
  headerTitle: {
    flexShrink: 1,
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#C7D2FE',
    marginTop: 6,
    fontWeight: '600',
  },
  floatingStar: {
    fontSize: 22,
    opacity: 0.85,
  },
  floatingStarTop: {
    position: 'absolute',
    top: 30,
    right: 28,
  },
  floatingStarMiddle: {
    position: 'absolute',
    top: 90,
    right: 70,
  },
  floatingStarLeft: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  bottomSpacer: {
    height: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  loaderWrap: {
    marginHorizontal: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
  },
  cardEmoji: { fontSize: 22 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: 0.3,
  },
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    paddingVertical: 4,
  },
  statCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statCircleValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statCircleLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  statsRight: { alignItems: 'flex-end' },
  statsSmallLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  accuracyValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: -1,
  },
  totalSolvedValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  barTrack: {
    height: 18,
    backgroundColor: '#EEF2FF',
    borderRadius: 9,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 9,
    backgroundColor: '#4F46E5',
    overflow: 'hidden',
  },
  barShine: {
    position: 'absolute',
    top: 3,
    left: 8,
    right: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  barDot: {
    position: 'absolute',
    top: 6,
    width: 4,
    height: 6,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pulseBadge: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  pulseBadgeIcon: { fontSize: 20 },
  pulseBadgeValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  pulseBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  timeCard: {
    backgroundColor: '#1E1B4B',
    gap: 16,
  },
  practiceTimeCard: {
    backgroundColor: '#312E81',
    gap: 16,
  },
  timeCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timeIcon: { fontSize: 40 },
  timeInfo: { flex: 1 },
  timeLabel: {
    fontSize: 11,
    color: '#818CF8',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  practiceTimeLabel: {
    fontSize: 11,
    color: '#A5F3FC',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  viewLogBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  practiceLogBtn: {
    backgroundColor: '#0891B2',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#0891B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 8,
    elevation: 6,
  },
  viewLogText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  cheerCard: {
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  cheerEmoji: { fontSize: 44, marginBottom: 8 },
  cheerText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  cheerSub: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 4,
  },
  versionText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
});

export default ProgressDashboard;
