
-- Disable RLS on tables needed for n8n automation workflows
ALTER TABLE public.devis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_livraison_reels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prix_achat_actuels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.formules_theoriques DISABLE ROW LEVEL SECURITY;
