/**
 * TBOS Unified Number Formatting Utilities
 * Ensures consistent number/currency display across all pages.
 */

/**
 * Format currency in MAD (Moroccan Dirham).
 * - Under 10K: full number with space separator → "4 450 DH"
 * - 10K–999K: with K suffix → "847 K DH"
 * - 1M+: with M suffix → "2.4 M DH"
 */
export function formatCurrencyDH(value: number, opts?: { compact?: boolean }): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (opts?.compact !== false && abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} M DH`;
  }
  if (opts?.compact !== false && abs >= 10_000) {
    const k = Math.round(abs / 1_000);
    return `${sign}${k.toLocaleString('fr-FR')} K DH`;
  }
  return `${sign}${Math.round(abs).toLocaleString('fr-FR')} DH`;
}

/**
 * Format a number with French-style space separators.
 * e.g. 42000 → "42 000"
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage consistently.
 * e.g. 78.5 → "78,5%"
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

/**
 * Format weight with unit.
 * e.g. 42000, 'kg' → "42 000 kg"
 */
export function formatQuantity(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}
