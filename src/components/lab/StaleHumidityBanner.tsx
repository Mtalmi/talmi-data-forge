import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Droplets, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PhotoVerifiedHumidity } from './PhotoVerifiedHumidity';

interface StaleHumidityBannerProps {
  className?: string;
  thresholdHours?: number;
}

/**
 * Stale Data Banner for Humidity Tests
 * Shows time since last sand humidity test
 * Turns AMBER if > 4 hours ago to prompt re-test
 */
export function StaleHumidityBanner({
  className,
  thresholdHours = 4,
}: StaleHumidityBannerProps) {
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchLastHumidityTest();
  }, [refreshKey]);

  const fetchLastHumidityTest = async () => {
    try {
      setLoading(true);
      // Query the v_quality_feed view which includes humidity tests
      const { data, error } = await supabase
        .from('v_quality_feed')
        .select('created_at')
        .eq('type', 'humidity')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching humidity test:', error);
        return;
      }

      if (data) {
        setLastTestTime(new Date(data.created_at));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTest = () => {
    setRefreshKey(k => k + 1);
  };

  if (loading) {
    return null;
  }

  const hoursSinceTest = lastTestTime
    ? (Date.now() - lastTestTime.getTime()) / (1000 * 60 * 60)
    : Infinity;

  const isStale = hoursSinceTest > thresholdHours;
  const isCritical = hoursSinceTest > thresholdHours * 2;

  const timeAgo = lastTestTime
    ? formatDistanceToNow(lastTestTime, { locale: fr, addSuffix: true })
    : 'Jamais';

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2 rounded-lg border transition-all duration-500",
        isCritical && "bg-destructive/10 border-destructive/50 animate-pulse",
        isStale && !isCritical && "bg-warning/10 border-warning/50",
        !isStale && "bg-muted/30 border-border",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-full",
            isCritical && "bg-destructive/20",
            isStale && !isCritical && "bg-warning/20",
            !isStale && "bg-muted"
          )}
        >
          {isStale ? (
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                isCritical ? "text-destructive" : "text-warning"
              )}
            />
          ) : (
            <Droplets className="h-4 w-4 text-primary" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Dernier Test Humidité Sable
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              isCritical && "text-destructive",
              isStale && !isCritical && "text-warning",
              !isStale && "text-foreground"
            )}
          >
            {timeAgo}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isStale && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded",
              isCritical
                ? "bg-destructive/20 text-destructive"
                : "bg-warning/20 text-warning"
            )}
          >
            {isCritical ? "⚠️ Test Requis" : "Re-test conseillé"}
          </span>
        )}

        <PhotoVerifiedHumidity
          type="quotidien"
          onSubmit={handleNewTest}
          trigger={
            <Button
              size="sm"
              variant={isStale ? "default" : "outline"}
              className={cn(
                "h-8 gap-1.5",
                isStale && "bg-warning hover:bg-warning/90 text-warning-foreground"
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Nouveau Test
            </Button>
          }
        />
      </div>
    </div>
  );
}
