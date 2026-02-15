import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Filter, X, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

export interface VentesFilterState {
  search: string;
  status: string;
  clientId: string;
  formuleId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  volumeMin: string;
  volumeMax: string;
}

interface VentesFiltersProps {
  filters: VentesFilterState;
  onFiltersChange: (filters: VentesFilterState) => void;
  clients: { client_id: string; nom_client: string }[];
  formules: { formule_id: string; designation: string }[];
  isRefreshing: boolean;
  lastRefresh: Date | null;
  onRefresh: () => void;
  autoRefreshEnabled: boolean;
  onAutoRefreshToggle: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export const defaultFilters: VentesFilterState = {
  search: '',
  status: 'all',
  clientId: 'all',
  formuleId: 'all',
  dateFrom: undefined,
  dateTo: undefined,
  volumeMin: '',
  volumeMax: '',
};

export function VentesFilters({
  filters,
  onFiltersChange,
  clients,
  formules,
  isRefreshing,
  lastRefresh,
  onRefresh,
  autoRefreshEnabled,
  onAutoRefreshToggle,
  searchInputRef,
}: VentesFiltersProps) {
  const { t, lang } = useI18n();
  const c = t.common;
  const vf = t.ventesFilters;
  const dateLocale = getDateLocale(lang);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [
    filters.status !== 'all',
    filters.clientId !== 'all',
    filters.formuleId !== 'all',
    !!filters.dateFrom,
    !!filters.dateTo,
    !!filters.volumeMin,
    !!filters.volumeMax,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const updateFilter = <K extends keyof VentesFilterState>(
    key: K,
    value: VentesFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={vf.searchPlaceholder}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 pr-8"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter('status', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={c.allStatuses} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{c.allStatuses}</SelectItem>
            <SelectItem value="en_attente">{vf.pending}</SelectItem>
            <SelectItem value="accepte">{vf.accepted}</SelectItem>
            <SelectItem value="converti">{vf.converted}</SelectItem>
            <SelectItem value="refuse">{vf.refused}</SelectItem>
            <SelectItem value="annule">{vf.cancelled}</SelectItem>
            <SelectItem value="pret_production">{vf.readyProduction}</SelectItem>
            <SelectItem value="en_production">{vf.inProduction}</SelectItem>
            <SelectItem value="termine">{vf.completed}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {c.filters}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {(activeFilterCount > 0 || filters.search) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            {c.clear}
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={autoRefreshEnabled ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onAutoRefreshToggle}
            className={cn(
              "gap-2 text-xs",
              autoRefreshEnabled && "bg-success/10 text-success hover:bg-success/20"
            )}
          >
            <div className={cn(
              "h-2 w-2 rounded-full",
              autoRefreshEnabled ? "bg-success animate-pulse" : "bg-muted-foreground"
            )} />
            {c.auto}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                {format(lastRefresh, 'HH:mm:ss')}
              </span>
            )}
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/30 border">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{c.client}</label>
            <Select
              value={filters.clientId}
              onValueChange={(value) => updateFilter('clientId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={c.allClients} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{c.allClients}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.nom_client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{c.formula}</label>
            <Select
              value={filters.formuleId}
              onValueChange={(value) => updateFilter('formuleId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={c.allFormulas} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{c.allFormulas}</SelectItem>
                {formules.map((formule) => (
                  <SelectItem key={formule.formule_id} value={formule.formule_id}>
                    {formule.formule_id} - {formule.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{c.dateFrom}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : c.select}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  locale={dateLocale || undefined}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{c.dateTo}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : c.select}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  locale={dateLocale || undefined}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{vf.volumeMin}</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.volumeMin}
              onChange={(e) => updateFilter('volumeMin', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{vf.volumeMax}</label>
            <Input
              type="number"
              placeholder="∞"
              value={filters.volumeMax}
              onChange={(e) => updateFilter('volumeMax', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
