import { useEffect, useState, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import KPICard from '@/components/dashboard/KPICard';
import AlertBanner from '@/components/dashboard/AlertBanner';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';
import LeakageAlertBanner from '@/components/dashboard/LeakageAlertBanner';
import { type Period } from '@/components/dashboard/PeriodSelector';
import { PeriodKPICard } from '@/components/dashboard/PeriodKPICard';
import { RealTimeProfitTicker } from '@/components/dashboard/RealTimeProfitTicker';
import { LiveQualityFeed } from '@/components/dashboard/LiveQualityFeed';
import { LiveProductionWidget } from '@/components/dashboard/LiveProductionWidget';
import { BatchPhotoGallery } from '@/components/dashboard/BatchPhotoGallery';
import { HawaiiGreeting } from '@/components/dashboard/HawaiiGreeting';
import { ParallaxCard } from '@/components/dashboard/ParallaxCard';
import { HawaiiReportButton } from '@/components/dashboard/HawaiiReportButton';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { LazyDashboardSection } from '@/components/dashboard/LazyDashboardSection';
import { AIInsightsWidget } from '@/components/dashboard/AIInsightsWidget';
import { SmartAlertsWidget } from '@/components/dashboard/SmartAlertsWidget';
import { MvsM1Sparkline } from '@/components/dashboard/MvsM1Sparkline';
// Lazy-loaded widgets that use recharts (deferred to avoid eager recharts bundle)
const PendingApprovalsWidget = lazy(() => import('@/components/dashboard/DashboardWidgets').then(m => ({ default: m.PendingApprovalsWidget })));
const TodaysPipelineWidget = lazy(() => import('@/components/dashboard/DashboardWidgets').then(m => ({ default: m.TodaysPipelineWidget })));
const ARAgingWidget = lazy(() => import('@/components/dashboard/DashboardWidgets').then(m => ({ default: m.ARAgingWidget })));
const StockLevelsWidget = lazy(() => import('@/components/dashboard/DashboardWidgets').then(m => ({ default: m.StockLevelsWidget })));
const SalesFunnelWidget = lazy(() => import('@/components/dashboard/DashboardWidgets').then(m => ({ default: m.SalesFunnelWidget })));
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardStatsWithPeriod } from '@/hooks/useDashboardStatsWithPeriod';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { useAuth } from '@/hooks/useAuth';
import { 
  Package, Users, DollarSign, AlertTriangle, TrendingUp, Gauge, RefreshCw, Receipt, 
  Calculator, Bell, MapPin, ChevronDown, LogOut, User, Settings,
  BarChart3, Factory, Truck, Shield, Wallet, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkeletonKPI } from '@/components/ui/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Recharts charts extracted to lazy-loaded component
const DashboardInlineCharts = lazy(() => import('@/components/dashboard/DashboardInlineCharts').then(m => ({ default: m.DashboardInlineCharts })));

// Chart data moved to DashboardInlineCharts component

// ═══════════════════════════════════════════════════════
// LAZY-LOADED WIDGETS (deferred until section opened)
// Reduces initial bundle by ~400KB
// ═══════════════════════════════════════════════════════

// Section 2 - Production (heavy charts)
const HourlyProductionChart = lazy(() => import('@/components/dashboard/HourlyProductionChart').then(m => ({ default: m.HourlyProductionChart })));
const WS7LiveFeedWidget = lazy(() => import('@/components/dashboard/WS7LiveFeedWidget').then(m => ({ default: m.WS7LiveFeedWidget })));

// Section 3 - Finance
const CircularBudgetGauge = lazy(() => import('@/components/dashboard/CircularBudgetGauge').then(m => ({ default: m.CircularBudgetGauge })));
const TreasuryWidget = lazy(() => import('@/components/dashboard/TreasuryWidget').then(m => ({ default: m.TreasuryWidget })));
const CashFlowForecast = lazy(() => import('@/components/dashboard/CashFlowForecast').then(m => ({ default: m.CashFlowForecast })));
const BillingDashboardWidget = lazy(() => import('@/components/dashboard/BillingDashboardWidget').then(m => ({ default: m.BillingDashboardWidget })));
const MidnightAlertWidget = lazy(() => import('@/components/dashboard/MidnightAlertWidget').then(m => ({ default: m.MidnightAlertWidget })));
const SplitViewHandshake = lazy(() => import('@/components/dashboard/SplitViewHandshake').then(m => ({ default: m.SplitViewHandshake })));
const TaxComplianceWidget = lazy(() => import('@/components/compliance').then(m => ({ default: m.TaxComplianceWidget })));

// Section 4 - Fleet (includes Mapbox ~200KB)
const LiveFleetMap = lazy(() => import('@/components/dashboard/LiveFleetMap').then(m => ({ default: m.LiveFleetMap })));
const FleetDashboardWidget = lazy(() => import('@/components/dashboard/FleetDashboardWidget').then(m => ({ default: m.FleetDashboardWidget })));
const MaintenanceAlertWidget = lazy(() => import('@/components/dashboard/MaintenanceAlertWidget').then(m => ({ default: m.MaintenanceAlertWidget })));
const GeofenceAlertWidget = lazy(() => import('@/components/dashboard/GeofenceAlertWidget').then(m => ({ default: m.GeofenceAlertWidget })));

// Section 5 - Security & Audit
const AuditHealthWidget = lazy(() => import('@/components/dashboard/AuditHealthWidget').then(m => ({ default: m.AuditHealthWidget })));
const DatabaseHealthWidget = lazy(() => import('@/components/dashboard/DatabaseHealthWidget').then(m => ({ default: m.DatabaseHealthWidget })));
const ForensicAlertFeed = lazy(() => import('@/components/dashboard/ForensicAlertFeed').then(m => ({ default: m.ForensicAlertFeed })));
const ForensicAuditFeed = lazy(() => import('@/components/dashboard/ForensicAuditFeed').then(m => ({ default: m.ForensicAuditFeed })));
const AIAnomalyScannerWidget = lazy(() => import('@/components/dashboard/AIAnomalyScannerWidget').then(m => ({ default: m.AIAnomalyScannerWidget })));
const CeoEmergencyOverride = lazy(() => import('@/components/dashboard/CeoEmergencyOverride').then(m => ({ default: m.CeoEmergencyOverride })));
const CeoCodeManager = lazy(() => import('@/components/dashboard/CeoCodeManager').then(m => ({ default: m.CeoCodeManager })));
const AuditHistoryChart = lazy(() => import('@/components/dashboard/AuditHistoryChart').then(m => ({ default: m.AuditHistoryChart })));
const ComplianceDashboardWidget = lazy(() => import('@/components/dashboard/ComplianceDashboardWidget').then(m => ({ default: m.ComplianceDashboardWidget })));

// Section 6 - AI Predictive Intelligence
const AIDemandForecastWidget = lazy(() => import('@/components/dashboard/AIDemandForecastWidget').then(m => ({ default: m.AIDemandForecastWidget })));
const AIStockDepletionWidget = lazy(() => import('@/components/dashboard/AIStockDepletionWidget').then(m => ({ default: m.AIStockDepletionWidget })));
const AIClientRiskWidget = lazy(() => import('@/components/dashboard/AIClientRiskWidget').then(m => ({ default: m.AIClientRiskWidget })));
const RegulatoryChecklistWidget = lazy(() => import('@/components/dashboard/RegulatoryChecklistWidget').then(m => ({ default: m.RegulatoryChecklistWidget })));

// Section 6 - Command Center
const ExecutiveCommandCenter = lazy(() => import('@/components/dashboard/ExecutiveCommandCenter').then(m => ({ default: m.ExecutiveCommandCenter })));
const ExecutiveSummaryView = lazy(() => import('@/components/dashboard/ExecutiveSummaryView').then(m => ({ default: m.ExecutiveSummaryView })));

// Eager (used in always-open section 1)
const DailyReportGenerator = lazy(() => import('@/components/dashboard/DailyReportGenerator').then(m => ({ default: m.DailyReportGenerator })));
const SystemManualPdf = lazy(() => import('@/components/documents/SystemManualPdf').then(m => ({ default: m.SystemManualPdf })));

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorldClassDashboard } from '@/components/dashboard/WorldClassDashboard';

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { role, isCeo, isAccounting, signOut } = useAuth();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refresh } = useDashboardStats();
  const [period, setPeriod] = useState<Period>('month');
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const kpiGridRef = useRef<HTMLDivElement>(null);
  const { stats: periodStats, loading: periodLoading, refresh: refreshPeriod } = useDashboardStatsWithPeriod(period);
  const { checkPaymentDelays } = usePaymentDelays();
  const [refreshing, setRefreshing] = useState(false);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [productionStats, setProductionStats] = useState({
    formulesActives: 0,
    prixUpdatedAt: '—',
    tauxECMoyen: '—',
    curMoyen: '—',
  });

  // Defer non-critical production stats load
  useEffect(() => {
    const schedule = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    schedule(() => fetchProductionStats());
    if (isCeo) {
      schedule(() => checkPaymentDelays());
    }
    const autoRefreshInterval = setInterval(() => {
      refresh();
      refreshPeriod();
    }, 30000);
    return () => clearInterval(autoRefreshInterval);
  }, [isCeo]);

  const fetchProductionStats = async () => {
    try {
      const { count: formulesCount } = await supabase
        .from('formules_theoriques')
        .select('*', { count: 'exact', head: true });
      const { data: latestPrice } = await supabase
        .from('prix_achat_actuels')
        .select('date_mise_a_jour')
        .order('date_mise_a_jour', { ascending: false })
        .limit(1)
        .maybeSingle();
      setProductionStats({
        formulesActives: formulesCount || 0,
        prixUpdatedAt: latestPrice?.date_mise_a_jour 
          ? new Date(latestPrice.date_mise_a_jour).toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR') 
          : '—',
        tauxECMoyen: stats.tauxECMoyen > 0 ? stats.tauxECMoyen.toFixed(3) : '—',
        curMoyen: stats.curMoyen7j > 0 ? `${stats.curMoyen7j.toFixed(2)} DH` : '—',
      });
    } catch (error) {
      console.error('Error fetching production stats:', error);
    }
  };

  useEffect(() => {
    if (!statsLoading) {
      setProductionStats(prev => ({
        ...prev,
        tauxECMoyen: stats.tauxECMoyen > 0 ? stats.tauxECMoyen.toFixed(3) : '—',
        curMoyen: stats.curMoyen7j > 0 ? `${stats.curMoyen7j.toFixed(2)} DH` : '—',
      }));
    }
  }, [stats, statsLoading]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refresh(),
      refreshPeriod(),
      fetchProductionStats(),
      isCeo ? checkPaymentDelays() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [isCeo]);

  // Persist dismissed alerts to localStorage
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('tbos_dismissed_alerts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
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

  return (
    <MainLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Hawaii Greeting - CEO Only */}
        {isCeo && <HawaiiGreeting />}

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div
          ref={kpiSectionRef}
          className="dashboard-header sticky top-0 z-10 p-4 sm:p-5"
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tighter font-display">
                {t.dashboard.greeting}, {t.dashboard.master} 👋
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm text-muted-foreground font-mono">Casablanca • 24°C ☀️</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="period-selector-premium">
                {[
                  { value: 'today' as Period, label: t.dashboard.period.today, shortLabel: t.dashboard.period.todayShort },
                  { value: 'week' as Period, label: t.dashboard.period.thisWeek, shortLabel: t.dashboard.period.thisWeekShort },
                  { value: 'month' as Period, label: t.dashboard.period.thisMonth, shortLabel: t.dashboard.period.thisMonthShort },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPeriod(p.value);
                      requestAnimationFrame(() => {
                        const grid = kpiGridRef.current;
                        if (!grid) return;
                        const scrollContainer = grid.closest('main') as HTMLElement | null;
                        if (!scrollContainer) {
                          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          return;
                        }
                        const topBarHeight = document.getElementById('app-topbar')?.offsetHeight ?? 0;
                        const headerHeight = kpiSectionRef.current?.offsetHeight ?? 0;
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const gridRect = grid.getBoundingClientRect();
                        const relativeTop = gridRect.top - containerRect.top + scrollContainer.scrollTop;
                        const targetTop = Math.max(0, relativeTop - topBarHeight - headerHeight - 12);
                        scrollContainer.scrollTo({ top: targetTop, behavior: 'smooth' });
                      });
                    }}
                    className={`period-btn ${period === p.value ? 'active' : ''}`}
                  >
                    <span className="hidden sm:inline">{p.label}</span>
                    <span className="sm:hidden">{p.shortLabel}</span>
                  </button>
                ))}
              </div>

              {isCeo && <SystemManualPdf />}
              {isCeo && <DailyReportGenerator />}
              {isCeo && <HawaiiReportButton />}
              {isCeo && (
                <button
                  onClick={() => setShowExecutiveSummary(true)}
                  className="btn-premium min-h-[40px]"
                  title="Résumé Exécutif"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Résumé</span>
                </button>
              )}
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-premium min-h-[40px]"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t.dashboard.refresh}</span>
              </button>

              <button className="relative p-2 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  3
                </span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">MT</span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border border-border z-50">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{t.dashboard.myAccount}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => navigate('/user_profile')} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    {t.dashboard.profile}
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/user_profile')} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    {t.nav.settings}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* ─── CRITICAL ALERTS ────────────────────────────────── */}
        {(isCeo || isAccounting) && <LeakageAlertBanner />}
        <AlertBanner 
          alerts={visibleAlerts.map(a => ({
            id: a.id,
            type: a.type,
            message: `${a.title}: ${a.message}`,
            timestamp: a.timestamp,
          }))} 
          onDismiss={dismissAlert} 
        />

        {/* ═══════════════════════════════════════════════════════
            WORLD-CLASS PREMIUM DASHBOARD
            ═══════════════════════════════════════════════════════ */}
        <WorldClassDashboard />

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — KPIs & PERFORMANCE
            ═══════════════════════════════════════════════════════ */}
        <DashboardSection
          title={t.dashboard.sections.performanceKpis}
          icon={BarChart3}
          storageKey="kpis"
          defaultOpen={true}
        >
          <div className="space-y-4">
            {/* Period KPI Grid */}
            <motion.div
              ref={kpiGridRef}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
              initial="initial"
              animate="enter"
              variants={{
                initial: {},
                enter: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
            >
              {periodLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
              ) : (
                <>
                  <PeriodKPICard
                    title={t.dashboard.kpi.totalVolume}
                    value={`${periodStats.totalVolume.toFixed(0)} m³`}
                    subtitle={periodStats.periodLabel || t.dashboard.loading}
                    icon={Package}
                    trend={periodStats.volumeTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.volumeTrend > 0 ? 'positive' : periodStats.volumeTrend < -15 ? 'negative' : 'default'}
                    className="animate-fade-in"
                    delay={0}
                  />
                  <PeriodKPICard
                    title={t.dashboard.kpi.turnover}
                    value={`${(periodStats.chiffreAffaires / 1000).toFixed(1)}K DH`}
                    subtitle={`${periodStats.nbFactures} ${t.dashboard.kpi.invoices}`}
                    icon={DollarSign}
                    trend={periodStats.caTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.caTrend > 0 ? 'positive' : 'default'}
                    className="animate-fade-in"
                    style={{ animationDelay: '50ms' }}
                    delay={100}
                  />
                  <PeriodKPICard
                    title={t.dashboard.kpi.avgCur}
                    value={periodStats.curMoyen > 0 ? `${periodStats.curMoyen.toFixed(2)} DH` : '—'}
                    subtitle={t.dashboard.kpi.unitCost}
                    icon={Gauge}
                    trend={periodStats.curTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.curTrend > 5 ? 'negative' : periodStats.curTrend < 0 ? 'positive' : 'default'}
                    className="animate-fade-in"
                    style={{ animationDelay: '100ms' }}
                    delay={200}
                  />
                  <PeriodKPICard
                    title={t.dashboard.kpi.grossMargin}
                    value={periodStats.margeBrutePct > 0 ? `${periodStats.margeBrutePct.toFixed(1)}%` : '—'}
                    subtitle={`${(periodStats.margeBrute / 1000).toFixed(1)}K DH`}
                    icon={TrendingUp}
                    trend={periodStats.margeTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.margeBrutePct >= 20 ? 'positive' : periodStats.margeBrutePct < 15 ? 'negative' : 'warning'}
                    className="animate-fade-in"
                    style={{ animationDelay: '150ms' }}
                    delay={300}
                  />
                </>
              )}
            </motion.div>

            {/* Profit & Expenses Row — CEO/Accounting */}
            {(isCeo || isAccounting) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {periodLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
                ) : (
                  <>
                    <PeriodKPICard
                      title={t.dashboard.kpi.netProfit}
                      value={`${(periodStats.profitNet / 1000).toFixed(1)}K DH`}
                      subtitle={t.dashboard.kpi.revenueMinusCosts}
                      icon={Calculator}
                      variant={periodStats.profitNet > 0 ? 'positive' : 'negative'}
                      className="animate-fade-in"
                      delay={400}
                    />
                    <PeriodKPICard
                      title={t.dashboard.kpi.totalExpenses}
                      value={`${(periodStats.totalDepenses / 1000).toFixed(1)}K DH`}
                      subtitle={periodStats.periodLabel}
                      icon={Receipt}
                      variant={periodStats.totalDepenses > periodStats.margeBrute * 0.3 ? 'warning' : 'default'}
                      className="animate-fade-in"
                      style={{ animationDelay: '50ms' }}
                      delay={500}
                    />
                    <KPICard
                      title={t.dashboard.kpi.marginAlerts}
                      value={stats.marginAlerts}
                      subtitle={t.dashboard.kpi.varianceOver5}
                      icon={AlertTriangle}
                      variant={stats.marginAlerts > 0 ? 'negative' : 'positive'}
                    />
                    <PeriodKPICard
                      title={t.dashboard.activeClients}
                      value={periodStats.nbClients}
                      subtitle={periodStats.periodLabel}
                      icon={Users}
                      variant="default"
                      className="animate-fade-in"
                      style={{ animationDelay: '100ms' }}
                      delay={700}
                    />
                  </>
                )}
              </div>
            )}

            {/* Status Dot Banner */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span className="status-dot status-dot-green" />
              <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Plant running at 100% efficiency</span>
            </div>

            {/* ─── RECHARTS VISUALIZATIONS (lazy-loaded) ─── */}
            <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="tbos-card p-4 rounded-xl h-[260px] animate-pulse bg-muted/20" />)}</div>}>
              <DashboardInlineCharts />
            </Suspense>

            {/* Quick Access Widgets */}
            {(isCeo || isAccounting) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <PendingApprovalsWidget />
                <TodaysPipelineWidget />
                <ARAgingWidget />
                <StockLevelsWidget />
                <SalesFunnelWidget />
              </div>
            )}

            {/* AI Insights + M vs M-1 + Smart Alerts */}
            {isCeo && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ParallaxCard className="lg:col-span-1" glowColor="gold">
                  <AIInsightsWidget periodStats={periodStats} dashboardStats={stats} />
                </ParallaxCard>
                <ParallaxCard className="lg:col-span-1" glowColor="emerald">
                  <MvsM1Sparkline />
                </ParallaxCard>
                <ParallaxCard className="lg:col-span-1" glowColor="ruby">
                  <SmartAlertsWidget alerts={visibleAlerts} dashboardStats={stats} />
                </ParallaxCard>
              </div>
            )}

            {/* Real-Time Profit Ticker */}
            {isCeo && (
              <ParallaxCard className="w-full" glowColor="gold">
                <RealTimeProfitTicker />
              </ParallaxCard>
            )}
          </div>
        </DashboardSection>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — PRODUCTION & QUALITÉ
            ═══════════════════════════════════════════════════════ */}
        <DashboardSection
          title={t.dashboard.sections.productionQuality}
          icon={Factory}
          storageKey="production"
          defaultOpen={true}
        >
          <div className="space-y-4">
            {isCeo && (
              <div className="bento-grid">
                <ParallaxCard className="bento-wide" glowColor="gold">
                  <LiveQualityFeed />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="gold" intensity="medium">
                  <LiveProductionWidget />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="gold">
                  <BatchPhotoGallery />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="gold" intensity="medium">
                  <WS7LiveFeedWidget />
                </ParallaxCard>
              </div>
            )}

            {/* Hourly Production Chart */}
            <div className="card-industrial p-4 sm:p-6 animate-fade-in" style={{ borderTop: '2px solid hsl(var(--primary)/0.3)' }}>
              <HourlyProductionChart />
            </div>

            {/* Production Summary + Recent Deliveries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentDeliveries />

              {/* Production Summary — Premium Version */}
              <div className="card-industrial rounded-xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40"
                  style={{ background: 'linear-gradient(90deg, hsl(var(--primary)/0.06) 0%, transparent 70%)' }}>
                  <span className="w-[3px] h-5 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {t.dashboard.productionSummary}
                  </h3>
                  {/* Live dot */}
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-success">
                    <span className="status-dot status-dot-green" />
                    LIVE
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  {/* Formulas Actives */}
                  <div
                    className="flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-default"
                    style={{ background: 'hsl(var(--muted)/0.4)', borderLeft: '3px solid hsl(var(--primary)/0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--primary)/0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--muted)/0.4)')}
                  >
                    <span className="text-xs text-muted-foreground font-medium">{t.dashboard.activeFormulas}</span>
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--primary))' }}
                    >
                      {productionStats.formulesActives}
                    </span>
                  </div>

                  {/* Prices Updated */}
                  <div
                    className="flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-default"
                    style={{ background: 'hsl(var(--muted)/0.4)', borderLeft: '3px solid hsl(var(--accent-teal)/0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent-teal)/0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--muted)/0.4)')}
                  >
                    <span className="text-xs text-muted-foreground font-medium">{t.dashboard.pricesUpdated}</span>
                    <span
                      className="text-sm font-bold"
                      style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--accent-teal))' }}
                    >
                      {productionStats.prixUpdatedAt}
                    </span>
                  </div>

                  {/* Avg E/C Ratio */}
                  <div
                    className="flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-default"
                    style={{
                      background: 'hsl(var(--muted)/0.4)',
                      borderLeft: `3px solid ${stats.tauxECMoyen > 0.55 ? 'hsl(var(--warning)/0.7)' : 'hsl(var(--success)/0.6)'}`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `hsl(${stats.tauxECMoyen > 0.55 ? 'var(--warning)' : 'var(--success)'}/0.05)`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--muted)/0.4)')}
                  >
                    <span className="text-xs text-muted-foreground font-medium">{t.dashboard.avgEcRatio}</span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        color: stats.tauxECMoyen > 0.55 ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                      }}
                    >
                      {productionStats.tauxECMoyen}
                    </span>
                  </div>

                  {/* Avg CUR 7d */}
                  <div
                    className="flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-default"
                    style={{
                      background: 'hsl(var(--muted)/0.4)',
                      borderLeft: `3px solid ${stats.curTrend > 5 ? 'hsl(var(--warning)/0.7)' : 'hsl(var(--primary)/0.5)'}`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--primary)/0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--muted)/0.4)')}
                  >
                    <span className="text-xs text-muted-foreground font-medium">{t.dashboard.avgCur7d}</span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        color: stats.curTrend > 5 ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
                      }}
                    >
                      {productionStats.curMoyen}
                    </span>
                  </div>

                  {productionStats.formulesActives === 0 && (
                    <button
                      onClick={() => navigate('/formules')}
                      className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-primary/40 text-sm font-semibold text-primary hover:bg-primary/5 hover:border-primary/60 transition-all duration-200"
                    >
                      {t.dashboard.addProduct}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardSection>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — FINANCE & TRÉSORERIE
            ═══════════════════════════════════════════════════════ */}
        {isCeo && (
          <DashboardSection
            title={t.dashboard.sections.financeTreasury}
            icon={Wallet}
            storageKey="finance"
            defaultOpen={true}
          >
            <div className="bento-grid">
              <ParallaxCard className="bento-wide" glowColor="gold">
                <CircularBudgetGauge />
              </ParallaxCard>
              <ParallaxCard className="bento-wide" glowColor="gold">
                <TreasuryWidget />
              </ParallaxCard>
              <ParallaxCard className="bento-wide" glowColor="emerald">
                <TaxComplianceWidget />
              </ParallaxCard>
              <ParallaxCard className="bento-wide" glowColor="emerald" intensity="medium">
                <CashFlowForecast />
              </ParallaxCard>
              <ParallaxCard className="bento-wide" glowColor="gold">
                <BillingDashboardWidget />
              </ParallaxCard>
              <ParallaxCard className="bento-standard" glowColor="ruby">
                <MidnightAlertWidget />
              </ParallaxCard>
              <ParallaxCard className="bento-wide" glowColor="gold">
                <SplitViewHandshake />
              </ParallaxCard>
            </div>
          </DashboardSection>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 4 — FLOTTE & LOGISTIQUE
            ═══════════════════════════════════════════════════════ */}
        {isCeo && (
          <LazyDashboardSection
            title={t.dashboard.sections.fleetLogistics}
            icon={Truck}
            storageKey="fleet"
            defaultOpen={false}
          >
            <div className="bento-grid">
              <ParallaxCard className="bento-wide" glowColor="ruby" intensity="medium">
                <LiveFleetMap />
              </ParallaxCard>
              <ParallaxCard className="bento-standard" glowColor="emerald" intensity="medium">
                <FleetDashboardWidget />
              </ParallaxCard>
              <ParallaxCard className="bento-standard" glowColor="emerald" intensity="medium">
                <MaintenanceAlertWidget />
              </ParallaxCard>
              <ParallaxCard className="bento-standard" glowColor="ruby" intensity="medium">
                <GeofenceAlertWidget />
              </ParallaxCard>
            </div>
          </LazyDashboardSection>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 5 — SÉCURITÉ & AUDIT
            ═══════════════════════════════════════════════════════ */}
        {isCeo && (
          <LazyDashboardSection
            title={t.dashboard.sections.securityAudit}
            icon={Shield}
            storageKey="security"
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="bento-grid">
                <ParallaxCard className="bento-wide" glowColor="emerald">
                  <AuditHealthWidget />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="emerald">
                  <DatabaseHealthWidget />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="ruby">
                  <Tabs defaultValue="alerts" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-2">
                      <TabsTrigger value="alerts" className="text-xs">{t.dashboard.securityAlerts}</TabsTrigger>
                      <TabsTrigger value="audit" className="text-xs">{t.dashboard.auditTrail}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="alerts" className="mt-0">
                      <ForensicAlertFeed />
                    </TabsContent>
                    <TabsContent value="audit" className="mt-0">
                      <ForensicAuditFeed />
                    </TabsContent>
                  </Tabs>
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="emerald" intensity="medium">
                  <AIAnomalyScannerWidget />
                </ParallaxCard>
                <ParallaxCard className="bento-standard" glowColor="ruby" intensity="strong">
                  <CeoEmergencyOverride />
                </ParallaxCard>
              </div>

              {/* AI Predictive Intelligence Suite */}
              <div className="bento-grid">
                <ParallaxCard className="bento-wide" glowColor="gold" intensity="medium">
                  <AIDemandForecastWidget />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="emerald" intensity="medium">
                  <AIStockDepletionWidget />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="ruby" intensity="medium">
                  <AIClientRiskWidget />
                </ParallaxCard>
              </div>

              {/* CEO Tools */}
              <CeoCodeManager />
              <AuditHistoryChart />

              {/* Compliance & Regulatory */}
              <div className="bento-grid">
                <ParallaxCard className="bento-wide" glowColor="emerald" intensity="medium">
                  <ComplianceDashboardWidget />
                </ParallaxCard>
                <ParallaxCard className="bento-wide" glowColor="emerald">
                  <RegulatoryChecklistWidget />
                </ParallaxCard>
              </div>
            </div>
          </LazyDashboardSection>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 6 — EXECUTIVE COMMAND CENTER
            ═══════════════════════════════════════════════════════ */}
        {isCeo && (
          <LazyDashboardSection
            title={t.dashboard.sections.commandCenter}
            icon={Gauge}
            storageKey="command"
            defaultOpen={false}
          >
            <div className="glass-card p-3 sm:p-6 rounded-xl">
              <ExecutiveCommandCenter />
            </div>
          </LazyDashboardSection>
        )}
      </div>

      {/* Executive Summary Overlay */}
      <AnimatePresence>
        {showExecutiveSummary && (
          <ExecutiveSummaryView
            periodStats={periodStats}
            dashboardStats={stats}
            onClose={() => setShowExecutiveSummary(false)}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
