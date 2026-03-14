import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ReferenceLine,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Factory, CheckCircle, Shield, Clock, Bell, Zap,
  TrendingUp, Activity, Wrench, Settings, ClipboardList, Play, CheckCircle2,
  ChevronRight, BarChart3, PieChart as PieChartIcon, AlertTriangle,
  Plus, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/useCountUp';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import BatchesTab from './BatchesTab';
import RecettesTab from './RecettesTab';
import PlanningTab from './PlanningTab';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductionBriefingCard } from './ProductionBriefingCard';
import { RendementOptimizerCard } from './RendementOptimizerCard';
import { QualitePredictorCard } from './QualitePredictorCard';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldDim:    'rgba(255, 215, 0, 0.15)',
  goldGlow:   'rgba(255, 215, 0, 0.25)',
  goldBorder: 'rgba(255, 215, 0, 0.3)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  // purple/pink removed — not in approved palette
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

const CHART_COLORS = [T.gold, T.info, T.success, T.warning, T.danger, '#94A3B8', '#64748B'];

// ─────────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
        setValue(Math.round(eased * target));
        if (p < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(timeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, delay]);
  return value;
}

function useAnimatedCounterDecimal(target: number, decimals = 1, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setValue(parseFloat((eased * target).toFixed(decimals)));
        if (p < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(timeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals, delay]);
  return value;
}

// ─────────────────────────────────────────────────────
// SHARED TOOLTIP
// ─────────────────────────────────────────────────────
function GoldTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A2540', border: `1px solid ${T.goldBorder}`,
      borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || T.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 400, fontSize: 13 }}>
          {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}{unit}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SECTION HEADER — Gold uppercase with hairline
// ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon size={16} strokeWidth={1.5} style={{ color: T.gold, flexShrink: 0 }} />
      <span style={{
        color: T.gold, fontWeight: 700, fontSize: 12,
        textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${T.gold}33 0%, transparent 80%)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Icon size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500 }}>{message}</p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────────────
function MiniSparkline({ data, color = T.gold }: { data: number[]; color?: string }) {
  const rawMax = Math.max(...data, 1);
  const rawMin = Math.min(...data, 0);
  const rawRange = rawMax - rawMin || 1;
  const padding = rawRange < 20 ? 20 : 0;
  const min = rawMin - padding * 0.3;
  const max = rawMax + padding * 0.7;
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const lastPoint = data[data.length - 1];
  const lastX = w;
  const lastY = h - ((lastPoint - min) / range) * (h - 4) - 2;
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-2">
      <defs>
        <linearGradient id={`sparkGrad-${color.replace(/[^a-zA-Z0-9]/g,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(212,168,67,0.08)" />
          <stop offset="100%" stopColor="rgba(212,168,67,0)" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sparkGrad-${color.replace(/[^a-zA-Z0-9]/g,'')})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function useProductionLiveData() {
  const [bons, setBons] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [weekBons, setWeekBons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const fetchAll = useCallback(async () => {
    try {
      const [bonsRes, batchesRes, weekRes] = await Promise.all([
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, volume_m3, workflow_status, heure_prevue, camion_assigne, chauffeur_nom, formule_id, ciment_reel_kg, quality_status, production_batch_time, date_livraison, variance_ciment_pct, variance_eau_pct, variance_sable_pct, variance_gravette_pct, variance_adjuvant_pct')
          .eq('date_livraison', today),
        supabase
          .from('production_batches')
          .select('id, bl_id, batch_number, quality_status, has_critical_variance, entered_at, ciment_reel_kg, eau_reel_l, variance_ciment_pct, variance_eau_pct, entered_by_name')
          .order('entered_at', { ascending: false })
          .limit(20),
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, volume_m3, quality_status, date_livraison, variance_ciment_pct')
          .gte('date_livraison', weekStart)
          .lte('date_livraison', weekEnd),
      ]);

      setBons(bonsRes.data || []);
      setBatches(batchesRes.data || []);
      setWeekBons(weekRes.data || []);
    } catch (e) {
      console.error('WorldClassProduction fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [today, weekStart, weekEnd]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('wc-production-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { bons, batches, weekBons, loading };
}

// ─────────────────────────────────────────────────────
// KPI CARD — Premium style matching Dashboard
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0, sparkData, weekComparison }: {
  label: string; value: number; suffix: string; color: string;
  icon: any; trend: string; trendPositive: boolean; delay?: number;
  sparkData?: number[]; weekComparison?: string;
}) {
  const isDecimal = value % 1 !== 0;
  const animated = useAnimatedCounter(isDecimal ? Math.round(value * 10) : value, 1200);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 600ms ease-out', height: '100%',
    }}>
      <div className="group" style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderTop: '2px solid #D4A843',
        borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden', height: '100%',
        transition: 'all 200ms ease',
      }}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p style={{
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em',
              color: '#9CA3AF', fontWeight: 600, marginBottom: 10,
            }}>{label}</p>
            <p style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 30, fontWeight: 200,
              color: '#fff', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {isDecimal ? (animated / 10).toFixed(1).replace('.', ',') : animated.toLocaleString('fr-FR')}
              {suffix && <span style={{ fontSize: 20, color: '#9CA3AF', marginLeft: 4, fontWeight: 400, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>}
            </p>
            <p style={{
              fontSize: 12, marginTop: 8,
              color: trendPositive ? '#10B981' : '#EF4444',
              fontWeight: 500,
            }}>
              {trendPositive ? '↗' : '↘'} {trend}
            </p>
            {weekComparison && (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{weekComparison}</p>
            )}
            {sparkData && sparkData.length > 1 && (
              <MiniSparkline data={sparkData} color={T.gold} />
            )}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#F59E0B" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// WORKFLOW STEP
// ─────────────────────────────────────────────────────
function WorkflowStep({ count, label, color, statusLabel, delay = 0 }: {
  count: number; label: string; color: string; statusLabel: string; delay?: number;
}) {
  const animated = useCountUp(count, 1200, delay);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const isActif = statusLabel === 'Actif';
  const isTermine = statusLabel === 'Terminé';
  const statusColor = isActif ? '#22C55E' : isTermine ? '#22C55E' : '#9CA3AF';

  return (
    <div className="flex flex-col items-center gap-2" style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 500ms ease-out', cursor: 'pointer',
    }}>
      <p style={{
        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 36, fontWeight: 200,
        color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em',
      }}>{animated}</p>
      <p style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.45)', fontWeight: 500,
      }}>{label}</p>
      <span style={{
        fontSize: 11, fontWeight: 500, color: statusColor,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2,
        ...(isActif ? { animation: 'wfActifPulse 2s infinite' } : {}),
      }}>{statusLabel}</span>
    </div>
  );
}

interface BatchDisplay {
  id: string;
  product: string;
  volume: number;
  status: string;
  quality: string;
  time: string;
  color: string;
}

function BatchCard({ batch, delay = 0 }: { batch: BatchDisplay; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const qualityColor = batch.quality === 'OK' ? T.success : batch.quality === 'VAR' ? T.warning : T.info;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <div style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderLeft: `3px solid ${batch.color}`,
        borderRadius: 12, padding: '14px 16px',
        transition: 'all 200ms ease',
      }}>
        <div className="flex justify-between items-start mb-2">
          <p style={{ color: T.textDim, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{batch.id}</p>
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: `${batch.color}18`, color: batch.color, border: `1px solid ${batch.color}40`,
          }}>{batch.product}</span>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 400, color: '#fff', marginBottom: 8 }}>
          {batch.volume} m³
        </p>
        <div className="flex justify-between items-center">
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: `${qualityColor}18`, color: qualityColor, border: `1px solid ${qualityColor}40`,
          }}>
            {batch.quality === 'OK' ? '✓ OK' : batch.quality === 'VAR' ? '⚠ VAR' : '⟳ En cours'}
          </span>
          <p style={{ color: T.textSec, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{batch.time}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassProduction() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [openPlanningModal, setOpenPlanningModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const { bons, batches, weekBons, loading } = useProductionLiveData();

  // ── Derived KPIs (with realistic fallbacks when DB is empty) ──
  const kpis = useMemo(() => {
    const produced = bons.filter(b => b.workflow_status === 'validation_technique').reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const inProgress = bons.filter(b => b.workflow_status === 'production').reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const planned = bons.filter(b => b.workflow_status === 'planification').reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const totalVolume = produced + inProgress + planned;

    const completedBatches = batches.filter(b => b.quality_status === 'ok' || b.quality_status === 'warning').length;
    const criticalBatches = batches.filter(b => b.quality_status === 'critical').length;
    const totalBatches = batches.length;
    const conformity = totalBatches > 0 ? Math.round(((totalBatches - criticalBatches) / totalBatches) * 100) : 100;

    const hasData = totalVolume > 0 || totalBatches > 0;
    if (hasData) {
      return { produced, inProgress, planned, totalVolume, completedBatches, conformity, totalBatches, isDemo: false };
    }
    return {
      produced: 671, inProgress: 8, planned: 2,
      totalVolume: 671, completedBatches: 12, conformity: 96.8, totalBatches: 14, isDemo: true,
    };
  }, [bons, batches]);

  // ── Workflow counts ──
  const workflowCounts = useMemo(() => {
    const live = {
      planification: bons.filter(b => b.workflow_status === 'planification').length,
      production: bons.filter(b => b.workflow_status === 'production').length,
      validation: bons.filter(b => b.workflow_status === 'validation_technique').length,
    };
    if (live.planification + live.production + live.validation > 0) return live;
    return { planification: 3, production: 2, validation: 1 };
  }, [bons]);

  const hourlyData = useMemo(() => {
    const hourMap: Record<string, number> = {};
    for (let h = 6; h <= 18; h++) hourMap[`${h}h`] = 0;
    bons.forEach(b => {
      if (b.production_batch_time || b.heure_prevue) {
        const timeStr = b.production_batch_time || b.heure_prevue;
        const hour = parseInt(timeStr?.split(':')[0] || '0', 10);
        const key = `${hour}h`;
        if (hourMap[key] !== undefined) hourMap[key] += b.volume_m3 || 0;
      }
    });
    const liveData = Object.entries(hourMap).map(([hour, volume]) => ({ hour, volume: Math.round(volume), objectif: 90, lastWeek: 0 }));
    const hasLive = liveData.some(d => d.volume > 0);
    if (hasLive) return liveData;
    // Demo data matching Dashboard curve
    const demoVolumes: Record<string, number> = {
      '6h': 8, '7h': 22, '8h': 48, '9h': 65, '10h': 82, '11h': 90,
      '12h': 55, '13h': 98, '14h': 88, '15h': 78, '16h': 72, '17h': 60, '18h': 5,
    };
    const lastWeekVolumes: Record<string, number> = {
      '6h': 5, '7h': 18, '8h': 40, '9h': 55, '10h': 72, '11h': 80,
      '12h': 48, '13h': 85, '14h': 78, '15h': 68, '16h': 62, '17h': 50, '18h': 3,
    };
    return Object.entries(demoVolumes).map(([hour, volume]) => ({ hour, volume, objectif: 90, lastWeek: lastWeekVolumes[hour] || 0 }));
  }, [bons]);

  const hasHourlyData = hourlyData.some(d => d.volume > 0);

  const productData = useMemo(() => {
    const formulaMap: Record<string, number> = {};
    bons.forEach(b => {
      const fId = b.formule_id || 'Autre';
      formulaMap[fId] = (formulaMap[fId] || 0) + (b.volume_m3 || 0);
    });
    const entries = Object.entries(formulaMap).filter(([, v]) => v > 0);
    if (entries.length > 0) {
      return entries
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, volume], i) => ({ name, volume: Math.round(volume), color: CHART_COLORS[i % CHART_COLORS.length] }));
    }
    // Demo breakdown
    return [
      { name: 'F-B25', volume: 403, color: '#D4A843' },
      { name: 'F-B30', volume: 168, color: '#F59E0B' },
      { name: 'F-B20', volume: 100, color: '#FBBF24' },
    ];
  }, [bons]);

  const qualityData = useMemo(() => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dayMap: Record<string, { ok: number; variances: number; critical: number }> = {};
    dayNames.forEach(d => { dayMap[d] = { ok: 0, variances: 0, critical: 0 }; });

    weekBons.forEach(b => {
      const dayIdx = new Date(b.date_livraison).getDay();
      const dayName = dayNames[dayIdx];
      if (!dayMap[dayName]) return;
      const hasVariance = (b.variance_ciment_pct || 0) > 2;
      const isCritical = b.quality_status === 'critical';
      if (isCritical) dayMap[dayName].critical++;
      else if (hasVariance) dayMap[dayName].variances++;
      else dayMap[dayName].ok++;
    });

    return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => ({ day, ...dayMap[day] }));
  }, [weekBons]);

  const hasQualityData = qualityData.some(d => d.ok > 0 || d.variances > 0 || d.critical > 0);

  // Demo quality data when no live data
  const demoQualityData = [
    { day: 'Lun', ok: 97, variances: 3, critical: 0 },
    { day: 'Mar', ok: 97, variances: 3, critical: 0 },
    { day: 'Mer', ok: 98, variances: 2, critical: 0 },
    { day: 'Jeu', ok: 96, variances: 4, critical: 0 },
    { day: 'Ven', ok: 97, variances: 3, critical: 0 },
    { day: 'Sam', ok: 98, variances: 2, critical: 0 },
  ];
  const displayQualityData = hasQualityData ? qualityData : demoQualityData;

  // ── Batch display list ──
  const batchDisplayList: BatchDisplay[] = useMemo(() => {
    return batches.slice(0, 8).map((b) => {
      const qualStatus = b.quality_status as string;
      const quality = qualStatus === 'ok' ? 'OK' : qualStatus === 'warning' ? 'VAR' : qualStatus === 'critical' ? 'CRIT' : '—';
      const color = qualStatus === 'ok' ? T.success : qualStatus === 'warning' ? T.warning : qualStatus === 'critical' ? T.danger : T.info;
      return {
        id: b.bl_id || `B-${b.batch_number}`,
        product: `#${b.batch_number}`,
        volume: Math.round((b.ciment_reel_kg || 0) / 1000 * 10) / 10,
        status: qualStatus === 'pending' ? 'En cours' : 'Complete',
        quality,
        time: b.entered_at ? format(new Date(b.entered_at), 'HH:mm') : '—',
        color,
      };
    });
  }, [batches]);

  // ── Quality variances ──
  const qualityVariances = useMemo(() => {
    const types: Record<string, number> = { 'Écart ciment': 0, 'Écart eau': 0, 'Écart sable': 0 };
    batches.forEach(b => {
      if ((b.variance_ciment_pct || 0) > 2) types['Écart ciment']++;
      if ((b.variance_eau_pct || 0) > 2) types['Écart eau']++;
    });
    return Object.entries(types).filter(([, c]) => c > 0).map(([label, count]) => ({ label, count }));
  }, [batches]);

  const totalCriticalWeek = useMemo(() => {
    const live = weekBons.filter(b => b.quality_status === 'critical').length;
    return weekBons.length > 0 ? live : 2;
  }, [weekBons]);
  const totalVariancesWeek = useMemo(() => {
    const live = weekBons.filter(b => (b.variance_ciment_pct || 0) > 2).length;
    return weekBons.length > 0 ? live : 4;
  }, [weekBons]);

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'batches', label: 'Batches' },
    { id: 'recettes', label: 'Recettes' },
    { id: 'planning', label: 'Planning' },
  ];

  const totalProductVolume = productData.reduce((s, p) => s + p.volume, 0);

  // Sparkline data for KPIs (7 days trending)
  const sparkVolume = [320, 410, 380, 520, 490, 580, kpis.totalVolume];
  const sparkBatches = [6, 9, 8, 11, 10, 13, kpis.totalBatches];
  const sparkConformity = [92, 95, 93, 96, 94, 97, kpis.conformity];
  const sparkInProg = [3, 5, 2, 4, 3, 6, Math.round(kpis.inProgress)];

  return (
    <div className="tbos-production-root" style={{ fontFamily: 'DM Sans, sans-serif', background: 'transparent', minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@200;400;600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
        @keyframes tbos-fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tbos-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes tbos-live { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes wfActifPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes margePulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.5} }
        @keyframes livePulseGreen { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:0.5} }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <PageHeader
        icon={Factory}
        title="Production"
        subtitle="Données en temps réel"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={loading}
        actions={
          <>
            <button
              onClick={() => { setActiveTab('planning'); setOpenPlanningModal(prev => !prev); }}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid #D4A843',
                color: '#D4A843',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 200ms',
              }}
            >
              <Plus size={13} />
              Nouvelle Planification
            </button>
            <button
              onClick={() => navigate('/bons')}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid #D4A843',
                color: '#D4A843',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 200ms',
              }}
            >
              <Upload size={13} />
              Importer BC
            </button>
          </>
        }
      />

      {/* ── PAGE CONTENT ── */}
      <div style={{ width: '100%', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 32 }} className="sm:!px-6">

        {/* ── BATCHES TAB ── */}
        {activeTab === 'batches' && (
          <BatchesTab bons={bons} batches={batches} loading={loading} />
        )}

        {/* ── RECETTES TAB ── */}
        {activeTab === 'recettes' && <RecettesTab />}

        {/* ── PLANNING TAB ── */}
        {activeTab === 'planning' && <PlanningTab openModal={openPlanningModal} />}

        {/* ── VUE D'ENSEMBLE ── */}
        {activeTab === 'overview' && <>

        {/* ── KPI CARDS ── */}
        <section>
          <SectionHeader icon={Zap} label="Production KPIs" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            <KPICard label="Production Aujourd'hui" value={Math.round(kpis.totalVolume)} suffix="m³" color={T.gold} icon={Factory} trend={kpis.isDemo ? '12% vs hier' : `${Math.round(kpis.produced)} m³ livrés`} trendPositive delay={0} sparkData={sparkVolume} weekComparison="vs sem. dernière: +8%" />
            <KPICard label="Batches Enregistrés" value={kpis.totalBatches} suffix="" color={T.success} icon={CheckCircle} trend={`${kpis.completedBatches} conformes`} trendPositive delay={150} sparkData={sparkBatches} weekComparison="vs sem. dernière: +8%" />
            <KPICard label="Taux de Conformité" value={Math.round(kpis.conformity * 10) / 10} suffix="%" color={kpis.conformity >= 90 ? T.success : T.warning} icon={Shield} trend={kpis.conformity >= 90 ? 'Excellent' : 'À surveiller'} trendPositive={kpis.conformity >= 90} delay={300} sparkData={sparkConformity} weekComparison="vs sem. dernière: +8%" />
            <KPICard label="En Production" value={Math.round(kpis.inProgress)} suffix="m³" color={T.info} icon={Clock} trend={`${Math.round(kpis.planned)} m³ planifiées`} trendPositive={true} delay={450} sparkData={sparkInProg} weekComparison="vs sem. dernière: +8%" />
          </div>
        </section>

        {/* ── ALERT BANNER ── */}
        <section>
          <div className="rounded-lg overflow-hidden" style={{
            border: '2px solid rgba(239, 68, 68, 0.5)',
            background: 'rgba(239, 68, 68, 0.08)',
            animation: 'alertPulse 3s ease-in-out infinite',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.08)',
          }}>
            <style>{`@keyframes alertPulse { 0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.08); } 50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.15); } }`}</style>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 animate-pulse" />
                    Alerte Qualité Détectée
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Batch #403-066 — Écart affaissement +8mm sur formule F-B25. Correction doseur eau recommandée. Impact estimé: 2 batches · <span className="text-destructive font-bold">Perte estimée: 850 DH</span>
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 flex-shrink-0" />
            </div>
            <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Arrêter Batch</button>
                <button style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px' }}>Ajuster Paramètres</button>
                <button style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px' }}>Notifier Lab</button>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace' }}>
                14:32 — Alerte détectée · 14:33 — Lab notifié automatiquement · 14:35 — Doseur recalibré
              </p>
            </div>
          </div>
        </section>

        {/* ── ENVIRONMENTAL STRIP ── */}
        <section>
          <div className="flex items-center gap-5 overflow-x-auto py-3 px-4 rounded-lg" style={{
            borderTop: '1px solid rgba(212, 168, 67, 0.3)',
            borderBottom: '1px solid rgba(212, 168, 67, 0.3)',
            background: 'linear-gradient(90deg, rgba(212, 168, 67, 0.03), transparent, rgba(212, 168, 67, 0.03))',
          }}>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>EN DIRECT</span>
            </div>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
            {[
              { label: 'PRESSION', value: '1 013 hPa', status: 'Normal' },
              { label: 'VENT', value: '12 km/h', status: 'Calme' },
              { label: 'TEMPÉRATURE', value: '22°C', status: 'Optimal' },
              { label: 'HUMIDITÉ', value: '45%', status: 'Optimal' },
              { label: 'EAU DE GÂCHAGE', value: '18°C', status: 'Optimal' },
              { label: 'BRUIT MALAXEUR', value: '72 dB', status: 'Normal' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 px-2 py-1 rounded-md" style={{ transition: 'background 200ms' }}>
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 14, fontWeight: 200, color: '#fff', marginTop: 2 }}>{item.value}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: item.status === 'Normal' || item.status === 'Calme' || item.status === 'Optimal' ? '#D4A843' : '#F59E0B', marginTop: 1 }}>{item.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── ÉQUIPE EN SERVICE ── */}
        <section>
          <div className="flex items-center justify-between flex-wrap gap-4 px-5 py-3.5 rounded-lg" style={{
            background: T.cardBg,
            border: `1px solid ${T.cardBorder}`,
            borderTop: '2px solid #D4A843',
          }}>
            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>ÉQUIPE EN SERVICE</span>
              </div>
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
              {[
                { label: 'OPÉRATEURS', value: '3/3', color: '#34d399' },
                { label: 'MALAXEUR', value: '1/1', color: '#34d399' },
                { label: 'LABORATOIRE', value: '1/1', color: '#34d399' },
                { label: 'CHAUFFEURS', value: '4/5', color: '#F59E0B' },
                { label: 'MAINTENANCE', value: '2/2', color: '#34d399' },
              ].map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0">
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 16, fontWeight: 400, color: item.label === 'CHAUFFEURS' ? '#F59E0B' : '#D4A843', marginTop: 2 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0">
              <span style={{ fontSize: 11, color: '#D4A843', border: '1px solid rgba(212,168,67,0.3)', padding: '3px 10px', borderRadius: 999 }}>Prochain shift: <span style={{ fontWeight: 600 }}>14h00</span> — 3 opérateurs</span>
            </div>
          </div>
        </section>

        {/* ── PASSATION DE QUART ── */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontSize: 14 }}>🔄</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PASSATION DE QUART — 14h00</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(212,168,67,0.4), transparent)' }} />
          </div>
          <div className="ops-surface-card" style={{ borderTop: '2px solid #D4A843', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 24px', background: 'rgba(15,23,41,0.8)', backdropFilter: 'blur(4px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>3 batches restants en file. Batch #403-066 écart qualité — briefer opérateur entrant.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>TOU-03 carburant à 30% — ravitaillement avant tournée soir.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, textDecoration: 'line-through', textDecorationColor: 'rgba(255,255,255,0.2)' }}>Stock adjuvant 15% — commande automatique passée à 13:45.</span>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Prochain shift: Opérateurs — Ahmed K., Rachid M., Samir T.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button style={{ border: '1px solid #D4A843', color: '#0F1629', background: '#D4A843', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Valider Passation</button>
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(212,168,67,0.15)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.4)' }}>Généré par IA · Claude Opus</span>
            </div>
          </div>
        </section>

        {/* ── WORKFLOW PIPELINE ── */}
        <section>
          <SectionHeader icon={Activity} label="Workflow de Production" />
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderTop: '2px solid #D4A843',
            borderRadius: 12, padding: '20px 16px',
          }}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
              <WorkflowStep count={workflowCounts.planification} label="Planifiés" color={T.gold} statusLabel="En attente" delay={0} />
              <ChevronRight size={24} strokeWidth={1} className="hidden sm:block" style={{ color: 'rgba(255,255,255,0.15)', margin: '0 32px', marginBottom: 24 }} />
              <WorkflowStep count={workflowCounts.production} label="En Production" color={T.info} statusLabel="Actif" delay={100} />
              <ChevronRight size={24} strokeWidth={1} className="hidden sm:block" style={{ color: 'rgba(255,255,255,0.15)', margin: '0 32px', marginBottom: 24 }} />
              <WorkflowStep count={workflowCounts.validation} label="Validation" color={T.success} statusLabel="Terminé" delay={200} />
            </div>
          </div>
        </section>

        {/* ── MARGE TEMPS RÉEL ── */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MARGE TEMPS RÉEL</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(212,168,67,0.4), transparent)' }} />
          </div>
          <div className="ops-surface-card" style={{ borderTop: '2px solid #D4A843', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, background: 'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 40%), rgba(15,23,41,0.8)', backdropFilter: 'blur(4px)' }}>
            <div style={{ display: 'flex', gap: 24 }}>
              {/* LEFT 60% */}
              <div style={{ flex: '0 0 60%' }}>
                <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 64, fontWeight: 100, color: '#F59E0B', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>38.6%</p>
                <p style={{ color: '#6B7280', fontSize: 11, marginTop: 8, textTransform: 'uppercase', letterSpacing: '2px' }}>Marge brute glissante · Aujourd'hui</p>
                {/* Sparkline */}
                <svg width={200} height={48} style={{ marginTop: 12 }}>
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(245,158,11,0.2)" />
                      <stop offset="100%" stopColor="rgba(245,158,11,0)" />
                    </linearGradient>
                  </defs>
                  <polygon
                    fill="url(#sparkFill)"
                    points="0,6 28,5 57,10 85,8 114,16 142,22 171,30 200,36 200,48 0,48"
                  />
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,6 28,5 57,10 85,8 114,16 142,22 171,30 200,36"
                  />
                  <circle cx={200} cy={36} r={4} fill="#F59E0B" style={{ animation: 'marge-pulse 2s infinite' }} />
                </svg>
                <style>{`@keyframes marge-pulse { 0%, 100% { r: 4; opacity: 1; } 50% { r: 5.6; opacity: 0.5; } }`}</style>
                <p style={{ color: '#F59E0B', fontSize: 14, marginTop: 6, fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>↘ -3.4% depuis 11h</span>
                </p>
              </div>
              {/* RIGHT 40% */}
              <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ borderLeft: '3px solid #D4A843', background: 'rgba(212,168,67,0.06)', borderRadius: '0 8px 8px 0', padding: 20 }}>
                  <p style={{ color: '#D4A843', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>RECOMMANDATION IA</p>
                  <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>
                    3 batches B20 consécutifs ont réduit la marge. Recommandation: prioriser commande BC-2024-003 (B30, marge estimée 41%) pour rééquilibrer.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', boxShadow: '0 0 0 1px rgba(212,168,67,0.3)' }}>Confiance: 88%</span>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(212,168,67,0.15)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.4)' }}>Généré par IA · Claude Opus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CHARTS: Production du Jour ── */}
        <section>
          <SectionHeader icon={Activity} label="Production du Jour" />
          <div className="tbos-prod-charts grid gap-5" style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)' }}>
            <style>{`@media (max-width: 768px) { .tbos-prod-charts { grid-template-columns: 1fr !important; } .tbos-quality-grid { grid-template-columns: 1fr !important; } }`}</style>
            {/* Hourly Production */}
            <div style={{
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              borderTop: '2px solid #D4A843',
              borderRadius: 12, padding: 20,
            }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>Production Horaire</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 400, color: T.gold }}>
                    {Math.round(kpis.totalVolume)} m³
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  <span style={{ color: '#34d399', fontSize: 11, fontWeight: 500 }}>Live</span>
                </div>
              </div>
              {hasHourlyData ? (
                <>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="prodGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.gold} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} width={35} domain={[0, 'auto']} />
                    <Tooltip content={<GoldTooltip unit=" m³" />} />
                    <ReferenceLine y={90} stroke="rgba(255,255,255,0.20)" strokeDasharray="6 4" label={{ value: 'Objectif', position: 'right', fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
                    <Area type="monotone" dataKey="lastWeek" stroke="rgba(212,168,67,0.25)" strokeWidth={1.5} strokeDasharray="6 4" fill="none" dot={false} activeDot={false} animationDuration={1200} name="Sem. dernière" />
                    <Area type="monotone" dataKey="volume" stroke={T.gold} strokeWidth={2} fill="url(#prodGold)" dot={false} activeDot={{ r: 5, fill: T.gold }} animationDuration={1200} name="Aujourd'hui" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2" style={{ paddingLeft: 36 }}>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 16, height: 0, borderTop: '2px solid #D4A843' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Aujourd'hui</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 16, height: 0, borderTop: '1.5px dashed rgba(212,168,67,0.25)' }} />
                    <span style={{ fontSize: 11, color: 'rgba(212,168,67,0.45)' }}>Semaine dernière</span>
                  </div>
                </div>
                </>
              ) : (
                <div style={{ height: 220, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={hourlyData}>
                      <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} width={30} ticks={[0, 10, 20, 30]} domain={[0, 30]} />
                      <ReferenceLine y={15} stroke={`${T.gold}33`} strokeDasharray="6 4" label={{ value: 'Objectif', position: 'right', fill: `${T.gold}66`, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: 14, fontWeight: 500 }}>En attente de production</p>
                    <p style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12, marginTop: 4 }}>Les données apparaîtront en temps réel</p>
                  </div>
                </div>
              )}
            </div>

            {/* Production par Formule */}
            <div style={{
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              borderTop: '2px solid #D4A843',
              borderRadius: 12, padding: 20,
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 }}>Production par Formule</p>
              {productData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={productData} dataKey="volume" nameKey="name" innerRadius={60} outerRadius={90} animationBegin={200} animationDuration={800} label={false}>
                        {productData.map((p, i) => <Cell key={i} fill={p.color} />)}
                      </Pie>
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 400, fill: '#fff' }}>{totalProductVolume}</text>
                      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}>m³ Total</text>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0];
                        return (
                          <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                            <p style={{ color: T.textSec, fontSize: 11 }}>{d.name}</p>
                            <p style={{ color: (d.payload as any).color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 400 }}>{(d.value as number).toLocaleString('fr-FR')} m³</p>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {productData.map(p => (
                      <div key={p.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                          <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: 11 }}>{p.name}</span>
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>{totalProductVolume > 0 ? Math.round(p.volume / totalProductVolume * 100) : 0}% · {p.volume} m³</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center" style={{ height: 260 }}>
                  {/* Ghost donut ring */}
                  <svg width="180" height="180" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="20" />
                  </svg>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, color: 'rgba(255,255,255,0.15)', marginTop: -110, marginBottom: 80 }}>—</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Aucune donnée</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── QUALITY ── */}
        <section>
          <SectionHeader icon={Shield} label="Qualité & Conformité" />
          <div className="tbos-quality-grid grid gap-5" style={{ gridTemplateColumns: '60% 40%' }}>
            {/* Weekly quality chart */}
            <div style={{
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              borderTop: '2px solid #D4A843',
              borderRadius: 12, padding: 20,
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 }}>Qualité Hebdomadaire</p>
              {true ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={displayQualityData} barSize={24}>
                      <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} width={25} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return <GoldTooltip active={active} payload={payload} label={label} />;
                      }} />
                      <Bar dataKey="ok" stackId="q" fill="#D4A843" name="Conforme" radius={[4, 4, 0, 0]} animationDuration={1000} />
                      <Bar dataKey="variances" stackId="q" fill={T.warning} name="Variances" animationDuration={1000} />
                      <Bar dataKey="critical" stackId="q" fill={T.danger} name="Critique" radius={[4, 4, 0, 0]} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-3">
                    {[['Conforme', '#D4A843'], ['Variances', T.warning], ['Critique', T.danger]].map(([label, color]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        <span style={{ color: T.textSec, fontSize: 11 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Conformity cards */}
            <div className="flex flex-col gap-4" style={{ minHeight: '100%' }}>
              <div style={{
                background: T.cardBg, border: `1px solid ${T.cardBorder}`,
                borderTop: '2px solid #D4A843',
                borderRadius: 12, padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div className="flex justify-between items-center mb-2">
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Conformité</p>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    background: 'rgba(16,185,129,0.15)',
                    color: '#34d399',
                  }}>Excellent</span>
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 48, fontWeight: 400, color: '#fff' }}>96.8%</p>
              </div>

              <div style={{
                background: T.cardBg, border: `1px solid ${T.cardBorder}`,
                borderTop: '2px solid #D4A843',
                borderRadius: 12, padding: 20,
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} strokeWidth={1.5} style={{ color: '#34d399' }} />
                  <p style={{ color: totalCriticalWeek === 0 ? '#34d399' : T.danger, fontSize: 13, fontWeight: 600 }}>
                    {totalCriticalWeek === 0 ? '0 Critiques cette semaine' : `${totalCriticalWeek} Critiques cette semaine`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    background: 'rgba(16,185,129,0.10)', color: '#34d399',
                  }}>{totalVariancesWeek} Variances</span>
                </div>
              </div>

              {qualityVariances.length > 0 && (
                <div style={{
                  background: T.cardBg, border: `1px solid ${T.cardBorder}`,
                  borderTop: '2px solid #D4A843',
                  borderRadius: 12, padding: 20,
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 }}>Détail des variances</p>
                  <div className="flex flex-col gap-2">
                    {qualityVariances.map(v => (
                      <div key={v.label} className="flex justify-between items-center">
                        <span style={{ color: T.textSec, fontSize: 12 }}>{v.label}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 400, color: T.warning, background: `${T.warning}18`, padding: '2px 8px', borderRadius: 999 }}>{v.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── BRIEFING PRODUCTION ── */}
        <ProductionBriefingCard />

        {/* ── AGENT IA: OPTIMISEUR DE RENDEMENT ── */}
        <RendementOptimizerCard />

        {/* ── AGENT IA: PRÉDICTEUR QUALITÉ ── */}
        <QualitePredictorCard />

        {/* ── AGENT IA: MAINTENANCE PRÉDICTIVE ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: '#D4A843', fontSize: 14, animation: 'tbos-pulse 3s ease-in-out infinite' }}>✦</span>
              <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>AGENT IA: MAINTENANCE PRÉDICTIVE</span>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}>Généré par IA · Claude Opus</span>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
            border: `1px solid ${T.cardBorder}`,
            borderTop: '2px solid #D4A843',
            borderLeft: '3px solid #D4A843',
            borderRadius: 12, padding: 20,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, lineHeight: 1.7 }}>
              Malaxeur principal: prochain entretien dans <span style={{ color: '#fff', fontWeight: 600 }}>48h</span>. Usure courroie détectée à <span style={{ color: '#F59E0B', fontWeight: 600 }}>73%</span>. Tapis convoyeur #2: vibrations anormales (<span style={{ color: '#EF4444', fontWeight: 600 }}>+15% vs baseline</span>). Recommandation: planifier remplacement courroie avant lundi. Risque de panne non planifiée: <span style={{ color: '#fff', fontWeight: 600 }}>12%</span>.
            </p>
            <div className="flex gap-2 mt-3">
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>Confiance: 88%</span>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>Risque: Modéré</span>
            </div>
          </div>
        </section>

        {/* ── AGENT IA: OPTIMISATION COÛTS ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: '#D4A843', fontSize: 14, animation: 'tbos-pulse 3s ease-in-out infinite' }}>✦</span>
              <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>AGENT IA: OPTIMISATION COÛTS</span>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}>Généré par IA · Claude Opus</span>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(212, 168, 67, 0.02) 100%)',
            border: `1px solid ${T.cardBorder}`,
            borderTop: '2px solid #D4A843',
            borderLeft: '3px solid #D4A843',
            borderRadius: 12, padding: 20,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, lineHeight: 1.7 }}>
              Formule F-B30 marge <span style={{ color: '#34d399', fontWeight: 600 }}>+12%</span> vs F-B25 aujourd'hui grâce au prix gravette favorable. Recommandation: prioriser F-B30 pour les 3 prochains batches clients flexibles. Économie estimée: <span style={{ color: '#34d399', fontWeight: 600 }}>2 400 DH/jour</span>. Alerte prix ciment: hausse <span style={{ color: '#EF4444', fontWeight: 600 }}>+3%</span> prévue semaine prochaine — considérer pré-commande.
            </p>
            <div className="flex gap-2 mt-3">
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>Économie: 2 400 DH</span>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>Confiance: 84%</span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
            TBOS Production v2.0 — {new Date().toLocaleString('fr-FR')}
          </span>
        </footer>

        </>}

      </div>
    </div>
  );
}
