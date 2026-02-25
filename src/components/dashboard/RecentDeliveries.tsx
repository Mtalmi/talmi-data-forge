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
      <div
        className="relative overflow-hidden rounded-[14px] p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
        <h3 className="text-sm font-medium text-white/90 mb-4">{t.widgets.recentDeliveries.title}</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group/card relative overflow-hidden rounded-[16px] p-6 transition-all duration-500"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid transparent',
        borderImage: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(212,175,55,0.06), rgba(255,255,255,0.04)) 1',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px) scale(1.008)';
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(212,175,55,0.12), 0 0 60px rgba(212,175,55,0.04)';
        el.style.borderImage = 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(255,255,255,0.1), rgba(212,175,55,0.15)) 1';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0) scale(1)';
        el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
        el.style.borderImage = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(212,175,55,0.06), rgba(255,255,255,0.04)) 1';
      }}
    >
      {/* Top highlight edge */}
      <div className="absolute top-0 left-[8%] right-[8%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />
      {/* Gradient border glow on hover */}
      <div className="absolute inset-0 rounded-[16px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white/90">{t.widgets.recentDeliveries.title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {format(lastUpdate, 'HH:mm:ss', { locale: dateFnsLocale })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
          <div className="space-y-0 max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {deliveries.slice(0, 5).map((delivery, idx) => (
              <div
                key={delivery.bl_id}
                className="py-3 px-4 rounded-[10px] transition-colors duration-200 hover:bg-white/[0.02]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-white tabular-nums font-mono">
                        {delivery.bl_id}
                      </p>
                      {delivery.alerte_ecart && (
                        <AlertCircle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'rgba(148,163,184,0.6)' }}>
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
                    <p className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'rgba(148,163,184,0.4)' }}>
                      {format(new Date(delivery.date_livraison), 'dd MMM', { locale: dateFnsLocale })}
                    </p>
                  </div>
                </div>
                {delivery.ecart_marge !== null && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/[0.04]">
                    <p className="text-[11px] tabular-nums" style={{ color: delivery.ecart_marge > 0 ? '#E8B84B' : 'rgba(148,163,184,0.5)' }}>
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
              <button className="text-[11px] font-medium hover:underline" style={{ color: '#E8B84B' }}>Voir tout →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
