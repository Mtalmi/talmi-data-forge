import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addDays, differenceInDays, format, startOfMonth, endOfMonth } from 'date-fns';

import { toast } from 'sonner';

export type ObligationType = 'cnss' | 'mutuelle' | 'ir' | 'tva' | 'timbre' | 'patente' | 'taxe_professionnelle' | 'other';
export type ObligationFrequency = 'monthly' | 'quarterly' | 'annual' | 'one_time';
export type ObligationStatus = 'pending' | 'paid' | 'overdue' | 'partially_paid';

export interface TaxObligation {
  id: string;
  obligation_type: ObligationType;
  name: string;
  description: string | null;
  frequency: ObligationFrequency;
  amount: number;
  due_day: number;
  period_month: number | null;
  period_quarter: number | null;
  period_year: number;
  due_date: string;
  status: ObligationStatus;
  paid_amount: number;
  paid_date: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  payment_proof_url: string | null;
  penalty_amount: number;
  days_overdue: number;
  reminder_30_sent: boolean;
  reminder_7_sent: boolean;
  reminder_1_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSummary {
  totalObligations: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  partialCount: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  totalPenalties: number;
  complianceRate: number;
}

export interface ObligationsByType {
  type: ObligationType;
  label: string;
  totalCount: number;
  paidCount: number;
  overdueCount: number;
  totalAmount: number;
  totalPenalties: number;
}

const OBLIGATION_LABELS: Record<ObligationType, string> = {
  cnss: 'CNSS (Sécurité Sociale)',
  mutuelle: 'Mutuelles (Assurance)',
  ir: 'IR (Impôt sur le Revenu)',
  tva: 'TVA',
  timbre: 'Droits de Timbre',
  patente: 'Patente',
  taxe_professionnelle: 'Taxe Professionnelle',
  other: 'Autres Crédits Fiscaux',
};

const PENALTY_RATE = 0.06; // 6% per month

export function useTaxCompliance(year?: number) {
  const [obligations, setObligations] = useState<TaxObligation[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary>({
    totalObligations: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    partialCount: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalPenalties: 0,
    complianceRate: 0,
  });
  const [byType, setByType] = useState<ObligationsByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObligations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('tax_obligations')
        .select('*')
        .order('due_date', { ascending: true });

      if (year) {
        query = query.eq('period_year', year);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const obligationsData = (data || []) as TaxObligation[];
      setObligations(obligationsData);

      // Calculate summary
      const paidCount = obligationsData.filter(o => o.status === 'paid').length;
      const pendingCount = obligationsData.filter(o => o.status === 'pending').length;
      const overdueCount = obligationsData.filter(o => o.status === 'overdue').length;
      const partialCount = obligationsData.filter(o => o.status === 'partially_paid').length;

      const totalAmount = obligationsData.reduce((sum, o) => sum + Number(o.amount), 0);
      const totalPaid = obligationsData.reduce((sum, o) => sum + Number(o.paid_amount), 0);
      const totalOutstanding = obligationsData
        .filter(o => o.status !== 'paid')
        .reduce((sum, o) => sum + (Number(o.amount) - Number(o.paid_amount)), 0);
      const totalPenalties = obligationsData.reduce((sum, o) => sum + Number(o.penalty_amount), 0);

      setSummary({
        totalObligations: obligationsData.length,
        paidCount,
        pendingCount,
        overdueCount,
        partialCount,
        totalAmount,
        totalPaid,
        totalOutstanding,
        totalPenalties,
        complianceRate: obligationsData.length > 0 ? (paidCount / obligationsData.length) * 100 : 0,
      });

      // Calculate by type
      const typeMap = new Map<ObligationType, ObligationsByType>();
      
      obligationsData.forEach(o => {
        const existing = typeMap.get(o.obligation_type) || {
          type: o.obligation_type,
          label: OBLIGATION_LABELS[o.obligation_type],
          totalCount: 0,
          paidCount: 0,
          overdueCount: 0,
          totalAmount: 0,
          totalPenalties: 0,
        };

        existing.totalCount++;
        if (o.status === 'paid') existing.paidCount++;
        if (o.status === 'overdue') existing.overdueCount++;
        existing.totalAmount += Number(o.amount);
        existing.totalPenalties += Number(o.penalty_amount);

        typeMap.set(o.obligation_type, existing);
      });

      setByType(Array.from(typeMap.values()));

    } catch (err) {
      console.error('Error fetching tax obligations:', err);
      setError('Erreur lors du chargement des obligations fiscales');
    } finally {
      setLoading(false);
    }
  }, [year]);

  const getUpcomingObligations = useCallback((days: number = 30) => {
    const today = new Date();
    const futureDate = addDays(today, days);
    
    return obligations.filter(o => {
      const dueDate = new Date(o.due_date);
      return o.status !== 'paid' && dueDate >= today && dueDate <= futureDate;
    });
  }, [obligations]);

  const getOverdueObligations = useCallback(() => {
    return obligations.filter(o => o.status === 'overdue');
  }, [obligations]);

  const calculatePenalty = useCallback((amount: number, dueDate: string, paymentDate?: string) => {
    const due = new Date(dueDate);
    const payment = paymentDate ? new Date(paymentDate) : new Date();
    
    if (payment <= due) return 0;
    
    const daysLate = differenceInDays(payment, due);
    const penalty = amount * PENALTY_RATE * (daysLate / 30);
    
    return Math.round(penalty * 100) / 100;
  }, []);

  const recordPayment = useCallback(async (
    obligationId: string,
    paymentData: {
      paidAmount: number;
      paidDate: string;
      paymentReference: string;
      paymentMethod: string;
      paymentProofUrl?: string;
      notes?: string;
    }
  ) => {
    try {
      const obligation = obligations.find(o => o.id === obligationId);
      if (!obligation) throw new Error('Obligation non trouvée');

      const totalPaid = Number(obligation.paid_amount) + paymentData.paidAmount;
      const newStatus: ObligationStatus = totalPaid >= Number(obligation.amount) ? 'paid' : 'partially_paid';

      const { error } = await supabase
        .from('tax_obligations')
        .update({
          paid_amount: totalPaid,
          paid_date: paymentData.paidDate,
          payment_reference: paymentData.paymentReference,
          payment_method: paymentData.paymentMethod,
          payment_proof_url: paymentData.paymentProofUrl,
          status: newStatus,
          notes: paymentData.notes,
        })
        .eq('id', obligationId);

      if (error) throw error;

      toast.success('Paiement enregistré avec succès');
      await fetchObligations();
      return true;
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error('Erreur lors de l\'enregistrement du paiement');
      return false;
    }
  }, [obligations, fetchObligations]);

  const createObligation = useCallback(async (
    data: Omit<TaxObligation, 'id' | 'status' | 'paid_amount' | 'penalty_amount' | 'days_overdue' | 'created_at' | 'updated_at' | 'reminder_30_sent' | 'reminder_7_sent' | 'reminder_1_sent'>
  ) => {
    try {
      const { error } = await supabase
        .from('tax_obligations')
        .insert([data]);

      if (error) throw error;

      toast.success('Obligation créée avec succès');
      await fetchObligations();
      return true;
    } catch (err) {
      console.error('Error creating obligation:', err);
      toast.error('Erreur lors de la création de l\'obligation');
      return false;
    }
  }, [fetchObligations]);

  const getObligationsByMonth = useCallback((month: number, targetYear?: number) => {
    const y = targetYear || year || new Date().getFullYear();
    return obligations.filter(o => {
      const dueDate = new Date(o.due_date);
      return dueDate.getMonth() + 1 === month && dueDate.getFullYear() === y;
    });
  }, [obligations, year]);

  const getCalendarData = useCallback(() => {
    const calendarData: Record<string, TaxObligation[]> = {};
    
    obligations.forEach(o => {
      const dateKey = o.due_date;
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(o);
    });

    return calendarData;
  }, [obligations]);

  const getArrears = useCallback(() => {
    return obligations.filter(o => 
      o.status === 'overdue' && 
      o.period_year < new Date().getFullYear()
    );
  }, [obligations]);

  const getTotalArrears = useCallback(() => {
    const arrears = getArrears();
    return arrears.reduce((sum, o) => sum + (Number(o.amount) - Number(o.paid_amount)), 0);
  }, [getArrears]);

  useEffect(() => {
    fetchObligations();
  }, [fetchObligations]);

  return {
    obligations,
    summary,
    byType,
    loading,
    error,
    refetch: fetchObligations,
    getUpcomingObligations,
    getOverdueObligations,
    calculatePenalty,
    recordPayment,
    createObligation,
    getObligationsByMonth,
    getCalendarData,
    getArrears,
    getTotalArrears,
    OBLIGATION_LABELS,
  };
}
