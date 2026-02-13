-- Fix: Management profile read policy uses 'supervisor' but actual role is 'superviseur'
DROP POLICY IF EXISTS "Management can read all profiles" ON user_profiles;
CREATE POLICY "Management can read all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_roles_v2.user_id = auth.uid()
      AND user_roles_v2.role IN ('ceo', 'superviseur', 'supervisor')
    )
  );

-- Clean up stale test account from user_roles_v2
DELETE FROM user_roles_v2 WHERE user_id = 'fc90daf7-3d29-496b-956b-da532849de85';