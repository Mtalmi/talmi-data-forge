import { describe, it, expect, vi } from 'vitest';

/**
 * TBOS Smoke Tests - Critical Pages Render Without Crashing
 * 
 * These are lightweight sanity checks that ensure key page modules
 * can be imported and their core logic doesn't throw at parse time.
 * Full render tests are avoided due to heavy Supabase/Auth dependencies.
 */

// Mock Supabase client globally
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ data: [], error: null }), insert: () => ({ data: null, error: null }) }),
    auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), unsubscribe: () => {} }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

// Mock useAuth to avoid auth dependency
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null, role: null, loading: false, isCeo: false, isSuperviseur: false,
    isAgentAdministratif: false, isResponsableTechnique: false, isDirecteurOperations: false,
    isCentraliste: false, canReadPrix: false, canEditFormules: false,
    signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Smoke - Core Modules Import', () => {
  it('security.ts exports all functions', async () => {
    const mod = await import('@/lib/security');
    expect(mod.sanitizeHtml).toBeDefined();
    expect(mod.sanitizeSqlInput).toBeDefined();
    expect(mod.sanitizeInput).toBeDefined();
    expect(mod.sanitizeReason).toBeDefined();
    expect(mod.sanitizeClientName).toBeDefined();
    expect(mod.rollbackReasonSchema).toBeDefined();
    expect(mod.clientNameSchema).toBeDefined();
    expect(mod.safeTextSchema).toBeDefined();
    expect(mod.SESSION_CONFIG).toBeDefined();
    expect(mod.isSecureConnection).toBeDefined();
    expect(mod.enforceHttps).toBeDefined();
  });

  it('errorSentry.ts exports singleton and helpers', async () => {
    const mod = await import('@/lib/errorSentry');
    expect(mod.errorSentry).toBeDefined();
    expect(mod.captureError).toBeDefined();
    expect(mod.captureDbError).toBeDefined();
    expect(mod.captureApiError).toBeDefined();
    expect(mod.initializeErrorSentry).toBeDefined();
  });

  it('webVitals.ts exports initWebVitals', async () => {
    const mod = await import('@/lib/webVitals');
    expect(mod.initWebVitals).toBeDefined();
  });
});

describe('Smoke - Security Constants', () => {
  it('SESSION_CONFIG has correct timeout values', async () => {
    const { SESSION_CONFIG } = await import('@/lib/security');
    expect(SESSION_CONFIG.INACTIVITY_TIMEOUT_MS).toBe(2 * 60 * 60 * 1000); // 2 hours
    expect(SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MS).toBe(5 * 60 * 1000); // 5 min
    expect(SESSION_CONFIG.CHECK_INTERVAL_MS).toBe(60 * 1000); // 1 min
  });
});

describe('Smoke - Page Modules Can Be Imported', () => {
  // These tests verify that page files parse correctly and export a default component
  // They do NOT render the component (which would require full provider tree)

  it('Auth page exports default', async () => {
    const mod = await import('@/pages/Auth');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('Landing page exports default', async () => {
    const mod = await import('@/pages/Landing');
    expect(mod.default).toBeDefined();
  });

  it('Dashboard (Index) page exports default', async () => {
    const mod = await import('@/pages/Index');
    expect(mod.default).toBeDefined();
  });
});

describe('Smoke - Utility Function Correctness', () => {
  it('sanitizeHtml idempotent on clean input', async () => {
    const { sanitizeHtml } = await import('@/lib/security');
    const clean = 'Livraison confirmée';
    expect(sanitizeHtml(clean)).toBe('Livraison confirmée');
  });

  it('isSecureConnection works in jsdom (localhost)', async () => {
    const { isSecureConnection } = await import('@/lib/security');
    // jsdom defaults to localhost
    expect(isSecureConnection()).toBe(true);
  });
});
