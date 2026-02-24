import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Factory, CheckCircle, Shield, Clock, Bell, Zap,
  TrendingUp, Activity, Wrench, Settings, ClipboardList, Play, CheckCircle2,
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
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
  purple:     '#8B5CF6',
  pink:       '#EC4899',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

const CHART_COLORS = [T.gold, T.info, T.success, T.purple, T.pink, T.warning, T.danger];

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
      background: '#1A2540', border: `1px solid ${T.goldBorder}`,
      borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
// PREMIUM CARD
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
        transform: pressed ? 'translateY(-1px) scale(0.995)' : hovered ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${T.gold} 50%, transparent 100%)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 200ms',
      }} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: 'tbos-pulse 2.5s infinite',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40 0%, transparent 80%)` }} />
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec }}>
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
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0 }: {
  label: string; value: number; suffix: string; color: string;
  icon: any; trend: string; trendPositive: boolean; delay?: number;
}) {
  const animated = useAnimatedCounter(value, 1200);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 11, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {animated.toLocaleString('fr-FR')}
              <span style={{ fontSize: 14, fontWeight: 600, color: T.textSec, marginLeft: 4 }}>{suffix}</span>
            </p>
            <p style={{ fontSize: 11, color: trendPositive ? T.success : T.danger, marginTop: 6, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
              {trendPositive ? '↑' : '↓'} {trend}
            </p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={color} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function WorkflowStageCard({ icon: Icon, count, label, color, delay = 0 }: {
  icon: any; count: number; label: string; color: string; delay?: number;
}) {
  const animated = useCountUp(count, 1200, delay);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div className="workflow-stage">
          <Icon size={28} className="workflow-icon" style={{ color, transition: 'all 0.2s ease' }} />
          <span className="workflow-count">{animated}</span>
          <span className="workflow-label">{label}</span>
          <span className="status-dot" style={{ background: color, color }} />
        </div>
      </Card>
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
  const [hovered, setHovered] = useState(false);

  const qualityColor = batch.quality === 'OK' ? T.success : batch.quality === 'VAR' ? T.warning : T.info;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: T.cardBg,
          border: `1px solid ${hovered ? T.goldBorder : T.cardBorder}`,
          borderLeft: `4px solid ${batch.color}`,
          borderRadius: 12, padding: '14px 16px',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.25), 0 0 16px ${T.goldGlow}` : '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <p style={{ color: T.textDim, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{batch.id}</p>
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: `${batch.color}18`, color: batch.color, border: `1px solid ${batch.color}40`,
          }}>{batch.product}</span>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: T.gold, marginBottom: 8 }}>
          {batch.volume} m³
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: `${qualityColor}18`, color: qualityColor, border: `1px solid ${qualityColor}40`,
            animation: batch.status === 'En cours' ? 'tbos-pulse 2.5s infinite' : 'none',
          }}>
            {batch.quality === 'OK' ? '✓ OK' : batch.quality === 'VAR' ? '⚠ VAR' : '⟳ En cours'}
          </span>
          <p style={{ color: T.textSec, fontSize: 11 }}>{batch.time}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassProduction() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const { bons, batches, weekBons, loading } = useProductionLiveData();

  // ── Derived KPIs ──
  const kpis = useMemo(() => {
    const produced = bons.filter(b => b.workflow_status === 'validation_technique').reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const inProgress = bons.filter(b => b.workflow_status === 'production').reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const planned = bons.filter(b => b.workflow_status === 'planification').reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const totalVolume = produced + inProgress + planned;

    const completedBatches = batches.filter(b => b.quality_status === 'ok' || b.quality_status === 'warning').length;
    const criticalBatches = batches.filter(b => b.quality_status === 'critical').length;
    const totalBatches = batches.length;
    const conformity = totalBatches > 0 ? Math.round(((totalBatches - criticalBatches) / totalBatches) * 100) : 100;

    return { produced, inProgress, planned, totalVolume, completedBatches, conformity, totalBatches };
  }, [bons, batches]);

  // ── Workflow counts ──
  const workflowCounts = useMemo(() => ({
    planification: bons.filter(b => b.workflow_status === 'planification').length,
    production: bons.filter(b => b.workflow_status === 'production').length,
    validation: bons.filter(b => b.workflow_status === 'validation_technique').length,
  }), [bons]);

  // ── Hourly chart data ──
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
    return Object.entries(hourMap).map(([hour, volume]) => ({ hour, volume: Math.round(volume) }));
  }, [bons]);

  // ── Product breakdown from formule_id ──
  const productData = useMemo(() => {
    const formulaMap: Record<string, number> = {};
    bons.forEach(b => {
      const fId = b.formule_id || 'Autre';
      formulaMap[fId] = (formulaMap[fId] || 0) + (b.volume_m3 || 0);
    });
    return Object.entries(formulaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, volume], i) => ({ name, volume: Math.round(volume), color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [bons]);

  // ── Weekly quality data ──
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

  // ── Batch display list ──
  const batchDisplayList: BatchDisplay[] = useMemo(() => {
    return batches.slice(0, 8).map((b, i) => {
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

  const totalCriticalWeek = useMemo(() => weekBons.filter(b => b.quality_status === 'critical').length, [weekBons]);
  const totalVariancesWeek = useMemo(() => weekBons.filter(b => (b.variance_ciment_pct || 0) > 2).length, [weekBons]);

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'batches', label: 'Batches' },
    { id: 'recettes', label: 'Recettes' },
    { id: 'planning', label: 'Planning' },
  ];

  const totalProductVolume = productData.reduce((s, p) => s + p.volume, 0);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
        @keyframes tbos-fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tbos-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes tbos-live { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold} 0%, #B8860B 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Factory size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Production</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1 }}>Données en temps réel</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                background: activeTab === tab.id ? `${T.gold}18` : 'transparent',
                border: activeTab === tab.id ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                color: activeTab === tab.id ? T.gold : T.textSec,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13, transition: 'all 200ms',
              }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <LiveClock />
            {loading && <div style={{ width: 14, height: 14, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'tbos-spin 0.6s linear infinite' }} />}
          </div>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── KPI CARDS ── */}
        <section>
          <SectionHeader icon={Zap} label="Production KPIs" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <KPICard label="Production Aujourd'hui" value={Math.round(kpis.totalVolume)} suffix="m³" color={T.gold} icon={Factory} trend={`${Math.round(kpis.produced)} m³ livrés`} trendPositive delay={0} />
            <KPICard label="Batches Enregistrés" value={kpis.totalBatches} suffix="" color={T.success} icon={CheckCircle} trend={`${kpis.completedBatches} conformes`} trendPositive delay={80} />
            <KPICard label="Taux de Conformité" value={kpis.conformity} suffix="%" color={kpis.conformity >= 90 ? T.success : T.warning} icon={Shield} trend={kpis.conformity >= 95 ? 'Excellent' : 'À surveiller'} trendPositive={kpis.conformity >= 90} delay={160} />
            <KPICard label="En Production" value={Math.round(kpis.inProgress)} suffix="m³" color={T.info} icon={Clock} trend={`${Math.round(kpis.planned)} m³ planifiés`} trendPositive delay={240} />
          </div>

          <SectionHeader icon={Activity} label="Workflow de Production" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <WorkflowStageCard icon={ClipboardList} count={workflowCounts.planification} label="Planifiés" color={T.warning} delay={0} />
            <WorkflowStageCard icon={Play} count={workflowCounts.production} label="En Production" color={T.info} delay={100} />
            <WorkflowStageCard icon={CheckCircle2} count={workflowCounts.validation} label="Validation" color={T.success} delay={200} />
          </div>
        </section>

        {/* ── CHARTS ── */}
        <section>
          <SectionHeader icon={Activity} label="Production du Jour" />
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ color: T.textSec, fontSize: 12, marginBottom: 4 }}>Production Horaire</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold }}>{Math.round(kpis.totalVolume)} m³</p>
                </div>
                <Badge label="Live" color={T.success} bg={`${T.success}18`} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="prodGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.gold} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<GoldTooltip unit=" m³" />} />
                  <Area type="monotone" dataKey="volume" stroke={T.gold} strokeWidth={2.5} fill="url(#prodGold)" dot={{ fill: T.gold, r: 3 }} activeDot={{ r: 6, fill: T.gold }} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 4 }}>Production par Formule</p>
              {productData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={productData} dataKey="volume" nameKey="name" innerRadius={60} outerRadius={90} animationBegin={200} animationDuration={800} label={false}>
                        {productData.map((p, i) => <Cell key={i} fill={p.color} />)}
                      </Pie>
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, fill: T.gold }}>{totalProductVolume}</text>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0];
                        return (
                          <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                            <p style={{ color: T.textSec, fontSize: 11 }}>{d.name}</p>
                            <p style={{ color: (d.payload as any).color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{(d.value as number).toLocaleString('fr-FR')} m³</p>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {productData.map(p => (
                      <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                          <span style={{ color: T.textSec, fontSize: 12 }}>{p.name}</span>
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.textPri }}>{p.volume} m³</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: T.textDim, fontSize: 13 }}>
                  Aucune donnée de production
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* ── LIVE BATCHES ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Factory size={16} color={T.gold} />
            <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>Batches Récents</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-live 1.5s infinite' }} />
              <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40 0%, transparent 80%)` }} />
          </div>
          {batchDisplayList.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {batchDisplayList.map((batch, i) => (
                <BatchCard key={batch.id + i} batch={batch} delay={i * 60} />
              ))}
            </div>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: 32, color: T.textDim, fontSize: 13 }}>
                Aucun batch enregistré aujourd'hui
              </div>
            </Card>
          )}
        </section>

        {/* ── QUALITY ── */}
        <section>
          <SectionHeader icon={Shield} label="Qualité & Conformité" />
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>
            <Card>
              <p style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Qualité Hebdomadaire</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={qualityData} barSize={24}>
                  <XAxis dataKey="day" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<GoldTooltip />} />
                  <Bar dataKey="ok" stackId="q" fill={T.success} name="OK" radius={[0, 0, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="variances" stackId="q" fill={T.warning} name="Variances" animationDuration={1000} />
                  <Bar dataKey="critical" stackId="q" fill={T.danger} name="Critique" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[['OK', T.success], ['Variances', T.warning], ['Critique', T.danger]].map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    <span style={{ color: T.textSec, fontSize: 11 }}>{label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conformité</p>
                  <Badge label={kpis.conformity >= 95 ? 'Excellent' : kpis.conformity >= 85 ? 'Bon' : 'À surveiller'} color={kpis.conformity >= 90 ? T.success : T.warning} bg={kpis.conformity >= 90 ? `${T.success}18` : `${T.warning}18`} />
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 800, color: T.gold }}>{kpis.conformity}%</p>
              </Card>

              <Card>
                <p style={{ color: totalCriticalWeek === 0 ? T.success : T.danger, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  {totalCriticalWeek === 0 ? '✓ 0 Critiques cette semaine' : `⚠ ${totalCriticalWeek} Critiques cette semaine`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge label={`${totalVariancesWeek} Variances`} color={T.warning} bg={`${T.warning}18`} />
                </div>
              </Card>

              {qualityVariances.length > 0 && (
                <Card>
                  <p style={{ color: T.textSec, fontSize: 12, marginBottom: 12 }}>Détail des variances</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {qualityVariances.map(v => (
                      <div key={v.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: T.textSec, fontSize: 12 }}>{v.label}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.warning, background: `${T.warning}18`, padding: '2px 8px', borderRadius: 999 }}>{v.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>
            TBOS Production v2.0 — Données live • {new Date().toLocaleString('fr-FR')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-live 1.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Connecté</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
