-- Create a reusable audit trigger function
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
  v_action_type TEXT;
  v_user_id UUID;
  v_user_name TEXT;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_user_name
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- Determine action type and data
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'INSERT';
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'DELETE';
    v_old_data := to_jsonb(OLD);
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action_type,
    table_name,
    record_id,
    old_data,
    new_data,
    description
  ) VALUES (
    v_user_id,
    v_user_name,
    v_action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_old_data,
    v_new_data,
    v_action_type || ' on ' || TG_TABLE_NAME
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to formules_theoriques
DROP TRIGGER IF EXISTS audit_formules_theoriques ON public.formules_theoriques;
CREATE TRIGGER audit_formules_theoriques
AFTER INSERT OR UPDATE OR DELETE ON public.formules_theoriques
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add trigger to devis
DROP TRIGGER IF EXISTS audit_devis ON public.devis;
CREATE TRIGGER audit_devis
AFTER INSERT OR UPDATE OR DELETE ON public.devis
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add trigger to prix_achat_actuels
DROP TRIGGER IF EXISTS audit_prix_achat_actuels ON public.prix_achat_actuels;
CREATE TRIGGER audit_prix_achat_actuels
AFTER INSERT OR UPDATE OR DELETE ON public.prix_achat_actuels
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();