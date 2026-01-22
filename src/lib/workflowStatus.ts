// Shared workflow status configuration for the entire ERP
// This ensures consistent status labels, colors, and badges across all modules:
// Planning, Production, Logistics, and Ventes (BC)

export type WorkflowStatus = 
  | 'en_attente_validation'
  | 'planification'
  | 'production'
  | 'en_chargement'
  | 'validation_technique'
  | 'en_livraison'
  | 'en_retour'
  | 'livre'
  | 'facture';

export interface StatusConfig {
  label: string;
  shortLabel: string;
  color: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}

// UNIFIED STATUS PALETTE (per user spec):
// - En Production/Chargement: ORANGE
// - En Livraison: PINK/ROSE
// - En Retour: LIGHT ORANGE (Amber)
// - Terminé/Livré: GREEN
export const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatus, StatusConfig> = {
  en_attente_validation: {
    label: 'À Confirmer',
    shortLabel: 'À Confirmer',
    color: 'bg-slate-500',
    bgLight: 'bg-slate-500/10',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-500/30',
    badgeVariant: 'outline',
  },
  planification: {
    label: 'Planifié',
    shortLabel: 'Planifié',
    color: 'bg-blue-500',
    bgLight: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500/30',
    badgeVariant: 'outline',
  },
  production: {
    label: 'En Production',
    shortLabel: 'Production',
    color: 'bg-orange-500',
    bgLight: 'bg-orange-500/10',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500/30',
    badgeVariant: 'secondary',
  },
  en_chargement: {
    label: 'En Chargement',
    shortLabel: 'Chargement',
    color: 'bg-orange-500',
    bgLight: 'bg-orange-500/10',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500/30',
    badgeVariant: 'secondary',
  },
  validation_technique: {
    label: 'Prêt Départ',
    shortLabel: 'Validé Tech',
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500/30',
    badgeVariant: 'secondary',
  },
  en_livraison: {
    label: 'En Livraison',
    shortLabel: 'En Route',
    color: 'bg-rose-500',
    bgLight: 'bg-rose-500/10',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-500/30',
    badgeVariant: 'default',
  },
  en_retour: {
    label: 'En Retour',
    shortLabel: 'Retour',
    color: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/30',
    badgeVariant: 'secondary',
  },
  livre: {
    label: 'Livré',
    shortLabel: 'Livré',
    color: 'bg-success',
    bgLight: 'bg-success/10',
    textColor: 'text-success',
    borderColor: 'border-success/30',
    badgeVariant: 'default',
  },
  facture: {
    label: 'Facturé',
    shortLabel: 'Facturé',
    color: 'bg-success',
    bgLight: 'bg-success/10',
    textColor: 'text-success',
    borderColor: 'border-success/30',
    badgeVariant: 'default',
  },
};

// Helper to derive status from rotation timestamps (for Logistics module)
export function deriveRotationStatus(
  workflowStatus: string,
  hasDepart: boolean,
  hasArrivee: boolean,
  hasRetour: boolean,
  debriefValide: boolean
): WorkflowStatus {
  // Completed rotation with debrief
  if (hasRetour && debriefValide) return 'facture'; // Use facture as "completed/validated"
  if (hasRetour) return 'livre';
  
  // Delivered but waiting for return
  if (workflowStatus === 'livre' || workflowStatus === 'facture') return 'en_retour';
  
  // En route to client
  if (hasDepart && hasArrivee) return 'en_livraison';
  if (hasDepart) return 'en_livraison';
  
  // Pre-departure statuses
  if (workflowStatus === 'en_livraison') return 'en_livraison';
  if (workflowStatus === 'en_chargement' || workflowStatus === 'chargement') return 'en_chargement';
  if (workflowStatus === 'validation_technique') return 'validation_technique';
  if (workflowStatus === 'production' || workflowStatus === 'a_produire') return 'production';
  if (workflowStatus === 'planification') return 'planification';
  
  return 'en_attente_validation';
}

export function getStatusConfig(status: string | null): StatusConfig {
  const key = status as WorkflowStatus;
  return WORKFLOW_STATUS_CONFIG[key] || {
    label: status || 'Inconnu',
    shortLabel: status || '?',
    color: 'bg-muted',
    bgLight: 'bg-muted/10',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted/30',
    badgeVariant: 'outline' as const,
  };
}

// Navigation helpers for cross-module linking
export function buildProductionUrl(blId: string, date?: Date): string {
  const params = new URLSearchParams();
  params.set('bl', blId);
  if (date) {
    params.set('date', formatDateISO(date));
  }
  return `/production?${params.toString()}`;
}

export function buildPlanningUrl(date?: Date | string, focus?: 'pending'): string {
  const params = new URLSearchParams();
  if (date) {
    const dateStr = typeof date === 'string' ? date : formatDateISO(date);
    params.set('date', dateStr);
  }
  if (focus) {
    params.set('focus', focus);
  }
  const query = params.toString();
  return query ? `/planning?${query}` : '/planning';
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
