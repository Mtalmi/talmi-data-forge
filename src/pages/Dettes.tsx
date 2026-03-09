import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePayables, Payable } from '@/hooks/usePayables';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
} from 'recharts';
import {
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Calendar as CalendarIcon,
  Loader2,
  DollarSign,
  CreditCard,
  FileText,
  TrendingDown,
  CalendarDays,
  Banknote,
  Timer,
  Zap,
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AGING_COLORS = ['hsl(var(--success))', 'hsl(142, 76%, 36%)', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

export default function Dettes() {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const d = t.pages.dettes;
  const { isCeo, role } = useAuth();
  const { 
    payables, 
    schedules, 
    stats, 
    loading, 
    refetch, 
    schedulePayment,
    executePayment,
    getPayablesBySupplier,
    getDueSoon,
    getOverdue,
  } = usePayables();

  const STATUS_CONFIG: Record<string, { label: string; badgeStyle: React.CSSProperties; icon: React.ReactNode; pulse?: boolean }> = {
    'not_due': { label: 'À payer', badgeStyle: { background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', color: '#f59e0b' }, icon: <Clock className="h-3 w-3" /> },
    'due_soon': { label: 'Urgent', badgeStyle: { background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444' }, icon: <Zap className="h-3 w-3" />, pulse: true },
    'due_today': { label: 'Urgent', badgeStyle: { background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444' }, icon: <Zap className="h-3 w-3" />, pulse: true },
    'overdue': { label: 'En retard', badgeStyle: { background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444' }, icon: <AlertTriangle className="h-3 w-3" />, pulse: true },
    'paid': { label: 'Payé', badgeStyle: { background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', color: '#22c55e' }, icon: <CheckCircle className="h-3 w-3" /> },
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('virement');
  const [paymentReference, setPaymentReference] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [processingAction, setProcessingAction] = useState(false);

  const canManagePayables = isCeo || role === 'agent_administratif' || role === 'superviseur';

  const filteredPayables = payables.filter(p => {
    const matchesSearch = 
      p.fournisseur_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const payablesBySupplier = getPayablesBySupplier();
  const dueSoon = getDueSoon();
  const overdue = getOverdue();

  const handleExecutePayment = async () => {
    if (!selectedPayable || paymentAmount <= 0) return;
    setProcessingAction(true);

    try {
      await executePayment(selectedPayable, paymentAmount, paymentMethod, paymentReference);
      setPaymentDialogOpen(false);
      setSelectedPayable(null);
      setPaymentAmount(0);
      setPaymentReference('');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSchedulePayment = async () => {
    if (!selectedPayable || !scheduledDate) return;
    setProcessingAction(true);

    try {
      await schedulePayment(selectedPayable, scheduledDate, paymentMethod);
      setScheduleDialogOpen(false);
      setSelectedPayable(null);
      setScheduledDate(undefined);
    } finally {
      setProcessingAction(false);
    }
  };

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-MA')} DH`;

  const agingChartData = stats.agingBuckets.map((bucket, index) => ({
    name: bucket.bucket,
    montant: bucket.total_amount,
    count: bucket.invoice_count,
    fill: AGING_COLORS[index % AGING_COLORS.length],
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

  const hasData = payables.length > 0;
  const startDate = new Date('2026-01-25');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* TBOS Header */}
        <PageHeader
          icon={Building2}
          title="Dettes Fournisseurs"
          subtitle="Données en temps réel"
          loading={loading}
        />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Premium Info Banner */}
        <div style={{
          background: 'rgba(212,168,67,0.06)',
          border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={20} color="#D4A843" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Système de Paiements Fournisseurs</h3>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 14 }}>
              Suivi en temps réel — {format(new Date(), 'dd MMMM yyyy', { locale: dateLocale || undefined })}
              {hasData && ` • DPO: ${stats.dpoAverage} jours`}
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Alerte 7j avant échéance', icon: Timer },
                { label: 'Programmation automatique', icon: CalendarDays },
                { label: 'Objectif 100% à temps', icon: CheckCircle },
              ].map((pill, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />
                  <pill.icon size={14} color="#D4A843" />
                  <span>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} style={{ border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', background: 'rgba(212,168,67,0.08)' }}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>

        {/* Urgent Alerts */}
        {hasData && (dueSoon.length > 0 || overdue.length > 0) && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warning">{d.urgentPayments}</p>
                  <p className="text-sm text-muted-foreground">
                    {overdue.length > 0 && `${overdue.length} ${d.invoicesOverdue} (${formatCurrency(stats.totalOverdue)})`}
                    {overdue.length > 0 && dueSoon.length > 0 && ' • '}
                    {dueSoon.length > 0 && `${dueSoon.length} ${d.invoicesDueSoon} (${formatCurrency(stats.totalDueSoon)})`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards — Glassmorphism */}
        {(() => {
          const tauxColor = stats.paymentRate >= 80 ? '#22c55e' : stats.paymentRate >= 60 ? '#f59e0b' : '#ef4444';
          const kpis = [
            { label: 'DETTES TOTALES', value: formatCurrency(stats.totalOutstanding), color: '#D4A843', icon: TrendingDown, pulse: false },
            { label: 'À PAYER', value: formatCurrency(stats.totalDueSoon), color: '#f59e0b', icon: Timer, pulse: false },
            { label: 'EN RETARD', value: formatCurrency(stats.totalOverdue), color: '#ef4444', icon: AlertTriangle, pulse: true },
            { label: 'TAUX PAIEMENT', value: `${stats.paymentRate.toFixed(1)}%`, color: tauxColor, icon: CheckCircle, pulse: false },
            { label: 'PROGRAMMÉS', value: String(stats.scheduledPayments), color: '#4A9EFF', icon: CalendarDays, pulse: false },
          ];
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {kpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: `3px solid ${kpi.color}`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    animation: kpi.pulse ? 'tbos-pulse 2.5s infinite' : undefined,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={kpi.color} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9CA3AF' }}>{kpi.label}</span>
                    </div>
                    <p style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                      fontWeight: 200,
                      fontSize: kpi.value.length > 12 ? 30 : 48,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      color: '#FFFFFF',
                      WebkitFontSmoothing: 'antialiased',
                    }}>{kpi.value}</p>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Aging Chart */}
        {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{d.agingTitle}</CardTitle>
            <CardDescription>{d.agingDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `${d.period}: ${label}`}
                  />
                  <Bar dataKey="montant" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="payables" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="payables" className="gap-2">
              <FileText className="h-4 w-4" />
              {d.allPayables}
            </TabsTrigger>
            <TabsTrigger value="by-supplier" className="gap-2">
              <Building2 className="h-4 w-4" />
              {d.bySupplier}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              {d.calendar}
            </TabsTrigger>
          </TabsList>

          {/* All Payables Tab */}
          <TabsContent value="payables" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={d.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={d.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{d.allStatuses}</SelectItem>
                      <SelectItem value="not_due">{d.notDue}</SelectItem>
                      <SelectItem value="due_soon">{d.dueSoonLabel}</SelectItem>
                      <SelectItem value="due_today">{d.dueToday}</SelectItem>
                      <SelectItem value="overdue">{d.overdue}</SelectItem>
                      <SelectItem value="paid">{d.paid}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payables Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{d.supplier}</TableHead>
                      <TableHead>{d.invoice}</TableHead>
                      <TableHead>{d.dueDate}</TableHead>
                      <TableHead className="text-right">{d.amount}</TableHead>
                      <TableHead>{d.timeframe}</TableHead>
                      <TableHead>{d.status}</TableHead>
                      {canManagePayables && <TableHead>{d.actions}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManagePayables ? 7 : 6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="h-8 w-8" />
                            <p className="font-medium">{d.noPayables}</p>
                            <p className="text-sm">
                              {!hasData ? d.noPayablesNew : d.noPayablesFilter}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPayables.slice(0, 50).map((payable) => {
                      const statusConfig = STATUS_CONFIG[payable.status];
                      return (
                        <TableRow 
                          key={payable.id}
                          className="group transition-all duration-150"
                          style={{ borderLeft: '3px solid transparent' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = '#D4A843'; (e.currentTarget as HTMLElement).style.background = 'rgba(255, 215, 0, 0.04)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{payable.fournisseur_name}</p>
                              {payable.payment_terms && (
                                <p className="text-xs text-muted-foreground">{payable.payment_terms}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payable.invoice_number}
                          </TableCell>
                          <TableCell>
                            <span style={{
                              color: payable.days_overdue > 0 ? '#ef4444' : payable.days_until_due <= 7 ? '#f59e0b' : '#F1F5F9',
                              fontWeight: payable.days_overdue > 0 ? 500 : 400,
                            }}>
                              {format(parseISO(payable.due_date), 'dd MMM yyyy', { locale: dateLocale || undefined })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', color: '#D4A843', fontWeight: 500 }}>
                              {formatCurrency(payable.amount_due)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {payable.days_overdue > 0 ? (
                              <span style={{ color: '#ef4444', fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 13 }}>
                                +{payable.days_overdue}j
                              </span>
                            ) : (
                              <span style={{
                                color: payable.days_until_due > 14 ? '#22c55e' : payable.days_until_due > 7 ? '#f59e0b' : '#ef4444',
                                fontWeight: 500,
                                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                                fontSize: 13,
                              }}>
                                {payable.days_until_due}j
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConfig.pulse && "animate-pulse")}
                              style={statusConfig.badgeStyle}
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </TableCell>
                          {canManagePayables && (
                            <TableCell>
                              <div className="flex gap-1">
                                {payable.status !== 'paid' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedPayable(payable);
                                        setPaymentAmount(payable.amount_due);
                                        setPaymentDialogOpen(true);
                                      }}
                                    >
                                      <Banknote className="h-4 w-4 text-success" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedPayable(payable);
                                        setScheduledDate(parseISO(payable.due_date));
                                        setScheduleDialogOpen(true);
                                      }}
                                    >
                                      <CalendarDays className="h-4 w-4 text-primary" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Supplier Tab */}
          <TabsContent value="by-supplier" className="space-y-4">
            {payablesBySupplier.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-12 w-12" />
                    <p className="font-medium text-lg">{d.noSupplierDebts}</p>
                    <p className="text-sm text-center max-w-md">
                      {!hasData ? d.noSupplierDebtsNew : d.allInvoicesPaid}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payablesBySupplier.slice(0, 12).map((supplier) => (
                <Card key={supplier.fournisseur_name} className={supplier.total_overdue > 0 ? 'border-destructive/30' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate">{supplier.fournisseur_name}</span>
                      <Badge variant="outline">{supplier.count} {d.invoice}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{d.totalDue}</span>
                        <span className="font-bold">{formatCurrency(supplier.total_due)}</span>
                      </div>
                      {supplier.total_overdue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-destructive">{d.overdueAmount}</span>
                          <span className="font-bold text-destructive">{formatCurrency(supplier.total_overdue)}</span>
                        </div>
                      )}
                      <div className="space-y-1 mt-2">
                        {supplier.payables.slice(0, 3).map(p => (
                          <div key={p.id} className="flex justify-between text-xs">
                            <span>{p.invoice_number}</span>
                            <span className={p.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}>
                              {formatCurrency(p.amount_due)}
                            </span>
                          </div>
                        ))}
                        {supplier.payables.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{supplier.payables.length - 3} {d.otherInvoices}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Due Soon */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5 text-warning" />
                    {d.dueSoon7}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dueSoon.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">{d.noInvoiceToPay}</p>
                    ) : (
                      dueSoon.slice(0, 10).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                          <div>
                            <p className="font-medium">{p.fournisseur_name}</p>
                            <p className="text-xs text-muted-foreground">{p.invoice_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(p.amount_due)}</p>
                            <p className="text-xs text-warning">{p.days_until_due}{d.daysRemaining}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Overdue */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {d.overdueLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overdue.length === 0 ? (
                      <p className="text-success text-center py-4">{d.noOverdueInvoice}</p>
                    ) : (
                      overdue.slice(0, 10).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                          <div>
                            <p className="font-medium">{p.fournisseur_name}</p>
                            <p className="text-xs text-muted-foreground">{p.invoice_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-destructive">{formatCurrency(p.amount_due)}</p>
                            <p className="text-xs text-destructive">+{p.days_overdue}{d.daysLate}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{d.registerPayment}</DialogTitle>
            </DialogHeader>
            {selectedPayable && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedPayable.fournisseur_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.invoice}: {selectedPayable.invoice_number}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    {d.balanceDue}: {formatCurrency(selectedPayable.amount_due)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>{d.paymentAmount}</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{d.paymentMode}</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virement">{d.bankTransfer}</SelectItem>
                        <SelectItem value="cheque">{d.check}</SelectItem>
                        <SelectItem value="especes">{d.cash}</SelectItem>
                        <SelectItem value="effet">{d.billOfExchange}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{d.reference}</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={d.referencePlaceholder}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                {d.cancel}
              </Button>
              <Button 
                onClick={handleExecutePayment}
                disabled={processingAction || paymentAmount <= 0}
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {d.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{d.schedulePayment}</DialogTitle>
            </DialogHeader>
            {selectedPayable && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedPayable.fournisseur_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.invoice}: {selectedPayable.invoice_number}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    {formatCurrency(selectedPayable.amount_due)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>{d.scheduledDate}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !scheduledDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP", { locale: dateLocale || undefined }) : d.selectDate}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>{d.plannedPaymentMode}</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virement">{d.bankTransfer}</SelectItem>
                        <SelectItem value="cheque">{d.check}</SelectItem>
                        <SelectItem value="especes">{d.cash}</SelectItem>
                        <SelectItem value="effet">{d.billOfExchange}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                {d.cancel}
              </Button>
              <Button 
                onClick={handleSchedulePayment}
                disabled={processingAction || !scheduledDate}
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {d.scheduleBtn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </MainLayout>
  );
}
