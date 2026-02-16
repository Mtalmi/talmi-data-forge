import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Request browser Notification permission and show native push
 * for every new row inserted into alertes_systeme.
 */
export function usePushNotifications() {
  const { user, role } = useAuth();
  const permissionRef = useRef<NotificationPermission>('default');

  // Request permission once
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted';
      return;
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((p) => {
        permissionRef.current = p;
      });
    }
  }, []);

  const showNotification = useCallback(
    (title: string, body: string, tag: string, niveau: string) => {
      if (permissionRef.current !== 'granted') return;

      const icon = '/icon-192.png';
      const badge = '/icon-192.png';

      // Try service worker notification first (works when tab is background)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          const opts: NotificationOptions & Record<string, unknown> = {
            body,
            icon,
            badge,
            tag,
            data: { tag, niveau },
          };
          // vibrate & requireInteraction are valid for SW notifications but not typed in TS
          (opts as any).vibrate = niveau === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200];
          (opts as any).requireInteraction = niveau === 'critical';
          reg.showNotification(title, opts);
        });
      } else {
        // Fallback to basic Notification API
        new Notification(title, { body, icon, tag });
      }
    },
    [],
  );

  // Subscribe to realtime inserts on alertes_systeme
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('push_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertes_systeme' },
        (payload) => {
          const alert = payload.new as {
            id: string;
            titre: string;
            message: string;
            niveau: string;
            destinataire_role: string | null;
            type_alerte: string;
          };

          // Check role filter
          if (alert.destinataire_role && alert.destinataire_role !== role && role !== 'ceo') {
            return;
          }

          const niveauLabel =
            alert.niveau === 'critical'
              ? '🔴'
              : alert.niveau === 'warning'
                ? '🟡'
                : 'ℹ️';

          showNotification(
            `${niveauLabel} ${alert.titre}`,
            alert.message,
            alert.id,
            alert.niveau,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, showNotification]);
}
