import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const MONO = 'ui-monospace, SFMono-Regular, monospace';

interface SearchResult {
  type: 'client' | 'bl' | 'facture' | 'page' | 'action' | 'ia' | 'truck' | 'formule' | 'batch';
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  url: string;
  shortcut?: string;
  subtitleColor?: string;
}

const QUICK_ACCESS: SearchResult[] = [
  { type: 'page', id: 'dashboard', icon: '📊', title: 'Tableau de Bord', subtitle: 'Aller au Command Center', url: '/dashboard', shortcut: 'G D' },
  { type: 'page', id: 'production', icon: '🏭', title: 'Production', subtitle: 'Voir production du jour', url: '/production', shortcut: 'G P' },
  { type: 'page', id: 'ventes', icon: '💰', title: 'Ventes', subtitle: 'Pipeline commercial', url: '/ventes', shortcut: 'G V' },
  { type: 'page', id: 'stocks', icon: '📦', title: 'Stocks', subtitle: 'Niveaux des silos', url: '/stocks', shortcut: 'G S' },
  { type: 'page', id: 'labo', icon: '🔬', title: 'Laboratoire', subtitle: 'Essais du jour', url: '/laboratoire', shortcut: 'G L' },
  { type: 'page', id: 'logistique', icon: '🚛', title: 'Logistique', subtitle: 'Flotte & livraisons', url: '/logistique', shortcut: 'G T' },
  { type: 'page', id: 'bons', icon: '📋', title: 'Bons de Commande', subtitle: 'Suivi livraisons', url: '/bons', shortcut: 'G B' },
  { type: 'page', id: 'creances', icon: '💳', title: 'Créances', subtitle: 'Suivi paiements', url: '/creances', shortcut: 'G C' },
  { type: 'page', id: 'clients', icon: '👤', title: 'Clients', subtitle: 'Portefeuille clients', url: '/clients' },
  { type: 'page', id: 'planning', icon: '📅', title: 'Planning', subtitle: 'Dispatch & planification', url: '/planning' },
];

const QUICK_ACTIONS: SearchResult[] = [
  { type: 'action', id: 'new-devis', icon: '➕', title: 'Nouveau Devis', subtitle: 'Créer un devis client', url: '/devis', shortcut: 'N D' },
  { type: 'action', id: 'new-test', icon: '➕', title: 'Nouveau Test Lab', subtitle: 'Lancer un essai qualité', url: '/laboratoire', shortcut: 'N T' },
  { type: 'action', id: 'new-livraison', icon: '➕', title: 'Nouvelle Livraison', subtitle: 'Planifier livraison', url: '/bons', shortcut: 'N L' },
  { type: 'action', id: 'rapport', icon: '📊', title: 'Rapport du Jour', subtitle: 'Générer rapport quotidien', url: '/dashboard', shortcut: 'R J' },
  { type: 'action', id: 'refresh', icon: '🔄', title: 'Actualiser Données', subtitle: 'Recharger toutes les données', url: '', shortcut: 'R R' },
];

const IA_ITEMS: SearchResult[] = [
  { type: 'ia', id: 'briefing', icon: '🧠', title: 'Briefing Matinal', subtitle: 'Résumé IA de la journée', url: '/dashboard' },
  { type: 'ia', id: 'alertes', icon: '⚠', title: 'Alertes Actives (5)', subtitle: 'Voir toutes les alertes', url: '/alertes', subtitleColor: '#EF4444' },
  { type: 'ia', id: 'recommandations', icon: '💡', title: 'Recommandations IA', subtitle: 'Actions suggérées par Claude Opus', url: '/dashboard' },
];

// Static demo results for specific searches — extended index
const DEMO_SEARCH_RESULTS: Record<string, SearchResult[]> = {
  sigma: [{ type: 'client', id: 'sigma', icon: '👤', title: 'Sigma Bâtiment', subtitle: 'Score: 23/100 · 189K DH impayés · 78% risque défaut', url: '/clients', subtitleColor: '#EF4444' }],
  tgcc: [{ type: 'client', id: 'tgcc', icon: '👤', title: 'TGCC', subtitle: 'Client majeur · Pipeline actif', url: '/clients' }],
  constructions: [{ type: 'client', id: 'cm', icon: '👤', title: 'Constructions Modernes SA', subtitle: 'Client régulier', url: '/clients' }],
  btp: [{ type: 'client', id: 'btp', icon: '👤', title: 'BTP Maroc SARL', subtitle: 'Client actif', url: '/clients' }],
  't-04': [{ type: 'truck', id: 't04', icon: '🚛', title: 'Toupie T-04', subtitle: 'En service · Livraison en cours', url: '/logistique' }],
  't-07': [{ type: 'truck', id: 't07', icon: '🚛', title: 'Toupie T-07', subtitle: 'En service', url: '/logistique' }],
  't-09': [{ type: 'truck', id: 't09', icon: '🚛', title: 'Toupie T-09', subtitle: 'En maintenance · Retour prévu 15/03', url: '/logistique', subtitleColor: '#F59E0B' }],
  't-12': [{ type: 'truck', id: 't12', icon: '🚛', title: 'Toupie T-12', subtitle: 'En service', url: '/logistique' }],
  'trk-': [{ type: 'truck', id: 'trk01', icon: '🚛', title: 'TRK-01 (Liberty)', subtitle: 'Demo US fleet', url: '/logistique' }],
  'lkw-': [{ type: 'truck', id: 'lkw01', icon: '🚛', title: 'LKW-01 (EuroBeton)', subtitle: 'Demo EU fleet', url: '/logistique' }],
  b20: [{ type: 'formule', id: 'b20', icon: '🧪', title: 'Formule F-B20', subtitle: '300 kg/m³ ciment', url: '/production' }],
  b25: [{ type: 'formule', id: 'b25', icon: '🧪', title: 'Formule F-B25', subtitle: '350 kg/m³ ciment · 60% des batches', url: '/production' }],
  b30: [{ type: 'formule', id: 'b30', icon: '🧪', title: 'Formule F-B30', subtitle: '400 kg/m³ ciment', url: '/production' }],
  b35: [{ type: 'formule', id: 'b35', icon: '🧪', title: 'Formule F-B35', subtitle: '450 kg/m³ ciment · Haute performance', url: '/production' }],
  'c25': [{ type: 'formule', id: 'c2530', icon: '🧪', title: 'C25/30 (EU)', subtitle: 'EN 206 · Demo EU', url: '/production' }],
  psi: [{ type: 'formule', id: '3500psi', icon: '🧪', title: '3500 PSI (US)', subtitle: 'ASTM C94 · Demo US', url: '/production' }],
  'bn-0140': [{ type: 'batch', id: 'bn0140', icon: '⚠', title: 'Batch BN-0140', subtitle: 'Non-conforme · Slump +10%', url: '/laboratoire', subtitleColor: '#EF4444' }],
  'bn-0': [{ type: 'batch', id: 'bn0139', icon: '✅', title: 'Batch BN-0139', subtitle: 'Conforme · B25 · 8m³', url: '/laboratoire' }],
  ciment: [{ type: 'page', id: 'ciment', icon: '📦', title: 'Ciment — Stock', subtitle: 'Niveau actuel · Seuil alerte', url: '/stocks' }],
  sable: [{ type: 'page', id: 'sable', icon: '📦', title: 'Sable — Stock', subtitle: 'Niveau actuel', url: '/stocks' }],
  adjuvant: [{ type: 'page', id: 'adj', icon: '📦', title: 'Adjuvant — Stock', subtitle: 'CRITIQUE · 6,7j autonomie', url: '/stocks', subtitleColor: '#EF4444' }],
  gravette: [{ type: 'page', id: 'grav', icon: '📦', title: 'Gravette — Stock', subtitle: 'Niveau actuel', url: '/stocks' }],
  eau: [{ type: 'page', id: 'eau', icon: '📦', title: 'Eau — Stock', subtitle: 'Niveau actuel', url: '/stocks' }],
  'fac-': [{ type: 'facture', id: 'fac001', icon: '📄', title: 'FAC-2025-001', subtitle: 'Recherche en base…', url: '/creances' }],
  youssef: [{ type: 'client', id: 'driver-y', icon: '🚛', title: 'Youssef Benali (Chauffeur)', subtitle: 'T-04 · En service', url: '/logistique' }],
  karim: [{ type: 'client', id: 'driver-k', icon: '🚛', title: 'Karim Idrissi (Chauffeur)', subtitle: 'T-07 · En service', url: '/logistique' }],
  mehdi: [{ type: 'client', id: 'driver-m', icon: '🚛', title: 'Mehdi Tazi (Chauffeur)', subtitle: 'T-09 · En maintenance', url: '/logistique' }],
};

function ShortcutBadge({ shortcut }: { shortcut: string }) {
  return (
    <span style={{
      background: 'rgba(255,255,255,0.08)', fontFamily: MONO, fontSize: 10,
      color: '#9CA3AF', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>{shortcut}</span>
  );
}

export function GlobalSearch() {
  const { t } = useI18n();
  const gs = t.globalSearch;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  // DB search
  useEffect(() => {
    if (!query || query.length < 2) { setDbResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const r: SearchResult[] = [];
      try {
        const { data: clients } = await supabase
          .from('clients').select('client_id, nom_client, telephone')
          .or(`nom_client.ilike.%${query}%,client_id.ilike.%${query}%`).limit(4);
        clients?.forEach(c => r.push({ type: 'client', id: c.client_id, icon: '👤', title: c.nom_client, subtitle: c.client_id, url: '/clients' }));

        const { data: bls } = await supabase
          .from('bons_livraison_reels').select('bl_id, client_id, date_livraison')
          .or(`bl_id.ilike.%${query}%,client_id.ilike.%${query}%`).limit(4);
        bls?.forEach(bl => r.push({ type: 'bl', id: bl.bl_id, icon: '🚛', title: bl.bl_id, subtitle: `${bl.client_id} · ${new Date(bl.date_livraison).toLocaleDateString('fr-FR')}`, url: '/bons' }));

        const { data: factures } = await supabase
          .from('factures').select('facture_id, client_id, total_ttc')
          .or(`facture_id.ilike.%${query}%,client_id.ilike.%${query}%`).limit(4);
        factures?.forEach(f => r.push({ type: 'facture', id: f.facture_id, icon: '📄', title: f.facture_id, subtitle: `${f.client_id} · ${f.total_ttc?.toLocaleString('fr-FR')} DH`, url: '/bons' }));

        setDbResults(r);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const close = useCallback(() => { setOpen(false); setQuery(''); setActiveIdx(0); }, []);

  const handleSelect = useCallback((item: SearchResult) => {
    close();
    if (item.id === 'refresh') { window.location.reload(); return; }
    if (item.url) navigate(item.url);
  }, [close, navigate]);

  // Build visible items
  const allItems: { section: string; items: SearchResult[] }[] = [];
  if (query.length < 2) {
    allItems.push({ section: 'ACCÈS RAPIDE', items: QUICK_ACCESS });
    allItems.push({ section: 'ACTIONS RAPIDES', items: QUICK_ACTIONS });
    allItems.push({ section: 'IA', items: IA_ITEMS });
  } else {
    const q = query.toLowerCase();
    // Check demo results
    const demoKey = Object.keys(DEMO_SEARCH_RESULTS).find(k => q.includes(k));
    if (demoKey) allItems.push({ section: 'RÉSULTATS', items: DEMO_SEARCH_RESULTS[demoKey] });
    // Filter static items
    const staticMatches = [...QUICK_ACCESS, ...QUICK_ACTIONS, ...IA_ITEMS].filter(i =>
      i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q)
    );
    if (staticMatches.length) allItems.push({ section: 'NAVIGATION', items: staticMatches });
    // DB results
    if (dbResults.length) allItems.push({ section: 'BASE DE DONNÉES', items: dbResults });
  }

  const flatItems = allItems.flatMap(s => s.items);

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && flatItems[activeIdx]) { e.preventDefault(); handleSelect(flatItems[activeIdx]); }
    if (e.key === 'Tab') {
      e.preventDefault();
      // Jump to next section
      let currentSection = 0;
      let count = 0;
      for (let s = 0; s < allItems.length; s++) {
        if (activeIdx < count + allItems[s].items.length) { currentSection = s; break; }
        count += allItems[s].items.length;
      }
      const nextSection = (currentSection + 1) % allItems.length;
      let nextIdx = 0;
      for (let s = 0; s < nextSection; s++) nextIdx += allItems[s].items.length;
      setActiveIdx(nextIdx);
    }
  };

  useEffect(() => { setActiveIdx(0); }, [query]);

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) {
    return (
      <button
        role="combobox"
        aria-expanded={false}
        onClick={() => setOpen(true)}
        className="tbos-search-trigger group flex items-center gap-2.5 h-9 px-3.5 cursor-pointer transition-all duration-200"
        style={{
          minWidth: 320, background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(212, 168, 67, 0.15)', borderRadius: 8,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212, 168, 67, 0.3)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212, 168, 67, 0.15)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
      >
        <Search className="flex-shrink-0" size={16} style={{ color: '#9CA3AF' }} strokeWidth={1.5} />
        <span className="hidden sm:inline flex-1 text-left truncate" style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF' }}>
          Rechercher métriques, KPIs, rapports...
        </span>
        <span className="sm:hidden" style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF' }}>{gs.search}</span>
        <div className="flex items-center flex-shrink-0" style={{ gap: 4 }}>
          <kbd style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 5px' }}>⌘</kbd>
          <kbd style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 5px' }}>K</kbd>
        </div>
      </button>
    );
  }

  let flatIdx = 0;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20%',
      }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        style={{
          width: 640, maxHeight: 480, background: '#1A2332',
          border: '1px solid rgba(212, 168, 67, 0.2)', borderRadius: 12,
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.6)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '16px 20px',
          borderBottom: '1px solid rgba(212, 168, 67, 0.08)', flexShrink: 0,
        }}>
          <Search size={18} style={{ color: '#D4A843', marginRight: 12, flexShrink: 0 }} strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher ou taper une commande..."
            autoFocus
            style={{
              flex: 1, fontFamily: MONO, fontSize: 16, color: '#FFFFFF',
              background: 'transparent', border: 'none', outline: 'none',
            }}
          />
          {query ? (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
              <X size={16} />
            </button>
          ) : (
            <span style={{
              fontFamily: MONO, fontSize: 10, color: '#9CA3AF',
              background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 6px',
            }}>ESC</span>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Loader2 size={20} style={{ color: '#D4A843', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {!loading && query.length >= 2 && flatItems.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: MONO, fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
              Aucun résultat pour "{query}" — essayez un nom de client, un numéro de batch, ou une formule.
            </div>
          )}

          {!loading && allItems.map((section) => (
            <div key={section.section} style={{ padding: '4px 8px' }}>
              <div style={{
                padding: '8px 12px 4px', fontFamily: MONO, fontSize: 10, fontWeight: 600,
                letterSpacing: '2px', color: '#9CA3AF', textTransform: 'uppercase',
              }}>{section.section}</div>
              {section.items.map((item) => {
                const idx = flatIdx++;
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    data-idx={idx}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
                      background: isActive ? 'rgba(212, 168, 67, 0.08)' : 'transparent',
                      border: 'none', textAlign: 'left', transition: 'background 100ms',
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0, width: 22, textAlign: 'center' }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 13, color: '#FFFFFF', fontWeight: 500 }}>{item.title}</div>
                      <div style={{
                        fontFamily: MONO, fontSize: 12, color: item.subtitleColor || '#9CA3AF',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{item.subtitle}</div>
                    </div>
                    {item.shortcut && <ShortcutBadge shortcut={item.shortcut} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
