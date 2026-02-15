import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import MainLayout from '@/components/layout/MainLayout';
import { useReceivables, Receivable } from '@/hooks/useReceivables';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from 'recharts';
import {
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Users,
  Calendar,
  Loader2,
  DollarSign,
  Mail,
  Send,
  Phone,
  FileText,
  Ban,
  MessageSquare,
  Target,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AGING_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(142, 76%, 36%)'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'current': { label: 'Courant', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  'overdue_7': { label: '+7 jours', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  'overdue_15': { label: '+15 jours', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  'overdue_30': { label: '+30 jours', color: 'bg-accent/10 text-accent-foreground border-accent/30', icon: <AlertTriangle className="h-3 w-3" /> },
  'overdue_60': { label: '+60 jours', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" /> },
  'at_risk': { label: 'À Risque', color: 'bg-destructive/20 text-destructive border-destructive/50', icon: <Ban className="h-3 w-3" /> },
  'paid': { label: 'Payé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  'disputed': { label: 'Litige', color: 'bg-primary/10 text-primary border-primary/30', icon: <MessageSquare className="h-3 w-3" /> },
};

export default function Creances() {
  const { isCeo, role } = useAuth();
  const { t, lang } = useI18n();
  const { 
    receivables, 
    collectionLogs, 
    stats, 
    loading, 
    refetch, 
    markAsPaid, 
    sendReminder,
    markAsDisputed,
    writeOff,
    getOverdueByClient,
    ACTION_TYPE_LABELS,
  } = useReceivables();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'reminder' | 'dispute' | 'writeoff' | 'paid'>('reminder');
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const canManageReceivables = isCeo || role === 'agent_administratif' || role === 'superviseur';

  const filteredReceivables = receivables.filter(r => {
    const matchesSearch = 
      r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const overdueByClient = getOverdueByClient();

  const handleAction = async () => {
    if (!selectedReceivable) return;
    setProcessingAction(true);

    try {
      switch (actionType) {
        case 'paid':
          await markAsPaid(selectedReceivable.bl_id || selectedReceivable.id);
          break;
        case 'reminder':
          const reminderType = selectedReceivable.days_overdue <= 7 ? 'reminder_7d' 
            : selectedReceivable.days_overdue <= 15 ? 'reminder_15d' 
            : 'reminder_30d';
          await sendReminder(selectedReceivable, reminderType);
          break;
        case 'dispute':
          await markAsDisputed(selectedReceivable, actionNotes);
          break;
        case 'writeoff':
          if (!isCeo) {
            toast.error(t.pages.creances.ceoOnlyWriteOff);
            return;
          }
          await writeOff(selectedReceivable, actionNotes, 'CEO');
          break;
      }
    } finally {
      setProcessingAction(false);
      setActionDialogOpen(false);
      setSelectedReceivable(null);
      setActionNotes('');
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

  const hasData = receivables.length > 0;
  const startDate = new Date('2026-01-25'); // System start date

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              {t.pages.creances.title}
            </h1>
            <p className="text-muted-foreground">
              {t.pages.creances.subtitle} {format(startDate, 'dd MMM yyyy', { locale: getDateLocale(lang) })}
              {hasData && ` • DSO: ${stats.dsoAverage} jours`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {t.pages.creances.refresh}
            </Button>
          </div>
        </div>

        {/* Fresh Start Info Banner */}
        {!hasData && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                   <h3 className="font-semibold text-lg mb-1">{t.pages.creances.recoverySystem}</h3>
                   <p className="text-muted-foreground mb-3">
                     {t.pages.creances.recoveryActive}
                   </p>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span>{t.pages.creances.autoReminder}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-accent-foreground" />
                      <span>{t.pages.creances.escalation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-success" />
                      <span>{t.pages.creances.target}</span>
                    </div>
                  </div>
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
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.creances.totalOutstanding}</p>
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
                  <p className="text-xs text-muted-foreground">{t.pages.creances.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(stats.atRiskAmount)}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.creances.atRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Target className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.collectionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{t.pages.creances.collectionRate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.clientsWithOverdue}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.creances.clientsOverdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Summary */}
        {hasData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t.pages.creances.aging}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.agingBuckets.map((bucket, index) => (
                <div key={bucket.bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{bucket.bucket}</span>
                    <span className="text-muted-foreground">
                      {bucket.invoice_count} {t.pages.creances.invoices} • {formatCurrency(bucket.total_amount)}
                    </span>
                  </div>
                  <Progress 
                    value={bucket.percentage} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="receivables" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="receivables" className="gap-2">
              <FileText className="h-4 w-4" />
              {t.pages.creances.allReceivables}
            </TabsTrigger>
            <TabsTrigger value="by-client" className="gap-2">
              <Users className="h-4 w-4" />
              {t.pages.creances.byClient}
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Clock className="h-4 w-4" />
               {t.pages.creances.history}
            </TabsTrigger>
          </TabsList>

          {/* All Receivables Tab */}
          <TabsContent value="receivables" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.pages.creances.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">{t.pages.creances.allStatuses}</SelectItem>
                       <SelectItem value="current">{t.pages.creances.current}</SelectItem>
                       <SelectItem value="overdue_7">{t.pages.creances.overdue7}</SelectItem>
                       <SelectItem value="overdue_15">{t.pages.creances.overdue15}</SelectItem>
                       <SelectItem value="overdue_30">{t.pages.creances.overdue30}</SelectItem>
                       <SelectItem value="overdue_60">{t.pages.creances.overdue60}</SelectItem>
                       <SelectItem value="at_risk">{t.pages.creances.atRiskLabel}</SelectItem>
                       <SelectItem value="paid">{t.pages.creances.paid}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Receivables Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                       <TableHead>{t.pages.creances.client}</TableHead>
                       <TableHead>{t.pages.creances.invoice}</TableHead>
                       <TableHead>{t.pages.creances.dueDate}</TableHead>
                       <TableHead className="text-right">{t.pages.creances.amount}</TableHead>
                       <TableHead>{t.pages.creances.delay}</TableHead>
                       <TableHead>{t.pages.creances.status}</TableHead>
                       {canManageReceivables && <TableHead>{t.pages.creances.actions}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManageReceivables ? 7 : 6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="h-8 w-8" />
                             <p className="font-medium">{t.pages.creances.noReceivables}</p>
                             <p className="text-sm">
                               {!hasData 
                                 ? t.pages.creances.noReceivablesNew
                                 : t.pages.creances.noReceivablesFilter}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredReceivables.slice(0, 50).map((receivable) => {
                      const statusConfig = STATUS_CONFIG[receivable.status];
                      return (
                        <TableRow key={receivable.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{receivable.client_name}</p>
                              {receivable.client_email && (
                                <p className="text-xs text-muted-foreground">{receivable.client_email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {receivable.invoice_number}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(receivable.due_date), 'dd MMM yyyy', { locale: getDateLocale(lang) })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(receivable.amount_due)}
                          </TableCell>
                          <TableCell>
                            {receivable.days_overdue > 0 ? (
                              <span className="text-destructive font-medium">
                                +{receivable.days_overdue}j
                              </span>
                            ) : (
                              <span className="text-success">{t.pages.creances.upToDate}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          {canManageReceivables && (
                            <TableCell>
                              <div className="flex gap-1">
                                {receivable.status !== 'paid' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedReceivable(receivable);
                                        setActionType('paid');
                                        setActionDialogOpen(true);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 text-success" />
                                    </Button>
                                    {receivable.client_email && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setSelectedReceivable(receivable);
                                          setActionType('reminder');
                                          setActionDialogOpen(true);
                                        }}
                                      >
                                        <Send className="h-4 w-4 text-primary" />
                                      </Button>
                                    )}
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

          {/* By Client Tab */}
          <TabsContent value="by-client" className="space-y-4">
            {overdueByClient.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-12 w-12" />
                     <p className="font-medium text-lg">{t.pages.creances.noOverdueClients}</p>
                     <p className="text-sm text-center max-w-md">
                       {!hasData 
                         ? t.pages.creances.noOverdueClientsNew
                         : t.pages.creances.allPaidCongrats}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdueByClient.slice(0, 12).map((client) => (
                <Card key={client.client_name} className="border-warning/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate">{client.client_name}</span>
                      <Badge variant="destructive">{client.count} {t.pages.creances.invoices}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t.pages.creances.totalDue}</span>
                        <span className="font-bold text-destructive">{formatCurrency(client.total)}</span>
                      </div>
                      <div className="space-y-1">
                        {client.receivables.slice(0, 3).map(r => (
                          <div key={r.id} className="flex justify-between text-xs">
                            <span>{r.invoice_number}</span>
                            <span className="text-muted-foreground">+{r.days_overdue}j</span>
                          </div>
                        ))}
                        {client.receivables.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{client.receivables.length - 3} {t.pages.creances.otherInvoices}
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

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                 <CardTitle className="text-lg">{t.pages.creances.actionHistory}</CardTitle>
                 <CardDescription>{t.pages.creances.lastRecoveryActions}</CardDescription>
              </CardHeader>
              <CardContent>
                {collectionLogs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <Clock className="h-10 w-10" />
                     <p className="font-medium">{t.pages.creances.noActionsRecorded}</p>
                     <p className="text-sm text-center max-w-md">
                       {t.pages.creances.actionsWillAppear}
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {collectionLogs.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-full bg-primary/10">
                        {log.action_type.includes('reminder') ? (
                          <Mail className="h-4 w-4 text-primary" />
                        ) : log.action_type.includes('phone') ? (
                          <Phone className="h-4 w-4 text-primary" />
                        ) : log.action_type.includes('payment') ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{ACTION_TYPE_LABELS[log.action_type] || log.action_type}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(log.action_date), 'dd MMM yyyy HH:mm', { locale: getDateLocale(lang) })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.client_name} • {log.performed_by_name || t.pages.creances.system}
                        </p>
                        {log.notes && (
                          <p className="text-sm mt-1">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                 {actionType === 'paid' && t.pages.creances.markPaid}
                 {actionType === 'reminder' && t.pages.creances.sendReminder}
                 {actionType === 'dispute' && t.pages.creances.dispute}
                 {actionType === 'writeoff' && t.pages.creances.writeOff}
              </DialogTitle>
            </DialogHeader>
            {selectedReceivable && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedReceivable.client_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.pages.creances.invoice}: {selectedReceivable.invoice_number}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    {formatCurrency(selectedReceivable.amount_due)}
                  </p>
                </div>

                {(actionType === 'dispute' || actionType === 'writeoff') && (
                  <div>
                    <Label>{t.pages.creances.reason}</Label>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder={t.pages.creances.describeReason}
                      className="mt-1"
                    />
                  </div>
                )}

                {actionType === 'writeoff' && !isCeo && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {t.pages.creances.ceoOnlyWriteOff}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAction}
                disabled={processingAction || (actionType === 'writeoff' && !isCeo)}
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t.pages.creances.confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
