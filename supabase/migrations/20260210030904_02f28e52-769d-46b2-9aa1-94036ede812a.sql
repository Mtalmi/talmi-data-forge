
-- Fix audit_log_trigger to handle tables without 'id' column (like bons_livraison_reels which uses bl_id)
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_user_name TEXT;
  v_action_type TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id TEXT;
BEGIN
  v_user_id := COALESCE(auth.uid()::TEXT, 'system');
  v_user_name := COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
    'system'
  );
  
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'INSERT';
    v_new_data := to_jsonb(NEW);
    v_old_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'UPDATE';
    v_new_data := to_jsonb(NEW);
    v_old_data := to_jsonb(OLD);
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'DELETE';
    v_new_data := NULL;
    v_old_data := to_jsonb(OLD);
  END IF;

  -- Dynamically get record ID from common PK column names
  IF TG_OP = 'DELETE' THEN
    v_record_id := COALESCE(
      (to_jsonb(OLD)->>'id'),
      (to_jsonb(OLD)->>'bl_id'),
      (to_jsonb(OLD)->>'bc_id'),
      (to_jsonb(OLD)->>'client_id'),
      (to_jsonb(OLD)->>'formule_id'),
      'unknown'
    );
  ELSE
    v_record_id := COALESCE(
      (to_jsonb(NEW)->>'id'),
      (to_jsonb(NEW)->>'bl_id'),
      (to_jsonb(NEW)->>'bc_id'),
      (to_jsonb(NEW)->>'client_id'),
      (to_jsonb(NEW)->>'formule_id'),
      'unknown'
    );
  END IF;

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
    v_record_id,
    v_old_data,
    v_new_data,
    v_action_type || ' on ' || TG_TABLE_NAME
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
