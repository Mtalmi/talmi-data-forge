import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SimulationType } from './types';
import { 
  AppRole, 
  getCertificationProgress, 
  getCertificationStatus,
  hasCompletedMandatoryCertifications,
  canAccessSimulation,
  isMandatoryCertification,
  CertificationStatus,
  SIMULATION_TYPE_IDS,
} from './rbac';

export interface FormationProgress {
  userId: string;
  userRole: AppRole | null;
  completedSimulations: SimulationType[];
  mandatoryProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  certificationStatus: CertificationStatus;
  isFullyCertified: boolean;
  loading: boolean;
  error: string | null;
}

export function useFormationProgress() {
  const { user, role } = useAuth();
  const [completedSimulations, setCompletedSimulations] = useState<SimulationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = role as AppRole | null;

  // Fetch completed simulations from database
  const fetchProgress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // First, try to get from user_training_progress table
      const { data, error: fetchError } = await supabase
        .from('user_training_progress')
        .select('step_id, completed_at')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('[Formation] Error fetching progress:', fetchError);
        // Don't set error, just use empty state
        setLoading(false);
        return;
      }

      if (data) {
        // Map step_id to simulation types
        const completed = data
          .map(p => p.step_id as SimulationType)
          .filter(s => SIMULATION_TYPE_IDS[s] !== undefined);
        
        setCompletedSimulations(completed);
      }
    } catch (err) {
      console.error('[Formation] Error:', err);
      setError('Erreur lors du chargement de la progression');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Mark a simulation as completed
  const completeSimulation = useCallback(async (simulationType: SimulationType) => {
    if (!user?.id || completedSimulations.includes(simulationType)) {
      return { success: false, error: 'Already completed or not logged in' };
    }

    try {
      // Insert completion record
      const { error: insertError } = await supabase
        .from('user_training_progress')
        .insert({
          user_id: user.id,
          step_id: simulationType,
        });

      if (insertError) {
        // If duplicate, treat as success
        if (insertError.code === '23505') {
          setCompletedSimulations(prev => [...prev, simulationType]);
          return { success: true };
        }
        console.error('[Formation] Error completing simulation:', insertError);
        return { success: false, error: insertError.message };
      }

      // Update local state
      setCompletedSimulations(prev => [...prev, simulationType]);

      // Log to audit (simulation prefix)
      console.log(`[SIMULATION] User ${user.id} completed: ${simulationType}`);

      return { success: true };
    } catch (err) {
      console.error('[Formation] Error:', err);
      return { success: false, error: 'Unknown error' };
    }
  }, [user?.id, completedSimulations]);

  // Reset all progress
  const resetProgress = useCallback(async () => {
    if (!user?.id) return { success: false };

    try {
      const { error: deleteError } = await supabase
        .from('user_training_progress')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('[Formation] Error resetting progress:', deleteError);
        return { success: false, error: deleteError.message };
      }

      setCompletedSimulations([]);
      console.log(`[SIMULATION] User ${user.id} reset all progress`);

      return { success: true };
    } catch (err) {
      console.error('[Formation] Error:', err);
      return { success: false, error: 'Unknown error' };
    }
  }, [user?.id]);

  // Check certification and issue if complete
  const checkAndIssueCertification = useCallback(async () => {
    if (!user?.id || !userRole) return false;

    const isComplete = hasCompletedMandatoryCertifications(userRole, completedSimulations);
    
    if (isComplete) {
      try {
        // Check if already certified
        const { data: existingCert } = await supabase
          .from('user_certifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('certification_type', 'operator')
          .maybeSingle();

        if (!existingCert) {
          // Issue new certification
          await supabase
            .from('user_certifications')
            .insert({
              user_id: user.id,
              certification_type: 'operator',
              badge_level: 'gold',
            });
          
          console.log(`[SIMULATION] User ${user.id} earned TBOS Certified Operator badge`);
        }

        return true;
      } catch (err) {
        console.error('[Formation] Error issuing certification:', err);
      }
    }

    return isComplete;
  }, [user?.id, userRole, completedSimulations]);

  // Calculate progress
  const mandatoryProgress = getCertificationProgress(userRole, completedSimulations);
  const certificationStatus = getCertificationStatus(userRole, completedSimulations);
  const isFullyCertified = certificationStatus === 'FULLY_CERTIFIED';

  return {
    userId: user?.id || '',
    userRole,
    completedSimulations,
    mandatoryProgress,
    certificationStatus,
    isFullyCertified,
    loading,
    error,
    // Actions
    completeSimulation,
    resetProgress,
    checkAndIssueCertification,
    refreshProgress: fetchProgress,
    // Helpers
    canAccess: (sim: SimulationType) => canAccessSimulation(userRole, sim),
    isMandatory: (sim: SimulationType) => isMandatoryCertification(userRole, sim),
    isCompleted: (sim: SimulationType) => completedSimulations.includes(sim),
  };
}
