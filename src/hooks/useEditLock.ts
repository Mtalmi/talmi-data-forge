import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface LockState {
  isLocked: boolean;
  lockedByMe: boolean;
  lockedByName: string | null;
  expiresAt: Date | null;
  loading: boolean;
}

interface UseEditLockOptions {
  tableName: 'devis' | 'bons_commande' | 'bons_livraison_reels' | 'factures';
  recordId: string | null;
  autoAcquire?: boolean;
  lockDurationMinutes?: number;
}

export function useEditLock({ 
  tableName, 
  recordId, 
  autoAcquire = false,
  lockDurationMinutes = 5 
}: UseEditLockOptions) {
  const { user } = useAuth();
  const [lockState, setLockState] = useState<LockState>({
    isLocked: false,
    lockedByMe: false,
    lockedByName: null,
    expiresAt: null,
    loading: false,
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!recordId || !user) return false;
    
    setLockState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase.rpc('acquire_edit_lock', {
        p_table_name: tableName,
        p_record_id: recordId,
        p_lock_duration_minutes: lockDurationMinutes,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; locked: boolean; locked_by_name?: string; expires_at?: string };
      
      if (result.success) {
        setLockState({
          isLocked: false,
          lockedByMe: true,
          lockedByName: null,
          expiresAt: result.expires_at ? new Date(result.expires_at) : null,
          loading: false,
        });
        
        // Set up auto-refresh to extend lock
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = setInterval(() => {
          supabase.rpc('acquire_edit_lock', {
            p_table_name: tableName,
            p_record_id: recordId,
            p_lock_duration_minutes: lockDurationMinutes,
          });
        }, (lockDurationMinutes - 1) * 60 * 1000);
        
        return true;
      } else {
        setLockState({
          isLocked: true,
          lockedByMe: false,
          lockedByName: result.locked_by_name || 'Un autre utilisateur',
          expiresAt: result.expires_at ? new Date(result.expires_at) : null,
          loading: false,
        });
        
        toast.warning(`Ce document est en cours de modification par ${result.locked_by_name || 'un autre utilisateur'}`, {
          description: 'Mode lecture seule activé pour éviter les conflits.',
          duration: 5000,
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error acquiring lock:', error);
      setLockState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [recordId, tableName, user, lockDurationMinutes]);

  const releaseLock = useCallback(async () => {
    if (!recordId || !user || !lockState.lockedByMe) return;
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    try {
      await supabase.rpc('release_edit_lock', {
        p_table_name: tableName,
        p_record_id: recordId,
      });
      
      setLockState({
        isLocked: false,
        lockedByMe: false,
        lockedByName: null,
        expiresAt: null,
        loading: false,
      });
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }, [recordId, tableName, user, lockState.lockedByMe]);

  // Auto-acquire lock if enabled
  useEffect(() => {
    if (autoAcquire && recordId) {
      acquireLock();
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoAcquire, recordId, acquireLock]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (lockState.lockedByMe && recordId) {
        // Fire and forget - don't need to handle promise
        void supabase.rpc('release_edit_lock', {
          p_table_name: tableName,
          p_record_id: recordId,
        });
      }
    };
  }, [lockState.lockedByMe, recordId, tableName]);

  return {
    ...lockState,
    acquireLock,
    releaseLock,
    canEdit: !lockState.isLocked && lockState.lockedByMe,
    isReadOnly: lockState.isLocked && !lockState.lockedByMe,
  };
}
