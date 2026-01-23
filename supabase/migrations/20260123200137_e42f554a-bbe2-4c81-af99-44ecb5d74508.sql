-- Add rollback_count column to devis table
ALTER TABLE public.devis 
ADD COLUMN IF NOT EXISTS rollback_count INTEGER NOT NULL DEFAULT 0;

-- Update cancel_devis_approval function to increment rollback_count
DROP FUNCTION IF EXISTS public.cancel_devis_approval(TEXT, TEXT);

CREATE FUNCTION public.cancel_devis_approval(
  p_devis_id TEXT,
  p_reason TEXT DEFAULT NULL
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
  v_created_by UUID;
  v_client_name TEXT;
  v_creator_different BOOLEAN;
  v_new_rollback_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- STRICT VALIDATION: Reason is MANDATORY with minimum length
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Justification obligatoire (minimum 10 caractères)';
  END IF;
  
  -- Get user name and role
  SELECT full_name INTO v_user_name
  FROM user_roles_v2
  WHERE user_id = v_user_id
  LIMIT 1;
  
  -- Check role (must be CEO or Superviseur)
  IF EXISTS (SELECT 1 FROM user_roles_v2 WHERE user_id = v_user_id AND role = 'ceo') THEN
    v_user_role := 'ceo';
  ELSIF EXISTS (SELECT 1 FROM user_roles_v2 WHERE user_id = v_user_id AND role = 'superviseur') THEN
    v_user_role := 'superviseur';
  ELSE
    RAISE EXCEPTION 'Seuls le CEO ou le Superviseur peuvent annuler une approbation';
  END IF;
  
  -- Get current devis info
  SELECT d.statut, d.created_by, c.nom_client
  INTO v_current_status, v_created_by, v_client_name
  FROM devis d
  LEFT JOIN clients c ON d.client_id = c.client_id
  WHERE d.devis_id = p_devis_id;
  
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Devis non trouvé';
  END IF;
  
  IF v_current_status NOT IN ('valide', 'accepte') THEN
    RAISE EXCEPTION 'Ce devis n''est pas dans un état validé';
  END IF;
  
  -- Check if creator is different from current user
  v_creator_different := (v_created_by IS NOT NULL AND v_created_by != v_user_id);
  
  -- Update devis status back to en_attente AND increment rollback_count
  UPDATE devis
  SET 
    statut = 'en_attente',
    validated_by = NULL,
    validated_at = NULL,
    validated_by_name = NULL,
    validated_by_role = NULL,
    rollback_count = COALESCE(rollback_count, 0) + 1,
    updated_at = NOW()
  WHERE devis_id = p_devis_id
  RETURNING rollback_count INTO v_new_rollback_count;
  
  -- Log in audit_superviseur with MANDATORY reason
  INSERT INTO audit_superviseur (
    user_id,
    user_name,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    changes
  ) VALUES (
    v_user_id,
    v_user_name,
    'ROLLBACK_APPROVAL',
    'devis',
    p_devis_id,
    jsonb_build_object('statut', v_current_status),
    jsonb_build_object('statut', 'en_attente', 'rollback_count', v_new_rollback_count),
    jsonb_build_object(
      'reason', TRIM(p_reason),
      'previous_status', v_current_status,
      'new_status', 'en_attente',
      'cancelled_by_role', v_user_role,
      'rollback_number', v_new_rollback_count
    )
  );
  
  -- Create in-app notification for the creator if different
  IF v_creator_different THEN
    INSERT INTO alertes_systeme (
      type_alerte,
      niveau,
      titre,
      message,
      destinataire_role,
      reference_table,
      reference_id
    ) VALUES (
      'devis_rollback',
      'warning',
      '⚠️ Devis Déverrouillé',
      'Votre Devis #' || p_devis_id || ' a été remis en brouillon par ' || COALESCE(v_user_name, 'la direction') || '. Motif : "' || TRIM(p_reason) || '"',
      NULL,
      'devis',
      p_devis_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'cancelled_by', v_user_name,
    'cancelled_role', v_user_role,
    'creator_id', v_created_by,
    'creator_notified', v_creator_different,
    'client_name', v_client_name,
    'reason_logged', true,
    'rollback_count', v_new_rollback_count
  );
END;
$$;