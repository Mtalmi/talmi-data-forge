import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Truck, AlertCircle } from 'lucide-react';

interface Delivery {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  statut_paiement: string;
  ecart_marge: number | null;
  alerte_ecart: boolean;
}

interface RecentDeliveriesProps {
  deliveries: Delivery[];
  loading?: boolean;
}

export default function RecentDeliveries({ deliveries, loading }: RecentDeliveriesProps) {
  if (loading) {
    return (
      <div className="card-industrial p-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Dernières Livraisons</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusPill = (status: string) => {
    const statusMap: Record<string, string> = {
      'Payé': 'paid',
      'En Attente': 'pending',
      'Retard': 'late',
    };
    return statusMap[status] || 'pending';
  };

  return (
    <div className="card-industrial p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Dernières Livraisons</h3>
        <Truck className="h-5 w-5 text-muted-foreground" />
      </div>
      
      {deliveries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucune livraison récente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div
              key={delivery.bl_id}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                delivery.alerte_ecart
                  ? 'border-destructive/50 bg-destructive/5'
                  : 'border-border bg-muted/20 hover:bg-muted/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium truncate">
                      {delivery.bl_id}
                    </p>
                    {delivery.alerte_ecart && (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {delivery.client_id} • {delivery.volume_m3} m³
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn('status-pill', getStatusPill(delivery.statut_paiement))}>
                    {delivery.statut_paiement}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(delivery.date_livraison), 'dd MMM', { locale: fr })}
                  </p>
                </div>
              </div>
              {delivery.ecart_marge !== null && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className={cn(
                    'text-xs font-medium',
                    delivery.ecart_marge > 0 ? 'text-success' : 'text-destructive'
                  )}>
                    Écart marge: {delivery.ecart_marge > 0 ? '+' : ''}{delivery.ecart_marge.toFixed(2)} DH/m³
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
