
-- Tighten camera_events: restrict to management + directeur_operations only
DROP POLICY IF EXISTS "Authenticated users can view camera events" ON public.camera_events;
DROP POLICY IF EXISTS "camera_events_select_authenticated" ON public.camera_events;

-- Find and drop any existing select policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'camera_events' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.camera_events', pol.policyname);
  END LOOP;
END $$;

-- Create strict select policy for camera events
CREATE POLICY "camera_events_select_management_ops"
ON public.camera_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
    AND up.role IN ('ceo', 'superviseur', 'supervisor', 'directeur_operationnel', 'directeur_operations')
  )
);

-- Tighten bank_transactions: remove agent_administratif, keep CEO + accounting only
DROP POLICY IF EXISTS "bank_transactions_select" ON public.bank_transactions;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'bank_transactions' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.bank_transactions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "bank_transactions_select_finance_only"
ON public.bank_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
    AND up.role IN ('ceo', 'superviseur', 'supervisor', 'accounting')
  )
);
