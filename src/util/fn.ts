export function evaluateExpression(expr: string): number {
  // allow only numbers, operators, spaces, decimals, parentheses
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    throw new Error('Invalid characters in expression');
  }

  return Function(`"use strict"; return (${expr})`)();
}
