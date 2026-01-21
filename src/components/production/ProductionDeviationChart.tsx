import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface BonProduction {
  bl_id: string;
  formule_id: string;
  volume_m3: number;
  ciment_reel_kg: number;
  adjuvant_reel_l: number | null;
  eau_reel_l: number | null;
}

interface Formule {
  formule_id: string;
  designation: string;
  ciment_kg_m3: number;
  adjuvant_l_m3: number;
  eau_l_m3: number;
}

interface ProductionDeviationChartProps {
  bons: BonProduction[];
  formules: Formule[];
  className?: string;
}

export function ProductionDeviationChart({ bons, formules, className }: ProductionDeviationChartProps) {
  const chartData = useMemo(() => {
    return bons.slice(0, 8).map(bon => {
      const formule = formules.find(f => f.formule_id === bon.formule_id);
      if (!formule) return null;

      const theoreticalCiment = formule.ciment_kg_m3 * bon.volume_m3;
      const theoreticalAdjuvant = formule.adjuvant_l_m3 * bon.volume_m3;
      const theoreticalEau = formule.eau_l_m3 * bon.volume_m3;

      const cimentDeviation = theoreticalCiment > 0 
        ? ((bon.ciment_reel_kg - theoreticalCiment) / theoreticalCiment) * 100 
        : 0;
      const adjuvantDeviation = theoreticalAdjuvant > 0 && bon.adjuvant_reel_l
        ? ((bon.adjuvant_reel_l - theoreticalAdjuvant) / theoreticalAdjuvant) * 100 
        : 0;
      const eauDeviation = theoreticalEau > 0 && bon.eau_reel_l
        ? ((bon.eau_reel_l - theoreticalEau) / theoreticalEau) * 100 
        : 0;

      return {
        name: bon.bl_id.slice(-6),
        ciment: Number(cimentDeviation.toFixed(1)),
        adjuvant: Number(adjuvantDeviation.toFixed(1)),
        eau: Number(eauDeviation.toFixed(1)),
      };
    }).filter(Boolean);
  }, [bons, formules]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Écarts Consommation (% vs Théorique)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }} 
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              tickFormatter={(v) => `${v}%`}
              domain={[-10, 15]}
            />
            <Tooltip 
              formatter={(value: number) => [`${value}%`, '']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                fontSize: 12 
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <ReferenceLine y={5} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            <ReferenceLine y={-5} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Bar dataKey="ciment" name="Ciment" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            <Bar dataKey="adjuvant" name="Adjuvant" fill="hsl(var(--warning))" radius={[2, 2, 0, 0]} />
            <Bar dataKey="eau" name="Eau" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
