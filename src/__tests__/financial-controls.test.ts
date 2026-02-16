import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════
// Financial Controls — Moroccan Cash Payment Rules
// ═══════════════════════════════════════════════════════

const MONTHLY_CASH_LIMIT_MAD = 15_000;
const CASH_PENALTY_RATE = 0.06; // 6%
const STAMP_DUTY_RATE = 0.0025; // 0.25%

function computeCashPenalty(amount: number, monthlyTotalBefore: number) {
  const monthlyTotalAfter = monthlyTotalBefore + amount;
  const exceedsCashLimit = monthlyTotalAfter > MONTHLY_CASH_LIMIT_MAD;

  if (!exceedsCashLimit) {
    return { penaltyApplicable: false, penaltyAmount: 0, stampDuty: 0, decision: 'approved' };
  }

  const penaltyAmount = amount * CASH_PENALTY_RATE;
  const stampDuty = amount * STAMP_DUTY_RATE;

  return {
    penaltyApplicable: true,
    penaltyAmount,
    stampDuty,
    decision: 'requires_approval',
  };
}

describe('Moroccan Cash Payment Controls', () => {
  it('allows payment under 15,000 MAD monthly limit', () => {
    const result = computeCashPenalty(5000, 0);
    expect(result.penaltyApplicable).toBe(false);
    expect(result.decision).toBe('approved');
  });

  it('allows payment exactly at 15,000 MAD limit', () => {
    const result = computeCashPenalty(5000, 10000);
    expect(result.penaltyApplicable).toBe(false);
  });

  it('flags payment exceeding 15,000 MAD monthly', () => {
    const result = computeCashPenalty(5001, 10000);
    expect(result.penaltyApplicable).toBe(true);
    expect(result.decision).toBe('requires_approval');
  });

  it('computes 6% penalty on over-limit amount', () => {
    const result = computeCashPenalty(20000, 0);
    expect(result.penaltyAmount).toBe(1200); // 20000 * 0.06
  });

  it('computes 0.25% stamp duty', () => {
    const result = computeCashPenalty(20000, 0);
    expect(result.stampDuty).toBe(50); // 20000 * 0.0025
  });

  it('handles large amounts correctly', () => {
    const result = computeCashPenalty(100000, 50000);
    expect(result.penaltyApplicable).toBe(true);
    expect(result.penaltyAmount).toBe(6000);
    expect(result.stampDuty).toBe(250);
  });

  it('handles zero amount', () => {
    const result = computeCashPenalty(0, 14000);
    expect(result.penaltyApplicable).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════
// Agent Admin Monthly Expense Cap
// ═══════════════════════════════════════════════════════

const AGENT_ADMIN_MONTHLY_CAP = 15_000;

function canAgentAdminApproveExpense(amount: number, currentMonthlyTotal: number, role: string): { allowed: boolean; reason?: string } {
  if (role !== 'agent_administratif' && role !== 'frontdesk') {
    return { allowed: true }; // No cap for other roles
  }
  
  if (currentMonthlyTotal + amount > AGENT_ADMIN_MONTHLY_CAP) {
    return { allowed: false, reason: `Dépasse le plafond mensuel de ${AGENT_ADMIN_MONTHLY_CAP} MAD` };
  }
  
  return { allowed: true };
}

describe('Agent Admin Expense Cap', () => {
  it('allows expense within cap', () => {
    expect(canAgentAdminApproveExpense(5000, 8000, 'agent_administratif').allowed).toBe(true);
  });

  it('blocks expense exceeding cap', () => {
    const result = canAgentAdminApproveExpense(5000, 11000, 'agent_administratif');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('15000');
  });

  it('does not apply cap to CEO', () => {
    expect(canAgentAdminApproveExpense(100000, 50000, 'ceo').allowed).toBe(true);
  });

  it('applies cap to frontdesk role', () => {
    expect(canAgentAdminApproveExpense(16000, 0, 'frontdesk').allowed).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════
// Timezone — Off-Hours / Emergency Window (Casablanca)
// ═══════════════════════════════════════════════════════

function isOffHoursCasablanca(hour: number): boolean {
  // Emergency window: 18:00 - 06:00
  return hour >= 18 || hour < 6;
}

function validateEmergencyJustification(justification: string): { valid: boolean; error?: string } {
  if (!justification || justification.trim().length < 20) {
    return { valid: false, error: 'Justification must be at least 20 characters' };
  }
  return { valid: true };
}

describe('Off-Hours & Emergency Window', () => {
  it('18:00 is off-hours', () => {
    expect(isOffHoursCasablanca(18)).toBe(true);
  });

  it('23:00 is off-hours', () => {
    expect(isOffHoursCasablanca(23)).toBe(true);
  });

  it('05:00 is off-hours', () => {
    expect(isOffHoursCasablanca(5)).toBe(true);
  });

  it('06:00 is NOT off-hours', () => {
    expect(isOffHoursCasablanca(6)).toBe(false);
  });

  it('12:00 is NOT off-hours', () => {
    expect(isOffHoursCasablanca(12)).toBe(false);
  });

  it('17:00 is NOT off-hours', () => {
    expect(isOffHoursCasablanca(17)).toBe(false);
  });

  it('rejects short justification', () => {
    expect(validateEmergencyJustification('too short').valid).toBe(false);
  });

  it('accepts valid justification (20+ chars)', () => {
    expect(validateEmergencyJustification('Client urgent besoin livraison spéciale ce soir').valid).toBe(true);
  });

  it('rejects empty justification', () => {
    expect(validateEmergencyJustification('').valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════
// Credit Gate — Client Block Logic
// ═══════════════════════════════════════════════════════

function shouldBlockClient(encours: number, creditLimit: number, overdueInvoices: number): { blocked: boolean; reason?: string } {
  if (encours >= creditLimit) {
    return { blocked: true, reason: 'Encours dépasse la limite de crédit' };
  }
  if (overdueInvoices >= 3) {
    return { blocked: true, reason: `${overdueInvoices} factures impayées` };
  }
  return { blocked: false };
}

describe('Credit Gate Logic', () => {
  it('blocks when encours exceeds credit limit', () => {
    expect(shouldBlockClient(100000, 80000, 0).blocked).toBe(true);
  });

  it('blocks when 3+ overdue invoices', () => {
    expect(shouldBlockClient(50000, 100000, 3).blocked).toBe(true);
  });

  it('allows when within limits', () => {
    expect(shouldBlockClient(50000, 100000, 2).blocked).toBe(false);
  });

  it('blocks at exact credit limit', () => {
    expect(shouldBlockClient(100000, 100000, 0).blocked).toBe(true);
  });
});
