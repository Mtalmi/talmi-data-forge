import { useState } from 'react';
import { Users, Loader2, RefreshCw, ShieldAlert, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAIPredictiveAnalytics } from '@/hooks/useAIPredictiveAnalytics';
import { toast } from 'sonner';

export function AIClientRiskWidget() {
  const { fetchClientRisk, clientRisk, isLoading } = useAIPredictiveAnalytics();

  const runAnalysis = async () => {
    try {
      const result = await fetchClientRisk();
      if (result) {
        const { high_risk_count } = result.summary;
        if (high_risk_count > 0) {
          toast.warning(`⚠️ ${high_risk_count} client(s) à risque élevé`);
        } else {
          toast.success('✅ Portefeuille client sain');
        }
      }
    } catch (err) {
      toast.error('Erreur lors de l\'analyse risque');
    }
  };

  const riskColors: Record<string, string> = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-orange-500',
    critical: 'text-destructive',
  };

  const riskBg: Record<string, string> = {
    low: 'bg-success',
    medium: 'bg-warning',
    high: 'bg-orange-500',
    critical: 'bg-destructive',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">👥 Scoring Risque Clients</h3>
        </div>
        <Button size="sm" variant="outline" onClick={runAnalysis} disabled={isLoading} className="h-8 gap-1.5 text-xs">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {isLoading ? 'Analyse...' : 'Scorer'}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-3">
          <Users className="h-8 w-8 text-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium">Scoring crédit en cours...</p>
            <p className="text-[10px] text-muted-foreground">Analyse des historiques de paiement</p>
          </div>
        </div>
      )}

      {!isLoading && clientRisk && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Score moyen</p>
              <p className="text-lg font-bold">{clientRisk.summary.avg_portfolio_score}</p>
            </div>
            <div className="rounded-lg border border-destructive/30 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">À risque</p>
              <p className="text-lg font-bold text-destructive">{clientRisk.summary.high_risk_count}</p>
            </div>
            <div className="rounded-lg border border-warning/30 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Montant exposé</p>
              <p className="text-sm font-bold text-warning">{(clientRisk.summary.total_at_risk_amount / 1000).toFixed(0)}K</p>
            </div>
          </div>

          {/* Client list sorted by risk */}
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {clientRisk.clients
              .sort((a, b) => b.risk_score - a.risk_score)
              .slice(0, 8)
              .map((client) => (
                <div key={client.client_id} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', riskBg[client.risk_level])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{client.nom}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>Retard moy: {client.avg_delay_days}j</span>
                      <span>·</span>
                      <span>Fiabilité: {client.payment_reliability}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={client.risk_level === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                      {client.risk_score}/100
                    </Badge>
                    {client.churn_probability > 50 && (
                      <p className="text-[9px] text-destructive flex items-center gap-0.5 mt-0.5 justify-end">
                        <TrendingDown className="h-2.5 w-2.5" />
                        Churn {client.churn_probability}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {!isLoading && !clientRisk && (
        <div className="text-center py-4 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Cliquez pour scorer le risque clients</p>
        </div>
      )}
    </div>
  );
}
