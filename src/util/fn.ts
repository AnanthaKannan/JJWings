export function evaluateExpression(expr: string): number {
  // allow only numbers, operators, spaces, decimals, parentheses
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    throw new Error('Invalid characters in expression');
  }

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
