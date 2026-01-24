-- Create the Forensic Black Box table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- CEO-ONLY read policy: Only CEO and Superviseur can view audit logs
CREATE POLICY "CEO and Superviseur can view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles_v2 
    WHERE user_id = auth.uid() 
    AND role IN ('ceo', 'superviseur')
  )
);

-- Insert policy: System can insert audit logs (via service role or triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Enable realtime for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- Create trigger function to auto-populate user_name
CREATE OR REPLACE FUNCTION public.set_audit_log_user_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.user_name IS NULL THEN
    SELECT COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.user_id),
      (SELECT email FROM auth.users WHERE id = NEW.user_id)
    ) INTO NEW.user_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger
CREATE TRIGGER trigger_set_audit_log_user_name
BEFORE INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_audit_log_user_name();