import { useState, useCallback, useRef } from 'react';

/**
 * Prevents double-click / rapid-fire on action buttons.
 * Wraps an async action so it can only run one at a time.
 *
 * @example
 * const [run, isRunning] = useActionGuard(async () => { await approve(id); });
 * <button onClick={run} disabled={isRunning}>Approuver</button>
 */
export function useActionGuard<T extends (...args: any[]) => Promise<any>>(
  action: T
): [(...args: Parameters<T>) => Promise<void>, boolean] {
  const [processing, setProcessing] = useState(false);
  const lockRef = useRef(false);

  const guarded = useCallback(async (...args: Parameters<T>) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setProcessing(true);
    try {
      await action(...args);
    } finally {
      lockRef.current = false;
      setProcessing(false);
    }
  }, [action]);

  return [guarded, processing];
}

/**
 * Safely iterate over arrays that might be null/undefined.
 * Use: safeArray(data).map(...)
 */
export function safeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

/**
 * Format a number safely — returns "0" for NaN, handles negatives.
 */
export function safeNumber(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return value;
}

/**
 * Format a trend percentage safely.
 * Returns "→ stable" for 0, "+X%" for positive, "−X%" for negative.
 */
export function safeTrend(pct: number | null | undefined): string {
  const val = safeNumber(pct);
  if (val === 0) return '→ stable';
  if (val > 0) return `+${val.toFixed(1)}%`;
  return `${val.toFixed(1)}%`; // negative sign included
}
