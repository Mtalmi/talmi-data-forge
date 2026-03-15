/**
 * Trigger a professional print with TBOS branding.
 * Sets the date attribute on body so the CSS ::before can display it.
 */
export function triggerPrint() {
  const now = new Date();
  const formatted = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  document.body.setAttribute('data-print-date', formatted);
  window.print();
}
