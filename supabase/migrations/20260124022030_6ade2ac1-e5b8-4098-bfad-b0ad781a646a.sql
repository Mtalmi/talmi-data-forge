-- Create CEO Emergency Override tokens table
CREATE TABLE IF NOT EXISTS public.ceo_emergency_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ceo_user_id UUID NOT NULL REFERENCES auth.users(id),
  override_type TEXT NOT NULL CHECK (override_type IN ('expense_cap', 'price_drop')),
  reason TEXT NOT NULL CHECK (char_length(reason) >= 10),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_for_record_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ceo_overrides_token ON public.ceo_emergency_overrides(token);
CREATE INDEX IF NOT EXISTS idx_ceo_overrides_expires ON public.ceo_emergency_overrides(expires_at);
CREATE INDEX IF NOT EXISTS idx_ceo_overrides_type ON public.ceo_emergency_overrides(override_type);

-- Enable RLS
ALTER TABLE public.ceo_emergency_overrides ENABLE ROW LEVEL SECURITY;

-- CEO-ONLY: Only CEO can create/view override tokens
CREATE POLICY "CEO can manage override tokens"
ON public.ceo_emergency_overrides
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles_v2 
    WHERE user_id = auth.uid() 
    AND role = 'ceo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles_v2 
    WHERE user_id = auth.uid() 
    AND role = 'ceo'
  )
);

-- System can validate tokens (for checking validity in expense/devis forms)
CREATE POLICY "Authenticated users can check token validity"
ON public.ceo_emergency_overrides
FOR SELECT
USING (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ceo_emergency_overrides;

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_ceo_emergency_overrides ON public.ceo_emergency_overrides;
CREATE TRIGGER audit_ceo_emergency_overrides
AFTER INSERT OR UPDATE OR DELETE ON public.ceo_emergency_overrides
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Function to validate and consume an override token
CREATE OR REPLACE FUNCTION public.consume_ceo_override(
  p_token TEXT,
  p_override_type TEXT,
  p_record_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override_id UUID;
BEGIN
  -- Find valid, unused, non-expired token of correct type
  SELECT id INTO v_override_id
  FROM public.ceo_emergency_overrides
  WHERE token = p_token
    AND override_type = p_override_type
    AND is_used = false
    AND expires_at > now()
  FOR UPDATE;

  IF v_override_id IS NULL THEN
    RETURN false;
  END IF;

  -- Mark as used
  UPDATE public.ceo_emergency_overrides
  SET is_used = true,
      used_at = now(),
      used_for_record_id = p_record_id
  WHERE id = v_override_id;

  -- Log to audit
  INSERT INTO public.audit_logs (
    user_id, user_name, action_type, table_name, record_id, 
    new_data, description
  ) VALUES (
    auth.uid(),
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = auth.uid()),
    'CEO_OVERRIDE',
    'ceo_emergency_overrides',
    v_override_id::TEXT,
    jsonb_build_object('override_type', p_override_type, 'record_id', p_record_id),
    'CEO Emergency Override consumed for ' || p_override_type
  );

  RETURN true;
END;
$$;