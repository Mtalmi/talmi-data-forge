import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAnalyticsBI } from '@/hooks/useAnalyticsBI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Users, Truck,
  AlertTriangle, Target, RefreshCw, Shield, Flame, Activity,
  Loader2, Gauge, FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const RISK_COLORS = {
  low: 'text-emerald-500',
  medium: 'text-amber-500',
  high: 'text-orange-500',
  critical: 'text-destructive',
};
const RISK_BG = {
  low: 'bg-emerald-500/10 border-emerald-500/20',
  medium: 'bg-amber-500/10 border-amber-500/20',
  high: 'bg-orange-500/10 border-orange-500/20',
  critical: 'bg-destructive/10 border-destructive/20',
};
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(var(--destructive))'];

export default function AnalyticsBI() {
  const {
    loading, period, setPeriod, refresh,
    drivers, trucks, monthComparison,
    clientScores, materialCosts, formulaCosts,
  } = useAnalyticsBI();
  const [activeTab, setActiveTab] = useState('benchmark');

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const riskDistribution = [
    { name: 'Faible', value: clientScores.filter(c => c.risk_level === 'low').length, color: PIE_COLORS[1] },
    { name: 'Moyen', value: clientScores.filter(c => c.risk_level === 'medium').length, color: PIE_COLORS[2] },
    { name: 'Élevé', value: clientScores.filter(c => c.risk_level === 'high').length, color: PIE_COLORS[0] },
    { name: 'Critique', value: clientScores.filter(c => c.risk_level === 'critical').length, color: PIE_COLORS[3] },
  ].filter(r => r.value > 0);

  const totalLeakage = materialCosts.reduce((s, m) => s + Math.max(0, m.cost_impact_dh), 0);

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Activity className="h-7 w-7 text-primary" />
              Analytics & BI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Intelligence opérationnelle avancée</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v: '1m' | '3m' | '6m' | '12m') => setPeriod(v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 mois</SelectItem>
                <SelectItem value="3m">3 mois</SelectItem>
                <SelectItem value="6m">6 mois</SelectItem>
                <SelectItem value="12m">12 mois</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {monthComparison.slice(0, 4).map((comp, i) => (
            <motion.div key={comp.metric} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50">
                <CardContent className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">{comp.metric}</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-xl font-bold tabular-nums">
                      {comp.currentValue >= 1000000 ? `${(comp.currentValue / 1000000).toFixed(1)}M` : comp.currentValue >= 1000 ? `${(comp.currentValue / 1000).toFixed(0)}K` : comp.currentValue}
                    </span>
                    <span className={cn('text-xs font-semibold flex items-center gap-0.5 mb-0.5',
                      comp.trend === 'up' && comp.metric.includes('CUR') ? 'text-destructive' : comp.trend === 'up' ? 'text-emerald-500' : comp.trend === 'down' && comp.metric.includes('CUR') ? 'text-emerald-500' : comp.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {comp.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : comp.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {comp.changePct > 0 ? '+' : ''}{comp.changePct}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex">
              <TabsTrigger value="benchmark" className="gap-1.5 text-xs sm:text-sm">
                <Gauge className="h-3.5 w-3.5" /> Benchmarking
              </TabsTrigger>
              <TabsTrigger value="scoring" className="gap-1.5 text-xs sm:text-sm">
                <Shield className="h-3.5 w-3.5" /> Scoring Client
              </TabsTrigger>
              <TabsTrigger value="costs" className="gap-1.5 text-xs sm:text-sm">
                <FlaskConical className="h-3.5 w-3.5" /> Coûts Production
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* ═══ BENCHMARKING TAB ═══ */}
          <TabsContent value="benchmark" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Driver Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Performance Chauffeurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {drivers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée chauffeur</p>
                  ) : (
                    <div className="space-y-3">
                      {drivers.slice(0, 6).map((d, i) => (
                        <div key={d.chauffeur_nom} className="flex items-center gap-3">
                          <span className={cn('text-xs font-bold w-5 text-center', i === 0 ? 'text-primary' : 'text-muted-foreground')}>
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">{d.chauffeur_nom}</span>
                              <span className="text-xs text-muted-foreground">{d.total_livraisons} livr. · {d.total_volume}m³</span>
                            </div>
                            <Progress value={d.score} className="h-2" indicatorClassName={cn(d.score >= 70 ? 'bg-emerald-500' : d.score >= 40 ? 'bg-amber-500' : 'bg-destructive')} />
                          </div>
                          <Badge variant="outline" className="text-xs tabular-nums">{d.score}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Truck Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" /> Performance Camions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trucks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée camion</p>
                  ) : (
                    <div className="space-y-3">
                      {trucks.slice(0, 6).map((t, i) => (
                        <div key={t.camion_id} className="flex items-center gap-3">
                          <span className={cn('text-xs font-bold w-5 text-center', i === 0 ? 'text-primary' : 'text-muted-foreground')}>
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{t.camion_id}</span>
                              <span className="text-xs text-muted-foreground">{t.total_livraisons} livr. · {t.total_volume}m³</span>
                            </div>
                            <Progress value={t.score} className="h-2" indicatorClassName={cn(t.score >= 70 ? 'bg-emerald-500' : t.score >= 40 ? 'bg-amber-500' : 'bg-destructive')} />
                          </div>
                          <Badge variant="outline" className="text-xs tabular-nums">{t.score}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MoM Comparison Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comparaison Période vs Période Précédente</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v}`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="metric" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                    <Bar dataKey="previousValue" name="Période précédente" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="currentValue" name="Période actuelle" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ CLIENT SCORING TAB ═══ */}
          <TabsContent value="scoring" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Risk Distribution Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Distribution du Risque</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {riskDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Risk Clients */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Clients à Risque
                  </CardTitle>
                  <CardDescription className="text-xs">Scoring prédictif basé sur retards, crédit, et activité</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Client</TableHead>
                          <TableHead className="text-xs text-center">Score Risque</TableHead>
                          <TableHead className="text-xs text-center">Churn %</TableHead>
                          <TableHead className="text-xs text-right">Impayés</TableHead>
                          <TableHead className="text-xs">Facteurs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientScores.map(client => (
                          <TableRow key={client.client_id}>
                            <TableCell className="text-sm font-medium">{client.nom_client}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn('text-xs', RISK_BG[client.risk_level], RISK_COLORS[client.risk_level])}>
                                {client.risk_score}/100
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn('text-xs font-semibold', client.churn_probability > 60 ? 'text-destructive' : client.churn_probability > 30 ? 'text-amber-500' : 'text-muted-foreground')}>
                                {client.churn_probability}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {client.unpaid_amount > 0 ? `${(client.unpaid_amount / 1000).toFixed(0)}K` : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {client.factors.slice(0, 3).map(f => (
                                  <Badge key={f} variant="outline" className="text-[10px] px-1 py-0">{f}</Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ PRODUCTION COSTS TAB ═══ */}
          <TabsContent value="costs" className="space-y-4 mt-4">
            {/* Leakage Summary */}
            <Card className={cn('border', totalLeakage > 5000 ? 'border-destructive/30 bg-destructive/5' : 'border-border/50')}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', totalLeakage > 5000 ? 'bg-destructive/10' : 'bg-primary/10')}>
                  <Flame className={cn('h-6 w-6', totalLeakage > 5000 ? 'text-destructive' : 'text-primary')} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuite Matériau Estimée</p>
                  <p className={cn('text-2xl font-bold tabular-nums', totalLeakage > 5000 ? 'text-destructive' : '')}>{totalLeakage.toLocaleString()} DH</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Matériaux en alerte</p>
                  <p className="text-xl font-bold text-destructive">{materialCosts.filter(m => m.alert).length}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Material Variance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Variance Matériaux: Réel vs Théorique</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={materialCosts}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="materiau" tick={{ fontSize: 9 }} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Variance']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                      <Bar dataKey="variance_pct" name="Variance %" radius={[4, 4, 0, 0]}>
                        {materialCosts.map((entry, index) => (
                          <Cell key={index} fill={entry.alert ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Material Detail Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Détail par Matériau</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Matériau</TableHead>
                        <TableHead className="text-xs text-right">Théorique</TableHead>
                        <TableHead className="text-xs text-right">Réel</TableHead>
                        <TableHead className="text-xs text-right">Δ%</TableHead>
                        <TableHead className="text-xs text-right">Impact DH</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialCosts.map(m => (
                        <TableRow key={m.materiau} className={m.alert ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-sm font-medium flex items-center gap-1.5">
                            {m.alert && <AlertTriangle className="h-3 w-3 text-destructive" />}
                            {m.materiau}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{m.theorique_total.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{m.reel_total.toLocaleString()}</TableCell>
                          <TableCell className={cn('text-right text-sm font-semibold tabular-nums', m.variance_pct > 0 ? 'text-destructive' : 'text-emerald-500')}>
                            {m.variance_pct > 0 ? '+' : ''}{m.variance_pct}%
                          </TableCell>
                          <TableCell className={cn('text-right text-sm tabular-nums', m.cost_impact_dh > 0 ? 'text-destructive' : 'text-emerald-500')}>
                            {m.cost_impact_dh > 0 ? '+' : ''}{m.cost_impact_dh.toLocaleString()} DH
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Formula Cost Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Analyse CUR par Formule</CardTitle>
                <CardDescription className="text-xs">Coût Unitaire de Revient: Théorique vs Réel</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Formule</TableHead>
                        <TableHead className="text-xs text-center">Batches</TableHead>
                        <TableHead className="text-xs text-right">CUR Théo.</TableHead>
                        <TableHead className="text-xs text-right">CUR Réel</TableHead>
                        <TableHead className="text-xs text-right">Δ%</TableHead>
                        <TableHead className="text-xs text-right">Fuite DH</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formulaCosts.map(f => (
                        <TableRow key={f.formule_id} className={f.variance_pct > 5 ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-sm font-medium">{f.designation}</TableCell>
                          <TableCell className="text-center text-sm tabular-nums">{f.nb_batches}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{f.avg_cur_theorique} DH</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{f.avg_cur_reel} DH</TableCell>
                          <TableCell className={cn('text-right text-sm font-semibold tabular-nums', f.variance_pct > 3 ? 'text-destructive' : f.variance_pct < -1 ? 'text-emerald-500' : 'text-muted-foreground')}>
                            {f.variance_pct > 0 ? '+' : ''}{f.variance_pct}%
                          </TableCell>
                          <TableCell className={cn('text-right text-sm font-semibold tabular-nums', f.leakage_dh > 0 ? 'text-destructive' : 'text-emerald-500')}>
                            {f.leakage_dh > 0 ? '+' : ''}{f.leakage_dh.toLocaleString()} DH
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
