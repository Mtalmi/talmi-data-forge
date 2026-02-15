import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ArrowRight, X } from 'lucide-react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

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
  const { t } = useI18n();
  const eq = t.expiringQuotes;

  const expiringQuotes = useMemo<ExpiringDevis[]>(() => {
    const today = new Date();
    return devisList
      .filter(d => d.statut === 'en_attente' && d.date_expiration)
      .map(devis => {
        const expirationDate = new Date(devis.date_expiration!);
        const daysLeft = differenceInDays(expirationDate, today);
        return { devis, daysLeft, isExpired: daysLeft < 0 };
      })
      .filter(item => item.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [devisList]);

  if (expiringQuotes.length === 0) return null;

  const expiredCount = expiringQuotes.filter(q => q.isExpired).length;
  const urgentCount = expiringQuotes.filter(q => !q.isExpired && q.daysLeft <= 2).length;
  const warningCount = expiringQuotes.filter(q => !q.isExpired && q.daysLeft > 2).length;
  const totalValue = expiringQuotes.reduce((sum, q) => sum + q.devis.total_ht, 0);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border p-4",
      expiredCount > 0 ? "bg-destructive/5 border-destructive/30" 
        : urgentCount > 0 ? "bg-warning/5 border-warning/30"
        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
    )}>
      {onDismiss && (
        <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-background/50" onClick={onDismiss}>
          <X className="h-3 w-3" />
        </Button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
          expiredCount > 0 ? "bg-destructive/10 text-destructive" 
            : urgentCount > 0 ? "bg-warning/10 text-warning"
            : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        )}>
          {expiredCount > 0 ? <AlertTriangle className="h-6 w-6 animate-pulse" /> : <Clock className="h-6 w-6" />}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold">
              {expiredCount > 0 ? eq.expiredTitle : eq.followUpTitle}
            </h4>
            <div className="flex items-center gap-1">
              {expiredCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {expiredCount} {expiredCount > 1 ? eq.expiredPlural : eq.expired}
                </Badge>
              )}
              {urgentCount > 0 && (
                <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/30">
                  <Clock className="h-3 w-3" />
                  {urgentCount} {urgentCount > 1 ? eq.urgentPlural : eq.urgent}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="gap-1 bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  {warningCount} {eq.toFollow}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {expiredCount > 0 
              ? eq.expiredNeedAction.replace('{count}', String(expiredCount))
              : eq.expiringIn7Days.replace('{count}', String(expiringQuotes.length))}
            {' '}
            <span className="font-medium">
              {eq.totalValue}: {totalValue.toLocaleString()} DH
            </span>
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            {expiringQuotes.slice(0, 3).map(({ devis, daysLeft, isExpired }) => (
              <div key={devis.id} className={cn(
                "text-xs px-2 py-1 rounded-md border",
                isExpired ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : daysLeft <= 2 ? "bg-warning/10 border-warning/30 text-warning"
                  : "bg-background border-border"
              )}>
                <span className="font-mono">{devis.devis_id}</span>
                <span className="mx-1">·</span>
                <span>{devis.client?.nom_client || 'Client'}</span>
                <span className="mx-1">·</span>
                <span className="font-medium">
                  {isExpired 
                    ? eq.expiredAgo.replace('{days}', String(Math.abs(daysLeft)))
                    : daysLeft === 0 ? eq.expiresToday
                    : eq.daysLeft.replace('{days}', String(daysLeft))}
                </span>
              </div>
            ))}
            {expiringQuotes.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">
                {eq.others.replace('{count}', String(expiringQuotes.length - 3))}
              </span>
            )}
          </div>
        </div>

        {onViewExpiring && (
          <Button variant={expiredCount > 0 ? "destructive" : "outline"} size="sm" onClick={onViewExpiring} className="gap-1 flex-shrink-0">
            {eq.viewAll}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
