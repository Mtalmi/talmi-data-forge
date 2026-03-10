import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Truck, 
  Factory, 
  Package,
  MapPin,
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { DeliveryRotationProgress } from './DeliveryRotationProgress';
import { ETATracker } from './ETATracker';
import { DispatcherProxyControls } from './DispatcherProxyControls';
import { useI18n } from '@/i18n/I18nContext';

interface DriverDispatchCardProps {
  bon: {
    bl_id: string;
    client_id: string;
    formule_id: string;
    volume_m3: number;
    workflow_status: string;
    heure_prevue: string | null;
    camion_assigne: string | null;
    toupie_assignee: string | null;
    date_livraison?: string;
    heure_depart_centrale?: string | null;
    heure_arrivee_chantier?: string | null;
    heure_retour_centrale?: string | null;
    zone_livraison_id: string | null;
    mode_paiement: string | null;
    clients?: { nom_client: string } | null;
    zones_livraison?: { nom_zone: string; code_zone: string } | null;
  };
  onStartProduction?: () => void;
  onMarkDelivered?: () => void;
  onOpenDetails?: () => void;
  onRefresh?: () => void;
  showActions?: boolean;
  showProxyControls?: boolean;
  suggestions?: { recommendedToupie: string | null; suggestedDeparture: string | null } | null;
}

export function DriverDispatchCard({ 
  bon, 
  onStartProduction, 
  onMarkDelivered,
  onOpenDetails,
  onRefresh,
  showActions = true,
  showProxyControls = true,
  suggestions = null,
}: DriverDispatchCardProps) {
  const { t } = useI18n();
  const d = t.driverDispatch;
  const c = t.common;
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planification': return 'border-l-white/30';
      case 'production': return 'border-l-[#D4A843]';
      case 'validation_technique': return 'border-l-[#D4A843]';
      case 'en_livraison': return 'border-l-blue-400';
      case 'livre': return 'border-l-emerald-400';
      case 'facture': return 'border-l-emerald-500';
      default: return 'border-l-white/20';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planification: d.toSchedule,
      production: d.production,
      validation_technique: d.validationTech,
      en_livraison: d.enRoute,
      livre: d.delivered,
      facture: d.invoiced,
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'en_livraison': return 'bg-blue-400/[0.12] text-blue-400';
      case 'production': case 'validation_technique': return 'bg-[#D4A843]/[0.12] text-[#D4A843]';
      case 'livre': case 'facture': return 'bg-emerald-400/[0.12] text-emerald-400';
      default: return 'bg-white/[0.08] text-white/50';
    }
  };

  return (
    <div 
      className={cn(
        'border-l-4 rounded-xl transition-all active:scale-[0.98]',
        getStatusColor(bon.workflow_status),
        'touch-manipulation cursor-pointer'
      )}
      style={{
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderRadius: 12,
      }}
      onClick={onOpenDetails}
    >
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-white truncate">{bon.bl_id}</p>
            <p className="text-base text-white/40 break-words">
              {bon.clients?.nom_client || bon.client_id}
            </p>
          </div>
          <Badge className={cn("text-sm px-3 py-1 shrink-0 border-0", getStatusBadgeClass(bon.workflow_status))}>
            {getStatusLabel(bon.workflow_status)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg min-h-[56px]">
            <Package className="h-5 w-5 text-[#D4A843] shrink-0" />
            <div>
              <p className="text-xs text-white/30">{d.formula}</p>
              <p className="font-semibold text-sm text-white/80">{bon.formule_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg min-h-[56px]">
            <Factory className="h-5 w-5 text-[#D4A843] shrink-0" />
            <div>
              <p className="text-xs text-white/30">{d.volume}</p>
              <p className="font-bold text-lg text-white">{bon.volume_m3} m³</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg min-h-[56px]">
            <Clock className="h-5 w-5 text-white/30 shrink-0" />
            <div>
              <p className="text-xs text-white/30">{d.scheduledTime}</p>
              <p className="font-bold text-xl font-mono font-normal text-white/70">{bon.heure_prevue || '--:--'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg min-h-[56px]">
            <Truck className="h-5 w-5 text-white/30 shrink-0" />
            <div>
              <p className="text-xs text-white/30">{d.truck}</p>
              <p className="font-semibold text-sm text-white/70 truncate">
                {bon.camion_assigne || bon.toupie_assignee || c.notAssigned}
              </p>
            </div>
          </div>
        </div>

        {bon.zones_livraison && (
          <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg mb-4 min-h-[48px]">
            <MapPin className="h-5 w-5 text-white/20 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/50 truncate">
                <span className="font-semibold text-white/60">{d.zone} {bon.zones_livraison.code_zone}:</span>{' '}
                {bon.zones_livraison.nom_zone}
              </p>
            </div>
          </div>
        )}

        {bon.mode_paiement && (
          <div className="mb-4">
            <Badge className="text-xs bg-[#D4A843]/[0.12] text-[#D4A843] border-0">
              💰 {bon.mode_paiement}
            </Badge>
          </div>
        )}

        {bon.workflow_status === 'en_livraison' && (
          <div className="mb-4 p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg space-y-3">
            {showProxyControls && (
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-white/30">{d.rotationTracking}</span>
                <DispatcherProxyControls
                  blId={bon.bl_id}
                  heureDepart={bon.heure_depart_centrale ?? null}
                  heureArrivee={bon.heure_arrivee_chantier ?? null}
                  heureRetour={bon.heure_retour_centrale ?? null}
                  workflowStatus={bon.workflow_status}
                  onUpdate={onRefresh || (() => {})}
                />
              </div>
            )}
            
            <DeliveryRotationProgress
              heureDepart={bon.heure_depart_centrale}
              heureArrivee={bon.heure_arrivee_chantier}
              heureRetour={bon.heure_retour_centrale}
              workflowStatus={bon.workflow_status}
            />
            {bon.date_livraison && (
              <ETATracker 
                departureTime={bon.heure_depart_centrale ?? null}
                scheduledTime={bon.heure_prevue}
                zoneCode={bon.zones_livraison?.code_zone}
                status={bon.workflow_status}
                deliveryDate={bon.date_livraison}
              />
            )}
          </div>
        )}

        {showActions && (
          <div className="flex gap-3 pt-2">
            {bon.workflow_status === 'planification' && onStartProduction && (
              <Button 
                size="lg"
                className="flex-1 min-h-[52px] text-base gap-2 touch-manipulation bg-[#D4A843] hover:bg-[#D4A843]/90 text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartProduction();
                }}
              >
                <Play className="h-5 w-5" />
                {d.launchProduction}
              </Button>
            )}
            {bon.workflow_status === 'en_livraison' && onMarkDelivered && (
              <Button 
                size="lg"
                className="flex-1 min-h-[52px] text-base gap-2 bg-emerald-500 hover:bg-emerald-500/90 text-white touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkDelivered();
                }}
              >
                <CheckCircle className="h-5 w-5" />
                {d.confirmDelivery}
              </Button>
            )}
            {onOpenDetails && (
              <Button 
                size="lg"
                variant="outline"
                className="min-h-[52px] min-w-[52px] touch-manipulation border-white/[0.08] text-white/50 hover:bg-white/[0.05]"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails();
                }}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
