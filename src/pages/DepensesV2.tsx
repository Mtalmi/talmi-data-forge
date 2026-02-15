import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useExpensesControlled, ExpenseFilters, ExpenseControlled } from '@/hooks/useExpensesControlled';
import { ExpenseRequestForm } from '@/components/expenses/ExpenseRequestForm';
import { ExpenseFiltersPanel } from '@/components/expenses/ExpenseFiltersPanel';
import { ExpenseDetailDialog } from '@/components/expenses/ExpenseDetailDialog';
import { DepartmentBudgetWidget } from '@/components/expenses/DepartmentBudgetWidget';
import { ExportButton } from '@/components/documents/ExportButton';
import { SecurityComplianceButton } from '@/components/reports/SecurityComplianceButton';
import { CashPaymentDialog } from '@/components/treasury';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Receipt, 
  Loader2, 
  RefreshCw,
  Plus,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Banknote,
  Clock,
  AlertTriangle,
  TrendingUp,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Wallet,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getDateLocale, getNumberLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getStatusConfig = (t: any) => ({
  brouillon: { label: t.pages.depenses.draft, icon: <Clock className="h-3 w-3" />, color: 'bg-muted text-muted-foreground' },
  en_attente: { label: t.pages.depenses.pending, icon: <Clock className="h-3 w-3" />, color: 'bg-warning/20 text-warning' },
  approuve: { label: t.pages.depenses.approved, icon: <CheckCircle className="h-3 w-3" />, color: 'bg-success/20 text-success' },
  rejete: { label: t.pages.depenses.rejected, icon: <XCircle className="h-3 w-3" />, color: 'bg-destructive/20 text-destructive' },
  paye: { label: t.pages.depenses.paid, icon: <Banknote className="h-3 w-3" />, color: 'bg-primary/20 text-primary' },
  bloque_plafond: { label: t.pages.depenses.blockedCap, icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-destructive/20 text-destructive' },
} as Record<string, { label: string; icon: React.ReactNode; color: string }>);

const getLevelConfig = (t: any) => ({
  level_1: { label: t.pages.depenses.level1, icon: <ShieldCheck className="h-3 w-3" />, color: 'text-success' },
  level_2: { label: t.pages.depenses.level2, icon: <ShieldAlert className="h-3 w-3" />, color: 'text-warning' },
  level_3: { label: t.pages.depenses.level3, icon: <ShieldX className="h-3 w-3" />, color: 'text-destructive' },
} as Record<string, { label: string; icon: React.ReactNode; color: string }>);

const getCategoryLabels = (t: any) => ({
  carburant: t.pages.depenses.fuel,
  maintenance: t.pages.depenses.maintenance,
  fournitures: t.pages.depenses.supplies,
  transport: t.pages.depenses.transport,
  reparation: t.pages.depenses.repair,
  nettoyage: t.pages.depenses.cleaning,
  petit_equipement: t.pages.depenses.smallEquipment,
  services_externes: t.pages.depenses.externalServices,
  frais_administratifs: t.pages.depenses.adminFees,
  autre: t.pages.depenses.other,
} as Record<string, string>);

export default function DepensesV2() {
  const { isCeo, isSuperviseur, isAgentAdministratif, isDirecteurOperations } = useAuth();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const numberLocale = getNumberLocale(lang);
  const d = t.pages.depenses;
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseControlled | null>(null);
  const [activeTab, setActiveTab] = useState('expenses');
  
  const { 
    expenses, 
    stats, 
    loading, 
    refresh,
    approveExpense,
    rejectExpense,
    markAsPaid,
    deleteExpense,
    overrideCap,
  } = useExpensesControlled(filters);

  const canApprove = isCeo || isSuperviseur;
  const canCreate = isCeo || isSuperviseur || isAgentAdministratif || isDirecteurOperations;

  const STATUS_CONFIG = getStatusConfig(t);
  const LEVEL_CONFIG = getLevelConfig(t);
  const CATEGORY_LABELS = getCategoryLabels(t);

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['en_attente'];
    return (
      <Badge variant="outline" className={cn('gap-1', config.color)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG['level_1'];
    return (
      <Badge variant="outline" className={cn('gap-1 bg-transparent border', config.color)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleApprove = async (expense: ExpenseControlled) => {
    const level = expense.approval_level.replace('_', '') as 'level1' | 'level2' | 'level3';
    const success = await approveExpense(expense.id, level);
    if (success) {
      toast.success(d.expenseApproved);
    } else {
      toast.error(d.approveError);
    }
  };

  const handleReject = async (expense: ExpenseControlled) => {
    const reason = prompt(d.rejectReason);
    if (!reason) return;
    
    const success = await rejectExpense(expense.id, reason);
    if (success) {
      toast.success(d.expenseRejected);
    } else {
      toast.error(d.rejectError);
    }
  };

  const [paymentDialogExpense, setPaymentDialogExpense] = useState<ExpenseControlled | null>(null);

  const handleMarkPaid = (expense: ExpenseControlled) => {
    setPaymentDialogExpense(expense);
  };

  const handlePaymentConfirm = async (method: string, fournisseurId?: string, fournisseurNom?: string, overrideReason?: string) => {
    if (!paymentDialogExpense) return;
    
    const success = await markAsPaid(paymentDialogExpense.id, method);
    if (success) {
      toast.success(d.markedPaid);
    } else {
      toast.error(d.markPaidError);
    }
    setPaymentDialogExpense(null);
  };

  const handleOverrideCap = async (expense: ExpenseControlled) => {
    const reason = prompt(d.capOverrideReason);
    if (!reason) return;
    
    const success = await overrideCap(expense.id, reason);
    if (success) {
      toast.success(d.capUnblockedSuccess);
    } else {
      toast.error(d.capUnblockError);
    }
  };

  const handleDelete = async (expense: ExpenseControlled) => {
    if (!confirm(d.deleteConfirm)) return;
    
    const result = await deleteExpense(expense.id);
    if (result.success) {
      toast.success(d.expenseDeleted);
    } else {
      if (result.error?.includes('DELETION_BLOCKED')) {
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">{d.deletionBlocked}</p>
            <p className="text-sm">{d.deletionBlockedDesc}</p>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(result.error || d.deleteError);
      }
    }
  };

  const exportData = expenses.map(exp => ({
    reference: exp.reference,
    date: exp.requested_at ? format(new Date(exp.requested_at), 'dd/MM/yyyy') : '',
    demandeur: exp.requested_by_name || '',
    categorie: CATEGORY_LABELS[exp.categorie] || exp.categorie,
    description: exp.description,
    montant_ht: exp.montant_ht,
    tva: exp.tva_pct || 0,
    montant_ttc: exp.montant_ttc,
    niveau: LEVEL_CONFIG[exp.approval_level]?.label || '',
    statut: STATUS_CONFIG[exp.statut]?.label || exp.statut,
  }));

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{d.controlledExpenses}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              {d.controlledSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SecurityComplianceButton />
            <ExportButton
              data={exportData}
              columns={[
                { key: 'reference', label: d.exportReference },
                { key: 'date', label: d.exportDate },
                { key: 'demandeur', label: d.exportRequester },
                { key: 'categorie', label: d.exportCategory },
                { key: 'description', label: d.exportDescription },
                { key: 'montant_ht', label: d.exportAmountHT },
                { key: 'tva', label: d.exportVAT },
                { key: 'montant_ttc', label: d.exportAmountTTC },
                { key: 'niveau', label: d.exportLevel },
                { key: 'statut', label: d.exportStatus },
              ]}
              filename="depenses-controlees"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={cn('min-h-[40px]', showFilters && 'bg-muted')}
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{d.filters}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{d.refresh}</span>
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => setShowNewForm(true)} className="min-h-[40px]">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{d.newRequest}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for Expenses vs Budgets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              {d.expensesTab}
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {d.budgetsTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    {d.total}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {stats.totalAmount.toLocaleString(numberLocale)} MAD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-warning flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {d.waitingLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-warning">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {stats.pendingAmount.toLocaleString(numberLocale)} MAD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {d.approvedLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-success">{stats.approved}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-primary flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    {d.paidLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-primary">{stats.paid}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {d.rejectedLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-destructive">{stats.rejected}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {d.blocked}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-destructive">{stats.blocked}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <ExpenseFiltersPanel filters={filters} onChange={setFilters} />
            )}

            {/* Expenses Table */}
            <div className="card-industrial overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : expenses.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{d.noExpensesFound}</p>
                  {Object.keys(filters).length > 0 && (
                    <Button variant="link" onClick={() => setFilters({})}>
                      {d.clearFilters}
                    </Button>
                  )}
                </div>
              ) : (
                <Table className="data-table-industrial">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{d.reference}</TableHead>
                      <TableHead>{d.date}</TableHead>
                      <TableHead>{d.requester}</TableHead>
                      <TableHead>{d.description}</TableHead>
                      <TableHead className="text-right">{d.amountTTC}</TableHead>
                      <TableHead>{d.level}</TableHead>
                      <TableHead>{d.status}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono text-xs">
                          {expense.reference}
                        </TableCell>
                        <TableCell className="text-sm">
                          {expense.requested_at 
                            ? format(new Date(expense.requested_at), 'dd/MM/yyyy', { locale: dateLocale || undefined })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {expense.requested_by_name || '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {CATEGORY_LABELS[expense.categorie] || expense.categorie}
                            </Badge>
                            <span className="truncate">{expense.description}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {expense.montant_ttc.toLocaleString(numberLocale)} MAD
                        </TableCell>
                        <TableCell>{getLevelBadge(expense.approval_level)}</TableCell>
                        <TableCell>{getStatusBadge(expense.statut)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedExpense(expense)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {d.viewDetails}
                              </DropdownMenuItem>
                              
                              {canApprove && expense.statut === 'en_attente' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(expense)}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                    {d.approve}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(expense)}>
                                    <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                    {d.reject}
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {canApprove && expense.statut === 'bloque_plafond' && (isCeo || isSuperviseur) && (
                                <DropdownMenuItem onClick={() => handleOverrideCap(expense)}>
                                  <TrendingUp className="h-4 w-4 mr-2 text-warning" />
                                  {d.unblockCap}
                                </DropdownMenuItem>
                              )}
                              
                              {canApprove && expense.statut === 'approuve' && (
                                <DropdownMenuItem onClick={() => handleMarkPaid(expense)}>
                                  <Banknote className="h-4 w-4 mr-2 text-primary" />
                                  {d.markPaid}
                                </DropdownMenuItem>
                              )}
                              
                              {isCeo && expense.statut === 'brouillon' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(expense)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {d.deleteLabel}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="budgets" className="mt-4">
            <DepartmentBudgetWidget />
          </TabsContent>
        </Tabs>

        {/* New Expense Form Dialog */}
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {d.newExpenseRequest}
              </DialogTitle>
            </DialogHeader>
            <ExpenseRequestForm 
              onSuccess={() => {
                setShowNewForm(false);
                refresh();
              }}
              onCancel={() => setShowNewForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Expense Detail Dialog */}
        {selectedExpense && (
          <ExpenseDetailDialog
            expense={selectedExpense}
            open={!!selectedExpense}
            onClose={() => setSelectedExpense(null)}
          />
        )}

        {/* Cash Payment Dialog */}
        {paymentDialogExpense && (
          <CashPaymentDialog
            open={!!paymentDialogExpense}
            onOpenChange={(open) => !open && setPaymentDialogExpense(null)}
            expenseId={paymentDialogExpense.id}
            expenseReference={paymentDialogExpense.reference}
            amount={paymentDialogExpense.montant_ttc}
            description={paymentDialogExpense.description}
            onConfirm={handlePaymentConfirm}
          />
        )}
      </div>
    </MainLayout>
  );
}
