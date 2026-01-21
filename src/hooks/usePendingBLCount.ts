import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePendingBLCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const { count: pendingCount, error } = await supabase
        .from('bons_livraison_reels')
        .select('*', { count: 'exact', head: true })
        .eq('workflow_status', 'en_attente_validation');

      if (error) throw error;
      setCount(pendingCount || 0);
    } catch (err) {
      console.error('Error fetching pending BL count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    // Subscribe to realtime changes on bons_livraison_reels
    const channel = supabase
      .channel('pending-bl-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bons_livraison_reels',
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
}
