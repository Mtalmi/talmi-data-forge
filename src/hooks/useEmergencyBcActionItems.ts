import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ActionItem {
  id: string;
  action_code: string;
  action_name: string;
  action_type: string;
  phase: number;
  phase_name: string;
  assigned_to: string;
  assigned_to_role: string;
  deadline_minutes: number;
  deadline_at: string;
  priority: string;
  status: string;
  steps: string[];
  checklist: string[];
  success_criteria: string[];
  escalation_after_minutes: number;
  escalate_to: string;
  escalated: boolean;
  escalated_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  completed_by_name: string | null;
  is_overdue: boolean;
  should_escalate: boolean;
  minutes_remaining: number;
}

export interface EscalationContact {
  id: string;
  level: number;
  role: string;
  name: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  availability: string;
  response_time_sla_minutes: number;
  is_active: boolean;
}

export function useEmergencyBcActionItems(notificationId?: string) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [escalationContacts, setEscalationContacts] = useState<EscalationContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionItems = useCallback(async () => {
    if (!notificationId) {
      setActionItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase.rpc('get_emergency_bc_action_items', {
        p_notification_id: notificationId
      });

      if (fetchError) throw fetchError;

      setActionItems((data || []) as unknown as ActionItem[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching action items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  const fetchEscalationContacts = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('escalation_contacts')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (fetchError) throw fetchError;

      setEscalationContacts(data || []);
    } catch (err: any) {
      console.error('Error fetching escalation contacts:', err);
    }
  }, []);

  // Create action items for a notification
  const createActionItems = useCallback(async (
    pNotificationId: string,
    bcId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('create_emergency_bc_action_items', {
        p_notification_id: pNotificationId,
        p_bc_id: bcId
      });

      if (error) throw error;

      toast.success('Action items créés pour l\'équipe de production');
      await fetchActionItems();
      return true;
    } catch (err: any) {
      console.error('Error creating action items:', err);
      toast.error(err.message || 'Erreur lors de la création des actions');
      return false;
    }
  }, [fetchActionItems]);

  // Update action item status
  const updateStatus = useCallback(async (
    actionId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED' | 'FAILED',
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('update_action_item_status', {
        p_action_id: actionId,
        p_status: status,
        p_notes: notes || null
      });

      if (error) throw error;

      const statusLabels: Record<string, string> = {
        'PENDING': 'En attente',
        'IN_PROGRESS': 'En cours',
        'COMPLETED': 'Terminé',
        'ESCALATED': 'Escaladé',
        'FAILED': 'Échoué'
      };

      toast.success(`Action: ${statusLabels[status] || status}`);
      await fetchActionItems();
      return true;
    } catch (err: any) {
      console.error('Error updating action status:', err);
      toast.error(err.message || 'Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchActionItems]);

  // Start an action
  const startAction = useCallback(async (actionId: string): Promise<boolean> => {
    return updateStatus(actionId, 'IN_PROGRESS');
  }, [updateStatus]);

  // Complete an action
  const completeAction = useCallback(async (
    actionId: string,
    notes?: string
  ): Promise<boolean> => {
    return updateStatus(actionId, 'COMPLETED', notes);
  }, [updateStatus]);

  // Escalate an action
  const escalateAction = useCallback(async (
    actionId: string,
    reason?: string
  ): Promise<boolean> => {
    return updateStatus(actionId, 'ESCALATED', reason);
  }, [updateStatus]);

  // Initial fetch
  useEffect(() => {
    fetchActionItems();
    fetchEscalationContacts();
  }, [fetchActionItems, fetchEscalationContacts]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!notificationId) return;

    const channel = supabase
      .channel(`action-items-${notificationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergency_bc_action_items',
        filter: `notification_id=eq.${notificationId}`
      }, () => {
        fetchActionItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notificationId, fetchActionItems]);

  // Computed values
  const completedCount = actionItems.filter(a => a.status === 'COMPLETED').length;
  const pendingCount = actionItems.filter(a => a.status === 'PENDING').length;
  const overdueCount = actionItems.filter(a => a.is_overdue).length;
  const escalatedCount = actionItems.filter(a => a.escalated).length;

  const phaseProgress = actionItems.reduce((acc, item) => {
    if (!acc[item.phase]) {
      acc[item.phase] = { phase: item.phase, phase_name: item.phase_name, total: 0, completed: 0 };
    }
    acc[item.phase].total++;
    if (item.status === 'COMPLETED') {
      acc[item.phase].completed++;
    }
    return acc;
  }, {} as Record<number, { phase: number; phase_name: string; total: number; completed: number }>);

  return {
    actionItems,
    escalationContacts,
    loading,
    error,
    createActionItems,
    updateStatus,
    startAction,
    completeAction,
    escalateAction,
    refetch: fetchActionItems,
    // Computed
    completedCount,
    pendingCount,
    overdueCount,
    escalatedCount,
    totalCount: actionItems.length,
    progressPercent: actionItems.length > 0 
      ? Math.round((completedCount / actionItems.length) * 100) 
      : 0,
    phaseProgress: Object.values(phaseProgress)
  };
}
