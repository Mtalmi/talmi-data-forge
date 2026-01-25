import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingDown,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContractCompliance } from '@/hooks/useContractCompliance';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContractComplianceWidgetProps {
  onAddContract?: () => void;
}

export function ContractComplianceWidget({ onAddContract }: ContractComplianceWidgetProps) {
  const { stats, expirationAlerts, loading, refresh } = useContractCompliance();

  const complianceColor = stats.complianceRate >= 90 
    ? 'text-success' 
    : stats.complianceRate >= 70 
      ? 'text-warning' 
      : 'text-destructive';

  const complianceProgressColor = stats.complianceRate >= 90 
    ? '[&>div]:bg-success' 
    : stats.complianceRate >= 70 
      ? '[&>div]:bg-warning' 
      : '[&>div]:bg-destructive';

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center',
              stats.missingContracts > 0
                ? 'bg-warning/10 border border-warning/20'
                : 'bg-success/10 border border-success/20'
            )}>
              <FileText className={cn(
                'h-5 w-5',
                stats.missingContracts > 0 ? 'text-warning' : 'text-success'
              )} />
            </div>
            <div>
              <CardTitle className="text-base">
                Contrats Fournisseurs
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Conformité & Alertes
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
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
            {/* Compliance Score */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Taux de Conformité</span>
                <span className={cn("text-2xl font-bold", complianceColor)}>
                  {stats.complianceRate}%
                </span>
              </div>
              <Progress 
                value={stats.complianceRate} 
                className={cn("h-2", complianceProgressColor)} 
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{stats.activeContracts} contrats actifs</span>
                <span>{stats.missingContracts} contrats manquants</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total mensuel</span>
                </div>
                <p className="text-lg font-bold font-mono">
                  {stats.monthlyTotal.toLocaleString('fr-FR')}
                  <span className="text-xs font-normal text-muted-foreground ml-1">DH</span>
                </p>
              </div>

              <div className={cn(
                "p-3 rounded-lg border",
                stats.potentialNonDeductible > 0
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-success/10 border-success/30"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className={cn(
                    "h-4 w-4",
                    stats.potentialNonDeductible > 0 ? "text-destructive" : "text-success"
                  )} />
                  <span className="text-xs text-muted-foreground">Risque fiscal</span>
                </div>
                <p className={cn(
                  "text-lg font-bold font-mono",
                  stats.potentialNonDeductible > 0 ? "text-destructive" : "text-success"
                )}>
                  {stats.potentialNonDeductible.toLocaleString('fr-FR')}
                  <span className="text-xs font-normal text-muted-foreground ml-1">DH/an</span>
                </p>
              </div>
            </div>

            {/* Missing Contracts Alert */}
            {stats.missingContracts > 0 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-warning">
                    ⚠️ Contrats Manquants ({stats.missingContracts})
                  </span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                  <li>• BIGMOS - Trax 1 & 2 (70,000 DH/mois)</li>
                  <li>• VADINA - Terrain (20,000 DH/mois)</li>
                </ul>
                {onAddContract && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-warning text-warning hover:bg-warning/10"
                    onClick={onAddContract}
                  >
                    Ajouter Contrats Manquants
                  </Button>
                )}
              </div>
            )}

            {/* Expiration Alerts */}
            {expirationAlerts.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Alertes d'Expiration ({expirationAlerts.length})
                  </span>
                </div>
                <ScrollArea className="h-[100px]">
                  <div className="space-y-2">
                    {expirationAlerts.slice(0, 5).map((alert) => (
                      <ExpirationAlertCard key={alert.contractId} alert={alert} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-sm text-success font-medium">
                  Aucune expiration imminente
                </p>
                <p className="text-xs text-muted-foreground">
                  Tous les contrats actifs sont à jour
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ExpirationAlertCard({ alert }: { alert: { 
  contractId: string; 
  title: string; 
  providerName: string; 
  endDate: string; 
  daysUntilExpiration: number;
  alertType: 'expiring_30' | 'expiring_7' | 'expired';
}}) {
  const isExpired = alert.alertType === 'expired';
  const isUrgent = alert.alertType === 'expiring_7';

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      isExpired ? "bg-destructive/10 border-destructive/30" :
      isUrgent ? "bg-warning/10 border-warning/30" :
      "bg-muted/30 border-border/50"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.providerName}</p>
          <p className="text-xs text-muted-foreground truncate">{alert.title}</p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs ml-2",
            isExpired ? "border-destructive/50 text-destructive" :
            isUrgent ? "border-warning/50 text-warning" :
            "border-primary/50 text-primary"
          )}
        >
          {isExpired ? (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Expiré
            </>
          ) : (
            <>
              <Calendar className="h-3 w-3 mr-1" />
              {alert.daysUntilExpiration}j
            </>
          )}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {isExpired ? 'Expiré le' : 'Expire le'}{' '}
        {format(new Date(alert.endDate), 'dd/MM/yyyy', { locale: fr })}
      </p>
    </div>
  );
}
