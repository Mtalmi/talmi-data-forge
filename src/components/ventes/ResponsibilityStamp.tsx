import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { User, CheckCircle, Shield, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ResponsibilityStampProps {
  actionType: 'validated' | 'technical_approved' | 'payment_recorded' | 'created';
  userName: string | null;
  userRole: string | null;
  timestamp: string | null;
  className?: string;
  compact?: boolean;
}

export function ResponsibilityStamp({
  actionType,
  userName,
  userRole,
  timestamp,
  className,
  compact = false,
}: ResponsibilityStampProps) {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const s = t.pages.responsibilityStamp;

  const ROLE_LABELS: Record<string, string> = {
    ceo: s.ceo,
    superviseur: s.supervisor,
    agent_administratif: s.adminAgent,
    directeur_operations: s.opsDirector,
    responsable_technique: s.techManager,
    centraliste: s.centralist,
    commercial: s.sales,
    accounting: s.accounting,
    auditeur: s.auditor,
  };

  const ACTION_CONFIG = {
    validated: {
      label: s.validatedBy,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    technical_approved: {
      label: s.technicallyApprovedBy,
      icon: Shield,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    payment_recorded: {
      label: s.paymentRecordedBy,
      icon: CreditCard,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    created: {
      label: s.createdBy,
      icon: User,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    },
  };

  if (!userName) return null;

  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;
  const roleLabel = userRole ? ROLE_LABELS[userRole] || userRole : '';
  const formattedDate = timestamp
    ? format(new Date(timestamp), "d MMM yyyy HH:mm", { locale: dateLocale || undefined })
    : '';

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('gap-1 cursor-help', config.bgColor, className)}>
            <Icon className={cn('h-3 w-3', config.color)} />
            <span className="text-xs">{userName}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{config.label}</p>
            <p>{userName} ({roleLabel})</p>
            {formattedDate && <p className="text-muted-foreground">{formattedDate}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 p-2 rounded-lg border', config.bgColor, className)}>
      <div className={cn('p-1.5 rounded-full', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{config.label}</p>
        <p className="text-sm font-medium truncate">
          {userName}
          {roleLabel && (
            <span className="text-muted-foreground font-normal"> ({roleLabel})</span>
          )}
        </p>
        {formattedDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formattedDate}
          </p>
        )}
      </div>
    </div>
  );
}
