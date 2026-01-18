import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreditScoreSnapshot, ClientTrend } from '@/hooks/useCreditScoreHistory';

interface CreditScoreHistoryChartProps {
  clientTrend: ClientTrend;
  compact?: boolean;
}

const TREND_CONFIG = {
  improving: { label: 'En Amélioration', color: 'text-green-600', bgColor: 'bg-green-100', icon: TrendingUp },
  stable: { label: 'Stable', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Minus },
  declining: { label: 'En Déclin', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: TrendingDown },
  critical: { label: 'Critique', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
};

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
};

export default function CreditScoreHistoryChart({ clientTrend, compact = false }: CreditScoreHistoryChartProps) {
  const trendConfig = TREND_CONFIG[clientTrend.trend];
  const TrendIcon = trendConfig.icon;

  const chartData = useMemo(() => {
    return clientTrend.history.map(snapshot => ({
      date: format(new Date(snapshot.snapshot_date), 'dd/MM', { locale: fr }),
      fullDate: format(new Date(snapshot.snapshot_date), 'dd MMM yyyy', { locale: fr }),
      score: Number(snapshot.score),
      grade: snapshot.grade,
      paymentHistory: Number(snapshot.payment_history_score) || 0,
      delayFrequency: Number(snapshot.delay_frequency_score) || 0,
      balanceTrend: Number(snapshot.balance_trend_score) || 0,
    }));
  }, [clientTrend.history]);

  const latestSnapshot = clientTrend.history[clientTrend.history.length - 1];
  const gradeColor = latestSnapshot ? GRADE_COLORS[latestSnapshot.grade] : '#6b7280';

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{clientTrend.client_nom}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: gradeColor, color: gradeColor }}
            >
              {latestSnapshot?.grade || '-'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {clientTrend.current_score.toFixed(0)}pts
            </span>
            <span className={`text-xs flex items-center gap-1 ${trendConfig.color}`}>
              <TrendIcon className="h-3 w-3" />
              {clientTrend.score_change > 0 ? '+' : ''}{clientTrend.score_change.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="w-24 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${clientTrend.client_id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradeColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={gradeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke={gradeColor} 
                strokeWidth={1.5}
                fill={`url(#gradient-${clientTrend.client_id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{clientTrend.client_nom}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Historique sur {clientTrend.history.length} point(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-lg px-3 py-1"
              style={{ borderColor: gradeColor, color: gradeColor }}
            >
              {latestSnapshot?.grade || '-'}
            </Badge>
            <Badge className={`${trendConfig.bgColor} ${trendConfig.color}`}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {trendConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Score Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold" style={{ color: gradeColor }}>
              {clientTrend.current_score.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Score Actuel</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className={`text-xl font-semibold ${
              clientTrend.score_change > 0 ? 'text-green-600' : 
              clientTrend.score_change < 0 ? 'text-red-600' : 'text-muted-foreground'
            }`}>
              {clientTrend.score_change > 0 ? '+' : ''}{clientTrend.score_change.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Variation</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xl font-semibold">
              {latestSnapshot?.total_outstanding?.toLocaleString('fr-MA') || 0}
            </p>
            <p className="text-xs text-muted-foreground">Encours (DH)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xl font-semibold text-red-600">
              {latestSnapshot?.total_overdue?.toLocaleString('fr-MA') || 0}
            </p>
            <p className="text-xs text-muted-foreground">Retard (DH)</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.fullDate}</p>
                        <p className="text-lg font-bold" style={{ color: GRADE_COLORS[data.grade] }}>
                          Score: {data.score.toFixed(1)} ({data.grade})
                        </p>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <p>Historique paiement: {data.paymentHistory.toFixed(0)}</p>
                          <p>Fréquence retards: {data.delayFrequency.toFixed(0)}</p>
                          <p>Tendance solde: {data.balanceTrend.toFixed(0)}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" />
              <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke={gradeColor}
                strokeWidth={2}
                dot={{ fill: gradeColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Factor Breakdown */}
        {latestSnapshot && (
          <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
            {[
              { label: 'Paiements', value: latestSnapshot.payment_history_score, weight: '35%' },
              { label: 'Retards', value: latestSnapshot.delay_frequency_score, weight: '30%' },
              { label: 'Solde', value: latestSnapshot.balance_trend_score, weight: '20%' },
              { label: 'Ancienneté', value: latestSnapshot.account_age_score, weight: '10%' },
              { label: 'Utilisation', value: latestSnapshot.credit_utilization_score, weight: '5%' },
            ].map(factor => (
              <div key={factor.label} className="text-center p-2 rounded bg-muted/30">
                <p className="font-medium">{Number(factor.value || 0).toFixed(0)}</p>
                <p className="text-muted-foreground">{factor.label}</p>
                <p className="text-muted-foreground/70">{factor.weight}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
