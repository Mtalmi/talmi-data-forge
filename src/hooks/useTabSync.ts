import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

/**
 * Synchronizes active tab state with URL search params (?tab=xxx)
 * AND reads from location.state (for cross-page navigation).
 * 
 * @param defaultTab - The default tab id to use
 * @param tabMap - Optional map from aliases to canonical tab ids
 */
export function useTabSync(
  defaultTab: string,
  tabMap?: Record<string, string>
): [string, (tabId: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Resolve tab from URL param, then location.state, then default
  const resolveTab = (raw: string | null): string => {
    if (!raw) return defaultTab;
    if (tabMap && tabMap[raw]) return tabMap[raw];
    return raw;
  };

  const urlTab = searchParams.get('tab');
  const stateTab = (location.state as { activeTab?: string } | null)?.activeTab;

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    if (stateTab) return resolveTab(stateTab);
    if (urlTab) return resolveTab(urlTab);
    return defaultTab;
  });

  // Handle location.state changes (cross-page navigation)
  useEffect(() => {
    const state = location.state as { activeTab?: string } | null;
    if (state?.activeTab) {
      setActiveTabInternal(resolveTab(state.activeTab));
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Handle URL param changes (direct URL access)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const resolved = resolveTab(tab);
      setActiveTabInternal(resolved);
    }
  }, [searchParams]);

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabInternal(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  }, [setSearchParams]);

  return [activeTab, setActiveTab];
}
