/**
 * TITANIUM SHIELD - Session Timeout Hook
 * 
 * Automatically logs out users after 2 hours of inactivity
 * to protect against unattended devices in the plant.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SESSION_CONFIG } from '@/lib/security';
import { toast } from 'sonner';

interface UseSessionTimeoutOptions {
  enabled?: boolean;
  onTimeout?: () => void;
  onWarning?: (remainingMs: number) => void;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const { 
    enabled = true, 
    onTimeout,
    onWarning 
  } = options;

  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(SESSION_CONFIG.INACTIVITY_TIMEOUT_MS);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset activity timer
  const resetActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setShowWarning(false);
    
    // Store in sessionStorage for persistence across tabs
    try {
      sessionStorage.setItem('lastActivity', now.toString());
    } catch (e) {
      // sessionStorage not available
    }
  }, []);

  // Handle session timeout - sign out user
  const handleTimeout = useCallback(async () => {
    console.warn('🔒 Session timeout - logging out user');
    
    // Show timeout notification
    toast.error('Session expirée', {
      description: 'Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.',
      duration: 10000,
    });

    // Sign out
    await supabase.auth.signOut();
    
    // Call optional callback
    onTimeout?.();
    
    // Redirect to login
    window.location.href = '/auth';
  }, [onTimeout]);

  // Handle warning before timeout
  const handleWarning = useCallback((remainingMs: number) => {
    setShowWarning(true);
    setRemainingTime(remainingMs);
    
    const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
    
    toast.warning('Session bientôt expirée', {
      description: `Votre session expirera dans ${remainingMinutes} minute(s). Bougez la souris pour rester connecté.`,
      duration: 30000,
    });
    
    onWarning?.(remainingMs);
  }, [onWarning]);

  // Check session status
  const checkSession = useCallback(() => {
    // Get last activity from sessionStorage (for cross-tab sync)
    let storedActivity = lastActivity;
    try {
      const stored = sessionStorage.getItem('lastActivity');
      if (stored) {
        storedActivity = parseInt(stored, 10);
      }
    } catch (e) {
      // sessionStorage not available
    }

    const now = Date.now();
    const elapsed = now - storedActivity;
    const remaining = SESSION_CONFIG.INACTIVITY_TIMEOUT_MS - elapsed;

    setRemainingTime(Math.max(0, remaining));

    // Check if timeout reached
    if (remaining <= 0) {
      handleTimeout();
      return;
    }

    // Check if warning threshold reached
    if (remaining <= SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MS && !showWarning) {
      handleWarning(remaining);
    }
  }, [lastActivity, showWarning, handleTimeout, handleWarning]);

  // Set up activity listeners
  useEffect(() => {
    if (!enabled) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity updates to prevent excessive state updates
    let lastUpdate = 0;
    const throttleMs = 30000; // Only update every 30 seconds

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > throttleMs) {
        lastUpdate = now;
        resetActivity();
      }
    };

    // Add listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up periodic check
    checkIntervalRef.current = setInterval(checkSession, SESSION_CONFIG.CHECK_INTERVAL_MS);

    // Initial activity set
    resetActivity();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [enabled, resetActivity, checkSession]);

  // Format remaining time for display
  const formatRemainingTime = useCallback(() => {
    const totalSeconds = Math.floor(remainingTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [remainingTime]);

  return {
    lastActivity,
    remainingTime,
    remainingTimeFormatted: formatRemainingTime(),
    showWarning,
    resetActivity,
    isActive: remainingTime > 0,
  };
}
