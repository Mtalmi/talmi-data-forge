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
  Clock, 
  Package,
  MapPin,
  CheckCircle,
  Navigation,
  Factory,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    clients?: { nom_client: string } | null;
    zones_livraison?: { nom_zone: string; code_zone: string } | null;
  };
  onMarkDelivered: () => void;
}

export function DriverDeliveryCard({ bon, onMarkDelivered }: DriverDeliveryCardProps) {
  const isDelivered = bon.workflow_status === 'livre';
  const isEnRoute = bon.workflow_status === 'en_livraison';
  const isProduction = bon.workflow_status === 'production';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'planification':
        return { 
          label: 'À Planifier', 
          color: 'bg-muted text-muted-foreground',
          borderColor: 'border-l-muted-foreground'
        };
      case 'production':
        return { 
          label: 'En Production', 
          color: 'bg-warning/20 text-warning-foreground',
          borderColor: 'border-l-warning'
        };
      case 'validation_technique':
        return { 
          label: 'Validation', 
          color: 'bg-purple-100 text-purple-700',
          borderColor: 'border-l-purple-500'
        };
      case 'en_livraison':
        return { 
          label: 'En Route', 
          color: 'bg-blue-100 text-blue-700',
          borderColor: 'border-l-blue-500'
        };
      case 'livre':
        return { 
          label: 'Livré ✓', 
          color: 'bg-success/20 text-success',
          borderColor: 'border-l-success'
        };
      default:
        return { 
          label: status, 
          color: 'bg-muted text-muted-foreground',
          borderColor: 'border-l-muted'
        };
    }
  };

  const statusConfig = getStatusConfig(bon.workflow_status);

  return (
    <Card 
      className={cn(
        'border-l-4 transition-all',
        statusConfig.borderColor,
        isDelivered && 'opacity-60'
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
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

        {/* Key Info - Large, Easy to Read */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <Clock className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Heure</p>
              <p className="font-bold text-2xl">{bon.heure_prevue || '--:--'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <Factory className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="font-bold text-2xl">{bon.volume_m3} m³</p>
            </div>
          </div>
        </div>

        {/* Formula */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-3">
          <Package className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="font-medium">{bon.formule_id}</span>
        </div>

        {/* Zone */}
        {bon.zones_livraison && (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-3">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Zone {bon.zones_livraison.code_zone}:</span>{' '}
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
                <DropdownMenuItem 
                  onClick={() => openNavigation(bon.zones_livraison!.nom_zone, 'google')}
                  className="py-3 text-base cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Maps
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openNavigation(bon.zones_livraison!.nom_zone, 'waze')}
                  className="py-3 text-base cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Waze
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Payment Alert */}
        {bon.mode_paiement && (
          <div className="mb-3">
            <Badge 
              variant={bon.mode_paiement.toLowerCase().includes('esp') ? 'destructive' : 'outline'}
              className="text-sm px-3 py-1"
            >
              💰 {bon.mode_paiement}
            </Badge>
          </div>
        )}

        {/* Action Button - Very Large */}
        {isEnRoute && (
          <Button 
            size="lg"
            className="w-full min-h-[56px] text-lg gap-3 bg-success hover:bg-success/90 touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onMarkDelivered();
            }}
          >
            <CheckCircle className="h-6 w-6" />
            Confirmer Livraison
          </Button>
        )}

        {isProduction && (
          <div className="flex items-center justify-center gap-2 p-3 bg-warning/10 rounded-lg">
            <div className="h-3 w-3 bg-warning rounded-full animate-pulse" />
            <span className="text-warning font-medium">En cours de chargement...</span>
          </div>
        )}

        {isDelivered && (
          <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-success font-medium">Livraison Confirmée</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
