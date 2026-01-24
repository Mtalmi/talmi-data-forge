-- Create table for tracking user training completion
CREATE TABLE public.user_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  step_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_id)
);

-- Create table for mastery badge
CREATE TABLE public.user_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  certification_type TEXT NOT NULL DEFAULT 'operator',
  certified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certified_by UUID,
  badge_level TEXT DEFAULT 'bronze'
);

-- Enable RLS
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training progress
CREATE POLICY "Users can view their own progress" 
ON public.user_training_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_training_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- CEO/Superviseur can view all training progress
CREATE POLICY "CEO can view all training progress" 
ON public.user_training_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles_v2 
    WHERE user_id = auth.uid() 
    AND role IN ('ceo', 'superviseur')
  )
);

-- RLS Policies for certifications
CREATE POLICY "Users can view their own certification" 
ON public.user_certifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certification" 
ON public.user_certifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "CEO can view all certifications" 
ON public.user_certifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles_v2 
    WHERE user_id = auth.uid() 
    AND role IN ('ceo', 'superviseur')
  )
);

-- Enable realtime for CEO monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_certifications;