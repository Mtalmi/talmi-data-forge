import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, addDays } from 'date-fns';
import { toast } from 'sonner';

export interface Receivable {
  id: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  days_overdue: number;
  status: 'current' | 'overdue_7' | 'overdue_15' | 'overdue_30' | 'overdue_60' | 'at_risk' | 'paid' | 'disputed';
  collection_stage: number;
  last_reminder_sent?: string;
  last_contact_date?: string;
  payment_terms: number;
  bl_id?: string;
  facture_id?: string;
}

export interface CollectionLog {
  id: string;
  client_id: string;
  client_name?: string;
  facture_id?: string;
  bl_id?: string;
  action_type: string;
  action_date: string;
  performed_by_name?: string;
  notes?: string;
  next_action_date?: string;
}

export interface AgingBucket {
  bucket: string;
  bucket_order: number;
  invoice_count: number;
  total_amount: number;
  percentage: number;
}

export interface ReceivablesStats {
  totalOutstanding: number;
  totalOverdue: number;
  totalCurrent: number;
  totalPaid: number;
  collectionRate: number;
  dsoAverage: number;
  clientsWithOverdue: number;
  atRiskAmount: number;
  agingBuckets: AgingBucket[];
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  invoice_sent: 'Facture envoyée',
  reminder_7d: 'Rappel 7 jours',
  reminder_15d: 'Rappel 15 jours',
  reminder_30d: 'Rappel 30 jours (final)',
  phone_call: 'Appel téléphonique',
  dispute_opened: 'Litige ouvert',
  dispute_resolved: 'Litige résolu',
  partial_payment: 'Paiement partiel',
  full_payment: 'Paiement complet',
  written_off: 'Créance passée en perte',
  escalated: 'Escalade CEO',
};

export function useReceivables() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [collectionLogs, setCollectionLogs] = useState<CollectionLog[]>([]);
  const [stats, setStats] = useState<ReceivablesStats>({
    totalOutstanding: 0,
    totalOverdue: 0,
    totalCurrent: 0,
    totalPaid: 0,
    collectionRate: 0,
    dsoAverage: 0,
    clientsWithOverdue: 0,
    atRiskAmount: 0,
    agingBuckets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getReceivableStatus = (daysOverdue: number, isPaid: boolean): Receivable['status'] => {
    if (isPaid) return 'paid';
    if (daysOverdue <= 0) return 'current';
    if (daysOverdue <= 7) return 'overdue_7';
    if (daysOverdue <= 15) return 'overdue_15';
    if (daysOverdue <= 30) return 'overdue_30';
    if (daysOverdue <= 60) return 'overdue_60';
    return 'at_risk';
  };

  const fetchReceivables = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all deliveries with payment info
      const { data: bons, error: bonsError } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          client_id,
          date_livraison,
          volume_m3,
          prix_vente_m3,
          prix_livraison_m3,
          statut_paiement,
          mode_paiement,
          facture_id
        `)
        .order('date_livraison', { ascending: false });

      if (bonsError) throw bonsError;

      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('client_id, nom_client, delai_paiement_jours, email, telephone');

      if (clientsError) throw clientsError;

      // Fetch collection logs
      const { data: logs, error: logsError } = await supabase
        .from('collection_logs')
        .select('*')
        .order('action_date', { ascending: false })
        .limit(100);

      if (logsError) console.warn('Error fetching collection logs:', logsError);

      const clientMap = new Map(clients?.map(c => [c.client_id, c]));
      const today = new Date();

      // Process receivables
      const processedReceivables: Receivable[] = (bons || []).map(bon => {
        const client = clientMap.get(bon.client_id);
        const deliveryDate = new Date(bon.date_livraison);
        const paymentTerms = client?.delai_paiement_jours || 30;
        const dueDate = addDays(deliveryDate, paymentTerms);
        const isPaid = bon.statut_paiement === 'Payé';
        
        const daysOverdue = !isPaid ? Math.max(0, differenceInDays(today, dueDate)) : 0;
        const prixVente = bon.prix_vente_m3 || 0;
        const prixLivraison = bon.prix_livraison_m3 || 0;
        const amount = bon.volume_m3 * (prixVente + prixLivraison);
        const amountPaid = isPaid ? amount : 0;

        return {
          id: bon.bl_id,
          client_id: bon.client_id,
          client_name: client?.nom_client || 'Client Inconnu',
          client_email: client?.email || undefined,
          client_phone: client?.telephone || undefined,
          invoice_number: bon.facture_id || bon.bl_id,
          invoice_date: bon.date_livraison,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          amount,
          amount_paid: amountPaid,
          amount_due: amount - amountPaid,
          days_overdue: daysOverdue,
          status: getReceivableStatus(daysOverdue, isPaid),
          collection_stage: Math.floor(daysOverdue / 15), // Stage increases every 15 days
          payment_terms: paymentTerms,
          bl_id: bon.bl_id,
          facture_id: bon.facture_id || undefined,
        };
      });

      setReceivables(processedReceivables);

      // Process collection logs with client names
      const processedLogs: CollectionLog[] = (logs || []).map(log => ({
        ...log,
        client_name: clientMap.get(log.client_id)?.nom_client || 'Client Inconnu',
      }));
      setCollectionLogs(processedLogs);

      // Calculate stats
      const outstanding = processedReceivables.filter(r => r.status !== 'paid');
      const paid = processedReceivables.filter(r => r.status === 'paid');
      const overdue = outstanding.filter(r => r.days_overdue > 0);
      const current = outstanding.filter(r => r.days_overdue <= 0);
      const atRisk = outstanding.filter(r => r.days_overdue > 60);

      const totalOutstanding = outstanding.reduce((sum, r) => sum + r.amount_due, 0);
      const totalOverdue = overdue.reduce((sum, r) => sum + r.amount_due, 0);
      const totalCurrent = current.reduce((sum, r) => sum + r.amount_due, 0);
      const totalPaid = paid.reduce((sum, r) => sum + r.amount, 0);
      const atRiskAmount = atRisk.reduce((sum, r) => sum + r.amount_due, 0);

      const totalInvoiced = processedReceivables.reduce((sum, r) => sum + r.amount, 0);
      const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

      // Calculate DSO
      const totalDaysOverdue = overdue.reduce((sum, r) => sum + r.days_overdue, 0);
      const dsoAverage = overdue.length > 0 ? Math.round(totalDaysOverdue / overdue.length) : 0;

      const clientsWithOverdue = new Set(overdue.map(r => r.client_id)).size;

      // Aging buckets
      const agingBuckets: AgingBucket[] = [
        { bucket: 'Courant (0-30j)', bucket_order: 1, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: '1-30 jours', bucket_order: 2, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: '31-60 jours', bucket_order: 3, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: '61-90 jours', bucket_order: 4, invoice_count: 0, total_amount: 0, percentage: 0 },
        { bucket: '90+ jours', bucket_order: 5, invoice_count: 0, total_amount: 0, percentage: 0 },
      ];

      outstanding.forEach(r => {
        let bucketIndex = 0;
        if (r.days_overdue <= 0) bucketIndex = 0;
        else if (r.days_overdue <= 30) bucketIndex = 1;
        else if (r.days_overdue <= 60) bucketIndex = 2;
        else if (r.days_overdue <= 90) bucketIndex = 3;
        else bucketIndex = 4;

        agingBuckets[bucketIndex].invoice_count++;
        agingBuckets[bucketIndex].total_amount += r.amount_due;
      });

      agingBuckets.forEach(bucket => {
        bucket.percentage = totalOutstanding > 0 ? (bucket.total_amount / totalOutstanding) * 100 : 0;
      });

      setStats({
        totalOutstanding,
        totalOverdue,
        totalCurrent,
        totalPaid,
        collectionRate,
        dsoAverage,
        clientsWithOverdue,
        atRiskAmount,
        agingBuckets,
      });

    } catch (err) {
      console.error('Error fetching receivables:', err);
      setError('Erreur lors du chargement des créances');
    } finally {
      setLoading(false);
    }
  }, []);

  const logCollectionAction = useCallback(async (
    clientId: string,
    actionType: string,
    notes?: string,
    factureId?: string,
    blId?: string,
    nextActionDate?: Date
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('collection_logs')
        .insert({
          client_id: clientId,
          facture_id: factureId,
          bl_id: blId,
          action_type: actionType,
          performed_by: user?.id,
          performed_by_name: user?.email?.split('@')[0] || 'Système',
          notes,
          next_action_date: nextActionDate ? format(nextActionDate, 'yyyy-MM-dd') : null,
        });

      if (error) throw error;
      
      toast.success(ACTION_TYPE_LABELS[actionType] || 'Action enregistrée');
      await fetchReceivables();
      return true;
    } catch (err) {
      console.error('Error logging collection action:', err);
      toast.error('Erreur lors de l\'enregistrement');
      return false;
    }
  }, [fetchReceivables]);

  const markAsPaid = useCallback(async (blId: string) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ statut_paiement: 'Payé' })
        .eq('bl_id', blId);

      if (error) throw error;

      const receivable = receivables.find(r => r.bl_id === blId);
      if (receivable) {
        await logCollectionAction(
          receivable.client_id,
          'full_payment',
          `Paiement reçu: ${receivable.amount.toLocaleString('fr-MA')} DH`,
          receivable.facture_id,
          blId
        );
      }

      toast.success('Paiement enregistré');
      await fetchReceivables();
      return true;
    } catch (err) {
      console.error('Error marking as paid:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchReceivables, logCollectionAction, receivables]);

  const sendReminder = useCallback(async (receivable: Receivable, reminderType: 'reminder_7d' | 'reminder_15d' | 'reminder_30d') => {
    if (!receivable.client_email) {
      toast.error('Pas d\'email configuré pour ce client');
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          to: receivable.client_email,
          clientName: receivable.client_name,
          factureId: receivable.invoice_number,
          montantDu: receivable.amount_due,
          dateEcheance: receivable.due_date,
          joursRetard: receivable.days_overdue,
        },
      });

      if (error) throw error;

      const nextActionDays = reminderType === 'reminder_7d' ? 8 : reminderType === 'reminder_15d' ? 15 : 30;
      await logCollectionAction(
        receivable.client_id,
        reminderType,
        `Email de rappel envoyé à ${receivable.client_email}`,
        receivable.facture_id,
        receivable.bl_id,
        addDays(new Date(), nextActionDays)
      );

      toast.success('Rappel envoyé avec succès');
      return true;
    } catch (err) {
      console.error('Error sending reminder:', err);
      toast.error('Erreur lors de l\'envoi du rappel');
      return false;
    }
  }, [logCollectionAction]);

  const markAsDisputed = useCallback(async (receivable: Receivable, reason: string) => {
    try {
      await logCollectionAction(
        receivable.client_id,
        'dispute_opened',
        `Litige ouvert: ${reason}`,
        receivable.facture_id,
        receivable.bl_id
      );

      toast.success('Litige enregistré');
      return true;
    } catch (err) {
      console.error('Error marking as disputed:', err);
      toast.error('Erreur lors de l\'enregistrement du litige');
      return false;
    }
  }, [logCollectionAction]);

  const writeOff = useCallback(async (receivable: Receivable, reason: string, approvedBy: string) => {
    try {
      await logCollectionAction(
        receivable.client_id,
        'written_off',
        `Créance passée en perte (${receivable.amount_due.toLocaleString('fr-MA')} DH). Raison: ${reason}. Approuvé par: ${approvedBy}`,
        receivable.facture_id,
        receivable.bl_id
      );

      toast.success('Créance passée en perte');
      return true;
    } catch (err) {
      console.error('Error writing off:', err);
      toast.error('Erreur lors du passage en perte');
      return false;
    }
  }, [logCollectionAction]);

  const getOverdueByClient = useCallback(() => {
    const overdueByClient = new Map<string, { client_name: string; total: number; count: number; receivables: Receivable[] }>();
    
    receivables
      .filter(r => r.status !== 'paid' && r.days_overdue > 0)
      .forEach(r => {
        if (!overdueByClient.has(r.client_id)) {
          overdueByClient.set(r.client_id, {
            client_name: r.client_name,
            total: 0,
            count: 0,
            receivables: [],
          });
        }
        const entry = overdueByClient.get(r.client_id)!;
        entry.total += r.amount_due;
        entry.count++;
        entry.receivables.push(r);
      });

    return Array.from(overdueByClient.values()).sort((a, b) => b.total - a.total);
  }, [receivables]);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  return {
    receivables,
    collectionLogs,
    stats,
    loading,
    error,
    refetch: fetchReceivables,
    logCollectionAction,
    markAsPaid,
    sendReminder,
    markAsDisputed,
    writeOff,
    getOverdueByClient,
    ACTION_TYPE_LABELS,
  };
}
