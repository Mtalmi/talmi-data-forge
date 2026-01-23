/**
 * TITANIUM SHIELD - Security Provider
 * 
 * Wraps the application with:
 * 1. HTTPS enforcement
 * 2. Session timeout management
 * 3. Security logging (dev only)
 */

import { useEffect, ReactNode } from 'react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { enforceHttps, logSecurityStatus } from '@/lib/security';
import { useAuth } from '@/hooks/useAuth';

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const { user } = useAuth();
  
  // Only enable session timeout when user is logged in
  const isLoggedIn = !!user;
  
  // Session timeout hook - 2 hour inactivity timeout
  const { showWarning, remainingTimeFormatted } = useSessionTimeout({
    enabled: isLoggedIn,
    onTimeout: () => {
      console.warn('🔒 Titanium Shield: Session timeout executed');
    },
    onWarning: (remainingMs) => {
      console.warn(`⚠️ Titanium Shield: Session warning - ${Math.ceil(remainingMs / 1000 / 60)}min remaining`);
    },
  });

  // HTTPS enforcement on mount
  useEffect(() => {
    enforceHttps();
  }, []);

  // Log security status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logSecurityStatus();
    }
  }, []);

  // Log security activation when user logs in
  useEffect(() => {
    if (isLoggedIn && process.env.NODE_ENV === 'development') {
      console.log('🛡️ Titanium Shield: Security active for authenticated user');
      console.log('⏱️ Session timeout: 2 hours of inactivity');
    }
  }, [isLoggedIn]);

  return <>{children}</>;
}
