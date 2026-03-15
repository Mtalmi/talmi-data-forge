import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type UnitSystem = 'mena' | 'eu' | 'us';

export interface UnitConfig {
  system: UnitSystem;
  label: string;
  badge: string;
  flag: string;
  currency: { symbol: string; rate: number };
  volume: { unit: string; factor: number; decimals: number };
  weight: { unit: string; factor: number; decimals: number };
  liquid: { unit: string; factor: number; decimals: number };
  temperature: { unit: string; convert: (c: number) => number };
  pressure: { unit: string; factor: number; roundTo: number };
  distance: { unit: string; factor: number; decimals: number };
  speed: { unit: string; factor: number };
  slump: { unit: string; factor: number; decimals: number };
  concreteGrades: Record<string, string>;
  norms: Record<string, string>;
  fuelConvert: (lPer100km: number) => { value: number; unit: string };
}

const CONFIGS: Record<UnitSystem, UnitConfig> = {
  mena: {
    system: 'mena',
    label: 'Métrique MENA',
    badge: 'MÉTRIQUE',
    flag: '🇲🇦',
    currency: { symbol: 'DH', rate: 1 },
    volume: { unit: 'm³', factor: 1, decimals: 1 },
    weight: { unit: 'kg', factor: 1, decimals: 0 },
    liquid: { unit: 'L', factor: 1, decimals: 1 },
    temperature: { unit: '°C', convert: (c) => c },
    pressure: { unit: 'MPa', factor: 1, roundTo: 1 },
    distance: { unit: 'km', factor: 1, decimals: 1 },
    speed: { unit: 'km/h', factor: 1 },
    slump: { unit: 'cm', factor: 1, decimals: 0 },
    concreteGrades: { 'F-B20': 'F-B20', 'F-B25': 'F-B25', 'F-B30': 'F-B30', 'F-B35': 'F-B35' },
    norms: { 'NM 10.1.008': 'NM 10.1.008', 'NM 10.1.271': 'NM 10.1.271' },
    fuelConvert: (v) => ({ value: v, unit: 'L/100km' }),
  },
  eu: {
    system: 'eu',
    label: 'Métrique EU',
    badge: 'EU',
    flag: '🇪🇺',
    currency: { symbol: 'EUR', rate: 0.092 },
    volume: { unit: 'm³', factor: 1, decimals: 1 },
    weight: { unit: 'kg', factor: 1, decimals: 0 },
    liquid: { unit: 'L', factor: 1, decimals: 1 },
    temperature: { unit: '°C', convert: (c) => c },
    pressure: { unit: 'MPa', factor: 1, roundTo: 1 },
    distance: { unit: 'km', factor: 1, decimals: 1 },
    speed: { unit: 'km/h', factor: 1 },
    slump: { unit: 'cm', factor: 1, decimals: 0 },
    concreteGrades: { 'F-B20': 'C20/25', 'F-B25': 'C25/30', 'F-B30': 'C30/37', 'F-B35': 'C35/45' },
    norms: { 'NM 10.1.008': 'EN 206-1', 'NM 10.1.271': 'EN 206-1' },
    fuelConvert: (v) => ({ value: v, unit: 'L/100km' }),
  },
  us: {
    system: 'us',
    label: 'Impérial US',
    badge: 'IMPÉRIAL',
    flag: '🇺🇸',
    currency: { symbol: 'USD', rate: 0.099 },
    volume: { unit: 'yd³', factor: 1.308, decimals: 1 },
    weight: { unit: 'lb', factor: 2.205, decimals: 0 },
    liquid: { unit: 'gal', factor: 0.264, decimals: 1 },
    temperature: { unit: '°F', convert: (c) => (c * 9) / 5 + 32 },
    pressure: { unit: 'PSI', factor: 145.038, roundTo: 50 },
    distance: { unit: 'mi', factor: 0.621, decimals: 1 },
    concreteGrades: { 'F-B20': '2500 PSI', 'F-B25': '3500 PSI', 'F-B30': '4500 PSI', 'F-B35': '5000 PSI' },
    norms: { 'NM 10.1.008': 'ASTM C94', 'NM 10.1.271': 'ASTM C94' },
    fuelConvert: (v) => ({ value: v > 0 ? Math.round(235.215 / v * 10) / 10 : 0, unit: 'MPG' }),
  },
};

interface UnitContextValue {
  system: UnitSystem;
  setSystem: (s: UnitSystem) => void;
  config: UnitConfig;
  /** Convert currency value from DH */
  currency: (dh: number) => number;
  /** Format currency with symbol */
  formatCurrency: (dh: number) => string;
  /** Convert volume from m³ */
  volume: (m3: number) => number;
  /** Convert weight from kg */
  weight: (kg: number) => number;
  /** Convert liquid from L */
  liquid: (l: number) => number;
  /** Convert temperature from °C */
  temp: (c: number) => number;
  /** Convert pressure from MPa */
  pressure: (mpa: number) => number;
  /** Convert distance from km */
  distance: (km: number) => number;
  /** Convert concrete grade name */
  grade: (g: string) => string;
  /** Convert norm name */
  norm: (n: string) => string;
  /** Whether display is converted (non-MENA) */
  isConverted: boolean;
}

const STORAGE_KEY = 'tbos_unit_system';

const UnitContext = createContext<UnitContextValue | null>(null);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [system, setSystemState] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UnitSystem | null;
    return saved && ['mena', 'eu', 'us'].includes(saved) ? saved : 'mena';
  });

  const setSystem = useCallback((s: UnitSystem) => {
    localStorage.setItem(STORAGE_KEY, s);
    setSystemState(s);
  }, []);

  const cfg = CONFIGS[system];

  const ctx: UnitContextValue = {
    system,
    setSystem,
    config: cfg,
    currency: (dh) => Math.round(dh * cfg.currency.rate),
    formatCurrency: (dh) => {
      const val = Math.round(dh * cfg.currency.rate);
      return `${val.toLocaleString('fr-FR')} ${cfg.currency.symbol}`;
    },
    volume: (m3) => +(m3 * cfg.volume.factor).toFixed(cfg.volume.decimals),
    weight: (kg) => +(kg * cfg.weight.factor).toFixed(cfg.weight.decimals),
    liquid: (l) => +(l * cfg.liquid.factor).toFixed(cfg.liquid.decimals),
    temp: (c) => Math.round(cfg.temperature.convert(c)),
    pressure: (mpa) => {
      const raw = mpa * cfg.pressure.factor;
      return cfg.pressure.roundTo > 1 ? Math.round(raw / cfg.pressure.roundTo) * cfg.pressure.roundTo : +(raw.toFixed(1));
    },
    distance: (km) => +(km * cfg.distance.factor).toFixed(cfg.distance.decimals),
    grade: (g) => cfg.concreteGrades[g] ?? g,
    norm: (n) => cfg.norms[n] ?? n,
    isConverted: system !== 'mena',
  };

  return <UnitContext.Provider value={ctx}>{children}</UnitContext.Provider>;
}

const fallback: UnitContextValue = {
  system: 'mena',
  setSystem: () => {},
  config: CONFIGS.mena,
  currency: (v) => v,
  formatCurrency: (v) => `${v.toLocaleString('fr-FR')} DH`,
  volume: (v) => v,
  weight: (v) => v,
  liquid: (v) => v,
  temp: (v) => v,
  pressure: (v) => v,
  distance: (v) => v,
  grade: (g) => g,
  norm: (n) => n,
  isConverted: false,
};

export function useUnits() {
  const ctx = useContext(UnitContext);
  return ctx ?? fallback;
}
