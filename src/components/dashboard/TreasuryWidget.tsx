import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Wallet, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { InfoTooltip } from '@/components/academy/InfoTooltip';

interface PendingExpense {
  id: string;
  reference: string;
  description: string;
  montant_ttc: number;
  categorie: string;
  approval_level: 'level_1' | 'level_2' | 'level_3';
  statut: string;
  requested_by_name: string | null;
  requested_at: string;
  receipt_photo_url: string | null;
}

interface MonthlyStats {
  totalSpent: number;
  level1Spent: number;
  level1Cap: number;
  capExceeded: boolean;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

const levelLabels = {
  level_1: { label: 'L1', color: 'bg-success/20 text-success', desc: '≤2K' },
  level_2: { label: 'L2', color: 'bg-warning/20 text-warning', desc: '≤20K' },
  level_3: { label: 'L3', color: 'bg-destructive/20 text-destructive', desc: '>20K' },
};

export function TreasuryWidget() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalSpent: 0,
    level1Spent: 0,
    level1Cap: 15000,
    capExceeded: false,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });
  const [selectedExpense, setSelectedExpense] = useState<PendingExpense | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const monthYear = new Date().toISOString().slice(0, 7);
      const monthStart = `${monthYear}-01`;
      
      // Get pending expenses
      const { data: pending, error: pendingError } = await supabase
        .from('expenses_controlled')
        .select('id, reference, description, montant_ttc, categorie, approval_level, statut, requested_by_name, requested_at, receipt_photo_url')
        .in('statut', ['en_attente', 'bloque_plafond'])
        .order('requested_at', { ascending: false })
        .limit(10);

      if (pendingError) throw pendingError;
      setPendingExpenses((pending || []) as PendingExpense[]);

      // Get monthly cap
      const { data: capData } = await supabase
        .from('monthly_expense_caps')
        .select('level1_spent, level1_cap, cap_exceeded')
        .eq('month_year', monthYear)
        .single();

      // Get monthly stats
      const { data: monthlyData } = await supabase
        .from('expenses_controlled')
        .select('montant_ttc, statut, approval_level')
        .gte('requested_at', monthStart);

      const stats = (monthlyData || []).reduce((acc, exp) => {
        if (exp.statut === 'approuve' || exp.statut === 'paye') {
          acc.totalSpent += exp.montant_ttc;
          acc.approvedCount++;
        } else if (exp.statut === 'en_attente' || exp.statut === 'bloque_plafond') {
          acc.pendingCount++;
        } else if (exp.statut === 'rejete') {
          acc.rejectedCount++;
        }
        return acc;
      }, { totalSpent: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 });

      setMonthlyStats({
        ...stats,
        level1Spent: capData?.level1_spent || 0,
        level1Cap: capData?.level1_cap || 15000,
        capExceeded: capData?.cap_exceeded || false,
      });
    } catch (error) {
      console.error('Error fetching treasury data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('treasury_widget')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses_controlled' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleApprove = async (expense: PendingExpense) => {
    setApproving(true);
    try {
      const { error } = await supabase
        .from('expenses_controlled')
        .update({ statut: 'approuve' })
        .eq('id', expense.id);

      if (error) throw error;

      toast.success(`Dépense ${expense.reference} approuvée`);
      setSelectedExpense(null);
      fetchData();
    } catch (error: any) {
      console.error('Approval error:', error);
      if (error.message?.includes('CHAIN_OF_COMMAND')) {
        toast.error('Permission insuffisante pour ce niveau');
      } else {
        toast.error('Erreur lors de l\'approbation');
      }
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (expense: PendingExpense, reason: string) => {
    setApproving(true);
    try {
      const { error } = await supabase
        .from('expenses_controlled')
        .update({ 
          statut: 'rejete',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', expense.id);

      if (error) throw error;

      toast.success(`Dépense ${expense.reference} rejetée`);
      setSelectedExpense(null);
      fetchData();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setApproving(false);
    }
  };

  const capPercentage = Math.min(100, (monthlyStats.level1Spent / monthlyStats.level1Cap) * 100);

  return (
    <>
      <Card data-tour="expense-entry" className="glass-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center',
                monthlyStats.capExceeded 
                  ? 'bg-destructive/10 border border-destructive/20' 
                  : 'bg-primary/10 border border-primary/20'
              )}>
                <Wallet className={cn(
                  'h-5 w-5',
                  monthlyStats.capExceeded ? 'text-destructive' : 'text-primary'
                )} />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Trésorerie
                  <InfoTooltip
                    id="treasury-help"
                    title="Contrôle des Dépenses"
                    content="Ce widget affiche le plafond mensuel Level 1 (≤2000 MAD) et les dépenses en attente d'approbation. Quand le plafond est atteint, toutes les nouvelles dépenses sont automatiquement bloquées."
                    videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    steps={[
                      "Consultez le plafond Level 1 restant",
                      "Vérifiez les dépenses en attente",
                      "Cliquez sur une dépense pour voir les détails",
                      "Approuvez ou rejetez selon le justificatif"
                    ]}
                    position="bottom"
                  />
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Contrôle des Dépenses
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate('/depenses')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Monthly Level 1 Cap Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                Plafond Level 1
                {monthlyStats.capExceeded && (
                  <Badge variant="destructive" className="text-xs">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Dépassé
                  </Badge>
                )}
              </span>
              <span className={cn(
                'font-mono font-semibold',
                capPercentage >= 90 ? 'text-destructive' : capPercentage >= 70 ? 'text-warning' : 'text-success'
              )}>
                {monthlyStats.level1Spent.toLocaleString()} / {monthlyStats.level1Cap.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={capPercentage} 
              className={cn(
                'h-2',
                capPercentage >= 90 ? '[&>div]:bg-destructive' : capPercentage >= 70 ? '[&>div]:bg-warning' : '[&>div]:bg-success'
              )}
            />
            <p className="text-xs text-muted-foreground text-right">
              {(monthlyStats.level1Cap - monthlyStats.level1Spent).toLocaleString()} MAD restant
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="h-4 w-4 text-warning mx-auto mb-1" />
              <span className="text-lg font-bold">{monthlyStats.pendingCount}</span>
              <p className="text-[10px] text-muted-foreground">En attente</p>
            </div>
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success mx-auto mb-1" />
              <span className="text-lg font-bold">{monthlyStats.approvedCount}</span>
              <p className="text-[10px] text-muted-foreground">Approuvées</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
              <span className="text-lg font-bold font-mono text-xs">
                {(monthlyStats.totalSpent / 1000).toFixed(1)}K
              </span>
              <p className="text-[10px] text-muted-foreground">Ce mois</p>
            </div>
          </div>

          {/* Pending Approvals */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Approbations en attente
            </h4>
            <ScrollArea className="h-[160px]">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />
                  ))}
                </div>
              ) : pendingExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="h-8 w-8 text-success/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune approbation en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingExpenses.map((expense) => {
                    const level = levelLabels[expense.approval_level];
                    const isBlocked = expense.statut === 'bloque_plafond';

                    return (
                      <button
                        key={expense.id}
                        onClick={() => setSelectedExpense(expense)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg transition-all text-left hover:shadow-md',
                          isBlocked 
                            ? 'bg-destructive/10 border border-destructive/30' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Receipt className={cn(
                            'h-4 w-4 flex-shrink-0',
                            isBlocked ? 'text-destructive' : 'text-muted-foreground'
                          )} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs truncate">{expense.reference}</span>
                              <Badge className={cn('text-[10px] h-4', level.color)}>
                                {level.label}
                              </Badge>
                              {isBlocked && (
                                <Badge variant="destructive" className="text-[10px] h-4">
                                  Bloqué
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {expense.description}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-sm whitespace-nowrap">
                          {expense.montant_ttc.toLocaleString()} MAD
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Expense Detail Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="max-w-md">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  {selectedExpense.reference}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Receipt Photo */}
                {selectedExpense.receipt_photo_url && (
                  <img
                    src={selectedExpense.receipt_photo_url}
                    alt="Justificatif"
                    className="w-full h-48 object-contain bg-muted rounded-lg"
                  />
                )}

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant TTC:</span>
                    <span className="font-mono font-bold">
                      {selectedExpense.montant_ttc.toLocaleString()} MAD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catégorie:</span>
                    <Badge variant="outline">{selectedExpense.categorie}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niveau:</span>
                    <Badge className={levelLabels[selectedExpense.approval_level].color}>
                      {levelLabels[selectedExpense.approval_level].desc}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Demandé par:</span>
                    <span>{selectedExpense.requested_by_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(selectedExpense.requested_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                  </div>
                </div>

                <p className="text-sm">{selectedExpense.description}</p>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => handleReject(selectedExpense, 'Rejeté par CEO')}
                    disabled={approving}
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeter
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleApprove(selectedExpense)}
                    disabled={approving}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approuver
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
