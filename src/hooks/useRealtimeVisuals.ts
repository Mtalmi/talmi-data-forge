import { useRef, useEffect, useState } from 'react';

/**
 * Returns a CSS class name that triggers a flash animation
 * whenever `value` changes (after initial mount).
 * Class auto-removes after the animation duration.
 */
export function useValueFlash(value: unknown, className = 'value-updated', durationMs = 500): string {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevRef.current = value;
      return;
    }
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), durationMs);
      return () => clearTimeout(timer);
    }
  }, [value, durationMs]);

  return flash ? className : '';
}

/**
 * Tracks IDs in a list and returns a Set of "new" IDs
 * that appeared since the last render. Clears after `durationMs`.
 */
export function useNewRowIds(ids: string[], durationMs = 2000): Set<string> {
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const mounted = useRef(false);

  useEffect(() => {
    const currentSet = new Set(ids);
    if (!mounted.current) {
      mounted.current = true;
      prevIdsRef.current = currentSet;
      return;
    }

    const added = new Set<string>();
    currentSet.forEach(id => {
      if (!prevIdsRef.current.has(id)) added.add(id);
    });
    prevIdsRef.current = currentSet;

    if (added.size > 0) {
      setNewIds(added);
      const timer = setTimeout(() => setNewIds(new Set()), durationMs);
      return () => clearTimeout(timer);
    }
  }, [ids, durationMs]);

  return newIds;
}
