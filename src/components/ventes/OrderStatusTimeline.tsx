import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { Check, Clock, Factory, Package, Truck, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { format } from 'date-fns';

interface OrderStatusTimelineProps {
  bc: BonCommande;
  compact?: boolean;
  showDeliveryProgress?: boolean;
}

export function OrderStatusTimeline({ bc, compact = false, showDeliveryProgress = false }: OrderStatusTimelineProps) {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const o = t.pages.orderStatus;

  const TIMELINE_STAGES = [
    { id: 'pret_production', label: o.ready, icon: Package, description: o.readyDesc },
    { id: 'en_production', label: o.productionLabel, icon: Factory, description: o.productionDesc },
    { id: 'en_livraison', label: o.delivery, icon: Truck, description: o.deliveryDesc },
    { id: 'livre', label: o.deliveredLabel, icon: Check, description: o.deliveredDesc },
    { id: 'facture', label: o.invoiced, icon: FileText, description: o.invoicedDesc },
  ];

  const getStageIndex = (statut: string): number => {
    const statusMapping: Record<string, number> = {
      'pret_production': 0, 'en_production': 1, 'en_livraison': 2,
      'termine': 3, 'livre': 3, 'facture': 4,
    };
    return statusMapping[statut] ?? 0;
  };

  const currentStageIndex = getStageIndex(bc.statut);
  const hasInvoice = bc.facture_consolidee_id !== null;
  const effectiveStageIndex = hasInvoice ? 4 : currentStageIndex;

  const volumeTotal = bc.volume_m3;
  const volumeLivre = bc.volume_livre || 0;
  const volumeRestant = volumeTotal - volumeLivre;
  const deliveryProgress = volumeTotal > 0 ? Math.round((volumeLivre / volumeTotal) * 100) : 0;
  const nbLivraisons = bc.nb_livraisons || 0;
  const isMultiDelivery = volumeTotal > 12 || nbLivraisons > 1;
  const isComplete = volumeRestant <= 0;

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          {TIMELINE_STAGES.map((stage, index) => {
            const stageComplete = index <= effectiveStageIndex;
            const isCurrent = index === effectiveStageIndex;
            const StageIcon = stage.icon;
            return (
              <Tooltip key={stage.id}>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    stageComplete ? "bg-primary" : "bg-muted",
                    isCurrent && "ring-2 ring-primary/30"
                  )} />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-1">
                    <StageIcon className="h-3 w-3" />
                    {stage.label}
                    {isCurrent && ` (${o.current})`}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
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
      {isMultiDelivery && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "gap-1",
            isComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          )}>
            <Truck className="h-3 w-3" />
            {nbLivraisons} {nbLivraisons > 1 ? o.deliveriesPlural : o.deliveries} • {deliveryProgress}%
          </Badge>
          {!isComplete && (
            <span className="text-xs text-muted-foreground">
              {o.remaining} {volumeRestant.toFixed(1)} m³
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center justify-between">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
        <div 
          className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `calc(${(effectiveStageIndex / (TIMELINE_STAGES.length - 1)) * 100}% - 2rem)` }}
        />
        {TIMELINE_STAGES.map((stage, index) => {
          const stageComplete = index <= effectiveStageIndex;
          const isCurrent = index === effectiveStageIndex;
          const StageIcon = stage.icon;
          return (
            <Tooltip key={stage.id}>
              <TooltipTrigger asChild>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                    stageComplete ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted-foreground/30 text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20 scale-110"
                  )}>
                    {stageComplete && index < effectiveStageIndex ? <Check className="h-4 w-4" /> : <StageIcon className="h-4 w-4" />}
                  </div>
                  <span className={cn("mt-2 text-xs font-medium", isCurrent ? "text-primary" : "text-muted-foreground")}>
                    {stage.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{stage.description}</p></TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {isMultiDelivery && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {o.deliveryProgress}
            </span>
            <span className="font-medium font-mono">
              {volumeLivre.toFixed(1)} / {volumeTotal} m³
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full transition-all duration-500", isComplete ? "bg-success" : "bg-primary")} style={{ width: `${deliveryProgress}%` }} />
            {nbLivraisons > 1 && Array.from({ length: nbLivraisons - 1 }, (_, i) => {
              const position = ((i + 1) / nbLivraisons) * 100;
              return <div key={i} className="absolute top-0 h-full w-0.5 bg-background/50" style={{ left: `${position}%` }} />;
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{nbLivraisons} {nbLivraisons > 1 ? o.deliveriesPlural : o.deliveries}</span>
            <span className={cn("font-medium", isComplete ? "text-success" : "")}>
              {isComplete ? o.orderComplete : `${volumeRestant.toFixed(1)} m³ ${o.remainingM3}`}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
        <div>
          <span className="text-muted-foreground">{o.createdOn}</span>
          <p className="font-medium">
            {format(new Date(bc.created_at), 'dd MMM yyyy', { locale: dateLocale || undefined })}
          </p>
        </div>
        {bc.date_livraison_souhaitee && (
          <div>
            <span className="text-muted-foreground">{o.plannedDelivery}</span>
            <p className="font-medium">
              {format(new Date(bc.date_livraison_souhaitee), 'dd MMM yyyy', { locale: dateLocale || undefined })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
