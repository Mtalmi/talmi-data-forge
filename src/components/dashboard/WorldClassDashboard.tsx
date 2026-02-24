import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format, subDays } from 'date-fns';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS — Vogue mode
// ─────────────────────────────────────────────────────
const T = {
  gold: 'rgb(234, 179, 8)',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#475569',
  textFaint: '#334155',
  dotOk: '#34D399',
  dotWarn: '#FBBF24',
  dotCrit: '#F87171',
};

// ─── Animated counter ───
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

// ─── Tooltip ───
function CleanTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
      padding: '6px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: '#fff', fontFamily: 'Inter, system-ui', fontWeight: 300, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
          {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

// ─── Card — minimal surface ───
function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:bg-white/[0.04] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Fallback data ───
const FALLBACK_BATCHES = [
  { id: 'BL-2602-070', volume: 8, quality: 'OK', time: '20:43', status: 'complete' },
  { id: 'BL-2602-073', volume: 12, quality: 'OK', time: '19:15', status: 'complete' },
  { id: 'BL-2602-067', volume: 8, quality: 'VAR', time: '18:30', status: 'variance' },
  { id: 'BL-2602-065', volume: 10, quality: 'OK', time: '17:45', status: 'complete' },
  { id: 'BL-2602-068', volume: 8, quality: 'OK', time: '16:20', status: 'complete' },
];

const FALLBACK_STOCK = [
  { name: 'Ciment', current: 7200, max: 10000, unit: 'kg' },
  { name: 'Adjuvant', current: 320, max: 500, unit: 'L' },
  { name: 'Gravette', current: 85000, max: 120000, unit: 'kg' },
  { name: 'Sable', current: 45000, max: 80000, unit: 'kg' },
  { name: 'Eau', current: 14000, max: 20000, unit: 'L' },
];

const EMPTY_AR = [
  { label: '0-30j', value: 32000 },
  { label: '31-60j', value: 18000 },
  { label: '61-90j', value: 12000 },
  { label: '>90j', value: 15000 },
];

const EMPTY_CASHFLOW = Array.from({ length: 30 }, (_, i) => ({
  day: i % 5 === 4 ? `J${i + 1}` : '',
  fullDay: `J${i + 1}`,
  actuel: 520000 + Math.sin(i * 0.3) * 15000 + i * 1200,
  projete: 530000 + Math.sin(i * 0.3) * 12000 + i * 1500,
}));

// AR gold opacities for monochrome aging
const AR_OPACITIES = [0.8, 0.5, 0.3, 0.15];

// ─── Live Data Hook ───
function useWorldClassLiveData() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const [stockData, setStockData] = useState(FALLBACK_STOCK);
  const [arAgingData, setArAgingData] = useState(EMPTY_AR);
  const [recentBatches, setRecentBatches] = useState(FALLBACK_BATCHES);
  const [cashFlowData, setCashFlowData] = useState(EMPTY_CASHFLOW);
  const [hourlyProductionData, setHourlyProductionData] = useState<{ hour: string; volume: number }[]>([]);
  const [qualityData, setQualityData] = useState([{ day: "Aujourd'hui", ok: 12, var: 2, crit: 0 }]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');

      const [stocksRes, arRes, batchesRes, cashInRes, cashOutRes, blTodayRes] = await Promise.all([
        supabase.from('stocks').select('materiau, quantite_actuelle, seuil_alerte, capacite_max, unite'),
        supabase.from('clients').select('solde_du, created_at').gt('solde_du', 0),
        supabase.from('bons_livraison_reels')
          .select('bl_id, volume_m3, quality_status, date_livraison, created_at, formule_id, affaissement_conforme')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('factures').select('total_ttc, date_facture').gte('date_facture', thirtyDaysAgo),
        supabase.from('depenses').select('montant, date_depense').gte('date_depense', thirtyDaysAgo),
        supabase.from('bons_livraison_reels')
          .select('volume_m3, created_at, quality_status, affaissement_conforme')
          .gte('date_livraison', todayStr),
      ]);

      if (stocksRes.data?.length) {
        setStockData(stocksRes.data.map(s => ({
          name: s.materiau || 'Inconnu',
          current: s.quantite_actuelle || 0,
          max: s.capacite_max || (s.quantite_actuelle || 0) * 2 || 10000,
          unit: s.unite || 'kg',
        })));
      }

      if (arRes.data?.length) {
        const now = Date.now();
        const buckets = { '0-30j': 0, '31-60j': 0, '61-90j': 0, '>90j': 0 };
        arRes.data.forEach(c => {
          const age = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
          const amount = c.solde_du || 0;
          if (age <= 30) buckets['0-30j'] += amount;
          else if (age <= 60) buckets['31-60j'] += amount;
          else if (age <= 90) buckets['61-90j'] += amount;
          else buckets['>90j'] += amount;
        });
        const hasData = Object.values(buckets).some(v => v > 0);
        if (hasData) {
          setArAgingData([
            { label: '0-30j', value: Math.round(buckets['0-30j']) },
            { label: '31-60j', value: Math.round(buckets['31-60j']) },
            { label: '61-90j', value: Math.round(buckets['61-90j']) },
            { label: '>90j', value: Math.round(buckets['>90j']) },
          ]);
        }
      }

      if (batchesRes.data?.length) {
        const mapped = batchesRes.data.map(b => {
          const isVar = b.quality_status === 'non_conforme' || b.affaissement_conforme === false;
          return {
            id: b.bl_id,
            status: isVar ? 'variance' : 'complete',
            volume: b.volume_m3 || 0,
            quality: isVar ? 'VAR' : 'OK',
            time: b.created_at ? format(new Date(b.created_at), 'HH:mm') : '—',
          };
        });
        if (mapped.length > 0) setRecentBatches(mapped);
      }

      if (cashInRes.data || cashOutRes.data) {
        const dayMap: Record<string, { actuel: number }> = {};
        for (let i = 0; i < 30; i++) {
          dayMap[format(subDays(today, 29 - i), 'yyyy-MM-dd')] = { actuel: 0 };
        }
        cashInRes.data?.forEach(f => {
          const d = (f as any).date_facture;
          if (dayMap[d]) dayMap[d].actuel += (f as any).total_ttc || 0;
        });
        cashOutRes.data?.forEach(dep => {
          if (dayMap[dep.date_depense]) dayMap[dep.date_depense].actuel -= dep.montant || 0;
        });
        let cum = 0;
        const hasRealData = Object.values(dayMap).some(v => v.actuel !== 0);
        if (hasRealData) {
          const cfData = Object.entries(dayMap).map(([, val], i) => {
            cum += val.actuel;
            return { day: i % 5 === 4 ? `J${i + 1}` : '', fullDay: `J${i + 1}`, actuel: Math.round(cum), projete: Math.round(cum * 1.08) };
          });
          setCashFlowData(cfData);
        }
      }

      if (blTodayRes.data?.length) {
        const hourBuckets: Record<string, number> = {};
        for (let h = 6; h <= 18; h++) hourBuckets[`${h.toString().padStart(2, '0')}h`] = 0;
        blTodayRes.data.forEach(bl => {
          if (bl.created_at) {
            const hour = `${new Date(bl.created_at).getHours().toString().padStart(2, '0')}h`;
            if (hourBuckets[hour] !== undefined) hourBuckets[hour] += bl.volume_m3 || 0;
          }
        });
        setHourlyProductionData(Object.entries(hourBuckets).map(([hour, volume]) => ({ hour, volume: Math.round(volume) })));
        const okCount = blTodayRes.data.filter(b => b.quality_status === 'conforme' || b.affaissement_conforme).length;
        const varCount = blTodayRes.data.filter(b => b.quality_status === 'non_conforme' || b.affaissement_conforme === false).length;
        if (okCount > 0 || varCount > 0) {
          setQualityData([{ day: "Aujourd'hui", ok: okCount, var: varCount, crit: 0 }]);
        }
      }
    } catch (err) {
      console.error('WorldClassDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase.channel('wc-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { stats, statsLoading, stockData, arAgingData, recentBatches, cashFlowData, hourlyProductionData, qualityData, loading };
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT — Operations Zone
// ═══════════════════════════════════════════════════════
export function WorldClassDashboard() {
  const {
    stats, stockData, arAgingData, recentBatches: batches,
    cashFlowData, hourlyProductionData, qualityData, loading,
  } = useWorldClassLiveData();

  const totalCashIn = cashFlowData.length ? cashFlowData[cashFlowData.length - 1]?.actuel || 0 : 0;
  const totalAR = useAnimatedCounter(Math.round(arAgingData.reduce((s, d) => s + d.value, 0) / 1000) || 77);
  const prodTotal = useAnimatedCounter(Math.round(stats.totalVolume) || 851);

  // Production chart data fallback
  const prodChartData = hourlyProductionData.length ? hourlyProductionData : [
    { hour: '06h', volume: 12 }, { hour: '07h', volume: 28 }, { hour: '08h', volume: 65 },
    { hour: '09h', volume: 82 }, { hour: '10h', volume: 95 }, { hour: '11h', volume: 78 },
    { hour: '12h', volume: 45 }, { hour: '13h', volume: 68 }, { hour: '14h', volume: 110 },
    { hour: '15h', volume: 98 }, { hour: '16h', volume: 85 }, { hour: '17h', volume: 72 },
    { hour: '18h', volume: 38 },
  ];

  return (
    <div className="overflow-x-hidden max-w-full w-full" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: T.textPri }}>

      <style>{`
        @keyframes tbos-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tbos-bar-grow { from { width: 0%; } }
        .tbos-card-enter { animation: tbos-fade-up 600ms ease-out forwards; }
        .tbos-bar-animate { animation: tbos-bar-grow 1200ms cubic-bezier(0.4,0,0.2,1) forwards; }
        @media (max-width: 768px) {
          .tbos-grid-2col, .tbos-grid-3col { grid-template-columns: 1fr !important; }
          .tbos-grid-batches { grid-template-columns: repeat(5, 75vw) !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .tbos-grid-batches::-webkit-scrollbar { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: 1600, margin: '0 auto' }}>

        {/* ═══ COLUMN 1/2/3 GRID ═══ */}
        <div className="tbos-grid-3col grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5" style={{ alignItems: 'start' }}>

          {/* ─── Col 1: Production & Quality ─── */}
          <div className="space-y-5">
            {/* Daily Production Chart */}
            <Card className="tbos-card-enter" style={{ height: 280 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="text-sm font-medium text-white/90">Production Journalière</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {qualityData[0].ok} OK · {qualityData[0].var} Var · {qualityData[0].crit} Crit
                  </div>
                </div>
                <span className="text-[2rem] font-extralight text-white tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>{prodTotal} <span className="text-lg text-slate-400">m³</span></span>
              </div>
              <div className="overflow-hidden w-full" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prodChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="prodGold2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity={0.4} />
                        <stop offset="40%" stopColor="rgb(234, 179, 8)" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="rgb(234, 179, 8)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fill: T.textFaint, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={(p) => <CleanTooltip {...p} unit=" m³" />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="volume" stroke={T.gold} strokeWidth={2} fill="url(#prodGold2)" dot={false} activeDot={{ r: 3, fill: T.gold, stroke: 'none' }} animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Derniers Batches */}
            <Card className="tbos-card-enter">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-[pulse-subtle_3s_ease-in-out_infinite]" />
                <span className="text-sm font-medium text-white/90">Derniers Batches</span>
              </div>
              <div className="tbos-grid-batches" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {batches.map((b, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3" style={{
                    borderLeft: `2px solid ${b.quality === 'OK' ? T.dotOk : T.dotWarn}`,
                  }}>
                    <div className="text-[9px] text-slate-500 tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>{b.id}</div>
                    <div className="text-base font-extralight text-white tabular-nums mt-1" style={{ fontFamily: 'Inter, system-ui' }}>{b.volume} m³</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span className={`text-[10px] ${b.quality === 'OK' ? 'text-slate-500' : 'text-amber-400/70'}`}>{b.quality}</span>
                      <span className="text-[9px] text-slate-500 tabular-nums">{b.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ─── Col 2: Stock & Pipeline ─── */}
          <div className="space-y-5">
            {/* Stock Levels */}
            <Card className="tbos-card-enter">
              <div className="text-sm font-medium text-white/90 mb-4">Niveaux de Stock</div>
              <div className="flex flex-col gap-3">
                {stockData.map((s, i) => {
                  const pct = (s.current / s.max) * 100;
                  const opacity = pct > 50 ? 0.8 : pct > 20 ? 0.5 : 0.25;
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1 gap-2">
                        <span className="text-[11px] text-slate-500">{s.name}</span>
                        <span className="text-sm font-normal tabular-nums text-slate-300" style={{ fontFamily: 'Inter, system-ui' }}>
                          {s.current.toLocaleString('fr-FR')} / {s.max.toLocaleString('fr-FR')} {s.unit}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-700/30 overflow-hidden">
                        <div className="tbos-bar-animate h-full rounded-full" style={{ width: `${pct}%`, background: T.gold, opacity }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Pipeline Commercial */}
            <Card className="tbos-card-enter">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-white/90">Pipeline Commercial</span>
                <span className="text-[11px] text-slate-400">67% conv.</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Devis', value: '3', width: '100%' },
                  { label: 'BCs Actifs', value: '2', width: '65%' },
                  { label: 'En attente', value: '45K DH', width: '35%' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-slate-500">{item.label}</span>
                      <span className="text-[11px] text-slate-300 tabular-nums">{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-700/30 overflow-hidden">
                      <div className="tbos-bar-animate h-full rounded-full" style={{ width: item.width, background: T.gold, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4 pt-4 border-t border-white/[0.05]">
                <div className="text-3xl font-extralight text-white tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>67%</div>
                <div className="text-[11px] text-slate-500 mt-1">Taux de conversion</div>
              </div>
            </Card>

            {/* Tendances */}
            <Card className="tbos-card-enter">
              <div className="text-sm font-medium text-white/90 mb-4">Tendances</div>
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="text-3xl font-extralight text-primary tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>+8.2%</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">vs Janvier</div>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { label: 'CA', value: '75K' },
                  { label: 'Marge', value: '49%' },
                  { label: 'Volume', value: `${prodTotal} m³` },
                ].map((m, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 text-center">
                    <div className="text-sm font-normal text-white tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>{m.value}</div>
                    <div className="text-[9px] text-slate-500 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* AI Insights section */}
              <div className="border-t border-white/[0.05] mt-4 pt-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <span style={{ color: T.gold, fontSize: 10 }}>✦</span>
                  <span className="text-[11px] font-medium text-white/90">AI Insights</span>
                  <span className="text-[9px] text-slate-500">21:52</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { dot: T.dotOk, text: 'Marge brute saine à 49.9% malgré un CA faible ce mois-ci.' },
                    { dot: T.dotWarn, text: 'Prix moyen (112 MAD/m³) inférieur au seuil de 600 MAD/m³.' },
                    { dot: '#60A5FA', text: 'Diversifier le portefeuille client: seulement 3 clients actifs.' },
                    { dot: T.dotOk, text: 'Taux de recouvrement excellent à 91%.' },
                  ].map((insight, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: insight.dot }} />
                      <span className="text-slate-400">{insight.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ─── Col 3: Créances & Deliveries ─── */}
          <div className="space-y-5">
            {/* Créances par ancienneté */}
            <Card className="tbos-card-enter">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-medium text-white/90 mb-0.5">Créances Clients</div>
                  <div className="text-[11px] text-slate-500">Vieillissement des créances</div>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mt-1.5" />
              </div>
              <div className="overflow-hidden w-full" style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={arAgingData} layout="vertical" barSize={14} margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" tick={{ fill: T.textDim, fontSize: 10, fontFamily: 'Inter, system-ui' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={(p) => <CleanTooltip {...p} unit=" DH" />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]} animationDuration={1000}>
                      {arAgingData.map((_, i) => <Cell key={i} fill={T.gold} fillOpacity={AR_OPACITIES[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.05]">
                <div>
                  <span className="text-xl font-extralight text-white tabular-nums" style={{ fontFamily: 'Inter, system-ui' }}>{totalAR}K</span>
                  <span className="text-[11px] text-slate-500 ml-1.5">DH total</span>
                </div>
                <div className="flex gap-2">
                  {arAgingData.map((d, i) => (
                    <span key={i} className="text-[9px] text-slate-500">{d.label}</span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Recent Deliveries */}
            <RecentDeliveries />

            {/* Quality feed */}
            <Card className="tbos-card-enter">
              <div className="text-sm font-medium text-white/90 mb-4">Contrôle Qualité</div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'BL-2602-070', test: 'Slump 18cm', ok: true, time: '20:41' },
                  { id: 'BL-2602-067', test: 'Slump 22cm', ok: false, time: '18:28' },
                  { id: 'BL-2602-073', test: 'Slump 17cm', ok: true, time: '19:13' },
                ].map((q, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors duration-200">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${q.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-[11px] text-slate-400 tabular-nums flex-1" style={{ fontFamily: 'Inter, system-ui' }}>{q.id}</span>
                    <span className="text-[11px] text-slate-500">{q.test}</span>
                    <span className={`text-[10px] ${q.ok ? 'text-slate-400' : 'text-amber-400/70'}`}>{q.ok ? 'OK' : 'Variance'}</span>
                    <span className="text-[9px] text-slate-500 tabular-nums">{q.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
