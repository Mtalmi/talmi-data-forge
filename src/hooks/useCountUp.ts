import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 1500, delay = 0, decimals = 0) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>();
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const animate = (ts: number) => {
        if (!startRef.current) startRef.current = ts;
        const progress = Math.min((ts - startRef.current) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setValue(parseFloat((eased * target).toFixed(decimals)));
        if (progress < 1) frameRef.current = requestAnimationFrame(animate);
        else setValue(target);
      };
      frameRef.current = requestAnimationFrame(animate);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, delay, decimals]);

  return value;
}
