import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, subDays, format } from 'date-fns';

export interface CreditScoreSnapshot {
  id: string;
  client_id: string;
  score: number;
  grade: string;
  risk_level: string;
  payment_history_score: number | null;
  delay_frequency_score: number | null;
  balance_trend_score: number | null;
  account_age_score: number | null;
  credit_utilization_score: number | null;
  total_outstanding: number | null;
  total_overdue: number | null;
  avg_days_overdue: number | null;
  snapshot_date: string;
  created_at: string;
}

export interface ClientTrend {
  client_id: string;
  client_nom: string;
  current_score: number;
  previous_score: number;
  score_change: number;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  history: CreditScoreSnapshot[];
}

export interface TrendStats {
  totalClients: number;
  improving: number;
  stable: number;
  declining: number;
  critical: number;
  avgScoreChange: number;
}

// Grade and risk level calculation
const getGrade = (score: number): string => {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
};

const getRiskLevel = (score: number): string => {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 35) return 'poor';
  return 'critical';
};

export function useCreditScoreHistory() {
  const [history, setHistory] = useState<CreditScoreSnapshot[]>([]);
  const [clientTrends, setClientTrends] = useState<ClientTrend[]>([]);
  const [stats, setStats] = useState<TrendStats>({
    totalClients: 0,
    improving: 0,
    stable: 0,
    declining: 0,
    critical: 0,
    avgScoreChange: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch history for last 90 days
      const cutoffDate = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      
      const [historyRes, clientsRes] = await Promise.all([
        supabase
          .from('credit_score_history')
          .select('*')
          .gte('snapshot_date', cutoffDate)
          .order('snapshot_date', { ascending: true }),
        supabase
          .from('clients')
          .select('client_id, nom_client'),
      ]);

      if (historyRes.error) throw historyRes.error;
      if (clientsRes.error) throw clientsRes.error;

      const historyData = (historyRes.data || []) as CreditScoreSnapshot[];
      const clients = clientsRes.data || [];
      const clientMap = new Map(clients.map(c => [c.client_id, c.nom_client]));

      setHistory(historyData);

      // Group by client and calculate trends
      const clientGroups = new Map<string, CreditScoreSnapshot[]>();
      historyData.forEach(snapshot => {
        const existing = clientGroups.get(snapshot.client_id) || [];
        existing.push(snapshot);
        clientGroups.set(snapshot.client_id, existing);
      });

      const trends: ClientTrend[] = [];
      let totalChange = 0;
      let improvingCount = 0;
      let stableCount = 0;
      let decliningCount = 0;
      let criticalCount = 0;

      clientGroups.forEach((snapshots, clientId) => {
        // Sort by date ascending
        snapshots.sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());
        
        const current = snapshots[snapshots.length - 1];
        const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : current;
        const oldest = snapshots[0];
        
        const scoreChange = Number(current.score) - Number(previous.score);
        const longTermChange = Number(current.score) - Number(oldest.score);
        totalChange += scoreChange;

        let trend: 'improving' | 'stable' | 'declining' | 'critical';
        if (Number(current.score) < 35) {
          trend = 'critical';
          criticalCount++;
        } else if (scoreChange > 5 || longTermChange > 10) {
          trend = 'improving';
          improvingCount++;
        } else if (scoreChange < -5 || longTermChange < -10) {
          trend = 'declining';
          decliningCount++;
        } else {
          trend = 'stable';
          stableCount++;
        }

        trends.push({
          client_id: clientId,
          client_nom: clientMap.get(clientId) || 'Client Inconnu',
          current_score: Number(current.score),
          previous_score: Number(previous.score),
          score_change: scoreChange,
          trend,
          history: snapshots,
        });
      });

      // Sort by score change (worst first for early detection)
      trends.sort((a, b) => a.score_change - b.score_change);

      setClientTrends(trends);
      setStats({
        totalClients: trends.length,
        improving: improvingCount,
        stable: stableCount,
        declining: decliningCount,
        critical: criticalCount,
        avgScoreChange: trends.length > 0 ? totalChange / trends.length : 0,
      });

    } catch (err) {
      console.error('Error fetching credit score history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Take a snapshot of current credit scores for all clients
  const takeSnapshot = useCallback(async () => {
    try {
      // Fetch all clients and their current payment data
      const [clientsRes, bonsRes] = await Promise.all([
        supabase.from('clients').select('client_id, nom_client, limite_credit_dh, delai_paiement_jours, created_at'),
        supabase.from('bons_livraison_reels').select('client_id, date_livraison, volume_m3, prix_vente_m3, prix_livraison_m3, statut_paiement'),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (bonsRes.error) throw bonsRes.error;

      const clients = clientsRes.data || [];
      const bons = bonsRes.data || [];
      const today = new Date();

      const snapshots: Omit<CreditScoreSnapshot, 'id' | 'created_at'>[] = [];

      for (const client of clients) {
        const clientBons = bons.filter(b => b.client_id === client.client_id);
        
        // Calculate scores based on the 5 weighted factors
        const totalBons = clientBons.length;
        const paidBons = clientBons.filter(b => b.statut_paiement === 'Payé').length;
        const overdueBons = clientBons.filter(b => b.statut_paiement === 'Retard').length;
        
        // 1. Payment History (35%) - % of on-time payments
        const paymentHistoryScore = totalBons > 0 
          ? (paidBons / totalBons) * 100 
          : 50;

        // 2. Delay Frequency (30%) - Inverse of overdue ratio
        const delayFrequencyScore = totalBons > 0 
          ? Math.max(0, 100 - (overdueBons / totalBons) * 200) 
          : 50;

        // 3. Balance Trend (20%) - Based on outstanding amount vs credit limit
        const outstanding = clientBons
          .filter(b => b.statut_paiement !== 'Payé')
          .reduce((sum, b) => sum + (b.volume_m3 * ((b.prix_vente_m3 || 0) + (b.prix_livraison_m3 || 0))), 0);
        const creditLimit = client.limite_credit_dh || 100000;
        const utilizationRatio = outstanding / creditLimit;
        const balanceTrendScore = Math.max(0, 100 - utilizationRatio * 100);

        // 4. Account Age (10%) - Older accounts get higher scores
        const accountAgeDays = differenceInDays(today, new Date(client.created_at));
        const accountAgeScore = Math.min(100, (accountAgeDays / 365) * 50 + 50);

        // 5. Credit Utilization (5%) - Lower is better
        const creditUtilizationScore = Math.max(0, 100 - utilizationRatio * 80);

        // Calculate weighted total score
        const totalScore = 
          paymentHistoryScore * 0.35 +
          delayFrequencyScore * 0.30 +
          balanceTrendScore * 0.20 +
          accountAgeScore * 0.10 +
          creditUtilizationScore * 0.05;

        // Calculate overdue amounts
        const overdue = clientBons
          .filter(b => b.statut_paiement === 'Retard')
          .reduce((sum, b) => sum + (b.volume_m3 * ((b.prix_vente_m3 || 0) + (b.prix_livraison_m3 || 0))), 0);

        snapshots.push({
          client_id: client.client_id,
          score: Math.round(totalScore * 100) / 100,
          grade: getGrade(totalScore),
          risk_level: getRiskLevel(totalScore),
          payment_history_score: Math.round(paymentHistoryScore * 100) / 100,
          delay_frequency_score: Math.round(delayFrequencyScore * 100) / 100,
          balance_trend_score: Math.round(balanceTrendScore * 100) / 100,
          account_age_score: Math.round(accountAgeScore * 100) / 100,
          credit_utilization_score: Math.round(creditUtilizationScore * 100) / 100,
          total_outstanding: outstanding,
          total_overdue: overdue,
          avg_days_overdue: overdueBons > 0 ? 15 : 0, // Simplified
          snapshot_date: format(today, 'yyyy-MM-dd'),
        });
      }

      // Upsert snapshots (update if exists for today, insert otherwise)
      const { error } = await supabase
        .from('credit_score_history')
        .upsert(snapshots, { 
          onConflict: 'client_id,snapshot_date',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      await fetchHistory();
      return { success: true, count: snapshots.length };
    } catch (err) {
      console.error('Error taking snapshot:', err);
      return { success: false, error: err };
    }
  }, [fetchHistory]);

  // Get history for a specific client
  const getClientHistory = useCallback((clientId: string): CreditScoreSnapshot[] => {
    return history
      .filter(h => h.client_id === clientId)
      .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());
  }, [history]);

  // Get clients with declining scores
  const getDecliningClients = useCallback(() => {
    return clientTrends.filter(t => t.trend === 'declining' || t.trend === 'critical');
  }, [clientTrends]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    clientTrends,
    stats,
    loading,
    refetch: fetchHistory,
    takeSnapshot,
    getClientHistory,
    getDecliningClients,
  };
}
