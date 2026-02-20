import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Trophy, Target, CheckCircle2, XCircle } from 'lucide-react';
import { BonCommande, Devis } from '@/hooks/useSalesWorkflow';
import { useCountUp } from '@/hooks/useCountUp';

interface SalesPerformanceChartsProps {
  bcList: BonCommande[];
  devisList: Devis[];
}

/* ───── Palette tokens ───── */
const GOLD = 'hsl(51 100% 50%)';
const GOLD_SOFT = 'hsl(51 100% 50% / 0.7)';
const SUCCESS = 'hsl(var(--success))';
const DESTRUCTIVE = 'hsl(var(--destructive))';
const ACCENT_TEAL = 'hsl(var(--accent-teal))';
const WARNING = 'hsl(var(--warning))';
const INFO = 'hsl(220 90% 60%)';

const PRODUCT_COLORS = [GOLD, INFO, ACCENT_TEAL, WARNING, SUCCESS, GOLD_SOFT];

/* ───── Custom Tooltip ───── */
const GoldTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border shadow-xl p-3 text-xs space-y-1"
      style={{
        background: 'hsl(var(--card))',
        borderColor: 'hsl(var(--primary)/0.3)',
        boxShadow: '0 8px 32px hsl(var(--primary)/0.15)',
      }}
    >
      {label && <p className="font-bold text-foreground mb-2">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color || entry.fill }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold ml-auto" style={{ fontFamily: 'JetBrains Mono, monospace', color: entry.color || entry.fill }}>
            {typeof entry.value === 'number'
              ? entry.value >= 1000
                ? `${(entry.value / 1000).toFixed(1)}K DH`
                : `${entry.value}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ───── Animated stat chip ───── */
function StatChip({ value, label, color, prefix = '', suffix = '' }: { value: number; label: string; color: string; prefix?: string; suffix?: string }) {
  const animated = useCountUp(Math.round(value), 1200);
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <p className="text-xl font-black tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color }}>
        {prefix}{animated >= 1000 ? `${(animated / 1000).toFixed(1)}K` : animated}{suffix}
      </p>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

export function SalesPerformanceCharts({ bcList, devisList }: SalesPerformanceChartsProps) {
  /* ── Sales by product (formule) ── */
  const productData = useMemo(() => {
    const map = new Map<string, number>();
    bcList.forEach(bc => {
      const key = bc.formule?.designation || bc.formule_id || 'Autre';
      map.set(key, (map.get(key) || 0) + bc.total_ht);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bcList]);

  const totalProductRevenue = productData.reduce((s, d) => s + d.value, 0);

  /* ── Win / Loss analysis ── */
  const winLossData = useMemo(() => {
    const won = devisList.filter(d => d.statut === 'converti' || d.statut === 'accepte').length;
    const lost = devisList.filter(d => d.statut === 'refuse' || d.statut === 'expire').length;
    const pending = devisList.filter(d => d.statut === 'en_attente').length;
    return { won, lost, pending, total: won + lost + pending };
  }, [devisList]);

  const winRate = winLossData.total > 0
    ? Math.round((winLossData.won / (winLossData.won + winLossData.lost || 1)) * 100)
    : 0;

  const winLossPie = [
    { name: 'Gagnés', value: winLossData.won, color: SUCCESS },
    { name: 'Perdus', value: winLossData.lost, color: DESTRUCTIVE },
    { name: 'En cours', value: winLossData.pending, color: WARNING },
  ].filter(d => d.value > 0);

  /* ── Revenue by BC status (bar chart) ── */
  const statusRevenueData = useMemo(() => {
    const map: Record<string, number> = {};
    bcList.forEach(bc => {
      const label =
        bc.statut === 'pret_production' ? 'Validé'
        : bc.statut === 'en_production' ? 'Production'
        : bc.statut === 'termine' || bc.statut === 'livre' ? 'Livré'
        : 'Autre';
      map[label] = (map[label] || 0) + bc.total_ht;
    });
    const order = ['Validé', 'Production', 'Livré', 'Autre'];
    return order.filter(k => map[k]).map(k => ({ name: k, value: map[k] }));
  }, [bcList]);

  const statusColors: Record<string, string> = {
    Validé: INFO,
    Production: ACCENT_TEAL,
    Livré: SUCCESS,
    Autre: 'hsl(var(--muted-foreground))',
  };

  const hasAnyData = bcList.length > 0 || devisList.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Revenue by Product ── */}
      <Card
        className="lg:col-span-1 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--primary)/0.02) 100%)',
          borderColor: 'hsl(var(--primary)/0.15)',
        }}
      >
        <CardHeader className="pb-3 pt-4" style={{ borderBottom: '1px solid hsl(var(--border)/0.4)' }}>
          <CardTitle className="text-sm font-bold uppercase tracking-[0.08em] flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'hsl(var(--primary)/0.12)' }}>
              <Trophy className="h-3.5 w-3.5" style={{ color: GOLD }} />
            </div>
            CA par Formule
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {productData.length > 0 ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={900}
                    >
                      {productData.map((_, i) => (
                        <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    {/* Center label */}
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                      fill={GOLD} style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 13 }}>
                      {totalProductRevenue >= 1000
                        ? `${(totalProductRevenue / 1000).toFixed(0)}K`
                        : totalProductRevenue.toFixed(0)}
                    </text>
                    <text x="50%" y="50%" dy={14} textAnchor="middle" dominantBaseline="middle"
                      fill="hsl(var(--muted-foreground))" style={{ fontSize: 8 }}>
                      DH Total
                    </text>
                    <Tooltip content={<GoldTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="space-y-1.5">
                {productData.map((d, i) => {
                  const pct = totalProductRevenue > 0 ? Math.round((d.value / totalProductRevenue) * 100) : 0;
                  const color = PRODUCT_COLORS[i % PRODUCT_COLORS.length];
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[10px] text-muted-foreground flex-1 truncate">{d.name}</span>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Trophy className="h-8 w-8 opacity-20" />
              <p className="text-xs">Aucune commande enregistrée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Revenue by Status (bar) ── */}
      <Card
        className="lg:col-span-1 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--primary)/0.02) 100%)',
          borderColor: 'hsl(var(--primary)/0.15)',
        }}
      >
        <CardHeader className="pb-3 pt-4" style={{ borderBottom: '1px solid hsl(var(--border)/0.4)' }}>
          <CardTitle className="text-sm font-bold uppercase tracking-[0.08em] flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'hsl(var(--primary)/0.12)' }}>
              <Target className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            Pipeline par Statut
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {statusRevenueData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusRevenueData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    {Object.entries(statusColors).map(([key, color]) => (
                      <linearGradient key={key} id={`barGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GoldTooltip />} />
                  <Bar dataKey="value" name="CA" radius={[6, 6, 0, 0]} animationDuration={900}>
                    {statusRevenueData.map((entry, i) => (
                      <Cell key={i} fill={`url(#barGrad-${entry.name})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Target className="h-8 w-8 opacity-20" />
              <p className="text-xs">Aucune donnée disponible</p>
            </div>
          )}
          {statusRevenueData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {statusRevenueData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: statusColors[d.name] }} />
                  <span className="text-[10px] text-muted-foreground">{d.name}</span>
                  <span className="text-[10px] font-bold ml-auto tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace', color: statusColors[d.name] }}>
                    {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value} DH
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Win / Loss Analysis ── */}
      <Card
        className="lg:col-span-1 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--primary)/0.02) 100%)',
          borderColor: 'hsl(var(--primary)/0.15)',
        }}
      >
        <CardHeader className="pb-3 pt-4" style={{ borderBottom: '1px solid hsl(var(--border)/0.4)' }}>
          <CardTitle className="text-sm font-bold uppercase tracking-[0.08em] flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'hsl(var(--primary)/0.12)' }}>
              <TrendingUp className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            Analyse Devis
            <Badge
              className="ml-auto text-[10px] font-bold"
              style={{
                background: winRate >= 50 ? 'hsl(var(--success)/0.12)' : 'hsl(var(--destructive)/0.12)',
                color: winRate >= 50 ? SUCCESS : DESTRUCTIVE,
                border: `1px solid ${winRate >= 50 ? 'hsl(var(--success)/0.25)' : 'hsl(var(--destructive)/0.25)'}`,
              }}
            >
              {winRate}% taux
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-2">
            <StatChip value={winLossData.won} label="Gagnés" color={SUCCESS} />
            <StatChip value={winLossData.lost} label="Perdus" color={DESTRUCTIVE} />
            <StatChip value={winLossData.pending} label="En cours" color={WARNING} />
          </div>

          {/* Pie chart */}
          {winLossPie.length > 0 ? (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossPie}
                    cx="50%"
                    cy="50%"
                    outerRadius={54}
                    paddingAngle={4}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={900}
                  >
                    {winLossPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<GoldTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    formatter={(val) => <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 opacity-20" />
              <p className="text-xs">Aucun devis enregistré</p>
            </div>
          )}

          {/* Win rate bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" style={{ color: SUCCESS }} />
                Gagnés
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" style={{ color: DESTRUCTIVE }} />
                Perdus
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: 'hsl(var(--muted))' }}>
              <div
                className="h-full transition-all duration-1000 rounded-l-full"
                style={{
                  width: `${winRate}%`,
                  background: `linear-gradient(90deg, ${SUCCESS}99, ${SUCCESS})`,
                  boxShadow: `0 0 8px ${SUCCESS}60`,
                }}
              />
              <div
                className="h-full transition-all duration-1000 rounded-r-full"
                style={{
                  width: `${100 - winRate}%`,
                  background: `linear-gradient(90deg, ${DESTRUCTIVE}99, ${DESTRUCTIVE})`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: SUCCESS }}>{winRate}%</span>
              <span style={{ color: DESTRUCTIVE }}>{100 - winRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
