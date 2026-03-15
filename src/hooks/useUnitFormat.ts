/**
 * useUnitFormat — display-layer formatting hook that reads the active unit system
 * from UnitContext and provides ready-to-render formatted strings.
 *
 * All source values are assumed to be in MENA base units (m³, kg, L, °C, MPa, DH, km).
 * The hook converts and formats them for the active system.
 */

import { useUnits } from '@/i18n/UnitContext';

const FR = 'fr-FR';

function fmt(v: number, decimals = 0): string {
  return v.toLocaleString(FR, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');
}

export function useUnitFormat() {
  const u = useUnits();

  /** Format volume (source: m³) → "671 m³" or "877.4 yd³" */
  const fmtVolume = (m3: number, decimals?: number) => {
    const v = u.volume(m3);
    const d = decimals ?? u.config.volume.decimals;
    return `${fmt(v, d)} ${u.config.volume.unit}`;
  };

  /** Volume unit only */
  const volUnit = u.config.volume.unit;

  /** Format volume rate (source: m³/h) → "47 m³/h" or "61.5 yd³/h" */
  const fmtVolumeRate = (m3h: number) => {
    const v = u.volume(m3h);
    return `${fmt(v, u.config.volume.decimals)} ${u.config.volume.unit}/h`;
  };

  /** Format weight (source: kg) → "42 000 kg" or "92 610 lb" */
  const fmtWeight = (kg: number) => {
    const v = u.weight(kg);
    return `${fmt(v)} ${u.config.weight.unit}`;
  };

  /** Format liquid (source: L) → "200 L" or "52.8 gal" */
  const fmtLiquid = (l: number) => {
    const v = u.liquid(l);
    return `${fmt(v, u.config.liquid.decimals)} ${u.config.liquid.unit}`;
  };

  /** Format temperature (source: °C) → "22°C" or "72°F" */
  const fmtTemp = (c: number) => {
    return `${u.temp(c)}${u.config.temperature.unit}`;
  };

  /** Format pressure (source: MPa) → "25 MPa" or "3 626 PSI" */
  const fmtPressure = (mpa: number) => {
    const v = u.pressure(mpa);
    return `${fmt(v)} ${u.config.pressure.unit}`;
  };

  /** Format distance (source: km) → "127 km" or "78.9 mi" */
  const fmtDistance = (km: number) => {
    const v = u.distance(km);
    return `${fmt(v, u.config.distance.decimals)} ${u.config.distance.unit}`;
  };

  /** Format distance unit only */
  const distUnit = u.config.distance.unit;

  /** Format currency (source: DH) → "75 600 DH" or "6 955 EUR" */
  const fmtCurrency = (dh: number) => {
    const v = u.currency(dh);
    return `${fmt(v)} ${u.config.currency.symbol}`;
  };

  /** Format currency compact (source: DH) → "75.6K DH" or "7K EUR" */
  const fmtCurrencyK = (dh: number) => {
    const v = u.currency(dh);
    const abs = Math.abs(v);
    const sign = v < 0 ? '−' : '';
    if (abs >= 1_000_000) {
      const m = abs / 1_000_000;
      return `${sign}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M ${u.config.currency.symbol}`;
    }
    if (abs >= 1_000) {
      const k = abs / 1_000;
      return `${sign}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K ${u.config.currency.symbol}`;
    }
    return `${sign}${fmt(abs)} ${u.config.currency.symbol}`;
  };

  /** Currency symbol */
  const currSym = u.config.currency.symbol;

  /** Currency unit for KPI display (e.g. "K DH" or "K EUR") */
  const currKUnit = `K ${u.config.currency.symbol}`;

  /** Convert a DH value and return the raw number */
  const rawCurrency = (dh: number) => u.currency(dh);
  /** Convert a DH value to K and return the raw number */
  const rawCurrencyK = (dh: number) => {
    const v = u.currency(dh);
    return +(v / 1000).toFixed(1);
  };

  /** Convert volume and return raw number */
  const rawVolume = (m3: number) => u.volume(m3);

  /** Convert temperature and return raw number */
  const rawTemp = (c: number) => u.temp(c);

  /** Format fuel efficiency (source: L/100km) → "42 L/100km" or "5.6 MPG" */
  const fmtFuel = (lPer100km: number) => {
    const { value, unit } = u.config.fuelConvert(lPer100km);
    return `${fmt(value, 1)} ${unit}`;
  };

  /** Format speed (source: km/h) → "45 km/h" or "28 mph" */
  const fmtSpeed = (kmh: number) => {
    const v = u.speed(kmh);
    return `${v} ${u.config.speed.unit}`;
  };

  /** Format slump (source: cm) → "18 cm" or "7.1 in" */
  const fmtSlump = (cm: number) => {
    const v = u.slump(cm);
    return `${fmt(v, u.config.slump.decimals)} ${u.config.slump.unit}`;
  };

  /** Convert concrete grade name */
  const grade = u.grade;

  /** Convert norm name */
  const norm = u.norm;

  /** Volume unit only */
  const volUnit = u.config.volume.unit;

  /** Pressure unit only */
  const presUnit = u.config.pressure.unit;

  /** Speed unit only */
  const speedUnit = u.config.speed.unit;

  /** Whether values are converted (non-MENA) */
  const isConverted = u.isConverted;

  /** Unit system label */
  const systemLabel = u.config.label;
  const systemBadge = u.config.badge;

  return {
    fmtVolume, fmtVolumeRate, fmtWeight, fmtLiquid, fmtTemp, fmtPressure,
    fmtDistance, fmtCurrency, fmtCurrencyK, fmtFuel, fmtSpeed, fmtSlump,
    grade, norm,
    volUnit, distUnit, currSym, currKUnit, presUnit, speedUnit,
    rawCurrency, rawCurrencyK, rawVolume, rawTemp,
    isConverted, systemLabel, systemBadge,
  };
}
