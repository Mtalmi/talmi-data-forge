import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the page to the top on every route change.
 * Place inside <Router> once.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll main content area (overflow container) or window
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
