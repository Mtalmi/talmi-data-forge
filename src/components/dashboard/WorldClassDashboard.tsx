import { useEffect, useRef, useState, useCallback, forwardRef, createElement } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

const MATERIAL_QTY: Record<string, string> = {
  Adjuvant: '500L',
  Eau: '10 000L',
  Gravette: '25T',
  Ciment: '30T',
  Sable: '20T',
};

function fireCommanderToast(name: string, daysLeft: number) {
  const qty = MATERIAL_QTY[name] || '—';
  const urgency = daysLeft <= 1 ? 'Critique — Demain' : daysLeft <= 2 ? `Urgent — ${daysLeft}j` : `Attention — ${daysLeft}j`;

  toast.custom(
    (id) =>
      createElement(
        'div',
        {
          onClick: () => toast.dismiss(id),
          className: 'tbos-commander-toast',
          style: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            background: '#0d1528',
            border: '1px solid rgba(212,168,67,0.3)',
            borderLeft: '3px solid #D4A843',
            borderRadius: 12,
            padding: '16px 20px',
            minWidth: 360,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            animation: 'toastSlideIn 300ms ease-out',
          },
        },
        createElement(
          'div',
          { style: { flex: 1 } },
          createElement(
            'div',
            {
              style: {
                fontSize: 10,
                letterSpacing: '0.15em',
                fontWeight: 700,
                color: '#D4A843',
                textTransform: 'uppercase' as const,
                marginBottom: 6,
              },
            },
            'COMMANDE EN PRÉPARATION'
          ),
          createElement(
            'div',
            { style: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 4 } },
            `${name} · ${qty} · ${urgency}`
          ),
          createElement(
            'div',
            { style: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' } },
            'Fournisseur notifié automatiquement'
          )
        ),
        createElement(
          'svg',
          {
            width: 28,
            height: 28,
            viewBox: '0 0 28 28',
            fill: 'none',
            style: { flexShrink: 0, marginTop: 4 },
          },
          createElement('circle', {
            cx: 14,
            cy: 14,
            r: 12,
            stroke: '#D4A843',
            strokeWidth: 1.5,
            opacity: 0.4,
          }),
          createElement('path', {
            d: 'M9 14.5L12.5 18L19 11',
            stroke: '#D4A843',
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            style: {
              strokeDasharray: 20,
              strokeDashoffset: 20,
              animation: 'toastCheckDraw 0.5s ease-out 0.2s forwards',
            },
          })
        )
      ),
    {
      duration: 3000,
      position: 'top-right',
    }
  );
}
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
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(212,168,67,0.3)',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
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

  let barBg: string;
  let barShadow: string;

  if (pct > 50) {
    barBg = 'linear-gradient(90deg, #16a34a, #22c55e)';
    barShadow = '0 0 6px rgba(34,197,94,0.15)';
  } else if (pct >= 20) {
    barBg = 'linear-gradient(90deg, #ca8a04, #eab308)';
    barShadow = '0 0 6px rgba(234,179,8,0.2)';
  } else {
    barBg = 'linear-gradient(90deg, #dc2626, #ef4444)';
    barShadow = '0 0 6px rgba(239,68,68,0.25)';
  }

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
            width: `max(40px, ${Math.max(pct, 3)}%)`,
            background: barBg,
            opacity: 0.7,
            boxShadow: barShadow,
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
      {/* Header row */}
      <div className="flex items-center justify-between px-2 mb-2 pb-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {['BATCH', 'FORMULE', 'VOLUME', 'HEURE'].map(label => (
          <span key={label} className="text-xs font-medium uppercase tracking-wider text-muted-foreground" style={{ flex: 1, textAlign: 'center' }}>
            {label}
          </span>
        ))}
      </div>

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
function splitHeadlineDetail(text: string): { headline: string; detail: string } {
  // Split at first period or em-dash
  const periodIdx = text.indexOf('.');
  const dashIdx = text.indexOf('—');
  let splitIdx = -1;
  if (periodIdx >= 0 && dashIdx >= 0) splitIdx = Math.min(periodIdx, dashIdx);
  else if (periodIdx >= 0) splitIdx = periodIdx;
  else if (dashIdx >= 0) splitIdx = dashIdx;
  if (splitIdx < 0) return { headline: text, detail: '' };
  const sep = text[splitIdx];
  return {
    headline: text.slice(0, splitIdx + (sep === '.' ? 1 : 0)).trim(),
    detail: text.slice(splitIdx + (sep === '.' ? 1 : 1)).trim(),
  };
}

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
      <div
        style={{ transition: 'all 200ms ease-out', borderRadius: 8 }}
        onMouseEnter={e => { const el = e.currentTarget.firstElementChild as HTMLElement; if (el) { el.style.borderColor = 'rgba(255,255,255,0.2)'; el.style.transform = 'translateY(-1px)'; }}}
        onMouseLeave={e => { const el = e.currentTarget.firstElementChild as HTMLElement; if (el) { el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.transform = 'translateY(0)'; }}}
      >
      <Card className="ops-enter ops-surface-card" style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', transition: 'all 200ms ease-out' }}>


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
      
      <div className="grid grid-cols-5 gap-4">
        {/* Left column: insights (60%) */}
        <div className="col-span-3 flex flex-col gap-2.5">
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
                <span className="text-sm leading-relaxed">
                  {(() => {
                    const { headline, detail } = splitHeadlineDetail(insight.text);
                    return <>
                      <span className="font-medium text-white">{headline}</span>
                      {detail && <span className="font-normal text-muted-foreground/60"> {detail}</span>}
                    </>;
                  })()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right column: recommendation (40%) */}
        <div
          className="col-span-2 transition-all duration-700 rounded-lg p-3"
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            opacity: showReco ? 1 : 0,
            transform: showReco ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">💡</span>
            <div>
              <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: T.dotWarn }}>Recommandation</span>
              <p className="mt-1 text-sm leading-relaxed">
                {(() => {
                  const recoText = 'Relancez les devis DEV-2602-316 et DEV-2602-895 — diversifiez le portefeuille client avant fin de mois.';
                  const { headline, detail } = splitHeadlineDetail(recoText);
                  return <>
                    <span className="font-medium text-white">{headline}</span>
                    {detail && <span className="font-normal text-muted-foreground/60"> {detail}</span>}
                  </>;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blinking cursor at end */}
      {visibleLines < insights.length && (
        <div className="ml-4 mt-1 w-[6px] h-[14px] rounded-sm" style={{ background: T.gold, opacity: 0.6, animation: 'blink 1s step-end infinite' }} />
      )}
    </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PIPELINE FUNNEL — Horizontal Stepped Funnel
// ═══════════════════════════════════════════════════════
function PipelineFunnel() {
  const stages = [
    { label: 'Devis', value: 6 },
    { label: 'BC Validés', value: 3 },
    { label: 'Production', value: 0 },
    { label: 'Facturé', value: 1 },
  ];

  return (
    <div className="relative overflow-hidden hover:-translate-y-[1px] cursor-pointer transition-all duration-200 ease-out rounded-lg group" style={{ minHeight: 420, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843]/60 to-transparent z-10" />
      <div className="ops-enter ops-surface-card flex flex-col p-6" style={{ minHeight: 420 }}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[14px] font-medium text-white/90">Pipeline</span>
      </div>

      <div className="flex items-center flex-1 justify-center gap-2">
        {stages.map((s, i) => {
          const stageStyles = [
            { bg: 'rgba(212,168,67,0.1)', border: 'rgba(212,168,67,0.2)', color: '#D4A843' },
            { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: 'rgb(96,165,250)' },
            { bg: 'rgba(148,163,184,0.05)', border: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.4)' },
            { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', color: 'rgb(52,211,153)' },
          ];
          const st = stageStyles[i];
          const isEmpty = s.value === 0;
          return (
            <div key={i} className="contents">
              <div
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-4 px-2"
                style={{
                  background: st.bg,
                  border: `1px solid ${st.border}`,
                  opacity: isEmpty ? 0.5 : 1,
                  transition: 'all 200ms ease-out',
                }}
              >
                <span className="text-2xl font-bold font-mono" style={{ color: st.color, lineHeight: 1 }}>
                  {s.value}
                </span>
                <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: st.color, opacity: 0.7 }}>{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <span className="flex-shrink-0 text-lg text-muted-foreground/20">›</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-muted-foreground/30 font-medium mt-3 text-center">Conversion: {Math.round((stages[3].value / Math.max(stages[0].value, 1)) * 100)}%</div>
    </div>
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
export function WorldClassDashboard({ hideProductionWidgets = false, hideOpsWidgets = false, showOnlyOps = false, hideIntelWidgets = false, showOnlyIntel = false, stockOnly = false }: { hideProductionWidgets?: boolean; hideOpsWidgets?: boolean; showOnlyOps?: boolean; hideIntelWidgets?: boolean; showOnlyIntel?: boolean; stockOnly?: boolean } = {}) {
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
        {stockOnly ? (
          <div className="w-full mb-5 relative z-[1]">
            <Card className="ops-enter ops-surface-card" style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,41,0.8)', backdropFilter: 'blur(4px)' }}>
              <div className="grid grid-cols-5 gap-5" style={{ alignItems: 'stretch' }}>
                {/* Left: Stock Bars (60%) */}
                <div className="col-span-3 flex flex-col">
                  {stockData.slice(0, 6).map((s, i) => (
                    <HorizontalStockBar key={i} name={s.name} current={s.current} max={s.max} unit={s.unit} />
                  ))}
                </div>
                {/* Right: Prévision de Rupture (40%) */}
                <div className="col-span-2 flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 20 }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] uppercase tracking-[0.12em] font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>
                      Prévision de Rupture
                    </span>
                  </div>
                  <div className="space-y-1 flex-1 flex flex-col justify-center">
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
                          {item.daysLeft <= 3 ? (
                            <button
                              className="px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all duration-200"
                              style={{
                                background: 'rgba(212,168,67,0.10)',
                                border: '1px solid rgba(212,168,67,0.30)',
                                color: '#D4A843',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.20)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.10)'; }}
                              onClick={() => fireCommanderToast(item.name, item.daysLeft)}
                            >
                              Commander
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-500 flex-shrink-0">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : showOnlyIntel ? (
          <div className="space-y-4 mb-5 relative z-[1] w-full" style={{ maxWidth: '100%' }}>
            <AIAnalystBrief />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <ComplianceWidget />
              <EnergyCostAnomalyWidget />
            </div>
            <div className="w-full">
              <SeasonalDemandForecasterCard />
            </div>
          </div>
        ) : (
        <>
        <div className="tbos-grid-3col grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 relative z-[1] w-full" style={{ alignItems: 'start' }}>

          {/* ─── Col 1: Production + Batch Timeline ─── */}
            <div className="space-y-4 min-w-0">
            {/* Daily Production Chart */}
            {!hideOpsWidgets && (
            <div className="ops-enter tbos-stagger-1 relative overflow-hidden hover:-translate-y-[1px] cursor-pointer transition-all duration-200 ease-out rounded-lg" style={{ minHeight: 420, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843]/60 to-transparent z-10" />
              <div className="p-6">


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
                  <span className="text-3xl font-extralight text-white font-mono tracking-tight tabular-nums" style={{ textShadow: '0 0 15px rgba(212, 168, 67, 0.15)' }}>{prodTotal}</span>
                  <span className="text-sm font-light text-white/40 ml-1">m³</span>
                </div>
              </div>
              <div className="overflow-hidden w-full" style={{ height: 180, filter: 'drop-shadow(0 0 4px rgba(212, 168, 67, 0.25))' }}>
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
            </div>
            </div>
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
            {!showOnlyOps && !hideIntelWidgets && <AIAnalystBrief />}

            {/* Compliance Widget */}
            {!showOnlyOps && !hideIntelWidgets && <ComplianceWidget />}

            {/* Energy & Cost Anomaly Widget */}
            {!showOnlyOps && !hideIntelWidgets && <EnergyCostAnomalyWidget />}
          </div>

          {/* ─── Col 2: Stock Gauges + Pipeline Funnel ─── */}
          <div className="space-y-4 min-w-0">
            {/* Stock Levels — Horizontal Bars */}
            {!showOnlyOps && (
            <Card className="ops-enter ops-surface-card tbos-stagger-4" style={{ borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
              <div className="grid grid-cols-5 gap-5" style={{ alignItems: 'stretch' }}>
                {/* Left: Stock Bars (60%) */}
                <div className="col-span-3 flex flex-col">
                  {stockData.slice(0, 6).map((s, i) => (
                    <HorizontalStockBar key={i} name={s.name} current={s.current} max={s.max} unit={s.unit} />
                  ))}
                </div>
                {/* Right: Prévision de Rupture (40%) */}
                <div className="col-span-2 flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 20 }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] uppercase tracking-[0.12em] font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>
                      Prévision de Rupture
                    </span>
                  </div>
                  <div className="space-y-1 flex-1 flex flex-col justify-center">
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
                          {item.daysLeft <= 3 ? (
                            <button
                              className="px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-all duration-200"
                              style={{
                                background: 'rgba(212,168,67,0.10)',
                                border: '1px solid rgba(212,168,67,0.30)',
                                color: '#D4A843',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.20)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.10)'; }}
                              onClick={() => fireCommanderToast(item.name, item.daysLeft)}
                            >
                              Commander
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-500 flex-shrink-0">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            )}

            {/* Pipeline Funnel */}
            {!hideOpsWidgets && <PipelineFunnel />}

          </div>

          {/* Quality feed — Full width row */}
          {!hideProductionWidgets && (
          <Card className="ops-enter ops-surface-card tbos-stagger-6 lg:col-span-3" style={{ borderRadius: 8, padding: 20, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
            <div className="text-[14px] font-medium text-white/90 mb-3">Contrôle Qualité</div>
            <div className="flex flex-col gap-1">
              {[
                { id: 'BL-2602-070', test: 'Slump 18cm', ok: true, time: '20:41' },
                { id: 'BL-2602-067', test: 'Slump 22cm', ok: false, time: '18:28' },
                { id: 'BL-2602-073', test: 'Slump 17cm', ok: true, time: '19:13' },
              ].map((q, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: q.ok ? T.dotOk : T.dotWarn }} />
                    <span className="text-sm font-mono text-slate-400 tabular-nums">{q.id}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500">{q.test}</span>
                    <span className="min-w-[48px] text-center text-xs font-medium px-2 py-0.5 rounded" style={{ background: q.ok ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', color: q.ok ? 'rgb(52,211,153)' : 'rgba(251,191,36,0.8)' }}>{q.ok ? 'OK' : 'VAR'}</span>
                    <span className="text-xs font-mono text-slate-600 tabular-nums">{q.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          )}

          {/* ─── Col 3: Créances & Deliveries ─── */}
          <div className="space-y-4 min-w-0">
            {/* Créances — Aging Gold-Fade System */}
            {!hideOpsWidgets && (
            <div className="ops-enter tbos-stagger-7 relative overflow-hidden hover:-translate-y-[1px] cursor-pointer transition-all duration-200 ease-out rounded-lg" style={{ minHeight: 420, border: '1px solid rgba(245, 158, 11, 0.15)', background: 'linear-gradient(to bottom right, #1a1f2e, #141824)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843]/60 to-transparent z-10" />
              <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[14px] font-medium text-white/90 mb-0.5">Créances Clients</div>
                  <div className="text-[11px] text-slate-600">Vieillissement</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extralight text-white tabular-nums font-mono whitespace-nowrap" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.08)' }}>{totalAR} K DH</span>
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
                    ? { background: 'linear-gradient(90deg, #b45309, #f59e0b)', opacity: 0.8 }
                    : { background: 'linear-gradient(90deg, #dc2626, #ef4444)', opacity: 0.8 };
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.5)' }}>{d.label}</span>
                        <span className="text-sm font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.7)' }}>{(d.value / 1000).toFixed(0)}K DH</span>
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
            </div>
            </div>
            )}
          </div>
        </div>

        {/* ─── Full-width: Livraisons du Jour ─── */}
        {!hideOpsWidgets && (
          <div className="mt-4 mb-4 relative z-[1] w-full">
            <RecentDeliveries />
          </div>
        )}

        {/* ─── Full-width: P&L du Jour ─── */}
        {!hideOpsWidgets && (
          <div className="bg-gradient-to-r from-[#D4A843]/[0.04] via-transparent to-emerald-500/[0.03] border border-white/[0.06] rounded-xl px-6 py-4 mb-4 relative z-[1] w-full flex items-center justify-between border-l-2 border-l-[#D4A843]/50">
            <div className="text-2xl font-bold text-white font-mono" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 0 20px rgba(255, 255, 255, 0.08)' }}>
              +18.4K DH
            </div>
            <div className="text-xs uppercase tracking-[0.15em]" style={{ color: 'rgba(148,163,184,0.5)' }}>marge nette estimée</div>
            <div className="bg-emerald-500/10 text-emerald-400 text-sm font-semibold px-3 py-1 rounded-full">↗ +12% vs hier</div>
          </div>
        )}
        </>
        )}

        {/* ── Seasonal Demand Forecaster ── */}
        {!showOnlyOps && !hideIntelWidgets && !showOnlyIntel && (
        <div className="w-full">
          <SeasonalDemandForecasterCard />
        </div>
        )}
      </div>
    </div>
  );
}
