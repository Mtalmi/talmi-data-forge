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

import { useCountUp } from '@/hooks/useCountUp';

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

  // Animated KPI values — staggered wave with decimals support
  const prodVolume = useCountUp(Math.round(stats.totalVolume) || 671, 1800, 200);
  const ca = useCountUp(periodStats.chiffreAffaires > 0 ? parseFloat((periodStats.chiffreAffaires / 1000).toFixed(1)) : 76.0, 1800, 400, 1);
  const marge = useCountUp(periodStats.margeBrutePct > 0 ? parseFloat(periodStats.margeBrutePct.toFixed(1)) : 49.9, 1800, 600, 1);
  const tresorerie = useCountUp(551, 1800, 800);

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
        className="relative tbos-dashboard-scroll space-y-0 overflow-x-hidden max-w-full w-full"
        style={{
          background: 'linear-gradient(165deg, #0D1117 0%, #0B0F1A 30%, #0A0E1C 50%, #0F0D1A 80%, #0D1117 100%)',
        }}
      >
        {/* BACKGROUND LAYER: Hexagonal geometric pattern */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            opacity: 0.012,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 15v22L30 52 0 37V15z' fill='none' stroke='%23E8B84B' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 52px',
          }}
        />
        {/* BACKGROUND LAYER: Diagonal accent lines */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            opacity: 0.008,
            backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 80px, rgba(232,184,75,0.15) 80px, rgba(232,184,75,0.15) 81px)`,
          }}
        />

        {/* Dashboard luxury styles */}
        <style>{`
          @keyframes pulse-alert { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
          @keyframes live-ping { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(2.2); opacity: 0; } }
          @keyframes live-ping2 { 0% { transform: scale(1); opacity: 0.4; } 70% { transform: scale(2.8); opacity: 0; } 100% { transform: scale(2.8); opacity: 0; } }
          .tbos-kpi-number { text-shadow: 0 0 30px rgba(232,184,75,0.25), 0 0 60px rgba(232,184,75,0.1); }
          @keyframes cardEntrance {
            0% { opacity: 0; transform: translateY(24px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes drawLine {
            to { stroke-dashoffset: 0; }
          }
          @keyframes fadeInArea {
            to { opacity: 1; }
          }
          @keyframes floatUp {
            0% { transform: translateY(0); opacity: 0; }
            15% { opacity: 0.6; }
            100% { transform: translateY(-100px); opacity: 0; }
          }
          @property --border-angle {
            syntax: "<angle>";
            initial-value: 0deg;
            inherits: false;
          }
          @keyframes rotateBorder {
            to { --border-angle: 360deg; }
          }
          .sparkline-draw path.main-line {
            stroke-dasharray: 2000;
            stroke-dashoffset: 2000;
            animation: drawLine 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
          }
          .sparkline-draw path.glow-line {
            stroke-dasharray: 2000;
            stroke-dashoffset: 2000;
            animation: drawLine 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
          }
          .sparkline-draw path.area-fill {
            opacity: 0;
            animation: fadeInArea 1.5s ease-out 2s forwards;
          }
          .tbos-hero-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 0 0 1px rgba(255,255,255,0.05) inset, 0 2px 4px rgba(0,0,0,0.2), 0 12px 40px rgba(0,0,0,0.3);
          }
          .tbos-hero-card:hover {
            border-color: rgba(232,184,75,0.25);
            box-shadow: 0 0 0 1px rgba(232,184,75,0.1) inset, 0 4px 8px rgba(0,0,0,0.2), 0 20px 60px rgba(232,184,75,0.1);
            transform: translateY(-4px);
          }
          .tbos-hero-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 5%;
            right: 5%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          }
          .tbos-hero-card::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 10%;
            right: 10%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(232,184,75,0.15), transparent);
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

        {/* ─── Action buttons + compass: absolute top-right ─── */}
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

        {/* Construction Crane Silhouette — top-right hero accent */}
        <div className="absolute top-4 right-16 opacity-[0.05] pointer-events-none" style={{ zIndex: 0 }}>
          <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
            {/* Crane mast */}
            <rect x="25" y="10" width="4" height="90" fill="rgba(232,184,75,0.6)" />
            {/* Mast cross-bracing */}
            <line x1="25" y1="20" x2="29" y2="30" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            <line x1="29" y1="20" x2="25" y2="30" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            <line x1="25" y1="35" x2="29" y2="45" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            <line x1="29" y1="35" x2="25" y2="45" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            <line x1="25" y1="50" x2="29" y2="60" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            <line x1="29" y1="50" x2="25" y2="60" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            <line x1="25" y1="65" x2="29" y2="75" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            <line x1="29" y1="65" x2="25" y2="75" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            {/* Jib (horizontal arm) */}
            <rect x="29" y="10" width="80" height="2.5" fill="rgba(232,184,75,0.5)" />
            {/* Counter-jib */}
            <rect x="5" y="10" width="20" height="2.5" fill="rgba(232,184,75,0.4)" />
            <rect x="5" y="8" width="8" height="6" fill="rgba(232,184,75,0.35)" />
            {/* Jib support cables */}
            <line x1="27" y1="5" x2="109" y2="10" stroke="rgba(232,184,75,0.35)" strokeWidth="0.5" />
            <line x1="27" y1="5" x2="5" y2="10" stroke="rgba(232,184,75,0.35)" strokeWidth="0.5" />
            <line x1="27" y1="5" x2="27" y2="10" stroke="rgba(232,184,75,0.5)" strokeWidth="1" />
            <line x1="27" y1="5" x2="70" y2="10" stroke="rgba(232,184,75,0.3)" strokeWidth="0.5" />
            {/* Hook cable */}
            <line x1="95" y1="12.5" x2="95" y2="45" stroke="rgba(232,184,75,0.4)" strokeWidth="0.5" />
            {/* Hook */}
            <path d="M93,45 Q93,50 95,50 Q97,50 97,45" fill="none" stroke="rgba(232,184,75,0.5)" strokeWidth="0.8" />
            <rect x="93" y="43" width="4" height="3" fill="rgba(232,184,75,0.4)" />
            {/* Counterweight */}
            <rect x="5" y="14" width="10" height="8" fill="rgba(232,184,75,0.3)" />
            {/* Base */}
            <rect x="15" y="95" width="24" height="5" rx="1" fill="rgba(232,184,75,0.35)" />
          </svg>
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 1 — THE PULSE: COMMAND CENTER
        ══════════════════════════════════════════════════ */}

        {/* Hero zone wrapper with ambient aurora */}
        <div className="relative">
        {/* Ambient light orbs — DRAMATIC */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
              <div className="absolute -top-40 left-1/3 w-[800px] h-[600px] rounded-full" 
                   style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 60%)', filter: 'blur(120px)' }} />
              <div className="absolute -top-20 right-[10%] w-[500px] h-[400px] rounded-full" 
                   style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%)', filter: 'blur(100px)' }} />
              <div className="absolute top-[40%] -left-20 w-[400px] h-[400px] rounded-full" 
                   style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.035) 0%, transparent 60%)', filter: 'blur(80px)' }} />
            </div>

          {/* Engineering grid pattern — blueprint precision */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ 
              zIndex: 0,
              opacity: 0.02,
              backgroundImage: `linear-gradient(rgba(232,184,75,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.3) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
          {/* Grid fade-out */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to top, #080C14, transparent)' }} />

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

          {/* Hero KPI Cards — Premium Data Monuments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-5 relative z-[1]">
          {[
            {
              label: 'VOLUME',
              value: prodVolume,
              unit: 'm³',
              watermark: 'm³',
              sub: 'Peak 14h',
              trend: '↗ +12%',
              accentColor: '#00D9FF',
              labelColor: 'rgba(0,217,255,0.6)',
            },
            {
              label: 'REVENUE',
              value: ca,
              unit: 'K DH',
              watermark: 'DH',
              sub: `${periodStats.nbFactures || 11} factures`,
              trend: '↗ +8.2%',
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
            },
            {
              label: 'MARGE',
              value: marge,
              unit: '%',
              watermark: '%',
              sub: `${(periodStats.margeBrute / 1000).toFixed(1) || '37.8'}K DH costs`,
              healthy: true,
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
            },
            {
              label: 'TRÉSORERIE',
              value: tresorerie,
              unit: 'K DH',
              watermark: 'DH',
              sub: '→ 502K fin mois',
              healthy: true,
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
            },
          ].map((kpi, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl p-8 group cursor-default"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
                transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
                animation: `cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(253,185,19,0.2)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2), 0 16px 48px rgba(253,185,19,0.08), inset 0 1px 0 rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)';
              }}
            >
              {/* Top white highlight */}
              <div className="absolute top-0 left-[5%] right-[5%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
              {/* Category color bar */}
              <div className="absolute top-0 left-[10%] right-[10%] h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${kpi.accentColor}80, transparent)` }} />
              {/* Giant unit watermark */}
              <div className="absolute bottom-[-10px] right-2 text-[80px] font-extralight leading-none pointer-events-none select-none" style={{ color: `${kpi.accentColor}08`, fontFamily: 'Inter, system-ui' }}>
                {kpi.watermark}
              </div>

              {/* Label */}
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: kpi.labelColor }}>
                {kpi.label}
              </div>

              {/* Main number with count-up */}
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-[2.75rem] font-extralight text-white tabular-nums tbos-kpi-number" style={{ fontFamily: 'Inter, system-ui', letterSpacing: '-0.03em' }}>
                  {typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}
                </span>
                <span className="text-sm font-light text-slate-500">{kpi.unit}</span>
              </div>

              {/* Sub info */}
              <div className="text-[11px] text-slate-500 mt-3 font-mono tabular-nums">{kpi.sub}</div>

              {/* Trend indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                {kpi.trend && (
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: kpi.accentColor }}>{kpi.trend}</span>
                )}
                {kpi.healthy && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.4)' }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* The Sparkline — A Living Pulse */}
        <div
          className="mt-5 mb-4 relative z-[1] p-[1px] rounded-[20px]"
          style={{
            background: `conic-gradient(from var(--border-angle, 0deg), rgba(253,185,19,0.3), rgba(253,185,19,0.05), rgba(59,130,246,0.1), rgba(253,185,19,0.3))`,
            animation: 'rotateBorder 8s linear infinite',
          }}
        >
        <div
          className="rounded-[19px] relative overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(180deg, rgba(253,185,19,0.04) 0%, rgba(253,185,19,0.005) 30%, #0B0F1A 100%)',
            border: '1px solid rgba(255,255,255,0.04)',
            height: '220px',
            padding: '20px 24px',
          }}
        >
          {/* Batching Plant Silhouette — THE SIGNATURE */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06, zIndex: 0 }} preserveAspectRatio="xMidYMax meet" viewBox="0 0 800 200">
            <rect x="30" y="60" width="35" height="120" rx="17" fill="rgba(232,184,75,0.5)" />
            <rect x="70" y="40" width="40" height="140" rx="20" fill="rgba(232,184,75,0.6)" />
            <rect x="115" y="55" width="35" height="125" rx="17" fill="rgba(232,184,75,0.45)" />
            <ellipse cx="90" cy="38" rx="22" ry="6" fill="rgba(232,184,75,0.4)" />
            <line x1="150" y1="90" x2="280" y2="50" stroke="rgba(232,184,75,0.4)" strokeWidth="3" />
            <line x1="152" y1="95" x2="282" y2="55" stroke="rgba(232,184,75,0.25)" strokeWidth="1.5" />
            <rect x="270" y="50" width="80" height="80" rx="4" fill="rgba(232,184,75,0.5)" />
            <polygon points="280,130 290,160 350,160 360,130" fill="rgba(232,184,75,0.4)" />
            <rect x="295" y="35" width="30" height="18" rx="2" fill="rgba(232,184,75,0.35)" />
            <circle cx="310" cy="90" r="15" fill="none" stroke="rgba(232,184,75,0.3)" strokeWidth="1.5" />
            <line x1="320" y1="160" x2="340" y2="175" stroke="rgba(232,184,75,0.4)" strokeWidth="3" />
            <line x1="320" y1="160" x2="300" y2="175" stroke="rgba(232,184,75,0.4)" strokeWidth="3" />
            <rect x="290" y="175" width="60" height="20" rx="3" fill="rgba(232,184,75,0.35)" />
            <circle cx="300" cy="198" r="5" fill="rgba(232,184,75,0.3)" />
            <circle cx="340" cy="198" r="5" fill="rgba(232,184,75,0.3)" />
            <rect x="400" y="30" width="30" height="150" rx="2" fill="rgba(232,184,75,0.4)" />
            <rect x="395" y="25" width="40" height="25" rx="3" fill="rgba(232,184,75,0.45)" />
            <rect x="405" y="30" width="6" height="5" rx="1" fill="rgba(232,184,75,0.9)" />
            <rect x="418" y="30" width="6" height="5" rx="1" fill="rgba(232,184,75,0.9)" />
            <rect x="405" y="38" width="6" height="5" rx="1" fill="rgba(232,184,75,0.7)" />
            <polygon points="500,100 530,100 540,180 490,180" fill="rgba(232,184,75,0.4)" />
            <polygon points="545,90 575,90 585,180 535,180" fill="rgba(232,184,75,0.35)" />
            <polygon points="590,105 615,105 625,180 580,180" fill="rgba(232,184,75,0.3)" />
            <line x1="515" y1="100" x2="350" y2="60" stroke="rgba(232,184,75,0.3)" strokeWidth="2.5" />
            <line x1="560" y1="90" x2="355" y2="55" stroke="rgba(232,184,75,0.2)" strokeWidth="1.5" />
            <rect x="660" y="50" width="30" height="130" rx="15" fill="rgba(232,184,75,0.4)" />
            <rect x="700" y="65" width="30" height="115" rx="15" fill="rgba(232,184,75,0.35)" />
            <rect x="740" y="55" width="30" height="125" rx="15" fill="rgba(232,184,75,0.3)" />
            <ellipse cx="675" cy="48" rx="17" ry="5" fill="rgba(232,184,75,0.3)" />
            <line x1="0" y1="200" x2="800" y2="200" stroke="rgba(232,184,75,0.25)" strokeWidth="1" />
          </svg>

          {/* Floating golden particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${1 + Math.random() * 3}px`,
                  height: `${1 + Math.random() * 3}px`,
                  background: 'rgba(232,184,75,0.6)',
                  left: `${5 + Math.random() * 90}%`,
                  bottom: `${10 + Math.random() * 40}%`,
                  animation: `floatUp ${3 + Math.random() * 4}s ease-out ${Math.random() * 5}s infinite`,
                  boxShadow: '0 0 4px rgba(232,184,75,0.4)',
                }}
              />
            ))}
          </div>

          {/* LIVE indicator — double ripple */}
          <div className="absolute top-5 left-6 flex items-center gap-2.5 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-40" />
              <span className="absolute h-full w-full rounded-full bg-emerald-400 opacity-15 animate-ping" style={{ animationDelay: '0.5s' }} />
              <span className="relative rounded-full h-2 w-2 bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.5)' }} />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-emerald-400/60">Live</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-mono">Peak 14h</span>
          </div>

          {/* Timestamp */}
          <div className="absolute top-5 right-6 text-[10px] font-mono text-slate-600 z-10 tabular-nums">{timeStr}</div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full sparkline-draw relative z-[1]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDB913" stopOpacity={0.5} />
                <stop offset="30%" stopColor="#FDB913" stopOpacity={0.2} />
                <stop offset="70%" stopColor="#FDB913" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#FDB913" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Area fill — fades in after line draws */}
            <path d={areaPath} fill="url(#sparkGlow)" className="area-fill" />
            {/* Glow line (behind — wide soft glow for light emission) */}
            <path d={linePath} fill="none" stroke="#FDB913" strokeWidth="8" strokeOpacity="0.12" strokeLinejoin="round" strokeLinecap="round" className="glow-line" />
            {/* Crisp line — draws itself */}
            <path d={linePath} fill="none" stroke="#FDB913" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="main-line" />
            {/* Peak annotation line */}
            <line x1={peakX} y1={peakY} x2={peakX} y2={peakY - 15} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Pulsing beacon at live endpoint */}
            <circle cx={lastX} cy={lastY} r="4" fill="#FDB913">
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastX} cy={lastY} r="12" fill="none" stroke="rgba(253,185,19,0.2)">
              <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        </div>{/* end sparkline rotating border wrapper */}

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

        {/* Cinematic Section Transition — Opérations */}
        <div className="relative mt-8 mb-8 py-4">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,184,75,0.12), transparent)' }} />
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">Opérations</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,184,75,0.12), transparent)' }} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 2 — OPERATIONS (always visible)
        ══════════════════════════════════════════════════ */}
        <Suspense fallback={<div className="h-[600px] rounded-xl bg-white/[0.02] animate-pulse" />}>
          <WorldClassDashboard />
        </Suspense>

        {/* Cinematic Section Transition — Finance */}
        <div className="relative my-8 py-4">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,184,75,0.12), transparent)' }} />
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-600">Finance & Conformité</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,184,75,0.12), transparent)' }} />
          </div>
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
