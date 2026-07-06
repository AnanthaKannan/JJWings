import { BeadTheme } from '../types';

// A cheerful abacus-bead palette: each falling ball is styled like a
// glossy wooden/glass abacus bead, cycling through these colors.
export const BEAD_COLORS: BeadTheme[] = [
  { base: '#FF6B6B', shine: '#FFB3B3' }, // coral red
  { base: '#4ECDC4', shine: '#A6F0EA' }, // mint
  { base: '#FFD23F', shine: '#FFEDA8' }, // sunny yellow
  { base: '#A78BFA', shine: '#D9CCFF' }, // lavender
  { base: '#FF9F45', shine: '#FFCB94' }, // orange
  { base: '#5DC8F0', shine: '#BBEBFF' }, // sky blue
];

export const COLORS = {
  sky: '#6FD0F2',
  skyLight: '#BDEBFB',
  sun: '#FFD23F',
  rod: '#8B5E34',
  rodDark: '#6B461F',
  panel: '#FFFFFF',
  heartFull: '#FF4D6D',
  heartEmpty: '#E3D9D9',
  textDark: '#3A2E1F',
  success: '#3DDC84',
  danger: '#FF4D6D',
  inputBg: '#FFF6E5',
};

export const BALL_SIZE = 88;
export const TOTAL_LIVES = 5;
