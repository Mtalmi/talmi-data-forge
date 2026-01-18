import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Package,
  Calculator,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DailyStats {
  totalFacture: number;
  totalCoutReel: number;
  profitNet: number;
  nbFactures: number;
  nbLivraisons: number;
  volumeTotal: number;
  margeMoyenne: number;
}

export function DailyProfitSummary() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyStats = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch today's factures
      const { data: factures, error: factError } = await supabase
        .from('factures')
        .select('*')
        .eq('date_facture', today);

      if (factError) throw factError;

      // Fetch today's deliveries (including those not yet invoiced)
      const { data: deliveries, error: delError } = await supabase
        .from('bons_livraison_reels')
        .select('volume_m3, cur_reel, prix_vente_m3, marge_brute_pct, workflow_status')
        .eq('date_livraison', today)
        .in('workflow_status', ['livre', 'facture']);

      if (delError) throw delError;

      // Calculate stats
      const totalFacture = factures?.reduce((sum, f) => sum + (f.total_ht || 0), 0) || 0;
      const totalCoutReel = factures?.reduce((sum, f) => sum + ((f.cur_reel || 0) * (f.volume_m3 || 0)), 0) || 0;
      const profitNet = totalFacture - totalCoutReel;

      const volumeTotal = deliveries?.reduce((sum, d) => sum + (d.volume_m3 || 0), 0) || 0;
      
      const margePctValues = deliveries?.filter(d => d.marge_brute_pct !== null).map(d => d.marge_brute_pct) || [];
      const margeMoyenne = margePctValues.length > 0 
        ? margePctValues.reduce((sum, m) => sum + (m || 0), 0) / margePctValues.length 
        : 0;

      setStats({
        totalFacture,
        totalCoutReel,
        profitNet,
        nbFactures: factures?.length || 0,
        nbLivraisons: deliveries?.length || 0,
        volumeTotal,
        margeMoyenne,
      });
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyStats();
    // Refresh every minute
    const interval = setInterval(fetchDailyStats, 60000);
    return () => clearInterval(interval);
  }, [fetchDailyStats]);

  const isProfitPositive = stats && stats.profitNet > 0;
  const isMarginHealthy = stats && stats.margeMoyenne >= 20;

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Rapport de Clôture
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {format(new Date(), 'EEEE d MMMM', { locale: fr })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Profit Display */}
        <div className={cn(
          "p-4 rounded-xl text-center transition-colors",
          isProfitPositive 
            ? "bg-success/10 border-2 border-success/30" 
            : "bg-destructive/10 border-2 border-destructive/30"
        )}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Profit Net du Jour
          </p>
          <div className="flex items-center justify-center gap-2">
            {isProfitPositive ? (
              <TrendingUp className="h-8 w-8 text-success" />
            ) : (
              <TrendingDown className="h-8 w-8 text-destructive" />
            )}
            <span className={cn(
              "text-4xl font-bold font-mono tabular-nums",
              isProfitPositive ? "text-success" : "text-destructive"
            )}>
              {stats.profitNet >= 0 ? '+' : ''}{stats.profitNet.toLocaleString('fr-FR', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}
            </span>
            <span className={cn(
              "text-lg font-semibold",
              isProfitPositive ? "text-success" : "text-destructive"
            )}>
              DH
            </span>
          </div>
        </div>

        {/* Calculation Breakdown */}
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold font-mono">
              {stats.totalFacture.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">Facturé HT</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <Minus className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold font-mono">
              {stats.totalCoutReel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">Coût Réel</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <FileText className="h-3 w-3" />
              <span className="text-xs">Factures</span>
            </div>
            <p className="font-bold font-mono">{stats.nbFactures}</p>
          </div>

          <div className="text-center p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Package className="h-3 w-3" />
              <span className="text-xs">Volume</span>
            </div>
            <p className="font-bold font-mono">{stats.volumeTotal.toFixed(0)} m³</p>
          </div>

          <div className="text-center p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Marge Moy.</span>
            </div>
            <p className={cn(
              "font-bold font-mono",
              isMarginHealthy ? "text-success" : "text-destructive"
            )}>
              {stats.margeMoyenne.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* No Activity Message */}
        {stats.nbLivraisons === 0 && stats.nbFactures === 0 && (
          <div className="text-center text-muted-foreground text-sm py-2">
            Aucune activité enregistrée aujourd'hui
          </div>
        )}
      </CardContent>
    </Card>
  );
}
