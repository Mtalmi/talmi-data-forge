import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
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

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'not_due': { label: d.notDue, color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
    'due_soon': { label: d.dueSoonLabel, color: 'bg-warning/10 text-warning border-warning/30', icon: <Timer className="h-3 w-3" /> },
    'due_today': { label: d.dueToday, color: 'bg-accent/10 text-accent-foreground border-accent/30', icon: <CalendarIcon className="h-3 w-3" /> },
    'overdue': { label: d.overdue, color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" /> },
    'paid': { label: d.paid, color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
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
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {d.title}
            </h1>
            <p className="text-muted-foreground">
              {d.subtitle} {format(startDate, 'dd MMM yyyy', { locale: dateLocale || undefined })}
              {hasData && ` • DPO: ${stats.dpoAverage} ${d.timeframe}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {d.refresh}
            </Button>
          </div>
        </div>

        {/* Fresh Start Info Banner */}
        {!hasData && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{d.paymentSystem}</h3>
                  <p className="text-muted-foreground mb-3">{d.paymentActive}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-warning" />
                      <span>{d.alert7days}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-accent-foreground" />
                      <span>{d.scheduling}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>{d.target}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingDown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
                  <p className="text-xs text-muted-foreground">{d.totalPayables}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Timer className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalDueSoon)}</p>
                  <p className="text-xs text-muted-foreground">{d.dueSoon}</p>
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
                  <p className="text-xl font-bold">{formatCurrency(stats.totalOverdue)}</p>
                  <p className="text-xs text-muted-foreground">{d.overdue}</p>
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
                  <p className="text-xl font-bold">{stats.paymentRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{d.paymentRate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CalendarDays className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.scheduledPayments}</p>
                  <p className="text-xs text-muted-foreground">{d.scheduled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                        <TableRow key={payable.id}>
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
                            {format(parseISO(payable.due_date), 'dd MMM yyyy', { locale: dateLocale || undefined })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payable.amount_due)}
                          </TableCell>
                          <TableCell>
                            {payable.days_overdue > 0 ? (
                              <span className="text-destructive font-medium">
                                +{payable.days_overdue}j
                              </span>
                            ) : payable.days_until_due <= 7 ? (
                              <span className="text-warning">
                                {payable.days_until_due}j
                              </span>
                            ) : (
                              <span className="text-success">
                                {payable.days_until_due}j
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
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
    </MainLayout>
  );
}
