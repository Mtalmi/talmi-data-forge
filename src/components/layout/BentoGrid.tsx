import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Bento Grid Layout - Premium geometric tile system
 * Creates a clean, organized dashboard with tiles of different sizes
 */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn(
      'grid gap-4',
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6',
      'auto-rows-[minmax(120px,auto)]',
      className
    )}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** 
   * Span configuration for different breakpoints
   * Format: "col-span-X row-span-Y" or responsive like "lg:col-span-2"
   */
  span?: string;
  /** Optional zone styling */
  zone?: 'executive' | 'tactical' | 'forensic';
  /** Optional header */
  header?: ReactNode;
  /** Show gold border glow on hover */
  glow?: boolean;
}

export function BentoCard({ 
  children, 
  className, 
  span = 'col-span-1', 
  zone,
  header,
  glow = true,
}: BentoCardProps) {
  const zoneStyles = {
    executive: 'border-primary/20 hover:border-primary/40 hover:shadow-glow-gold',
    tactical: 'border-border/30 hover:border-accent/40 hover:shadow-glow',
    forensic: 'border-muted/30 hover:border-muted-foreground/20',
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-card/50 backdrop-blur-sm',
        'border transition-all duration-500',
        'p-4 lg:p-5',
        zone ? zoneStyles[zone] : 'border-border/30',
        glow && 'hover:shadow-glass',
        span,
        className
      )}
    >
      {/* Optional Header */}
      {header && (
        <div className="flex items-center justify-between mb-4">
          {header}
        </div>
      )}

      {/* Content */}
      {children}

      {/* Subtle Top Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
}

interface BentoSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  zone?: 'executive' | 'tactical' | 'forensic';
}

/**
 * Bento Section - Groups related cards with a header
 */
export function BentoSection({ 
  title, 
  subtitle, 
  icon, 
  children, 
  className,
  zone,
}: BentoSectionProps) {
  const zoneBadgeStyles = {
    executive: 'bg-primary/10 text-primary border-primary/20',
    tactical: 'bg-accent/10 text-accent border-accent/20',
    forensic: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <section className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            'p-2 rounded-xl border',
            zone ? zoneBadgeStyles[zone] : 'bg-muted/50 border-border'
          )}>
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Cards */}
      <BentoGrid>
        {children}
      </BentoGrid>
    </section>
  );
}
