import { useState, useEffect, useCallback } from 'react';
import { Brain, Zap, AlertTriangle, TrendingDown, DollarSign, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { DashboardStats, DashboardAlert } from '@/hooks/useDashboardStats';

interface SmartAlertsWidgetProps {
  alerts: DashboardAlert[];
  dashboardStats: DashboardStats;
}

interface ScoredAlert {
  alert: DashboardAlert;
  score: number;
  impact: 'revenue' | 'quality' | 'cash' | 'operations' | 'security';
  action: string;
}

function scoreAlert(alert: DashboardAlert, stats: DashboardStats): ScoredAlert {
  let score = 0;
  let impact: ScoredAlert['impact'] = 'operations';
  let action = '';

  // Base score by type
  if (alert.type === 'critical') score += 80;
  else if (alert.type === 'warning') score += 50;
  else score += 20;

  // Context-based scoring
  if (alert.id === 'payments-overdue') {
    score += Math.min(20, stats.pendingPaymentsTotal / 10000);
    impact = 'cash';
    action = 'Relancer les clients en retard';
  } else if (alert.id === 'margin-alerts') {
    score += stats.marginAlerts * 10;
    impact = 'revenue';
    action = 'Vérifier les écarts de marge';
  } else if (alert.id === 'volume-down') {
    score += Math.abs(stats.volumeTrend);
    impact = 'revenue';
    action = 'Analyser la baisse commerciale';
  } else if (alert.id === 'cur-increase') {
    score += stats.curTrend * 3;
    impact = 'quality';
    action = 'Contrôler les coûts matières';
  } else if (alert.id === 'ec-ratio-high') {
    score += 15;
    impact = 'quality';
    action = 'Audit qualité formule béton';
  } else if (alert.id === 'deliveries-down') {
    score += Math.abs(stats.deliveriesTrend);
    impact = 'operations';
    action = 'Revoir la planification';
  } else if (alert.id === 'clients-down') {
    score += Math.abs(stats.clientsTrend) * 2;
    impact = 'revenue';
    action = 'Stratégie fidélisation clients';
  }

  return { alert, score: Math.min(100, Math.round(score)), impact, action };
}

const impactIcons = {
  revenue: DollarSign,
  quality: AlertTriangle,
  cash: DollarSign,
  operations: Zap,
  security: Shield,
};

const impactColors = {
  revenue: 'text-warning bg-warning/10',
  quality: 'text-destructive bg-destructive/10',
  cash: 'text-destructive bg-destructive/10',
  operations: 'text-primary bg-primary/10',
  security: 'text-destructive bg-destructive/10',
};

export function SmartAlertsWidget({ alerts, dashboardStats }: SmartAlertsWidgetProps) {
  const scoredAlerts = alerts
    .map(a => scoreAlert(a, dashboardStats))
    .sort((a, b) => b.score - a.score);

  if (scoredAlerts.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-success/20 bg-success/5">
        <Shield className="h-5 w-5 text-success" />
        <div>
          <p className="text-sm font-semibold text-success">Aucune alerte</p>
          <p className="text-xs text-muted-foreground">Tous les indicateurs sont nominaux</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-destructive/10">
          <Brain className="h-4 w-4 text-destructive" />
        </div>
        <h3 className="text-sm font-bold">Alertes Priorisées AI</h3>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">{scoredAlerts.length} alertes</span>
      </div>

      <div className="space-y-2">
        {scoredAlerts.slice(0, 5).map((sa, i) => {
          const ImpactIcon = impactIcons[sa.impact];
          return (
            <div
              key={sa.alert.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/20',
                sa.score >= 80 ? 'border-destructive/30 bg-destructive/5' :
                sa.score >= 50 ? 'border-warning/30 bg-warning/5' :
                'border-border/40 bg-card'
              )}
            >
              {/* Priority Score */}
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black',
                sa.score >= 80 ? 'bg-destructive text-destructive-foreground' :
                sa.score >= 50 ? 'bg-warning text-warning-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {sa.score}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold truncate">{sa.alert.title}</span>
                  <div className={cn('p-0.5 rounded', impactColors[sa.impact])}>
                    <ImpactIcon className="h-2.5 w-2.5" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{sa.alert.message}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary font-medium">
                  <ChevronRight className="h-3 w-3" />
                  {sa.action}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
