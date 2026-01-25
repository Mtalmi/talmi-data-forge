import { useState } from 'react';
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
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  brouillon: { label: 'Brouillon', icon: <Clock className="h-3 w-3" />, color: 'bg-muted text-muted-foreground' },
  en_attente: { label: 'En attente', icon: <Clock className="h-3 w-3" />, color: 'bg-warning/20 text-warning' },
  approuve: { label: 'Approuvé', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-success/20 text-success' },
  rejete: { label: 'Rejeté', icon: <XCircle className="h-3 w-3" />, color: 'bg-destructive/20 text-destructive' },
  paye: { label: 'Payé', icon: <Banknote className="h-3 w-3" />, color: 'bg-primary/20 text-primary' },
  bloque_plafond: { label: 'Bloqué (Plafond)', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-destructive/20 text-destructive' },
};

const LEVEL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  level_1: { label: 'Niveau 1', icon: <ShieldCheck className="h-3 w-3" />, color: 'text-success' },
  level_2: { label: 'Niveau 2', icon: <ShieldAlert className="h-3 w-3" />, color: 'text-warning' },
  level_3: { label: 'Niveau 3', icon: <ShieldX className="h-3 w-3" />, color: 'text-destructive' },
};

const CATEGORY_LABELS: Record<string, string> = {
  carburant: 'Carburant',
  maintenance: 'Maintenance',
  fournitures: 'Fournitures',
  transport: 'Transport',
  reparation: 'Réparation',
  nettoyage: 'Nettoyage',
  petit_equipement: 'Petit Équipement',
  services_externes: 'Services Externes',
  frais_administratifs: 'Frais Administratifs',
  autre: 'Autre',
};

export default function DepensesV2() {
  const { isCeo, isSuperviseur, isAgentAdministratif, isDirecteurOperations } = useAuth();
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
      toast.success('Dépense approuvée');
    } else {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (expense: ExpenseControlled) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;
    
    const success = await rejectExpense(expense.id, reason);
    if (success) {
      toast.success('Dépense rejetée');
    } else {
      toast.error('Erreur lors du rejet');
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
      toast.success('Marqué comme payé');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
    setPaymentDialogExpense(null);
  };

  const handleOverrideCap = async (expense: ExpenseControlled) => {
    const reason = prompt('Raison du dépassement de plafond:');
    if (!reason) return;
    
    const success = await overrideCap(expense.id, reason);
    if (success) {
      toast.success('Plafond débloqué');
    } else {
      toast.error('Erreur lors du déblocage');
    }
  };

  const handleDelete = async (expense: ExpenseControlled) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    
    const result = await deleteExpense(expense.id);
    if (result.success) {
      toast.success('Dépense supprimée');
    } else {
      // Handle specific error types with professional messages
      if (result.error?.includes('DELETION_BLOCKED')) {
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">🔒 Suppression refusée</p>
            <p className="text-sm">Seul le CEO peut supprimer des dépenses approuvées.</p>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
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
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Gestion des Dépenses Contrôlées</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Workflow multi-niveau avec budgets départementaux
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SecurityComplianceButton />
            <ExportButton
              data={exportData}
              columns={[
                { key: 'reference', label: 'Référence' },
                { key: 'date', label: 'Date' },
                { key: 'demandeur', label: 'Demandeur' },
                { key: 'categorie', label: 'Catégorie' },
                { key: 'description', label: 'Description' },
                { key: 'montant_ht', label: 'Montant HT' },
                { key: 'tva', label: 'TVA %' },
                { key: 'montant_ttc', label: 'Montant TTC' },
                { key: 'niveau', label: 'Niveau' },
                { key: 'statut', label: 'Statut' },
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
              <span className="hidden sm:inline">Filtres</span>
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => setShowNewForm(true)} className="min-h-[40px]">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nouvelle Dépense</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for Expenses vs Budgets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Dépenses
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Budgets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {stats.totalAmount.toLocaleString('fr-FR')} MAD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-warning flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    En attente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-warning">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {stats.pendingAmount.toLocaleString('fr-FR')} MAD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approuvées
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
                    Payées
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
                    Rejetées
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
                    Bloquées
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
                  <p className="text-muted-foreground">Aucune dépense trouvée</p>
                  {Object.keys(filters).length > 0 && (
                    <Button variant="link" onClick={() => setFilters({})}>
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <Table className="data-table-industrial">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Statut</TableHead>
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
                            ? format(new Date(expense.requested_at), 'dd/MM/yyyy', { locale: fr })
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
                          {expense.montant_ttc.toLocaleString('fr-FR')} MAD
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
                                Voir détails
                              </DropdownMenuItem>
                              
                              {canApprove && expense.statut === 'en_attente' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(expense)}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                    Approuver
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(expense)}>
                                    <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                    Rejeter
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {canApprove && expense.statut === 'bloque_plafond' && (isCeo || isSuperviseur) && (
                                <DropdownMenuItem onClick={() => handleOverrideCap(expense)}>
                                  <TrendingUp className="h-4 w-4 mr-2 text-warning" />
                                  Débloquer plafond
                                </DropdownMenuItem>
                              )}
                              
                              {canApprove && expense.statut === 'approuve' && (
                                <DropdownMenuItem onClick={() => handleMarkPaid(expense)}>
                                  <Banknote className="h-4 w-4 mr-2 text-primary" />
                                  Marquer payé
                                </DropdownMenuItem>
                              )}
                              
                              {isCeo && expense.statut === 'brouillon' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(expense)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Supprimer
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
                Nouvelle Demande de Dépense
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
      </div>
    </MainLayout>
  );
}
