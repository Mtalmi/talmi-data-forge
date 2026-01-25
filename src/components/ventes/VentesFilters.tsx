import { useState, forwardRef } from 'react';
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
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
      {/* Main Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Rechercher par n° devis, BC, client..."
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

        {/* Quick Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter('status', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="en_attente">En Attente</SelectItem>
            <SelectItem value="accepte">Accepté</SelectItem>
            <SelectItem value="converti">Converti</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
            <SelectItem value="pret_production">Prêt Production</SelectItem>
            <SelectItem value="en_production">En Production</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear All Filters */}
        {(activeFilterCount > 0 || filters.search) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}

        {/* Auto-Refresh Indicator */}
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
            Auto
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

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/30 border">
          {/* Client Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Client</label>
            <Select
              value={filters.clientId}
              onValueChange={(value) => updateFilter('clientId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.nom_client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formule Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Formule</label>
            <Select
              value={filters.formuleId}
              onValueChange={(value) => updateFilter('formuleId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes formules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes formules</SelectItem>
                {formules.map((formule) => (
                  <SelectItem key={formule.formule_id} value={formule.formule_id}>
                    {formule.formule_id} - {formule.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date début</label>
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
                  {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : 'Sélectionner'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date fin</label>
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
                  {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : 'Sélectionner'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Volume Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Volume min (m³)</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.volumeMin}
              onChange={(e) => updateFilter('volumeMin', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Volume max (m³)</label>
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
