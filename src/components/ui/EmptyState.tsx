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
        'flex flex-col items-center justify-center text-center animate-fade-in',
        variant === 'default' ? 'py-12 px-6' : 'py-8 px-4',
        className
      )}
    >
      <div
        className={cn(
          'rounded-2xl flex items-center justify-center mb-5 transition-all duration-500',
          variant === 'default' ? 'h-20 w-20' : 'h-14 w-14',
          'bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40',
          'shadow-[0_0_30px_hsl(var(--primary)/0.05)]'
        )}
      >
        <Icon
          className={cn(
            'text-muted-foreground/70',
            variant === 'default' ? 'h-9 w-9' : 'h-6 w-6'
          )}
        />
      </div>

      <h3
        className={cn(
          'font-bold text-foreground mb-1.5 tracking-tight',
          variant === 'default' ? 'text-lg' : 'text-base'
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'text-muted-foreground max-w-xs leading-relaxed',
          variant === 'default' ? 'text-sm mb-6' : 'text-xs mb-4'
        )}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size={variant === 'default' ? 'default' : 'sm'}
          className="gap-2 min-h-[44px] rounded-xl shadow-[0_4px_16px_hsl(var(--primary)/0.2)]"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// These configs are now deprecated in favor of t.emptyStates from i18n
// Kept for backward compatibility - consumers should migrate to useI18n()
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
