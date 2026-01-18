import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useReportingData } from '@/hooks/useReportingData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  PieChartIcon,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

export default function Rapports() {
  const { data, loading, selectedPeriod, setSelectedPeriod, refresh } = useReportingData();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Impossible de charger les données</p>
          <Button onClick={refresh}>Réessayer</Button>
        </div>
      </MainLayout>
    );
  }

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 2) return <TrendingUp className="h-4 w-4 text-success" />;
    if (value < -2) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Rapports & Analytique
            </h1>
            <p className="text-muted-foreground mt-1">
              Intelligence commerciale et analyse de performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={(v: '6m' | '12m' | 'ytd') => setSelectedPeriod(v)}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">6 derniers mois</SelectItem>
                <SelectItem value="12m">12 derniers mois</SelectItem>
                <SelectItem value="ytd">Depuis janvier</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold">{(data.summary.totalCA / 1000000).toFixed(2)} M DH</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Net</p>
                  <p className="text-2xl font-bold">{(data.summary.profitNet / 1000).toFixed(0)} K DH</p>
                </div>
                <Target className="h-8 w-8 text-success/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Volume Total</p>
                  <p className="text-2xl font-bold">{data.summary.totalVolume.toLocaleString()} m³</p>
                </div>
                <Package className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Marge Moyenne</p>
                  <p className="text-2xl font-bold">{data.summary.avgMargePct}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              Par Client
            </TabsTrigger>
            <TabsTrigger value="formulas" className="gap-2">
              <Package className="h-4 w-4" />
              Par Formule
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Prévisions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Revenue & Margin Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Évolution Mensuelle</CardTitle>
                  <CardDescription>Chiffre d'affaires et marge brute</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
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
                      <XAxis dataKey="monthLabel" className="text-xs" />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} DH`, '']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
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
                </CardContent>
              </Card>

              {/* Volume Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Volume de Production</CardTitle>
                  <CardDescription>m³ livrés par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="monthLabel" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [`${value} m³`, 'Volume']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Margin % Trend Line */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évolution de la Marge (%)</CardTitle>
                <CardDescription>Tendance de rentabilité sur la période</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthLabel" className="text-xs" />
                    <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Marge']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="marge_pct" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--success))' }}
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
              </CardContent>
            </Card>

            {/* Top/Bottom Clients Side by Side */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-success/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-success" />
                    Top 5 Clients (Marge)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Marge</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topClients.map((c, i) => (
                        <TableRow key={c.client_id}>
                          <TableCell className="font-medium">
                            <span className="text-muted-foreground mr-2">#{i + 1}</span>
                            {c.nom_client}
                          </TableCell>
                          <TableCell className="text-right font-mono text-success">
                            +{c.marge_brute.toLocaleString()} DH
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              {c.marge_pct}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                    Clients à Surveiller (Marge Faible)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Marge</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.bottomClients.map((c, i) => (
                        <TableRow key={c.client_id}>
                          <TableCell className="font-medium">
                            <span className="text-muted-foreground mr-2">#{i + 1}</span>
                            {c.nom_client}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-mono",
                            c.marge_brute < 0 ? "text-destructive" : "text-warning"
                          )}>
                            {c.marge_brute >= 0 ? '+' : ''}{c.marge_brute.toLocaleString()} DH
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={cn(
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">P&L par Client</CardTitle>
                <CardDescription>Performance financière détaillée par client</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">CA</TableHead>
                      <TableHead className="text-right">Coût</TableHead>
                      <TableHead className="text-right">Marge</TableHead>
                      <TableHead className="text-right">Marge %</TableHead>
                      <TableHead className="text-right">Prix Moy/m³</TableHead>
                      <TableHead className="text-right">Livraisons</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.clientsPL.map((c) => (
                      <TableRow key={c.client_id}>
                        <TableCell className="font-medium">{c.nom_client}</TableCell>
                        <TableCell className="text-right font-mono">{c.total_volume} m³</TableCell>
                        <TableCell className="text-right font-mono">{c.total_ca.toLocaleString()} DH</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{c.total_cout.toLocaleString()} DH</TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-medium",
                          c.marge_brute >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {c.marge_brute >= 0 ? '+' : ''}{c.marge_brute.toLocaleString()} DH
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn(
                            c.marge_pct >= 25 ? "bg-success/10 text-success border-success/30" :
                            c.marge_pct >= 15 ? "bg-warning/10 text-warning border-warning/30" :
                            "bg-destructive/10 text-destructive border-destructive/30"
                          )}>
                            {c.marge_pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{c.avg_prix_m3} DH</TableCell>
                        <TableCell className="text-right">{c.nb_livraisons}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Client Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition CA par Client</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.clientsPL.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nom_client, percent }) => `${nom_client.slice(0, 15)}... (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      dataKey="total_ca"
                      nameKey="nom_client"
                    >
                      {data.clientsPL.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} DH`, 'CA']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formulas Tab */}
          <TabsContent value="formulas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">P&L par Formule Béton</CardTitle>
                <CardDescription>Rentabilité par type de produit</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Formule</TableHead>
                      <TableHead>Désignation</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">CA</TableHead>
                      <TableHead className="text-right">Marge</TableHead>
                      <TableHead className="text-right">Marge %</TableHead>
                      <TableHead className="text-right">CUR Moyen</TableHead>
                      <TableHead className="text-right">Livraisons</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.formulasPL.map((f) => (
                      <TableRow key={f.formule_id}>
                        <TableCell className="font-mono font-medium">{f.formule_id}</TableCell>
                        <TableCell>{f.designation}</TableCell>
                        <TableCell className="text-right font-mono">{f.total_volume} m³</TableCell>
                        <TableCell className="text-right font-mono">{f.total_ca.toLocaleString()} DH</TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-medium",
                          f.marge_brute >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {f.marge_brute >= 0 ? '+' : ''}{f.marge_brute.toLocaleString()} DH
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn(
                            f.marge_pct >= 25 ? "bg-success/10 text-success border-success/30" :
                            f.marge_pct >= 15 ? "bg-warning/10 text-warning border-warning/30" :
                            "bg-destructive/10 text-destructive border-destructive/30"
                          )}>
                            {f.marge_pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{f.avg_cur} DH/m³</TableCell>
                        <TableCell className="text-right">{f.nb_livraisons}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Formula Volume Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume par Formule</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.formulasPL} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="formule_id" type="category" width={120} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [`${value} m³`, 'Volume']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="total_volume" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {data.forecast.map((f, i) => (
                <Card key={f.month} className={cn(
                  "border-2",
                  i === 0 ? "border-primary/30" : "border-muted"
                )}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{f.month}</span>
                      {f.trend === 'up' && <TrendingUp className="h-5 w-5 text-success" />}
                      {f.trend === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
                      {f.trend === 'stable' && <Minus className="h-5 w-5 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>
                      Confiance: {f.confidence}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Volume prévu</p>
                      <p className="text-2xl font-bold">{f.predicted_volume} m³</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CA prévu</p>
                      <p className="text-xl font-semibold text-primary">{f.predicted_ca.toLocaleString()} DH</p>
                    </div>
                    <Badge variant="outline" className={cn(
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
              <CardHeader>
                <CardTitle className="text-lg">Méthodologie de Prévision</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Les prévisions sont calculées sur la base d'une moyenne mobile des 3 derniers mois,
                  ajustée selon la tendance observée (+5%/-5% par mois selon la direction).
                  La confiance diminue avec l'horizon de prévision (90% → 60%).
                </p>
                <p className="mt-2 text-sm">
                  Pour des prévisions plus précises, intégrez des données de saisonnalité et de pipeline commercial.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
