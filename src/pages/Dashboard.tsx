import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import KPICard from '@/components/dashboard/KPICard';
import AlertBanner from '@/components/dashboard/AlertBanner';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';
import LeakageAlertBanner from '@/components/dashboard/LeakageAlertBanner';
import { ExecutiveCommandCenter } from '@/components/dashboard/ExecutiveCommandCenter';
import { DailyProfitSummary } from '@/components/dashboard/DailyProfitSummary';
import { PeriodSelector, Period } from '@/components/dashboard/PeriodSelector';
import { PeriodKPICard } from '@/components/dashboard/PeriodKPICard';
import { AuditHealthWidget } from '@/components/dashboard/AuditHealthWidget';
import { RealTimeProfitTicker } from '@/components/dashboard/RealTimeProfitTicker';
import { LiveQualityFeed } from '@/components/dashboard/LiveQualityFeed';
import { LiveProductionWidget } from '@/components/dashboard/LiveProductionWidget';
import { BatchPhotoGallery } from '@/components/dashboard/BatchPhotoGallery';
import { TreasuryWidget } from '@/components/dashboard/TreasuryWidget';
import {
  PendingApprovalsWidget, 
  TodaysPipelineWidget, 
  ARAgingWidget, 
  StockLevelsWidget, 
  SalesFunnelWidget 
} from '@/components/dashboard/DashboardWidgets';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardStatsWithPeriod } from '@/hooks/useDashboardStatsWithPeriod';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Package, Users, DollarSign, AlertTriangle, TrendingUp, Gauge, Droplets, RefreshCw, Receipt, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyReportGenerator } from '@/components/dashboard/DailyReportGenerator';
import { CeoCodeManager } from '@/components/dashboard/CeoCodeManager';
import { AuditHistoryChart } from '@/components/dashboard/AuditHistoryChart';
import { SystemManualPdf } from '@/components/documents/SystemManualPdf';

export default function Dashboard() {
  const { role, isCeo, isAccounting } = useAuth();
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
    // Check payment delays on load (for CEO/Admin)
    if (isCeo) {
      checkPaymentDelays();
    }
    
    // Set up auto-refresh interval
    const autoRefreshInterval = setInterval(() => {
      refresh();
      refreshPeriod();
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [isCeo]);

  const fetchProductionStats = async () => {
    try {
      // Fetch active formules count
      const { count: formulesCount } = await supabase
        .from('formules_theoriques')
        .select('*', { count: 'exact', head: true });

      // Fetch latest price update
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
    // Update production stats when dashboard stats change
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
      // Persist to localStorage
      localStorage.setItem('tbos_dismissed_alerts', JSON.stringify([...updated]));
      return updated;
    });
  };

  // Filter out dismissed alerts
  const visibleAlerts = stats.alerts.filter(alert => !dismissedAlerts.has(alert.id));

  const getTrendDirection = (value: number): 'up' | 'down' | 'neutral' => {
    if (value > 2) return 'up';
    if (value < -2) return 'down';
    return 'neutral';
  };

  const formatTrend = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(0)}%`;
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Premium Dashboard Header */}
        <div
          ref={kpiSectionRef}
          className="dashboard-header sticky top-14 sm:top-16 z-10 p-4 sm:p-5"
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title Section */}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                    Tableau de Bord
                  </h1>
                  <p className="text-sm text-muted-foreground truncate">
                    Vue d'ensemble • Talmi Beton
                  </p>
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Premium Period Selector */}
              <div className="period-selector-premium">
                {[
                  { value: 'today' as Period, label: "Aujourd'hui", shortLabel: 'Auj.' },
                  { value: 'week' as Period, label: 'Cette Semaine', shortLabel: 'Sem.' },
                  { value: 'month' as Period, label: 'Ce Mois', shortLabel: 'Mois' },
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

              {/* Action Buttons */}
              {isCeo && <SystemManualPdf />}
              {isCeo && <DailyReportGenerator />}
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-premium min-h-[40px]"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* CEO Hawaii Command Center - Mobile Bento Grid */}
        {isCeo && (
          <div className="bento-grid">
            {/* Real-Time Profit Ticker - Wide on desktop */}
            <div className="bento-wide">
              <RealTimeProfitTicker />
            </div>
            
            {/* Audit Health Widget */}
            <div className="bento-wide">
              <AuditHealthWidget />
            </div>
            
            {/* Live Quality Feed - Hawaii Transparency */}
            <div className="bento-wide">
              <LiveQualityFeed />
            </div>
            
            {/* Live Production Feed - Hawaii Plant Monitoring */}
            <div className="bento-wide">
              <LiveProductionWidget />
            </div>
            
            {/* Batch Photo Gallery - Hawaii Visual Proof */}
            <div className="bento-wide">
              <BatchPhotoGallery />
            </div>
            
            {/* Treasury & Cash Flow - Financial Constitution */}
            <div className="bento-wide">
              <TreasuryWidget />
            </div>
            
            {/* Executive Command Center - Full width */}
            <div className="bento-full">
              <div className="glass-card p-3 sm:p-6 rounded-xl">
                <ExecutiveCommandCenter />
              </div>
            </div>
          </div>
        )}

        {/* Leakage Alert Banner - Critical */}
        {(isCeo || isAccounting) && <LeakageAlertBanner />}

        {/* Alerts - uses persisted dismissal */}
        <AlertBanner 
          alerts={visibleAlerts.map(a => ({
            id: a.id,
            type: a.type,
            message: `${a.title}: ${a.message}`,
            timestamp: a.timestamp,
          }))} 
          onDismiss={dismissAlert} 
        />

        {/* Period-Aware KPI Grid - Mobile optimized */}
        <div ref={kpiGridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <PeriodKPICard
            title="Volume Total"
            value={periodLoading ? '...' : `${periodStats.totalVolume.toFixed(0)} m³`}
            subtitle={periodStats.periodLabel || 'Chargement...'}
            icon={Package}
            trend={periodStats.volumeTrend}
            trendLabel={periodStats.previousPeriodLabel}
            variant={periodStats.volumeTrend > 0 ? 'positive' : periodStats.volumeTrend < -15 ? 'negative' : 'default'}
            className={periodLoading ? 'opacity-50 animate-pulse' : ''}
          />
          <PeriodKPICard
            title="Chiffre d'Affaires"
            value={periodLoading ? '...' : `${(periodStats.chiffreAffaires / 1000).toFixed(1)}K DH`}
            subtitle={`${periodStats.nbFactures} factures`}
            icon={DollarSign}
            trend={periodStats.caTrend}
            trendLabel={periodStats.previousPeriodLabel}
            variant={periodStats.caTrend > 0 ? 'positive' : 'default'}
            className={periodLoading ? 'opacity-50 animate-pulse' : ''}
          />
          <PeriodKPICard
            title="CUR Moyen"
            value={periodLoading ? '...' : (periodStats.curMoyen > 0 ? `${periodStats.curMoyen.toFixed(2)} DH` : '—')}
            subtitle="Coût Unitaire Réel"
            icon={Gauge}
            trend={periodStats.curTrend}
            trendLabel={periodStats.previousPeriodLabel}
            variant={periodStats.curTrend > 5 ? 'negative' : periodStats.curTrend < 0 ? 'positive' : 'default'}
            className={periodLoading ? 'opacity-50 animate-pulse' : ''}
          />
          <PeriodKPICard
            title="Marge Brute"
            value={periodLoading ? '...' : (periodStats.margeBrutePct > 0 ? `${periodStats.margeBrutePct.toFixed(1)}%` : '—')}
            subtitle={`${(periodStats.margeBrute / 1000).toFixed(1)}K DH`}
            icon={TrendingUp}
            trend={periodStats.margeTrend}
            trendLabel={periodStats.previousPeriodLabel}
            variant={periodStats.margeBrutePct >= 20 ? 'positive' : periodStats.margeBrutePct < 15 ? 'negative' : 'warning'}
            className={periodLoading ? 'opacity-50 animate-pulse' : ''}
          />
        </div>

        {/* Profit Net & Dépenses - CEO Only */}
        {(isCeo || isAccounting) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PeriodKPICard
              title="Profit Net"
              value={periodLoading ? '...' : `${(periodStats.profitNet / 1000).toFixed(1)}K DH`}
              subtitle="CA - Coûts - Dépenses"
              icon={Calculator}
              variant={periodStats.profitNet > 0 ? 'positive' : 'negative'}
              className={periodLoading ? 'opacity-50 animate-pulse' : ''}
            />
            <PeriodKPICard
              title="Total Dépenses"
              value={periodLoading ? '...' : `${(periodStats.totalDepenses / 1000).toFixed(1)}K DH`}
              subtitle={periodStats.periodLabel}
              icon={Receipt}
              variant={periodStats.totalDepenses > periodStats.margeBrute * 0.3 ? 'warning' : 'default'}
              className={periodLoading ? 'opacity-50 animate-pulse' : ''}
            />
            <KPICard
              title="Alertes Marge"
              value={stats.marginAlerts}
              subtitle="Écarts > 5%"
              icon={AlertTriangle}
              variant={stats.marginAlerts > 0 ? 'negative' : 'positive'}
            />
            <PeriodKPICard
              title="Clients Actifs"
              value={periodLoading ? '...' : periodStats.nbClients}
              subtitle={periodStats.periodLabel}
              icon={Users}
              variant="default"
              className={periodLoading ? 'opacity-50 animate-pulse' : ''}
            />
          </div>
        )}

        {/* Quick Access Widgets - CEO Only */}
        {(isCeo || isAccounting) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <PendingApprovalsWidget />
            <TodaysPipelineWidget />
            <ARAgingWidget />
            <StockLevelsWidget />
            <SalesFunnelWidget />
          </div>
        )}

        {/* CEO Emergency Codes Manager - CEO Only */}
        {isCeo && <CeoCodeManager />}

        {/* Audit History Chart - CEO Only */}
        {isCeo && <AuditHistoryChart />}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentDeliveries />
          
          {/* Daily Profit Summary - CEO Only */}
          {isCeo ? (
            <DailyProfitSummary />
          ) : (
            /* Production Summary Card */
            <div className="card-industrial p-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Résumé Production</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Formules actives</span>
                  <span className="font-semibold">{productionStats.formulesActives}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Prix mis à jour</span>
                  <span className="font-semibold">{productionStats.prixUpdatedAt}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Taux E/C moyen</span>
                  <span className={`font-semibold ${stats.tauxECMoyen > 0.55 ? 'text-warning' : ''}`}>
                    {productionStats.tauxECMoyen}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">CUR moyen (7j)</span>
                  <span className={`font-semibold ${stats.curTrend > 5 ? 'text-warning' : ''}`}>
                    {productionStats.curMoyen}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
