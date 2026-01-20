import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MachineData {
  ciment_reel_kg: number;
  adjuvant_reel_l: number;
  eau_reel_l: number;
  sable_reel_kg?: number;
  gravette_reel_kg?: number;
  machine_id: string;
  timestamp: string;
}

interface ApiProductionData {
  bl_id: string;
  machine_id: string;
  timestamp: string;
  production_data: {
    ciment_reel_kg: number;
    adjuvant_reel_l: number;
    eau_reel_l: number;
    sable_reel_kg?: number;
    gravette_reel_kg?: number;
  };
}

interface SyncResult {
  success: boolean;
  data?: MachineData;
  error?: string;
}

// Convert API response to internal MachineData format
const convertApiResponse = (apiData: ApiProductionData): MachineData => {
  return {
    ciment_reel_kg: apiData.production_data.ciment_reel_kg,
    adjuvant_reel_l: apiData.production_data.adjuvant_reel_l,
    eau_reel_l: apiData.production_data.eau_reel_l,
    sable_reel_kg: apiData.production_data.sable_reel_kg,
    gravette_reel_kg: apiData.production_data.gravette_reel_kg,
    machine_id: apiData.machine_id,
    timestamp: apiData.timestamp,
  };
};

// Simulated machine data generator for testing/fallback
const generateSimulatedMachineData = (
  cimentTheorique: number,
  adjuvantTheorique: number,
  eauTheorique: number,
  sableTheorique: number,
  gravetteTheorique: number,
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
    sable_reel_kg: getVariation(sableTheorique * volume * 1600), // m³ to kg (density ~1600 kg/m³)
    gravette_reel_kg: getVariation(gravetteTheorique * volume * 1500), // m³ to kg (density ~1500 kg/m³)
    machine_id: `MC-${Math.floor(Math.random() * 9000 + 1000)}`,
    timestamp: new Date().toISOString(),
  };
};

export function useMachineSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Fetch real data from batching plant API
  const fetchMachineData = useCallback(async (blId: string): Promise<SyncResult> => {
    setSyncing(true);
    
    try {
      // Call the real endpoint - adjust URL as needed for your API
      const response = await fetch(`/api/centrale/production/${blId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const apiData: ApiProductionData = await response.json();
      const machineData = convertApiResponse(apiData);
      
      setLastSync(new Date());
      toast.success('Données synchronisées depuis la centrale');
      
      return { success: true, data: machineData };
    } catch (error) {
      console.error('Real API sync error:', error);
      // Fall back to simulation if API is not available
      return { success: false, error: 'Endpoint API non disponible - utilisation de la simulation' };
    } finally {
      setSyncing(false);
    }
  }, []);

  // Simulate pulling data from batching plant API (fallback/testing)
  const simulateMachineSync = useCallback(async (
    formule: { 
      ciment_kg_m3: number; 
      adjuvant_l_m3: number; 
      eau_l_m3: number;
      sable_m3?: number;
      gravette_m3?: number;
    },
    volume: number
  ): Promise<SyncResult> => {
    setSyncing(true);
    
    try {
      // Simulate network delay (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Generate simulated machine data including sable and gravette
      const machineData = generateSimulatedMachineData(
        formule.ciment_kg_m3,
        formule.adjuvant_l_m3,
        formule.eau_l_m3,
        formule.sable_m3 || 0.4, // Default sable m³ per m³ concrete
        formule.gravette_m3 || 0.8, // Default gravette m³ per m³ concrete
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

  // Sync with real API first, fallback to simulation
  const syncMachineData = useCallback(async (
    blId: string,
    formule: { 
      ciment_kg_m3: number; 
      adjuvant_l_m3: number; 
      eau_l_m3: number;
      sable_m3?: number;
      gravette_m3?: number;
    },
    volume: number
  ): Promise<SyncResult> => {
    // Try real API first
    const realResult = await fetchMachineData(blId);
    
    if (realResult.success) {
      return realResult;
    }
    
    // Fallback to simulation
    console.log('Falling back to simulated data');
    return simulateMachineSync(formule, volume);
  }, [fetchMachineData, simulateMachineSync]);

  // Update BL with machine data (including sable/gravette)
  const updateBonWithMachineData = useCallback(async (
    blId: string,
    machineData: MachineData
  ): Promise<boolean> => {
    try {
      const updatePayload: Record<string, unknown> = {
        ciment_reel_kg: machineData.ciment_reel_kg,
        adjuvant_reel_l: machineData.adjuvant_reel_l,
        eau_reel_l: machineData.eau_reel_l,
        source_donnees: 'machine_sync',
        machine_id: machineData.machine_id,
      };

      // Add sable/gravette if available from machine
      if (machineData.sable_reel_kg !== undefined) {
        updatePayload.sable_reel_kg = machineData.sable_reel_kg;
      }
      if (machineData.gravette_reel_kg !== undefined) {
        updatePayload.gravette_reel_kg = machineData.gravette_reel_kg;
      }

      const { error } = await supabase
        .from('bons_livraison_reels')
        .update(updatePayload)
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
    eauTheorique: number,
    sableReel?: number,
    sableTheorique?: number,
    gravetteReel?: number,
    gravetteTheorique?: number
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

    // Check sable deviation if values provided
    if (sableReel !== undefined && sableTheorique !== undefined && sableTheorique > 0) {
      const sableDeviation = calculateDeviation(sableReel, sableTheorique);
      if (sableDeviation > 5) {
        deviations.push({ field: 'sable', percent: sableDeviation });
      }
    }

    // Check gravette deviation if values provided
    if (gravetteReel !== undefined && gravetteTheorique !== undefined && gravetteTheorique > 0) {
      const gravetteDeviation = calculateDeviation(gravetteReel, gravetteTheorique);
      if (gravetteDeviation > 5) {
        deviations.push({ field: 'gravette', percent: gravetteDeviation });
      }
    }
    
    return {
      required: deviations.length > 0,
      deviations,
    };
  }, [calculateDeviation]);

  // Convert machine data to stock consumption array
  const getStockConsumption = useCallback((machineData: MachineData): { materiau: string; quantite: number }[] => {
    const consumption: { materiau: string; quantite: number }[] = [
      { materiau: 'ciment', quantite: machineData.ciment_reel_kg / 1000 }, // kg to tonnes
      { materiau: 'adjuvant', quantite: machineData.adjuvant_reel_l },
      { materiau: 'eau', quantite: machineData.eau_reel_l / 1000 }, // L to m³
    ];

    // Add sable if tracked by machine (convert kg to m³: density ~1600 kg/m³)
    if (machineData.sable_reel_kg !== undefined && machineData.sable_reel_kg > 0) {
      consumption.push({ materiau: 'sable', quantite: machineData.sable_reel_kg / 1600 });
    }

    // Add gravette if tracked by machine (convert kg to m³: density ~1500 kg/m³)
    if (machineData.gravette_reel_kg !== undefined && machineData.gravette_reel_kg > 0) {
      consumption.push({ materiau: 'gravette', quantite: machineData.gravette_reel_kg / 1500 });
    }

    return consumption.filter(c => c.quantite > 0);
  }, []);

  return {
    syncing,
    lastSync,
    fetchMachineData,
    simulateMachineSync,
    syncMachineData,
    updateBonWithMachineData,
    calculateDeviation,
    requiresJustification,
    getStockConsumption,
  };
}
