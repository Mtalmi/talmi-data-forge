import { describe, it, expect } from 'vitest';
import fr from '../i18n/fr';
import ar from '../i18n/ar';
import en from '../i18n/en';

/**
 * i18n Coverage Audit
 * 
 * Recursively compares all translation keys across FR (reference), AR, and EN
 * to detect missing keys, extra keys, and empty values.
 */

type TranslationObj = Record<string, unknown>;

function getAllKeys(obj: TranslationObj, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as TranslationObj, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getEmptyKeys(obj: TranslationObj, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getEmptyKeys(value as TranslationObj, fullKey));
    } else if (value === '' || value === null || value === undefined) {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n Coverage Audit', () => {
  const frKeys = new Set(getAllKeys(fr as unknown as TranslationObj));
  const arKeys = new Set(getAllKeys(ar as unknown as TranslationObj));
  const enKeys = new Set(getAllKeys(en as unknown as TranslationObj));

  it('FR is the reference language and has keys', () => {
    expect(frKeys.size).toBeGreaterThan(100);
    console.log(`📊 FR reference: ${frKeys.size} keys`);
  });

  it('AR has all FR keys (no missing Arabic translations)', () => {
    const missingInAr = [...frKeys].filter(k => !arKeys.has(k));
    if (missingInAr.length > 0) {
      console.warn(`❌ Missing in AR (${missingInAr.length}):\n  ${missingInAr.join('\n  ')}`);
    }
    expect(missingInAr).toEqual([]);
  });

  it('EN has all FR keys (no missing English translations)', () => {
    const missingInEn = [...frKeys].filter(k => !enKeys.has(k));
    if (missingInEn.length > 0) {
      console.warn(`❌ Missing in EN (${missingInEn.length}):\n  ${missingInEn.join('\n  ')}`);
    }
    expect(missingInEn).toEqual([]);
  });

  it('AR has no extra keys not in FR', () => {
    const extraInAr = [...arKeys].filter(k => !frKeys.has(k));
    if (extraInAr.length > 0) {
      console.warn(`⚠️ Extra in AR (${extraInAr.length}):\n  ${extraInAr.join('\n  ')}`);
    }
    expect(extraInAr).toEqual([]);
  });

  it('EN has no extra keys not in FR', () => {
    const extraInEn = [...enKeys].filter(k => !frKeys.has(k));
    if (extraInEn.length > 0) {
      console.warn(`⚠️ Extra in EN (${extraInEn.length}):\n  ${extraInEn.join('\n  ')}`);
    }
    expect(extraInEn).toEqual([]);
  });

  it('No empty values in FR', () => {
    const emptyFr = getEmptyKeys(fr as unknown as TranslationObj);
    if (emptyFr.length > 0) {
      console.warn(`❌ Empty FR keys:\n  ${emptyFr.join('\n  ')}`);
    }
    expect(emptyFr).toEqual([]);
  });

  it('No empty values in AR', () => {
    const emptyAr = getEmptyKeys(ar as unknown as TranslationObj);
    if (emptyAr.length > 0) {
      console.warn(`❌ Empty AR keys:\n  ${emptyAr.join('\n  ')}`);
    }
    expect(emptyAr).toEqual([]);
  });

  it('No empty values in EN', () => {
    const emptyEn = getEmptyKeys(en as unknown as TranslationObj);
    if (emptyEn.length > 0) {
      console.warn(`❌ Empty EN keys:\n  ${emptyEn.join('\n  ')}`);
    }
    expect(emptyEn).toEqual([]);
  });

  it('prints coverage summary', () => {
    const arCoverage = ([...frKeys].filter(k => arKeys.has(k)).length / frKeys.size * 100).toFixed(1);
    const enCoverage = ([...frKeys].filter(k => enKeys.has(k)).length / frKeys.size * 100).toFixed(1);
    console.log(`\n📊 i18n COVERAGE REPORT`);
    console.log(`═══════════════════════`);
    console.log(`FR (reference): ${frKeys.size} keys`);
    console.log(`AR coverage:    ${arCoverage}% (${arKeys.size} keys)`);
    console.log(`EN coverage:    ${enCoverage}% (${enKeys.size} keys)`);
    console.log(`═══════════════════════`);
    expect(true).toBe(true);
  });
});
