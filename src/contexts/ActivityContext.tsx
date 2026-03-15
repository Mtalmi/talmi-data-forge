import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';

export type ActivityType = 'action' | 'alert' | 'system' | 'ai';
export type ActivitySeverity = 'info' | 'success' | 'warning' | 'critical';

export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO
  type: ActivityType;
  message: string;
  source: string;
  severity: ActivitySeverity;
  isNew?: boolean;
}

interface ActivityContextValue {
  entries: ActivityEntry[];
  unreadCount: number;
  log: (type: ActivityType, message: string, source: string, severity: ActivitySeverity) => void;
  markAllRead: () => void;
}

const STORAGE_KEY = 'tbos_activity_log';
const MAX_MEMORY = 100;
const MAX_STORAGE = 50;

function loadFromStorage(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_STORAGE) : [];
  } catch { return []; }
}

function saveToStorage(entries: ActivityEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_STORAGE)));
  } catch { /* quota exceeded — ignore */ }
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>(() => loadFromStorage());
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);
  const logRef = useRef<ActivityContextValue['log']>(null!);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const log = useCallback((type: ActivityType, message: string, source: string, severity: ActivitySeverity) => {
    const entry: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      source,
      severity,
      isNew: true,
    };
    setEntries(prev => {
      const next = [entry, ...prev].slice(0, MAX_MEMORY);
      saveToStorage(next);
      return next;
    });
    setUnreadCount(prev => prev + 1);

    // Clear isNew flag after animation
    setTimeout(() => {
      if (!mountedRef.current) return;
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isNew: false } : e));
    }, 1500);
  }, []);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return (
    <ActivityContext.Provider value={{ entries, unreadCount, log, markAllRead }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}

/**
 * Standalone log function for use outside React components (e.g., utility functions).
 * Dispatches a custom event that the ActivityProvider listens for.
 */
export function logActivityEvent(type: ActivityType, message: string, source: string, severity: ActivitySeverity) {
  window.dispatchEvent(new CustomEvent('tbos-activity', { detail: { type, message, source, severity } }));
}
