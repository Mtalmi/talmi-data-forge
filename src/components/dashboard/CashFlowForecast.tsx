import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Wallet,
  Calendar,
  AlertTriangle,
  Banknote,
  Users,
  Truck,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface DailyForecast {
  date: string;
  dateLabel: string;
  projectedBalance: number;
  inflow: number;
  outflow: number;
  confidence: number;
  isWeekend: boolean;
}

interface RecurringPayment {
  type: 'salary' | 'supplier' | 'rent' | 'other';
  label: string;
  amount: number;
  dayOfMonth: number;
  frequency: 'monthly' | 'weekly';
}

interface CashFlowSummary {
  currentBalance: number;
  projectedEndBalance: number;
  totalInflow: number;
  totalOutflow: number;
  lowestPoint: number;
  lowestPointDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Known recurring payments (configurable)
const RECURRING_PAYMENTS: RecurringPayment[] = [
  { type: 'salary', label: 'Salaires', amount: 85000, dayOfMonth: 25, frequency: 'monthly' },
  { type: 'supplier', label: 'Fournisseur Ciment', amount: 120000, dayOfMonth: 5, frequency: 'monthly' },
  { type: 'supplier', label: 'Fournisseur Agrégats', amount: 45000, dayOfMonth: 10, frequency: 'monthly' },
  { type: 'rent', label: 'Loyer & Charges', amount: 15000, dayOfMonth: 1, frequency: 'monthly' },
  { type: 'other', label: 'Assurances', amount: 8000, dayOfMonth: 15, frequency: 'monthly' },
];

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  salary: <Users className="h-3 w-3" />,
  supplier: <Package className="h-3 w-3" />,
  rent: <Banknote className="h-3 w-3" />,
  other: <Wallet className="h-3 w-3" />,
};

export function CashFlowForecast() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [historicalData, setHistoricalData] = useState<{ date: string; balance: number }[]>([]);

  const fetchCashFlowData = useCallback(async () => {
    try {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      const thirtyDaysFromNow = addDays(today, 30);

      // Fetch historical revenue (last 30 days)
      const { data: factures, error: facturesError } = await supabase
        .from('factures')
        .select('date_facture, total_ht')
        .gte('date_facture', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .lte('date_facture', format(today, 'yyyy-MM-dd'));

      if (facturesError) throw facturesError;

      // Fetch historical expenses (last 30 days)
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses')
        .select('date_depense, montant')
        .gte('date_depense', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .lte('date_depense', format(today, 'yyyy-MM-dd'));

      if (depensesError) throw depensesError;

      // Fetch controlled expenses
      const { data: expensesControlled } = await supabase
        .from('expenses_controlled')
        .select('requested_at, montant_ttc, statut')
        .in('statut', ['approuve', 'paye'])
        .gte('requested_at', format(thirtyDaysAgo, 'yyyy-MM-dd'));

      // Calculate daily averages from historical data
      const dailyRevenue = new Map<string, number>();
      const dailyExpenses = new Map<string, number>();

      (factures || []).forEach(f => {
        const date = f.date_facture;
        dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + (f.total_ht || 0));
      });

      (depenses || []).forEach(d => {
        const date = d.date_depense;
        dailyExpenses.set(date, (dailyExpenses.get(date) || 0) + (d.montant || 0));
      });

      (expensesControlled || []).forEach(e => {
        const date = e.requested_at.split('T')[0];
        dailyExpenses.set(date, (dailyExpenses.get(date) || 0) + (e.montant_ttc || 0));
      });

      // Calculate averages for weekdays vs weekends
      let weekdayRevenueSum = 0, weekdayCount = 0;
      let weekendRevenueSum = 0, weekendCount = 0;

      dailyRevenue.forEach((amount, dateStr) => {
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendRevenueSum += amount;
          weekendCount++;
        } else {
          weekdayRevenueSum += amount;
          weekdayCount++;
        }
      });

      const avgWeekdayRevenue = weekdayCount > 0 ? weekdayRevenueSum / weekdayCount : 25000;
      const avgWeekendRevenue = weekendCount > 0 ? weekendRevenueSum / weekendCount : 5000;
      const avgDailyExpense = dailyExpenses.size > 0 
        ? Array.from(dailyExpenses.values()).reduce((a, b) => a + b, 0) / dailyExpenses.size 
        : 15000;

      // Estimate current balance (simplified - in reality this would come from bank integration)
      const totalRevenue = Array.from(dailyRevenue.values()).reduce((a, b) => a + b, 0);
      const totalExpense = Array.from(dailyExpenses.values()).reduce((a, b) => a + b, 0);
      const estimatedCurrentBalance = 500000 + totalRevenue - totalExpense; // Base + net flow

      // Generate 30-day forecast
      const days = eachDayOfInterval({ start: today, end: thirtyDaysFromNow });
      let runningBalance = estimatedCurrentBalance;
      const forecastData: DailyForecast[] = [];

      days.forEach((day, index) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayOfWeek = day.getDay();
        const dayOfMonth = day.getDate();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Calculate expected inflow
        let inflow = isWeekend ? avgWeekendRevenue : avgWeekdayRevenue;
        
        // Add some variation based on day of month (end of month typically higher)
        if (dayOfMonth >= 25) inflow *= 1.2;
        if (dayOfMonth <= 5) inflow *= 0.8;

        // Calculate expected outflow
        let outflow = avgDailyExpense * (isWeekend ? 0.3 : 1);

        // Add recurring payments
        RECURRING_PAYMENTS.forEach(payment => {
          if (payment.dayOfMonth === dayOfMonth) {
            outflow += payment.amount;
          }
        });

        runningBalance = runningBalance + inflow - outflow;

        // Confidence decreases as we go further into the future
        const confidence = Math.max(30, 95 - (index * 2));

        forecastData.push({
          date: dateStr,
          dateLabel: format(day, 'dd MMM', { locale: fr }),
          projectedBalance: Math.round(runningBalance),
          inflow: Math.round(inflow),
          outflow: Math.round(outflow),
          confidence,
          isWeekend,
        });
      });

      setForecast(forecastData);

      // Calculate summary
      const lowestPoint = Math.min(...forecastData.map(f => f.projectedBalance));
      const lowestPointEntry = forecastData.find(f => f.projectedBalance === lowestPoint);
      const finalBalance = forecastData[forecastData.length - 1]?.projectedBalance || 0;

      let riskLevel: CashFlowSummary['riskLevel'] = 'low';
      if (lowestPoint < 50000) riskLevel = 'critical';
      else if (lowestPoint < 150000) riskLevel = 'high';
      else if (lowestPoint < 300000) riskLevel = 'medium';

      setSummary({
        currentBalance: Math.round(estimatedCurrentBalance),
        projectedEndBalance: finalBalance,
        totalInflow: forecastData.reduce((s, f) => s + f.inflow, 0),
        totalOutflow: forecastData.reduce((s, f) => s + f.outflow, 0),
        lowestPoint,
        lowestPointDate: lowestPointEntry?.dateLabel || '',
        riskLevel,
      });

      // Historical balance trend (for context)
      const historical: { date: string; balance: number }[] = [];
      let histBalance = estimatedCurrentBalance - (totalRevenue - totalExpense);
      
      eachDayOfInterval({ start: thirtyDaysAgo, end: subDays(today, 1) }).forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const rev = dailyRevenue.get(dateStr) || 0;
        const exp = dailyExpenses.get(dateStr) || 0;
        histBalance += rev - exp;
        historical.push({
          date: format(day, 'dd MMM', { locale: fr }),
          balance: Math.round(histBalance),
        });
      });

      setHistoricalData(historical);

    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      toast.error('Erreur chargement prévisions');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCashFlowData();
    setRefreshing(false);
    toast.success('Prévisions actualisées');
  };

  useEffect(() => {
    fetchCashFlowData();
  }, [fetchCashFlowData]);

  const chartConfig = useMemo(() => ({
    balance: {
      label: "Solde",
      color: "hsl(var(--primary))",
    },
    inflow: {
      label: "Entrées",
      color: "hsl(var(--success))",
    },
    outflow: {
      label: "Sorties",
      color: "hsl(var(--destructive))",
    },
  }), []);

  const riskColors = {
    low: 'bg-success/20 text-success border-success/30',
    medium: 'bg-warning/20 text-warning border-warning/30',
    high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    critical: 'bg-destructive/20 text-destructive border-destructive/30 animate-pulse',
  };

  const riskLabels = {
    low: 'Sain',
    medium: 'Attention',
    high: 'Risque',
    critical: 'Critique',
  };

  // Upcoming payments in next 7 days
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    const payments: { date: string; label: string; amount: number; type: string }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const checkDay = addDays(today, i);
      const dayOfMonth = checkDay.getDate();
      
      RECURRING_PAYMENTS.forEach(p => {
        if (p.dayOfMonth === dayOfMonth) {
          payments.push({
            date: format(checkDay, 'dd MMM', { locale: fr }),
            label: p.label,
            amount: p.amount,
            type: p.type,
          });
        }
      });
    }
    
    return payments;
  }, []);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-success/20 border border-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Cash-Flow Time Machine
                {summary && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', riskColors[summary.riskLevel])}
                  >
                    {riskLabels[summary.riskLevel]}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Prévisions 30 jours
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Solde Actuel</p>
                  <p className="text-lg font-bold font-mono">
                    {(summary.currentBalance / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border",
                  summary.projectedEndBalance >= summary.currentBalance 
                    ? "bg-success/10 border-success/20" 
                    : "bg-warning/10 border-warning/20"
                )}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fin de Mois</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-bold font-mono">
                      {(summary.projectedEndBalance / 1000).toFixed(0)}K
                    </p>
                    {summary.projectedEndBalance >= summary.currentBalance ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-warning" />
                    )}
                  </div>
                </div>
                <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entrées Prévues</p>
                  <p className="text-lg font-bold font-mono text-success">
                    +{(summary.totalInflow / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sorties Prévues</p>
                  <p className="text-lg font-bold font-mono text-destructive">
                    -{(summary.totalOutflow / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            )}

            {/* Lowest Point Warning */}
            {summary && summary.riskLevel !== 'low' && (
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                riskColors[summary.riskLevel]
              )}>
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs">
                  Point bas prévu: <strong>{(summary.lowestPoint / 1000).toFixed(0)}K MAD</strong> le {summary.lowestPointDate}
                </p>
              </div>
            )}

            {/* Forecast Chart */}
            <Tabs defaultValue="balance" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="balance" className="text-xs">Solde Projeté</TabsTrigger>
                <TabsTrigger value="flow" className="text-xs">Flux Quotidien</TabsTrigger>
              </TabsList>

              <TabsContent value="balance" className="mt-2">
                <ChartContainer config={chartConfig} className="h-[160px] w-full">
                  <AreaChart data={forecast}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      dataKey="dateLabel" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      width={40}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${(value / 1000).toFixed(1)}K MAD`, 'Solde']}
                    />
                    {summary && (
                      <ReferenceLine 
                        y={150000} 
                        stroke="hsl(var(--warning))" 
                        strokeDasharray="5 5"
                        label={{ value: 'Seuil Min', fontSize: 10, fill: 'hsl(var(--warning))' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="projectedBalance"
                      stroke="hsl(var(--primary))"
                      fill="url(#balanceGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="flow" className="mt-2">
                <ChartContainer config={chartConfig} className="h-[160px] w-full">
                  <LineChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      dataKey="dateLabel" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      width={40}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="inflow"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={false}
                      name="Entrées"
                    />
                    <Line
                      type="monotone"
                      dataKey="outflow"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                      name="Sorties"
                    />
                  </LineChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>

            {/* Upcoming Payments */}
            {upcomingPayments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Échéances 7 Jours
                </h4>
                <div className="space-y-1.5">
                  {upcomingPayments.map((payment, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center">
                          {PAYMENT_ICONS[payment.type]}
                        </div>
                        <div>
                          <span className="text-xs font-medium">{payment.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">
                            {payment.date}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-destructive font-semibold">
                        -{(payment.amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
