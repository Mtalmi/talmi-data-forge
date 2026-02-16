import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

// ─── Benchmarking Types ───
export interface DriverPerformance {
  chauffeur_nom: string;
  total_livraisons: number;
  total_volume: number;
  avg_rotation_min: number;
  avg_attente_min: number;
  volume_perdu: number;
  score: number; // 0-100
}

export interface TruckPerformance {
  camion_id: string;
  total_livraisons: number;
  total_volume: number;
  total_km: number;
  avg_consommation: number;
  score: number;
}

export interface MonthComparison {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePct: number;
  trend: 'up' | 'down' | 'stable';
}

// ─── Client Scoring Types ───
export interface ClientScore {
  client_id: string;
  nom_client: string;
  risk_score: number; // 0-100 (100 = highest risk)
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  payment_delay_avg_days: number;
  credit_usage_pct: number;
  unpaid_amount: number;
  total_orders: number;
  last_order_days_ago: number;
  churn_probability: number; // 0-100
  factors: string[];
}

// ─── Production Cost Types ───
export interface MaterialCostAnalysis {
  materiau: string;
  theorique_total: number;
  reel_total: number;
  variance: number;
  variance_pct: number;
  cost_impact_dh: number;
  alert: boolean;
}

export interface FormulaCostBreakdown {
  formule_id: string;
  designation: string;
  nb_batches: number;
  avg_cur_theorique: number;
  avg_cur_reel: number;
  variance_pct: number;
  total_cost: number;
  leakage_dh: number;
}

// ─── Main Hook ───
export function useAnalyticsBI() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '12m'>('3m');

  // Benchmarking
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [trucks, setTrucks] = useState<TruckPerformance[]>([]);
  const [monthComparison, setMonthComparison] = useState<MonthComparison[]>([]);

  // Client Scoring
  const [clientScores, setClientScores] = useState<ClientScore[]>([]);

  // Production Cost
  const [materialCosts, setMaterialCosts] = useState<MaterialCostAnalysis[]>([]);
  const [formulaCosts, setFormulaCosts] = useState<FormulaCostBreakdown[]>([]);

  const periodMonths = period === '1m' ? 1 : period === '3m' ? 3 : period === '6m' ? 6 : 12;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const startDate = format(startOfMonth(subMonths(now, periodMonths)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
    const prevStartDate = format(startOfMonth(subMonths(now, periodMonths * 2)), 'yyyy-MM-dd');

    try {
      // Fetch all data in parallel
      const [blRes, clientsRes, formulesRes, prevBlRes, facturesRes] = await Promise.all([
        supabase.from('bons_livraison_reels')
          .select('bl_id, client_id, formule_id, volume_m3, chauffeur_nom, camion_assigne, date_livraison, prix_vente_m3, cur_reel, ciment_reel_kg, sable_reel_kg, gravette_reel_kg, eau_reel_l, adjuvant_reel_l, temps_rotation_minutes, temps_attente_chantier_minutes, km_parcourus, consommation_calculee, volume_perdu, workflow_status, statut_paiement, created_at')
          .gte('date_livraison', startDate)
          .lte('date_livraison', endDate),
        supabase.from('clients')
          .select('client_id, nom_client, solde_du, limite_credit_dh, delai_paiement_jours'),
        supabase.from('formules_theoriques')
          .select('formule_id, designation, ciment_kg_m3, sable_kg_m3, gravier_kg_m3, eau_l_m3, adjuvant_l_m3, cut_dh_m3'),
        supabase.from('bons_livraison_reels')
          .select('bl_id, volume_m3, prix_vente_m3, cur_reel, client_id, workflow_status, date_livraison')
          .gte('date_livraison', prevStartDate)
          .lt('date_livraison', startDate),
        supabase.from('factures')
          .select('facture_id, client_id, total_ttc, statut, date_facture')
          .gte('date_facture', startDate),
      ]);

      const bls = blRes.data || [];
      const clients = clientsRes.data || [];
      const formules = formulesRes.data || [];
      const prevBls = prevBlRes.data || [];
      const factures = facturesRes.data || [];

      // ─── BENCHMARKING: Drivers ───
      const driverMap = new Map<string, DriverPerformance>();
      bls.forEach(bl => {
        const name = bl.chauffeur_nom || 'Non assigné';
        const existing = driverMap.get(name) || { chauffeur_nom: name, total_livraisons: 0, total_volume: 0, avg_rotation_min: 0, avg_attente_min: 0, volume_perdu: 0, score: 0 };
        existing.total_livraisons++;
        existing.total_volume += bl.volume_m3 || 0;
        existing.avg_rotation_min += bl.temps_rotation_minutes || 0;
        existing.avg_attente_min += bl.temps_attente_chantier_minutes || 0;
        existing.volume_perdu += bl.volume_perdu || 0;
        driverMap.set(name, existing);
      });
      const driverList = Array.from(driverMap.values()).map(d => {
        if (d.total_livraisons > 0) {
          d.avg_rotation_min = Math.round(d.avg_rotation_min / d.total_livraisons);
          d.avg_attente_min = Math.round(d.avg_attente_min / d.total_livraisons);
        }
        // Score: higher volume + lower wait + lower lost volume = better
        const volumeScore = Math.min(d.total_volume / 50, 40); // max 40pts
        const waitPenalty = Math.min(d.avg_attente_min / 5, 20); // max -20pts
        const lossPenalty = Math.min(d.volume_perdu * 5, 20); // max -20pts
        d.score = Math.round(Math.max(0, Math.min(100, 60 + volumeScore - waitPenalty - lossPenalty)));
        return d;
      }).sort((a, b) => b.score - a.score);
      setDrivers(driverList);

      // ─── BENCHMARKING: Trucks ───
      const truckMap = new Map<string, TruckPerformance>();
      bls.forEach(bl => {
        const id = bl.camion_assigne || 'N/A';
        const existing = truckMap.get(id) || { camion_id: id, total_livraisons: 0, total_volume: 0, total_km: 0, avg_consommation: 0, score: 0 };
        existing.total_livraisons++;
        existing.total_volume += bl.volume_m3 || 0;
        existing.total_km += bl.km_parcourus || 0;
        existing.avg_consommation += bl.consommation_calculee || 0;
        truckMap.set(id, existing);
      });
      const truckList = Array.from(truckMap.values()).map(t => {
        if (t.total_livraisons > 0) t.avg_consommation = Math.round((t.avg_consommation / t.total_livraisons) * 10) / 10;
        const utilScore = Math.min(t.total_livraisons / 20, 50);
        const fuelPenalty = t.avg_consommation > 35 ? (t.avg_consommation - 35) * 2 : 0;
        t.score = Math.round(Math.max(0, Math.min(100, 50 + utilScore - fuelPenalty)));
        return t;
      }).sort((a, b) => b.score - a.score);
      setTrucks(truckList);

      // ─── BENCHMARKING: MoM Comparison ───
      const currentCA = bls.reduce((s, bl) => s + (bl.volume_m3 || 0) * (bl.prix_vente_m3 || 0), 0);
      const prevCA = prevBls.reduce((s, bl) => s + (bl.volume_m3 || 0) * (bl.prix_vente_m3 || 0), 0);
      const currentVol = bls.reduce((s, bl) => s + (bl.volume_m3 || 0), 0);
      const prevVol = prevBls.reduce((s, bl) => s + (bl.volume_m3 || 0), 0);
      const currentAvgCUR = bls.length > 0 ? bls.reduce((s, bl) => s + (bl.cur_reel || 0), 0) / bls.length : 0;
      const prevAvgCUR = prevBls.length > 0 ? prevBls.reduce((s, bl) => s + (bl.cur_reel || 0), 0) / prevBls.length : 0;

      const buildComp = (metric: string, curr: number, prev: number): MonthComparison => {
        const change = curr - prev;
        const changePct = prev > 0 ? ((change / prev) * 100) : curr > 0 ? 100 : 0;
        return { metric, currentValue: Math.round(curr), previousValue: Math.round(prev), change: Math.round(change), changePct: Math.round(changePct * 10) / 10, trend: changePct > 2 ? 'up' : changePct < -2 ? 'down' : 'stable' };
      };
      setMonthComparison([
        buildComp('Chiffre d\'Affaires (DH)', currentCA, prevCA),
        buildComp('Volume (m³)', currentVol, prevVol),
        buildComp('Livraisons', bls.length, prevBls.length),
        buildComp('CUR Moyen (DH/m³)', currentAvgCUR, prevAvgCUR),
      ]);

      // ─── CLIENT SCORING ───
      const clientScoreList: ClientScore[] = clients.map(client => {
        const clientBls = bls.filter(bl => bl.client_id === client.client_id);
        const clientFactures = factures.filter(f => f.client_id === client.client_id);
        const unpaidFactures = clientFactures.filter(f => f.statut !== 'payee');
        const unpaidAmount = unpaidFactures.reduce((s, f) => s + (f.total_ttc || 0), 0);

        // Payment delay: use client's delai_paiement_jours and unpaid invoices age
        const unpaidWithAge = unpaidFactures.map(f => ({
          ...f,
          age_days: differenceInDays(now, new Date(f.date_facture)),
          delay: Math.max(0, differenceInDays(now, new Date(f.date_facture)) - (client.delai_paiement_jours || 30)),
        }));
        const overdueFactures = unpaidWithAge.filter(f => f.delay > 0);
        const avgDelay = overdueFactures.length > 0
          ? overdueFactures.reduce((s, f) => s + f.delay, 0) / overdueFactures.length
          : 0;

        // Credit usage
        const creditLimit = client.limite_credit_dh || 100000;
        const creditUsage = Math.min(((client.solde_du || 0) / creditLimit) * 100, 100);

        // Last order
        const lastBl = clientBls.sort((a, b) => b.date_livraison.localeCompare(a.date_livraison))[0];
        const lastOrderDays = lastBl ? differenceInDays(now, new Date(lastBl.date_livraison)) : 999;

        // Risk score calculation
        const factors: string[] = [];
        let riskScore = 0;

        if (avgDelay > 60) { riskScore += 35; factors.push('Retard >60j'); }
        else if (avgDelay > 30) { riskScore += 20; factors.push('Retard >30j'); }
        else if (avgDelay > 15) { riskScore += 10; factors.push('Retard >15j'); }

        if (creditUsage > 90) { riskScore += 25; factors.push('Crédit >90%'); }
        else if (creditUsage > 70) { riskScore += 15; factors.push('Crédit >70%'); }

        if (unpaidAmount > 200000) { riskScore += 20; factors.push('Impayés >200K'); }
        else if (unpaidAmount > 100000) { riskScore += 10; factors.push('Impayés >100K'); }

        if (lastOrderDays > 60) { riskScore += 15; factors.push('Inactif >60j'); }
        else if (lastOrderDays > 30) { riskScore += 5; factors.push('Inactif >30j'); }

        // Churn probability based on inactivity and declining orders
        const recentBls = clientBls.filter(bl => differenceInDays(now, new Date(bl.date_livraison)) <= 30);
        const olderBls = clientBls.filter(bl => {
          const d = differenceInDays(now, new Date(bl.date_livraison));
          return d > 30 && d <= 60;
        });
        let churnProb = 0;
        if (lastOrderDays > 90) churnProb = 85;
        else if (lastOrderDays > 60) churnProb = 60;
        else if (lastOrderDays > 30 && recentBls.length < olderBls.length) churnProb = 40;
        else if (recentBls.length === 0) churnProb = 30;

        riskScore = Math.min(riskScore, 100);
        const riskLevel: ClientScore['risk_level'] = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

        return {
          client_id: client.client_id,
          nom_client: client.nom_client || client.client_id,
          risk_score: riskScore,
          risk_level: riskLevel,
          payment_delay_avg_days: Math.round(avgDelay),
          credit_usage_pct: Math.round(creditUsage),
          unpaid_amount: Math.round(unpaidAmount),
          total_orders: clientBls.length,
          last_order_days_ago: lastOrderDays,
          churn_probability: churnProb,
          factors,
        };
      }).sort((a, b) => b.risk_score - a.risk_score);
      setClientScores(clientScoreList);

      // ─── PRODUCTION COST ANALYSIS ───
      const formulaMap = new Map(formules.map(f => [f.formule_id, f]));

      // Material-level analysis
      const materials: Record<string, { theorique: number; reel: number; unitCost: number }> = {
        'Ciment (kg)': { theorique: 0, reel: 0, unitCost: 1.2 },
        'Sable (kg)': { theorique: 0, reel: 0, unitCost: 0.15 },
        'Gravette (kg)': { theorique: 0, reel: 0, unitCost: 0.18 },
        'Eau (L)': { theorique: 0, reel: 0, unitCost: 0.01 },
        'Adjuvant (L)': { theorique: 0, reel: 0, unitCost: 12 },
      };

      bls.forEach(bl => {
        const formula = formulaMap.get(bl.formule_id);
        if (!formula) return;
        const vol = bl.volume_m3 || 0;

        materials['Ciment (kg)'].theorique += (formula.ciment_kg_m3 || 0) * vol;
        materials['Ciment (kg)'].reel += bl.ciment_reel_kg || 0;
        materials['Sable (kg)'].theorique += (formula.sable_kg_m3 || 0) * vol;
        materials['Sable (kg)'].reel += bl.sable_reel_kg || 0;
        materials['Gravette (kg)'].theorique += (formula.gravier_kg_m3 || 0) * vol;
        materials['Gravette (kg)'].reel += bl.gravette_reel_kg || 0;
        materials['Eau (L)'].theorique += (formula.eau_l_m3 || 0) * vol;
        materials['Eau (L)'].reel += bl.eau_reel_l || 0;
        materials['Adjuvant (L)'].theorique += (formula.adjuvant_l_m3 || 0) * vol;
        materials['Adjuvant (L)'].reel += bl.adjuvant_reel_l || 0;
      });

      const matAnalysis: MaterialCostAnalysis[] = Object.entries(materials).map(([name, data]) => {
        const variance = data.reel - data.theorique;
        const variancePct = data.theorique > 0 ? (variance / data.theorique) * 100 : 0;
        return {
          materiau: name,
          theorique_total: Math.round(data.theorique),
          reel_total: Math.round(data.reel),
          variance: Math.round(variance),
          variance_pct: Math.round(variancePct * 10) / 10,
          cost_impact_dh: Math.round(variance * data.unitCost),
          alert: Math.abs(variancePct) > 5,
        };
      });
      setMaterialCosts(matAnalysis);

      // Formula-level cost breakdown
      const formulaCostMap = new Map<string, FormulaCostBreakdown>();
      bls.forEach(bl => {
        const formula = formulaMap.get(bl.formule_id);
        if (!formula) return;
        const existing = formulaCostMap.get(bl.formule_id) || {
          formule_id: bl.formule_id,
          designation: formula.designation || bl.formule_id,
          nb_batches: 0,
          avg_cur_theorique: formula.cut_dh_m3 || 0,
          avg_cur_reel: 0,
          variance_pct: 0,
          total_cost: 0,
          leakage_dh: 0,
        };
        existing.nb_batches++;
        existing.avg_cur_reel += bl.cur_reel || 0;
        existing.total_cost += (bl.cur_reel || 0) * (bl.volume_m3 || 0);
        formulaCostMap.set(bl.formule_id, existing);
      });
      const formulaCostList = Array.from(formulaCostMap.values()).map(f => {
        if (f.nb_batches > 0) f.avg_cur_reel = Math.round(f.avg_cur_reel / f.nb_batches);
        f.variance_pct = f.avg_cur_theorique > 0 ? Math.round(((f.avg_cur_reel - f.avg_cur_theorique) / f.avg_cur_theorique) * 1000) / 10 : 0;
        f.leakage_dh = Math.round((f.avg_cur_reel - f.avg_cur_theorique) * f.nb_batches * 8); // approx 8m³/batch
        return f;
      }).sort((a, b) => b.leakage_dh - a.leakage_dh);
      setFormulaCosts(formulaCostList);

    } catch (err) {
      console.error('[AnalyticsBI] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [periodMonths]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    loading, period, setPeriod, refresh: fetchAll,
    // Benchmarking
    drivers, trucks, monthComparison,
    // Client Scoring
    clientScores,
    // Production Cost
    materialCosts, formulaCosts,
  };
}
