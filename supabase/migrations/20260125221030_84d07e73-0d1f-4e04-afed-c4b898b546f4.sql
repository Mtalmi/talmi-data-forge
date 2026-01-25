-- GOD-TIER TWO-STEP APPROVAL ENFORCEMENT
-- Enforce technical approval BEFORE administrative validation at database level

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.approve_devis_with_stamp(text);
DROP FUNCTION IF EXISTS public.approve_technical_devis(text, uuid);

-- Recreate approve_devis_with_stamp with two-step enforcement
CREATE OR REPLACE FUNCTION public.approve_devis_with_stamp(p_devis_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_user_name text;
  v_current_status text;
  v_creator_id uuid;
  v_requires_technical boolean;
  v_technical_approved_by uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get user role and name
  SELECT role INTO v_user_role FROM user_roles_v2 WHERE user_id = v_user_id;
  SELECT COALESCE(full_name, 'Unknown') INTO v_user_name FROM profiles WHERE id = v_user_id;
  
  -- Check if user has permission to approve
  IF v_user_role IS NULL OR v_user_role NOT IN ('ceo', 'superviseur', 'agent_administratif') THEN
    -- Log security violation
    INSERT INTO audit_superviseur (table_name, record_id, action, user_id, user_name, changes)
    VALUES ('devis', p_devis_id, 'ACCESS_DENIED', v_user_id, v_user_name, 
            jsonb_build_object('attempted_action', 'approve_devis', 'user_role', v_user_role));
    RETURN jsonb_build_object('success', false, 'error', 'Vous n''avez pas les permissions pour approuver ce devis');
  END IF;

  -- Get devis info
  SELECT statut, created_by, COALESCE(requires_technical_approval, is_special_formula, false), technical_approved_by
  INTO v_current_status, v_creator_id, v_requires_technical, v_technical_approved_by
  FROM devis WHERE devis_id = p_devis_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Devis non trouvé');
  END IF;

  -- Check if already validated
  IF v_current_status IN ('valide', 'accepte', 'converti') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce devis a déjà été validé');
  END IF;

  -- ANTI-FRAUD: Self-approval block
  IF v_creator_id = v_user_id THEN
    INSERT INTO audit_superviseur (table_name, record_id, action, user_id, user_name, changes)
    VALUES ('devis', p_devis_id, 'SELF_APPROVAL_BLOCKED', v_user_id, v_user_name, 
            jsonb_build_object('reason', 'Cannot approve own devis'));
    RETURN jsonb_build_object('success', false, 'error', 'Vous ne pouvez pas approuver votre propre devis');
  END IF;

  -- GOD-TIER: Technical approval enforcement
  IF v_requires_technical AND v_technical_approved_by IS NULL THEN
    INSERT INTO audit_superviseur (table_name, record_id, action, user_id, user_name, changes)
    VALUES ('devis', p_devis_id, 'TECHNICAL_APPROVAL_REQUIRED', v_user_id, v_user_name, 
            jsonb_build_object('reason', 'Technical approval required before administrative validation'));
    RETURN jsonb_build_object('success', false, 'error', 'Approbation technique requise avant validation. Veuillez contacter le Responsable Technique.');
  END IF;

  -- Perform approval with responsibility stamp
  UPDATE devis
  SET 
    statut = 'valide',
    validated_by = v_user_id,
    validated_by_name = v_user_name,
    validated_by_role = v_user_role,
    validated_at = NOW(),
    updated_at = NOW()
  WHERE devis_id = p_devis_id;

  -- Log approval in audit trail
  INSERT INTO audit_superviseur (table_name, record_id, action, user_id, user_name, changes)
  VALUES ('devis', p_devis_id, 'APPROVE_DEVIS', v_user_id, v_user_name, 
          jsonb_build_object(
            'previous_status', v_current_status, 
            'new_status', 'valide',
            'two_step_complete', v_requires_technical,
            'technical_approved_by', v_technical_approved_by
          ));

  RETURN jsonb_build_object(
    'success', true, 
    'approved_by', v_user_name, 
    'approved_role', v_user_role,
    'two_step_approval', v_requires_technical
  );
END;
$$;

-- Recreate approve_technical_devis to properly record approval
CREATE OR REPLACE FUNCTION public.approve_technical_devis(p_devis_id text, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_user_name text;
  v_current_status text;
  v_already_approved uuid;
BEGIN
  -- Get current user
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get user role and name
  SELECT role INTO v_user_role FROM user_roles_v2 WHERE user_id = v_user_id;
  SELECT COALESCE(full_name, 'Unknown') INTO v_user_name FROM profiles WHERE id = v_user_id;
  
  -- Check if user has permission to approve technically
  IF v_user_role IS NULL OR v_user_role NOT IN ('responsable_technique', 'ceo', 'superviseur') THEN
    INSERT INTO audit_superviseur (table_name, record_id, action, user_id, user_name, changes)
    VALUES ('devis', p_devis_id, 'ACCESS_DENIED', v_user_id, v_user_name, 
            jsonb_build_object('attempted_action', 'technical_approval', 'user_role', v_user_role));
    RETURN jsonb_build_object('success', false, 'error', 'Seul le Responsable Technique peut approuver techniquement');
  END IF;

  -- Get devis info
  SELECT statut, technical_approved_by INTO v_current_status, v_already_approved
  FROM devis WHERE devis_id = p_devis_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Devis non trouvé');
  END IF;

  -- Check if already technically approved
  IF v_already_approved IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce devis a déjà été approuvé techniquement');
  END IF;

  -- Perform technical approval
  UPDATE devis
  SET 
    technical_approved_by = v_user_id,
    technical_approved_by_name = v_user_name,
    technical_approved_at = NOW(),
    updated_at = NOW()
  WHERE devis_id = p_devis_id;

  -- Log technical approval in audit trail
  INSERT INTO audit_superviseur (table_name, record_id, action, user_id, user_name, changes)
  VALUES ('devis', p_devis_id, 'TECHNICAL_APPROVAL', v_user_id, v_user_name, 
          jsonb_build_object(
            'step', 1, 
            'workflow', 'two_step_approval',
            'approved_by_role', v_user_role
          ));

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Approbation technique accordée',
    'approved_by', v_user_name, 
    'approved_role', v_user_role
  );
END;
$$;