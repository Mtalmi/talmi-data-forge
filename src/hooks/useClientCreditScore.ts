import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface CreditScoreFactors {
  paymentHistoryScore: number; // 0-35 points (35% weight)
  delayFrequencyScore: number; // 0-30 points (30% weight)
  balanceTrendScore: number; // 0-20 points (20% weight)
  accountAgeScore: number; // 0-10 points (10% weight)
  creditUtilizationScore: number; // 0-5 points (5% weight)
}

export interface ClientCreditScore {
  client_id: string;
  nom_client: string;
  email: string | null;
  telephone: string | null;
  credit_score: number; // 0-100
  score_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score_label: string;
  factors: CreditScoreFactors;
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  total_volume_dh: number;
  outstanding_balance: number;
  average_days_to_pay: number;
  late_payment_count: number;
  on_time_payment_rate: number;
  credit_limit: number;
  credit_utilization: number;
  account_age_days: number;
  is_blocked: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommended_action: string;
}

export interface CreditScoreStats {
  averageScore: number;
  totalClients: number;
  gradeDistribution: { grade: string; count: number; percentage: number }[];
  riskDistribution: { level: string; count: number; percentage: number }[];
  highRiskClients: number;
}

const SCORE_GRADES = {
  A: { min: 80, label: 'Excellent', color: 'text-success' },
  B: { min: 65, label: 'Bon', color: 'text-primary' },
  C: { min: 50, label: 'Moyen', color: 'text-warning' },
  D: { min: 35, label: 'Faible', color: 'text-orange-500' },
  F: { min: 0, label: 'Critique', color: 'text-destructive' },
};

function getScoreGrade(score: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; label: string } {
  if (score >= 80) return { grade: 'A', label: 'Excellent' };
  if (score >= 65) return { grade: 'B', label: 'Bon' };
  if (score >= 50) return { grade: 'C', label: 'Moyen' };
  if (score >= 35) return { grade: 'D', label: 'Faible' };
  return { grade: 'F', label: 'Critique' };
}

function getRiskLevel(score: number, isBlocked: boolean): 'low' | 'medium' | 'high' | 'critical' {
  if (isBlocked) return 'critical';
  if (score >= 70) return 'low';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'high';
  return 'critical';
}

function getRecommendedAction(score: number, isBlocked: boolean, creditUtilization: number): string {
  if (isBlocked) return 'Client bloqué - Exiger paiement avant nouvelles commandes';
  if (score >= 80) return 'Client fiable - Maintenir conditions actuelles';
  if (score >= 65) return 'Surveillance standard - Rappels à échéance';
  if (score >= 50) {
    if (creditUtilization > 80) return 'Réduire limite crédit ou exiger paiement partiel';
    return 'Surveillance renforcée - Rappels anticipés';
  }
  if (score >= 35) return 'Conditions restrictives - Paiement comptant recommandé';
  return 'Blocage recommandé - Risque élevé d\'impayé';
}

export function useClientCreditScore() {
  const [scores, setScores] = useState<ClientCreditScore[]>([]);
  const [stats, setStats] = useState<CreditScoreStats>({
    averageScore: 0,
    totalClients: 0,
    gradeDistribution: [],
    riskDistribution: [],
    highRiskClients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateCreditScores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) throw clientsError;

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
          workflow_status,
          created_at
        `)
        .order('date_livraison', { ascending: true });

      if (bonsError) throw bonsError;

      const today = new Date();
      const clientScores: ClientCreditScore[] = [];

      for (const client of clients || []) {
        const clientBons = (bons || []).filter(b => b.client_id === client.client_id);
        
        // Basic metrics
        const totalInvoices = clientBons.length;
        const paidInvoices = clientBons.filter(b => b.statut_paiement === 'Payé').length;
        const overdueInvoices = clientBons.filter(b => b.statut_paiement === 'Retard').length;
        const pendingInvoices = clientBons.filter(b => b.statut_paiement !== 'Payé');
        
        // Calculate total volume
        const totalVolumeDH = clientBons.reduce((sum, b) => {
          const prix = (b.prix_vente_m3 || 0) + (b.prix_livraison_m3 || 0);
          return sum + (b.volume_m3 * prix);
        }, 0);

        // Outstanding balance
        const outstandingBalance = pendingInvoices.reduce((sum, b) => {
          const prix = (b.prix_vente_m3 || 0) + (b.prix_livraison_m3 || 0);
          return sum + (b.volume_m3 * prix);
        }, 0);

        // Calculate payment timing
        const delaiJours = client.delai_paiement_jours || 30;
        let totalDaysToPay = 0;
        let latePaymentCount = 0;
        let analyzedPayments = 0;

        for (const bon of clientBons) {
          if (bon.statut_paiement === 'Payé') {
            const deliveryDate = new Date(bon.date_livraison);
            const dueDate = new Date(deliveryDate);
            dueDate.setDate(dueDate.getDate() + delaiJours);
            
            // Estimate payment date as due date for paid invoices (simplified)
            // In a real system, you'd have actual payment dates
            const estimatedPaymentDelay = 0; // Assume paid on time if marked as paid
            totalDaysToPay += delaiJours;
            analyzedPayments++;
          } else if (bon.statut_paiement === 'Retard') {
            latePaymentCount++;
            const deliveryDate = new Date(bon.date_livraison);
            const daysOverdue = differenceInDays(today, deliveryDate) - delaiJours;
            totalDaysToPay += delaiJours + Math.max(0, daysOverdue);
            analyzedPayments++;
          }
        }

        const averageDaysToPay = analyzedPayments > 0 ? totalDaysToPay / analyzedPayments : delaiJours;
        const onTimePaymentRate = totalInvoices > 0 ? ((paidInvoices - latePaymentCount) / totalInvoices) * 100 : 100;

        // Credit utilization
        const creditLimit = client.limite_credit_dh || 50000;
        const creditUtilization = creditLimit > 0 ? (outstandingBalance / creditLimit) * 100 : 0;

        // Account age
        const accountCreatedDate = new Date(client.created_at);
        const accountAgeDays = differenceInDays(today, accountCreatedDate);

        // Calculate score factors
        const factors = calculateScoreFactors(
          totalInvoices,
          paidInvoices,
          overdueInvoices,
          latePaymentCount,
          averageDaysToPay,
          delaiJours,
          creditUtilization,
          accountAgeDays,
          outstandingBalance,
          totalVolumeDH
        );

        const totalScore = Math.round(
          factors.paymentHistoryScore +
          factors.delayFrequencyScore +
          factors.balanceTrendScore +
          factors.accountAgeScore +
          factors.creditUtilizationScore
        );

        const { grade, label } = getScoreGrade(totalScore);
        const isBlocked = client.credit_bloque || false;
        const riskLevel = getRiskLevel(totalScore, isBlocked);
        const recommendedAction = getRecommendedAction(totalScore, isBlocked, creditUtilization);

        clientScores.push({
          client_id: client.client_id,
          nom_client: client.nom_client,
          email: client.email,
          telephone: client.telephone,
          credit_score: totalScore,
          score_grade: grade,
          score_label: label,
          factors,
          total_invoices: totalInvoices,
          paid_invoices: paidInvoices,
          overdue_invoices: overdueInvoices,
          total_volume_dh: totalVolumeDH,
          outstanding_balance: outstandingBalance,
          average_days_to_pay: Math.round(averageDaysToPay),
          late_payment_count: latePaymentCount,
          on_time_payment_rate: Math.round(onTimePaymentRate),
          credit_limit: creditLimit,
          credit_utilization: Math.round(creditUtilization),
          account_age_days: accountAgeDays,
          is_blocked: isBlocked,
          risk_level: riskLevel,
          recommended_action: recommendedAction,
        });
      }

      // Sort by score descending
      clientScores.sort((a, b) => b.credit_score - a.credit_score);
      setScores(clientScores);

      // Calculate stats
      const totalClients = clientScores.length;
      const averageScore = totalClients > 0 
        ? clientScores.reduce((sum, c) => sum + c.credit_score, 0) / totalClients 
        : 0;

      const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      const riskCount = { low: 0, medium: 0, high: 0, critical: 0 };

      clientScores.forEach(c => {
        gradeCount[c.score_grade]++;
        riskCount[c.risk_level]++;
      });

      const gradeDistribution = Object.entries(gradeCount).map(([grade, count]) => ({
        grade,
        count,
        percentage: totalClients > 0 ? (count / totalClients) * 100 : 0,
      }));

      const riskDistribution = Object.entries(riskCount).map(([level, count]) => ({
        level,
        count,
        percentage: totalClients > 0 ? (count / totalClients) * 100 : 0,
      }));

      setStats({
        averageScore: Math.round(averageScore),
        totalClients,
        gradeDistribution,
        riskDistribution,
        highRiskClients: riskCount.high + riskCount.critical,
      });

    } catch (err) {
      console.error('Error calculating credit scores:', err);
      setError('Erreur lors du calcul des scores de crédit');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateCreditScores();
  }, [calculateCreditScores]);

  return {
    scores,
    stats,
    loading,
    error,
    refetch: calculateCreditScores,
  };
}

function calculateScoreFactors(
  totalInvoices: number,
  paidInvoices: number,
  overdueInvoices: number,
  latePaymentCount: number,
  averageDaysToPay: number,
  delaiJours: number,
  creditUtilization: number,
  accountAgeDays: number,
  outstandingBalance: number,
  totalVolumeDH: number
): CreditScoreFactors {
  // 1. Payment History Score (35 points max)
  // Based on ratio of paid vs total invoices and overdue history
  let paymentHistoryScore = 35;
  if (totalInvoices > 0) {
    const paymentRatio = paidInvoices / totalInvoices;
    paymentHistoryScore = paymentRatio * 25; // Up to 25 points for payment ratio
    
    // Penalize for overdue invoices
    const overduePenalty = Math.min(10, overdueInvoices * 2);
    paymentHistoryScore = Math.max(0, paymentHistoryScore + (10 - overduePenalty));
  }

  // 2. Delay Frequency Score (30 points max)
  // Based on how often payments are late and by how much
  let delayFrequencyScore = 30;
  if (totalInvoices > 0) {
    const lateRatio = latePaymentCount / totalInvoices;
    delayFrequencyScore = (1 - lateRatio) * 20; // Up to 20 points for low late ratio
    
    // Bonus/penalty based on average payment timing
    const timingRatio = delaiJours > 0 ? averageDaysToPay / delaiJours : 1;
    if (timingRatio <= 1) {
      delayFrequencyScore += 10; // On time or early
    } else if (timingRatio <= 1.5) {
      delayFrequencyScore += 5; // Slightly late
    }
    // No bonus if significantly late
  }

  // 3. Balance Trend Score (20 points max)
  // Based on outstanding balance relative to total business
  let balanceTrendScore = 20;
  if (totalVolumeDH > 0) {
    const balanceRatio = outstandingBalance / totalVolumeDH;
    if (balanceRatio <= 0.1) {
      balanceTrendScore = 20; // Very low outstanding
    } else if (balanceRatio <= 0.3) {
      balanceTrendScore = 15;
    } else if (balanceRatio <= 0.5) {
      balanceTrendScore = 10;
    } else if (balanceRatio <= 0.7) {
      balanceTrendScore = 5;
    } else {
      balanceTrendScore = 0;
    }
  }

  // 4. Account Age Score (10 points max)
  // Longer relationships get higher scores
  let accountAgeScore = 0;
  if (accountAgeDays >= 365) {
    accountAgeScore = 10; // 1+ year
  } else if (accountAgeDays >= 180) {
    accountAgeScore = 7; // 6+ months
  } else if (accountAgeDays >= 90) {
    accountAgeScore = 5; // 3+ months
  } else if (accountAgeDays >= 30) {
    accountAgeScore = 3; // 1+ month
  } else {
    accountAgeScore = 1; // New account
  }

  // 5. Credit Utilization Score (5 points max)
  // Lower utilization is better
  let creditUtilizationScore = 5;
  if (creditUtilization > 90) {
    creditUtilizationScore = 0;
  } else if (creditUtilization > 70) {
    creditUtilizationScore = 1;
  } else if (creditUtilization > 50) {
    creditUtilizationScore = 2;
  } else if (creditUtilization > 30) {
    creditUtilizationScore = 3;
  } else if (creditUtilization > 10) {
    creditUtilizationScore = 4;
  }

  return {
    paymentHistoryScore: Math.round(paymentHistoryScore * 10) / 10,
    delayFrequencyScore: Math.round(delayFrequencyScore * 10) / 10,
    balanceTrendScore: Math.round(balanceTrendScore * 10) / 10,
    accountAgeScore: Math.round(accountAgeScore * 10) / 10,
    creditUtilizationScore: Math.round(creditUtilizationScore * 10) / 10,
  };
}
