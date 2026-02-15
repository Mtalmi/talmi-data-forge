import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Building2, RefreshCw, Upload, Zap, Search, 
  Check, X, FileText, AlertCircle, TrendingUp,
  ArrowRight, Loader2, Link2, Ban
} from 'lucide-react';
import { useBankReconciliation, BankTransaction, MatchSuggestion } from '@/hooks/useBankReconciliation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import BankCSVImport from '@/components/banking/BankCSVImport';

export default function Rapprochement() {
  const { user, isCeo, isAccounting } = useAuth();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const r = t.pages.rapprochement;
  const { toast } = useToast();
  const { 
    transactions, stats, loading, clients, refetch,
    findMatches, importTransactions, confirmMatch, 
    ignoreTransaction, autoReconcile 
  } = useBankReconciliation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [autoReconciling, setAutoReconciling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Manual import form
  const [importForm, setImportForm] = useState({
    date_transaction: format(new Date(), 'yyyy-MM-dd'),
    libelle: '',
    montant: '',
    reference_bancaire: '',
    type_transaction: 'credit',
  });

  const canManage = isCeo || isAccounting;

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    non_rapproche: { label: r.statusLabelPending, color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
    rapproche: { label: r.statusLabelReconciled, color: 'bg-green-100 text-green-800', icon: Check },
    ignore: { label: r.statusLabelIgnored, color: 'bg-gray-100 text-gray-600', icon: Ban },
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = searchTerm === '' || 
        t.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference_bancaire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.montant.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || t.statut_rapprochement === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  const handleOpenMatch = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    const suggestions = findMatches(transaction);
    setMatchSuggestions(suggestions);
    setShowMatchDialog(true);
  };

  const handleConfirmMatch = async (match: MatchSuggestion) => {
    if (!selectedTransaction) return;
    
    setConfirming(true);
    const result = await confirmMatch(selectedTransaction.id, match, 'manuel');
    setConfirming(false);

    if (result.success) {
      toast({
        title: r.reconciliationConfirmed,
        description: `${r.transactionReconciledWith} ${match.facture_id || match.bl_id}`,
      });
      setShowMatchDialog(false);
      setSelectedTransaction(null);
    } else {
      toast({
        title: r.error,
        description: r.reconciliationError,
        variant: 'destructive',
      });
    }
  };

  const handleIgnore = async (transactionId: string) => {
    const result = await ignoreTransaction(transactionId, 'Ignoré manuellement');
    if (result.success) {
      toast({
        title: r.transactionIgnored,
        description: r.transactionIgnoredDesc,
      });
    }
  };

  const handleAutoReconcile = async () => {
    setAutoReconciling(true);
    const result = await autoReconcile(0.75);
    setAutoReconciling(false);

    toast({
      title: r.autoReconcileComplete,
      description: `${result.reconciled} ${r.transactionsAutoReconciled}`,
    });
  };

  const handleImport = async () => {
    if (!importForm.libelle || !importForm.montant) {
      toast({
        title: r.fieldsRequired,
        description: r.fieldsRequiredDesc,
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    const result = await importTransactions([{
      date_transaction: importForm.date_transaction,
      date_valeur: null,
      libelle: importForm.libelle,
      reference_bancaire: importForm.reference_bancaire || null,
      montant: parseFloat(importForm.montant),
      devise: 'MAD',
      type_transaction: importForm.type_transaction,
      notes: null,
    }]);
    setImporting(false);

    if (result.success) {
      toast({
        title: r.transactionImported,
        description: r.transactionImportedDesc,
      });
      setShowImportDialog(false);
      setImportForm({
        date_transaction: format(new Date(), 'yyyy-MM-dd'),
        libelle: '',
        montant: '',
        reference_bancaire: '',
        type_transaction: 'credit',
      });
    } else {
      toast({
        title: r.error,
        description: r.importError,
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              {r.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {r.subtitle}
            </p>
          </div>
          
          {canManage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAutoReconcile}
                disabled={autoReconciling || stats.nonRapprochees === 0}
              >
                {autoReconciling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {r.autoReconcile}
              </Button>
              <BankCSVImport onImport={importTransactions} />
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                {r.manual}
              </Button>
              <Button variant="outline" size="icon" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{r.totalTransactions}</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{r.reconciled}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.rapprochees}</p>
                </div>
                <Check className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">{r.pending}</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.nonRapprochees}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{r.pendingAmount}</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.montantEnAttente)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>{r.bankTransactions}</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={r.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={r.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{r.statusAll}</SelectItem>
                    <SelectItem value="non_rapproche">{r.statusPending}</SelectItem>
                    <SelectItem value="rapproche">{r.statusReconciled}</SelectItem>
                    <SelectItem value="ignore">{r.statusIgnored}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{r.noTransactions}</p>
                <p className="text-sm mt-1">{r.importToStart}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{r.date}</TableHead>
                      <TableHead>{r.label}</TableHead>
                      <TableHead>{r.reference}</TableHead>
                      <TableHead className="text-right">{r.amount}</TableHead>
                      <TableHead>{r.status}</TableHead>
                      <TableHead>{r.score}</TableHead>
                      <TableHead className="text-right">{r.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const config = STATUS_CONFIG[transaction.statut_rapprochement] || STATUS_CONFIG.non_rapproche;
                      const StatusIcon = config.icon;

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(transaction.date_transaction), 'dd/MM/yyyy', { locale: dateLocale || undefined })}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate" title={transaction.libelle}>
                            {transaction.libelle}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {transaction.reference_bancaire || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            <span className={transaction.type_transaction === 'credit' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type_transaction === 'credit' ? '+' : '-'}
                              {formatCurrency(Number(transaction.montant))}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.score_confiance !== null ? (
                              <div className="flex items-center gap-1">
                                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      transaction.score_confiance >= 0.8 ? 'bg-green-500' :
                                      transaction.score_confiance >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${transaction.score_confiance * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(transaction.score_confiance * 100)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.statut_rapprochement === 'non_rapproche' && canManage && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenMatch(transaction)}
                                >
                                  <Link2 className="h-4 w-4 mr-1" />
                                  {r.reconcile}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleIgnore(transaction.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {transaction.statut_rapprochement === 'rapproche' && (
                              <span className="text-sm text-muted-foreground">
                                → {transaction.facture_id_suggeree}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Dialog */}
        <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{r.reconcileTransaction}</DialogTitle>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-4">
                {/* Transaction Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{r.date}</p>
                        <p className="font-medium">
                          {format(new Date(selectedTransaction.date_transaction), 'dd MMMM yyyy', { locale: dateLocale || undefined })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{r.amount}</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(Number(selectedTransaction.montant))}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">{r.label}</p>
                        <p className="font-medium">{selectedTransaction.libelle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Match Suggestions */}
                <div>
                  <h4 className="font-medium mb-3">{r.suggestedMatches}</h4>
                  {matchSuggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{r.noMatchFound}</p>
                      <p className="text-sm">{r.checkPendingInvoices}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matchSuggestions.map((match, index) => (
                        <Card 
                          key={index} 
                          className={`cursor-pointer transition-colors hover:border-primary ${
                            match.score >= 0.7 ? 'border-green-200 bg-green-50/50' : ''
                          }`}
                        >
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{match.client_nom}</span>
                                  <Badge variant="outline">
                                    {match.facture_id || match.bl_id}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {format(new Date(match.date_facture), 'dd/MM/yyyy', { locale: dateLocale || undefined })} • {formatCurrency(match.montant_facture)}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {match.motifs.map((motif, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {motif}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">{r.score}</p>
                                  <p className={`font-bold ${
                                    match.score >= 0.8 ? 'text-green-600' :
                                    match.score >= 0.5 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {Math.round(match.score * 100)}%
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmMatch(match)}
                                  disabled={confirming}
                                >
                                  {confirming ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      {r.confirm}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{r.importTransaction}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{r.date}</Label>
                  <Input
                    type="date"
                    value={importForm.date_transaction}
                    onChange={(e) => setImportForm({ ...importForm, date_transaction: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{r.type}</Label>
                  <Select 
                    value={importForm.type_transaction} 
                    onValueChange={(v) => setImportForm({ ...importForm, type_transaction: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">{r.credit}</SelectItem>
                      <SelectItem value="debit">{r.debit}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{r.amountMAD}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="ex: 15000.00"
                  value={importForm.montant}
                  onChange={(e) => setImportForm({ ...importForm, montant: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{r.labelRequired}</Label>
                <Textarea
                  placeholder={r.bankDescPlaceholder}
                  value={importForm.libelle}
                  onChange={(e) => setImportForm({ ...importForm, libelle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{r.bankReference}</Label>
                <Input
                  placeholder="ex: VIR-2025-001234"
                  value={importForm.reference_bancaire}
                  onChange={(e) => setImportForm({ ...importForm, reference_bancaire: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                {r.cancel}
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {r.import}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
