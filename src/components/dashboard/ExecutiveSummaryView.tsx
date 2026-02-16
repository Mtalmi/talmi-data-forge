import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, DollarSign, TrendingUp, Gauge, Users, AlertTriangle,
  Wallet, Factory, Truck, Shield, X, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimatedCounterWithGlow } from '@/hooks/useAnimatedCounter';
import { PeriodStats } from '@/hooks/useDashboardStatsWithPeriod';
import { DashboardStats } from '@/hooks/useDashboardStats';

interface ExecutiveSummaryViewProps {
  periodStats: PeriodStats;
  dashboardStats: DashboardStats;
  onClose: () => void;
}

interface MetricTileProps {
  label: string;
  value: string;
  numericValue: number;
  decimals?: number;
  trend?: number;
  icon: React.ElementType;
  status: 'good' | 'warning' | 'critical' | 'neutral';
  delay: number;
}

function MetricTile({ label, value, numericValue, decimals = 0, trend, icon: Icon, status, delay }: MetricTileProps) {
  const { display: animatedNum, done } = useAnimatedCounterWithGlow(numericValue, 1200, decimals);
  
  const statusColors = {
    good: 'border-success/40 bg-success/5',
    warning: 'border-warning/40 bg-warning/5',
    critical: 'border-destructive/40 bg-destructive/5',
    neutral: 'border-border/40 bg-card',
  };

  const iconColors = {
    good: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    critical: 'text-destructive bg-destructive/10',
    neutral: 'text-primary bg-primary/10',
  };

  // Parse prefix/suffix from value string
  const match = value.match(/^([^\d-]*)(-?[\d,.]+)(.*)$/);
  const prefix = match?.[1] || '';
  const suffix = match?.[3] || '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.06, duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative rounded-xl border p-3 sm:p-4 flex flex-col justify-between min-h-[100px]',
        statusColors[status]
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
          {label}
        </p>
        <div className={cn('p-1.5 rounded-lg', iconColors[status])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      
      <p className={cn(
        'text-xl sm:text-2xl lg:text-3xl font-black font-mono tabular-nums transition-all duration-700',
        done ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]' : ''
      )}>
        {prefix}{animatedNum}{suffix}
      </p>

      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-[10px]',
          trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingUp className="h-3 w-3 rotate-180" /> : null}
          <span className="font-medium">{trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs M-1</span>
        </div>
      )}
    </motion.div>
  );
}

export function ExecutiveSummaryView({ periodStats, dashboardStats, onClose }: ExecutiveSummaryViewProps) {
  const metrics: MetricTileProps[] = [
    {
      label: 'Volume Total',
      value: `${periodStats.totalVolume.toFixed(0)} m³`,
      numericValue: periodStats.totalVolume,
      trend: periodStats.volumeTrend,
      icon: Package,
      status: periodStats.volumeTrend > 0 ? 'good' : periodStats.volumeTrend < -15 ? 'critical' : 'neutral',
      delay: 0,
    },
    {
      label: "Chiffre d'Affaires",
      value: `${(periodStats.chiffreAffaires / 1000).toFixed(1)}K`,
      numericValue: Math.round(periodStats.chiffreAffaires / 1000),
      trend: periodStats.caTrend,
      icon: DollarSign,
      status: periodStats.caTrend > 0 ? 'good' : 'neutral',
      delay: 1,
    },
    {
      label: 'Marge Brute',
      value: `${periodStats.margeBrutePct.toFixed(1)}%`,
      numericValue: periodStats.margeBrutePct,
      decimals: 1,
      trend: periodStats.margeTrend,
      icon: TrendingUp,
      status: periodStats.margeBrutePct >= 20 ? 'good' : periodStats.margeBrutePct < 15 ? 'critical' : 'warning',
      delay: 2,
    },
    {
      label: 'Profit Net',
      value: `${(periodStats.profitNet / 1000).toFixed(1)}K`,
      numericValue: Math.round(periodStats.profitNet / 1000),
      icon: Wallet,
      status: periodStats.profitNet > 0 ? 'good' : 'critical',
      delay: 3,
    },
    {
      label: 'CUR Moyen',
      value: periodStats.curMoyen > 0 ? `${periodStats.curMoyen.toFixed(2)}` : '0',
      numericValue: periodStats.curMoyen,
      decimals: 2,
      trend: periodStats.curTrend,
      icon: Gauge,
      status: periodStats.curTrend > 5 ? 'warning' : 'good',
      delay: 4,
    },
    {
      label: 'Clients Actifs',
      value: `${periodStats.nbClients}`,
      numericValue: periodStats.nbClients,
      icon: Users,
      status: 'neutral',
      delay: 5,
    },
    {
      label: 'Livraisons',
      value: `${periodStats.nbLivraisons}`,
      numericValue: periodStats.nbLivraisons,
      icon: Truck,
      status: 'neutral',
      delay: 6,
    },
    {
      label: 'Factures',
      value: `${periodStats.nbFactures}`,
      numericValue: periodStats.nbFactures,
      icon: Factory,
      status: 'neutral',
      delay: 7,
    },
    {
      label: 'Alertes Marge',
      value: `${dashboardStats.marginAlerts}`,
      numericValue: dashboardStats.marginAlerts,
      icon: AlertTriangle,
      status: dashboardStats.marginAlerts > 0 ? 'critical' : 'good',
      delay: 8,
    },
    {
      label: 'Impayés',
      value: `${(dashboardStats.pendingPaymentsTotal / 1000).toFixed(0)}K`,
      numericValue: Math.round(dashboardStats.pendingPaymentsTotal / 1000),
      icon: Shield,
      status: dashboardStats.pendingPaymentsTotal > 100000 ? 'critical' : dashboardStats.pendingPaymentsTotal > 50000 ? 'warning' : 'good',
      delay: 9,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/30">
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-tighter font-display">
            📊 Executive Summary
          </h1>
          <p className="text-xs text-muted-foreground font-mono">{periodStats.periodLabel} • Mise à jour en temps réel</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Metrics Grid - designed to fit one screen */}
      <div className="flex-1 p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {metrics.map((metric, i) => (
            <MetricTile key={metric.label} {...metric} delay={i} />
          ))}
        </div>
      </div>

      {/* Footer status bar */}
      <div className="px-4 sm:px-8 py-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">TBOS • Talmi Béton Operating System</span>
        <span className="font-mono">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
    </motion.div>
  );
}
