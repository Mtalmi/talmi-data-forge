import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { usePaymentTracking, PaymentRecord } from '@/hooks/usePaymentTracking';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Search,
  CreditCard,
  Banknote,
  FileText,
  Users,
  Calendar,
  Loader2,
  DollarSign,
  Mail,
  Send,
  PiggyBank,
} from 'lucide-react';
import { CashFeedingForm } from '@/components/finance/CashFeedingForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AGING_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];
const MODE_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'Payé': { label: 'Payé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  'En Attente': { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  'Retard': { label: 'En Retard', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function Paiements() {
  const { isCeo, role } = useAuth();
  const { payments, stats, loading, refetch, markAsPaid, getAgingReminders, sendPaymentReminders } = usePaymentTracking();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [agingFilter, setAgingFilter] = useState<string>('all');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const canManagePayments = isCeo || role === 'agent_administratif' || role === 'accounting';
  
  // Get eligible payments for reminders (31-60 days)
  const reminderEligible = getAgingReminders();

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bl_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.statut_paiement === statusFilter;
    const matchesMode = modeFilter === 'all' || p.mode_paiement === modeFilter;
    const matchesAging = agingFilter === 'all' || p.aging_bucket === agingFilter;
    
    return matchesSearch && matchesStatus && matchesMode && matchesAging;
  });

  const handleMarkPaid = async (blId: string) => {
    setMarkingPaid(blId);
    const success = await markAsPaid(blId);
    setMarkingPaid(null);
    if (success) {
      toast.success('Paiement marqué comme payé');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSendReminders = async () => {
    if (reminderEligible.length === 0) {
      toast.info('Aucune facture éligible aux rappels (31-60 jours)');
      return;
    }

    setSendingReminders(true);
    const result = await sendPaymentReminders();
    setSendingReminders(false);

    if (result.sent > 0) {
      toast.success(`${result.sent} rappel(s) envoyé(s) avec succès`);
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} échec(s) d'envoi`, {
        description: result.errors.slice(0, 3).join(', '),
      });
    }
  };

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-MA')} DH`;

  // Prepare chart data
  const agingChartData = stats.agingBuckets.map((bucket, index) => ({
    name: bucket.label,
    montant: bucket.total,
    count: bucket.count,
    fill: AGING_COLORS[index],
  }));

  const modeChartData = stats.paymentModeBreakdown.map((mode, index) => ({
    name: mode.label,
    value: mode.total,
    fill: MODE_COLORS[index % MODE_COLORS.length],
  }));

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Suivi des Paiements</h1>
            <p className="text-muted-foreground">
              Analyse des créances et rapports d'antériorité
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Cash Feeding Form */}
            {canManagePayments && (
              <CashFeedingForm onSuccess={refetch} />
            )}
            
            {canManagePayments && reminderEligible.length > 0 && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSendReminders}
                disabled={sendingReminders}
                className="gap-2"
              >
                {sendingReminders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Envoyer Rappels ({reminderEligible.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Reminder Alert Banner */}
        {canManagePayments && reminderEligible.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Mail className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warning">Rappels de Paiement Automatiques</p>
                  <p className="text-sm text-muted-foreground">
                    {reminderEligible.length} facture(s) dans la tranche 31-60 jours éligible(s) aux rappels • 
                    Total: {formatCurrency(reminderEligible.reduce((sum, p) => sum + p.total_ht, 0))}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSendReminders}
                  disabled={sendingReminders}
                  className="gap-2 border-warning/50 text-warning hover:bg-warning/10"
                >
                  {sendingReminders ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Envoyer les rappels
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Wallet className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
                  <p className="text-xs text-muted-foreground">Créances en cours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalOverdue)}</p>
                  <p className="text-xs text-muted-foreground">Impayés en retard</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground">Total encaissé</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.clientsWithOverdue}</p>
                  <p className="text-xs text-muted-foreground">Clients en retard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Summary Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Répartition par Antériorité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.agingBuckets.map((bucket, index) => (
                <div key={bucket.range} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{bucket.label}</span>
                    <span className="text-muted-foreground">
                      {bucket.count} factures • {formatCurrency(bucket.total)}
                    </span>
                  </div>
                  <Progress 
                    value={bucket.percentage} 
                    className="h-2"
                    style={{ 
                      ['--progress-background' as string]: AGING_COLORS[index],
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aging Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Montants par Antériorité</CardTitle>
              <CardDescription>Répartition des créances par tranche de jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Tranche: ${label}`}
                    />
                    <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
                      {agingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Mode Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition par Mode de Paiement</CardTitle>
              <CardDescription>Distribution des paiements par méthode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {modeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Mode Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Détail par Mode de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.paymentModeBreakdown.map((mode) => (
                <div 
                  key={mode.mode} 
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {mode.mode === 'especes' || mode.mode === 'cash' ? (
                      <Banknote className="h-5 w-5 text-success" />
                    ) : mode.mode === 'cheque' ? (
                      <FileText className="h-5 w-5 text-warning" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-primary" />
                    )}
                    <span className="font-semibold">{mode.label}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">{formatCurrency(mode.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success">Payé</span>
                      <span>{formatCurrency(mode.paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warning">En attente</span>
                      <span>{formatCurrency(mode.pending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-destructive">En retard</span>
                      <span>{formatCurrency(mode.overdue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Détail des Créances
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="Payé">Payé</SelectItem>
                    <SelectItem value="En Attente">En Attente</SelectItem>
                    <SelectItem value="Retard">En Retard</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={modeFilter} onValueChange={setModeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous modes</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={agingFilter} onValueChange={setAgingFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Antériorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="0-30">0-30 jours</SelectItem>
                    <SelectItem value="31-60">31-60 jours</SelectItem>
                    <SelectItem value="61-90">61-90 jours</SelectItem>
                    <SelectItem value="90+">90+ jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BL</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant HT</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Jours Retard</TableHead>
                    {canManagePayments && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManagePayments ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        Aucun paiement trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => {
                      const statusConfig = STATUS_CONFIG[payment.statut_paiement] || STATUS_CONFIG['En Attente'];
                      return (
                        <TableRow key={payment.bl_id}>
                          <TableCell className="font-mono text-sm">{payment.bl_id}</TableCell>
                          <TableCell className="font-medium">{payment.client_nom}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(payment.date_livraison), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(payment.total_ht)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.mode_paiement}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('gap-1', statusConfig.color)}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.days_overdue > 0 ? (
                              <span className={cn(
                                'font-medium',
                                payment.days_overdue > 60 ? 'text-destructive' : 
                                payment.days_overdue > 30 ? 'text-warning' : 'text-muted-foreground'
                              )}>
                                {payment.days_overdue} j
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          {canManagePayments && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {payment.statut_paiement !== 'Payé' && payment.aging_bucket === '31-60' && payment.client_email && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      const result = await sendPaymentReminders([payment.bl_id]);
                                      if (result.sent > 0) {
                                        toast.success(`Rappel envoyé à ${payment.client_nom}`);
                                      } else {
                                        toast.error('Échec de l\'envoi');
                                      }
                                    }}
                                    className="gap-1 text-warning hover:text-warning hover:bg-warning/10"
                                    title="Envoyer un rappel"
                                  >
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                )}
                                {payment.statut_paiement !== 'Payé' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkPaid(payment.bl_id)}
                                    disabled={markingPaid === payment.bl_id}
                                    className="gap-1"
                                  >
                                    {markingPaid === payment.bl_id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                    Encaisser
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredPayments.length} paiement(s) affiché(s) • 
              Total: {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.total_ht, 0))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
