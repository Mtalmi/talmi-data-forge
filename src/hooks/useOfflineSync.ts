import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingOperation {
  id: string;
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId?: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'tbos_offline_queue';
const MAX_RETRIES = 3;

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  // Load pending operations from localStorage
  const getPendingOperations = useCallback((): PendingOperation[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save pending operations to localStorage
  const savePendingOperations = useCallback((ops: PendingOperation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
      setPendingCount(ops.length);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, []);

  // Add operation to queue
  const queueOperation = useCallback((
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, unknown>,
    recordId?: string
  ): string => {
    const id = crypto.randomUUID();
    const newOp: PendingOperation = {
      id,
      tableName,
      operation,
      recordId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const current = getPendingOperations();
    savePendingOperations([...current, newOp]);

    if (!isOnline) {
      toast.info('Mode hors-ligne: Données sauvegardées localement', {
        description: 'Synchronisation automatique dès la reconnexion',
        icon: '📴',
      });
    }

    return id;
  }, [getPendingOperations, savePendingOperations, isOnline]);

  // Execute a single operation
  const executeOperation = useCallback(async (op: PendingOperation): Promise<boolean> => {
    try {
      switch (op.operation) {
        case 'INSERT': {
          const { error } = await supabase
            .from(op.tableName as 'depenses')
            .insert(op.data as never);
          if (error) throw error;
          break;
        }
        case 'UPDATE': {
          if (!op.recordId) throw new Error('Record ID required for UPDATE');
          const { error } = await supabase
            .from(op.tableName as 'depenses')
            .update(op.data as never)
            .eq('id', op.recordId);
          if (error) throw error;
          break;
        }
        case 'DELETE': {
          if (!op.recordId) throw new Error('Record ID required for DELETE');
          const { error } = await supabase
            .from(op.tableName as 'depenses')
            .delete()
            .eq('id', op.recordId);
          if (error) throw error;
          break;
        }
      }
      return true;
    } catch (error) {
      console.error(`Failed to sync operation ${op.id}:`, error);
      return false;
    }
  }, []);

  // Sync all pending operations
  const syncAll = useCallback(async () => {
    if (syncingRef.current || !isOnline) return;
    
    syncingRef.current = true;
    setIsSyncing(true);

    const operations = getPendingOperations();
    if (operations.length === 0) {
      setIsSyncing(false);
      syncingRef.current = false;
      return;
    }

    let synced = 0;
    const failed: PendingOperation[] = [];

    for (const op of operations) {
      const success = await executeOperation(op);
      if (success) {
        synced++;
      } else {
        if (op.retryCount < MAX_RETRIES) {
          failed.push({ ...op, retryCount: op.retryCount + 1 });
        } else {
          // Log permanently failed operations
          console.error('Operation permanently failed after max retries:', op);
        }
      }
    }

    savePendingOperations(failed);

    if (synced > 0) {
      toast.success(`${synced} opération(s) synchronisée(s)`, {
        description: failed.length > 0 
          ? `${failed.length} en attente de réessai` 
          : 'Toutes les données sont à jour',
        icon: '✅',
      });
    }

    setIsSyncing(false);
    syncingRef.current = false;
  }, [isOnline, getPendingOperations, executeOperation, savePendingOperations]);

  // Remove specific operation from queue
  const removeFromQueue = useCallback((id: string) => {
    const current = getPendingOperations();
    savePendingOperations(current.filter(op => op.id !== id));
  }, [getPendingOperations, savePendingOperations]);

  // Clear all pending operations
  const clearQueue = useCallback(() => {
    savePendingOperations([]);
  }, [savePendingOperations]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie', {
        description: 'Synchronisation en cours...',
        icon: '🌐',
      });
      // Auto-sync when coming back online
      setTimeout(syncAll, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Mode hors-ligne', {
        description: 'Les données seront sauvegardées localement',
        icon: '📴',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    setPendingCount(getPendingOperations().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [getPendingOperations, syncAll]);

  // Periodic sync attempt
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      const pending = getPendingOperations();
      if (pending.length > 0 && !syncingRef.current) {
        syncAll();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, getPendingOperations, syncAll]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    queueOperation,
    syncAll,
    removeFromQueue,
    clearQueue,
    getPendingOperations,
  };
}
