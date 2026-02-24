import { useState, ReactNode, Suspense } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LazyDashboardSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  className?: string;
}

function SectionSkeleton() {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2].map(i => (
          <div key={i} className="h-40 rounded-xl bg-white/[0.02] border border-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}

export function LazyDashboardSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  storageKey,
  className,
}: LazyDashboardSectionProps) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`tbos_section_${storageKey}`);
      if (stored !== null) return stored === 'true';
    }
    return defaultOpen;
  });

  const [hasBeenOpened, setHasBeenOpened] = useState(open);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value && !hasBeenOpened) setHasBeenOpened(true);
    if (storageKey) localStorage.setItem(`tbos_section_${storageKey}`, String(value));
  };

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} className={className}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 py-3 px-4 rounded-lg group cursor-pointer select-none border-l-2 border-primary/40 hover:bg-white/[0.02] transition-all duration-200">
          <Icon className={cn(
            'h-3.5 w-3.5 transition-colors duration-200',
            open ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400',
          )} />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {title}
          </h2>
          <div className="flex-1" />
          <ChevronDown className={cn(
            'h-3.5 w-3.5 text-slate-500 transition-transform duration-200',
            open && 'rotate-180'
          )} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pt-4 pb-2">
          {hasBeenOpened ? (
            <Suspense fallback={<SectionSkeleton />}>
              {children}
            </Suspense>
          ) : (
            <SectionSkeleton />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
