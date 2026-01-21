import { cn } from '@/lib/utils';
import { Check, Clock, Factory, Package, Truck, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  showDeliveryProgress?: boolean;
}

export function OrderStatusTimeline({ bc, compact = false, showDeliveryProgress = false }: OrderStatusTimelineProps) {
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
  const volumeTotal = bc.volume_m3;
  const volumeLivre = bc.volume_livre || 0;
  const volumeRestant = volumeTotal - volumeLivre;
  const deliveryProgress = volumeTotal > 0 
    ? Math.round((volumeLivre / volumeTotal) * 100) 
    : 0;
  const nbLivraisons = bc.nb_livraisons || 0;
  const isMultiDelivery = volumeTotal > 12 || nbLivraisons > 1;
  const isComplete = volumeRestant <= 0;

  if (compact) {
    return (
      <div className="space-y-1">
        {/* Stage dots */}
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
        
        {/* Mini delivery progress for multi-delivery orders */}
        {isMultiDelivery && showDeliveryProgress && (
          <div className="flex items-center gap-2">
            <Progress value={deliveryProgress} className="h-1 flex-1" />
            <span className="text-[10px] font-mono text-muted-foreground">
              {volumeLivre}/{volumeTotal}m³
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Multi-Delivery Badge */}
      {isMultiDelivery && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "gap-1",
            isComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          )}>
            <Truck className="h-3 w-3" />
            {nbLivraisons} livraison{nbLivraisons > 1 ? 's' : ''} • {deliveryProgress}%
          </Badge>
          {!isComplete && (
            <span className="text-xs text-muted-foreground">
              Reste {volumeRestant.toFixed(1)} m³
            </span>
          )}
        </div>
      )}

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
      {isMultiDelivery && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Progression livraison
            </span>
            <span className="font-medium font-mono">
              {volumeLivre.toFixed(1)} / {volumeTotal} m³
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isComplete ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${deliveryProgress}%` }}
            />
            {/* Milestone markers for each delivery */}
            {nbLivraisons > 1 && Array.from({ length: nbLivraisons - 1 }, (_, i) => {
              const position = ((i + 1) / nbLivraisons) * 100;
              return (
                <div 
                  key={i}
                  className="absolute top-0 h-full w-0.5 bg-background/50"
                  style={{ left: `${position}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{nbLivraisons} livraison{nbLivraisons > 1 ? 's' : ''}</span>
            <span className={cn(
              "font-medium",
              isComplete ? "text-success" : ""
            )}>
              {isComplete ? "Commande complète" : `${volumeRestant.toFixed(1)} m³ restants`}
            </span>
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
