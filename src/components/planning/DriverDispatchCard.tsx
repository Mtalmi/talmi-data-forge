import { Card, CardContent } from '@/components/ui/card';
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
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeliveryRotationProgress } from './DeliveryRotationProgress';
import { ETATracker } from './ETATracker';

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
  showActions?: boolean;
}

export function DriverDispatchCard({ 
  bon, 
  onStartProduction, 
  onMarkDelivered,
  onOpenDetails,
  showActions = true 
}: DriverDispatchCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planification': return 'border-l-muted-foreground';
      case 'production': return 'border-l-warning';
      case 'validation_technique': return 'border-l-purple-500';
      case 'en_livraison': return 'border-l-blue-500';
      case 'livre': return 'border-l-success';
      case 'facture': return 'border-l-primary';
      default: return 'border-l-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planification: 'À Planifier',
      production: 'Production',
      validation_technique: 'Validation',
      en_livraison: 'En Route',
      livre: 'Livré',
      facture: 'Facturé',
    };
    return labels[status] || status;
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'en_livraison': return 'default';
      case 'production': case 'validation_technique': return 'secondary';
      case 'livre': case 'facture': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card 
      className={cn(
        'border-l-4 transition-all active:scale-[0.98]',
        getStatusColor(bon.workflow_status),
        'touch-manipulation'
      )}
      onClick={onOpenDetails}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">{bon.bl_id}</p>
            <p className="text-base text-muted-foreground truncate">
              {bon.clients?.nom_client || bon.client_id}
            </p>
          </div>
          <Badge 
            variant={getStatusBadgeVariant(bon.workflow_status)}
            className="text-sm px-3 py-1 shrink-0"
          >
            {getStatusLabel(bon.workflow_status)}
          </Badge>
        </div>

        {/* Key Info Grid - Large Touch Targets */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[56px]">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Formule</p>
              <p className="font-semibold text-sm">{bon.formule_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg min-h-[56px]">
            <Factory className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="font-bold text-lg">{bon.volume_m3} m³</p>
            </div>
          </div>
        </div>

        {/* Time & Truck Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg min-h-[56px]">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Heure Prévue</p>
              <p className="font-bold text-xl">{bon.heure_prevue || '--:--'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg min-h-[56px]">
            <Truck className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Camion</p>
              <p className="font-semibold text-sm truncate">
                {bon.camion_assigne || bon.toupie_assignee || 'Non assigné'}
              </p>
            </div>
          </div>
        </div>

        {/* Zone Info */}
        {bon.zones_livraison && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mb-4 min-h-[48px]">
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                <span className="font-semibold">Zone {bon.zones_livraison.code_zone}:</span>{' '}
                {bon.zones_livraison.nom_zone}
              </p>
            </div>
          </div>
        )}

        {/* Payment Mode */}
        {bon.mode_paiement && (
          <div className="mb-4">
            <Badge variant="outline" className="text-xs">
              💰 {bon.mode_paiement}
            </Badge>
          </div>
        )}

        {/* 🆕 Rotation Progress for en_livraison status */}
        {bon.workflow_status === 'en_livraison' && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg space-y-2">
            <DeliveryRotationProgress
              heureDepart={bon.heure_depart_centrale}
              heureArrivee={bon.heure_arrivee_chantier}
              heureRetour={bon.heure_retour_centrale}
              workflowStatus={bon.workflow_status}
              compact
            />
            <ETATracker 
              departureTime={bon.heure_depart_centrale}
              scheduledTime={bon.heure_prevue}
              zoneCode={bon.zones_livraison?.code_zone}
              status={bon.workflow_status}
              deliveryDate={bon.date_livraison}
            />
          </div>
        )}

        {/* Action Buttons - Large Touch Targets (44px+) */}
        {showActions && (
          <div className="flex gap-3 pt-2">
            {bon.workflow_status === 'planification' && onStartProduction && (
              <Button 
                size="lg"
                className="flex-1 min-h-[52px] text-base gap-2 touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartProduction();
                }}
              >
                <Play className="h-5 w-5" />
                Lancer Production
              </Button>
            )}
            {bon.workflow_status === 'en_livraison' && onMarkDelivered && (
              <Button 
                size="lg"
                variant="default"
                className="flex-1 min-h-[52px] text-base gap-2 bg-success hover:bg-success/90 touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkDelivered();
                }}
              >
                <CheckCircle className="h-5 w-5" />
                Confirmer Livraison
              </Button>
            )}
            {onOpenDetails && (
              <Button 
                size="lg"
                variant="outline"
                className="min-h-[52px] min-w-[52px] touch-manipulation"
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
      </CardContent>
    </Card>
  );
}
