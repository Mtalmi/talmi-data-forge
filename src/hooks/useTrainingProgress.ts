import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TrainingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or route
  position: 'top' | 'bottom' | 'left' | 'right';
  content: string;
}

export const TRAINING_STEPS: TrainingStep[] = [
  {
    id: 'stock_reception',
    title: 'Réception Stock',
    description: 'Le Handshake Photo-First',
    target: '[data-tour="stock-reception"]',
    position: 'bottom',
    content: 'Règle d\'Or #1: Toujours prendre la photo du BL AVANT de saisir les données. Sans photo = pas de réception.',
  },
  {
    id: 'expense_entry',
    title: 'Saisie Dépense',
    description: 'La Limite 15k DH',
    target: '[data-tour="expense-entry"]',
    position: 'bottom',
    content: 'Limite Level 1: 15,000 DH. Au-delà, l\'approbation CEO est requise. Justificatif photo obligatoire.',
  },
  {
    id: 'midnight_alert',
    title: 'Alerte Minuit',
    description: 'Le Protocole 18h-00h',
    target: '[data-tour="midnight-alert"]',
    position: 'left',
    content: 'Entre 18h et minuit: Toute transaction requiert une justification d\'urgence de minimum 20 caractères.',
  },
];

interface UserProgress {
  stepId: string;
  completedAt: string;
}

interface UserCertification {
  userId: string;
  certifiedAt: string;
  badgeLevel: string;
}

export function useTrainingProgress() {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isCertified, setIsCertified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch completed steps
      const { data: progressData } = await supabase
        .from('user_training_progress')
        .select('step_id, completed_at')
        .eq('user_id', user.id);

      if (progressData) {
        setCompletedSteps(progressData.map(p => p.step_id));
      }

      // Check certification
      const { data: certData } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsCertified(!!certData);
    } catch (error) {
      console.error('Error fetching training progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const completeStep = useCallback(async (stepId: string) => {
    if (!user?.id || completedSteps.includes(stepId)) return;

    try {
      await supabase
        .from('user_training_progress')
        .insert({ user_id: user.id, step_id: stepId });

      const newCompleted = [...completedSteps, stepId];
      setCompletedSteps(newCompleted);

      // Check if all steps completed
      if (newCompleted.length >= TRAINING_STEPS.length && !isCertified) {
        await supabase
          .from('user_certifications')
          .insert({ 
            user_id: user.id, 
            certification_type: 'operator',
            badge_level: 'gold'
          });
        setIsCertified(true);
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
  }, [user?.id, completedSteps, isCertified]);

  const startWalkthrough = useCallback(() => {
    setCurrentStep(0);
    setIsWalkthroughActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TRAINING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsWalkthroughActive(false);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const endWalkthrough = useCallback(() => {
    setIsWalkthroughActive(false);
    setCurrentStep(0);
  }, []);

  const progress = (completedSteps.length / TRAINING_STEPS.length) * 100;

  return {
    completedSteps,
    isCertified,
    loading,
    currentStep,
    currentStepData: TRAINING_STEPS[currentStep],
    isWalkthroughActive,
    progress,
    totalSteps: TRAINING_STEPS.length,
    completeStep,
    startWalkthrough,
    nextStep,
    prevStep,
    endWalkthrough,
    refresh: fetchProgress,
  };
}
