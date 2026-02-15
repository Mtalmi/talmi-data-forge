import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Truck, FileText, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'client' | 'bl' | 'facture';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search clients
        const { data: clients } = await supabase
          .from('clients')
          .select('client_id, nom_client, telephone')
          .or(`nom_client.ilike.%${query}%,client_id.ilike.%${query}%,telephone.ilike.%${query}%`)
          .limit(5);

        if (clients) {
          clients.forEach(c => {
            searchResults.push({
              type: 'client',
              id: c.client_id,
              title: c.nom_client,
              subtitle: c.client_id,
              url: '/clients',
            });
          });
        }

        // Search BLs
        const { data: bls } = await supabase
          .from('bons_livraison_reels')
          .select('bl_id, client_id, formule_id, date_livraison')
          .or(`bl_id.ilike.%${query}%,client_id.ilike.%${query}%`)
          .limit(5);

        if (bls) {
          bls.forEach(bl => {
            searchResults.push({
              type: 'bl',
              id: bl.bl_id,
              title: bl.bl_id,
              subtitle: `${bl.client_id} - ${new Date(bl.date_livraison).toLocaleDateString('fr-FR')}`,
              url: '/bons',
            });
          });
        }

        // Search Factures
        const { data: factures } = await supabase
          .from('factures')
          .select('facture_id, client_id, date_facture, total_ttc')
          .or(`facture_id.ilike.%${query}%,client_id.ilike.%${query}%`)
          .limit(5);

        if (factures) {
          factures.forEach(f => {
            searchResults.push({
              type: 'facture',
              id: f.facture_id,
              title: f.facture_id,
              subtitle: `${f.client_id} - ${f.total_ttc.toLocaleString('fr-FR')} DH`,
              url: '/bons',
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <Users className="h-4 w-4 text-blue-500" />;
      case 'bl': return <Truck className="h-4 w-4 text-orange-500" />;
      case 'facture': return <FileText className="h-4 w-4 text-green-500" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'client': return 'Clients';
      case 'bl': return 'Bons de Livraison';
      case 'facture': return 'Factures';
      default: return 'Résultats';
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-80 justify-start text-muted-foreground min-h-[44px]"
        >
          <Search className="mr-2 h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Recherche rapide...</span>
          <span className="sm:hidden">Rechercher</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] md:w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher clients, BLs, factures..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList className="max-h-[400px]">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
            )}
            {!loading && query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Tapez au moins 2 caractères pour rechercher
              </div>
            )}
            {!loading && Object.entries(groupedResults).map(([type, items], index) => (
              <CommandGroup key={type} heading={getTypeLabel(type)}>
                {items.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer min-h-[44px]"
                  >
                    {getIcon(result.type)}
                    <div className="ml-3 flex-1">
                      <p className="font-medium">{result.title}</p>
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
