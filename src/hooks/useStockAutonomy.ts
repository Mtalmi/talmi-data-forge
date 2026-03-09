import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StockAutonomy {
  materiau: string;
  quantite_actuelle: number;
  seuil_alerte: number;
  unite: string;
  capacite_max: number | null;
  avgDailyUsage: number;
  daysRemaining: number;
  hoursRemaining: number;
  status: 'critical' | 'low' | 'healthy';
}

/**
 * Reads autonomy data from the stock_autonomy_cache Supabase table
 * and enriches it with stock metadata (seuil_alerte, unite, capacite_max).
 */
export function useStockAutonomy() {
  const [autonomy, setAutonomy] = useState<StockAutonomy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutonomy = useCallback(async () => {
    try {
      const [cacheRes, stocksRes] = await Promise.all([
        supabase.from('stock_autonomy_cache').select('materiau, days_remaining, avg_daily_consumption, current_qty'),
        supabase.from('stocks').select('materiau, quantite_actuelle, seuil_alerte, unite, capacite_max'),
      ]);

      if (cacheRes.error) throw cacheRes.error;
      if (stocksRes.error) throw stocksRes.error;

      const stockMap = new Map(
        (stocksRes.data || []).map(s => [s.materiau, s])
      );

      const autonomyData: StockAutonomy[] = (cacheRes.data || []).map(cached => {
        const stock = stockMap.get(cached.materiau);
        const daysRemaining = cached.days_remaining ?? 9999;
        const hoursRemaining = daysRemaining * 24;
        const currentQty = stock?.quantite_actuelle ?? cached.current_qty ?? 0;
        const seuilAlerte = stock?.seuil_alerte ?? 0;

        let status: StockAutonomy['status'] = 'healthy';
        if (currentQty <= seuilAlerte) {
          status = 'critical';
        } else if (daysRemaining <= 3) {
          status = 'critical';
        } else if (daysRemaining <= 7) {
          status = 'low';
        }

        return {
          materiau: cached.materiau,
          quantite_actuelle: currentQty,
          seuil_alerte: seuilAlerte,
          unite: stock?.unite || 'kg',
          capacite_max: stock?.capacite_max ?? null,
          avgDailyUsage: cached.avg_daily_consumption ?? 0,
          daysRemaining,
          hoursRemaining,
          status,
        };
      });

      // Also include stocks that have no cache entry
      (stocksRes.data || []).forEach(stock => {
        if (!cacheRes.data?.some(c => c.materiau === stock.materiau)) {
          let status: StockAutonomy['status'] = 'healthy';
          if (stock.quantite_actuelle <= stock.seuil_alerte) status = 'critical';

          autonomyData.push({
            materiau: stock.materiau,
            quantite_actuelle: stock.quantite_actuelle,
            seuil_alerte: stock.seuil_alerte,
            unite: stock.unite,
            capacite_max: stock.capacite_max,
            avgDailyUsage: 0,
            daysRemaining: 9999,
            hoursRemaining: 9999 * 24,
            status,
          });
        }
      });

      setAutonomy(autonomyData);
    } catch (error) {
      console.error('Error fetching stock autonomy:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutonomy();

    const channel = supabase
      .channel('stock-autonomy-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_autonomy_cache' }, () => fetchAutonomy())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, () => fetchAutonomy())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAutonomy]);

  const getAutonomyForMaterial = useCallback((materiau: string) => {
    return autonomy.find((a) => a.materiau === materiau);
  }, [autonomy]);

  const getCriticalMaterials = useCallback(() => {
    return autonomy.filter((a) => a.status === 'critical');
  }, [autonomy]);

  const getLowMaterials = useCallback(() => {
    return autonomy.filter((a) => a.status === 'low');
  }, [autonomy]);

  return {
    autonomy,
    loading,
    refresh: fetchAutonomy,
    getAutonomyForMaterial,
    getCriticalMaterials,
    getLowMaterials,
  };
}
