import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

export type Period = 'today' | 'week' | 'month';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useI18n();

  const PERIODS: { value: Period; label: string; icon: React.ReactNode }[] = [
    { value: 'today', label: t.dashboard.period.today, icon: <Calendar className="h-4 w-4" /> },
    { value: 'week', label: t.dashboard.period.thisWeek, icon: <CalendarDays className="h-4 w-4" /> },
    { value: 'month', label: t.dashboard.period.thisMonth, icon: <CalendarRange className="h-4 w-4" /> },
  ];

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-muted/50 rounded-lg">
      {PERIODS.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(period.value)}
          className={cn(
            'gap-1.5 transition-all px-2 sm:px-3 h-8 sm:h-9',
            value === period.value 
              ? 'shadow-sm' 
              : 'hover:bg-background/80'
          )}
        >
          {period.icon}
          <span className="hidden sm:inline text-xs">{period.label}</span>
        </Button>
      ))}
    </div>
  );
}
