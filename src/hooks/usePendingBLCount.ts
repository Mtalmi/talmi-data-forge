import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePendingBLCount() {
  const [count, setCount] = useState(0);
  const [earliestDate, setEarliestDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const [countRes, earliestRes] = await Promise.all([
        supabase
          .from('bons_livraison_reels')
          .select('*', { count: 'exact', head: true })
          .eq('workflow_status', 'en_attente_validation'),
        supabase
          .from('bons_livraison_reels')
          .select('date_livraison')
          .eq('workflow_status', 'en_attente_validation')
          .order('date_livraison', { ascending: true })
          .limit(1),
      ]);

      if (countRes.error) throw countRes.error;
      if (earliestRes.error) throw earliestRes.error;

      setCount(countRes.count || 0);
      setEarliestDate(earliestRes.data?.[0]?.date_livraison ?? null);
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

  return { count, earliestDate, loading, refetch: fetchCount };
}
