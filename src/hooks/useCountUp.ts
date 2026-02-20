import { useEffect, useState, useRef } from 'react';

export const useCountUp = (
  target: number,
  duration: number = 1600,
  delay: number = 0
) => {
  const [value, setValue] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;

    const timer = setTimeout(() => {
      const start = Date.now();

      const step = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return value;
};
