import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safe division — returns `fallback` when divisor is 0, NaN, or non-finite.
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (!denominator || !isFinite(denominator) || !isFinite(numerator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Safe .toFixed() — returns `fallback` string when value is NaN/Infinity.
 */
export function safeFixed(value: number | null | undefined, decimals: number = 1, fallback: string = '--'): string {
  if (value == null || !isFinite(value)) return fallback;
  return value.toFixed(decimals);
}

/**
 * Safe percentage: (part / total) * 100, returns fallback if total is 0.
 */
export function safePct(part: number, total: number, decimals: number = 1, fallback: string = '--'): string {
  if (!total || !isFinite(total) || !isFinite(part)) return fallback;
  const pct = (part / total) * 100;
  return isFinite(pct) ? pct.toFixed(decimals) : fallback;
}

/**
 * Safe display value — ensures null/undefined/NaN never leak into UI.
 */
export function safeDisplay(value: unknown, fallback: string = '--'): string {
  if (value == null) return fallback;
  if (typeof value === 'number' && !isFinite(value)) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  return String(value);
}
