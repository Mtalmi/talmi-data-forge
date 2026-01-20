import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  variant?: 'default' | 'minimal';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variant === 'default' ? 'py-12 px-6' : 'py-8 px-4',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full bg-muted/50 flex items-center justify-center mb-4',
          variant === 'default' ? 'h-16 w-16' : 'h-12 w-12'
        )}
      >
        <Icon
          className={cn(
            'text-muted-foreground',
            variant === 'default' ? 'h-8 w-8' : 'h-6 w-6'
          )}
        />
      </div>

      <h3
        className={cn(
          'font-semibold text-foreground mb-2',
          variant === 'default' ? 'text-lg' : 'text-base'
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'text-muted-foreground max-w-sm mb-4',
          variant === 'default' ? 'text-sm' : 'text-xs'
        )}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size={variant === 'default' ? 'default' : 'sm'}
          className="gap-2 min-h-[44px]"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export const emptyStateConfigs = {
  noDeliveries: {
    title: 'Aucune livraison',
    description: 'Les livraisons du jour apparaîtront ici une fois planifiées.',
  },
  noProduction: {
    title: 'Aucun bon en production',
    description: 'Les bons passent ici après la planification pour saisir les consommations réelles.',
  },
  noClients: {
    title: 'Aucun client enregistré',
    description: 'Ajoutez votre premier client pour commencer à créer des commandes.',
  },
  noStock: {
    title: 'Stock non configuré',
    description: 'Configurez les niveaux de stock pour suivre les matières premières.',
  },
  noTests: {
    title: 'Aucun test programmé',
    description: 'Les tests d\'affaissement apparaîtront ici après les livraisons.',
  },
  noExpenses: {
    title: 'Aucune dépense enregistrée',
    description: 'Photographiez vos justificatifs pour enregistrer les dépenses.',
  },
  noDriverDeliveries: {
    title: 'Aucune livraison assignée',
    description: 'Sélectionnez votre camion pour voir vos livraisons du jour.',
  },
  noPending: {
    title: 'Tout est à jour',
    description: 'Il n\'y a aucune tâche en attente pour le moment.',
  },
};
