-- Create audit log table for tracking Superviseur changes
CREATE TABLE IF NOT EXISTS public.audit_superviseur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  changes JSONB, -- Only the changed fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.audit_superviseur ENABLE ROW LEVEL SECURITY;

-- CEO can see all audit logs
CREATE POLICY "CEO can view all audit logs"
ON public.audit_superviseur FOR SELECT
USING (is_ceo(auth.uid()));

-- Superviseur can view their own logs
CREATE POLICY "Superviseur can view own logs"
ON public.audit_superviseur FOR SELECT
USING (auth.uid() = user_id);

-- Create index for quick lookups
CREATE INDEX idx_audit_superviseur_user ON public.audit_superviseur(user_id);
CREATE INDEX idx_audit_superviseur_created ON public.audit_superviseur(created_at DESC);
CREATE INDEX idx_audit_superviseur_notified ON public.audit_superviseur(notified) WHERE notified = FALSE;

-- Function to log superviseur changes
CREATE OR REPLACE FUNCTION public.log_superviseur_change()
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
  
  -- Only log if user is superviseur
  IF NOT is_superviseur(v_user_id) THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Get user name
  SELECT full_name INTO v_user_name FROM profiles WHERE user_id = v_user_id;
  
  -- Prepare data based on operation
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_old_data := NULL;
    v_changes := v_new_data;
    v_record_id := COALESCE(
      NEW.id::TEXT,
      NEW.bl_id::TEXT,
      NEW.bc_id::TEXT,
      NEW.facture_id::TEXT,
      NEW.client_id::TEXT,
      gen_random_uuid()::TEXT
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_new_data := to_jsonb(NEW);
    v_old_data := to_jsonb(OLD);
    -- Calculate only changed fields
    v_changes := (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(v_new_data)
      WHERE v_old_data->key IS DISTINCT FROM value
    );
    v_record_id := COALESCE(
      NEW.id::TEXT,
      NEW.bl_id::TEXT,
      NEW.bc_id::TEXT,
      NEW.facture_id::TEXT,
      NEW.client_id::TEXT,
      ''
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_changes := NULL;
    v_record_id := COALESCE(
      OLD.id::TEXT,
      OLD.bl_id::TEXT,
      OLD.bc_id::TEXT,
      OLD.facture_id::TEXT,
      OLD.client_id::TEXT,
      ''
    );
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_superviseur (
    user_id, user_name, action, table_name, record_id, old_data, new_data, changes
  ) VALUES (
    v_user_id, v_user_name, TG_OP, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data, v_changes
  );
  
  -- Create alert for CEO
  INSERT INTO alertes_systeme (
    type_alerte,
    niveau,
    titre,
    message,
    reference_id,
    reference_table,
    destinataire_role
  ) VALUES (
    'technique',
    'info',
    'Modification par ' || COALESCE(v_user_name, 'Superviseur'),
    TG_OP || ' sur ' || TG_TABLE_NAME || ' (ID: ' || v_record_id || ')',
    v_record_id,
    TG_TABLE_NAME,
    'ceo'
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Add triggers to key tables for superviseur tracking
CREATE TRIGGER audit_bl_superviseur
AFTER INSERT OR UPDATE OR DELETE ON bons_livraison_reels
FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

CREATE TRIGGER audit_bc_superviseur
AFTER INSERT OR UPDATE OR DELETE ON bons_commande
FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

CREATE TRIGGER audit_clients_superviseur
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

CREATE TRIGGER audit_factures_superviseur
AFTER INSERT OR UPDATE OR DELETE ON factures
FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

CREATE TRIGGER audit_devis_superviseur
AFTER INSERT OR UPDATE OR DELETE ON devis
FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

CREATE TRIGGER audit_formules_superviseur
AFTER INSERT OR UPDATE OR DELETE ON formules_theoriques
FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

CREATE TRIGGER audit_prix_superviseur
AFTER INSERT OR UPDATE OR DELETE ON prix_achat_actuels
FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();