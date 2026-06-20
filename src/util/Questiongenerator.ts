import { GameLevel, GameLevelConfig, Operator, Question } from '../types';

let idCounter = 0;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const GAME_LEVELS: GameLevelConfig[] = [
  {
    level: 1,
    title: 'Level 1',
    description: 'Easy · 1–9 · Add only',
    emoji: '🌱',
    minMax: 5,
    maxMax: 9,
    allowSubtraction: false,
    subtractionChance: 0,
    startFallDuration: 8000,
    minFallDuration: 3800,
    speedUpPerPoint: 120,
  },
  {
    level: 2,
    title: 'Level 2',
    description: 'Medium · 1–18 · Add & subtract',
    emoji: '🌿',
    minMax: 9,
    maxMax: 18,
    allowSubtraction: true,
    subtractionChance: 0.25,
    startFallDuration: 6500,
    minFallDuration: 3000,
    speedUpPerPoint: 140,
  },
  {
    level: 3,
    title: 'Level 3',
    description: 'Hard · 1–30 · Faster balls',
    emoji: '🌳',
    minMax: 15,
    maxMax: 30,
    allowSubtraction: true,
    subtractionChance: 0.4,
    startFallDuration: 5500,
    minFallDuration: 2400,
    speedUpPerPoint: 160,
  },
  {
    level: 4,
    title: 'Level 4',
    description: 'Expert · 1–50 · Speed challenge',
    emoji: '🏆',
    minMax: 25,
    maxMax: 50,
    allowSubtraction: true,
    subtractionChance: 0.5,
    startFallDuration: 4500,
    minFallDuration: 2000,
    speedUpPerPoint: 180,
  },
];

export function getLevelConfig(level: GameLevel): GameLevelConfig {
  return GAME_LEVELS.find(entry => entry.level === level) ?? GAME_LEVELS[0];
}

/**
 * Generates a math question scaled by selected level and in-game score.
 */
export function generateQuestion(score: number, level: GameLevel): Question {
  idCounter += 1;

  const config = getLevelConfig(level);
  const progress = Math.min(score / 12, 1);
  const max = Math.round(
    config.minMax + (config.maxMax - config.minMax) * progress,
  );

  const operator: Operator =
    config.allowSubtraction && Math.random() < config.subtractionChance
      ? '-'
      : '+';

  let a = randomInt(1, max);
  let b = randomInt(1, max);
  let answer: number;

  if (operator === '+') {
    const halfMax = Math.max(Math.floor(max / 2), 2);
    a = randomInt(1, halfMax);
    b = randomInt(1, halfMax);
    answer = a + b;
  } else {
    if (a < b) {
      [a, b] = [b, a];
    }
    answer = a - b;
  }

  return {
    id: `q-${idCounter}-${Date.now()}`,
    a,
    b,
    operator,
    answer,
  };
}

export function getFallDuration(score: number, level: GameLevel): number {
  const config = getLevelConfig(level);
  const duration = config.startFallDuration - score * config.speedUpPerPoint;
  return Math.max(duration, config.minFallDuration);
}
