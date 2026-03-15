import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'TBOS · Command Center · Atlas Concrete',
  '/dashboard': 'TBOS · Command Center · Atlas Concrete',
  '/app': 'TBOS · Command Center · Atlas Concrete',
  '/production': 'TBOS · Production · 671 m³',
  '/ventes': 'TBOS · Ventes · 155K DH pipeline',
  '/stocks': 'TBOS · Stocks · 89/100 santé',
  '/laboratoire': 'TBOS · Lab · 96.8% conformité',
  '/logistique': 'TBOS · Logistique · 3/4 actifs',
  '/bons': 'TBOS · BdC · 8 bons',
  '/creances': 'TBOS · Créances · 1.2M DH',
  '/formules': 'TBOS · Formules béton',
  '/clients': 'TBOS · Clients',
  '/planning': 'TBOS · Planning',
  '/depenses': 'TBOS · Dépenses',
  '/depenses-v2': 'TBOS · Dépenses',
  '/fournisseurs': 'TBOS · Fournisseurs',
  '/rapports': 'TBOS · Rapports',
  '/alertes': 'TBOS · Alertes',
  '/paiements': 'TBOS · Paiements',
  '/users': 'TBOS · Utilisateurs',
  '/settings': 'TBOS · Paramètres',
};

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] || 'TBOS · Atlas Concrete';
  }, [pathname]);
}
