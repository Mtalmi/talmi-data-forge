-- Add read/dismissed tracking to alertes_systeme
ALTER TABLE public.alertes_systeme 
ADD COLUMN IF NOT EXISTS lu BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lu_par UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS lu_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dismissible BOOLEAN DEFAULT true;

-- Create index for unread alerts
CREATE INDEX IF NOT EXISTS idx_alertes_systeme_lu ON public.alertes_systeme(lu);
CREATE INDEX IF NOT EXISTS idx_alertes_systeme_created ON public.alertes_systeme(created_at DESC);

-- Enable realtime for alertes_systeme
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertes_systeme;