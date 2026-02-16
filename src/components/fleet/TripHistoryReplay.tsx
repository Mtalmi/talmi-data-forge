import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipBack, SkipForward, Route, Clock, Gauge,
  MapPin, Calendar, Truck, StopCircle, FastForward
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HistoryPoint {
  latitude: number;
  longitude: number;
  recorded_at: string;
  speed_kmh: number;
}

interface TripSegment {
  startIndex: number;
  endIndex: number;
  startTime: string;
  endTime: string;
  distanceKm: number;
  maxSpeed: number;
  avgSpeed: number;
  durationMin: number;
  stopDurationMin: number;
}

interface TruckOption {
  id_camion: string;
  chauffeur: string | null;
  type: string;
}

export function TripHistoryReplay() {
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [trips, setTrips] = useState<TripSegment[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available trucks
  useEffect(() => {
    const fetchTrucks = async () => {
      const { data } = await supabase
        .from('flotte')
        .select('id_camion, chauffeur, type')
        .order('id_camion');
      if (data) setTrucks(data);
    };
    fetchTrucks();
  }, []);

  // Fetch trip history for selected truck + date
  const fetchHistory = useCallback(async () => {
    if (!selectedTruck || !selectedDate) return;
    setLoading(true);
    try {
      const startOfDay = `${selectedDate}T00:00:00.000Z`;
      const endOfDay = `${selectedDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('gps_positions')
        .select('latitude, longitude, recorded_at, speed_kmh')
        .eq('id_camion', selectedTruck)
        .gte('recorded_at', startOfDay)
        .lte('recorded_at', endOfDay)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      const points: HistoryPoint[] = (data || []).map(p => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        recorded_at: p.recorded_at,
        speed_kmh: Number(p.speed_kmh) || 0,
      }));

      setHistory(points);
      setPlayIndex(0);
      setPlaying(false);

      // Analyze trips (segments separated by > 5 min stops)
      if (points.length > 1) {
        const segments: TripSegment[] = [];
        let segStart = 0;

        for (let i = 1; i < points.length; i++) {
          const gap = differenceInMinutes(
            new Date(points[i].recorded_at),
            new Date(points[i - 1].recorded_at)
          );

          if (gap > 5 || i === points.length - 1) {
            const segEnd = gap > 5 ? i - 1 : i;
            const segPoints = points.slice(segStart, segEnd + 1);
            if (segPoints.length >= 2) {
              let dist = 0;
              for (let j = 1; j < segPoints.length; j++) {
                dist += haversine(
                  segPoints[j - 1].latitude, segPoints[j - 1].longitude,
                  segPoints[j].latitude, segPoints[j].longitude
                );
              }
              const speeds = segPoints.map(p => p.speed_kmh).filter(s => s > 0);
              segments.push({
                startIndex: segStart,
                endIndex: segEnd,
                startTime: segPoints[0].recorded_at,
                endTime: segPoints[segPoints.length - 1].recorded_at,
                distanceKm: Math.round(dist * 10) / 10,
                maxSpeed: Math.max(...speeds, 0),
                avgSpeed: speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0,
                durationMin: differenceInMinutes(
                  new Date(segPoints[segPoints.length - 1].recorded_at),
                  new Date(segPoints[0].recorded_at)
                ),
                stopDurationMin: gap > 5 ? gap : 0,
              });
            }
            segStart = i;
          }
        }
        setTrips(segments);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTruck, selectedDate]);

  // Replay animation
  useEffect(() => {
    if (playing && history.length > 0) {
      intervalRef.current = setInterval(() => {
        setPlayIndex(prev => {
          if (prev >= history.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200 / playSpeed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, history.length, playSpeed]);

  // Total stats
  const totalDistance = trips.reduce((s, t) => s + t.distanceKm, 0);
  const totalDuration = trips.reduce((s, t) => s + t.durationMin, 0);
  const totalStops = trips.reduce((s, t) => s + (t.stopDurationMin > 0 ? 1 : 0), 0);
  const maxSpeed = Math.max(...trips.map(t => t.maxSpeed), 0);

  const currentPoint = history[playIndex];

  // Date options (last 7 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEEE dd MMM', { locale: fr }) };
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Historique des Trajets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={selectedTruck} onValueChange={setSelectedTruck}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sélectionner un camion" />
              </SelectTrigger>
              <SelectContent>
                {trucks.map(t => (
                  <SelectItem key={t.id_camion} value={t.id_camion}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3" />
                      {t.id_camion} {t.chauffeur && `• ${t.chauffeur}`}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map(d => (
                  <SelectItem key={d.value} value={d.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {d.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={fetchHistory} disabled={!selectedTruck || loading}>
              {loading ? 'Chargement...' : 'Charger le trajet'}
            </Button>
          </div>

          {/* Replay Controls */}
          {history.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={() => { setPlayIndex(0); setPlaying(false); }}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPlayIndex(history.length - 1)}>
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1.5">
                  <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
                  {[1, 2, 5, 10].map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={playSpeed === s ? 'default' : 'outline'}
                      className="h-7 px-2 text-xs"
                      onClick={() => setPlaySpeed(s)}
                    >
                      {s}x
                    </Button>
                  ))}
                </div>

                <span className="ml-auto text-xs text-muted-foreground font-mono">
                  {playIndex + 1} / {history.length}
                </span>
              </div>

              <Slider
                value={[playIndex]}
                max={history.length - 1}
                step={1}
                onValueChange={([v]) => { setPlayIndex(v); setPlaying(false); }}
                className="w-full"
              />

              {currentPoint && (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(currentPoint.recorded_at), 'HH:mm:ss')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {Math.round(currentPoint.speed_kmh)} km/h
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {currentPoint.latitude.toFixed(5)}, {currentPoint.longitude.toFixed(5)}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Summary Stats */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Route className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalDistance} km</p>
              <p className="text-xs text-muted-foreground">Distance totale</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{Math.round(totalDuration / 60)}h{totalDuration % 60}m</p>
              <p className="text-xs text-muted-foreground">Temps de conduite</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Gauge className="h-5 w-5 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{maxSpeed} km/h</p>
              <p className="text-xs text-muted-foreground">Vitesse max</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <StopCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalStops}</p>
              <p className="text-xs text-muted-foreground">Arrêts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trip Segments Timeline */}
      {trips.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Segments du trajet</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {trips.map((trip, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => { setPlayIndex(trip.startIndex); setPlaying(false); }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {format(new Date(trip.startTime), 'HH:mm')}
                      </span>
                      <div className="w-0.5 h-4 bg-primary/30" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {format(new Date(trip.endTime), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Segment {i + 1}
                      </p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{trip.distanceKm} km</span>
                        <span>{trip.durationMin} min</span>
                        <span>Moy. {trip.avgSpeed} km/h</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={trip.maxSpeed > 80 ? 'destructive' : 'secondary'} className="text-[10px]">
                        Max {trip.maxSpeed} km/h
                      </Badge>
                      {trip.stopDurationMin > 0 && (
                        <span className="text-[10px] text-amber-500">
                          ⏸ Arrêt {trip.stopDurationMin} min
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {history.length === 0 && !loading && selectedTruck && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Route className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune donnée GPS pour cette date</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sélectionnez un autre jour ou activez le mode démo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
