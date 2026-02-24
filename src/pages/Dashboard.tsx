import { useEffect, useState, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import batchingPlantBg from '@/assets/batching-plant-backdrop.jpg';
import heroPlantCinematic from '@/assets/hero-plant-cinematic.jpg';
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
import { TiltCard } from '@/components/dashboard/TiltCard';

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

  // ─── Typewriter effect for greeting ───
  const [typedName, setTypedName] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // ─── Mouse parallax state ───
  const heroRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Extract user first name (needed before typewriter)
  const rawFirst = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Directeur';
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  // Auto-refresh
  useEffect(() => {
    if (isCeo) checkPaymentDelays();
    const interval = setInterval(() => { refresh(); refreshPeriod(); }, 30000);
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

  // ─── Mouse parallax tracking ───
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMouseOffset({ x, y });
    };
    const el = heroRef.current;
    el?.addEventListener('mousemove', handleMouseMove);
    return () => el?.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
          @keyframes cardEntrance {
            0% { opacity: 0; transform: translateY(24px) scale(0.97); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
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
          @keyframes heroGlow {
            0%, 100% { opacity: 0.4; filter: blur(60px); }
            50% { opacity: 0.7; filter: blur(80px); }
          }
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          @keyframes kenBurns {
            0% { transform: scale(1.05) translate(0%, 0%); }
            25% { transform: scale(1.12) translate(-1%, -0.5%); }
            50% { transform: scale(1.08) translate(0.5%, -1%); }
            75% { transform: scale(1.15) translate(-0.5%, 0.5%); }
            100% { transform: scale(1.05) translate(0%, 0%); }
          }
          @keyframes vignettePulse {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 0.75; }
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
            background: linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 40%, rgba(255,255,255,0.02) 100%);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 20px;
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
            content: '';
            position: absolute;
            top: 0;
            left: 5%;
            right: 5%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          }
          .tbos-hero-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 1px;
            height: 50%;
            background: linear-gradient(180deg, rgba(255,255,255,0.1), transparent);
          }
          /* Scanline effect on hero cards */
          .tbos-hero-card .scanline-overlay {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s;
          }
          .tbos-hero-card:hover .scanline-overlay {
            opacity: 1;
          }
          .tbos-hero-card .scanline-overlay::before {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            height: 40%;
            background: linear-gradient(180deg, transparent, rgba(253,185,19,0.02), transparent);
            animation: scanline 3s ease-in-out infinite;
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

        {/* Hero zone wrapper with cinematic backdrop */}
        <div className="relative" ref={heroRef}>
          {/* ═══ CINEMATIC HERO IMAGE — Ken Burns + Mouse Parallax ═══ */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <img
              src={heroPlantCinematic}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out"
              style={{
                opacity: 0.3,
                filter: 'saturate(0.5) brightness(0.5) contrast(1.2)',
                animation: 'kenBurns 45s ease-in-out infinite',
                transformOrigin: 'center center',
                transform: `translate(${mouseOffset.x * -12}px, ${mouseOffset.y * -8}px) scale(1.08)`,
              }}
            />
            {/* Cinematic vignette — darkens edges, focuses center */}
            <div className="absolute inset-0" style={{
              background: `radial-gradient(ellipse 75% 65% at 50% 30%, transparent 0%, rgba(11,15,26,0.25) 40%, rgba(11,15,26,0.8) 100%)`,
              animation: 'vignettePulse 20s ease-in-out infinite',
            }} />
            {/* Bottom fade to seamless transition */}
            <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{
              background: 'linear-gradient(to top, #0B0F1A 0%, transparent 100%)',
            }} />
            {/* Top darkening for text readability */}
            <div className="absolute top-0 left-0 right-0 h-[25%]" style={{
              background: 'linear-gradient(to bottom, rgba(11,15,26,0.4) 0%, transparent 100%)',
            }} />
          </div>

          {/* Ambient light orbs — Cinematic aurora (on top of image) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            <div className="absolute -top-40 left-1/4 w-[900px] h-[700px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.06) 0%, rgba(253,185,19,0.02) 30%, transparent 60%)', filter: 'blur(140px)', animation: 'heroGlow 8s ease-in-out infinite' }} />
            <div className="absolute -top-20 right-[5%] w-[600px] h-[500px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.03) 0%, transparent 60%)', filter: 'blur(120px)', animation: 'heroGlow 10s ease-in-out infinite 2s' }} />
            <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full" 
                 style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.03) 0%, transparent 50%)', filter: 'blur(100px)', animation: 'heroGlow 12s ease-in-out infinite 4s' }} />
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

          {/* Greeting — Cinematic Hero Moment */}
          <div className="pt-6 pb-8 relative z-[1]" style={{ animation: 'cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) 0s both' }}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600 mb-2 font-light">Command Center</p>
                <h1 className="text-[38px] font-extralight text-white" style={{ letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {typedName || '\u00A0'}<span className="text-[38px] font-extralight" style={{ color: 'rgba(253,185,19,0.4)' }}>{typedName.length === firstName.length ? '.' : ''}</span>
                  {showCursor && <span className="inline-block w-[2px] h-[36px] ml-0.5 align-bottom" style={{ background: 'rgba(253,185,19,0.6)', animation: 'pulse-alert 0.8s ease-in-out infinite' }} />}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/40" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.4)' }} />
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-emerald-400/50">Operational</span>
                  <span className="w-px h-3 bg-slate-700/40" />
                  <span className="text-[9px] text-slate-600/50 tracking-wider font-mono">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <span className="w-px h-3 bg-slate-700/40" />
                  <span className="text-[9px] text-slate-600/50 tracking-wider">Casablanca</span>
                </div>
              </div>
              {/* Live clock */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[28px] font-extralight text-white/20 tabular-nums font-mono" style={{ letterSpacing: '-0.02em' }}>{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Hero KPI Cards — Premium Data Monuments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6 relative z-[1]">
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
            <TiltCard
              key={i}
              className="tbos-hero-card group cursor-default shimmer-effect"
              style={{
                animation: `cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s both`,
              }}
            >
              {/* Scanline hover effect */}
              <div className="scanline-overlay" />
              {/* Category accent — refined thin line */}
              <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: `linear-gradient(90deg, transparent, ${kpi.accentColor}50, transparent)` }} />
              {/* Corner accent — luxury watch detail */}
              <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none" style={{
                background: `radial-gradient(circle at 100% 0%, ${kpi.accentColor}08 0%, transparent 70%)`,
              }} />
              {/* Giant unit watermark — subtler */}
              <div className="absolute bottom-[-8px] right-3 text-[72px] font-extralight leading-none pointer-events-none select-none" style={{ color: `${kpi.accentColor}06`, fontFamily: 'Inter, system-ui' }}>
                {kpi.watermark}
              </div>

              {/* Label */}
              <div className="text-[9px] font-medium uppercase tracking-[0.25em] mb-5" style={{ color: kpi.labelColor }}>
                {kpi.label}
              </div>

              {/* Main number with count-up */}
              <div className="flex items-baseline gap-2 leading-none">
                <span className="text-[2.75rem] font-extralight text-white/95 tabular-nums" style={{ fontFamily: 'Inter, system-ui', letterSpacing: '-0.04em' }}>
                  {typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}
                </span>
                <span className="text-[13px] font-light text-white/20">{kpi.unit}</span>
              </div>

              {/* Sub info */}
              <div className="text-[11px] text-slate-500/80 mt-3 font-mono tabular-nums">{kpi.sub}</div>

              {/* Trend indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                {kpi.trend && (
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: kpi.accentColor }}>{kpi.trend}</span>
                )}
                {kpi.healthy && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.5)' }} />
                )}
              </div>
            </TiltCard>
          ))}
        </div>

        {/* The Sparkline — Refined Living Pulse */}
        <div
          className="mt-6 mb-4 relative z-[1] rounded-[20px] overflow-hidden animated-border"
          style={{
            background: 'linear-gradient(180deg, rgba(253,185,19,0.04) 0%, rgba(253,185,19,0.005) 30%, rgba(11,15,26,0.98) 100%)',
            height: '220px',
            padding: '20px 24px',
          }}
        >
          {/* Real Batching Plant Photo — Cinematic Vogue Editorial */}
          <img
            src={heroPlantCinematic}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: 0.14, zIndex: 0, filter: 'saturate(0.25) brightness(0.45) contrast(1.2)', objectPosition: 'center 70%' }}
          />
          {/* Dark gradient overlay to keep curve crisp */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(180deg, rgba(11,15,26,0.4) 0%, rgba(11,15,26,0.7) 50%, rgba(11,15,26,0.85) 100%)',
            zIndex: 1,
          }} />

          {/* Subtle floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  background: 'rgba(232,184,75,0.35)',
                  left: `${10 + Math.random() * 80}%`,
                  bottom: `${15 + Math.random() * 35}%`,
                  animation: `floatUp ${4 + Math.random() * 5}s ease-out ${Math.random() * 6}s infinite`,
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
              {/* Vogue editorial gradient — champagne to transparent */}
              <linearGradient id="sparkGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.18} />
                <stop offset="30%" stopColor="#D4AF37" stopOpacity={0.06} />
                <stop offset="70%" stopColor="#D4AF37" stopOpacity={0.015} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              {/* Horizontal gradient along the line — warm to cool platinum */}
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#C9A84C" />
                <stop offset="40%" stopColor="#E8D5A3" />
                <stop offset="70%" stopColor="#F5ECD7" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
              <filter id="sparklineGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Subtle outer atmosphere */}
              <filter id="outerAtmo">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            {/* Area fill — whisper-thin wash */}
            <path d={areaPath} fill="url(#sparkGlow)" className="area-fill" />
            {/* Outermost atmospheric haze — barely visible */}
            <path d={linePath} fill="none" stroke="#D4AF37" strokeWidth="12" strokeOpacity="0.04" strokeLinejoin="round" strokeLinecap="round" className="glow-line" filter="url(#outerAtmo)" />
            {/* Soft warm glow — refined */}
            <path d={linePath} fill="none" stroke="#D4AF37" strokeWidth="5" strokeOpacity="0.08" strokeLinejoin="round" strokeLinecap="round" className="glow-line" />
            {/* Core line — platinum-champagne, editorial weight */}
            <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="main-line" filter="url(#sparklineGlow)" />
            {/* Peak whisker — architectural */}
            <line x1={peakX} y1={peakY} x2={peakX} y2={peakY - 14} stroke="rgba(212,175,55,0.12)" strokeWidth="0.5" strokeDasharray="1.5 2" />
            <circle cx={peakX} cy={peakY - 14} r="0.8" fill="rgba(212,175,55,0.2)" />
            {/* Minimal data markers — every other point */}
            {SPARKLINE_DATA.map((d, i) => {
              if (i % 2 !== 0 && i !== lastIdx) return null;
              const x = (i / (SPARKLINE_DATA.length - 1)) * svgW;
              const y = svgH - (d.v / maxV) * svgH * 0.85 - 5;
              return <circle key={i} cx={x} cy={y} r="0.8" fill="rgba(212,175,55,0.15)" className="area-fill" />;
            })}
            {/* Live endpoint — refined single pulse, no neon */}
            <circle cx={lastX} cy={lastY} r="2.5" fill="#D4AF37" opacity="0.9">
              <animate attributeName="r" values="2.5;4;2.5" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastX} cy={lastY} r="8" fill="none" stroke="rgba(212,175,55,0.1)">
              <animate attributeName="r" values="8;16;8" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0;0.15" dur="4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>{/* end sparkline */}

        </div>{/* end hero zone wrapper */}

        {/* Alert Strip — Intelligent Urgency */}
        {!alertDismissed && (
          <div
            className="flex items-center justify-between px-5 py-3 rounded-xl mt-5 mb-8"
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
        <div className="relative mt-8 mb-5 py-4">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(253,185,19,0.15), transparent)' }} />
            <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500">Opérations</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(253,185,19,0.15))' }} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            ZONE 2 — OPERATIONS (always visible)
        ══════════════════════════════════════════════════ */}
        <Suspense fallback={<div className="h-[600px] rounded-xl bg-white/[0.02] animate-pulse" />}>
          <WorldClassDashboard />
        </Suspense>

        {/* Cinematic Section Transition — Finance */}
        <div className="relative mt-10 mb-5 py-4">
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(253,185,19,0.15), transparent)' }} />
            <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500">Finance & Conformité</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(253,185,19,0.15))' }} />
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
