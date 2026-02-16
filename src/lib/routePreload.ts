/**
 * Route preloading utility — triggers lazy chunk download on hover/focus
 * for instant navigation feel.
 */

const routeModules: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/Index'),
  '/dashboard': () => import('../pages/Index'),
  '/formules': () => import('../pages/Formules'),
  '/clients': () => import('../pages/Clients'),
  '/prix': () => import('../pages/Prix'),
  '/bons': () => import('../pages/Bons'),
  '/planning': () => import('../pages/Planning'),
  '/production': () => import('../pages/Production'),
  '/stocks': () => import('../pages/Stocks'),
  '/logistique': () => import('../pages/Logistique'),
  '/laboratoire': () => import('../pages/Laboratoire'),
  '/depenses': () => import('../pages/Depenses'),
  '/ventes': () => import('../pages/Ventes'),
  '/rapports': () => import('../pages/Rapports'),
  '/pointage': () => import('../pages/Pointage'),
  '/fournisseurs': () => import('../pages/Fournisseurs'),
  '/paiements': () => import('../pages/Paiements'),
  '/maintenance': () => import('../pages/Maintenance'),
  '/analytics': () => import('../pages/AnalyticsBI'),
};

const preloaded = new Set<string>();

/** Call on mouseenter/focus of navigation links */
export function preloadRoute(path: string) {
  if (preloaded.has(path)) return;
  const loader = routeModules[path];
  if (loader) {
    preloaded.add(path);
    // Use requestIdleCallback for non-blocking preload
    const schedule = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 50));
    schedule(() => loader());
  }
}
