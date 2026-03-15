import { useState, useEffect, useRef, useCallback } from 'react';

interface SimulatedValues {
  prodVolume: number;
  revenue: number;
  marge: number;
  conformite: number;
  /** True for 500ms after any value changes */
  flash: boolean;
}

/**
 * Simulates live data fluctuations on the Dashboard.
 * Every 60s, slightly randomises display values to create the feeling
 * of real-time data streaming in.
 *
 * Only runs when the component is mounted and the tab is visible.
 */
export function useLiveSimulation(baseValues: {
  prodVolume: number;
  revenue: number;
  marge: number;
  conformite: number;
}): SimulatedValues {
  const [values, setValues] = useState<SimulatedValues>({
    ...baseValues,
    flash: false,
  });

  const baseRef = useRef(baseValues);
  baseRef.current = baseValues;

  // Track cumulative drift for revenue (slowly incrementing)
  const driftRef = useRef(0);

  const tick = useCallback(() => {
    const b = baseRef.current;
    // Small random fluctuation
    const prodJitter = Math.round((Math.random() - 0.5) * 10); // ±5
    const revenueIncrement = Math.round(Math.random() * 400 + 100); // +100-500
    driftRef.current += revenueIncrement;
    const margeJitter = +((Math.random() - 0.5) * 0.2).toFixed(1); // ±0.1
    const confJitter = +((Math.random() - 0.5) * 0.4).toFixed(1); // ±0.2

    setValues({
      prodVolume: b.prodVolume + prodJitter,
      revenue: b.revenue + driftRef.current,
      marge: +(b.marge + margeJitter).toFixed(1),
      conformite: +(b.conformite + confJitter).toFixed(1),
      flash: true,
    });

    // Remove flash after 500ms
    setTimeout(() => {
      setValues(prev => ({ ...prev, flash: false }));
    }, 500);
  }, []);

  useEffect(() => {
    // Only run when tab is visible
    let interval: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      interval = setInterval(tick, 60000);
    };
    const stopInterval = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    const handleVisibility = () => {
      if (document.hidden) stopInterval();
      else startInterval();
    };

    startInterval();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [tick]);

  // Reset when base values change (plant switch)
  useEffect(() => {
    driftRef.current = 0;
    setValues({ ...baseValues, flash: false });
  }, [baseValues.prodVolume, baseValues.revenue]);

  return values;
}
