import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { useGetHomeworkByIdQuery } from '../store/api';
import { RootState } from '../store/store';
import { Header, LoadingState } from '../component';
import { evaluateExpression } from '../util/fn';

const CheckIcon = () => (
  <View style={styles.checkIcon}>
    <Text style={styles.checkIconText}>✓</Text>
  </View>
);

const CrossIcon = () => (
  <View style={styles.crossIcon}>
    <Text style={styles.crossIconText}>✗</Text>
  </View>
);

const TrophyIcon = () => (
  <View style={styles.trophyContainer}>
    <Text style={styles.trophyEmoji}>🏆</Text>
  </View>
);

type QuestionCardProps = {
  index: number;
  question: string;
  points?: number;
  answer: number;
  correctAnswer: number;
  isWrong: boolean;
};

const formatTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes} : ${remainingSeconds}`;
};

const QuestionCard = ({
  index,
  question,
  points,
  answer,
  correctAnswer,
  isWrong,
}: QuestionCardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, index, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.card,
        isWrong && styles.cardWrong,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {isWrong && (
        <View style={styles.wrongBadge}>
          <Text style={styles.wrongBadgeText}>
            {`Question ${index + 1} — Keep Practising!`}
          </Text>
        </View>
      )}

      <View style={styles.cardRow}>
        {/* Left: Abacus Icon placeholder */}
        <View style={[styles.abacusIcon, isWrong && styles.abacusIconWrong]}>
          <Text style={styles.abacusEmoji}>🧮</Text>
        </View>

        {/* Middle: Question */}
        <View style={styles.questionArea}>
          {!isWrong && (
            <Text style={styles.questionLabel}>Question {index + 1}</Text>
          )}
          <Text
            style={[styles.questionText, isWrong && styles.questionTextWrong]}
          >
            {question}
          </Text>
        </View>

        {/* Right: Answer + Icon */}
        <View style={styles.answerArea}>
          <Text
            style={[styles.answerLabel, isWrong && styles.answerLabelWrong]}
          >
            YOUR ANSWER
          </Text>
          <View style={styles.answerRow}>
            <Text
              style={[styles.answerValue, isWrong && styles.answerValueWrong]}
            >
              {answer}
            </Text>
            {isWrong ? <CrossIcon /> : <CheckIcon />}
          </View>
          {typeof points === 'number' && points > 0 && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{points} pts</Text>
            </View>
          )}
        </View>
      </View>

      {isWrong && (
        <View style={styles.tipRow}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Nice try! The correct answer is <Text>{correctAnswer}</Text>
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default function QuizReviewScreen() {
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  const homeworkId = useSelector((state: RootState) => state.common.homeworkId);
  const questions = useSelector((state: RootState) => state.common.questions);
  const storedMarks = useSelector((state: RootState) => state.common.marks);

  const { data: hw, isLoading } = useGetHomeworkByIdQuery(
    { homeworkId: homeworkId ?? '' },
    {
      skip: !isFocused || !homeworkId,
    },
  );

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scoreAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, scoreAnim]);

  const marks = hw?.question?.marks ?? storedMarks;
  const hasMarks = Array.isArray(marks) && marks.length > 0;
  const totalMarks = hasMarks
    ? marks.reduce((total, mark) => total + mark, 0)
    : 0;
  const earnedMarks =
    hasMarks && hw?.result
      ? hw.result.reduce((total, isCorrect, index) => {
          return total + (isCorrect ? marks[index] ?? 0 : 0);
        }, 0)
      : 0;
  const correctAnswers = hw?.result?.filter(val => val === true)?.length ?? 0;
  const totalQuestions = hw?.result?.length ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <Header
        heading="Quiz Review"
        sideHead={`⭐ Level ${hw?.questionLabel ?? ''}`}
      />

      {isFocused && isLoading && !hw ? (
        <View style={styles.loaderWrap}>
          <LoadingState label="Loading quiz review..." />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Score Card */}
          <Animated.View
            style={[
              styles.heroCard,
              {
                opacity: headerAnim,
                transform: [
                  {
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Great Job!</Text>
              <View style={styles.heroStatsLayout}>
                <View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillLabel}>
                      {hasMarks ? 'FINAL MARKS' : 'FINAL SCORE'}
                    </Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Animated.View
                      style={{
                        transform: [{ scale: scoreAnim }],
                      }}
                    >
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreNumber}>
                          {hasMarks ? earnedMarks : correctAnswers}
                        </Text>
                        <Text style={styles.scoreTotal}>
                          /{hasMarks ? totalMarks : totalQuestions}
                        </Text>
                      </View>
                    </Animated.View>
                  </View>
                </View>
                <View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillLabel}>TIME TAKEN</Text>
                  </View>
                  <Animated.View
                    style={{
                      transform: [{ scale: scoreAnim }],
                    }}
                  >
                    <View style={styles.scoreRow}>
                      <Text style={styles.timerShow}>
                        {formatTime(hw?.timer)}
                      </Text>
                    </View>
                  </Animated.View>
                </View>
              </View>
            </View>
            <View style={styles.heroRight}>
              <TrophyIcon />
            </View>
          </Animated.View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Detailed Results</Text>

          {/* Question Cards */}
          {hw &&
            questions &&
            questions.map((question, index) => (
              <QuestionCard
                key={question}
                index={index}
                question={question}
                points={marks[index]}
                answer={hw?.answer[index]}
                correctAnswer={evaluateExpression(question)}
                isWrong={!hw?.result[index]}
              />
            ))}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF4FF';
const RED = '#EF4444';
const RED_LIGHT = '#FEF2F2';
const GREEN = '#22C55E';
const TEXT = '#1E293B';
const MUTED = '#64748B';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomSpacer: {
    height: 32,
  },
  loaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: BLUE,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroStatsLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
    marginBottom: 14,
  },
  scorePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  scorePillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 54,
  },
  timerShow: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 54,
  },
  scoreTotal: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  timeTakenCard: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeTakenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  timeTakenValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  trophyContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  trophyEmoji: {
    fontSize: 36,
  },

  // Section
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardWrong: {
    backgroundColor: RED_LIGHT,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  wrongBadge: {
    backgroundColor: RED,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  wrongBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  abacusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abacusIconWrong: {
    backgroundColor: '#FEE2E2',
  },
  abacusEmoji: {
    fontSize: 22,
  },

  questionArea: {
    flex: 1,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  pointsBadge: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 7,
  },
  pointsText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.5,
  },
  questionTextWrong: {
    color: RED,
  },

  answerArea: {
    alignItems: 'flex-end',
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  answerLabelWrong: {
    color: '#EF4444',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerValue: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
  },
  answerValueWrong: {
    color: RED,
  },

  // Check / Cross
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  crossIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Tip row
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  showMeBtn: {
    backgroundColor: RED,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  showMeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
