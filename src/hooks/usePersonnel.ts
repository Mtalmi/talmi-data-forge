import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PersonnelInfo {
  display_name: string;
  role_code: string;
  trust_level: 'SUPREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  can_access_forensic_blackbox: boolean;
  can_generate_bypass_tokens: boolean;
  can_approve_technical: boolean;
  can_approve_administrative: boolean;
  subject_to_spending_cap: boolean;
  monthly_cap_limit_mad: number | null;
}

interface BypassToken {
  id: string;
  token_code: string;
  generated_for: string;
  reason: string;
  amount_limit: number | null;
  expires_at: string;
  used_at: string | null;
  is_active: boolean;
  created_at: string;
}

export function usePersonnel() {
  const { user, role } = useAuth();
  const [personnel, setPersonnel] = useState<PersonnelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [bypassTokens, setBypassTokens] = useState<BypassToken[]>([]);

  // Fetch current user's personnel info
  const fetchPersonnel = useCallback(async () => {
    if (!user) {
      setPersonnel(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_current_personnel');
      
      if (error) {
        console.error('Error fetching personnel:', error);
        // Fallback based on role
        if (role === 'ceo') {
          setPersonnel({
            display_name: 'Max Talmi',
            role_code: 'ceo',
            trust_level: 'SUPREME',
            can_access_forensic_blackbox: true,
            can_generate_bypass_tokens: true,
            can_approve_technical: true,
            can_approve_administrative: true,
            subject_to_spending_cap: false,
            monthly_cap_limit_mad: null,
          });
        }
        return;
      }

      if (data && data.length > 0) {
        setPersonnel(data[0] as PersonnelInfo);
      }
    } catch (err) {
      console.error('Error in fetchPersonnel:', err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  // Fetch bypass tokens (for CEO or own tokens)
  const fetchBypassTokens = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ceo_bypass_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setBypassTokens(data as BypassToken[]);
      }
    } catch (err) {
      console.error('Error fetching bypass tokens:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchPersonnel();
    fetchBypassTokens();
  }, [fetchPersonnel, fetchBypassTokens]);

  // Generate bypass token (CEO only)
  const generateBypassToken = async (
    forRole: string,
    reason: string,
    amountLimit?: number,
    validMinutes: number = 30
  ): Promise<{ success: boolean; tokenCode?: string; expiresAt?: string; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('generate_ceo_bypass_token', {
        p_for_role: forRole,
        p_reason: reason,
        p_amount_limit: amountLimit || null,
        p_valid_minutes: validMinutes,
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        await fetchBypassTokens();
        return {
          success: true,
          tokenCode: data[0].token_code,
          expiresAt: data[0].expires_at,
        };
      }

      return {
        success: false,
        error: data?.[0]?.error || 'Erreur inconnue',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erreur lors de la génération du token',
      };
    }
  };

  // Use bypass token
  const useBypassToken = async (
    tokenCode: string,
    reference: string
  ): Promise<{ success: boolean; amountLimit?: number; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('use_ceo_bypass_token', {
        p_token_code: tokenCode,
        p_reference: reference,
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        await fetchBypassTokens();
        return {
          success: true,
          amountLimit: data[0].amount_limit,
        };
      }

      return {
        success: false,
        error: data?.[0]?.error || 'Token invalide',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erreur lors de l\'utilisation du token',
      };
    }
  };

  // Log training completion
  const logTrainingCompletion = async (
    userName: string,
    simulationType: string,
    score: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('log_training_completion', {
        p_user_name: userName,
        p_simulation_type: simulationType,
        p_score: score,
      });

      return !error;
    } catch {
      return false;
    }
  };

  // Helper to check if user is subject to 15k cap
  const isSubjectToSpendingCap = personnel?.subject_to_spending_cap ?? true;
  const monthlyCap = personnel?.monthly_cap_limit_mad ?? 15000;

  // Helper to check trust level
  const hasSupremeAccess = personnel?.trust_level === 'SUPREME';
  const hasHighAccess = ['SUPREME', 'HIGH'].includes(personnel?.trust_level || '');
  const hasMediumAccess = ['SUPREME', 'HIGH', 'MEDIUM'].includes(personnel?.trust_level || '');

  // Get active bypass tokens for current role
  const activeTokens = bypassTokens.filter(
    t => t.is_active && !t.used_at && new Date(t.expires_at) > new Date()
  );

  return {
    personnel,
    loading,
    bypassTokens,
    activeTokens,
    refetch: fetchPersonnel,
    refetchTokens: fetchBypassTokens,
    generateBypassToken,
    useBypassToken,
    logTrainingCompletion,
    // Permission helpers
    isSubjectToSpendingCap,
    monthlyCap,
    hasSupremeAccess,
    hasHighAccess,
    hasMediumAccess,
    canAccessForensicBlackbox: personnel?.can_access_forensic_blackbox ?? false,
    canGenerateBypassTokens: personnel?.can_generate_bypass_tokens ?? false,
    canApproveTechnical: personnel?.can_approve_technical ?? false,
    canApproveAdministrative: personnel?.can_approve_administrative ?? false,
  };
}
