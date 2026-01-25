import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulationType } from './types';
import { 
  canAccessSimulation, 
  isMandatoryCertification, 
  getAccessDenialReason,
  AppRole,
  ROLE_DISPLAY_NAMES,
  getRequiredRoleForSimulation,
} from './rbac';

interface AccessBadgeProps {
  simulationType: SimulationType;
  userRole: AppRole | null;
  isCompleted: boolean;
  showMandatory?: boolean;
  className?: string;
}

export function AccessBadge({
  simulationType,
  userRole,
  isCompleted,
  showMandatory = true,
  className,
}: AccessBadgeProps) {
  const hasAccess = canAccessSimulation(userRole, simulationType);
  const isMandatory = isMandatoryCertification(userRole, simulationType);

  if (!hasAccess) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1 bg-muted/50 text-muted-foreground border-muted",
          className
        )}
      >
        <Lock className="h-3 w-3" />
        Restreint
      </Badge>
    );
  }

  if (isCompleted) {
    return (
      <Badge 
        className={cn(
          "gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300",
          className
        )}
      >
        <CheckCircle2 className="h-3 w-3" />
        Terminé
      </Badge>
    );
  }

  if (showMandatory && isMandatory) {
    return (
      <Badge 
        className={cn(
          "gap-1 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-300",
          className
        )}
      >
        <AlertCircle className="h-3 w-3" />
        Obligatoire
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        "gap-1 bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300",
        className
      )}
    >
      <Star className="h-3 w-3" />
      Accessible
    </Badge>
  );
}

interface RestrictedAccessCardProps {
  simulationType: SimulationType;
  userRole: AppRole | null;
  title: string;
  className?: string;
}

export function RestrictedAccessCard({
  simulationType,
  userRole,
  title,
  className,
}: RestrictedAccessCardProps) {
  const reason = getAccessDenialReason(userRole, simulationType);
  const requiredRoles = getRequiredRoleForSimulation(simulationType);

  return (
    <div className={cn(
      "p-4 rounded-xl border bg-muted/30 border-muted",
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">{title}</h4>
          <Badge variant="outline" className="mt-1 text-xs">
            Accès Restreint
          </Badge>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {reason}
      </p>

      {requiredRoles.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Rôles autorisés: </span>
          {requiredRoles.slice(0, 3).map(r => ROLE_DISPLAY_NAMES[r]).join(', ')}
          {requiredRoles.length > 3 && ` +${requiredRoles.length - 3} autres`}
        </div>
      )}

      {userRole && (
        <div className="mt-2 text-xs">
          <span className="text-muted-foreground">Votre rôle: </span>
          <span className="font-medium">{ROLE_DISPLAY_NAMES[userRole]}</span>
        </div>
      )}
    </div>
  );
}
