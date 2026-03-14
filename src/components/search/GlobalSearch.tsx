import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Truck, FileText, Loader2, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

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
    if (!query || query.length < 2) { setResults([]); return; }
    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      const searchResults: SearchResult[] = [];
      try {
        const { data: clients } = await supabase
          .from('clients').select('client_id, nom_client, telephone')
          .or(`nom_client.ilike.%${query}%,client_id.ilike.%${query}%,telephone.ilike.%${query}%`).limit(5);
        if (clients) clients.forEach(c => searchResults.push({ type: 'client', id: c.client_id, title: c.nom_client, subtitle: c.client_id, url: '/clients' }));

        const { data: bls } = await supabase
          .from('bons_livraison_reels').select('bl_id, client_id, formule_id, date_livraison')
          .or(`bl_id.ilike.%${query}%,client_id.ilike.%${query}%`).limit(5);
        if (bls) bls.forEach(bl => searchResults.push({ type: 'bl', id: bl.bl_id, title: bl.bl_id, subtitle: `${bl.client_id} - ${new Date(bl.date_livraison).toLocaleDateString('fr-FR')}`, url: '/bons' }));

        const { data: factures } = await supabase
          .from('factures').select('facture_id, client_id, date_facture, total_ttc')
          .or(`facture_id.ilike.%${query}%,client_id.ilike.%${query}%`).limit(5);
        if (factures) factures.forEach(f => searchResults.push({ type: 'facture', id: f.facture_id, title: f.facture_id, subtitle: `${f.client_id} - ${f.total_ttc.toLocaleString('fr-FR')} DH`, url: '/bons' }));

        setResults(searchResults);
      } catch (error) { console.error('Search error:', error); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => { setOpen(false); setQuery(''); navigate(result.url); };

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

  const quickLinks = [
    { emoji: '📊', label: 'Tableau de Bord', path: '/dashboard' },
    { emoji: '📦', label: 'Production', path: '/production' },
    { emoji: '💰', label: 'Ventes', path: '/ventes' },
    { emoji: '👥', label: 'Clients', path: '/clients' },
    { emoji: '📋', label: 'Devis', path: '/devis' },
    { emoji: '🚛', label: 'Livraisons', path: '/livraisons' },
  ];

  return (
    <>
      <button
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="tbos-search-trigger group flex items-center gap-2.5 h-9 px-3.5 cursor-pointer transition-all duration-200"
        style={{
          minWidth: 320,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(212, 168, 67, 0.15)',
          borderRadius: 8,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 168, 67, 0.3)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.07)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 168, 67, 0.15)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
        }}
      >
        <Search
          className="flex-shrink-0"
          size={16}
          style={{ color: '#9CA3AF' }}
          strokeWidth={1.5}
        />
        <span
          className="hidden sm:inline flex-1 text-left truncate"
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: '#9CA3AF',
          }}
        >
          Rechercher métriques, KPIs, rapports...
        </span>
        <span
          className="sm:hidden"
          style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF' }}
        >
          {gs.search}
        </span>
        <div className="flex items-center flex-shrink-0" style={{ gap: 4 }}>
          <kbd style={{
            fontFamily: MONO, fontSize: 10, color: '#9CA3AF',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 4, padding: '2px 5px',
          }}>⌘</kbd>
          <kbd style={{
            fontFamily: MONO, fontSize: 10, color: '#9CA3AF',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 4, padding: '2px 5px',
          }}>K</kbd>
        </div>
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setQuery(''); } }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#0F1629',
              border: '1px solid rgba(212, 168, 67, 0.15)',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Search input */}
            <div className="flex items-center px-4" style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.08)' }}>
              <Search className="mr-3 shrink-0" size={16} style={{ color: '#9CA3AF' }} strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } }}
                placeholder="Rechercher métriques, KPIs, rapports..."
                autoFocus
                className="flex h-12 w-full bg-transparent py-3 outline-none"
                style={{ fontFamily: MONO, fontSize: 13, color: '#FFFFFF' }}
              />
              {query && (
                <button onClick={() => setQuery('')} className="h-7 w-7 flex items-center justify-center rounded-md" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#D4A843' }} />
                </div>
              )}

              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-6 text-center" style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF' }}>Aucun résultat trouvé</div>
              )}

              {!loading && query.length >= 2 && Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="px-2 py-2">
                  <div className="px-3 py-1.5" style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' as const }}>{getTypeLabel(type)}</div>
                  {items.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 text-left"
                      style={{ padding: '10px 16px', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="truncate" style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500 }}>{result.title}</div>
                        <div className="truncate" style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF' }}>{result.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}

              {!loading && query.length < 2 && (
                <div className="px-2 py-2">
                  <div className="px-3 py-1.5" style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: '#9CA3AF', textTransform: 'uppercase' as const }}>ACCÈS RAPIDE</div>
                  {quickLinks.map(link => (
                    <button
                      key={link.path}
                      onClick={() => { setOpen(false); setQuery(''); navigate(link.path); }}
                      className="w-full flex items-center gap-3 text-left"
                      style={{ padding: '10px 16px', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontFamily: MONO, fontSize: 13, transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 16 }}>{link.emoji}</span>
                      <span>{link.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
