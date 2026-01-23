-- =====================================================
-- IMMUTABLE APPROVED STATE: Hard-Lock Trigger for Devis
-- Prevents any modifications to validated/converted devis
-- Only CEO/Superviseur can unlock via special RPC
-- =====================================================

-- Trigger to prevent modifications on approved devis
CREATE OR REPLACE FUNCTION public.prevent_approved_devis_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- If the devis is in a locked state, block all modifications except status changes by authorized roles
  IF OLD.statut IN ('valide', 'accepte', 'converti') THEN
    -- Allow status changes to 'converti' (when creating BC from approved devis)
    IF NEW.statut = 'converti' AND OLD.statut IN ('valide', 'accepte') THEN
      RETURN NEW;
    END IF;
    
    -- Allow CEO/Superviseur to revert to en_attente (cancel approval)
    IF NEW.statut = 'en_attente' AND OLD.statut IN ('valide', 'accepte') THEN
      -- This will be handled by the cancel_devis_approval RPC which checks role
      RETURN NEW;
    END IF;
    
    -- Block all other modifications
    RAISE EXCEPTION 'IMMUTABLE STATE: Ce devis a été validé et ne peut plus être modifié. Utilisez "Annuler l''Approbation" pour le déverrouiller.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger (after the self-approval check)
DROP TRIGGER IF EXISTS trigger_prevent_approved_devis_modification ON devis;
CREATE TRIGGER trigger_prevent_approved_devis_modification
  BEFORE UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_approved_devis_modification();

-- =====================================================
-- CANCEL APPROVAL RPC: Only CEO/Superviseur can unlock
-- Moves devis back to 'en_attente' and logs the action
-- =====================================================
CREATE OR REPLACE FUNCTION public.cancel_devis_approval(
  p_devis_id TEXT,
  p_reason TEXT DEFAULT NULL
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
  v_old_status TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM user_roles_v2
  WHERE user_id = v_user_id;
  
  -- PERMISSION CHECK: Only CEO or Superviseur can cancel approval
  IF v_user_role NOT IN ('ceo', 'superviseur') THEN
    RAISE EXCEPTION 'Permission refusée: Seul le CEO ou Superviseur peut annuler l''approbation d''un Devis';
  END IF;
  
  -- Get user name
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Check if devis exists and is in approved state
  SELECT * INTO v_devis_record
  FROM devis
  WHERE devis_id = p_devis_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Devis non trouvé: %', p_devis_id;
  END IF;
  
  IF v_devis_record.statut NOT IN ('valide', 'accepte') THEN
    RAISE EXCEPTION 'Ce devis n''est pas dans un état validé (statut actuel: %)', v_devis_record.statut;
  END IF;
  
  -- If already converted to BC, cannot cancel
  IF v_devis_record.statut = 'converti' THEN
    RAISE EXCEPTION 'Impossible d''annuler: ce devis a déjà été converti en Bon de Commande';
  END IF;
  
  v_old_status := v_devis_record.statut;
  
  -- Revert to draft state - clear validation fields
  UPDATE devis
  SET 
    statut = 'en_attente',
    validated_by = NULL,
    validated_at = NULL,
    validated_by_name = NULL,
    validated_by_role = NULL,
    updated_at = NOW()
  WHERE devis_id = p_devis_id;
  
  -- Log to audit with full details
  INSERT INTO audit_superviseur (user_id, user_name, action, table_name, record_id, old_data, new_data)
  VALUES (
    v_user_id,
    v_user_name,
    'CANCEL_DEVIS_APPROVAL',
    'devis',
    p_devis_id,
    jsonb_build_object(
      'previous_status', v_old_status,
      'previous_validator', v_devis_record.validated_by_name,
      'previous_approved_at', v_devis_record.validated_at
    ),
    jsonb_build_object(
      'new_status', 'en_attente',
      'cancelled_by', v_user_name,
      'cancelled_role', v_user_role,
      'cancelled_at', NOW(),
      'reason', COALESCE(p_reason, 'Non spécifié')
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'devis_id', p_devis_id,
    'cancelled_by', v_user_name,
    'cancelled_role', v_user_role,
    'cancelled_at', NOW(),
    'previous_status', v_old_status
  );
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.prevent_approved_devis_modification() IS 'Immutable State: Blocks modifications to validated devis';
COMMENT ON FUNCTION public.cancel_devis_approval(TEXT, TEXT) IS 'CEO/Superviseur only: Cancels approval and reverts devis to draft state';