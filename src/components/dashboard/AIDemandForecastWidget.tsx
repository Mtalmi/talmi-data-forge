import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAIPredictiveAnalytics } from '@/hooks/useAIPredictiveAnalytics';
import { toast } from 'sonner';

export function AIDemandForecastWidget() {
  const { fetchDemandForecast, demandForecast, isLoading } = useAIPredictiveAnalytics();

  const runForecast = async () => {
    try {
      const result = await fetchDemandForecast();
      if (result) toast.success(`📊 Prévision: ${result.total_predicted_m3} m³ cette semaine`);
    } catch (err) {
      toast.error('Erreur lors de la prévision');
    }
  };

  const trendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-success" />;
    if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">🔮 Prévision Demande AI</h3>
        </div>
        <Button size="sm" variant="outline" onClick={runForecast} disabled={isLoading} className="h-8 gap-1.5 text-xs">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {isLoading ? 'Analyse...' : 'Prévoir'}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-3">
          <BarChart3 className="h-8 w-8 text-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium">Analyse prédictive en cours...</p>
            <p className="text-[10px] text-muted-foreground">Traitement de 90 jours d'historique</p>
          </div>
        </div>
      )}

      {!isLoading && demandForecast && (
        <div className="space-y-3">
          {/* Overall summary */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume prévu (7j)</p>
                <p className="text-2xl font-bold text-foreground">{demandForecast.total_predicted_m3} m³</p>
              </div>
              <div className="flex items-center gap-1.5">
                {trendIcon(demandForecast.overall_trend)}
                <span className="text-xs font-medium capitalize">{demandForecast.overall_trend === 'up' ? 'Hausse' : demandForecast.overall_trend === 'down' ? 'Baisse' : 'Stable'}</span>
              </div>
            </div>
          </div>

          {/* Daily forecast bars */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Prévision journalière</p>
            {demandForecast.weekly_forecast.map((day) => {
              const maxVol = Math.max(...demandForecast.weekly_forecast.map(d => d.predicted_volume_m3));
              const pct = maxVol > 0 ? (day.predicted_volume_m3 / maxVol) * 100 : 0;
              return (
                <div key={day.date} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 capitalize">{day.day.slice(0, 3)}</span>
                  <div className="flex-1 h-5 bg-muted/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-sm transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium w-14 text-right">{day.predicted_volume_m3} m³</span>
                  <Badge variant="outline" className="text-[8px] px-1">{day.confidence}%</Badge>
                </div>
              );
            })}
          </div>

          {/* Top formules */}
          {demandForecast.by_formule.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Par formule</p>
              {demandForecast.by_formule.slice(0, 5).map((f) => (
                <div key={f.formule_id} className="flex items-center justify-between text-xs border-b border-border/30 pb-1">
                  <span className="font-medium">{f.nom}</span>
                  <div className="flex items-center gap-2">
                    <span>{f.predicted_weekly_m3} m³</span>
                    {trendIcon(f.trend)}
                    <span className={cn('text-[10px]', f.change_pct > 0 ? 'text-success' : f.change_pct < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                      {f.change_pct > 0 ? '+' : ''}{f.change_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Insights */}
          {demandForecast.insights.length > 0 && (
            <div className="space-y-1">
              {demandForecast.insights.slice(0, 3).map((insight, i) => (
                <p key={i} className="text-[10px] text-muted-foreground flex gap-1">
                  <span>💡</span>
                  <span>{insight}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && !demandForecast && (
        <div className="text-center py-4 text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Cliquez pour générer les prévisions AI</p>
        </div>
      )}
    </div>
  );
}
