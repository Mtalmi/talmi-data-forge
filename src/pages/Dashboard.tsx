import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import KPICard from '@/components/dashboard/KPICard';
import AlertBanner from '@/components/dashboard/AlertBanner';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';
import LeakageAlertBanner from '@/components/dashboard/LeakageAlertBanner';
import { ExecutiveCommandCenter } from '@/components/dashboard/ExecutiveCommandCenter';
import { type Period } from '@/components/dashboard/PeriodSelector';
import { PeriodKPICard } from '@/components/dashboard/PeriodKPICard';
import { AuditHealthWidget } from '@/components/dashboard/AuditHealthWidget';
import { DatabaseHealthWidget } from '@/components/dashboard/DatabaseHealthWidget';
import { RealTimeProfitTicker } from '@/components/dashboard/RealTimeProfitTicker';
import { LiveQualityFeed } from '@/components/dashboard/LiveQualityFeed';
import { LiveProductionWidget } from '@/components/dashboard/LiveProductionWidget';
import { BatchPhotoGallery } from '@/components/dashboard/BatchPhotoGallery';
import { TreasuryWidget } from '@/components/dashboard/TreasuryWidget';
import { ForensicAlertFeed } from '@/components/dashboard/ForensicAlertFeed';
import { MidnightAlertWidget } from '@/components/dashboard/MidnightAlertWidget';
import { CircularBudgetGauge } from '@/components/dashboard/CircularBudgetGauge';
import { SplitViewHandshake } from '@/components/dashboard/SplitViewHandshake';
import { ForensicAuditFeed } from '@/components/dashboard/ForensicAuditFeed';
import { CeoEmergencyOverride } from '@/components/dashboard/CeoEmergencyOverride';
import { HawaiiGreeting } from '@/components/dashboard/HawaiiGreeting';
import { ParallaxCard } from '@/components/dashboard/ParallaxCard';
import { LiveFleetMap } from '@/components/dashboard/LiveFleetMap';
import { CashFlowForecast } from '@/components/dashboard/CashFlowForecast';
import { MaintenanceAlertWidget } from '@/components/dashboard/MaintenanceAlertWidget';
import { HourlyProductionChart } from '@/components/dashboard/HourlyProductionChart';
import { AIAnomalyScannerWidget } from '@/components/dashboard/AIAnomalyScannerWidget';
import { GeofenceAlertWidget } from '@/components/dashboard/GeofenceAlertWidget';
import { WS7LiveFeedWidget } from '@/components/dashboard/WS7LiveFeedWidget';
import { HawaiiReportButton } from '@/components/dashboard/HawaiiReportButton';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import {
  PendingApprovalsWidget, 
  TodaysPipelineWidget, 
  ARAgingWidget, 
  StockLevelsWidget, 
  SalesFunnelWidget 
} from '@/components/dashboard/DashboardWidgets';
import { TaxComplianceWidget } from '@/components/compliance';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardStatsWithPeriod } from '@/hooks/useDashboardStatsWithPeriod';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { useAuth } from '@/hooks/useAuth';
import { 
  Package, Users, DollarSign, AlertTriangle, TrendingUp, Gauge, RefreshCw, Receipt, 
  Calculator, Bell, MapPin, ChevronDown, LogOut, User, Settings,
  BarChart3, Factory, Truck, Shield, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkeletonKPI } from '@/components/ui/skeletons';
import { DailyReportGenerator } from '@/components/dashboard/DailyReportGenerator';
import { CeoCodeManager } from '@/components/dashboard/CeoCodeManager';
import { AuditHistoryChart } from '@/components/dashboard/AuditHistoryChart';
import { SystemManualPdf } from '@/components/documents/SystemManualPdf';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const { role, isCeo, isAccounting, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refresh } = useDashboardStats();
  const [period, setPeriod] = useState<Period>('month');
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const kpiGridRef = useRef<HTMLDivElement>(null);
  const { stats: periodStats, loading: periodLoading, refresh: refreshPeriod } = useDashboardStatsWithPeriod(period);
  const { checkPaymentDelays } = usePaymentDelays();
  const [refreshing, setRefreshing] = useState(false);
  const [productionStats, setProductionStats] = useState({
    formulesActives: 0,
    prixUpdatedAt: '—',
    tauxECMoyen: '—',
    curMoyen: '—',
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchProductionStats();
    if (isCeo) {
      checkPaymentDelays();
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
          ? new Date(latestPrice.date_mise_a_jour).toLocaleDateString('fr-FR') 
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refresh(),
      refreshPeriod(),
      fetchProductionStats(),
      isCeo ? checkPaymentDelays() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

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
          className="dashboard-header sticky top-0 z-10 p-3 sm:p-4 md:p-5"
        >
          <div className="relative z-10 flex flex-col gap-3 md:gap-4">
            {/* Top row: greeting + user controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tighter font-display truncate">
                  {t('dashboard.greeting.morning')}, Master 👋
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground font-mono truncate">Casablanca • 24°C ☀️</span>
                </div>
              </div>

              {/* User controls - always visible */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="btn-premium min-h-[36px] sm:min-h-[40px] px-3 sm:px-5"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">{t('common.refresh')}</span>
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
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t('common.myAccount')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/user_profile')} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      {t('common.profile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/user_profile')} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('nav.settings')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Bottom row: period selector + action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="period-selector-premium flex-shrink-0">
                {[
                  { value: 'today' as Period, label: t('dashboard.periods.today'), shortLabel: t('dashboard.periods.todayShort') },
                  { value: 'week' as Period, label: t('dashboard.periods.week'), shortLabel: t('dashboard.periods.weekShort') },
                  { value: 'month' as Period, label: t('dashboard.periods.month'), shortLabel: t('dashboard.periods.monthShort') },
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
                    <span className="hidden md:inline">{p.label}</span>
                    <span className="md:hidden">{p.shortLabel}</span>
                  </button>
                ))}
              </div>

              {isCeo && <div className="hidden lg:block"><SystemManualPdf /></div>}
              {isCeo && <div className="hidden md:block"><DailyReportGenerator /></div>}
              {isCeo && <HawaiiReportButton />}
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
            SECTION 1 — KPIs & PERFORMANCE
            ═══════════════════════════════════════════════════════ */}
        <DashboardSection
          title={t('dashboard.sections.performanceKpis')}
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
                    title={t('dashboard.kpi.totalVolume')}
                    value={`${periodStats.totalVolume.toFixed(0)} m³`}
                    subtitle={periodStats.periodLabel || t('common.loading')}
                    icon={Package}
                    trend={periodStats.volumeTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.volumeTrend > 0 ? 'positive' : periodStats.volumeTrend < -15 ? 'negative' : 'default'}
                    className="animate-fade-in"
                  />
                  <PeriodKPICard
                    title={t('dashboard.kpi.revenue')}
                    value={`${(periodStats.chiffreAffaires / 1000).toFixed(1)}K DH`}
                    subtitle={t('dashboard.kpi.invoices', { count: periodStats.nbFactures })}
                    icon={DollarSign}
                    trend={periodStats.caTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.caTrend > 0 ? 'positive' : 'default'}
                    className="animate-fade-in"
                    style={{ animationDelay: '50ms' }}
                  />
                  <PeriodKPICard
                    title={t('dashboard.kpi.avgCUR')}
                    value={periodStats.curMoyen > 0 ? `${periodStats.curMoyen.toFixed(2)} DH` : '—'}
                    subtitle={t('dashboard.kpi.unitCost')}
                    icon={Gauge}
                    trend={periodStats.curTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.curTrend > 5 ? 'negative' : periodStats.curTrend < 0 ? 'positive' : 'default'}
                    className="animate-fade-in"
                    style={{ animationDelay: '100ms' }}
                  />
                  <PeriodKPICard
                    title={t('dashboard.kpi.grossMargin')}
                    value={periodStats.margeBrutePct > 0 ? `${periodStats.margeBrutePct.toFixed(1)}%` : '—'}
                    subtitle={`${(periodStats.margeBrute / 1000).toFixed(1)}K DH`}
                    icon={TrendingUp}
                    trend={periodStats.margeTrend}
                    trendLabel={periodStats.previousPeriodLabel}
                    variant={periodStats.margeBrutePct >= 20 ? 'positive' : periodStats.margeBrutePct < 15 ? 'negative' : 'warning'}
                    className="animate-fade-in"
                    style={{ animationDelay: '150ms' }}
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
                      title={t('dashboard.kpi.netProfit')}
                      value={`${(periodStats.profitNet / 1000).toFixed(1)}K DH`}
                      subtitle={t('dashboard.kpi.profitSubtitle')}
                      icon={Calculator}
                      variant={periodStats.profitNet > 0 ? 'positive' : 'negative'}
                      className="animate-fade-in"
                    />
                    <PeriodKPICard
                      title={t('dashboard.kpi.totalExpenses')}
                      value={`${(periodStats.totalDepenses / 1000).toFixed(1)}K DH`}
                      subtitle={periodStats.periodLabel}
                      icon={Receipt}
                      variant={periodStats.totalDepenses > periodStats.margeBrute * 0.3 ? 'warning' : 'default'}
                      className="animate-fade-in"
                      style={{ animationDelay: '50ms' }}
                    />
                    <KPICard
                      title={t('dashboard.kpi.marginAlerts')}
                      value={stats.marginAlerts}
                      subtitle={t('dashboard.kpi.marginAlertsSubtitle')}
                      icon={AlertTriangle}
                      variant={stats.marginAlerts > 0 ? 'negative' : 'positive'}
                    />
                    <PeriodKPICard
                      title={t('dashboard.kpi.activeClients')}
                      value={periodStats.nbClients}
                      subtitle={periodStats.periodLabel}
                      icon={Users}
                      variant="default"
                      className="animate-fade-in"
                      style={{ animationDelay: '100ms' }}
                    />
                  </>
                )}
              </div>
            )}

            {/* Quick Access Widgets */}
            {(isCeo || isAccounting) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <PendingApprovalsWidget />
                <TodaysPipelineWidget />
                <ARAgingWidget />
                <StockLevelsWidget />
                <SalesFunnelWidget />
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
          title={t('dashboard.sections.productionQuality')}
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
            <div className="card-industrial p-4 sm:p-6 animate-fade-in">
              <HourlyProductionChart />
            </div>

            {/* Production Summary + Recent Deliveries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentDeliveries />
              <div className="card-industrial p-6 animate-fade-in">
                <h3 className="text-lg font-semibold mb-4">{t('dashboard.production.summary')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t('dashboard.production.activeFormulas')}</span>
                    <span className="font-semibold">{productionStats.formulesActives}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t('dashboard.production.pricesUpdated')}</span>
                    <span className="font-semibold">{productionStats.prixUpdatedAt}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t('dashboard.production.avgECRatio')}</span>
                    <span className={`font-semibold ${stats.tauxECMoyen > 0.55 ? 'text-warning' : ''}`}>
                      {productionStats.tauxECMoyen}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">{t('dashboard.production.avgCUR7d')}</span>
                    <span className={`font-semibold ${stats.curTrend > 5 ? 'text-warning' : ''}`}>
                      {productionStats.curMoyen}
                    </span>
                  </div>
                  {productionStats.formulesActives === 0 && (
                    <button
                      onClick={() => navigate('/formules')}
                      className="w-full mt-2 py-2.5 rounded-lg border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/5 transition-colors"
                    >
                      {t('dashboard.production.addProduct')}
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
            title={t('dashboard.sections.financeTreasury')}
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
          <DashboardSection
            title={t('dashboard.sections.fleetLogistics')}
            icon={Truck}
            storageKey="fleet"
            defaultOpen={false}
          >
            <div className="bento-grid">
              <ParallaxCard className="bento-wide" glowColor="ruby" intensity="medium">
                <LiveFleetMap />
              </ParallaxCard>
              <ParallaxCard className="bento-standard" glowColor="emerald" intensity="medium">
                <MaintenanceAlertWidget />
              </ParallaxCard>
              <ParallaxCard className="bento-standard" glowColor="ruby" intensity="medium">
                <GeofenceAlertWidget />
              </ParallaxCard>
            </div>
          </DashboardSection>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 5 — SÉCURITÉ & AUDIT
            ═══════════════════════════════════════════════════════ */}
        {isCeo && (
          <DashboardSection
            title={t('dashboard.sections.securityAudit')}
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
                      <TabsTrigger value="alerts" className="text-xs">{t('dashboard.security.securityAlerts')}</TabsTrigger>
                      <TabsTrigger value="audit" className="text-xs">{t('dashboard.security.auditTrail')}</TabsTrigger>
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

              {/* CEO Tools */}
              <CeoCodeManager />
              <AuditHistoryChart />
            </div>
          </DashboardSection>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 6 — EXECUTIVE COMMAND CENTER
            ═══════════════════════════════════════════════════════ */}
        {isCeo && (
          <DashboardSection
            title={t('dashboard.sections.commandCenter')}
            icon={Gauge}
            storageKey="command"
            defaultOpen={false}
          >
            <div className="glass-card p-3 sm:p-6 rounded-xl">
              <ExecutiveCommandCenter />
            </div>
          </DashboardSection>
        )}
      </div>
    </MainLayout>
  );
}
