import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { playSound } from '@/lib/sounds';

export interface SystemAlert {
  id: string;
  type_alerte: string;
  niveau: string;
  titre: string;
  message: string;
  reference_id: string | null;
  reference_table: string | null;
  destinataire_role: string | null;
  lu: boolean;
  lu_par: string | null;
  lu_at: string | null;
  dismissible: boolean;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  warning: number;
  info: number;
}

// Alert type to route mapping
const ALERT_ROUTES: Record<string, string> = {
  'qualite_critique': '/laboratoire',
  'stock_critique': '/stocks',
  'marge_faible': '/bons',
  'credit_depasse': '/clients',
  'paiement_retard': '/paiements',
  'rappel_paiement': '/paiements',
  'rappels_automatiques': '/paiements',
  'production_anomalie': '/production',
  'logistique_conflit': '/planning',
  'prix_hausse': '/prix',
  'approbation_requise': '/approbations',
};

// Alert type labels
const ALERT_TYPE_LABELS: Record<string, string> = {
  'qualite_critique': 'Qualité',
  'stock_critique': 'Stock',
  'marge_faible': 'Marge',
  'credit_depasse': 'Crédit',
  'paiement_retard': 'Paiement',
  'rappel_paiement': 'Rappel',
  'rappels_automatiques': 'Rappels Auto',
  'production_anomalie': 'Production',
  'logistique_conflit': 'Logistique',
  'prix_hausse': 'Prix',
  'approbation_requise': 'Approbation',
};

export function useNotifications() {
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    critical: 0,
    warning: 0,
    info: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    try {
      // Build query with role filter
      let query = supabase
        .from('alertes_systeme')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Filter by role if not CEO (CEO sees all)
      if (role && role !== 'ceo') {
        query = query.or(`destinataire_role.is.null,destinataire_role.eq.${role}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const alertData = (data || []) as SystemAlert[];
      setAlerts(alertData);

      // Calculate stats
      const unread = alertData.filter(a => !a.lu);
      setStats({
        total: alertData.length,
        unread: unread.length,
        critical: unread.filter(a => a.niveau === 'critical').length,
        warning: unread.filter(a => a.niveau === 'warning').length,
        info: unread.filter(a => a.niveau === 'info').length,
      });

    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  // Mark alert as read
  const markAsRead = useCallback(async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('alertes_systeme')
        .update({
          lu: true,
          lu_par: user.id,
          lu_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      // Update local state
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, lu: true, lu_par: user.id, lu_at: new Date().toISOString() } : a
      ));
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));

    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const unreadIds = alerts.filter(a => !a.lu).map(a => a.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('alertes_systeme')
        .update({
          lu: true,
          lu_par: user.id,
          lu_at: new Date().toISOString(),
        })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      setAlerts(prev => prev.map(a => ({
        ...a,
        lu: true,
        lu_par: user.id,
        lu_at: new Date().toISOString(),
      })));
      setStats(prev => ({
        ...prev,
        unread: 0,
        critical: 0,
        warning: 0,
        info: 0,
      }));

    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user, alerts]);

  // Dismiss alert (delete)
  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alertes_systeme')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      // Update local state
      const dismissed = alerts.find(a => a.id === alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      
      if (dismissed && !dismissed.lu) {
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          unread: Math.max(0, prev.unread - 1),
          critical: dismissed.niveau === 'critical' ? Math.max(0, prev.critical - 1) : prev.critical,
          warning: dismissed.niveau === 'warning' ? Math.max(0, prev.warning - 1) : prev.warning,
          info: dismissed.niveau === 'info' ? Math.max(0, prev.info - 1) : prev.info,
        }));
      } else {
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
      }

    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  }, [alerts]);

  // Get route for alert type
  const getAlertRoute = useCallback((alert: SystemAlert): string => {
    return ALERT_ROUTES[alert.type_alerte] || '/alertes';
  }, []);

  // Get label for alert type
  const getAlertTypeLabel = useCallback((typeAlerte: string): string => {
    return ALERT_TYPE_LABELS[typeAlerte] || typeAlerte;
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchAlerts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('alertes_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertes_systeme',
        },
        (payload) => {
          // Real-time alert handling
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as SystemAlert;
            // Check if this alert is for current user's role
            if (!newAlert.destinataire_role || newAlert.destinataire_role === role || role === 'ceo') {
              setAlerts(prev => [newAlert, ...prev]);
              setStats(prev => ({
                ...prev,
                total: prev.total + 1,
                unread: prev.unread + 1,
                critical: newAlert.niveau === 'critical' ? prev.critical + 1 : prev.critical,
                warning: newAlert.niveau === 'warning' ? prev.warning + 1 : prev.warning,
                info: newAlert.niveau === 'info' ? prev.info + 1 : prev.info,
              }));
              // 🔊 Play sound alert based on severity
              if (newAlert.niveau === 'critical') {
                playSound('error');
              } else if (newAlert.niveau === 'warning') {
                playSound('notification');
              } else {
                playSound('notification');
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setAlerts(prev => prev.map(a => 
              a.id === payload.new.id ? { ...a, ...payload.new } : a
            ));
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, fetchAlerts]);

  return {
    alerts,
    stats,
    loading,
    refetch: fetchAlerts,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    getAlertRoute,
    getAlertTypeLabel,
  };
}
