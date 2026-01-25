
-- =====================================================
-- GOD-TIER TWO-STEP APPROVAL FOR RAW MATERIAL ORDERS
-- Technical Approval MUST come before Front Desk Validation
-- =====================================================

-- Add technical approval tracking columns to mouvements_stock
ALTER TABLE public.mouvements_stock
ADD COLUMN IF NOT EXISTS tech_approval_status text DEFAULT 'pending' CHECK (tech_approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS tech_approval_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS tech_approval_by_name text,
ADD COLUMN IF NOT EXISTS tech_approval_at timestamptz,
ADD COLUMN IF NOT EXISTS tech_approval_notes text,
ADD COLUMN IF NOT EXISTS tech_approval_photos text[],
ADD COLUMN IF NOT EXISTS front_desk_validation_status text DEFAULT 'blocked' CHECK (front_desk_validation_status IN ('blocked', 'pending', 'validated', 'rejected')),
ADD COLUMN IF NOT EXISTS front_desk_validated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS front_desk_validated_by_name text,
ADD COLUMN IF NOT EXISTS front_desk_validated_at timestamptz,
ADD COLUMN IF NOT EXISTS front_desk_notes text,
ADD COLUMN IF NOT EXISTS workflow_status text DEFAULT 'awaiting_technical' CHECK (workflow_status IN ('awaiting_technical', 'awaiting_frontdesk', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS humidity_test_pct numeric,
ADD COLUMN IF NOT EXISTS gravel_grade text,
ADD COLUMN IF NOT EXISTS quality_assessment text CHECK (quality_assessment IN ('conforme', 'a_verifier', 'non_conforme'));

-- Create index for faster workflow queries
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_workflow ON public.mouvements_stock(workflow_status) WHERE type_mouvement = 'reception';
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_tech_approval ON public.mouvements_stock(tech_approval_status) WHERE type_mouvement = 'reception';

-- Function to approve technical quality check (ONLY Resp. Technique or CEO/Superviseur)
CREATE OR REPLACE FUNCTION public.approve_technical_reception(
  p_mouvement_id uuid,
  p_quality_assessment text,
  p_humidity_pct numeric DEFAULT NULL,
  p_gravel_grade text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_photos text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
  v_user_role text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM public.profiles WHERE id = v_user_id;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM public.user_roles_v2 WHERE user_id = v_user_id;
  
  -- Check role permission: ONLY responsable_technique, ceo, superviseur
  IF v_user_role NOT IN ('responsable_technique', 'ceo', 'superviseur') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Accès refusé. Seul le Responsable Technique (Abdel Sadek/Karim) peut approuver.'
    );
  END IF;
  
  -- Validate quality assessment
  IF p_quality_assessment NOT IN ('conforme', 'a_verifier', 'non_conforme') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Évaluation qualité invalide');
  END IF;
  
  -- Update the record
  UPDATE public.mouvements_stock
  SET
    tech_approval_status = CASE WHEN p_quality_assessment = 'non_conforme' THEN 'rejected' ELSE 'approved' END,
    tech_approval_by = v_user_id,
    tech_approval_by_name = COALESCE(v_user_name, 'Unknown'),
    tech_approval_at = now(),
    tech_approval_notes = p_notes,
    tech_approval_photos = p_photos,
    humidity_test_pct = p_humidity_pct,
    gravel_grade = p_gravel_grade,
    quality_assessment = p_quality_assessment,
    -- Update workflow status based on quality assessment
    workflow_status = CASE 
      WHEN p_quality_assessment = 'non_conforme' THEN 'rejected'
      ELSE 'awaiting_frontdesk'
    END,
    -- Unblock front desk if approved
    front_desk_validation_status = CASE 
      WHEN p_quality_assessment = 'non_conforme' THEN 'rejected'
      ELSE 'pending'
    END
  WHERE id = p_mouvement_id
    AND type_mouvement = 'reception'
    AND tech_approval_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Réception introuvable ou déjà traitée');
  END IF;
  
  -- Log to audit
  INSERT INTO public.audit_superviseur (
    user_id, user_name, table_name, action, record_id, new_data
  ) VALUES (
    v_user_id,
    v_user_name,
    'mouvements_stock',
    'TECHNICAL_APPROVAL',
    p_mouvement_id::text,
    jsonb_build_object(
      'quality_assessment', p_quality_assessment,
      'humidity_pct', p_humidity_pct,
      'gravel_grade', p_gravel_grade,
      'notes', p_notes
    )
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Approbation technique enregistrée',
    'quality_assessment', p_quality_assessment
  );
END;
$$;

-- Function to validate front desk (ONLY after technical approval)
CREATE OR REPLACE FUNCTION public.validate_frontdesk_reception(
  p_mouvement_id uuid,
  p_confirmed_quantity numeric,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
  v_user_role text;
  v_tech_status text;
  v_quality_assessment text;
  v_front_desk_status text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM public.profiles WHERE id = v_user_id;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM public.user_roles_v2 WHERE user_id = v_user_id;
  
  -- Check role permission: agent_administratif, ceo, superviseur
  IF v_user_role NOT IN ('agent_administratif', 'ceo', 'superviseur') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Accès refusé. Seul le Front Desk (Agent Administratif) peut valider.'
    );
  END IF;
  
  -- Get current status
  SELECT tech_approval_status, quality_assessment, front_desk_validation_status
  INTO v_tech_status, v_quality_assessment, v_front_desk_status
  FROM public.mouvements_stock
  WHERE id = p_mouvement_id AND type_mouvement = 'reception';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Réception introuvable');
  END IF;
  
  -- CRITICAL: Check if technical approval is complete
  IF v_tech_status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', '🔒 VALIDATION BLOQUÉE - Approbation technique requise avant validation Front Desk.',
      'blocked', true,
      'tech_status', v_tech_status
    );
  END IF;
  
  -- Check if front desk is blocked
  IF v_front_desk_status = 'blocked' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '🔒 Validation bloquée - En attente d''approbation technique',
      'blocked', true
    );
  END IF;
  
  -- Update the record
  UPDATE public.mouvements_stock
  SET
    front_desk_validation_status = 'validated',
    front_desk_validated_by = v_user_id,
    front_desk_validated_by_name = COALESCE(v_user_name, 'Unknown'),
    front_desk_validated_at = now(),
    front_desk_notes = p_notes,
    workflow_status = 'approved',
    quantite = p_confirmed_quantity
  WHERE id = p_mouvement_id
    AND type_mouvement = 'reception'
    AND tech_approval_status = 'approved'
    AND front_desk_validation_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Impossible de valider - Vérifiez le statut');
  END IF;
  
  -- Log to audit
  INSERT INTO public.audit_superviseur (
    user_id, user_name, table_name, action, record_id, new_data
  ) VALUES (
    v_user_id,
    v_user_name,
    'mouvements_stock',
    'FRONTDESK_VALIDATION',
    p_mouvement_id::text,
    jsonb_build_object(
      'confirmed_quantity', p_confirmed_quantity,
      'notes', p_notes
    )
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Réception validée avec succès',
    'confirmed_quantity', p_confirmed_quantity
  );
END;
$$;

-- Function to get pending technical approvals
CREATE OR REPLACE FUNCTION public.get_pending_technical_approvals()
RETURNS TABLE (
  id uuid,
  materiau text,
  quantite numeric,
  fournisseur text,
  numero_bl_fournisseur text,
  photo_bl_url text,
  created_at timestamptz,
  tech_approval_status text,
  workflow_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.materiau,
    m.quantite,
    m.fournisseur,
    m.numero_bl_fournisseur,
    m.photo_bl_url,
    m.created_at,
    m.tech_approval_status,
    m.workflow_status
  FROM public.mouvements_stock m
  WHERE m.type_mouvement = 'reception'
    AND m.tech_approval_status = 'pending'
  ORDER BY m.created_at DESC;
$$;

-- Function to get pending front desk validations
CREATE OR REPLACE FUNCTION public.get_pending_frontdesk_validations()
RETURNS TABLE (
  id uuid,
  materiau text,
  quantite numeric,
  fournisseur text,
  numero_bl_fournisseur text,
  photo_bl_url text,
  created_at timestamptz,
  tech_approval_status text,
  tech_approval_by_name text,
  tech_approval_at timestamptz,
  quality_assessment text,
  humidity_test_pct numeric,
  gravel_grade text,
  tech_approval_notes text,
  workflow_status text,
  front_desk_validation_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.materiau,
    m.quantite,
    m.fournisseur,
    m.numero_bl_fournisseur,
    m.photo_bl_url,
    m.created_at,
    m.tech_approval_status,
    m.tech_approval_by_name,
    m.tech_approval_at,
    m.quality_assessment,
    m.humidity_test_pct,
    m.gravel_grade,
    m.tech_approval_notes,
    m.workflow_status,
    m.front_desk_validation_status
  FROM public.mouvements_stock m
  WHERE m.type_mouvement = 'reception'
    AND m.tech_approval_status = 'approved'
    AND m.front_desk_validation_status IN ('pending', 'blocked')
  ORDER BY m.tech_approval_at DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_technical_reception TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_frontdesk_reception TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_technical_approvals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_frontdesk_validations TO authenticated;
