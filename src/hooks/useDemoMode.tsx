import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_KEY = 'tbos_demo_mode';

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return sessionStorage.getItem(DEMO_KEY) === 'true';
  });

  const enterDemoMode = useCallback(() => {
    sessionStorage.setItem(DEMO_KEY, 'true');
    setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    sessionStorage.removeItem(DEMO_KEY);
    setIsDemoMode(false);
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════
// DEMO DATA — Realistic fake stats for showcase
// ═══════════════════════════════════════════════

export const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@tbos-suite.com',
  user_metadata: { full_name: 'Visiteur Démo' },
} as any;

export const DEMO_ROLE = 'ceo' as const;

export const DEMO_DASHBOARD_STATS = {
  totalDeliveries: 47,
  totalVolume: 1284,
  totalClients: 23,
  pendingPaymentsTotal: 342000,
  pendingPaymentsCount: 8,
  marginAlerts: 2,
  curMoyen7j: 485.30,
  tauxECMoyen: 3.2,
  deliveriesTrend: 12.5,
  volumeTrend: 8.3,
  clientsTrend: 4.2,
  curTrend: -2.1,
  alerts: [
    {
      id: 'demo-alert-1',
      type: 'warning' as const,
      title: 'Stock Ciment',
      message: 'Niveau critique atteint — 12T restantes (seuil: 15T)',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'demo-alert-2',
      type: 'info' as const,
      title: 'Maintenance Planifiée',
      message: 'Malaxeur M-02 — Entretien préventif prévu demain 08:00',
      timestamp: new Date().toISOString(),
    },
  ],
};

export const DEMO_PERIOD_STATS = {
  totalVolume: 1284,
  chiffreAffaires: 892400,
  nbFactures: 34,
  curMoyen: 485.30,
  margeBrute: 178480,
  margeBrutePct: 22.4,
  profitNet: 134200,
  totalDepenses: 44280,
  nbClients: 23,
  volumeTrend: 8.3,
  caTrend: 15.2,
  curTrend: -2.1,
  margeTrend: 3.8,
  periodLabel: 'Février 2026',
  previousPeriodLabel: 'vs Janvier',
};
