import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, RefreshCw, DollarSign, Fuel, Truck } from 'lucide-react';
import { format } from 'date-fns';

interface ProfitData {
  totalRevenue: number;
  materialCost: number;
  fuelCost: number;
  pumpFees: number;
  netProfit: number;
  profitMargin: number;
  lastUpdated: Date;
}

export function RealTimeProfitTicker() {
  const [data, setData] = useState<ProfitData>({
    totalRevenue: 0,
    materialCost: 0,
    fuelCost: 0,
    pumpFees: 0,
    netProfit: 0,
    profitMargin: 0,
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  const fetchProfitData = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch today's invoiced revenue
      const { data: invoices } = await supabase
        .from('factures')
        .select('total_ht, cur_reel, volume_m3')
        .gte('date_facture', today);

      // Fetch today's fuel costs from suivi_carburant
      const { data: fuel } = await supabase
        .from('suivi_carburant')
        .select('cout_total_dh')
        .gte('date_releve', today);

      // Fetch ALL today's expenses (not just transport/pump) for accurate profit calculation
      const { data: allDepenses } = await supabase
        .from('depenses')
        .select('montant, categorie')
        .gte('date_depense', today);

      // Also fetch expenses_controlled for real-time expense tracking
      const { data: controlledExpenses } = await supabase
        .from('expenses_controlled')
        .select('montant_ttc, statut')
        .gte('created_at', `${today}T00:00:00`)
        .in('statut', ['approuve', 'paye']);

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_ht || 0), 0) || 0;
      const materialCost = invoices?.reduce((sum, inv) => sum + ((inv.cur_reel || 0) * (inv.volume_m3 || 0)), 0) || 0;
      const fuelCost = fuel?.reduce((sum, f) => sum + (f.cout_total_dh || 0), 0) || 0;
      
      // Calculate total expenses from both tables
      const depensesTotal = allDepenses?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0;
      const controlledTotal = controlledExpenses?.reduce((sum, e) => sum + (e.montant_ttc || 0), 0) || 0;
      const totalExpenses = depensesTotal + controlledTotal;
      
      // Pump fees (subset for display)
      const pumpFees = allDepenses?.filter(d => 
        ['Transport', 'Pompage', 'Prestataires'].includes(d.categorie)
      ).reduce((sum, d) => sum + (d.montant || 0), 0) || 0;
      
      // Net Profit = CA - Material Costs - Fuel - ALL Expenses
      const netProfit = totalRevenue - materialCost - fuelCost - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setData({
        totalRevenue,
        materialCost,
        fuelCost,
        pumpFees: totalExpenses, // Show total expenses in the "Pompe" card
        netProfit,
        profitMargin,
        lastUpdated: new Date(),
      });
      
      // Trigger animation
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1000);
    } catch (error) {
      console.error('Error fetching profit data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfitData();
    // Auto-refresh every minute
    const interval = setInterval(fetchProfitData, 60000);
    return () => clearInterval(interval);
  }, [fetchProfitData]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M DH`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K DH`;
    }
    return `${value.toFixed(0)} DH`;
  };

  const getProfitTrend = () => {
    if (data.netProfit > 0) return { icon: TrendingUp, color: 'text-success', bg: 'from-success/20' };
    if (data.netProfit < 0) return { icon: TrendingDown, color: 'text-destructive', bg: 'from-destructive/20' };
    return { icon: Minus, color: 'text-muted-foreground', bg: 'from-muted/20' };
  };

  const trend = getProfitTrend();

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-500",
      data.netProfit > 0 ? "border-success/30" : data.netProfit < 0 ? "border-destructive/30" : "border-border/50",
      animating && "ring-2 ring-primary/50"
    )}>
      {/* Animated gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r to-transparent opacity-30",
        trend.bg
      )} />
      
      <CardContent className="relative pt-4 pb-3">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Main Profit Display */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Profit Net Live
              </span>
              <RefreshCw className={cn(
                "h-3 w-3 text-muted-foreground/50",
                loading && "animate-spin"
              )} />
            </div>
            <div className="flex items-baseline gap-3">
              <span className={cn(
                "text-2xl sm:text-3xl font-bold tabular-nums tracking-tight transition-all",
                trend.color,
                animating && "scale-105"
              )}>
                {formatCurrency(data.netProfit)}
              </span>
              <div className="flex items-center gap-1">
                <trend.icon className={cn("h-5 w-5", trend.color)} />
                <span className={cn("text-sm font-semibold", trend.color)}>
                  {data.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Mini-Cards - Horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 sm:overflow-visible">
            <div className="p-2 rounded-lg bg-muted/30 border border-border/30 min-w-[70px] sm:min-w-[80px] flex-shrink-0">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-success" />
                <span className="text-[10px] text-muted-foreground">CA</span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-success">
                {formatCurrency(data.totalRevenue)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border/30 min-w-[70px] sm:min-w-[80px] flex-shrink-0">
              <div className="flex items-center gap-1 mb-1">
                <Fuel className="h-3 w-3 text-warning" />
                <span className="text-[10px] text-muted-foreground">Fuel</span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-warning">
                -{formatCurrency(data.fuelCost)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border/30 min-w-[70px] sm:min-w-[80px] flex-shrink-0">
              <div className="flex items-center gap-1 mb-1">
                <Truck className="h-3 w-3 text-orange-500" />
                <span className="text-[10px] text-muted-foreground">Pompe</span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-orange-500">
                -{formatCurrency(data.pumpFees)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Last Updated */}
        <div className="absolute bottom-1 right-3">
          <span className="text-[10px] text-muted-foreground/50">
            {format(data.lastUpdated, 'HH:mm')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
