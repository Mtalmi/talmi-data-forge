import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CashDeposit {
  id: string;
  reference: string;
  amount: number;
  source_type: string;
  source_description: string | null;
  client_id: string | null;
  facture_id: string | null;
  deposit_date: string;
  receipt_photo_url: string;
  notes: string | null;
  justification_status: string | null;
  matched_invoice_amount: number | null;
  match_variance_pct: number | null;
  pattern_flags: any[];
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  bank_reference: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface MonthlyDepositSummary {
  month: string;
  total_deposits: number;
  total_amount: number;
  justified_count: number;
  justified_amount: number;
  unjustified_count: number;
  unjustified_amount: number;
  flagged_count: number;
  flagged_amount: number;
  justification_rate: number;
}

interface PatternAlert {
  id: string;
  alert_type: string;
  alert_date: string;
  deposit_ids: string[];
  total_amount: number;
  details: any;
  risk_level: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface DepositStats {
  totalDepositsThisMonth: number;
  totalAmountThisMonth: number;
  justifiedAmount: number;
  unjustifiedAmount: number;
  justificationRate: number;
  pendingReview: number;
  flaggedDeposits: CashDeposit[];
  patternAlerts: PatternAlert[];
}

interface Invoice {
  facture_id: string;
  client_id: string;
  total_ttc: number;
  statut: string;
  date_facture: string;
}

export function useCashDeposits() {
  const { user, isCeo, isSuperviseur } = useAuth();
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [stats, setStats] = useState<DepositStats>({
    totalDepositsThisMonth: 0,
    totalAmountThisMonth: 0,
    justifiedAmount: 0,
    unjustifiedAmount: 0,
    justificationRate: 0,
    pendingReview: 0,
    flaggedDeposits: [],
    patternAlerts: [],
  });
  const [monthlySummary, setMonthlySummary] = useState<MonthlyDepositSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const canApprove = isCeo || isSuperviseur;

  const fetchDeposits = useCallback(async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch deposits for current month
      const { data: depositsData, error } = await supabase
        .from('cash_deposits')
        .select('*')
        .gte('deposit_date', startOfMonth.toISOString().split('T')[0])
        .order('deposit_date', { ascending: false });

      if (error) throw error;

      const typedDeposits = (depositsData || []) as CashDeposit[];
      setDeposits(typedDeposits);

      // Calculate stats
      const totalAmount = typedDeposits.reduce((sum, d) => sum + d.amount, 0);
      const justifiedDeposits = typedDeposits.filter(d => d.justification_status === 'justified');
      const unjustifiedDeposits = typedDeposits.filter(d => 
        d.justification_status === 'unjustified' || d.justification_status === 'pending'
      );
      const flaggedDeposits = typedDeposits.filter(d => d.justification_status === 'flagged');
      const pendingDeposits = typedDeposits.filter(d => d.justification_status === 'pending');

      // Fetch pattern alerts
      const { data: alertsData } = await supabase
        .from('deposit_pattern_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      setStats({
        totalDepositsThisMonth: typedDeposits.length,
        totalAmountThisMonth: totalAmount,
        justifiedAmount: justifiedDeposits.reduce((sum, d) => sum + d.amount, 0),
        unjustifiedAmount: unjustifiedDeposits.reduce((sum, d) => sum + d.amount, 0),
        justificationRate: typedDeposits.length > 0 
          ? Math.round((justifiedDeposits.length / typedDeposits.length) * 100) 
          : 100,
        pendingReview: pendingDeposits.length,
        flaggedDeposits,
        patternAlerts: (alertsData || []) as PatternAlert[],
      });

    } catch (error) {
      console.error('[CASH_DEPOSITS] Error fetching deposits:', error);
    }
  }, []);

  const fetchMonthlySummary = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_deposit_summary')
        .select('*')
        .order('month', { ascending: false })
        .limit(12);

      if (error) throw error;
      setMonthlySummary((data || []) as MonthlyDepositSummary[]);
    } catch (error) {
      console.error('[CASH_DEPOSITS] Error fetching monthly summary:', error);
    }
  }, []);

  const fetchUnpaidInvoices = useCallback(async (clientId: string): Promise<Invoice[]> => {
    try {
      // Use any to avoid deep type instantiation issues
      const { data, error } = await supabase
        .from('factures')
        .select('facture_id, client_id, total_ttc, statut, date_facture')
        .eq('client_id', clientId)
        .neq('statut', 'Payé')
        .order('date_facture', { ascending: false }) as { data: any[] | null; error: any };

      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        facture_id: row.facture_id,
        client_id: row.client_id,
        total_ttc: row.total_ttc,
        statut: row.statut,
        date_facture: row.date_facture,
      }));
    } catch (error) {
      console.error('[CASH_DEPOSITS] Error fetching invoices:', error);
      return [];
    }
  }, []);

  const matchDepositToInvoice = useCallback(async (depositId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('match_deposit_to_invoice', { deposit_id: depositId });

      if (error) throw error;
      await fetchDeposits();
      return data;
    } catch (error) {
      console.error('[CASH_DEPOSITS] Error matching deposit:', error);
      return { matched: false, error: 'Match failed' };
    }
  }, [fetchDeposits]);

  const detectPatterns = useCallback(async (checkDate?: string) => {
    try {
      const { data, error } = await supabase
        .rpc('detect_deposit_patterns', { 
          check_date: checkDate || new Date().toISOString().split('T')[0] 
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[CASH_DEPOSITS] Error detecting patterns:', error);
      return [];
    }
  }, []);

  const approveDeposit = useCallback(async (depositId: string, notes?: string) => {
    if (!canApprove) {
      console.error('[CASH_DEPOSITS] Unauthorized approval attempt');
      return false;
    }

    try {
      const { error } = await supabase
        .from('cash_deposits')
        .update({
          justification_status: 'justified',
          approved_by: user?.id,
          approved_by_name: user?.email,
          approved_at: new Date().toISOString(),
          notes: notes || undefined,
        })
        .eq('id', depositId);

      if (error) throw error;
      await fetchDeposits();
      return true;
    } catch (error) {
      console.error('[CASH_DEPOSITS] Error approving deposit:', error);
      return false;
    }
  }, [user, canApprove, fetchDeposits]);

  const flagDeposit = useCallback(async (depositId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('cash_deposits')
        .update({
          justification_status: 'flagged',
          notes: reason,
        })
        .eq('id', depositId);

      if (error) throw error;
      await fetchDeposits();
      return true;
    } catch (error) {
      console.error('[CASH_DEPOSITS] Error flagging deposit:', error);
      return false;
    }
  }, [fetchDeposits]);

  const resolvePatternAlert = useCallback(async (alertId: string, notes: string) => {
    if (!canApprove) return false;

    try {
      const { error } = await supabase
        .from('deposit_pattern_alerts')
        .update({
          resolved: true,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchDeposits();
      return true;
    } catch (error) {
      console.error('[CASH_DEPOSITS] Error resolving alert:', error);
      return false;
    }
  }, [user, canApprove, fetchDeposits]);

  // Calculate risk indicators
  const getRiskIndicators = useCallback(() => {
    const indicators = [];

    // Multiple same-day deposits
    const depositsByDate = deposits.reduce((acc, d) => {
      const date = d.deposit_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(d);
      return acc;
    }, {} as Record<string, CashDeposit[]>);

    Object.entries(depositsByDate).forEach(([date, dayDeposits]) => {
      if (dayDeposits.length >= 3) {
        indicators.push({
          type: 'multiple_same_day',
          risk: dayDeposits.length >= 5 ? 'high' : 'medium',
          message: `${dayDeposits.length} dépôts le ${date}`,
          amount: dayDeposits.reduce((sum, d) => sum + d.amount, 0),
          deposits: dayDeposits,
        });
      }
    });

    // Round number deposits
    const roundDeposits = deposits.filter(d => 
      d.amount >= 5000 && d.amount % 1000 === 0
    );
    if (roundDeposits.length >= 3) {
      indicators.push({
        type: 'round_numbers',
        risk: 'medium',
        message: `${roundDeposits.length} dépôts avec montants ronds`,
        amount: roundDeposits.reduce((sum, d) => sum + d.amount, 0),
        deposits: roundDeposits,
      });
    }

    // Large undocumented deposits
    const largeUndocumented = deposits.filter(d => 
      d.amount >= 50000 && 
      (d.source_type === 'other' || !d.source_description) &&
      d.justification_status !== 'justified'
    );
    if (largeUndocumented.length > 0) {
      indicators.push({
        type: 'large_undocumented',
        risk: 'critical',
        message: `${largeUndocumented.length} gros dépôt(s) non justifié(s)`,
        amount: largeUndocumented.reduce((sum, d) => sum + d.amount, 0),
        deposits: largeUndocumented,
      });
    }

    // No source deposits
    const noSourceDeposits = deposits.filter(d => 
      d.source_type === 'other' && !d.source_description &&
      d.justification_status !== 'justified'
    );
    if (noSourceDeposits.length >= 5) {
      indicators.push({
        type: 'frequent_no_source',
        risk: 'high',
        message: `${noSourceDeposits.length} dépôts sans source claire`,
        amount: noSourceDeposits.reduce((sum, d) => sum + d.amount, 0),
        deposits: noSourceDeposits,
      });
    }

    return indicators;
  }, [deposits]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDeposits(), fetchMonthlySummary()]);
      setLoading(false);
    };
    loadData();
  }, [fetchDeposits, fetchMonthlySummary]);

  return {
    deposits,
    stats,
    monthlySummary,
    loading,
    canApprove,
    refresh: fetchDeposits,
    fetchUnpaidInvoices,
    matchDepositToInvoice,
    detectPatterns,
    approveDeposit,
    flagDeposit,
    resolvePatternAlert,
    getRiskIndicators,
  };
}
