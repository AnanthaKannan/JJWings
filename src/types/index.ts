export type Operator = '+' | '-';

export interface Question {
  id: string;
  a: number;
  b: number;
  operator: Operator;
  answer: number;
}

export type GamePhase = 'ready' | 'playing' | 'gameover';

export type GameLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GameLevelConfig {
  level: GameLevel;
  title: string;
  description: string;
  emoji: string;
  minMax: number;
  maxMax: number;
  allowSubtraction: boolean;
  subtractionChance: number;
  startFallDuration: number;
  minFallDuration: number;
  speedUpPerPoint: number;
}

export interface BeadTheme {
  base: string;
  shine: string;
}
