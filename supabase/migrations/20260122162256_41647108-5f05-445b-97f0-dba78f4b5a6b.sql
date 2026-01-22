-- =====================================================
-- HARD PERMISSION WALL - Formules & Devis Security
-- Database-Level RLS for absolute accountability
-- =====================================================

-- Enable RLS on formules_theoriques
ALTER TABLE public.formules_theoriques ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on formules_theoriques
DROP POLICY IF EXISTS "formules_read_all" ON public.formules_theoriques;
DROP POLICY IF EXISTS "formules_insert_ceo_superviseur" ON public.formules_theoriques;
DROP POLICY IF EXISTS "formules_update_ceo_superviseur" ON public.formules_theoriques;
DROP POLICY IF EXISTS "formules_delete_ceo_superviseur" ON public.formules_theoriques;

-- READ: All operational roles can view formulas (for production/quality)
CREATE POLICY "formules_read_all" ON public.formules_theoriques
FOR SELECT USING (
  is_ceo(auth.uid()) OR
  is_superviseur(auth.uid()) OR
  is_responsable_technique(auth.uid()) OR
  is_directeur_operations(auth.uid()) OR
  is_agent_administratif(auth.uid()) OR
  is_centraliste(auth.uid()) OR
  is_commercial(auth.uid())
);

-- INSERT: ONLY CEO and Superviseur can add formulas
CREATE POLICY "formules_insert_ceo_superviseur" ON public.formules_theoriques
FOR INSERT WITH CHECK (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid())
);

-- UPDATE: ONLY CEO and Superviseur can edit formulas
CREATE POLICY "formules_update_ceo_superviseur" ON public.formules_theoriques
FOR UPDATE USING (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid())
) WITH CHECK (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid())
);

-- DELETE: ONLY CEO and Superviseur can delete formulas
CREATE POLICY "formules_delete_ceo_superviseur" ON public.formules_theoriques
FOR DELETE USING (
  is_ceo(auth.uid()) OR is_superviseur(auth.uid())
);

-- =====================================================
-- DEVIS APPROVAL AUTHORITY - Only Agent Admin + CEO/Superviseur
-- =====================================================

-- Create RPC to approve a devis with responsibility stamp
-- This ensures ONLY authorized roles can approve
CREATE OR REPLACE FUNCTION approve_devis_with_stamp(
  p_devis_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_name TEXT;
  v_devis_record RECORD;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM user_roles_v2
  WHERE user_id = v_user_id;
  
  -- PERMISSION CHECK: Only CEO, Superviseur, or Agent Administratif can approve
  IF v_user_role NOT IN ('ceo', 'superviseur', 'agent_administratif') THEN
    RAISE EXCEPTION 'Permission refusée: Seul l''Agent Administratif, CEO ou Superviseur peut approuver un Devis';
  END IF;
  
  -- Get user name from auth metadata
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Check if devis exists and is in correct status
  SELECT * INTO v_devis_record
  FROM devis
  WHERE devis_id = p_devis_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Devis non trouvé: %', p_devis_id;
  END IF;
  
  IF v_devis_record.statut NOT IN ('en_attente', 'pending') THEN
    RAISE EXCEPTION 'Ce devis ne peut pas être approuvé (statut actuel: %)', v_devis_record.statut;
  END IF;
  
  -- Check for technical approval if required
  IF v_devis_record.requires_technical_approval = TRUE AND v_devis_record.technical_approved_by IS NULL THEN
    RAISE EXCEPTION 'Ce devis nécessite une approbation technique avant validation';
  END IF;
  
  -- Update devis with approval stamp
  UPDATE devis
  SET 
    statut = 'valide',
    validated_by = v_user_id,
    validated_at = NOW(),
    validated_by_name = v_user_name,
    validated_by_role = v_user_role,
    updated_at = NOW()
  WHERE devis_id = p_devis_id;
  
  -- Log to audit
  INSERT INTO audit_superviseur (user_id, user_name, action, table_name, record_id, new_data)
  VALUES (
    v_user_id,
    v_user_name,
    'APPROVE_DEVIS',
    'devis',
    p_devis_id,
    jsonb_build_object(
      'devis_id', p_devis_id,
      'approved_by', v_user_name,
      'approved_role', v_user_role,
      'approved_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'devis_id', p_devis_id,
    'approved_by', v_user_name,
    'approved_role', v_user_role,
    'approved_at', NOW()
  );
END;
$$;

-- Grant execute to authenticated users (RPC handles permission internally)
GRANT EXECUTE ON FUNCTION approve_devis_with_stamp(TEXT) TO authenticated;