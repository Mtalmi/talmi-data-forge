/**
 * Shared formatting utilities for consistent number display across the app.
 * All monetary values use French locale (fr-FR): space as thousands separator, comma as decimal.
 * 
 * SINGLE SOURCE OF TRUTH — import from here, never hand-format numbers.
 */

/** Replace narrow/non-breaking spaces with regular spaces */
function normalizeSpaces(s: string): string {
  return s.replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
}

/** Format a monetary amount with exactly 2 decimal places in French locale. */
export const formatMontant = (amount: number | string | null | undefined): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || amount == null) return '0,00';
  return normalizeSpaces(num.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }));
};

/** Format volume: integers for whole numbers, 1 decimal otherwise. */
export const formatVolume = (volume: number): string => {
  return Number.isInteger(volume)
    ? volume.toString()
    : normalizeSpaces(volume.toLocaleString('fr-FR', { maximumFractionDigits: 1 }));
};

/**
 * General-purpose number formatter (French locale).
 * - Handles null/undefined/NaN → returns fallback (default "0")
 * - Configurable decimals
 * - Returns space-separated thousands (French standard)
 */
export const formatNumber = (
  value: number | string | null | undefined,
  options?: { decimals?: number; fallback?: string }
): string => {
  const { decimals = 0, fallback = '0' } = options || {};
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (value == null || isNaN(num)) return fallback;
  return normalizeSpaces(num.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }));
};

/**
 * Compact format for KPI hero cards: 1K, 1.2M, etc.
 * Only abbreviates >= 1000. Values < 1000 show full number.
 * Never rounds 999 up to 1K.
 */
export const formatCompact = (
  value: number | null | undefined,
  options?: { currency?: string; decimals?: number }
): string => {
  if (value == null || isNaN(value)) return '0';
  const { currency, decimals = 1 } = options || {};
  
  let formatted: string;
  const abs = Math.abs(value);
  
  if (abs >= 1_000_000) {
    formatted = (value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: decimals }) + ' M';
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: decimals }) + 'K';
  } else {
    formatted = value.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
  }
  
  formatted = normalizeSpaces(formatted);
  return currency ? `${formatted} ${currency}` : formatted;
};

/**
 * Format percentage — always immediately after number, no space.
 * e.g. "49,9%" not "49.9 %"
 */
export const formatPercent = (
  value: number | null | undefined,
  options?: { decimals?: number; fallback?: string }
): string => {
  const { decimals = 1, fallback = '—' } = options || {};
  if (value == null || isNaN(value)) return fallback;
  return normalizeSpaces(value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })) + '%';
};

/**
 * Format currency with full French locale formatting.
 * e.g. "75 600 DH", "1 200,50 EUR"
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  currency: string = 'DH'
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (value == null || isNaN(num)) return `0 ${currency}`;
  
  // No decimals for round amounts, 2 decimals otherwise
  const hasDecimals = num % 1 !== 0;
  const formatted = normalizeSpaces(num.toLocaleString('fr-FR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }));
  
  return `${formatted} ${currency}`;
};
