import { useEffect, useState, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useLiveSimulation } from '@/hooks/useLiveSimulation';
import { triggerPrint } from '@/lib/printUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { AnimatePresence } from 'framer-motion';

import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { usePlant } from '@/contexts/PlantContext';
import AlertBanner from '@/components/dashboard/AlertBanner';
import LeakageAlertBanner from '@/components/dashboard/LeakageAlertBanner';
import { type Period } from '@/components/dashboard/PeriodSelector';
import { SmartLabel } from '@/components/ui/SmartLabel';
import { LazyDashboardSection } from '@/components/dashboard/LazyDashboardSection';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardStatsWithPeriod } from '@/hooks/useDashboardStatsWithPeriod';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Maximize2, Wallet, LayoutDashboard, Activity, Factory, Truck, Package, TrendingUp, Radio, Sparkles, PhoneCall, FileText, PlusCircle, BarChart3, CheckCircle2, Bell, ChevronRight, AlertTriangle, Camera, Settings } from 'lucide-react';
import { IntelligenceBriefingCard } from '@/components/dashboard/IntelligenceBriefingCard';
import { ResumeIABar } from '@/components/dashboard/ResumeIABar';
import { DailyScoreGauge } from '@/components/dashboard/DailyScoreGauge';
import { MultiMarketCalendar } from '@/components/dashboard/MultiMarketCalendar';
import { ScenarioSimulator } from '@/components/dashboard/ScenarioSimulator';
import { tbosToast } from '@/hooks/useTbosToast';
import { useUnitFormat } from '@/hooks/useUnitFormat';

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
  const uf = useUnitFormat();
  const navigate = useNavigate();
  const location = useLocation();
  const { activePlant, plant: plantData, demoData, setPlant: setActivePlant, isDemo, fadeOpacity } = usePlant();
  const { stats, loading: statsLoading, refresh } = useDashboardStats();
  const [period] = useState<Period>('month');
  const { stats: periodStats, loading: periodLoading, refresh: refreshPeriod } = useDashboardStatsWithPeriod(period);
  const { checkPaymentDelays } = usePaymentDelays();
  const [refreshing, setRefreshing] = useState(false);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [hoveredChartIdx, setHoveredChartIdx] = useState<number | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<'command' | 'production' | 'operations' | 'intelligence'>('command');
  const [searchFocused, setSearchFocused] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellSeen, setBellSeen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [nextDelivery, setNextDelivery] = useState<{ client: string; volume: number; minutesLeft: number } | null>(null);
  // ─── Sync countdown ───
  const [syncCountdown, setSyncCountdown] = useState(30);
  // ─── Typewriter effect for greeting ───
  const [typedName, setTypedName] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [showLancerToast, setShowLancerToast] = useState(false);
  const [lancerToastVisible, setLancerToastVisible] = useState(false);
  const [midPanelView, setMidPanelView] = useState<'data' | 'camera'>('data');
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [cameraTime, setCameraTime] = useState('');
  const [demoMarket] = useState<'ma' | 'eu' | 'us'>(activePlant);

  // ─── Read location state for tab activation ───
  useEffect(() => {
    const state = location.state as { activeTab?: string; scrollTo?: string } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab as any);
      // Clear the state so back/forward doesn't re-trigger
      window.history.replaceState({}, '');
    }
    if (state?.scrollTo === 'rapports') {
      setTimeout(() => {
        const el = document.querySelector('[data-section="rapports"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [location.state]);

  // Camera ticking timestamp
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setCameraTime(`${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}:${n.getSeconds().toString().padStart(2,'0')} UTC+1`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // KPI count-up values
  const kpiProduit = useCountUp(671, 1500, 0);
  const kpiRendement = useCountUp(94, 1500, 200);
  const kpiQualite = useCountUp(96.2, 1500, 400, 1);
  const kpiLivA = useCountUp(8, 1500, 600);
  const kpiLivB = useCountUp(12, 1500, 600);

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

  // ─── Sync countdown timer (30s loop) ───
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Close bell dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setBellOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [bellOpen]);

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

  // Auto-scroll active tab into view on mobile (horizontal only)
  useEffect(() => {
    const el = tabBarRef.current?.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement | null;
    if (el && tabBarRef.current) {
      const container = tabBarRef.current;
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollTarget = elLeft - (containerWidth / 2) + (elWidth / 2);
      container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Animated KPI values — driven by plant data
  const rawProdVolume = useCountUp(demoData.production.volume, 1800, 200);
  const rawCa = useCountUp(demoData.revenue.today / 1000, 1800, 400, 1);
  const marge = useCountUp(demoData.production.marge, 1800, 600, 1);
  const rawTresorerie = useCountUp(demoData.tresorerie.value / 1000, 1800, 800);

  // Live simulation — fluctuates values every 60s
  const simBase = useMemo(() => ({
    prodVolume: demoData.production.volume,
    revenue: demoData.revenue.today,
    marge: demoData.production.marge,
    conformite: demoData.production.conformite,
  }), [demoData.production.volume, demoData.revenue.today, demoData.production.marge, demoData.production.conformite]);
  const sim = useLiveSimulation(simBase);

  // Converted values for display (use sim values when count-up is done)
  const prodVolume = uf.rawVolume(rawProdVolume);
  const ca = +(uf.rawCurrencyK(rawCa * 1000)).toFixed(1);
  const tresorerie = Math.round(uf.rawCurrencyK(rawTresorerie * 1000));
  const flashClass = sim.flash ? 'tbos-value-flash' : '';

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
    const targetVal = TARGET_DATA[hoveredChartIdx]?.t || 0;
    const diffPct = targetVal > 0 ? Math.round(((d.v - targetVal) / targetVal) * 100) : 0;
    return { x, y, v: d.v, h: d.h, time: timeLabel, diffPct };
  })() : null;

  const [chartMousePos, setChartMousePos] = useState<{ x: number; y: number } | null>(null);

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
    // Track pixel position relative to chart container
    const parent = svg.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      setChartMousePos({ x: e.clientX - parentRect.left, y: e.clientY - parentRect.top });
    }
  }, [svgW, allMax]);

  const handleChartMouseLeave = useCallback(() => { setHoveredChartIdx(null); setChartMousePos(null); }, []);

  return (
    <MainLayout>
      {showLancerToast && (
        <div
          className="fixed top-4 right-4 z-50 bg-[#0f1729] border border-[#D4A843]/30 rounded-lg px-5 py-3 shadow-2xl border-l-2 border-l-[#D4A843] flex items-center"
          style={{ transition: 'opacity 300ms ease', opacity: lancerToastVisible ? 1 : 0 }}
        >
          <span className="text-[#D4A843] mr-2">✦</span>
          <span className="text-sm text-white font-medium">Séquence optimisée lancée — Béton B25 Standard · 14 m³</span>
        </div>
      )}
      <div
        className="relative tbos-dashboard-scroll space-y-0 overflow-x-hidden max-w-full w-full min-w-0 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 md:pt-6 lg:pt-2 pb-3 sm:pb-4 md:pb-6 lg:pb-8 box-border"
        style={{
          background: 'linear-gradient(145deg, #11182E, #162036)',
          opacity: fadeOpacity,
          transition: 'opacity 300ms ease',
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
            background: rgba(15,23,41,0.8);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 28px 28px 24px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow:
              0 1px 3px rgba(0,0,0,0.12),
              0 8px 32px rgba(0,0,0,0.15);
          }
          .tbos-hero-card:hover {
            border-color: rgba(212,168,67,0.3) !important;
            transform: translateY(-1px);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.08),
              0 2px 8px rgba(0,0,0,0.2),
              0 8px 24px rgba(212,168,67,0.05);
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

          /* ── Mobile Dashboard Card Spacing ── */
          @media (max-width: 767px) {
            .tbos-dashboard-scroll {
              padding-left: 12px !important;
              padding-right: 12px !important;
            }
            .tbos-dashboard-scroll > * {
              max-width: 100% !important;
              overflow-x: hidden;
            }
            .tbos-dashboard-scroll .tbos-hero-card {
              padding: 16px !important;
            }
            .tbos-mobile-card-stack > * {
              margin-bottom: 12px !important;
            }
            .tbos-mobile-card-stack > *:last-child {
              margin-bottom: 0 !important;
            }
            .tbos-hero-stat-number {
              font-size: clamp(24px, 5vw, 36px) !important;
            }
            .tbos-stats-bar {
              flex-wrap: wrap !important;
              gap: 12px !important;
            }
            .tbos-stats-bar .w-px {
              display: none !important;
            }
            .tbos-hero-cockpit {
              padding: 16px !important;
            }
            .tbos-kpi-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
            }
            .tbos-prod-stats-bar {
              flex-wrap: wrap !important;
              gap: 12px !important;
              padding: 12px !important;
            }
            .tbos-prod-stats-bar > div {
              border-right: none !important;
              padding-right: 0 !important;
              margin-right: 0 !important;
            }
            /* Tab bar mobile scroll */
            .tbos-tab-bar-scroll {
              display: flex;
              overflow-x: auto;
              flex-wrap: nowrap !important;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .tbos-tab-bar-scroll::-webkit-scrollbar {
              display: none;
            }
            .tbos-tab-bar-scroll > button {
              flex-shrink: 0;
              white-space: nowrap;
              padding: 8px 16px !important;
            }
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
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-300"
            title="Paramètres"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {/* Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => { setBellOpen(prev => !prev); if (!bellOpen) setBellSeen(true); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-300 relative"
              title="Notifications"
            >
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              {!bellSeen && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1 tbos-notif-bounce" style={{ border: '2px solid #0a0f1e' }}>2</span>
              )}
            </button>
            {bellOpen && (
              <div
                className="absolute z-50"
                style={{
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 380,
                  maxHeight: 400,
                  overflowY: 'auto',
                  background: '#0f1729',
                  border: '1px solid rgba(212,168,67,0.12)',
                  borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  animation: 'searchDropIn 200ms ease-out',
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.15em', color: '#D4A843', fontWeight: 700, textTransform: 'uppercase' as const }}>NOTIFICATIONS</span>
                  <button
                    style={{ fontSize: 11, color: 'rgba(212,168,67,0.5)', cursor: 'pointer', background: 'none', border: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(212,168,67,0.5)'; }}
                    onClick={() => setBellSeen(true)}
                  >
                    Tout marquer comme lu
                  </button>
                </div>

                {/* Entry 1 — Critical (unread) */}
                <div
                  className="flex items-start gap-3 cursor-pointer transition-colors duration-150"
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '2px solid rgba(212,168,67,0.4)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => setBellOpen(false)}
                >
                  <span style={{ fontSize: 12, marginTop: 2, flexShrink: 0 }}>🔴</span>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.4 }}>Alerte Stock: Niveau eau critique — commander avant le 18 mars</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>il y a 2h</div>
                  </div>
                </div>

                {/* Entry 2 — Warning (unread) */}
                <div
                  className="flex items-start gap-3 cursor-pointer transition-colors duration-150"
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '2px solid rgba(212,168,67,0.4)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => setBellOpen(false)}
                >
                  <span style={{ fontSize: 12, marginTop: 2, flexShrink: 0 }}>🟡</span>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.4 }}>Devis DEV-2602-316 — relance client recommandée par l'IA</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>il y a 4h</div>
                  </div>
                </div>

                {/* Entry 3 — Success (read) */}
                <div
                  className="flex items-start gap-3 cursor-pointer transition-colors duration-150"
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => setBellOpen(false)}
                >
                  <span style={{ fontSize: 12, marginTop: 2, flexShrink: 0 }}>🟢</span>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.4 }}>Livraison BL-2026-0312 — Ciments & Béton du Sud livré avec succès</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>il y a 6h</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    className="transition-colors duration-150"
                    style={{ fontSize: 11, color: 'rgba(212,168,67,0.6)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(212,168,67,0.6)'; }}
                    onClick={() => { setBellOpen(false); navigate('/alertes'); }}
                  >
                    Voir toutes les notifications →
                  </button>
                </div>
              </div>
            )}
          </div>
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
          <div className="relative z-[1] border-b border-white/[0.04] pb-4 mb-2" style={{ animation: 'fadeSlideIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both', padding: '24px 0 16px' }}>
            <div className="flex items-center justify-center gap-4">
              <LayoutDashboard size={28} style={{ color: '#D4A843', opacity: 0.8 }} />
              <div className="flex flex-col items-start">
                {/* Title row */}
                <h2 style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", lineHeight: 1.1, fontSize: 28 }}>
                  <span style={{ fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', textShadow: '0 0 20px rgba(212,168,67,0.15)' }}>TBOS</span>
                  {' '}
                  <span style={{ fontWeight: 200, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)' }}>Tableau de Bord</span>
                </h2>
                {/* Subtitle with data pulse */}
                <span className="flex items-center gap-1" style={{
                  fontFamily: "'Inter', 'DM Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginTop: 4,
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

                {/* Market Selector Pills */}
                <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                  {plantData && [
                    { id: 'ma' as const, flag: '🇲🇦', label: 'Atlas Concrete Morocco' },
                    { id: 'eu' as const, flag: '🇪🇺', label: 'Demo EU Plant' },
                    { id: 'us' as const, flag: '🇺🇸', label: 'Demo US Plant' },
                  ].map(market => {
                    const active = activePlant === market.id;
                    return (
                      <button
                        key={market.id}
                        onClick={() => setActivePlant(market.id)}
                        style={{
                          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                          fontSize: 10,
                          letterSpacing: '1px',
                          padding: '3px 10px',
                          borderRadius: 20,
                          border: active ? '1px solid #D4A843' : '1px solid rgba(212,168,67,0.3)',
                          background: active ? '#D4A843' : 'transparent',
                          color: active ? '#0F1629' : '#9CA3AF',
                          cursor: 'pointer',
                          fontWeight: active ? 700 : 500,
                          transition: 'all 200ms',
                          whiteSpace: 'nowrap',
                          transform: 'scale(1)',
                        }}
                        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                        onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#D4A843'; }}
                        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; } }}
                      >
                        {market.flag} {market.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
  



          <div className="relative z-[1] mb-5" style={{
            background: 'linear-gradient(145deg, #11182E, #162036)',
            borderBottom: '1px solid rgba(212,168,67,0.12)',
            borderRadius: '10px 10px 0 0',
            padding: '0 24px',
            display: 'flex', alignItems: 'center',
          }}>
            <div
              className="tbos-tab-bar-scroll overflow-x-auto scrollbar-hide md:overflow-x-visible flex-1"
              style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              ref={tabBarRef}
            >
              {([
                { id: 'command', label: 'COMMAND CENTER' },
                { id: 'production', label: 'PRODUCTION LIVE', live: true, badge: 2, badgeBg: '#D4A843', badgeText: '#000' },
                { id: 'operations', label: 'OPÉRATIONS', badge: 5, badgeBg: '#D4A843', badgeText: '#000' },
                { id: 'intelligence', label: 'INTELLIGENCE IA', badge: 3, badgeBg: '#EF4444', badgeText: '#FFF' },
              ] as const).map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 transition-all duration-200 min-h-[44px] flex-shrink-0 whitespace-nowrap focus:outline-none focus-visible:outline-none"
                    style={{
                      padding: '14px 20px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                      outline: 'none',
                      boxShadow: 'none',
                      color: isActive ? '#D4A843' : 'rgba(148,163,184,0.5)',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      scrollSnapAlign: 'start',
                    }}
                  >
                    {tab.label}
                    {'liveGreenDot' in tab && tab.liveGreenDot && (
                      <span className="relative flex h-2 w-2 ml-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                    )}
                    {'live' in tab && tab.live && (
                      <span className="relative flex h-1.5 w-1.5 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                    )}
                    {'badge' in tab && tab.badge > 0 && (
                      <span className="ml-1.5" style={{ width: 20, height: 20, fontSize: 11, fontWeight: 600, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: tab.badgeBg, color: tab.badgeText, boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Mobile scroll fade indicator */}
            <div
              className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none md:hidden"
              style={{ background: 'linear-gradient(to right, transparent, #13192f)' }}
            />
          </div>

          {/* ═══ COMMAND CENTER TAB CONTENT ═══ */}
          {activeTab === 'command' && (
          <div key="tab-command" className="tbos-mobile-card-stack" style={{ animation: 'tabFadeIn 200ms ease-in-out' }}>

          {/* (1) Hero — Command Cockpit Strip — GREETING + SCORE FIRST */}
          <div className="relative z-[1]" style={{ marginBottom: 20, animation: 'ccSectionIn 300ms ease-out 50ms both' }}>
            <div
              className="tbos-hero-cockpit rounded-xl backdrop-blur-sm"
              style={{
                background: 'rgba(15,23,41,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '24px 32px',
              }}
            >
              {/* ── ROW 1: GREETING + DAILY SCORE ── */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-lg font-semibold text-white tracking-tight" style={{ lineHeight: 1.2 }}>
                    {greeting} {typedName || '\u00A0'}{typedName.length === firstName.length ? '.' : ''}
                    {showCursor && <span className="inline-block w-[2px] h-[20px] ml-0.5 align-bottom" style={{ background: 'rgba(253,185,19,0.6)', animation: 'pulse-alert 0.8s ease-in-out infinite' }} />}
                  </h1>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                    Briefing matinal prêt. <span style={{ color: '#F59E0B' }}>{demoData.shutdownRisk.active ? '3 alertes' : '0 alertes'}</span> nécessitent votre attention.
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1" style={{ fontSize: 11 }}>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.08)', boxShadow: '0 0 8px rgba(34, 197, 94, 0.2)' }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      <span className="font-semibold uppercase tracking-wide text-emerald-400 tbos-op-breathe">OPERATIONAL</span>
                    </span>
                    <span className="text-muted-foreground/20">|</span>
                    <span className="text-muted-foreground/40">
                      {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {demoData.location}
                    </span>
                    <span className="text-muted-foreground/20">|</span>
                    <span className="text-muted-foreground/40">
                      <span className="text-sm">{demoData.weather.temp > 25 ? '☀️' : demoData.weather.temp < 10 ? '🌧' : '⛅'}</span> {uf.fmtTemp(demoData.weather.temp)} {demoData.weather.condition} · {demoData.weather.humidity}% · <span className={`${demoData.weather.humidity < 50 ? 'text-emerald-400/80' : 'text-amber-400/80'} font-semibold`}>● {demoData.weather.humidity < 50 ? 'Optimal' : 'Attention'}</span>
                    </span>
                  </div>
                </div>
                {/* DAILY SCORE GAUGE */}
                <div className="hidden md:block">
                  <DailyScoreGauge score={demoData.score} deltaVsYesterday={3} streak={demoData.streak} weeklyRecord={{ score: demoData.recordScore, day: 'jeudi' }} />
                </div>
              </div>

              {/* ── ROW 2: STATS BAR (the hero — Production Live format) ── */}
              <div className="tbos-stats-bar flex items-center gap-8 py-3 bg-gradient-to-r from-[#D4A843]/[0.03] via-transparent to-transparent rounded-lg">
                {/* Capacity */}
                <div className="flex flex-col items-center justify-center flex-shrink-0 w-[90px]">
                  <span className="tbos-hero-stat-number text-3xl font-bold tracking-tight text-[#D4A843]" style={{ textShadow: '0 0 30px rgba(212, 168, 67, 0.2)' }}>87<span className="text-lg font-normal text-[#D4A843]/50">%</span></span>
                   <div className="w-[80px] h-[3px] bg-white/10 rounded-full mt-1.5">
                     <div className="h-full rounded-full bg-gradient-to-r from-[#D4A843]/80 to-[#D4A843] tbos-bar-grow" style={{ width: '87%' }} />
                  </div>
                  <span className="text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase mt-1.5">CAPACITÉ</span>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-white/10 flex-shrink-0" />

                {/* Alertes */}
                <div className="flex flex-col">
                  <div className="flex items-baseline">
                    <span className="tbos-hero-stat-number text-2xl text-red-400 font-bold" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", textShadow: '0 0 12px rgba(239, 68, 68, 0.3)' }}>2</span>
                    <span className="text-sm text-red-400/60 ml-1">URGENT</span>
                  </div>
                  <span className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground/50">ALERTES ACTIVES</span>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-white/10 flex-shrink-0" />

                {/* Production */}
                <div className="flex flex-col">
                  <div className="flex items-baseline">
                    <span className="tbos-hero-stat-number text-2xl text-white" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontWeight: 200, textShadow: '0 0 15px rgba(255, 255, 255, 0.08)' }}>{prodVolume}</span>
                    <span className="text-sm text-white/40 ml-1">{plantData.production.volumeUnit}</span>
                  </div>
                  <span className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground/50">PRODUCTION DU JOUR</span>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-white/10 flex-shrink-0" />

                {/* Marge */}
                <div className="flex flex-col">
                  <div className="flex items-baseline">
                     <span className="tbos-hero-stat-number text-2xl" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontWeight: 200, color: '#D4A843', letterSpacing: '-0.02em' }}>{marge}<span className="text-sm" style={{ color: 'rgba(212,168,67,0.5)', margin: 0, padding: 0, letterSpacing: 0 }}>%</span></span>
                   </div>
                   <span className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground/50">MARGE BRUTE</span>
                </div>
              </div>

              {/* ── ROW 3: ACTION BAR ── */}
              <div className="border-t border-white/5 mt-4 pt-4">
                <div className="flex items-center justify-between">
                  {/* LEFT: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigate('/ventes')}
                      className="relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-black/20"
                      style={{ background: 'transparent', border: '1px solid #D4A843', color: '#D4A843' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <PlusCircle size={16} className="opacity-60" />
                      NOUVEAU DEVIS
                    </button>
                     <button
                       onClick={() => navigate('/clients')}
                       className="relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-black/20"
                      style={{ background: 'transparent', border: '1px solid #D4A843', color: '#D4A843' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <PhoneCall size={16} className="opacity-60" />
                      RELANCER CLIENTS
                      <span className="absolute flex items-center justify-center rounded-full z-10" style={{ top: -8, right: -8, minWidth: 20, height: 20, fontSize: 10, fontWeight: 700, background: '#EF4444', color: '#fff', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>2</span>
                    </button>
                     <button
                       onClick={() => triggerPrint()}
                       className="relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-black/20"
                      style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid #D4A843', color: '#D4A843' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.15)'; e.currentTarget.style.color = '#D4A843'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.08)'; e.currentTarget.style.color = '#D4A843'; }}
                    >
                      <FileText size={16} className="opacity-60" />
                      RAPPORT DU JOUR
                      <span className="absolute flex items-center justify-center rounded-md z-10" style={{ top: -8, right: -8, padding: '2px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', background: '#D4A843', color: '#000', boxShadow: '0 0 8px rgba(212,168,67,0.5)' }}>NEW</span>
                    </button>
                    <button
                      onClick={() => navigate('/production')}
                      className="relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] border border-[#D4A843]/60 text-[#D4A843] bg-[#D4A843]/10 hover:bg-[#D4A843]/20 transition-all duration-200 hover:-translate-y-px"
                    >
                      <BarChart3 size={16} className="opacity-60" />
                      LANCER PRODUCTION
                    </button>
                  </div>

                  {/* RIGHT: Prochaine Livraison */}
                  <div onClick={() => navigate('/logistique')} className="hidden md:flex flex-col flex-shrink-0 hover:border-[#D4A843]/30 hover:-translate-y-[1px] transition-all duration-200 cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '12px 16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.6), transparent)' }} />
                    <div className="flex items-center gap-2.5 px-4 py-3">
                    <Truck size={16} style={{ color: '#D4A843', flexShrink: 0 }} />
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
                        <>
                          <span className="text-[11px] text-muted-foreground/50">Prochaine: demain 08:00</span>
                          <span className="text-[11px] text-white/70">{plantData.nextDeliveryClient} · 45 {plantData.production.volumeUnit}</span>
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* (0) BRIEFING MATINAL — Full AI Intelligence Summary */}
          <div className="relative z-[1] mb-5" style={{ animation: 'ccSectionIn 300ms ease-out 80ms both' }}>
            <div style={{
              borderTop: '2px solid #D4A843',
              background: 'rgba(212, 168, 67, 0.03)',
              border: '1px solid rgba(212, 168, 67, 0.08)',
              borderRadius: 10,
              padding: 20,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#D4A843' }} />
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 13, letterSpacing: 2, color: '#D4A843', fontWeight: 400 }}>
                  ✦ BRIEFING MATINAL — {now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </span>
                <span className="tbos-ai-badge" style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 10, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', background: 'rgba(212,168,67,0.08)', transition: 'box-shadow 200ms ease' }}>
                  Généré par IA · Claude Opus
                </span>
              </div>
              {/* Body */}
              <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, margin: 0 }}>
                Production nominale prévue à <strong style={{ color: '#D4A843' }}>{uf.fmtVolume(demoData.production.volume, 0)}</strong>. Stock {demoData.shutdownRisk.material} à <strong style={{ color: '#D4A843' }}>{demoData.shutdownRisk.currentStock}</strong>. <strong style={{ color: '#D4A843' }}>{demoData.production.batches} batches</strong>. Pipeline commercial : <strong style={{ color: '#D4A843' }}>{uf.fmtCurrencyK(demoData.pipeline.value)}</strong>, {demoData.pipeline.devis} devis en attente. Point critique : {demoData.riskClient.name} — <strong style={{ color: '#EF4444' }}>{uf.fmtCurrencyK(demoData.riskClient.amount)} impayés</strong>, probabilité défaut <strong style={{ color: '#EF4444' }}>{demoData.riskClient.defaultProb}%</strong>, livraisons suspendues.
              </p>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setActiveTab('intelligence')} style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 6, background: '#D4A843', color: '#0F1629', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>
                  Voir Rapport Complet
                </button>
                <button onClick={() => navigate('/creances')} style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 6, background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer', letterSpacing: '0.05em' }}>
                  Relancer {demoData.riskClient.name}
                </button>
                <button onClick={() => navigate('/laboratoire')} style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 6, background: 'transparent', color: '#D4A843', border: '1px solid rgba(212,168,67,0.4)', cursor: 'pointer', letterSpacing: '0.05em' }}>
                  Planifier Test NM
                </button>
              </div>
            </div>
          </div>

          {/* (2) Alerte Fuite Détectée or All-Clear */}
          <div className="mb-4 relative z-[1] rounded-lg overflow-hidden" style={{
            animation: 'ccSectionIn 300ms ease-out 100ms both',
          }}>
            <LeakageAlertBanner />
          </div>

          {/* (2a) CROSS-PAGE ALERTS STRIP */}
          <div className="mb-4 relative z-[1]" style={{ animation: 'ccSectionIn 300ms ease-out 120ms both' }}>
            <div style={{
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
              fontSize: 11,
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(212,168,67,0.08)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}>
              <span style={{ color: '#F59E0B' }}>⚠</span>
              <span onClick={() => navigate('/creances')} style={{ color: '#EF4444', cursor: 'pointer', transition: 'color 200ms' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}>Créances: {uf.fmtCurrencyK(demoData.riskClient.amount)} retard ({demoData.riskClient.name})</span>
              <span style={{ color: 'rgba(212,168,67,0.3)' }}>·</span>
              <span onClick={() => navigate('/logistique')} style={{ color: '#F59E0B', cursor: 'pointer', transition: 'color 200ms' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#F59E0B'; (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}>Logistique: {demoData.trucks.find(t => t.status === 'maintenance')?.id || 'OK'} maintenance</span>
              <span style={{ color: 'rgba(212,168,67,0.3)' }}>·</span>
              <span onClick={() => navigate('/stocks')} style={{ color: '#F59E0B', cursor: 'pointer', transition: 'color 200ms' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#F59E0B'; (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}>Stocks: {demoData.shutdownRisk.material} {demoData.shutdownRisk.daysUntil}j</span>
              <span style={{ color: 'rgba(212,168,67,0.3)' }}>·</span>
              <span onClick={() => navigate('/laboratoire')} style={{ color: '#EF4444', cursor: 'pointer', transition: 'color 200ms' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4A843'; (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}>Lab: {demoData.norms.find(n => n.status === 'urgent')?.code || demoData.norms[0]?.code}</span>
            </div>
          </div>

          {/* (2b) PRÉDICTION ARRÊT USINE */}
          <div className="mb-4 relative z-[1] rounded-lg overflow-hidden" style={{ animation: 'ccSectionIn 300ms ease-out 150ms both' }}>
            <div className="tbos-shutdown-pulse" style={{
              background: 'rgba(245, 158, 11, 0.05)',
              borderLeft: '4px solid #F59E0B',
              borderRadius: 8,
              padding: '16px 20px',
              position: 'relative',
            }}>
              {/* Line 1: Alert headline */}
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 14, fontWeight: 600, color: '#F59E0B', marginBottom: 8 }}>
                ⚠ RISQUE ARRÊT DANS {demoData.shutdownRisk.daysUntil} JOURS
              </div>
              {/* Line 2: Detail */}
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 12, color: '#9CA3AF', marginBottom: 6, lineHeight: 1.6 }}>
                <SmartLabel term={demoData.shutdownRisk.material}>{demoData.shutdownRisk.material}</SmartLabel> insuffisant pour production prévue. Stock actuel: {demoData.shutdownRisk.currentStock}. Commandes confirmées: {demoData.shutdownRisk.needed}. Déficit: <span style={{ color: '#F59E0B', fontWeight: 600 }}>{demoData.shutdownRisk.deficit}</span>.
              </div>
              {/* Line 3: Cost */}
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 12, color: '#EF4444', marginBottom: 6 }}>
                <span style={{ color: '#EF4444' }}>Coût arrêt estimé: {uf.fmtCurrency(demoData.shutdownRisk.costPerDay)}/jour</span> <span style={{ color: '#9CA3AF' }}>(perte production + pénalités livraison + personnel inactif)</span>
              </div>
              {/* Line 4: Solution */}
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace", fontSize: 12, color: '#FFFFFF', marginBottom: 12 }}>
                Commande urgente {demoData.shutdownRisk.supplier}: {demoData.shutdownRisk.orderQty} · Délai: {demoData.shutdownRisk.orderDelay} · Coût: {uf.fmtCurrency(demoData.shutdownRisk.orderCost)}
              </div>
              {/* Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('/stocks')}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
                  style={{ background: '#D4A843', color: '#0F1629', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FDB913'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#D4A843'; }}
                >
                  Commander {demoData.shutdownRisk.material} Maintenant
                </button>
                <button
                  onClick={() => navigate('/stocks')}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-px"
                  style={{ background: 'transparent', border: '1px solid #D4A843', color: '#D4A843', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Voir Analyse Complète
                </button>
                {/* AI badge */}
                <span className="ml-auto tbos-ai-badge" style={{
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                  fontSize: 9, letterSpacing: '0.5px', color: '#D4A843',
                  background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)',
                  borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
                  transition: 'box-shadow 200ms ease',
                }}>
                  ✨ Généré par IA · Claude Opus
                </span>
              </div>
            </div>
          </div>

          {/* (3) 4 KPI Cards Row */}
          <div className="tbos-kpi-grid grid grid-cols-5 gap-4 mb-5 relative z-[1] items-stretch w-full" style={{ alignItems: 'stretch', animation: 'ccSectionIn 300ms ease-out 200ms both' }}>
          {[
            {
              label: 'VOLUME',
              value: prodVolume,
              unit: uf.volUnit,
              watermark: uf.volUnit,
              sub: 'Total du jour',
              trend: '↗ +12%',
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
              sparkline: '0,28 20,24 40,20 60,26 80,18 100,14 120,10',
              secondaryLabel: 'Obj. mensuel',
              secondaryValue: `${uf.fmtVolume(demoData.production.volume, 0)} / ${uf.fmtVolume(3200, 0)}`,
              target: uf.rawVolume(280),
              targetLabel: 'OBJ',
            },
            {
              label: 'REVENUE',
              value: ca,
              unit: uf.currKUnit,
              watermark: uf.currSym,
              sub: `${periodStats.nbFactures || 11} factures`,
              trend: '↗ +8.2%',
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
              sparkline: '0,26 20,22 40,28 60,20 80,16 100,12 120,8',
              secondaryLabel: 'Objectif',
              secondaryValue: `${uf.fmtCurrencyK(250000)} · 30%`,
            },
            {
              label: 'MARGE',
              value: marge,
              unit: '%',
              watermark: '%',
              sub: `${uf.fmtCurrencyK(demoData.profitNet.matieres)} coûts matières`,
              trend: '↗ +1.2%',
              healthyGlow: true,
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
              sparkline: '0,24 20,20 40,22 60,18 80,16 100,14 120,10',
              secondaryLabel: 'P&L',
              secondaryValue: `Net: ${uf.fmtCurrencyK(demoData.profitNet.total)}`,
              target: 32,
              targetLabel: 'OBJ',
            },
            {
              label: 'TRÉSORERIE',
              value: tresorerie,
              unit: uf.currKUnit,
              watermark: uf.currSym,
              sub: `→ ${uf.fmtCurrencyK(demoData.tresorerie.value * 0.9)} fin mois`,
              trend: '↗ +9.7%',
              healthyGlow: true,
              accentColor: '#FDB913',
              labelColor: 'rgba(253,185,19,0.6)',
              sparkline: '0,26 20,22 40,24 60,18 80,14 100,10 120,4',
              secondaryLabel: 'Net',
              secondaryValue: `+${uf.fmtCurrencyK(demoData.profitNet.total * 2)}`,
            },
          ].map((kpi, i) => {
            const kpiRoutes = ['/production', '/ventes', '/production', '/creances'];
            const numVal = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value));
            const hasTarget = 'target' in kpi && kpi.target !== undefined;
            const aboveTarget = hasTarget ? numVal >= (kpi.target as number) : false;
            const belowTarget = hasTarget ? numVal < (kpi.target as number) : false;
            return (
            <TiltCard
              key={i}
              onClick={() => navigate(kpiRoutes[i])}
              className="tbos-hero-card group cursor-pointer shimmer-effect h-full flex flex-col min-w-0 relative overflow-hidden hover:border-[#D4A843]/30 hover:-translate-y-[1px] transition-all duration-200 ease-out"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderTop: '2px solid #D4A843',
                animation: `ccSectionIn 300ms ease-out ${200 + i * 50}ms both`,
                ...(kpi.healthyGlow ? {
                  boxShadow: '0 0 20px rgba(34,197,94,0.06), inset 0 1px 0 rgba(34,197,94,0.08), 0 1px 3px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.15)',
                  borderRightColor: 'rgba(34,197,94,0.12)',
                  borderBottomColor: 'rgba(34,197,94,0.12)',
                  borderLeftColor: 'rgba(34,197,94,0.12)',
                } : {}),
              }}
            >
              <div className="scanline-overlay" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843]/60 to-transparent" />
              <div className="relative z-[1] flex flex-col flex-1" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '1 1 auto' }}>
                  <div className="mb-5" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgb(100,116,139)' }}>
                    {kpi.label}
                  </div>
                  <div className="flex items-baseline gap-2 leading-none">
                     <span className={`tbos-hero-stat-number text-3xl font-mono tracking-tight text-white ${flashClass}`} style={{
                       fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                       fontWeight: 200, lineHeight: 1,
                       textShadow: aboveTarget
                         ? '0 0 8px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.15)'
                         : belowTarget
                           ? '0 0 8px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.15)'
                           : '0 0 20px rgba(255, 255, 255, 0.06), 0 0 35px rgba(255,215,0,0.2), 0 0 70px rgba(255,215,0,0.07)',
                     }}>
                      {typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}
                    </span>
                    <span className="text-lg font-mono text-muted-foreground ml-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{kpi.unit}</span>
                    {aboveTarget && <span style={{ color: '#22C55E', fontSize: 14, fontWeight: 600, marginLeft: 2 }}>✓</span>}
                    {belowTarget && <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 600, marginLeft: 2 }}>↓</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-3 tabular-nums" style={{ fontFamily: "'Inter', system-ui", fontSize: '11px', fontWeight: 400 }}>{kpi.sub}</div>
                  {kpi.trend && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[11px] tabular-nums" style={{ fontFamily: "'Inter', system-ui", fontWeight: 400, color: 'rgba(52,211,153,0.7)', textShadow: '0 0 8px rgba(34, 197, 94, 0.2)' }}>{kpi.trend}</span>
                      <span className="text-[11px] text-muted-foreground/40 ml-1">vs hier</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  {/* P&L breakdown removed — dedicated P&L card handles this */}
                  <div className="flex items-end justify-between pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <svg width="130" height="44" viewBox="0 0 130 44" className="min-w-[130px] min-h-[44px]" style={{ filter: 'drop-shadow(0 0 4px rgba(212, 168, 67, 0.2))' }}>
                      {(() => {
                        // Parse original points and rescale to fill 130x44
                        const rawPts = kpi.sparkline.split(' ').map(p => { const [x, y] = p.split(',').map(Number); return { x, y }; });
                        const maxX = Math.max(...rawPts.map(p => p.x));
                        const maxY = Math.max(...rawPts.map(p => p.y));
                        const minY = Math.min(...rawPts.map(p => p.y));
                        const pad = 4;
                        const scaled = rawPts.map(p => ({
                          x: (p.x / (maxX || 1)) * (130 - pad * 2) + pad,
                          y: pad + ((p.y - minY) / ((maxY - minY) || 1)) * (44 - pad * 2),
                        }));
                        const polyStr = scaled.map(p => `${p.x},${p.y}`).join(' ');
                        const last = scaled[scaled.length - 1];
                        // Target line position
                        const targetY = hasTarget ? (() => {
                          const tgt = kpi.target as number;
                          const tgtNorm = Math.max(0, Math.min(1, (tgt - minY) / ((maxY - minY) || 1)));
                          return pad + tgtNorm * (44 - pad * 2);
                        })() : null;
                        return (
                          <>
                            {targetY !== null && (
                              <>
                                <line x1={pad} y1={targetY} x2={130 - pad} y2={targetY} stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 3" />
                                <text x={130 - pad} y={targetY - 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="ui-monospace, monospace">{(kpi as any).targetLabel || 'OBJ'}</text>
                              </>
                            )}
                            <polyline className="tbos-sparkline-draw" fill="none" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={polyStr} style={{ opacity: 0.7, '--dash-total': '500' } as React.CSSProperties} />
                            {last && <circle cx={last.x} cy={last.y} r="2.5" fill="#D4A843" style={{ opacity: 0.9 }} />}
                          </>
                        );
                      })()}
                    </svg>
                    <div className="text-right flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.4)' }}>{kpi.secondaryLabel}</span>
                      <span className="text-xs font-mono" style={{ color: 'rgba(203,213,225,0.6)' }}>{kpi.secondaryValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          ); })}

          {/* 5th card: LIVE P&L */}
          {(() => {
            const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
            const waterfall = [
              { label: 'Revenu', amount: uf.rawCurrency(demoData.profitNet.revenu), color: '#D4A843', pct: 100 },
              { label: 'Matières', amount: -uf.rawCurrency(demoData.profitNet.matieres), color: '#EF4444', pct: Math.round(demoData.profitNet.matieres / demoData.profitNet.revenu * 100) },
              { label: 'Logistique', amount: -uf.rawCurrency(demoData.profitNet.logistique), color: '#EF4444', pct: Math.round(demoData.profitNet.logistique / demoData.profitNet.revenu * 100) },
              { label: 'Personnel', amount: -uf.rawCurrency(demoData.profitNet.personnel), color: '#EF4444', pct: Math.round(demoData.profitNet.personnel / demoData.profitNet.revenu * 100) },
              { label: 'Net', amount: uf.rawCurrency(demoData.profitNet.total), color: '#22C55E', pct: Math.round(demoData.profitNet.marge) },
            ];
            const plSparkline = '0,38 15,34 30,30 45,28 60,22 75,18 90,14 105,10 120,8';
            return (
              <TiltCard
                onClick={() => navigate('/creances')}
                className="tbos-hero-card group cursor-pointer shimmer-effect h-full flex flex-col min-w-0 relative overflow-hidden hover:border-[#D4A843]/30 hover:-translate-y-[1px] transition-all duration-200 ease-out"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '14px 16px 12px',
                  borderTop: '2px solid #D4A843',
                }}
              >
                <div className="flex flex-col h-full justify-between gap-2">
                  {/* Label + LIVE badge */}
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '1.5px', color: '#9CA3AF', fontWeight: 600 }}>
                      PROFIT NET AUJOURD'HUI
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: '#22C55E', letterSpacing: '0.5px' }}>LIVE</span>
                    </span>
                  </div>

                  {/* Large value */}
                  <div className="flex items-baseline gap-1.5">
                    <span style={{
                      fontFamily: MONO, fontWeight: 100, fontSize: 36, color: '#22C55E',
                      lineHeight: 1, letterSpacing: '-0.02em',
                      textShadow: '0 0 20px rgba(34,197,94,0.15)',
                    }}>
                      {uf.rawCurrency(demoData.profitNet.total).toLocaleString('fr-FR')}
                    </span>
                    <span style={{ fontFamily: MONO, fontWeight: 300, fontSize: 18, color: '#9CA3AF' }}>{uf.currSym}</span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: '#22C55E', fontWeight: 600 }}>↗ +8% vs hier</span>

                  {/* Mini waterfall */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                    {waterfall.map((row) => (
                      <div key={row.label} className="flex items-center gap-2" style={{ height: 7 }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: '#9CA3AF', width: 52, textAlign: 'right', flexShrink: 0 }}>
                          {row.label}
                        </span>
                        <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${row.pct}%`,
                            height: '100%',
                            background: row.color,
                            borderRadius: 2,
                            opacity: 0.7,
                            ...(row.amount < 0 ? { marginLeft: 'auto' } : {}),
                          }} />
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: row.color, width: 55, textAlign: 'right', flexShrink: 0 }}>
                          {row.amount > 0 ? '' : '−'}{Math.abs(row.amount).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom: Marge + sparkline */}
                  <div className="flex items-end justify-between mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: '#D4A843', fontWeight: 600 }}>Marge: 32%</span>
                    <svg width="80" height="24" viewBox="0 0 120 40" preserveAspectRatio="none" style={{ opacity: 0.6 }}>
                      <polyline fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={plSparkline} />
                    </svg>
                  </div>
                </div>
              </TiltCard>
            );
          })()}
          </div>

          {/* (3b) CALENDRIER OPÉRATIONNEL — reference material, below KPIs */}
          <div className="relative z-[1] mb-5" style={{ animation: 'ccSectionIn 300ms ease-out 400ms both' }}>
            <MultiMarketCalendar />
          </div>

          {/* (4) Intelligence IA section */}
          <div className="relative z-[1] mb-2" style={{ animation: 'ccSectionIn 300ms ease-out 450ms both' }}>
            <IntelligenceBriefingCard />
          </div>

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
              <WorldClassDashboard stockOnly />
            </Suspense>
          </div>
          </div>
          )}

          {/* ═══ PRODUCTION LIVE TAB CONTENT ═══ */}
          {activeTab === 'production' && (
          <div key="tab-production" className="tbos-mobile-card-stack" style={{ animation: 'tabFadeIn 200ms ease-in-out' }}>
          {/* Production Stats Bar */}
          <div className="tbos-prod-stats-bar flex items-center gap-8 px-6 py-4 w-full mb-6" style={{ background: 'linear-gradient(to right, rgba(212,168,67,0.04), transparent)', borderRadius: '8px', border: '1px solid rgba(212,168,67,0.08)' }}>
            {/* Taux de Réussite */}
            <div className="flex flex-col items-center justify-center flex-shrink-0 w-[90px]">
              <span className="tbos-hero-stat-number text-3xl font-bold tracking-tight text-[#D4A843]" style={{ textShadow: '0 0 20px rgba(212, 168, 67, 0.15)' }}>94<span className="text-lg font-normal text-[#D4A843]/50">%</span></span>
              <div style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.8), transparent)', height: '2px', width: '48px', margin: '4px auto 0' }} />
              <div className="w-[80px] h-[3px] bg-white/10 rounded-full mt-1.5">
                <div className="h-full rounded-full bg-gradient-to-r from-[#D4A843]/80 to-[#D4A843]" style={{ width: '94%' }} />
              </div>
              <span style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }} className="mt-1.5">TAUX DE RÉUSSITE</span>
              <span style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(255,255,255,0.35)' }}>7 derniers jours</span>
            </div>
            <div className="tbos-prod-stats-bar" style={{ background: 'linear-gradient(to right, rgba(212,168,67,0.05), transparent)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: '8px', padding: '12px 24px', display: 'flex', gap: '0', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent, rgba(212,168,67,0.7),transparent)', zIndex:99 }} />
              <div className="flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '24px', marginRight: '24px' }}>
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>Batches Aujourd'hui</span>
                <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: 18, fontWeight: 300, color: 'white', lineHeight: 1.2 }}>14</span>
              </div>
              <div className="flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '24px', marginRight: '24px' }}>
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>Cadence</span>
                <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", lineHeight: 1.2 }}><span className="text-2xl font-light text-white">{+(uf.rawVolume(47)).toFixed(0)}</span> <span className="text-sm text-white/50 font-normal">{uf.volUnit}/h</span></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>Efficacité</span>
                <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", lineHeight: 1.2 }}><span className="text-2xl font-light text-white">94</span><span className="text-sm text-white/50 font-normal">%</span></span>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes tauxGaugeArc {
              from { stroke-dashoffset: ${0.94 * 2 * Math.PI * 24}; }
              to { stroke-dashoffset: 0; }
            }
          `}</style>

          <div
            className="mb-5 relative z-[1] overflow-hidden bg-gradient-to-br from-[#1a1f2e] to-[#141824] p-5"
            style={{ border: '1px solid rgba(212,168,67,0.12)', borderRadius: '16px', boxShadow: '0 0 40px rgba(212,168,67,0.03), inset 0 1px 0 rgba(255,255,255,0.04)' }}
          >
            <div className="relative flex items-center gap-3 px-5 pt-4 pb-1 z-10">
              <Radio size={14} className="text-[#D4A843] animate-pulse" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 mr-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />LIVE</span>
              <span className="text-[#D4A843] text-[11px] font-medium uppercase tracking-wider whitespace-nowrap">Live Production du Jour</span>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,168,67,0.4), transparent)', margin: '0 16px', minWidth: '100px' }} />
              <div className="flex items-center gap-1.5" style={{ boxShadow: '0 0 12px rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', padding: '2px 8px' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse" />
                </span>
                <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-semibold">En service</span>
              </div>
            </div>

            {/* ── Production Chart ── */}
            <div className="flex gap-3 px-5 pb-4 pt-3 z-10 relative" style={{ minHeight: 320, alignItems: 'stretch' }}>
              {/* Chart panel */}
              <div className="flex-[4] min-w-0 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] rounded-xl p-5 relative overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.7), transparent)', zIndex: 50 }} />
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <div className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground/40 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Production ({uf.volUnit}/h) vs Target
                    </div>
                    {/* Target legend */}
                      <div className="flex items-center mt-1">
                        <div className="w-3 h-px border-t border-dashed inline-block mr-1.5" style={{ borderColor: 'rgba(255,255,255,0.35)' }} />
                        <span className="font-medium" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Target</span>
                      </div>
                  </div>
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '4px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 0 12px rgba(212,168,67,0.25)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-emerald-400/70 font-medium">TEMPS RÉEL</span>
                  </div>
                </div>
                <div className="relative">
                  <svg
                    width="100%" height="220" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none"
                    className="cursor-crosshair"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(212, 168, 67, 0.3))' }}
                  >
                    <defs>
                      <linearGradient id="prodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(212,168,67,0.12)" />
                        <stop offset="100%" stopColor="rgba(212,168,67,0)" />
                      </linearGradient>
                    </defs>
                    {/* Subtle horizontal grid lines (item 4) */}
                    {[20, 40, 60, 80, 100].map(val => {
                      const gy = svgH - (val / allMax) * svgH * 0.85 - 5;
                      return <line key={val} x1="0" y1={gy} x2={svgW} y2={gy} stroke="rgba(212,168,67,0.04)" strokeWidth="0.5" />;
                    })}
                    {/* Area fill under production line (item 3) */}
                    <polygon
                      fill="url(#prodAreaGrad)"
                      points={SPARKLINE_DATA.map((d, i) => {
                        const x = (i / (SPARKLINE_DATA.length - 1)) * svgW;
                        const y = svgH - (d.v / allMax) * svgH * 0.85 - 5;
                        return `${x},${y}`;
                      }).join(' ') + ` ${svgW},${svgH} 0,${svgH}`}
                    />
                    {/* Target line */}
                    <polyline
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                      strokeDasharray="4,3"
                      points={TARGET_DATA.map((d, i) => {
                        const x = (i / (TARGET_DATA.length - 1)) * svgW;
                        const y = svgH - (d.t / allMax) * svgH * 0.85 - 5;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Main line */}
                    <polyline
                      fill="none"
                      stroke="#D4A843"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={SPARKLINE_DATA.map((d, i) => {
                        const x = (i / (SPARKLINE_DATA.length - 1)) * svgW;
                        const y = svgH - (d.v / allMax) * svgH * 0.85 - 5;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    {/* Live pulse dot at rightmost data point (item 1) */}
                    {(() => {
                      const li = SPARKLINE_DATA.length - 1;
                      const lx = (li / (SPARKLINE_DATA.length - 1)) * svgW;
                      const ly = svgH - (SPARKLINE_DATA[li].v / allMax) * svgH * 0.85 - 5;
                      return (
                        <foreignObject x={lx - 5} y={ly - 5} width="10" height="10">
                          <div className="live-pulse-dot" />
                        </foreignObject>
                      );
                    })()}
                    {/* Now line — gold dashed (item 6) */}
                    <line x1={(NOW_INDEX / (SPARKLINE_DATA.length - 1)) * svgW} y1="0" x2={(NOW_INDEX / (SPARKLINE_DATA.length - 1)) * svgW} y2={svgH} stroke="#D4A843" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                    {/* MAINTENANT label at top of now line */}
                    <text
                      x={(NOW_INDEX / (SPARKLINE_DATA.length - 1)) * svgW}
                      y="4"
                      textAnchor="middle"
                      fill="#D4A843"
                      fontSize="3"
                      fontFamily="ui-monospace, 'JetBrains Mono', monospace"
                      fontWeight="500"
                      letterSpacing="0.3"
                      opacity="0.6"
                    >
                      MAINTENANT
                    </text>
                    {/* Current value callout + performance badge at now intersection */}
                    {(() => {
                      const nx = (NOW_INDEX / (SPARKLINE_DATA.length - 1)) * svgW;
                      const ny = svgH - (SPARKLINE_DATA[NOW_INDEX].v / allMax) * svgH * 0.85 - 5;
                      const targetVal = TARGET_DATA[NOW_INDEX]?.t || 0;
                      const actualVal = SPARKLINE_DATA[NOW_INDEX].v;
                      const diffPct = targetVal > 0 ? Math.round(((actualVal - targetVal) / targetVal) * 100) : 0;
                      const isAbove = diffPct >= 0;
                      return (
                        <g>
                          <rect x={nx - 11} y={ny - 10} width="22" height="7" rx="1.5" fill="#0f1729" stroke="rgba(212,168,67,0.4)" strokeWidth="0.4" />
                          <text x={nx} y={ny - 5} textAnchor="middle" fill="#D4A843" fontSize="3.5" fontFamily="ui-monospace, 'JetBrains Mono', monospace" fontWeight="600">
                            {+(uf.rawVolume(actualVal)).toFixed(0)} {uf.volUnit}/h
                          </text>
                          <rect x={nx + 12} y={ny - 10} width="16" height="7" rx="3.5" fill={isAbove ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'} />
                          <text x={nx + 20} y={ny - 5} textAnchor="middle" fill={isAbove ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)'} fontSize="3" fontFamily="ui-monospace, 'JetBrains Mono', monospace" fontWeight="600">
                            {isAbove ? '▲' : '▼'} {isAbove ? '+' : ''}{diffPct}%
                          </text>
                        </g>
                      );
                    })()}
                    {/* X-axis time labels */}
                    {['7h', '9h', '11h', '13h', '15h', '17h'].map(label => {
                      const padded = label.replace(/^(\d)h/, '0$1h');
                      const idx = SPARKLINE_DATA.findIndex(d => d.h === padded);
                      if (idx === -1) return null;
                      const x = (idx / (SPARKLINE_DATA.length - 1)) * svgW;
                      return (
                        <text key={label} x={x} y={svgH - 0.5} textAnchor="middle" fill="#8899aa" fontSize="5.5" fontFamily="ui-monospace, 'JetBrains Mono', monospace" fontWeight="500">
                          {label}
                        </text>
                      );
                    })}
                    {/* Hover — crosshair vertical dashed line (item 2) */}
                    {hoveredPoint && (
                      <line x1={hoveredPoint.x} y1="0" x2={hoveredPoint.x} y2={svgH} stroke="#D4A843" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
                    )}
                    <rect x="0" y="0" width={svgW} height={svgH} fill="transparent" />
                  </svg>
                </div>
                  {/* Hover tooltip (item 2 — enhanced) */}
                  {hoveredPoint && chartMousePos && (
                    <div
                      className="absolute pointer-events-none z-20 font-mono text-[11px] text-white shadow-lg"
                      style={{
                        left: chartMousePos.x + 12,
                        top: chartMousePos.y - 50,
                        background: '#1A1F2E',
                        border: '1px solid rgba(212,168,67,0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                    >
                      <div className="font-semibold" style={{ color: '#D4A843', fontFamily: 'ui-monospace, monospace' }}>{hoveredPoint.h}</div>
                      <div className="text-white text-[12px]">{+(uf.rawVolume(hoveredPoint.v)).toFixed(0)} {uf.volUnit}/h</div>
                      <div className="text-[10px]" style={{ color: hoveredPoint.diffPct >= 0 ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)' }}>
                        {hoveredPoint.diffPct >= 0 ? '▲' : '▼'} {hoveredPoint.diffPct >= 0 ? '+' : ''}{hoveredPoint.diffPct}% vs target
                      </div>
                    </div>
                  )}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0f1a]/80 to-transparent pointer-events-none" />
                {/* Chart summary strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(212,168,67,0.1)', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PIC</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#D4A843' }}>{uf.fmtVolumeRate(98)} · 15h</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moyenne</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: 'white' }}>{uf.fmtVolumeRate(72)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Écart moy.</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#22C55E' }}>+3.2%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hier</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#9CA3AF' }}>{uf.fmtVolume(645)}</div>
                  </div>
                </div>
              </div>

              {/* Performance / Camera panel */}
              <div className="flex-[3.5] border-l border-white/[0.04] pl-3 ml-2 min-w-0 flex flex-col">
                <div className="flex-1 rounded-lg p-4 flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15,20,35,0.95) 0%, rgba(10,15,25,0.98) 100%)', border: '1px solid rgba(255,255,255,0.04)', borderTop: '2px solid #D4A843', minHeight: '200px' }}>
                  <div style={{ position: 'absolute', top: 2, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.7), transparent)', zIndex: 50 }} />
                  {/* Header with toggle */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground/40 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {midPanelView === 'data' ? 'Performance du jour' : <><SmartLabel term="Centrale à béton">Caméra Centrale</SmartLabel></>}
                    </div>
                    <div className="flex items-center gap-2">
                      {midPanelView === 'data' && (
                        <span className="text-[9px] text-emerald-400 font-medium" style={{ boxShadow: '0 0 10px rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', padding: '2px 8px' }}>
                          EN AVANCE
                        </span>
                      )}
                      {/* Segmented toggle */}
                      <div className="flex items-center bg-white/[0.04] rounded-full p-0.5">
                        <button
                          onClick={() => setMidPanelView('data')}
                          className={`flex items-center justify-center rounded-full transition-all duration-200 ${midPanelView === 'data' ? 'bg-white/[0.08] text-white' : 'text-muted-foreground/40 hover:text-muted-foreground/60'}`}
                          style={{ minWidth: 44, minHeight: 44, padding: '8px' }}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setMidPanelView('camera')}
                          className={`flex items-center justify-center rounded-full transition-all duration-200 ${midPanelView === 'camera' ? 'bg-white/[0.08] text-white' : 'text-muted-foreground/40 hover:text-muted-foreground/60'}`}
                          style={{ minWidth: 44, minHeight: 44, padding: '8px' }}
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content with fade transition */}
                  <div className="flex-1 flex flex-col" style={{ transition: 'opacity 150ms ease', opacity: 1 }}>
                    {midPanelView === 'data' ? (
                      <>
                        {/* KPI Grid: 2x2, each card expands independently */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: '12px', marginTop: '12px', alignItems: 'start' }}>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-3 relative overflow-hidden cursor-pointer" style={{ minHeight: '140px' }} onClick={() => setExpandedKpi(expandedKpi === 'produit' ? null : 'produit')}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.6), transparent)' }} />
                            <div className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/30 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Produit</div>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 200, fontSize: '38px', color: 'white', lineHeight: 1.1 }}>{+(uf.rawVolume(kpiProduit)).toFixed(0)} <span className="text-sm text-muted-foreground/40">{uf.volUnit}</span></div>
                            <div className="text-[10px] text-muted-foreground/40 mb-1.5">sur {uf.fmtVolume(800)} objectif</div>
                            <div className="h-[4px] rounded-full bg-white/[0.06] w-full">
                              <div className="h-full rounded-full" style={{ width: '84%', background: 'linear-gradient(90deg, #D4A843, #E8C96A)', boxShadow: '0 0 8px rgba(212, 168, 67, 0.25)', animation: 'progressGrow 1.2s ease forwards' }} />
                            </div>
                            <div style={{ maxHeight: expandedKpi === 'produit' ? '120px' : '0', overflow: 'hidden', transition: 'max-height 300ms ease' }}>
                              <div style={{ fontSize: '12px', color: '#9CA3AF', padding: '8px 12px', borderTop: '1px solid rgba(212,168,67,0.1)' }}>
                                Objectif: {uf.fmtVolume(800)} · Réalisé: {uf.fmtVolume(671)} · Écart: -{uf.fmtVolume(129)} · Tendance: ↗ rattrapage 15h
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-3 relative overflow-hidden cursor-pointer" style={{ minHeight: '140px' }} onClick={() => setExpandedKpi(expandedKpi === 'rendement' ? null : 'rendement')}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.6), transparent)' }} />
                            <div className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/30 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Rendement</div>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 200, fontSize: '38px', color: '#D4A843', lineHeight: 1.1 }}>{kpiRendement}%</div>
                            <div className="text-[10px] text-muted-foreground/40"><span className="text-emerald-400">↗</span> vs 91% hier</div>
                            <div style={{ maxHeight: expandedKpi === 'rendement' ? '120px' : '0', overflow: 'hidden', transition: 'max-height 300ms ease' }}>
                              <div style={{ fontSize: '12px', color: '#9CA3AF', padding: '8px 12px', borderTop: '1px solid rgba(212,168,67,0.1)' }}>
                                Hier: 91% · Moyenne 7j: 93.2% · Meilleur batch: #403-065 (98.1%)
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-3 relative overflow-hidden cursor-pointer" style={{ minHeight: '140px' }} onClick={() => setExpandedKpi(expandedKpi === 'qualite' ? null : 'qualite')}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.6), transparent)' }} />
                            <div className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/30 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Qualité</div>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 200, fontSize: '38px', color: 'white', lineHeight: 1.1 }}>{kpiQualite}%</div>
                            <div className="flex gap-1 mt-1">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-medium">2 OK</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium animate-pulse">1 VAR</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-medium">0 CRIT</span>
                            </div>
                            <div style={{ maxHeight: expandedKpi === 'qualite' ? '120px' : '0', overflow: 'hidden', transition: 'max-height 300ms ease' }}>
                              <div style={{ fontSize: '12px', color: '#9CA3AF', padding: '8px 12px', borderTop: '1px solid rgba(212,168,67,0.1)' }}>
                                12 tests · 2 OK · 1 VAR (F-B30 slump +8mm) · 0 CRIT · Prochain test: 14h30
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-3 relative overflow-hidden cursor-pointer" style={{ minHeight: '140px' }} onClick={() => setExpandedKpi(expandedKpi === 'livraisons' ? null : 'livraisons')}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.6), transparent)' }} />
                            <div className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/30 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Livraisons</div>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 200, fontSize: '38px', color: '#D4A843', lineHeight: 1.1 }}>{kpiLivA}/{kpiLivB}</div>
                            <div className="text-xs text-white/60 mt-1">4 restantes aujourd'hui</div>
                            <div style={{ maxHeight: expandedKpi === 'livraisons' ? '120px' : '0', overflow: 'hidden', transition: 'max-height 300ms ease' }}>
                              <div style={{ fontSize: '12px', color: '#9CA3AF', padding: '8px 12px', borderTop: '1px solid rgba(212,168,67,0.1)' }}>
                                8 livrées · 4 restantes · Prochaine: BL-2603-009 Ciments du Sud 14h30
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Bottom next delivery (item 13 — clock pulse) */}
                        <div style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.25)', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <span className="text-[#D4A843]" style={{ animation: 'clockPulse 2s infinite', display: 'inline-block' }}>⏱</span>
                          <span className="text-[10px] text-muted-foreground/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            Prochain: BL-2603-009 · Ciments du Sud · 14h30
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 relative overflow-hidden rounded-lg mt-2 cursor-pointer" onClick={() => window.location.href = '/surveillance'} style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.03)' }}>
                        {/* Scan lines (item 14) */}
                        {[0, 1, 2].map(i => (
                          <div key={i} className="absolute left-0 right-0 z-[1]" style={{ height: '1px', background: 'rgba(212,168,67,0.15)', animation: `cameraScanLine 4s linear infinite`, animationDelay: `${i * 1.3}s` }} />
                        ))}
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
                          <span className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#D4A843', textShadow: '0 0 8px rgba(212,168,67,0.3)' }}>Recherche du signal...</span>
                          <span className="text-[10px] tracking-[0.08em] uppercase font-medium" style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", color: '#D4A843' }}>Dernière capture: il y a 4h</span>
                        </div>
                        {/* Ticking timestamp (item 15) */}
                        <div className="absolute bottom-10 right-3 z-[4]" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#D4A843', opacity: 0.7 }}>{cameraTime}</div>
                        <div className="absolute bottom-0 left-0 right-0 z-[3] p-2.5" style={{ background: 'rgba(212,168,67,0.04)', borderTop: '1px solid rgba(212,168,67,0.15)' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-white/80 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{uf.fmtVolumeRate(47)}</span>
                              <span className="w-px h-3 bg-white/10" />
                              <span className="text-[10px] text-emerald-400/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>94%</span>
                            </div>
                            <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeStr}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Batch queue panel */}
              <div className="flex-[3] border-l border-white/[0.04] pl-3 ml-2 min-w-0 flex flex-col relative overflow-hidden">
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.7), transparent)', zIndex: 50 }} />
                <div className="mb-3">
                  <div className="uppercase mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(212,168,67,0.7)', letterSpacing: '2px', fontSize: '11px', fontWeight: 500 }}>File de Production</div>
                  <div className="mb-2 p-2 rounded-lg" style={{ background: 'rgba(212,168,67,0.06)', boxShadow: '0 0 16px rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.25)', borderLeft: '3px solid #D4A843', animation: 'batchBreathing 3s infinite' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#403-068</span>
                      <button onClick={() => tbosToast('Déchargement initié pour batch #403-068')} style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}>Déchargement</button>
                    </div>
                    <div className="text-[8px] text-slate-400 mb-1.5">{plantData.formules[1] || uf.grade('F-B25')} · {uf.fmtVolume(8)} · {plantData.clients[2] || 'BTP Maroc'}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-1.5 rounded-full relative overflow-hidden" style={{ width: '72%', background: 'linear-gradient(90deg, #D4A843, #E8C96A)', animation: 'progressGrow 1s ease forwards' }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                      </div>
                      <span className="text-[9px] text-white font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>72%</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 animate-pulse">
                      <span className="text-[9px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#D4A843', textShadow: '0 0 8px rgba(212,168,67,0.4)', fontWeight: '500' }}>⏱ 01:47</span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { id: '#403-069', formula: `${plantData.formules[2] || uf.grade('F-B30')} · ${uf.fmtVolume(12)}`, client: plantData.clients[0] || 'Atlas BTP' },
                      { id: '#403-070', formula: `${plantData.formules[1] || uf.grade('F-B25')} · ${uf.fmtVolume(8)}`, client: plantData.clients[1] || 'Const. Modernes' },
                    ].map((batch, idx) => (
                      <div key={batch.id} className="flex items-center gap-1.5 rounded px-2 py-1 -mx-2" style={{ cursor: 'pointer', transition: 'all 0.2s', animation: `batchSlideIn 400ms ease forwards`, animationDelay: `${(idx + 1) * 100}ms`, opacity: 0 }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                        <span className="w-1 h-1 bg-slate-600 rounded-full" />
                        <div className="min-w-0">
                          <div className="text-[8px] text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{batch.id}</div>
                          <div className="text-[7px] text-slate-600 truncate">{batch.formula} · {batch.client}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Metrics (item 23) */}
                <div className="mt-auto grid grid-cols-2 gap-2">
                  {[
                    { label: 'Disponibilité', value: '97%' },
                    { label: 'Cadence', value: uf.fmtVolumeRate(47) },
                    { label: 'Batches', value: '23' },
                    { label: 'Attente', value: '12 min' },
                  ].map((m) => (
                    <div key={m.label} className="p-1.5 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-[10px] uppercase tracking-wider text-white/40 block mb-0.5">{m.label}</div>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 200, color: '#D4A843' }}>{m.label === 'Cadence' ? <>{m.value.split(' ')[0]} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{uf.volUnit}/h</span></> : m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Environmental Monitoring Strip */}
            <div className="flex items-center justify-center gap-6 px-6 py-3 mx-6 my-4 backdrop-blur-sm" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(90deg, rgba(212,168,67,0.03), transparent, rgba(212,168,67,0.03))', borderTop: '1px solid rgba(212,168,67,0.3)', borderBottom: '1px solid rgba(212,168,67,0.3)', borderLeft: '1px solid rgba(212,168,67,0.08)', borderRight: '1px solid rgba(212,168,67,0.08)', borderRadius: '8px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.7), transparent)', zIndex: 50 }} />
              {/* Live indicator */}
              <div className="flex items-center gap-1.5 pr-4 mr-4 border-r border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider text-green-400/70">EN DIRECT</span>
              </div>
              {/* Pression */}
              <div className="flex flex-col items-center gap-0.5 px-3 py-2 -mx-3 -my-2 rounded-lg cursor-default transition-all duration-200 hover:bg-white/[0.03]">
                <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/40 font-medium">Pression</span>
                <span className="text-sm text-white font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>1,013 <span className="text-[10px] text-white/40">hPa</span></span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843' }}>Normal</span>
              </div>

              <div className="w-px h-6 bg-white/[0.06]" />

              {/* Vent */}
              <div className="flex flex-col items-center gap-0.5 px-3 py-2 -mx-3 -my-2 rounded-lg cursor-default transition-all duration-200 hover:bg-white/[0.03]">
                <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/40 font-medium">Vent</span>
                <span className="text-sm text-white font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{uf.fmtDistance(12).split(' ')[0]} <span className="text-[10px] text-white/40">{uf.distUnit}/h</span></span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843' }}>Calme</span>
              </div>

              <div className="w-px h-6 bg-white/[0.06]" />

              {/* Température */}
              <div className="flex flex-col items-center gap-0.5 px-3 py-2 -mx-3 -my-2 rounded-lg cursor-default transition-all duration-200 hover:bg-white/[0.03]">
                <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/40 font-medium">Température</span>
                <span className="text-sm text-white font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{uf.fmtTemp(22)}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843' }}>Optimal</span>
              </div>

              <div className="w-px h-6 bg-white/[0.06]" />

              {/* Humidité */}
              <div className="flex flex-col items-center gap-0.5 px-3 py-2 -mx-3 -my-2 rounded-lg cursor-default transition-all duration-200 hover:bg-white/[0.03]">
                <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/40 font-medium">Humidité</span>
                <span className="text-sm text-white font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>45%</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843' }}>Optimal</span>
              </div>

              <div className="w-px h-6 bg-white/[0.06]" />

              {/* Prochain camion */}
              <div className="flex flex-col items-center gap-0.5 px-3 py-2 -mx-3 -my-2 rounded-lg cursor-default transition-all duration-200 hover:bg-white/[0.03] min-w-0 max-w-full overflow-hidden">
                <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/40 font-medium whitespace-nowrap">Prochain camion</span>
                <span className="text-sm font-semibold" style={{ color: '#D4A843', fontFamily: "'SF Mono', ui-monospace, monospace", fontWeight: 500 }}>32 min</span>
                <span className="text-xs text-muted-foreground/50 truncate max-w-full">→ {plantData.clients[1] || 'Constructions Modernes'} · {uf.fmtVolume(20)}</span>
              </div>
            </div>
          </div>

          {/* Additional Production Widgets */}
          <div className="grid grid-cols-3 gap-4 mt-5 relative z-[1] items-stretch">
            <div className="min-w-0 h-full">
              <Suspense fallback={<div className="h-48 rounded-lg bg-white/[0.02] animate-pulse" />}>
                <LiveBatchProgress />
              </Suspense>
            </div>
            <div className="min-w-0 h-full rounded-lg p-5 relative overflow-hidden hover:border-[#D4A843]/30 hover:-translate-y-[1px] transition-all duration-200 ease-out cursor-pointer" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843]/60 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-1.5 w-1.5"><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
                <span className="text-[14px] font-medium text-white/90">Derniers Batches</span>
              </div>
              {/* Header row */}
              <div className="flex items-center justify-between px-2 border-b border-white/5 pb-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium w-[70px]">Batch</span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium flex-1 text-center">Formule</span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium w-[50px] text-center">Volume</span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium w-[45px] text-right">Heure</span>
              </div>
              {/* Dot legend */}
              <div className="flex gap-4 px-2 mb-2">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Terminé</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />En cours</span>
              </div>
              <div className="space-y-1">
                {[
                  { id: '#403-068', formula: plantData.formules[1] || uf.grade('F-B25'), vol: uf.fmtVolume(8), time: '15:42', status: 'ok' },
                  { id: '#403-067', formula: plantData.formules[2] || uf.grade('F-B30'), vol: uf.fmtVolume(12), time: '14:28', status: 'ok' },
                  { id: '#403-066', formula: plantData.formules[1] || uf.grade('F-B25'), vol: uf.fmtVolume(8), time: '13:15', status: 'warn' },
                  { id: '#403-065', formula: plantData.formules[3] || uf.grade('F-B35'), vol: uf.fmtVolume(10), time: '12:03', status: 'ok' },
                  { id: '#403-064', formula: plantData.formules[1] || uf.grade('F-B25'), vol: uf.fmtVolume(8), time: '11:21', status: 'ok' },
                ].map((b) => (
                  <div key={b.id} className={`flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-150 hover:bg-white/[0.03]`} style={b.status === 'warn' ? { borderLeft: '2px solid rgba(245,158,11,0.6)', paddingLeft: '8px', background: 'rgba(245,158,11,0.04)' } : undefined}>
                    <div className="flex items-center gap-2 w-[70px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'warn' ? 'bg-amber-400 animate-pulse' : ''}`} style={{ background: b.status === 'ok' ? '#34D399' : undefined }} />
                      <span className="text-[10px] font-mono text-slate-400">{b.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-1 text-center">{b.formula}</span>
                    <span className="text-[10px] text-slate-500 w-[50px] text-center">{b.vol}</span>
                    <span className="text-[9px] font-mono text-slate-600 w-[45px] text-right">{b.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 h-full rounded-lg p-5 relative overflow-hidden hover:border-[#D4A843]/30 hover:-translate-y-[1px] transition-all duration-200 ease-out cursor-pointer" style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843]/60 to-transparent" />
              <div className="text-[14px] font-medium text-white/90 mb-3">Contrôle Qualité</div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'BL-2602-070', test: 'Slump 18cm', ok: true, time: '20:41' },
                  { id: 'BL-2602-067', test: 'Slump 22cm', ok: false, time: '18:28' },
                  { id: 'BL-2602-073', test: 'Slump 17cm', ok: true, time: '19:13' },
                ].map((q, i) => (
                  <div key={i} onClick={() => navigate('/laboratoire')} className="group flex items-center justify-between gap-3 py-2 px-2 rounded-lg transition-all duration-150 hover:bg-white/[0.03] cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full inline-block mr-2 flex-shrink-0 ${q.ok ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
                      <span className="text-sm font-mono text-slate-400 tabular-nums">{q.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">{q.test}</span>
                      <style>{`@keyframes varPulse { 0%, 100% { box-shadow: 0 0 4px rgba(245, 158, 11, 0.3); } 50% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.6); } }`}</style>
                      <span
                        className={`text-xs font-bold font-mono tabular-nums inline-flex items-center justify-center rounded-md min-w-[48px] px-2 py-0.5 transition-transform duration-150 group-hover:scale-105 ${!q.ok ? 'animate-pulse' : ''}`}
                        style={{
                          background: q.ok ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                          border: `1px solid ${q.ok ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                          color: q.ok ? '#34D399' : 'rgba(251,191,36,0.8)',
                          boxShadow: q.ok ? '0 0 8px rgba(34,197,94,0.25)' : '0 0 8px rgba(245,158,11,0.25)',
                        }}
                      >
                        {q.ok ? 'OK' : 'VAR'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600 tabular-nums">{q.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Quality summary */}
              <div className="border-t border-white/5 pt-3 mt-3 flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-white/5 text-white/60">19cm MOY</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-green-500/10 text-green-400 border border-green-500/20">2 OK</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">1 VAR</span>
              </div>
            </div>
          </div>

          {/* Agent IA Production Banner */}
          <div className="mt-5 gap-3" style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.02) 100%)', border: '1px solid rgba(212,168,67,0.12)', borderLeft: '3px solid #D4A843', borderRadius: '8px', padding: '10px 20px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-[#D4A843] animate-pulse" style={{ fontSize: 14 }}>✦</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A843' }}>Agent IA: </span>
              <span className="text-xs" style={{ color: 'rgba(241,245,249,0.8)' }}>
                Prochain batch recommandé — <span style={{ fontWeight: '500', color: 'white' }}>Béton {plantData.formules[1] || 'B25'} Standard</span> <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span> <span className="font-mono">14 {plantData.production.volumeUnit}</span> <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span> <span style={{ color: '#D4A843', fontWeight: '500' }}>{plantData.clients[0] || 'TGCC'}</span> <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span> Optimisation séquence activée
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent', fontWeight: 600, borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '12px' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => {
                  setShowLancerToast(true);
                  setLancerToastVisible(true);
                  setTimeout(() => {
                    setLancerToastVisible(false);
                    setTimeout(() => setShowLancerToast(false), 300);
                  }, 3000);
                }}>
                Lancer
              </button>
              <button
                style={{ background: 'transparent', border: '1px solid #D4A843', color: '#D4A843', fontWeight: 400, borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '12px' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.1)'; e.currentTarget.style.borderColor = '#D4A843'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D4A843'; }}
              >
                Passer
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
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(212,168,67,0.4), transparent)', margin: '0 16px' }} />
          <span className="text-xs text-white/40 font-mono">12/03/2026</span>
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
        <div key="tab-intelligence" style={{ animation: 'tabFadeIn 200ms ease-in-out', background: 'transparent', border: 'none' }}>
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

        {/* ── CALENDRIER RÉGLEMENTAIRE & CONFORMITÉ ── */}
        {(() => {
          const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
          const markers = [
            { date: '01 Avr', month: 1, status: 'red' as const, title: 'NM 10.1.271 Expiration', sub: 'Essais affaissement — 0/2 tests effectués', detail: '⚠ PERTE DE CERTIFICATION = Interdiction de livrer aux marchés publics', action: 'Planifier Test' },
            { date: '15 Avr', month: 1.5, status: 'green' as const, title: 'NM 10.1.008 Valide', sub: 'Béton spécification — 2/3 tests complétés', detail: 'Prochain test planifié 20 mars', action: null },
            { date: '20 Jun', month: 3.5, status: 'green' as const, title: 'NM 10.1.005 Valide', sub: 'Ciment — 1/1 complété', detail: '118j restants ✓', action: null },
            { date: '10 Sep', month: 6, status: 'green' as const, title: 'ISO 9001:2015 Valide', sub: 'Audit prévu septembre', detail: '192j restants ✓', action: null },
          ];
          const months = ['Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep'];
          const totalSpan = 7; // months shown

          return (
            <div className="mt-6 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #D4A843' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <span style={{ color: '#D4A843', fontSize: 14, animation: 'pulse 3s ease-in-out infinite' }}>✦</span>
                  <span style={{ fontFamily: MN, fontSize: 12, fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.5px' }}>CALENDRIER RÉGLEMENTAIRE & CONFORMITÉ</span>
                </div>
                <span style={{ fontFamily: MN, fontSize: 9, color: '#D4A843', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 20, padding: '3px 10px' }}>
                  ✨ Généré par IA · Claude Opus
                </span>
              </div>

              {/* Timeline */}
              <div className="px-5 pb-3 overflow-x-auto">
                <div style={{ position: 'relative', minWidth: 700, height: 180 }}>
                  {/* Month labels */}
                  <div className="flex" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                    {months.map((m, i) => (
                      <div key={m} style={{ flex: 1, fontFamily: MN, fontSize: 10, color: i === 0 ? '#D4A843' : '#9CA3AF', fontWeight: 600, letterSpacing: '1px' }}>{m}</div>
                    ))}
                  </div>

                  {/* Timeline bar */}
                  <div style={{ position: 'absolute', top: 22, left: 0, right: 0, height: 3, background: 'rgba(212,168,67,0.15)', borderRadius: 2 }} />

                  {/* Markers */}
                  {markers.map((mk, idx) => {
                    const leftPct = (mk.month / totalSpan) * 100;
                    const isRed = mk.status === 'red';
                    return (
                      <div key={idx} style={{ position: 'absolute', top: 14, left: `${leftPct}%`, transform: 'translateX(-50%)', width: 160, zIndex: isRed ? 2 : 1 }}>
                        {/* Pin */}
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: isRed ? '#EF4444' : '#22C55E', border: '2px solid #0F1629', margin: '0 auto 6px', boxShadow: isRed ? '0 0 8px rgba(239,68,68,0.5)' : '0 0 6px rgba(34,197,94,0.3)' }} />
                        {/* Date */}
                        <div style={{ fontFamily: MN, fontSize: 9, color: isRed ? '#EF4444' : '#9CA3AF', textAlign: 'center', fontWeight: 600, marginBottom: 4 }}>{mk.date}</div>
                        {/* Card */}
                        <div style={{
                          background: isRed ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isRed ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 6, padding: '8px 10px',
                          ...(isRed ? { animation: 'riskPulse 2s ease-in-out infinite' } : {}),
                        }}>
                          <div style={{ fontFamily: MN, fontSize: 10, color: '#FFFFFF', fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>{mk.title}</div>
                          <div style={{ fontFamily: MN, fontSize: 9, color: '#9CA3AF', marginBottom: 3, lineHeight: 1.4 }}>{mk.sub}</div>
                          <div style={{ fontFamily: MN, fontSize: 9, color: isRed ? '#EF4444' : '#22C55E', lineHeight: 1.4 }}>{mk.detail}</div>
                          {mk.action && (
                            <button
                              className="mt-2 px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all hover:-translate-y-px"
                              style={{ background: '#D4A843', color: '#0F1629', border: 'none', cursor: 'pointer', fontFamily: MN }}
                            >
                              {mk.action}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary strip */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '10px 20px', background: 'rgba(0,0,0,0.1)' }}>
                <span style={{ fontFamily: MN, fontSize: 11, color: '#9CA3AF' }}>
                  CERTIFICATIONS: <span style={{ color: '#FFFFFF', fontWeight: 600 }}>3/4 valides</span> · <span style={{ color: '#EF4444', fontWeight: 600, animation: 'pulse-alert 2s ease-in-out infinite' }}>1 ACTION URGENTE</span> <span style={{ color: '#EF4444' }}>(NM 10.1.271 — 26 jours)</span> · Prochaine échéance critique: <span style={{ color: '#FFFFFF' }}>01 avril 2026</span>
                </span>
              </div>
            </div>
          );
        })()}

        {/* ── NORMES & CERTIFICATIONS PAR MARCHÉ ── */}
        {(() => {
          const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
          const rows = [
            { flag: '🇲🇦', market: 'Maroc', norme: 'NM 10.1.008', status: '✓ Conforme', statusColor: '#22C55E', action: null },
            { flag: '🇲🇦', market: 'Maroc', norme: 'NM 10.1.271', status: '⚠ 26j', statusColor: '#EF4444', action: 'URGENT' },
            { flag: '🇪🇺', market: 'Europe', norme: 'EN 206-1', status: 'À obtenir', statusColor: '#F59E0B', action: 'Audit requis' },
            { flag: '🇪🇺', market: 'Europe', norme: 'CE Marking', status: 'À obtenir', statusColor: '#F59E0B', action: 'En préparation' },
            { flag: '🇺🇸', market: 'USA', norme: 'ASTM C94', status: 'À obtenir', statusColor: '#F59E0B', action: 'Documentation' },
            { flag: '🇺🇸', market: 'USA', norme: 'ACI 318', status: 'À obtenir', statusColor: '#F59E0B', action: 'Formation' },
          ];
          return (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontFamily: MN, fontSize: 12, fontWeight: 600, letterSpacing: '2px', color: '#D4A843' }}>✦ NORMES & CERTIFICATIONS PAR MARCHÉ</span>
                <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,168,67,0.4), transparent)' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,168,67,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                {/* Table header */}
                <div className="grid grid-cols-4" style={{ padding: '10px 20px', borderBottom: '1px solid rgba(212,168,67,0.08)', background: 'rgba(0,0,0,0.15)' }}>
                  {['MARCHÉ', 'NORME', 'STATUT', 'ACTION'].map(h => (
                    <span key={h} style={{ fontFamily: MN, fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '1px' }}>{h}</span>
                  ))}
                </div>
                {/* Rows */}
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-4 items-center" style={{
                    padding: '10px 20px',
                    borderBottom: i < rows.length - 1 ? '1px solid rgba(212,168,67,0.04)' : 'none',
                    background: i % 2 === 1 ? 'rgba(212,168,67,0.02)' : 'transparent',
                  }}>
                    <span style={{ fontFamily: MN, fontSize: 12, color: '#FFFFFF' }}>{r.flag} {r.market}</span>
                    <span style={{ fontFamily: MN, fontSize: 12, color: '#FFFFFF', fontWeight: 600 }}>{r.norme}</span>
                    <span style={{ fontFamily: MN, fontSize: 11, color: r.statusColor, fontWeight: 600 }}>{r.status}</span>
                    <span>
                      {r.action && (
                        <button style={{
                          fontFamily: MN, fontSize: 10, fontWeight: 600,
                          color: r.action === 'URGENT' ? '#EF4444' : '#D4A843',
                          background: r.action === 'URGENT' ? 'rgba(239,68,68,0.1)' : 'transparent',
                          border: `1px solid ${r.action === 'URGENT' ? 'rgba(239,68,68,0.3)' : 'rgba(212,168,67,0.3)'}`,
                          borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
                          ...(r.action === 'URGENT' ? { animation: 'pulse-alert 2s ease-in-out infinite' } : {}),
                        }}>
                          {r.action}
                        </button>
                      )}
                      {!r.action && <span style={{ fontFamily: MN, fontSize: 11, color: '#6B7280' }}>—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── SIMULATEUR DE SCÉNARIOS ── */}
        <ScenarioSimulator />

        {/* ── ÉCOSYSTÈME D'INTÉGRATIONS ── */}
        {(() => {
          const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";
          const rows = [
            { title: 'CONNECTÉ', items: [
              { name: 'Supabase', desc: 'Base de données temps réel · 508 requêtes live', status: 'green', badge: 'Connecté' },
              { name: 'n8n Cloud', desc: '9 workflows IA · 24 agents actifs', status: 'green', badge: 'Connecté' },
              { name: 'Claude Opus', desc: 'Intelligence artificielle · Anthropic', status: 'green', badge: 'Actif' },
              { name: 'Mapbox', desc: 'GPS flotte · 3 véhicules', status: 'green', badge: 'Connecté' },
            ]},
            { title: 'DISPONIBLE', items: [
              { name: 'WhatsApp Business', desc: 'Relances clients · Confirmations chantier', status: 'amber', badge: 'Configurer' },
              { name: 'QuickBooks / Sage', desc: 'Comptabilité & facturation · US/EU', status: 'amber', badge: 'Configurer' },
              { name: 'Stripe', desc: 'Paiements en ligne · Multi-devises', status: 'amber', badge: 'Configurer' },
              { name: 'Samsara / Verizon Connect', desc: 'Fleet GPS avancé · US market', status: 'amber', badge: 'Configurer' },
            ]},
            { title: 'BIENTÔT', items: [
              { name: 'SAP Business One', desc: 'ERP enterprise · EU market', status: 'grey', badge: 'Q3 2026' },
              { name: 'Command Alkon Bridge', desc: 'Migration depuis Command Alkon', status: 'grey', badge: 'Q3 2026' },
              { name: 'Procore', desc: 'Construction project management · US', status: 'grey', badge: 'Q4 2026' },
              { name: 'Salesforce', desc: 'CRM enterprise', status: 'grey', badge: 'Q4 2026' },
            ]},
          ];
          const dotColor = (s: string) => s === 'green' ? '#22C55E' : s === 'amber' ? '#F59E0B' : '#6B7280';
          const badgeStyle = (s: string): React.CSSProperties => s === 'green'
            ? { background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }
            : s === 'amber'
            ? { background: 'transparent', color: '#D4A843', border: '1px solid rgba(212,168,67,0.4)', cursor: 'pointer' }
            : { background: 'rgba(107,114,128,0.1)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.2)' };
          return (
            <div className="mt-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <span style={{ fontFamily: MN, fontSize: 12, fontWeight: 600, letterSpacing: '2px', color: '#D4A843' }}>✦ ÉCOSYSTÈME D'INTÉGRATIONS</span>
                <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,168,67,0.4), transparent)' }} />
              </div>
              {rows.map(row => (
                <div key={row.title} className="mb-5">
                  <div style={{ fontFamily: MN, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: row.title === 'CONNECTÉ' ? '#22C55E' : row.title === 'DISPONIBLE' ? '#F59E0B' : '#6B7280', marginBottom: 8, textTransform: 'uppercase' as const }}>
                    {row.title}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {row.items.map(item => (
                      <div key={item.name} style={{
                        border: '1px solid rgba(212,168,67,0.08)', borderRadius: 8, padding: 12,
                        background: 'rgba(255,255,255,0.01)', transition: 'border-color 200ms',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.08)'; }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(item.status), flexShrink: 0, boxShadow: item.status === 'green' ? `0 0 6px ${dotColor(item.status)}40` : 'none' }} />
                          <span style={{ fontFamily: MN, fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{item.name}</span>
                        </div>
                        <div style={{ fontFamily: MN, fontSize: 11, color: '#9CA3AF', lineHeight: 1.5, marginBottom: 8 }}>{item.desc}</div>
                        <span style={{ fontFamily: MN, fontSize: 9, fontWeight: 600, borderRadius: 4, padding: '2px 8px', display: 'inline-block', ...badgeStyle(item.status) }}>
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ESG Widget */}
        <div style={{
          borderTop: '2px solid #22C55E',
          background: 'rgba(15,23,41,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '14px 18px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 700, color: '#22C55E', letterSpacing: '1px' }}>🌿 EMPREINTE CARBONE</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', background: 'rgba(34,197,94,0.08)', marginLeft: 'auto' }}>
              ESG Score: A
            </span>
          </div>
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: '#94A3B8', lineHeight: 1.8, margin: 0 }}>
            <span style={{ color: '#22C55E', fontWeight: 600 }}>0.8 T CO₂</span> ce mois · <span style={{ color: '#22C55E' }}>−15%</span> vs M-1 · Trajectoire: <span style={{ color: '#22C55E' }}>✓ sous objectif</span>
          </p>
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
            <span style={{ display: 'inline-flex', animation: 'spin 4s linear infinite', fontSize: 12, marginLeft: 4 }}>↻</span>
            <span style={{ fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(148,163,184,0.25)', marginLeft: 2 }}>
              Prochaine sync: <span style={{ color: '#D4A843', fontFamily: 'monospace', fontWeight: '500' }}>{syncCountdown}s</span>
            </span>
          </span>
          <span>✦ Propulsé par Claude Opus · {plantData.pillLabel}</span>
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
