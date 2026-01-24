import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OverrideValidation {
  isValid: boolean;
  message: string;
}

/**
 * Hook for validating and consuming CEO Emergency Override tokens
 * 
 * Usage:
 * ```tsx
 * const { validateToken, consumeToken, isValidating } = useCeoOverride();
 * 
 * // Check if a token is valid (without consuming)
 * const result = await validateToken(token, 'expense_cap');
 * 
 * // Consume a token (marks it as used)
 * const success = await consumeToken(token, 'expense_cap', recordId);
 * ```
 */
export function useCeoOverride() {
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate a token without consuming it
   */
  const validateToken = useCallback(async (
    token: string,
    overrideType: 'expense_cap' | 'price_drop'
  ): Promise<OverrideValidation> => {
    if (!token || token.trim().length === 0) {
      return { isValid: false, message: 'Token requis' };
    }

    setIsValidating(true);

    try {
      const { data, error } = await supabase
        .from('ceo_emergency_overrides')
        .select('id, override_type, is_used, expires_at')
        .eq('token', token.trim())
        .maybeSingle();

      if (error) {
        console.error('Error validating token:', error);
        return { isValid: false, message: 'Erreur de validation' };
      }

      if (!data) {
        return { isValid: false, message: 'Token invalide' };
      }

      if (data.override_type !== overrideType) {
        return { 
          isValid: false, 
          message: `Token de type incorrect (attendu: ${overrideType})` 
        };
      }

      if (data.is_used) {
        return { isValid: false, message: 'Token déjà utilisé' };
      }

      if (new Date(data.expires_at) < new Date()) {
        return { isValid: false, message: 'Token expiré' };
      }

      return { isValid: true, message: 'Token valide' };
    } catch (error) {
      console.error('Error in validateToken:', error);
      return { isValid: false, message: 'Erreur système' };
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Consume a token (marks it as used)
   * Returns true if successful, false otherwise
   */
  const consumeToken = useCallback(async (
    token: string,
    overrideType: 'expense_cap' | 'price_drop',
    recordId?: string
  ): Promise<boolean> => {
    if (!token || token.trim().length === 0) {
      return false;
    }

    setIsValidating(true);

    try {
      // Use the RPC function to atomically consume the token
      const { data, error } = await supabase.rpc('consume_ceo_override', {
        p_token: token.trim(),
        p_override_type: overrideType,
        p_record_id: recordId || null,
      });

      if (error) {
        console.error('Error consuming token:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in consumeToken:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Check if there's an active (valid, unused, non-expired) token of a given type
   */
  const hasActiveToken = useCallback(async (
    overrideType: 'expense_cap' | 'price_drop'
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('ceo_emergency_overrides')
        .select('id')
        .eq('override_type', overrideType)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (error) {
        console.error('Error checking active tokens:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error in hasActiveToken:', error);
      return false;
    }
  }, []);

  return {
    validateToken,
    consumeToken,
    hasActiveToken,
    isValidating,
  };
}
