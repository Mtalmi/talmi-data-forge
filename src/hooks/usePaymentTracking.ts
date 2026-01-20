import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, addDays, format } from 'date-fns';

export interface PaymentRecord {
  bl_id: string;
  client_id: string;
  client_nom: string;
  date_livraison: string;
  volume_m3: number;
  prix_vente_m3: number | null;
  prix_livraison_m3: number | null;
  total_ht: number;
  statut_paiement: string;
  mode_paiement: string;
  delai_paiement_jours: number;
  days_overdue: number;
  aging_bucket: '0-30' | '31-60' | '61-90' | '90+';
  facture_id: string | null;
  client_email?: string;
  date_echeance: string;
  reminder_sent?: boolean;
}

export interface AgingBucket {
  label: string;
  range: string;
  count: number;
  total: number;
  percentage: number;
}

export interface PaymentModeBreakdown {
  mode: string;
  label: string;
  count: number;
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export interface PaymentTrackingStats {
  totalOutstanding: number;
  totalPaid: number;
  totalOverdue: number;
  agingBuckets: AgingBucket[];
  paymentModeBreakdown: PaymentModeBreakdown[];
  clientsWithOverdue: number;
  averageDaysOverdue: number;
}

const MODE_LABELS: Record<string, string> = {
  virement: 'Virement Bancaire',
  cheque: 'Chèque',
  especes: 'Espèces',
  cash: 'Cash',
};

export function usePaymentTracking() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentTrackingStats>({
    totalOutstanding: 0,
    totalPaid: 0,
    totalOverdue: 0,
    agingBuckets: [],
    paymentModeBreakdown: [],
    clientsWithOverdue: 0,
    averageDaysOverdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAgingBucket = (daysOverdue: number): '0-30' | '31-60' | '61-90' | '90+' => {
    if (daysOverdue <= 30) return '0-30';
    if (daysOverdue <= 60) return '31-60';
    if (daysOverdue <= 90) return '61-90';
    return '90+';
  };

  const fetchPaymentData = useCallback(async () => {
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

      // Fetch clients for names and payment terms
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('client_id, nom_client, delai_paiement_jours, email');

      if (clientsError) throw clientsError;

      const clientMap = new Map(clients?.map(c => [c.client_id, c]));
      const today = new Date();

      // Process payment records
      const processedPayments: PaymentRecord[] = (bons || []).map(bon => {
        const client = clientMap.get(bon.client_id);
        const deliveryDate = new Date(bon.date_livraison);
        const delaiJours = client?.delai_paiement_jours || 30;
        const dueDate = new Date(deliveryDate);
        dueDate.setDate(dueDate.getDate() + delaiJours);
        
        const daysOverdue = bon.statut_paiement !== 'Payé' 
          ? Math.max(0, differenceInDays(today, dueDate))
          : 0;

        const prixVente = bon.prix_vente_m3 || 0;
        const prixLivraison = bon.prix_livraison_m3 || 0;
        const totalHT = bon.volume_m3 * (prixVente + prixLivraison);

        return {
          bl_id: bon.bl_id,
          client_id: bon.client_id,
          client_nom: client?.nom_client || 'Client Inconnu',
          client_email: client?.email || undefined,
          date_livraison: bon.date_livraison,
          date_echeance: format(dueDate, 'yyyy-MM-dd'),
          volume_m3: bon.volume_m3,
          prix_vente_m3: prixVente,
          prix_livraison_m3: prixLivraison,
          total_ht: totalHT,
          statut_paiement: bon.statut_paiement,
          mode_paiement: bon.mode_paiement || 'virement',
          delai_paiement_jours: delaiJours,
          days_overdue: daysOverdue,
          aging_bucket: calculateAgingBucket(daysOverdue),
          facture_id: bon.facture_id,
        };
      });

      setPayments(processedPayments);

      // Calculate stats
      const pendingPayments = processedPayments.filter(p => p.statut_paiement !== 'Payé');
      const paidPayments = processedPayments.filter(p => p.statut_paiement === 'Payé');
      const overduePayments = processedPayments.filter(p => p.statut_paiement === 'Retard' || p.days_overdue > 0);

      const totalOutstanding = pendingPayments.reduce((sum, p) => sum + p.total_ht, 0);
      const totalPaid = paidPayments.reduce((sum, p) => sum + p.total_ht, 0);
      const totalOverdue = overduePayments.reduce((sum, p) => sum + p.total_ht, 0);

      // Aging buckets
      const bucketData = {
        '0-30': { count: 0, total: 0 },
        '31-60': { count: 0, total: 0 },
        '61-90': { count: 0, total: 0 },
        '90+': { count: 0, total: 0 },
      };

      pendingPayments.forEach(p => {
        bucketData[p.aging_bucket].count++;
        bucketData[p.aging_bucket].total += p.total_ht;
      });

      const agingBuckets: AgingBucket[] = [
        { label: 'Courant', range: '0-30 jours', ...bucketData['0-30'], percentage: totalOutstanding > 0 ? (bucketData['0-30'].total / totalOutstanding) * 100 : 0 },
        { label: '31-60 jours', range: '31-60 jours', ...bucketData['31-60'], percentage: totalOutstanding > 0 ? (bucketData['31-60'].total / totalOutstanding) * 100 : 0 },
        { label: '61-90 jours', range: '61-90 jours', ...bucketData['61-90'], percentage: totalOutstanding > 0 ? (bucketData['61-90'].total / totalOutstanding) * 100 : 0 },
        { label: '90+ jours', range: '> 90 jours', ...bucketData['90+'], percentage: totalOutstanding > 0 ? (bucketData['90+'].total / totalOutstanding) * 100 : 0 },
      ];

      // Payment mode breakdown
      const modeData = new Map<string, { count: number; total: number; paid: number; pending: number; overdue: number }>();
      
      processedPayments.forEach(p => {
        const mode = p.mode_paiement || 'virement';
        if (!modeData.has(mode)) {
          modeData.set(mode, { count: 0, total: 0, paid: 0, pending: 0, overdue: 0 });
        }
        const data = modeData.get(mode)!;
        data.count++;
        data.total += p.total_ht;
        if (p.statut_paiement === 'Payé') {
          data.paid += p.total_ht;
        } else if (p.statut_paiement === 'Retard' || p.days_overdue > 0) {
          data.overdue += p.total_ht;
        } else {
          data.pending += p.total_ht;
        }
      });

      const paymentModeBreakdown: PaymentModeBreakdown[] = Array.from(modeData.entries()).map(([mode, data]) => ({
        mode,
        label: MODE_LABELS[mode] || mode,
        ...data,
      }));

      // Clients with overdue
      const clientsWithOverdue = new Set(overduePayments.map(p => p.client_id)).size;

      // Average days overdue
      const totalDaysOverdue = overduePayments.reduce((sum, p) => sum + p.days_overdue, 0);
      const averageDaysOverdue = overduePayments.length > 0 ? totalDaysOverdue / overduePayments.length : 0;

      setStats({
        totalOutstanding,
        totalPaid,
        totalOverdue,
        agingBuckets,
        paymentModeBreakdown,
        clientsWithOverdue,
        averageDaysOverdue,
      });

    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError('Erreur lors du chargement des données de paiement');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsPaid = useCallback(async (blId: string) => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({ statut_paiement: 'Payé' })
        .eq('bl_id', blId);

      if (error) throw error;

      // Refresh data
      await fetchPaymentData();
      return true;
    } catch (err) {
      console.error('Error marking payment as paid:', err);
      return false;
    }
  }, [fetchPaymentData]);

  // Get payments in 31-60 day aging bucket eligible for reminders
  const getAgingReminders = useCallback(() => {
    return payments.filter(p => 
      p.aging_bucket === '31-60' && 
      p.statut_paiement !== 'Payé' &&
      p.client_email
    );
  }, [payments]);

  // Send payment reminder emails for 31-60 day bucket
  const sendPaymentReminders = useCallback(async (paymentIds?: string[]): Promise<{ sent: number; failed: number; errors: string[] }> => {
    const eligiblePayments = paymentIds 
      ? payments.filter(p => paymentIds.includes(p.bl_id) && p.client_email)
      : getAgingReminders();

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const payment of eligiblePayments) {
      if (!payment.client_email) {
        failed++;
        errors.push(`${payment.client_nom}: Pas d'email configuré`);
        continue;
      }

      try {
        const { error } = await supabase.functions.invoke('send-payment-reminder', {
          body: {
            to: payment.client_email,
            clientName: payment.client_nom,
            factureId: payment.facture_id || payment.bl_id,
            montantDu: payment.total_ht,
            dateEcheance: payment.date_echeance,
            joursRetard: payment.days_overdue,
          },
        });

        if (error) {
          failed++;
          errors.push(`${payment.client_nom}: ${error.message}`);
        } else {
          sent++;
          console.log(`Payment reminder sent to ${payment.client_nom} (${payment.client_email})`);
        }
      } catch (err) {
        failed++;
        errors.push(`${payment.client_nom}: Erreur d'envoi`);
        console.error('Error sending payment reminder:', err);
      }
    }

    return { sent, failed, errors };
  }, [payments, getAgingReminders]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  return {
    payments,
    stats,
    loading,
    error,
    refetch: fetchPaymentData,
    markAsPaid,
    getAgingReminders,
    sendPaymentReminders,
  };
}
