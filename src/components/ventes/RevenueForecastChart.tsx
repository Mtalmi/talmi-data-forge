import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Target, Calendar } from 'lucide-react';
import { BonCommande, Devis } from '@/hooks/useSalesWorkflow';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RevenueForecastChartProps {
  bcList: BonCommande[];
  devisList: Devis[];
}

interface WeeklyForecast {
  week: string;
  weekStart: Date;
  confirmed: number;
  potential: number;
  total: number;
}

export function RevenueForecastChart({ bcList, devisList }: RevenueForecastChartProps) {
  const forecastData = useMemo<WeeklyForecast[]>(() => {
    const today = new Date();
    const weeks: WeeklyForecast[] = [];
    
    // Generate 6 weeks of forecast
    for (let i = 0; i < 6; i++) {
      const weekStart = startOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
      
      // Confirmed revenue: BC with delivery date in this week
      const confirmedRevenue = bcList
        .filter(bc => {
          if (!bc.date_livraison_souhaitee) return false;
          if (bc.statut === 'termine' || bc.statut === 'livre') return false;
          const deliveryDate = parseISO(bc.date_livraison_souhaitee);
          return isWithinInterval(deliveryDate, { start: weekStart, end: weekEnd });
        })
        .reduce((sum, bc) => sum + bc.total_ht, 0);
      
      // Potential revenue: pending devis (weighted by conversion probability)
      const CONVERSION_RATE = 0.35; // 35% conversion rate assumption
      const potentialRevenue = i === 0 ? 0 : devisList
        .filter(d => d.statut === 'en_attente')
        .reduce((sum, d) => sum + (d.total_ht * CONVERSION_RATE * (1 / (i + 1))), 0);
      
      weeks.push({
        week: format(weekStart, 'dd MMM', { locale: fr }),
        weekStart,
        confirmed: confirmedRevenue,
        potential: potentialRevenue,
        total: confirmedRevenue + potentialRevenue,
      });
    }
    
    return weeks;
  }, [bcList, devisList]);

  const totalConfirmed = forecastData.reduce((sum, w) => sum + w.confirmed, 0);
  const totalPotential = forecastData.reduce((sum, w) => sum + w.potential, 0);
  const totalForecast = totalConfirmed + totalPotential;

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
          <p className="font-medium">Semaine du {label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Confirmé:</span>
              <span className="font-medium">{payload[0]?.value?.toLocaleString()} DH</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/30" />
              <span>Potentiel:</span>
              <span className="font-medium">{payload[1]?.value?.toLocaleString()} DH</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Prévision de Revenus
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            6 semaines
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {formatValue(totalConfirmed)} DH
            </p>
            <p className="text-xs text-muted-foreground">Confirmé</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary/50">
              {formatValue(totalPotential)} DH
            </p>
            <p className="text-xs text-muted-foreground">Potentiel</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {formatValue(totalForecast)} DH
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Target className="h-3 w-3" />
              Prévision
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confirmedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="potentialGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={formatValue}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                x={forecastData[0]?.week} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="3 3"
                label={{ value: "Aujourd'hui", position: 'top', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="confirmed"
                stackId="1"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#confirmedGradient)"
              />
              <Area
                type="monotone"
                dataKey="potential"
                stackId="1"
                stroke="hsl(var(--primary))"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="url(#potentialGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary" />
            <span>Commandes confirmées</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary/40 border-t border-dashed border-primary" />
            <span>Potentiel (devis)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
