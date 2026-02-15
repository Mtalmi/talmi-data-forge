import { ExpenseFilters } from '@/hooks/useExpensesControlled';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { X, Search } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

interface ExpenseFiltersPanelProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
}

export function ExpenseFiltersPanel({ filters, onChange }: ExpenseFiltersPanelProps) {
  const { t } = useI18n();
  const ef = t.expenseFilters;

  const STATUS_OPTIONS = [
    { value: 'all', label: ef.statuses.all },
    { value: 'brouillon', label: ef.statuses.brouillon },
    { value: 'en_attente', label: ef.statuses.en_attente },
    { value: 'approuve', label: ef.statuses.approuve },
    { value: 'rejete', label: ef.statuses.rejete },
    { value: 'paye', label: ef.statuses.paye },
    { value: 'bloque_plafond', label: ef.statuses.bloque_plafond },
  ];

  const LEVEL_OPTIONS = [
    { value: 'all', label: ef.levels.all },
    { value: 'level_1', label: ef.levels.level_1 },
    { value: 'level_2', label: ef.levels.level_2 },
    { value: 'level_3', label: ef.levels.level_3 },
  ];

  const CATEGORY_OPTIONS = [
    { value: 'all', label: ef.categories.all },
    { value: 'carburant', label: ef.categories.carburant },
    { value: 'maintenance', label: ef.categories.maintenance },
    { value: 'fournitures', label: ef.categories.fournitures },
    { value: 'transport', label: ef.categories.transport },
    { value: 'reparation', label: ef.categories.reparation },
    { value: 'nettoyage', label: ef.categories.nettoyage },
    { value: 'petit_equipement', label: ef.categories.petit_equipement },
    { value: 'services_externes', label: ef.categories.services_externes },
    { value: 'frais_administratifs', label: ef.categories.frais_administratifs },
    { value: 'autre', label: ef.categories.autre },
  ];

  const hasFilters = Object.values(filters).some(v => v && v !== 'all');

  const updateFilter = (key: keyof ExpenseFilters, value: string) => {
    const newFilters = { ...filters };
    if (value === 'all' || !value) {
      delete newFilters[key];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newFilters as any)[key] = value;
    }
    onChange(newFilters);
  };

  const clearFilters = () => {
    onChange({});
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="space-y-2 lg:col-span-2">
            <Label className="text-xs">{ef.search}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={ef.searchPlaceholder}
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs">{ef.status}</Label>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(v) => updateFilter('status', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label className="text-xs">{ef.approvalLevel}</Label>
            <Select 
              value={filters.level || 'all'} 
              onValueChange={(v) => updateFilter('level', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs">{ef.category}</Label>
            <Select 
              value={filters.category || 'all'} 
              onValueChange={(v) => updateFilter('category', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                <X className="h-4 w-4 mr-2" />
                {ef.clear}
              </Button>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs">{ef.dateFrom}</Label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{ef.dateTo}</Label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}