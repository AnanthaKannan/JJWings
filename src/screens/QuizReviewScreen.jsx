import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Header } from '../component';

const QUESTIONS = [
  {
    id: 1,
    question: '15 + 4 + 20 + 22 + 33',
    yourAnswer: 19,
    correctAnswer: 19,
    isCorrect: true,
    tip: null,
  },
  {
    id: 2,
    question: '22 + 9',
    yourAnswer: 30,
    correctAnswer: 31,
    isCorrect: false,
    label: 'Question 2 — Keep Practising!',
    tip: 'Nice try! The correct answer is 25',
  },
  {
    id: 3,
    question: '8 − 3',
    yourAnswer: 5,
    correctAnswer: 5,
    isCorrect: true,
    tip: null,
  },
  {
    id: 4,
    question: '56 + 12',
    yourAnswer: 68,
    correctAnswer: 68,
    isCorrect: true,
    tip: null,
  },
];

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

const QuestionCard = ({ item, index }) => {
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
  }, []);

  const isWrong = !item.isCorrect;

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
            {item.label || `Question ${item.id} — Keep Practising!`}
          </Text>
        </View>
      )}

      <View style={styles.cardRow}>
        {/* Left: Abacus Icon placeholder */}
        <View style={[styles.abacusIcon, isWrong && styles.abacusIconWrong]}>
          <Text style={styles.abacusEmoji}>{isWrong ? '🧮' : '🧮'}</Text>
        </View>

        {/* Middle: Question */}
        <View style={styles.questionArea}>
          {!isWrong && (
            <Text style={styles.questionLabel}>Question {item.id}</Text>
          )}
          <Text
            style={[styles.questionText, isWrong && styles.questionTextWrong]}
          >
            {item.question}
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
              {item.yourAnswer}
            </Text>
            {item.isCorrect ? <CheckIcon /> : <CrossIcon />}
          </View>
        </View>
      </View>

      {isWrong && item.tip && (
        <View style={styles.tipRow}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Nice try! The correct answer is <Text>25</Text>
          </Text>
          {/* <TouchableOpacity style={styles.showMeBtn}>
            <Text style={styles.showMeText}>Show Me</Text>
          </TouchableOpacity> */}
        </View>
      )}
    </Animated.View>
  );
};

export default function QuizReviewScreen() {
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

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
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <Header />
      {/* Top Bar */}
      {/* <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Quiz Review</Text>
        </TouchableOpacity>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>⭐ Level 5A-01</Text>
        </View>
      </View> */}

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
            {/* <Text style={styles.heroSub}>
              You've mastered the 'Big Friend' addition Technique
            </Text> */}
            <View style={styles.scorePill}>
              <Text style={styles.scorePillLabel}>FINAL SCORE</Text>
            </View>
            <Animated.View
              style={{
                transform: [{ scale: scoreAnim }],
              }}
            >
              <View style={styles.scoreRow}>
                <Text style={styles.scoreNumber}>18</Text>
                <Text style={styles.scoreTotal}>/20</Text>
              </View>
            </Animated.View>
          </View>
          <View style={styles.heroRight}>
            <TrophyIcon />
          </View>
        </Animated.View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Detailed Results</Text>

        {/* Question Cards */}
        {QUESTIONS.map((item, index) => (
          <QuestionCard key={item.id} item={item} index={index} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF4FF';
const RED = '#EF4444';
const RED_LIGHT = '#FEF2F2';
const GREEN = '#22C55E';
const GOLD = '#F59E0B';
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
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
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
