import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  playerName?: string;
  score?: number;
}

export default function Header({ playerName, score }: HeaderProps) {
  const navigation = useNavigation();
  const handleBack = () => {
    navigation.navigate('HomeworkScreen');
  };

  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backText}>Quiz Review</Text>
      </TouchableOpacity>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>⭐ Level 5A-01</Text>
      </View>
    </View>
  );
}

const TEXT = '#1E293B';

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F4FF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backArrow: {
    fontSize: 28,
    color: TEXT,
    lineHeight: 32,
    marginTop: -2,
  },
  backText: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.3,
  },
  levelBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  levelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
});
