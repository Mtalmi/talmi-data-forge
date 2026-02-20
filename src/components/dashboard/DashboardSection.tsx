import { useState, ReactNode } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DashboardSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'warning' | 'destructive';
  defaultOpen?: boolean;
  storageKey?: string;
  className?: string;
}

export function DashboardSection({
  title,
  icon: Icon,
  children,
  badge,
  badgeVariant = 'default',
  defaultOpen = true,
  storageKey,
  className,
}: DashboardSectionProps) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`tbos_section_${storageKey}`);
      if (stored !== null) return stored === 'true';
    }
    return defaultOpen;
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (storageKey) {
      localStorage.setItem(`tbos_section_${storageKey}`, String(value));
    }
  };

  const badgeColors = {
    default: 'bg-primary/15 text-primary border-primary/20',
    warning: 'bg-warning/15 text-warning border-warning/20',
    destructive: 'bg-destructive/15 text-destructive border-destructive/20',
  };

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} className={cn('dashboard-section', className)}>
      {/* ── Section header — agency-grade ── */}
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-3 py-3 px-4 rounded-xl group cursor-pointer select-none',
            'transition-all duration-200',
            'hover:bg-primary/[0.03]',
          )}
          style={{
            background: open
              ? 'linear-gradient(90deg, hsl(var(--primary)/0.04) 0%, transparent 60%)'
              : 'transparent',
            borderBottom: '1px solid hsl(var(--border)/0.5)',
          }}
        >
          {/* Gold accent bar */}
          <span
            className="shrink-0 rounded-full transition-all duration-300"
            style={{
              width: 3,
              height: open ? 28 : 20,
              background: open
                ? 'linear-gradient(180deg, hsl(var(--primary)), hsl(var(--primary)/0.4))'
                : 'hsl(var(--border))',
              boxShadow: open ? '0 0 10px hsl(var(--primary)/0.4)' : 'none',
            }}
          />

          {/* Icon */}
          <div
            className={cn(
              'p-1.5 rounded-lg transition-all duration-300',
              open
                ? 'bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                : 'bg-muted/50 group-hover:bg-primary/8',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 transition-all duration-300',
                open ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
              )}
            />
          </div>

          {/* Title */}
          <h2
            className={cn(
              'text-sm font-bold uppercase tracking-[0.08em] transition-colors duration-200',
              open ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
            )}
          >
            {title}
          </h2>

          {/* Badge */}
          {badge !== undefined && (
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                badgeColors[badgeVariant],
              )}
            >
              {badge}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Chevron */}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-all duration-300 ease-out',
              open && 'rotate-180 text-primary',
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pt-4 pb-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
