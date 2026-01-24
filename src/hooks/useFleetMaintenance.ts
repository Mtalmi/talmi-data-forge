import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FleetVehicle {
  id: string;
  id_camion: string;
  type: string;
  chauffeur: string | null;
  statut: string;
  km_compteur: number;
  km_last_vidange: number;
  km_last_pneumatiques: number;
  date_last_visite_technique: string | null;
  date_next_visite_technique: string | null;
  maintenance_status: 'healthy' | 'due_soon' | 'overdue';
  derniere_maintenance_at: string | null;
}

export interface ServiceRecord {
  id: string;
  id_camion: string;
  service_type: 'vidange' | 'visite_technique' | 'pneumatiques' | 'reparation' | 'autre';
  km_at_service: number;
  date_service: string;
  description: string | null;
  cout_pieces: number;
  cout_main_oeuvre: number;
  cout_total: number;
  pieces_utilisees: string[] | null;
  prestataire: string | null;
  photo_facture_url: string | null;
  photo_pieces_url: string | null;
  effectue_par_name: string | null;
  created_at: string;
}

export interface MaintenanceThresholds {
  vidange_km: number;
  pneumatiques_km: number;
  visite_months: number;
  warning_buffer_km: number;
}

export const MAINTENANCE_THRESHOLDS: MaintenanceThresholds = {
  vidange_km: 10000,
  pneumatiques_km: 40000,
  visite_months: 6,
  warning_buffer_km: 500,
};

export interface VehicleHealth {
  vehicle: FleetVehicle;
  vidange: {
    km_since_last: number;
    km_remaining: number;
    progress_pct: number;
    status: 'healthy' | 'due_soon' | 'overdue';
  };
  pneumatiques: {
    km_since_last: number;
    km_remaining: number;
    progress_pct: number;
    status: 'healthy' | 'due_soon' | 'overdue';
  };
  visite_technique: {
    days_remaining: number | null;
    next_date: string | null;
    status: 'healthy' | 'due_soon' | 'overdue' | 'unknown';
  };
  overall_status: 'healthy' | 'due_soon' | 'overdue';
}

export function useFleetMaintenance() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('flotte')
        .select('*')
        .order('id_camion');

      if (fetchError) throw fetchError;

      setVehicles((data || []).map(v => ({
        id: v.id,
        id_camion: v.id_camion,
        type: v.type,
        chauffeur: v.chauffeur,
        statut: v.statut,
        km_compteur: Number(v.km_compteur) || 0,
        km_last_vidange: Number(v.km_last_vidange) || 0,
        km_last_pneumatiques: Number(v.km_last_pneumatiques) || 0,
        date_last_visite_technique: v.date_last_visite_technique,
        date_next_visite_technique: v.date_next_visite_technique,
        maintenance_status: (v.maintenance_status as FleetVehicle['maintenance_status']) || 'healthy',
        derniere_maintenance_at: v.derniere_maintenance_at,
      })));
    } catch (err) {
      console.error('Error fetching fleet:', err);
      setError('Failed to load fleet data');
    }
  }, []);

  const fetchServiceRecords = useCallback(async (idCamion?: string) => {
    try {
      let query = supabase
        .from('fleet_service_records')
        .select('*')
        .order('date_service', { ascending: false })
        .limit(100);

      if (idCamion) {
        query = query.eq('id_camion', idCamion);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setServiceRecords((data || []) as ServiceRecord[]);
    } catch (err) {
      console.error('Error fetching service records:', err);
    }
  }, []);

  const calculateVehicleHealth = useCallback((vehicle: FleetVehicle): VehicleHealth => {
    const { vidange_km, pneumatiques_km, warning_buffer_km } = MAINTENANCE_THRESHOLDS;

    // Vidange calculations
    const km_since_vidange = vehicle.km_compteur - vehicle.km_last_vidange;
    const km_remaining_vidange = vidange_km - km_since_vidange;
    const vidange_progress = Math.min(100, (km_since_vidange / vidange_km) * 100);
    const vidange_status: VehicleHealth['vidange']['status'] = 
      km_remaining_vidange <= 0 ? 'overdue' :
      km_remaining_vidange <= warning_buffer_km ? 'due_soon' : 'healthy';

    // Pneumatiques calculations
    const km_since_pneus = vehicle.km_compteur - vehicle.km_last_pneumatiques;
    const km_remaining_pneus = pneumatiques_km - km_since_pneus;
    const pneus_progress = Math.min(100, (km_since_pneus / pneumatiques_km) * 100);
    const pneus_status: VehicleHealth['pneumatiques']['status'] =
      km_remaining_pneus <= 0 ? 'overdue' :
      km_remaining_pneus <= warning_buffer_km ? 'due_soon' : 'healthy';

    // Visite technique calculations
    let visite_status: VehicleHealth['visite_technique']['status'] = 'unknown';
    let days_remaining: number | null = null;

    if (vehicle.date_next_visite_technique) {
      const nextDate = new Date(vehicle.date_next_visite_technique);
      const now = new Date();
      days_remaining = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      visite_status = 
        days_remaining <= 0 ? 'overdue' :
        days_remaining <= 14 ? 'due_soon' : 'healthy';
    }

    // Overall status
    const statuses = [vidange_status, pneus_status, visite_status];
    const overall_status: VehicleHealth['overall_status'] = 
      statuses.includes('overdue') ? 'overdue' :
      statuses.includes('due_soon') ? 'due_soon' : 'healthy';

    return {
      vehicle,
      vidange: {
        km_since_last: km_since_vidange,
        km_remaining: km_remaining_vidange,
        progress_pct: vidange_progress,
        status: vidange_status,
      },
      pneumatiques: {
        km_since_last: km_since_pneus,
        km_remaining: km_remaining_pneus,
        progress_pct: pneus_progress,
        status: pneus_status,
      },
      visite_technique: {
        days_remaining,
        next_date: vehicle.date_next_visite_technique,
        status: visite_status,
      },
      overall_status,
    };
  }, []);

  const addServiceRecord = useCallback(async (
    idCamion: string,
    serviceType: ServiceRecord['service_type'],
    kmAtService: number,
    data: {
      description?: string;
      cout_pieces?: number;
      cout_main_oeuvre?: number;
      pieces_utilisees?: string[];
      prestataire?: string;
      photo_facture_url?: string;
      photo_pieces_url?: string;
    }
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.email?.split('@')[0] || 'Unknown';

      const { error: insertError } = await supabase
        .from('fleet_service_records')
        .insert({
          id_camion: idCamion,
          service_type: serviceType,
          km_at_service: kmAtService,
          date_service: new Date().toISOString().split('T')[0],
          description: data.description,
          cout_pieces: data.cout_pieces || 0,
          cout_main_oeuvre: data.cout_main_oeuvre || 0,
          pieces_utilisees: data.pieces_utilisees,
          prestataire: data.prestataire,
          photo_facture_url: data.photo_facture_url,
          photo_pieces_url: data.photo_pieces_url,
          effectue_par: userData.user?.id,
          effectue_par_name: userName,
        });

      if (insertError) throw insertError;

      toast.success(`Service ${serviceType} enregistré pour ${idCamion}`);
      await fetchVehicles();
      await fetchServiceRecords(idCamion);
      return true;
    } catch (err) {
      console.error('Error adding service record:', err);
      toast.error("Erreur lors de l'enregistrement du service");
      return false;
    }
  }, [fetchVehicles, fetchServiceRecords]);

  const getFleetHealthStats = useCallback(() => {
    const healthData = vehicles.map(calculateVehicleHealth);
    
    return {
      total: vehicles.length,
      healthy: healthData.filter(h => h.overall_status === 'healthy').length,
      due_soon: healthData.filter(h => h.overall_status === 'due_soon').length,
      overdue: healthData.filter(h => h.overall_status === 'overdue').length,
      vehicleHealth: healthData,
    };
  }, [vehicles, calculateVehicleHealth]);

  const uploadServicePhoto = useCallback(async (file: File, type: 'facture' | 'pieces'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `fleet-maintenance/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fleet-photos')
        .upload(filePath, file);

      if (uploadError) {
        // Try creating bucket if it doesn't exist
        const { error: bucketError } = await supabase.storage.createBucket('fleet-photos', {
          public: true,
        });
        
        if (!bucketError) {
          const { error: retryError } = await supabase.storage
            .from('fleet-photos')
            .upload(filePath, file);
          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('fleet-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading photo:', err);
      toast.error("Erreur lors de l'upload de la photo");
      return null;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVehicles(), fetchServiceRecords()]);
      setLoading(false);
    };

    loadData();

    // Real-time subscription
    const channel = supabase
      .channel('fleet-maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flotte' }, () => fetchVehicles())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_service_records' }, () => fetchServiceRecords())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVehicles, fetchServiceRecords]);

  return {
    vehicles,
    serviceRecords,
    loading,
    error,
    fetchVehicles,
    fetchServiceRecords,
    calculateVehicleHealth,
    addServiceRecord,
    getFleetHealthStats,
    uploadServicePhoto,
    MAINTENANCE_THRESHOLDS,
  };
}
