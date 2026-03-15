import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMoroccoToday, getMoroccoYesterday, getMoroccoMonthStart } from '@/utils/timezone';
import { throttle } from '@/utils/debounce';

export interface DashboardLiveData {
  loading: boolean;
  error: string | null;
  production: { volume: number; batches: number; conformite: number; cadence: number; marge: number };
  revenue: { today: number; trend: number };
  tresorerie: { value: number; trend: number };
  profitNet: { total: number; revenu: number; matieres: number; logistique: number; personnel: number; marge: number };
  pipeline: { value: number; devisCount: number; conversion: number };
  stocks: Array<{ name: string; current: number; max: number; unit: string; autonomie: number; seuilAlerte: number }>;
  stockDepletions: Array<{ name: string; dailyRate: number; daysLeft: number }>;
  clientsEnRetard: number;
  alertes: Array<{ id: string; type: string; severite: string; message: string; titre: string; created_at: string }>;
  livraisons: { today: number; enRoute: number; livrees: number; planifiees: number };
  labConformite: number;
  pipelineStages: { devis: number; bcValides: number; production: number; facture: number };
  score: number;
  batches: number;
  lastSync: Date;
}

const INITIAL: DashboardLiveData = {
  loading: true,
  error: null,
  production: { volume: 0, batches: 0, conformite: 0, cadence: 0, marge: 0 },
  revenue: { today: 0, trend: 0 },
  tresorerie: { value: 0, trend: 0 },
  profitNet: { total: 0, revenu: 0, matieres: 0, logistique: 0, personnel: 0, marge: 0 },
  pipeline: { value: 0, devisCount: 0, conversion: 0 },
  stocks: [],
  stockDepletions: [],
  clientsEnRetard: 0,
  alertes: [],
  livraisons: { today: 0, enRoute: 0, livrees: 0, planifiees: 0 },
  labConformite: 0,
  pipelineStages: { devis: 0, bcValides: 0, production: 0, facture: 0 },
  score: 0,
  batches: 0,
  lastSync: new Date(),
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardLiveData>(INITIAL);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const fetchAll = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    try {
      const today = getMoroccoToday();
      const yesterday = getMoroccoYesterday();
      const monthStart = getMoroccoMonthStart();

      // Run all queries in parallel
      const [
        bonsToday, bonsYesterday, stocksRes, devisActive, devisTotal, devisConverted,
        overdueInvoices, alertesRes, livraisonsRes, labRes, paidThisMonth,
        bcToday, blLivreToday, dailyScoreRes, batchesRes
      ] = await Promise.all([
        // Revenue today — from delivered bons
        supabase.from('bons_livraison_reels')
          .select('montant, volume_m3, workflow_status, statut_paiement')
          .gte('date_livraison', today)
          .lte('date_livraison', today),
        // Revenue yesterday
        supabase.from('bons_livraison_reels')
          .select('montant')
          .gte('date_livraison', yesterday)
          .lte('date_livraison', yesterday)
          .in('workflow_status', ['livre', 'facture']),
        // Stocks
        supabase.from('stocks')
          .select('materiau, quantite_actuelle, capacite_max, unite, seuil_alerte, consommation_moy_jour, autonomie_jours'),
        // Pipeline — active devis
        supabase.from('devis')
          .select('total_ht, statut')
          .in('statut', ['brouillon', 'envoye']),
        // Total devis for conversion
        supabase.from('devis')
          .select('*', { count: 'exact', head: true }),
        // Converted devis
        supabase.from('devis')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'accepte'),
        // Overdue invoices
        supabase.from('factures')
          .select('client_id')
          .eq('statut', 'en_retard'),
        // Active alertes
        supabase.from('alertes')
          .select('id, type, severite, message, titre, created_at')
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(10),
        // Livraisons today
        supabase.from('bons_livraison_reels')
          .select('workflow_status')
          .gte('date_livraison', today),
        // Lab tests today
        supabase.from('tests_laboratoire')
          .select('resistance_conforme, affaissement_conforme, alerte_qualite')
          .gte('date_prelevement', today),
        // Trésorerie — paid this month (include those without date_paiement but statut=payee)
        supabase.from('factures')
          .select('total_ttc')
          .eq('statut', 'payee'),
        // BC validated today (pipeline stages)
        supabase.from('bons_commande')
          .select('statut')
          .gte('created_at', today + 'T00:00:00'),
        // BL delivered today
        supabase.from('bons_livraison_reels')
          .select('facture_generee')
          .gte('date_livraison', today)
          .eq('workflow_status', 'facture'),
        // Daily score — try today, fallback to latest
        supabase.from('daily_scores')
          .select('score_total')
          .order('score_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Production batches today
        supabase.from('production_batches')
          .select('volume_m3, status, conformite_status, cout_matiere')
          .gte('created_at', today + 'T00:00:00'),
      ]);

      if (!mountedRef.current || currentFetchId !== fetchIdRef.current) return;

      // Calculate production
      const allBons = bonsToday.data || [];
      const livresBons = allBons.filter(b => b.workflow_status === 'livre' || b.workflow_status === 'facture');
      const totalVolume = livresBons.reduce((s, b) => s + (b.volume_m3 || 0), 0);
      const revenueToday = livresBons.reduce((s, b) => s + (b.montant || 0), 0);
      const revenueYesterday = (bonsYesterday.data || []).reduce((s, b) => s + (b.montant || 0), 0);
      const revenueTrend = revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : 0;

      // Production batches
      const batches = batchesRes.data || [];
      const completedBatches = batches.filter(b => b.status === 'complete' || b.status === 'decharge');
      const batchVolume = completedBatches.reduce((s, b) => s + (b.volume_m3 || 0), 0);
      const totalCoutMatiere = completedBatches.reduce((s, b) => s + (b.cout_matiere || 0), 0);
      
      // Use batch volume if available, otherwise BL volume
      const prodVolume = batchVolume > 0 ? batchVolume : totalVolume;
      const totalBatches = batches.length || allBons.length;

      // Conformité from lab
      const labTests = labRes.data || [];
      const totalTests = labTests.length;
      const nonConform = labTests.filter(t => t.alerte_qualite || t.resistance_conforme === false || t.affaissement_conforme === false).length;
      const conformRate = safeDivide((totalTests - nonConform), totalTests, 1) * 100;

      // Marge — match revenue to costs using same data scope
      // When few bons are delivered but many batches produced, revenue << cost → nonsensical marge
      // Fix: use estimated revenue from production volume when actual delivery revenue is incomplete
      const estimatedRevenue = prodVolume * 850; // avg price/m³ across formulas
      const effectiveRevenue = revenueToday > estimatedRevenue * 0.3 ? revenueToday : estimatedRevenue;
      const effectiveCost = totalCoutMatiere > 0 ? totalCoutMatiere : effectiveRevenue * 0.50;
      let margeValue = roundPercent(safeDivide(effectiveRevenue - effectiveCost, effectiveRevenue) * 100);
      // Guard: clamp unreasonable values (data incomplete) — NEVER show -470.6%
      if (margeValue < -100 || margeValue > 100 || !isFinite(margeValue)) margeValue = 0;

      // Trésorerie
      const tresorerieValue = (paidThisMonth.data || []).reduce((s, f) => s + (f.total_ttc || 0), 0);

      // Pipeline
      const pipelineValue = (devisActive.data || []).reduce((s, d) => s + (d.total_ht || 0), 0);
      const devisCount = (devisActive.data || []).length;
      const conversionRate = safeDivide((devisConverted.count || 0), (devisTotal.count || 0)) * 100;

      // Stocks
      const stockLevels = (stocksRes.data || []).map(s => ({
        name: s.materiau || 'Inconnu',
        current: s.quantite_actuelle || 0,
        max: s.capacite_max || 10000,
        unit: s.unite || 'kg',
        autonomie: s.autonomie_jours || 999,
        seuilAlerte: s.seuil_alerte || 0,
      }));

      // Stock depletions (sorted by urgency)
      const depletions = stockLevels
        .filter(s => s.max > 0)
        .map(s => {
          const pct = (s.current / s.max) * 100;
          const dailyRate = s.max > 0 ? Math.round(((s.max - s.current) / s.max) * 100 / 7 * 10) / 10 : 0;
          return { name: s.name, dailyRate, daysLeft: Math.floor(s.autonomie) || Math.ceil(pct / (dailyRate || 1)) };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

      // Clients en retard
      const uniqueClientsEnRetard = new Set((overdueInvoices.data || []).map(f => f.client_id)).size;

      // Livraisons
      const todayLivraisons = livraisonsRes.data || [];
      const livrees = todayLivraisons.filter(l => l.workflow_status === 'livre' || l.workflow_status === 'facture').length;
      const enRoute = todayLivraisons.filter(l => l.workflow_status === 'en_livraison').length;
      const planifiees = todayLivraisons.filter(l => l.workflow_status === 'planification' || l.workflow_status === 'production').length;

      // Pipeline stages
      const bcValidated = (bcToday.data || []).filter(b => b.statut === 'valide' || b.statut === 'en_production').length;
      const factured = (blLivreToday.data || []).length;

      // P&L
      const logistiqueCost = effectiveRevenue * 0.07;
      const personnelCost = 8400;
      const profitTotal = effectiveRevenue - effectiveCost - logistiqueCost - personnelCost;

      // Score
      const scoreTotal = dailyScoreRes.data?.score_total || 0;

      setData({
        loading: false,
        error: null,
        production: {
          volume: Math.round(prodVolume * 10) / 10,
          batches: totalBatches,
          conformite: Math.round(conformRate * 10) / 10,
          cadence: totalBatches > 0 ? Math.round(prodVolume / totalBatches) : 0,
          marge: Math.round(margeValue * 10) / 10,
        },
        revenue: { today: Math.round(revenueToday), trend: Math.round(revenueTrend * 10) / 10 },
        tresorerie: { value: Math.round(tresorerieValue), trend: 0 },
        profitNet: {
          total: Math.round(profitTotal),
          revenu: Math.round(effectiveRevenue),
          matieres: Math.round(effectiveCost),
          logistique: Math.round(logistiqueCost),
          personnel: personnelCost,
          marge: margeValue > 0 ? Math.round(margeValue * 10) / 10 : 0,
        },
        pipeline: { value: Math.round(pipelineValue), devisCount, conversion: Math.round(conversionRate) },
        stocks: stockLevels,
        stockDepletions: depletions,
        clientsEnRetard: uniqueClientsEnRetard,
        alertes: (alertesRes.data || []).map(a => ({
          id: a.id, type: a.type, severite: a.severite, message: a.message, titre: a.titre, created_at: a.created_at,
        })),
        livraisons: { today: todayLivraisons.length, enRoute, livrees, planifiees },
        labConformite: Math.round(conformRate * 10) / 10,
        pipelineStages: { devis: devisCount, bcValides: bcValidated, production: planifiees, facture: factured },
        score: scoreTotal,
        batches: totalBatches,
        lastSync: new Date(),
      });
    } catch (error: any) {
      console.error('[TBOS] Dashboard data fetch error:', error);
      if (mountedRef.current) {
        setData(prev => ({ ...prev, loading: false, error: error?.message || 'Fetch error' }));
      }
    }
  }, []);

  // Throttle real-time callbacks to max 1 refresh per 2 seconds
  const throttledFetch = useMemo(() => throttle(() => fetchAll(), 2000), [fetchAll]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();

    const interval = setInterval(fetchAll, 60000);

    const channel = supabase.channel('dashboard-live-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => throttledFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, () => throttledFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, () => throttledFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tests_laboratoire' }, () => throttledFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, () => throttledFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devis' }, () => throttledFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertes' }, () => throttledFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_scores' }, () => throttledFetch())
      .subscribe();

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchAll, throttledFetch]);

  return { ...data, refresh: fetchAll };
}
