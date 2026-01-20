-- Fix RLS policies for CEO to see all user roles and profiles

-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can read own role v2" ON user_roles_v2;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- CEO can read all user roles
CREATE POLICY "CEO can read all user roles v2"
ON user_roles_v2 FOR SELECT
USING (is_ceo(auth.uid()));

-- Users can still read their own role
CREATE POLICY "Users can read own role v2"
ON user_roles_v2 FOR SELECT
USING (user_id = auth.uid());

-- CEO can read all profiles (for user management)
CREATE POLICY "CEO can read all profiles"
ON profiles FOR SELECT
USING (is_ceo(auth.uid()));

-- Users can still read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (user_id = auth.uid());