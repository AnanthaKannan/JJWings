import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface TimerProps {
  totalTimeSeconds?: number;
}

export default function Timer({
  totalTimeSeconds = 0, // 2:45
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalTimeSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        // if (prev <= 1) {
        //   clearInterval(intervalRef.current!);
        //   return 0;
        // }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.timerCard}>
      <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Timer Card ──
  timerCard: {
    backgroundColor: '#F5C97A',
    borderRadius: 28,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    // gap: 8,
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
    fontSize: 28,
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
