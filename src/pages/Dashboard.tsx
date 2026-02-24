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

  // Extract user first name
  const rawFirst = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Directeur';
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

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
      <div
        className="relative tbos-dashboard-scroll space-y-0 overflow-x-hidden max-w-full w-full px-8"
        style={{
          background: '#080C14',
          backgroundImage: [
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(234, 179, 8, 0.04) 0%, transparent 50%)',
            'radial-gradient(ellipse 60% 40% at 80% 20%, rgba(234, 179, 8, 0.02) 0%, transparent 40%)',
            'radial-gradient(ellipse 50% 50% at 20% 80%, rgba(59, 130, 246, 0.015) 0%, transparent 40%)',
          ].join(', '),
        }}
      >

        {/* Dashboard luxury styles */}
        <style>{`
          @keyframes pulse-alert { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
          @keyframes live-ping { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(2.2); opacity: 0; } }
          .tbos-kpi-number { text-shadow: 0 0 40px rgba(234, 179, 8, 0.15), 0 0 80px rgba(234, 179, 8, 0.05); }
          .tbos-hero-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 28px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15);
          }
          .tbos-hero-card:hover {
            border-color: rgba(234, 179, 8, 0.15);
            box-shadow: 0 8px 40px rgba(234, 179, 8, 0.06), 0 0 0 1px rgba(234, 179, 8, 0.08);
            transform: translateY(-2px);
          }
          .tbos-hero-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 10%;
            right: 10%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          }
        `}</style>

        {/* Noise/grain texture overlay — concrete materiality */}
        <div 
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay' as const,
          }}
        />

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

        {/* Hero zone wrapper with ambient aurora */}
        <div className="relative">
          {/* Golden aurora behind hero */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <div className="absolute -top-32 left-[20%] w-[500px] h-[400px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.04) 0%, transparent 70%)', filter: 'blur(100px)' }} />
            <div className="absolute -top-20 right-[15%] w-[400px] h-[350px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.025) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          </div>

          {/* Greeting — Commanding Presence */}
          <div className="pt-4 pb-6 relative z-[1]">
            <h1 className="text-[28px] font-light text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {firstName}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.4)' }} />
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-slate-500">Operational</span>
              <span className="text-[9px] font-normal text-slate-600 tracking-wider">Casablanca</span>
            </div>
          </div>

          {/* Hero KPI Cards — Glowing Data Monuments */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5 relative z-[1]">
          {[
            {
              label: 'VOLUME',
              value: `${prodVolume}`,
              unit: 'm³',
              sub: 'Peak 14h',
              trend: '↗ +12%',
            },
            {
              label: 'REVENUE',
              value: `${ca}.0K`,
              unit: 'DH',
              sub: `${periodStats.nbFactures || 11} factures`,
              trend: '↗ +8.2%',
            },
            {
              label: 'MARGE',
              value: `${(marge / 10).toFixed(1)}`,
              unit: '%',
              sub: `${(periodStats.margeBrute / 1000).toFixed(1) || '37.8'}K DH costs`,
              healthy: true,
            },
            {
              label: 'TRÉSORERIE',
              value: `${tresorerie}K`,
              unit: 'DH',
              sub: '→ 502K fin mois',
              healthy: true,
            },
          ].map((kpi, i) => (
            <div key={i} className="tbos-hero-card cursor-default min-w-0 overflow-hidden">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(234, 179, 8, 0.5)' }}>
                {kpi.label}
              </div>
              <div className="leading-none tabular-nums whitespace-nowrap" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <span className="text-4xl font-extralight text-white leading-none tbos-kpi-number">
                  {kpi.value}
                </span>
                <span className="text-base font-extralight text-slate-500 ml-1">{kpi.unit}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">{kpi.sub}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {kpi.trend && (
                  <span className="text-[11px]" style={{ color: '#E8B84B' }}>{kpi.trend}</span>
                )}
                {kpi.healthy && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* The Sparkline — A Living Pulse */}
        <div
          className="rounded-2xl p-3 lg:p-4 mt-5 mb-4 h-44 relative overflow-hidden transition-all duration-300 z-[1]"
          style={{
            background: 'linear-gradient(180deg, rgba(232,184,75,0.025) 0%, rgba(232,184,75,0.005) 40%, transparent 100%)',
            border: '1px solid rgba(255,255,255,0.03)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15)',
          }}
        >
          {/* LIVE indicator */}
          <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-slate-500">Live</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600 ml-1">Peak 14h</span>
          </div>

          {/* Last update */}
          <div className="absolute top-3 right-4 z-10">
            <span className="text-[9px] font-mono text-slate-600 tabular-nums">{timeStr}</span>
          </div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8B84B" stopOpacity={0.5} />
                <stop offset="30%" stopColor="#E8B84B" stopOpacity={0.2} />
                <stop offset="70%" stopColor="#E8B84B" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#E8B84B" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path d={areaPath} fill="url(#heroGradient)" />
            {/* Glow line (behind) */}
            <path d={linePath} fill="none" stroke="rgba(232, 184, 75, 0.15)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
            {/* Crisp line */}
            <path d={linePath} fill="none" stroke="#E8B84B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* Peak annotation line */}
            <line x1={peakX} y1={peakY} x2={peakX} y2={peakY - 15} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Pulsing beacon at live endpoint */}
            <circle cx={lastX} cy={lastY} r="4" fill="#E8B84B">
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastX} cy={lastY} r="12" fill="none" stroke="rgba(232, 184, 75, 0.2)">
              <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        </div>{/* end hero zone wrapper */}

        {/* Alert Strip — Intelligent Urgency */}
        {!alertDismissed && (
          <div
            className="flex items-center justify-between px-5 py-3 rounded-xl mb-8"
            style={{
              background: 'linear-gradient(90deg, rgba(234,179,8,0.06) 0%, rgba(234,179,8,0.02) 50%, rgba(234,179,8,0.06) 100%)',
              border: '1px solid rgba(234,179,8,0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'pulse-alert 3s ease-in-out infinite' }} />
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

        {/* Cinematic Section Transition */}
        <div className="mt-8 mb-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">Opérations</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 2 — OPERATIONS (always visible)
        ══════════════════════════════════════════════════ */}
        <Suspense fallback={<div className="h-[600px] rounded-xl bg-white/[0.02] animate-pulse" />}>
          <WorldClassDashboard />
        </Suspense>

        {/* Zone divider */}
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
