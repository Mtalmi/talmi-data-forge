// ── MOCK AUDIT DATA ──

export const AUDIT_PAGES = [
  { page: 'Dashboard', route: '/dashboard', score: 9.2, issues: 1, trend: '→' as const },
  { page: 'Production', route: '/production', score: 6.9, issues: 5, trend: '↓' as const },
  { page: 'Stocks', route: '/stocks', score: 7.8, issues: 3, trend: '↑' as const },
  { page: 'Laboratoire', route: '/laboratoire', score: 8.7, issues: 1, trend: '→' as const },
  { page: 'Planning', route: '/planning', score: 8.1, issues: 3, trend: '→' as const },
  { page: 'Maintenance', route: '/maintenance', score: 8.5, issues: 2, trend: '↑' as const },
  { page: 'Ventes', route: '/ventes', score: 9.0, issues: 1, trend: '→' as const },
  { page: 'Clients', route: '/clients', score: 7.6, issues: 4, trend: '↓' as const },
  { page: 'Paiements', route: '/paiements', score: 8.8, issues: 1, trend: '→' as const },
  { page: 'Operations Agent', route: '/operations-agent', score: 8.3, issues: 2, trend: '→' as const },
  { page: 'Design Guardian', route: '/design-guardian', score: 9.5, issues: 0, trend: '→' as const },
  { page: 'Formules', route: '/formules', score: 7.2, issues: 3, trend: '→' as const },
  { page: 'GPS Tracking', route: '/gps', score: 6.5, issues: 6, trend: '↓' as const },
  { page: 'Audit Log', route: '/audit-log', score: 7.9, issues: 2, trend: '→' as const },
  { page: 'Settings', route: '/settings', score: 8.0, issues: 2, trend: '→' as const },
  { page: 'Profiles', route: '/profiles', score: 7.4, issues: 3, trend: '→' as const },
  { page: 'Login', route: '/login', score: 9.1, issues: 0, trend: '→' as const },
];

export type AuditPage = typeof AUDIT_PAGES[number];

export const AUDIT_ISSUES = [
  {
    id: '1',
    severity: 'critique' as const,
    page: 'Production',
    route: '/production',
    category: 'Données',
    title: 'Mock data visible dans WorldClassContractors.tsx',
    description: 'Données de test visibles en production. Risque: élevé pour le demo CEO.',
    detected: 'il y a 3 heures',
    status: 'open' as const,
  },
  {
    id: '2',
    severity: 'critique' as const,
    page: 'GPS Tracking',
    route: '/gps',
    category: 'Responsive',
    title: 'Layout cassé sur écran <1280px',
    description: 'Cards overflow hors de la grille principale. 6 éléments affectés.',
    detected: 'il y a 2 heures',
    status: 'open' as const,
  },
  {
    id: '3',
    severity: 'majeur' as const,
    page: 'Stocks',
    route: '/stocks',
    category: 'Données Mock',
    title: "Badges 'Autonomie' affichent '—'",
    description: "Badges 'Autonomie' sur silos affichent '—' au lieu de valeurs mock. Colonne JOURS RESTANTS dans le tableau aussi vide.",
    detected: 'il y a 6 heures',
    status: 'open' as const,
  },
  {
    id: '4',
    severity: 'majeur' as const,
    page: 'Clients',
    route: '/clients',
    category: 'Densité Visuelle',
    title: 'Cards clients surchargées visuellement',
    description: 'Après ajout de 3 types de badges (Intelligence, Risque Paiement, Churn), espacement insuffisant entre badges.',
    detected: 'il y a 1 heure',
    status: 'open' as const,
  },
  {
    id: '5',
    severity: 'majeur' as const,
    page: 'Multiple',
    route: '/',
    category: 'Cohérence',
    title: 'Format de devise incohérent',
    description: "'84,200 MAD' sur Paiements vs '84200 MAD' sur Ventes vs '84 200 MAD' sur Dashboard.",
    detected: 'il y a 4 heures',
    status: 'open' as const,
  },
  {
    id: '6',
    severity: 'mineur' as const,
    page: 'Planning',
    route: '/planning',
    category: 'Espacement',
    title: 'Weather badges et route badges trop proches',
    description: 'Manque 4px de gap entre les deux pills.',
    detected: 'il y a 1 heure',
    status: 'open' as const,
  },
  {
    id: '7',
    severity: 'mineur' as const,
    page: 'Multiple',
    route: '/',
    category: 'Typographie',
    title: "'Agent IA:' label font-weight incohérent",
    description: "Utilise font-weight 600 sur Dashboard mais 500 sur Laboratoire. Harmoniser à 600.",
    detected: 'il y a 2 heures',
    status: 'open' as const,
  },
  {
    id: '8',
    severity: 'mineur' as const,
    page: 'Maintenance',
    route: '/maintenance',
    category: 'Composants',
    title: 'Circular score diamètre incohérent',
    description: "Score 'Sécurité 92/100' a un diamètre de 64px vs 56px pour les autres scores circulaires.",
    detected: 'il y a 1 heure',
    status: 'open' as const,
  },
];

export type AuditIssue = typeof AUDIT_ISSUES[number];

export const DIMENSION_SCORES = [
  { dimension: 'Layout & Grille', score: 8.5 },
  { dimension: 'Typographie', score: 7.8 },
  { dimension: 'Couleurs', score: 9.0 },
  { dimension: 'Composants', score: 8.2 },
  { dimension: 'Intégration IA', score: 8.8 },
  { dimension: 'Espacement', score: 7.5 },
  { dimension: 'Data Viz', score: 8.3 },
  { dimension: 'Navigation', score: 8.9 },
  { dimension: 'Responsive', score: 6.8 },
  { dimension: 'Localisation FR', score: 8.0 },
];

export const CONSISTENCY_MATRIX = [
  { element: 'Card border-radius', status: 'ok' as const, pages: '—', detail: '12px partout' },
  { element: 'Card shadow', status: 'ok' as const, pages: '—', detail: 'Identique' },
  { element: 'Card padding', status: 'warn' as const, pages: 'Stocks, GPS', detail: '16px vs 20px' },
  { element: '"Agent IA:" label', status: 'warn' as const, pages: 'Lab, Maintenance', detail: 'font-weight 500 vs 600' },
  { element: 'Status green', status: 'ok' as const, pages: '—', detail: '#22c55e' },
  { element: 'Status amber', status: 'ok' as const, pages: '—', detail: '#f59e0b' },
  { element: 'Status red', status: 'ok' as const, pages: '—', detail: '#ef4444' },
  { element: 'Table header bg', status: 'warn' as const, pages: 'Stocks, Ventes, Clients', detail: 'Légères variations' },
  { element: 'Button height', status: 'ok' as const, pages: '—', detail: '36px' },
  { element: 'Currency format', status: 'fail' as const, pages: 'Dashboard, Ventes, Paiements', detail: '3 formats différents' },
  { element: 'Date format', status: 'warn' as const, pages: 'Planning, Paiements', detail: 'DD/MM vs DD Month' },
  { element: 'Circular score size', status: 'warn' as const, pages: 'Maintenance', detail: '64px vs 56px' },
  { element: 'Tooltip style', status: 'ok' as const, pages: '—', detail: 'Identique' },
  { element: 'Collapse chevron', status: 'ok' as const, pages: '—', detail: 'Identique' },
];

export const TREND_DATA = Array.from({ length: 30 }, (_, i) => {
  const base = 7.2 + (1.2 * i) / 29;
  // Small dips at day 10 (Wave 1) and day 28 (Wave 2)
  const dip = (i === 10 || i === 11) ? -0.4 : (i === 28) ? -0.3 : 0;
  return {
    day: `J-${29 - i}`,
    dayNum: i + 1,
    score: +Math.max(6.5, Math.min(10, base + dip)).toFixed(1),
  };
});

export const MOCK_FIX_PROMPTS: Record<string, string> = {
  '/stocks': `Fix the following issues on the Stocks page (/stocks):

1. Silo autonomie badges currently show '—'. Replace with mock data: Ciment: ~3j (amber), Sable: ~8j (green), Gravier: ~6j (green), Adjuvant: ~1j (red), Eau: ~12j (green).

2. JOURS RESTANTS column in the Résumé table shows '—'. Populate with matching mock values.

3. Card padding is 16px, should be 20px to match app standard. Update padding on all cards.`,
  '/production': `Fix the following issues on the Production page (/production):

1. Remove visible test/mock data from WorldClassContractors.tsx that could appear in CEO demo.

2. Ensure table data formatting is consistent with other pages.

3. Fix any error toast issues from previous sessions.`,
  '/gps': `Fix the following issues on the GPS Tracking page (/gps):

1. Fix card overflow on screens <1280px. Ensure responsive grid breakpoints.

2. Add horizontal scroll for table on small screens.

3. Test all layouts at 1024px, 1280px, and 1440px breakpoints.`,
};
