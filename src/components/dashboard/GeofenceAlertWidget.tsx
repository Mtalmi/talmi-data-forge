import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Crosshair, 
  AlertTriangle, 
  MapPin, 
  Clock,
  Navigation2,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface GeofenceAlert {
  id: string;
  id_camion: string;
  event_type: string;
  latitude: number;
  longitude: number;
  duration_minutes: number | null;
  acknowledged: boolean;
  created_at: string;
}

export function GeofenceAlertWidget() {
  const { t, lang } = useI18n();
  const ga = t.geofenceAlert;
  const dateLocale = getDateLocale(lang);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('geofence_events')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts((data || []).map(a => ({
        ...a,
        latitude: Number(a.latitude),
        longitude: Number(a.longitude),
        duration_minutes: a.duration_minutes ? Number(a.duration_minutes) : null,
      })));
    } catch (error) {
      console.error('Error fetching geofence alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('geofence_events')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to new alerts
    const channel = supabase
      .channel('ceo-geofence-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'geofence_events' },
        () => fetchAlerts()
      )
      .subscribe();

    // Poll every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchAlerts]);

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'unplanned_stop': return ga.unplannedStop;
      case 'enter': return ga.enterZone;
      case 'exit': return ga.exitZone;
      case 'speeding': return ga.speeding;
      default: return eventType;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border-amber-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-amber-400 flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            {ga.fleetPredator}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-400 hover:text-amber-400"
            onClick={() => navigate('/logistique')}
          >
            <Navigation2 className="h-3 w-3 mr-1" />
            {ga.map}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">{ga.loading}</div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="h-24 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-emerald-400 font-medium text-sm">{ga.noAlerts}</p>
            <p className="text-xs text-gray-500">{ga.allZonesSecure}</p>
          </div>
        ) : (
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {alerts.map(alert => (
                <div 
                  key={alert.id}
                  className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                      <span className="font-bold text-red-400 text-sm">
                        {alert.id_camion}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-emerald-500/20"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <Badge className="bg-red-500/20 text-red-400 border-none text-xs">
                      {getEventLabel(alert.event_type)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(alert.created_at), { 
                        addSuffix: true, 
                        locale: dateLocale 
                      })}
                    </span>
                  </div>
                  {alert.duration_minutes && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{Math.round(alert.duration_minutes)} {ga.minLabel}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
