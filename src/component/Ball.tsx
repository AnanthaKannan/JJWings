import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BALL_SIZE } from '../screens/theme';
import { BeadTheme, Question } from '../types';

interface BallProps {
  question: Question;
  input: string;
  color: BeadTheme;
  left: number;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  shakeX: Animated.Value;
}

const operatorSymbol: Record<string, string> = {
  '+': '+',
  '-': '−',
};

export default function Ball({
  question,
  input,
  color,
  left,
  translateY,
  scale,
  opacity,
  shakeX,
}: BallProps) {
  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          left,
          opacity,
          transform: [{ translateY }, { translateX: shakeX }, { scale }],
        },
      ]}
    >
      <View style={[styles.ball, { backgroundColor: color.base }]}>
        <View style={[styles.shine, { backgroundColor: color.shine }]} />
        <View style={styles.content}>
          <Text
            style={styles.questionText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {question.a} {operatorSymbol[question.operator]} {question.b}
          </Text>
          <View style={styles.answerRow}>
            <Text style={styles.equalsText}>=</Text>
            <View style={styles.answerBox}>
              <Text
                style={[
                  styles.answerText,
                  !input.length && styles.answerPlaceholder,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {input || '?'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    width: BALL_SIZE,
    height: BALL_SIZE,
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  shine: {
    position: 'absolute',
    top: 10,
    left: 14,
    width: BALL_SIZE * 0.32,
    height: BALL_SIZE * 0.18,
    borderRadius: 20,
    opacity: 0.85,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  questionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equalsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  answerBox: {
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  answerText: {
    color: '#2D3748',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    minWidth: 14,
  },
  answerPlaceholder: {
    color: '#94A3B8',
  },
});
