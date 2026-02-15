import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns';


export interface DashboardStats {
  // Main KPIs
  totalDeliveries: number;
  totalVolume: number;
  totalClients: number;
  pendingPaymentsTotal: number;
  pendingPaymentsCount: number;
  marginAlerts: number;
  
  // Calculated KPIs
  curMoyen7j: number;
  tauxECMoyen: number;
  
  // Trends (vs previous period)
  deliveriesTrend: number;
  volumeTrend: number;
  clientsTrend: number;
  curTrend: number;
  
  // Alerts
  alerts: DashboardAlert[];
}

export interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDeliveries: 0,
    totalVolume: 0,
    totalClients: 0,
    pendingPaymentsTotal: 0,
    pendingPaymentsCount: 0,
    marginAlerts: 0,
    curMoyen7j: 0,
    tauxECMoyen: 0,
    deliveriesTrend: 0,
    volumeTrend: 0,
    clientsTrend: 0,
    curTrend: 0,
    alerts: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const sevenDaysAgo = subDays(now, 7);
      const fourteenDaysAgo = subDays(now, 14);

      // Fetch current month deliveries (status = Livré or any delivered)
      const { data: currentDeliveries, error: currentError } = await supabase
        .from('bons_livraison_reels')
        .select('*')
        .gte('date_livraison', format(currentMonthStart, 'yyyy-MM-dd'))
        .lte('date_livraison', format(currentMonthEnd, 'yyyy-MM-dd'));

      if (currentError) throw currentError;

      // Fetch last month deliveries for comparison
      const { data: lastDeliveries, error: lastError } = await supabase
        .from('bons_livraison_reels')
        .select('volume_m3, client_id')
        .gte('date_livraison', format(lastMonthStart, 'yyyy-MM-dd'))
        .lte('date_livraison', format(lastMonthEnd, 'yyyy-MM-dd'));

      if (lastError) throw lastError;

      // Fetch 7-day data for CUR calculation
      const { data: sevenDayData, error: sevenDayError } = await supabase
        .from('bons_livraison_reels')
        .select('cur_reel, eau_reel_l, ciment_reel_kg, volume_m3')
        .gte('date_livraison', format(sevenDaysAgo, 'yyyy-MM-dd'))
        .not('cur_reel', 'is', null);

      if (sevenDayError) throw sevenDayError;

      // Fetch 14-7 day data for CUR trend
      const { data: prevSevenDayData, error: prevSevenDayError } = await supabase
        .from('bons_livraison_reels')
        .select('cur_reel')
        .gte('date_livraison', format(fourteenDaysAgo, 'yyyy-MM-dd'))
        .lt('date_livraison', format(sevenDaysAgo, 'yyyy-MM-dd'))
        .not('cur_reel', 'is', null);

      if (prevSevenDayError) throw prevSevenDayError;

      // Fetch clients with payment delays (Retard status)
      const { data: clientsWithDelay, error: clientError } = await supabase
        .from('clients')
        .select('client_id, nom_client, solde_du')
        .gt('solde_du', 0);

      if (clientError) throw clientError;

      // Fetch margin alerts
      const { count: marginAlerts } = await supabase
        .from('bons_livraison_reels')
        .select('*', { count: 'exact', head: true })
        .eq('alerte_ecart', true);

      // Calculate KPIs
      const deliveredBons = currentDeliveries?.filter(b => 
        b.workflow_status === 'livre' || b.workflow_status === 'facture'
      ) || currentDeliveries || [];

      const totalDeliveries = deliveredBons.length;
      const totalVolume = deliveredBons.reduce((sum, b) => sum + (b.volume_m3 || 0), 0);
      const uniqueClients = new Set(deliveredBons.map(b => b.client_id)).size;

      // Last month calculations
      const lastDeliveriesCount = lastDeliveries?.length || 0;
      const lastVolume = lastDeliveries?.reduce((sum, b) => sum + (b.volume_m3 || 0), 0) || 0;
      const lastUniqueClients = new Set(lastDeliveries?.map(b => b.client_id) || []).size;

      // Trends
      const deliveriesTrend = lastDeliveriesCount > 0 
        ? ((totalDeliveries - lastDeliveriesCount) / lastDeliveriesCount) * 100 
        : 0;
      const volumeTrend = lastVolume > 0 
        ? ((totalVolume - lastVolume) / lastVolume) * 100 
        : 0;
      const clientsTrend = lastUniqueClients > 0 
        ? ((uniqueClients - lastUniqueClients) / lastUniqueClients) * 100 
        : 0;

      // CUR Moyen (7 days) - only from validated BLs (livre or facture)
      const validatedBLs = sevenDayData?.filter(d => d.cur_reel && d.cur_reel > 0) || [];
      const curMoyen7j = validatedBLs.length > 0 
        ? validatedBLs.reduce((sum, d) => sum + (d.cur_reel || 0), 0) / validatedBLs.length 
        : 0;

      // Previous 7-day CUR for trend
      const prevCurValues = prevSevenDayData?.filter(d => d.cur_reel) || [];
      const prevCurMoyen = prevCurValues.length > 0 
        ? prevCurValues.reduce((sum, d) => sum + (d.cur_reel || 0), 0) / prevCurValues.length 
        : 0;
      const curTrend = prevCurMoyen > 0 
        ? ((curMoyen7j - prevCurMoyen) / prevCurMoyen) * 100 
        : 0;

      // E/C Ratio (all deliveries with data)
      const ecData = currentDeliveries?.filter(d => d.eau_reel_l && d.ciment_reel_kg && d.ciment_reel_kg > 0) || [];
      const tauxECMoyen = ecData.length > 0 
        ? ecData.reduce((sum, d) => sum + ((d.eau_reel_l || 0) / (d.ciment_reel_kg || 1)), 0) / ecData.length 
        : 0;

      // Pending payments
      const pendingPaymentsTotal = clientsWithDelay?.reduce((sum, c) => sum + (c.solde_du || 0), 0) || 0;
      const pendingPaymentsCount = currentDeliveries?.filter(b => b.statut_paiement === 'En Attente' || b.statut_paiement === 'Retard').length || 0;

      // Generate CEO alerts
      const alerts: DashboardAlert[] = [];

      // Alert: Deliveries down > 20%
      if (deliveriesTrend < -20) {
        alerts.push({
          id: 'deliveries-down',
          type: 'critical',
          title: 'Baisse des Livraisons',
          message: `Les livraisons sont en baisse de ${Math.abs(deliveriesTrend).toFixed(0)}% ce mois-ci`,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert: Volume down > 15%
      if (volumeTrend < -15) {
        alerts.push({
          id: 'volume-down',
          type: 'critical',
          title: 'Baisse du Volume',
          message: `Le volume total est en baisse de ${Math.abs(volumeTrend).toFixed(0)}% ce mois-ci`,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert: Clients down > 10%
      if (clientsTrend < -10) {
        alerts.push({
          id: 'clients-down',
          type: 'warning',
          title: 'Perte de Clients Actifs',
          message: `Les clients actifs sont en baisse de ${Math.abs(clientsTrend).toFixed(0)}%`,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert: Pending payments > 100,000 DH
      if (pendingPaymentsTotal > 100000) {
        alerts.push({
          id: 'payments-overdue',
          type: 'critical',
          title: 'Retards de Paiement Critiques',
          message: `Total des paiements en retard: ${pendingPaymentsTotal.toLocaleString()} DH`,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert: CUR increase > 5% without price increase
      if (curTrend > 5) {
        alerts.push({
          id: 'cur-increase',
          type: 'warning',
          title: 'Augmentation CUR',
          message: `Le CUR moyen a augmenté de ${curTrend.toFixed(1)}% sur 7 jours`,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert: E/C ratio > 0.55
      if (tauxECMoyen > 0.55) {
        alerts.push({
          id: 'ec-ratio-high',
          type: 'warning',
          title: 'Taux E/C Élevé',
          message: `Le taux E/C moyen (${tauxECMoyen.toFixed(3)}) dépasse 0.55 - possible dilution`,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert: Margin alerts
      if (marginAlerts && marginAlerts > 0) {
        alerts.push({
          id: 'margin-alerts',
          type: 'critical',
          title: 'Alertes Marge (Fuite)',
          message: `${marginAlerts} bon(s) avec écart de marge > 5%`,
          timestamp: new Date().toISOString(),
        });
      }

      setStats({
        totalDeliveries,
        totalVolume,
        totalClients: uniqueClients,
        pendingPaymentsTotal,
        pendingPaymentsCount,
        marginAlerts: marginAlerts || 0,
        curMoyen7j,
        tauxECMoyen,
        deliveriesTrend,
        volumeTrend,
        clientsTrend,
        curTrend,
        alerts,
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    // Realtime subscriptions for live KPI updates
    const channel = supabase
      .channel('dashboard-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_commande' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devis' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchStats())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
