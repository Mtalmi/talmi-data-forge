import { useEffect } from 'react';

/**
 * Warns the user before leaving the page when a form has unsaved changes.
 * Adds a beforeunload listener when isDirty is true.
 */
export function useFormDirty(isDirty: boolean) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    if (isDirty) {
      window.addEventListener('beforeunload', handler);
    }
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
