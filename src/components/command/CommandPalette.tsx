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
import { useI18n } from '@/i18n/I18nContext';

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
  const { t } = useI18n();
  const cp = t.commandPalette;

  const goTo = useCallback((path: string) => {
    setOpen(false);
    playSound('navigate');
    navigate(path);
  }, [navigate]);

  // Navigation items use nav keys from i18n where available
  const items: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Sanctum (Dashboard)', icon: LayoutDashboard, action: () => goTo('/'), category: 'navigation', keywords: ['accueil', 'home', 'tableau de bord'] },
    { id: 'nav-ventes', label: t.nav.sales, icon: ShoppingCart, action: () => goTo('/ventes'), category: 'navigation', keywords: ['sales', 'chiffre', 'ventes'] },
    { id: 'nav-planning', label: t.nav.planning, icon: CalendarClock, action: () => goTo('/planning'), category: 'navigation', keywords: ['schedule', 'livraison', 'planning'] },
    { id: 'nav-production', label: t.nav.production, icon: Factory, action: () => goTo('/production'), category: 'navigation', keywords: ['béton', 'concrete', 'batch'] },
    { id: 'nav-stocks', label: t.nav.stocks, icon: Warehouse, action: () => goTo('/stocks'), category: 'navigation', keywords: ['inventory', 'matériaux'] },
    { id: 'nav-bons', label: t.nav.deliveries, icon: Receipt, action: () => goTo('/bons'), category: 'navigation', keywords: ['bon livraison', 'delivery'] },
    { id: 'nav-clients', label: t.nav.clients, icon: Users, action: () => goTo('/clients'), category: 'navigation', keywords: ['customer'] },
    { id: 'nav-formules', label: t.nav.formulas, icon: FlaskConical, action: () => goTo('/formules'), category: 'navigation', keywords: ['recipe', 'mix'] },
    { id: 'nav-lab', label: t.nav.laboratory, icon: FlaskConical, action: () => goTo('/laboratoire'), category: 'navigation', keywords: ['test', 'quality'] },
    { id: 'nav-logistique', label: t.nav.logistics, icon: Truck, action: () => goTo('/logistique'), category: 'navigation', keywords: ['fleet', 'camion'] },
    { id: 'nav-depenses', label: t.nav.expenses, icon: Receipt, action: () => goTo('/depenses-v2'), category: 'navigation', keywords: ['expenses'] },
    { id: 'nav-fournisseurs', label: t.nav.suppliers, icon: Building2, action: () => goTo('/fournisseurs'), category: 'navigation', keywords: ['supplier'] },
    { id: 'nav-paiements', label: t.nav.payments, icon: DollarSign, action: () => goTo('/paiements'), category: 'navigation', keywords: ['payment'] },
    { id: 'nav-rapports', label: t.nav.reports, icon: BarChart3, action: () => goTo('/rapports'), category: 'navigation', keywords: ['report', 'analytics'] },
    { id: 'nav-maintenance', label: t.nav.maintenance, icon: Wrench, action: () => goTo('/maintenance'), category: 'navigation', keywords: ['repair'] },
    { id: 'nav-securite', label: t.nav.security, icon: Shield, action: () => goTo('/securite'), category: 'navigation', keywords: ['security', 'audit'] },
    { id: 'nav-surveillance', label: t.nav.aiSurveillance, icon: Video, action: () => goTo('/surveillance'), category: 'navigation', keywords: ['camera', 'video'] },
    { id: 'nav-contracts', label: t.nav.contracts, icon: FileText, action: () => goTo('/contracts'), category: 'navigation', keywords: ['contract'] },
    { id: 'nav-formation', label: t.nav.trainingMode, icon: GraduationCap, action: () => goTo('/formation'), category: 'navigation', keywords: ['training'] },
    { id: 'nav-aide', label: t.nav.systemManual, icon: HelpCircle, action: () => goTo('/aide'), category: 'navigation', keywords: ['help', 'support'] },
    { id: 'act-ai', label: cp.askAi, description: 'Chat TBOS AI', icon: Bot, action: () => { setOpen(false); navigate('/ai'); }, category: 'action', keywords: ['intelligence', 'chat'] },
    { id: 'act-pointage', label: t.nav.attendance, icon: Users, action: () => goTo('/pointage'), category: 'action', keywords: ['attendance'] },
    { id: 'act-rapprochement', label: t.nav.reconciliation, icon: DollarSign, action: () => goTo('/rapprochement'), category: 'action', keywords: ['bank', 'reconciliation'] },
  ];

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
                  placeholder={cp.searchOrAsk}
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
                      {cp.navigation}
                    </p>
                    {navItems.map((item, i) => (
                      <button
                        key={item.id}
                        data-index={i}
                        onClick={() => { item.action(); hapticTap(); }}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={cn(
                          'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                          selectedIndex === i ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", selectedIndex === i && "text-primary")} />
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        {selectedIndex === i && <ArrowRight className="h-3.5 w-3.5 text-primary animate-fade-in" />}
                      </button>
                    ))}
                  </div>
                )}

                {actionItems.length > 0 && (
                  <div className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {cp.quickActions}
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
                            selectedIndex === idx ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", selectedIndex === idx && "text-primary")} />
                          <div className="flex-1 text-left">
                            <span className="font-medium">{item.label}</span>
                            {item.description && <span className="ml-2 text-xs text-muted-foreground/60">{item.description}</span>}
                          </div>
                          {selectedIndex === idx && <ArrowRight className="h-3.5 w-3.5 text-primary animate-fade-in" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {isAIQuery && (
                  <div className="mt-1 border-t border-border/20 pt-2">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      {cp.ai}
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
                        <span className="font-semibold">{cp.askAi}</span>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">"{query}"</p>
                      </div>
                      <Zap className="h-4 w-4 text-primary" />
                    </button>
                  </div>
                )}

                {filtered.length === 0 && !isAIQuery && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>{cp.noResults} "{query}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/20 text-[10px] text-muted-foreground/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border/30 bg-muted/30">↑↓</kbd> {cp.navigate}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border/30 bg-muted/30">↵</kbd> {cp.select}
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
