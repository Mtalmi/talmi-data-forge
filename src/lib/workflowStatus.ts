// Shared workflow status configuration for Planning and Production sync
// This ensures consistent status labels, colors, and badges across modules

export type WorkflowStatus = 
  | 'en_attente_validation'
  | 'planification'
  | 'production'
  | 'validation_technique'
  | 'en_livraison'
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

export const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatus, StatusConfig> = {
  en_attente_validation: {
    label: 'À Confirmer',
    shortLabel: 'À Confirmer',
    color: 'bg-muted',
    bgLight: 'bg-muted/50',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted-foreground/30',
    badgeVariant: 'outline',
  },
  planification: {
    label: 'À Démarrer',
    shortLabel: 'Prêt',
    color: 'bg-blue-500',
    bgLight: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    badgeVariant: 'outline',
  },
  production: {
    label: 'En Chargement',
    shortLabel: 'Chargement',
    color: 'bg-violet-500',
    bgLight: 'bg-violet-500/10',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-500/30',
    badgeVariant: 'secondary',
  },
  validation_technique: {
    label: 'Validation Tech',
    shortLabel: 'À Valider',
    color: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/30',
    badgeVariant: 'secondary',
  },
  en_livraison: {
    label: 'En Route',
    shortLabel: 'En Route',
    color: 'bg-rose-500',
    bgLight: 'bg-rose-500/10',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-500',
    badgeVariant: 'default',
  },
  livre: {
    label: 'Livré',
    shortLabel: 'Livré',
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    badgeVariant: 'default',
  },
  facture: {
    label: 'Facturé',
    shortLabel: 'Facturé',
    color: 'bg-emerald-600',
    bgLight: 'bg-emerald-600/10',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-600',
    badgeVariant: 'default',
  },
};

export function getStatusConfig(status: string | null): StatusConfig {
  const key = status as WorkflowStatus;
  return WORKFLOW_STATUS_CONFIG[key] || {
    label: status || 'Inconnu',
    shortLabel: status || 'Inconnu',
    color: 'bg-muted',
    bgLight: 'bg-muted/50',
    textColor: 'text-muted-foreground',
    borderColor: 'border-muted-foreground/30',
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
