import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentTracking } from '@/hooks/usePaymentTracking';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Banknote,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Building2,
  Receipt,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashCreditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashCreditDrawer({ open, onOpenChange }: CashCreditDrawerProps) {
  const navigate = useNavigate();
  const { payments, stats, loading } = usePaymentTracking();

  // Calculate cash vs credit breakdown
  const cashPayments = payments.filter(p => 
    (p.mode_paiement === 'especes' || p.mode_paiement === 'cash') && p.statut_paiement === 'Payé'
  );
  const creditPayments = payments.filter(p => 
    p.mode_paiement !== 'especes' && p.mode_paiement !== 'cash'
  );
  
  const cashAmount = cashPayments.reduce((sum, p) => sum + (p.total_ht || 0), 0);
  const creditAmount = creditPayments.reduce((sum, p) => sum + (p.total_ht || 0), 0);
  const totalAmount = cashAmount + creditAmount;
  const cashRatio = totalAmount > 0 ? (cashAmount / totalAmount) * 100 : 0;

  // Payment mode breakdown from stats
  const modeBreakdown = [
    { mode: 'Espèces', icon: Banknote, amount: stats?.paymentModeBreakdown?.find(m => m.mode === 'especes' || m.mode === 'cash')?.total || 0, color: 'text-success' },
    { mode: 'Virement', icon: Building2, amount: stats?.paymentModeBreakdown?.find(m => m.mode === 'virement')?.total || 0, color: 'text-primary' },
    { mode: 'Chèque', icon: Receipt, amount: stats?.paymentModeBreakdown?.find(m => m.mode === 'cheque')?.total || 0, color: 'text-warning' },
    { mode: 'Traite', icon: Clock, amount: stats?.paymentModeBreakdown?.find(m => m.mode === 'traite')?.total || 0, color: 'text-muted-foreground' },
  ];

  // Top overdue clients
  const overduePayments = payments
    .filter(p => p.statut_paiement !== 'Payé' && (p.days_overdue || 0) > 0)
    .sort((a, b) => (b.total_ht || 0) - (a.total_ht || 0))
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' DH';
  };

  const handleGoToPayments = () => {
    onOpenChange(false);
    navigate('/paiements');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Analyse Cash / Crédit
          </DrawerTitle>
          <DrawerDescription>
            Vue détaillée des encaissements et créances
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Cash vs Credit Ratio */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ratio Cash / Total</span>
                    <Badge variant={cashRatio >= 70 ? 'default' : cashRatio >= 50 ? 'secondary' : 'destructive'}>
                      {cashRatio.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={cashRatio} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3 w-3 text-success" />
                      Cash: {formatCurrency(cashAmount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-warning" />
                      Crédit: {formatCurrency(creditAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Mode Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Répartition par Mode
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {modeBreakdown.map(({ mode, icon: Icon, amount, color }) => (
                    <Card key={mode} className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">{mode}</p>
                          <p className="text-sm font-semibold tabular-nums">{formatCurrency(amount)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Top Overdue Clients */}
              {overduePayments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Top 5 Clients en Retard
                  </h4>
                  <div className="space-y-2">
                    {overduePayments.map((payment, index) => (
                      <Card key={payment.bl_id} className={cn(
                        'border-border/50',
                        (payment.days_overdue || 0) > 30 && 'border-destructive/30 bg-destructive/5'
                      )}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{payment.client_nom}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.days_overdue} jours de retard
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-destructive tabular-nums">
                              {formatCurrency(payment.total_ht || 0)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <Card className="border-success/20 bg-success/5">
                  <CardContent className="p-3 text-center">
                    <TrendingUp className="h-4 w-4 mx-auto text-success mb-1" />
                    <p className="text-lg font-bold text-success tabular-nums">
                      {formatCurrency(stats?.totalPaid || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Encaissé</p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-3 text-center">
                    <TrendingDown className="h-4 w-4 mx-auto text-destructive mb-1" />
                    <p className="text-lg font-bold text-destructive tabular-nums">
                      {formatCurrency(stats?.totalOverdue || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">En Retard</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        <DrawerFooter className="pt-2">
          <Button onClick={handleGoToPayments} className="w-full">
            Voir Tous les Paiements
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
