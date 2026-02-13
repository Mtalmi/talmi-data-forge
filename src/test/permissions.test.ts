import { describe, it, expect } from 'vitest';

/**
 * TBOS Permission Matrix Tests
 * 
 * Tests the role-based permission logic extracted from useAuth.tsx
 * to ensure the access control matrix is correctly enforced.
 */

// Role types matching useAuth
type AppRole = 'ceo' | 'supervisor' | 'resp_technique' | 'frontdesk' | 'directeur_operationnel' | 'centraliste';

// Permission calculator - mirrors useAuth logic exactly
function calculatePermissions(role: AppRole) {
  const isCeo = role === 'ceo';
  const isSupervisor = role === 'supervisor';
  const isRespTechnique = role === 'resp_technique';
  const isFrontDesk = role === 'frontdesk';
  const isDirecteurOperationnel = role === 'directeur_operationnel';
  const isCentraliste = role === 'centraliste';

  // Legacy mappings
  const isSuperviseur = isSupervisor;
  const isResponsableTechnique = isRespTechnique;
  const isDirecteurOperations = isDirecteurOperationnel;
  const isAgentAdministratif = isFrontDesk;

  return {
    canReadPrix: isCeo || isSuperviseur,
    canEditFormules: isCeo || isSuperviseur,
    canManageClients: isCeo || isSuperviseur || isAgentAdministratif,
    canEditClients: isCeo || isSuperviseur || isAgentAdministratif,
    canCreateBons: isCeo || isSuperviseur || isAgentAdministratif,
    canValidateTechnique: isCeo || isSuperviseur || isResponsableTechnique,
    canUpdateConsumption: isCeo || isSuperviseur || isCentraliste,
    canAssignTrucks: isCeo || isSuperviseur || isDirecteurOperations || isAgentAdministratif,
    canGenerateInvoice: isCeo || isSuperviseur || isAgentAdministratif,
    canEditPlanning: isCeo || isSuperviseur || isDirecteurOperations || isAgentAdministratif,
    canOverrideCreditBlock: isCeo || isSuperviseur || isAgentAdministratif,
    canApproveDerogations: isCeo || isSuperviseur,
    canRequestDerogations: isCeo || isSuperviseur || isDirecteurOperations || isAgentAdministratif,
    canApproveDevis: isCeo || isSuperviseur || isAgentAdministratif,
    canAccessAuditPortal: isCeo || isSuperviseur,
    canAddStockReception: isCeo || isSuperviseur || isResponsableTechnique,
    canAdjustStockManually: isCeo || isSuperviseur,
    canViewStockModule: !isCentraliste,
    canCreateBcDirect: isCeo || isSuperviseur || isAgentAdministratif,
    canValidateBcPrice: isCeo || isSuperviseur || isAgentAdministratif,
  };
}

describe('Permission Matrix - CEO (Max)', () => {
  const perms = calculatePermissions('ceo');

  it('has ALL permissions', () => {
    expect(perms.canReadPrix).toBe(true);
    expect(perms.canEditFormules).toBe(true);
    expect(perms.canManageClients).toBe(true);
    expect(perms.canApproveDerogations).toBe(true);
    expect(perms.canAccessAuditPortal).toBe(true);
    expect(perms.canAdjustStockManually).toBe(true);
    expect(perms.canCreateBcDirect).toBe(true);
    expect(perms.canGenerateInvoice).toBe(true);
    expect(perms.canValidateTechnique).toBe(true);
    expect(perms.canViewStockModule).toBe(true);
  });
});

describe('Permission Matrix - Supervisor (Karim)', () => {
  const perms = calculatePermissions('supervisor');

  it('mirrors CEO permissions', () => {
    expect(perms.canReadPrix).toBe(true);
    expect(perms.canEditFormules).toBe(true);
    expect(perms.canApproveDerogations).toBe(true);
    expect(perms.canAccessAuditPortal).toBe(true);
    expect(perms.canAdjustStockManually).toBe(true);
  });
});

describe('Permission Matrix - Resp Technique (Abdel Sadek)', () => {
  const perms = calculatePermissions('resp_technique');

  it('can validate technique and manage stock reception', () => {
    expect(perms.canValidateTechnique).toBe(true);
    expect(perms.canAddStockReception).toBe(true);
    expect(perms.canViewStockModule).toBe(true);
  });

  it('CANNOT access financial controls', () => {
    expect(perms.canReadPrix).toBe(false);
    expect(perms.canEditFormules).toBe(false);
    expect(perms.canApproveDerogations).toBe(false);
    expect(perms.canAccessAuditPortal).toBe(false);
    expect(perms.canAdjustStockManually).toBe(false);
    expect(perms.canGenerateInvoice).toBe(false);
    expect(perms.canCreateBcDirect).toBe(false);
  });
});

describe('Permission Matrix - FrontDesk (Agent Admin)', () => {
  const perms = calculatePermissions('frontdesk');

  it('can manage clients, bons, and invoices', () => {
    expect(perms.canManageClients).toBe(true);
    expect(perms.canCreateBons).toBe(true);
    expect(perms.canGenerateInvoice).toBe(true);
    expect(perms.canApproveDevis).toBe(true);
    expect(perms.canCreateBcDirect).toBe(true);
    expect(perms.canEditPlanning).toBe(true);
  });

  it('CANNOT access audit portal or adjust stock', () => {
    expect(perms.canReadPrix).toBe(false);
    expect(perms.canEditFormules).toBe(false);
    expect(perms.canAccessAuditPortal).toBe(false);
    expect(perms.canAdjustStockManually).toBe(false);
    expect(perms.canApproveDerogations).toBe(false);
  });
});

describe('Permission Matrix - Directeur Opérationnel (Imad)', () => {
  const perms = calculatePermissions('directeur_operationnel');

  it('can request derogations and assign trucks', () => {
    expect(perms.canRequestDerogations).toBe(true);
    expect(perms.canAssignTrucks).toBe(true);
    expect(perms.canEditPlanning).toBe(true);
  });

  it('CANNOT approve derogations or create BCs directly', () => {
    expect(perms.canApproveDerogations).toBe(false);
    expect(perms.canCreateBcDirect).toBe(false);
    expect(perms.canGenerateInvoice).toBe(false);
    expect(perms.canReadPrix).toBe(false);
    expect(perms.canEditFormules).toBe(false);
  });
});

describe('Permission Matrix - Centraliste', () => {
  const perms = calculatePermissions('centraliste');

  it('can update consumption', () => {
    expect(perms.canUpdateConsumption).toBe(true);
  });

  it('CANNOT view stock module (separation of powers)', () => {
    expect(perms.canViewStockModule).toBe(false);
  });

  it('CANNOT access any financial or admin controls', () => {
    expect(perms.canReadPrix).toBe(false);
    expect(perms.canCreateBons).toBe(false);
    expect(perms.canGenerateInvoice).toBe(false);
    expect(perms.canAccessAuditPortal).toBe(false);
    expect(perms.canAdjustStockManually).toBe(false);
    expect(perms.canCreateBcDirect).toBe(false);
  });
});
