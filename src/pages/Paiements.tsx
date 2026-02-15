import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
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
  Building2,
} from 'lucide-react';
import { CashFeedingForm } from '@/components/finance/CashFeedingForm';
import { CashDepositsWidget } from '@/components/finance/CashDepositsWidget';
import { TaxComplianceDashboard } from '@/components/compliance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AGING_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];
const MODE_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'];

const STATUS_KEYS: Record<string, { key: 'paid' | 'pending' | 'overdue'; color: string; icon: React.ReactNode }> = {
  'Payé': { key: 'paid', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  'En Attente': { key: 'pending', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  'Retard': { key: 'overdue', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function Paiements() {
  const { isCeo, role } = useAuth();
  const { t } = useI18n();
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
      toast.success(t.pages.paiements.markedPaid);
    } else {
      toast.error(t.pages.paiements.markError);
    }
  };

  const handleSendReminders = async () => {
    if (reminderEligible.length === 0) {
      toast.info(t.pages.paiements.noEligible);
      return;
    }

    setSendingReminders(true);
    const result = await sendPaymentReminders();
    setSendingReminders(false);

    if (result.sent > 0) {
      toast.success(`${result.sent} ${t.pages.paiements.remindersSent}`);
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} ${t.pages.paiements.remindersFailed}`, {
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
            <h1 className="text-2xl font-bold tracking-tight">{t.pages.paiements.title}</h1>
            <p className="text-muted-foreground">
              {t.pages.paiements.subtitle}
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
                {t.pages.paiements.sendReminders} ({reminderEligible.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {t.pages.paiements.refresh}
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="payments" className="gap-2">
              <Wallet className="h-4 w-4" />
              {t.pages.paiements.receivables}
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t.pages.paiements.taxCompliance}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">

        {/* Reminder Alert Banner */}
        {canManagePayments && reminderEligible.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Mail className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                   <p className="font-medium text-warning">{t.pages.paiements.paymentReminders}</p>
                   <p className="text-sm text-muted-foreground">
                     {reminderEligible.length} {t.pages.paiements.reminderEligible} • 
                     {t.pages.paiements.total}: {formatCurrency(reminderEligible.reduce((sum, p) => sum + p.total_ht, 0))}
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
                  {t.pages.paiements.sendTheReminders}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cash Deposits Widget */}
        {canManagePayments && (
          <CashDepositsWidget />
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
                   <p className="text-xs text-muted-foreground">{t.pages.paiements.outstandingReceivables}</p>
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
                   <p className="text-xs text-muted-foreground">{t.pages.paiements.overduePayments}</p>
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
                   <p className="text-xs text-muted-foreground">{t.pages.paiements.totalCollected}</p>
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
                   <p className="text-xs text-muted-foreground">{t.pages.paiements.overdueClients}</p>
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
              {t.pages.paiements.agingBreakdown}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.agingBuckets.map((bucket, index) => (
                <div key={bucket.range} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{bucket.label}</span>
                    <span className="text-muted-foreground">
                      {bucket.count} {t.pages.paiements.invoices} • {formatCurrency(bucket.total)}
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
              <CardTitle className="text-lg">{t.pages.paiements.amountsByAging}</CardTitle>
              <CardDescription>{t.pages.paiements.receivablesByRange}</CardDescription>
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
              <CardTitle className="text-lg">{t.pages.paiements.paymentModeBreakdown}</CardTitle>
              <CardDescription>{t.pages.paiements.paymentDistribution}</CardDescription>
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
              {t.pages.paiements.paymentModeDetail}
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
                      <span className="text-muted-foreground">{t.pages.paiements.total}</span>
                      <span className="font-medium">{formatCurrency(mode.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success">{t.pages.paiements.paid}</span>
                      <span>{formatCurrency(mode.paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warning">{t.pages.paiements.pending}</span>
                      <span>{formatCurrency(mode.pending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-destructive">{t.pages.paiements.overdue}</span>
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
                {t.pages.paiements.receivablesDetail}
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
                     <SelectItem value="all">{t.pages.paiements.allStatuses}</SelectItem>
                    <SelectItem value="Payé">{t.pages.paiements.paid}</SelectItem>
                    <SelectItem value="En Attente">{t.pages.paiements.pending}</SelectItem>
                    <SelectItem value="Retard">{t.pages.paiements.overdue}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={modeFilter} onValueChange={setModeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.pages.paiements.allModes}</SelectItem>
                    <SelectItem value="virement">{t.pages.paiements.transfer}</SelectItem>
                    <SelectItem value="cheque">{t.pages.paiements.check}</SelectItem>
                    <SelectItem value="especes">{t.pages.paiements.cash}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={agingFilter} onValueChange={setAgingFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Antériorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.pages.paiements.allAging}</SelectItem>
                    <SelectItem value="0-30">{t.pages.paiements.aging0_30}</SelectItem>
                    <SelectItem value="31-60">{t.pages.paiements.aging31_60}</SelectItem>
                    <SelectItem value="61-90">{t.pages.paiements.aging61_90}</SelectItem>
                    <SelectItem value="90+">{t.pages.paiements.aging90plus}</SelectItem>
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
                     <TableHead>{t.pages.paiements.bl}</TableHead>
                    <TableHead>{t.pages.paiements.client}</TableHead>
                    <TableHead>{t.pages.paiements.date}</TableHead>
                    <TableHead className="text-right">{t.pages.paiements.amountHT}</TableHead>
                    <TableHead>{t.pages.paiements.mode}</TableHead>
                    <TableHead>{t.pages.paiements.status}</TableHead>
                    <TableHead className="text-right">{t.pages.paiements.daysOverdue}</TableHead>
                    {canManagePayments && <TableHead className="text-right">{t.pages.paiements.actions}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManagePayments ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        {t.pages.paiements.noPayments}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => {
                      const statusMeta = STATUS_KEYS[payment.statut_paiement] || STATUS_KEYS['En Attente'];
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
                             <Badge variant="outline" className={cn('gap-1', statusMeta.color)}>
                              {statusMeta.icon}
                              {t.pages.paiements[statusMeta.key]}
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
                                       toast.success(`${t.pages.paiements.reminderSentTo} ${payment.client_nom}`);
                                      } else {
                                        toast.error(t.pages.paiements.sendError);
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
                                    {t.pages.paiements.collect}
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
               {filteredPayments.length} {t.pages.paiements.displayed} • 
               {t.pages.paiements.total}: {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.total_ht, 0))}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <TaxComplianceDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
