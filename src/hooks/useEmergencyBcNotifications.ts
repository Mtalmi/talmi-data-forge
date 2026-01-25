import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyBcNotification {
  id: string;
  notification_id: string;
  notification_type: 'PRODUCTION_TEAM' | 'RESP_TECHNIQUE';
  bc_id: string;
  bc_uuid: string;
  approval_id: string;
  recipient_id: string;
  recipient_role: string;
  recipient_name: string | null;
  severity: string;
  data_fields: Record<string, any>;
  bc_status: string;
  bc_approved_by: string;
  bc_approved_at: string;
  material_type: string;
  material_code: string;
  quantity: number;
  quantity_unit: string;
  delivery_date: string;
  emergency_reason: string;
  emergency_trigger: string;
  production_impact: string;
  sent: boolean;
  sent_at: string | null;
  sent_via: string[];
  read: boolean;
  read_at: string | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  acknowledged_by_name: string | null;
  action_items_completed: any[];
  quality_decision: string | null;
  quality_decision_at: string | null;
  quality_decision_by: string | null;
  quality_decision_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmergencyBcNotifications() {
  const [productionNotifications, setProductionNotifications] = useState<EmergencyBcNotification[]>([]);
  const [qcNotifications, setQcNotifications] = useState<EmergencyBcNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('emergency_bc_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const notifications = (data || []) as unknown as EmergencyBcNotification[];
      
      setProductionNotifications(
        notifications.filter(n => n.notification_type === 'PRODUCTION_TEAM')
      );
      setQcNotifications(
        notifications.filter(n => n.notification_type === 'RESP_TECHNIQUE')
      );
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching emergency BC notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create notifications after approval
  const createNotifications = useCallback(async (approvalId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('create_emergency_bc_notifications', {
        p_approval_id: approvalId
      });

      if (error) throw error;

      toast.success('Notifications créées pour Production et Resp. Technique');
      await fetchNotifications();
      return true;
    } catch (err: any) {
      console.error('Error creating notifications:', err);
      toast.error(err.message || 'Erreur lors de la création des notifications');
      return false;
    }
  }, [fetchNotifications]);

  // Send email notifications
  const sendEmailNotifications = useCallback(async (
    approvalId: string,
    bcId: string,
    notificationType: 'PRODUCTION_TEAM' | 'RESP_TECHNIQUE' | 'BOTH' = 'BOTH',
    recipientEmails?: string[]
  ): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('send-emergency-bc-notification', {
        body: {
          approval_id: approvalId,
          bc_id: bcId,
          notification_type: notificationType,
          recipient_emails: recipientEmails
        }
      });

      if (response.error) throw response.error;

      toast.success('Emails de notification envoyés');
      await fetchNotifications();
      return true;
    } catch (err: any) {
      console.error('Error sending email notifications:', err);
      toast.error(err.message || 'Erreur lors de l\'envoi des emails');
      return false;
    }
  }, [fetchNotifications]);

  // Acknowledge a notification
  const acknowledgeNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('acknowledge_emergency_notification', {
        p_notification_id: notificationId
      });

      if (error) throw error;

      toast.success('Notification acquittée');
      await fetchNotifications();
      return true;
    } catch (err: any) {
      console.error('Error acknowledging notification:', err);
      toast.error(err.message || 'Erreur lors de l\'acquittement');
      return false;
    }
  }, [fetchNotifications]);

  // Submit quality decision
  const submitQualityDecision = useCallback(async (
    notificationId: string,
    decision: 'APPROVE' | 'APPROVE_WITH_NOTES' | 'HOLD_FOR_RETEST' | 'REJECT',
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('submit_emergency_quality_decision', {
        p_notification_id: notificationId,
        p_decision: decision,
        p_notes: notes || null
      });

      if (error) throw error;

      toast.success(`Décision qualité enregistrée: ${decision}`);
      await fetchNotifications();
      return true;
    } catch (err: any) {
      console.error('Error submitting quality decision:', err);
      toast.error(err.message || 'Erreur lors de la soumission');
      return false;
    }
  }, [fetchNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('emergency_bc_notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      await fetchNotifications();
      return true;
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('emergency-bc-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergency_bc_notifications'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    productionNotifications,
    qcNotifications,
    loading,
    error,
    createNotifications,
    sendEmailNotifications,
    acknowledgeNotification,
    submitQualityDecision,
    markAsRead,
    refetch: fetchNotifications,
    // Computed values
    unreadProductionCount: productionNotifications.filter(n => !n.read).length,
    unreadQcCount: qcNotifications.filter(n => !n.read).length,
    pendingQcDecisions: qcNotifications.filter(n => !n.quality_decision).length
  };
}
