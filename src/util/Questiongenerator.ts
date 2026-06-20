import { GameLevel, GameLevelConfig, Operator, Question } from '../types';
import {
  getDifficultyConfig,
  getLevelLabel,
  getLevelEmoji,
  getAvailableLevels,
} from '../config/levelDifficulty';

let idCounter = 0;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate GAME_LEVELS array from difficulty configuration
 * This creates GameLevelConfig objects for all levels 0-10
 */
export function generateGameLevels(): GameLevelConfig[] {
  return getAvailableLevels().map(level => {
    const difficulty = getDifficultyConfig(level);
    return {
      level: level as GameLevel,
      title: getLevelLabel(level),
      description: `${getLevelLabel(level)} · ${difficulty.minMax}–${
        difficulty.maxMax
      }`,
      emoji: getLevelEmoji(level),
      ...difficulty,
    };
  });
}

export const GAME_LEVELS: GameLevelConfig[] = generateGameLevels();

export function getLevelConfig(level: GameLevel): GameLevelConfig {
  const config = GAME_LEVELS.find(entry => entry.level === level);
  if (!config) {
    // Fallback to level 0 if not found
    return GAME_LEVELS[0];
  }
  return config;
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
