/**
 * TBOS Unified Number Formatting Utilities
 * Ensures consistent number/currency display across all pages.
 * All formatting follows French/Moroccan standards:
 *   - Space as thousands separator
 *   - Comma as decimal separator
 *   - Currency unit AFTER number
 */

const FR = 'fr-FR';

/** Replace narrow/non-breaking spaces with regular spaces */
function normalizeSpaces(s: string): string {
  return s.replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
}

/**
 * Format currency in MAD (Moroccan Dirham).
 * compact mode (default, for KPI cards):
 *   - Under 10K: full number → "4 450 DH"
 *   - 10K–999K: with K suffix → "155K DH"
 *   - 1M+: with M suffix → "1,2 M DH"
 * table mode (compact: false):
 *   - Always full number → "155 000 DH"
 */
export function formatCurrencyDH(value: number, opts?: { compact?: boolean }): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  const compact = opts?.compact !== false;

  if (compact && abs >= 1_000_000) {
    const m = abs / 1_000_000;
    const formatted = m % 1 === 0
      ? m.toFixed(0)
      : normalizeSpaces(m.toLocaleString(FR, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
    return `${sign}${formatted} M DH`;
  }
  if (compact && abs >= 10_000) {
    const k = Math.round(abs / 1_000);
    return `${sign}${normalizeSpaces(k.toLocaleString(FR))}K DH`;
  }
  return `${sign}${normalizeSpaces(Math.round(abs).toLocaleString(FR))} DH`;
}

/**
 * Format currency for tables (always full number, never abbreviated).
 * "155 000 DH", "1 200 000 DH"
 */
export function formatCurrencyTable(value: number): string {
  return formatCurrencyDH(value, { compact: false });
}

/**
 * Format a number with French-style space separators.
 * e.g. 42000 → "42 000"
 */
export function formatNumber(value: number, decimals = 0): string {
  return normalizeSpaces(value.toLocaleString(FR, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }));
}

/**
 * Format a percentage consistently (French decimal comma, no space before %).
 * e.g. 78.5 → "78,5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${normalizeSpaces(value.toLocaleString(FR, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))}%`;
}

/**
 * Format weight/quantity with unit.
 * e.g. 42000, 'kg' → "42 000 kg"
 */
export function formatQuantity(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}

/**
 * Format a date in French long format for tables.
 * e.g. "14 mars 2026"
 */
export function formatDateTable(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(FR, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format a date in short French format for KPI subtitles.
 * e.g. "14 mars"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(FR, { day: 'numeric', month: 'long' });
}

/**
 * Format a timestamp for display.
 * e.g. "14/03/2026 · 06:38"
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} · ${hours}:${minutes}`;
}

/**
 * Format day name in lowercase French.
 * e.g. "lundi"
 */
export function formatDayName(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(FR, { weekday: 'long' });
}

/**
 * Format a trend value with sign.
 * e.g. 12 → "+12%", -8 → "−8%"
 */
export function formatTrend(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const abs = Math.abs(value);
  return `${sign}${normalizeSpaces(abs.toLocaleString(FR, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))}%`;
}
