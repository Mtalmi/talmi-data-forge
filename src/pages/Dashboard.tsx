import { useEffect, useState, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
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
import { RefreshCw, Maximize2, Wallet, LayoutDashboard, Activity, Factory, Truck, Package, TrendingUp, Radio } from 'lucide-react';
import { IntelligenceBriefingCard } from '@/components/dashboard/IntelligenceBriefingCard';

// Lazy-loaded heavy widgets
const WorldClassDashboard = lazy(() => import('@/components/dashboard/WorldClassDashboard').then(m => ({ default: m.WorldClassDashboard })));
const ExecutiveSummaryView = lazy(() => import('@/components/dashboard/ExecutiveSummaryView').then(m => ({ default: m.ExecutiveSummaryView })));
const PlantFlowSchematic = lazy(() => import('@/components/dashboard/PlantFlowSchematic'));
const LiveBatchProgress = lazy(() => import('@/components/dashboard/LiveBatchProgress'));

// Finance zone lazy widgets
const CircularBudgetGauge = lazy(() => import('@/components/dashboard/CircularBudgetGauge').then(m => ({ default: m.CircularBudgetGauge })));
const CashFlowForecast = lazy(() => import('@/components/dashboard/CashFlowForecast').then(m => ({ default: m.CashFlowForecast })));
const BillingDashboardWidget = lazy(() => import('@/components/dashboard/BillingDashboardWidget').then(m => ({ default: m.BillingDashboardWidget })));
const TaxComplianceWidget = lazy(() => import('@/components/compliance').then(m => ({ default: m.TaxComplianceWidget })));

import { useCountUp } from '@/hooks/useCountUp';
import { TiltCard } from '@/components/dashboard/TiltCard';

// ─── Sparkline data (hourly production) ───
const SPARKLINE_DATA = [
  { h: '06h', v: 12 }, { h: '07h', v: 28 }, { h: '08h', v: 65 },
  { h: '09h', v: 82 }, { h: '10h', v: 95 }, { h: '11h', v: 78 },
  { h: '12h', v: 45 }, { h: '13h', v: 68 }, { h: '14h', v: 110 },
  { h: '15h', v: 98 }, { h: '16h', v: 85 }, { h: '17h', v: 72 },
  { h: '18h', v: 38 },
];

// ─── Target curve (planned daily production) ───
const TARGET_DATA = [
  { h: '06h', t: 10 }, { h: '07h', t: 25 }, { h: '08h', t: 55 },
  { h: '09h', t: 80 }, { h: '10h', t: 100 }, { h: '11h', t: 90 },
  { h: '12h', t: 50 }, { h: '13h', t: 75 }, { h: '14h', t: 105 },
  { h: '15h', t: 95 }, { h: '16h', t: 80 }, { h: '17h', t: 65 },
  { h: '18h', t: 35 },
];

// ─── Batch event markers ───
const BATCH_EVENTS = [
  { h: '08h', type: 'batch', label: 'B25 · 8m³' },
  { h: '10h', type: 'truck', label: '🚛 45m³' },
  { h: '13h', type: 'truck', label: '🚛 80m³' },
  { h: '14h', type: 'batch', label: 'B30 · 12m³' },
];

// NOW hour index (mock: 15h = index 9)
const NOW_INDEX = 9;

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
  const [hoveredChartIdx, setHoveredChartIdx] = useState<number | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<'command' | 'production' | 'operations'>('command');
  // ─── Typewriter effect for greeting ───
  const [typedName, setTypedName] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);

  // Extract user first name (needed before typewriter)
  const rawFirst = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Max';
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  // Time-aware greeting (Casablanca UTC+1)
  const getGreeting = () => {
    const now = new Date();
    const casablancaHour = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Casablanca' })).getHours();
    if (casablancaHour < 12) return 'Bonjour';
    if (casablancaHour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };
  const greeting = getGreeting();

  // Auto-refresh — useDashboardStats already polls every 30s + has realtime,
  // so we only need to check payment delays and refresh period stats
  useEffect(() => {
    if (isCeo) checkPaymentDelays();
    const interval = setInterval(() => { refreshPeriod(); }, 60000);
    return () => clearInterval(interval);
  }, [isCeo]);

  // ─── Typewriter boot sequence ───
  useEffect(() => {
    const name = firstName;
    let i = 0;
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedName(name.slice(0, i + 1));
        i++;
        if (i >= name.length) {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 1200);
        }
      }, 90);
      return () => clearInterval(interval);
    }, 600);
    return () => clearTimeout(delay);
  }, [firstName]);


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


  // Animated KPI values — locked for CEO demo determinism
  const prodVolume = useCountUp(671, 1800, 200);
  const ca = useCountUp(75.6, 1800, 400, 1);
  const marge = useCountUp(49.9, 1800, 600, 1);
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

  // Combine actual + target max for Y scaling
  const allMax = Math.max(maxV, Math.max(...TARGET_DATA.map(d => d.t)));

  // Target line path
  const targetPoints = TARGET_DATA.map((d, i) => {
    const x = (i / (TARGET_DATA.length - 1)) * svgW;
    const y = svgH - (d.t / allMax) * svgH * 0.85 - 5;
    return `${x},${y}`;
  });
  const targetLinePath = `M${targetPoints.join(' L')}`;

  // NOW playhead X position
  const nowX = (NOW_INDEX / (SPARKLINE_DATA.length - 1)) * svgW;

  // Past line path (up to NOW_INDEX, solid)
  const pastPoints = SPARKLINE_DATA.slice(0, NOW_INDEX + 1).map((d, i) => {
    const x = (i / (SPARKLINE_DATA.length - 1)) * svgW;
    const y = svgH - (d.v / allMax) * svgH * 0.85 - 5;
    return `${x},${y}`;
  });
  const pastLinePath = `M${pastPoints.join(' L')}`;
  const pastAreaPath = `${pastLinePath} L${nowX},${svgH} L0,${svgH} Z`;

  // Forecast line path (from NOW_INDEX onward, dashed)
  const forecastPoints = SPARKLINE_DATA.slice(NOW_INDEX).map((d, i) => {
    const idx = NOW_INDEX + i;
    const x = (idx / (SPARKLINE_DATA.length - 1)) * svgW;
    const y = svgH - (d.v / allMax) * svgH * 0.85 - 5;
    return `${x},${y}`;
  });
  const forecastLinePath = `M${forecastPoints.join(' L')}`;

  // Reference line Y positions (scaled to allMax)
  const refY = (val: number) => svgH - (val / allMax) * svgH * 0.85 - 5;
  const objectifY = refY(105); // ~320m³ daily mapped to hourly peak scale
  const seuilY = refY(70);     // ~200m³ daily mapped to hourly

  // Peak & last point (recalculated with allMax)
  const peakIdx = SPARKLINE_DATA.reduce((mi, d, i, arr) => d.v > arr[mi].v ? i : mi, 0);
  const peakX = (peakIdx / (SPARKLINE_DATA.length - 1)) * svgW;
  const peakY = svgH - (SPARKLINE_DATA[peakIdx].v / allMax) * svgH * 0.85 - 5;
  const lastIdx = SPARKLINE_DATA.length - 1;
  const lastX = (lastIdx / (SPARKLINE_DATA.length - 1)) * svgW;
  const lastY = svgH - (SPARKLINE_DATA[lastIdx].v / allMax) * svgH * 0.85 - 5;

  // Current time
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} UTC+1`;

  // Batch event marker positions
  const batchMarkerPositions = BATCH_EVENTS.map(evt => {
    const idx = SPARKLINE_DATA.findIndex(d => d.h === evt.h);
    if (idx === -1) return null;
    const x = (idx / (SPARKLINE_DATA.length - 1)) * svgW;
    const y = svgH - (SPARKLINE_DATA[idx].v / allMax) * svgH * 0.85 - 5;
    return { ...evt, x, y };
  }).filter(Boolean) as Array<{ h: string; type: string; label: string; x: number; y: number }>;

  // Hover point computation
  const hoveredPoint = hoveredChartIdx !== null ? (() => {
    const d = SPARKLINE_DATA[hoveredChartIdx];
    const x = (hoveredChartIdx / (SPARKLINE_DATA.length - 1)) * svgW;
    const y = svgH - (d.v / allMax) * svgH * 0.85 - 5;
    const hourNum = parseInt(d.h);
    const timeLabel = `${hourNum.toString().padStart(2, '0')}:00`;
    return { x, y, v: d.v, h: d.h, time: timeLabel };
  })() : null;

  const handleChartMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width * svgW;
    const closest = SPARKLINE_DATA.reduce((best, _, i) => {
      const px = (i / (SPARKLINE_DATA.length - 1)) * svgW;
      const dist = Math.abs(px - relX);
      return dist < best.dist ? { idx: i, dist } : best;
    }, { idx: 0, dist: Infinity });
    setHoveredChartIdx(closest.idx);
  }, [svgW, allMax]);

  const handleChartMouseLeave = useCallback(() => setHoveredChartIdx(null), []);

  return (
    <MainLayout>
      <div
        className="relative tbos-dashboard-scroll space-y-0 overflow-x-hidden max-w-full w-full min-w-0 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 md:pt-6 lg:pt-2 pb-3 sm:pb-4 md:pb-6 lg:pb-8 box-border"
        style={{
          background: 'linear-gradient(145deg, #11182E, #162036)',
        }}
      >

        {/* Dashboard luxury styles */}
        <style>{`
          @keyframes pulse-alert { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
          @keyframes live-ping { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(2.2); opacity: 0; } }
          @keyframes live-ping2 { 0% { transform: scale(1); opacity: 0.4; } 70% { transform: scale(2.8); opacity: 0; } 100% { transform: scale(2.8); opacity: 0; } }
          @keyframes heroGlow {
            0%, 100% { opacity: 0.5; filter: blur(60px); }
            50% { opacity: 0.8; filter: blur(80px); }
          }
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          .tbos-hero-card {
            background: linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 40%, rgba(255,255,255,0.02) 100%);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 28px 28px 24px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(24px) saturate(1.3);
            -webkit-backdrop-filter: blur(24px) saturate(1.3);
            transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.05),
              inset 0 0 30px rgba(253,185,19,0.01),
              0 1px 3px rgba(0,0,0,0.12),
              0 8px 32px rgba(0,0,0,0.15);
          }
          .tbos-hero-card:hover {
            border-color: rgba(255,255,255,0.14);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 0 60px rgba(253,185,19,0.03),
              0 4px 8px rgba(0,0,0,0.15),
              0 24px 64px rgba(0,0,0,0.25),
              0 0 0 1px rgba(253,185,19,0.1);
            transform: translateY(-4px);
          }
          .tbos-hero-card::before {
            display: none !important;
            content: none !important;
          }
          .tbos-hero-card::after {
            display: none !important;
            content: none !important;
          }
          .tbos-hero-card .scanline-overlay {
            display: none !important;
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


        {/* ══════════════════════════════════════════════════
            ZONE 1 — THE PULSE: COMMAND CENTER
        ══════════════════════════════════════════════════ */}

        {/* Hero zone wrapper with cinematic backdrop */}
        <div className="relative" ref={heroRef}>

          {/* Ambient Light Pools — visible warm golden depth */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            {/* Primary golden pool — top left, large and warm */}
            <div className="absolute -top-20 left-[15%] w-[1000px] h-[800px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.09) 0%, rgba(253,185,19,0.04) 25%, rgba(253,185,19,0.01) 45%, transparent 65%)', filter: 'blur(100px)', animation: 'heroGlow 8s ease-in-out infinite' }} />
            {/* Secondary warm accent — top right */}
            <div className="absolute -top-10 right-[5%] w-[700px] h-[600px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.04) 0%, rgba(253,185,19,0.015) 30%, transparent 55%)', filter: 'blur(120px)', animation: 'heroGlow 10s ease-in-out infinite 2s' }} />
            {/* Secondary golden pool — mid-right */}
            <div className="absolute top-[35%] left-[55%] w-[500px] h-[500px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.05) 0%, rgba(253,185,19,0.015) 40%, transparent 60%)', filter: 'blur(90px)', animation: 'heroGlow 12s ease-in-out infinite 4s' }} />
            {/* Deep warm glow — bottom left, adds depth */}
            <div className="absolute top-[60%] left-[5%] w-[600px] h-[400px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.04) 0%, transparent 50%)', filter: 'blur(110px)', animation: 'heroGlow 15s ease-in-out infinite 6s' }} />
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

          {/* Branded Header — World-Class */}
          <div className="relative z-[1]" style={{ animation: 'fadeSlideIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both', padding: '24px 0' }}>
            <div className="flex items-center justify-center gap-4">
              <LayoutDashboard size={30} style={{ color: '#FFD700', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.3))' }} />
              <div className="flex items-baseline gap-3 flex-wrap justify-center">
                {/* Animated gradient title */}
                <h2 style={{
                  fontFamily: "'Inter', 'DM Sans', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.95rem)',
                  letterSpacing: '0.06em',
                  background: 'linear-gradient(135deg, #FFD700 0%, #B87333 40%, #FFD700 80%, #B87333 100%)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'tbos-gradient-shift 6s ease-in-out infinite',
                  lineHeight: 1.1,
                }}>
                  TBOS Tableau de Bord
                </h2>
                {/* Subtitle with data pulse */}
                <span className="flex items-center gap-1" style={{
                  fontFamily: "'Inter', 'DM Sans', sans-serif",
                  fontWeight: 500,
                  fontStyle: 'italic',
                  fontSize: 'clamp(0.65rem, 1vw, 0.85rem)',
                  color: 'rgba(148,163,184,0.55)',
                  letterSpacing: '0.06em',
                  marginLeft: 8,
                }}>
                  Données en temps réel
                  {/* Live pulse indicator — after text */}
                  <span className="relative inline-flex items-center justify-center" style={{ width: 10, height: 10, marginLeft: 6 }}>
                    {/* Concentric ring */}
                    <span className="absolute rounded-full" style={{
                      width: 14, height: 14,
                      border: '1px solid rgba(34,197,94,0.25)',
                      animation: 'tbos-ring-expand 2s ease-out infinite',
                    }} />
                    {/* Ping */}
                    <span className="absolute inline-flex rounded-full" style={{
                      width: 7, height: 7,
                      backgroundColor: 'rgba(34,197,94,0.4)',
                      animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                    }} />
                    {/* Core dot */}
                    <span className="relative inline-flex rounded-full" style={{ width: 5, height: 5, backgroundColor: '#22c55e', animation: 'liveGlowPulse 2s ease-in-out infinite' }} />
                  </span>
                </span>
              </div>
            </div>
            {/* Subtle gold hairline */}
            <div className="mx-auto mt-3" style={{ maxWidth: 320, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }} />
          </div>

          {/* Greeting — Cinematic Hero Moment */}
          <div className="relative z-[1]" style={{ marginTop: 30, marginBottom: 20 }}>
            <div
              className="rounded-[10px]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: 20,
              }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="tracking-tight" style={{ fontSize: '1.5625rem', fontWeight: 700, color: '#FFD700', lineHeight: 1, marginBottom: 5 }}>
                    {greeting} {typedName || '\u00A0'}{typedName.length === firstName.length ? '.' : ''}
                    {showCursor && <span className="inline-block w-[2px] h-[24px] ml-0.5 align-bottom" style={{ background: 'rgba(253,185,19,0.6)', animation: 'pulse-alert 0.8s ease-in-out infinite' }} />}
                  </h1>
                  {/* Divider */}
                  <div className="mt-3 mb-2.5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.04) 70%, transparent 100%)' }} />
                  {/* CEO briefing subheader */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ paddingLeft: 5, paddingRight: 5 }}>
                    <span className="flex items-center gap-1.5" style={{ fontSize: '0.95rem', fontWeight: 400, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                      <svg width="36" height="36" viewBox="0 0 60 60" className="flex-shrink-0">
                        {/* Dark track */}
                        <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                        {/* Gold arc */}
                        <circle
                          cx="30" cy="30" r="24" fill="none"
                          stroke="#D4A843" strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${0.87 * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
                          transform="rotate(-90 30 30)"
                          style={{
                            animation: 'capacityGaugeArc 1s cubic-bezier(0.22,1,0.36,1) forwards',
                          }}
                        />
                        {/* Center text */}
                        <text x="30" y="32" textAnchor="middle" fill="white" fontSize="13" fontWeight="200" fontFamily="ui-monospace, 'JetBrains Mono', monospace">87%</text>
                      </svg>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>capacity</span>
                    </span>
                    <span style={{ color: 'rgba(255,215,0,0.2)' }}>|</span>
                    <span className="flex items-center gap-1.5" style={{ fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.5 }}>
                      <Truck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(251,191,36,0.6)' }} strokeWidth={1.5} />
                      <span className="font-medium" style={{ color: 'rgba(251,191,36,0.85)' }}>2</span>
                      <span style={{ color: 'rgba(251,191,36,0.6)' }}>urgent</span>
                    </span>
                    <span style={{ color: 'rgba(255,215,0,0.2)' }}>|</span>
                    <span className="flex items-center gap-1.5" style={{ fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.5 }}>
                      <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} strokeWidth={1.5} />
                      <span className="font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{prodVolume} m³</span>
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>output</span>
                    </span>
                    <span style={{ color: 'rgba(255,215,0,0.2)' }}>|</span>
                    <span className="flex items-center gap-1.5" style={{ fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.5 }}>
                      <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(52,211,153,0.6)' }} strokeWidth={1.5} />
                      <span className="font-medium" style={{ color: 'rgba(52,211,153,0.85)' }}>{marge}%</span>
                      <span style={{ color: 'rgba(52,211,153,0.5)' }}>margin</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-4" style={{ paddingLeft: 5 }}>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" style={{ animation: 'liveGlowPulse 2s ease-in-out infinite' }} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400/80">Operational</span>
                    <span className="w-px h-3.5 bg-slate-600/50" />
                    <span className="text-[11px] text-slate-400/70 tracking-wider font-mono">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span className="w-px h-3.5 bg-slate-600/50" />
                    <span className="text-[11px] text-slate-400/70 tracking-wider">Casablanca</span>
                    <span className="w-px h-3.5 bg-slate-600/50" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm">☀️</span>
                      <span className="text-[11px] text-white/80 font-mono tabular-nums font-medium">22°C</span>
                      <span className="text-[11px] text-slate-400/60">Ensoleillé · 45%</span>
                      <span className="text-[11px] font-semibold" style={{ color: 'rgba(52,211,153,0.8)' }}>● Optimal</span>
                    </div>
                  </div>
                </div>
                {/* Live clock — tiny reference */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(148,163,184,0.35)', letterSpacing: '0.02em' }}>{timeStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Command Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-2 mb-5 relative z-[1] overflow-hidden min-w-0 max-w-full" style={{ animation: 'fadeSlideIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both' }}>
            <button
              onClick={() => navigate('/ventes')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: 'rgba(253,185,19,0.08)',
                border: '1px solid rgba(253,185,19,0.2)',
                color: 'rgba(253,185,19,0.85)',
              }}
            >
              <span>📋</span>
              <span>Nouveau Devis</span>
            </button>
            <button
              onClick={() => navigate('/production')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(203,213,225,0.8)' }}
            >
              <span>🚀</span>
              <span>Lancer Production</span>
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(203,213,225,0.8)' }}
            >
              <span>📊</span>
              <span>Rapport du Jour</span>
            </button>
            <button
              onClick={() => navigate('/creances')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(203,213,225,0.8)' }}
            >
              <span>📞</span>
              <span>Relancer Clients</span>
            </button>

            {/* Next delivery countdown */}
            <div className="ml-auto hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'rgba(251,191,36,0.7)', animation: 'pulse-alert 2s ease-in-out infinite' }} />
              <span className="text-[10px] text-slate-500 flex-shrink-0">Prochaine</span>
              <span className="text-[10px] text-white/80 font-mono font-medium tabular-nums flex-shrink-0">47 min</span>
              <span className="text-[10px] text-slate-600 truncate">→ C. Modernes · 20 m³</span>
            </div>
          </div>

          {/* 🧠 AI Intelligence Briefing */}
          <div className="relative z-[1] mb-5" style={{ animation: 'fadeSlideIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}>
            <IntelligenceBriefingCard />
          </div>

          {/* Hero KPI Cards — Premium Data Monuments */}
          <div className="grid grid-cols-4 gap-4 mb-5 relative z-[1] items-stretch w-full" style={{ alignItems: 'stretch' }}>
          {[
            {
              label: 'VOLUME',
              value: prodVolume,
              unit: 'm³',
              watermark: 'm³',
              sub: 'Total du jour',
              trend: '↗ +12%',
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
              sparkline: '0,26 20,22 40,28 60,18 80,14 100,8 120,4',
              sparkStroke: '#22c55e',
              monthlyTarget: { current: 671, target: 3200, daysLeft: 5 },
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
              sparkline: '0,22 20,24 40,18 60,16 80,12 100,8 120,4',
              sparkStroke: '#22c55e',
              revenueGauge: { current: 75.6, target: 250, pct: 30 },
            },
            {
              label: 'MARGE',
              value: marge,
              unit: '%',
              watermark: '%',
              sub: '37.8 K DH costs',
              trend: '↗ +1.2%',
              healthyGlow: true,
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
              sparkline: '0,22 20,18 40,20 60,14 80,12 100,10 120,6',
              sparkStroke: '#22c55e',
              costBreakdown: true,
            },
            {
              label: 'TRÉSORERIE',
              value: tresorerie,
              unit: 'K DH',
              watermark: 'DH',
              sub: '→ 502K fin mois',
              trend: '↗ +9.7%',
              healthyGlow: true,
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
              sparkline: '0,26 20,22 40,24 60,18 80,14 100,10 120,4',
              sparkStroke: '#22c55e',
              cashFlow: true,
            },
          ].map((kpi, i) => (
            <TiltCard
              key={i}
              className="tbos-hero-card group cursor-default shimmer-effect h-full flex flex-col min-w-0"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                animation: `cardSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.1}s both`,
                ...(kpi.healthyGlow ? {
                  boxShadow: '0 0 20px rgba(34,197,94,0.06), inset 0 1px 0 rgba(34,197,94,0.08), 0 1px 3px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.15)',
                  borderColor: 'rgba(34,197,94,0.12)',
                } : {}),
              }}
            >
              {/* Scanline hover effect */}
              <div className="scanline-overlay" />
              {/* Category accent — refined thin line */}
              <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: `linear-gradient(90deg, transparent, ${kpi.accentColor}50, transparent)` }} />

              {/* Content wrapper for equal height */}
              <div className="relative z-[1] flex flex-col flex-1" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '1 1 auto' }}>
                  {/* Label */}
                  <div className="mb-5" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgb(100,116,139)' }}>
                    {kpi.label}
                  </div>

                  {/* Main number with count-up — JetBrains Mono luminescent gauge */}
                  <div className="flex items-baseline gap-2 leading-none">
                    <span className="text-3xl font-mono tracking-tight text-white" style={{
                      fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                      fontWeight: 200,
                      lineHeight: 1,
                      textShadow: '0 0 35px rgba(255,215,0,0.2), 0 0 70px rgba(255,215,0,0.07)',
                    }}>
                      {typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}
                    </span>
                    <span className="text-lg font-mono text-muted-foreground ml-1" style={{
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{kpi.unit}</span>
                  </div>

                  {/* Sub info */}
                  <div className="text-[11px] text-slate-500 mt-3 tabular-nums" style={{ fontFamily: "'Inter', system-ui", fontSize: '11px', fontWeight: 400 }}>{kpi.sub}</div>

                  {/* Trend indicator */}
                  {kpi.trend && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[11px] tabular-nums" style={{ fontFamily: "'Inter', system-ui", fontWeight: 400, color: 'rgba(52,211,153,0.7)' }}>{kpi.trend}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto' }}>
                  {/* Mini sparkline */}
                  {kpi.sparkline && (
                    <svg width="120" height="32" viewBox="0 0 120 32" className="mt-auto pt-3">
                      <polyline
                        fill="none"
                        stroke={kpi.sparkStroke || '#22c55e'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={kpi.sparkline}
                        style={{ opacity: 0.6 }}
                      />
                      {(() => {
                        const pts = kpi.sparkline.split(' ');
                        const last = pts[pts.length - 1]?.split(',');
                        return last ? <circle cx={last[0]} cy={last[1]} r="2" fill={kpi.sparkStroke || '#22c55e'} style={{ opacity: 0.8 }} /> : null;
                      })()}
                    </svg>
                   )}

                  {/* Cost breakdown mini-stat for MARGE */}
                  {kpi.costBreakdown && (
                    <div className="flex items-end gap-6 flex-nowrap mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Matières</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>28.1%</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Transport</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>12.4%</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Main-d'œuvre</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>9.4%</div>
                      </div>
                    </div>
                  )}

                  {/* Cash flow mini-stat for TRÉSORERIE */}
                  {kpi.cashFlow && (
                    <div className="flex items-end gap-6 flex-nowrap mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Entrées</div>
                        <div className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>+92K</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Sorties</div>
                        <div className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>-43K</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Net</div>
                        <div className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>+49K</div>
                      </div>
                    </div>
                  )}


                  {kpi.revenueGauge && (
                    <div className="flex flex-col items-center mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <svg width="90" height="50" viewBox="0 0 100 55">
                        {/* Background arc */}
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
                        {/* Red zone */}
                        <path d="M 10 50 A 40 40 0 0 1 36.3 14.2" fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth="5" strokeLinecap="round" />
                        {/* Yellow zone */}
                        <path d="M 36.3 14.2 A 40 40 0 0 1 63.7 14.2" fill="none" stroke="rgba(234,179,8,0.25)" strokeWidth="5" strokeLinecap="round" />
                        {/* Green zone */}
                        <path d="M 63.7 14.2 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(34,197,94,0.25)" strokeWidth="5" strokeLinecap="round" />
                        {/* Progress arc */}
                        <path
                          d={`M 10 50 A 40 40 0 0 1 ${10 + Math.min(kpi.revenueGauge.pct / 100, 1) * 80} ${50 - Math.sin(Math.min(kpi.revenueGauge.pct / 100, 1) * Math.PI) * 40}`}
                          fill="none"
                          stroke={kpi.revenueGauge.pct < 33 ? '#ef4444' : kpi.revenueGauge.pct < 66 ? '#eab308' : '#22c55e'}
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        <text x="50" y="44" textAnchor="middle" fill="white" fontSize="10" fontWeight="500" style={{ fontFamily: "'JetBrains Mono'" }}>
                          {kpi.revenueGauge.pct}%
                        </text>
                        <text x="50" y="53" textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="6">de l'objectif</text>
                      </svg>
                      <div className="text-[9px] mt-0.5" style={{ color: 'rgba(148,163,184,0.4)' }}>
                        Objectif: <span className="text-white/60">{kpi.revenueGauge.target}K DH</span>
                      </div>
                    </div>
                  )}
                  {kpi.monthlyTarget && (
                    <div className="flex items-center gap-2.5 mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="14"
                          fill="none" stroke="#D4A843" strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.min((kpi.monthlyTarget.current / kpi.monthlyTarget.target), 1) * 88} 88`}
                          transform="rotate(-90 18 18)"
                          style={{ transition: 'stroke-dasharray 1s ease-out' }}
                        />
                        <text x="18" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {Math.round((kpi.monthlyTarget.current / kpi.monthlyTarget.target) * 100)}%
                        </text>
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.4)' }}>Objectif mensuel</span>
                        <span className="text-[10px]" style={{ color: 'rgba(203,213,225,0.6)' }}>
                          <span className="text-white/70 font-medium">{kpi.monthlyTarget.current}</span>
                          <span className="text-slate-600"> / {kpi.monthlyTarget.target.toLocaleString()} m³</span>
                        </span>
                        <span className="text-[9px]" style={{ color: 'rgba(251,191,36,0.7)' }}>{kpi.monthlyTarget.daysLeft} jours restants</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>{/* end content wrapper */}
            </TiltCard>
          ))}
        </div>

        {/* ═══ TAB BAR — Command Center / Production Live ═══ */}
        <div className="flex items-center gap-1 mb-5 relative z-[1] p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveTab('command')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300"
            style={{
              background: activeTab === 'command' ? 'rgba(212,168,67,0.12)' : 'transparent',
              border: activeTab === 'command' ? '1px solid rgba(212,168,67,0.25)' : '1px solid transparent',
              color: activeTab === 'command' ? '#D4A843' : 'rgba(148,163,184,0.5)',
            }}
          >
            <LayoutDashboard size={14} />
            Command Center
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300"
            style={{
              background: activeTab === 'production' ? 'rgba(212,168,67,0.12)' : 'transparent',
              border: activeTab === 'production' ? '1px solid rgba(212,168,67,0.25)' : '1px solid transparent',
              color: activeTab === 'production' ? '#D4A843' : 'rgba(148,163,184,0.5)',
            }}
          >
            <Factory size={14} />
            Production Live
            <span className="relative flex h-1.5 w-1.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300"
            style={{
              background: activeTab === 'operations' ? 'rgba(212,168,67,0.12)' : 'transparent',
              border: activeTab === 'operations' ? '1px solid rgba(212,168,67,0.25)' : '1px solid transparent',
              color: activeTab === 'operations' ? '#D4A843' : 'rgba(148,163,184,0.5)',
            }}
          >
            <Activity size={14} />
            Opérations
          </button>
        </div>

        {/* ═══ PRODUCTION LIVE TAB CONTENT ═══ */}
        {activeTab === 'production' && (
        <>
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* PRODUCTION COMMAND CENTER — 3-Panel Mission Control Strip */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div
          className="mb-5 relative z-[1] rounded-lg overflow-hidden bg-gradient-to-br from-[#1a1f2e] to-[#141824] border border-amber-500/20 p-5"
        >
          {/* Grid removed for clean editorial look */}

          {/* ── HEADER BAR ── */}
          {/* Section header with golden divider */}
          <div className="relative flex items-center gap-3 px-5 pt-4 pb-1 z-10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" style={{ animation: 'liveGlowPulse 2s ease-in-out infinite' }} />
            </span>
            <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em]">
              LIVE PRODUCTION DU JOUR
            </span>
            <span className="text-muted-foreground text-[11px]">
              Casablanca · UTC+1
            </span>
            <div className="flex-1 h-[2px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.7), rgba(212,175,55,0.2))' }} />
            {/* Pace Legend */}
            <div className="flex items-center gap-3 ml-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>En rythme</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[8px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Attention</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[8px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Retard</span>
              </div>
            </div>
          </div>
          {/* Metrics row */}
          <div className="relative flex items-center justify-end gap-3 px-5 pb-2 z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-white font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>671</span>
                <span className="text-[9px] text-slate-500">m³</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-white font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>14</span>
                <span className="text-[9px] text-slate-500">batches</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-slate-500">Cadence:</span>
                <span className="text-[13px] text-amber-400 font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>47</span>
                <span className="text-[9px] text-slate-500">m³/h</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-emerald-400">▲ +12%</span>
                <span className="text-[9px] text-slate-600">vs hier</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-slate-600 tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{timeStr}</span>
            </div>
          </div>

          {/* ── LIVE ALERT TICKER ── */}
          <div className="relative mx-5 mb-3 z-10 overflow-hidden rounded-md" style={{ background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.1)', height: 28 }}>
            <div className="flex items-center h-full px-3 gap-2" style={{ animation: 'tbos-ticker-scroll 20s linear infinite' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" style={{ animation: 'pulse-alert 2s ease-in-out infinite' }} />
              <span className="text-[10px] text-slate-400 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ✓ Batch #403-068 malaxage terminé · 94% efficacité
              </span>
              <span className="w-px h-3 bg-white/[0.06] flex-shrink-0" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-[10px] text-amber-400/80 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ⚠ Silo 2 ciment: 18% restant — commande auto déclenchée
              </span>
              <span className="w-px h-3 bg-white/[0.06] flex-shrink-0" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[10px] text-slate-400 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ✓ BL-2026-0312 livré · BTP Maroc · 8 m³ F-B25
              </span>
              <span className="w-px h-3 bg-white/[0.06] flex-shrink-0" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[10px] text-slate-400 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ✓ Qualité: Test R28 conforme — 32.4 MPa
              </span>
            </div>
          </div>

          {/* ── MAIN 4-PANEL LAYOUT ── */}
          <div className="relative flex gap-0 px-4 pb-3 z-10 min-w-0 w-full" style={{ minHeight: '240px' }}>

            {/* ══ PANEL 1: PRODUCTION CHART (35%) ══ */}
            <div className="flex-[3.5] relative min-w-0">
              {/* Peak annotation overlay */}
              <div className="absolute z-[5]" style={{ right: '35%', top: '8px' }}>
                <div className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[7px] tracking-wider font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.4)' }}>PEAK 14H · 110 m³</span>
                </div>
              </div>

              {/* The Golden River SVG chart */}
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full sparkline-draw relative z-[3]" preserveAspectRatio="none" onMouseMove={handleChartMouseMove} onMouseLeave={handleChartMouseLeave} style={{ cursor: 'crosshair' }}>
                <defs>
                  <linearGradient id="sparkGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.12} />
                    <stop offset="40%" stopColor="#C9A84C" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C9A84C" />
                    <stop offset="50%" stopColor="#D4B060" />
                    <stop offset="100%" stopColor="#C9A84C" />
                  </linearGradient>
                  <filter id="goldLineGlow">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="rgba(212,168,67,0.4)" />
                  </filter>
                </defs>

                {/* Reference lines — monochromatic whispers */}
                <line x1="0" y1={objectifY} x2={svgW} y2={objectifY} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="5 4" />
                <text x={svgW - 2} y={objectifY - 2} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="2" fontFamily="'JetBrains Mono', monospace">Objectif</text>
                <line x1="0" y1={seuilY} x2={svgW} y2={seuilY} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3 4" />
                <text x={svgW - 2} y={seuilY - 2} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="2" fontFamily="'JetBrains Mono', monospace">Seuil min</text>

                {/* Target line (dashed white ghost) */}
                <path d={targetLinePath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" strokeDasharray="3 2.5" strokeLinejoin="round" strokeLinecap="round" />

                {/* Area fill — past section */}
                <path d={pastAreaPath} fill="url(#sparkGlow)" className="area-fill" />

                {/* Core gold line — past (thin, precise, with glow) */}
                <path d={pastLinePath} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#goldLineGlow)" />

                {/* Forecast line (dashed, faded) */}
                <path d={forecastLinePath} fill="none" stroke="rgba(201,168,76,0.20)" strokeWidth="1.5" strokeDasharray="4 6" strokeLinejoin="round" strokeLinecap="round" />

                {/* NOW playhead */}
                <line x1={nowX} y1="0" x2={nowX} y2={svgH} stroke="rgba(212,168,67,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />
                <text x={nowX} y="5" textAnchor="middle" fill="rgba(212,168,67,0.3)" fontSize="2" fontWeight="500" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.15em">MAINTENANT</text>

                {/* Peak annotation line */}
                <line x1={peakX} y1={peakY} x2={peakX} y2={peakY - 12} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" strokeDasharray="1 1.5" />

                {/* Live endpoint — subtle pulse */}
                <circle cx={lastX} cy={lastY} r="2" fill="#C9A84C" opacity="0.8">
                  <animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* ── HOVER INTERACTION ── */}
                {hoveredPoint && (
                  <g>
                    {/* Vertical dashed guide line */}
                    <line
                      x1={hoveredPoint.x} y1={hoveredPoint.y}
                      x2={hoveredPoint.x} y2={svgH}
                      stroke="rgba(255,215,0,0.5)"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                    {/* Enlarged hover point */}
                    <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="3" fill="#FFD700" opacity="1" />
                    <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="0.5" />

                    {/* Tooltip background */}
                    <rect
                      x={hoveredPoint.x > svgW * 0.7 ? hoveredPoint.x - 32 : hoveredPoint.x + 4}
                      y={Math.max(2, hoveredPoint.y - 22)}
                      width="28" height="20" rx="1.5"
                      fill="#1a1f2e" stroke="rgba(255,215,0,0.15)" strokeWidth="0.5"
                    />
                    {/* Peak Name */}
                    <text
                      x={hoveredPoint.x > svgW * 0.7 ? hoveredPoint.x - 18 : hoveredPoint.x + 18}
                      y={Math.max(2, hoveredPoint.y - 22) + 6}
                      textAnchor="middle" fill="#FFFFFF" fontSize="2.8" fontWeight="700"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      PEAK {hoveredPoint.h.toUpperCase()}
                    </text>
                    {/* Volume */}
                    <text
                      x={hoveredPoint.x > svgW * 0.7 ? hoveredPoint.x - 18 : hoveredPoint.x + 18}
                      y={Math.max(2, hoveredPoint.y - 22) + 12}
                      textAnchor="middle" fill="#FFD700" fontSize="2.5"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {hoveredPoint.v} m³
                    </text>
                    {/* Time */}
                    <text
                      x={hoveredPoint.x > svgW * 0.7 ? hoveredPoint.x - 18 : hoveredPoint.x + 18}
                      y={Math.max(2, hoveredPoint.y - 22) + 17}
                      textAnchor="middle" fill="#FFD700" fontSize="2.2"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {hoveredPoint.time}
                    </text>
                  </g>
                )}

                {/* Invisible hover target rect */}
                <rect x="0" y="0" width={svgW} height={svgH} fill="transparent" />
              </svg>
            </div>

            {/* ══ PANEL 2: LIVE CAMERA FEED (35%) ══ */}
            <div className="flex-[3.5] border-l border-white/[0.04] pl-3 ml-2 min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Caméra Centrale
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[8px] text-red-400/80 font-medium uppercase tracking-wider">LIVE</span>
                </div>
              </div>

              {/* Video placeholder — ready for HLS/RTSP integration */}
              <div
                className="flex-1 rounded-lg relative overflow-hidden cursor-pointer group"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,20,35,0.95) 0%, rgba(10,15,25,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  minHeight: '200px',
                }}
                onClick={() => window.location.href = '/surveillance'}
              >
                {/* Simulated feed scan lines */}
                <div className="absolute inset-0 z-[1]" style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
                }} />

                {/* Radar sweep + connection status */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[2] gap-4">
                  {/* Radar container */}
                  <div className="relative" style={{ width: 96, height: 96 }}>
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(212,168,67,0.15)' }} />
                    {/* Middle ring */}
                    <div className="absolute rounded-full" style={{ inset: 12, border: '1px solid rgba(212,168,67,0.10)' }} />
                    {/* Inner ring */}
                    <div className="absolute rounded-full" style={{ inset: 24, border: '1px solid rgba(212,168,67,0.08)' }} />
                    {/* Cross hairs */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'rgba(212,168,67,0.06)' }} />
                    <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: 'rgba(212,168,67,0.06)' }} />
                    {/* Rotating sweep */}
                    <div className="absolute inset-0 rounded-full overflow-hidden" style={{ animation: 'radarSweep 4s linear infinite' }}>
                      <div className="absolute left-1/2 top-1/2 origin-top-left" style={{
                        width: 48, height: 48,
                        marginLeft: 0, marginTop: -48,
                        background: 'conic-gradient(from 0deg at 0% 100%, rgba(212,168,67,0.25) 0deg, rgba(212,168,67,0) 40deg, transparent 40deg)',
                      }} />
                    </div>
                    {/* Center pulsing gold dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: 'rgba(212,168,67,0.5)' }} />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#D4A843' }} />
                      </span>
                    </div>
                  </div>

                  {/* Status text */}
                  <span className="text-sm text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Caméra en connexion...
                  </span>

                  {/* PTZ Control hints */}
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.12)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
                      <span className="text-[8px] text-amber-500/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>PTZ</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.12)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                      <span className="text-[8px] text-amber-500/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>FULL</span>
                    </div>
                  </div>
                </div>

                {/* Overlay metrics — always visible */}
                <div className="absolute bottom-0 left-0 right-0 z-[3] p-2.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/80 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>47 m³/h</span>
                      <span className="w-px h-3 bg-white/10" />
                      <span className="text-[10px] text-emerald-400/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>94%</span>
                      <span className="w-px h-3 bg-white/10" />
                      <span className="text-[9px] text-amber-400/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>REC</span>
                    </div>
                    <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeStr}</span>
                  </div>
                </div>

                {/* Fullscreen hint on hover */}
                <div className="absolute top-2 right-2 z-[4] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  </div>
                </div>

                {/* Camera label */}
                <div className="absolute top-2 left-2 z-[4] px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <span className="text-[8px] text-white/60 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CAM-01 · Centrale</span>
                </div>
              </div>
            </div>

            {/* ══ PANEL 3: BATCH QUEUE + METRICS (30%) ══ */}
            <div className="flex-[3] border-l border-white/[0.04] pl-3 ml-2 min-w-0 flex flex-col">
              {/* Batch Queue */}
              <div className="mb-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  File de Production
                </div>

                {/* Current batch — highlighted */}
                <div className="mb-2 p-2 rounded-lg" style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.12)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#403-068</span>
                    <span className="ml-auto text-[8px] text-emerald-400/60">Déchargement</span>
                  </div>
                  <div className="text-[8px] text-slate-400 mb-1.5">F-B25 · 8 m³ · BTP Maroc</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '72%', background: 'linear-gradient(90deg, #f59e0b, #22c55e)', transition: 'width 1s ease-out' }} />
                    </div>
                    <span className="text-[9px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>72%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-amber-400/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>⏱ 01:47</span>
                  </div>
                </div>

                {/* Queued batches */}
                <div className="space-y-0.5">
                  {[
                    { id: '#403-069', formula: 'F-B30 · 12 m³', client: 'Atlas BTP' },
                    { id: '#403-070', formula: 'F-B25 · 8 m³', client: 'Const. Modernes' },
                  ].map((batch) => (
                    <div key={batch.id} className="flex items-center gap-1.5 p-1 rounded hover:bg-white/[0.02] transition-colors">
                      <span className="w-1 h-1 bg-slate-600 rounded-full" />
                      <div className="min-w-0">
                        <div className="text-[8px] text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{batch.id}</div>
                        <div className="text-[7px] text-slate-600 truncate">{batch.formula} · {batch.client}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact Metrics */}
              <div className="border-t border-white/[0.04] pt-2 space-y-2">
                <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Métriques
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-lg text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>47</div>
                    <div className="text-[8px] text-slate-500 mt-0.5">m³/h</div>
                    <div className="text-[8px] text-emerald-400/70">● Cible</div>
                  </div>
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-lg text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>94</span>
                      <span className="text-[10px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>%</span>
                    </div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Efficacité</div>
                    <div className="w-full h-0.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%', transition: 'width 1.5s ease-out' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>12</span>
                      <span className="text-[9px] text-slate-500">min</span>
                    </div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Arrêt</div>
                    <div className="text-[8px] text-emerald-400/70">● OK</div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 200 }}>1.2</span>
                      <span className="text-[9px] text-slate-500">%</span>
                    </div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Perte</div>
                    <div className="text-[8px] text-emerald-400/70">● OK</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM TICKER BAR ── */}
          <div className="relative flex items-center justify-between px-5 py-2 z-10 border-t border-white/[0.03]" style={{ background: 'rgba(0,0,0,0.15)' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[9px] text-slate-500">Malaxeur</span>
                <span className="text-[9px] text-emerald-400 font-medium">ACTIF</span>
              </div>
              <div className="w-px h-2.5 bg-white/[0.04]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-500">E/C Ratio</span>
                <span className="text-[9px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>0.502</span>
                <span className="text-[9px] text-emerald-400">✓</span>
              </div>
              <div className="w-px h-2.5 bg-white/[0.04]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-500">Température</span>
                <span className="text-[9px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>22°C</span>
              </div>
              <div className="w-px h-2.5 bg-white/[0.04]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-500">Humidité</span>
                <span className="text-[9px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>45%</span>
                <span className="text-[9px] text-emerald-400">Optimal</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-600">Prochain camion</span>
              <span className="text-[9px] text-amber-400 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>32 min</span>
              <span className="text-[9px] text-slate-600">→ Constructions Modernes · 20 m³</span>
            </div>
          </div>
        </div>{/* end production command center */}

        {/* ═══ Additional Production Widgets ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5 relative z-[1]">
          {/* Batch en Cours */}
          <div className="min-w-0">
            <Suspense fallback={<div className="h-48 rounded-lg bg-white/[0.02] animate-pulse" />}>
              <LiveBatchProgress />
            </Suspense>
          </div>

          {/* Derniers Batches */}
          <div className="min-w-0 rounded-lg p-5" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-[14px] font-medium text-white/90">Derniers Batches</span>
            </div>
            <div className="space-y-2">
              {[
                { id: '#403-068', formula: 'F-B25', vol: '8 m³', time: '15:42', status: 'ok' },
                { id: '#403-067', formula: 'F-B30', vol: '12 m³', time: '14:28', status: 'ok' },
                { id: '#403-066', formula: 'F-B25', vol: '8 m³', time: '13:15', status: 'warn' },
                { id: '#403-065', formula: 'F-B35', vol: '10 m³', time: '12:03', status: 'ok' },
                { id: '#403-064', formula: 'F-B25', vol: '8 m³', time: '11:21', status: 'ok' },
              ].map((b) => (
                <div key={b.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.status === 'ok' ? '#34D399' : '#FBBF24' }} />
                    <span className="text-[10px] font-mono text-slate-400">{b.id}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{b.formula} · {b.vol}</span>
                  <span className="text-[9px] font-mono text-slate-600">{b.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contrôle Qualité */}
          <div className="min-w-0 rounded-lg p-5" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <div className="text-[14px] font-medium text-white/90 mb-3">Contrôle Qualité</div>
            <div className="flex flex-col gap-1">
              {[
                { id: 'BL-2602-070', test: 'Slump 18cm', ok: true, time: '20:41' },
                { id: 'BL-2602-067', test: 'Slump 22cm', ok: false, time: '18:28' },
                { id: 'BL-2602-073', test: 'Slump 17cm', ok: true, time: '19:13' },
              ].map((q, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: q.ok ? '#34D399' : '#FBBF24' }} />
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
          </div>
        </div>
        </>
        )}

        </div>{/* end hero zone wrapper */}

        {/* ═══ COMMAND CENTER TAB CONTENT ═══ */}
        {activeTab === 'command' && (
        <>
        {/* Alert Strip — Intelligent Urgency */}
        {!alertDismissed && stats.tauxECMoyen > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2 rounded-xl mt-0 mb-3"
            style={{
              background: 'linear-gradient(90deg, rgba(234,179,8,0.06) 0%, rgba(234,179,8,0.02) 50%, rgba(234,179,8,0.06) 100%)',
              border: '1px solid rgba(234,179,8,0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'pulse-alert 3s ease-in-out infinite' }} />
              <span className="text-[11px] text-slate-400">
                {stats.tauxECMoyen > 0
                  ? `E/C Ratio: ${stats.tauxECMoyen.toFixed(3)} — ${stats.tauxECMoyen > 0.55 ? 'Ratio élevé, vérifier dilution' : 'Dans les normes'}`
                  : 'E/C Ratio: Données de production absentes ou non saisies.'}
              </span>
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

        {/* ═══ PLANT FLOW SCHEMATIC — Real-time value chain ═══ */}
        <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] animate-pulse mt-2" />}>
          <PlantFlowSchematic />
        </Suspense>

        {/* Section Divider — Opérations */}
        <div className="flex items-center gap-3 pt-5 pb-6 mb-0">
          <Activity size={16} className="text-amber-400" />
          <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Opérations</span>
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.15))' }} />
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 2 — OPERATIONS (minus moved widgets)
        ══════════════════════════════════════════════════ */}
        <div className="mt-0">
          <Suspense fallback={<div className="h-[600px] rounded-lg bg-white/[0.02] animate-pulse" />}>
            <WorldClassDashboard hideProductionWidgets hideOpsWidgets />
          </Suspense>
        </div>
        </>
        )}

        {/* ═══ OPÉRATIONS TAB CONTENT ═══ */}
        {activeTab === 'operations' && (
        <>
        <div className="flex items-center gap-3 pt-2 pb-4 mb-0">
          <Activity size={16} className="text-amber-400" />
          <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Opérations</span>
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.15))' }} />
        </div>
        <div className="mt-0">
          <Suspense fallback={<div className="h-[600px] rounded-lg bg-white/[0.02] animate-pulse" />}>
            <WorldClassDashboard hideProductionWidgets showOnlyOps />
          </Suspense>
        </div>
        </>
        )}

        {/* FINANCE & CONFORMITÉ — Hidden for CEO demo (no content yet) */}

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
