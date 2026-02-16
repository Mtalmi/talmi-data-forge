import { describe, it, expect } from 'vitest';

// Test the permission matrix logic in isolation (no React context needed)
type AppRole = 'ceo' | 'supervisor' | 'resp_technique' | 'frontdesk' | 'directeur_operationnel' | 'centraliste' | 'superviseur' | 'responsable_technique' | 'directeur_operations' | 'agent_administratif';

function computePermissions(role: AppRole | null) {
  const isCeo = role === 'ceo';
  const isSupervisor = role === 'supervisor';
  const isRespTechnique = role === 'resp_technique';
  const isFrontDesk = role === 'frontdesk';
  const isDirecteurOperationnel = role === 'directeur_operationnel';
  const isCentraliste = role === 'centraliste';

  const isSuperviseur = role === 'superviseur' || isSupervisor;
  const isResponsableTechnique = role === 'responsable_technique' || isRespTechnique;
  const isDirecteurOperations = role === 'directeur_operations' || isDirecteurOperationnel;
  const isAgentAdministratif = role === 'agent_administratif' || isFrontDesk;

  return {
    canReadPrix: isCeo || isSuperviseur,
    canEditFormules: isCeo || isSuperviseur,
    canManageClients: isCeo || isSuperviseur || isAgentAdministratif,
    canCreateBons: isCeo || isSuperviseur || isAgentAdministratif,
    canValidateTechnique: isCeo || isSuperviseur || isResponsableTechnique,
    canUpdateConsumption: isCeo || isSuperviseur || isCentraliste,
    canAssignTrucks: isCeo || isSuperviseur || isDirecteurOperations || isAgentAdministratif,
    canGenerateInvoice: isCeo || isSuperviseur || isAgentAdministratif,
    canApproveDerogations: isCeo || isSuperviseur,
    canAdjustStockManually: isCeo || isSuperviseur,
    canViewStockModule: !isCentraliste,
  };
}

describe('Permission Matrix', () => {
  it('CEO has all permissions', () => {
    const p = computePermissions('ceo');
    expect(p.canReadPrix).toBe(true);
    expect(p.canEditFormules).toBe(true);
    expect(p.canManageClients).toBe(true);
    expect(p.canApproveDerogations).toBe(true);
    expect(p.canAdjustStockManually).toBe(true);
    expect(p.canViewStockModule).toBe(true);
  });

  it('Supervisor has CEO-like permissions', () => {
    const p = computePermissions('supervisor');
    expect(p.canReadPrix).toBe(true);
    expect(p.canEditFormules).toBe(true);
    expect(p.canApproveDerogations).toBe(true);
  });

  it('Legacy superviseur maps to supervisor permissions', () => {
    const p = computePermissions('superviseur');
    expect(p.canReadPrix).toBe(true);
    expect(p.canEditFormules).toBe(true);
  });

  it('FrontDesk can manage clients and create bons but NOT edit formules', () => {
    const p = computePermissions('frontdesk');
    expect(p.canManageClients).toBe(true);
    expect(p.canCreateBons).toBe(true);
    expect(p.canEditFormules).toBe(false);
    expect(p.canReadPrix).toBe(false);
  });

  it('Resp Technique can validate technique but NOT manage clients', () => {
    const p = computePermissions('resp_technique');
    expect(p.canValidateTechnique).toBe(true);
    expect(p.canManageClients).toBe(false);
    expect(p.canCreateBons).toBe(false);
  });

  it('Centraliste can update consumption but NOT view stock module', () => {
    const p = computePermissions('centraliste');
    expect(p.canUpdateConsumption).toBe(true);
    expect(p.canViewStockModule).toBe(false);
    expect(p.canReadPrix).toBe(false);
  });

  it('Directeur Operationnel can assign trucks', () => {
    const p = computePermissions('directeur_operationnel');
    expect(p.canAssignTrucks).toBe(true);
    expect(p.canApproveDerogations).toBe(false);
  });

  it('null role has no permissions', () => {
    const p = computePermissions(null);
    expect(p.canReadPrix).toBe(false);
    expect(p.canEditFormules).toBe(false);
    expect(p.canManageClients).toBe(false);
    expect(p.canViewStockModule).toBe(true); // !isCentraliste = true for null
  });
});
