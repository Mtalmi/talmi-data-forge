/**
 * Morocco timezone utilities — single source of truth for all date/time boundaries.
 * Ensures midnight, greeting, and query boundaries use Africa/Casablanca.
 */

const TIMEZONE = 'Africa/Casablanca';

/** Get current date string (YYYY-MM-DD) in Morocco timezone */
export function getMoroccoToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // en-CA gives YYYY-MM-DD
}

/** Get yesterday's date string in Morocco timezone */
export function getMoroccoYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Get month start in Morocco timezone */
export function getMoroccoMonthStart(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  return `${year}-${month}-01`;
}

/** Get current hour (0-23) in Morocco timezone */
export function getMoroccoHour(): number {
  return parseInt(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TIMEZONE }), 10);
}

/** Get formatted date in French: "samedi 15 mars 2026" */
export function getMoroccoFormattedDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/** Get greeting based on Morocco time */
export function getMoroccoGreeting(): string {
  const hour = getMoroccoHour();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  if (hour >= 18 && hour < 22) return 'Bonsoir';
  return 'Bonne nuit';
}

/** Get current year in Morocco timezone */
export function getMoroccoYear(): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric' }).formatToParts(new Date());
  return parseInt(parts.find(p => p.type === 'year')!.value, 10);
}

/** Get current month (0-indexed) in Morocco timezone */
export function getMoroccoMonth(): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, month: 'numeric' }).formatToParts(new Date());
  return parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1;
}

/** Get current day of month in Morocco timezone */
export function getMoroccoDay(): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, day: 'numeric' }).formatToParts(new Date());
  return parseInt(parts.find(p => p.type === 'day')!.value, 10);
}

/** Get start of current month as ISO string in Morocco timezone */
export function getMoroccoMonthStartISO(): string {
  return getMoroccoMonthStart() + 'T00:00:00.000Z';
}

/** Format a date/timestamp for display in Morocco timezone (HH:mm) */
export function formatMoroccoTime(isoStr: string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoStr));
}

/** Get current time formatted as HH:mm:ss in Morocco timezone */
export function getMoroccoClockTime(): string {
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

/** Get Morocco date formatted as dd/MM/yyyy */
export function getMoroccoDateDisplay(): string {
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

/** Get the hour from an ISO timestamp in Morocco timezone */
export function getHourInMorocco(isoStr: string): number {
  return parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
  }).format(new Date(isoStr)), 10);
}
