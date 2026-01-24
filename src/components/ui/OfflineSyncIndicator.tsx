import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface OfflineSyncIndicatorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function OfflineSyncIndicator({ 
  className, 
  showLabel = false,
  compact = false 
}: OfflineSyncIndicatorProps) {
  const { isOnline, pendingCount, isSyncing, syncAll } = useOfflineSync();

  const handleSync = () => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncAll();
    }
  };

  // Don't show anything if online and no pending
  if (isOnline && pendingCount === 0 && !compact) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn("flex items-center gap-2", className)}
      >
        {/* Offline indicator */}
        {!isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="gap-1.5 bg-warning/10 text-warning border-warning/30 animate-pulse"
              >
                <CloudOff className="h-3.5 w-3.5" />
                {showLabel && <span>Hors-ligne</span>}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mode hors-ligne - Les données sont sauvegardées localement</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Pending sync indicator */}
        {pendingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
                className={cn(
                  "h-8 gap-1.5 px-2",
                  isSyncing && "pointer-events-none"
                )}
              >
                <motion.div
                  animate={isSyncing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isSyncing ? Infinity : 0, ease: 'linear' }}
                >
                  <RefreshCw className={cn(
                    "h-3.5 w-3.5",
                    isSyncing ? "text-primary" : "text-warning"
                  )} />
                </motion.div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-5 min-w-5 px-1.5 text-xs",
                    isSyncing 
                      ? "bg-primary/20 text-primary" 
                      : "bg-warning/20 text-warning"
                  )}
                >
                  {pendingCount}
                </Badge>
                {showLabel && (
                  <span className="text-xs">
                    {isSyncing ? 'Sync...' : 'En attente'}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isSyncing 
                  ? 'Synchronisation en cours...' 
                  : `${pendingCount} opération(s) en attente de synchronisation`}
              </p>
              {!isOnline && <p className="text-warning text-xs mt-1">Reconnectez-vous pour synchroniser</p>}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Online & synced indicator (compact mode) */}
        {isOnline && pendingCount === 0 && compact && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="gap-1.5 bg-success/10 text-success border-success/30"
              >
                <Cloud className="h-3.5 w-3.5" />
                {showLabel && <span>Connecté</span>}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connecté - Toutes les données sont synchronisées</p>
            </TooltipContent>
          </Tooltip>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Small version for embedding in forms
export function PendingSyncBadge() {
  const { pendingCount, isSyncing } = useOfflineSync();

  if (pendingCount === 0) return null;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 text-xs",
        isSyncing 
          ? "bg-primary/10 text-primary border-primary/30" 
          : "bg-warning/10 text-warning border-warning/30"
      )}
    >
      {isSyncing ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="h-3 w-3" />
        </motion.div>
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {pendingCount} en attente
    </Badge>
  );
}
