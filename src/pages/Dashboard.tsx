import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import KPICard from '@/components/dashboard/KPICard';
import AlertBanner from '@/components/dashboard/AlertBanner';
import RecentDeliveries from '@/components/dashboard/RecentDeliveries';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Package, Users, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalDeliveries: number;
  totalVolume: number;
  totalClients: number;
  pendingPayments: number;
  marginAlerts: number;
}

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

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export default function Dashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDeliveries: 0,
    totalVolume: 0,
    totalClients: 0,
    pendingPayments: 0,
    marginAlerts: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch delivery stats
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('bons_livraison_reels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (deliveriesError) throw deliveriesError;

      // Fetch all deliveries count
      const { count: totalDeliveries } = await supabase
        .from('bons_livraison_reels')
        .select('*', { count: 'exact', head: true });

      // Fetch clients count
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Fetch pending payments
      const { count: pendingPayments } = await supabase
        .from('bons_livraison_reels')
        .select('*', { count: 'exact', head: true })
        .eq('statut_paiement', 'En Attente');

      // Fetch margin alerts
      const { count: marginAlerts } = await supabase
        .from('bons_livraison_reels')
        .select('*', { count: 'exact', head: true })
        .eq('alerte_ecart', true);

      // Calculate total volume
      const { data: volumeData } = await supabase
        .from('bons_livraison_reels')
        .select('volume_m3');

      const totalVolume = volumeData?.reduce((sum, d) => sum + (d.volume_m3 || 0), 0) || 0;

      setStats({
        totalDeliveries: totalDeliveries || 0,
        totalVolume,
        totalClients: totalClients || 0,
        pendingPayments: pendingPayments || 0,
        marginAlerts: marginAlerts || 0,
      });

      setRecentDeliveries(deliveries || []);

      // Generate alerts
      const newAlerts: Alert[] = [];
      if (marginAlerts && marginAlerts > 0) {
        newAlerts.push({
          id: 'margin-alert',
          type: 'critical',
          message: `${marginAlerts} bon(s) avec écart de marge > 5%`,
          timestamp: new Date().toISOString(),
        });
      }
      if (pendingPayments && pendingPayments > 5) {
        newAlerts.push({
          id: 'payment-alert',
          type: 'warning',
          message: `${pendingPayments} paiements en attente`,
          timestamp: new Date().toISOString(),
        });
      }
      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble des opérations Talmi Beton
          </p>
        </div>

        {/* Alerts */}
        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Livraisons"
            value={stats.totalDeliveries}
            subtitle="Ce mois"
            icon={Truck}
            trend="up"
            trendValue="+12%"
          />
          <KPICard
            title="Volume Total"
            value={`${stats.totalVolume.toFixed(0)} m³`}
            subtitle="Béton livré"
            icon={Package}
            trend="up"
            trendValue="+8%"
            variant="positive"
          />
          <KPICard
            title="Clients Actifs"
            value={stats.totalClients}
            subtitle="Dans la base"
            icon={Users}
          />
          <KPICard
            title="Paiements"
            value={stats.pendingPayments}
            subtitle="En attente"
            icon={DollarSign}
            variant={stats.pendingPayments > 10 ? 'warning' : 'default'}
          />
        </div>

        {/* Secondary KPIs for CEO/Accounting */}
        {(role === 'ceo' || role === 'accounting') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KPICard
              title="Alertes Marge"
              value={stats.marginAlerts}
              subtitle="Écarts > 5%"
              icon={AlertTriangle}
              variant={stats.marginAlerts > 0 ? 'negative' : 'positive'}
            />
            <KPICard
              title="Performance"
              value="94.2%"
              subtitle="Taux de conformité"
              icon={TrendingUp}
              trend="up"
              trendValue="+2.1%"
              variant="positive"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentDeliveries deliveries={recentDeliveries} loading={loading} />
          
          {/* Quick Actions / Summary Card */}
          <div className="card-industrial p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Résumé Production</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Formules actives</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Prix mis à jour</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Taux E/C moyen</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">CUR moyen</span>
                <span className="font-semibold">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
