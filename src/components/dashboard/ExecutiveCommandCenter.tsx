import { useNavigate } from 'react-router-dom';
import { useExecutiveMetrics } from '@/hooks/useExecutiveMetrics';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Banknote,
  ShieldCheck,
  Scale,
  FileWarning,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GaugeProps {
  value: number;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  thresholds: { green: number; yellow: number; reverse?: boolean };
}

function ExecutiveGauge({ value, label, subtitle, icon, thresholds }: GaugeProps) {
  const getColor = () => {
    if (thresholds.reverse) {
      // Lower is better (e.g., leakage)
      if (value < thresholds.green) return 'success';
      if (value < thresholds.yellow) return 'warning';
      return 'destructive';
    } else {
      // Higher is better (e.g., cash ratio, quality)
      if (value >= thresholds.green) return 'success';
      if (value >= thresholds.yellow) return 'warning';
      return 'destructive';
    }
  };

  const color = getColor();
  const percentage = Math.min(Math.max(value, 0), 100);
  
  // SVG gauge parameters
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-lg">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              'transition-all duration-1000 ease-out',
              color === 'success' && 'text-success',
              color === 'warning' && 'text-warning',
              color === 'destructive' && 'text-destructive'
            )}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'text-2xl font-bold tabular-nums',
            color === 'success' && 'text-success',
            color === 'warning' && 'text-warning',
            color === 'destructive' && 'text-destructive'
          )}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className={cn(
            color === 'success' && 'text-success',
            color === 'warning' && 'text-warning',
            color === 'destructive' && 'text-destructive'
          )}>
            {icon}
          </span>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export function ExecutiveCommandCenter() {
  const navigate = useNavigate();
  const { metrics, loading, refresh } = useExecutiveMetrics();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Centre de Commande Exécutif
          </h2>
          <p className="text-xs text-muted-foreground">Vue Hawaii • Mise à jour en temps réel</p>
        </div>
      </div>

      {/* The Big Three Gauges */}
      <div className="grid grid-cols-3 gap-4">
        <ExecutiveGauge
          value={metrics.leakageRate}
          label="Taux de Fuite"
          subtitle={`${metrics.leakageDeliveries}/${metrics.totalDeliveries} BL`}
          icon={<AlertTriangle className="h-4 w-4" />}
          thresholds={{ green: 3, yellow: 5, reverse: true }}
        />
        <ExecutiveGauge
          value={metrics.cashCreditRatio}
          label="Cash/Crédit"
          subtitle={`${metrics.cashPayments} payés`}
          icon={<Banknote className="h-4 w-4" />}
          thresholds={{ green: 90, yellow: 70 }}
        />
        <ExecutiveGauge
          value={metrics.qualityIndex}
          label="Indice Qualité"
          subtitle={`${metrics.conformTests}/${metrics.totalTests} tests`}
          icon={<ShieldCheck className="h-4 w-4" />}
          thresholds={{ green: 100, yellow: 95 }}
        />
      </div>

      {/* One-Click Emergency Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-warning/10 hover:border-warning/50 hover:text-warning transition-all"
          onClick={() => navigate('/production')}
        >
          <Scale className="h-6 w-6" />
          <div className="text-center">
            <p className="font-semibold text-sm">Audit Dosages</p>
            <p className="text-xs text-muted-foreground">Vérifier les écarts</p>
          </div>
          <ArrowRight className="h-4 w-4 mt-1" />
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all"
          onClick={() => navigate('/clients')}
        >
          <Banknote className="h-6 w-6" />
          <div className="text-center">
            <p className="font-semibold text-sm">Relance Impayés</p>
            <p className="text-xs text-muted-foreground">
              {(metrics.pendingRecovery / 1000).toFixed(0)}K DH
            </p>
          </div>
          <ArrowRight className="h-4 w-4 mt-1" />
        </Button>

        <Button
          variant="outline"
          className={cn(
            'h-auto py-4 flex flex-col items-center gap-2 transition-all',
            metrics.nonConformTests > 0 
              ? 'hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive border-destructive/30 bg-destructive/5' 
              : 'hover:bg-success/10 hover:border-success/50 hover:text-success'
          )}
          onClick={() => navigate('/laboratoire')}
        >
          <FileWarning className={cn(
            'h-6 w-6',
            metrics.nonConformTests > 0 && 'text-destructive animate-pulse'
          )} />
          <div className="text-center">
            <p className="font-semibold text-sm">Non-Conformités</p>
            <p className={cn(
              'text-xs',
              metrics.nonConformTests > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'
            )}>
              {metrics.nonConformTests > 0 ? `${metrics.nonConformTests} alertes` : 'Aucune alerte'}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 mt-1" />
        </Button>
      </div>
    </div>
  );
}
