import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw,
  Lock,
  Shield,
  CircleDollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { InfoTooltip } from '@/components/academy/InfoTooltip';

interface BudgetStats {
  spent: number;
  cap: number;
  remaining: number;
  percentUsed: number;
  exceeded: boolean;
  daysRemaining: number;
}

export function MonthlyBudgetGauge() {
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
      
      // Get monthly cap data
      const { data: capData } = await supabase
        .from('monthly_expense_caps')
        .select('level1_spent, level1_cap, cap_exceeded')
        .eq('month_year', monthYear)
        .single();

      const spent = capData?.level1_spent || 0;
      const cap = capData?.level1_cap || 15000;
      const exceeded = capData?.cap_exceeded || false;
      
      // Calculate days remaining in month
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

    // Realtime subscription
    const channel = supabase
      .channel('budget_gauge')
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

  // Determine color based on usage
  const getGaugeColor = () => {
    if (stats.exceeded || stats.percentUsed >= 100) return 'bg-destructive';
    if (stats.percentUsed >= 90) return 'bg-red-500';
    if (stats.percentUsed >= 75) return 'bg-orange-500';
    if (stats.percentUsed >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusBadge = () => {
    if (stats.exceeded) {
      return (
        <Badge variant="destructive" className="animate-pulse gap-1">
          <Lock className="h-3 w-3" />
          PLAFOND ATTEINT
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
        NORMAL
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
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
            Budget Mensuel Level 1
            <InfoTooltip
              id="budget-gauge-help"
              title="Plafond Mensuel"
              content="Le plafond Level 1 (15 000 MAD/mois) limite les dépenses auto-approuvées. Une fois atteint, toutes les dépenses requièrent l'approbation CEO."
              videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              steps={[
                "Surveillez la jauge de consommation",
                "Vert = Normal, Orange = Attention, Rouge = Critique",
                "Au-delà de 100%, le plafond est verrouillé",
                "Seul le CEO peut alors approuver les dépenses"
              ]}
              position="bottom"
            />
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
      <CardContent className="space-y-4">
        {/* Main Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium text-muted-foreground">Consommé</span>
            <span className="font-bold">
              {stats.spent.toLocaleString('fr-MA')} / {stats.cap.toLocaleString('fr-MA')} MAD
            </span>
          </div>
          <div className="relative h-4 sm:h-5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                getGaugeColor()
              )}
              style={{ width: `${Math.min(100, stats.percentUsed)}%` }}
            />
            {/* Threshold markers */}
            <div className="absolute inset-0 flex">
              <div className="w-[50%] border-r border-white/20" />
              <div className="w-[25%] border-r border-white/20" />
              <div className="w-[15%] border-r border-white/30" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span>50%</span>
            <span>75%</span>
            <span>90%</span>
            <span>15K</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Remaining */}
          <div className={cn(
            "p-2 sm:p-3 rounded-lg text-center",
            stats.exceeded ? "bg-destructive/10" : "bg-emerald-500/10"
          )}>
            <CircleDollarSign className={cn(
              "h-4 w-4 mx-auto mb-1",
              stats.exceeded ? "text-destructive" : "text-emerald-500"
            )} />
            <p className={cn(
              "text-base sm:text-lg font-bold",
              stats.exceeded ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {stats.remaining.toLocaleString('fr-MA')}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">MAD restant</p>
          </div>

          {/* Percentage */}
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-base sm:text-lg font-bold text-foreground">
              {stats.percentUsed.toFixed(0)}%
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">utilisé</p>
          </div>

          {/* Days Remaining */}
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-base sm:text-lg font-bold text-foreground">
              {stats.daysRemaining}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">jours restants</p>
          </div>
        </div>

        {/* Warning Message */}
        {stats.exceeded && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <Lock className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-xs sm:text-sm text-destructive">
              <span className="font-bold">Plafond atteint.</span> Toutes les dépenses Level 1 requièrent désormais l'approbation de Karim.
            </p>
          </div>
        )}

        {stats.percentUsed >= 90 && !stats.exceeded && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">
              <span className="font-bold">Attention:</span> Seulement {stats.remaining.toLocaleString('fr-MA')} MAD disponibles avant blocage automatique.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
