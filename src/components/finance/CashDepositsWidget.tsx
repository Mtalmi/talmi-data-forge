import { useState } from 'react';
import { useCashDeposits } from '@/hooks/useCashDeposits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  Eye,
  Shield,
  TrendingUp,
  Calendar,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';

const SOURCE_LABELS: Record<string, string> = {
  customer_payment: 'Paiement Client',
  ceo_injection: 'Injection CEO',
  refund: 'Remboursement',
  loan: 'Prêt Reçu',
  other: 'Autre',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  justified: { 
    label: 'Justifié', 
    color: 'bg-success/10 text-success border-success/30', 
    icon: <CheckCircle className="h-3 w-3" /> 
  },
  pending: { 
    label: 'En Attente', 
    color: 'bg-warning/10 text-warning border-warning/30', 
    icon: <AlertTriangle className="h-3 w-3" /> 
  },
  unjustified: { 
    label: 'Non Justifié', 
    color: 'bg-destructive/10 text-destructive border-destructive/30', 
    icon: <XCircle className="h-3 w-3" /> 
  },
  flagged: { 
    label: 'Signalé', 
    color: 'bg-destructive/10 text-destructive border-destructive/30', 
    icon: <AlertTriangle className="h-3 w-3" /> 
  },
};

const RISK_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: 'text-success', bg: 'bg-success/10' },
  medium: { color: 'text-warning', bg: 'bg-warning/10' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  critical: { color: 'text-destructive', bg: 'bg-destructive/10' },
};

export function CashDepositsWidget() {
  const { 
    deposits, 
    stats, 
    monthlySummary,
    loading, 
    canApprove,
    refresh, 
    getRiskIndicators,
    approveDeposit,
  } = useCashDeposits();
  
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [showReport, setShowReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const riskIndicators = getRiskIndicators();
  const hasRisks = riskIndicators.length > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleApprove = async (depositId: string) => {
    setApprovingId(depositId);
    await approveDeposit(depositId);
    setApprovingId(null);
  };

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-MA')} DH`;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(
        "transition-all duration-300",
        hasRisks && "border-warning/50 shadow-[0_0_15px_hsl(var(--warning)/0.1)]"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                hasRisks ? "bg-warning/10" : "bg-emerald-500/10"
              )}>
                <PiggyBank className={cn(
                  "h-5 w-5",
                  hasRisks ? "text-warning" : "text-emerald-500"
                )} />
              </div>
              Dépôts de Trésorerie
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Dépôts ce mois</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalAmountThisMonth)}</p>
              <p className="text-xs text-muted-foreground">{stats.totalDepositsThisMonth} dépôts</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Taux Justification</p>
              <p className={cn(
                "text-lg font-bold",
                stats.justificationRate >= 90 ? "text-success" :
                stats.justificationRate >= 70 ? "text-warning" :
                "text-destructive"
              )}>
                {stats.justificationRate}%
              </p>
              <Progress 
                value={stats.justificationRate} 
                className="h-1.5 mt-1"
              />
            </div>
          </div>

          {/* Justification Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-success">
                <CheckCircle className="h-4 w-4" />
                Justifiés
              </span>
              <span className="font-medium">{formatCurrency(stats.justifiedAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Non-Justifiés
              </span>
              <span className="font-medium">{formatCurrency(stats.unjustifiedAmount)}</span>
            </div>
            {stats.pendingReview > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  En Attente Vérification
                </span>
                <Badge variant="outline" className="text-xs">
                  {stats.pendingReview}
                </Badge>
              </div>
            )}
          </div>

          {/* Risk Indicators */}
          {hasRisks && (
            <div className="space-y-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <p className="text-xs font-semibold text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Patterns Suspects Détectés
              </p>
              {riskIndicators.slice(0, 2).map((indicator, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "text-xs p-2 rounded",
                    RISK_CONFIG[indicator.risk]?.bg || 'bg-muted'
                  )}
                >
                  <span className={RISK_CONFIG[indicator.risk]?.color}>
                    {indicator.message}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency(indicator.amount)})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Unjustified Deposits Quick List */}
          {stats.flaggedDeposits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-destructive">
                Dépôts Signalés ({stats.flaggedDeposits.length})
              </p>
              {stats.flaggedDeposits.slice(0, 2).map((deposit) => (
                <div 
                  key={deposit.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(deposit.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(deposit.deposit_date), 'd MMM yyyy', { locale: dateLocale })}
                    </p>
                  </div>
                  {canApprove && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(deposit.id)}
                      disabled={approvingId === deposit.id}
                      className="text-xs h-7"
                    >
                      {approvingId === deposit.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Justifier
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowReport(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir Rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-500" />
              Rapport Dépôts de Trésorerie
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Monthly Summary */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Résumé Mensuel
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-right">Dépôts</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Justifiés</TableHead>
                      <TableHead className="text-right">Non-Justifiés</TableHead>
                      <TableHead className="text-right">Taux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlySummary.slice(0, 6).map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {format(new Date(month.month), 'MMMM yyyy', { locale: dateLocale })}
                        </TableCell>
                        <TableCell className="text-right">{month.total_deposits}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.total_amount)}</TableCell>
                        <TableCell className="text-right text-success">
                          {formatCurrency(month.justified_amount)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(month.unjustified_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={
                            month.justification_rate >= 90 ? 'default' :
                            month.justification_rate >= 70 ? 'secondary' :
                            'destructive'
                          }>
                            {month.justification_rate || 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Detailed Deposits */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Dépôts du Mois en Cours
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Justification</TableHead>
                      <TableHead>Statut</TableHead>
                      {canApprove && <TableHead>Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((deposit) => {
                      const status = STATUS_CONFIG[deposit.justification_status || 'pending'];
                      return (
                        <TableRow key={deposit.id}>
                          <TableCell>
                            {format(new Date(deposit.deposit_date), 'd MMM', { locale: dateLocale })}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {deposit.reference}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(deposit.amount)}
                          </TableCell>
                          <TableCell>
                            {SOURCE_LABELS[deposit.source_type] || deposit.source_type}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {deposit.facture_id || deposit.source_description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status?.color}>
                              {status?.icon}
                              <span className="ml-1">{status?.label}</span>
                            </Badge>
                          </TableCell>
                          {canApprove && (
                            <TableCell>
                              {deposit.justification_status !== 'justified' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(deposit.id)}
                                  disabled={approvingId === deposit.id}
                                  className="h-7 text-xs"
                                >
                                  {approvingId === deposit.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    {deposits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canApprove ? 7 : 6} className="text-center py-8 text-muted-foreground">
                          Aucun dépôt ce mois
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Risk Patterns */}
            {hasRisks && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Patterns Suspects Détectés
                </h3>
                <div className="space-y-2">
                  {riskIndicators.map((indicator, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-lg border",
                        RISK_CONFIG[indicator.risk]?.bg
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("font-medium", RISK_CONFIG[indicator.risk]?.color)}>
                          {indicator.message}
                        </span>
                        <Badge variant="outline" className={RISK_CONFIG[indicator.risk]?.color}>
                          Risque {indicator.risk === 'critical' ? 'Critique' : 
                                  indicator.risk === 'high' ? 'Élevé' : 
                                  indicator.risk === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency(indicator.amount)} • {indicator.deposits.length} dépôt(s)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Summary */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Résumé Conformité
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Dépôts</p>
                  <p className="text-lg font-bold">{stats.totalDepositsThisMonth}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Justifiés</p>
                  <p className="text-lg font-bold text-success">
                    {stats.totalDepositsThisMonth - stats.pendingReview - stats.flaggedDeposits.length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">En Attente</p>
                  <p className="text-lg font-bold text-warning">{stats.pendingReview}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Signalés</p>
                  <p className="text-lg font-bold text-destructive">{stats.flaggedDeposits.length}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className={cn(
                  "text-sm font-medium",
                  stats.justificationRate >= 90 ? "text-success" :
                  stats.justificationRate >= 70 ? "text-warning" :
                  "text-destructive"
                )}>
                  Status: {stats.justificationRate >= 90 ? '✅ CONFORME' :
                          stats.justificationRate >= 70 ? '⚠️ PARTIELLEMENT CONFORME' :
                          '❌ NON CONFORME'}
                  {' '}({stats.justificationRate}% justifiés)
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
