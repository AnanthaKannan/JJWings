import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { NumPad, QuizSuccessModal } from './index';

// ─── Types ───────────────────────────────────────────────
interface QuizScreenProps {
  playerAvatar?: any;
  totalQuestions?: number;
  currentQuestion?: number;
  // question?: string;
}

type QuizData = {
  questions: string[];
  answer: number[]; // or string[] depending on your use
  result: boolean[]; // or boolean[] if it's correct/incorrect
};

type RootStackParamList = {
  Home: undefined;
  HomeworkScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Component ───────────────────────────────────────────
export default function QuizScreen({}: // currentQuestion = 1,
// question = '12 + 5 + 10 + 20 + 5 = ?',
QuizScreenProps) {
  const [data, setData] = useState<QuizData>({
    questions: ['12 + 15 + 10', '15 + 10 + 321', '20 + 55 + 121'],
    answer: [],
    result: [],
  });
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { questions, answer, result } = data;

  // Progress percentage
  const progress = result.length / questions.length;

  const onSubmit = (value: number) => {
    const updatedData = {
      ...data,
      answer: [...answer, value],
      result: [...result, true],
    };
    setData(updatedData);

    if (updatedData.answer.length === updatedData.questions.length) {
      // consider all the question are attend
      // apiCall
      setModalVisible(true);
    }
  };

  return (
    // <SafeAreaView style={styles.safeArea}>
    <View>
      <QuizSuccessModal
        visible={modalVisible}
        onClose={() => setModalVisible(true)}
        onSeeResults={() => {
          setModalVisible(false);
          navigation.navigate('HomeworkScreen');
        }}
        timeTaken="02:45"
        accuracy="95%"
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

          {/* Question row */}
          <View style={styles.questionRow}>
            <Text style={styles.questionText}>
              {questions[result.length]} = ?
            </Text>
            {/* <Text style={styles.questionText}>{' 20'}</Text>
          <Text style={styles.questionText}>{'-50'}</Text> */}
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
  questionRow: {
    // flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1A2259',
    letterSpacing: 1,
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
