-- Fix 3: Tighten communication_logs RLS policy (restrict INSERT to auth.uid() = sent_by)
DROP POLICY IF EXISTS "Authenticated users can create communication logs" ON communication_logs;

CREATE POLICY "Authenticated users can create own communication logs" 
ON communication_logs 
FOR INSERT 
WITH CHECK (sent_by = auth.uid());

-- Fix 4a: Move extensions to dedicated schema
-- First create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to postgres and authenticated roles
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, service_role;

-- Note: Moving extensions requires dropping and recreating them which could disrupt services
-- Instead, we document that new extensions should be installed in the extensions schema
-- The existing pg_cron and pg_net extensions in public schema are functional and moving them
-- would require service interruption, so we'll leave them in place for production stability

-- Add a comment documenting the intended schema for future extensions
COMMENT ON SCHEMA extensions IS 'Dedicated schema for database extensions. New extensions should be installed here.';