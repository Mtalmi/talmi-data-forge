import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  Camera,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface ProductionBatch {
  id: string;
  bl_id: string;
  batch_number: number;
  quality_status: 'pending' | 'ok' | 'warning' | 'critical';
  variance_ciment_pct: number | null;
  variance_eau_pct: number | null;
  photo_pupitre_url: string;
  entered_by_name: string | null;
  entered_at: string;
  ciment_reel_kg: number;
  eau_reel_l: number;
}

const statusConfig = {
  ok: { 
    icon: CheckCircle, 
    color: 'text-success', 
    bg: 'bg-success/10',
    label: '✓' 
  },
  warning: { 
    icon: AlertTriangle, 
    color: 'text-warning', 
    bg: 'bg-warning/10',
    label: '⚠' 
  },
  critical: { 
    icon: XCircle, 
    color: 'text-destructive', 
    bg: 'bg-destructive/10',
    label: '🚨' 
  },
  pending: { 
    icon: Clock, 
    color: 'text-muted-foreground', 
    bg: 'bg-muted/30',
    label: '...' 
  },
};

export function LiveProductionWidget() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    ok: 0,
    warning: 0,
    critical: 0,
  });

  const fetchBatches = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('production_batches')
        .select('id, bl_id, batch_number, quality_status, variance_ciment_pct, variance_eau_pct, photo_pupitre_url, entered_by_name, entered_at, ciment_reel_kg, eau_reel_l')
        .gte('entered_at', today.toISOString())
        .order('entered_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const typedData = (data || []) as ProductionBatch[];
      setBatches(typedData);

      const { count: totalCount } = await supabase
        .from('production_batches')
        .select('*', { count: 'exact', head: true })
        .gte('entered_at', today.toISOString());

      const { count: okCount } = await supabase
        .from('production_batches')
        .select('*', { count: 'exact', head: true })
        .gte('entered_at', today.toISOString())
        .eq('quality_status', 'ok');

      const { count: warningCount } = await supabase
        .from('production_batches')
        .select('*', { count: 'exact', head: true })
        .gte('entered_at', today.toISOString())
        .eq('quality_status', 'warning');

      const { count: criticalCount } = await supabase
        .from('production_batches')
        .select('*', { count: 'exact', head: true })
        .gte('entered_at', today.toISOString())
        .eq('quality_status', 'critical');

      setStats({
        total: totalCount || 0,
        ok: okCount || 0,
        warning: warningCount || 0,
        critical: criticalCount || 0,
      });
    } catch (error) {
      console.error('Error fetching production batches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();

    const channel = supabase
      .channel('ceo_production_feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_batches',
        },
        () => fetchBatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBatches();
    setRefreshing(false);
  };

  const qualityRate = stats.total > 0 
    ? Math.round((stats.ok / stats.total) * 100) 
    : 100;

  const isActiveProduction = stats.total > 0;
  const hasCriticalIssues = stats.critical > 0;

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center relative',
              stats.critical > 0 
                ? 'bg-destructive/10 border border-destructive/20' 
                : stats.warning > 0 
                  ? 'bg-warning/10 border border-warning/20'
                  : 'bg-success/10 border border-success/20',
              isActiveProduction && (hasCriticalIssues ? 'animate-breathe-fast' : 'animate-breathe')
            )}>
              <Activity className={cn(
                'h-5 w-5',
                stats.critical > 0 ? 'text-destructive' : stats.warning > 0 ? 'text-warning' : 'text-success'
              )} />
              {isActiveProduction && (
                <div className="absolute inset-0 rounded-xl sanctum-icon" />
              )}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {t.widgets.liveProduction.title}
                {isActiveProduction && (
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t.widgets.liveProduction.lastBatches}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/production')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t.widgets.liveProduction.qualityToday}</span>
              <span className={cn(
                'text-lg font-bold font-mono',
                qualityRate >= 95 ? 'text-success' : qualityRate >= 80 ? 'text-warning' : 'text-destructive'
              )}>
                {qualityRate}%
              </span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-success" />
                {stats.ok} {t.widgets.liveProduction.ok}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-warning" />
                {stats.warning} {t.widgets.liveProduction.variances}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-destructive" />
                {stats.critical} {t.widgets.liveProduction.critical}
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[200px]">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t.widgets.liveProduction.noBatchToday}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => {
                const status = statusConfig[batch.quality_status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={batch.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-all',
                      status.bg
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className={cn('h-4 w-4', status.color)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{batch.bl_id}</span>
                          <Badge variant="outline" className="text-xs h-5">
                            #{batch.batch_number}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(batch.entered_at), 'HH:mm', { locale: dateLocale || undefined })}
                          {batch.entered_by_name && ` • ${batch.entered_by_name}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {batch.photo_pupitre_url && (
                        <a 
                          href={batch.photo_pupitre_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Camera className="h-4 w-4" />
                        </a>
                      )}
                      {batch.quality_status !== 'ok' && batch.quality_status !== 'pending' && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs font-mono',
                            batch.quality_status === 'critical' 
                              ? 'border-destructive text-destructive' 
                              : 'border-warning text-warning'
                          )}
                        >
                          {batch.variance_ciment_pct && batch.variance_ciment_pct > 2 
                            ? `C:${batch.variance_ciment_pct.toFixed(0)}%` 
                            : batch.variance_eau_pct && batch.variance_eau_pct > 2
                              ? `E:${batch.variance_eau_pct.toFixed(0)}%`
                              : t.widgets.liveProduction.variance
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
