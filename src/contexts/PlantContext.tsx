import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useUnits, type UnitSystem } from '@/i18n/UnitContext';
import {
  ATLAS_CONCRETE, EUROBETON_GMBH, LIBERTY_READYMIX,
  type PlantData as DemoPlantData,
} from '@/data/demoPlantData';

export type PlantId = 'ma' | 'eu' | 'us';

/** Legacy shape kept for backward compat — components can use either */
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
    stats: 'Production en cours · Score 87/100',
    unitSystem: 'mena',
    currency: 'DH',
    clients: ATLAS_CONCRETE.clients.map(c => c.name),
    trucks: ATLAS_CONCRETE.trucks.map(t => t.id),
    drivers: ATLAS_CONCRETE.trucks.map(t => t.driver),
    formules: ATLAS_CONCRETE.formules.map(f => f.id),
    norms: ATLAS_CONCRETE.norms.map(n => n.code),
    production: { volume: ATLAS_CONCRETE.production.volume, volumeUnit: 'm³', batches: ATLAS_CONCRETE.production.batches },
    lab: { slump: '18cm', resistance: '28.5 MPa' },
    weather: { temp: `${ATLAS_CONCRETE.weather.temp}°C`, condition: ATLAS_CONCRETE.weather.condition, humidity: `${ATLAS_CONCRETE.weather.humidity}%`, optimal: true },
    seasonal: 'Conditions optimales — production nominale',
    flaggedClient: ATLAS_CONCRETE.riskClient.name,
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
    clients: EUROBETON_GMBH.clients.map(c => c.name),
    trucks: EUROBETON_GMBH.trucks.map(t => t.id),
    drivers: EUROBETON_GMBH.trucks.map(t => t.driver),
    formules: EUROBETON_GMBH.formules.map(f => f.id),
    norms: EUROBETON_GMBH.norms.map(n => n.code),
    production: { volume: EUROBETON_GMBH.production.volume, volumeUnit: 'm³', batches: EUROBETON_GMBH.production.batches },
    lab: { slump: '17cm', resistance: '31.2 MPa' },
    weather: { temp: `${EUROBETON_GMBH.weather.temp}°C`, condition: EUROBETON_GMBH.weather.condition, humidity: `${EUROBETON_GMBH.weather.humidity}%`, optimal: false },
    seasonal: 'Construction hivernale — additif antigel requis',
    flaggedClient: EUROBETON_GMBH.riskClient.name,
    flaggedClientDebt: `€${Math.round(EUROBETON_GMBH.riskClient.amount / 1000)}K`,
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
    clients: LIBERTY_READYMIX.clients.map(c => c.name),
    trucks: LIBERTY_READYMIX.trucks.map(t => t.id),
    drivers: LIBERTY_READYMIX.trucks.map(t => t.driver),
    formules: LIBERTY_READYMIX.formules.map(f => f.id),
    norms: LIBERTY_READYMIX.norms.map(n => n.code),
    production: { volume: LIBERTY_READYMIX.production.volume, volumeUnit: 'yd³', batches: LIBERTY_READYMIX.production.batches },
    lab: { slump: '7 in', resistance: '4,100 PSI' },
    weather: { temp: `${LIBERTY_READYMIX.weather.temp}°C`, condition: LIBERTY_READYMIX.weather.condition, humidity: `${LIBERTY_READYMIX.weather.humidity}%`, optimal: false },
    seasonal: 'Saison ouragans — plan de contingence actif',
    flaggedClient: LIBERTY_READYMIX.riskClient.name,
    flaggedClientDebt: `$${Math.round(LIBERTY_READYMIX.riskClient.amount / 1000)}K`,
    nextDeliveryClient: 'Turner Construction',
  },
};

/** Map PlantId → rich demo data */
const DEMO_MAP: Record<PlantId, DemoPlantData> = {
  ma: ATLAS_CONCRETE,
  eu: EUROBETON_GMBH,
  us: LIBERTY_READYMIX,
};

interface PlantContextValue {
  activePlant: PlantId;
  plant: PlantData;
  /** Rich demo plant data from demoPlantData.ts */
  demoData: DemoPlantData;
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
      // Log plant switch
      window.dispatchEvent(new CustomEvent('tbos-activity', {
        detail: { type: 'system', message: `Centrale changée: ${PLANTS[id].pillLabel}`, source: 'SYSTÈME', severity: 'info' }
      }));
      // Fade in
      setTimeout(() => setFadeOpacity(1), 50);
    }, 300);
  }, [activePlant]);

  const ctx: PlantContextValue = {
    activePlant,
    plant: PLANTS[activePlant],
    demoData: DEMO_MAP[activePlant],
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
      demoData: ATLAS_CONCRETE,
      setPlant: () => {},
      isDemo: false,
      fadeOpacity: 1,
      allPlants: Object.values(PLANTS),
    };
  }
  return ctx;
}
