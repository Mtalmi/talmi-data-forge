import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  Zap, Factory, Banknote, Settings, ChevronRight, Bell,
  TrendingUp, TrendingDown, Camera, BarChart3, Truck, Shield,
  FlaskConical, Users, Package, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS (exact hex values per spec)
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldDim:    'rgba(255,215,0,0.15)',
  goldGlow:   'rgba(255,215,0,0.25)',
  goldBorder: 'rgba(255,215,0,0.3)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 800) {
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

// ─────────────────────────────────────────────────────
// SHARED TOOLTIP
// ─────────────────────────────────────────────────────
function GoldTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A2540', border: `1px solid ${T.gold}`, borderRadius: 10,
      padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || T.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
          {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PREMIUM CARD wrapper
// ─────────────────────────────────────────────────────
function Card({ children, className = '', style = {}, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className={className}
      style={{
        background: T.cardBg,
        border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transform: pressed ? 'translateY(-1px) scale(0.995)' : hovered ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hovered
          ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}`
          : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      {/* Gold top line on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${T.gold} 50%, transparent 100%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 200ms',
      }} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// STATUS BADGE with pulse
// ─────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
      letterSpacing: '0.05em', animation: 'tbos-pulse 2.5s infinite',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        display: 'inline-block',
      }} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{
        color: T.gold, fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40 0%, transparent 80%)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec,
    }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// FALLBACK DATA (used while loading)
// ─────────────────────────────────────────────────────
const EMPTY_CASHFLOW = Array.from({ length: 30 }, (_, i) => ({
  day: i % 5 === 4 ? `J${i + 1}` : '',
  fullDay: `J${i + 1}`,
  actuel: 0,
  projete: 0,
}));

const EMPTY_AR = [
  { label: '0-30j', value: 0, fill: T.success },
  { label: '31-60j', value: 0, fill: T.warning },
  { label: '61-90j', value: 0, fill: '#F97316' },
  { label: '>90j', value: 0, fill: T.danger },
];

const modules = [
  { icon: Factory, title: 'Production', desc: 'Batches, recettes, planning', color: T.gold, count: '—' },
  { icon: Truck, title: 'Logistique', desc: 'Livraisons, stock, transport', color: T.info, count: '—' },
  { icon: Banknote, title: 'Finances', desc: 'Factures, paiements, trésorerie', color: T.success, count: '—' },
  { icon: FlaskConical, title: 'Laboratoire', desc: 'Tests qualité, conformité', color: '#8B5CF6', count: '—' },
  { icon: Shield, title: 'Sécurité', desc: 'Incidents, EPI, formations', color: T.warning, count: '—' },
  { icon: Users, title: 'Équipe', desc: 'Présence, planning, tâches', color: '#EC4899', count: '—' },
];

// ─────────────────────────────────────────────────────
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function useWorldClassLiveData() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const [stockData, setStockData] = useState<{ name: string; current: number; max: number; unit: string }[]>([]);
  const [arAgingData, setArAgingData] = useState(EMPTY_AR);
  const [recentBatches, setRecentBatches] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState(EMPTY_CASHFLOW);
  const [hourlyProductionData, setHourlyProductionData] = useState<{ hour: string; volume: number }[]>([]);
  const [qualityData, setQualityData] = useState<{ day: string; ok: number; var: number; crit: number }[]>([]);
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
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('factures').select('total_ttc, date_facture')
          .gte('date_facture', thirtyDaysAgo),
        supabase.from('depenses').select('montant, date_depense')
          .gte('date_depense', thirtyDaysAgo),
        supabase.from('bons_livraison_reels')
          .select('volume_m3, created_at, quality_status, affaissement_conforme')
          .gte('date_livraison', todayStr),
      ]);

      // Stock levels
      if (stocksRes.data?.length) {
        setStockData(stocksRes.data.map(s => ({
          name: s.materiau || 'Inconnu',
          current: s.quantite_actuelle || 0,
          max: s.capacite_max || (s.quantite_actuelle || 0) * 2 || 10000,
          unit: s.unite || 'kg',
        })));
      }

      // AR aging buckets
      if (arRes.data?.length) {
        const now = Date.now();
        const buckets = { '0-30j': 0, '31-60j': 0, '61-90j': 0, '>90j': 0 };
        arRes.data.forEach(c => {
          const age = Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
          const amount = c.solde_du || 0;
          if (age <= 30) buckets['0-30j'] += amount;
          else if (age <= 60) buckets['31-60j'] += amount;
          else if (age <= 90) buckets['61-90j'] += amount;
          else buckets['>90j'] += amount;
        });
        setArAgingData([
          { label: '0-30j', value: Math.round(buckets['0-30j']), fill: T.success },
          { label: '31-60j', value: Math.round(buckets['31-60j']), fill: T.warning },
          { label: '61-90j', value: Math.round(buckets['61-90j']), fill: '#F97316' },
          { label: '>90j', value: Math.round(buckets['>90j']), fill: T.danger },
        ]);
      }

      // Recent batches
      if (batchesRes.data?.length) {
        setRecentBatches(batchesRes.data.map(b => ({
          id: b.bl_id,
          status: b.quality_status === 'conforme' || b.affaissement_conforme ? 'complete' : 'variance',
          volume: b.volume_m3 || 0,
          quality: b.quality_status === 'conforme' || b.affaissement_conforme ? 'OK' : 'VAR',
          time: b.created_at ? format(new Date(b.created_at), 'HH:mm') : '—',
        })));
      }

      // Cash flow (30 days)
      if (cashInRes.data || cashOutRes.data) {
        const dayMap: Record<string, { actuel: number; projete: number }> = {};
        for (let i = 0; i < 30; i++) {
          const d = format(subDays(today, 29 - i), 'yyyy-MM-dd');
          dayMap[d] = { actuel: 0, projete: 0 };
        }
        cashInRes.data?.forEach(f => {
          const d = (f as any).date_facture;
          if (dayMap[d]) dayMap[d].actuel += (f as any).total_ttc || 0;
        });
        cashOutRes.data?.forEach(dep => {
          const d = dep.date_depense;
          if (dayMap[d]) dayMap[d].actuel -= dep.montant || 0;
        });
        let cumulative = 0;
        const cfData = Object.entries(dayMap).map(([date, val], i) => {
          cumulative += val.actuel;
          return {
            day: i % 5 === 4 ? `J${i + 1}` : '',
            fullDay: `J${i + 1}`,
            actuel: Math.round(cumulative),
            projete: Math.round(cumulative * 1.08),
          };
        });
        setCashFlowData(cfData);
      }

      // Hourly production (today)
      if (blTodayRes.data?.length) {
        const hourBuckets: Record<string, number> = {};
        for (let h = 6; h <= 18; h++) hourBuckets[`${h.toString().padStart(2, '0')}h`] = 0;
        blTodayRes.data.forEach(bl => {
          if (bl.created_at) {
            const hour = `${new Date(bl.created_at).getHours().toString().padStart(2, '0')}h`;
            if (hourBuckets[hour] !== undefined) hourBuckets[hour] += bl.volume_m3 || 0;
          }
        });
        setHourlyProductionData(Object.entries(hourBuckets).map(([hour, volume]) => ({
          hour, volume: Math.round(volume),
        })));

        // Quality data from today's BLs
        const okCount = blTodayRes.data.filter(b => b.quality_status === 'conforme' || b.affaissement_conforme).length;
        const varCount = blTodayRes.data.filter(b => b.quality_status === 'non_conforme' || (b.affaissement_conforme === false)).length;
        setQualityData([{ day: "Aujourd'hui", ok: okCount, var: varCount, crit: 0 }]);
      }

    } catch (err) {
      console.error('WorldClassDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('wc-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { stats, statsLoading, stockData, arAgingData, recentBatches, cashFlowData, hourlyProductionData, qualityData, loading };
}

// ─────────────────────────────────────────────────────
// KPI ANIMATED CARD
// ─────────────────────────────────────────────────────
function KpiBox({ label, value, unit = '', color = T.gold, icon, delay = 0 }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 600ms ease-out',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {icon && <div style={{ marginBottom: 2 }}>{icon}</div>}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 800, fontSize: 24, color,
        lineHeight: 1,
      }}>{value}<span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{unit}</span></span>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: T.textSec }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export function WorldClassDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'finance'>('overview');
  const {
    stats, statsLoading,
    stockData: liveStockData, arAgingData, recentBatches,
    cashFlowData, hourlyProductionData, qualityData, loading,
  } = useWorldClassLiveData();

  // Use live data or fallback
  const stockData = liveStockData.length ? liveStockData : [
    { name: 'Ciment', current: 0, max: 10000, unit: 'kg' },
    { name: 'Adjuvant', current: 0, max: 500, unit: 'L' },
    { name: 'Gravette', current: 0, max: 120000, unit: 'kg' },
    { name: 'Eau', current: 0, max: 20000, unit: 'L' },
  ];
  const batches = recentBatches.length ? recentBatches : [];

  // Compliance data (static fiscal calendar — no DB table for this yet)
  const complianceData = [
    { name: 'TVA Déclaration', amount: 12450, due: '15 Fév', status: 'overdue' },
    { name: 'CNSS Cotisation', amount: 8200, due: '10 Fév', status: 'overdue' },
    { name: 'IR Mensuel', amount: 3100, due: '28 Fév', status: 'upcoming' },
    { name: 'Taxe Professionnelle', amount: 5600, due: '15 Mars', status: 'ok' },
  ];

  // Animated counters from LIVE stats
  const totalCashIn = cashFlowData.length ? cashFlowData[cashFlowData.length - 1]?.actuel || 0 : 0;
  const solde = useAnimatedCounter(Math.round(totalCashIn / 1000) || 0);
  const finMois = useAnimatedCounter(Math.round((totalCashIn * 1.08) / 1000) || 0);
  const entrees = useAnimatedCounter(Math.round(stats.totalVolume * (stats.curMoyen7j || 0) / 1000) || 0);
  const sorties = useAnimatedCounter(Math.round(stats.pendingPaymentsTotal / 1000) || 0);
  const totalAR = useAnimatedCounter(Math.round(arAgingData.reduce((s, d) => s + d.value, 0) / 1000) || 0);
  const budgetGaugePct = useAnimatedCounter(0);
  const prodTotal = useAnimatedCounter(Math.round(stats.totalVolume) || 0);

  const getStockColor = (current: number, max: number) => {
    const pct = current / max;
    if (pct > 0.7) return T.success;
    if (pct > 0.4) return T.warning;
    return T.danger;
  };

  return (
    <div className="overflow-x-hidden max-w-full w-full" style={{
      fontFamily: 'DM Sans, sans-serif',
      color: T.textPri,
      minHeight: '100vh',
    }}>

      {/* ── CSS ANIMATIONS ───────────────────────────────── */}
      <style>{`
        @keyframes tbos-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes tbos-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tbos-bar-grow {
          from { width: 0%; }
        }
        .tbos-card-enter { animation: tbos-fade-up 600ms ease-out forwards; }
        .tbos-bar-animate { animation: tbos-bar-grow 1200ms cubic-bezier(0.4,0,0.2,1) forwards; }
        
        /* Mobile responsive overrides */
        @media (max-width: 768px) {
          .tbos-grid-2col,
          .tbos-grid-3col,
          .tbos-grid-modules,
          .tbos-grid-finance { grid-template-columns: 1fr !important; }
          .tbos-cashflow-metrics { grid-template-columns: 1fr 1fr !important; }
          .tbos-grid-batches {
            grid-template-columns: repeat(5, 75vw) !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 8px;
          }
          .tbos-grid-batches::-webkit-scrollbar { display: none; }
          .tbos-trends-metrics { grid-template-columns: 1fr 1fr !important; }
          .tbos-trends-metrics > :last-child { grid-column: 1 / -1; }
          .tbos-compliance-row {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
          .tbos-compliance-row > * {
            min-width: 0 !important;
            flex-shrink: 1 !important;
          }
          .tbos-budget-metrics { grid-template-columns: 1fr 1fr !important; }
          .tbos-budget-metrics > :last-child { grid-column: 1 / -1; }
          .tbos-ar-pills { flex-wrap: wrap !important; gap: 4px !important; }
          .tbos-dashboard-wrap {
            padding: 12px 12px 100px !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
        }
      `}</style>

      {/* Sticky header removed — handled by global TopNavBar */}

      <div className="tbos-dashboard-wrap overflow-x-hidden max-w-full w-full" style={{ padding: '24px 24px 40px', maxWidth: 1600, margin: '0 auto' }}>

        {/* ══════════════════════════════════════════
            SECTION 1 — PERFORMANCE & KPIs
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Zap} label="Performance & KPIs" />

        <div className="tbos-stagger-enter tbos-grid-2col grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* 1.1 Cash-Flow Time Machine */}
          <Card style={{ gridColumn: '1', animationDelay: '0ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 2 }}>Machine Cash-Flow</div>
                <div style={{ fontSize: 11, color: T.textDim }}>30 jours · Actuel vs Projeté</div>
              </div>
              <Badge label="Sain" color={T.success} bg={`${T.success}20`} />
            </div>

            <div className="overflow-hidden w-full" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="grayFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.textSec} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={T.textSec} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: T.textDim, fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${Math.round(v / 1000)}K`} tick={{ fill: T.textDim, fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={38} domain={[540000, 640000]} />
                  <Tooltip content={(p) => <GoldTooltip {...p} unit=" DH" />} />
                  <Area type="monotone" dataKey="projete" stroke={T.textSec} strokeWidth={1.5} strokeDasharray="4 3" fill="url(#grayFill)" dot={false} animationDuration={1200} name="Projeté" />
                  <Area type="monotone" dataKey="actuel" stroke={T.gold} strokeWidth={2.5} fill="url(#goldFill)" dot={false} animationDuration={1000} name="Actuel" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="tbos-cashflow-metrics grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 w-full">
              {[
                { label: 'Solde Actuel', value: `${solde}K DH`, color: T.gold },
                { label: 'Fin de Mois', value: `${finMois}K DH`, color: T.textPri },
                { label: 'Entrées Prévues', value: `+${entrees}K DH`, color: T.success },
                { label: 'Sorties Prévues', value: `-${sorties}K DH`, color: T.danger },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 1.2 AR Aging */}
          <Card style={{ animationDelay: '80ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 2 }}>Créances Clients</div>
                <div style={{ fontSize: 11, color: T.textDim }}>Vieillissement des créances</div>
              </div>
              <Badge label="Bon état" color={T.success} bg={`${T.success}20`} />
            </div>

            <div className="overflow-hidden w-full" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arAgingData} layout="vertical" barSize={18} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
                  <YAxis type="category" dataKey="label" tick={{ fill: T.textSec, fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={(p) => <GoldTooltip {...p} unit=" DH" />} cursor={{ fill: 'rgba(255,215,0,0.04)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1000} animationEasing="ease-out">
                    {arAgingData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.cardBorder}` }}>
              <div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 22, color: T.gold }}>{totalAR}K</span>
                <span style={{ fontSize: 11, color: T.textDim, marginLeft: 4 }}>DH total</span>
              </div>
              <div className="tbos-ar-pills" style={{ display: 'flex', gap: 6 }}>
                {arAgingData.map((d, i) => (
                  <span key={i} style={{ padding: '2px 8px', borderRadius: 999, background: `${d.fill}20`, color: d.fill, fontSize: 9, fontWeight: 700, border: `1px solid ${d.fill}30` }}>
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Row 2: Stock + Pipeline + Trends */}
        <div className="tbos-stagger-enter tbos-grid-3col grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          {/* 1.3 Stock Levels */}
          <Card style={{ animationDelay: '160ms' }} className="tbos-card-enter">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Niveaux de Stock</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stockData.map((s, i) => {
                const pct = (s.current / s.max) * 100;
                const color = getStockColor(s.current, s.max);
                return (
                  <div key={i} style={{ opacity: 0, animation: `tbos-fade-up 600ms ease-out ${200 + i * 80}ms forwards` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: T.textSec, flexShrink: 0 }}>{s.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textPri, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {s.current.toLocaleString('fr-FR')} / {s.max.toLocaleString('fr-FR')} {s.unit}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        className="tbos-bar-animate"
                        style={{
                          height: '100%', width: `${pct}%`, borderRadius: 999,
                          background: color, boxShadow: `0 0 8px ${color}60`,
                          animationDelay: `${300 + i * 80}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 1.4 Sales Pipeline Funnel */}
          <Card style={{ animationDelay: '240ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Pipeline Commercial</div>
              <Badge label="0% conv." color={T.danger} bg={`${T.danger}15`} />
            </div>

            {/* Funnel bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Devis', value: 0, color: T.warning, width: '100%', delay: 400 },
                { label: 'BCs Actifs', value: 0, color: T.info, width: '65%', delay: 550 },
                { label: 'En attente', value: '0K DH', color: T.success, width: '35%', delay: 700 },
              ].map((item, i) => (
                <div key={i} style={{ opacity: 0, animation: `tbos-fade-up 600ms ease-out ${item.delay}ms forwards` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec }}>{item.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: item.color }}>{item.value}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      className="tbos-bar-animate"
                      style={{
                        height: '100%', width: item.width, borderRadius: 999,
                        background: item.color, boxShadow: `0 0 8px ${item.color}60`,
                        animationDelay: `${item.delay}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Big conversion rate */}
            <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.cardBorder}` }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 800, color: T.danger, lineHeight: 1 }}>0%</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>Taux de conversion</div>
            </div>
          </Card>

          {/* 1.5 Trends */}
          <Card style={{ animationDelay: '320ms' }} className="tbos-card-enter">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tendances</div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 42, fontWeight: 800, color: T.textDim, lineHeight: 1 }}>+0.0%</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>vs Janvier</div>
            </div>

            <div className="tbos-trends-metrics grid grid-cols-2 md:grid-cols-3 gap-2 w-full">
              {[
                { label: 'CA', value: '0K', color: T.textDim },
                { label: 'Marge', value: '0%', color: T.textDim },
                { label: 'Volume', value: `${prodTotal} m³`, color: T.success, icon: <TrendingUp size={12} color={T.success} /> },
              ].map((m, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.cardBorder}`,
                  borderRadius: 8, padding: '8px', textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    {m.icon}
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: m.color }}>{m.value}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 2 — PRODUCTION & QUALITÉ
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Factory} label="Production & Qualité" />

        <div className="tbos-stagger-enter tbos-grid-2col grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* 2.1 Daily Production */}
          <Card style={{ animationDelay: '0ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Production Journalière</div>
                  <Badge label="Peak 14h" color={T.warning} bg={`${T.warning}20`} />
                </div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>Volumes par heure</div>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 20, color: T.gold }}>{prodTotal} m³</span>
            </div>
            <div className="overflow-hidden w-full" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyProductionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prodGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={(p) => <GoldTooltip {...p} unit=" m³" />} />
                  <ReferenceLine x="14h" stroke={`${T.gold}50`} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="volume" stroke={T.gold} strokeWidth={2.5} fill="url(#prodGold)"
                    dot={{ r: 3, fill: T.gold, stroke: '#111B2E', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: T.gold, stroke: '#111B2E', strokeWidth: 2 }}
                    animationDuration={1200} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 2.2 Quality Feed */}
          <Card style={{ animationDelay: '80ms' }} className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Qualité Hebdomadaire</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge label={`${qualityData.reduce((s, d) => s + d.ok, 0)} OK`} color={T.success} bg={`${T.success}20`} />
                <Badge label={`${qualityData.reduce((s, d) => s + d.var, 0)} Var`} color={T.warning} bg={`${T.warning}20`} />
                <Badge label={`${qualityData.reduce((s, d) => s + d.crit, 0)} Crit`} color={T.danger} bg={`${T.danger}20`} />
              </div>
            </div>
            <div className="overflow-hidden w-full" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={(p) => <GoldTooltip {...p} />} />
                  <Bar dataKey="ok" stackId="a" fill={T.success} radius={[0, 0, 0, 0]} animationDuration={1000} name="OK" />
                  <Bar dataKey="var" stackId="a" fill={T.warning} animationDuration={1000} name="Variances" />
                  <Bar dataKey="crit" stackId="a" fill={T.danger} radius={[4, 4, 0, 0]} animationDuration={1000} name="Critique" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 2.3 Live Batches */}
        <Card style={{ marginBottom: 24 }} className="tbos-card-enter">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>Derniers Batches</div>
            <Badge label="Live" color={T.success} bg={`${T.success}15`} />
          </div>
          <div className="tbos-grid-batches" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {batches.map((b, i) => (
              <div
                key={i}
                style={{
                  opacity: 0,
                  animation: `tbos-fade-up 600ms ease-out ${i * 80}ms forwards`,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${T.cardBorder}`,
                  borderLeft: `3px solid ${b.status === 'complete' ? T.success : T.warning}`,
                  borderRadius: 10, padding: 12,
                }}
              >
                <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>{b.id}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: T.gold, marginBottom: 6 }}>
                  {b.volume} m³
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                    background: b.quality === 'OK' ? `${T.success}20` : `${T.warning}20`,
                    color: b.quality === 'OK' ? T.success : T.warning,
                    border: `1px solid ${b.quality === 'OK' ? T.success : T.warning}30`,
                  }}>{b.quality}</span>
                  <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono, monospace' }}>{b.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════════════════════════════════════════
            SECTION 3 — FINANCE & TRÉSORERIE
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Banknote} label="Finance & Trésorerie" />

        <div className="tbos-stagger-enter tbos-grid-finance grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 mb-6">

          {/* 3.1 Treasury Gauge */}
          <Card className="tbos-card-enter">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Budget Mensuel</div>
            {/* SVG Semi-circle gauge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <svg width={180} height={100} viewBox="0 0 180 100">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={T.success} />
                    <stop offset="60%" stopColor={T.warning} />
                    <stop offset="100%" stopColor={T.danger} />
                  </linearGradient>
                </defs>
                {/* Track */}
                <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round" />
                {/* Fill (0%) */}
                <path d="M 10 90 A 80 80 0 0 1 10 90" fill="none" stroke="url(#gaugeGrad)" strokeWidth={14} strokeLinecap="round" />
                {/* Center text */}
                <text x="90" y="78" textAnchor="middle" fill={T.success} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800 }}>0%</text>
                <text x="90" y="94" textAnchor="middle" fill={T.textDim} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }}>Utilisé</text>
              </svg>
            </div>

            <div className="tbos-budget-metrics grid grid-cols-3 gap-2 w-full">
              {[
                { label: 'Plafond', value: '15,000', color: T.textPri },
                { label: 'Utilisé', value: '0', color: T.success },
                { label: 'Restant', value: '15,000', color: T.gold },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>{item.label} MAD</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 3.2 Tax & Social Compliance */}
          <Card className="tbos-card-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Conformité Fiscale & Sociale</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge label="2 en retard" color={T.danger} bg={`${T.danger}20`} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: T.danger }}>0%</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {complianceData.map((item, i) => {
                const statusConfig = {
                  overdue: { color: T.danger, label: 'En retard', bg: `${T.danger}10`, border: T.danger },
                  upcoming: { color: T.warning, label: 'À venir', bg: `${T.warning}10`, border: T.warning },
                  ok: { color: T.success, label: 'OK', bg: `${T.success}10`, border: T.success },
                }[item.status] || { color: T.textSec, label: item.status, bg: 'transparent', border: T.cardBorder };

                return (
                  <div
                    key={i}
                    className="tbos-compliance-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8,
                      background: statusConfig.bg,
                      border: `1px solid ${statusConfig.border}30`,
                      borderLeft: `3px solid ${statusConfig.color}`,
                      opacity: 0,
                      animation: `tbos-fade-up 600ms ease-out ${i * 80}ms forwards`,
                      transition: 'all 200ms',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                      (e.currentTarget as HTMLElement).style.background = `${statusConfig.color}15`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                      (e.currentTarget as HTMLElement).style.background = statusConfig.bg;
                    }}
                  >
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.textPri }}>{item.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.textPri }}>
                      {item.amount.toLocaleString('fr-FR')} MAD
                    </div>
                    <div style={{ fontSize: 11, color: T.textDim, width: 60, textAlign: 'right' }}>{item.due}</div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                      background: `${statusConfig.color}20`, color: statusConfig.color,
                      border: `1px solid ${statusConfig.color}30`, minWidth: 70, textAlign: 'center',
                      animation: 'tbos-pulse 2.5s infinite',
                    }}>{statusConfig.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 4 — PHOTOS (Empty State)
        ══════════════════════════════════════════ */}
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: 40 }} className="tbos-card-enter">
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={24} color={T.textDim} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Aucune photo aujourd'hui</div>
          <div style={{ fontSize: 12, color: T.textDim, maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>
            Les photos apparaîtront ici lorsque des batches seront saisis dans le système
          </div>
        </Card>

        {/* ══════════════════════════════════════════
            SECTION 5 — MODULES
        ══════════════════════════════════════════ */}
        <SectionHeader icon={Settings} label="Modules" />

        <div className="tbos-stagger-enter tbos-grid-modules grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {modules.map((m, i) => (
            <ModuleCard key={i} module={m} delay={i * 80} />
          ))}
        </div>

        {/* ══════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════ */}
        <Footer />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MODULE CARD
// ─────────────────────────────────────────────────────
function ModuleCard({ module: m, delay }: { module: typeof modules[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 18,
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transform: pressed ? 'translateY(-1px) scale(0.995)' : hovered ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 0,
        animation: `tbos-fade-up 600ms ease-out ${delay}ms forwards`,
      }}
    >
      {/* Left gold bar on hover */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: T.gold, opacity: hovered ? 1 : 0, transition: 'opacity 200ms',
        borderRadius: '14px 0 0 14px',
      }} />
      {/* Top gold line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 200ms',
      }} />

      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${m.color}15`, border: `1px solid ${m.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <m.icon size={20} color={m.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.textPri, marginBottom: 2 }}>{m.title}</div>
        <div style={{ fontSize: 11, color: T.textDim }}>{m.desc}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: m.color, marginTop: 4 }}>{m.count}</div>
      </div>

      <ChevronRight
        size={16}
        color={T.textDim}
        style={{ transform: hovered ? 'translateX(4px)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────
function Footer() {
  const [dt, setDt] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setDt(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.04)',
      paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ fontSize: 11, color: T.textDim }}>
        TBOS Dashboard v2.0 — Dernière mise à jour: {dt.toLocaleString('fr-FR')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'tbos-pulse 2.5s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Système opérationnel</span>
      </div>
    </div>
  );
}
