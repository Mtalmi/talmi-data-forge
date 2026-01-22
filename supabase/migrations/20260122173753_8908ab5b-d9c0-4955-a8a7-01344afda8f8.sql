-- ================================================================
-- SECURITY FORTRESS - TECHNICAL FOUNDATION CONSOLIDATION
-- Clean up duplicate policies and strengthen enforcement
-- ================================================================

-- ================================================================
-- 1. FORMULES RLS - Clean up duplicates, enforce CEO/Superviseur ONLY
-- ================================================================

-- Drop old/duplicate policies
DROP POLICY IF EXISTS "CEO can delete formules" ON public.formules_theoriques;
DROP POLICY IF EXISTS "CEO can insert formules" ON public.formules_theoriques;
DROP POLICY IF EXISTS "CEO can update formules" ON public.formules_theoriques;
DROP POLICY IF EXISTS "Technical and operations roles can view formules" ON public.formules_theoriques;

-- Keep only the clean policies:
-- formules_read_all (SELECT)
-- formules_insert_ceo_superviseur (INSERT)
-- formules_update_ceo_superviseur (UPDATE)
-- formules_delete_ceo_superviseur (DELETE)

-- ================================================================
-- 2. DEVIS RLS - Strengthen approval check at database level
-- ================================================================

-- Function to check if user can approve devis (database-level enforcement)
CREATE OR REPLACE FUNCTION public.can_approve_devis(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles_v2
    WHERE user_roles_v2.user_id = _user_id 
    AND role IN ('ceo', 'superviseur', 'agent_administratif')
  );
$$;

-- Add trigger to block unauthorized status changes on devis
CREATE OR REPLACE FUNCTION public.enforce_devis_approval_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If status is changing TO 'valide' or 'accepte' (approval actions)
  IF (OLD.statut != NEW.statut) AND (NEW.statut IN ('valide', 'accepte')) THEN
    -- Check if current user can approve
    IF NOT can_approve_devis(auth.uid()) THEN
      RAISE EXCEPTION 'Permission refusée: Seul l''Agent Admin, CEO ou Superviseur peut approuver un Devis';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_devis_approval_trigger ON public.devis;
CREATE TRIGGER enforce_devis_approval_trigger
  BEFORE UPDATE ON public.devis
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_devis_approval_permission();

-- ================================================================
-- 3. STOCK ENTRIES - Add mandatory photo enforcement at DB level
-- ================================================================

-- Function to enforce mandatory photo for stock entries
CREATE OR REPLACE FUNCTION public.enforce_stock_photo_requirement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mandatory photo for quality entries
  IF NEW.photo_materiel_url IS NULL OR NEW.photo_materiel_url = '' THEN
    RAISE EXCEPTION 'Photo du matériau obligatoire pour le contrôle qualité!';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_stock_photo_trigger ON public.stock_receptions_pending;
CREATE TRIGGER enforce_stock_photo_trigger
  BEFORE INSERT ON public.stock_receptions_pending
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_stock_photo_requirement();

-- ================================================================
-- 4. STOCK FINALIZATION - Ensure only Admin can increment silos
-- ================================================================

-- Enhanced validate function with additional safety checks
CREATE OR REPLACE FUNCTION public.validate_stock_reception(
  p_reception_id UUID,
  p_poids_pesee NUMERIC DEFAULT NULL,
  p_numero_facture TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_name TEXT;
  v_reception RECORD;
  v_final_quantite NUMERIC;
  v_quality_user_name TEXT;
  v_stock_before NUMERIC;
  v_stock_after NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user role from v2 table
  SELECT role INTO v_user_role FROM user_roles_v2 WHERE user_id = v_user_id;
  
  -- STRICT PERMISSION CHECK: Only CEO, Superviseur, or Agent Admin
  IF v_user_role IS NULL OR v_user_role NOT IN ('ceo', 'superviseur', 'agent_administratif') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Permission refusée: Seul l''Agent Admin, CEO ou Superviseur peut finaliser une réception'
    );
  END IF;
  
  -- Get user name for audit
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;
  
  -- Get the pending reception (MUST be in 'approuve_qualite' status)
  SELECT * INTO v_reception FROM stock_receptions_pending 
  WHERE id = p_reception_id AND statut = 'approuve_qualite';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Réception non trouvée ou pas encore approuvée par le contrôle Qualité'
    );
  END IF;
  
  -- Use weighbridge weight if provided, otherwise use declared quantity
  v_final_quantite := COALESCE(p_poids_pesee, v_reception.quantite);
  
  -- Get quality approver name
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_quality_user_name
  FROM auth.users WHERE id = v_reception.qualite_approuvee_par;
  
  -- Get current stock level BEFORE update
  SELECT quantite_actuelle INTO v_stock_before 
  FROM stocks WHERE materiau = v_reception.materiau;
  
  -- Update the pending reception to 'valide' (finalized)
  UPDATE stock_receptions_pending
  SET 
    poids_pesee = p_poids_pesee,
    numero_facture = p_numero_facture,
    notes_admin = p_notes,
    admin_approuve_par = v_user_id,
    admin_approuve_at = NOW(),
    statut = 'valide',
    updated_at = NOW()
  WHERE id = p_reception_id;
  
  -- NOW increment the actual silo stock using secure_add_reception
  PERFORM secure_add_reception(
    v_reception.materiau,
    v_final_quantite,
    v_reception.fournisseur,
    v_reception.numero_bl,
    v_reception.photo_bl_url,
    CONCAT('Double-Lock Validé | Qualité: ', v_quality_user_name, ' | Admin: ', v_user_name)
  );
  
  -- Get stock AFTER update
  SELECT quantite_actuelle INTO v_stock_after 
  FROM stocks WHERE materiau = v_reception.materiau;
  
  -- Full audit trail with before/after
  INSERT INTO audit_superviseur (user_id, user_name, action, table_name, record_id, old_data, new_data)
  VALUES (
    v_user_id, 
    v_user_name, 
    'STOCK_FINALIZED', 
    'stock_receptions_pending', 
    p_reception_id::TEXT,
    jsonb_build_object('stock_before', v_stock_before),
    jsonb_build_object(
      'materiau', v_reception.materiau, 
      'quantite_ajoutee', v_final_quantite,
      'stock_after', v_stock_after,
      'quality_by', v_quality_user_name,
      'admin_by', v_user_name
    )
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', CONCAT('Stock ajouté: +', v_final_quantite, ' ', v_reception.materiau, ' | Double-Lock complété'),
    'stock_before', v_stock_before,
    'stock_after', v_stock_after,
    'delta', v_final_quantite
  );
END;
$$;

-- ================================================================
-- 5. USER ROLES V2 - Add index for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_user_id ON public.user_roles_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_v2_role ON public.user_roles_v2(role);