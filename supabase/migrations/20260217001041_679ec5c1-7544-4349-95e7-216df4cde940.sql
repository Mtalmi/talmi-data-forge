
-- triggered_by is text, auth.uid() is uuid — cast appropriately
CREATE POLICY "Authenticated users can insert workflow results"
  ON public.n8n_workflow_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = triggered_by);

CREATE POLICY "Authenticated users can read own workflow results"
  ON public.n8n_workflow_results
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = triggered_by);
