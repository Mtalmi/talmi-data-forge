import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnomalyFinding {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface AnomalyResult {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  findings: AnomalyFinding[];
}

/**
 * AI-powered anomaly detector that scans transactions for fraud patterns.
 */
export function useAIAnomalyDetector() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<AnomalyResult | null>(null);

  const scanTransactions = useCallback(async (data: {
    type: string; // e.g. "expenses", "deliveries", "stock_movements"
    records: any[];
    context?: string;
  }): Promise<AnomalyResult | null> => {
    setIsScanning(true);
    try {
      const prompt = `Analyse ces ${data.type} pour détecter les anomalies et fraudes potentielles.
${data.context ? `Contexte: ${data.context}\n` : ''}
Données (${data.records.length} enregistrements):
${JSON.stringify(data.records.slice(0, 50), null, 2)}

Réponds UNIQUEMENT avec le JSON.`;

      const { data: result, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          mode: 'anomaly',
        },
      });

      if (error) throw error;

      const content = result?.choices?.[0]?.message?.content;
      if (!content) return null;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed: AnomalyResult = JSON.parse(jsonMatch[0]);
      setLastScan(parsed);
      return parsed;
    } catch (err) {
      console.error('[AI Anomaly] Scan error:', err);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  return { scanTransactions, isScanning, lastScan };
}
