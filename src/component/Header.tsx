import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
  playerName?: string;
  score?: number;
}

export default function Header({ playerName, score }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.playerInfo}>
        {/* Avatar placeholder */}
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🧑</Text>
        </View>
        <Text style={styles.playerName}>{playerName}</Text>
      </View>

      {/* Score Badge */}
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.starEmoji}>⭐</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
