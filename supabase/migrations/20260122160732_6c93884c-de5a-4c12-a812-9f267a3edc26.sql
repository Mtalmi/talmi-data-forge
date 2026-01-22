-- ===================================================================
-- CONFLICT-FREE STRATEGIC WORKFLOW
-- ===================================================================

-- 1. Add workflow tracking fields to devis table
ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS validated_by_name text,
ADD COLUMN IF NOT EXISTS validated_by_role text,
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS requires_technical_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS technical_approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS technical_approved_by_name text,
ADD COLUMN IF NOT EXISTS technical_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_special_formula boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lock_expires_at timestamp with time zone;

-- 2. Add responsibility tracking to bons_commande
ALTER TABLE bons_commande
ADD COLUMN IF NOT EXISTS validated_by_name text,
ADD COLUMN IF NOT EXISTS validated_by_role text,
ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lock_expires_at timestamp with time zone;

-- 3. Add responsibility tracking to bons_livraison_reels
ALTER TABLE bons_livraison_reels
ADD COLUMN IF NOT EXISTS validated_by_name text,
ADD COLUMN IF NOT EXISTS validated_by_role text,
ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lock_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_recorded_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_recorded_by_name text,
ADD COLUMN IF NOT EXISTS payment_recorded_at timestamp with time zone;

-- 4. Add responsibility tracking to factures
ALTER TABLE factures
ADD COLUMN IF NOT EXISTS created_by_name text,
ADD COLUMN IF NOT EXISTS created_by_role text,
ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lock_expires_at timestamp with time zone;

-- ===================================================================
-- FUNCTION: Get user display info for responsibility stamp
-- ===================================================================
CREATE OR REPLACE FUNCTION public.get_user_display_info(p_user_id uuid)
RETURNS TABLE(full_name text, role_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.full_name, p.email, 'Utilisateur') as full_name,
    COALESCE(r.role, 'non_assigne') as role_name
  FROM profiles p
  LEFT JOIN user_roles_v2 r ON r.user_id = p.user_id
  WHERE p.user_id = p_user_id
  LIMIT 1;
END;
$$;

-- ===================================================================
-- FUNCTION: Acquire edit lock (optimistic locking)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.acquire_edit_lock(
  p_table_name text,
  p_record_id text,
  p_user_id uuid DEFAULT auth.uid(),
  p_lock_duration_minutes integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_lock_user uuid;
  v_current_lock_expires timestamp with time zone;
  v_user_info record;
  v_result jsonb;
BEGIN
  -- Get user info
  SELECT * INTO v_user_info FROM get_user_display_info(p_user_id);
  
  -- Check current lock based on table
  IF p_table_name = 'devis' THEN
    SELECT locked_by, lock_expires_at INTO v_current_lock_user, v_current_lock_expires
    FROM devis WHERE devis_id = p_record_id;
  ELSIF p_table_name = 'bons_commande' THEN
    SELECT locked_by, lock_expires_at INTO v_current_lock_user, v_current_lock_expires
    FROM bons_commande WHERE bc_id = p_record_id;
  ELSIF p_table_name = 'bons_livraison_reels' THEN
    SELECT locked_by, lock_expires_at INTO v_current_lock_user, v_current_lock_expires
    FROM bons_livraison_reels WHERE bl_id = p_record_id;
  ELSIF p_table_name = 'factures' THEN
    SELECT locked_by, lock_expires_at INTO v_current_lock_user, v_current_lock_expires
    FROM factures WHERE facture_id = p_record_id;
  END IF;
  
  -- Check if locked by another user (and lock not expired)
  IF v_current_lock_user IS NOT NULL 
     AND v_current_lock_user != p_user_id 
     AND v_current_lock_expires > now() THEN
    -- Get locker's info
    SELECT jsonb_build_object(
      'success', false,
      'locked', true,
      'locked_by_id', v_current_lock_user,
      'locked_by_name', (SELECT full_name FROM get_user_display_info(v_current_lock_user)),
      'expires_at', v_current_lock_expires
    ) INTO v_result;
    RETURN v_result;
  END IF;
  
  -- Acquire lock
  IF p_table_name = 'devis' THEN
    UPDATE devis SET 
      locked_by = p_user_id,
      locked_at = now(),
      lock_expires_at = now() + (p_lock_duration_minutes || ' minutes')::interval
    WHERE devis_id = p_record_id;
  ELSIF p_table_name = 'bons_commande' THEN
    UPDATE bons_commande SET 
      locked_by = p_user_id,
      locked_at = now(),
      lock_expires_at = now() + (p_lock_duration_minutes || ' minutes')::interval
    WHERE bc_id = p_record_id;
  ELSIF p_table_name = 'bons_livraison_reels' THEN
    UPDATE bons_livraison_reels SET 
      locked_by = p_user_id,
      locked_at = now(),
      lock_expires_at = now() + (p_lock_duration_minutes || ' minutes')::interval
    WHERE bl_id = p_record_id;
  ELSIF p_table_name = 'factures' THEN
    UPDATE factures SET 
      locked_by = p_user_id,
      locked_at = now(),
      lock_expires_at = now() + (p_lock_duration_minutes || ' minutes')::interval
    WHERE facture_id = p_record_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'locked', false,
    'locked_by_id', p_user_id,
    'locked_by_name', v_user_info.full_name,
    'expires_at', now() + (p_lock_duration_minutes || ' minutes')::interval
  );
END;
$$;

-- ===================================================================
-- FUNCTION: Release edit lock
-- ===================================================================
CREATE OR REPLACE FUNCTION public.release_edit_lock(
  p_table_name text,
  p_record_id text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table_name = 'devis' THEN
    UPDATE devis SET locked_by = NULL, locked_at = NULL, lock_expires_at = NULL
    WHERE devis_id = p_record_id AND (locked_by = p_user_id OR is_ceo(p_user_id));
  ELSIF p_table_name = 'bons_commande' THEN
    UPDATE bons_commande SET locked_by = NULL, locked_at = NULL, lock_expires_at = NULL
    WHERE bc_id = p_record_id AND (locked_by = p_user_id OR is_ceo(p_user_id));
  ELSIF p_table_name = 'bons_livraison_reels' THEN
    UPDATE bons_livraison_reels SET locked_by = NULL, locked_at = NULL, lock_expires_at = NULL
    WHERE bl_id = p_record_id AND (locked_by = p_user_id OR is_ceo(p_user_id));
  ELSIF p_table_name = 'factures' THEN
    UPDATE factures SET locked_by = NULL, locked_at = NULL, lock_expires_at = NULL
    WHERE facture_id = p_record_id AND (locked_by = p_user_id OR is_ceo(p_user_id));
  END IF;
  
  RETURN true;
END;
$$;

-- ===================================================================
-- FUNCTION: Validate devis with responsibility stamp
-- ===================================================================
CREATE OR REPLACE FUNCTION public.validate_devis(
  p_devis_id text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_devis record;
  v_user_info record;
  v_client record;
BEGIN
  -- Check permission: Only CEO, Superviseur, Agent Admin can validate
  IF NOT (is_ceo(p_user_id) OR is_superviseur(p_user_id) OR is_agent_administratif(p_user_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul l''Agent Administratif, CEO ou Superviseur peut valider un devis');
  END IF;
  
  -- Get devis
  SELECT * INTO v_devis FROM devis WHERE devis_id = p_devis_id;
  IF v_devis IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Devis non trouvé');
  END IF;
  
  -- Check if already validated
  IF v_devis.statut = 'valide' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce devis est déjà validé');
  END IF;
  
  -- Check if requires technical approval and not yet approved
  IF v_devis.requires_technical_approval AND v_devis.technical_approved_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce devis requiert une approbation technique avant validation');
  END IF;
  
  -- Check client credit if client exists
  IF v_devis.client_id IS NOT NULL THEN
    SELECT * INTO v_client FROM clients WHERE client_id = v_devis.client_id;
    IF v_client IS NOT NULL THEN
      IF v_client.credit_bloque THEN
        RETURN jsonb_build_object('success', false, 'error', 'Client bloqué - crédit suspendu');
      END IF;
      IF v_client.solde_du + v_devis.total_ht > v_client.limite_credit_dh THEN
        -- Allow but warn (CEO/Admin can override)
        IF NOT (is_ceo(p_user_id) OR is_agent_administratif(p_user_id)) THEN
          RETURN jsonb_build_object('success', false, 'error', 'Dépassement plafond crédit - approbation CEO requise');
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Get user info for stamp
  SELECT * INTO v_user_info FROM get_user_display_info(p_user_id);
  
  -- Update devis with validation stamp
  UPDATE devis SET
    statut = 'valide',
    validated_by = p_user_id,
    validated_by_name = v_user_info.full_name,
    validated_by_role = v_user_info.role_name,
    validated_at = now(),
    locked_by = NULL,
    locked_at = NULL,
    lock_expires_at = NULL,
    updated_at = now()
  WHERE devis_id = p_devis_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Devis validé avec succès',
    'validated_by', v_user_info.full_name,
    'validated_by_role', v_user_info.role_name
  );
END;
$$;

-- ===================================================================
-- FUNCTION: Technical approval for special formulas
-- ===================================================================
CREATE OR REPLACE FUNCTION public.approve_technical_devis(
  p_devis_id text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_devis record;
  v_user_info record;
BEGIN
  -- Check permission: Only CEO or Resp Technique can approve technically
  IF NOT (is_ceo(p_user_id) OR is_responsable_technique(p_user_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul le Responsable Technique ou CEO peut approuver techniquement');
  END IF;
  
  -- Get devis
  SELECT * INTO v_devis FROM devis WHERE devis_id = p_devis_id;
  IF v_devis IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Devis non trouvé');
  END IF;
  
  -- Get user info
  SELECT * INTO v_user_info FROM get_user_display_info(p_user_id);
  
  -- Update with technical approval
  UPDATE devis SET
    technical_approved_by = p_user_id,
    technical_approved_by_name = v_user_info.full_name,
    technical_approved_at = now(),
    updated_at = now()
  WHERE devis_id = p_devis_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Approbation technique accordée',
    'approved_by', v_user_info.full_name
  );
END;
$$;

-- ===================================================================
-- TRIGGER: Auto-flag special formulas for technical approval
-- ===================================================================
CREATE OR REPLACE FUNCTION public.check_special_formula_devis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formule record;
  v_is_special boolean := false;
BEGIN
  -- Get the formula
  SELECT * INTO v_formule FROM formules_theoriques WHERE formule_id = NEW.formule_id;
  
  -- Check if it's a special formula (high cement, special resistance, etc.)
  IF v_formule IS NOT NULL THEN
    -- Consider special if: cement > 400 kg/m3 OR resistance > 30 MPa OR designation contains 'Special'
    IF v_formule.ciment_kg_m3 > 400 
       OR v_formule.resistance_cible_28j_mpa > 30 
       OR v_formule.designation ILIKE '%special%'
       OR v_formule.designation ILIKE '%haut%'
       OR v_formule.designation ILIKE '%performance%' THEN
      v_is_special := true;
    END IF;
  END IF;
  
  NEW.is_special_formula := v_is_special;
  NEW.requires_technical_approval := v_is_special;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_special_formula_on_devis ON devis;
CREATE TRIGGER check_special_formula_on_devis
  BEFORE INSERT OR UPDATE OF formule_id ON devis
  FOR EACH ROW
  EXECUTE FUNCTION check_special_formula_devis();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_display_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_edit_lock TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_edit_lock TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_devis TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_technical_devis TO authenticated;