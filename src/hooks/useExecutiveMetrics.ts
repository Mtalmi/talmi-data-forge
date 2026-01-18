import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExecutiveMetrics {
  leakageRate: number;
  cashCreditRatio: number;
  qualityIndex: number;
  // Detailed stats
  totalDeliveries: number;
  leakageDeliveries: number;
  cashPayments: number;
  creditPayments: number;
  totalTests: number;
  conformTests: number;
  nonConformTests: number;
  pendingRecovery: number;
}

export function useExecutiveMetrics() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics>({
    leakageRate: 0,
    cashCreditRatio: 100,
    qualityIndex: 100,
    totalDeliveries: 0,
    leakageDeliveries: 0,
    cashPayments: 0,
    creditPayments: 0,
    totalTests: 0,
    conformTests: 0,
    nonConformTests: 0,
    pendingRecovery: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      // Get date range for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Fetch deliveries for leakage calculation
      const { data: deliveries, error: delError } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, alerte_ecart, statut_paiement, cur_reel, prix_vente_m3, marge_brute_pct')
        .gte('date_livraison', startOfMonth.split('T')[0]);

      if (delError) throw delError;

      // Calculate leakage rate (deliveries with margin alerts or negative deviation)
      const totalDeliveries = deliveries?.length || 0;
      const leakageDeliveries = deliveries?.filter(d => 
        d.alerte_ecart === true || 
        (d.marge_brute_pct !== null && d.marge_brute_pct < 15)
      ).length || 0;
      const leakageRate = totalDeliveries > 0 
        ? (leakageDeliveries / totalDeliveries) * 100 
        : 0;

      // Calculate cash/credit ratio
      const cashPayments = deliveries?.filter(d => d.statut_paiement === 'Payé').length || 0;
      const creditPayments = deliveries?.filter(d => d.statut_paiement !== 'Payé').length || 0;
      const cashCreditRatio = totalDeliveries > 0 
        ? (cashPayments / totalDeliveries) * 100 
        : 100;

      // Fetch lab tests for quality index
      const { data: tests, error: testError } = await supabase
        .from('tests_laboratoire')
        .select('id, resistance_conforme, affaissement_conforme, alerte_qualite')
        .gte('date_prelevement', startOfMonth.split('T')[0]);

      if (testError) throw testError;

      const totalTests = tests?.length || 0;
      const nonConformTests = tests?.filter(t => 
        t.alerte_qualite === true || 
        t.resistance_conforme === false ||
        t.affaissement_conforme === false
      ).length || 0;
      const conformTests = totalTests - nonConformTests;
      const qualityIndex = totalTests > 0 
        ? (conformTests / totalTests) * 100 
        : 100;

      // Fetch pending recovery amount
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('solde_du')
        .gt('solde_du', 0);

      if (clientError) throw clientError;

      const pendingRecovery = clients?.reduce((sum, c) => sum + (c.solde_du || 0), 0) || 0;

      setMetrics({
        leakageRate,
        cashCreditRatio,
        qualityIndex,
        totalDeliveries,
        leakageDeliveries,
        cashPayments,
        creditPayments,
        totalTests,
        conformTests,
        nonConformTests,
        pendingRecovery,
      });
    } catch (error) {
      console.error('Error fetching executive metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    refresh: fetchMetrics,
  };
}
