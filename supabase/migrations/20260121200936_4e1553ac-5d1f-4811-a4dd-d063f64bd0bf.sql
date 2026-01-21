-- Enable realtime for cross-module synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.bons_livraison_reels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bons_commande;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devis;