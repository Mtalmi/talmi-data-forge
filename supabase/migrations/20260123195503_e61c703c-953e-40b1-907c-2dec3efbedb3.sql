-- =====================================================
-- Add 'devis_rollback' alert type to alertes_systeme
-- =====================================================
ALTER TABLE alertes_systeme DROP CONSTRAINT IF EXISTS alertes_systeme_type_alerte_check;

ALTER TABLE alertes_systeme ADD CONSTRAINT alertes_systeme_type_alerte_check 
CHECK (type_alerte = ANY (ARRAY[
  'fuite'::text,
  'marge'::text, 
  'credit'::text, 
  'planification'::text, 
  'retard'::text, 
  'technique'::text, 
  'stock_critique'::text,
  'qualite_critique'::text,
  'retard_paiement'::text,
  'client_bloque'::text,
  'mise_en_demeure'::text,
  'rappel_paiement'::text,
  'rappels_automatiques'::text,
  'ecart_production'::text,
  'devis_rollback'::text,
  'approbation_requise'::text
]));

-- =====================================================
-- Update cancel_devis_approval to insert in-app notification
-- Only notify if creator is different from the person rolling back
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
  v_creator_id UUID;
  v_client_name TEXT;
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
  
  -- Get client name separately
  SELECT nom_client INTO v_client_name
  FROM clients
  WHERE client_id = v_devis_record.client_id;
  
  IF v_devis_record.statut NOT IN ('valide', 'accepte') THEN
    RAISE EXCEPTION 'Ce devis n''est pas dans un état validé (statut actuel: %)', v_devis_record.statut;
  END IF;
  
  -- If already converted to BC, cannot cancel
  IF v_devis_record.statut = 'converti' THEN
    RAISE EXCEPTION 'Impossible d''annuler: ce devis a déjà été converti en Bon de Commande';
  END IF;
  
  v_old_status := v_devis_record.statut;
  v_creator_id := v_devis_record.created_by;
  
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
  
  -- Insert in-app notification for the creator (only if different from current user)
  IF v_creator_id IS NOT NULL AND v_creator_id != v_user_id THEN
    INSERT INTO alertes_systeme (
      type_alerte,
      niveau,
      titre,
      message,
      reference_table,
      reference_id,
      destinataire_role
    ) VALUES (
      'devis_rollback',
      'warning',
      '⚠️ Devis Déverrouillé',
      'Votre Devis #' || p_devis_id || COALESCE(' (' || v_client_name || ')', '') || 
        ' a été remis en brouillon par ' || v_user_name || ' pour correction.' ||
        CASE WHEN p_reason IS NOT NULL THEN ' Raison: ' || p_reason ELSE '' END,
      'devis',
      p_devis_id,
      NULL
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'devis_id', p_devis_id,
    'cancelled_by', v_user_name,
    'cancelled_role', v_user_role,
    'cancelled_at', NOW(),
    'previous_status', v_old_status,
    'creator_id', v_creator_id,
    'creator_notified', (v_creator_id IS NOT NULL AND v_creator_id != v_user_id),
    'client_name', v_client_name
  );
END;
$$;