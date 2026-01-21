import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ArrowRight, X } from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExpiringQuotesAlertProps {
  devisList: Devis[];
  onViewExpiring?: () => void;
  onDismiss?: () => void;
}

interface ExpiringDevis {
  devis: Devis;
  daysLeft: number;
  isExpired: boolean;
}

export function ExpiringQuotesAlert({ devisList, onViewExpiring, onDismiss }: ExpiringQuotesAlertProps) {
  const expiringQuotes = useMemo<ExpiringDevis[]>(() => {
    const today = new Date();
    
    return devisList
      .filter(d => d.statut === 'en_attente' && d.date_expiration)
      .map(devis => {
        const expirationDate = new Date(devis.date_expiration!);
        const daysLeft = differenceInDays(expirationDate, today);
        return {
          devis,
          daysLeft,
          isExpired: daysLeft < 0,
        };
      })
      .filter(item => item.daysLeft <= 7) // Show only expiring within 7 days or expired
      .sort((a, b) => a.daysLeft - b.daysLeft); // Sort by urgency
  }, [devisList]);

  if (expiringQuotes.length === 0) {
    return null;
  }

  const expiredCount = expiringQuotes.filter(q => q.isExpired).length;
  const urgentCount = expiringQuotes.filter(q => !q.isExpired && q.daysLeft <= 2).length;
  const warningCount = expiringQuotes.filter(q => !q.isExpired && q.daysLeft > 2).length;

  const totalValue = expiringQuotes.reduce((sum, q) => sum + q.devis.total_ht, 0);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border p-4",
      expiredCount > 0 
        ? "bg-destructive/5 border-destructive/30" 
        : urgentCount > 0 
          ? "bg-warning/5 border-warning/30"
          : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
    )}>
      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-background/50"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
          expiredCount > 0 
            ? "bg-destructive/10 text-destructive" 
            : urgentCount > 0 
              ? "bg-warning/10 text-warning"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        )}>
          {expiredCount > 0 ? (
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          ) : (
            <Clock className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold">
              {expiredCount > 0 
                ? 'Devis Expirés' 
                : 'Devis à Relancer'}
            </h4>
            <div className="flex items-center gap-1">
              {expiredCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {expiredCount} expiré{expiredCount > 1 ? 's' : ''}
                </Badge>
              )}
              {urgentCount > 0 && (
                <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/30">
                  <Clock className="h-3 w-3" />
                  {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="gap-1 bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  {warningCount} à suivre
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {expiredCount > 0 
              ? `${expiredCount} devis ont expiré et nécessitent une action immédiate.`
              : `${expiringQuotes.length} devis expirent dans les 7 prochains jours.`}
            {' '}
            <span className="font-medium">
              Valeur totale: {totalValue.toLocaleString()} DH
            </span>
          </p>

          {/* Quick preview of first 3 */}
          <div className="flex flex-wrap gap-2 mt-2">
            {expiringQuotes.slice(0, 3).map(({ devis, daysLeft, isExpired }) => (
              <div 
                key={devis.id}
                className={cn(
                  "text-xs px-2 py-1 rounded-md border",
                  isExpired 
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : daysLeft <= 2
                      ? "bg-warning/10 border-warning/30 text-warning"
                      : "bg-background border-border"
                )}
              >
                <span className="font-mono">{devis.devis_id}</span>
                <span className="mx-1">·</span>
                <span>{devis.client?.nom_client || 'Client'}</span>
                <span className="mx-1">·</span>
                <span className="font-medium">
                  {isExpired 
                    ? `Expiré il y a ${Math.abs(daysLeft)}j`
                    : daysLeft === 0 
                      ? "Expire aujourd'hui!"
                      : `${daysLeft}j restants`}
                </span>
              </div>
            ))}
            {expiringQuotes.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">
                +{expiringQuotes.length - 3} autres
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {onViewExpiring && (
          <Button 
            variant={expiredCount > 0 ? "destructive" : "outline"}
            size="sm"
            onClick={onViewExpiring}
            className="gap-1 flex-shrink-0"
          >
            Voir tout
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
