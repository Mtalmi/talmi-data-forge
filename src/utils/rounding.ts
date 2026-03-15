/**
 * Financial rounding utilities — prevents floating-point display bugs.
 * SINGLE SOURCE OF TRUTH for all arithmetic precision.
 */

/** Round a currency value to nearest integer (DH) or 2 decimals (EUR/USD). */
export function roundCurrency(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Round a percentage to 1 decimal, clean trailing zeros. */
export function roundPercent(value: number, decimals = 1): number {
  return parseFloat(value.toFixed(decimals));
}

/** Round volume to 1 decimal, show integer if whole. */
export function roundVolume(value: number): number {
  return Number.isInteger(value) ? value : parseFloat(value.toFixed(1));
}

/** Safe division — returns fallback on divide-by-zero or NaN. */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (!denominator || !isFinite(numerator / denominator)) return fallback;
  return numerator / denominator;
}

/** Safe multiply for currency (avoids 0.1 + 0.2 = 0.30000...4). */
export function safeMultiply(a: number, b: number): number {
  return Math.round(a * b * 100) / 100;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
