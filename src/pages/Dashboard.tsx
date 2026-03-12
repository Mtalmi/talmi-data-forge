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
import { RefreshCw, Maximize2, Wallet, LayoutDashboard, Activity, Factory, Truck, Package, TrendingUp, Radio, Sparkles, PhoneCall, FileText, PlusCircle, BarChart3 } from 'lucide-react';
import { IntelligenceBriefingCard } from '@/components/dashboard/IntelligenceBriefingCard';
import { ResumeIABar } from '@/components/dashboard/ResumeIABar';

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
  const [activeTab, setActiveTab] = useState<'command' | 'production' | 'operations' | 'intelligence'>('command');
  const [nextDelivery, setNextDelivery] = useState<{ client: string; volume: number; minutesLeft: number } | null>(null);
  // ─── Typewriter effect for greeting ───
  const [typedName, setTypedName] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);

  // Extract user first name (needed before typewriter)
  const rawFirst = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Max';
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);

  // Time-aware greeting based on browser local time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Bonjour';
    if (hours < 18) return 'Bon après-midi';
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

  // ─── Fetch next upcoming delivery ───
  useEffect(() => {
    const fetchNextDelivery = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const { data } = await supabase
        .from('bons_livraison_reels')
        .select('client_id, volume_m3, heure_prevue, heure_depart_centrale')
        .eq('date_livraison', todayStr)
        .order('heure_prevue', { ascending: true })
        .limit(50);
      
      if (data?.length) {
        // Find next delivery with a scheduled time after now
        const upcoming = data.find(d => {
          const t = d.heure_prevue || d.heure_depart_centrale;
          return t && t > nowTime;
        });
        
        if (upcoming) {
          const t = upcoming.heure_prevue || upcoming.heure_depart_centrale || '';
          const [h, m] = t.split(':').map(Number);
          const diffMin = Math.max(0, (h * 60 + m) - (now.getHours() * 60 + now.getMinutes()));
          
          // Fetch client name
          const { data: clientData } = await supabase
            .from('clients')
            .select('nom_client')
            .eq('client_id', upcoming.client_id)
            .maybeSingle();
          
          setNextDelivery({
            client: clientData?.nom_client || upcoming.client_id,
            volume: upcoming.volume_m3,
            minutesLeft: diffMin,
          });
        }
      }
    };
    fetchNextDelivery();
    const interval = setInterval(fetchNextDelivery, 60000);
    return () => clearInterval(interval);
  }, []);

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

          {/* ═══ TAB BAR — Stocks-style gold underline ═══ */}
          <div className="relative z-[1] mb-5" style={{
            background: 'linear-gradient(145deg, #11182E, #162036)',
            borderBottom: '1px solid rgba(212,168,67,0.12)',
            borderRadius: '10px 10px 0 0',
            padding: '0 24px',
            display: 'flex', alignItems: 'center',
          }}>
            <div className="overflow-x-auto scrollbar-hide" style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap' }}>
              {([
                { id: 'command', label: 'COMMAND CENTER' },
                { id: 'production', label: 'PRODUCTION LIVE', live: true, badge: 2 },
                { id: 'operations', label: 'OPÉRATIONS', badge: 5 },
                { id: 'intelligence', label: 'INTELLIGENCE IA', badge: 3 },
              ] as const).map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 transition-all duration-200"
                    style={{
                      padding: '14px 20px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                      color: isActive ? '#D4A843' : 'rgba(148,163,184,0.5)',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {tab.label}
                    {'live' in tab && tab.live && (
                      <span className="relative flex h-1.5 w-1.5 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                    )}
                    {'badge' in tab && tab.badge > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground" style={{ fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, padding: '0 4px', lineHeight: 1 }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ COMMAND CENTER TAB CONTENT ═══ */}
          {activeTab === 'command' && (
          <div key="tab-command" style={{ animation: 'tabFadeIn 200ms ease-in-out' }}>
          {/* (1) Greeting — Cinematic Hero Moment */}
          <div className="relative z-[1]" style={{ marginBottom: 20, animation: 'ccSectionIn 300ms ease-out 0ms both' }}>
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
                  <div className="mt-3 mb-2.5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.04) 70%, transparent 100%)' }} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ paddingLeft: 5, paddingRight: 5 }}>
                    <span className="flex flex-col items-center" style={{ fontSize: '0.95rem', fontWeight: 400, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                      <svg width="36" height="36" viewBox="0 0 60 60" className="flex-shrink-0">
                        <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                        <circle
                          cx="30" cy="30" r="24" fill="none"
                          stroke="#D4A843" strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${0.87 * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
                          transform="rotate(-90 30 30)"
                          style={{ animation: 'capacityGaugeArc 1s cubic-bezier(0.22,1,0.36,1) forwards' }}
                        />
                        <text x="30" y="32" textAnchor="middle" fill="white" fontSize="13" fontWeight="200" fontFamily="ui-monospace, 'JetBrains Mono', monospace">87%</text>
                      </svg>
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.4)', marginTop: 2 }}>Capacité</span>
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
                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-4" style={{ paddingLeft: 5 }}>
                    {[
                      { label: 'Nouveau Devis', icon: <PlusCircle size={12} />, path: '/ventes' },
                      { label: 'Relancer Clients', icon: <PhoneCall size={12} />, path: '/recouvrement', badge: '2', badgeColor: '#EF4444' },
                      { label: 'Rapport du Jour', icon: <FileText size={12} />, path: '/rapports', badge: 'New', badgeColor: '#D4A843' },
                      { label: 'Lancer Production', icon: <BarChart3 size={12} />, path: '/production' },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => navigate(btn.path)}
                        className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-white/[0.08]"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(203,213,225,0.7)',
                        }}
                      >
                        <span style={{ color: '#D4A843' }}>{btn.icon}</span>
                        {btn.label}
                        {btn.badge && (
                          <span
                            className="absolute inline-flex items-center justify-center rounded-full z-10"
                            style={{
                              top: -4,
                              right: -4,
                              fontSize: 8,
                              fontWeight: 700,
                              minWidth: btn.badge === 'New' ? 22 : 16,
                              height: 16,
                              padding: '0 4px',
                              lineHeight: 1,
                              background: btn.badgeColor,
                              color: btn.badgeColor === '#D4A843' ? '#0F1419' : '#FFFFFF',
                              boxShadow: `0 0 6px ${btn.badgeColor}60`,
                            }}
                          >
                            {btn.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-2">
                  <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(148,163,184,0.35)', letterSpacing: '0.02em' }}>{timeStr}</span>
                  <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(148,163,184,0.3)' }}>dernière mise à jour: à l'instant</span>
                  {/* Prochaine Livraison countdown card */}
                  <div className="flex items-center gap-2.5 rounded-lg px-4 py-2" style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}>
                    <Truck size={15} style={{ color: '#D4A843', flexShrink: 0, alignSelf: 'center' }} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(148,163,184,0.5)' }}>Prochaine Livraison</span>
                      {nextDelivery ? (
                        <>
                          <span className="text-xs text-white truncate max-w-[140px]">{nextDelivery.client}</span>
                          <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontWeight: 200, fontSize: '1.125rem', color: '#D4A843', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            {nextDelivery.minutesLeft} min
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>{nextDelivery.volume} m³</span>
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>Aucune livraison</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* (2) Alerte Fuite Détectée */}
          {(isCeo || isAccounting) && (
            <div className="mb-4 relative z-[1] rounded-lg overflow-hidden" style={{
              animation: 'ccSectionIn 300ms ease-out 100ms both',
              borderLeft: '3px solid #F97316',
              boxShadow: '0 0 12px rgba(249,115,22,0.2)',
              animation: 'leakAlertPulse 2s ease-in-out infinite',
            }}>
              <LeakageAlertBanner />
            </div>
          )}

          {/* (3) 4 KPI Cards Row */}
          <div className="grid grid-cols-4 gap-4 mb-5 relative z-[1] items-stretch w-full" style={{ alignItems: 'stretch', animation: 'ccSectionIn 300ms ease-out 200ms both' }}>
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
              sparkline: '0,28 20,24 40,20 60,26 80,18 100,14 120,10',
              secondaryLabel: 'Obj. mensuel',
              secondaryValue: '671 / 3 200 m³',
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
              sparkline: '0,26 20,22 40,28 60,20 80,16 100,12 120,8',
              secondaryLabel: 'Objectif',
              secondaryValue: '250K DH · 30%',
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
              sparkline: '0,24 20,20 40,22 60,18 80,16 100,14 120,10',
              secondaryLabel: 'Matières',
              secondaryValue: '28.1% du CA',
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
              secondaryLabel: 'Net',
              secondaryValue: '+49K DH',
            },
          ].map((kpi, i) => (
            <TiltCard
              key={i}
              className="tbos-hero-card group cursor-default shimmer-effect h-full flex flex-col min-w-0"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                animation: `ccSectionIn 300ms ease-out ${200 + i * 50}ms both`,
                ...(kpi.healthyGlow ? {
                  boxShadow: '0 0 20px rgba(34,197,94,0.06), inset 0 1px 0 rgba(34,197,94,0.08), 0 1px 3px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.15)',
                  borderColor: 'rgba(34,197,94,0.12)',
                } : {}),
              }}
            >
              <div className="scanline-overlay" />
              <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: `linear-gradient(90deg, transparent, ${kpi.accentColor}50, transparent)` }} />
              <div className="relative z-[1] flex flex-col flex-1" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '1 1 auto' }}>
                  <div className="mb-5" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgb(100,116,139)' }}>
                    {kpi.label}
                  </div>
                  <div className="flex items-baseline gap-2 leading-none">
                    <span className="text-3xl font-mono tracking-tight text-white" style={{
                      fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                      fontWeight: 200, lineHeight: 1,
                      textShadow: '0 0 35px rgba(255,215,0,0.2), 0 0 70px rgba(255,215,0,0.07)',
                    }}>
                      {typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}
                    </span>
                    <span className="text-lg font-mono text-muted-foreground ml-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{kpi.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-3 tabular-nums" style={{ fontFamily: "'Inter', system-ui", fontSize: '11px', fontWeight: 400 }}>{kpi.sub}</div>
                  {kpi.trend && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[11px] tabular-nums" style={{ fontFamily: "'Inter', system-ui", fontWeight: 400, color: 'rgba(52,211,153,0.7)' }}>{kpi.trend}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <div className="flex items-end justify-between pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <svg width="100" height="28" viewBox="0 0 120 32">
                      <polyline fill="none" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={kpi.sparkline} style={{ opacity: 0.6 }} />
                      {(() => { const pts = kpi.sparkline.split(' '); const last = pts[pts.length - 1]?.split(','); return last ? <circle cx={last[0]} cy={last[1]} r="2" fill="#D4A843" style={{ opacity: 0.8 }} /> : null; })()}
                    </svg>
                    <div className="text-right flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.4)' }}>{kpi.secondaryLabel}</span>
                      <span className="text-xs font-mono" style={{ color: 'rgba(203,213,225,0.6)' }}>{kpi.secondaryValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          ))}
          </div>

          {/* (4) Intelligence IA section */}
          <div className="relative z-[1] mb-2" style={{ animation: 'ccSectionIn 300ms ease-out 450ms both' }}>
            <IntelligenceBriefingCard />
          </div>

          {/* Résumé IA one-liner */}
          <ResumeIABar />

          {/* (5) Flux Usine ribbon */}
          <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] animate-pulse mt-2" style={{ animation: 'ccSectionIn 300ms ease-out 550ms both' }} />}>
            <PlantFlowSchematic />
          </Suspense>

          {/* (6) Niveaux de Stock — stock only */}
          <div className="mt-5" style={{ animation: 'ccSectionIn 300ms ease-out 650ms both' }}>
            {/* Section Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <span style={{ fontSize: 14 }}>📦</span>
              <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#D4A843' }}>Niveaux de Stock</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,168,67,0.4), rgba(212,168,67,0.05))' }} />
            </div>
            <Suspense fallback={<div className="h-[300px] rounded-lg bg-white/[0.02] animate-pulse" />}>
              <WorldClassDashboard hideProductionWidgets hideOpsWidgets hideIntelWidgets />
            </Suspense>
          </div>
          </div>
          )}

          {/* ═══ PRODUCTION LIVE TAB CONTENT ═══ */}
          {activeTab === 'production' && (
          <div key="tab-production" style={{ animation: 'tabFadeIn 200ms ease-in-out' }}>
          {/* Production Stats Bar */}
          <div className="mb-5 flex items-center gap-6 w-full rounded-lg p-3 backdrop-blur-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            {/* Taux de Réussite mini gauge */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <svg width="48" height="48" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="30" cy="30" r="24" fill="none"
                  stroke="#D4A843" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${0.94 * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
                  transform="rotate(-90 30 30)"
                  style={{
                    animation: 'tauxGaugeArc 1.5s cubic-bezier(0.25,0.1,0.25,1) forwards',
                    strokeDashoffset: `${0.94 * 2 * Math.PI * 24}`,
                  }}
                />
                <text x="30" y="33" textAnchor="middle" fill="white" fontSize="14" fontWeight="200" fontFamily="ui-monospace, SFMono-Regular, monospace">94%</text>
              </svg>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>Taux de Réussite</span>
                <span className="text-xs" style={{ color: 'rgba(148,163,184,0.35)' }}>7 derniers jours</span>
              </div>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>Batches Aujourd'hui</span>
              <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: 18, fontWeight: 200, color: 'white', lineHeight: 1.2 }}>14</span>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>Cadence</span>
              <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: 18, fontWeight: 200, color: 'white', lineHeight: 1.2 }}>47 <span className="text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>m³/h</span></span>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>Efficacité</span>
              <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: 18, fontWeight: 200, color: 'white', lineHeight: 1.2 }}>94<span className="text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>%</span></span>
            </div>
          </div>
          <style>{`
            @keyframes tauxGaugeArc {
              from { stroke-dashoffset: ${0.94 * 2 * Math.PI * 24}; }
              to { stroke-dashoffset: 0; }
            }
          `}</style>

          <div
            className="mb-5 relative z-[1] rounded-lg overflow-hidden bg-gradient-to-br from-[#1a1f2e] to-[#141824] border border-amber-500/20 p-5"
          >
            <div className="relative flex items-center gap-3 px-5 pt-4 pb-1 z-10">
              <Radio size={14} className="text-amber-400" />
              <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Live Production du Jour</span>
              <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.15))' }} />
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-semibold">En service</span>
              </div>
            </div>

            {/* ── Production Chart ── */}
            <div className="flex gap-3 px-5 pb-4 pt-3 z-10 relative" style={{ minHeight: 320 }}>
              {/* Chart panel */}
              <div className="flex-[4] min-w-0">
                <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Production (m³/h) vs Target
                </div>
                <svg
                  width="100%" height="220" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none"
                  className="cursor-crosshair"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                >
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                    <line key={i} x1="0" y1={svgH * (1 - pct)} x2={svgW} y2={svgH * (1 - pct)} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  ))}
                  {/* Target line */}
                  <polyline
                    fill="none"
                    stroke="rgba(212,175,55,0.2)"
                    strokeWidth="1"
                    strokeDasharray="4,3"
                    points={TARGET_DATA.map((d, i) => {
                      const x = (i / (TARGET_DATA.length - 1)) * svgW;
                      const y = svgH - (d.t / allMax) * svgH * 0.85 - 5;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {/* Area fill */}
                  <path d={`M${SPARKLINE_DATA.map((d, i) => {
                    const x = (i / (SPARKLINE_DATA.length - 1)) * svgW;
                    const y = svgH - (d.v / allMax) * svgH * 0.85 - 5;
                    return `${x},${y}`;
                  }).join(' L')} L${svgW},${svgH} L0,${svgH} Z`} fill="url(#prodAreaGrad)" />
                  <defs>
                    <linearGradient id="prodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(253,185,19,0.15)" />
                      <stop offset="100%" stopColor="rgba(253,185,19,0)" />
                    </linearGradient>
                  </defs>
                  {/* Main line */}
                  <polyline
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={SPARKLINE_DATA.map((d, i) => {
                      const x = (i / (SPARKLINE_DATA.length - 1)) * svgW;
                      const y = svgH - (d.v / allMax) * svgH * 0.85 - 5;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {/* Now line */}
                  <line x1={(NOW_INDEX / (SPARKLINE_DATA.length - 1)) * svgW} y1="0" x2={(NOW_INDEX / (SPARKLINE_DATA.length - 1)) * svgW} y2={svgH} stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="3,3" />
                  {/* Hover point */}
                  {hoveredPoint && (
                    <>
                      <line x1={hoveredPoint.x} y1="0" x2={hoveredPoint.x} y2={svgH} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                      <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="3" fill="#C9A84C" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                    </>
                  )}
                  <rect x="0" y="0" width={svgW} height={svgH} fill="transparent" />
                </svg>
              </div>

              {/* Camera panel */}
              <div className="flex-[3.5] border-l border-white/[0.04] pl-3 ml-2 min-w-0 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Caméra Centrale</div>
                  <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /><span className="text-[8px] text-red-400/80 font-medium uppercase tracking-wider">LIVE</span></div>
                </div>
                <div className="flex-1 rounded-lg relative overflow-hidden cursor-pointer group" style={{ background: 'linear-gradient(135deg, rgba(15,20,35,0.95) 0%, rgba(10,15,25,0.98) 100%)', border: '1px solid rgba(255,255,255,0.04)', minHeight: '200px' }} onClick={() => window.location.href = '/surveillance'}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-[2] gap-4">
                    <div className="relative" style={{ width: 96, height: 96 }}>
                      <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(212,168,67,0.15)' }} />
                      <div className="absolute rounded-full" style={{ inset: 12, border: '1px solid rgba(212,168,67,0.10)' }} />
                      <div className="absolute rounded-full" style={{ inset: 24, border: '1px solid rgba(212,168,67,0.08)' }} />
                      <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'rgba(212,168,67,0.06)' }} />
                      <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: 'rgba(212,168,67,0.06)' }} />
                      <div className="absolute inset-0 rounded-full overflow-hidden" style={{ animation: 'radarSweep 4s linear infinite' }}>
                        <div className="absolute left-1/2 top-1/2 origin-top-left" style={{ width: 48, height: 48, marginLeft: 0, marginTop: -48, background: 'conic-gradient(from 0deg at 0% 100%, rgba(212,168,67,0.25) 0deg, rgba(212,168,67,0) 40deg, transparent 40deg)' }} />
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: 'rgba(212,168,67,0.5)' }} />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#D4A843' }} />
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Caméra en connexion...</span>
                    <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(148,163,184,0.35)' }}>Dernière capture: il y a 4h</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-[3] p-2.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/80 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>47 m³/h</span>
                        <span className="w-px h-3 bg-white/10" />
                        <span className="text-[10px] text-emerald-400/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>94%</span>
                      </div>
                      <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeStr}</span>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 z-[4] px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <span className="text-[8px] text-white/60 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CAM-01 · Centrale</span>
                  </div>
                </div>
              </div>

              {/* Batch queue panel */}
              <div className="flex-[3] border-l border-white/[0.04] pl-3 ml-2 min-w-0 flex flex-col">
                <div className="mb-3">
                  <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-medium mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>File de Production</div>
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
                {/* Metrics */}
                <div className="mt-auto grid grid-cols-2 gap-2">
                  {[
                    { label: 'Rendement', value: '94%', color: '#34D399' },
                    { label: 'Cadence', value: '47 m³/h', color: '#C9A84C' },
                    { label: 'Batches', value: '23', color: '#94A3B8' },
                    { label: 'Attente', value: '12 min', color: '#FBBF24' },
                  ].map((m) => (
                    <div key={m.label} className="p-1.5 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-[7px] text-slate-600 uppercase tracking-wider">{m.label}</div>
                      <div className="text-[11px] font-medium font-mono tabular-nums" style={{ color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 py-2 mt-1 rounded-b-lg z-10 relative" style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500">Température</span>
                  <span className="text-[9px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>22°C</span>
                  <span className="text-[9px] text-emerald-400">Optimal</span>
                </div>
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
          </div>

          {/* Additional Production Widgets */}
          <div className="grid grid-cols-3 gap-4 mt-5 relative z-[1]" style={{ alignItems: 'stretch' }}>
            <div className="min-w-0">
              <Suspense fallback={<div className="h-48 rounded-lg bg-white/[0.02] animate-pulse" />}>
                <LiveBatchProgress />
              </Suspense>
            </div>
            <div className="min-w-0 rounded-lg p-5" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-1.5 w-1.5"><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
                <span className="text-[14px] font-medium text-white/90">Derniers Batches</span>
              </div>
              {/* Header row */}
              <div className="flex items-center justify-between px-2 pb-2 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[10px] uppercase tracking-wider font-medium w-[70px]" style={{ color: 'rgba(148,163,184,0.4)' }}>Batch</span>
                <span className="text-[10px] uppercase tracking-wider font-medium flex-1 text-center" style={{ color: 'rgba(148,163,184,0.4)' }}>Formule</span>
                <span className="text-[10px] uppercase tracking-wider font-medium w-[50px] text-center" style={{ color: 'rgba(148,163,184,0.4)' }}>Volume</span>
                <span className="text-[10px] uppercase tracking-wider font-medium w-[45px] text-right" style={{ color: 'rgba(148,163,184,0.4)' }}>Heure</span>
              </div>
              <div className="space-y-1">
                {[
                  { id: '#403-068', formula: 'F-B25', vol: '8 m³', time: '15:42', status: 'ok' },
                  { id: '#403-067', formula: 'F-B30', vol: '12 m³', time: '14:28', status: 'ok' },
                  { id: '#403-066', formula: 'F-B25', vol: '8 m³', time: '13:15', status: 'warn' },
                  { id: '#403-065', formula: 'F-B35', vol: '10 m³', time: '12:03', status: 'ok' },
                  { id: '#403-064', formula: 'F-B25', vol: '8 m³', time: '11:21', status: 'ok' },
                ].map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2 w-[70px]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.status === 'ok' ? '#34D399' : '#FBBF24' }} />
                      <span className="text-[10px] font-mono text-slate-400">{b.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-1 text-center">{b.formula}</span>
                    <span className="text-[10px] text-slate-500 w-[50px] text-center">{b.vol}</span>
                    <span className="text-[9px] font-mono text-slate-600 w-[45px] text-right">{b.time}</span>
                  </div>
                ))}
              </div>
            </div>
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
                      <span className="text-sm font-mono text-slate-400 tabular-nums">{q.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">{q.test}</span>
                      <span
                        className="text-[10px] font-mono font-medium tabular-nums inline-flex items-center justify-center rounded min-w-[48px] py-0.5"
                        style={{
                          background: q.ok ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                          border: `1px solid ${q.ok ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                          color: q.ok ? '#34D399' : 'rgba(251,191,36,0.8)',
                        }}
                      >
                        {q.ok ? 'OK' : 'VAR'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600 tabular-nums">{q.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent IA Production Banner */}
          <div className="mt-5 rounded-lg flex items-center gap-3 px-5 py-3.5" style={{
            background: 'rgba(255,215,0,0.04)',
            border: '1px solid rgba(212,168,67,0.2)',
            borderTop: '2px solid rgba(212,168,67,0.4)',
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ color: '#D4A843', fontSize: 14, animation: 'agentSparkle 2s ease-in-out infinite' }}>✦</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A843' }}>Agent IA: </span>
              <span className="text-xs" style={{ color: 'rgba(241,245,249,0.8)' }}>
                Prochain batch recommandé — <span className="font-medium text-white/90">Béton B25 Standard</span> · <span className="font-mono">14 m³</span> · <span className="font-medium text-white/90">TGCC</span> · Optimisation séquence activée
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all hover:brightness-110" style={{ background: '#D4A843', color: '#0F1629' }}>
                Lancer
              </button>
              <button className="px-4 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-white/[0.06]" style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.2)', color: 'rgba(148,163,184,0.6)' }}>
                Ignorer
              </button>
            </div>
          </div>
          </div>
          )}

        </div>{/* end hero zone wrapper */}
        {activeTab === 'operations' && (
        <div key="tab-operations" style={{ animation: 'tabFadeIn 200ms ease-in-out' }}>
        <div className="flex items-center gap-3 pt-2 pb-4 mb-0">
          <span style={{ color: '#D4A843', fontSize: 14 }}>⚡</span>
          <span className="text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: '#D4A843' }}>Opérations du Jour</span>
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.15))' }} />
          <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(148,163,184,0.4)' }}>{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>
        <div className="mt-0">
          <Suspense fallback={<div className="h-[600px] rounded-lg bg-white/[0.02] animate-pulse" />}>
            <WorldClassDashboard hideProductionWidgets showOnlyOps />
          </Suspense>
        </div>
        </div>
        )}

        {/* ═══ INTELLIGENCE IA TAB CONTENT ═══ */}
        {activeTab === 'intelligence' && (
        <div key="tab-intelligence" style={{ animation: 'tabFadeIn 200ms ease-in-out' }}>
        <div className="flex items-center gap-3 pt-2 pb-4 mb-0">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">Intelligence IA</span>
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.15))' }} />
        </div>
        <div className="mt-0">
          <Suspense fallback={<div className="h-[600px] rounded-lg bg-white/[0.02] animate-pulse" />}>
            <WorldClassDashboard hideProductionWidgets showOnlyIntel />
          </Suspense>
        </div>
        </div>
        )}

        {/* FINANCE & CONFORMITÉ — Hidden for CEO demo (no content yet) */}

        {/* Footer */}
        <div className="mt-8 mb-6 px-4 flex items-center justify-between" style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(148,163,184,0.15)' }}>
          <span>TBOS {activeTab === 'command' ? 'COMMAND CENTER' : activeTab === 'production' ? 'PRODUCTION LIVE' : activeTab === 'operations' ? 'OPÉRATIONS' : 'INTELLIGENCE IA'} v2.0 — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Synchronisé en temps réel
          </span>
          <span>✦ Propulsé par Claude Opus · Atlas Concrete Morocco</span>
        </div>
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
