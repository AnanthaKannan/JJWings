import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { NumPad, QuizSuccessModal } from './index';
import { RootState } from '../store/store';
import { useUpdateHomeworkMutation } from '../store/api';
import { HomeworkState } from '../util/enum';
import { evaluateExpression } from '../util/fn';
import {
  formatQuestionForSpeech,
  ORAL_SPEECH_RATE,
  speakOralQuestion,
  stopOralQuestionSpeech,
} from '../util/oralSpeech';

// ─── Types ───────────────────────────────────────────────
interface QuizScreenProps {
  timer: number;
}

type QuizData = {
  questions: string[];
  marks: number[];
  answer: number[]; // or string[] depending on your use
  result: boolean[]; // or boolean[] if it's correct/incorrect
};

type RootStackParamList = {
  Home: undefined;
  HomeworkScreen: undefined;
  QuizReview: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Component ───────────────────────────────────────────
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
};

const formatAccuracy = (result: boolean[]) => {
  if (result.length === 0) return '0%';

  const correctAnswers = result.filter(Boolean).length;
  return `${Math.round((correctAnswers / result.length) * 100)}%`;
};

const getVerticalQuestionParts = (question = '') => {
  const parts = question.replace(/\s/g, '').match(/[+\-*/]?\d+(?:\.\d+)?/g);
  if (!parts || parts.join('') !== question.replace(/\s/g, '')) {
    return [question];
  }

  return parts.map((part, index) => {
    if (index === 0) return part;

    const operator = part[0];
    const value = part.slice(1);
    return `${operator} ${value}`;
  });
};

const formatHorizontalQuestion = (question = '') => {
  const parts = getVerticalQuestionParts(question);
  if (parts.length === 1) return parts[0];

  return parts.join(' ');
};

const getOralSpeechDuration = (question = '') => {
  const wordCount = formatQuestionForSpeech(question).split(/\s+/).filter(Boolean)
    .length;
  return Math.min(Math.max((wordCount * 430) / ORAL_SPEECH_RATE, 1800), 4200);
};

export default function QuizScreen({ timer }: QuizScreenProps) {
  const selResult = useSelector((state: RootState) => state.common.result);
  const selAnswer = useSelector((state: RootState) => state.common.answer);
  const selMarks = useSelector((state: RootState) => state.common.marks);
  const isOral = useSelector((state: RootState) => state.common.oral);
  const homeworkId = useSelector((state: RootState) => state.common.homeworkId);
  const isHorizontal = useSelector((state: RootState) => state.common.vertical);

  const selQuestions = useSelector(
    (state: RootState) => state.common.questions,
  );
  const [updateHomework] = useUpdateHomeworkMutation();

  const [data, setData] = useState<QuizData>({
    questions: [],
    marks: [],
    answer: [],
    result: [],
  });
  const [completionStats, setCompletionStats] = useState({
    timeTaken: '00:00',
    accuracy: '0%',
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakerPulse = useRef(new Animated.Value(0)).current;
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(prev => ({
      ...prev,
      result: selResult,
      questions: selQuestions,
      marks: selMarks,
      answer: selAnswer,
    }));
  }, [selQuestions, selResult, selAnswer, selMarks]);

  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { questions, marks, answer, result } = data;
  const currentQuestion = questions[result.length] ?? '';
  const currentMarks = marks[result.length];
  const shouldShowMarks = typeof currentMarks === 'number' && currentMarks > 0;
  const verticalQuestionParts = getVerticalQuestionParts(currentQuestion);
  const horizontalQuestion = formatHorizontalQuestion(currentQuestion);

  const stopSpeakerAnimation = useCallback(() => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const playOralQuestion = useCallback((question: string) => {
    if (!speakOralQuestion(question)) return;

    stopSpeakerAnimation();
    setIsSpeaking(true);
    speechTimerRef.current = setTimeout(
      stopSpeakerAnimation,
      getOralSpeechDuration(question),
    );
  }, [stopSpeakerAnimation]);

  useEffect(() => {
    if (!isSpeaking) {
      speakerPulse.stopAnimation();
      speakerPulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(speakerPulse, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(speakerPulse, {
          toValue: 0,
          duration: 520,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isSpeaking, speakerPulse]);

  useEffect(() => {
    if (isOral && currentQuestion) {
      playOralQuestion(currentQuestion);
    }

    return () => {
      stopSpeakerAnimation();
      stopOralQuestionSpeech();
    };
  }, [currentQuestion, isOral, playOralQuestion, stopSpeakerAnimation]);

  // Progress percentage
  const progress = result.length / questions.length;

  const calculate = (studentRes: number) => {
    const expectedRes = evaluateExpression(questions[result.length]);
    if (studentRes === expectedRes) return true;
    return false;
  };

  const onSubmit = async (value: number) => {
    if (!homeworkId) return;

    const updatedData = {
      ...data,
      answer: [...answer, value],
      result: [...result, calculate(value)],
    };

    setData(updatedData);

    if (updatedData.answer.length === updatedData.questions.length) {
      // consider all the question are attend
      // apiCall
      await updateHomework({
        homeworkId,
        state: HomeworkState.COMPLETED,
        result: updatedData.result,
        answer: updatedData.answer,
        success: updatedData.result.filter(bool => bool === true).length,
        failure: updatedData.result.filter(bool => bool === false).length,
        timer,
      });
      setCompletionStats({
        timeTaken: formatTime(timer),
        accuracy: formatAccuracy(updatedData.result),
      });
      setModalVisible(true);
    } else {
      await updateHomework({
        homeworkId,
        state: HomeworkState.PROGRESS,
        result: updatedData.result,
        answer: updatedData.answer,
        timer,
      });
    }
  };

  const handleRepeatQuestion = () => {
    playOralQuestion(currentQuestion);
  };

  const speakerScale = speakerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const speakerHaloScale = speakerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.28],
  });
  const speakerHaloOpacity = speakerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0],
  });

  return (
    // <SafeAreaView style={styles.safeArea}>
    <View>
      <QuizSuccessModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSeeResults={() => {
          setModalVisible(false);
          navigation.navigate('QuizReview');
        }}
        timeTaken={completionStats.timeTaken}
        accuracy={completionStats.accuracy}
      />
      <View style={styles.container}>
        {/* ── Question Card ── */}
        <View style={styles.questionCard}>
          {/* Question number label */}
          <View style={styles.questionLabel}>
            <Text style={styles.questionLabelText}>
              Question {result.length + 1} of {questions.length}
            </Text>
          </View>
          {shouldShowMarks && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{currentMarks} pts</Text>
            </View>
          )}

          {/* Question row */}
          <View
            style={[
              styles.questionRow,
              !isHorizontal && styles.verticalQuestionRow,
              isOral && styles.oralQuestionRow,
            ]}
          >
            {isOral ? (
              <View style={styles.oralPrompt}>
                <Animated.View
                  style={[
                    styles.oralIconHalo,
                    {
                      opacity: speakerHaloOpacity,
                      transform: [{ scale: speakerHaloScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.oralIconWrap,
                    { transform: [{ scale: speakerScale }] },
                  ]}
                >
                  <MaterialIcons
                    name={isSpeaking ? 'volume-up' : 'volume-down'}
                    size={34}
                    color="#2563EB"
                  />
                </Animated.View>
                <Text style={styles.oralTitle}>Listen and answer</Text>
                <TouchableOpacity
                  style={styles.repeatIconButton}
                  onPress={handleRepeatQuestion}
                  activeOpacity={0.82}
                >
                  <MaterialIcons name="replay" size={24} color="#2563EB" />
                </TouchableOpacity>
              </View>
            ) : isHorizontal ? (
              <Text style={styles.questionText}>{horizontalQuestion} = ?</Text>
            ) : (
              <View style={styles.verticalQuestion}>
                {verticalQuestionParts.map((part, index) => (
                  <Text key={`${part}-${index}`} style={styles.questionText}>
                    {part}
                  </Text>
                ))}
                <View style={styles.answerLine} />
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      </View>
      <NumPad onSubmit={onSubmit} />
    </View>
    // </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  // safeArea: {
  //   flex: 1,
  //   backgroundColor: '#EEF2FF',
  // },
  container: {
    // flex: 1,
    // paddingHorizontal: 20,
    // paddingTop: 16,
    gap: 16,
    backgroundColor: '#EEF2FF',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C7D4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2259',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#B0BADF',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2259',
  },
  starEmoji: {
    fontSize: 16,
  },

  // ── Question Card ──
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    shadowColor: '#B0BADF',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  questionLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  questionLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6AA8',
  },
  pointsBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    minHeight: 30,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
  },
  questionRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  verticalQuestionRow: {
    alignItems: 'center',
  },
  oralQuestionRow: {
    minHeight: 170,
    justifyContent: 'center',
  },
  oralPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
  },
  oralIconHalo: {
    position: 'absolute',
    top: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#93C5FD',
  },
  oralIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oralTitle: {
    color: '#1A2259',
    fontSize: 20,
    fontWeight: '900',
  },
  repeatIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalQuestion: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  questionText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1A2259',
    letterSpacing: 1,
  },
  answerLine: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1A2259',
    marginTop: 4,
    marginBottom: 4,
  },
  operatorBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  operatorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  operatorIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A6AA8',
    width: 20,
    textAlign: 'center',
  },

  // Progress Bar
  progressTrack: {
    height: 8,
    backgroundColor: '#DDE3F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A6CF7',
    borderRadius: 10,
    minWidth: 20,
  },

  // ── Timer Card ──
  timerCard: {
    backgroundColor: '#F5C97A',
    borderRadius: 28,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D4A044',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  timerIcon: {
    fontSize: 36,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#7A4A00',
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9A6A10',
    letterSpacing: 0.5,
  },
});
