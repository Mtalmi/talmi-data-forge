import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { Truck, AlertCircle } from 'lucide-react';
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
  const dateFnsLocale = getDateLocale(lang);
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

  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-sm font-medium text-white/90 mb-4">{t.widgets.recentDeliveries.title}</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-white/[0.02] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 transition-all duration-300 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white/90">{t.widgets.recentDeliveries.title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {format(lastUpdate, 'HH:mm:ss', { locale: dateFnsLocale })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse-subtle_3s_ease-in-out_infinite]" />
          <Truck className="h-4 w-4 text-slate-500" />
        </div>
      </div>
      
      {deliveries.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-[11px]">{t.widgets.recentDeliveries.noRecent}</p>
        </div>
      ) : (
        <>
          <div className="space-y-1 max-h-[400px] overflow-y-auto deliveries-scroll">
            {deliveries.map((delivery, idx) => (
              <div
                key={delivery.bl_id}
                className="py-2.5 px-2 rounded-lg transition-colors duration-200 hover:bg-white/[0.02]"
                style={{ opacity: idx % 2 === 1 ? 0.85 : 1 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-slate-300 tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>
                        {delivery.bl_id}
                      </p>
                      {delivery.alerte_ecart && (
                        <AlertCircle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {delivery.client_name} · {delivery.volume_m3} m³
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full inline-block',
                        delivery.statut_paiement === 'Payé' ? 'bg-emerald-400' : 'bg-amber-400'
                      )} />
                      <span className="text-[11px] text-slate-400">{delivery.statut_paiement}</span>
                    </span>
                    <p className="text-[9px] text-slate-500 mt-0.5 tabular-nums">
                      {format(new Date(delivery.date_livraison), 'dd MMM', { locale: dateFnsLocale })}
                    </p>
                  </div>
                </div>
                {delivery.ecart_marge !== null && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/[0.04]">
                    <p className={cn(
                      'text-[11px] tabular-nums',
                      delivery.ecart_marge > 0 ? 'text-primary' : 'text-slate-400'
                    )}>
                      {delivery.ecart_marge > 0 ? '+' : ''}{delivery.ecart_marge.toFixed(2)} DH/m³
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {deliveries.length > 5 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
              <span className="text-[11px] text-slate-500">5 / {deliveries.length}</span>
              <button className="text-[11px] text-primary font-medium hover:underline">Voir tout →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
