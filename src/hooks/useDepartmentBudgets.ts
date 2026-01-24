import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DepartmentBudget {
  id: string;
  department: string;
  department_label: string;
  month_year: string;
  budget_cap: number;
  alert_threshold_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentBudgetStatus {
  department: string;
  department_label: string;
  budget_cap: number;
  total_spent: number;
  total_pending: number;
  remaining: number;
  utilization_pct: number;
  alert_threshold_pct: number;
  is_over_budget: boolean;
  is_alert_triggered: boolean;
}

export function useDepartmentBudgets(monthYear?: string) {
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<DepartmentBudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = monthYear || new Date().toISOString().slice(0, 7);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch budget configurations
      const { data: budgetData, error: budgetError } = await supabase
        .from('department_budgets')
        .select('*')
        .eq('month_year', currentMonth)
        .eq('is_active', true)
        .order('department_label');

      if (budgetError) throw budgetError;
      setBudgets(budgetData || []);

      // Fetch spending summary
      const { data: spendingData, error: spendingError } = await supabase
        .from('department_spending_summary')
        .select('*')
        .eq('month_year', currentMonth);

      if (spendingError) {
        console.error('Error fetching spending summary:', spendingError);
      }

      // Combine budgets with spending data
      const statusList: DepartmentBudgetStatus[] = (budgetData || []).map(budget => {
        const spending = spendingData?.find(s => s.department === budget.department);
        const totalSpent = Number(spending?.total_approved || 0);
        const totalPending = Number(spending?.total_pending || 0);
        const remaining = budget.budget_cap - totalSpent;
        const utilizationPct = budget.budget_cap > 0 
          ? Math.round((totalSpent / budget.budget_cap) * 1000) / 10 
          : 0;

        return {
          department: budget.department,
          department_label: budget.department_label,
          budget_cap: budget.budget_cap,
          total_spent: totalSpent,
          total_pending: totalPending,
          remaining,
          utilization_pct: utilizationPct,
          alert_threshold_pct: budget.alert_threshold_pct,
          is_over_budget: totalSpent > budget.budget_cap,
          is_alert_triggered: utilizationPct >= budget.alert_threshold_pct,
        };
      });

      setBudgetStatus(statusList);
    } catch (error) {
      console.error('Error fetching department budgets:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const updateBudget = async (
    department: string, 
    updates: Partial<Pick<DepartmentBudget, 'budget_cap' | 'alert_threshold_pct'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('department_budgets')
        .update(updates)
        .eq('department', department)
        .eq('month_year', currentMonth);

      if (error) throw error;

      await fetchBudgets();
      return true;
    } catch (error) {
      console.error('Error updating budget:', error);
      return false;
    }
  };

  const createBudget = async (
    department: string,
    departmentLabel: string,
    budgetCap: number,
    alertThreshold: number = 80
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('department_budgets')
        .upsert({
          department,
          department_label: departmentLabel,
          month_year: currentMonth,
          budget_cap: budgetCap,
          alert_threshold_pct: alertThreshold,
          is_active: true,
          created_by: user?.id,
        }, {
          onConflict: 'department,month_year',
        });

      if (error) throw error;

      await fetchBudgets();
      return true;
    } catch (error) {
      console.error('Error creating budget:', error);
      return false;
    }
  };

  const copyBudgetsToNextMonth = async (): Promise<boolean> => {
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthYear = nextMonth.toISOString().slice(0, 7);

      const { data: { user } } = await supabase.auth.getUser();

      // Get current month budgets
      const currentBudgets = budgets.filter(b => b.is_active);

      // Insert for next month
      const newBudgets = currentBudgets.map(b => ({
        department: b.department,
        department_label: b.department_label,
        month_year: nextMonthYear,
        budget_cap: b.budget_cap,
        alert_threshold_pct: b.alert_threshold_pct,
        is_active: true,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('department_budgets')
        .upsert(newBudgets, {
          onConflict: 'department,month_year',
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error copying budgets:', error);
      return false;
    }
  };

  // Calculate totals
  const totals = {
    totalBudget: budgetStatus.reduce((sum, b) => sum + b.budget_cap, 0),
    totalSpent: budgetStatus.reduce((sum, b) => sum + b.total_spent, 0),
    totalPending: budgetStatus.reduce((sum, b) => sum + b.total_pending, 0),
    totalRemaining: budgetStatus.reduce((sum, b) => sum + b.remaining, 0),
    overBudgetCount: budgetStatus.filter(b => b.is_over_budget).length,
    alertCount: budgetStatus.filter(b => b.is_alert_triggered && !b.is_over_budget).length,
  };

  return {
    budgets,
    budgetStatus,
    totals,
    loading,
    refresh: fetchBudgets,
    updateBudget,
    createBudget,
    copyBudgetsToNextMonth,
  };
}
