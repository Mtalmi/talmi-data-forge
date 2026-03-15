import { useEffect, useRef, useCallback } from 'react';

/**
 * Calls onVisible() when the browser tab becomes visible again after being hidden.
 * Useful for refreshing stale data after tab switch or device wake.
 */
export function useVisibilityRefresh(onVisible: () => void) {
  const callbackRef = useRef(onVisible);
  callbackRef.current = onVisible;

  const handler = useCallback(() => {
    if (document.visibilityState === 'visible') {
      callbackRef.current();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [handler]);
}
