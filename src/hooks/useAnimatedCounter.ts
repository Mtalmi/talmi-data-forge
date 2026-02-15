import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 to the target value on mount/change.
 * Supports integers and decimals.
 */
export function useAnimatedCounter(
  target: number,
  duration = 1200,
  decimals = 0
): string {
  const [display, setDisplay] = useState('0');
  const rafRef = useRef<number>();

  useEffect(() => {
    if (isNaN(target) || target === 0) {
      setDisplay(target.toFixed(decimals));
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplay(current.toFixed(decimals));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, decimals]);

  return display;
}
