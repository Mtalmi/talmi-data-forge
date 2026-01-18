import { useState } from 'react';
import { useClientCreditScore, ClientCreditScore } from '@/hooks/useClientCreditScore';
import { CreditScoreCard } from './CreditScoreCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Shield,
  BarChart3,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const GRADE_COLORS = {
  A: 'hsl(var(--success))',
  B: 'hsl(var(--primary))',
  C: 'hsl(var(--warning))',
  D: 'hsl(30, 100%, 50%)',
  F: 'hsl(var(--destructive))',
};

const RISK_COLORS = {
  low: 'hsl(var(--success))',
  medium: 'hsl(var(--warning))',
  high: 'hsl(30, 100%, 50%)',
  critical: 'hsl(var(--destructive))',
};

const GRADE_STYLES = {
  A: 'bg-success/10 text-success',
  B: 'bg-primary/10 text-primary',
  C: 'bg-warning/10 text-warning',
  D: 'bg-orange-500/10 text-orange-500',
  F: 'bg-destructive/10 text-destructive',
};

const RISK_STYLES = {
  low: { label: 'Faible', color: 'bg-success/10 text-success' },
  medium: { label: 'Moyen', color: 'bg-warning/10 text-warning' },
  high: { label: 'Élevé', color: 'bg-orange-500/10 text-orange-500' },
  critical: { label: 'Critique', color: 'bg-destructive/10 text-destructive' },
};

export function CreditScoreDashboard() {
  const { scores, stats, loading, refetch } = useClientCreditScore();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientCreditScore | null>(null);

  const filteredScores = scores.filter(client => {
    const matchesSearch = client.nom_client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.client_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || client.score_grade === gradeFilter;
    const matchesRisk = riskFilter === 'all' || client.risk_level === riskFilter;
    return matchesSearch && matchesGrade && matchesRisk;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const gradeChartData = stats.gradeDistribution.map(g => ({
    name: `Grade ${g.grade}`,
    value: g.count,
    color: GRADE_COLORS[g.grade as keyof typeof GRADE_COLORS],
  }));

  const riskChartData = stats.riskDistribution.map(r => ({
    name: RISK_STYLES[r.level as keyof typeof RISK_STYLES]?.label || r.level,
    value: r.count,
    color: RISK_COLORS[r.level as keyof typeof RISK_COLORS],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}</p>
                <p className="text-xs text-muted-foreground">Score Moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <p className="text-xs text-muted-foreground">Clients Analysés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.gradeDistribution.find(g => g.grade === 'A')?.count || 0}
                </p>
                <p className="text-xs text-muted-foreground">Clients Grade A</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highRiskClients}</p>
                <p className="text-xs text-muted-foreground">Clients à Risque</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grade Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Distribution par Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={70} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value} clients`, 'Nombre']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Répartition des Risques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value} clients`, 'Nombre']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {riskChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-medium">Scores de Crédit Clients</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous Grades</SelectItem>
                  <SelectItem value="A">Grade A</SelectItem>
                  <SelectItem value="B">Grade B</SelectItem>
                  <SelectItem value="C">Grade C</SelectItem>
                  <SelectItem value="D">Grade D</SelectItem>
                  <SelectItem value="F">Grade F</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Risque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous Risques</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Risque</TableHead>
                <TableHead className="text-center">Paiements à Temps</TableHead>
                <TableHead className="text-center">Utilisation Crédit</TableHead>
                <TableHead className="text-right">Solde Dû</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScores.map((client) => (
                <TableRow 
                  key={client.client_id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedClient(client)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.nom_client}</p>
                      <p className="text-xs text-muted-foreground">{client.client_id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono font-bold">{client.credit_score}</span>
                      <Progress value={client.credit_score} className="h-1 w-12" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn('font-bold', GRADE_STYLES[client.score_grade])}>
                      {client.score_grade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={RISK_STYLES[client.risk_level].color}>
                      {RISK_STYLES[client.risk_level].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'font-medium',
                      client.on_time_payment_rate >= 80 ? 'text-success' :
                      client.on_time_payment_rate >= 60 ? 'text-warning' : 'text-destructive'
                    )}>
                      {client.on_time_payment_rate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'font-medium',
                      client.credit_utilization <= 50 ? 'text-success' :
                      client.credit_utilization <= 80 ? 'text-warning' : 'text-destructive'
                    )}>
                      {client.credit_utilization}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(client.outstanding_balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail Score de Crédit</DialogTitle>
          </DialogHeader>
          {selectedClient && <CreditScoreCard client={selectedClient} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
