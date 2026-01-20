import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Stock {
  id: string;
  materiau: string;
  quantite_actuelle: number;
  seuil_alerte: number;
  unite: string;
  capacite_max: number | null;
  derniere_reception_at: string | null;
  updated_at: string;
}

interface MouvementStock {
  id: string;
  materiau: string;
  type_mouvement: string;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  reference_id: string | null;
  fournisseur: string | null;
  numero_bl_fournisseur: string | null;
  notes: string | null;
  created_at: string;
}

interface ConsumptionStats {
  materiau: string;
  avg_daily: number;
  days_remaining: number;
}

export function useStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [consumptionStats, setConsumptionStats] = useState<ConsumptionStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('materiau');

      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Erreur lors du chargement des stocks');
    }
  }, []);

  const fetchMouvements = useCallback(async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setMouvements(data || []);
    } catch (error) {
      console.error('Error fetching mouvements:', error);
    }
  }, []);

  const calculateConsumptionStats = useCallback(async () => {
    try {
      // Get consumption data from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('mouvements_stock')
        .select('materiau, quantite')
        .eq('type_mouvement', 'consommation')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      // Calculate average daily consumption per material
      const consumptionByMaterial: Record<string, number> = {};
      (data || []).forEach(m => {
        consumptionByMaterial[m.materiau] = (consumptionByMaterial[m.materiau] || 0) + m.quantite;
      });

      const stats: ConsumptionStats[] = stocks.map(stock => {
        const totalConsumption = consumptionByMaterial[stock.materiau] || 0;
        const avgDaily = totalConsumption / 7;
        const daysRemaining = avgDaily > 0 ? stock.quantite_actuelle / avgDaily : 999;

        return {
          materiau: stock.materiau,
          avg_daily: avgDaily,
          days_remaining: Math.floor(daysRemaining),
        };
      });

      setConsumptionStats(stats);
    } catch (error) {
      console.error('Error calculating consumption stats:', error);
    }
  }, [stocks]);

  const addReception = useCallback(async (
    materiau: string,
    quantite: number,
    fournisseur: string,
    numeroBl: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      // Get current stock
      const stock = stocks.find(s => s.materiau === materiau);
      if (!stock) {
        toast.error('Matériau non trouvé');
        return false;
      }

      const quantiteAvant = stock.quantite_actuelle;
      const quantiteApres = quantiteAvant + quantite;

      // Update stock
      const { error: updateError } = await supabase
        .from('stocks')
        .update({
          quantite_actuelle: quantiteApres,
          derniere_reception_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('materiau', materiau);

      if (updateError) throw updateError;

      // Record movement
      const { error: moveError } = await supabase
        .from('mouvements_stock')
        .insert({
          materiau,
          type_mouvement: 'reception',
          quantite,
          quantite_avant: quantiteAvant,
          quantite_apres: quantiteApres,
          fournisseur,
          numero_bl_fournisseur: numeroBl,
          notes,
        });

      if (moveError) throw moveError;

      toast.success(`${quantite} ${stock.unite} de ${materiau} ajoutés au stock`);
      await fetchStocks();
      await fetchMouvements();
      return true;
    } catch (error) {
      console.error('Error adding reception:', error);
      toast.error('Erreur lors de l\'ajout de la réception');
      return false;
    }
  }, [stocks, fetchStocks, fetchMouvements]);

  const adjustStock = useCallback(async (
    materiau: string,
    nouvelleQuantite: number,
    notes: string
  ): Promise<boolean> => {
    try {
      const stock = stocks.find(s => s.materiau === materiau);
      if (!stock) {
        toast.error('Matériau non trouvé');
        return false;
      }

      const quantiteAvant = stock.quantite_actuelle;

      // Update stock
      const { error: updateError } = await supabase
        .from('stocks')
        .update({
          quantite_actuelle: nouvelleQuantite,
          updated_at: new Date().toISOString(),
        })
        .eq('materiau', materiau);

      if (updateError) throw updateError;

      // Record adjustment
      const { error: moveError } = await supabase
        .from('mouvements_stock')
        .insert({
          materiau,
          type_mouvement: 'ajustement',
          quantite: nouvelleQuantite - quantiteAvant,
          quantite_avant: quantiteAvant,
          quantite_apres: nouvelleQuantite,
          notes,
        });

      if (moveError) throw moveError;

      toast.success('Stock ajusté');
      await fetchStocks();
      await fetchMouvements();
      return true;
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Erreur lors de l\'ajustement');
      return false;
    }
  }, [stocks, fetchStocks, fetchMouvements]);

  const updateAlertThreshold = useCallback(async (
    materiau: string,
    seuilAlerte: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('stocks')
        .update({ seuil_alerte: seuilAlerte })
        .eq('materiau', materiau);

      if (error) throw error;

      toast.success('Seuil d\'alerte mis à jour');
      await fetchStocks();
      return true;
    } catch (error) {
      console.error('Error updating threshold:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchStocks]);

  // Deduct stock consumption for a production run
  const deductConsumption = useCallback(async (
    blId: string,
    consumption: { materiau: string; quantite: number }[]
  ): Promise<boolean> => {
    try {
      for (const item of consumption) {
        const stock = stocks.find(s => 
          s.materiau.toLowerCase().includes(item.materiau.toLowerCase()) ||
          item.materiau.toLowerCase().includes(s.materiau.toLowerCase())
        );
        
        if (!stock) {
          console.warn(`Stock for ${item.materiau} not found, skipping...`);
          continue;
        }

        const quantiteAvant = stock.quantite_actuelle;
        const quantiteApres = Math.max(0, quantiteAvant - item.quantite);

        // Update stock
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            quantite_actuelle: quantiteApres,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stock.id);

        if (updateError) throw updateError;

        // Record movement
        const { error: moveError } = await supabase
          .from('mouvements_stock')
          .insert({
            materiau: stock.materiau,
            type_mouvement: 'consommation',
            quantite: item.quantite,
            quantite_avant: quantiteAvant,
            quantite_apres: quantiteApres,
            reference_id: blId,
            reference_table: 'bons_livraison_reels',
            notes: `Production BL ${blId}`,
          });

        if (moveError) throw moveError;

        // Create alert if stock is low
        if (quantiteApres <= stock.seuil_alerte) {
          await supabase.from('alertes_systeme').insert({
            type_alerte: 'stock_critique',
            niveau: quantiteApres <= stock.seuil_alerte / 2 ? 'critical' : 'warning',
            titre: 'Stock Critique',
            message: `${stock.materiau}: ${quantiteApres.toFixed(0)} ${stock.unite} restant(s) (seuil: ${stock.seuil_alerte})`,
            reference_id: stock.id,
            reference_table: 'stocks',
            destinataire_role: 'ceo',
          });
        }
      }

      await fetchStocks();
      await fetchMouvements();
      return true;
    } catch (error) {
      console.error('Error deducting consumption:', error);
      toast.error('Erreur lors de la déduction des stocks');
      return false;
    }
  }, [stocks, fetchStocks, fetchMouvements]);

  const getCriticalStocks = useCallback((): Stock[] => {
    return stocks.filter(s => s.quantite_actuelle <= s.seuil_alerte);
  }, [stocks]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStocks();
      await fetchMouvements();
      setLoading(false);
    };
    loadData();
  }, [fetchStocks, fetchMouvements]);

  useEffect(() => {
    if (stocks.length > 0) {
      calculateConsumptionStats();
    }
  }, [stocks, calculateConsumptionStats]);

  return {
    stocks,
    mouvements,
    consumptionStats,
    loading,
    fetchStocks,
    fetchMouvements,
    addReception,
    adjustStock,
    updateAlertThreshold,
    getCriticalStocks,
    deductConsumption,
  };
}
