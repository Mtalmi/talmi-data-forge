import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  AlertTriangle, 
  Lock,
  Shield,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';

interface BudgetStats {
  spent: number;
  cap: number;
  remaining: number;
  percentUsed: number;
  exceeded: boolean;
  daysRemaining: number;
}

export function CircularBudgetGauge() {
  const { t } = useI18n();
  const [stats, setStats] = useState<BudgetStats>({
    spent: 0,
    cap: 15000,
    remaining: 15000,
    percentUsed: 0,
    exceeded: false,
    daysRemaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchBudgetStats = useCallback(async () => {
    try {
      const now = new Date();
      const monthYear = now.toISOString().slice(0, 7);
      
      const { data: capData } = await supabase
        .from('monthly_expense_caps')
        .select('level1_spent, level1_cap, cap_exceeded')
        .eq('month_year', monthYear)
        .maybeSingle();

      const spent = capData?.level1_spent || 0;
      const cap = capData?.level1_cap || 15000;
      const exceeded = capData?.cap_exceeded || false;
      
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysRemaining = lastDay.getDate() - now.getDate();

      setStats({
        spent,
        cap,
        remaining: Math.max(0, cap - spent),
        percentUsed: Math.min(100, (spent / cap) * 100),
        exceeded,
        daysRemaining,
      });
    } catch (error) {
      console.error('Error fetching budget stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Trigger mount animation
    const timer = setTimeout(() => setMounted(true), 100);
    
    fetchBudgetStats();

    const channel = supabase
      .channel('circular_budget_gauge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_expense_caps' },
        () => fetchBudgetStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses_controlled' },
        () => fetchBudgetStats()
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchBudgetStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBudgetStats();
    setRefreshing(false);
  };

  // SVG circular gauge parameters
  const size = 180;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (mounted ? (stats.percentUsed / 100) * circumference : circumference);

  // Color based on usage
  const getColor = () => {
    if (stats.exceeded || stats.percentUsed >= 100) return 'text-destructive';
    if (stats.percentUsed >= 90) return 'text-red-500';
    if (stats.percentUsed >= 75) return 'text-orange-500';
    if (stats.percentUsed >= 50) return 'text-amber-500';
    return 'text-success';
  };

  const getStrokeColor = () => {
    if (stats.exceeded || stats.percentUsed >= 100) return 'stroke-destructive';
    if (stats.percentUsed >= 90) return 'stroke-red-500';
    if (stats.percentUsed >= 75) return 'stroke-orange-500';
    if (stats.percentUsed >= 50) return 'stroke-amber-500';
    return 'stroke-success';
  };

  const getGlowColor = () => {
    if (stats.exceeded || stats.percentUsed >= 100) return 'drop-shadow-[0_0_12px_hsl(var(--destructive)/0.5)]';
    if (stats.percentUsed >= 90) return 'drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]';
    if (stats.percentUsed >= 75) return 'drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]';
    if (stats.percentUsed >= 50) return 'drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    return 'drop-shadow-[0_0_12px_hsl(var(--success)/0.5)]';
  };

  const getStatusBadge = () => {
    if (stats.exceeded) {
      return (
        <Badge variant="destructive" className="animate-pulse gap-1.5 px-3 py-1 text-xs font-bold">
          <Lock className="h-3 w-3" />
          {t.widgets.budgetGauge.blocked}
        </Badge>
      );
    }
    if (stats.percentUsed >= 90) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-500 gap-1.5 px-3 py-1 text-xs font-bold shadow-glow-destructive">
          <AlertTriangle className="h-3 w-3" />
          {t.widgets.budgetGauge.criticalStatus}
        </Badge>
      );
    }
    if (stats.percentUsed >= 75) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500 gap-1.5 px-3 py-1 text-xs font-bold shadow-glow-warning">
          <TrendingUp className="h-3 w-3" />
          {t.widgets.budgetGauge.highStatus}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-success text-success gap-1.5 px-3 py-1 text-xs font-bold shadow-glow-success">
        <Shield className="h-3 w-3" />
        {t.widgets.budgetGauge.okStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32 skeleton-premium" />
          <Skeleton className="h-6 w-20 skeleton-premium" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-44 w-44 rounded-full skeleton-premium" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "glass-panel transition-all duration-500",
      stats.exceeded && "border-destructive/40 shadow-glow-destructive",
      stats.percentUsed >= 90 && !stats.exceeded && "border-red-500/40",
      stats.percentUsed >= 75 && stats.percentUsed < 90 && "border-orange-500/40"
    )}>
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">{t.widgets.budgetGauge.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted/50"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="px-4 pb-4 flex flex-col items-center">
        {/* Animated Circular Gauge */}
        <div className="relative mb-4">
          <svg 
            width={size} 
            height={size} 
            className="transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn(
                'transition-all duration-1000 ease-out',
                getStrokeColor(),
                getGlowColor()
              )}
              style={{
                '--gauge-circumference': circumference,
              } as React.CSSProperties}
            />
            {[50, 75, 90].map((threshold) => {
              const angle = (threshold / 100) * 360 - 90;
              const x1 = size / 2 + (radius - strokeWidth / 2) * Math.cos((angle * Math.PI) / 180);
              const y1 = size / 2 + (radius - strokeWidth / 2) * Math.sin((angle * Math.PI) / 180);
              const x2 = size / 2 + (radius + strokeWidth / 2) * Math.cos((angle * Math.PI) / 180);
              const y2 = size / 2 + (radius + strokeWidth / 2) * Math.sin((angle * Math.PI) / 180);
              return (
                <line
                  key={threshold}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-muted-foreground/30"
                />
              );
            })}
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              'text-4xl font-black tabular-nums tracking-tight',
              mounted && 'animate-number-pop',
              getColor()
            )}>
              {stats.percentUsed.toFixed(0)}%
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-1">{t.widgets.budgetGauge.used}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-3">
          <div className="glass-card p-3 rounded-xl text-center">
            <p className={cn(
              "text-sm font-bold tabular-nums",
              stats.exceeded ? "text-destructive" : "text-success"
            )}>
              {stats.remaining.toLocaleString('fr-MA')}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{t.widgets.budgetGauge.madRemaining}</p>
          </div>
          <div className="glass-card p-3 rounded-xl text-center">
            <p className="text-sm font-bold text-foreground tabular-nums">
              {stats.spent.toLocaleString('fr-MA')}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{t.widgets.budgetGauge.spent}</p>
          </div>
          <div className="glass-card p-3 rounded-xl text-center">
            <p className="text-sm font-bold text-foreground tabular-nums">
              {stats.daysRemaining}j
            </p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{t.widgets.budgetGauge.daysRemaining}</p>
          </div>
        </div>

        {/* Warning Alert */}
        {stats.exceeded && (
          <div className="mt-4 w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 animate-fade-in">
            <Lock className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-xs font-bold text-destructive">{t.widgets.budgetGauge.capReached}</p>
              <p className="text-[10px] text-destructive/80">{t.widgets.budgetGauge.ceoValidationRequired}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
