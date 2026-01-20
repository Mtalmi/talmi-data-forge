-- Update the log_superviseur_change function to call the notification edge function
CREATE OR REPLACE FUNCTION public.log_superviseur_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_changes JSONB;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id TEXT;
  v_audit_id UUID;
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
  
  -- Insert audit log and get the ID
  INSERT INTO audit_superviseur (
    user_id, user_name, action, table_name, record_id, old_data, new_data, changes
  ) VALUES (
    v_user_id, v_user_name, TG_OP, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data, v_changes
  ) RETURNING id INTO v_audit_id;
  
  -- Create alert for CEO (in-app notification)
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
    CASE 
      WHEN TG_TABLE_NAME IN ('prix_achat_actuels', 'clients') THEN 'warning'
      ELSE 'info'
    END,
    'Modification par ' || COALESCE(v_user_name, 'Superviseur'),
    TG_OP || ' sur ' || TG_TABLE_NAME || ' (ID: ' || v_record_id || ')',
    v_audit_id::TEXT,
    'audit_superviseur',
    'ceo'
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;