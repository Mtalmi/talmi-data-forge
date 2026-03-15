/**
 * Hidden aria-live region for dynamic announcements.
 * Use announceToScreenReader() from useGlobalShortcuts to push messages.
 */
export function ScreenReaderAnnouncer() {
  return (
    <div
      id="tbos-sr-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
