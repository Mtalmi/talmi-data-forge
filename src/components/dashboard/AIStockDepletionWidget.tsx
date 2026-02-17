import { useState } from 'react';
import { Package, Loader2, RefreshCw, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAIPredictiveAnalytics } from '@/hooks/useAIPredictiveAnalytics';
import { toast } from 'sonner';

export function AIStockDepletionWidget() {
  const { fetchStockDepletion, stockDepletion, isLoading } = useAIPredictiveAnalytics();

  const runAnalysis = async () => {
    try {
      const result = await fetchStockDepletion();
      if (result) {
        const critical = result.predictions.filter(p => p.urgency === 'critical').length;
        if (critical > 0) {
          toast.warning(`⚠️ ${critical} matériau(x) en rupture imminente`);
        } else {
          toast.success('✅ Niveaux de stock sous contrôle');
        }
      }
    } catch (err) {
      toast.error('Erreur lors de l\'analyse stock');
    }
  };

  const urgencyStyles: Record<string, string> = {
    critical: 'border-destructive/50 bg-destructive/10 text-destructive',
    warning: 'border-warning/50 bg-warning/10 text-warning',
    ok: 'border-success/30 bg-success/5 text-success',
  };

  const urgencyIcons: Record<string, React.ReactNode> = {
    critical: <AlertTriangle className="h-4 w-4 text-destructive" />,
    warning: <Clock className="h-4 w-4 text-warning" />,
    ok: <CheckCircle className="h-4 w-4 text-success" />,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">📦 Prédiction Rupture Stock</h3>
        </div>
        <Button size="sm" variant="outline" onClick={runAnalysis} disabled={isLoading} className="h-8 gap-1.5 text-xs">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {isLoading ? 'Analyse...' : 'Analyser'}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-3">
          <Package className="h-8 w-8 text-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium">Analyse de consommation...</p>
            <p className="text-[10px] text-muted-foreground">Calcul des tendances sur 30 jours</p>
          </div>
        </div>
      )}

      {!isLoading && stockDepletion && (
        <div className="space-y-2">
          {stockDepletion.predictions
            .sort((a, b) => a.days_until_empty - b.days_until_empty)
            .map((pred) => (
              <div key={pred.materiau} className={cn('rounded-lg border p-3 space-y-1.5', urgencyStyles[pred.urgency])}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {urgencyIcons[pred.urgency]}
                    <span className="font-semibold text-sm text-foreground">{pred.materiau}</span>
                  </div>
                  <Badge variant={pred.urgency === 'critical' ? 'destructive' : pred.urgency === 'warning' ? 'outline' : 'secondary'} className="text-[10px]">
                    {pred.days_until_empty}j restants
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <p className="text-muted-foreground">Stock actuel</p>
                    <p className="font-medium text-foreground">{pred.current_qty.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conso/jour</p>
                    <p className="font-medium text-foreground">{pred.daily_consumption.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rupture</p>
                    <p className="font-medium text-foreground">{new Date(pred.depletion_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <span>💡</span>
                  <span>{pred.recommendation}</span>
                </p>
              </div>
            ))}

          {stockDepletion.alerts.length > 0 && (
            <div className="space-y-1 pt-1">
              {stockDepletion.alerts.map((alert, i) => (
                <p key={i} className="text-[10px] text-destructive flex gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  {alert}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && !stockDepletion && (
        <div className="text-center py-4 text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Cliquez pour prédire les ruptures de stock</p>
        </div>
      )}
    </div>
  );
}
