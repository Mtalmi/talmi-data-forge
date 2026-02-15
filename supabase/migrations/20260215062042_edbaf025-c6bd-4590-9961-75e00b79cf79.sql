
CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_complet TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  entreprise TEXT,
  nombre_centrales INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demo requests"
ON public.demo_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only authenticated users can view demo requests"
ON public.demo_requests
FOR SELECT
USING (auth.uid() IS NOT NULL);
