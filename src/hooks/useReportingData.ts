import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  format,
  eachMonthOfInterval,
  startOfYear,
} from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import { useI18n } from '@/i18n/I18nContext';

const { useState, useEffect, useCallback } = React;

export interface ClientPL {
  client_id: string;
  nom_client: string;
  total_volume: number;
  total_ca: number;
  total_cout: number;
  marge_brute: number;
  marge_pct: number;
  nb_livraisons: number;
  avg_prix_m3: number;
}

export interface FormulaPL {
  formule_id: string;
  designation: string;
  total_volume: number;
  total_ca: number;
  total_cout: number;
  marge_brute: number;
  marge_pct: number;
  nb_livraisons: number;
  avg_cur: number;
}

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  volume: number;
  chiffre_affaires: number;
  marge_brute: number;
  marge_pct: number;
  nb_livraisons: number;
  avg_cur: number;
  depenses: number;
  profit_net: number;
}

export interface ForecastData {
  month: string;
  predicted_volume: number;
  predicted_ca: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PeriodSummary {
  totalCA: number;
  totalMarge: number;
  avgMargePct: number;
  totalVolume: number;
  totalDepenses: number;
  profitNet: number;
  nbClients: number;
  nbLivraisons: number;
}

export interface ReportingData {
  clientsPL: ClientPL[];
  formulasPL: FormulaPL[];
  monthlyTrends: MonthlyTrend[];
  forecast: ForecastData[];
  topClients: ClientPL[];
  bottomClients: ClientPL[];
  summary: PeriodSummary;
}

export function useReportingData(monthsBack: number = 12) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [data, setData] = useState<ReportingData | null>(null);
  const [previousPeriodData, setPreviousPeriodData] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '12m' | 'ytd'>('12m');

  const fetchPeriodData = useCallback(async (startDate: Date, endDate: Date) => {
    // Fetch factures for the period
    const { data: factures } = await supabase
      .from('factures')
      .select('client_id, formule_id, date_facture, volume_m3, total_ht, cur_reel, marge_brute_dh')
      .gte('date_facture', format(startDate, 'yyyy-MM-dd'))
      .lte('date_facture', format(endDate, 'yyyy-MM-dd'));

    // Fetch depenses
    const { data: depenses } = await supabase
      .from('depenses')
      .select('date_depense, montant')
      .gte('date_depense', format(startDate, 'yyyy-MM-dd'))
      .lte('date_depense', format(endDate, 'yyyy-MM-dd'));

    const totalCA = factures?.reduce((s, f) => s + (f.total_ht || 0), 0) || 0;
    const totalCout = factures?.reduce((s, f) => s + ((f.cur_reel || 0) * (f.volume_m3 || 0)), 0) || 0;
    const totalMarge = totalCA - totalCout;
    const totalVolume = factures?.reduce((s, f) => s + (f.volume_m3 || 0), 0) || 0;
    const totalDepenses = depenses?.reduce((s, d) => s + (d.montant || 0), 0) || 0;
    const uniqueClients = new Set(factures?.map(f => f.client_id) || []);

    return {
      totalCA: Math.round(totalCA),
      totalMarge: Math.round(totalMarge),
      avgMargePct: totalCA > 0 ? Math.round((totalMarge / totalCA) * 1000) / 10 : 0,
      totalVolume: Math.round(totalVolume * 10) / 10,
      totalDepenses: Math.round(totalDepenses),
      profitNet: Math.round(totalMarge - totalDepenses),
      nbClients: uniqueClients.size,
      nbLivraisons: factures?.length || 0,
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let months: number;
      let startDate: Date;
      let prevStartDate: Date;
      let prevEndDate: Date;

      if (selectedPeriod === '6m') {
        months = 6;
        startDate = startOfMonth(subMonths(now, months - 1));
        prevStartDate = startOfMonth(subMonths(now, months * 2 - 1));
        prevEndDate = endOfMonth(subMonths(now, months));
      } else if (selectedPeriod === 'ytd') {
        startDate = startOfYear(now);
        months = now.getMonth() + 1;
        // Previous period is same months last year
        prevStartDate = startOfYear(subMonths(now, 12));
        prevEndDate = endOfMonth(subMonths(now, 12 - months + 1));
      } else {
        months = 12;
        startDate = startOfMonth(subMonths(now, months - 1));
        prevStartDate = startOfMonth(subMonths(now, months * 2 - 1));
        prevEndDate = endOfMonth(subMonths(now, months));
      }

      const endDate = endOfMonth(now);

      // Fetch previous period data for comparison
      const prevData = await fetchPeriodData(prevStartDate, prevEndDate);
      setPreviousPeriodData(prevData);

      // Fetch all BLs with client and formula data
      const { data: bls } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          client_id,
          formule_id,
          date_livraison,
          volume_m3,
          prix_vente_m3,
          cur_reel,
          marge_brute_pct,
          workflow_status
        `)
        .gte('date_livraison', format(startDate, 'yyyy-MM-dd'))
        .lte('date_livraison', format(endDate, 'yyyy-MM-dd'))
        .in('workflow_status', ['livre', 'facture']);

      // Fetch clients
      const { data: clients } = await supabase
        .from('clients')
        .select('client_id, nom_client');

      // Fetch formulas
      const { data: formulas } = await supabase
        .from('formules_theoriques')
        .select('formule_id, designation');

      // Fetch factures for accurate CA
      const { data: factures } = await supabase
        .from('factures')
        .select('client_id, formule_id, date_facture, volume_m3, total_ht, cur_reel, marge_brute_dh')
        .gte('date_facture', format(startDate, 'yyyy-MM-dd'))
        .lte('date_facture', format(endDate, 'yyyy-MM-dd'));

      // Fetch depenses
      const { data: depenses } = await supabase
        .from('depenses')
        .select('date_depense, montant')
        .gte('date_depense', format(startDate, 'yyyy-MM-dd'))
        .lte('date_depense', format(endDate, 'yyyy-MM-dd'));

      const clientsMap = new Map(clients?.map(c => [c.client_id, c.nom_client]) || []);
      const formulasMap = new Map(formulas?.map(f => [f.formule_id, f.designation]) || []);

      // Calculate Client P&L
      const clientStats = new Map<string, {
        volume: number;
        ca: number;
        cout: number;
        count: number;
      }>();

      factures?.forEach(f => {
        const existing = clientStats.get(f.client_id) || { volume: 0, ca: 0, cout: 0, count: 0 };
        existing.volume += f.volume_m3 || 0;
        existing.ca += f.total_ht || 0;
        existing.cout += (f.cur_reel || 0) * (f.volume_m3 || 0);
        existing.count += 1;
        clientStats.set(f.client_id, existing);
      });

      const clientsPL: ClientPL[] = Array.from(clientStats.entries()).map(([client_id, stats]) => ({
        client_id,
        nom_client: clientsMap.get(client_id) || client_id,
        total_volume: Math.round(stats.volume * 10) / 10,
        total_ca: Math.round(stats.ca),
        total_cout: Math.round(stats.cout),
        marge_brute: Math.round(stats.ca - stats.cout),
        marge_pct: stats.ca > 0 ? Math.round(((stats.ca - stats.cout) / stats.ca) * 1000) / 10 : 0,
        nb_livraisons: stats.count,
        avg_prix_m3: stats.volume > 0 ? Math.round((stats.ca / stats.volume) * 10) / 10 : 0,
      })).sort((a, b) => b.marge_brute - a.marge_brute);

      // Calculate Formula P&L
      const formulaStats = new Map<string, {
        volume: number;
        ca: number;
        cout: number;
        count: number;
        curSum: number;
      }>();

      factures?.forEach(f => {
        const existing = formulaStats.get(f.formule_id) || { volume: 0, ca: 0, cout: 0, count: 0, curSum: 0 };
        existing.volume += f.volume_m3 || 0;
        existing.ca += f.total_ht || 0;
        existing.cout += (f.cur_reel || 0) * (f.volume_m3 || 0);
        existing.count += 1;
        existing.curSum += f.cur_reel || 0;
        formulaStats.set(f.formule_id, existing);
      });

      const formulasPL: FormulaPL[] = Array.from(formulaStats.entries()).map(([formule_id, stats]) => ({
        formule_id,
        designation: formulasMap.get(formule_id) || formule_id,
        total_volume: Math.round(stats.volume * 10) / 10,
        total_ca: Math.round(stats.ca),
        total_cout: Math.round(stats.cout),
        marge_brute: Math.round(stats.ca - stats.cout),
        marge_pct: stats.ca > 0 ? Math.round(((stats.ca - stats.cout) / stats.ca) * 1000) / 10 : 0,
        nb_livraisons: stats.count,
        avg_cur: stats.count > 0 ? Math.round((stats.curSum / stats.count) * 10) / 10 : 0,
      })).sort((a, b) => b.marge_brute - a.marge_brute);

      // Calculate Monthly Trends
      const monthIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
      const monthlyTrends: MonthlyTrend[] = monthIntervals.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthStr = format(monthStart, 'yyyy-MM');
        const monthLabel = format(monthStart, 'MMM yy', { locale: dateLocale });

        const monthFactures = factures?.filter(f => {
          const d = new Date(f.date_facture);
          return d >= monthStart && d <= monthEnd;
        }) || [];

        const monthDepenses = depenses?.filter(d => {
          const date = new Date(d.date_depense);
          return date >= monthStart && date <= monthEnd;
        }) || [];

        const volume = monthFactures.reduce((s, f) => s + (f.volume_m3 || 0), 0);
        const ca = monthFactures.reduce((s, f) => s + (f.total_ht || 0), 0);
        const cout = monthFactures.reduce((s, f) => s + ((f.cur_reel || 0) * (f.volume_m3 || 0)), 0);
        const marge = ca - cout;
        const dep = monthDepenses.reduce((s, d) => s + (d.montant || 0), 0);
        const curValues = monthFactures.filter(f => f.cur_reel).map(f => f.cur_reel!);

        return {
          month: monthStr,
          monthLabel,
          volume: Math.round(volume * 10) / 10,
          chiffre_affaires: Math.round(ca),
          marge_brute: Math.round(marge),
          marge_pct: ca > 0 ? Math.round((marge / ca) * 1000) / 10 : 0,
          nb_livraisons: monthFactures.length,
          avg_cur: curValues.length > 0 ? Math.round((curValues.reduce((a, b) => a + b, 0) / curValues.length) * 10) / 10 : 0,
          depenses: Math.round(dep),
          profit_net: Math.round(marge - dep),
        };
      });

      // Simple Forecasting (3-month moving average trend)
      const lastMonths = monthlyTrends.slice(-3);
      const avgVolume = lastMonths.reduce((s, m) => s + m.volume, 0) / Math.max(lastMonths.length, 1);
      const avgCA = lastMonths.reduce((s, m) => s + m.chiffre_affaires, 0) / Math.max(lastMonths.length, 1);
      
      // Calculate trend from last 3 months
      const trend = lastMonths.length >= 2 
        ? (lastMonths[lastMonths.length - 1].volume > lastMonths[0].volume ? 'up' : 
           lastMonths[lastMonths.length - 1].volume < lastMonths[0].volume ? 'down' : 'stable')
        : 'stable';

      const forecast: ForecastData[] = [1, 2, 3].map(i => ({
        month: format(subMonths(now, -i), 'MMM yy', { locale: dateLocale }),
        predicted_volume: Math.round(avgVolume * (trend === 'up' ? 1.05 ** i : trend === 'down' ? 0.95 ** i : 1) * 10) / 10,
        predicted_ca: Math.round(avgCA * (trend === 'up' ? 1.05 ** i : trend === 'down' ? 0.95 ** i : 1)),
        confidence: Math.max(50, 90 - i * 15),
        trend,
      }));

      // Summary
      const totalCA = factures?.reduce((s, f) => s + (f.total_ht || 0), 0) || 0;
      const totalCout = factures?.reduce((s, f) => s + ((f.cur_reel || 0) * (f.volume_m3 || 0)), 0) || 0;
      const totalMarge = totalCA - totalCout;
      const totalVolume = factures?.reduce((s, f) => s + (f.volume_m3 || 0), 0) || 0;
      const totalDepenses = depenses?.reduce((s, d) => s + (d.montant || 0), 0) || 0;

      setData({
        clientsPL,
        formulasPL,
        monthlyTrends,
        forecast,
        topClients: clientsPL.slice(0, 5),
        bottomClients: [...clientsPL].sort((a, b) => a.marge_pct - b.marge_pct).slice(0, 5),
        summary: {
          totalCA: Math.round(totalCA),
          totalMarge: Math.round(totalMarge),
          avgMargePct: totalCA > 0 ? Math.round((totalMarge / totalCA) * 1000) / 10 : 0,
          totalVolume: Math.round(totalVolume * 10) / 10,
          totalDepenses: Math.round(totalDepenses),
          profitNet: Math.round(totalMarge - totalDepenses),
          nbClients: clientsPL.length,
          nbLivraisons: factures?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching reporting data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, fetchPeriodData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, selectedPeriod, setSelectedPeriod, refresh: fetchData, previousPeriodData };
}
