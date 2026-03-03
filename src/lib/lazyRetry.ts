/**
 * Wraps a dynamic import with retry logic.
 * On chunk-load failure (stale deploy), reloads the page once.
 */
export function lazyRetry<T extends { default: any }>(
  factory: () => Promise<T>,
  retries = 1
): Promise<T> {
  return factory().catch((err) => {
    if (retries > 0) {
      // Retry once before giving up
      return new Promise<T>((resolve) => {
        setTimeout(() => resolve(lazyRetry(factory, retries - 1)), 500);
      });
    }

    // If retry failed, force reload to get fresh chunks (only once per session)
    const reloadKey = 'tbos-chunk-reload';
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    }

    throw err;
  });
}
