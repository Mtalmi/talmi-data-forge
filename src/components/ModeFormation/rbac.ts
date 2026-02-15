// Mode Formation RBAC - Role-Based Access Control System
// Maps existing TBOS roles to simulation access

import { SimulationType, SimulationTier } from './types';

// ============================================================================
// ROLE MAPPING: Map existing TBOS roles to simulation-friendly names
// ============================================================================

export type AppRole = 
  | 'ceo' 
  | 'superviseur' 
  | 'operator'              // Warehouse Staff
  | 'commercial'            // Sales Team
  | 'directeur_operations'  // Operations Manager
  | 'responsable_technique' // Quality Manager
  | 'accounting'            // Finance Director (also handles Fleet)
  | 'centraliste'           // Production Manager
  | 'agent_administratif'   // Compliance Officer
  | 'auditeur';             // Auditor (treated as CFO-level for training)

// Role display names in French
export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  ceo: 'PDG',
  superviseur: 'Superviseur',
  operator: 'Magasinier',
  commercial: 'Commercial',
  directeur_operations: 'Directeur Opérations',
  responsable_technique: 'Responsable Qualité',
  accounting: 'Directeur Financier',
  centraliste: 'Chef de Production',
  agent_administratif: 'Responsable Conformité',
  auditeur: 'Auditeur',
};

// ============================================================================
// SIMULATION ACCESS MATRIX
// Defines which roles can access which simulations
// ============================================================================

// Simulation IDs mapped to types
export const SIMULATION_TYPE_IDS: Record<SimulationType, number> = {
  // Tier 1 - Core (1-6)
  stock_reception: 1,
  expense_entry: 2,
  midnight_protocol: 3,
  create_quote: 4,
  validate_delivery: 5,
  budget_management: 6,
  // Tier 2 - Advanced (7-11)
  quality_control: 7,
  fleet_predator: 8,
  production_management: 9,
  audit_compliance: 10,
  ai_receipt_verification: 11,
  // Tier 3 - Executive (12-15)
  ceo_override: 12,
  forensic_analysis: 13,
  financial_reporting: 14,
  client_management: 15,
};

// Reverse mapping
export const ID_TO_SIMULATION_TYPE: Record<number, SimulationType> = Object.fromEntries(
  Object.entries(SIMULATION_TYPE_IDS).map(([k, v]) => [v, k])
) as Record<number, SimulationType>;

// Access matrix: which roles can access which simulations
export const SIMULATION_ACCESS: Record<AppRole, number[]> = {
  // Tier 1 only
  operator: [1, 2, 3, 4, 5, 6],
  
  // Tier 1 + Client Management
  commercial: [1, 2, 3, 4, 5, 6, 14],
  
  // Tier 1 + Quality Control only
  responsable_technique: [1, 2, 3, 4, 5, 6, 7],
  
  // Tier 1 + Production Management only
  centraliste: [1, 2, 3, 4, 5, 6, 9],
  
  // Tier 1 + All Tier 2
  directeur_operations: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  
  // Tier 1 + Audit & Compliance + Forensic Analysis
  agent_administratif: [1, 2, 3, 4, 5, 6, 10, 12],
  
  // Tier 1 + Tier 2 (all) + Financial Reporting + Client Management
  accounting: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14],
  
  // Full access (all except CEO Override)
  auditeur: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14],
  
  // Full access
  superviseur: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  ceo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
};

// ============================================================================
// MANDATORY CERTIFICATIONS
// Simulations that must be completed for each role
// ============================================================================

export const MANDATORY_CERTIFICATIONS: Record<AppRole, number[]> = {
  operator: [1, 2, 3, 4, 5, 6],                    // All Tier 1
  commercial: [1, 2, 3, 4, 5, 6],                  // Tier 1
  directeur_operations: [1, 2, 3, 4, 5, 6],       // Tier 1
  responsable_technique: [1, 2, 3, 4, 5, 6, 7],   // Tier 1 + Quality Control
  centraliste: [1, 2, 3, 4, 5, 6, 9],             // Tier 1 + Production
  accounting: [1, 2, 3, 4, 5, 6],                  // Tier 1
  agent_administratif: [1, 2, 3, 4, 5, 6, 10, 12], // Tier 1 + Audit + Forensic
  auditeur: [1, 2, 3, 4, 5, 6],                    // Tier 1
  superviseur: [1, 2, 3, 4, 5, 6],                 // Tier 1
  ceo: [1, 2, 3, 4, 5, 6],                         // Tier 1
};

// ============================================================================
// TIER PREREQUISITES
// Tiers that must be completed before accessing higher tiers
// ============================================================================

export const TIER_SIMULATIONS: Record<SimulationTier, number[]> = {
  core: [1, 2, 3, 4, 5, 6],
  advanced: [7, 8, 9, 10],
  executive: [11, 12, 13, 14, 15],
};

export const TIER_PREREQUISITES: Record<SimulationTier, SimulationTier[]> = {
  core: [],
  advanced: ['core'],
  executive: ['core', 'advanced'],
};

// ============================================================================
// ACCESS CONTROL FUNCTIONS
// ============================================================================

/**
 * Check if a user can access a specific simulation
 */
export function canAccessSimulation(
  userRole: AppRole | null,
  simulationType: SimulationType
): boolean {
  if (!userRole) return false;
  
  const simulationId = SIMULATION_TYPE_IDS[simulationType];
  const allowedSimulations = SIMULATION_ACCESS[userRole];
  
  return allowedSimulations.includes(simulationId);
}

/**
 * Check if a simulation is mandatory for a specific role
 */
export function isMandatoryCertification(
  userRole: AppRole | null,
  simulationType: SimulationType
): boolean {
  if (!userRole) return false;
  
  const simulationId = SIMULATION_TYPE_IDS[simulationType];
  const mandatory = MANDATORY_CERTIFICATIONS[userRole];
  
  return mandatory.includes(simulationId);
}

/**
 * Get all accessible simulations for a role
 */
export function getAccessibleSimulations(userRole: AppRole | null): SimulationType[] {
  if (!userRole) return [];
  
  const allowedIds = SIMULATION_ACCESS[userRole];
  return allowedIds.map(id => ID_TO_SIMULATION_TYPE[id]);
}

/**
 * Get all mandatory simulations for a role
 */
export function getMandatorySimulations(userRole: AppRole | null): SimulationType[] {
  if (!userRole) return [];
  
  const mandatoryIds = MANDATORY_CERTIFICATIONS[userRole];
  return mandatoryIds.map(id => ID_TO_SIMULATION_TYPE[id]);
}

/**
 * Check if user has completed all mandatory certifications
 */
export function hasCompletedMandatoryCertifications(
  userRole: AppRole | null,
  completedSimulations: SimulationType[]
): boolean {
  if (!userRole) return false;
  
  const mandatoryIds = MANDATORY_CERTIFICATIONS[userRole];
  const completedIds = completedSimulations.map(s => SIMULATION_TYPE_IDS[s]);
  
  return mandatoryIds.every(id => completedIds.includes(id));
}

/**
 * Get certification progress percentage
 */
export function getCertificationProgress(
  userRole: AppRole | null,
  completedSimulations: SimulationType[]
): { completed: number; total: number; percentage: number } {
  if (!userRole) return { completed: 0, total: 0, percentage: 0 };
  
  const mandatoryIds = MANDATORY_CERTIFICATIONS[userRole];
  const completedIds = completedSimulations.map(s => SIMULATION_TYPE_IDS[s]);
  
  const completed = mandatoryIds.filter(id => completedIds.includes(id)).length;
  const total = mandatoryIds.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

/**
 * Get certification status
 */
export type CertificationStatus = 'NOT_CERTIFIED' | 'PARTIALLY_CERTIFIED' | 'FULLY_CERTIFIED';

export function getCertificationStatus(
  userRole: AppRole | null,
  completedSimulations: SimulationType[]
): CertificationStatus {
  const { completed, total } = getCertificationProgress(userRole, completedSimulations);
  
  if (completed === 0) return 'NOT_CERTIFIED';
  if (completed < total) return 'PARTIALLY_CERTIFIED';
  return 'FULLY_CERTIFIED';
}

/**
 * Check if tier is accessible based on prerequisites
 */
export function canAccessTier(
  tier: SimulationTier,
  completedSimulations: SimulationType[]
): boolean {
  const prerequisites = TIER_PREREQUISITES[tier];
  if (prerequisites.length === 0) return true;
  
  const completedIds = completedSimulations.map(s => SIMULATION_TYPE_IDS[s]);
  
  return prerequisites.every(prereqTier => {
    const prereqSimIds = TIER_SIMULATIONS[prereqTier];
    return prereqSimIds.every(id => completedIds.includes(id));
  });
}

/**
 * Get the required role for a simulation (minimum role that has access)
 */
export function getRequiredRoleForSimulation(simulationType: SimulationType): AppRole[] {
  const simulationId = SIMULATION_TYPE_IDS[simulationType];
  
  return (Object.entries(SIMULATION_ACCESS) as [AppRole, number[]][])
    .filter(([_, allowed]) => allowed.includes(simulationId))
    .map(([role]) => role);
}

/**
 * Get reason why access is denied
 */
export function getAccessDenialReason(
  userRole: AppRole | null,
  simulationType: SimulationType
): string {
  if (!userRole) {
    return 'Vous devez être connecté pour accéder aux simulations.';
  }
  
  const simulationId = SIMULATION_TYPE_IDS[simulationType];
  const allowedRoles = getRequiredRoleForSimulation(simulationType);
  
  if (allowedRoles.length === 0) {
    return 'Cette simulation n\'est pas encore disponible.';
  }
  
  // Check if it's a CEO-only simulation
  if (simulationId === 11) {
    return 'Cette simulation est réservée au PDG uniquement.';
  }
  
  // Check tier
  const tier = getTierForSimulation(simulationType);
  if (tier === 'executive') {
    return 'Cette simulation est réservée à la direction (PDG, DAF, Superviseur).';
  }
  if (tier === 'advanced') {
    return 'Cette simulation est réservée aux responsables de département et à la direction.';
  }
  
  return `Votre rôle (${ROLE_DISPLAY_NAMES[userRole]}) n'a pas accès à cette simulation.`;
}

/**
 * Get tier for a simulation
 */
export function getTierForSimulation(simulationType: SimulationType): SimulationTier {
  const simulationId = SIMULATION_TYPE_IDS[simulationType];
  
  if (TIER_SIMULATIONS.core.includes(simulationId)) return 'core';
  if (TIER_SIMULATIONS.advanced.includes(simulationId)) return 'advanced';
  return 'executive';
}
