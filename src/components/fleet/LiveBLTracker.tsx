import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Truck, Package, MapPin, Clock, Navigation2, User,
  RefreshCw, ArrowRight, CheckCircle2, Loader2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActiveMission {
  bl_id: string;
  bc_id: string | null;
  camion_assigne: string | null;
  toupie_assignee: string | null;
  volume_m3: number;
  date_livraison: string;
  heure_prevue: string | null;
  heure_depart_centrale: string | null;
  heure_arrivee_chantier: string | null;
  workflow_status: string;
  client_nom: string;
  adresse: string | null;
  zone_nom: string | null;
  chauffeur: string | null;
  // GPS data
  truck_lat: number | null;
  truck_lng: number | null;
  truck_speed: number | null;
  truck_last_update: string | null;
  // Calculated
  eta_minutes: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Truck }> = {
  planification: { label: 'Planifié', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  production: { label: 'Production', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Loader2 },
  validation_technique: { label: 'Validation', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle2 },
  en_livraison: { label: 'En Livraison', color: 'bg-primary/20 text-primary border-primary/30', icon: Truck },
  livre: { label: 'Livré', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
};

export function LiveBLTracker() {
  const [missions, setMissions] = useState<ActiveMission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch active BLs for today
      const { data: bls, error } = await supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id, bc_id, camion_assigne, toupie_assignee, volume_m3,
          date_livraison, heure_prevue, heure_depart_centrale, heure_arrivee_chantier,
          workflow_status,
          clients!bons_livraison_reels_client_id_fkey(nom_client, adresse),
          zones_livraison!bons_livraison_reels_zone_livraison_id_fkey(nom_zone)
        `)
        .eq('date_livraison', today)
        .in('workflow_status', ['planification', 'production', 'validation_technique', 'en_livraison'])
        .order('heure_prevue', { ascending: true });

      if (error) throw error;

      // Get truck IDs to fetch GPS
      const truckIds = [...new Set(
        (bls || []).flatMap(bl => [bl.camion_assigne, bl.toupie_assignee].filter(Boolean))
      )];

      let truckGPS: Record<string, any> = {};
      if (truckIds.length > 0) {
        const { data: trucks } = await supabase
          .from('flotte')
          .select('id_camion, last_latitude, last_longitude, last_speed_kmh, last_gps_update, chauffeur')
          .in('id_camion', truckIds);

        (trucks || []).forEach(t => { truckGPS[t.id_camion] = t; });
      }

      const activeMissions: ActiveMission[] = (bls || []).map((bl: any) => {
        const truckId = bl.camion_assigne || bl.toupie_assignee;
        const gps = truckId ? truckGPS[truckId] : null;

        // Simple ETA estimate based on departure time
        let eta: number | null = null;
        if (bl.heure_prevue && bl.workflow_status === 'en_livraison' && bl.heure_depart_centrale) {
          const departed = new Date(`${today}T${bl.heure_depart_centrale}`);
          const elapsed = differenceInMinutes(new Date(), departed);
          // Assume 45 min average delivery time
          eta = Math.max(0, 45 - elapsed);
        }

        return {
          bl_id: bl.bl_id,
          bc_id: bl.bc_id,
          camion_assigne: bl.camion_assigne,
          toupie_assignee: bl.toupie_assignee,
          volume_m3: bl.volume_m3,
          date_livraison: bl.date_livraison,
          heure_prevue: bl.heure_prevue,
          heure_depart_centrale: bl.heure_depart_centrale,
          heure_arrivee_chantier: bl.heure_arrivee_chantier,
          workflow_status: bl.workflow_status || 'planification',
          client_nom: bl.clients?.nom_client || 'Client inconnu',
          adresse: bl.clients?.adresse || null,
          zone_nom: bl.zones_livraison?.nom_zone || null,
          chauffeur: gps?.chauffeur || null,
          truck_lat: gps ? Number(gps.last_latitude) : null,
          truck_lng: gps ? Number(gps.last_longitude) : null,
          truck_speed: gps ? Number(gps.last_speed_kmh) : null,
          truck_last_update: gps?.last_gps_update || null,
          eta_minutes: eta,
        };
      });

      setMissions(activeMissions);
    } catch (err) {
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
    const interval = setInterval(fetchMissions, 15000);

    const channel = supabase
      .channel('bl-tracker-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => fetchMissions())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchMissions]);

  const getStepProgress = (status: string) => {
    const steps = ['planification', 'production', 'validation_technique', 'en_livraison', 'livre'];
    const idx = steps.indexOf(status);
    return ((idx + 1) / steps.length) * 100;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation2 className="h-5 w-5 text-primary" />
            Suivi Camion ↔ BL en Direct
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {missions.length} missions actives
            </Badge>
            <Button size="sm" variant="outline" onClick={fetchMissions}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune mission active aujourd'hui</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {missions.map(mission => {
                const statusConf = STATUS_CONFIG[mission.workflow_status] || STATUS_CONFIG.planification;
                const StatusIcon = statusConf.icon;
                const truckId = mission.camion_assigne || mission.toupie_assignee;

                return (
                  <div
                    key={mission.bl_id}
                    className="p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">{mission.bl_id}</span>
                        {mission.bc_id && (
                          <span className="text-xs text-muted-foreground">({mission.bc_id})</span>
                        )}
                      </div>
                      <Badge className={cn("text-[10px]", statusConf.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConf.label}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <Progress value={getStepProgress(mission.workflow_status)} className="h-1.5 mb-3" />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {/* Truck */}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Truck className="h-3 w-3 shrink-0 text-primary" />
                        <span className="font-mono font-medium text-foreground">{truckId || '—'}</span>
                      </div>

                      {/* Client */}
                      <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mission.client_nom}</span>
                      </div>

                      {/* Volume */}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Package className="h-3 w-3 shrink-0" />
                        <span>{mission.volume_m3} m³</span>
                      </div>

                      {/* Time / ETA */}
                      <div className="flex items-center gap-1.5">
                        {mission.eta_minutes !== null ? (
                          <>
                            <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
                            <span className="text-primary font-bold">ETA {mission.eta_minutes} min</span>
                          </>
                        ) : mission.heure_prevue ? (
                          <>
                            <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">{mission.heure_prevue}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>

                    {/* GPS Status */}
                    {truckId && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                        {mission.truck_lat ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground">
                              GPS actif • {mission.truck_speed ? `${Math.round(mission.truck_speed)} km/h` : 'Arrêté'}
                            </span>
                            {mission.chauffeur && (
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                🧑‍✈️ {mission.chauffeur}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-muted" />
                            <span className="text-[10px] text-muted-foreground">Pas de signal GPS</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
