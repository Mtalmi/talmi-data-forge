import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface N8nWorkflowResult {
  id: string;
  workflow_run_id: string;
  agent_type: string;
  status: string;
  request_payload: any;
  response_payload: any;
  severity: string;
  triggered_by: string;
  created_at: string;
  completed_at: string | null;
}

const ORCHESTRATOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-orchestrator`;

export function useN8nWorkflow() {
  const [results, setResults] = useState<N8nWorkflowResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('n8n-results')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'n8n_workflow_results' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setResults(prev => [payload.new as N8nWorkflowResult, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setResults(prev =>
              prev.map(r =>
                r.workflow_run_id === (payload.new as N8nWorkflowResult).workflow_run_id
                  ? (payload.new as N8nWorkflowResult)
                  : r
              )
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const triggerWorkflow = useCallback(async (
    taskType: string,
    payload: any,
    triggeredBy = 'CEO',
    severity = 'medium'
  ) => {
    setIsSubmitting(true);
    try {
      const resp = await fetch(ORCHESTRATOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          task_type: taskType,
          payload,
          triggered_by: triggeredBy,
          severity,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      return await resp.json();
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { results, isSubmitting, triggerWorkflow };
}
