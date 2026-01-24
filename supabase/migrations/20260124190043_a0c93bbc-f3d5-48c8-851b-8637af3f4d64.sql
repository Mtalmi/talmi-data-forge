
-- ============================================================
-- TITANIUM SHIELD HARDENING v2.0 - PART 2: AUDIT TRIGGERS ONLY
-- ============================================================

-- Create universal audit function with safe type handling
CREATE OR REPLACE FUNCTION public.log_table_changes_universal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id text;
  v_user_name text;
  v_user_id uuid;
BEGIN
  -- Get user ID safely
  v_user_id := auth.uid();
  
  -- Get user name safely with explicit cast
  IF v_user_id IS NOT NULL THEN
    SELECT full_name INTO v_user_name 
    FROM profiles 
    WHERE profiles.user_id = v_user_id;
  END IF;
  
  -- Determine record ID based on table structure using jsonb extraction
  IF TG_OP = 'DELETE' THEN
    v_record_id := COALESCE(
      (to_jsonb(OLD)->>'id'),
      (to_jsonb(OLD)->>'bl_id'),
      (to_jsonb(OLD)->>'formule_id'),
      (to_jsonb(OLD)->>'devis_id'),
      (to_jsonb(OLD)->>'materiau'),
      'unknown'
    );
    
    INSERT INTO audit_superviseur (
      user_id, table_name, action, record_id, old_data, new_data, changes, user_name
    ) VALUES (
      COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      TG_TABLE_NAME, 'DELETE', v_record_id,
      to_jsonb(OLD), NULL,
      '{"operation": "deleted"}'::jsonb,
      v_user_name
    );
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := COALESCE(
      (to_jsonb(NEW)->>'id'),
      (to_jsonb(NEW)->>'bl_id'),
      (to_jsonb(NEW)->>'formule_id'),
      (to_jsonb(NEW)->>'devis_id'),
      (to_jsonb(NEW)->>'materiau'),
      'unknown'
    );
    
    INSERT INTO audit_superviseur (
      user_id, table_name, action, record_id, old_data, new_data, changes, user_name
    ) VALUES (
      COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      TG_TABLE_NAME, 'UPDATE', v_record_id,
      to_jsonb(OLD), to_jsonb(NEW),
      '{"operation": "updated"}'::jsonb,
      v_user_name
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    v_record_id := COALESCE(
      (to_jsonb(NEW)->>'id'),
      (to_jsonb(NEW)->>'bl_id'),
      (to_jsonb(NEW)->>'formule_id'),
      (to_jsonb(NEW)->>'devis_id'),
      (to_jsonb(NEW)->>'materiau'),
      'unknown'
    );
    
    INSERT INTO audit_superviseur (
      user_id, table_name, action, record_id, old_data, new_data, changes, user_name
    ) VALUES (
      COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      TG_TABLE_NAME, 'INSERT', v_record_id,
      NULL, to_jsonb(NEW),
      '{"operation": "created"}'::jsonb,
      v_user_name
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Trigger for formules_theoriques
DROP TRIGGER IF EXISTS audit_formules_changes ON formules_theoriques;
CREATE TRIGGER audit_formules_changes
  AFTER INSERT OR UPDATE OR DELETE ON formules_theoriques
  FOR EACH ROW EXECUTE FUNCTION log_table_changes_universal();

-- Trigger for stocks
DROP TRIGGER IF EXISTS audit_stocks_changes ON stocks;
CREATE TRIGGER audit_stocks_changes
  AFTER INSERT OR UPDATE OR DELETE ON stocks
  FOR EACH ROW EXECUTE FUNCTION log_table_changes_universal();

-- Trigger for bons_livraison_reels (critical production data)
DROP TRIGGER IF EXISTS audit_bons_livraison_changes ON bons_livraison_reels;
CREATE TRIGGER audit_bons_livraison_changes
  AFTER INSERT OR UPDATE OR DELETE ON bons_livraison_reels
  FOR EACH ROW EXECUTE FUNCTION log_table_changes_universal();

-- Trigger for devis (ensure full coverage)
DROP TRIGGER IF EXISTS audit_devis_changes ON devis;
CREATE TRIGGER audit_devis_changes
  AFTER INSERT OR UPDATE OR DELETE ON devis
  FOR EACH ROW EXECUTE FUNCTION log_table_changes_universal();
