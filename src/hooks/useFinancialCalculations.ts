import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Prix {
  matiere_premiere: string;
  prix_unitaire_dh: number;
}

interface Formule {
  formule_id: string;
  ciment_kg_m3: number;
  eau_l_m3: number;
  adjuvant_l_m3: number;
  sable_m3: number | null;
  gravette_m3: number | null;
  sable_kg_m3: number | null;
  gravier_kg_m3: number | null;
}

export interface QuoteBreakdown {
  cut_per_m3: number;
  fixed_cost_per_m3: number;
  transport_extra_per_m3: number;
  total_cost_per_m3: number;
  margin_pct: number;
  prix_vente_minimum: number;
  total_quote: number;
}

export function useFinancialCalculations() {
  const [prices, setPrices] = useState<Prix[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('prix_achat_actuels')
        .select('matiere_premiere, prix_unitaire_dh');
      
      if (error) throw error;
      setPrices(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [];
    }
  }, []);

  const getPrice = useCallback((keyword: string, priceList?: Prix[]): number => {
    const list = priceList || prices;
    const found = list.find(p => 
      p.matiere_premiere.toLowerCase().includes(keyword.toLowerCase())
    );
    return found?.prix_unitaire_dh || 0;
  }, [prices]);

  /**
   * Calculate Coût Unitaire Théorique (CUT) for a formula
   * Uses current prices from prix_achat_actuels
   */
  const calculateCUT = useCallback(async (formule: Formule): Promise<number> => {
    let priceList = prices;
    if (priceList.length === 0) {
      priceList = await fetchPrices();
    }

    const prixCiment = getPrice('ciment', priceList);
    const prixSable = getPrice('sable', priceList);
    const prixGravette = getPrice('gravier', priceList) || getPrice('gravette', priceList);
    const prixEau = getPrice('eau', priceList);
    const prixAdjuvant = getPrice('adjuvant', priceList);

    // Calculate sable in m³ (if stored in kg, convert using density ~1600 kg/m³)
    const sableM3 = formule.sable_m3 || (formule.sable_kg_m3 ? formule.sable_kg_m3 / 1600 : 0);
    // Calculate gravette in m³ (if stored in kg, convert using density ~1500 kg/m³)
    const gravetteM3 = formule.gravette_m3 || (formule.gravier_kg_m3 ? formule.gravier_kg_m3 / 1500 : 0);

    let cut = 0;
    // Ciment: price per tonne, convert kg to tonnes
    cut += (formule.ciment_kg_m3 / 1000) * prixCiment;
    // Sable: price per m³
    cut += sableM3 * prixSable;
    // Gravette: price per m³
    cut += gravetteM3 * prixGravette;
    // Eau: price per m³, convert liters to m³
    cut += (formule.eau_l_m3 / 1000) * prixEau;
    // Adjuvant: price per liter
    cut += formule.adjuvant_l_m3 * prixAdjuvant;

    return Math.round(cut * 100) / 100;
  }, [prices, fetchPrices, getPrice]);

  /**
   * Calculate smart quote price with margin
   * @param formuleId - Formula ID
   * @param volumeM3 - Volume in m³
   * @param distanceKm - Distance in km (default 20km included)
   * @returns Quote breakdown
   */
  const calculateQuote = useCallback(async (
    formuleId: string,
    volumeM3: number,
    distanceKm: number = 20
  ): Promise<QuoteBreakdown | null> => {
    setLoading(true);
    
    try {
      // Fetch formula
      const { data: formule, error } = await supabase
        .from('formules_theoriques')
        .select('*')
        .eq('formule_id', formuleId)
        .maybeSingle();

      if (error) throw error;
      if (!formule) {
        console.error('Formula not found:', formuleId);
        return null;
      }

      const fixedCost = 150; // Fixed overhead per m³
      const marginPct = 0.25; // 25% margin

      // Calculate CUT
      const cut = await calculateCUT(formule);

      // Calculate extra transport cost beyond 20km (5 DH/m³/km)
      const transportExtra = distanceKm > 20 ? (distanceKm - 20) * 5 : 0;

      // Total cost per m³
      const totalCost = cut + fixedCost + transportExtra;

      // Prix de Vente Minimum with 25% margin
      const pvm = totalCost / (1 - marginPct);

      return {
        cut_per_m3: cut,
        fixed_cost_per_m3: fixedCost,
        transport_extra_per_m3: transportExtra,
        total_cost_per_m3: totalCost,
        margin_pct: marginPct * 100,
        prix_vente_minimum: Math.round(pvm * 100) / 100,
        total_quote: Math.round(pvm * volumeM3 * 100) / 100,
      };
    } catch (error) {
      console.error('Error calculating quote:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculateCUT]);

  /**
   * Check for leakage: Real Cost > Theoretical Cost by threshold
   * @param curReel - Real unit cost
   * @param cutTheorique - Theoretical unit cost
   * @param threshold - Percentage threshold (default 5%)
   * @returns true if leakage detected
   */
  const checkLeakage = useCallback((
    curReel: number,
    cutTheorique: number,
    threshold: number = 5
  ): boolean => {
    if (!curReel || !cutTheorique || cutTheorique === 0) return false;
    const ecart = ((curReel - cutTheorique) / cutTheorique) * 100;
    return ecart > threshold;
  }, []);

  /**
   * Calculate leakage percentage
   */
  const calculateLeakagePercent = useCallback((
    curReel: number,
    cutTheorique: number
  ): number => {
    if (!curReel || !cutTheorique || cutTheorique === 0) return 0;
    return ((curReel - cutTheorique) / cutTheorique) * 100;
  }, []);

  return {
    prices,
    loading,
    fetchPrices,
    getPrice,
    calculateCUT,
    calculateQuote,
    checkLeakage,
    calculateLeakagePercent,
  };
}
