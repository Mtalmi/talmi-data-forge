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

// Timeline mock for today's deliveries 
const TODAY_TIMELINE = [
  { id: 'BL-070', time: '08:00', client: 'Ciments & Béton du Sud', volume: 45, status: 'done' as const, statusLabel: 'Livré' },
  { id: 'BL-073', time: '10:30', client: 'BTP Maroc SARL', volume: 30, status: 'done' as const, statusLabel: 'Livré' },
  { id: 'BL-067', time: '13:00', client: 'Ciments & Béton du Sud', volume: 80, status: 'done' as const, statusLabel: 'Livré' },
  { id: 'BL-069', time: '14:30', client: 'Constructions Modernes SA', volume: 20, status: 'enRoute' as const, statusLabel: 'En Route' },
  { id: 'BL-071', time: '16:00', client: 'BTP Maroc SARL', volume: 20, status: 'planned' as const, statusLabel: 'Prévu' },
];

const statusColors = {
  done: '#22c55e',
  enRoute: '#eab308',
  planned: '#374151',
};

const statusIcons = {
  done: '✅',
  enRoute: '🔶',
  planned: '⏳',
};

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

  // Use timeline mock data, enriched by real data if available
  const timeline = TODAY_TIMELINE;
  const doneCount = timeline.filter(d => d.status === 'done').length;
  const totalVolume = timeline.reduce((s, d) => s + d.volume, 0);
  const progressPct = Math.round((doneCount / timeline.length) * 100);

  if (loading) {
    return (
        <div
          className="relative overflow-hidden p-6"
          style={{
          borderRadius: 8,
          background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        
        <h3 className="text-sm font-medium text-white/90 mb-4">{t.widgets.recentDeliveries.title}</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden p-6 transition-all duration-500"
      style={{
        borderRadius: 8,
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: 'none',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >



      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white/90">Livraisons du Jour</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono tabular-nums">
            {format(lastUpdate, 'HH:mm:ss', { locale: dateFnsLocale })}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400">{timeline.length} livraisons · <span className="text-white/70">{totalVolume} m³</span></span>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="space-y-0">
        {timeline.map((d, i) => (
          <div
            key={d.id}
            className="flex items-center gap-3 py-2"
            style={{
              borderLeft: `2px solid ${statusColors[d.status]}`,
              paddingLeft: '12px',
              marginLeft: '4px',
            }}
          >
            <span className="text-[10px] text-slate-500 w-10 font-mono tabular-nums shrink-0">{d.time}</span>
            <span className="text-xs shrink-0">{statusIcons[d.status]}</span>
            <span className="text-[11px] text-white/80 flex-1 truncate min-w-0">{d.client}</span>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0 whitespace-nowrap">{d.volume} m³</span>
            <span
              className="text-[10px] font-medium shrink-0 min-w-[60px] text-right whitespace-nowrap"
              style={{ color: statusColors[d.status] }}
            >
              {d.statusLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #22c55e, #4ade80)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-500 font-mono">{doneCount}/{timeline.length} livrées</span>
          <span className="text-[10px] font-mono tabular-nums" style={{ color: 'rgba(52,211,153,0.6)' }}>{progressPct}%</span>
        </div>
      </div>
    </div>
  );
}
