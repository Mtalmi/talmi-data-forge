import { describe, it, expect } from 'vitest';
import { isOffHoursCasablanca, getHourInCasablanca } from '@/lib/timezone';

describe('Timezone - Off-Hours Detection (Casablanca)', () => {
  it('detects 20:00 as off-hours', () => {
    // Create a date at 20:00 UTC+1 (Casablanca) = 19:00 UTC
    const date = new Date('2026-02-13T19:00:00Z');
    const hour = getHourInCasablanca(date.toISOString());
    // Casablanca is UTC+1, so 19:00 UTC = 20:00 Casablanca
    expect(hour).toBeGreaterThanOrEqual(18);
    expect(isOffHoursCasablanca(date.toISOString())).toBe(true);
  });

  it('detects 10:00 as business hours', () => {
    // 09:00 UTC = 10:00 Casablanca (UTC+1)
    const date = new Date('2026-02-13T09:00:00Z');
    const hour = getHourInCasablanca(date.toISOString());
    expect(hour).toBeLessThan(18);
    expect(isOffHoursCasablanca(date.toISOString())).toBe(false);
  });

  it('detects 18:00 as start of off-hours window', () => {
    // 17:00 UTC = 18:00 Casablanca (UTC+1)
    const date = new Date('2026-02-13T17:00:00Z');
    const hour = getHourInCasablanca(date.toISOString());
    expect(hour).toBe(18);
    expect(isOffHoursCasablanca(date.toISOString())).toBe(true);
  });

  it('detects 17:59 as business hours', () => {
    // 16:59 UTC = 17:59 Casablanca
    const date = new Date('2026-02-13T16:59:00Z');
    expect(isOffHoursCasablanca(date.toISOString())).toBe(false);
  });
});
