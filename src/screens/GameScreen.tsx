import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Ball from '../component/Ball';
import NumberPad from '../component/NumberPad';
import Header from '../component/Header';
import AbacusFloor from '../component/AbacusFloor';
import GameOverModal from '../component/GameOverModal';
import { BEAD_COLORS, BALL_SIZE, COLORS, TOTAL_LIVES } from './theme';
import {
  GAME_LEVELS,
  generateQuestion,
  getFallDuration,
} from '../util/questionGenerator';
import { BeadTheme, GameLevel, GamePhase, Question } from '../types';

function Cloud({ style }: { style: object }) {
  return (
    <View style={[styles.cloud, style]}>
      <View style={[styles.cloudPuff, styles.cloudPuffMain]} />
      <View style={[styles.cloudPuff, styles.cloudPuffLeft]} />
      <View style={[styles.cloudPuff, styles.cloudPuffRight]} />
    </View>
  );
}

export default function GameScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(0);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState('');
  const [ballColor, setBallColor] = useState<BeadTheme>(BEAD_COLORS[0]);
  const [ballLeft, setBallLeft] = useState(40);
  const [skySize, setSkySize] = useState({ width: 0, height: 0 });

  const scoreRef = useRef(0);
  const livesRef = useRef(TOTAL_LIVES);
  const levelRef = useRef<GameLevel>(0);
  const resolvedRef = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const translateY = useRef(new Animated.Value(-BALL_SIZE)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  const resetToWelcome = useCallback(() => {
    animationRef.current?.stop();
    scoreRef.current = 0;
    livesRef.current = TOTAL_LIVES;
    resolvedRef.current = false;
    setPhase('ready');
    setQuestion(null);
    setInput('');
    setScore(0);
    setLives(TOTAL_LIVES);
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        resetToWelcome();
        navigation.getParent()?.setOptions({
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
          },
        });
      };
    }, [navigation, resetToWelcome]),
  );

  useEffect(() => {
    return () => {
      animationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    levelRef.current = selectedLevel;
  }, [selectedLevel]);

  function onSkyLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSkySize({ width, height });
  }

  useEffect(() => {
    if (phase === 'playing' && skySize.height > 0 && !question) {
      spawnBall(scoreRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, skySize.height]);

  useEffect(() => {
    if (!question) return;
    if (input.length > 0 && input.length === String(question.answer).length) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  function updateScore(value: number) {
    scoreRef.current = value;
    setScore(value);
  }

  function updateLives(value: number) {
    livesRef.current = value;
    setLives(value);
  }

  function spawnBall(forScore: number) {
    if (skySize.height <= 0 || skySize.width <= 0) return;

    resolvedRef.current = false;
    const q = generateQuestion(forScore, levelRef.current);
    setQuestion(q);
    setInput('');
    setBallColor(BEAD_COLORS[Math.floor(Math.random() * BEAD_COLORS.length)]);

    const maxLeft = Math.max(skySize.width - BALL_SIZE - 16, 16);
    setBallLeft(16 + Math.random() * (maxLeft - 16));

    translateY.setValue(-BALL_SIZE);
    scale.setValue(1);
    opacity.setValue(1);
    shakeX.setValue(0);

    const duration = getFallDuration(forScore, levelRef.current);
    const anim = Animated.timing(translateY, {
      toValue: skySize.height - BALL_SIZE,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animationRef.current = anim;
    anim.start(({ finished }) => {
      if (finished && !resolvedRef.current) {
        resolvedRef.current = true;
        handleMiss();
      }
    });
  }

  function handleMiss() {
    const newLives = Math.max(livesRef.current - 1, 0);
    updateLives(newLives);
    setQuestion(null);

    if (newLives <= 0) {
      setPhase('gameover');
      return;
    }
    setTimeout(() => spawnBall(scoreRef.current), 300);
  }

  function handleCorrect() {
    resolvedRef.current = true;
    animationRef.current?.stop();

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.7,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const next = scoreRef.current + 1;
      updateScore(next);
      setBest(prevBest => Math.max(prevBest, next));
      setQuestion(null);
      spawnBall(next);
    });
  }

  function handleSubmit() {
    if (!question || phase !== 'playing') return;
    const numeric = parseInt(input, 10);

    if (!Number.isNaN(numeric) && numeric === question.answer) {
      handleCorrect();
    } else {
      setInput('');
      Animated.sequence([
        Animated.timing(shakeX, {
          toValue: -8,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 8,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: -6,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: 55,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }

  function onDigit(digit: string) {
    setInput(prev => (prev.length < 3 ? prev + digit : prev));
  }

  function onBackspace() {
    setInput(prev => prev.slice(0, -1));
  }

  function startGame() {
    animationRef.current?.stop();
    updateScore(0);
    updateLives(TOTAL_LIVES);
    setQuestion(null);
    setInput('');
    setPhase('playing');
  }

  function exitGame() {
    animationRef.current?.stop();
    resetToWelcome();
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Progress');
  }

  const selectedLevelConfig =
    GAME_LEVELS.find(entry => entry.level === selectedLevel) ?? GAME_LEVELS[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header heading="Game" sideHead={`⭐ ${score} • ♥ ${lives}`} />

      <View style={styles.skyContainer} onLayout={onSkyLayout}>
        <View style={styles.skyGradientTop} />
        <View style={styles.skyGradientBottom} />

        <Cloud style={styles.cloudOne} />
        <Cloud style={styles.cloudTwo} />
        <Cloud style={styles.cloudThree} />

        <View style={styles.sunGlow} />
        <View style={styles.sun} />

        <View style={styles.hillBack} />
        <View style={styles.hillFront} />

        {phase === 'playing' && question && skySize.height > 0 && (
          <Ball
            question={question}
            input={input}
            color={ballColor}
            left={ballLeft}
            translateY={translateY}
            scale={scale}
            opacity={opacity}
            shakeX={shakeX}
          />
        )}

        {phase === 'ready' && (
          <View style={styles.readyOverlay}>
            <ScrollView
              contentContainerStyle={styles.readyContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeEmoji}>🪁</Text>
                <Text style={styles.gameTitle}>JJ Brain Wings</Text>
                <Text style={styles.gameTitleAccent}>Abacus Adventure</Text>
                <Text style={styles.gameSubtitle}>
                  Pop the falling bead-balls before they hit the floor!
                </Text>

                <Text style={styles.levelHeading}>Choose your level</Text>
                <TouchableOpacity
                  style={styles.levelDropdownButton}
                  onPress={() => setLevelModalVisible(true)}
                >
                  <View style={styles.levelDropdownContent}>
                    <Text style={styles.levelDropdownEmoji}>
                      {selectedLevelConfig.emoji}
                    </Text>
                    <View style={styles.levelDropdownTextWrap}>
                      <Text style={styles.levelDropdownTitle}>
                        {selectedLevelConfig.title}
                      </Text>
                      <Text style={styles.levelDropdownSubtitle}>
                        {selectedLevelConfig.description.split(' · ')[0]}
                      </Text>
                    </View>
                    <Text style={styles.levelDropdownArrow}>▼</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.startButton}
                  activeOpacity={0.88}
                  onPress={startGame}
                >
                  <View style={styles.startButtonInner}>
                    <View style={styles.startIconCircle}>
                      <Text style={styles.startIcon}>▶</Text>
                    </View>
                    <View style={styles.startTextWrap}>
                      <Text style={styles.startButtonText}>Start Game</Text>
                      <Text style={styles.startButtonHint}>
                        {selectedLevelConfig.emoji} {selectedLevelConfig.title}{' '}
                        · {selectedLevelConfig.description.split(' · ')[0]}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      <AbacusFloor />

      {phase === 'playing' && (
        <View
          style={[
            styles.controlsPanel,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <NumberPad
            onDigit={onDigit}
            onBackspace={onBackspace}
            onSubmit={handleSubmit}
          />
        </View>
      )}

      <GameOverModal
        visible={phase === 'gameover'}
        score={score}
        best={best}
        onPlayAgain={startGame}
        onExit={exitGame}
      />

      <Modal
        visible={levelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLevelModalVisible(false)}
      >
        <View style={styles.levelModalOverlay}>
          <View style={styles.levelModalContent}>
            <View style={styles.levelModalHeader}>
              <Text style={styles.levelModalTitle}>Select Level</Text>
              <TouchableOpacity
                onPress={() => setLevelModalVisible(false)}
                style={styles.levelModalCloseBtn}
              >
                <Text style={styles.levelModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.levelModalList}
              showsVerticalScrollIndicator={true}
            >
              {GAME_LEVELS.map(levelOption => {
                const isSelected = selectedLevel === levelOption.level;
                return (
                  <TouchableOpacity
                    key={levelOption.level}
                    style={[
                      styles.levelModalItem,
                      isSelected && styles.levelModalItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedLevel(levelOption.level);
                      setLevelModalVisible(false);
                    }}
                  >
                    <Text style={styles.levelModalItemEmoji}>
                      {levelOption.emoji}
                    </Text>
                    <View style={styles.levelModalItemText}>
                      <Text style={styles.levelModalItemTitle}>
                        {levelOption.title}
                      </Text>
                      <Text style={styles.levelModalItemDesc}>
                        {levelOption.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.levelModalItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#5BA8D4',
  },
  skyContainer: {
    flex: 1,
    backgroundColor: '#7EC8E8',
    overflow: 'hidden',
    position: 'relative',
  },
  skyGradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3D7EB8',
    opacity: 0.38,
    height: '55%',
  },
  skyGradientBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
    backgroundColor: '#C5EEFF',
    opacity: 0.45,
  },
  cloud: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cloudPuff: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999,
  },
  cloudPuffMain: {
    width: 44,
    height: 28,
  },
  cloudPuffLeft: {
    width: 28,
    height: 22,
    marginBottom: 2,
    marginLeft: -10,
  },
  cloudPuffRight: {
    width: 32,
    height: 24,
    marginBottom: 4,
    marginLeft: -8,
  },
  cloudOne: {
    top: '12%',
    left: '8%',
    opacity: 0.92,
  },
  cloudTwo: {
    top: '22%',
    right: '10%',
    opacity: 0.85,
    transform: [{ scale: 1.15 }],
  },
  cloudThree: {
    top: '38%',
    left: '18%',
    opacity: 0.7,
    transform: [{ scale: 0.85 }],
  },
  sunGlow: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFE566',
    opacity: 0.35,
  },
  sun: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFD93D',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#FFB800',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 4,
  },
  hillBack: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    width: '75%',
    height: 90,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 120,
    backgroundColor: '#5CB868',
    opacity: 0.55,
  },
  hillFront: {
    position: 'absolute',
    bottom: -28,
    right: -30,
    width: '70%',
    height: 80,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 60,
    backgroundColor: '#6FD07A',
    opacity: 0.7,
  },
  readyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 100, 150, 0.55)',
  },
  readyContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#1A4A6E',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D4A6E',
    textAlign: 'center',
  },
  gameTitleAccent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4A90D9',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameSubtitle: {
    fontSize: 14,
    color: '#5A6B7D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  levelHeading: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '800',
    color: '#2D4A6E',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  levelDropdownButton: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#F4F8FC',
    borderWidth: 2,
    borderColor: '#E2EAF2',
    overflow: 'hidden',
  },
  levelDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  levelDropdownEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  levelDropdownTextWrap: {
    flex: 1,
  },
  levelDropdownTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D4A6E',
  },
  levelDropdownSubtitle: {
    fontSize: 12,
    color: '#6B7C8F',
    marginTop: 2,
    fontWeight: '600',
  },
  levelDropdownArrow: {
    fontSize: 12,
    color: '#6B7C8F',
    fontWeight: '600',
  },
  levelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  levelModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 0,
  },
  levelModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2EAF2',
  },
  levelModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D4A6E',
  },
  levelModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelModalCloseText: {
    fontSize: 18,
    color: '#6B7C8F',
    fontWeight: '600',
  },
  levelModalList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F9FBFD',
  },
  levelModalItemSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    borderColor: '#4A90D9',
  },
  levelModalItemEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  levelModalItemText: {
    flex: 1,
  },
  levelModalItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D4A6E',
  },
  levelModalItemDesc: {
    fontSize: 12,
    color: '#6B7C8F',
    marginTop: 2,
    fontWeight: '600',
  },
  levelModalItemCheck: {
    fontSize: 18,
    color: '#4A90D9',
    fontWeight: '800',
  },
  levelGrid: {
    width: '100%',
    marginBottom: 20,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F4F8FC',
    borderWidth: 2,
    borderColor: '#E2EAF2',
    marginBottom: 8,
  },
  levelChipSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#4A90D9',
  },
  levelEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  levelTextWrap: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D4A6E',
  },
  levelTitleSelected: {
    color: '#2563A8',
  },
  levelDescription: {
    fontSize: 12,
    color: '#6B7C8F',
    marginTop: 1,
    fontWeight: '600',
  },
  levelDescriptionSelected: {
    color: '#4A7DB8',
  },
  levelCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCheckText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  startButton: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#3DDC84',
    shadowColor: '#2BA86A',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden',
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  startIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  startIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 3,
  },
  startTextWrap: {
    flex: 1,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  startButtonHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  controlsPanel: {
    backgroundColor: 'rgba(255, 246, 229, 0.97)',
    paddingTop: 8,
    borderTopWidth: 3,
    borderTopColor: COLORS.rod,
  },
});
