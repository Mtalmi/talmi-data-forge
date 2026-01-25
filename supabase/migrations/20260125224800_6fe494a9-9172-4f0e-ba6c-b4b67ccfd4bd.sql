-- ============================================================================
-- TBOS MASTER PERSONNEL & PERMISSIONS MAP (v2 - Fixed)
-- Implements: User Registry, Role Trust Levels, Notification Triggers, 15k Cap
-- ============================================================================

-- Drop existing function that conflicts (specify signature)
DROP FUNCTION IF EXISTS public.is_ceo();

-- 1. Create Personnel Registry with trust levels and access flags
CREATE TABLE IF NOT EXISTS public.personnel_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  role_code TEXT NOT NULL,
  trust_level TEXT NOT NULL CHECK (trust_level IN ('SUPREME', 'HIGH', 'MEDIUM', 'LOW')),
  -- Access flags
  can_access_forensic_blackbox BOOLEAN DEFAULT FALSE,
  can_generate_bypass_tokens BOOLEAN DEFAULT FALSE,
  can_approve_technical BOOLEAN DEFAULT FALSE,
  can_approve_administrative BOOLEAN DEFAULT FALSE,
  can_override_credit_block BOOLEAN DEFAULT FALSE,
  can_approve_emergency_bc BOOLEAN DEFAULT FALSE,
  receives_all_notifications BOOLEAN DEFAULT FALSE,
  -- 15k MAD cap settings
  subject_to_spending_cap BOOLEAN DEFAULT TRUE,
  monthly_cap_limit_mad NUMERIC(10,2) DEFAULT 15000,
  -- Audit
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personnel_registry ENABLE ROW LEVEL SECURITY;

-- Only CEO can view personnel registry
DROP POLICY IF EXISTS "CEO can view personnel registry" ON public.personnel_registry;
CREATE POLICY "CEO can view personnel registry" ON public.personnel_registry
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles_v2 
      WHERE user_id = auth.uid() AND role = 'ceo'
    )
  );

-- 2. Insert the specific personnel with their permissions (avoid duplicates)
INSERT INTO public.personnel_registry (display_name, role_code, trust_level, can_access_forensic_blackbox, can_generate_bypass_tokens, can_approve_technical, can_approve_administrative, can_override_credit_block, can_approve_emergency_bc, receives_all_notifications, subject_to_spending_cap, monthly_cap_limit_mad)
VALUES 
  ('Max Talmi', 'ceo', 'SUPREME', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NULL),
  ('Karim', 'responsable_technique', 'HIGH', FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, 15000),
  ('Hassan', 'superviseur', 'HIGH', FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, 15000),
  ('Abdel Sadek', 'agent_administratif', 'MEDIUM', FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, 15000)
ON CONFLICT DO NOTHING;

-- 3. Create function to check if current user is CEO (Max)
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_v2 
    WHERE user_id = auth.uid() AND role = 'ceo'
  );
$$;

-- 4. Create function to get current user's personnel record
CREATE OR REPLACE FUNCTION public.get_current_personnel()
RETURNS TABLE (
  display_name TEXT,
  role_code TEXT,
  trust_level TEXT,
  can_access_forensic_blackbox BOOLEAN,
  can_generate_bypass_tokens BOOLEAN,
  can_approve_technical BOOLEAN,
  can_approve_administrative BOOLEAN,
  subject_to_spending_cap BOOLEAN,
  monthly_cap_limit_mad NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pr.display_name,
    pr.role_code,
    pr.trust_level,
    pr.can_access_forensic_blackbox,
    pr.can_generate_bypass_tokens,
    pr.can_approve_technical,
    pr.can_approve_administrative,
    pr.subject_to_spending_cap,
    pr.monthly_cap_limit_mad
  FROM public.personnel_registry pr
  JOIN public.user_roles_v2 ur ON pr.role_code = ur.role
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
$$;

-- 5. Create notification_log table for critical action tracking
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id TEXT NOT NULL UNIQUE DEFAULT ('NOTIF_' || to_char(now(), 'YYYYMMDD') || '_' || substr(md5(random()::text), 1, 6)),
  recipient_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  actor_name TEXT,
  actor_role TEXT,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- CEO sees all notifications, others see their role's
DROP POLICY IF EXISTS "CEO sees all notifications" ON public.notification_log;
CREATE POLICY "Users see their notifications" ON public.notification_log
  FOR SELECT USING (
    public.is_master_admin() 
    OR recipient_role = (SELECT role FROM public.user_roles_v2 WHERE user_id = auth.uid() LIMIT 1)
  );

-- 6. Create function to notify CEO of critical actions
CREATE OR REPLACE FUNCTION public.notify_ceo_critical_action(
  p_event_type TEXT,
  p_severity TEXT,
  p_actor_name TEXT,
  p_actor_role TEXT,
  p_message TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notification_log (
    recipient_role,
    event_type,
    severity,
    actor_name,
    actor_role,
    message,
    details
  ) VALUES (
    'ceo',
    p_event_type,
    p_severity,
    p_actor_name,
    p_actor_role,
    p_message,
    p_details
  )
  RETURNING id INTO v_notification_id;

  -- Also insert into alertes_systeme for in-app notification
  INSERT INTO public.alertes_systeme (
    type_alerte,
    niveau,
    titre,
    message,
    destinataire_role,
    reference_id,
    reference_table
  ) VALUES (
    p_event_type,
    CASE p_severity 
      WHEN 'CRITICAL' THEN 'critical'
      WHEN 'HIGH' THEN 'warning'
      ELSE 'info'
    END,
    p_actor_name || ' - ' || p_event_type,
    p_message,
    'ceo',
    v_notification_id::text,
    'notification_log'
  );

  RETURN v_notification_id;
END;
$$;

-- 7. Create trigger to notify CEO when approvals happen
CREATE OR REPLACE FUNCTION public.trigger_notify_ceo_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
BEGIN
  SELECT ur.role INTO v_user_role
  FROM public.user_roles_v2 ur
  WHERE ur.user_id = auth.uid();

  SELECT display_name INTO v_user_name
  FROM public.personnel_registry
  WHERE role_code = v_user_role
  LIMIT 1;

  -- Don't notify if CEO is the actor
  IF v_user_role = 'ceo' THEN
    RETURN NEW;
  END IF;

  -- Notify CEO for technical approvals
  IF TG_TABLE_NAME = 'quote_approvals' AND NEW.approval_type = 'TECHNICAL' THEN
    PERFORM public.notify_ceo_critical_action(
      'TECHNICAL_APPROVAL',
      'HIGH',
      COALESCE(v_user_name, NEW.approved_by_name, 'Unknown'),
      COALESCE(v_user_role, 'unknown'),
      format('Approbation technique: devis %s', NEW.quote_id),
      jsonb_build_object('quote_id', NEW.quote_id, 'status', NEW.status)
    );
  END IF;

  -- Notify CEO for administrative approvals
  IF TG_TABLE_NAME = 'quote_approvals' AND NEW.approval_type = 'ADMINISTRATIVE' THEN
    PERFORM public.notify_ceo_critical_action(
      'ADMINISTRATIVE_APPROVAL',
      'HIGH',
      COALESCE(v_user_name, NEW.approved_by_name, 'Unknown'),
      COALESCE(v_user_role, 'unknown'),
      format('Validation administrative: devis %s', NEW.quote_id),
      jsonb_build_object('quote_id', NEW.quote_id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_ceo_on_approval ON public.quote_approvals;
CREATE TRIGGER notify_ceo_on_approval
  AFTER INSERT ON public.quote_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_ceo_on_approval();

-- 8. Create ceo_bypass_tokens table for 15k MAD override
CREATE TABLE IF NOT EXISTS public.ceo_bypass_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code TEXT NOT NULL UNIQUE,
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  generated_for TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount_limit NUMERIC(12,2),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  used_for_reference TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ceo_bypass_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CEO can manage bypass tokens" ON public.ceo_bypass_tokens;
CREATE POLICY "CEO can manage bypass tokens" ON public.ceo_bypass_tokens
  FOR ALL USING (public.is_master_admin());

DROP POLICY IF EXISTS "Users can view their tokens" ON public.ceo_bypass_tokens;
CREATE POLICY "Users can view own tokens" ON public.ceo_bypass_tokens
  FOR SELECT USING (
    generated_for = (SELECT role FROM public.user_roles_v2 WHERE user_id = auth.uid() LIMIT 1)
  );

-- 9. Function for CEO to generate bypass token
CREATE OR REPLACE FUNCTION public.generate_ceo_bypass_token(
  p_for_role TEXT,
  p_reason TEXT,
  p_amount_limit NUMERIC DEFAULT NULL,
  p_valid_minutes INT DEFAULT 30
)
RETURNS TABLE (
  success BOOLEAN,
  token_code TEXT,
  expires_at TIMESTAMPTZ,
  error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  IF NOT public.is_master_admin() THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TIMESTAMPTZ, 'Seul le PDG peut générer des tokens de bypass'::TEXT;
    RETURN;
  END IF;

  v_token := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  v_expires := now() + (p_valid_minutes || ' minutes')::interval;

  INSERT INTO public.ceo_bypass_tokens (
    token_code, generated_by, generated_for, reason, amount_limit, expires_at
  ) VALUES (
    v_token, auth.uid(), p_for_role, p_reason, p_amount_limit, v_expires
  );

  INSERT INTO public.audit_superviseur (action, table_name, user_id, user_name, changes)
  VALUES ('CEO_BYPASS_TOKEN_GENERATED', 'ceo_bypass_tokens', auth.uid(), 'Max Talmi',
    jsonb_build_object('for_role', p_for_role, 'reason', p_reason, 'expires_at', v_expires));

  RETURN QUERY SELECT TRUE, v_token, v_expires, NULL::TEXT;
END;
$$;

-- 10. Function to validate and use bypass token
CREATE OR REPLACE FUNCTION public.use_ceo_bypass_token(
  p_token_code TEXT,
  p_reference TEXT
)
RETURNS TABLE (success BOOLEAN, amount_limit NUMERIC, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
  v_user_role TEXT;
  v_user_name TEXT;
BEGIN
  SELECT role INTO v_user_role FROM public.user_roles_v2 WHERE user_id = auth.uid();
  SELECT display_name INTO v_user_name FROM public.personnel_registry WHERE role_code = v_user_role LIMIT 1;

  SELECT * INTO v_token FROM public.ceo_bypass_tokens
  WHERE token_code = upper(p_token_code)
    AND generated_for = v_user_role
    AND expires_at > now()
    AND is_active = TRUE
    AND used_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::NUMERIC, 'Token invalide, expiré, ou déjà utilisé'::TEXT;
    RETURN;
  END IF;

  UPDATE public.ceo_bypass_tokens
  SET used_at = now(), used_by = auth.uid(), used_for_reference = p_reference, is_active = FALSE
  WHERE id = v_token.id;

  INSERT INTO public.audit_superviseur (action, table_name, user_id, user_name, changes)
  VALUES ('CEO_BYPASS_TOKEN_USED', 'ceo_bypass_tokens', auth.uid(), COALESCE(v_user_name, 'Unknown'),
    jsonb_build_object('token_id', v_token.id, 'reference', p_reference, 'amount_limit', v_token.amount_limit));

  RETURN QUERY SELECT TRUE, v_token.amount_limit, NULL::TEXT;
END;
$$;

-- 11. Create forensic_blackbox table - CEO ONLY
CREATE TABLE IF NOT EXISTS public.forensic_blackbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  target_table TEXT,
  target_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  session_fingerprint TEXT,
  intent_analysis TEXT,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.forensic_blackbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CEO only forensic blackbox" ON public.forensic_blackbox;
CREATE POLICY "CEO only forensic blackbox" ON public.forensic_blackbox
  FOR SELECT USING (public.is_master_admin());

-- 12. Log training completion function
CREATE OR REPLACE FUNCTION public.log_training_completion(
  p_user_name TEXT,
  p_simulation_type TEXT,
  p_score NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_superviseur (action, table_name, user_id, user_name, changes)
  VALUES ('TRAINING_COMPLETED', 'user_training_progress', auth.uid(), p_user_name,
    jsonb_build_object('simulation_type', p_simulation_type, 'score', p_score, 'completed_at', now()));
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_master_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_personnel TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_ceo_critical_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ceo_bypass_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_ceo_bypass_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_training_completion TO authenticated;