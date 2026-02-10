-- Create user_profiles table to support RBAC system in useAuth.tsx
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'frontdesk',
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Only CEO/supervisor can manage profiles (via service role or RPC)
CREATE POLICY "Management can read all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles_v2
      WHERE user_id = auth.uid()
      AND role IN ('ceo', 'supervisor')
    )
  );

-- Populate from existing user_roles_v2 + profiles data
INSERT INTO public.user_profiles (id, role, full_name, email)
SELECT 
  urv2.user_id,
  urv2.role,
  p.full_name,
  p.email
FROM public.user_roles_v2 urv2
LEFT JOIN public.profiles p ON p.user_id = urv2.user_id
ON CONFLICT (id) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();