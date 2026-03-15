import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts with two-key sequence support (G+D, N+D, etc.)
 * Ignores shortcuts when input/textarea is focused (except Escape).
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const pendingRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    pendingRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
      const hasModal = !!document.querySelector('[data-tbos-modal]');

      // Escape always works
      if (e.key === 'Escape') {
        clearPending();
        // Let other handlers (modals) handle Escape
        return;
      }

      // Cmd/Ctrl+K → command palette (handled by CommandPalette already, but ensure it works)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        return; // Already handled by CommandPalette
      }

      // Don't process shortcuts in inputs or modals
      if (isInput || hasModal) return;

      const key = e.key.toLowerCase();

      // ? → open shortcuts help
      if (e.key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('tbos-show-shortcuts-help'));
        clearPending();
        return;
      }

      // Tab number switching (1-4)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !pendingRef.current) {
        if (['1', '2', '3', '4'].includes(key)) {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('tbos-switch-tab', { detail: { index: parseInt(key) - 1 } }));
          return;
        }
      }

      // Two-key sequences
      if (pendingRef.current) {
        const combo = pendingRef.current + '+' + key;
        clearPending();

        const routes: Record<string, string> = {
          'g+d': '/',
          'g+p': '/production',
          'g+v': '/ventes',
          'g+c': '/clients',
          'g+s': '/stocks',
          'g+l': '/laboratoire',
          'g+t': '/logistique',
          'g+b': '/bons',
          'g+r': '/creances',
        };

        if (routes[combo]) {
          e.preventDefault();
          navigate(routes[combo]);
          announceToScreenReader(`Navigation vers ${routes[combo]}`);
          return;
        }

        // N+X actions
        const actions: Record<string, string> = {
          'n+d': 'nouveau-devis',
          'n+t': 'nouveau-test',
          'n+b': 'nouveau-bon',
        };
        if (actions[combo]) {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('tbos-action', { detail: { action: actions[combo] } }));
          return;
        }
        return;
      }

      // Start a sequence
      if (key === 'g' || key === 'n') {
        e.preventDefault();
        pendingRef.current = key;
        timeoutRef.current = setTimeout(clearPending, 500);
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      clearPending();
    };
  }, [navigate, clearPending]);
}

/** Push an announcement to the screen reader live region */
export function announceToScreenReader(message: string) {
  const el = document.getElementById('tbos-sr-announcer');
  if (el) {
    el.textContent = '';
    // Force reflow so the SR picks up the new text
    requestAnimationFrame(() => { el.textContent = message; });
  }
}
