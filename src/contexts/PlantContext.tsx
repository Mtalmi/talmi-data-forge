import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useUnits, type UnitSystem } from '@/i18n/UnitContext';

export type PlantId = 'ma' | 'eu' | 'us';

export interface PlantData {
  id: PlantId;
  company: string;
  location: string;
  flag: string;
  pillLabel: string;
  live: boolean;
  stats: string;
  unitSystem: UnitSystem;
  currency: string;
  clients: string[];
  trucks: string[];
  drivers: string[];
  formules: string[];
  norms: string[];
  production: { volume: number; volumeUnit: string; batches: number };
  lab: { slump: string; resistance: string };
  weather: { temp: string; condition: string; humidity: string; optimal: boolean };
  seasonal: string;
  flaggedClient: string | null;
  flaggedClientDebt: string;
  nextDeliveryClient: string;
}

const PLANTS: Record<PlantId, PlantData> = {
  ma: {
    id: 'ma',
    company: 'Atlas Concrete Morocco · Casablanca',
    location: 'Casablanca',
    flag: '🇲🇦',
    pillLabel: 'Atlas Concrete Morocco',
    live: true,
    stats: '14 mars · 671 m³ · 14 batches · Score 87/100',
    unitSystem: 'mena',
    currency: 'DH',
    clients: ['TGCC', 'Constructions Modernes SA', 'BTP Maroc SARL', 'Saudi Readymix Co.', 'Ciments & Béton du Sud', 'Sigma Bâtiment'],
    trucks: ['T-04', 'T-07', 'T-09', 'T-12'],
    drivers: ['Youssef Benali', 'Karim Idrissi', 'Mehdi Tazi', 'Omar Fassi'],
    formules: ['F-B20', 'F-B25', 'F-B30', 'F-B35'],
    norms: ['NM 10.1.008', 'NM 10.1.271'],
    production: { volume: 671, volumeUnit: 'm³', batches: 14 },
    lab: { slump: '18cm', resistance: '28.5 MPa' },
    weather: { temp: '22°C', condition: 'Ensoleillé', humidity: '45%', optimal: true },
    seasonal: 'Conditions optimales — production nominale',
    flaggedClient: 'Sigma Bâtiment',
    flaggedClientDebt: '189K DH',
    nextDeliveryClient: 'Ciments & Béton du Sud',
  },
  eu: {
    id: 'eu',
    company: 'EuroBeton GmbH · München, Deutschland',
    location: 'München',
    flag: '🇪🇺',
    pillLabel: 'Demo EU Plant',
    live: false,
    stats: 'Demo · données simulées',
    unitSystem: 'eu',
    currency: 'EUR',
    clients: ['Hochtief AG', 'STRABAG SE', 'Vinci Construction', 'Bouygues Bâtiment', 'HeidelbergCement', 'Porr Group'],
    trucks: ['LKW-01', 'LKW-02', 'LKW-03', 'LKW-04'],
    drivers: ['Hans Müller', 'Stefan Weber', 'Klaus Fischer', 'Thomas Schmidt'],
    formules: ['C20/25', 'C25/30', 'C30/37', 'C35/45'],
    norms: ['EN 206-1', 'EN 12350', 'CE Marking'],
    production: { volume: 520, volumeUnit: 'm³', batches: 11 },
    lab: { slump: '17cm', resistance: '31.2 MPa' },
    weather: { temp: '8°C', condition: 'Bewölkt', humidity: '72%', optimal: false },
    seasonal: 'Winterbau Regelung aktiv — Frostschutz additiv erforderlich',
    flaggedClient: 'Porr Group',
    flaggedClientDebt: '€47K',
    nextDeliveryClient: 'Hochtief AG',
  },
  us: {
    id: 'us',
    company: 'Liberty Ready-Mix Inc. · Houston, TX',
    location: 'Houston, TX',
    flag: '🇺🇸',
    pillLabel: 'Demo US Plant',
    live: false,
    stats: 'Demo · données simulées',
    unitSystem: 'us',
    currency: 'USD',
    clients: ['Turner Construction', 'Bechtel Corp', 'Kiewit Infrastructure', 'McCarthy Building', 'Webcor Builders', 'Smith & Sons Contractors'],
    trucks: ['TRK-01', 'TRK-02', 'TRK-03', 'TRK-04'],
    drivers: ['James Wilson', 'Robert Johnson', 'Michael Davis', 'William Brown'],
    formules: ['2500 PSI', '3500 PSI', '4500 PSI', '5000 PSI'],
    norms: ['ASTM C94', 'ACI 318', 'State DOT Spec'],
    production: { volume: 877, volumeUnit: 'yd³', batches: 16 },
    lab: { slump: '7 in', resistance: '4,100 PSI' },
    weather: { temp: '92°F', condition: 'Humid', humidity: '85%', optimal: false },
    seasonal: 'Hurricane season advisory — supply chain contingency active',
    flaggedClient: 'Smith & Sons Contractors',
    flaggedClientDebt: '$52K',
    nextDeliveryClient: 'Turner Construction',
  },
};

interface PlantContextValue {
  activePlant: PlantId;
  plant: PlantData;
  setPlant: (id: PlantId) => void;
  isDemo: boolean;
  /** Fade state: 0..1. Content should multiply opacity by this. */
  fadeOpacity: number;
  allPlants: PlantData[];
}

const STORAGE_KEY = 'tbos_active_plant';

const PlantContext = createContext<PlantContextValue | null>(null);

export function PlantProvider({ children }: { children: ReactNode }) {
  const { setSystem } = useUnits();

  const [activePlant, setActivePlantState] = useState<PlantId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PlantId | null;
    return saved && ['ma', 'eu', 'us'].includes(saved) ? saved : 'ma';
  });

  const [fadeOpacity, setFadeOpacity] = useState(1);

  // Auto-switch unit system when plant changes
  useEffect(() => {
    setSystem(PLANTS[activePlant].unitSystem);
  }, [activePlant, setSystem]);

  const setPlant = useCallback((id: PlantId) => {
    if (id === activePlant) return;
    // Fade out
    setFadeOpacity(0.3);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, id);
      setActivePlantState(id);
      // Fade in
      setTimeout(() => setFadeOpacity(1), 50);
    }, 300);
  }, [activePlant]);

  const ctx: PlantContextValue = {
    activePlant,
    plant: PLANTS[activePlant],
    setPlant,
    isDemo: activePlant !== 'ma',
    fadeOpacity,
    allPlants: Object.values(PLANTS),
  };

  return <PlantContext.Provider value={ctx}>{children}</PlantContext.Provider>;
}

export function usePlant() {
  const ctx = useContext(PlantContext);
  if (!ctx) {
    // Fallback for components outside provider
    return {
      activePlant: 'ma' as PlantId,
      plant: PLANTS.ma,
      setPlant: () => {},
      isDemo: false,
      fadeOpacity: 1,
      allPlants: Object.values(PLANTS),
    };
  }
  return ctx;
}
