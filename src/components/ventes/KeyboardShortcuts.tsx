import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

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
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

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
        // Toast is triggered externally via KeyboardShortcutsHint
        document.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
        break;
    }
  }, [onNewQuote, onNewOrder, onFocusSearch, onNextItem, onPrevItem, onEditSelected, onRefresh, onToggleTab]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export function KeyboardShortcutsHint() {
  const { t } = useI18n();
  const ks = t.keyboardShortcuts;

  useEffect(() => {
    const handler = () => {
      toast.info(
        <div className="space-y-2">
          <p className="font-semibold">{ks.title}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="font-mono bg-muted px-1 rounded">N</span>
            <span>{ks.newQuote}</span>
            <span className="font-mono bg-muted px-1 rounded">⇧N</span>
            <span>{ks.newOrder}</span>
            <span className="font-mono bg-muted px-1 rounded">/</span>
            <span>{ks.search}</span>
            <span className="font-mono bg-muted px-1 rounded">J</span>
            <span>{ks.nextItem}</span>
            <span className="font-mono bg-muted px-1 rounded">K</span>
            <span>{ks.prevItem}</span>
            <span className="font-mono bg-muted px-1 rounded">E</span>
            <span>{ks.edit}</span>
            <span className="font-mono bg-muted px-1 rounded">R</span>
            <span>{ks.refresh}</span>
            <span className="font-mono bg-muted px-1 rounded">⇧Tab</span>
            <span>{ks.changeTab}</span>
          </div>
        </div>,
        { duration: 6000 }
      );
    };
    document.addEventListener('show-keyboard-shortcuts', handler);
    return () => document.removeEventListener('show-keyboard-shortcuts', handler);
  }, [ks]);

  return (
    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
      <span className="font-mono bg-muted px-1.5 py-0.5 rounded">?</span>
      <span>{ks.shortcuts}</span>
    </div>
  );
}
