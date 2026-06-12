import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Easing,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { AdminHeader, LoadingState, StudentHeader } from '../component';
import { RankingStudent, useGetRankingQuery } from '../store/api';
import { RootState } from '../store/store';

const { width } = Dimensions.get('window');

// ── Avatar placeholder (replace Image src with real assets) ───────────────
const AVATAR_COLORS = [
  '#4A90D9',
  '#F5A623',
  '#9B59B6',
  '#E74C3C',
  '#4CAF50',
  '#FF6B9D',
  '#00BCD4',
];

const AvatarCircle: React.FC<{
  size: number;
  color: string;
  label: string;
  borderColor?: string;
  borderWidth?: number;
}> = ({ size, color, label, borderColor = '#FFF', borderWidth = 3 }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      borderWidth,
      borderColor,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ fontSize: size * 0.38, color: '#FFF', fontWeight: '800' }}>
      {label}
    </Text>
  </View>
);

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const getAvatarColor = (rank: number) =>
  AVATAR_COLORS[(Math.max(rank, 1) - 1) % AVATAR_COLORS.length];

const formatAccuracy = (accuracy: number) =>
  `${Number.isInteger(accuracy) ? accuracy.toFixed(0) : accuracy.toFixed(1)}%`;

const formatLevel = (student: RankingStudent) =>
  `${student.studentCode ?? 'Explorer'} • ${student.totalCorrect}/${
    student.totalQuestions
  } Solved`;

// ── Floating particles ─────────────────────────────────────────────────────
const Particle: React.FC<{
  x: number;
  delay: number;
  emoji: string;
  size: number;
}> = ({ x, delay, emoji, size }) => {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(y, {
              toValue: -55,
              duration: 2200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(y, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1200),
      ]),
    ).start();
  }, [delay, opacity, rotate, y]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        bottom: 10,
        fontSize: size,
        opacity,
        transform: [{ translateY: y }, { rotate: spin }],
        zIndex: 10,
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

// ── Crown bounce ───────────────────────────────────────────────────────────
const BouncingCrown: React.FC = () => {
  const bounce = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.spring(bounce, {
          toValue: -8,
          tension: 180,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(bounce, {
          toValue: 0,
          tension: 180,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.delay(1600),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [bounce, glow]);

  const glowColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F5A623', '#FFD700'],
  });

  return (
    <Animated.View
      style={{ transform: [{ translateY: bounce }], alignItems: 'center' }}
    >
      <Animated.Text style={{ fontSize: 32, color: glowColor }}>
        👑
      </Animated.Text>
    </Animated.View>
  );
};

// ── Rank Badge ─────────────────────────────────────────────────────────────
const RankBadge: React.FC<{ rank: number; color: string }> = ({
  rank,
  color,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(rank * 400),
        Animated.spring(scale, {
          toValue: 1.25,
          tension: 200,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ]),
    ).start();
  }, [rank, scale]);

  return (
    <Animated.View
      style={[
        styles.rankBadge,
        { backgroundColor: color, transform: [{ scale }] },
      ]}
    >
      <Text style={styles.rankBadgeText}>{rank}</Text>
    </Animated.View>
  );
};

// ── Top 3 Podium Card ──────────────────────────────────────────────────────
const PodiumCard: React.FC<{
  name: string;
  score: string;
  rank: number;
  avatarColor: string;
  isFirst: boolean;
  delay: number;
}> = ({ name, score, rank, avatarColor, isFirst, delay }) => {
  const slideUp = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    if (isFirst) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(shimmer, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [delay, isFirst, opacity, shimmer, slideUp]);

  const borderColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F5A623', '#FFD700'],
  });

  const initials = getInitials(name);

  return (
    <Animated.View
      style={[
        isFirst ? styles.firstCard : styles.sideCard,
        { opacity, transform: [{ translateY: slideUp }] },
      ]}
    >
      {isFirst && <BouncingCrown />}

      {/* Avatar with animated border for 1st */}
      <View style={{ alignItems: 'center', position: 'relative' }}>
        {isFirst ? (
          <Animated.View
            style={{
              borderRadius: 44,
              borderWidth: 4,
              borderColor,
              padding: 2,
            }}
          >
            <AvatarCircle
              size={72}
              color={avatarColor}
              label={initials}
              borderColor={avatarColor}
            />
          </Animated.View>
        ) : (
          <AvatarCircle
            size={54}
            color={avatarColor}
            label={initials}
            borderColor="#DDE8F8"
            borderWidth={3}
          />
        )}
        <View style={{ position: 'absolute', bottom: -6, right: -2 }}>
          <RankBadge
            rank={rank}
            color={rank === 1 ? '#F5A623' : rank === 2 ? '#A0B4C8' : '#CD7F32'}
          />
        </View>
      </View>

      <Text
        style={[styles.podiumName, isFirst && { color: '#FFF', fontSize: 16 }]}
      >
        {name}
      </Text>
      <Text style={[styles.podiumScore, isFirst && { color: '#FFD77A' }]}>
        {score.toLocaleString()}
      </Text>
      <Text style={[styles.podiumLabel, isFirst && { color: '#B0CCEE' }]}>
        Solved
      </Text>
    </Animated.View>
  );
};

// ── Stats Card ─────────────────────────────────────────────────────────────
const StatsCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
  delay: number;
}> = ({ icon, label, value, color, delay }) => {
  const scaleIn = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayVal, setDisplayVal] = useState('0');
  const pulse = useRef(new Animated.Value(1)).current;

  const numericVal = parseFloat(value.replace('%', ''));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleIn, {
        toValue: 1,
        tension: 60,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.timing(countAnim, {
        toValue: numericVal,
        duration: 1400,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }).start();
    }, delay + 300);

    countAnim.addListener(({ value: v }) => {
      setDisplayVal(value.includes('%') ? `${v.toFixed(1)}%` : v.toFixed(0));
    });

    Animated.loop(
      Animated.sequence([
        Animated.delay(delay + 2000),
        Animated.spring(pulse, {
          toValue: 1.06,
          tension: 200,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(pulse, {
          toValue: 1,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ]),
    ).start();

    return () => countAnim.removeAllListeners();
  }, [countAnim, delay, numericVal, opacity, pulse, scaleIn, value]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        { opacity, transform: [{ scale: scaleIn }, { scale: pulse }] },
      ]}
    >
      <View style={[styles.statIconBg, { backgroundColor: color + '22' }]}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{displayVal}</Text>
    </Animated.View>
  );
};

// ── Rising Star Row ────────────────────────────────────────────────────────
const RisingStarRow: React.FC<{
  rank: number;
  name: string;
  level: string;
  accuracy: string;
  avatarColor: string;
  index: number;
}> = ({ rank, name, level, accuracy, avatarColor, index }) => {
  const slideLeft = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const initials = getInitials(name);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideLeft, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 120 + 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 120 + 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(index * 500 + 1500),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.delay(3000),
      ]),
    ).start();
  }, [index, opacity, shimmer, slideLeft]);

  const accuracyColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#4A90D9', '#FFD700'],
  });

  return (
    <Animated.View
      style={[
        styles.starRow,
        { opacity, transform: [{ translateX: slideLeft }] },
      ]}
    >
      <View style={styles.starRankWrap}>
        <Text style={styles.starRankNum}>{rank}</Text>
      </View>
      <AvatarCircle
        size={46}
        color={avatarColor}
        label={initials}
        borderColor="#E8F0FC"
        borderWidth={2}
      />
      <View style={styles.starInfo}>
        <Text style={styles.starName}>{name}</Text>
        <Text style={styles.starLevel}>{level}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Animated.Text style={[styles.starAccuracy, { color: accuracyColor }]}>
          {accuracy}
        </Animated.Text>
        <Text style={styles.starAccLabel}>Accuracy</Text>
      </View>
    </Animated.View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
const TopExplorerScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const isAdmin = useSelector((state: RootState) => state.common.isAdmin);
  const studentLevel = useSelector(
    (state: RootState) => state.common.studentLevel,
  );
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const bgScale = useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isLevelPickerOpen, setIsLevelPickerOpen] = useState(false);
  const rankingLevel = isAdmin ? selectedLevel : studentLevel;

  const {
    data: ranking = [],
    isLoading,
    refetch,
  } = useGetRankingQuery(
    typeof rankingLevel === 'number' ? { level: rankingLevel } : undefined,
    {
      skip: !isFocused,
    },
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgScale, {
          toValue: 1.04,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgScale, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bgScale, headerFade, headerSlide]);

  const sortedRanking = useMemo(
    () => [...ranking].sort((a, b) => a.rank - b.rank),
    [ranking],
  );
  const firstPlace = sortedRanking.find(student => student.rank === 1);
  const secondPlace = sortedRanking.find(student => student.rank === 2);
  const thirdPlace = sortedRanking.find(student => student.rank === 3);
  const risingStars = sortedRanking.filter(student => student.rank > 3);

  const averageAccuracy =
    sortedRanking.length > 0
      ? sortedRanking.reduce((total, student) => total + student.accuracy, 0) /
        sortedRanking.length
      : 0;
  const highAccuracy = sortedRanking.reduce(
    (highest, student) => Math.max(highest, student.accuracy),
    0,
  );
  const hasRanking = sortedRanking.length > 0;
  const showLoader = isFocused && isLoading && !hasRanking;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF4FF" />
      {isAdmin && (
        <View style={styles.adminHeaderWrap}>
          <AdminHeader header="Rank" showBackButton={true} />
        </View>
      )}
      {!isAdmin && <StudentHeader header="" headerBackgroundColor="#EEF4FF" />}

      {/* Animated background blob */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bgBlob, { transform: [{ scale: bgScale }] }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.bgBlob2, { transform: [{ scale: bgScale }] }]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4A90D9"
            colors={['#4A90D9']}
            progressBackgroundColor="#EEF4FF"
          />
        }
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.headerRow,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <View>
            <Text style={styles.headerSub}>🏅 Last 7 days</Text>
            <Text style={styles.headerTitle}>Top Explorers</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={[
                styles.filterBtn,
                selectedLevel !== null && styles.filterBtnActive,
              ]}
              onPress={() => setIsLevelPickerOpen(true)}
              activeOpacity={0.82}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  selectedLevel !== null && styles.filterBtnTextActive,
                ]}
              >
                {selectedLevel === null
                  ? 'All Levels'
                  : `Level ${selectedLevel}`}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {showLoader && (
          <View style={styles.loaderWrap}>
            <LoadingState label="Loading rankings..." />
          </View>
        )}

        {!showLoader && !hasRanking && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>
              Completed homework will appear here once rankings are available.
            </Text>
          </View>
        )}

        {/* Podium */}
        <View
          style={[styles.podium, (!hasRanking || showLoader) && styles.hidden]}
        >
          {/* Floating particles above podium */}
          <Particle x={30} delay={0} emoji="⭐" size={14} />
          <Particle x={width - 60} delay={700} emoji="✨" size={12} />
          <Particle x={width / 2 - 10} delay={1400} emoji="🌟" size={16} />
          <Particle x={80} delay={1800} emoji="🎉" size={13} />
          <Particle x={width - 100} delay={300} emoji="🎊" size={11} />

          {/* Rank 2 - Left */}
          {secondPlace && (
            <PodiumCard
              name={secondPlace.name}
              score={`${secondPlace.totalCorrect}/${secondPlace.totalQuestions}`}
              rank={secondPlace.rank}
              avatarColor={getAvatarColor(secondPlace.rank)}
              isFirst={false}
              delay={200}
            />
          )}
          {/* Rank 1 - Center */}
          {firstPlace && (
            <PodiumCard
              name={firstPlace.name}
              score={`${firstPlace.totalCorrect}/${firstPlace.totalQuestions}`}
              rank={firstPlace.rank}
              avatarColor={getAvatarColor(firstPlace.rank)}
              isFirst={true}
              delay={0}
            />
          )}
          {/* Rank 3 - Right */}
          {thirdPlace && (
            <PodiumCard
              name={thirdPlace.name}
              score={`${thirdPlace.totalCorrect}/${thirdPlace.totalQuestions}`}
              rank={thirdPlace.rank}
              avatarColor={getAvatarColor(thirdPlace.rank)}
              isFirst={false}
              delay={400}
            />
          )}
        </View>

        {/* Stats Row */}
        <View
          style={[
            styles.statsRow,
            (!hasRanking || showLoader) && styles.hidden,
          ]}
        >
          <StatsCard
            icon="👥"
            label="AVG ACCURACY"
            value={formatAccuracy(averageAccuracy)}
            color="#4A90D9"
            delay={300}
          />
          <StatsCard
            icon="🎯"
            label="HIGH ACCURACY"
            value={formatAccuracy(highAccuracy)}
            color="#4CAF50"
            delay={500}
          />
        </View>

        {/* Rising Stars */}
        <View
          style={[
            styles.sectionHeader,
            (!hasRanking || showLoader) && styles.hidden,
          ]}
        >
          <Text style={styles.sectionTitle}>🚀 Rising Stars</Text>
          <View style={styles.rankBadgeWrap}>
            <Text style={styles.rankBadgeLabel}>4 – 10 Rank</Text>
          </View>
        </View>

        <View
          style={[
            styles.starsList,
            (!hasRanking || showLoader) && styles.hidden,
          ]}
        >
          {risingStars.map((student, i) => (
            <RisingStarRow
              key={student.id}
              rank={student.rank}
              name={student.name}
              level={formatLevel(student)}
              accuracy={formatAccuracy(student.accuracy)}
              avatarColor={getAvatarColor(student.rank)}
              index={i}
            />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={isAdmin && isLevelPickerOpen}
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
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.levelAllOption,
                selectedLevel === null && styles.levelOptionActive,
              ]}
              onPress={() => {
                setSelectedLevel(null);
                setIsLevelPickerOpen(false);
              }}
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
                  onPress={() => {
                    setSelectedLevel(value);
                    setIsLevelPickerOpen(false);
                  }}
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
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF4FF',
  },
  adminHeaderWrap: {
    zIndex: 20,
    elevation: 20,
  },
  hidden: {
    display: 'none',
  },
  loaderWrap: {
    marginTop: 32,
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#A0B4D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#1A3558',
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 13,
    color: '#7A90B0',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  bgBlob: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#D6E8FF',
    top: -width * 0.5,
    left: -width * 0.1,
    opacity: 0.6,
  },
  bgBlob2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#C8F0FF',
    top: 180,
    right: -width * 0.3,
    opacity: 0.35,
  },
  scrollContent: {
    paddingTop: 0,
    paddingHorizontal: 16,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerSub: {
    fontSize: 13,
    color: '#7A90B0',
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A3558',
    letterSpacing: 0.3,
  },
  filterBtn: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#A0B4D6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  filterBtnActive: {
    backgroundColor: '#EAF1FB',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A90D9',
  },
  filterBtnTextActive: {
    color: '#315A8C',
  },
  bottomSpacer: {
    height: 40,
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
    color: '#1A3558',
    fontSize: 17,
    fontWeight: '900',
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#334155',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
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
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  levelOptionText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '900',
  },
  levelOptionTextActive: {
    color: '#FFFFFF',
  },

  // Podium
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
    height: 250,
  },
  firstCard: {
    width: width * 0.38,
    backgroundColor: '#1E4A8C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: 230,
    justifyContent: 'flex-start',
    shadowColor: '#1E4A8C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 2,
    marginHorizontal: 4,
  },
  sideCard: {
    width: width * 0.27,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    height: 175,
    justifyContent: 'flex-start',
    shadowColor: '#A0B4D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  rankBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A4A70',
    marginTop: 12,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4A90D9',
    marginTop: 2,
  },
  podiumLabel: {
    fontSize: 11,
    color: '#7A90B0',
    fontWeight: '600',
    marginTop: 1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#A0B4D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#8899BB',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },

  // Rising Stars
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3558',
  },
  rankBadgeWrap: {
    backgroundColor: '#E8F0FC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rankBadgeLabel: {
    fontSize: 12,
    color: '#4A90D9',
    fontWeight: '700',
  },
  starsList: {
    gap: 10,
  },
  starRow: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#A0B4D6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  starRankWrap: {
    width: 28,
    alignItems: 'center',
  },
  starRankNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#A0B4C8',
  },
  starInfo: {
    flex: 1,
  },
  starName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3558',
  },
  starLevel: {
    fontSize: 12,
    color: '#7A90B0',
    fontWeight: '500',
    marginTop: 1,
  },
  starAccuracy: {
    fontSize: 17,
    fontWeight: '900',
  },
  starAccLabel: {
    fontSize: 10,
    color: '#A0B0C0',
    fontWeight: '600',
    marginTop: 1,
  },
});

export default TopExplorerScreen;
