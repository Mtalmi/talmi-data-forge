import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);

    // Show card if permission not yet granted and not dismissed recently
    const dismissed = localStorage.getItem('tbos-notif-dismissed');
    if (dismissed) {
      const diff = Date.now() - parseInt(dismissed);
      if (diff < 30 * 24 * 60 * 60 * 1000) return; // 30 days
    }
    if (Notification.permission === 'default') {
      setShowCard(true);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setShowCard(false);
      // Send test notification
      new Notification('🔔 TBOS Notifications activées', {
        body: 'Vous recevrez les alertes critiques en temps réel.',
        icon: '/icon-192.png',
      });
    }
  };

  const dismiss = () => {
    setShowCard(false);
    localStorage.setItem('tbos-notif-dismissed', String(Date.now()));
  };

  if (!showCard || permission === 'granted') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="fixed bottom-24 right-4 md:right-6 z-[80] w-[calc(100%-2rem)] max-w-xs"
      >
        <Card className="border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                <BellRing className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Activer les notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recevez les alertes stock, paiement et qualité même en arrière-plan.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={requestPermission}>
                <Bell className="h-3.5 w-3.5 mr-1.5" />
                Activer
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Plus tard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
