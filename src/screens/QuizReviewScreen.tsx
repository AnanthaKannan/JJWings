import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { useGetHomeworkByIdQuery } from '../store/api';
import { RootState } from '../store/store';
import { Header, LoadingState } from '../component';
import { evaluateExpression } from '../util/fn';
import { QuizReviewScreenStyles as styles } from './styles/QuizReviewScreen.styles';

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

  return `${minutes}:${remainingSeconds}`;
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
  const route = useRoute<any>();

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
  const isExam = route.params?.type === 'exam';

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
                <View style={styles.statBlock}>
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
                  {isExam && hasMarks ? (
                    <Text style={styles.scoreSubText}>
                      Questions {correctAnswers}/{totalQuestions}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.statBlock, styles.timeStatBlock]}>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillLabel}>TIME TAKEN</Text>
                  </View>
                  <Animated.View
                    style={{
                      transform: [{ scale: scoreAnim }],
                    }}
                  >
                    <View style={styles.timerRow}>
                      <Text
                        style={styles.timerShow}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                      >
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
