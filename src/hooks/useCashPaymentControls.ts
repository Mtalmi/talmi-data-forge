import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SupplierCashTracking {
  id: string;
  fournisseur_id: string;
  fournisseur_nom: string;
  month_year: string;
  total_cash_amount: number;
  payment_count: number;
  limit_exceeded: boolean;
  penalty_incurred: number;
  stamp_duty_incurred: number;
  last_updated_at: string;
}

export interface CashPaymentStats {
  totalCashPaymentsThisMonth: number;
  totalPenaltiesThisMonth: number;
  totalStampDutyThisMonth: number;
  suppliersExceedingLimit: SupplierCashTracking[];
  potentialSavings: number;
}

export interface CashPaymentValidation {
  isAllowed: boolean;
  requiresBankTransfer: boolean;
  penaltyApplicable: boolean;
  penaltyAmount: number;
  stampDutyAmount: number;
  totalPenaltyCost: number;
  currentMonthlyTotal: number;
  newMonthlyTotal: number;
  cashLimit: number;
  excessAmount: number;
  warningMessage: string | null;
  blockingReason: string | null;
}

const CASH_LIMIT = 50000; // 50,000 DH per month per supplier

export function useCashPaymentControls() {
  const { isCeo, isSuperviseur } = useAuth();
  const [stats, setStats] = useState<CashPaymentStats>({
    totalCashPaymentsThisMonth: 0,
    totalPenaltiesThisMonth: 0,
    totalStampDutyThisMonth: 0,
    suppliersExceedingLimit: [],
    potentialSavings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<{ id: string; nom_fournisseur: string }[]>([]);

  const currentMonthYear = new Date().toISOString().slice(0, 7);

  const canOverride = isCeo || isSuperviseur;

  const fetchSuppliers = useCallback(async () => {
    const { data } = await supabase
      .from('fournisseurs')
      .select('id, nom_fournisseur')
      .eq('actif', true)
      .order('nom_fournisseur');
    
    if (data) setSuppliers(data);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Get all supplier cash tracking for current month
      const { data: trackingData } = await supabase
        .from('supplier_cash_tracking')
        .select('*')
        .eq('month_year', currentMonthYear);

      if (trackingData) {
        const totalCash = trackingData.reduce((sum, t) => sum + (t.total_cash_amount || 0), 0);
        const totalPenalties = trackingData.reduce((sum, t) => sum + (t.penalty_incurred || 0), 0);
        const totalStampDuty = trackingData.reduce((sum, t) => sum + (t.stamp_duty_incurred || 0), 0);
        const exceeding = trackingData.filter(t => t.limit_exceeded);

        setStats({
          totalCashPaymentsThisMonth: totalCash,
          totalPenaltiesThisMonth: totalPenalties,
          totalStampDutyThisMonth: totalStampDuty,
          suppliersExceedingLimit: exceeding as SupplierCashTracking[],
          potentialSavings: totalPenalties + totalStampDuty,
        });
      }
    } catch (error) {
      console.error('Error fetching cash payment stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonthYear]);

  useEffect(() => {
    fetchStats();
    fetchSuppliers();
  }, [fetchStats, fetchSuppliers]);

  const getSupplierMonthlyTotal = async (fournisseurId: string): Promise<number> => {
    const { data } = await supabase
      .from('supplier_cash_tracking')
      .select('total_cash_amount')
      .eq('fournisseur_id', fournisseurId)
      .eq('month_year', currentMonthYear)
      .single();
    
    return data?.total_cash_amount || 0;
  };

  const validateCashPayment = async (
    amount: number,
    fournisseurId: string | null
  ): Promise<CashPaymentValidation> => {
    const result: CashPaymentValidation = {
      isAllowed: true,
      requiresBankTransfer: false,
      penaltyApplicable: false,
      penaltyAmount: 0,
      stampDutyAmount: 0,
      totalPenaltyCost: 0,
      currentMonthlyTotal: 0,
      newMonthlyTotal: 0,
      cashLimit: CASH_LIMIT,
      excessAmount: 0,
      warningMessage: null,
      blockingReason: null,
    };

    // Rule 1: Payments > 50,000 DH MUST be bank transfer
    if (amount > 50000) {
      result.isAllowed = false;
      result.requiresBankTransfer = true;
      result.blockingReason = "⚠️ Paiements >50,000 DH doivent être par virement bancaire (Loi Marocaine)";
      return result;
    }

    if (!fournisseurId) {
      // No supplier selected, can't check limits
      if (amount >= 10000) {
        result.warningMessage = "⚠️ Paiement en espèces: Risque de pénalité 6% si >50,000 DH/mois/fournisseur";
      }
      return result;
    }

    // Get current monthly total for this supplier
    const currentTotal = await getSupplierMonthlyTotal(fournisseurId);
    result.currentMonthlyTotal = currentTotal;
    result.newMonthlyTotal = currentTotal + amount;

    // Check if limit would be exceeded
    if (result.newMonthlyTotal > CASH_LIMIT) {
      result.penaltyApplicable = true;
      result.excessAmount = result.newMonthlyTotal - CASH_LIMIT;
      result.penaltyAmount = result.excessAmount * 0.06; // 6% penalty
      result.stampDutyAmount = result.excessAmount * 0.0025; // 0.25% stamp duty
      result.totalPenaltyCost = result.penaltyAmount + result.stampDutyAmount;
      result.isAllowed = false; // Block by default, requires override
      result.blockingReason = `⚠️ Dépassement de la limite de 50,000 DH/mois. Pénalité: ${result.penaltyAmount.toFixed(2)} DH`;
    }

    // Warning when approaching limit (40,000 DH)
    if (currentTotal >= 40000 && currentTotal < CASH_LIMIT) {
      result.warningMessage = `⚠️ Approche de la limite 50,000 DH. Cumul actuel: ${currentTotal.toLocaleString('fr-FR')} DH`;
    }

    // Rule 2: Payments 10,000-50,000 DH - show warning
    if (amount >= 10000 && amount <= 50000 && !result.penaltyApplicable) {
      result.warningMessage = "⚠️ Paiement en espèces: Risque de pénalité 6% si >50,000 DH/mois/fournisseur";
    }

    return result;
  };

  const recordCashPaymentWithOverride = async (
    expenseId: string,
    fournisseurId: string,
    fournisseurNom: string,
    overrideReason: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('expenses_controlled')
        .update({
          fournisseur_id: fournisseurId,
          fournisseur_nom: fournisseurNom,
          cash_limit_override_by: user.id,
          cash_limit_override_reason: overrideReason,
          cash_limit_override_at: new Date().toISOString(),
        })
        .eq('id', expenseId);

      if (error) throw error;

      await fetchStats();
      return true;
    } catch (error) {
      console.error('Error recording cash payment override:', error);
      return false;
    }
  };

  return {
    stats,
    loading,
    suppliers,
    canOverride,
    validateCashPayment,
    recordCashPaymentWithOverride,
    refresh: fetchStats,
    CASH_LIMIT,
  };
}
