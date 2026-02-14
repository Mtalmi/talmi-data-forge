/**
 * Timezone utilities for Africa/Casablanca.
 * Ensures consistent time checks regardless of user's device timezone.
 */

const CASABLANCA_TZ = 'Africa/Casablanca';

/**
 * Get the current hour in Africa/Casablanca timezone (0-23).
 */
export function getCasablancaHour(): number {
  const now = new Date();
  const casablancaTime = new Intl.DateTimeFormat('en-US', {
    timeZone: CASABLANCA_TZ,
    hour: 'numeric',
    hour12: false,
  }).format(now);
  
  return parseInt(casablancaTime, 10);
}

/**
 * Get the current time in Africa/Casablanca as a Date object.
 */
export function getCasablancaDate(): Date {
  const now = new Date();
  const casablancaString = now.toLocaleString('en-US', { timeZone: CASABLANCA_TZ });
  return new Date(casablancaString);
}

/**
 * Check if a given ISO timestamp falls within off-hours (18:00-00:00) in Casablanca timezone.
 */
export function isOffHoursCasablanca(isoDateStr: string): boolean {
  const date = new Date(isoDateStr);
  const casablancaTime = new Intl.DateTimeFormat('en-US', {
    timeZone: CASABLANCA_TZ,
    hour: 'numeric',
    hour12: false,
  }).format(date);
  
  const hour = parseInt(casablancaTime, 10);
  // Off-hours: 18:00 (6pm) to 00:00 (midnight) - War Room Alert Window
  return hour >= 18 && hour <= 23;
}

/**
 * Get the hour from an ISO timestamp in Casablanca timezone.
 */
export function getHourInCasablanca(isoDateStr: string): number {
  const date = new Date(isoDateStr);
  const casablancaTime = new Intl.DateTimeFormat('en-US', {
    timeZone: CASABLANCA_TZ,
    hour: 'numeric',
    hour12: false,
  }).format(date);
  
  return parseInt(casablancaTime, 10);
}

/**
 * Check if we are currently in the off-hours window (18:00-06:00) in Casablanca.
 * Extended to cover the full night operations window.
 */
export function isCurrentlyOffHours(): boolean {
  const hour = getCasablancaHour();
  return hour >= 18 || hour < 6;
}

/**
 * Format a time display showing Casablanca timezone indicator.
 */
export function formatCasablancaTime(isoDateStr: string): string {
  const date = new Date(isoDateStr);
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: CASABLANCA_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
