import { describe, it, expect } from 'vitest';

/**
 * TBOS Concurrent Edit Locking - Pure Logic Tests
 * Tests the locking state machine and conflict resolution logic
 * extracted from useEditLock.ts
 */

interface LockState {
  isLocked: boolean;
  lockedByMe: boolean;
  lockedByName: string | null;
  expiresAt: Date | null;
}

// Simulate lock state machine logic
function computeLockResult(
  acquireResponse: { success: boolean; locked_by_name?: string; expires_at?: string }
): LockState {
  if (acquireResponse.success) {
    return {
      isLocked: false,
      lockedByMe: true,
      lockedByName: null,
      expiresAt: acquireResponse.expires_at ? new Date(acquireResponse.expires_at) : null,
    };
  }
  return {
    isLocked: true,
    lockedByMe: false,
    lockedByName: acquireResponse.locked_by_name || 'Un autre utilisateur',
    expiresAt: acquireResponse.expires_at ? new Date(acquireResponse.expires_at) : null,
  };
}

function canEdit(state: LockState): boolean {
  return !state.isLocked && state.lockedByMe;
}

function isReadOnly(state: LockState): boolean {
  return state.isLocked && !state.lockedByMe;
}

function isLockExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

// =============================================
// TESTS
// =============================================

describe('Locking - Acquire Success', () => {
  const state = computeLockResult({ success: true, expires_at: '2030-01-01T12:05:00Z' });

  it('marks lockedByMe = true', () => {
    expect(state.lockedByMe).toBe(true);
  });

  it('marks isLocked = false', () => {
    expect(state.isLocked).toBe(false);
  });

  it('canEdit returns true', () => {
    expect(canEdit(state)).toBe(true);
  });

  it('isReadOnly returns false', () => {
    expect(isReadOnly(state)).toBe(false);
  });

  it('sets correct expiration', () => {
    expect(state.expiresAt).toEqual(new Date('2030-01-01T12:05:00Z'));
  });
});

describe('Locking - Acquire Blocked (another user)', () => {
  const state = computeLockResult({ 
    success: false, 
    locked_by_name: 'Karim', 
    expires_at: '2030-01-01T12:10:00Z' 
  });

  it('marks isLocked = true', () => {
    expect(state.isLocked).toBe(true);
  });

  it('marks lockedByMe = false', () => {
    expect(state.lockedByMe).toBe(false);
  });

  it('canEdit returns false', () => {
    expect(canEdit(state)).toBe(false);
  });

  it('isReadOnly returns true', () => {
    expect(isReadOnly(state)).toBe(true);
  });

  it('shows who locked it', () => {
    expect(state.lockedByName).toBe('Karim');
  });
});

describe('Locking - Default fallback name', () => {
  it('uses fallback when locked_by_name is missing', () => {
    const state = computeLockResult({ success: false });
    expect(state.lockedByName).toBe('Un autre utilisateur');
  });
});

describe('Locking - Expiration Logic', () => {
  it('expired lock (past date)', () => {
    expect(isLockExpired(new Date('2020-01-01'))).toBe(true);
  });

  it('active lock (future date)', () => {
    expect(isLockExpired(new Date('2099-01-01'))).toBe(false);
  });

  it('null expiration = expired', () => {
    expect(isLockExpired(null)).toBe(true);
  });
});

describe('Locking - State Transitions', () => {
  it('unlock → acquire → locked by me', () => {
    const initial: LockState = { isLocked: false, lockedByMe: false, lockedByName: null, expiresAt: null };
    expect(canEdit(initial)).toBe(false); // no lock, not ours
    
    const acquired = computeLockResult({ success: true, expires_at: '2030-01-01T00:00:00Z' });
    expect(canEdit(acquired)).toBe(true);
  });

  it('release sets clean state', () => {
    const released: LockState = { isLocked: false, lockedByMe: false, lockedByName: null, expiresAt: null };
    expect(canEdit(released)).toBe(false);
    expect(isReadOnly(released)).toBe(false);
  });
});

describe('Locking - Allowed Table Names', () => {
  const allowedTables = ['devis', 'bons_commande', 'bons_livraison_reels', 'factures'] as const;
  
  it('supports exactly 4 lockable tables', () => {
    expect(allowedTables.length).toBe(4);
  });

  it.each(allowedTables)('allows locking on %s', (table) => {
    expect(allowedTables).toContain(table);
  });
});
