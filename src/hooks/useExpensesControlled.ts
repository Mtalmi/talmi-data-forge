import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type ExpenseControlled = Database['public']['Tables']['expenses_controlled']['Row'];
export type ExpenseCategory = Database['public']['Enums']['expense_category'];
export type ExpenseStatus = Database['public']['Enums']['expense_status'];
export type ExpenseApprovalLevel = Database['public']['Enums']['expense_approval_level'];

export interface ExpenseFilters {
  status?: ExpenseStatus | 'all';
  level?: ExpenseApprovalLevel | 'all';
  category?: ExpenseCategory | 'all';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ExpenseStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  blocked: number;
  totalAmount: number;
  pendingAmount: number;
}

export function useExpensesControlled(filters: ExpenseFilters = {}) {
  const [expenses, setExpenses] = useState<ExpenseControlled[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    blocked: 0,
    totalAmount: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('expenses_controlled')
        .select('*')
        .order('requested_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('statut', filters.status);
      }
      if (filters.level && filters.level !== 'all') {
        query = query.eq('approval_level', filters.level);
      }
      if (filters.category && filters.category !== 'all') {
        query = query.eq('categorie', filters.category);
      }
      if (filters.dateFrom) {
        query = query.gte('requested_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('requested_at', `${filters.dateTo}T23:59:59`);
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,requested_by_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setExpenses(data || []);

      // Calculate stats from all expenses (not filtered)
      const { data: allData } = await supabase
        .from('expenses_controlled')
        .select('statut, montant_ttc');

      if (allData) {
        const statsCalc = allData.reduce(
          (acc, exp) => {
            acc.total++;
            acc.totalAmount += exp.montant_ttc || 0;
            
            switch (exp.statut) {
              case 'en_attente':
                acc.pending++;
                acc.pendingAmount += exp.montant_ttc || 0;
                break;
              case 'approuve':
                acc.approved++;
                break;
              case 'rejete':
                acc.rejected++;
                break;
              case 'paye':
                acc.paid++;
                break;
              case 'bloque_plafond':
                acc.blocked++;
                acc.pendingAmount += exp.montant_ttc || 0;
                break;
            }
            return acc;
          },
          { total: 0, pending: 0, approved: 0, rejected: 0, paid: 0, blocked: 0, totalAmount: 0, pendingAmount: 0 }
        );
        setStats(statsCalc);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.level, filters.category, filters.dateFrom, filters.dateTo, filters.search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const approveExpense = async (
    id: string, 
    level: 'level1' | 'level2' | 'level3',
    notes?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const updateData: Record<string, unknown> = {
        statut: 'approuve',
      };

      // Set level-specific approval data
      const levelKey = `level${level.replace('level', '')}` as 'level1' | 'level2' | 'level3';
      updateData[`${levelKey}_approved_by`] = user.id;
      updateData[`${levelKey}_approved_by_name`] = profile?.full_name || 'Utilisateur';
      updateData[`${levelKey}_approved_at`] = new Date().toISOString();
      if (notes) {
        updateData[`${levelKey}_notes`] = notes;
      }

      const { error } = await supabase
        .from('expenses_controlled')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error approving expense:', error);
      return false;
    }
  };

  const rejectExpense = async (id: string, reason: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('expenses_controlled')
        .update({
          statut: 'rejete',
          rejected_by: user.id,
          rejected_by_name: profile?.full_name || 'Utilisateur',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error rejecting expense:', error);
      return false;
    }
  };

  const markAsPaid = async (id: string, paymentMethod: string, paymentRef?: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('expenses_controlled')
        .update({
          statut: 'paye',
          paid_by: user.id,
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
          payment_reference: paymentRef || null,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error marking as paid:', error);
      return false;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expenses_controlled')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  };

  const overrideCap = async (id: string, reason: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('expenses_controlled')
        .update({
          statut: 'approuve',
          was_blocked_by_cap: true,
          cap_override_by: user.id,
          cap_override_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error overriding cap:', error);
      return false;
    }
  };

  return {
    expenses,
    stats,
    loading,
    refresh: fetchExpenses,
    approveExpense,
    rejectExpense,
    markAsPaid,
    deleteExpense,
    overrideCap,
  };
}
