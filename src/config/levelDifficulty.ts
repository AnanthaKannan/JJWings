/**
 * Game Level Difficulty Configuration
 * Easily customize difficulty parameters for each level (0-10)
 */

export interface LevelDifficultyConfig {
  minMax: number; // Minimum maximum operand value
  maxMax: number; // Maximum operand value at highest progress
  allowSubtraction: boolean;
  subtractionChance: number; // 0-1 probability of subtraction
  startFallDuration: number; // Initial fall duration in ms
  minFallDuration: number; // Minimum fall duration in ms
  speedUpPerPoint: number; // How much faster per point scored
}

/**
 * Difficulty configuration for each level (0-10)
 * Easy to modify and extend as needed
 */
export const DIFFICULTY_LEVELS: Record<number, LevelDifficultyConfig> = {
  0: {
    minMax: 3,
    maxMax: 5,
    allowSubtraction: false,
    subtractionChance: 0,
    startFallDuration: 10000,
    minFallDuration: 5000,
    speedUpPerPoint: 80,
  },
  1: {
    minMax: 5,
    maxMax: 9,
    allowSubtraction: false,
    subtractionChance: 0,
    startFallDuration: 8000,
    minFallDuration: 3800,
    speedUpPerPoint: 120,
  },
  2: {
    minMax: 9,
    maxMax: 18,
    allowSubtraction: true,
    subtractionChance: 0.25,
    startFallDuration: 6500,
    minFallDuration: 3000,
    speedUpPerPoint: 140,
  },
  3: {
    minMax: 15,
    maxMax: 30,
    allowSubtraction: true,
    subtractionChance: 0.4,
    startFallDuration: 5500,
    minFallDuration: 2400,
    speedUpPerPoint: 160,
  },
  4: {
    minMax: 25,
    maxMax: 50,
    allowSubtraction: true,
    subtractionChance: 0.5,
    startFallDuration: 4500,
    minFallDuration: 2000,
    speedUpPerPoint: 180,
  },
  5: {
    minMax: 35,
    maxMax: 70,
    allowSubtraction: true,
    subtractionChance: 0.6,
    startFallDuration: 4000,
    minFallDuration: 1800,
    speedUpPerPoint: 200,
  },
  6: {
    minMax: 50,
    maxMax: 100,
    allowSubtraction: true,
    subtractionChance: 0.65,
    startFallDuration: 3500,
    minFallDuration: 1600,
    speedUpPerPoint: 220,
  },
  7: {
    minMax: 60,
    maxMax: 120,
    allowSubtraction: true,
    subtractionChance: 0.7,
    startFallDuration: 3200,
    minFallDuration: 1400,
    speedUpPerPoint: 240,
  },
  8: {
    minMax: 75,
    maxMax: 150,
    allowSubtraction: true,
    subtractionChance: 0.75,
    startFallDuration: 2900,
    minFallDuration: 1200,
    speedUpPerPoint: 260,
  },
  9: {
    minMax: 100,
    maxMax: 200,
    allowSubtraction: true,
    subtractionChance: 0.8,
    startFallDuration: 2600,
    minFallDuration: 1000,
    speedUpPerPoint: 280,
  },
  10: {
    minMax: 150,
    maxMax: 300,
    allowSubtraction: true,
    subtractionChance: 0.9,
    startFallDuration: 2300,
    minFallDuration: 900,
    speedUpPerPoint: 300,
  },
};

/**
 * Get difficulty config for a specific level
 */
export function getDifficultyConfig(level: number): LevelDifficultyConfig {
  return DIFFICULTY_LEVELS[level] ?? DIFFICULTY_LEVELS[0];
}

/**
 * Get all available levels (0-10)
 */
export function getAvailableLevels(): number[] {
  return Array.from({ length: 11 }, (_, i) => i);
}

/**
 * Get level label for display
 */
export function getLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    0: 'Beginner',
    1: 'Easy',
    2: 'Medium',
    3: 'Hard',
    4: 'Expert',
    5: 'Master',
    6: 'Pro',
    7: 'Legend',
    8: 'Elite',
    9: 'Supreme',
    10: 'Extreme',
  };
  return labels[level] ?? `Level ${level}`;
}

/**
 * Get level emoji for display
 */
export function getLevelEmoji(level: number): string {
  const emojis: Record<number, string> = {
    0: '🌱',
    1: '🌿',
    2: '🌳',
    3: '🔥',
    4: '⚡',
    5: '🚀',
    6: '👑',
    7: '🧙',
    8: '🦅',
    9: '☄️',
    10: '🌟',
  };
  return emojis[level] ?? '🎮';
}
