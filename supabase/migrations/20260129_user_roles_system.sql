-- TBOS User Roles & Permissions System
-- Created: January 29, 2026
-- Purpose: Implement strategic role-based access control

-- =====================================================
-- 1. CREATE USER ROLES ENUM
-- =====================================================

CREATE TYPE user_role AS ENUM (
  'ceo',
  'supervisor',
  'resp_technique',
  'frontdesk',
  'directeur_operationnel',
  'centraliste'
);

-- =====================================================
-- 2. CREATE USER PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE ROLE PERMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  module TEXT NOT NULL, -- e.g., 'ventes', 'production', 'stocks', 'dashboard'
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  special_constraints JSONB, -- For role-specific rules
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE AUDIT LOG FOR CRITICAL ACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS critical_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_role user_role,
  action_type TEXT NOT NULL, -- 'hard_change', 'override', 'emergency_bc', etc.
  module TEXT NOT NULL,
  record_id TEXT,
  description TEXT,
  requires_ceo_notification BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INSERT DEFAULT ROLE PERMISSIONS
-- =====================================================

-- CEO: Full access to everything
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, special_constraints)
VALUES
  ('ceo', 'ventes', true, true, true, true, true, '{"receives_all_notifications": true}'::jsonb),
  ('ceo', 'production', true, true, true, true, true, '{"receives_all_notifications": true}'::jsonb),
  ('ceo', 'stocks', true, true, true, true, true, '{"receives_all_notifications": true}'::jsonb),
  ('ceo', 'dashboard', true, true, true, true, true, '{"receives_all_notifications": true}'::jsonb),
  ('ceo', 'planning', true, true, true, true, true, '{"receives_all_notifications": true}'::jsonb),
  ('ceo', 'finance', true, true, true, true, true, '{"receives_all_notifications": true}'::jsonb);

-- Supervisor: Full access, but hard changes trigger CEO notification
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, special_constraints)
VALUES
  ('supervisor', 'ventes', true, true, true, true, true, '{"notify_ceo_on_hard_changes": true}'::jsonb),
  ('supervisor', 'production', true, true, true, true, true, '{"notify_ceo_on_hard_changes": true}'::jsonb),
  ('supervisor', 'stocks', true, true, true, true, true, '{"notify_ceo_on_hard_changes": true}'::jsonb),
  ('supervisor', 'dashboard', true, true, true, true, true, '{"notify_ceo_on_hard_changes": true}'::jsonb),
  ('supervisor', 'planning', true, true, true, true, true, '{"notify_ceo_on_hard_changes": true}'::jsonb),
  ('supervisor', 'finance', true, true, true, true, true, '{"notify_ceo_on_hard_changes": true}'::jsonb);

-- Resp. Technique: Quality control + limited viewing
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, special_constraints)
VALUES
  ('resp_technique', 'ventes', true, false, false, false, false, '{"read_only": true}'::jsonb),
  ('resp_technique', 'production', true, false, true, false, true, '{"can_approve_quality": true}'::jsonb),
  ('resp_technique', 'stocks', true, false, false, false, true, '{"can_approve_receptions": true}'::jsonb),
  ('resp_technique', 'planning', true, false, false, false, false, '{"read_only": true}'::jsonb),
  ('resp_technique', 'dashboard', true, false, false, false, false, '{"limited_view": true}'::jsonb);

-- FrontDesk: Administrative work (BC, BL, Devis)
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, special_constraints)
VALUES
  ('frontdesk', 'ventes', true, true, true, false, false, '{"can_manage_devis_bc_bl": true, "cannot_approve_technical": true}'::jsonb),
  ('frontdesk', 'production', true, false, false, false, false, '{"read_only": true}'::jsonb),
  ('frontdesk', 'stocks', true, false, false, false, false, '{"read_only": true}'::jsonb),
  ('frontdesk', 'planning', true, false, false, false, false, '{"read_only": true}'::jsonb),
  ('frontdesk', 'dashboard', true, false, false, false, false, '{"limited_view": true}'::jsonb);

-- Directeur Opérationnel: View formulas, emergency BC creation
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, special_constraints)
VALUES
  ('directeur_operationnel', 'ventes', true, true, false, false, false, '{"can_view_formulas": true, "cannot_edit_formulas": true, "emergency_bc_after_18h": true, "requires_ceo_approval": true}'::jsonb),
  ('directeur_operationnel', 'production', true, false, false, false, false, '{"read_only": true}'::jsonb),
  ('directeur_operationnel', 'stocks', true, false, false, false, false, '{"read_only": true}'::jsonb),
  ('directeur_operationnel', 'planning', true, true, true, false, false, '{"can_manage_planning": true}'::jsonb),
  ('directeur_operationnel', 'dashboard', true, false, false, false, false, '{"operational_view": true}'::jsonb);

-- Centraliste: Severely limited (production only, no financial data)
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, special_constraints)
VALUES
  ('centraliste', 'production', true, false, true, false, false, '{"production_interface_only": true, "no_financial_data": true}'::jsonb),
  ('centraliste', 'dashboard', false, false, false, false, false, '{"no_access": true}'::jsonb),
  ('centraliste', 'ventes', false, false, false, false, false, '{"no_access": true}'::jsonb),
  ('centraliste', 'stocks', false, false, false, false, false, '{"no_access": true}'::jsonb),
  ('centraliste', 'finance', false, false, false, false, false, '{"no_access": true}'::jsonb);

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: CEO and Supervisor can view all profiles
CREATE POLICY "CEO and Supervisor can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('ceo', 'supervisor')
    )
  );

-- Enable RLS on critical_actions_log
ALTER TABLE critical_actions_log ENABLE ROW LEVEL SECURITY;

-- Policy: CEO can view all critical actions
CREATE POLICY "CEO can view all critical actions"
  ON critical_actions_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'ceo'
    )
  );

-- Policy: Users can insert their own actions
CREATE POLICY "Users can log their own actions"
  ON critical_actions_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

-- Function: Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  module_name TEXT,
  permission_type TEXT -- 'view', 'create', 'edit', 'delete', 'approve'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  has_perm BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM user_profiles WHERE id = user_id;
  
  -- Check permission
  SELECT 
    CASE permission_type
      WHEN 'view' THEN can_view
      WHEN 'create' THEN can_create
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      WHEN 'approve' THEN can_approve
      ELSE false
    END
  INTO has_perm
  FROM role_permissions
  WHERE role = user_role_val AND module = module_name
  LIMIT 1;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Log critical action and notify CEO if needed
CREATE OR REPLACE FUNCTION log_critical_action(
  action_type_val TEXT,
  module_val TEXT,
  record_id_val TEXT,
  description_val TEXT,
  notify_ceo BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  user_role_val user_role;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM user_profiles WHERE id = auth.uid();
  
  -- Insert log
  INSERT INTO critical_actions_log (
    user_id,
    user_role,
    action_type,
    module,
    record_id,
    description,
    requires_ceo_notification
  )
  VALUES (
    auth.uid(),
    user_role_val,
    action_type_val,
    module_val,
    record_id_val,
    description_val,
    notify_ceo
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_role_permissions_role_module ON role_permissions(role, module);
CREATE INDEX idx_critical_actions_user_id ON critical_actions_log(user_id);
CREATE INDEX idx_critical_actions_created_at ON critical_actions_log(created_at DESC);

-- =====================================================
-- 9. INSERT INITIAL USERS (Based on requirements)
-- =====================================================

-- Note: These will be created after auth users are set up
-- This is a placeholder for the structure

COMMENT ON TABLE user_profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE role_permissions IS 'Defines what each role can do in each module';
COMMENT ON TABLE critical_actions_log IS 'Audit log for actions that require CEO notification';
