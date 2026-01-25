import { useState } from 'react';
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
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AGING_COLORS = ['hsl(var(--success))', 'hsl(142, 76%, 36%)', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'not_due': { label: 'Non échu', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  'due_soon': { label: 'Échu bientôt', color: 'bg-warning/10 text-warning border-warning/30', icon: <Timer className="h-3 w-3" /> },
  'due_today': { label: 'Échu aujourd\'hui', color: 'bg-accent/10 text-accent-foreground border-accent/30', icon: <CalendarIcon className="h-3 w-3" /> },
  'overdue': { label: 'En retard', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" /> },
  'paid': { label: 'Payé', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
};

export default function Dettes() {
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Dettes Fournisseurs
            </h1>
            <p className="text-muted-foreground">
              Gestion des paiements fournisseurs • DPO: {stats.dpoAverage} jours
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Urgent Alerts */}
        {(dueSoon.length > 0 || overdue.length > 0) && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warning">Paiements Urgents</p>
                  <p className="text-sm text-muted-foreground">
                    {overdue.length > 0 && `${overdue.length} facture(s) en retard (${formatCurrency(stats.totalOverdue)})`}
                    {overdue.length > 0 && dueSoon.length > 0 && ' • '}
                    {dueSoon.length > 0 && `${dueSoon.length} facture(s) à payer sous 7 jours (${formatCurrency(stats.totalDueSoon)})`}
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
                  <p className="text-xs text-muted-foreground">Dettes totales</p>
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
                  <p className="text-xs text-muted-foreground">À payer (7j)</p>
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
                  <p className="text-xs text-muted-foreground">En retard</p>
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
                  <p className="text-xs text-muted-foreground">Taux paiement</p>
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
                  <p className="text-xs text-muted-foreground">Programmés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Antériorité des Dettes</CardTitle>
            <CardDescription>Répartition par échéance</CardDescription>
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
                    labelFormatter={(label) => `Période: ${label}`}
                  />
                  <Bar dataKey="montant" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="payables" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="payables" className="gap-2">
              <FileText className="h-4 w-4" />
              Toutes les Dettes
            </TabsTrigger>
            <TabsTrigger value="by-supplier" className="gap-2">
              <Building2 className="h-4 w-4" />
              Par Fournisseur
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendrier
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
                      placeholder="Rechercher fournisseur ou facture..."
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
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="not_due">Non échu</SelectItem>
                      <SelectItem value="due_soon">Échu bientôt</SelectItem>
                      <SelectItem value="due_today">Échu aujourd'hui</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
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
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Facture</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Délai</TableHead>
                      <TableHead>Statut</TableHead>
                      {canManagePayables && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.slice(0, 50).map((payable) => {
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
                            {format(parseISO(payable.due_date), 'dd MMM yyyy', { locale: fr })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payablesBySupplier.slice(0, 12).map((supplier) => (
                <Card key={supplier.fournisseur_name} className={supplier.total_overdue > 0 ? 'border-destructive/30' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate">{supplier.fournisseur_name}</span>
                      <Badge variant="outline">{supplier.count} factures</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total dû</span>
                        <span className="font-bold">{formatCurrency(supplier.total_due)}</span>
                      </div>
                      {supplier.total_overdue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-destructive">En retard</span>
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
                            +{supplier.payables.length - 3} autres factures
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Due Soon */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5 text-warning" />
                    À Payer Sous 7 Jours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dueSoon.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Aucune facture à payer</p>
                    ) : (
                      dueSoon.slice(0, 10).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                          <div>
                            <p className="font-medium">{p.fournisseur_name}</p>
                            <p className="text-xs text-muted-foreground">{p.invoice_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(p.amount_due)}</p>
                            <p className="text-xs text-warning">{p.days_until_due}j restants</p>
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
                    En Retard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overdue.length === 0 ? (
                      <p className="text-success text-center py-4">✓ Aucune facture en retard</p>
                    ) : (
                      overdue.slice(0, 10).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                          <div>
                            <p className="font-medium">{p.fournisseur_name}</p>
                            <p className="text-xs text-muted-foreground">{p.invoice_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-destructive">{formatCurrency(p.amount_due)}</p>
                            <p className="text-xs text-destructive">+{p.days_overdue}j de retard</p>
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
              <DialogTitle>Enregistrer un Paiement</DialogTitle>
            </DialogHeader>
            {selectedPayable && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedPayable.fournisseur_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Facture: {selectedPayable.invoice_number}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    Solde dû: {formatCurrency(selectedPayable.amount_due)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Montant</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Mode de paiement</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virement">Virement bancaire</SelectItem>
                        <SelectItem value="cheque">Chèque</SelectItem>
                        <SelectItem value="especes">Espèces</SelectItem>
                        <SelectItem value="effet">Effet de commerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Référence</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Numéro de virement, chèque..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleExecutePayment}
                disabled={processingAction || paymentAmount <= 0}
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programmer un Paiement</DialogTitle>
            </DialogHeader>
            {selectedPayable && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedPayable.fournisseur_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Facture: {selectedPayable.invoice_number}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    {formatCurrency(selectedPayable.amount_due)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Date de paiement prévue</Label>
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
                          {scheduledDate ? format(scheduledDate, "PPP", { locale: fr }) : "Sélectionner une date"}
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
                    <Label>Mode de paiement prévu</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virement">Virement bancaire</SelectItem>
                        <SelectItem value="cheque">Chèque</SelectItem>
                        <SelectItem value="especes">Espèces</SelectItem>
                        <SelectItem value="effet">Effet de commerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSchedulePayment}
                disabled={processingAction || !scheduledDate}
              >
                {processingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Programmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
