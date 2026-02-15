import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, syncAll } = useOfflineSync();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else if (pendingCount === 0) {
      // Hide after a delay when back online
      const t = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, pendingCount]);

  if (!showBanner && isOnline && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className={cn(
          "fixed top-16 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-4 py-2 rounded-xl border shadow-lg backdrop-blur-xl text-sm font-medium",
          !isOnline
            ? "bg-destructive/90 border-destructive text-destructive-foreground"
            : pendingCount > 0
            ? "bg-amber-500/90 border-amber-400 text-black"
            : "bg-emerald-500/90 border-emerald-400 text-white"
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Mode hors-ligne</span>
            {pendingCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {pendingCount} en attente
              </span>
            )}
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            <span>{isSyncing ? 'Synchronisation...' : `${pendingCount} à synchroniser`}</span>
            {!isSyncing && (
              <Button size="sm" variant="secondary" className="h-6 text-xs" onClick={syncAll}>
                Sync
              </Button>
            )}
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connexion rétablie ✓</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
