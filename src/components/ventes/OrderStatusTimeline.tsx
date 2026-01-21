import { cn } from '@/lib/utils';
import { Check, Circle, Clock, Factory, Package, Truck, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TIMELINE_STAGES = [
  { 
    id: 'pret_production', 
    label: 'Prêt', 
    icon: Package,
    description: 'Commande validée, prête pour production'
  },
  { 
    id: 'en_production', 
    label: 'Production', 
    icon: Factory,
    description: 'En cours de production'
  },
  { 
    id: 'en_livraison', 
    label: 'Livraison', 
    icon: Truck,
    description: 'En cours de livraison'
  },
  { 
    id: 'livre', 
    label: 'Livré', 
    icon: Check,
    description: 'Livraison complétée'
  },
  { 
    id: 'facture', 
    label: 'Facturé', 
    icon: FileText,
    description: 'Facture générée'
  },
];

interface OrderStatusTimelineProps {
  bc: BonCommande;
  compact?: boolean;
}

export function OrderStatusTimeline({ bc, compact = false }: OrderStatusTimelineProps) {
  const getStageIndex = (statut: string): number => {
    const statusMapping: Record<string, number> = {
      'pret_production': 0,
      'en_production': 1,
      'en_livraison': 2,
      'termine': 3,
      'livre': 3,
      'facture': 4,
    };
    return statusMapping[statut] ?? 0;
  };

  const currentStageIndex = getStageIndex(bc.statut);
  const hasInvoice = bc.facture_consolidee_id !== null;
  const effectiveStageIndex = hasInvoice ? 4 : currentStageIndex;

  // Calculate delivery progress for multi-delivery orders
  const deliveryProgress = bc.volume_m3 > 0 
    ? Math.round(((bc.volume_livre || 0) / bc.volume_m3) * 100) 
    : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {TIMELINE_STAGES.map((stage, index) => {
          const isComplete = index <= effectiveStageIndex;
          const isCurrent = index === effectiveStageIndex;
          const StageIcon = stage.icon;

          return (
            <Tooltip key={stage.id}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    isComplete ? "bg-primary" : "bg-muted",
                    isCurrent && "ring-2 ring-primary/30"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-1">
                  <StageIcon className="h-3 w-3" />
                  {stage.label}
                  {isCurrent && " (actuel)"}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative flex items-center justify-between">
        {/* Progress Line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
        <div 
          className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `calc(${(effectiveStageIndex / (TIMELINE_STAGES.length - 1)) * 100}% - 2rem)` }}
        />

        {/* Stage Nodes */}
        {TIMELINE_STAGES.map((stage, index) => {
          const isComplete = index <= effectiveStageIndex;
          const isCurrent = index === effectiveStageIndex;
          const StageIcon = stage.icon;

          return (
            <Tooltip key={stage.id}>
              <TooltipTrigger asChild>
                <div className="relative z-10 flex flex-col items-center">
                  <div 
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isComplete 
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-muted-foreground/30 text-muted-foreground",
                      isCurrent && "ring-4 ring-primary/20 scale-110"
                    )}
                  >
                    {isComplete && index < effectiveStageIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StageIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span 
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{stage.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Delivery Progress for Multi-Delivery */}
      {bc.nb_livraisons !== null && bc.nb_livraisons > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Progression livraison
            </span>
            <span className="font-medium">
              {bc.volume_livre || 0} / {bc.volume_m3} m³ ({bc.nb_livraisons} livraison{bc.nb_livraisons > 1 ? 's' : ''})
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${deliveryProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Key Dates */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
        <div>
          <span className="text-muted-foreground">Créé le:</span>
          <p className="font-medium">
            {format(new Date(bc.created_at), 'dd MMM yyyy', { locale: fr })}
          </p>
        </div>
        {bc.date_livraison_souhaitee && (
          <div>
            <span className="text-muted-foreground">Livraison prévue:</span>
            <p className="font-medium">
              {format(new Date(bc.date_livraison_souhaitee), 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
