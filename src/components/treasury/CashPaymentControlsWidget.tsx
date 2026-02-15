import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Banknote,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  FileText,
  ExternalLink,
  Building2,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCashPaymentControls, SupplierCashTracking } from '@/hooks/useCashPaymentControls';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

export function CashPaymentControlsWidget() {
  const { stats, loading, refresh, CASH_LIMIT } = useCashPaymentControls();
  const [refreshing, setRefreshing] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: dateLocale });

  return (
    <>
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center',
                stats.suppliersExceedingLimit.length > 0
                  ? 'bg-destructive/10 border border-destructive/20'
                  : 'bg-success/10 border border-success/20'
              )}>
                <Banknote className={cn(
                  'h-5 w-5',
                  stats.suppliersExceedingLimit.length > 0 ? 'text-destructive' : 'text-success'
                )} />
              </div>
              <div>
                <CardTitle className="text-base">
                  Contrôle Paiements Espèces
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {currentMonth}
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
                onClick={() => setShowReport(true)}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Espèces ce mois</span>
                  </div>
                  <p className="text-lg font-bold font-mono">
                    {stats.totalCashPaymentsThisMonth.toLocaleString('fr-FR')}
                    <span className="text-xs font-normal text-muted-foreground ml-1">DH</span>
                  </p>
                </div>

                <div className={cn(
                  "p-3 rounded-lg border",
                  stats.totalPenaltiesThisMonth > 0
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-success/10 border-success/30"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className={cn(
                      "h-4 w-4",
                      stats.totalPenaltiesThisMonth > 0 ? "text-destructive" : "text-success"
                    )} />
                    <span className="text-xs text-muted-foreground">Pénalités</span>
                  </div>
                  <p className={cn(
                    "text-lg font-bold font-mono",
                    stats.totalPenaltiesThisMonth > 0 ? "text-destructive" : "text-success"
                  )}>
                    {stats.totalPenaltiesThisMonth.toLocaleString('fr-FR')}
                    <span className="text-xs font-normal text-muted-foreground ml-1">DH</span>
                  </p>
                </div>
              </div>

              {/* Potential Savings */}
              {stats.potentialSavings > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      Économies potentielles: {stats.potentialSavings.toLocaleString('fr-FR')} DH
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Utilisez des virements bancaires pour éviter les pénalités
                  </p>
                </div>
              )}

              {/* Suppliers Exceeding Limit */}
              {stats.suppliersExceedingLimit.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">
                      Fournisseurs dépassant limite ({stats.suppliersExceedingLimit.length})
                    </span>
                  </div>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {stats.suppliersExceedingLimit.map((tracking) => (
                        <SupplierLimitCard key={tracking.id} tracking={tracking} limit={CASH_LIMIT} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
                  <Building2 className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-sm text-success font-medium">
                    Aucun dépassement de limite
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tous les paiements espèces sont sous le seuil de {CASH_LIMIT.toLocaleString('fr-FR')} DH
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Rapport Mensuel - Paiements en Espèces
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-lg font-semibold">{currentMonth}</p>
            </div>

            {/* Summary Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-3">Métrique</th>
                    <th className="text-right p-3">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">Total Paiements en Espèces</td>
                    <td className="p-3 text-right font-mono">
                      {stats.totalCashPaymentsThisMonth.toLocaleString('fr-FR')} DH
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">Total Pénalités (6%)</td>
                    <td className={cn(
                      "p-3 text-right font-mono",
                      stats.totalPenaltiesThisMonth > 0 && "text-destructive"
                    )}>
                      {stats.totalPenaltiesThisMonth.toLocaleString('fr-FR')} DH
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">Total Droits de Timbre (0.25%)</td>
                    <td className={cn(
                      "p-3 text-right font-mono",
                      stats.totalStampDutyThisMonth > 0 && "text-destructive"
                    )}>
                      {stats.totalStampDutyThisMonth.toLocaleString('fr-FR')} DH
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/20">
                    <td className="p-3 font-semibold">Impact Financier Total</td>
                    <td className={cn(
                      "p-3 text-right font-mono font-bold text-lg",
                      stats.potentialSavings > 0 ? "text-destructive" : "text-success"
                    )}>
                      {stats.potentialSavings.toLocaleString('fr-FR')} DH
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Suppliers Detail */}
            {stats.suppliersExceedingLimit.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Fournisseurs en Dépassement</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3">Fournisseur</th>
                        <th className="text-right p-3">Cumul</th>
                        <th className="text-right p-3">Dépassement</th>
                        <th className="text-right p-3">Pénalité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.suppliersExceedingLimit.map((tracking) => (
                        <tr key={tracking.id} className="border-t">
                          <td className="p-3">{tracking.fournisseur_nom}</td>
                          <td className="p-3 text-right font-mono">
                            {tracking.total_cash_amount.toLocaleString('fr-FR')} DH
                          </td>
                          <td className="p-3 text-right font-mono text-destructive">
                            {(tracking.total_cash_amount - CASH_LIMIT).toLocaleString('fr-FR')} DH
                          </td>
                          <td className="p-3 text-right font-mono text-destructive">
                            {tracking.penalty_incurred.toLocaleString('fr-FR')} DH
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-sm font-medium mb-2">💡 Recommandation</p>
              <p className="text-sm text-muted-foreground">
                Utilisez des virements bancaires pour les montants &gt;50,000 DH/mois/fournisseur 
                pour éviter les pénalités et assurer la conformité avec la loi marocaine.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SupplierLimitCard({ tracking, limit }: { tracking: SupplierCashTracking; limit: number }) {
  const excess = tracking.total_cash_amount - limit;
  const percentage = Math.min(100, (tracking.total_cash_amount / limit) * 100);

  return (
    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium truncate max-w-[150px]">
          {tracking.fournisseur_nom}
        </span>
        <Badge variant="destructive" className="text-xs">
          +{excess.toLocaleString('fr-FR')} DH
        </Badge>
      </div>
      <Progress value={percentage} className="h-1.5 [&>div]:bg-destructive" />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>{tracking.total_cash_amount.toLocaleString('fr-FR')} DH</span>
        <span className="text-destructive">
          Pénalité: {tracking.penalty_incurred.toLocaleString('fr-FR')} DH
        </span>
      </div>
    </div>
  );
}
