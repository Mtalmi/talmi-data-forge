import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceType } from '@/hooks/useDeviceType';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface ResponsiveCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

/**
 * Responsive card component optimized for mobile touch targets
 * - Stacks nicely on mobile instead of tables
 * - 48px+ touch targets for all interactive elements
 * - Status indicators with proper contrast
 */
export function ResponsiveCard({
  title,
  subtitle,
  icon,
  badge,
  children,
  actions,
  onClick,
  selected,
  className,
  status = 'default',
}: ResponsiveCardProps) {
  const { isMobile } = useDeviceType();

  const statusStyles = {
    default: '',
    success: 'border-l-4 border-l-success',
    warning: 'border-l-4 border-l-warning',
    error: 'border-l-4 border-l-destructive',
    info: 'border-l-4 border-l-primary',
  };

  return (
    <Card
      className={cn(
        "glass-card transition-all duration-200",
        onClick && "cursor-pointer hover:bg-muted/30 active:scale-[0.98]",
        selected && "ring-2 ring-primary bg-primary/5",
        statusStyles[status],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
              {subtitle && (
                <CardDescription className="text-sm mt-0.5 truncate">{subtitle}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {badge}
            {onClick && (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {children && (
        <CardContent className="p-4 pt-2">
          {children}
        </CardContent>
      )}

      {actions && (
        <CardFooter className="p-4 pt-2 flex flex-wrap gap-2">
          {actions}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Responsive action button with 48px touch target
 */
interface ResponsiveActionProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ResponsiveAction({
  children,
  onClick,
  variant = 'default',
  icon,
  className,
  disabled,
}: ResponsiveActionProps) {
  const variantStyles = {
    default: 'bg-muted/50 hover:bg-muted text-foreground',
    primary: 'bg-primary/20 hover:bg-primary/30 text-primary',
    success: 'bg-success/20 hover:bg-success/30 text-success',
    warning: 'bg-warning/20 hover:bg-warning/30 text-warning',
    destructive: 'bg-destructive/20 hover:bg-destructive/30 text-destructive',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      disabled={disabled}
      className={cn(
        // 48px minimum touch target
        "min-h-[48px] min-w-[48px] px-4 py-2",
        "inline-flex items-center justify-center gap-2",
        "rounded-lg text-sm font-medium transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none",
        "active:scale-95",
        variantStyles[variant],
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
