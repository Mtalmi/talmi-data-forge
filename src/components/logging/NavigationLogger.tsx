import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useActivity } from '@/contexts/ActivityContext';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/production': 'Production',
  '/ventes': 'Ventes',
  '/stocks': 'Stocks',
  '/laboratoire': 'Laboratoire',
  '/logistique': 'Logistique',
  '/bons': 'Bons de Commande',
  '/creances': 'Créances',
  '/clients': 'Clients',
  '/formules': 'Formules',
  '/planning': 'Planning',
  '/depenses': 'Dépenses',
  '/fournisseurs': 'Fournisseurs',
  '/rapports': 'Rapports',
  '/alertes': 'Alertes',
  '/paiements': 'Paiements',
  '/users': 'Utilisateurs',
  '/settings': 'Paramètres',
  '/tresorerie': 'Trésorerie',
  '/pnl': 'P&L',
  '/budget': 'Budget',
  '/immobilisations': 'Immobilisations',
  '/personnel': 'Personnel',
  '/equipements': 'Équipements',
  '/maintenance': 'Maintenance',
  '/securite': 'Sécurité',
  '/analytics': 'Analytics',
  '/ai': 'AI Assistant',
  '/journal': 'Journal',
  '/approbations': 'Approbations',
  '/surveillance': 'Surveillance',
  '/contracts': 'Contrats',
};

/**
 * Logs page navigation to the activity feed.
 * Mount once inside BrowserRouter.
 */
export function NavigationLogger() {
  const { pathname } = useLocation();
  const { log } = useActivity();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    const name = PAGE_NAMES[pathname] || pathname.replace('/', '').replace(/-/g, ' ');
    log('system', `Navigation vers ${name}`, 'SYSTÈME', 'info');
  }, [pathname, log]);

  return null;
}
