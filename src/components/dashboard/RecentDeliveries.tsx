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
  late: '#ef4444',
};

const statusIcons = {
  done: '✅',
  enRoute: '🔶',
  planned: '⏳',
  late: '🔴',
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

  // Compute effective status: planned deliveries past their time become "late"
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timeline = TODAY_TIMELINE.map(d => {
    if (d.status === 'planned') {
      const [h, m] = d.time.split(':').map(Number);
      const scheduledMinutes = h * 60 + m;
      if (currentMinutes > scheduledMinutes) {
        return { ...d, status: 'late' as const, statusLabel: 'En Retard' };
      }
    }
    return d;
  });
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
        border: '1px solid rgba(245, 158, 11, 0.15)',
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
      
      {/* Table Header */}
      <div className="flex items-center gap-4 py-2 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold w-[60px]" style={{ color: 'rgba(148,163,184,0.4)' }}>Heure</span>
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold flex-1" style={{ color: 'rgba(148,163,184,0.4)' }}>Client</span>
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold w-[80px] text-right" style={{ color: 'rgba(148,163,184,0.4)' }}>Volume</span>
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold w-[80px] text-right" style={{ color: 'rgba(148,163,184,0.4)' }}>Statut</span>
      </div>

      {/* Table Rows */}
      <div className="space-y-0">
        {timeline.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-4 py-2 transition-colors duration-150"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255, 215, 0, 0.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span className="text-xs text-muted-foreground/50 font-mono tabular-nums w-[60px]">{d.time}</span>
            <span className="text-sm text-white flex-1 truncate min-w-0">{d.client}</span>
            <span className="text-sm font-mono tabular-nums text-right w-[80px]" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", color: 'rgba(226,232,240,0.8)' }}>{d.volume} m³</span>
            <span
              className="text-xs font-medium text-right w-[80px]"
              style={{ color: statusColors[d.status] }}
            >
              {d.statusLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Segmented progress bar */}
      {(() => {
        const total = timeline.length || 1;
        const livreCount = timeline.filter(d => d.status === 'done').length;
        const enRouteCount = timeline.filter(d => d.status === 'enRoute').length;
        const lateCount = timeline.filter(d => d.status === 'late').length;
        const livrePct = (livreCount / total) * 100;
        const enRoutePct = (enRouteCount / total) * 100;
        const latePct = (lateCount / total) * 100;
        return (
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {livrePct > 0 && (
                <div className="h-full transition-all duration-1000" style={{ width: `${livrePct}%`, background: '#22c55e' }} />
              )}
              {enRoutePct > 0 && (
                <div className="h-full transition-all duration-1000" style={{ width: `${enRoutePct}%`, background: '#eab308' }} />
              )}
              {latePct > 0 && (
                <div className="h-full transition-all duration-1000" style={{ width: `${latePct}%`, background: '#ef4444' }} />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-mono tabular-nums" style={{ color: '#22c55e' }}>{livreCount} Livré</span>
              {enRouteCount > 0 && <span className="text-[10px] font-mono tabular-nums" style={{ color: '#eab308' }}>{enRouteCount} En Route</span>}
              {lateCount > 0 && <span className="text-[10px] font-mono tabular-nums" style={{ color: '#ef4444' }}>{lateCount} En Retard</span>}
              <span className="ml-auto text-[10px] text-slate-500 font-mono tabular-nums">{livreCount}/{timeline.length}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
