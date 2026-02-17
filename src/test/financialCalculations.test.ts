import { describe, it, expect } from 'vitest';

/**
 * TBOS Financial Calculations - Pure Logic Tests
 * Tests pricing, margins, TVA, leakage detection, and transport costs
 * extracted from useFinancialCalculations.ts
 */

// =============================================
// PURE FUNCTIONS (extracted from hook for testing)
// =============================================

/** Calculate CUT given raw material quantities and prices */
function calculateCUT(
  formule: { ciment_kg_m3: number; eau_l_m3: number; adjuvant_l_m3: number; sable_m3?: number; sable_kg_m3?: number; gravette_m3?: number; gravier_kg_m3?: number },
  prices: { ciment: number; sable: number; gravette: number; eau: number; adjuvant: number }
): number {
  const sableM3 = formule.sable_m3 || (formule.sable_kg_m3 ? formule.sable_kg_m3 / 1600 : 0);
  const gravetteM3 = formule.gravette_m3 || (formule.gravier_kg_m3 ? formule.gravier_kg_m3 / 1500 : 0);

  let cut = 0;
  cut += (formule.ciment_kg_m3 / 1000) * prices.ciment;
  cut += sableM3 * prices.sable;
  cut += gravetteM3 * prices.gravette;
  cut += (formule.eau_l_m3 / 1000) * prices.eau;
  cut += formule.adjuvant_l_m3 * prices.adjuvant;

  return Math.round(cut * 100) / 100;
}

/** Calculate quote breakdown */
function calculateQuoteBreakdown(cut: number, volumeM3: number, distanceKm: number = 20) {
  const fixedCost = 150;
  const marginPct = 0.25;
  const transportExtra = distanceKm > 20 ? (distanceKm - 20) * 5 : 0;
  const totalCost = cut + fixedCost + transportExtra;
  const pvm = totalCost / (1 - marginPct);
  return {
    cut_per_m3: cut,
    fixed_cost_per_m3: fixedCost,
    transport_extra_per_m3: transportExtra,
    total_cost_per_m3: totalCost,
    margin_pct: marginPct * 100,
    prix_vente_minimum: Math.round(pvm * 100) / 100,
    total_quote: Math.round(pvm * volumeM3 * 100) / 100,
  };
}

/** Leakage detection */
function checkLeakage(curReel: number, cutTheorique: number, threshold: number = 5): boolean {
  if (!curReel || !cutTheorique || cutTheorique === 0) return false;
  return ((curReel - cutTheorique) / cutTheorique) * 100 > threshold;
}

function calculateLeakagePercent(curReel: number, cutTheorique: number): number {
  if (!curReel || !cutTheorique || cutTheorique === 0) return 0;
  return ((curReel - cutTheorique) / cutTheorique) * 100;
}

/** TVA calculation (standard Moroccan 20%) */
function calculateTVA(montantHT: number): { tva: number; ttc: number } {
  const tva = montantHT * 0.2;
  return { tva: Math.round(tva * 100) / 100, ttc: Math.round((montantHT + tva) * 100) / 100 };
}

/** Margin calculation */
function calculateMarginPct(prixVente: number, coutTotal: number): number {
  if (prixVente === 0) return 0;
  return ((prixVente - coutTotal) / prixVente) * 100;
}

// =============================================
// TESTS
// =============================================

const SAMPLE_PRICES = { ciment: 1200, sable: 120, gravette: 150, eau: 15, adjuvant: 35 };

const SAMPLE_FORMULE = {
  ciment_kg_m3: 350,
  eau_l_m3: 175,
  adjuvant_l_m3: 2.5,
  sable_m3: 0.45,
  gravette_m3: 0.75,
};

describe('Financial - CUT Calculation', () => {
  it('calculates CUT correctly for B25', () => {
    const cut = calculateCUT(SAMPLE_FORMULE, SAMPLE_PRICES);
    // 350/1000*1200 + 0.45*120 + 0.75*150 + 175/1000*15 + 2.5*35
    // = 420 + 54 + 112.5 + 2.625 + 87.5 = 676.625 → 676.63
    expect(cut).toBe(676.63);
  });

  it('converts kg to m³ for sable (density 1600)', () => {
    const formule = { ...SAMPLE_FORMULE, sable_m3: undefined, sable_kg_m3: 720 }; // 720/1600 = 0.45
    const cut = calculateCUT(formule, SAMPLE_PRICES);
    expect(cut).toBe(676.63);
  });

  it('converts kg to m³ for gravier (density 1500)', () => {
    const formule = { ...SAMPLE_FORMULE, gravette_m3: undefined, gravier_kg_m3: 1125 }; // 1125/1500 = 0.75
    const cut = calculateCUT(formule, SAMPLE_PRICES);
    expect(cut).toBe(676.63);
  });

  it('returns 0 CUT when all prices are 0', () => {
    const zeroPrices = { ciment: 0, sable: 0, gravette: 0, eau: 0, adjuvant: 0 };
    expect(calculateCUT(SAMPLE_FORMULE, zeroPrices)).toBe(0);
  });
});

describe('Financial - Quote Breakdown', () => {
  it('calculates PVM with 25% margin', () => {
    const quote = calculateQuoteBreakdown(676.63, 10);
    // totalCost = 676.63 + 150 + 0 = 826.63
    // PVM = 826.63 / 0.75 = 1102.17
    expect(quote.prix_vente_minimum).toBe(1102.17);
    expect(quote.margin_pct).toBe(25);
    expect(quote.transport_extra_per_m3).toBe(0);
  });

  it('adds transport surcharge beyond 20km', () => {
    const quote = calculateQuoteBreakdown(676.63, 10, 40);
    // extra = (40-20) * 5 = 100
    expect(quote.transport_extra_per_m3).toBe(100);
    expect(quote.total_cost_per_m3).toBe(676.63 + 150 + 100);
  });

  it('no transport surcharge at 20km', () => {
    const quote = calculateQuoteBreakdown(676.63, 10, 20);
    expect(quote.transport_extra_per_m3).toBe(0);
  });

  it('total_quote = PVM × volume (within rounding tolerance)', () => {
    const quote = calculateQuoteBreakdown(676.63, 15);
    const expected = quote.prix_vente_minimum * 15;
    expect(Math.abs(quote.total_quote - Math.round(expected * 100) / 100)).toBeLessThan(0.1);
  });
});

describe('Financial - TVA (20% Moroccan)', () => {
  it('calculates TVA on 10,000 DH', () => {
    const { tva, ttc } = calculateTVA(10000);
    expect(tva).toBe(2000);
    expect(ttc).toBe(12000);
  });

  it('handles zero amount', () => {
    const { tva, ttc } = calculateTVA(0);
    expect(tva).toBe(0);
    expect(ttc).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const { tva, ttc } = calculateTVA(333.33);
    expect(tva).toBe(66.67);
    expect(ttc).toBe(400);
  });
});

describe('Financial - Margin Calculation', () => {
  it('calculates 25% margin', () => {
    const margin = calculateMarginPct(1000, 750);
    expect(margin).toBe(25);
  });

  it('calculates 0% margin when sale = cost', () => {
    expect(calculateMarginPct(500, 500)).toBe(0);
  });

  it('returns 0 when sale price is 0', () => {
    expect(calculateMarginPct(0, 500)).toBe(0);
  });

  it('detects negative margin (selling at loss)', () => {
    const margin = calculateMarginPct(700, 800);
    expect(margin).toBeLessThan(0);
  });
});

describe('Financial - Leakage Detection', () => {
  it('detects leakage above 5% threshold', () => {
    expect(checkLeakage(110, 100, 5)).toBe(true); // 10% > 5%
  });

  it('no leakage within threshold', () => {
    expect(checkLeakage(104, 100, 5)).toBe(false); // 4% < 5%
  });

  it('exact threshold is NOT leakage', () => {
    expect(checkLeakage(105, 100, 5)).toBe(false); // 5% === 5%, not >
  });

  it('returns false for zero values', () => {
    expect(checkLeakage(0, 100)).toBe(false);
    expect(checkLeakage(100, 0)).toBe(false);
  });

  it('calculates leakage percentage', () => {
    expect(calculateLeakagePercent(110, 100)).toBe(10);
    expect(calculateLeakagePercent(95, 100)).toBe(-5);
  });

  it('leakage percent returns 0 for invalid inputs', () => {
    expect(calculateLeakagePercent(0, 100)).toBe(0);
    expect(calculateLeakagePercent(100, 0)).toBe(0);
  });
});
