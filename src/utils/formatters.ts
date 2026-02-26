/**
 * Shared formatting utilities for consistent number display across the app.
 * All monetary values use French locale (fr-FR): space as thousands separator, comma as decimal.
 */

/** Format a monetary amount with exactly 2 decimal places in French locale. */
export const formatMontant = (amount: number | string | null | undefined): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || amount == null) return '0,00';
  return num.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
};

/** Format volume: integers for whole numbers, 1 decimal otherwise. */
export const formatVolume = (volume: number): string => {
  return Number.isInteger(volume)
    ? volume.toString()
    : volume.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
};
