import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Truck, FileText, Loader2, X, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

interface SearchResult {
  type: 'client' | 'bl' | 'facture';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const { t } = useI18n();
  const gs = t.globalSearch;
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
      case 'client': return gs.clients;
      case 'bl': return gs.deliveryNotes;
      case 'facture': return gs.invoices;
      default: return gs.results;
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
        <button
          role="combobox"
          aria-expanded={open}
          className="tbos-search-trigger group flex items-center gap-2.5 w-full md:w-[340px] h-10 px-4 rounded-lg cursor-pointer transition-all duration-250"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1.5px solid rgba(255, 215, 0, 0.15)',
            borderRadius: 8,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 215, 0, 0.4)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 215, 0, 0.15)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.45)';
          }}
        >
          {/* Search icon */}
          <Search
            className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 group-hover:scale-110"
            style={{ color: '#FFD700' }}
            strokeWidth={1.8}
          />
          {/* Placeholder */}
          <span
            className="hidden sm:inline text-[14px] flex-1 text-left truncate"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontWeight: 400,
              color: 'rgba(160, 160, 160, 0.7)',
              letterSpacing: '0.01em',
            }}
          >
            Search metrics, KPIs, reports...
          </span>
          <span
            className="sm:hidden text-[14px]"
            style={{ color: 'rgba(160, 160, 160, 0.7)' }}
          >
            {gs.search}
          </span>

          {/* Keyboard shortcut badges */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: 'rgba(255, 215, 0, 0.4)',
                background: 'rgba(255, 215, 0, 0.06)',
                border: '1px solid rgba(255, 215, 0, 0.1)',
              }}
            >⌘</kbd>
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: 'rgba(255, 215, 0, 0.4)',
                background: 'rgba(255, 215, 0, 0.06)',
                border: '1px solid rgba(255, 215, 0, 0.1)',
              }}
            >K</kbd>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] md:w-[520px] p-0"
        align="start"
        style={{
          background: '#0d1220',
          border: '1.5px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.05)',
        }}
      >
        <Command shouldFilter={false}>
          <div
            className="flex items-center px-4"
            style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.08)' }}
          >
            <Search className="mr-3 h-[18px] w-[18px] shrink-0" style={{ color: '#FFD700' }} strokeWidth={1.8} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={gs.searchPlaceholder}
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: '14px',
                color: 'rgba(255,255,255,0.9)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="h-7 w-7 flex items-center justify-center rounded-md transition-colors duration-150"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FFD700'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <CommandList className="max-h-[400px]">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#FFD700' }} />
              </div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>{gs.noResultsFound}</CommandEmpty>
            )}
            {!loading && query.length < 2 && (
              <div className="py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {gs.typeMinChars}
              </div>
            )}
            {!loading && Object.entries(groupedResults).map(([type, items]) => (
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
