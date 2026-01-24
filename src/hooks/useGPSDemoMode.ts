import { useState, useEffect, useCallback, useRef } from 'react';
import { TruckPosition, MissionInfo } from './useGPSTracking';

// Demo missions for trucks
const DEMO_MISSIONS: Record<string, MissionInfo> = {
  'DEMO-2413-A1': {
    bc_id: 'BC-DEMO-001',
    bl_id: 'BL-DEMO-001',
    client_nom: 'Entreprise Maroc Construction',
    volume_m3: 8,
    adresse_livraison: 'Lot 45, Zone Industrielle Ain Sebaa',
    zone_nom: 'Casablanca Nord',
    heure_prevue: '10:30',
    workflow_status: 'en_livraison',
  },
  'DEMO-3521-B2': {
    bc_id: 'BC-DEMO-002',
    bl_id: 'BL-DEMO-002',
    client_nom: 'Résidences Al Fath',
    volume_m3: 6,
    adresse_livraison: 'Avenue Mohammed V, Mohammedia',
    zone_nom: 'Mohammedia',
    heure_prevue: '11:00',
    workflow_status: 'en_livraison',
  },
  'DEMO-4567-D4': {
    bc_id: 'BC-DEMO-003',
    bl_id: 'BL-DEMO-003',
    client_nom: 'Société Immobilière Atlas',
    volume_m3: 10,
    adresse_livraison: 'Route de Rabat Km 12',
    zone_nom: 'Bouskoura',
    heure_prevue: '09:45',
    workflow_status: 'en_livraison',
  },
};

// Demo truck configurations - starting positions around Morocco
const DEMO_TRUCKS: Omit<TruckPosition, 'latitude' | 'longitude' | 'speed_kmh' | 'heading'>[] = [
  {
    id_camion: 'DEMO-2413-A1',
    fuel_level_pct: 85,
    last_gps_update: new Date().toISOString(),
    is_moving: true,
    stopped_since: null,
    chauffeur: 'Hassan Bennani',
    telephone_chauffeur: '+212 6 12 34 56 78',
    statut: 'en_mission',
    type: 'toupie',
    bc_mission_id: 'BC-DEMO-001',
    mission: DEMO_MISSIONS['DEMO-2413-A1'],
  },
  {
    id_camion: 'DEMO-3521-B2',
    fuel_level_pct: 62,
    last_gps_update: new Date().toISOString(),
    is_moving: true,
    stopped_since: null,
    chauffeur: 'Youssef Alami',
    telephone_chauffeur: '+212 6 98 76 54 32',
    statut: 'en_mission',
    type: 'toupie',
    bc_mission_id: 'BC-DEMO-002',
    mission: DEMO_MISSIONS['DEMO-3521-B2'],
  },
  {
    id_camion: 'DEMO-1892-C3',
    fuel_level_pct: 45,
    last_gps_update: new Date().toISOString(),
    is_moving: false,
    stopped_since: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
    chauffeur: 'Karim Idrissi',
    telephone_chauffeur: '+212 6 55 44 33 22',
    statut: 'disponible',
    type: 'toupie',
    bc_mission_id: null,
    mission: null,
  },
  {
    id_camion: 'DEMO-4567-D4',
    fuel_level_pct: 15, // Low fuel alert
    last_gps_update: new Date().toISOString(),
    is_moving: true,
    stopped_since: null,
    chauffeur: 'Omar Tazi',
    telephone_chauffeur: '+212 6 11 22 33 44',
    statut: 'en_mission',
    type: 'pompe',
    bc_mission_id: 'BC-DEMO-003',
    mission: DEMO_MISSIONS['DEMO-4567-D4'],
  },
];

// Routes for demo trucks (waypoints)
const DEMO_ROUTES: Record<string, [number, number][]> = {
  'DEMO-2413-A1': [
    [-7.5898, 33.5731], // Casablanca center
    [-7.5950, 33.5780],
    [-7.6010, 33.5820],
    [-7.6100, 33.5850],
    [-7.6180, 33.5900],
    [-7.6250, 33.5950],
    [-7.6300, 33.6000],
    [-7.6250, 33.5950], // Return
    [-7.6180, 33.5900],
    [-7.6100, 33.5850],
  ],
  'DEMO-3521-B2': [
    [-7.6300, 33.5400], // Industrial area
    [-7.6250, 33.5450],
    [-7.6200, 33.5500],
    [-7.6150, 33.5550],
    [-7.6100, 33.5600],
    [-7.6050, 33.5650],
    [-7.6000, 33.5700],
    [-7.5950, 33.5750],
  ],
  'DEMO-1892-C3': [
    [-7.5500, 33.5800], // Stopped position (random small movements)
    [-7.5502, 33.5801],
    [-7.5501, 33.5800],
    [-7.5503, 33.5799],
    [-7.5500, 33.5800],
  ],
  'DEMO-4567-D4': [
    [-7.6500, 33.6100], // Highway route
    [-7.6600, 33.6150],
    [-7.6700, 33.6200],
    [-7.6800, 33.6250],
    [-7.6900, 33.6300],
    [-7.7000, 33.6350],
    [-7.7100, 33.6400],
    [-7.7200, 33.6450],
  ],
};

interface DemoAlert {
  id: string;
  id_camion: string;
  event_type: string;
  latitude: number;
  longitude: number;
  duration_minutes: number;
  acknowledged: boolean;
  created_at: string;
}

interface GPSDemoState {
  enabled: boolean;
  trucks: TruckPosition[];
  alerts: DemoAlert[];
  routeIndices: Record<string, number>;
}

export function useGPSDemoMode() {
  const [demoState, setDemoState] = useState<GPSDemoState>({
    enabled: false,
    trucks: [],
    alerts: [],
    routeIndices: {},
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<Record<string, { latitude: number; longitude: number; recorded_at: string; speed_kmh: number }[]>>({});

  // Initialize demo trucks
  const initializeDemoTrucks = useCallback(() => {
    const initialTrucks: TruckPosition[] = DEMO_TRUCKS.map(truck => {
      const route = DEMO_ROUTES[truck.id_camion];
      const [lng, lat] = route[0];
      return {
        ...truck,
        latitude: lat,
        longitude: lng,
        speed_kmh: truck.is_moving ? Math.random() * 40 + 30 : 0,
        heading: Math.random() * 360,
        last_gps_update: new Date().toISOString(),
      };
    });

    const initialIndices: Record<string, number> = {};
    DEMO_TRUCKS.forEach(truck => {
      initialIndices[truck.id_camion] = 0;
    });

    // Create an initial alert for the stopped truck
    const stoppedTruck = initialTrucks.find(t => !t.is_moving);
    const initialAlerts: DemoAlert[] = stoppedTruck ? [{
      id: `demo-alert-${Date.now()}`,
      id_camion: stoppedTruck.id_camion,
      event_type: 'unplanned_stop',
      latitude: stoppedTruck.latitude,
      longitude: stoppedTruck.longitude,
      duration_minutes: 25,
      acknowledged: false,
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    }] : [];

    // Initialize history for each truck
    historyRef.current = {};
    initialTrucks.forEach(truck => {
      historyRef.current[truck.id_camion] = [{
        latitude: truck.latitude,
        longitude: truck.longitude,
        recorded_at: new Date().toISOString(),
        speed_kmh: truck.speed_kmh,
      }];
    });

    setDemoState({
      enabled: true,
      trucks: initialTrucks,
      alerts: initialAlerts,
      routeIndices: initialIndices,
    });
  }, []);

  // Update truck positions
  const updatePositions = useCallback(() => {
    setDemoState(prev => {
      if (!prev.enabled) return prev;

      const newTrucks = prev.trucks.map(truck => {
        const route = DEMO_ROUTES[truck.id_camion];
        let currentIndex = prev.routeIndices[truck.id_camion] || 0;
        
        // Move to next waypoint
        const nextIndex = (currentIndex + 1) % route.length;
        const [lng, lat] = route[nextIndex];
        
        // Calculate heading based on direction
        const prevPos = route[currentIndex];
        const deltaLng = lng - prevPos[0];
        const deltaLat = lat - prevPos[1];
        const heading = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
        
        // Random speed variation for moving trucks
        const speed = truck.is_moving 
          ? Math.random() * 20 + 35 + (truck.id_camion.includes('D4') ? 30 : 0) // Highway truck is faster
          : Math.random() * 2; // Slight movement for stopped

        // Decrease fuel slightly
        const fuelDrop = truck.is_moving ? Math.random() * 0.3 : 0;
        const newFuel = Math.max(5, (truck.fuel_level_pct || 50) - fuelDrop);

        // Add to history
        const history = historyRef.current[truck.id_camion] || [];
        history.push({
          latitude: lat,
          longitude: lng,
          recorded_at: new Date().toISOString(),
          speed_kmh: speed,
        });
        // Keep last 50 points
        if (history.length > 50) history.shift();
        historyRef.current[truck.id_camion] = history;

        prev.routeIndices[truck.id_camion] = nextIndex;

        return {
          ...truck,
          latitude: lat,
          longitude: lng,
          speed_kmh: speed,
          heading: heading,
          fuel_level_pct: newFuel,
          last_gps_update: new Date().toISOString(),
        };
      });

      // Randomly generate speeding alert
      const newAlerts = [...prev.alerts];
      if (Math.random() > 0.95) {
        const speedingTruck = newTrucks.find(t => t.speed_kmh > 70);
        if (speedingTruck) {
          newAlerts.push({
            id: `demo-alert-${Date.now()}`,
            id_camion: speedingTruck.id_camion,
            event_type: 'speeding',
            latitude: speedingTruck.latitude,
            longitude: speedingTruck.longitude,
            duration_minutes: 0,
            acknowledged: false,
            created_at: new Date().toISOString(),
          });
        }
      }

      return {
        ...prev,
        trucks: newTrucks,
        alerts: newAlerts,
      };
    });
  }, []);

  // Start demo mode
  const startDemo = useCallback(() => {
    initializeDemoTrucks();
    
    // Update positions every 2 seconds
    intervalRef.current = setInterval(updatePositions, 2000);
  }, [initializeDemoTrucks, updatePositions]);

  // Stop demo mode
  const stopDemo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDemoState({
      enabled: false,
      trucks: [],
      alerts: [],
      routeIndices: {},
    });
    historyRef.current = {};
  }, []);

  // Toggle demo
  const toggleDemo = useCallback(() => {
    if (demoState.enabled) {
      stopDemo();
    } else {
      startDemo();
    }
  }, [demoState.enabled, startDemo, stopDemo]);

  // Acknowledge demo alert
  const acknowledgeDemoAlert = useCallback((alertId: string) => {
    setDemoState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== alertId),
    }));
  }, []);

  // Get history for a truck
  const getDemoTruckHistory = useCallback((truckId: string) => {
    return historyRef.current[truckId] || [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    demoEnabled: demoState.enabled,
    demoTrucks: demoState.trucks,
    demoAlerts: demoState.alerts,
    toggleDemo,
    startDemo,
    stopDemo,
    acknowledgeDemoAlert,
    getDemoTruckHistory,
  };
}
