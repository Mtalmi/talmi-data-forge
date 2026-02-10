import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ValidationPayload {
  context: string; // e.g. "bon_livraison", "depense", "stock_reception", "devis"
  fields: Record<string, any>;
}

/**
 * AI-powered form validation that catches impossible values
 * before they reach the database.
 */
export function useAIDataGuard() {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);

  const validate = useCallback(async (payload: ValidationPayload): Promise<ValidationResult> => {
    setIsValidating(true);
    try {
      const prompt = `Contexte: ${payload.context}\nDonnées à valider:\n${JSON.stringify(payload.fields, null, 2)}\n\nValide ces données selon les règles métier béton. Réponds UNIQUEMENT avec le JSON.`;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          mode: 'validate',
        },
      });

      if (error) throw error;

      // Parse the non-streaming response
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const result: ValidationResult = JSON.parse(jsonMatch[0]);
      setLastResult(result);

      // Show toast based on result
      if (result.errors.length > 0) {
        toast.error(`🛡️ ${result.errors.length} erreur(s) détectée(s)`, {
          description: result.errors[0],
          duration: 6000,
        });
      } else if (result.warnings.length > 0) {
        toast.warning(`⚠️ ${result.warnings.length} avertissement(s)`, {
          description: result.warnings[0],
          duration: 5000,
        });
      } else {
        toast.success('✅ AI Guard: Données validées', { duration: 3000 });
      }

      return result;
    } catch (err) {
      console.error('[AI Guard] Validation error:', err);
      // Fail-open: if AI is down, allow submission with warning
      const fallback: ValidationResult = {
        valid: true,
        errors: [],
        warnings: ['Validation AI indisponible - vérification manuelle requise'],
        suggestions: [],
      };
      setLastResult(fallback);
      return fallback;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return { validate, isValidating, lastResult };
}
