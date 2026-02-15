import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Clock, Package, MapPin, Navigation, Factory, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DriverRotationTracker } from './DriverRotationTracker';
import { useI18n } from '@/i18n/I18nContext';

const openNavigation = (destination: string, app: 'google' | 'waze') => {
  const encodedDestination = encodeURIComponent(destination);
  if (app === 'google') {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedDestination}`, '_blank');
  } else {
    window.open(`https://waze.com/ul?q=${encodedDestination}&navigate=yes`, '_blank');
  }
};

interface DriverDeliveryCardProps {
  bon: {
    bl_id: string;
    client_id: string;
    formule_id: string;
    volume_m3: number;
    workflow_status: string;
    heure_prevue: string | null;
    mode_paiement: string | null;
    heure_depart_centrale?: string | null;
    heure_arrivee_chantier?: string | null;
    heure_retour_centrale?: string | null;
    clients?: { nom_client: string } | null;
    zones_livraison?: { nom_zone: string; code_zone: string } | null;
  };
  onUpdate: () => void;
}

export function DriverDeliveryCard({ bon, onUpdate }: DriverDeliveryCardProps) {
  const { t } = useI18n();
  const dd = t.driverDelivery;
  const isDelivered = bon.workflow_status === 'livre' || bon.workflow_status === 'facture';
  const isEnRoute = bon.workflow_status === 'en_livraison';
  const isProduction = bon.workflow_status === 'production';
  const isValidation = bon.workflow_status === 'validation_technique';

  const getStatusConfig = (status: string) => {
    const sl = dd.statusLabels;
    switch (status) {
      case 'planification':
        return { label: sl.planification, color: 'bg-muted text-muted-foreground', borderColor: 'border-l-muted-foreground' };
      case 'production':
        return { label: sl.production, color: 'bg-warning/20 text-warning-foreground', borderColor: 'border-l-warning' };
      case 'validation_technique':
        return { label: sl.validation_technique, color: 'bg-purple-100 text-purple-700', borderColor: 'border-l-purple-500' };
      case 'en_livraison':
        return { label: sl.en_livraison, color: 'bg-blue-100 text-blue-700', borderColor: 'border-l-blue-500' };
      case 'livre':
        return { label: sl.livre, color: 'bg-success/20 text-success', borderColor: 'border-l-success' };
      default:
        return { label: status, color: 'bg-muted text-muted-foreground', borderColor: 'border-l-muted' };
    }
  };

  const statusConfig = getStatusConfig(bon.workflow_status);

  return (
    <Card className={cn('border-l-4 transition-all', statusConfig.borderColor, isDelivered && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg">{bon.bl_id}</p>
            <p className="text-base text-muted-foreground truncate">
              {bon.clients?.nom_client || bon.client_id}
            </p>
          </div>
          <Badge className={cn('shrink-0 px-3 py-1', statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <Clock className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{dd.hour}</p>
              <p className="font-bold text-2xl">{bon.heure_prevue || '--:--'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <Factory className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{dd.volume}</p>
              <p className="font-bold text-2xl">{bon.volume_m3} m³</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-3">
          <Package className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="font-medium">{bon.formule_id}</span>
        </div>

        {bon.zones_livraison && (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-3">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">{dd.zone} {bon.zones_livraison.code_zone}:</span>{' '}
              <span className="text-muted-foreground">{bon.zones_livraison.nom_zone}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="h-10 px-3 gap-2 shrink-0 bg-primary">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm">GPS</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => openNavigation(bon.zones_livraison!.nom_zone, 'google')} className="py-3 text-base cursor-pointer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Maps
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openNavigation(bon.zones_livraison!.nom_zone, 'waze')} className="py-3 text-base cursor-pointer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Waze
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {bon.mode_paiement && (
          <div className="mb-3">
            <Badge variant={bon.mode_paiement.toLowerCase().includes('esp') ? 'destructive' : 'outline'} className="text-sm px-3 py-1">
              💰 {bon.mode_paiement}
            </Badge>
          </div>
        )}

        {(isEnRoute || isDelivered) && (
          <div className="pt-3 border-t">
            <DriverRotationTracker
              blId={bon.bl_id}
              heureDepart={bon.heure_depart_centrale || null}
              heureArrivee={bon.heure_arrivee_chantier || null}
              heureRetour={bon.heure_retour_centrale || null}
              workflowStatus={bon.workflow_status}
              clientName={bon.clients?.nom_client || bon.client_id}
              onUpdate={onUpdate}
            />
          </div>
        )}

        {(isProduction || isValidation) && (
          <div className="flex items-center justify-center gap-2 p-3 bg-warning/10 rounded-lg">
            <div className="h-3 w-3 bg-warning rounded-full animate-pulse" />
            <span className="text-warning font-medium">
              {isProduction ? dd.loadingInProgress : dd.technicalValidation}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}