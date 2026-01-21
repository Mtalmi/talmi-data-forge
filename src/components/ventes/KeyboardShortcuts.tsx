import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface KeyboardShortcutsProps {
  onNewQuote?: () => void;
  onNewOrder?: () => void;
  onFocusSearch?: () => void;
  onNextItem?: () => void;
  onPrevItem?: () => void;
  onEditSelected?: () => void;
  onRefresh?: () => void;
  onToggleTab?: () => void;
  enabled?: boolean;
}

export function useVentesKeyboardShortcuts({
  onNewQuote,
  onNewOrder,
  onFocusSearch,
  onNextItem,
  onPrevItem,
  onEditSelected,
  onRefresh,
  onToggleTab,
  enabled = true,
}: KeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape to blur inputs
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

    // Prevent default for shortcuts
    const key = event.key.toLowerCase();
    
    switch (key) {
      case 'n':
        if (event.shiftKey) {
          event.preventDefault();
          onNewOrder?.();
        } else {
          event.preventDefault();
          onNewQuote?.();
        }
        break;
        
      case '/':
        event.preventDefault();
        onFocusSearch?.();
        break;
        
      case 'j':
        event.preventDefault();
        onNextItem?.();
        break;
        
      case 'k':
        event.preventDefault();
        onPrevItem?.();
        break;
        
      case 'e':
        event.preventDefault();
        onEditSelected?.();
        break;
        
      case 'r':
        if (!event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          onRefresh?.();
        }
        break;
        
      case 'tab':
        if (event.shiftKey) {
          event.preventDefault();
          onToggleTab?.();
        }
        break;
        
      case '?':
        event.preventDefault();
        showShortcutsHelp();
        break;
    }
  }, [onNewQuote, onNewOrder, onFocusSearch, onNextItem, onPrevItem, onEditSelected, onRefresh, onToggleTab]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

function showShortcutsHelp() {
  toast.info(
    <div className="space-y-2">
      <p className="font-semibold">Raccourcis Clavier</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="font-mono bg-muted px-1 rounded">N</span>
        <span>Nouveau Devis</span>
        <span className="font-mono bg-muted px-1 rounded">⇧N</span>
        <span>Nouvelle Commande</span>
        <span className="font-mono bg-muted px-1 rounded">/</span>
        <span>Rechercher</span>
        <span className="font-mono bg-muted px-1 rounded">J</span>
        <span>Élément suivant</span>
        <span className="font-mono bg-muted px-1 rounded">K</span>
        <span>Élément précédent</span>
        <span className="font-mono bg-muted px-1 rounded">E</span>
        <span>Modifier</span>
        <span className="font-mono bg-muted px-1 rounded">R</span>
        <span>Actualiser</span>
        <span className="font-mono bg-muted px-1 rounded">⇧Tab</span>
        <span>Changer d'onglet</span>
      </div>
    </div>,
    { duration: 6000 }
  );
}

export function KeyboardShortcutsHint() {
  return (
    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
      <span className="font-mono bg-muted px-1.5 py-0.5 rounded">?</span>
      <span>Raccourcis</span>
    </div>
  );
}
