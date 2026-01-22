-- ===================================================================
-- MATRICE DES PERMISSIONS - Audit Triggers & Workflow Function
-- ===================================================================

-- Enhanced audit trigger for superviseur on sensitive tables
CREATE OR REPLACE FUNCTION public.log_superviseur_sensitive_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_changes JSONB;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Log if user is superviseur (mandatory audit trail)
  IF NOT is_superviseur(v_user_id) THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
  -- Get user name
  SELECT full_name INTO v_user_name FROM profiles WHERE user_id = v_user_id;
  
  -- Prepare data
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_old_data := NULL;
    v_record_id := CASE 
      WHEN TG_TABLE_NAME = 'prix_achat_actuels' THEN NEW.matiere_premiere
      WHEN TG_TABLE_NAME = 'formules_theoriques' THEN NEW.formule_id
      WHEN TG_TABLE_NAME = 'clients' THEN NEW.client_id
      ELSE gen_random_uuid()::TEXT
    END;
  ELSIF TG_OP = 'UPDATE' THEN
    v_new_data := to_jsonb(NEW);
    v_old_data := to_jsonb(OLD);
    v_changes := (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(v_new_data)
      WHERE v_old_data->key IS DISTINCT FROM value
    );
    v_record_id := CASE 
      WHEN TG_TABLE_NAME = 'prix_achat_actuels' THEN NEW.matiere_premiere
      WHEN TG_TABLE_NAME = 'formules_theoriques' THEN NEW.formule_id
      WHEN TG_TABLE_NAME = 'clients' THEN NEW.client_id
      ELSE ''
    END;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_record_id := CASE 
      WHEN TG_TABLE_NAME = 'prix_achat_actuels' THEN OLD.matiere_premiere
      WHEN TG_TABLE_NAME = 'formules_theoriques' THEN OLD.formule_id
      WHEN TG_TABLE_NAME = 'clients' THEN OLD.client_id
      ELSE ''
    END;
  END IF;
  
  -- Insert detailed audit log
  INSERT INTO audit_superviseur (
    user_id, user_name, action, table_name, record_id, old_data, new_data, changes
  ) VALUES (
    v_user_id, 
    v_user_name, 
    TG_OP, 
    TG_TABLE_NAME, 
    v_record_id, 
    v_old_data, 
    v_new_data, 
    v_changes
  );
  
  -- Create CRITICAL alert for CEO (prix changes are highest priority)
  INSERT INTO alertes_systeme (
    type_alerte,
    niveau,
    titre,
    message,
    reference_id,
    reference_table,
    destinataire_role
  ) VALUES (
    CASE 
      WHEN TG_TABLE_NAME = 'prix_achat_actuels' THEN 'prix_modification'
      WHEN TG_TABLE_NAME = 'clients' THEN 'credit_modification'
      ELSE 'technique'
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'prix_achat_actuels' THEN 'critical'
      ELSE 'warning'
    END,
    'AUDIT: ' || COALESCE(v_user_name, 'Superviseur') || ' - ' || TG_TABLE_NAME,
    TG_OP || ' sur ' || TG_TABLE_NAME || ': ' || v_record_id,
    v_record_id,
    TG_TABLE_NAME,
    'ceo'
  );
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Apply audit trigger to sensitive tables
DROP TRIGGER IF EXISTS audit_superviseur_prix ON prix_achat_actuels;
CREATE TRIGGER audit_superviseur_prix
  AFTER INSERT OR UPDATE OR DELETE ON prix_achat_actuels
  FOR EACH ROW EXECUTE FUNCTION log_superviseur_sensitive_change();

DROP TRIGGER IF EXISTS audit_superviseur_formules ON formules_theoriques;
CREATE TRIGGER audit_superviseur_formules
  AFTER INSERT OR UPDATE OR DELETE ON formules_theoriques
  FOR EACH ROW EXECUTE FUNCTION log_superviseur_sensitive_change();

-- Trigger for credit limit changes on clients (using correct column names)
DROP TRIGGER IF EXISTS audit_superviseur_clients_credit ON clients;
CREATE TRIGGER audit_superviseur_clients_credit
  AFTER UPDATE ON clients
  FOR EACH ROW 
  WHEN (
    OLD.limite_credit_dh IS DISTINCT FROM NEW.limite_credit_dh OR
    OLD.credit_bloque IS DISTINCT FROM NEW.credit_bloque OR
    OLD.delai_paiement_jours IS DISTINCT FROM NEW.delai_paiement_jours
  )
  EXECUTE FUNCTION log_superviseur_sensitive_change();

-- Workflow permission check function
CREATE OR REPLACE FUNCTION public.can_update_workflow_status(
  p_current_status TEXT,
  p_new_status TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CEO/Superviseur can do anything
  IF is_ceo(p_user_id) OR is_superviseur(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Resp Technique: Only validation_technique transitions
  IF is_responsable_technique(p_user_id) THEN
    RETURN p_new_status = 'validation_technique' OR p_current_status = 'production';
  END IF;
  
  -- Dir Ops: Only planification and assignment
  IF is_directeur_operations(p_user_id) THEN
    RETURN p_new_status IN ('planification', 'production') OR p_current_status = 'planification';
  END IF;
  
  -- Agent Admin: Full planning + payment/invoicing
  IF is_agent_administratif(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Centraliste: Only production/consumption updates
  IF is_centraliste(p_user_id) THEN
    RETURN p_current_status = 'production' AND p_new_status IN ('production', 'validation_technique');
  END IF;
  
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_update_workflow_status TO authenticated;