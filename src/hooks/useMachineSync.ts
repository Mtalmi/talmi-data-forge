import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MachineData {
  ciment_reel_kg: number;
  adjuvant_reel_l: number;
  eau_reel_l: number;
  machine_id: string;
  timestamp: string;
}

interface SyncResult {
  success: boolean;
  data?: MachineData;
  error?: string;
}

// Simulated machine data generator for testing
const generateSimulatedMachineData = (
  cimentTheorique: number,
  adjuvantTheorique: number,
  eauTheorique: number,
  volume: number
): MachineData => {
  // Simulate realistic variations (-8% to +8% from theoretical)
  const getVariation = (base: number) => {
    const variationPercent = (Math.random() - 0.5) * 0.16; // -8% to +8%
    return Math.round(base * (1 + variationPercent) * 100) / 100;
  };

  return {
    ciment_reel_kg: getVariation(cimentTheorique * volume),
    adjuvant_reel_l: getVariation(adjuvantTheorique * volume),
    eau_reel_l: getVariation(eauTheorique * volume),
    machine_id: `MC-${Math.floor(Math.random() * 9000 + 1000)}`,
    timestamp: new Date().toISOString(),
  };
};

export function useMachineSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Simulate pulling data from batching plant API
  const simulateMachineSync = useCallback(async (
    formule: { ciment_kg_m3: number; adjuvant_l_m3: number; eau_l_m3: number },
    volume: number
  ): Promise<SyncResult> => {
    setSyncing(true);
    
    try {
      // Simulate network delay (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Generate simulated machine data
      const machineData = generateSimulatedMachineData(
        formule.ciment_kg_m3,
        formule.adjuvant_l_m3,
        formule.eau_l_m3,
        volume
      );
      
      setLastSync(new Date());
      toast.success('Données synchronisées depuis la centrale');
      
      return { success: true, data: machineData };
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur de synchronisation');
      return { success: false, error: 'Échec de connexion à la centrale' };
    } finally {
      setSyncing(false);
    }
  }, []);

  // Update BL with machine data
  const updateBonWithMachineData = useCallback(async (
    blId: string,
    machineData: MachineData
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bons_livraison_reels')
        .update({
          ciment_reel_kg: machineData.ciment_reel_kg,
          adjuvant_reel_l: machineData.adjuvant_reel_l,
          eau_reel_l: machineData.eau_reel_l,
          source_donnees: 'machine_sync',
          machine_id: machineData.machine_id,
        })
        .eq('bl_id', blId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating BL with machine data:', error);
      toast.error('Erreur lors de la mise à jour du bon');
      return false;
    }
  }, []);

  // Calculate deviation percentage
  const calculateDeviation = useCallback((
    realValue: number,
    theoreticalValue: number
  ): number => {
    if (theoreticalValue === 0) return 0;
    return Math.abs((realValue - theoreticalValue) / theoreticalValue) * 100;
  }, []);

  // Check if justification is required (>5% deviation)
  const requiresJustification = useCallback((
    cimentReel: number,
    cimentTheorique: number,
    adjuvantReel: number,
    adjuvantTheorique: number,
    eauReel: number,
    eauTheorique: number
  ): { required: boolean; deviations: { field: string; percent: number }[] } => {
    const deviations: { field: string; percent: number }[] = [];
    
    const cimentDeviation = calculateDeviation(cimentReel, cimentTheorique);
    if (cimentDeviation > 5) {
      deviations.push({ field: 'ciment', percent: cimentDeviation });
    }
    
    const adjuvantDeviation = calculateDeviation(adjuvantReel, adjuvantTheorique);
    if (adjuvantDeviation > 5) {
      deviations.push({ field: 'adjuvant', percent: adjuvantDeviation });
    }
    
    const eauDeviation = calculateDeviation(eauReel, eauTheorique);
    if (eauDeviation > 5) {
      deviations.push({ field: 'eau', percent: eauDeviation });
    }
    
    return {
      required: deviations.length > 0,
      deviations,
    };
  }, [calculateDeviation]);

  return {
    syncing,
    lastSync,
    simulateMachineSync,
    updateBonWithMachineData,
    calculateDeviation,
    requiresJustification,
  };
}
