import { describe, it, expect } from 'vitest';

/**
 * WS7 Auto-Link Algorithm Tests
 * Validates the confidence-based scoring engine that matches WS7 batches to BLs
 * Mirrors the logic in supabase/functions/ws7-auto-link/index.ts
 */

// --- Replicate edge function logic locally for unit testing ---

function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalizeText(a).replace(/\s+/g, '');
  const nb = normalizeText(b).replace(/\s+/g, '');
  if (na.includes(nb) || nb.includes(na)) return true;
  const wordsA = new Set(normalizeText(a).split(/\s+/).filter(Boolean));
  const wordsB = new Set(normalizeText(b).split(/\s+/).filter(Boolean));
  const [smaller, larger] = wordsA.size <= wordsB.size ? [wordsA, wordsB] : [wordsB, wordsA];
  if (smaller.size >= 2) {
    let matched = 0;
    for (const w of smaller) {
      if (larger.has(w)) matched++;
    }
    if (matched / smaller.size >= 0.8) return true;
  }
  return false;
}

interface Scores { date: number; client: number; volume: number; formula: number }

function computeScores(batch: any, bl: any): Scores {
  const scores: Scores = { date: 0, client: 0, volume: 0, formula: 0 };

  // Date/time scoring (max 25)
  const batchTime = new Date(batch.batch_datetime);
  const blTimeStr = bl.heure_depart_centrale || bl.heure_prevue || null;
  if (blTimeStr) {
    const batchDate = batchTime.toISOString().split('T')[0];
    const blFullTime = new Date(`${batchDate}T${blTimeStr}`);
    if (!isNaN(blFullTime.getTime())) {
      const diffMinutes = Math.abs(batchTime.getTime() - blFullTime.getTime()) / 60000;
      if (diffMinutes <= 30) scores.date = 25;
      else if (diffMinutes <= 60) scores.date = 20;
      else if (diffMinutes <= 120) scores.date = 15;
    }
  } else {
    scores.date = 10; // Same day, no time info
  }

  // Client scoring (max 35)
  const clientName = bl.client_name || '';
  if (clientName && batch.client_name) {
    const exactNorm = (s: string) => s.toLowerCase().trim();
    if (exactNorm(clientName) === exactNorm(batch.client_name)) {
      scores.client = 35;
    } else if (fuzzyMatch(clientName, batch.client_name)) {
      scores.client = 25;
    }
  }

  // Volume scoring (max 25)
  if (batch.total_volume_m3 > 0 && bl.volume_m3 > 0) {
    const pctDiff = Math.abs(bl.volume_m3 - batch.total_volume_m3) / batch.total_volume_m3;
    if (pctDiff <= 0.02) scores.volume = 25;
    else if (pctDiff <= 0.05) scores.volume = 20;
    else if (pctDiff <= 0.10) scores.volume = 15;
  }

  // Formula scoring (max 15)
  const blFormula = (bl.formule_id || '').toLowerCase();
  const batchFormula = (batch.formula || '').toLowerCase();
  if (blFormula && batchFormula && (blFormula === batchFormula || blFormula.includes(batchFormula) || batchFormula.includes(blFormula))) {
    scores.formula = 15;
  }

  return scores;
}

function totalConfidence(scores: Scores): number {
  return scores.date + scores.client + scores.volume + scores.formula;
}

function classifyLink(confidence: number): string {
  if (confidence >= 90) return 'auto_linked';
  if (confidence >= 70) return 'pending';
  return 'no_match';
}

// --- Tests ---

describe('WS7 Auto-Link: fuzzyMatch', () => {
  it('matches exact names', () => {
    expect(fuzzyMatch('SARL Beton Plus', 'SARL Beton Plus')).toBe(true);
  });

  it('matches case-insensitive', () => {
    expect(fuzzyMatch('sarl beton plus', 'SARL BETON PLUS')).toBe(true);
  });

  it('matches partial (contains)', () => {
    expect(fuzzyMatch('Beton Plus', 'SARL Beton Plus International')).toBe(true);
  });

  it('strips special characters and normalizes accents', () => {
    expect(fuzzyMatch('S.A.R.L. Beton', 'SARL Beton')).toBe(true);
  });

  it('accented chars ARE now normalized (é→e, à→a)', () => {
    expect(fuzzyMatch('S.A.R.L. Béton', 'SARL Beton')).toBe(true);
  });

  it('rejects completely different names', () => {
    expect(fuzzyMatch('Entreprise Alpha', 'Société Omega')).toBe(false);
  });
});

describe('WS7 Auto-Link: Scoring Engine', () => {
  const baseBatch = {
    batch_datetime: '2026-02-14T10:30:00',
    client_name: 'SARL Beton Plus',
    total_volume_m3: 8,
    formula: 'B25',
  };

  it('perfect match → 100 (auto_linked)', () => {
    const bl = {
      heure_depart_centrale: '10:30:00',
      client_name: 'SARL Beton Plus',
      volume_m3: 8,
      formule_id: 'B25',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.date).toBe(25);
    expect(scores.client).toBe(35);
    expect(scores.volume).toBe(25);
    expect(scores.formula).toBe(15);
    expect(totalConfidence(scores)).toBe(100);
    expect(classifyLink(totalConfidence(scores))).toBe('auto_linked');
  });

  it('close time (45min) + exact client + exact volume → 95 (auto_linked)', () => {
    const bl = {
      heure_depart_centrale: '11:15:00',
      client_name: 'SARL Beton Plus',
      volume_m3: 8,
      formule_id: 'B25',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.date).toBe(20);
    expect(totalConfidence(scores)).toBe(95);
    expect(classifyLink(totalConfidence(scores))).toBe('auto_linked');
  });

  it('fuzzy client (substring) + volume ~5% off → pending', () => {
    const bl = {
      heure_depart_centrale: '10:30:00',
      client_name: 'SARL Beton Plus Construction', // contains batch client
      volume_m3: 8.39, // ~4.9%
      formule_id: 'B25',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.client).toBe(25); // fuzzy substring
    expect(scores.volume).toBe(20); // <5%
    expect(totalConfidence(scores)).toBe(85);
    expect(classifyLink(totalConfidence(scores))).toBe('pending');
  });

  it('reordered words NOW match via word-set matching', () => {
    const bl = {
      heure_depart_centrale: '10:30:00',
      client_name: 'Beton Plus SARL',
      volume_m3: 8,
      formule_id: 'B25',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.client).toBe(25); // word-set fuzzy match
  });

  it('no time info + different client → low score (no_match)', () => {
    const bl = {
      heure_depart_centrale: null,
      client_name: 'Entreprise Gamma',
      volume_m3: 12,
      formule_id: 'B30',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.date).toBe(10);
    expect(scores.client).toBe(0);
    expect(scores.volume).toBe(0);
    expect(scores.formula).toBe(0);
    expect(totalConfidence(scores)).toBe(10);
    expect(classifyLink(totalConfidence(scores))).toBe('no_match');
  });

  it('volume within 2% gets max volume score', () => {
    const bl = {
      heure_depart_centrale: '10:30:00',
      client_name: 'SARL Beton Plus',
      volume_m3: 8.15, // ~1.9%
      formule_id: 'B25',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.volume).toBe(25);
  });

  it('volume 8% off gets 15 points', () => {
    const bl = {
      heure_depart_centrale: '10:30:00',
      client_name: 'SARL Beton Plus',
      volume_m3: 8.64, // 8%
      formule_id: 'B25',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.volume).toBe(15);
  });

  it('volume >10% off gets 0 points', () => {
    const bl = {
      heure_depart_centrale: '10:30:00',
      client_name: 'SARL Beton Plus',
      volume_m3: 10, // 25% off
      formule_id: 'B25',
    };
    const scores = computeScores(baseBatch, bl);
    expect(scores.volume).toBe(0);
  });
});

describe('WS7 Auto-Link: Classification Thresholds', () => {
  it('>=90 → auto_linked', () => expect(classifyLink(90)).toBe('auto_linked'));
  it('95 → auto_linked', () => expect(classifyLink(95)).toBe('auto_linked'));
  it('89 → pending', () => expect(classifyLink(89)).toBe('pending'));
  it('70 → pending', () => expect(classifyLink(70)).toBe('pending'));
  it('69 → no_match', () => expect(classifyLink(69)).toBe('no_match'));
  it('0 → no_match', () => expect(classifyLink(0)).toBe('no_match'));
});
