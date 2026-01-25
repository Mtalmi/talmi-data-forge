import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TightTimesTrigger = 
  | 'STOCK_CRITICAL'
  | 'ORDER_SURGE'
  | 'EQUIPMENT_BREAKDOWN'
  | 'SUPPLIER_FAILURE'
  | 'QUALITY_ISSUE'
  | 'MANUAL';

interface TightTimesStatus {
  id: string;
  status: 'ACTIVE' | 'INACTIVE';
  reason: string;
  triggered_by: TightTimesTrigger;
  activated_by_name: string | null;
  activated_at: string;
  expires_at: string;
  duration_minutes: number;
  affected_materials: string[] | null;
  remaining_minutes?: number;
}

interface EmergencyBcEligibility {
  can_create_emergency_bc: boolean;
  condition_met: 'AFTER_18H_SAME_DAY' | 'TIGHT_TIMES' | null;
  reason: string | null;
  current_hour: number;
  current_date: string;
  delivery_date: string;
  is_after_18h: boolean;
  is_same_day: boolean;
  tight_times_active: boolean;
  tight_times_details: TightTimesStatus | null;
  approval_required: boolean;
  approval_timeout_minutes: number;
}

interface StockCriticality {
  has_critical_stocks: boolean;
  critical_stocks: Array<{
    materiau: string;
    quantite_actuelle: number;
    seuil_alerte: number;
    unite: string;
    avg_daily_consumption: number;
    days_remaining: number;
    is_critical: boolean;
  }>;
}

interface PendingApproval {
  id: string;
  bc_id: string;
  requested_by_name: string | null;
  requested_at: string;
  expires_at: string;
  emergency_condition: string;
  emergency_reason: string;
  delivery_date: string;
  status: string;
  remaining_minutes: number;
}

export function useTightTimes() {
  const [tightTimesStatus, setTightTimesStatus] = useState<TightTimesStatus | null>(null);
  const [stockCriticality, setStockCriticality] = useState<StockCriticality | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTightTimesStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_tight_times');
      
      if (error) throw error;
      
      // Check if we got an empty object (no active tight times)
      const jsonData = data as unknown as Record<string, unknown>;
      if (jsonData && Object.keys(jsonData).length > 0 && jsonData.id) {
        setTightTimesStatus(jsonData as unknown as TightTimesStatus);
      } else {
        setTightTimesStatus(null);
      }
    } catch (error) {
      console.error('Error fetching tight times status:', error);
    }
  }, []);

  const fetchStockCriticality = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('check_stock_criticality');
      
      if (error) throw error;
      setStockCriticality(data as unknown as StockCriticality);
    } catch (error) {
      console.error('Error fetching stock criticality:', error);
    }
  }, []);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_bc_approvals')
        .select('*')
        .eq('status', 'PENDING')
        .gt('expires_at', new Date().toISOString())
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate remaining minutes
      const approvalsWithTime = (data || []).map(a => ({
        ...a,
        remaining_minutes: Math.max(0, Math.floor(
          (new Date(a.expires_at).getTime() - Date.now()) / 60000
        ))
      }));
      
      setPendingApprovals(approvalsWithTime);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  }, []);

  const checkEmergencyEligibility = useCallback(async (deliveryDate: Date): Promise<EmergencyBcEligibility | null> => {
    try {
      const dateStr = deliveryDate.toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('check_emergency_bc_eligibility', {
        p_delivery_date: dateStr
      });
      
      if (error) throw error;
      return data as unknown as EmergencyBcEligibility;
    } catch (error) {
      console.error('Error checking emergency eligibility:', error);
      return null;
    }
  }, []);

  const activateTightTimes = useCallback(async (
    reason: string,
    triggeredBy: TightTimesTrigger,
    durationMinutes: number = 120,
    affectedMaterials?: string[],
    notes?: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('activate_tight_times', {
        p_reason: reason,
        p_triggered_by: triggeredBy,
        p_duration_minutes: durationMinutes,
        p_affected_materials: affectedMaterials || null,
        p_notes: notes || null
      });
      
      if (error) throw error;
      
      toast.success(`Mode TIGHT TIMES activé pour ${durationMinutes} minutes`);
      await fetchTightTimesStatus();
      return data as string;
    } catch (error: any) {
      console.error('Error activating tight times:', error);
      toast.error(error.message || 'Erreur lors de l\'activation du mode TIGHT TIMES');
      return null;
    }
  }, [fetchTightTimesStatus]);

  const deactivateTightTimes = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('deactivate_tight_times');
      
      if (error) throw error;
      
      toast.success('Mode TIGHT TIMES désactivé');
      await fetchTightTimesStatus();
      return true;
    } catch (error: any) {
      console.error('Error deactivating tight times:', error);
      toast.error(error.message || 'Erreur lors de la désactivation');
      return false;
    }
  }, [fetchTightTimesStatus]);

  const createEmergencyBcApproval = useCallback(async (
    bcId: string,
    bcUuid: string,
    deliveryDate: Date,
    emergencyReason: string
  ): Promise<string | null> => {
    try {
      const dateStr = deliveryDate.toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('create_emergency_bc_approval', {
        p_bc_id: bcId,
        p_bc_uuid: bcUuid,
        p_delivery_date: dateStr,
        p_emergency_reason: emergencyReason
      });
      
      if (error) throw error;
      
      toast.warning(`Demande d'approbation envoyée. Expire dans 30 minutes.`);
      await fetchPendingApprovals();
      return data as string;
    } catch (error: any) {
      console.error('Error creating emergency BC approval:', error);
      toast.error(error.message || 'Erreur lors de la création de la demande');
      return null;
    }
  }, [fetchPendingApprovals]);

  const processApproval = useCallback(async (
    approvalId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('process_emergency_bc_approval', {
        p_approval_id: approvalId,
        p_action: action,
        p_notes: notes || null
      });
      
      if (error) throw error;
      
      if (action === 'APPROVE') {
        toast.success('BC Urgence approuvé - Production et Resp. Technique notifiés');
      } else {
        toast.info('BC Urgence refusé');
      }
      
      await fetchPendingApprovals();
      return true;
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast.error(error.message || 'Erreur lors du traitement');
      return false;
    }
  }, [fetchPendingApprovals]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTightTimesStatus(),
        fetchStockCriticality(),
        fetchPendingApprovals()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchTightTimesStatus, fetchStockCriticality, fetchPendingApprovals]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('tight-times-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tight_times_status',
      }, () => {
        fetchTightTimesStatus();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergency_bc_approvals',
      }, () => {
        fetchPendingApprovals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTightTimesStatus, fetchPendingApprovals]);

  // Auto-refresh pending approvals every minute to update remaining time
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingApprovals.length > 0) {
        fetchPendingApprovals();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [pendingApprovals.length, fetchPendingApprovals]);

  return {
    tightTimesStatus,
    stockCriticality,
    pendingApprovals,
    loading,
    isTightTimesActive: !!tightTimesStatus,
    checkEmergencyEligibility,
    activateTightTimes,
    deactivateTightTimes,
    createEmergencyBcApproval,
    processApproval,
    refetch: () => Promise.all([
      fetchTightTimesStatus(),
      fetchStockCriticality(),
      fetchPendingApprovals()
    ])
  };
}
