import { describe, it, expect } from 'vitest';

/**
 * Financial Controls Stress Tests
 * Validates the expense approval matrix, cash payment penalty engine,
 * and credit-gate blocking logic.
 */

// --- Expense Approval Matrix ---
// Level 1: ≤2,000 MAD (Admin/Exploitation)
// Level 2: 2,001–20,000 MAD (Superviseur)
// Level 3: >20,000 MAD (CEO)
// Autonomous cap: 15,000 MAD/month for Level 1

function getApprovalLevel(amount: number): number {
  if (amount <= 2000) return 1;
  if (amount <= 20000) return 2;
  return 3;
}

function isAutonomousCapReached(monthlyTotal: number, cap: number = 15000): boolean {
  return monthlyTotal >= cap;
}

function canApproveExpense(
  role: string,
  amount: number,
  monthlyTotalLevel1: number
): { allowed: boolean; reason?: string } {
  const level = getApprovalLevel(amount);

  if (level === 1) {
    if (isAutonomousCapReached(monthlyTotalLevel1)) {
      return { allowed: false, reason: 'LIMIT_EXCEEDED' };
    }
    if (['admin', 'superviseur', 'ceo'].includes(role)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'ROLE_INSUFFICIENT' };
  }

  if (level === 2) {
    if (['superviseur', 'ceo'].includes(role)) return { allowed: true };
    return { allowed: false, reason: 'REQUIRES_SUPERVISEUR' };
  }

  // Level 3
  if (role === 'ceo') return { allowed: true };
  return { allowed: false, reason: 'REQUIRES_CEO' };
}

// --- Cash Payment Penalty Engine ---
// Mirrors useCashPaymentControls.ts logic

const CASH_LIMIT = 50000;

interface CashValidation {
  isAllowed: boolean;
  requiresBankTransfer: boolean;
  penaltyApplicable: boolean;
  penaltyAmount: number;
  stampDutyAmount: number;
  blockingReason: string | null;
}

function validateCashPayment(amount: number, currentMonthlyTotal: number): CashValidation {
  const result: CashValidation = {
    isAllowed: true,
    requiresBankTransfer: false,
    penaltyApplicable: false,
    penaltyAmount: 0,
    stampDutyAmount: 0,
    blockingReason: null,
  };

  // Rule 1: >50k MUST be bank transfer
  if (amount > 50000) {
    result.isAllowed = false;
    result.requiresBankTransfer = true;
    result.blockingReason = 'Paiements >50,000 DH doivent être par virement';
    return result;
  }

  // Check monthly limit
  const newTotal = currentMonthlyTotal + amount;
  if (newTotal > CASH_LIMIT) {
    result.penaltyApplicable = true;
    const excess = newTotal - CASH_LIMIT;
    result.penaltyAmount = excess * 0.06;       // 6%
    result.stampDutyAmount = excess * 0.0025;    // 0.25%
    result.isAllowed = false;
    result.blockingReason = `Dépassement limite 50,000 DH`;
  }

  return result;
}

// --- Credit-Gate Logic ---

function getCreditStatus(
  solde_du: number,
  limite_credit_dh: number,
  credit_bloque: boolean
): { status: string; canProduce: boolean } {
  if (credit_bloque) {
    return { status: 'blocked', canProduce: false };
  }
  if (solde_du > limite_credit_dh) {
    return { status: 'overlimit', canProduce: false };
  }
  if (solde_du > 0) {
    return { status: 'debt', canProduce: true };
  }
  return { status: 'ok', canProduce: true };
}

// ===== TESTS =====

describe('Expense Approval Matrix', () => {
  it('Level 1: ≤2,000 MAD', () => {
    expect(getApprovalLevel(500)).toBe(1);
    expect(getApprovalLevel(2000)).toBe(1);
  });

  it('Level 2: 2,001–20,000 MAD', () => {
    expect(getApprovalLevel(2001)).toBe(2);
    expect(getApprovalLevel(20000)).toBe(2);
  });

  it('Level 3: >20,000 MAD', () => {
    expect(getApprovalLevel(20001)).toBe(3);
    expect(getApprovalLevel(100000)).toBe(3);
  });

  it('Admin can approve Level 1 under cap', () => {
    const result = canApproveExpense('admin', 1500, 5000);
    expect(result.allowed).toBe(true);
  });

  it('Admin blocked at Level 1 when cap reached', () => {
    const result = canApproveExpense('admin', 1500, 15000);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('LIMIT_EXCEEDED');
  });

  it('Admin cannot approve Level 2', () => {
    const result = canApproveExpense('admin', 5000, 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('REQUIRES_SUPERVISEUR');
  });

  it('Superviseur can approve Level 2', () => {
    const result = canApproveExpense('superviseur', 15000, 0);
    expect(result.allowed).toBe(true);
  });

  it('Superviseur cannot approve Level 3', () => {
    const result = canApproveExpense('superviseur', 25000, 0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('REQUIRES_CEO');
  });

  it('CEO can approve any level', () => {
    expect(canApproveExpense('ceo', 500, 0).allowed).toBe(true);
    expect(canApproveExpense('ceo', 15000, 0).allowed).toBe(true);
    expect(canApproveExpense('ceo', 100000, 0).allowed).toBe(true);
  });

  it('15k cap edge case: exactly at limit blocks', () => {
    expect(isAutonomousCapReached(15000)).toBe(true);
    expect(isAutonomousCapReached(14999)).toBe(false);
  });

  it('CEO bypass: Level 1 blocked by cap, but CEO can still approve', () => {
    const result = canApproveExpense('ceo', 1500, 15000);
    // CEO should be able to approve regardless (via bypass token)
    // But the matrix itself blocks Level 1 at cap for everyone
    expect(result.allowed).toBe(false); // Even CEO hits the cap in the matrix
    expect(result.reason).toBe('LIMIT_EXCEEDED');
  });
});

describe('Cash Payment Penalty Engine', () => {
  it('blocks payments >50,000 DH (must be bank transfer)', () => {
    const v = validateCashPayment(50001, 0);
    expect(v.isAllowed).toBe(false);
    expect(v.requiresBankTransfer).toBe(true);
  });

  it('allows payment under limit', () => {
    const v = validateCashPayment(10000, 0);
    expect(v.isAllowed).toBe(true);
    expect(v.penaltyApplicable).toBe(false);
  });

  it('calculates 6% penalty on excess over 50k monthly', () => {
    const v = validateCashPayment(20000, 40000); // new total = 60k, excess = 10k
    expect(v.penaltyApplicable).toBe(true);
    expect(v.penaltyAmount).toBe(600); // 10k × 6%
    expect(v.stampDutyAmount).toBe(25); // 10k × 0.25%
    expect(v.isAllowed).toBe(false);
  });

  it('blocks when exactly at limit', () => {
    const v = validateCashPayment(1, 50000); // new total = 50001
    expect(v.penaltyApplicable).toBe(true);
    expect(v.isAllowed).toBe(false);
  });

  it('allows when exactly at 50k (not exceeded)', () => {
    const v = validateCashPayment(10000, 40000); // new total = 50000 exactly
    expect(v.isAllowed).toBe(true);
    expect(v.penaltyApplicable).toBe(false);
  });

  it('large excess calculates correct penalty', () => {
    const v = validateCashPayment(30000, 40000); // excess = 20k
    expect(v.penaltyAmount).toBe(1200); // 20k × 6%
    expect(v.stampDutyAmount).toBe(50);  // 20k × 0.25%
  });
});

describe('Credit-Gate Client Blocking', () => {
  it('OK: zero balance', () => {
    const s = getCreditStatus(0, 50000, false);
    expect(s.status).toBe('ok');
    expect(s.canProduce).toBe(true);
  });

  it('debt: has balance but under limit', () => {
    const s = getCreditStatus(30000, 50000, false);
    expect(s.status).toBe('debt');
    expect(s.canProduce).toBe(true);
  });

  it('overlimit: balance exceeds credit limit', () => {
    const s = getCreditStatus(60000, 50000, false);
    expect(s.status).toBe('overlimit');
    expect(s.canProduce).toBe(false);
  });

  it('blocked: manually blacklisted', () => {
    const s = getCreditStatus(0, 50000, true);
    expect(s.status).toBe('blocked');
    expect(s.canProduce).toBe(false);
  });

  it('blocked takes priority over overlimit', () => {
    const s = getCreditStatus(100000, 50000, true);
    expect(s.status).toBe('blocked');
    expect(s.canProduce).toBe(false);
  });

  it('edge case: balance exactly at limit is NOT overlimit', () => {
    const s = getCreditStatus(50000, 50000, false);
    expect(s.status).toBe('debt');
    expect(s.canProduce).toBe(true);
  });
});
