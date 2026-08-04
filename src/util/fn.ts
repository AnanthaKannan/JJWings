export function evaluateExpression(expr: string): number {
  // allow only numbers, operators, spaces, decimals, parentheses
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    throw new Error('Invalid characters in expression');
  }

  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr})`)();
}

export function accuracy(success: number = 0, failure: number = 0): number {
  if (success === 0 && failure === 0) return 0;
  if (!success && !failure) return 0;
  return Math.round(success / (success + failure));
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatDuration(totalSeconds: number): string {
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;

  return [hh, mm, ss].map(unit => String(unit).padStart(2, '0')).join(':');
}

export function generateDeviceId(): string {
  const timestamp = Date.now().toString(36); // time component
  const random1 = Math.random().toString(36).slice(2, 9);
  const random2 = Math.random().toString(36).slice(2, 9);

  return `${timestamp}-${random1}-${random2}`;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const formatFeedDate = (isoString: string): string => {
  const date = new Date(isoString);

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours; // 0 -> 12 for 12-hour clock

  return `${day} ${month} at ${hours}:${minutes}${period}`;
};
