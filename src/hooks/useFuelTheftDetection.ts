import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FuelAlert {
  id: string;
  id_camion: string;
  chauffeur: string | null;
  consumption_actual: number;
  consumption_expected: number;
  variance_pct: number;
  detected_at: string;
  km_parcourus: number;
  litres: number;
  severity: 'warning' | 'critical';
}

// Expected consumption baseline: 35 L/100km for concrete mixer trucks
const EXPECTED_CONSUMPTION_L_100KM = 35;
const FUEL_WARNING_THRESHOLD = 0.20; // 20% above average triggers warning
const FUEL_CRITICAL_THRESHOLD = 0.30; // 30% above average triggers critical alert

export function useFuelTheftDetection() {
  const [alerts, setAlerts] = useState<FuelAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const detectAnomalies = useCallback(async () => {
    try {
      // Get recent fuel entries with consumption data
      const { data: fuelEntries, error } = await supabase
        .from('suivi_carburant')
        .select(`
          id,
          id_camion,
          litres,
          km_parcourus,
          consommation_l_100km,
          created_at
        `)
        .not('consommation_l_100km', 'is', null)
        .not('km_parcourus', 'is', null)
        .gt('km_parcourus', 0)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Get truck details for driver names
      const { data: flotte } = await supabase
        .from('flotte')
        .select('id_camion, chauffeur');

      const truckDrivers = new Map(
        (flotte || []).map(f => [f.id_camion, f.chauffeur])
      );

      // Calculate average consumption per truck
      const truckConsumption = new Map<string, number[]>();
      (fuelEntries || []).forEach(entry => {
        if (!truckConsumption.has(entry.id_camion)) {
          truckConsumption.set(entry.id_camion, []);
        }
        truckConsumption.get(entry.id_camion)!.push(entry.consommation_l_100km!);
      });

      const avgConsumption = new Map<string, number>();
      truckConsumption.forEach((values, truckId) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        avgConsumption.set(truckId, avg);
      });

      // Detect anomalies in recent entries
      const detectedAlerts: FuelAlert[] = [];
      (fuelEntries || []).slice(0, 30).forEach(entry => {
        const expected = avgConsumption.get(entry.id_camion) || EXPECTED_CONSUMPTION_L_100KM;
        const actual = entry.consommation_l_100km!;
        const variance = (actual - expected) / expected;

        if (variance > FUEL_WARNING_THRESHOLD) {
          const severity = variance > FUEL_CRITICAL_THRESHOLD ? 'critical' : 'warning';
          
          detectedAlerts.push({
            id: entry.id,
            id_camion: entry.id_camion,
            chauffeur: truckDrivers.get(entry.id_camion) || null,
            consumption_actual: actual,
            consumption_expected: expected,
            variance_pct: variance * 100,
            detected_at: entry.created_at,
            km_parcourus: entry.km_parcourus!,
            litres: entry.litres,
            severity,
          });
        }
      });

      setAlerts(detectedAlerts);
      setLastCheck(new Date());

      // Log critical alerts to audit system
      const criticalAlerts = detectedAlerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check for existing alerts to avoid duplicates
          const { data: existingLogs } = await supabase
            .from('audit_superviseur')
            .select('record_id')
            .eq('action', 'FUEL_THEFT_ALERT')
            .in('record_id', criticalAlerts.map(a => a.id));

          const existingIds = new Set((existingLogs || []).map(l => l.record_id));
          const newAlerts = criticalAlerts.filter(a => !existingIds.has(a.id));

          if (newAlerts.length > 0) {
            await supabase.from('audit_superviseur').insert(
              newAlerts.map(alert => ({
                action: 'FUEL_THEFT_ALERT',
                table_name: 'suivi_carburant',
                user_id: user.id,
                record_id: alert.id,
                new_data: {
                  truck: alert.id_camion,
                  driver: alert.chauffeur,
                  variance_pct: alert.variance_pct.toFixed(1),
                  consumption_actual: alert.consumption_actual.toFixed(1),
                  consumption_expected: alert.consumption_expected.toFixed(1),
                  km: alert.km_parcourus,
                  litres: alert.litres,
                  severity: alert.severity,
                },
              }))
            );

            // Show toast for new critical alerts
            toast.error(`🚨 ${newAlerts.length} alerte(s) carburant critique(s) détectée(s)!`, {
              description: `Camion(s): ${newAlerts.map(a => a.id_camion).join(', ')}`,
              duration: 10000,
            });
          }
        }
      }

      return detectedAlerts;
    } catch (error) {
      console.error('Error detecting fuel anomalies:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get fleet consumption statistics
  const getFleetStats = useCallback(() => {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const avgVariance = alerts.length > 0 
      ? alerts.reduce((sum, a) => sum + a.variance_pct, 0) / alerts.length 
      : 0;

    return {
      totalAlerts: alerts.length,
      criticalCount,
      warningCount,
      avgVariance,
      hasAlerts: alerts.length > 0,
    };
  }, [alerts]);

  useEffect(() => {
    detectAnomalies();

    // Set up realtime subscription for new fuel entries
    const channel = supabase
      .channel('fuel-theft-detection')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'suivi_carburant' },
        () => detectAnomalies()
      )
      .subscribe();

    // Check every 5 minutes
    const interval = setInterval(detectAnomalies, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [detectAnomalies]);

  return {
    alerts,
    loading,
    lastCheck,
    detectAnomalies,
    getFleetStats,
  };
}
