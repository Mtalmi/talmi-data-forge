import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import KPICard from '@/components/dashboard/KPICard';
import AlertBanner from '@/components/dashboard/AlertBanner';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';
import LeakageAlertBanner from '@/components/dashboard/LeakageAlertBanner';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Package, Users, DollarSign, AlertTriangle, TrendingUp, Gauge, Droplets, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Delivery {
  bl_id: string;
  date_livraison: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  statut_paiement: string;
  ecart_marge: number | null;
  alerte_ecart: boolean;
}

export default function Dashboard() {
  const { role, isCeo, isAccounting } = useAuth();
  const { stats, loading: statsLoading, refresh } = useDashboardStats();
  const { checkPaymentDelays } = usePaymentDelays();
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productionStats, setProductionStats] = useState({
    formulesActives: 0,
    prixUpdatedAt: '—',
    tauxECMoyen: '—',
    curMoyen: '—',
  });

  useEffect(() => {
    fetchRecentDeliveries();
    fetchProductionStats();
    // Check payment delays on load (for CEO/Admin)
    if (isCeo) {
      checkPaymentDelays();
    }
  }, [isCeo]);

  const fetchRecentDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, date_livraison, client_id, formule_id, volume_m3, statut_paiement, ecart_marge, alerte_ecart')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching recent deliveries:', error);
    } finally {
      setDeliveriesLoading(false);
    }
  };

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
      fetchRecentDeliveries(),
      fetchProductionStats(),
      isCeo ? checkPaymentDelays() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const dismissAlert = (id: string) => {
    // Alerts are managed by useDashboardStats, this is for UI dismissal only
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord</h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble des opérations Talmi Beton
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Leakage Alert Banner - Critical */}
        {(isCeo || isAccounting) && <LeakageAlertBanner />}

        {/* Alerts */}
        <AlertBanner 
          alerts={stats.alerts.map(a => ({
            id: a.id,
            type: a.type,
            message: `${a.title}: ${a.message}`,
            timestamp: a.timestamp,
          }))} 
          onDismiss={dismissAlert} 
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Livraisons"
            value={stats.totalDeliveries}
            subtitle="Ce mois"
            icon={Truck}
            trend={getTrendDirection(stats.deliveriesTrend)}
            trendValue={formatTrend(stats.deliveriesTrend)}
            variant={stats.deliveriesTrend < -20 ? 'negative' : 'default'}
          />
          <KPICard
            title="Volume Total"
            value={`${stats.totalVolume.toFixed(0)} m³`}
            subtitle="Béton livré"
            icon={Package}
            trend={getTrendDirection(stats.volumeTrend)}
            trendValue={formatTrend(stats.volumeTrend)}
            variant={stats.volumeTrend > 0 ? 'positive' : stats.volumeTrend < -15 ? 'negative' : 'default'}
          />
          <KPICard
            title="Clients Actifs"
            value={stats.totalClients}
            subtitle="Ce mois"
            icon={Users}
            trend={getTrendDirection(stats.clientsTrend)}
            trendValue={formatTrend(stats.clientsTrend)}
            variant={stats.clientsTrend < -10 ? 'warning' : 'default'}
          />
          <KPICard
            title="Paiements"
            value={stats.pendingPaymentsCount}
            subtitle={stats.pendingPaymentsTotal > 0 ? `${(stats.pendingPaymentsTotal / 1000).toFixed(0)}K DH en retard` : 'En attente'}
            icon={DollarSign}
            variant={stats.pendingPaymentsTotal > 100000 ? 'negative' : stats.pendingPaymentsCount > 10 ? 'warning' : 'default'}
          />
        </div>

        {/* Secondary KPIs for CEO/Accounting */}
        {(isCeo || isAccounting) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Alertes Marge"
              value={stats.marginAlerts}
              subtitle="Écarts > 5%"
              icon={AlertTriangle}
              variant={stats.marginAlerts > 0 ? 'negative' : 'positive'}
            />
            <KPICard
              title="CUR Moyen (7j)"
              value={stats.curMoyen7j > 0 ? `${stats.curMoyen7j.toFixed(2)}` : '—'}
              subtitle="DH/m³"
              icon={Gauge}
              trend={getTrendDirection(stats.curTrend)}
              trendValue={stats.curTrend !== 0 ? formatTrend(stats.curTrend) : undefined}
              variant={stats.curTrend > 5 ? 'warning' : 'default'}
            />
            <KPICard
              title="Taux E/C Moyen"
              value={stats.tauxECMoyen > 0 ? stats.tauxECMoyen.toFixed(3) : '—'}
              subtitle={stats.tauxECMoyen > 0.55 ? '⚠️ Dilution' : 'Normal'}
              icon={Droplets}
              variant={stats.tauxECMoyen > 0.55 ? 'warning' : 'default'}
            />
            <KPICard
              title="Performance"
              value={`${(100 - (stats.marginAlerts / Math.max(stats.totalDeliveries, 1)) * 100).toFixed(1)}%`}
              subtitle="Taux de conformité"
              icon={TrendingUp}
              variant="positive"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentDeliveries deliveries={recentDeliveries} loading={deliveriesLoading} />
          
          {/* Production Summary Card */}
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
        </div>
      </div>
    </MainLayout>
  );
}
