import { Search, Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductionSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: { from: Date | null; to: Date | null };
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
}

export function ProductionSearchBar({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: ProductionSearchBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const quickRanges = [
    { label: "Aujourd'hui", days: 0 },
    { label: '7 jours', days: 7 },
    { label: '30 jours', days: 30 },
  ];

  const handleQuickRange = (days: number) => {
    if (days === 0) {
      const today = new Date();
      onDateRangeChange({ from: startOfDay(today), to: endOfDay(today) });
    } else {
      onDateRangeChange({ 
        from: subDays(new Date(), days), 
        to: new Date() 
      });
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onDateRangeChange({ from: null, to: null });
  };

  const hasFilters = searchQuery || dateRange.from || dateRange.to;

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher BL, BC, client, formule..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Date Range Picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Calendar className="h-4 w-4" />
            {dateRange.from ? (
              dateRange.to && dateRange.from !== dateRange.to ? (
                <span className="text-xs">
                  {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                </span>
              ) : (
                <span className="text-xs">{format(dateRange.from, 'dd/MM/yyyy')}</span>
              )
            ) : (
              <span className="text-xs hidden sm:inline">Période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-2 border-b flex gap-1">
            {quickRanges.map(({ label, days }) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  handleQuickRange(days);
                  setCalendarOpen(false);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <CalendarComponent
            mode="range"
            selected={{ from: dateRange.from || undefined, to: dateRange.to || undefined }}
            onSelect={(range) => {
              onDateRangeChange({ from: range?.from || null, to: range?.to || null });
              if (range?.to) setCalendarOpen(false);
            }}
            locale={undefined}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-3 w-3" />
          <span className="text-xs">Effacer</span>
        </Button>
      )}
    </div>
  );
}
