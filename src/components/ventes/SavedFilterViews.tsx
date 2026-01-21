import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, BookmarkPlus, ChevronDown, Trash2, Check } from 'lucide-react';
import { VentesFilterState, defaultFilters } from './VentesFilters';
import { toast } from 'sonner';

interface SavedFilter {
  id: string;
  name: string;
  filters: VentesFilterState;
  createdAt: string;
}

interface SavedFilterViewsProps {
  currentFilters: VentesFilterState;
  onApplyFilter: (filters: VentesFilterState) => void;
}

const STORAGE_KEY = 'ventes_saved_filters';

export function SavedFilterViews({ currentFilters, onApplyFilter }: SavedFilterViewsProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  // Load saved filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
  }, []);

  // Save filters to localStorage
  const persistFilters = (filters: SavedFilter[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    setSavedFilters(filters);
  };

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      toast.error('Veuillez entrer un nom pour le filtre');
      return;
    }

    const newFilter: SavedFilter = {
      id: `filter_${Date.now()}`,
      name: newFilterName.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    };

    persistFilters([...savedFilters, newFilter]);
    setNewFilterName('');
    setSaveDialogOpen(false);
    toast.success(`Filtre "${newFilter.name}" enregistré`);
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters);
    setActiveFilterId(filter.id);
    toast.info(`Filtre "${filter.name}" appliqué`);
  };

  const handleDeleteFilter = (filterId: string, filterName: string) => {
    persistFilters(savedFilters.filter(f => f.id !== filterId));
    if (activeFilterId === filterId) {
      setActiveFilterId(null);
    }
    toast.success(`Filtre "${filterName}" supprimé`);
  };

  const handleClearFilters = () => {
    onApplyFilter(defaultFilters);
    setActiveFilterId(null);
  };

  const hasActiveFilters = 
    currentFilters.search ||
    currentFilters.status !== 'all' ||
    currentFilters.clientId !== 'all' ||
    currentFilters.formuleId !== 'all' ||
    currentFilters.dateFrom ||
    currentFilters.dateTo ||
    currentFilters.volumeMin ||
    currentFilters.volumeMax;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Vues
            {savedFilters.length > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {savedFilters.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Filtres Enregistrés
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {savedFilters.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Aucun filtre enregistré
            </div>
          ) : (
            savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between group cursor-pointer"
                onClick={() => handleApplyFilter(filter)}
              >
                <div className="flex items-center gap-2">
                  {activeFilterId === filter.id && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                  <span className={activeFilterId === filter.id ? 'font-medium' : ''}>
                    {filter.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFilter(filter.id, filter.name);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
          
          <DropdownMenuSeparator />
          
          {hasActiveFilters && (
            <DropdownMenuItem onClick={handleClearFilters} className="text-muted-foreground">
              Effacer les filtres actifs
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save current filter button */}
      {hasActiveFilters && (
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <BookmarkPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Enregistrer</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enregistrer le filtre</DialogTitle>
              <DialogDescription>
                Donnez un nom à cette combinaison de filtres pour la réutiliser facilement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="filter-name">Nom du filtre</Label>
                <Input
                  id="filter-name"
                  placeholder="ex: Devis en attente haute valeur"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
                />
              </div>
              
              {/* Preview of active filters */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Filtres actifs</Label>
                <div className="flex flex-wrap gap-1">
                  {currentFilters.status !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Statut: {currentFilters.status}
                    </Badge>
                  )}
                  {currentFilters.clientId !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Client sélectionné
                    </Badge>
                  )}
                  {currentFilters.formuleId !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Formule: {currentFilters.formuleId}
                    </Badge>
                  )}
                  {currentFilters.dateFrom && (
                    <Badge variant="outline" className="text-xs">
                      Depuis: {currentFilters.dateFrom.toLocaleDateString()}
                    </Badge>
                  )}
                  {currentFilters.dateTo && (
                    <Badge variant="outline" className="text-xs">
                      Jusqu'au: {currentFilters.dateTo.toLocaleDateString()}
                    </Badge>
                  )}
                  {(currentFilters.volumeMin || currentFilters.volumeMax) && (
                    <Badge variant="outline" className="text-xs">
                      Volume: {currentFilters.volumeMin || '0'} - {currentFilters.volumeMax || '∞'} m³
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveFilter} className="gap-1">
                <BookmarkPlus className="h-4 w-4" />
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
