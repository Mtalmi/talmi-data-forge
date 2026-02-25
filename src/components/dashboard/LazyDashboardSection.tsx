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
        <button className="w-full flex items-center gap-3 py-4 px-5 rounded-[14px] group cursor-pointer select-none transition-all duration-500 hover:scale-[1.005]"
          style={{
            background: open 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)',
            border: '1px solid',
            borderColor: open ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(16px)',
            boxShadow: open ? '0 4px 24px rgba(0,0,0,0.15), 0 0 40px rgba(212,175,55,0.02)' : 'none',
          }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))',
            border: '1px solid rgba(212,175,55,0.1)',
          }}>
            <Icon className={cn(
              'h-3.5 w-3.5 transition-colors duration-300',
              open ? 'text-[#D4AF37]' : 'text-slate-500 group-hover:text-[#D4AF37]/60',
            )} />
          </div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{
            color: open ? 'rgba(212,175,55,0.7)' : 'rgba(148,163,184,0.5)',
          }}>
            {title}
          </h2>
          <div className="flex-1" />
          <ChevronDown className={cn(
            'h-3.5 w-3.5 transition-all duration-300',
            open ? 'rotate-180 text-[#D4AF37]/40' : 'text-slate-600'
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
