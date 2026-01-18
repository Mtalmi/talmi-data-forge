import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Period = 'today' | 'week' | 'month';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const PERIODS: { value: Period; label: string; icon: React.ReactNode }[] = [
  { value: 'today', label: "Aujourd'hui", icon: <Calendar className="h-4 w-4" /> },
  { value: 'week', label: 'Cette Semaine', icon: <CalendarDays className="h-4 w-4" /> },
  { value: 'month', label: 'Ce Mois', icon: <CalendarRange className="h-4 w-4" /> },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {PERIODS.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(period.value)}
          className={cn(
            'gap-2 transition-all',
            value === period.value 
              ? 'shadow-sm' 
              : 'hover:bg-background/80'
          )}
        >
          {period.icon}
          <span className="hidden sm:inline">{period.label}</span>
        </Button>
      ))}
    </div>
  );
}
