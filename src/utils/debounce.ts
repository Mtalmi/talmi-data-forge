/**
 * Debounce & throttle utilities for search, resize, and real-time callbacks.
 */

/** Debounce: delays execution until after `ms` of inactivity. */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T & { cancel: () => void };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/** Throttle: limits execution to at most once per `ms`. */
export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}
