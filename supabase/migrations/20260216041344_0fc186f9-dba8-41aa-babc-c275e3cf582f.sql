
-- Add scoring columns to user_training_progress
ALTER TABLE public.user_training_progress 
  ADD COLUMN IF NOT EXISTS score_precision integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_conformite integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_rapidite integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_global integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_earned integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_spent_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS best_score integer DEFAULT 0;

-- Create XP levels table
CREATE TABLE IF NOT EXISTS public.user_xp_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_activity_date date,
  badges jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_xp_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own XP profile
CREATE POLICY "Users can view own XP profile"
  ON public.user_xp_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own XP profile
CREATE POLICY "Users can create own XP profile"
  ON public.user_xp_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own XP profile
CREATE POLICY "Users can update own XP profile"
  ON public.user_xp_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- CEO can view all profiles (leaderboard)
CREATE POLICY "CEO can view all XP profiles"
  ON public.user_xp_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'ceo'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_user_xp_profiles_updated_at
  BEFORE UPDATE ON public.user_xp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
