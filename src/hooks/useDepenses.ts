import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Depense {
  id: string;
  date_depense: string;
  categorie: string;
  montant: number;
  description: string | null;
  photo_recu_url: string;
  created_by: string;
  created_at: string;
}

export interface DepenseStats {
  totalDepenses: number;
  byCategorie: Record<string, number>;
  countByCategorie: Record<string, number>;
}

export function useDepenses(startDate?: string, endDate?: string) {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [stats, setStats] = useState<DepenseStats>({
    totalDepenses: 0,
    byCategorie: {},
    countByCategorie: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchDepenses = useCallback(async () => {
    try {
      let query = supabase
        .from('depenses')
        .select('*')
        .order('date_depense', { ascending: false });

      if (startDate) {
        query = query.gte('date_depense', startDate);
      }
      if (endDate) {
        query = query.lte('date_depense', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDepenses(data || []);

      // Calculate stats
      const totalDepenses = data?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0;
      const byCategorie: Record<string, number> = {};
      const countByCategorie: Record<string, number> = {};

      data?.forEach((d) => {
        byCategorie[d.categorie] = (byCategorie[d.categorie] || 0) + d.montant;
        countByCategorie[d.categorie] = (countByCategorie[d.categorie] || 0) + 1;
      });

      setStats({ totalDepenses, byCategorie, countByCategorie });
    } catch (error) {
      console.error('Error fetching depenses:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDepenses();
  }, [fetchDepenses]);

  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      return null;
    }
  };

  const addDepense = async (
    depense: Omit<Depense, 'id' | 'created_at' | 'created_by'>
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('depenses').insert([{
        ...depense,
        created_by: user.id,
      }]);

      if (error) throw error;

      await fetchDepenses();
      return true;
    } catch (error) {
      console.error('Error adding depense:', error);
      return false;
    }
  };

  const deleteDepense = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchDepenses();
      return true;
    } catch (error) {
      console.error('Error deleting depense:', error);
      return false;
    }
  };

  return {
    depenses,
    stats,
    loading,
    refresh: fetchDepenses,
    uploadReceipt,
    addDepense,
    deleteDepense,
  };
}
