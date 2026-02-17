
-- Remove the remaining overly permissive public policies on n8n_workflow_results
-- These are leftover from the original setup and are not needed since edge functions use service_role (bypasses RLS)
DROP POLICY IF EXISTS "Service can insert workflow results" ON public.n8n_workflow_results;
DROP POLICY IF EXISTS "Service can update workflow results" ON public.n8n_workflow_results;
