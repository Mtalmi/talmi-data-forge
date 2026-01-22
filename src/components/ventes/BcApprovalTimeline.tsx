import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Clock, User, Shield, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BonCommande } from '@/hooks/useSalesWorkflow';

interface BcApprovalTimelineProps {
  bc: BonCommande;
  compact?: boolean;
}

interface TimelineStep {
  label: string;
  timestamp: string | null;
  actor: string | null;
  role: string | null;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  isEmergency?: boolean;
}

export function BcApprovalTimeline({ bc, compact = false }: BcApprovalTimelineProps) {
  const isEmergencyBc = bc.notes?.includes('[URGENCE/EMERGENCY');
  
  const getSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    
    // Step 1: Creation
    steps.push({
      label: 'Créé',
      timestamp: bc.created_at,
      actor: bc.created_by ? 'Utilisateur' : null,
      role: null,
      icon: <Clock className="h-3 w-3" />,
      status: 'completed',
      isEmergency: isEmergencyBc,
    });
    
    // Step 2: Validation (if applicable)
    if (bc.statut === 'en_attente_validation') {
      steps.push({
        label: 'En attente validation',
        timestamp: null,
        actor: null,
        role: 'Agent Admin',
        icon: <Clock className="h-3 w-3" />,
        status: 'current',
      });
    } else if (bc.validated_at || bc.statut !== 'brouillon') {
      // Access properties safely with type assertion since they may exist in extended types
      const validatedByName = (bc as any).validated_by_name || null;
      const validatedByRole = (bc as any).validated_by_role || null;
      
      steps.push({
        label: isEmergencyBc ? 'Bypass Urgence' : 'Validé',
        timestamp: bc.validated_at || null,
        actor: validatedByName,
        role: validatedByRole,
        icon: isEmergencyBc ? <Zap className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />,
        status: 'completed',
        isEmergency: isEmergencyBc,
      });
    }
    
    // Step 3: Production Status
    if (bc.statut === 'en_production' || bc.statut === 'en_livraison' || bc.statut === 'termine' || bc.statut === 'livre' || bc.statut === 'facture') {
      steps.push({
        label: 'Production',
        timestamp: null,
        actor: null,
        role: 'Centraliste',
        icon: <CheckCircle className="h-3 w-3" />,
        status: 'completed',
      });
    } else if (bc.statut === 'pret_production') {
      steps.push({
        label: 'Prêt Production',
        timestamp: null,
        actor: null,
        role: null,
        icon: <Clock className="h-3 w-3" />,
        status: 'current',
      });
    }
    
    return steps;
  };

  const steps = getSteps();
  
  if (compact) {
    // Compact inline view
    return (
      <div className="flex items-center gap-1 text-xs">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {idx > 0 && <span className="text-muted-foreground">→</span>}
            <span className={cn(
              "flex items-center gap-0.5",
              step.status === 'completed' && "text-success",
              step.status === 'current' && "text-warning",
              step.status === 'pending' && "text-muted-foreground",
              step.isEmergency && "text-amber-500"
            )}>
              {step.icon}
              {step.actor && (
                <span className="font-medium">{step.actor}</span>
              )}
              {step.timestamp && (
                <span className="text-muted-foreground">
                  ({format(parseISO(step.timestamp), 'HH:mm', { locale: fr })})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Full vertical timeline
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Timeline d'Approbation
      </p>
      <div className="relative pl-4 border-l-2 border-muted space-y-3">
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            className={cn(
              "relative",
              step.isEmergency && "bg-amber-500/5 -ml-4 pl-4 py-1 rounded-r"
            )}
          >
            {/* Timeline dot */}
            <div className={cn(
              "absolute -left-[21px] p-1 rounded-full border-2 bg-background",
              step.status === 'completed' && "border-success text-success",
              step.status === 'current' && "border-warning text-warning animate-pulse",
              step.status === 'pending' && "border-muted text-muted-foreground",
              step.isEmergency && step.status === 'completed' && "border-amber-500 text-amber-500"
            )}>
              {step.icon}
            </div>
            
            <div className="ml-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  step.isEmergency && "text-amber-600"
                )}>
                  {step.label}
                </span>
                {step.isEmergency && idx === 0 && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-600">
                    URGENCE
                  </span>
                )}
              </div>
              {(step.actor || step.timestamp) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {step.actor && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {step.actor}
                      {step.role && <span className="text-muted-foreground/70">({step.role})</span>}
                    </span>
                  )}
                  {step.timestamp && (
                    <span>
                      {format(parseISO(step.timestamp), 'dd/MM HH:mm', { locale: fr })}
                    </span>
                  )}
                </div>
              )}
              {step.status === 'current' && step.role && (
                <p className="text-xs text-warning">
                  En attente: {step.role}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
