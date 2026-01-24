import { ExpenseFilters } from '@/hooks/useExpensesControlled';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { X, Search } from 'lucide-react';

interface ExpenseFiltersPanelProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'approuve', label: 'Approuvé' },
  { value: 'rejete', label: 'Rejeté' },
  { value: 'paye', label: 'Payé' },
  { value: 'bloque_plafond', label: 'Bloqué (Plafond)' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: 'Tous les niveaux' },
  { value: 'level_1', label: 'Niveau 1 (≤ 2,000 MAD)' },
  { value: 'level_2', label: 'Niveau 2 (2,001-20,000 MAD)' },
  { value: 'level_3', label: 'Niveau 3 (> 20,000 MAD)' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'carburant', label: 'Carburant' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'fournitures', label: 'Fournitures' },
  { value: 'transport', label: 'Transport' },
  { value: 'reparation', label: 'Réparation' },
  { value: 'nettoyage', label: 'Nettoyage' },
  { value: 'petit_equipement', label: 'Petit Équipement' },
  { value: 'services_externes', label: 'Services Externes' },
  { value: 'frais_administratifs', label: 'Frais Administratifs' },
  { value: 'autre', label: 'Autre' },
];

export function ExpenseFiltersPanel({ filters, onChange }: ExpenseFiltersPanelProps) {
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
            <Label className="text-xs">Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Référence, description, demandeur..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs">Statut</Label>
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
            <Label className="text-xs">Niveau d'approbation</Label>
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
            <Label className="text-xs">Catégorie</Label>
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
                Effacer
              </Button>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs">Date début</Label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Date fin</Label>
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
