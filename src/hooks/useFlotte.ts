import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Vehicule {
  id: string;
  id_camion: string;
  type: string;
  proprietaire: string;
  is_interne: boolean;
  chauffeur: string | null;
  telephone_chauffeur: string | null;
  statut: string;
  capacite_m3: number | null;
  immatriculation: string | null;
  km_compteur: number | null;
  notes: string | null;
}

interface SuiviCarburant {
  id: string;
  id_camion: string;
  date_releve: string;
  litres: number;
  km_compteur: number;
  km_parcourus: number | null;
  consommation_l_100km: number | null;
  cout_total_dh: number | null;
  station: string | null;
  created_at: string;
}

interface IncidentFlotte {
  id: string;
  id_camion: string;
  type_incident: string;
  description: string;
  date_incident: string;
  resolu: boolean;
  created_at: string;
}

interface ProviderStats {
  proprietaire: string;
  nombre_rotations: number;
  temps_moyen_rotation: number;
  incidents_count: number;
  volume_total: number;
}

// Active delivery info for a truck
export interface ActiveDelivery {
  bl_id: string;
  client_nom: string | null;
  volume_m3: number;
  workflow_status: string;
  zone_nom: string | null;
}

// Map truck ID to active delivery
export type ActiveDeliveriesMap = Record<string, ActiveDelivery>;

export function useFlotte() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [carburant, setCarburant] = useState<SuiviCarburant[]>([]);
  const [incidents, setIncidents] = useState<IncidentFlotte[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDeliveriesMap>({});
  const [loading, setLoading] = useState(true);

  const fetchVehicules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('flotte')
        .select('*')
        .order('id_camion');

      if (error) throw error;
      setVehicules(data || []);
    } catch (error) {
      console.error('Error fetching flotte:', error);
      toast.error('Erreur lors du chargement de la flotte');
    }
  }, []);

  const fetchCarburant = useCallback(async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('suivi_carburant')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setCarburant(data || []);
    } catch (error) {
      console.error('Error fetching carburant:', error);
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('incidents_flotte')
        .select('*')
        .order('date_incident', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  }, []);

  // Fetch active deliveries for today to determine which trucks are in service
  const fetchActiveDeliveries = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get all deliveries for today that have a truck assigned and are not yet completed
      // Includes: planification (scheduled), production, validation_technique, en_livraison
      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          volume_m3,
          workflow_status,
          camion_assigne,
          toupie_assignee,
          clients (nom_client),
          zones_livraison (nom_zone)
        `)
        .eq('date_livraison', today)
        .in('workflow_status', ['planification', 'production', 'validation_technique', 'en_livraison'])
        .or('camion_assigne.not.is.null,toupie_assignee.not.is.null');

      if (error) throw error;

      // Build a map of truck ID -> active delivery
      const deliveryMap: ActiveDeliveriesMap = {};
      
      (data || []).forEach((bl) => {
        const delivery: ActiveDelivery = {
          bl_id: bl.bl_id,
          client_nom: bl.clients?.nom_client || null,
          volume_m3: bl.volume_m3,
          workflow_status: bl.workflow_status || 'production',
          zone_nom: bl.zones_livraison?.nom_zone || null,
        };

        // Map both camion_assigne and toupie_assignee
        if (bl.camion_assigne) {
          deliveryMap[bl.camion_assigne] = delivery;
        }
        if (bl.toupie_assignee) {
          deliveryMap[bl.toupie_assignee] = delivery;
        }
      });

      setActiveDeliveries(deliveryMap);
    } catch (error) {
      console.error('Error fetching active deliveries:', error);
    }
  }, []);

  const calculateProviderStats = useCallback(async () => {
    try {
      // Get rotation data from BLs with assigned trucks
      const { data: bls, error: blsError } = await supabase
        .from('bons_livraison_reels')
        .select('toupie_assignee, volume_m3, temps_rotation_minutes')
        .not('toupie_assignee', 'is', null)
        .not('heure_retour_centrale', 'is', null);

      if (blsError) throw blsError;

      // Get truck to provider mapping
      const truckToProvider: Record<string, string> = {};
      vehicules.forEach(v => {
        truckToProvider[v.id_camion] = v.proprietaire;
      });

      // Aggregate stats by provider
      const statsMap: Record<string, { rotations: number; totalTime: number; volume: number }> = {};
      
      (bls || []).forEach(bl => {
        const provider = truckToProvider[bl.toupie_assignee || ''] || 'Inconnu';
        if (!statsMap[provider]) {
          statsMap[provider] = { rotations: 0, totalTime: 0, volume: 0 };
        }
        statsMap[provider].rotations += 1;
        statsMap[provider].totalTime += bl.temps_rotation_minutes || 0;
        statsMap[provider].volume += bl.volume_m3 || 0;
      });

      // Count incidents by provider
      const incidentsByProvider: Record<string, number> = {};
      incidents.forEach(inc => {
        const provider = truckToProvider[inc.id_camion] || 'Inconnu';
        incidentsByProvider[provider] = (incidentsByProvider[provider] || 0) + 1;
      });

      // Build final stats
      const stats: ProviderStats[] = Object.entries(statsMap).map(([provider, data]) => ({
        proprietaire: provider,
        nombre_rotations: data.rotations,
        temps_moyen_rotation: data.rotations > 0 ? Math.round(data.totalTime / data.rotations) : 0,
        incidents_count: incidentsByProvider[provider] || 0,
        volume_total: data.volume,
      }));

      // Sort by rotations descending
      stats.sort((a, b) => b.nombre_rotations - a.nombre_rotations);
      setProviderStats(stats);
    } catch (error) {
      console.error('Error calculating provider stats:', error);
    }
  }, [vehicules, incidents]);

  const addVehicule = useCallback(async (data: {
    id_camion: string;
    type: string;
    proprietaire: string;
    is_interne: boolean;
    chauffeur: string | null;
    capacite_m3: number;
  }): Promise<boolean> => {
    try {
      const { error } = await supabase.from('flotte').insert([data]);
      if (error) throw error;
      toast.success('Véhicule ajouté');
      await fetchVehicules();
      return true;
    } catch (error) {
      console.error('Error adding vehicule:', error);
      toast.error('Erreur lors de l\'ajout');
      return false;
    }
  }, [fetchVehicules]);

  const updateVehiculeStatus = useCallback(async (
    idCamion: string,
    statut: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('flotte')
        .update({ statut, updated_at: new Date().toISOString() })
        .eq('id_camion', idCamion);

      if (error) throw error;
      toast.success('Statut mis à jour');
      await fetchVehicules();
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchVehicules]);

  const addFuelEntry = useCallback(async (
    idCamion: string,
    litres: number,
    kmCompteur: number,
    coutTotal?: number,
    station?: string
  ): Promise<boolean> => {
    try {
      // Get last km reading for this truck
      const { data: lastEntry } = await supabase
        .from('suivi_carburant')
        .select('km_compteur')
        .eq('id_camion', idCamion)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let kmParcourus: number | null = null;
      let consommation: number | null = null;

      if (lastEntry) {
        kmParcourus = kmCompteur - lastEntry.km_compteur;
        if (kmParcourus > 0) {
          consommation = (litres / kmParcourus) * 100;
        }
      }

      const { error } = await supabase.from('suivi_carburant').insert([{
        id_camion: idCamion,
        litres,
        km_compteur: kmCompteur,
        km_parcourus: kmParcourus,
        consommation_l_100km: consommation,
        cout_total_dh: coutTotal,
        station,
      }]);

      if (error) throw error;

      // Update truck km counter
      await supabase
        .from('flotte')
        .update({ km_compteur: kmCompteur })
        .eq('id_camion', idCamion);

      toast.success('Relevé carburant enregistré');
      await fetchCarburant();
      return true;
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      toast.error('Erreur lors de l\'enregistrement');
      return false;
    }
  }, [fetchCarburant]);

  const addIncident = useCallback(async (
    idCamion: string,
    typeIncident: string,
    description: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from('incidents_flotte').insert([{
        id_camion: idCamion,
        type_incident: typeIncident,
        description,
      }]);

      if (error) throw error;
      toast.success('Incident enregistré');
      await fetchIncidents();
      return true;
    } catch (error) {
      console.error('Error adding incident:', error);
      toast.error('Erreur lors de l\'enregistrement');
      return false;
    }
  }, [fetchIncidents]);

  const getAvailableVehicules = useCallback((type?: string): Vehicule[] => {
    return vehicules.filter(v => 
      v.statut === 'Disponible' && (!type || v.type === type)
    );
  }, [vehicules]);

  const getAverageConsumption = useCallback((idCamion: string): number | null => {
    const entries = carburant.filter(c => 
      c.id_camion === idCamion && c.consommation_l_100km !== null
    );
    if (entries.length === 0) return null;
    
    const sum = entries.reduce((acc, e) => acc + (e.consommation_l_100km || 0), 0);
    return sum / entries.length;
  }, [carburant]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVehicules(), fetchCarburant(), fetchIncidents(), fetchActiveDeliveries()]);
      setLoading(false);
    };
    loadData();
  }, [fetchVehicules, fetchCarburant, fetchIncidents, fetchActiveDeliveries]);

  useEffect(() => {
    if (vehicules.length > 0) {
      calculateProviderStats();
    }
  }, [vehicules, incidents, calculateProviderStats]);

  // Set up realtime subscription for delivery updates
  useEffect(() => {
    const channel = supabase
      .channel('flotte-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bons_livraison_reels',
        },
        () => {
          // Refetch active deliveries when any BL changes
          fetchActiveDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveDeliveries]);

  return {
    vehicules,
    carburant,
    incidents,
    providerStats,
    activeDeliveries,
    loading,
    fetchVehicules,
    fetchCarburant,
    fetchIncidents,
    fetchActiveDeliveries,
    addVehicule,
    updateVehiculeStatus,
    addFuelEntry,
    addIncident,
    getAvailableVehicules,
    getAverageConsumption,
  };
}
