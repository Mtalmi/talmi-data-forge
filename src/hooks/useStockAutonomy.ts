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
 * Oracle Logic Hook - Calculates estimated autonomy for each material
 * Divides current stock by average daily usage from last 7 days
 */
export function useStockAutonomy() {
  const [autonomy, setAutonomy] = useState<StockAutonomy[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateAutonomy = useCallback(async () => {
    try {
      // 1. Fetch current stock levels
      const { data: stocks, error: stockError } = await supabase
        .from('stocks')
        .select('*');

      if (stockError) throw stockError;

      // 2. Fetch last 7 days of consumption movements
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: mouvements, error: mouvementError } = await supabase
        .from('mouvements_stock')
        .select('materiau, quantite, type_mouvement, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('type_mouvement', 'production');

      if (mouvementError) throw mouvementError;

      // 3. Calculate average daily usage per material
      const usageByMaterial: Record<string, number[]> = {};
      
      (mouvements || []).forEach((m) => {
        if (!usageByMaterial[m.materiau]) {
          usageByMaterial[m.materiau] = [];
        }
        // Production consumption is stored as positive, but represents deduction
        usageByMaterial[m.materiau].push(Math.abs(m.quantite));
      });

      // Group by day and calculate daily totals
      const dailyUsage: Record<string, number> = {};
      Object.entries(usageByMaterial).forEach(([mat, quantities]) => {
        const totalWeek = quantities.reduce((sum, q) => sum + q, 0);
        // Average over 7 days (or fewer if less data)
        const daysWithData = Math.min(7, Math.max(1, quantities.length > 0 ? 7 : 1));
        dailyUsage[mat] = totalWeek / daysWithData;
      });

      // 4. Calculate autonomy for each stock
      const autonomyData: StockAutonomy[] = (stocks || []).map((stock) => {
        const avgDaily = dailyUsage[stock.materiau] || 0;
        const daysRemaining = avgDaily > 0 
          ? Math.floor(stock.quantite_actuelle / avgDaily)
          : 9999; // No consumption = infinite autonomy
        const hoursRemaining = daysRemaining * 24;

        let status: StockAutonomy['status'] = 'healthy';
        if (stock.quantite_actuelle <= stock.seuil_alerte) {
          status = 'critical';
        } else if (daysRemaining <= 3) {
          status = 'critical';
        } else if (daysRemaining <= 7) {
          status = 'low';
        }

        return {
          materiau: stock.materiau,
          quantite_actuelle: stock.quantite_actuelle,
          seuil_alerte: stock.seuil_alerte,
          unite: stock.unite,
          capacite_max: stock.capacite_max,
          avgDailyUsage: avgDaily,
          daysRemaining,
          hoursRemaining,
          status,
        };
      });

      setAutonomy(autonomyData);
    } catch (error) {
      console.error('Error calculating stock autonomy:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateAutonomy();

    // Refresh every 5 minutes
    const interval = setInterval(calculateAutonomy, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [calculateAutonomy]);

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
    refresh: calculateAutonomy,
    getAutonomyForMaterial,
    getCriticalMaterials,
    getLowMaterials,
  };
}
