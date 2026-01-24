import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExecutiveMetrics {
  leakageRate: number;
  materialVariancePct: number;  // NEW: Actual Material Variance %
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
  // Material variance details
  totalTheoreticalMaterial: number;
  totalActualMaterial: number;
  varianceStatus: 'green' | 'yellow' | 'red';
}

export function useExecutiveMetrics() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics>({
    leakageRate: 0,
    materialVariancePct: 0,
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
    totalTheoreticalMaterial: 0,
    totalActualMaterial: 0,
    varianceStatus: 'green',
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      // Get date range for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch deliveries with real consumption data for material variance
      const { data: deliveries, error: delError } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id, 
          alerte_ecart, 
          statut_paiement, 
          cur_reel, 
          prix_vente_m3, 
          marge_brute_pct,
          volume_m3,
          ciment_reel_kg,
          adjuvant_reel_l,
          eau_reel_l,
          formule_id
        `)
        .gte('date_livraison', startOfMonth.split('T')[0]);

      if (delError) throw delError;

      // Fetch theoretical formulas for comparison
      const { data: formulas, error: formulaError } = await supabase
        .from('formules_theoriques')
        .select('formule_id, ciment_kg_m3, adjuvant_l_m3, eau_l_m3');

      if (formulaError) throw formulaError;

      // Create formula lookup map
      const formulaMap = new Map(formulas?.map(f => [f.formule_id, f]) || []);

      // Calculate MATERIAL VARIANCE using formula: (Actual - Theoretical) / Theoretical
      let totalTheoMaterial = 0;
      let totalActualMaterial = 0;
      let leakageCount = 0;

      deliveries?.forEach(d => {
        const formula = formulaMap.get(d.formule_id);
        if (formula && d.volume_m3) {
          // Calculate theoretical material (in kg equivalent for normalization)
          const theoCiment = (formula.ciment_kg_m3 || 0) * d.volume_m3;
          const theoAdjuvant = (formula.adjuvant_l_m3 || 0) * d.volume_m3 * 1.2; // L to kg approx
          const theoEau = (formula.eau_l_m3 || 0) * d.volume_m3; // L = kg for water
          const theoTotal = theoCiment + theoAdjuvant + theoEau;

          // Calculate actual material used
          const actualCiment = d.ciment_reel_kg || theoCiment;
          const actualAdjuvant = (d.adjuvant_reel_l || (formula.adjuvant_l_m3 || 0) * d.volume_m3) * 1.2;
          const actualEau = d.eau_reel_l || theoEau;
          const actualTotal = actualCiment + actualAdjuvant + actualEau;

          totalTheoMaterial += theoTotal;
          totalActualMaterial += actualTotal;
        }

        // Also count margin-based leakages
        if (d.alerte_ecart === true || (d.marge_brute_pct !== null && d.marge_brute_pct < 15)) {
          leakageCount++;
        }
      });

      // Calculate material variance percentage
      const materialVariancePct = totalTheoMaterial > 0 
        ? ((totalActualMaterial - totalTheoMaterial) / totalTheoMaterial) * 100 
        : 0;

      // Determine variance status (for color coding)
      let varianceStatus: 'green' | 'yellow' | 'red' = 'green';
      if (materialVariancePct > 7) {
        varianceStatus = 'red';
      } else if (materialVariancePct > 3) {
        varianceStatus = 'yellow';
      }

      const totalDeliveries = deliveries?.length || 0;
      const leakageDeliveries = leakageCount;
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
        materialVariancePct,
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
        totalTheoreticalMaterial: totalTheoMaterial,
        totalActualMaterial: totalActualMaterial,
        varianceStatus,
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
