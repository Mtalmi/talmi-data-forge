import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CoachFeedback {
  hint: string;
  score: number;
  criteria: {
    precision: number;
    conformite: number;
    rapidite: number;
  };
  encouragement: string;
  correction: string | null;
}

export interface ScenarioData {
  [key: string]: any;
}

/**
 * AI Training Coach - provides real-time hints, scoring, and dynamic scenarios
 * for Mode Formation simulations.
 */
export function useAITrainingCoach() {
  const [isCoaching, setIsCoaching] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<CoachFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionScore, setSessionScore] = useState<number[]>([]);

  const getCoachFeedback = useCallback(async (context: {
    simulation: string;
    step: number;
    totalSteps: number;
    action: string;
    data: Record<string, any>;
  }): Promise<CoachFeedback | null> => {
    setIsCoaching(true);
    try {
      const prompt = `Simulation: ${context.simulation}
Étape: ${context.step}/${context.totalSteps}
Action de l'utilisateur: ${context.action}
Données actuelles:
${JSON.stringify(context.data, null, 2)}

Évalue cette action et donne un feedback. Réponds UNIQUEMENT avec le JSON.`;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          mode: 'coach',
        },
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const feedback: CoachFeedback = JSON.parse(jsonMatch[0]);
      setLastFeedback(feedback);
      setSessionScore(prev => [...prev, feedback.score]);
      return feedback;
    } catch (err) {
      console.error('[AI Coach] Feedback error:', err);
      return null;
    } finally {
      setIsCoaching(false);
    }
  }, []);

  const generateScenario = useCallback(async (simulationType: string): Promise<ScenarioData | null> => {
    setIsGenerating(true);
    try {
      const prompt = `Génère un scénario de formation pour la simulation "${simulationType}".
Le scénario doit être réaliste, avec des données fictives cohérentes pour une centrale à béton au Maroc.
Inclus: noms, montants, quantités, dates, et au moins un piège/anomalie que l'utilisateur devra détecter.
Réponds UNIQUEMENT avec le JSON.`;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          mode: 'scenario',
        },
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('[AI Coach] Scenario generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const averageScore = sessionScore.length > 0
    ? Math.round(sessionScore.reduce((a, b) => a + b, 0) / sessionScore.length)
    : 0;

  const resetSession = useCallback(() => {
    setLastFeedback(null);
    setSessionScore([]);
  }, []);

  return {
    getCoachFeedback,
    generateScenario,
    isCoaching,
    isGenerating,
    lastFeedback,
    sessionScore,
    averageScore,
    resetSession,
  };
}
