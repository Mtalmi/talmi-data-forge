import React, { forwardRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExecutiveMetrics } from '@/hooks/useExecutiveMetrics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Banknote,
  ShieldCheck,
  Scale,
  FileWarning,
  Loader2,
  ArrowRight,
  Droplets,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CashCreditDrawer } from './CashCreditDrawer';
import { LeakageDrawer } from './LeakageDrawer';
import { QualityDrawer } from './QualityDrawer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GaugeProps {
  value: number;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  thresholds: { green: number; yellow: number; reverse?: boolean };
  onClick?: () => void;
  statusOverride?: 'green' | 'yellow' | 'red';
  pulseOnRed?: boolean;
}

const ExecutiveGauge = forwardRef<HTMLDivElement, GaugeProps>(
  ({ value, label, subtitle, icon, thresholds, onClick, statusOverride, pulseOnRed }, ref) => {
  const getColor = () => {
    if (statusOverride) return statusOverride === 'green' ? 'success' : statusOverride === 'yellow' ? 'warning' : 'destructive';
    
    if (thresholds.reverse) {
      // Lower is better (e.g., leakage)
      if (value <= thresholds.green) return 'success';
      if (value <= thresholds.yellow) return 'warning';
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
  
  // SVG gauge parameters - smaller on mobile
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const shouldPulse = pulseOnRed && color === 'destructive';

  return (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-card to-muted/30 border border-border/50",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-95",
        shouldPulse && "ring-2 ring-destructive/50 animate-pulse border-destructive/50"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
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
            'text-lg font-bold tabular-nums',
            color === 'success' && 'text-success',
            color === 'warning' && 'text-warning',
            color === 'destructive' && 'text-destructive'
          )}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className={cn(
            'h-3.5 w-3.5',
            color === 'success' && 'text-success',
            color === 'warning' && 'text-warning',
            color === 'destructive' && 'text-destructive'
          )}>
            {icon}
          </span>
          <span className="font-semibold text-xs">{label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
      </div>
    </div>
  );
});

ExecutiveGauge.displayName = 'ExecutiveGauge';

export function ExecutiveCommandCenter() {
  const navigate = useNavigate();
  const { metrics, loading, refresh } = useExecutiveMetrics();
  const [cashCreditOpen, setCashCreditOpen] = useState(false);
  const [leakageOpen, setLeakageOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState(false);

  // Trigger forensic alert when variance > 7% (SECURITY VIOLATION)
  useEffect(() => {
    const triggerForensicAlert = async () => {
      if (metrics.materialVariancePct > 7 && !alertTriggered) {
        setAlertTriggered(true);
        
        try {
          // Log security violation to audit_logs
          const { error } = await supabase
            .from('audit_logs')
            .insert({
              user_id: 'system',
              action_type: 'SECURITY_VIOLATION',
              table_name: 'executive_metrics',
              record_id: `leakage_${new Date().toISOString()}`,
              old_data: null,
              new_data: {
                type: 'MATERIAL_LEAKAGE_CRITICAL',
                variance_pct: metrics.materialVariancePct.toFixed(2),
                theoretical_kg: metrics.totalTheoreticalMaterial.toFixed(2),
                actual_kg: metrics.totalActualMaterial.toFixed(2),
                threshold: '7%',
                severity: 'CRITICAL'
              }
            });

          if (!error) {
            toast.error(
              <div className="space-y-1">
                <p className="font-bold">🚨 ALERTE FUITE CRITIQUE</p>
                <p className="text-xs">Variance matériaux: {metrics.materialVariancePct.toFixed(1)}% (&gt;7%)</p>
                <p className="text-xs">Événement enregistré dans le Journal Forensic</p>
              </div>,
              { duration: 10000 }
            );
          }
        } catch (err) {
          console.error('Error logging leakage alert:', err);
        }
      }
    };

    triggerForensicAlert();
  }, [metrics.materialVariancePct, alertTriggered, metrics.totalTheoreticalMaterial, metrics.totalActualMaterial]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
              Centre de Commande Exécutif
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vue Hawaii • Mise à jour en temps réel</p>
          </div>
        </div>
        {/* Material Variance Status Badge */}
        {metrics.materialVariancePct > 3 && (
          <Badge 
            variant={metrics.varianceStatus === 'red' ? 'destructive' : 'secondary'}
            className={cn(
              "text-[9px] gap-1",
              metrics.varianceStatus === 'red' && "animate-pulse",
              metrics.varianceStatus === 'yellow' && "bg-warning text-warning-foreground"
            )}
          >
            <Droplets className="h-3 w-3" />
            {metrics.varianceStatus === 'red' ? '🚨 FUITE CRITIQUE' : '⚠️ FUITE DÉTECTÉE'}
          </Badge>
        )}
      </div>

      {/* The Big Three Gauges - Using Material Variance Formula */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <ExecutiveGauge
          value={Math.abs(metrics.materialVariancePct)}
          label="Taux de Fuite"
          subtitle={`Écart: ${metrics.materialVariancePct >= 0 ? '+' : ''}${metrics.materialVariancePct.toFixed(1)}%`}
          icon={<Droplets className="h-3.5 w-3.5" />}
          thresholds={{ green: 3, yellow: 7, reverse: true }}
          statusOverride={metrics.varianceStatus}
          pulseOnRed={true}
          onClick={() => setLeakageOpen(true)}
        />
        <ExecutiveGauge
          value={metrics.cashCreditRatio}
          label="Cash/Crédit"
          subtitle={`${metrics.cashPayments} payés`}
          icon={<Banknote className="h-3.5 w-3.5" />}
          thresholds={{ green: 90, yellow: 70 }}
          onClick={() => setCashCreditOpen(true)}
        />
        <ExecutiveGauge
          value={metrics.qualityIndex}
          label="Indice Qualité"
          subtitle={`${metrics.conformTests}/${metrics.totalTests} tests`}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          thresholds={{ green: 100, yellow: 95 }}
          onClick={() => setQualityOpen(true)}
        />
      </div>

      {/* Material Variance Details (when > 3%) */}
      {metrics.materialVariancePct > 3 && (
        <div className={cn(
          "p-3 rounded-lg border-l-4 text-xs",
          metrics.varianceStatus === 'red' 
            ? "bg-destructive/10 border-l-destructive" 
            : "bg-warning/10 border-l-warning"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "font-semibold",
                metrics.varianceStatus === 'red' ? "text-destructive" : "text-warning"
              )}>
                {metrics.varianceStatus === 'red' ? '🚨 SECURITY VIOLATION' : '⚠️ Variance Détectée'}
              </p>
              <p className="text-muted-foreground mt-0.5">
                Formule: (Réel - Théorique) / Théorique = {metrics.materialVariancePct.toFixed(2)}%
              </p>
            </div>
            <div className="text-right font-mono">
              <p className="text-muted-foreground">Théo: {(metrics.totalTheoreticalMaterial / 1000).toFixed(1)}T</p>
              <p className={cn(
                "font-semibold",
                metrics.varianceStatus === 'red' ? "text-destructive" : "text-warning"
              )}>
                Réel: {(metrics.totalActualMaterial / 1000).toFixed(1)}T
              </p>
            </div>
          </div>
        </div>
      )}

      {/* One-Click Emergency Actions - Compact on mobile */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 hover:bg-warning/10 hover:border-warning/50 hover:text-warning transition-all min-h-[80px]"
          onClick={() => navigate('/production')}
        >
          <Scale className="h-5 w-5" />
          <div className="text-center">
            <p className="font-semibold text-[11px] sm:text-sm leading-tight">Audit Dosages</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">Vérifier les écarts</p>
          </div>
          <ArrowRight className="h-3 w-3" />
        </Button>

        <Button
          variant="outline"
          className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all min-h-[80px]"
          onClick={() => navigate('/clients')}
        >
          <Banknote className="h-5 w-5" />
          <div className="text-center">
            <p className="font-semibold text-[11px] sm:text-sm leading-tight">Relance Impayés</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground">
              {(metrics.pendingRecovery / 1000).toFixed(0)}K DH
            </p>
          </div>
          <ArrowRight className="h-3 w-3" />
        </Button>

        <Button
          variant="outline"
          className={cn(
            'h-auto py-3 px-2 flex flex-col items-center gap-1.5 transition-all min-h-[80px]',
            metrics.nonConformTests > 0 
              ? 'hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive border-destructive/30 bg-destructive/5' 
              : 'hover:bg-success/10 hover:border-success/50 hover:text-success'
          )}
          onClick={() => navigate('/laboratoire')}
        >
          <FileWarning className={cn(
            'h-5 w-5',
            metrics.nonConformTests > 0 && 'text-destructive animate-pulse'
          )} />
          <div className="text-center">
            <p className="font-semibold text-[11px] sm:text-sm leading-tight">Non-Conformités</p>
            <p className={cn(
              'text-[9px] sm:text-xs',
              metrics.nonConformTests > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'
            )}>
              {metrics.nonConformTests > 0 ? `${metrics.nonConformTests} alertes` : 'Aucune'}
            </p>
          </div>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Cash/Credit Detail Drawer */}
      <CashCreditDrawer open={cashCreditOpen} onOpenChange={setCashCreditOpen} />
      
      {/* Leakage Detail Drawer */}
      <LeakageDrawer open={leakageOpen} onOpenChange={setLeakageOpen} />
      
      {/* Quality Detail Drawer */}
      <QualityDrawer open={qualityOpen} onOpenChange={setQualityOpen} />
    </div>
  );
}
