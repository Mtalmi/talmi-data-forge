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
    <Collapsible open={open} onOpenChange={handleOpenChange} className={className}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 py-3 px-1 group cursor-pointer select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
              {title}
            </h2>
          </div>

          {badge !== undefined && (
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
              badgeColors[badgeVariant]
            )}>
              {badge}
            </span>
          )}

          <div className="flex-1" />

          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pb-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
