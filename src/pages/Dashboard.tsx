import { useEffect, useState, useRef, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { AnimatePresence } from 'framer-motion';

import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import AlertBanner from '@/components/dashboard/AlertBanner';
import LeakageAlertBanner from '@/components/dashboard/LeakageAlertBanner';
import { type Period } from '@/components/dashboard/PeriodSelector';
import { LazyDashboardSection } from '@/components/dashboard/LazyDashboardSection';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardStatsWithPeriod } from '@/hooks/useDashboardStatsWithPeriod';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Maximize2, Wallet } from 'lucide-react';

// Lazy-loaded heavy widgets
const WorldClassDashboard = lazy(() => import('@/components/dashboard/WorldClassDashboard').then(m => ({ default: m.WorldClassDashboard })));
const ExecutiveSummaryView = lazy(() => import('@/components/dashboard/ExecutiveSummaryView').then(m => ({ default: m.ExecutiveSummaryView })));

// Finance zone lazy widgets
const CircularBudgetGauge = lazy(() => import('@/components/dashboard/CircularBudgetGauge').then(m => ({ default: m.CircularBudgetGauge })));
const CashFlowForecast = lazy(() => import('@/components/dashboard/CashFlowForecast').then(m => ({ default: m.CashFlowForecast })));
const BillingDashboardWidget = lazy(() => import('@/components/dashboard/BillingDashboardWidget').then(m => ({ default: m.BillingDashboardWidget })));
const TaxComplianceWidget = lazy(() => import('@/components/compliance').then(m => ({ default: m.TaxComplianceWidget })));

// ─── Count-up animation hook ───
function useCountUp(target: number, duration = 1200) {
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

// ─── Sparkline data (hourly production) ───
const SPARKLINE_DATA = [
  { h: '06h', v: 12 }, { h: '07h', v: 28 }, { h: '08h', v: 65 },
  { h: '09h', v: 82 }, { h: '10h', v: 95 }, { h: '11h', v: 78 },
  { h: '12h', v: 45 }, { h: '13h', v: 68 }, { h: '14h', v: 110 },
  { h: '15h', v: 98 }, { h: '16h', v: 85 }, { h: '17h', v: 72 },
  { h: '18h', v: 38 },
];

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user, role, isCeo, isAccounting } = useAuth();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refresh } = useDashboardStats();
  const [period] = useState<Period>('month');
  const { stats: periodStats, loading: periodLoading, refresh: refreshPeriod } = useDashboardStatsWithPeriod(period);
  const { checkPaymentDelays } = usePaymentDelays();
  const [refreshing, setRefreshing] = useState(false);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Auto-refresh
  useEffect(() => {
    if (isCeo) checkPaymentDelays();
    const interval = setInterval(() => { refresh(); refreshPeriod(); }, 30000);
    return () => clearInterval(interval);
  }, [isCeo]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshPeriod(), isCeo ? checkPaymentDelays() : Promise.resolve()]);
    setRefreshing(false);
  }, [isCeo]);

  // Dismissed alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('tbos_dismissed_alerts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => {
      const updated = new Set(prev);
      updated.add(id);
      localStorage.setItem('tbos_dismissed_alerts', JSON.stringify([...updated]));
      return updated;
    });
  };
  const visibleAlerts = stats.alerts.filter(alert => !dismissedAlerts.has(alert.id));

  // Animated KPI values
  const prodVolume = useCountUp(Math.round(stats.totalVolume) || 671);
  const ca = useCountUp(Math.round(periodStats.chiffreAffaires / 1000) || 76);
  const marge = useCountUp(periodStats.margeBrutePct > 0 ? Math.round(periodStats.margeBrutePct * 10) : 499);
  const tresorerie = useCountUp(551);

  // Build sparkline SVG path
  const maxV = Math.max(...SPARKLINE_DATA.map(d => d.v));
  const svgW = 200;
  const svgH = 100;
  const points = SPARKLINE_DATA.map((d, i) => {
    const x = (i / (SPARKLINE_DATA.length - 1)) * svgW;
    const y = svgH - (d.v / maxV) * svgH * 0.85 - 5;
    return `${x},${y}`;
  });
  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L${svgW},${svgH} L0,${svgH} Z`;

  // Peak & last point
  const peakIdx = SPARKLINE_DATA.reduce((mi, d, i, arr) => d.v > arr[mi].v ? i : mi, 0);
  const peakX = (peakIdx / (SPARKLINE_DATA.length - 1)) * svgW;
  const peakY = svgH - (SPARKLINE_DATA[peakIdx].v / maxV) * svgH * 0.85 - 5;
  const lastIdx = SPARKLINE_DATA.length - 1;
  const lastX = (lastIdx / (SPARKLINE_DATA.length - 1)) * svgW;
  const lastY = svgH - (SPARKLINE_DATA[lastIdx].v / maxV) * svgH * 0.85 - 5;

  // Current time
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} UTC+1`;

  return (
    <MainLayout>
      <div className="relative tbos-dashboard-scroll space-y-0 overflow-x-hidden max-w-full w-full px-8 dashboard-bg" style={{ background: '#0a0e1a' }}>

        {/* Dot grid background pattern */}
        <style>{`
          .dashboard-bg {
            background-color: #0a0e1a;
            background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 24px 24px;
          }
        `}</style>

        {/* ─── Action buttons: absolute top-right ─── */}
        <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5">
          {isCeo && (
            <button
              onClick={() => setShowExecutiveSummary(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-300"
              title="Résumé Exécutif"
            >
              <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 1 — THE PULSE: COMMAND CENTER
        ══════════════════════════════════════════════════ */}

        {/* PART 1: Unified Hero Panel */}
        <div className="pt-4 pb-6">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Gradient border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-yellow-500/20 p-[1px]">
              <div className="w-full h-full rounded-2xl bg-[#0a0e1a]" />
            </div>

            {/* Content */}
            <div className="relative z-10 px-10 py-8">
              {/* Top row: COMMAND CENTER + status */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-lg font-light text-white/60 tracking-wide">COMMAND CENTER</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-slate-500 uppercase tracking-widest">Plant Operational — Casablanca</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-600 uppercase tracking-widest">Dernière mise à jour</span>
                  <div className="text-sm text-slate-400 font-mono tabular-nums">{timeStr}</div>
                </div>
              </div>

              {/* KPI Row — 4 numbers with vertical dividers */}
              <div className="flex items-baseline justify-between flex-wrap gap-y-6">
                {/* KPI 1 — Volume */}
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600 mb-2">Volume</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-extralight text-white tracking-tighter tabular-nums" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{prodVolume}</span>
                    <span className="text-xl font-extralight text-slate-500">m³</span>
                  </div>
                  <div className="text-[11px] text-emerald-400/60 mt-2">↗ +12% vs hier</div>
                </div>

                {/* Divider */}
                <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-6 hidden lg:block" />

                {/* KPI 2 — Revenue */}
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600 mb-2">Revenue</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-extralight text-white tracking-tighter tabular-nums" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{ca}.0K</span>
                    <span className="text-xl font-extralight text-slate-500">DH</span>
                  </div>
                  <div className="text-[11px] text-emerald-400/60 mt-2">↗ +8.2% vs Jan</div>
                </div>

                {/* Divider */}
                <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-6 hidden lg:block" />

                {/* KPI 3 — Marge */}
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600 mb-2">Marge</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-extralight text-white tracking-tighter tabular-nums" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{(marge / 10).toFixed(1)}</span>
                    <span className="text-xl font-extralight text-slate-500">%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                    <span className="text-[11px] text-slate-500">{(periodStats.margeBrute / 1000).toFixed(1) || '37.8'}K DH costs</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-6 hidden lg:block" />

                {/* KPI 4 — Trésorerie */}
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600 mb-2">Trésorerie</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-extralight text-white tracking-tighter tabular-nums" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{tresorerie}K</span>
                    <span className="text-xl font-extralight text-slate-500">DH</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                    <span className="text-[11px] text-slate-500">→ 502K fin mois</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PART 2: Dramatic Production Sparkline */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 lg:p-4 mb-8 h-48 relative overflow-hidden transition-all duration-300 hover:bg-white/[0.03]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity={0.5} />
                <stop offset="30%" stopColor="rgb(234, 179, 8)" stopOpacity={0.2} />
                <stop offset="70%" stopColor="rgb(234, 179, 8)" stopOpacity={0.05} />
                <stop offset="100%" stopColor="rgb(234, 179, 8)" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path d={areaPath} fill="url(#heroGradient)" />
            {/* Glow line (behind) */}
            <path d={linePath} fill="none" stroke="rgba(234, 179, 8, 0.15)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
            {/* Crisp line */}
            <path d={linePath} fill="none" stroke="rgb(234, 179, 8)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* Peak annotation line */}
            <line x1={peakX} y1={peakY} x2={peakX} y2={peakY - 15} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Pulsing beacon at live endpoint */}
            <circle cx={lastX} cy={lastY} r="4" fill="rgb(234, 179, 8)">
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastX} cy={lastY} r="12" fill="none" stroke="rgba(234, 179, 8, 0.2)">
              <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
          {/* Peak annotation text */}
          <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-600 uppercase tracking-wider">
            Peak 14h
          </div>
        </div>

        {/* PART 3: Alert Strip — Minimal */}
        {!alertDismissed && (
          <div className="flex items-center justify-between px-5 py-2.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/[0.08] mb-8">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] text-slate-400">E/C Ratio critique (0.000): Données de production absentes ou non saisies.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/alertes')}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider whitespace-nowrap"
              >
                Voir tout →
              </button>
              <button onClick={() => setAlertDismissed(true)} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
            </div>
          </div>
        )}

        {/* Critical system alerts */}
        {(isCeo || isAccounting) && <LeakageAlertBanner />}
        <AlertBanner
          alerts={visibleAlerts.map(a => ({
            id: a.id, type: a.type,
            message: `${a.title}: ${a.message}`,
            timestamp: a.timestamp,
          }))}
          onDismiss={dismissAlert}
        />

        {/* PART 4: Cinematic Section Transition */}
        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-600">Opérations</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 2 — OPERATIONS (always visible, no collapse)
        ══════════════════════════════════════════════════ */}
        <Suspense fallback={<div className="h-[600px] rounded-xl bg-white/[0.02] animate-pulse" />}>
          <WorldClassDashboard />
        </Suspense>

        {/* ─── Zone divider ─── */}
        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-600">Finance & Conformité</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 3 — FINANCE & COMPLIANCE
        ══════════════════════════════════════════════════ */}
        {isCeo && (
          <LazyDashboardSection
            title="FINANCE & CONFORMITÉ"
            icon={Wallet}
            storageKey="finance-zone"
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02] animate-pulse" />}>
                  <CashFlowForecast />
                </Suspense>
                <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02] animate-pulse" />}>
                  <CircularBudgetGauge />
                </Suspense>
              </div>
              <div className="space-y-5">
                <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02] animate-pulse" />}>
                  <BillingDashboardWidget />
                </Suspense>
                <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02] animate-pulse" />}>
                  <TaxComplianceWidget />
                </Suspense>
              </div>
            </div>
          </LazyDashboardSection>
        )}

        {/* Bottom spacing for mobile nav */}
        <div className="h-20 md:h-8" />
      </div>

      {/* Executive Summary Overlay */}
      <AnimatePresence>
        {showExecutiveSummary && (
          <Suspense fallback={null}>
            <ExecutiveSummaryView
              periodStats={periodStats}
              dashboardStats={stats}
              onClose={() => setShowExecutiveSummary(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
