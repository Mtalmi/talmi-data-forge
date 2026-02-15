import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr, ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Truck, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';

interface Delivery {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  client_name?: string;
  formule_id: string;
  volume_m3: number;
  statut_paiement: string;
  ecart_marge: number | null;
  alerte_ecart: boolean;
}

export default function RecentDeliveries() {
  const { t, lang } = useI18n();
  const dateFnsLocale = lang === 'ar' ? ar : lang === 'en' ? enUS : fr;
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDeliveries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id, 
          date_livraison, 
          client_id, 
          formule_id, 
          volume_m3, 
          statut_paiement, 
          ecart_marge, 
          alerte_ecart,
          clients!bons_livraison_reels_client_id_fkey(nom_client)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const mappedDeliveries = (data || []).map(d => ({
        bl_id: d.bl_id,
        date_livraison: d.date_livraison,
        client_id: d.client_id,
        client_name: d.clients?.nom_client || d.client_id,
        formule_id: d.formule_id,
        volume_m3: d.volume_m3,
        statut_paiement: d.statut_paiement,
        ecart_marge: d.ecart_marge,
        alerte_ecart: d.alerte_ecart,
      }));
      
      setDeliveries(mappedDeliveries);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching recent deliveries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  useEffect(() => {
    const channel = supabase
      .channel('recent-deliveries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bons_livraison_reels' },
        () => { fetchDeliveries(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDeliveries]);

  const getStatusPill = (status: string) => {
    const statusMap: Record<string, string> = {
      'Payé': 'paid',
      'En Attente': 'pending',
      'Retard': 'late',
    };
    return statusMap[status] || 'pending';
  };

  if (loading) {
    return (
      <div className="card-industrial p-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">{t.widgets.recentDeliveries.title}</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-industrial p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t.widgets.recentDeliveries.title}</h3>
          <p className="text-xs text-muted-foreground">
            {t.widgets.recentDeliveries.updated}: {format(lastUpdate, 'HH:mm:ss', { locale: dateFnsLocale })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <Truck className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      
      {deliveries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t.widgets.recentDeliveries.noRecent}</p>
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
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    <span className="font-medium text-foreground">{delivery.client_name}</span> • {delivery.volume_m3} m³
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn('status-pill', getStatusPill(delivery.statut_paiement))}>
                    {delivery.statut_paiement}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(delivery.date_livraison), 'dd MMM', { locale: dateFnsLocale })}
                  </p>
                </div>
              </div>
              {delivery.ecart_marge !== null && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className={cn(
                    'text-xs font-medium',
                    delivery.ecart_marge > 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {t.widgets.recentDeliveries.marginVariance}: {delivery.ecart_marge > 0 ? '+' : ''}{delivery.ecart_marge.toFixed(2)} DH/m³
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
