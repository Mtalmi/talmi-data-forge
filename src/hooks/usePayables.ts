import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, addDays } from 'date-fns';
import { toast } from 'sonner';

export interface Payable {
  id: string;
  fournisseur_id: string;
  fournisseur_name: string;
  fournisseur_email?: string;
  fournisseur_phone?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  days_until_due: number;
  days_overdue: number;
  status: 'not_due' | 'due_soon' | 'due_today' | 'overdue' | 'paid';
  achat_id?: string;
  payment_terms?: string;
}

export interface PaymentSchedule {
  id: string;
  fournisseur_id: string;
  fournisseur_name: string;
  facture_id: string;
  amount: number;
  scheduled_date: string;
  payment_method?: string;
  status: 'pending' | 'scheduled' | 'executed' | 'failed' | 'cancelled';
  executed_date?: string;
  reference_number?: string;
}

export interface AgingBucket {
  bucket: string;
  bucket_order: number;
  invoice_count: number;
  total_amount: number;
  percentage: number;
}

export interface PayablesStats {
  totalOutstanding: number;
  totalDueSoon: number;
  totalOverdue: number;
  totalPaid: number;
  paymentRate: number;
  dpoAverage: number;
  suppliersWithOverdue: number;
  scheduledPayments: number;
  agingBuckets: AgingBucket[];
}

export function usePayables() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [stats, setStats] = useState<PayablesStats>({
    totalOutstanding: 0,
    totalDueSoon: 0,
    totalOverdue: 0,
    totalPaid: 0,
    paymentRate: 0,
    dpoAverage: 0,
    suppliersWithOverdue: 0,
    scheduledPayments: 0,
    agingBuckets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPayableStatus = (daysUntilDue: number, isPaid: boolean): Payable['status'] => {
    if (isPaid) return 'paid';
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue === 0) return 'due_today';
    if (daysUntilDue <= 7) return 'due_soon';
    return 'not_due';
  };

  const fetchPayables = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch supplier invoices
      const { data: factures, error: facturesError } = await supabase
        .from('factures_fournisseur')
        .select('*, fournisseurs(*)')
        .order('date_echeance', { ascending: true });

      if (facturesError) throw facturesError;

      // Fetch payment schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('type', 'payable')
        .order('scheduled_date', { ascending: true });

      if (schedulesError) console.warn('Error fetching schedules:', schedulesError);

      const today = new Date();

      // Process payables
      const processedPayables: Payable[] = (factures || []).map(f => {
        const fournisseur = f.fournisseurs as any;
        const dueDate = new Date(f.date_echeance);
        const isPaid = f.statut === 'payee';
        const daysUntilDue = differenceInDays(dueDate, today);
        const daysOverdue = !isPaid && daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;
        const amountDue = f.montant_ttc - (f.montant_paye || 0);

        return {
          id: f.id,
          fournisseur_id: f.fournisseur_id,
          fournisseur_name: fournisseur?.nom_fournisseur || 'Fournisseur Inconnu',
          fournisseur_email: fournisseur?.contact_email || undefined,
          fournisseur_phone: fournisseur?.contact_telephone || undefined,
          invoice_number: f.numero_facture,
          invoice_date: f.date_facture,
          due_date: f.date_echeance,
          amount: f.montant_ttc,
          amount_paid: f.montant_paye || 0,
          amount_due: amountDue,
          days_until_due: daysUntilDue,
          days_overdue: daysOverdue,
          status: getPayableStatus(daysUntilDue, isPaid),
          achat_id: f.achat_id || undefined,
          payment_terms: fournisseur?.conditions_paiement || undefined,
        };
      });

      setPayables(processedPayables);

      // Process schedules
      const processedSchedules: PaymentSchedule[] = (schedulesData || []).map(s => ({
        id: s.id,
        fournisseur_id: s.entity_id,
        fournisseur_name: s.entity_name || 'Fournisseur',
        facture_id: s.reference_id,
        amount: s.amount,
        scheduled_date: s.scheduled_date,
        payment_method: s.payment_method || undefined,
        status: s.status as PaymentSchedule['status'],
        executed_date: s.executed_date || undefined,
        reference_number: s.reference_number || undefined,
      }));
      setSchedules(processedSchedules);

      // Calculate stats
      const outstanding = processedPayables.filter(p => p.status !== 'paid');
      const paid = processedPayables.filter(p => p.status === 'paid');
      const overdue = outstanding.filter(p => p.status === 'overdue');
      const dueSoon = outstanding.filter(p => p.status === 'due_soon' || p.status === 'due_today');

      const totalOutstanding = outstanding.reduce((sum, p) => sum + p.amount_due, 0);
      const totalDueSoon = dueSoon.reduce((sum, p) => sum + p.amount_due, 0);
      const totalOverdue = overdue.reduce((sum, p) => sum + p.amount_due, 0);
      const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);

      const totalInvoiced = processedPayables.reduce((sum, p) => sum + p.amount, 0);
      const paymentRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 100;

      // Calculate DPO
      const totalDaysOverdue = overdue.reduce((sum, p) => sum + p.days_overdue, 0);
      const dpoAverage = overdue.length > 0 ? Math.round(totalDaysOverdue / overdue.length) : 0;

      const suppliersWithOverdue = new Set(overdue.map(p => p.fournisseur_id)).size;
      const scheduledPayments = processedSchedules.filter(s => s.status === 'scheduled' || s.status === 'pending').length;

      // Aging buckets
      const agingBuckets: AgingBucket[] = [
        { bucket: 'Non échu', bucket_order: 1, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: 'Échu < 7j', bucket_order: 2, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: '1-30 jours', bucket_order: 3, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: '31-60 jours', bucket_order: 4, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: '60+ jours', bucket_order: 5, invoice_count: 0, total_amount: 0, percentage: 0 },
      ];

      outstanding.forEach(p => {
        let bucketIndex = 0;
        if (p.days_until_due > 0) bucketIndex = 0;
        else if (p.days_overdue <= 7) bucketIndex = 1;
        else if (p.days_overdue <= 30) bucketIndex = 2;
        else if (p.days_overdue <= 60) bucketIndex = 3;
        else bucketIndex = 4;

        agingBuckets[bucketIndex].invoice_count++;
        agingBuckets[bucketIndex].total_amount += p.amount_due;
      });

      agingBuckets.forEach(bucket => {
        bucket.percentage = totalOutstanding > 0 ? (bucket.total_amount / totalOutstanding) * 100 : 0;
      });

      setStats({
        totalOutstanding,
        totalDueSoon,
        totalOverdue,
        totalPaid,
        paymentRate,
        dpoAverage,
        suppliersWithOverdue,
        scheduledPayments,
        agingBuckets,
      });

    } catch (err) {
      console.error('Error fetching payables:', err);
      setError('Erreur lors du chargement des dettes');
    } finally {
      setLoading(false);
    }
  }, []);

  const schedulePayment = useCallback(async (
    payable: Payable,
    scheduledDate: Date,
    paymentMethod?: string
  ) => {
    try {
      const { error } = await supabase
        .from('payment_schedules')
        .insert({
          type: 'payable',
          reference_id: payable.id,
          entity_id: payable.fournisseur_id,
          entity_name: payable.fournisseur_name,
          amount: payable.amount_due,
          scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
          payment_method: paymentMethod,
          status: 'scheduled',
        });

      if (error) throw error;

      toast.success('Paiement programmé');
      await fetchPayables();
      return true;
    } catch (err) {
      console.error('Error scheduling payment:', err);
      toast.error('Erreur lors de la programmation');
      return false;
    }
  }, [fetchPayables]);

  const executePayment = useCallback(async (
    payable: Payable,
    amount: number,
    paymentMethod: string,
    reference?: string
  ) => {
    try {
      // Insert payment record
      const { error: paymentError } = await supabase
        .from('paiements_fournisseur')
        .insert({
          facture_id: payable.id,
          fournisseur_id: payable.fournisseur_id,
          montant: amount,
          mode_paiement: paymentMethod,
          reference_paiement: reference,
        });

      if (paymentError) throw paymentError;

      // Update invoice
      const newAmountPaid = payable.amount_paid + amount;
      const newStatus = newAmountPaid >= payable.amount ? 'payee' : 'partiel';

      const { error: updateError } = await supabase
        .from('factures_fournisseur')
        .update({ 
          montant_paye: newAmountPaid, 
          statut: newStatus 
        })
        .eq('id', payable.id);

      if (updateError) throw updateError;

      toast.success('Paiement enregistré');
      await fetchPayables();
      return true;
    } catch (err) {
      console.error('Error executing payment:', err);
      toast.error('Erreur lors du paiement');
      return false;
    }
  }, [fetchPayables]);

  const cancelSchedule = useCallback(async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('payment_schedules')
        .update({ status: 'cancelled' })
        .eq('id', scheduleId);

      if (error) throw error;

      toast.success('Programmation annulée');
      await fetchPayables();
      return true;
    } catch (err) {
      console.error('Error cancelling schedule:', err);
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
  }, [fetchPayables]);

  const getPayablesBySupplier = useCallback(() => {
    const bySupplier = new Map<string, { 
      fournisseur_name: string; 
      total_due: number; 
      total_overdue: number;
      count: number; 
      payables: Payable[] 
    }>();
    
    payables
      .filter(p => p.status !== 'paid')
      .forEach(p => {
        if (!bySupplier.has(p.fournisseur_id)) {
          bySupplier.set(p.fournisseur_id, {
            fournisseur_name: p.fournisseur_name,
            total_due: 0,
            total_overdue: 0,
            count: 0,
            payables: [],
          });
        }
        const entry = bySupplier.get(p.fournisseur_id)!;
        entry.total_due += p.amount_due;
        if (p.status === 'overdue') entry.total_overdue += p.amount_due;
        entry.count++;
        entry.payables.push(p);
      });

    return Array.from(bySupplier.values()).sort((a, b) => b.total_due - a.total_due);
  }, [payables]);

  const getDueSoon = useCallback(() => {
    return payables
      .filter(p => p.status === 'due_soon' || p.status === 'due_today')
      .sort((a, b) => a.days_until_due - b.days_until_due);
  }, [payables]);

  const getOverdue = useCallback(() => {
    return payables
      .filter(p => p.status === 'overdue')
      .sort((a, b) => b.days_overdue - a.days_overdue);
  }, [payables]);

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  return {
    payables,
    schedules,
    stats,
    loading,
    error,
    refetch: fetchPayables,
    schedulePayment,
    executePayment,
    cancelSchedule,
    getPayablesBySupplier,
    getDueSoon,
    getOverdue,
  };
}
