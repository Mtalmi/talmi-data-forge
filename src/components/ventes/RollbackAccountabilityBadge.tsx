import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, AlertTriangle, XOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RollbackAccountabilityBadgeProps {
  rollbackCount: number | null | undefined;
  compact?: boolean;
}

/**
 * Public Accountability Badge - Shows the number of times a devis has been rolled back
 * 
 * Visual accountability levels:
 * - 0 corrections: No badge (Clean record)
 * - 1-2 corrections: Amber badge (Warning/Careless)
 * - 3+ corrections: Red badge (High Risk/Incompetence)
 * 
 * Visible to ALL roles as a permanent reminder of the quote's history
 */
export function RollbackAccountabilityBadge({ 
  rollbackCount, 
  compact = false 
}: RollbackAccountabilityBadgeProps) {
  const count = rollbackCount ?? 0;
  
  // No badge for clean records
  if (count === 0) return null;
  
  // Determine severity level
  const isHighRisk = count >= 3;
  const isWarning = count >= 1 && count < 3;
  
  const Icon = isHighRisk ? XOctagon : isWarning ? AlertTriangle : AlertCircle;
  
  const badgeClasses = cn(
    "gap-1 font-medium",
    isHighRisk 
      ? "bg-destructive/10 text-destructive border-destructive/30 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" 
      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
  );
  
  const label = compact 
    ? `${count}` 
    : `${count} ${count === 1 ? 'Correction' : 'Corrections'}`;
  
  const tooltipText = isHighRisk
    ? `⚠️ Risque élevé: Ce devis a été corrigé ${count} fois après approbation`
    : `Ce devis a été corrigé ${count} fois après approbation`;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline"
          className={badgeClasses}
        >
          <Icon className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className={cn(
          "max-w-xs",
          isHighRisk && "bg-destructive text-destructive-foreground"
        )}
      >
        <div className="space-y-1">
          <p className="font-medium">{tooltipText}</p>
          <p className="text-xs opacity-80">
            {isHighRisk 
              ? "Ce niveau de corrections suggère un problème de processus"
              : "Nombre de corrections après approbation initiale"
            }
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
