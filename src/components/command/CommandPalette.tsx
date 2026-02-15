import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, CalendarClock, Factory, Warehouse,
  Receipt, Users, Truck, FlaskConical, DollarSign, BarChart3, Wrench,
  Shield, FileText, GraduationCap, HelpCircle, Building2, Video,
  Search, Bot, ArrowRight, Command as CommandIcon, Sparkles, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';
import { hapticTap } from '@/lib/haptics';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'navigation' | 'action' | 'ai';
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const goTo = useCallback((path: string) => {
    setOpen(false);
    playSound('navigate');
    navigate(path);
  }, [navigate]);

  const items: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Sanctum (Dashboard)', icon: LayoutDashboard, action: () => goTo('/'), category: 'navigation', keywords: ['accueil', 'home', 'tableau de bord'] },
    { id: 'nav-ventes', label: 'Ventes', icon: ShoppingCart, action: () => goTo('/ventes'), category: 'navigation', keywords: ['sales', 'chiffre'] },
    { id: 'nav-planning', label: 'Planning', icon: CalendarClock, action: () => goTo('/planning'), category: 'navigation', keywords: ['schedule', 'livraison'] },
    { id: 'nav-production', label: 'Production', icon: Factory, action: () => goTo('/production'), category: 'navigation', keywords: ['béton', 'concrete', 'batch'] },
    { id: 'nav-stocks', label: 'Stocks', icon: Warehouse, action: () => goTo('/stocks'), category: 'navigation', keywords: ['inventory', 'matériaux'] },
    { id: 'nav-bons', label: 'Archive BL', icon: Receipt, action: () => goTo('/bons'), category: 'navigation', keywords: ['bon livraison', 'delivery'] },
    { id: 'nav-clients', label: 'Clients', icon: Users, action: () => goTo('/clients'), category: 'navigation', keywords: ['customer'] },
    { id: 'nav-formules', label: 'Formules', icon: FlaskConical, action: () => goTo('/formules'), category: 'navigation', keywords: ['recipe', 'mix'] },
    { id: 'nav-lab', label: 'Laboratoire', icon: FlaskConical, action: () => goTo('/laboratoire'), category: 'navigation', keywords: ['test', 'quality'] },
    { id: 'nav-logistique', label: 'Logistique', icon: Truck, action: () => goTo('/logistique'), category: 'navigation', keywords: ['fleet', 'camion'] },
    { id: 'nav-depenses', label: 'Dépenses', icon: Receipt, action: () => goTo('/depenses-v2'), category: 'navigation', keywords: ['expenses'] },
    { id: 'nav-fournisseurs', label: 'Fournisseurs', icon: Building2, action: () => goTo('/fournisseurs'), category: 'navigation', keywords: ['supplier'] },
    { id: 'nav-paiements', label: 'Paiements', icon: DollarSign, action: () => goTo('/paiements'), category: 'navigation', keywords: ['payment'] },
    { id: 'nav-rapports', label: 'Rapports', icon: BarChart3, action: () => goTo('/rapports'), category: 'navigation', keywords: ['report', 'analytics'] },
    { id: 'nav-maintenance', label: 'Maintenance', icon: Wrench, action: () => goTo('/maintenance'), category: 'navigation', keywords: ['repair'] },
    { id: 'nav-securite', label: 'Sécurité', icon: Shield, action: () => goTo('/securite'), category: 'navigation', keywords: ['security', 'audit'] },
    { id: 'nav-surveillance', label: 'Surveillance IA', icon: Video, action: () => goTo('/surveillance'), category: 'navigation', keywords: ['camera', 'video'] },
    { id: 'nav-contracts', label: 'Contrats', icon: FileText, action: () => goTo('/contracts'), category: 'navigation', keywords: ['contract'] },
    { id: 'nav-formation', label: 'Mode Formation', icon: GraduationCap, action: () => goTo('/formation'), category: 'navigation', keywords: ['training'] },
    { id: 'nav-aide', label: 'Manuel Système', icon: HelpCircle, action: () => goTo('/aide'), category: 'navigation', keywords: ['help', 'support'] },
    // Quick Actions
    { id: 'act-ai', label: 'Ouvrir Assistant AI', description: 'Chat avec TBOS AI', icon: Bot, action: () => { setOpen(false); navigate('/ai'); }, category: 'action', keywords: ['intelligence', 'chat'] },
    { id: 'act-pointage', label: 'Pointage', description: 'Gestion présence employés', icon: Users, action: () => goTo('/pointage'), category: 'action', keywords: ['attendance'] },
    { id: 'act-rapprochement', label: 'Rapprochement Bancaire', description: 'Réconciliation financière', icon: DollarSign, action: () => goTo('/rapprochement'), category: 'action', keywords: ['bank', 'reconciliation'] },
  ];

  // AI-powered query detection
  const isAIQuery = query.length > 3 && !items.some(i =>
    i.label.toLowerCase().includes(query.toLowerCase()) ||
    i.keywords?.some(k => k.includes(query.toLowerCase()))
  );

  const filtered = query.length === 0
    ? items.slice(0, 8)
    : items.filter(item => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords?.some(k => k.includes(q))
        );
      });

  // Group by category
  const navItems = filtered.filter(i => i.category === 'navigation');
  const actionItems = filtered.filter(i => i.category === 'action');
  const allItems = [...navItems, ...actionItems];

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => {
          const next = !prev;
          if (next) playSound('open');
          else playSound('close');
          return next;
        });
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        playSound('close');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Arrow key navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const total = allItems.length + (isAIQuery ? 1 : 0);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isAIQuery && selectedIndex === allItems.length) {
        setOpen(false);
        playSound('navigate');
        navigate('/ai', { state: { initialQuery: query } });
      } else if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
        hapticTap();
      }
    }
  };

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => { setOpen(false); playSound('close'); }}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed left-1/2 top-[15%] z-[101] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/40">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                  <CommandIcon className="h-4 w-4 text-primary" />
                </div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Rechercher ou demander à l'IA..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden sm:flex h-6 items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-2 font-mono text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
                {navItems.length > 0 && (
                  <div className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Navigation
                    </p>
                    {navItems.map((item, i) => {
                      const idx = i;
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={() => { item.action(); hapticTap(); }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                            selectedIndex === idx
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", selectedIndex === idx && "text-primary")} />
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                          {selectedIndex === idx && (
                            <ArrowRight className="h-3.5 w-3.5 text-primary animate-fade-in" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {actionItems.length > 0 && (
                  <div className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Actions Rapides
                    </p>
                    {actionItems.map((item, i) => {
                      const idx = navItems.length + i;
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={() => { item.action(); hapticTap(); }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                            selectedIndex === idx
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", selectedIndex === idx && "text-primary")} />
                          <div className="flex-1 text-left">
                            <span className="font-medium">{item.label}</span>
                            {item.description && (
                              <span className="ml-2 text-xs text-muted-foreground/60">{item.description}</span>
                            )}
                          </div>
                          {selectedIndex === idx && (
                            <ArrowRight className="h-3.5 w-3.5 text-primary animate-fade-in" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* AI Query Suggestion */}
                {isAIQuery && (
                  <div className="mt-1 border-t border-border/20 pt-2">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      Intelligence Artificielle
                    </p>
                    <button
                      data-index={allItems.length}
                      onClick={() => {
                        setOpen(false);
                        playSound('navigate');
                        navigate('/ai', { state: { initialQuery: query } });
                      }}
                      onMouseEnter={() => setSelectedIndex(allItems.length)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-all duration-150',
                        selectedIndex === allItems.length
                          ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-foreground border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold">Demander à TBOS AI</span>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">"{query}"</p>
                      </div>
                      <Zap className="h-4 w-4 text-primary" />
                    </button>
                  </div>
                )}

                {filtered.length === 0 && !isAIQuery && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aucun résultat pour "{query}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/20 text-[10px] text-muted-foreground/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border/30 bg-muted/30">↑↓</kbd> naviguer
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border/30 bg-muted/30">↵</kbd> sélectionner
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI-powered
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
