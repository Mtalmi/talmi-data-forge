import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Award, Target, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CertificationStatus, ROLE_DISPLAY_NAMES, AppRole } from './rbac';

interface CertificationBadgeProps {
  status: CertificationStatus;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  userRole: AppRole | null;
  showDownload?: boolean;
  className?: string;
}

export function CertificationBadge({
  status,
  progress,
  userRole,
  showDownload = false,
  className,
}: CertificationBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'FULLY_CERTIFIED':
        return {
          icon: Trophy,
          label: 'Certifié TBOS',
          description: 'Formation complète',
          bgColor: 'bg-gradient-to-r from-amber-500 to-amber-600',
          textColor: 'text-white',
          iconColor: 'text-white',
          progressColor: 'bg-amber-500',
        };
      case 'PARTIALLY_CERTIFIED':
        return {
          icon: Target,
          label: 'En Formation',
          description: `${progress.completed}/${progress.total} modules complétés`,
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          textColor: 'text-amber-700 dark:text-amber-300',
          iconColor: 'text-amber-500',
          progressColor: 'bg-amber-500',
        };
      default:
        return {
          icon: Shield,
          label: 'Non Certifié',
          description: 'Commencez votre formation',
          bgColor: 'bg-muted/50',
          textColor: 'text-muted-foreground',
          iconColor: 'text-muted-foreground',
          progressColor: 'bg-muted',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      status === 'FULLY_CERTIFIED' 
        ? 'border-amber-400 dark:border-amber-600' 
        : 'border-border',
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            status === 'FULLY_CERTIFIED' 
              ? config.bgColor 
              : 'bg-muted'
          )}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>
          <div>
            <h3 className={cn(
              "font-semibold",
              status === 'FULLY_CERTIFIED' ? 'text-amber-600 dark:text-amber-400' : ''
            )}>
              {config.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
            {userRole && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Rôle: {ROLE_DISPLAY_NAMES[userRole]}
              </p>
            )}
          </div>
        </div>

        {status === 'FULLY_CERTIFIED' && showDownload && (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Certificat
          </Button>
        )}
      </div>

      {status !== 'FULLY_CERTIFIED' && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression obligatoire</span>
            <span className="font-mono font-medium">{progress.percentage}%</span>
          </div>
          <Progress 
            value={progress.percentage} 
            className="h-2"
            indicatorClassName={progress.percentage > 0 ? config.progressColor : ''}
          />
        </div>
      )}
    </div>
  );
}

interface CertificationMiniProps {
  status: CertificationStatus;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export function CertificationMini({ status, progress }: CertificationMiniProps) {
  if (status === 'FULLY_CERTIFIED') {
    return (
      <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
        <Trophy className="h-3 w-3" />
        Certifié TBOS
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Target className="h-3 w-3" />
      {progress.completed}/{progress.total} Modules
    </Badge>
  );
}
