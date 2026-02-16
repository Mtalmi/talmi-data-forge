-- Table to store n8n workflow results (table was not created due to previous errors)
CREATE TABLE IF NOT EXISTS public.n8n_workflow_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_payload JSONB,
  result_data JSONB,
  summary TEXT,
  severity TEXT DEFAULT 'info',
  triggered_by TEXT,
  triggered_from TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.n8n_workflow_results ENABLE ROW LEVEL SECURITY;

-- Use has_role with ceo enum + user_roles table
CREATE POLICY "Management can read workflow results"
ON public.n8n_workflow_results FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'ceo')
);

CREATE POLICY "Service can insert workflow results"
ON public.n8n_workflow_results FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service can update workflow results"
ON public.n8n_workflow_results FOR UPDATE
USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.n8n_workflow_results;

CREATE TRIGGER update_n8n_workflow_results_updated_at
BEFORE UPDATE ON public.n8n_workflow_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();