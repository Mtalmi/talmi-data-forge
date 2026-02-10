import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ValidationResult } from '@/hooks/useAIDataGuard';

interface AIDataGuardBadgeProps {
  isValidating: boolean;
  result: ValidationResult | null;
  className?: string;
}

/**
 * Visual badge showing AI validation status on forms.
 */
export function AIDataGuardBadge({ isValidating, result, className }: AIDataGuardBadgeProps) {
  if (isValidating) {
    return (
      <Badge variant="outline" className={cn("gap-1.5 border-primary/50 text-primary animate-pulse", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-[10px]">AI Guard vérifie...</span>
      </Badge>
    );
  }

  if (!result) {
    return (
      <Badge variant="outline" className={cn("gap-1.5 border-border/50 text-muted-foreground", className)}>
        <Shield className="h-3 w-3" />
        <span className="text-[10px]">AI Guard prêt</span>
      </Badge>
    );
  }

  if (result.errors.length > 0) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Badge variant="destructive" className="gap-1.5">
          <XCircle className="h-3 w-3" />
          <span className="text-[10px]">🚫 BLOQUÉ - {result.errors.length} erreur(s)</span>
        </Badge>
        {result.errors.map((err, i) => (
          <p key={i} className="text-[10px] text-destructive pl-1">• {err}</p>
        ))}
      </div>
    );
  }

  if (result.warnings.length > 0) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Badge className="gap-1.5 bg-warning/20 text-warning border-warning/30">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-[10px]">⚠️ {result.warnings.length} avertissement(s)</span>
        </Badge>
        {result.warnings.map((w, i) => (
          <p key={i} className="text-[10px] text-warning pl-1">• {w}</p>
        ))}
        {result.suggestions.length > 0 && result.suggestions.map((s, i) => (
          <p key={i} className="text-[10px] text-muted-foreground pl-1 flex items-start gap-1">
            <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-primary" /> {s}
          </p>
        ))}
      </div>
    );
  }

  return (
    <Badge className={cn("gap-1.5 bg-success/20 text-success border-success/30", className)}>
      <CheckCircle className="h-3 w-3" />
      <span className="text-[10px]">✅ AI Vérifié</span>
    </Badge>
  );
}
