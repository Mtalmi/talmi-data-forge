import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SimulationType, SimulationDifficulty } from './types';
import { calculateXP } from './GamificationDashboard';

export interface SimulationScore {
  precision: number;
  conformite: number;
  rapidite: number;
  global: number;
  xpEarned: number;
  timeSpentSeconds: number;
}

interface UseSimulationScoringOptions {
  simulationType: SimulationType;
  difficulty: SimulationDifficulty;
  totalSteps: number;
}

export function useSimulationScoring({ simulationType, difficulty, totalSteps }: UseSimulationScoringOptions) {
  const { user } = useAuth();
  const startTime = useRef(Date.now());
  const [correctActions, setCorrectActions] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [complianceChecks, setComplianceChecks] = useState({ passed: 0, total: 0 });

  const recordAction = useCallback((isCorrect: boolean) => {
    setTotalActions(prev => prev + 1);
    if (isCorrect) setCorrectActions(prev => prev + 1);
  }, []);

  const recordComplianceCheck = useCallback((passed: boolean) => {
    setComplianceChecks(prev => ({
      passed: prev.passed + (passed ? 1 : 0),
      total: prev.total + 1,
    }));
  }, []);

  const calculateScore = useCallback((): SimulationScore => {
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    
    // Precision: ratio of correct actions
    const precision = totalActions > 0 ? Math.round((correctActions / totalActions) * 100) : 80;
    
    // Conformite: compliance checks + base
    const conformite = complianceChecks.total > 0
      ? Math.round((complianceChecks.passed / complianceChecks.total) * 100)
      : 75;
    
    // Rapidite: based on expected time (adjust per difficulty)
    const expectedTime = difficulty === 'easy' ? 180 : difficulty === 'medium' ? 300 : 420;
    const timeRatio = Math.min(expectedTime / Math.max(timeSpent, 30), 1.5);
    const rapidite = Math.min(100, Math.round(timeRatio * 70));
    
    // Global: weighted average
    const global = Math.round(precision * 0.4 + conformite * 0.35 + rapidite * 0.25);
    
    const xpEarned = calculateXP(global, difficulty);

    return { precision, conformite, rapidite, global, xpEarned, timeSpentSeconds: timeSpent };
  }, [correctActions, totalActions, complianceChecks, difficulty]);

  const saveScore = useCallback(async (score: SimulationScore) => {
    if (!user?.id) return;

    try {
      // Update training progress with scores
      await supabase
        .from('user_training_progress')
        .update({
          score_precision: score.precision,
          score_conformite: score.conformite,
          score_rapidite: score.rapidite,
          score_global: score.global,
          xp_earned: score.xpEarned,
          time_spent_seconds: score.timeSpentSeconds,
          best_score: score.global,
        })
        .eq('user_id', user.id)
        .eq('step_id', simulationType);

      // Upsert XP profile
      const { data: existing } = await supabase
        .from('user_xp_profiles')
        .select('total_xp, streak_days, last_activity_date, badges')
        .eq('user_id', user.id)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      
      if (existing) {
        const lastDate = existing.last_activity_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = lastDate === yesterday ? (existing.streak_days || 0) + 1 
          : lastDate === today ? (existing.streak_days || 0) 
          : 1;

        await supabase
          .from('user_xp_profiles')
          .update({
            total_xp: (existing.total_xp || 0) + score.xpEarned,
            streak_days: newStreak,
            last_activity_date: today,
            current_level: Math.floor(((existing.total_xp || 0) + score.xpEarned) / 500) + 1,
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_xp_profiles')
          .insert({
            user_id: user.id,
            total_xp: score.xpEarned,
            current_level: 1,
            streak_days: 1,
            last_activity_date: today,
            badges: [],
          });
      }

      console.log(`[SIMULATION] Score saved for ${simulationType}: ${score.global}% (+${score.xpEarned} XP)`);
    } catch (err) {
      console.error('[SIMULATION] Error saving score:', err);
    }
  }, [user?.id, simulationType]);

  return {
    recordAction,
    recordComplianceCheck,
    calculateScore,
    saveScore,
    stats: { correctActions, totalActions, complianceChecks },
  };
}
