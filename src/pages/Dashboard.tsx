import { useEffect, useState, useRef, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import AlertBanner from '@/components/dashboard/AlertBanner';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';
import LeakageAlertBanner from '@/components/dashboard/LeakageAlertBanner';
import { type Period } from '@/components/dashboard/PeriodSelector';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { LazyDashboardSection } from '@/components/dashboard/LazyDashboardSection';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardStatsWithPeriod } from '@/hooks/useDashboardStatsWithPeriod';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { useAuth } from '@/hooks/useAuth';
import {
  RefreshCw, Maximize2, Wallet, Zap, AlertTriangle,
  TrendingUp, TrendingDown
} from 'lucide-react';

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

  // Extract user first name
  const rawFirst = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Directeur';
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  // Animated KPI values
  const prodVolume = useCountUp(Math.round(stats.totalVolume) || 851);
  const ca = useCountUp(Math.round(periodStats.chiffreAffaires / 1000) || 75);
  const marge = useCountUp(periodStats.margeBrutePct > 0 ? Math.round(periodStats.margeBrutePct * 10) : 490);
  const tresorerie = useCountUp(551);

  // Build sparkline SVG path
  const maxV = Math.max(...SPARKLINE_DATA.map(d => d.v));
  const svgW = 100;
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
  const lastX = svgW;
  const lastY = svgH - (SPARKLINE_DATA[lastIdx].v / maxV) * svgH * 0.85 - 5;

  return (
    <MainLayout>
      <div className="relative tbos-dashboard-scroll space-y-0 overflow-x-hidden max-w-full w-full px-8" style={{ background: '#0B0F1A' }}>

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
            ZONE 1 — THE PULSE (above the fold)
        ══════════════════════════════════════════════════ */}

        {/* Row 1: Greeting + Status pills */}
        <div className="pt-2 pb-6">
          <h1 className="text-2xl font-light text-white/80 tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {firstName}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-[pulse-subtle_3s_ease-in-out_infinite]" />
              Operational
            </span>
            <span className="text-[11px] text-slate-600">Casablanca</span>
          </div>
        </div>

        {/* Row 2: Hero KPI Cards — 4 columns */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {[
            {
              label: 'PRODUCTION TODAY',
              value: `${prodVolume}`,
              unit: 'm³',
              sub: 'Peak 14h',
              compare: '+12%',
              positive: true,
            },
            {
              label: "CHIFFRE D'AFFAIRES",
              value: `${ca}.0K`,
              unit: 'DH',
              sub: `${periodStats.nbFactures || 11} factures`,
              compare: '+8.2%',
              positive: true,
            },
            {
              label: 'MARGE BRUTE',
              value: `${(marge / 10).toFixed(1)}`,
              unit: '%',
              sub: `${(periodStats.margeBrute / 1000).toFixed(1) || '37.8'}K DH`,
              compare: null,
              healthy: true,
            },
            {
              label: 'TRÉSORERIE',
              value: `${tresorerie}K`,
              unit: 'DH',
              sub: '→ 502K fin mois',
              compare: null,
              healthy: true,
            },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
              }}
              className="rounded-xl p-7 transition-all duration-500 ease-out cursor-default relative overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-yellow-500/[0.12]"
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 mb-3">
                {kpi.label}
              </div>
              <div className="leading-none tabular-nums" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <span className="text-5xl font-extralight tracking-tight text-white leading-none">
                  {kpi.value}
                </span>
                <span className="text-lg font-extralight text-slate-400 ml-1">{kpi.unit}</span>
              </div>
              <div className="text-xs font-normal text-slate-500 mt-1.5">{kpi.sub}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {kpi.compare && (
                  <span className={`text-xs flex items-center gap-0.5 ${kpi.positive ? 'text-primary' : 'text-destructive'}`}>
                    {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {kpi.compare}
                  </span>
                )}
                {kpi.healthy && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Row 3: Live Production Sparkline */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 lg:p-4 mb-8 h-28 lg:h-32 relative overflow-hidden transition-all duration-300 hover:bg-white/[0.04]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity="0.4" />
                <stop offset="40%" stopColor="rgb(234, 179, 8)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="rgb(234, 179, 8)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#sparkGrad)" />
            <path d={linePath} fill="none" stroke="rgb(234, 179, 8)" strokeWidth="2" strokeLinejoin="round" />
            {/* Pulsing dot at last data point */}
            <circle cx={lastX} cy={lastY} r="3" fill="rgb(234, 179, 8)">
              <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
          {/* Peak annotation */}
          <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] text-slate-500">
            Peak 14h
          </div>
        </div>

        {/* Row 4: Alert Strip */}
        {!alertDismissed && (
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-2 mb-8 text-xs">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
            <span className="text-slate-400 flex-1">
              E/C Ratio critique (0.000): Données de production absentes ou non saisies.
            </span>
            <button
              onClick={() => navigate('/alertes')}
              className="text-primary font-medium whitespace-nowrap hover:underline text-[11px]"
            >
              Voir tout →
            </button>
            <button onClick={() => setAlertDismissed(true)} className="text-slate-600 hover:text-slate-400 ml-1">✕</button>
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

        {/* ─── Zone divider ─── */}
        <div className="h-px bg-white/[0.04] my-8" />

        {/* ══════════════════════════════════════════════════
            ZONE 2 — OPERATIONS (collapsible)
        ══════════════════════════════════════════════════ */}
        <DashboardSection
          title="OPÉRATIONS"
          icon={Zap}
          storageKey="ops-zone"
          defaultOpen={true}
        >
          <Suspense fallback={<div className="h-[600px] rounded-xl bg-white/[0.02] animate-pulse" />}>
            <WorldClassDashboard />
          </Suspense>
        </DashboardSection>

        {/* ─── Zone divider ─── */}
        <div className="h-px bg-white/[0.04] my-8" />

        {/* ══════════════════════════════════════════════════
            ZONE 3 — FINANCE & COMPLIANCE (collapsed by default)
        ══════════════════════════════════════════════════ */}
        {isCeo && (
          <LazyDashboardSection
            title="FINANCE & CONFORMITÉ"
            icon={Wallet}
            storageKey="finance-zone"
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: Cash-Flow + Budget */}
              <div className="space-y-5">
                <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02] animate-pulse" />}>
                  <CashFlowForecast />
                </Suspense>
                <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02] animate-pulse" />}>
                  <CircularBudgetGauge />
                </Suspense>
              </div>
              {/* Right: Billing + Tax Compliance */}
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
