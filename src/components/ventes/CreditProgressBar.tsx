import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Ban, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticError, hapticWarning } from '@/lib/haptics';

interface CreditProgressBarProps {
  usedCredit: number;
  totalLimit: number;
  clientName?: string;
  showDerogationButton?: boolean;
  onRequestDerogation?: () => void;
  className?: string;
}

/**
 * Credit-Gate Visualization Component
 * Replaces text balances with visual progress bars
 * Shows [Used Credit] / [Total Limit]
 * Triggers derogation request when over limit
 */
export function CreditProgressBar({
  usedCredit,
  totalLimit,
  clientName,
  showDerogationButton = false,
  onRequestDerogation,
  className,
}: CreditProgressBarProps) {
  const percentage = totalLimit > 0 ? (usedCredit / totalLimit) * 100 : 0;
  const isOverLimit = usedCredit > totalLimit;
  const isNearLimit = percentage >= 80 && !isOverLimit;
  const available = Math.max(0, totalLimit - usedCredit);

  const getStatusConfig = () => {
    if (isOverLimit) {
      return {
        color: 'destructive',
        icon: Ban,
        label: 'Limite Dépassée',
        bgClass: 'bg-destructive/10 border-destructive/50',
        progressClass: '[&>div]:bg-destructive',
      };
    }
    if (isNearLimit) {
      return {
        color: 'warning',
        icon: AlertTriangle,
        label: 'Limite Proche',
        bgClass: 'bg-warning/10 border-warning/50',
        progressClass: '[&>div]:bg-warning',
      };
    }
    return {
      color: 'success',
      icon: Check,
      label: 'Crédit Sain',
      bgClass: 'bg-success/10 border-success/50',
      progressClass: '[&>div]:bg-success',
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        config.bgClass,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              'h-5 w-5',
              isOverLimit && 'text-destructive animate-pulse',
              isNearLimit && 'text-warning',
              !isOverLimit && !isNearLimit && 'text-success'
            )}
          />
          <div>
            {clientName && (
              <p className="text-xs text-muted-foreground">{clientName}</p>
            )}
            <p
              className={cn(
                'font-semibold text-sm',
                isOverLimit && 'text-destructive',
                isNearLimit && 'text-warning',
                !isOverLimit && !isNearLimit && 'text-foreground'
              )}
            >
              {config.label}
            </p>
          </div>
        </div>

        {/* Percentage Badge */}
        <div
          className={cn(
            'px-2 py-1 rounded text-xs font-mono font-bold',
            isOverLimit && 'bg-destructive text-destructive-foreground',
            isNearLimit && 'bg-warning text-warning-foreground',
            !isOverLimit && !isNearLimit && 'bg-success/20 text-success'
          )}
        >
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Progress Bar */}
      <Progress
        value={Math.min(100, percentage)}
        className={cn('h-3 mb-2', config.progressClass)}
      />

      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Utilisé:</span>
          <span
            className={cn(
              'font-mono font-semibold',
              isOverLimit && 'text-destructive'
            )}
          >
            {usedCredit.toLocaleString()} DH
          </span>
        </div>
        <div className="text-muted-foreground">
          Limite:{' '}
          <span className="font-mono font-semibold">
            {totalLimit.toLocaleString()} DH
          </span>
        </div>
      </div>

      {/* Available Credit */}
      {!isOverLimit && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Crédit Disponible:</span>
            <span className="font-mono font-semibold text-success">
              {available.toLocaleString()} DH
            </span>
          </div>
        </div>
      )}

      {/* Over Limit - Derogation Button */}
      {isOverLimit && showDerogationButton && (
        <div className="mt-3 pt-3 border-t border-destructive/30">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">
              Dépassement: {(usedCredit - totalLimit).toLocaleString()} DH
            </span>
          </div>
          <Button
            variant="destructive"
            className="w-full min-h-[48px] gap-2"
            onClick={() => {
              hapticWarning();
              onRequestDerogation?.();
            }}
          >
            <AlertTriangle className="h-4 w-4" />
            Demander Dérogation CEO
          </Button>
        </div>
      )}
    </div>
  );
}
