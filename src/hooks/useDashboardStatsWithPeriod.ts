import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Period } from '@/components/dashboard/PeriodSelector';

export interface PeriodStats {
  // Core metrics
  totalVolume: number;
  chiffreAffaires: number;
  curMoyen: number;
  margeBrute: number;
  margeBrutePct: number;
  profitNet: number;
  totalDepenses: number;
  
  // Counts
  nbLivraisons: number;
  nbFactures: number;
  nbClients: number;
  
  // Comparisons vs previous period
  volumeTrend: number;
  caTrend: number;
  curTrend: number;
  margeTrend: number;
  
  // Period info
  periodLabel: string;
  previousPeriodLabel: string;
}

function getPeriodDates(period: Period): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        prevStart: startOfDay(subDays(now, 1)),
        prevEnd: endOfDay(subDays(now, 1)),
      };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        prevStart: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        prevEnd: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
      };
    case 'month':
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        prevStart: startOfMonth(subMonths(now, 1)),
        prevEnd: endOfMonth(subMonths(now, 1)),
      };
  }
}

function getPeriodLabel(period: Period): string {
  const now = new Date();
  switch (period) {
    case 'today':
      return format(now, "EEEE d MMMM", { locale: fr });
    case 'week':
      return `Semaine ${format(now, 'w', { locale: fr })}`;
    case 'month':
      return format(now, 'MMMM yyyy', { locale: fr });
    default:
      return '';
  }
}

function getPreviousPeriodLabel(period: Period): string {
  const now = new Date();
  switch (period) {
    case 'today':
      return 'Hier';
    case 'week':
      return 'Semaine précédente';
    case 'month':
      return format(subMonths(now, 1), 'MMMM', { locale: fr });
    default:
      return '';
  }
}

export function useDashboardStatsWithPeriod(period: Period) {
  const [stats, setStats] = useState<PeriodStats>({
    totalVolume: 0,
    chiffreAffaires: 0,
    curMoyen: 0,
    margeBrute: 0,
    margeBrutePct: 0,
    profitNet: 0,
    totalDepenses: 0,
    nbLivraisons: 0,
    nbFactures: 0,
    nbClients: 0,
    volumeTrend: 0,
    caTrend: 0,
    curTrend: 0,
    margeTrend: 0,
    periodLabel: '',
    previousPeriodLabel: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { start, end, prevStart, prevEnd } = getPeriodDates(period);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        const prevStartStr = format(prevStart, 'yyyy-MM-dd');
        const prevEndStr = format(prevEnd, 'yyyy-MM-dd');

        // Fetch current period deliveries
        const { data: currentDeliveries } = await supabase
          .from('bons_livraison_reels')
          .select('volume_m3, cur_reel, prix_vente_m3, marge_brute_pct, client_id, workflow_status')
          .gte('date_livraison', startStr)
          .lte('date_livraison', endStr)
          .in('workflow_status', ['livre', 'facture']);

        // Fetch previous period deliveries
        const { data: prevDeliveries } = await supabase
          .from('bons_livraison_reels')
          .select('volume_m3, cur_reel, prix_vente_m3, marge_brute_pct')
          .gte('date_livraison', prevStartStr)
          .lte('date_livraison', prevEndStr)
          .in('workflow_status', ['livre', 'facture']);

        // Fetch current period factures
        const { data: currentFactures } = await supabase
          .from('factures')
          .select('total_ht, cur_reel, volume_m3, marge_brute_dh')
          .gte('date_facture', startStr)
          .lte('date_facture', endStr);

        // Fetch previous period factures
        const { data: prevFactures } = await supabase
          .from('factures')
          .select('total_ht, cur_reel, volume_m3')
          .gte('date_facture', prevStartStr)
          .lte('date_facture', prevEndStr);

        // Fetch current period expenses
        const { data: currentDepenses } = await supabase
          .from('depenses')
          .select('montant')
          .gte('date_depense', startStr)
          .lte('date_depense', endStr);

        if (!isMounted) return;

        // Calculate current period metrics
        const totalVolume = currentDeliveries?.reduce((sum, d) => sum + (d.volume_m3 || 0), 0) || 0;
        const chiffreAffaires = currentFactures?.reduce((sum, f) => sum + (f.total_ht || 0), 0) || 0;
        const totalCoutReel = currentFactures?.reduce((sum, f) => sum + ((f.cur_reel || 0) * (f.volume_m3 || 0)), 0) || 0;
        const totalDepenses = currentDepenses?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0;
        
        const margeBrute = chiffreAffaires - totalCoutReel;
        const margeBrutePct = chiffreAffaires > 0 ? (margeBrute / chiffreAffaires) * 100 : 0;
        const profitNet = margeBrute - totalDepenses;
        
        const curValues = currentDeliveries?.filter(d => d.cur_reel).map(d => d.cur_reel!) || [];
        const curMoyen = curValues.length > 0 ? curValues.reduce((a, b) => a + b, 0) / curValues.length : 0;
        
        const nbLivraisons = currentDeliveries?.length || 0;
        const nbFactures = currentFactures?.length || 0;
        const nbClients = new Set(currentDeliveries?.map(d => d.client_id) || []).size;

        // Calculate previous period metrics
        const prevVolume = prevDeliveries?.reduce((sum, d) => sum + (d.volume_m3 || 0), 0) || 0;
        const prevCA = prevFactures?.reduce((sum, f) => sum + (f.total_ht || 0), 0) || 0;
        const prevCurValues = prevDeliveries?.filter(d => d.cur_reel).map(d => d.cur_reel!) || [];
        const prevCurMoyen = prevCurValues.length > 0 ? prevCurValues.reduce((a, b) => a + b, 0) / prevCurValues.length : 0;
        const prevMargeValues = prevDeliveries?.filter(d => d.marge_brute_pct !== null).map(d => d.marge_brute_pct!) || [];
        const prevMargeMoyen = prevMargeValues.length > 0 ? prevMargeValues.reduce((a, b) => a + b, 0) / prevMargeValues.length : 0;

        const margeValues = currentDeliveries?.filter(d => d.marge_brute_pct !== null).map(d => d.marge_brute_pct!) || [];
        const margeMoyen = margeValues.length > 0 ? margeValues.reduce((a, b) => a + b, 0) / margeValues.length : 0;

        // Calculate trends
        const volumeTrend = prevVolume > 0 ? ((totalVolume - prevVolume) / prevVolume) * 100 : 0;
        const caTrend = prevCA > 0 ? ((chiffreAffaires - prevCA) / prevCA) * 100 : 0;
        const curTrend = prevCurMoyen > 0 ? ((curMoyen - prevCurMoyen) / prevCurMoyen) * 100 : 0;
        const margeTrend = prevMargeMoyen > 0 ? ((margeMoyen - prevMargeMoyen) / prevMargeMoyen) * 100 : 0;

        setStats({
          totalVolume,
          chiffreAffaires,
          curMoyen,
          margeBrute,
          margeBrutePct,
          profitNet,
          totalDepenses,
          nbLivraisons,
          nbFactures,
          nbClients,
          volumeTrend,
          caTrend,
          curTrend,
          margeTrend,
          periodLabel: getPeriodLabel(period),
          previousPeriodLabel: getPreviousPeriodLabel(period),
        });
      } catch (error) {
        console.error('Error fetching period stats:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();
    
    return () => {
      isMounted = false;
    };
  }, [period, refreshTrigger]);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { stats, loading, refresh };
}
