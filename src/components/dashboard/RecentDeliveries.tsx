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
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: 'none',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-1px)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.borderColor = 'rgba(245, 158, 11, 0.15)';
      }}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent, rgba(212,168,67,0.7),transparent)', zIndex:99 }} />



      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', marginRight: '8px', animation: 'pulse 2s infinite' }} />
          <div>
            <h3 className="text-sm font-medium text-white/90">Livraisons du Jour</h3>
            <p className="text-xs font-mono text-white/30 mt-0.5 tabular-nums">
              {format(lastUpdate, 'HH:mm:ss', { locale: dateFnsLocale })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ overflow: 'visible' }}>
          <span className="text-xs bg-white/5 rounded px-2 py-0.5 text-white/50 font-mono" style={{ border: '1px solid rgba(212, 168, 67, 0.4)' }}>{timeline.length} livraisons</span>
          <span className="text-xs bg-[#D4A843]/10 rounded px-2 py-0.5 text-[#D4A843]/70 font-mono" style={{ border: '1px solid rgba(212, 168, 67, 0.4)' }}>{totalVolume} m³</span>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="flex items-center gap-4 py-2 mb-1">
        <span style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }} className="w-[60px]">Heure</span>
        <span style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }} className="flex-1">Client</span>
        <span style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }} className="w-[80px] text-right">Volume</span>
        <span style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }} className="w-[80px] text-right">Statut</span>
      </div>

      {/* Table Rows */}
      <div className="space-y-0">
        {timeline.map((d) => {
          const isAlertRow = d.client === 'Constructions Modernes SA' && d.time === '14:30';
          return (
          <div
            key={d.id}
            className="group flex items-center gap-4 py-2 hover:bg-white/5 cursor-pointer transition-all duration-200 rounded-md px-1"
            style={{ 
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              ...(isAlertRow ? { borderLeft: '2px solid rgba(245,158,11,0.5)', paddingLeft: '8px', background: 'rgba(245,158,11,0.03)' } : {})
            }}
          >
            <span className="tabular-nums w-[60px]" style={{ fontFamily:'ui-monospace,monospace', color:'rgba(255,255,255,0.6)', fontSize:'13px' }}>{d.time}</span>
            <span className="text-sm text-white flex-1 truncate min-w-0">{d.client}{(d.client === 'Ciments & Béton du Sud' || d.client === 'BTP Maroc SARL') && <span style={{ fontSize: '9px', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: '3px', padding: '1px 4px', color: 'rgba(212,168,67,0.7)', marginLeft: '6px', fontWeight: '500' }}>VIP</span>}</span>
            <span className="text-right w-[80px]"><span className="text-sm font-medium text-white">{d.volume}</span><span className="text-xs text-white/40 ml-0.5">m³</span></span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium text-right w-[80px] ${
                d.status === 'done' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                d.status === 'enRoute' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse' :
                d.status === 'late' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              {d.statusLabel}
            </span>
          </div>
          );
        })}
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
            <div className="h-1.5 rounded-full overflow-hidden flex gap-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {livrePct > 0 && (
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${livrePct}%`, background: '#22c55e' }} />
              )}
              {enRoutePct > 0 && (
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${enRoutePct}%`, background: '#eab308' }} />
              )}
              {latePct > 0 && (
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${latePct}%`, background: '#ef4444' }} />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums" style={{ color: '#22c55e' }}><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#22c55e' }} />{livreCount} Livré</span>
              {enRouteCount > 0 && <span className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums" style={{ color: '#eab308' }}><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#eab308' }} />{enRouteCount} En Route</span>}
              {lateCount > 0 && <span className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums" style={{ color: '#ef4444' }}><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#ef4444' }} />{lateCount} En Retard</span>}
              <span className="ml-auto text-[10px] text-slate-500 font-mono tabular-nums">{livreCount}/{timeline.length}</span><span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', fontFamily:'monospace', marginLeft:'8px' }}>60%</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
