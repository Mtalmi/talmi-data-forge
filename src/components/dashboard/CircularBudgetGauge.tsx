import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface BudgetStats {
  spent: number;
  cap: number;
  remaining: number;
  percentUsed: number;
  exceeded: boolean;
  daysRemaining: number;
}

export function CircularBudgetGauge() {
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

  const fetchBudgetStats = useCallback(async () => {
    try {
      const now = new Date();
      const monthYear = now.toISOString().slice(0, 7);
      
      const { data: capData } = await supabase
        .from('monthly_expense_caps')
        .select('level1_spent, level1_cap, cap_exceeded')
        .eq('month_year', monthYear)
        .single();

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
      supabase.removeChannel(channel);
    };
  }, [fetchBudgetStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBudgetStats();
    setRefreshing(false);
  };

  // SVG circular gauge parameters
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (stats.percentUsed / 100) * circumference;

  // Color based on usage
  const getColor = () => {
    if (stats.exceeded || stats.percentUsed >= 100) return 'text-destructive';
    if (stats.percentUsed >= 90) return 'text-red-500';
    if (stats.percentUsed >= 75) return 'text-orange-500';
    if (stats.percentUsed >= 50) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getStrokeColor = () => {
    if (stats.exceeded || stats.percentUsed >= 100) return 'stroke-destructive';
    if (stats.percentUsed >= 90) return 'stroke-red-500';
    if (stats.percentUsed >= 75) return 'stroke-orange-500';
    if (stats.percentUsed >= 50) return 'stroke-amber-500';
    return 'stroke-emerald-500';
  };

  const getStatusBadge = () => {
    if (stats.exceeded) {
      return (
        <Badge variant="destructive" className="animate-pulse gap-1">
          <Lock className="h-3 w-3" />
          BLOQUÉ
        </Badge>
      );
    }
    if (stats.percentUsed >= 90) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-500 gap-1">
          <AlertTriangle className="h-3 w-3" />
          CRITIQUE
        </Badge>
      );
    }
    if (stats.percentUsed >= 75) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500 gap-1">
          <TrendingUp className="h-3 w-3" />
          ÉLEVÉ
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-emerald-500 text-emerald-500 gap-1">
        <Shield className="h-3 w-3" />
        OK
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 transition-colors",
      stats.exceeded ? "border-destructive/50 bg-destructive/5" : 
      stats.percentUsed >= 90 ? "border-red-500/50 bg-red-500/5" :
      stats.percentUsed >= 75 ? "border-orange-500/50 bg-orange-500/5" :
      "border-primary/20"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Budget Level 1
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-4">
        {/* Circular Gauge */}
        <div className="relative mb-4">
          <svg 
            width={size} 
            height={size} 
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />
            {/* Progress arc */}
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
                getStrokeColor()
              )}
            />
            {/* Threshold markers */}
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
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              'text-3xl font-bold tabular-nums',
              getColor()
            )}>
              {stats.percentUsed.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground">utilisé</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="w-full grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/30">
            <p className={cn(
              "text-sm font-bold",
              stats.exceeded ? "text-destructive" : "text-emerald-500"
            )}>
              {stats.remaining.toLocaleString('fr-MA')}
            </p>
            <p className="text-[10px] text-muted-foreground">MAD restant</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-sm font-bold text-foreground">
              {stats.spent.toLocaleString('fr-MA')}
            </p>
            <p className="text-[10px] text-muted-foreground">dépensé</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-sm font-bold text-foreground">
              {stats.daysRemaining}j
            </p>
            <p className="text-[10px] text-muted-foreground">restants</p>
          </div>
        </div>

        {/* Warning */}
        {stats.exceeded && (
          <div className="mt-3 w-full flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
            <Lock className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-[11px] text-destructive">
              <span className="font-bold">Plafond atteint.</span> Validation CEO requise.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
