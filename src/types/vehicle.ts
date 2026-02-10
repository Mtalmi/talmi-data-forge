export interface Vehicle {
  id_camion: string;
  type: 'Toupie' | 'Pompe';
  proprietaire: string;
  chauffeur: string;
  capacite?: number;
  statut: 'Disponible' | 'En Livraison' | 'Maintenance';
  conso_moyenne?: number;

  // GPS Configuration
  gps_enabled: boolean;
  gps_device_id?: string;
  gps_imei?: string;
  gps_provider?: 'traccar' | 'teltonika' | 'gpsgate' | 'mobile';

  // Last Known Position
  last_latitude?: number;
  last_longitude?: number;
  last_gps_update?: string;

  created_at?: string;
  updated_at?: string;
}

export interface GPSTrackingPoint {
  id: string;
  vehicule_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
  source: 'gps_device' | 'mobile_app' | 'manual';
  created_at: string;
}
