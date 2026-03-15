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
  '/tresorerie': 'TBOS · Trésorerie',
  '/pnl': 'TBOS · P&L',
  '/budget': 'TBOS · Budget',
  '/dettes': 'TBOS · Dettes',
  '/immobilisations': 'TBOS · Immobilisations',
  '/rapprochement': 'TBOS · Rapprochement',
  '/personnel': 'TBOS · Personnel',
  '/equipements': 'TBOS · Équipements',
  '/prestataires': 'TBOS · Prestataires',
  '/maintenance': 'TBOS · Maintenance',
  '/pointage': 'TBOS · Pointage',
  '/securite': 'TBOS · Sécurité',
  '/analytics': 'TBOS · Analytics',
  '/ai': 'TBOS · AI Assistant',
  '/user_profile': 'TBOS · Profil',
  '/journal': 'TBOS · Journal',
  '/approbations': 'TBOS · Approbations',
  '/audit-superviseur': 'TBOS · Audit',
  '/surveillance': 'TBOS · Surveillance',
  '/contracts': 'TBOS · Contrats',
  '/formation': 'TBOS · Formation',
  '/aide': 'TBOS · Aide',
  '/integrations': 'TBOS · Intégrations',
};

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] || 'TBOS · Atlas Concrete';
  }, [pathname]);
}
