/**
 * Shared formatting utilities for consistent number display across the app.
 * All monetary values use French locale (fr-FR): space as thousands separator, comma as decimal.
 */

/** Format a monetary amount with exactly 2 decimal places in French locale. */
export const formatMontant = (amount: number): string => {
  return Number(amount).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/** Format volume: integers for whole numbers, 1 decimal otherwise. */
export const formatVolume = (volume: number): string => {
  return Number.isInteger(volume)
    ? volume.toString()
    : volume.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
};
