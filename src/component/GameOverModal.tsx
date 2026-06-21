import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../screens/theme';

interface GameOverModalProps {
  visible: boolean;
  score: number;
  best: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

// ─── Confetti setup ─────────────────────────────────────────────────────────

const CONFETTI_COUNT = 18;
const CONFETTI_EMOJIS = ['🎉', '⭐', '🎈', '✨', '🟡', '🔴', '🔵', '🟢'];

type ConfettiPiece = {
  id: number;
  left: number;
  emoji: string;
  delay: number;
  duration: number;
  size: number;
};

const buildConfetti = (): ConfettiPiece[] =>
  Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 92,
    emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
    delay: Math.random() * 700,
    duration: 2200 + Math.random() * 1400,
    size: 15 + Math.random() * 13,
  }));

const ConfettiBit = ({ piece, active }: { piece: ConfettiPiece; active: boolean }) => {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;

    if (active) {
      fall.setValue(0);
      loop = Animated.loop(
        Animated.timing(fall, {
          toValue: 1,
          duration: piece.duration,
          delay: piece.delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
    }

    return () => {
      loop?.stop();
    };
  }, [active, fall, piece.delay, piece.duration]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 460],
  });
  const rotate = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.05, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.Text
      style={[
        styles.confettiPiece,
        {
          left: `${piece.left}%`,
          fontSize: piece.size,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      {piece.emoji}
    </Animated.Text>
  );
};

// ─── Main modal ─────────────────────────────────────────────────────────────

export default function GameOverModal({
  visible,
  score,
  best,
  onPlayAgain,
  onExit,
}: GameOverModalProps) {
  const [confetti] = useState<ConfettiPiece[]>(buildConfetti);
  const [displayScore, setDisplayScore] = useState(0);

  const cardScale = useRef(new Animated.Value(0.4)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scoreCount = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  const isNewBest = score > 0 && score >= best;

  // Card entrance + score count-up + best badge pop
  useEffect(() => {
    if (!visible) {
      cardScale.setValue(0.4);
      cardOpacity.setValue(0);
      badgeScale.setValue(0);
      setDisplayScore(0);
      return;
    }

    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    scoreCount.setValue(0);
    const listenerId = scoreCount.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });
    Animated.timing(scoreCount, {
      toValue: score,
      duration: 700,
      delay: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    if (isNewBest) {
      Animated.sequence([
        Animated.delay(700),
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      scoreCount.removeListener(listenerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, score, isNewBest]);

  // Continuous bounce for the header emoji
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;

    if (visible) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 450,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    }

    return () => loop?.stop();
  }, [visible, bounceAnim]);

  // Continuous gentle pulse for the Play Again button
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;

    if (visible) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    }

    return () => loop?.stop();
  }, [visible, pulseAnim]);

  const handlePlayAgainPressIn = () => {
    Animated.spring(pulseAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePlayAgainPressOut = () => {
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        {/* Confetti layer */}
        <View style={styles.confettiLayer} pointerEvents="none">
          {confetti.map(piece => (
            <ConfettiBit key={piece.id} piece={piece} active={visible} />
          ))}
        </View>

        <Animated.View
          style={[
            styles.card,
            isNewBest && styles.cardBest,
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          <Animated.Text
            style={[styles.emoji, { transform: [{ translateY: bounceAnim }] }]}
          >
            🧮✨
          </Animated.Text>

          <Text style={styles.title}>Good Try!</Text>
          <Text style={styles.subtitle}>All hearts used up</Text>

          {isNewBest && (
            <Animated.View
              style={[styles.bestBadge, { transform: [{ scale: badgeScale }] }]}
            >
              <Text style={styles.bestBadgeText}>🏆 NEW BEST!</Text>
            </Animated.View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SCORE</Text>
              <Text style={styles.statValue}>{displayScore}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BEST</Text>
              <Text style={styles.statValue}>{best}</Text>
            </View>
          </View>

          <Animated.View style={{ width: '100%', transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.playAgainButton}
              activeOpacity={0.85}
              onPress={onPlayAgain}
              onPressIn={handlePlayAgainPressIn}
              onPressOut={handlePlayAgainPressOut}
            >
              <View style={styles.playAgainIcon}>
                <Text style={styles.playAgainIconText}>▶</Text>
              </View>
              <View style={styles.playAgainTextWrap}>
                <Text style={styles.playAgainTitle}>Play Again</Text>
                <Text style={styles.playAgainHint}>Same level · fresh run</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.exitButton}
            activeOpacity={0.75}
            onPress={onExit}
          >
            <Text style={styles.exitButtonText}>Exit Game</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.sun,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  cardBest: {
    borderColor: '#FACC15',
    shadowColor: '#FACC15',
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  emoji: {
    fontSize: 44,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textDark,
    opacity: 0.7,
    marginBottom: 14,
  },
  bestBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FACC15',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  bestBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    backgroundColor: '#FFF8EB',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(139, 94, 52, 0.2)',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    opacity: 0.6,
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#2BA86A',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  playAgainIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playAgainIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 2,
  },
  playAgainTextWrap: {
    flex: 1,
  },
  playAgainTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  playAgainHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  exitButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  exitButtonText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
});