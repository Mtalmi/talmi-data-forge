-- =====================================================
-- GOD-TIER TWO-STEP APPROVAL ENFORCEMENT - COMPREHENSIVE SCHEMA
-- Version 1.0 - Enterprise Quality Control Architecture
-- =====================================================

-- =====================================================
-- Table 1: quote_approvals - Tracks individual approval steps
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id TEXT NOT NULL,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('TECHNICAL', 'ADMINISTRATIVE')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_by_role TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('APPROVED', 'REJECTED', 'BLOCKED')),
  reason TEXT,
  validation_score DECIMAL(3,2),
  discrepancies_count INT DEFAULT 0,
  validation_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(quote_id, approval_type)
);

-- Indexes for quote_approvals
CREATE INDEX IF NOT EXISTS idx_quote_approvals_quote_id ON public.quote_approvals(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_approvals_type ON public.quote_approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_quote_approvals_approved_by ON public.quote_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_quote_approvals_status ON public.quote_approvals(status);

-- RLS for quote_approvals
ALTER TABLE public.quote_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quote_approvals_select_authenticated" ON public.quote_approvals;
CREATE POLICY "quote_approvals_select_authenticated" ON public.quote_approvals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "quote_approvals_insert_managers" ON public.quote_approvals;
CREATE POLICY "quote_approvals_insert_managers" ON public.quote_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role::text IN ('ceo', 'superviseur', 'agent_administratif', 'responsable_technique', 'accueil')
    )
  );

-- =====================================================
-- Table 2: approval_audit_log - Comprehensive audit trail
-- =====================================================
CREATE TABLE IF NOT EXISTS public.approval_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE DEFAULT ('AUDIT_' || to_char(now(), 'YYYYMMDD') || '_' || substr(gen_random_uuid()::text, 1, 8)),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  quote_id TEXT NOT NULL,
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL CHECK (action IN ('APPROVED', 'REJECTED', 'BLOCKED', 'ATTEMPTED', 'BYPASSED')),
  reason TEXT,
  previous_status TEXT,
  new_status TEXT,
  validation_details JSONB,
  ip_address TEXT,
  session_id TEXT,
  security_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for approval_audit_log
CREATE INDEX IF NOT EXISTS idx_approval_audit_log_quote_id ON public.approval_audit_log(quote_id);
CREATE INDEX IF NOT EXISTS idx_approval_audit_log_user_id ON public.approval_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_audit_log_timestamp ON public.approval_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_approval_audit_log_security ON public.approval_audit_log(security_flag);
CREATE INDEX IF NOT EXISTS idx_approval_audit_log_event_type ON public.approval_audit_log(event_type);

-- RLS for approval_audit_log
ALTER TABLE public.approval_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_audit_log_select_managers" ON public.approval_audit_log;
CREATE POLICY "approval_audit_log_select_managers" ON public.approval_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role::text IN ('ceo', 'superviseur', 'agent_administratif')
    )
  );

DROP POLICY IF EXISTS "approval_audit_log_insert_authenticated" ON public.approval_audit_log;
CREATE POLICY "approval_audit_log_insert_authenticated" ON public.approval_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- Add new status fields to devis table
-- =====================================================
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS tech_approval_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS tech_approval_notes TEXT;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS admin_approval_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS admin_approval_by UUID REFERENCES auth.users(id);
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS admin_approval_by_name TEXT;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS admin_approval_at TIMESTAMPTZ;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS admin_approval_notes TEXT;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS approval_chain_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS validation_score DECIMAL(3,2);
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS discrepancies_count INT DEFAULT 0;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS blocking_reason TEXT;

-- =====================================================
-- Helper function to get user role from user_roles table
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_role_text(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role::text FROM user_roles ur WHERE ur.user_id = p_user_id LIMIT 1;
$$;

-- =====================================================
-- Function: log_approval_audit - Centralized audit logging
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_approval_audit(
  p_event_type TEXT,
  p_quote_id TEXT,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_previous_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_validation_details JSONB DEFAULT NULL,
  p_security_flag BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
  v_event_id TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  SELECT full_name INTO v_user_name FROM profiles WHERE id = v_user_id;
  v_user_role := get_user_role_text(v_user_id);
  
  -- Generate unique event ID
  v_event_id := 'AUDIT_' || to_char(now(), 'YYYYMMDD') || '_' || substr(gen_random_uuid()::text, 1, 8);
  
  -- Insert audit log
  INSERT INTO approval_audit_log (
    event_id, event_type, quote_id, user_id, user_name, user_role,
    action, reason, previous_status, new_status, validation_details, security_flag
  )
  VALUES (
    v_event_id, p_event_type, p_quote_id, v_user_id, v_user_name, v_user_role,
    p_action, p_reason, p_previous_status, p_new_status, p_validation_details, p_security_flag
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- =====================================================
-- Function: approve_technical_devis_v2 - Enhanced with full audit
-- =====================================================
CREATE OR REPLACE FUNCTION public.approve_technical_devis_v2(
  p_devis_id TEXT,
  p_action TEXT DEFAULT 'APPROVE',
  p_reason TEXT DEFAULT NULL,
  p_validation_score DECIMAL DEFAULT 0.95,
  p_discrepancies_count INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
  v_current_status TEXT;
  v_current_tech_status TEXT;
  v_new_tech_status TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  
  -- Get user info
  SELECT full_name INTO v_user_name FROM profiles WHERE id = v_user_id;
  v_user_role := get_user_role_text(v_user_id);
  
  -- Authorization check - only technical leads can approve
  IF v_user_role NOT IN ('responsable_technique', 'ceo', 'superviseur') THEN
    -- Log unauthorized attempt
    PERFORM log_approval_audit(
      'TECHNICAL_APPROVAL_ATTEMPT',
      p_devis_id,
      'BLOCKED',
      'UNAUTHORIZED_ROLE: ' || COALESCE(v_user_role, 'unknown'),
      NULL, NULL, NULL, TRUE
    );
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Seul le Responsable Technique peut effectuer cette approbation'
    );
  END IF;
  
  -- Get current devis state
  SELECT statut, COALESCE(tech_approval_status, 'PENDING')
  INTO v_current_status, v_current_tech_status
  FROM devis WHERE devis_id = p_devis_id;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Devis non trouvé');
  END IF;
  
  -- Check if already approved
  IF v_current_tech_status = 'APPROVED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce devis a déjà été approuvé techniquement');
  END IF;
  
  -- Determine new status based on action
  CASE p_action
    WHEN 'APPROVE' THEN v_new_tech_status := 'APPROVED';
    WHEN 'REJECT' THEN v_new_tech_status := 'REJECTED';
    WHEN 'BLOCK' THEN
      IF p_validation_score < 0.95 OR p_discrepancies_count > 0 THEN
        v_new_tech_status := 'BLOCKED_DISCORDANCE';
      ELSE
        v_new_tech_status := 'BLOCKED_MISSING_DOCS';
      END IF;
    ELSE v_new_tech_status := 'REJECTED';
  END CASE;
  
  -- Update devis with technical approval
  UPDATE devis SET
    tech_approval_status = v_new_tech_status,
    tech_approval_notes = p_reason,
    technical_approved_by = v_user_id,
    technical_approved_by_name = v_user_name,
    technical_approved_at = now(),
    validation_score = p_validation_score,
    discrepancies_count = p_discrepancies_count,
    blocking_reason = CASE WHEN v_new_tech_status LIKE 'BLOCKED%' THEN p_reason ELSE NULL END,
    updated_at = now()
  WHERE devis_id = p_devis_id;
  
  -- Create approval record
  INSERT INTO quote_approvals (
    quote_id, approval_type, approved_by, approved_by_name, approved_by_role,
    status, reason, validation_score, discrepancies_count
  )
  VALUES (
    p_devis_id, 'TECHNICAL', v_user_id, v_user_name, v_user_role,
    CASE WHEN p_action = 'APPROVE' THEN 'APPROVED' WHEN p_action = 'REJECT' THEN 'REJECTED' ELSE 'BLOCKED' END,
    p_reason, p_validation_score, p_discrepancies_count
  )
  ON CONFLICT (quote_id, approval_type) DO UPDATE SET
    approved_by = EXCLUDED.approved_by,
    approved_by_name = EXCLUDED.approved_by_name,
    approved_by_role = EXCLUDED.approved_by_role,
    approved_at = now(),
    status = EXCLUDED.status,
    reason = EXCLUDED.reason,
    validation_score = EXCLUDED.validation_score,
    discrepancies_count = EXCLUDED.discrepancies_count,
    updated_at = now();
  
  -- Log successful approval
  PERFORM log_approval_audit(
    'TECHNICAL_APPROVAL',
    p_devis_id,
    CASE WHEN p_action = 'APPROVE' THEN 'APPROVED' WHEN p_action = 'REJECT' THEN 'REJECTED' ELSE 'BLOCKED' END,
    p_reason,
    v_current_tech_status,
    v_new_tech_status,
    jsonb_build_object(
      'validation_score', p_validation_score,
      'discrepancies_count', p_discrepancies_count,
      'approver_name', v_user_name,
      'approver_role', v_user_role
    ),
    FALSE
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tech_approval_status', v_new_tech_status,
    'approved_by', v_user_name,
    'approved_role', v_user_role,
    'timestamp', now(),
    'message', 'Technical approval recorded successfully'
  );
END;
$$;

-- =====================================================
-- Function: approve_administrative_devis - Step 2 with GOD-TIER enforcement
-- =====================================================
CREATE OR REPLACE FUNCTION public.approve_administrative_devis(
  p_devis_id TEXT,
  p_action TEXT DEFAULT 'APPROVE',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
  v_current_status TEXT;
  v_tech_status TEXT;
  v_tech_approved_by UUID;
  v_creator_id UUID;
  v_new_status TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  
  -- Get user info
  SELECT full_name INTO v_user_name FROM profiles WHERE id = v_user_id;
  v_user_role := get_user_role_text(v_user_id);
  
  -- Authorization check - only admin roles can validate
  IF v_user_role NOT IN ('accueil', 'agent_administratif', 'ceo', 'superviseur') THEN
    PERFORM log_approval_audit(
      'ADMINISTRATIVE_APPROVAL_ATTEMPT',
      p_devis_id,
      'BLOCKED',
      'UNAUTHORIZED_ROLE: ' || COALESCE(v_user_role, 'unknown'),
      NULL, NULL, NULL, TRUE
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous n''avez pas les permissions pour valider administrativement'
    );
  END IF;
  
  -- Get devis info
  SELECT statut, COALESCE(tech_approval_status, 'PENDING'), technical_approved_by, created_by
  INTO v_current_status, v_tech_status, v_tech_approved_by, v_creator_id
  FROM devis WHERE devis_id = p_devis_id;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Devis non trouvé');
  END IF;
  
  -- GOD-TIER ENFORCEMENT: Technical approval MUST be complete first
  -- Check BOTH the status AND the approver ID
  IF v_tech_status != 'APPROVED' OR v_tech_approved_by IS NULL THEN
    PERFORM log_approval_audit(
      'ADMINISTRATIVE_APPROVAL_ATTEMPT',
      p_devis_id,
      'BLOCKED',
      'TECHNICAL_APPROVAL_REQUIRED: Status=' || v_tech_status,
      v_current_status, NULL,
      jsonb_build_object('tech_status', v_tech_status, 'has_tech_approver', v_tech_approved_by IS NOT NULL),
      TRUE
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Approbation technique requise avant validation administrative',
      'technical_approval_status', v_tech_status,
      'blocking_reason', CASE 
        WHEN v_tech_status = 'PENDING' THEN 'L''approbation technique est en attente'
        WHEN v_tech_status = 'REJECTED' THEN 'L''approbation technique a été rejetée - révision requise'
        WHEN v_tech_status LIKE 'BLOCKED%' THEN 'L''approbation technique est bloquée'
        ELSE 'L''approbation technique est requise'
      END
    );
  END IF;
  
  -- Anti-fraud: Self-approval block
  IF v_creator_id = v_user_id THEN
    PERFORM log_approval_audit(
      'ADMINISTRATIVE_APPROVAL_ATTEMPT',
      p_devis_id,
      'BLOCKED',
      'SELF_APPROVAL_BLOCKED',
      v_current_status, NULL, NULL, TRUE
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas valider un devis que vous avez créé'
    );
  END IF;
  
  -- Determine new status
  v_new_status := CASE WHEN p_action = 'APPROVE' THEN 'valide' ELSE 'refuse' END;
  
  -- Update devis
  UPDATE devis SET
    statut = v_new_status,
    admin_approval_status = CASE WHEN p_action = 'APPROVE' THEN 'APPROVED' ELSE 'REJECTED' END,
    admin_approval_by = v_user_id,
    admin_approval_by_name = v_user_name,
    admin_approval_at = now(),
    admin_approval_notes = p_notes,
    approval_chain_complete = TRUE,
    validated_by = v_user_id,
    validated_by_name = v_user_name,
    validated_by_role = v_user_role,
    validated_at = now(),
    updated_at = now()
  WHERE devis_id = p_devis_id;
  
  -- Create approval record
  INSERT INTO quote_approvals (
    quote_id, approval_type, approved_by, approved_by_name, approved_by_role,
    status, reason
  )
  VALUES (
    p_devis_id, 'ADMINISTRATIVE', v_user_id, v_user_name, v_user_role,
    CASE WHEN p_action = 'APPROVE' THEN 'APPROVED' ELSE 'REJECTED' END,
    p_notes
  )
  ON CONFLICT (quote_id, approval_type) DO UPDATE SET
    approved_by = EXCLUDED.approved_by,
    approved_by_name = EXCLUDED.approved_by_name,
    approved_by_role = EXCLUDED.approved_by_role,
    approved_at = now(),
    status = EXCLUDED.status,
    reason = EXCLUDED.reason,
    updated_at = now();
  
  -- Log successful approval
  PERFORM log_approval_audit(
    'ADMINISTRATIVE_APPROVAL',
    p_devis_id,
    CASE WHEN p_action = 'APPROVE' THEN 'APPROVED' ELSE 'REJECTED' END,
    p_notes,
    v_current_status,
    v_new_status,
    jsonb_build_object(
      'validator_name', v_user_name,
      'validator_role', v_user_role,
      'approval_chain_complete', TRUE
    ),
    FALSE
  );
  
  -- Also log to audit_superviseur for existing forensic feeds
  INSERT INTO audit_superviseur (
    table_name, record_id, action, user_id, user_name, old_data, new_data, changes
  )
  VALUES (
    'devis', p_devis_id, 'ADMINISTRATIVE_APPROVAL', v_user_id, v_user_name,
    jsonb_build_object('statut', v_current_status),
    jsonb_build_object('statut', v_new_status),
    jsonb_build_object(
      'previous_status', v_current_status,
      'new_status', v_new_status,
      'approved_by', v_user_name,
      'approved_role', v_user_role
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'quote_id', p_devis_id,
    'status', v_new_status,
    'administrative_approval_status', CASE WHEN p_action = 'APPROVE' THEN 'APPROVED' ELSE 'REJECTED' END,
    'approved_by', v_user_name,
    'approved_role', v_user_role,
    'timestamp', now(),
    'message', 'Quote validated successfully'
  );
END;
$$;

-- =====================================================
-- Function: get_approval_status - Check full approval chain
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_approval_status(p_devis_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_devis RECORD;
  v_blocking_reasons JSONB;
BEGIN
  -- Get devis info
  SELECT * INTO v_devis FROM devis WHERE devis_id = p_devis_id;
  
  IF v_devis IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Devis non trouvé');
  END IF;
  
  -- Build blocking reasons
  v_blocking_reasons := '[]'::jsonb;
  IF COALESCE(v_devis.tech_approval_status, 'PENDING') = 'BLOCKED_DISCORDANCE' THEN
    v_blocking_reasons := v_blocking_reasons || jsonb_build_array('Discordances detected in technical review');
  END IF;
  IF COALESCE(v_devis.tech_approval_status, 'PENDING') = 'BLOCKED_MISSING_DOCS' THEN
    v_blocking_reasons := v_blocking_reasons || jsonb_build_array('Required documentation is incomplete');
  END IF;
  IF COALESCE(v_devis.tech_approval_status, 'PENDING') = 'BLOCKED_BUDGET' THEN
    v_blocking_reasons := v_blocking_reasons || jsonb_build_array('Budget limit would be exceeded');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'quote_id', p_devis_id,
    'technical_approval_status', COALESCE(v_devis.tech_approval_status, 'PENDING'),
    'technical_approval_by', v_devis.technical_approved_by_name,
    'technical_approval_timestamp', v_devis.technical_approved_at,
    'technical_approval_notes', v_devis.tech_approval_notes,
    'validation_score', v_devis.validation_score,
    'discrepancies_count', v_devis.discrepancies_count,
    'administrative_approval_status', COALESCE(v_devis.admin_approval_status, 'PENDING'),
    'administrative_approval_by', v_devis.admin_approval_by_name,
    'administrative_approval_timestamp', v_devis.admin_approval_at,
    'administrative_approval_notes', v_devis.admin_approval_notes,
    'can_approve_administratively', COALESCE(v_devis.tech_approval_status, 'PENDING') = 'APPROVED' AND v_devis.technical_approved_by IS NOT NULL,
    'approval_chain_complete', COALESCE(v_devis.approval_chain_complete, false),
    'blocking_reasons', v_blocking_reasons,
    'next_step', CASE 
      WHEN COALESCE(v_devis.approval_chain_complete, false) THEN 'Approbation complète'
      WHEN COALESCE(v_devis.tech_approval_status, 'PENDING') = 'APPROVED' THEN 'Validation administrative requise'
      WHEN COALESCE(v_devis.tech_approval_status, 'PENDING') LIKE 'BLOCKED%' THEN 'Résoudre les problèmes bloquants'
      ELSE 'En attente d''approbation technique'
    END
  );
END;
$$;

-- Migrate existing data - set tech_approval_status based on existing technical_approved_by
UPDATE devis SET
  tech_approval_status = CASE 
    WHEN technical_approved_by IS NOT NULL THEN 'APPROVED'
    ELSE 'PENDING'
  END,
  admin_approval_status = CASE 
    WHEN statut IN ('valide', 'accepte') THEN 'APPROVED'
    ELSE 'PENDING'
  END,
  admin_approval_by = validated_by,
  admin_approval_by_name = validated_by_name,
  admin_approval_at = validated_at,
  approval_chain_complete = (statut IN ('valide', 'accepte', 'converti'))
WHERE tech_approval_status IS NULL;