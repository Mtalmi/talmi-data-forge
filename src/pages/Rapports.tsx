import * as React from 'react';
const { useState, useRef } = React;
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/i18n/I18nContext';
import { useReportingData } from '@/hooks/useReportingData';
import { MonthlyReportPdfGenerator } from '@/components/reports/MonthlyReportPdfGenerator';
import { ReportKPICard } from '@/components/reports/ReportKPICard';
import { ReportEmptyState } from '@/components/reports/ReportEmptyState';
import { ReportPageSkeleton, ChartSkeleton, TableSkeleton } from '@/components/reports/ReportSkeleton';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Package,
  DollarSign,
  BarChart3,
  Calendar,
  RefreshCw,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

export default function Rapports() {
  const { data, loading, selectedPeriod, setSelectedPeriod, refresh, previousPeriodData } = useReportingData();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: async () => {
      await refresh();
    },
  });

  // Calculate trend percentages
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case '6m': return 'période précédente';
      case '12m': return 'année précédente';
      case 'ytd': return 'même période année préc.';
      default: return 'période précédente';
    }
  };

  if (loading && !data) {
    return (
      <MainLayout>
        <ReportPageSkeleton />
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t.pages.rapports.unableToLoad}</p>
          <Button onClick={refresh}>{t.pages.rapports.retry}</Button>
        </div>
      </MainLayout>
    );
  }

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 2) return <TrendingUp className="h-4 w-4 text-success" />;
    if (value < -2) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Calculate trends from previous period
  const caTrend = previousPeriodData 
    ? calculateTrend(data.summary.totalCA, previousPeriodData.totalCA)
    : undefined;
  const profitTrend = previousPeriodData
    ? calculateTrend(data.summary.profitNet, previousPeriodData.profitNet)
    : undefined;
  const volumeTrend = previousPeriodData
    ? calculateTrend(data.summary.totalVolume, previousPeriodData.totalVolume)
    : undefined;
  const margeTrend = previousPeriodData
    ? data.summary.avgMargePct - previousPeriodData.avgMargePct
    : undefined;

  return (
    <MainLayout>
      <div 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="h-full overflow-auto"
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />
        
        <div className="space-y-4 sm:space-y-6 p-1">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                  <span className="truncate">{t.pages.rapports.title}</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                  {t.pages.rapports.subtitle}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={refresh}
                disabled={loading}
                className="flex-shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={selectedPeriod} onValueChange={(v: '6m' | '12m' | 'ytd') => setSelectedPeriod(v)}>
                <SelectTrigger className="w-[140px] sm:w-[160px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6m">6 derniers mois</SelectItem>
                  <SelectItem value="12m">12 derniers mois</SelectItem>
                  <SelectItem value="ytd">Depuis janvier</SelectItem>
                </SelectContent>
              </Select>
              <MonthlyReportPdfGenerator data={data} period={selectedPeriod} />
            </div>
          </div>

          {/* Summary Cards with Trends */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <ReportKPICard
              title="Chiffre d'Affaires"
              value={`${(data.summary.totalCA / 1000000).toFixed(2)} M DH`}
              icon={DollarSign}
              trend={caTrend}
              trendLabel={getPeriodLabel()}
              variant="primary"
            />
            <ReportKPICard
              title="Profit Net"
              value={`${(data.summary.profitNet / 1000).toFixed(0)} K DH`}
              icon={Target}
              trend={profitTrend}
              trendLabel={getPeriodLabel()}
              variant="success"
            />
            <ReportKPICard
              title="Volume Total"
              value={`${data.summary.totalVolume.toLocaleString()} m³`}
              icon={Package}
              trend={volumeTrend}
              trendLabel={getPeriodLabel()}
              variant="accent"
            />
            <ReportKPICard
              title="Marge Moyenne"
              value={`${data.summary.avgMargePct}%`}
              icon={TrendingUp}
              trend={margeTrend}
              trendLabel={getPeriodLabel()}
              variant="warning"
            />
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-full sm:w-auto">
                <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Vue d'ensemble</span>
                  <span className="xs:hidden">Aperçu</span>
                </TabsTrigger>
                <TabsTrigger value="clients" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  Clients
                </TabsTrigger>
                <TabsTrigger value="formulas" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  Formules
                </TabsTrigger>
                <TabsTrigger value="forecast" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Prévisions</span>
                  <span className="sm:hidden">Prévu</span>
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Monthly Revenue & Margin Trend */}
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Évolution Mensuelle</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Chiffre d'affaires et marge brute</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.monthlyTrends.length === 0 ? (
                      <ReportEmptyState type="chart" />
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={data.monthlyTrends}>
                          <defs>
                            <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMarge" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="monthLabel" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                          <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()} DH`, '']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Area 
                            type="monotone" 
                            dataKey="chiffre_affaires" 
                            name="CA" 
                            stroke="hsl(var(--primary))" 
                            fillOpacity={1} 
                            fill="url(#colorCA)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="marge_brute" 
                            name="Marge" 
                            stroke="hsl(var(--success))" 
                            fillOpacity={1} 
                            fill="url(#colorMarge)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Volume Trend */}
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Volume de Production</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">m³ livrés par mois</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.monthlyTrends.length === 0 ? (
                      <ReportEmptyState type="chart" />
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="monthLabel" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                          <YAxis className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: number) => [`${value} m³`, 'Volume']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                          />
                          <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Margin % Trend Line */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Évolution de la Marge (%)</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Tendance de rentabilité sur la période</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.monthlyTrends.length === 0 ? (
                    <ReportEmptyState type="chart" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={data.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="monthLabel" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value: number) => [`${value}%`, 'Marge']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="marge_pct" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--success))' }}
                          name="Marge %"
                        />
                        {/* Target line at 25% */}
                        <Line 
                          type="monotone" 
                          dataKey={() => 25} 
                          stroke="hsl(var(--warning))" 
                          strokeDasharray="5 5" 
                          strokeWidth={1}
                          dot={false}
                          name="Objectif 25%"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top/Bottom Clients Side by Side */}
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="border-success/30">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                      Top 5 Clients (Marge)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.topClients.length === 0 ? (
                      <ReportEmptyState type="table" message="Aucun client avec des données de marge" />
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Client</TableHead>
                              <TableHead className="text-right text-xs">Marge</TableHead>
                              <TableHead className="text-right text-xs">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.topClients.map((c, i) => (
                              <TableRow key={c.client_id}>
                                <TableCell className="font-medium text-xs sm:text-sm py-2">
                                  <span className="text-muted-foreground mr-1 sm:mr-2">#{i + 1}</span>
                                  <span className="truncate max-w-[100px] sm:max-w-none inline-block align-bottom">
                                    {c.nom_client}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-success text-xs sm:text-sm py-2">
                                  +{(c.marge_brute / 1000).toFixed(0)}K
                                </TableCell>
                                <TableCell className="text-right py-2">
                                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] sm:text-xs">
                                    {c.marge_pct}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-destructive/30">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                      Clients à Surveiller
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.bottomClients.length === 0 ? (
                      <ReportEmptyState type="table" message="Aucun client avec une marge faible" />
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Client</TableHead>
                              <TableHead className="text-right text-xs">Marge</TableHead>
                              <TableHead className="text-right text-xs">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.bottomClients.map((c, i) => (
                              <TableRow key={c.client_id}>
                                <TableCell className="font-medium text-xs sm:text-sm py-2">
                                  <span className="text-muted-foreground mr-1 sm:mr-2">#{i + 1}</span>
                                  <span className="truncate max-w-[100px] sm:max-w-none inline-block align-bottom">
                                    {c.nom_client}
                                  </span>
                                </TableCell>
                                <TableCell className={cn(
                                  "text-right font-mono text-xs sm:text-sm py-2",
                                  c.marge_brute < 0 ? "text-destructive" : "text-warning"
                                )}>
                                  {c.marge_brute >= 0 ? '+' : ''}{(c.marge_brute / 1000).toFixed(0)}K
                                </TableCell>
                                <TableCell className="text-right py-2">
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] sm:text-xs",
                                    c.marge_pct < 15 
                                      ? "bg-destructive/10 text-destructive border-destructive/30"
                                      : "bg-warning/10 text-warning border-warning/30"
                                  )}>
                                    {c.marge_pct}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-4 sm:space-y-6 mt-4">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">P&L par Client</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Performance financière détaillée par client</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.clientsPL.length === 0 ? (
                    <ReportEmptyState type="table" message="Aucune donnée client pour cette période" />
                  ) : (
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs min-w-[120px]">Client</TableHead>
                            <TableHead className="text-right text-xs">Volume</TableHead>
                            <TableHead className="text-right text-xs">CA</TableHead>
                            <TableHead className="text-right text-xs hidden sm:table-cell">Coût</TableHead>
                            <TableHead className="text-right text-xs">Marge</TableHead>
                            <TableHead className="text-right text-xs">%</TableHead>
                            <TableHead className="text-right text-xs hidden md:table-cell">Prix/m³</TableHead>
                            <TableHead className="text-right text-xs hidden lg:table-cell">Livr.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.clientsPL.map((c) => (
                            <TableRow key={c.client_id}>
                              <TableCell className="font-medium text-xs sm:text-sm py-2">{c.nom_client}</TableCell>
                              <TableCell className="text-right font-mono text-xs sm:text-sm py-2">{c.total_volume} m³</TableCell>
                              <TableCell className="text-right font-mono text-xs sm:text-sm py-2">{(c.total_ca / 1000).toFixed(0)}K</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm py-2 hidden sm:table-cell">{(c.total_cout / 1000).toFixed(0)}K</TableCell>
                              <TableCell className={cn(
                                "text-right font-mono font-medium text-xs sm:text-sm py-2",
                                c.marge_brute >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {c.marge_brute >= 0 ? '+' : ''}{(c.marge_brute / 1000).toFixed(0)}K
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <Badge variant="outline" className={cn(
                                  "text-[10px] sm:text-xs",
                                  c.marge_pct >= 25 ? "bg-success/10 text-success border-success/30" :
                                  c.marge_pct >= 15 ? "bg-warning/10 text-warning border-warning/30" :
                                  "bg-destructive/10 text-destructive border-destructive/30"
                                )}>
                                  {c.marge_pct}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs sm:text-sm py-2 hidden md:table-cell">{c.avg_prix_m3} DH</TableCell>
                              <TableCell className="text-right text-xs sm:text-sm py-2 hidden lg:table-cell">{c.nb_livraisons}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Client Distribution Pie */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Répartition CA par Client</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.clientsPL.length === 0 ? (
                    <ReportEmptyState type="chart" />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={data.clientsPL.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ nom_client, percent }) => `${nom_client.slice(0, 10)}${nom_client.length > 10 ? '..' : ''} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={90}
                          dataKey="total_ca"
                          nameKey="nom_client"
                        >
                          {data.clientsPL.slice(0, 5).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value.toLocaleString()} DH`, 'CA']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Formulas Tab */}
            <TabsContent value="formulas" className="space-y-4 sm:space-y-6 mt-4">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">P&L par Formule Béton</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Rentabilité par type de produit</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.formulasPL.length === 0 ? (
                    <ReportEmptyState type="table" message="Aucune formule avec des données pour cette période" />
                  ) : (
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs min-w-[80px]">Formule</TableHead>
                            <TableHead className="text-xs hidden sm:table-cell">Désignation</TableHead>
                            <TableHead className="text-right text-xs">Volume</TableHead>
                            <TableHead className="text-right text-xs">CA</TableHead>
                            <TableHead className="text-right text-xs">Marge</TableHead>
                            <TableHead className="text-right text-xs">%</TableHead>
                            <TableHead className="text-right text-xs hidden md:table-cell">CUR</TableHead>
                            <TableHead className="text-right text-xs hidden lg:table-cell">Livr.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.formulasPL.map((f) => (
                            <TableRow key={f.formule_id}>
                              <TableCell className="font-mono font-medium text-xs sm:text-sm py-2">{f.formule_id}</TableCell>
                              <TableCell className="text-xs sm:text-sm py-2 hidden sm:table-cell">{f.designation}</TableCell>
                              <TableCell className="text-right font-mono text-xs sm:text-sm py-2">{f.total_volume} m³</TableCell>
                              <TableCell className="text-right font-mono text-xs sm:text-sm py-2">{(f.total_ca / 1000).toFixed(0)}K</TableCell>
                              <TableCell className={cn(
                                "text-right font-mono font-medium text-xs sm:text-sm py-2",
                                f.marge_brute >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {f.marge_brute >= 0 ? '+' : ''}{(f.marge_brute / 1000).toFixed(0)}K
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <Badge variant="outline" className={cn(
                                  "text-[10px] sm:text-xs",
                                  f.marge_pct >= 25 ? "bg-success/10 text-success border-success/30" :
                                  f.marge_pct >= 15 ? "bg-warning/10 text-warning border-warning/30" :
                                  "bg-destructive/10 text-destructive border-destructive/30"
                                )}>
                                  {f.marge_pct}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs sm:text-sm py-2 hidden md:table-cell">{f.avg_cur} DH</TableCell>
                              <TableCell className="text-right text-xs sm:text-sm py-2 hidden lg:table-cell">{f.nb_livraisons}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Formula Volume Bar Chart */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Volume par Formule</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.formulasPL.length === 0 ? (
                    <ReportEmptyState type="chart" />
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(200, data.formulasPL.length * 40)}>
                      <BarChart data={data.formulasPL} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="formule_id" type="category" width={80} className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value: number) => [`${value} m³`, 'Volume']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                        />
                        <Bar dataKey="total_volume" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Forecast Tab */}
            <TabsContent value="forecast" className="space-y-4 sm:space-y-6 mt-4">
              {data.forecast.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <ReportEmptyState 
                      type="forecast" 
                      message="Pas assez de données historiques pour générer des prévisions fiables"
                    />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {data.forecast.map((f, i) => (
                      <Card key={f.month} className={cn(
                        "border-2",
                        i === 0 ? "border-primary/30" : "border-muted"
                      )}>
                        <CardHeader className="pb-2 sm:pb-4">
                          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                            <span>{f.month}</span>
                            {f.trend === 'up' && <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />}
                            {f.trend === 'down' && <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />}
                            {f.trend === 'stable' && <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Confiance: {f.confidence}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Volume prévu</p>
                            <p className="text-xl sm:text-2xl font-bold">{f.predicted_volume} m³</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">CA prévu</p>
                            <p className="text-lg sm:text-xl font-semibold text-primary">{f.predicted_ca.toLocaleString()} DH</p>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[10px] sm:text-xs",
                            f.trend === 'up' ? "bg-success/10 text-success border-success/30" :
                            f.trend === 'down' ? "bg-destructive/10 text-destructive border-destructive/30" :
                            "bg-muted"
                          )}>
                            Tendance {f.trend === 'up' ? 'Haussière' : f.trend === 'down' ? 'Baissière' : 'Stable'}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg">Méthodologie de Prévision</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-xs sm:text-sm">
                      <p>
                        Les prévisions sont calculées sur la base d'une moyenne mobile des 3 derniers mois,
                        ajustée selon la tendance observée (+5%/-5% par mois selon la direction).
                        La confiance diminue avec l'horizon de prévision (90% → 60%).
                      </p>
                      <p className="mt-2">
                        Pour des prévisions plus précises, intégrez des données de saisonnalité et de pipeline commercial.
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
