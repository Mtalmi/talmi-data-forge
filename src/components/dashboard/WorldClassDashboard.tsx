import { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import {
  AreaChart, Area,
  XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format, subDays } from 'date-fns';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';
import LiveBatchProgress from '@/components/dashboard/LiveBatchProgress';
import { ComplianceWidget } from '@/components/dashboard/ComplianceWidget';
import { EnergyCostAnomalyWidget } from '@/components/dashboard/EnergyCostAnomalyWidget';
import { SeasonalDemandForecasterCard } from '@/components/dashboard/SeasonalDemandForecasterCard';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS — Dark Luxury
// ─────────────────────────────────────────────────────
const T = {
  gold: '#D4AF37',
  goldBright: '#E8D5A3',
  goldDim: '#C4933B',
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
      background: 'linear-gradient(135deg, rgba(15,20,35,0.95), rgba(10,14,26,0.98))',
      border: '1px solid rgba(212,175,55,0.12)', borderRadius: 10,
      padding: '8px 14px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
    }}>
      <p style={{ color: T.textDim, fontSize: 10, marginBottom: 3 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: '#fff', fontFamily: 'Inter, system-ui', fontWeight: 300, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
          {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

// ─── Card — World-Class Frosted Glass Surface with Spring Hover ───
const Card = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; style?: React.CSSProperties }>(
  ({ children, className = '', style = {} }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden p-5 transition-all duration-500 ${className}`}
        style={{
          borderRadius: 8,
          background: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: 'none',
          ...style,
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
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// ─── Rich Tooltip with mini-chart (Datadog-style) ───
function RichTooltip({ active, payload, label, unit = '', sparkData }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15,20,35,0.97), rgba(10,14,26,0.99))',
      border: '1px solid rgba(212,175,55,0.15)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      backdropFilter: 'blur(16px)',
      minWidth: 140,
    }}>
      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'rgba(148,163,184,0.5)', marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono', fontWeight: 200, color: '#F1F5F9', letterSpacing: '-0.02em' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginLeft: 3 }}>{unit}</span>
      </div>
      {/* Mini sparkline inside tooltip */}
      {sparkData && sparkData.length > 2 && (
        <div style={{ marginTop: 6, height: 20, opacity: 0.5 }}>
          <svg width="100%" height="20" viewBox={`0 0 ${sparkData.length * 10} 20`} preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={T.gold}
              strokeWidth="1"
              points={sparkData.map((d: any, i: number) => `${i * 10},${20 - (d.volume / Math.max(...sparkData.map((s: any) => s.volume || 1))) * 18}`).join(' ')}
            />
          </svg>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.dotOk }} />
        <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', fontFamily: 'JetBrains Mono' }}>temps réel</span>
      </div>
    </div>
  );
}

// ─── Illustrated Empty State ───
function EmptyState({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))',
          border: '1px solid rgba(212,175,55,0.1)',
        }}>
          <span className="text-2xl" style={{ filter: 'grayscale(0.3)' }}>{icon}</span>
        </div>
      </div>
      <span className="text-[12px] font-medium text-white/60 mb-1">{title}</span>
      <span className="text-[10px] text-slate-600 text-center max-w-[200px]">{subtitle}</span>
    </div>
  );
}

// ─── Skeleton Shimmer for Loading States ───
function SkeletonCard({ height = 200 }: { height?: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        height,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        animation: 'shimmer-sweep 2s ease-in-out infinite',
      }} />
      <div className="p-6 space-y-4">
        <div className="h-3 rounded-full w-1/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-8 rounded-lg w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="flex gap-3 mt-6">
          <div className="h-2 rounded-full flex-1" style={{ background: 'rgba(255,255,255,0.03)' }} />
          <div className="h-2 rounded-full flex-1" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RADIAL GAUGE — Porsche Instrument Cluster
// ═══════════════════════════════════════════════════════
function HorizontalStockBar({ name, current, max, unit }: { name: string; current: number; max: number; unit: string }) {
  const pct = Math.min(Math.round((current / max) * 100), 100);

  return (
    <div className="py-2">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[11px] text-white/80">{name}</span>
        <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.5)' }}>
          {current.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.max(pct, 3)}%`,
            background: 'linear-gradient(90deg, #C4933B, #FDB913)',
            opacity: 0.7,
            boxShadow: '0 0 6px rgba(253,185,19,0.15)',
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BATCH TIMELINE — Git-style commit dots
// ═══════════════════════════════════════════════════════
function BatchTimeline({ batches }: { batches: { id: string; volume: number; quality: string; time: string; status: string }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  return (
    <div className="relative">


      
      <div className="flex items-start justify-between px-2 relative z-10">
        {batches.slice(0, 6).map((b, i) => {
          const isOk = b.quality === 'OK';
          const isHovered = hoveredIdx === i;
          const dotColor = isOk ? T.dotOk : T.dotWarn;
          
          return (
            <div
              key={i}
              className="flex flex-col items-center cursor-pointer relative"
              style={{ minWidth: 60, animation: `tbos-fade-up 0.4s cubic-bezier(0.16,1,0.3,1) ${0.08 * i + 0.2}s both` }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Dot */}
              <div className="relative">
                <div
                  className="w-[9px] h-[9px] rounded-full transition-all duration-300"
                  style={{
                    background: dotColor,
                    boxShadow: isHovered ? `0 0 12px ${dotColor}60` : `0 0 4px ${dotColor}30`,
                    transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
                {i === 0 && (
                  <div className="absolute inset-0 rounded-full" style={{ background: dotColor, animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
                )}
              </div>
              
              {/* Tooltip on hover */}
              <div
                className="mt-2 flex flex-col items-center transition-all duration-300"
                style={{ opacity: isHovered ? 1 : 0.5 }}
              >
                <span className="text-[8px] font-mono text-slate-500 tabular-nums">{b.id.slice(-7)}</span>
                <span className="text-[11px] font-extralight font-mono text-white tabular-nums mt-0.5">{b.volume}<span className="text-[8px] text-white/30">m³</span></span>
                <span className="text-[8px] font-mono tabular-nums mt-0.5" style={{ color: T.textDim }}>{b.time}</span>
              </div>
              
              {/* Expanded detail on hover */}
              {isHovered && (
                <div
                  className="absolute top-full mt-1 px-3 py-2 rounded-lg z-20 whitespace-nowrap"
                  style={{
                    background: 'rgba(15,20,35,0.95)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(12px)',
                    animation: 'tbos-fade-up 0.2s ease-out',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full" style={{ background: dotColor }} />
                    <span className="text-[9px] font-medium" style={{ color: dotColor }}>{isOk ? 'Conforme' : 'Variance'}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AI ANALYST BRIEF — Private Advisor Card
// ═══════════════════════════════════════════════════════
function AIAnalystBrief() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showReco, setShowReco] = useState(false);
  const insights = [
    { icon: '◆', text: 'Recouvrement à 91% — seuil d\'excellence maintenu.', tone: 'positive' as const },
    { icon: '◆', text: 'Marge brute 49.9% malgré CA modéré — pricing sain.', tone: 'positive' as const },
    { icon: '▲', text: 'Prix moyen 112 MAD/m³ sous le seuil cible.', tone: 'warning' as const },
    { icon: '▲', text: '3 clients actifs — risque de concentration élevé.', tone: 'critical' as const },
  ];

  useEffect(() => {
    const timers = insights.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 800 + i * 600)
    );
    const recoTimer = setTimeout(() => setShowReco(true), 800 + insights.length * 600 + 400);
    return () => { timers.forEach(clearTimeout); clearTimeout(recoTimer); };
  }, []);

  return (
      <Card className="ops-enter ops-surface-card" style={{ borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>


      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))' }}>
            <span className="text-[10px]" style={{ color: T.gold }}>✦</span>
          </div>
          <span className="text-[11px] font-medium tracking-wider uppercase" style={{ color: T.goldBright }}>Analyst Brief</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-full w-full rounded-full opacity-30" style={{ background: T.gold }} />
            <span className="relative rounded-full h-1.5 w-1.5" style={{ background: T.gold }} />
          </span>
          <span className="text-[9px] font-mono text-slate-600 tabular-nums">live</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2.5">
        {insights.map((insight, i) => {
          const color = insight.tone === 'positive' ? T.dotOk : insight.tone === 'warning' ? T.dotWarn : T.dotCrit;
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 transition-all duration-500"
              style={{
                opacity: i < visibleLines ? 1 : 0,
                transform: i < visibleLines ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full mt-[6px] shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}50` }} />
              <span className="text-[11px] leading-relaxed" style={{ color: 'rgba(148,163,184,0.8)' }}>{insight.text}</span>
            </div>
          );
        })}
      </div>
      
      {/* Recommendation — AI Advisor */}
      <div
        className="mt-4 pt-3 transition-all duration-700"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          opacity: showReco ? 1 : 0,
          transform: showReco ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        <div className="flex items-start gap-2">
          <span className="text-sm mt-0.5">💡</span>
          <div>
            <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: T.dotWarn }}>Recommandation</span>
            <p className="mt-1" style={{ color: 'rgba(148,163,184,0.7)', fontSize: '12.5px', lineHeight: 1.5 }}>
              Relancez les devis DEV-2602-316 et DEV-2602-895 pour diversifier le portefeuille client avant fin de mois.
            </p>
          </div>
        </div>
      </div>

      {/* Blinking cursor at end */}
      {visibleLines < insights.length && (
        <div className="ml-4 mt-1 w-[6px] h-[14px] rounded-sm" style={{ background: T.gold, opacity: 0.6, animation: 'blink 1s step-end infinite' }} />
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════
// PIPELINE FUNNEL — Horizontal Stepped Funnel
// ═══════════════════════════════════════════════════════
function PipelineFunnel() {
  const stages = [
    { label: 'Devis', value: 6, pct: 100 },
    { label: 'BC Validés', value: 3, pct: 50 },
    { label: 'Production', value: 0, pct: 0 },
    { label: 'Facturé', value: 1, pct: 17 },
  ];

  return (
    <Card className="ops-enter ops-surface-card" style={{ borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>


      <div className="flex justify-between items-center mb-5">
        <span className="text-[14px] font-medium text-white/90">Pipeline</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200, fontSize: '1.75rem', color: 'white', textShadow: '0 0 25px rgba(253,185,19,0.15)' }}>50<span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}>%</span></span>
      </div>
      
      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {stages.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5" style={{ opacity: s.value === 0 ? 0.25 : 1, transition: 'opacity 0.3s ease' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 300, fontSize: '1.5rem', color: 'white' }}>{s.value}</span>
            <div
              className="w-full rounded-sm transition-all duration-1000"
              style={{
                height: `${s.pct * 0.6}px`,
                background: `linear-gradient(180deg, ${T.gold}${Math.round(0.15 + (1 - i/stages.length) * 0.45).toString(16).padStart(2,'0').slice(-2)}, ${T.gold}08)`,
                border: `1px solid ${T.gold}${Math.round(0.06 + (1 - i/stages.length) * 0.12).toString(16).padStart(2,'0').slice(-2)}`,
                animation: `tbos-bar-grow 1s cubic-bezier(0.4,0,0.2,1) ${0.15 * i}s both`,
              }}
            />
            <span style={{ fontSize: '8px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(148,163,184,0.4)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Fallback data ───
const FALLBACK_BATCHES = [
  { id: 'BL-2602-070', volume: 8, quality: 'OK', time: '20:43', status: 'complete' },
  { id: 'BL-2602-073', volume: 12, quality: 'OK', time: '19:15', status: 'complete' },
  { id: 'BL-2602-067', volume: 8, quality: 'VAR', time: '18:30', status: 'variance' },
  { id: 'BL-2602-065', volume: 10, quality: 'OK', time: '17:45', status: 'complete' },
  { id: 'BL-2602-068', volume: 8, quality: 'OK', time: '16:20', status: 'complete' },
  { id: 'BL-2602-064', volume: 6, quality: 'OK', time: '15:10', status: 'complete' },
];

const FALLBACK_STOCK = [
  { name: 'Ciment', current: 42000, max: 80000, unit: 'kg' },
  { name: 'Sable', current: 120000, max: 300000, unit: 'm3' },
  { name: 'Gravette', current: 85000, max: 250000, unit: 'm3' },
  { name: 'Adjuvant', current: 200, max: 2000, unit: 'L' },
  { name: 'Eau', current: 15000, max: 50000, unit: 'L' },
];

const EMPTY_AR = [
  { label: '0-30j', value: 32000 },
  { label: '31-60j', value: 18000 },
  { label: '61-90j', value: 12000 },
  { label: '>90j', value: 15000 },
];

const AR_OPACITIES = [1, 0.65, 0.4, 0.2];

// ─── Live Data Hook ───
function useWorldClassLiveData() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const [stockData, setStockData] = useState(FALLBACK_STOCK);
  const [arAgingData, setArAgingData] = useState(EMPTY_AR);
  const [recentBatches, setRecentBatches] = useState(FALLBACK_BATCHES);
  const [hourlyProductionData, setHourlyProductionData] = useState<{ hour: string; volume: number }[]>([]);
  const [qualityData, setQualityData] = useState([{ day: "Aujourd'hui", ok: 12, var: 2, crit: 0 }]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      const [stocksRes, arRes, batchesRes, blTodayRes] = await Promise.all([
        supabase.from('stocks').select('materiau, quantite_actuelle, seuil_alerte, capacite_max, unite'),
        supabase.from('clients').select('solde_du, created_at').gt('solde_du', 0),
        supabase.from('bons_livraison_reels')
          .select('bl_id, volume_m3, quality_status, date_livraison, created_at, formule_id, affaissement_conforme')
          .order('created_at', { ascending: false }).limit(6),
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

  return { stats, statsLoading, stockData, arAgingData, recentBatches, hourlyProductionData, qualityData, loading };
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT — Operations Zone
// ═══════════════════════════════════════════════════════
export function WorldClassDashboard({ hideProductionWidgets = false, hideOpsWidgets = false, showOnlyOps = false, hideIntelWidgets = false, showOnlyIntel = false }: { hideProductionWidgets?: boolean; hideOpsWidgets?: boolean; showOnlyOps?: boolean; hideIntelWidgets?: boolean; showOnlyIntel?: boolean } = {}) {
  const {
    stats, stockData, arAgingData, recentBatches: batches,
    hourlyProductionData, qualityData, loading,
  } = useWorldClassLiveData();

  const totalAR = useAnimatedCounter(Math.round(arAgingData.reduce((s, d) => s + d.value, 0) / 1000) || 77);
  const prodTotal = useAnimatedCounter(Math.round(stats.totalVolume) || 851);

  const prodChartData = hourlyProductionData.length ? hourlyProductionData : [
    { hour: '06h', volume: 12 }, { hour: '07h', volume: 28 }, { hour: '08h', volume: 65 },
    { hour: '09h', volume: 82 }, { hour: '10h', volume: 95 }, { hour: '11h', volume: 78 },
    { hour: '12h', volume: 45 }, { hour: '13h', volume: 68 }, { hour: '14h', volume: 110 },
    { hour: '15h', volume: 98 }, { hour: '16h', volume: 85 }, { hour: '17h', volume: 72 },
    { hour: '18h', volume: 38 },
  ];

  if (loading) {
    return (
      <div className="overflow-x-hidden max-w-full w-full" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: T.textPri }}>
        <style>{`
          @keyframes shimmer-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        `}</style>
        <div style={{ maxWidth: '100%', margin: '0 auto' }} className="w-full min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
            <div className="space-y-5 min-w-0">
              <SkeletonCard height={280} />
              <SkeletonCard height={140} />
              <SkeletonCard height={180} />
            </div>
            <div className="space-y-5 min-w-0">
              <SkeletonCard height={240} />
              <SkeletonCard height={200} />
              <SkeletonCard height={160} />
            </div>
            <div className="space-y-5 min-w-0">
              <SkeletonCard height={200} />
              <SkeletonCard height={300} />
              <SkeletonCard height={120} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden max-w-full w-full" style={{ fontFamily: 'Inter, system-ui, sans-serif', color: T.textPri }}>

      <style>{`
        @keyframes tbos-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tbos-bar-grow { from { height: 0; } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes shimmer-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes breathe { 0%, 100% { opacity: 0.03; transform: scale(1); } 50% { opacity: 0.08; transform: scale(1.1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes tbos-scroll-reveal { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 0.15; } 100% { transform: scale(1); opacity: 0.4; } }
        @keyframes opsGlow {
          0%, 100% { opacity: 0.4; filter: blur(80px); }
          50% { opacity: 0.7; filter: blur(100px); }
        }
        .ops-enter { animation: tbos-scroll-reveal 800ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .tbos-bar-animate { animation: tbos-bar-grow 1200ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .tbos-stagger-1 { animation-delay: 100ms; }
        .tbos-stagger-2 { animation-delay: 200ms; }
        .tbos-stagger-3 { animation-delay: 300ms; }
        .tbos-stagger-4 { animation-delay: 180ms; }
        .tbos-stagger-5 { animation-delay: 280ms; }
        .tbos-stagger-6 { animation-delay: 380ms; }
        .tbos-stagger-7 { animation-delay: 150ms; }
        .tbos-stagger-8 { animation-delay: 250ms; }
        .tbos-stagger-9 { animation-delay: 350ms; }
        /* Nuclear radius lock for ALL ops cards */
        div.ops-surface-card,
        div.ops-surface-card.bg-card,
        .ops-surface-card[class] {
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        @media (max-width: 768px) {
          .tbos-grid-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: '100%', margin: '0 auto' }} className="relative overflow-hidden">
        <div className="tbos-grid-3col grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 relative z-[1] w-full" style={{ alignItems: 'start' }}>

          {/* ─── Col 1: Production + Batch Timeline ─── */}
            <div className="space-y-4 min-w-0">
            {/* Daily Production Chart */}
            {!hideOpsWidgets && (
            <Card className="ops-enter ops-surface-card tbos-stagger-1" style={{ height: 280, borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>


              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="text-[14px] font-medium text-white/90">Production Journalière</div>
                  <div className="flex items-center gap-2 text-[11px] mt-1">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: T.dotOk }} /> {qualityData[0].ok} OK</span>
                    <span className="text-slate-700">·</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: T.dotWarn }} /> {qualityData[0].var} Var</span>
                    <span className="text-slate-700">·</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: T.dotCrit }} /> {qualityData[0].crit} Crit</span>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extralight text-white font-mono tracking-tight tabular-nums">{prodTotal}</span>
                  <span className="text-sm font-light text-white/40 ml-1">m³</span>
                </div>
              </div>
              <div className="overflow-hidden w-full" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prodChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.gold} stopOpacity={0.12} />
                        <stop offset="40%" stopColor={T.gold} stopOpacity={0.04} />
                        <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fill: 'rgba(148,163,184,0.2)', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip content={(p) => <RichTooltip {...p} unit=" m³" sparkData={prodChartData} />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '4 4' }} />
                    {/* Single crisp line — no glow layers */}
                    <Area type="monotone" dataKey="volume" stroke="#C9A84C" strokeWidth={2} fill="url(#prodGrad)" dot={false} activeDot={{ r: 2, fill: '#C9A84C', stroke: 'none' }} animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            )}

            {/* Live Batch Progress */}
            {!hideProductionWidgets && <LiveBatchProgress />}

            {/* Batch Timeline */}
            {!hideProductionWidgets && (
            <Card className="ops-enter ops-surface-card tbos-stagger-2" style={{ borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>


              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: T.dotOk }} />
                </span>
                <span className="text-[14px] font-medium text-white/90">Derniers Batches</span>
                <span className="text-[9px] font-mono text-slate-600 ml-auto tabular-nums">{batches.length} récents</span>
              </div>
              <BatchTimeline batches={batches} />
            </Card>
            )}

            {/* AI Analyst Brief */}
            {!showOnlyOps && <AIAnalystBrief />}

            {/* Compliance Widget */}
            {!showOnlyOps && <ComplianceWidget />}

            {/* Energy & Cost Anomaly Widget */}
            {!showOnlyOps && <EnergyCostAnomalyWidget />}
          </div>

          {/* ─── Col 2: Stock Gauges + Pipeline Funnel ─── */}
          <div className="space-y-4 min-w-0">
            {/* Stock Levels — Horizontal Bars */}
            {!showOnlyOps && (
            <Card className="ops-enter ops-surface-card tbos-stagger-4" style={{ borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
              <div className="text-[14px] font-medium text-white/90 mb-3">Niveaux de Stock</div>
              <div className="flex flex-col">
                {stockData.slice(0, 6).map((s, i) => (
                  <HorizontalStockBar key={i} name={s.name} current={s.current} max={s.max} unit={s.unit} />
                ))}
              </div>
              {/* ── Predictive Stock Alerts ── */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] uppercase tracking-[0.12em] font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    Prévision de Rupture
                  </span>
                </div>
                <div className="space-y-1">
                  {[
                    { name: 'Adjuvant', dailyRate: 5.0, daysLeft: 1 },
                    { name: 'Eau', dailyRate: 3.5, daysLeft: 2 },
                    { name: 'Gravette', dailyRate: 2.1, daysLeft: 3 },
                    { name: 'Ciment', dailyRate: 1.8, daysLeft: 5 },
                    { name: 'Sable', dailyRate: 0.9, daysLeft: 8 },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-2 w-full min-w-0 text-[9px]">
                      <div className="flex items-center gap-2 min-w-0 flex-shrink">
                        <span className="w-14 truncate" style={{ color: 'rgba(148,163,184,0.5)' }}>{item.name}</span>
                        <span className="truncate" style={{ color: 'rgba(148,163,184,0.35)' }}>▼ {item.dailyRate}%/j</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
                        <span
                          className="font-medium"
                          style={{
                            color: item.daysLeft <= 1 ? '#F87171' : item.daysLeft <= 3 ? '#FBBF24' : 'rgba(148,163,184,0.4)',
                          }}
                        >
                          {item.daysLeft <= 1 ? '🔴 Demain' : item.daysLeft <= 3 ? `⚠️ ${item.daysLeft}j` : `${item.daysLeft}j`}
                        </span>
                        {item.daysLeft <= 3 && (
                          <button
                            className="px-1.5 py-0.5 rounded text-[8px] font-medium whitespace-nowrap flex-shrink-0"
                            style={{
                              background: 'rgba(212,175,55,0.08)',
                              border: '1px solid rgba(212,175,55,0.2)',
                              color: '#D4AF37',
                            }}
                          >
                            Commander
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            )}

            {/* Pipeline Funnel */}
            {!hideOpsWidgets && <PipelineFunnel />}

            {/* Quality feed — Compact */}
            {!hideProductionWidgets && (
            <Card className="ops-enter ops-surface-card tbos-stagger-6" style={{ borderRadius: 8, padding: 20, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
              <div className="text-[14px] font-medium text-white/90 mb-3">Contrôle Qualité</div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'BL-2602-070', test: 'Slump 18cm', ok: true, time: '20:41' },
                  { id: 'BL-2602-067', test: 'Slump 22cm', ok: false, time: '18:28' },
                  { id: 'BL-2602-073', test: 'Slump 17cm', ok: true, time: '19:13' },
                ].map((q, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: q.ok ? T.dotOk : T.dotWarn }} />
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">{q.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-500">{q.test}</span>
                      <span className="text-[10px] font-mono tabular-nums" style={{ color: q.ok ? 'rgb(148,163,184)' : 'rgba(251,191,36,0.7)' }}>{q.ok ? 'OK' : 'VAR'}</span>
                      <span className="text-[9px] font-mono text-slate-600 tabular-nums">{q.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            )}
          </div>

          {/* ─── Col 3: Créances & Deliveries ─── */}
          <div className="space-y-4 min-w-0">
            {/* Créances — Aging Gold-Fade System */}
            {!hideOpsWidgets && (
            <Card className="ops-enter ops-surface-card tbos-stagger-7" style={{ borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[14px] font-medium text-white/90 mb-0.5">Créances Clients</div>
                  <div className="text-[11px] text-slate-600">Vieillissement</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extralight text-white tabular-nums font-mono whitespace-nowrap">{totalAR} K DH</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {arAgingData.map((d, i) => {
                  const maxVal = Math.max(...arAgingData.map(a => a.value), 1);
                  const pct = (d.value / maxVal) * 100;
                  const barStyle = i === 0
                    ? { background: 'linear-gradient(90deg, #C4933B, #FDB913)', opacity: 0.8 }
                    : i === 1
                    ? { background: 'linear-gradient(90deg, #C4933B, #FDB913)', opacity: 0.55 }
                    : i === 2
                    ? { background: 'linear-gradient(90deg, #C4933B, #FDB913)', opacity: 0.35 }
                    : { background: 'linear-gradient(90deg, #C4933B, #FDB913)', opacity: 0.2 };
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.5)' }}>{d.label}</span>
                        <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.6)' }}>{(d.value / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%`, ...barStyle }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            )}

            {/* Recent Deliveries */}
            {!hideOpsWidgets && <RecentDeliveries />}

            {/* Daily P&L Signature Metric */}
            {!hideOpsWidgets && (
            <Card className="ops-enter ops-surface-card tbos-stagger-9" style={{ borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
              <div className="text-center py-4 relative">
                <div className="relative z-[1]">
                  <div className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-3 font-medium">P&L du jour</div>
                  <div className="text-[2.5rem] font-extralight font-mono text-white tabular-nums leading-none" style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 200,
                    textShadow: '0 0 30px rgba(253,185,19,0.2), 0 0 60px rgba(253,185,19,0.08)',
                    letterSpacing: '-0.03em',
                  }}>
                    +18.4K DH
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">marge nette estimée</div>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(52,211,153,0.6)' }} />
                    <span className="text-[10px]" style={{ color: 'rgb(148,163,184)' }}>+12% vs hier</span>
                  </div>
                </div>
              </div>
            </Card>
            )}
          </div>
        </div>

        {/* ── Seasonal Demand Forecaster ── */}
        {!showOnlyOps && (
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <SeasonalDemandForecasterCard />
        </div>
        )}
      </div>
    </div>
  );
}
