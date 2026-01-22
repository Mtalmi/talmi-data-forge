import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  RefreshCw, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  Fuel,
  Truck,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RotationEntry {
  bl_id: string;
  client_id: string;
  client_nom: string | null;
  date_livraison: string;
  volume_m3: number;
  camion_id: string | null;
  chauffeur: string | null;
  heure_depart_centrale: string | null;
  heure_arrivee_chantier: string | null;
  heure_retour_centrale: string | null;
  workflow_status: string;
  validated_at: string | null;
  km_depart: number | null;
  km_retour: number | null;
  litres_carburant: number | null;
  consommation_l_100km: number | null;
}

interface TruckAverage {
  id_camion: string;
  avg_consumption: number;
}

export function RotationJournal() {
  const [rotations, setRotations] = useState<RotationEntry[]>([]);
  const [truckAverages, setTruckAverages] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [truckFilter, setTruckFilter] = useState<string>('all');
  const [trucks, setTrucks] = useState<{ id_camion: string; chauffeur: string | null }[]>([]);

  const fetchTruckAverages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suivi_carburant')
        .select('id_camion, consommation_l_100km')
        .not('consommation_l_100km', 'is', null);

      if (error) throw error;

      // Calculate average per truck
      const avgMap = new Map<string, { sum: number; count: number }>();
      (data || []).forEach((entry) => {
        const existing = avgMap.get(entry.id_camion) || { sum: 0, count: 0 };
        existing.sum += entry.consommation_l_100km || 0;
        existing.count += 1;
        avgMap.set(entry.id_camion, existing);
      });

      const finalMap = new Map<string, number>();
      avgMap.forEach((val, key) => {
        finalMap.set(key, val.count > 0 ? val.sum / val.count : 0);
      });

      setTruckAverages(finalMap);
    } catch (error) {
      console.error('Error fetching truck averages:', error);
    }
  }, []);

  const fetchRotations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bons_livraison_reels')
        .select(`
          bl_id,
          client_id,
          date_livraison,
          volume_m3,
          camion_assigne,
          toupie_assignee,
          chauffeur_nom,
          heure_depart_centrale,
          heure_arrivee_chantier,
          heure_retour_centrale,
          workflow_status,
          validated_at,
          km_parcourus,
          clients (nom_client)
        `)
        .eq('date_livraison', dateFilter)
        .not('heure_depart_centrale', 'is', null)
        .order('heure_depart_centrale', { ascending: true });

      if (truckFilter !== 'all') {
        query = query.or(`toupie_assignee.eq.${truckFilter},camion_assigne.eq.${truckFilter}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // For each rotation, fetch km/fuel data from suivi_carburant if exists
      const enrichedRotations: RotationEntry[] = await Promise.all(
        (data || []).map(async (bl) => {
          const camionId = bl.toupie_assignee || bl.camion_assigne;
          
          // Try to find matching fuel entry for this BL's date
          let kmDepart: number | null = null;
          let kmRetour: number | null = null;
          let litres: number | null = null;
          let consommation: number | null = null;

          if (camionId && bl.heure_retour_centrale) {
            // Get closest fuel entry after departure
            const { data: fuelData } = await supabase
              .from('suivi_carburant')
              .select('km_compteur, litres, consommation_l_100km')
              .eq('id_camion', camionId)
              .gte('created_at', bl.heure_depart_centrale || '')
              .order('created_at', { ascending: true })
              .limit(1);

            if (fuelData && fuelData.length > 0) {
              kmRetour = fuelData[0].km_compteur;
              litres = fuelData[0].litres;
              consommation = fuelData[0].consommation_l_100km;
            }
          }

          // Calculate km traveled from bl.km_parcourus if available
          const kmTraveled = bl.km_parcourus;

          return {
            bl_id: bl.bl_id,
            client_id: bl.client_id,
            client_nom: bl.clients?.nom_client || null,
            date_livraison: bl.date_livraison,
            volume_m3: bl.volume_m3,
            camion_id: camionId,
            chauffeur: bl.chauffeur_nom || null,
            heure_depart_centrale: bl.heure_depart_centrale,
            heure_arrivee_chantier: bl.heure_arrivee_chantier,
            heure_retour_centrale: bl.heure_retour_centrale,
            workflow_status: bl.workflow_status || 'planification',
            validated_at: bl.validated_at,
            km_depart: kmTraveled ? (kmRetour ? kmRetour - kmTraveled : null) : null,
            km_retour: kmRetour,
            litres_carburant: litres,
            consommation_l_100km: consommation,
          };
        })
      );

      setRotations(enrichedRotations);
    } catch (error) {
      console.error('Error fetching rotations:', error);
      toast.error('Erreur lors du chargement des rotations');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, truckFilter]);

  const fetchTrucks = useCallback(async () => {
    const { data } = await supabase
      .from('flotte')
      .select('id_camion, chauffeur')
      .eq('type', 'Toupie')
      .order('id_camion');
    setTrucks(data || []);
  }, []);

  useEffect(() => {
    fetchTrucks();
    fetchTruckAverages();
  }, [fetchTrucks, fetchTruckAverages]);

  useEffect(() => {
    fetchRotations();
  }, [fetchRotations]);

  // Calculate times
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: fr });
    } catch {
      return '—';
    }
  };

  const calculateCycleTime = (depart: string | null, retour: string | null): number | null => {
    if (!depart || !retour) return null;
    try {
      return differenceInMinutes(new Date(retour), new Date(depart));
    } catch {
      return null;
    }
  };

  const calculateWaitingTime = (arrivee: string | null, signe: string | null): number | null => {
    if (!arrivee || !signe) return null;
    try {
      return differenceInMinutes(new Date(signe), new Date(arrivee));
    } catch {
      return null;
    }
  };

  const isFuelVarianceAlert = (camionId: string | null, consumption: number | null): boolean => {
    if (!camionId || !consumption) return false;
    const avg = truckAverages.get(camionId);
    if (!avg || avg === 0) return false;
    return consumption > avg * 1.2; // 20% above average
  };

  const getStatusBadge = (status: string, hasRetour: boolean) => {
    if (status === 'livre' || status === 'facture') {
      if (hasRetour) {
        return <Badge className="bg-success/20 text-success border-success/30">Complète</Badge>;
      }
      return <Badge className="bg-warning/20 text-warning border-warning/30">Retour Attendu</Badge>;
    }
    if (status === 'en_livraison') {
      return <Badge className="bg-primary/20 text-primary border-primary/30">En Route</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <Select value={truckFilter} onValueChange={setTruckFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tous les camions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les camions</SelectItem>
              {trucks.map((t) => (
                <SelectItem key={t.id_camion} value={t.id_camion}>
                  {t.id_camion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRotations} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Total Rotations</p>
          <p className="text-2xl font-bold">{rotations.length}</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg">
          <p className="text-xs text-muted-foreground">Complètes</p>
          <p className="text-2xl font-bold text-success">
            {rotations.filter((r) => r.heure_retour_centrale).length}
          </p>
        </div>
        <div className="p-3 bg-warning/10 rounded-lg">
          <p className="text-xs text-muted-foreground">Attentes &gt; 30min</p>
          <p className="text-2xl font-bold text-warning">
            {rotations.filter((r) => {
              const wait = calculateWaitingTime(r.heure_arrivee_chantier, r.validated_at);
              return wait !== null && wait > 30;
            }).length}
          </p>
        </div>
        <div className="p-3 bg-destructive/10 rounded-lg">
          <p className="text-xs text-muted-foreground">Alertes Carburant</p>
          <p className="text-2xl font-bold text-destructive">
            {rotations.filter((r) => isFuelVarianceAlert(r.camion_id, r.consommation_l_100km)).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : rotations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucune rotation trouvée pour cette date</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">BL</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Camion</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead className="text-center">Départ</TableHead>
                <TableHead className="text-center">Arrivée</TableHead>
                <TableHead className="text-center">Signé</TableHead>
                <TableHead className="text-center">Retour</TableHead>
                <TableHead className="text-center">Cycle</TableHead>
                <TableHead className="text-center">Attente</TableHead>
                <TableHead className="text-right">KM</TableHead>
                <TableHead className="text-right">L/100km</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rotations.map((r) => {
                const cycleTime = calculateCycleTime(r.heure_depart_centrale, r.heure_retour_centrale);
                const waitingTime = calculateWaitingTime(r.heure_arrivee_chantier, r.validated_at);
                const isWaitingAlert = waitingTime !== null && waitingTime > 30;
                const isFuelAlert = isFuelVarianceAlert(r.camion_id, r.consommation_l_100km);

                return (
                  <TableRow 
                    key={r.bl_id} 
                    className={cn(
                      isWaitingAlert && "bg-warning/5",
                      isFuelAlert && "bg-destructive/5"
                    )}
                  >
                    <TableCell className="font-mono font-medium">{r.bl_id}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={r.client_nom || r.client_id}>
                      {r.client_nom || r.client_id}
                    </TableCell>
                    <TableCell className="font-mono">{r.camion_id || '—'}</TableCell>
                    <TableCell>{r.chauffeur || '—'}</TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatTime(r.heure_depart_centrale)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatTime(r.heure_arrivee_chantier)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {r.validated_at ? formatTime(r.validated_at) : '—'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatTime(r.heure_retour_centrale)}
                    </TableCell>
                    <TableCell className="text-center">
                      {cycleTime !== null ? (
                        <span className="font-mono text-sm">
                          {Math.floor(cycleTime / 60)}h{String(cycleTime % 60).padStart(2, '0')}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {waitingTime !== null ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 font-mono text-sm px-2 py-0.5 rounded",
                          isWaitingAlert ? "bg-warning/20 text-warning font-semibold" : "text-muted-foreground"
                        )}>
                          {isWaitingAlert && <AlertTriangle className="h-3 w-3" />}
                          {waitingTime}min
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.km_retour ? `${r.km_retour} km` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.consommation_l_100km !== null ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 font-mono text-sm px-2 py-0.5 rounded",
                          isFuelAlert ? "bg-destructive/20 text-destructive font-semibold" : "text-muted-foreground"
                        )}>
                          {isFuelAlert && <Fuel className="h-3 w-3" />}
                          {r.consommation_l_100km.toFixed(1)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(r.workflow_status, !!r.heure_retour_centrale)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-warning/20" />
          <span>Attente &gt; 30min (facturable)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-destructive/20" />
          <span>Conso carburant &gt; 20% moyenne</span>
        </div>
      </div>
    </div>
  );
}
