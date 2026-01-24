-- Add audit trigger to bons_commande (delivery orders)
DROP TRIGGER IF EXISTS audit_bons_commande ON public.bons_commande;
CREATE TRIGGER audit_bons_commande
AFTER INSERT OR UPDATE OR DELETE ON public.bons_commande
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add audit trigger to stock_receptions_pending (pending inventory receipts)
DROP TRIGGER IF EXISTS audit_stock_receptions_pending ON public.stock_receptions_pending;
CREATE TRIGGER audit_stock_receptions_pending
AFTER INSERT OR UPDATE OR DELETE ON public.stock_receptions_pending
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add audit trigger to mouvements_stock (stock movements)
DROP TRIGGER IF EXISTS audit_mouvements_stock ON public.mouvements_stock;
CREATE TRIGGER audit_mouvements_stock
AFTER INSERT OR UPDATE OR DELETE ON public.mouvements_stock
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Add audit trigger to bons_livraison_reels (actual delivery notes)
DROP TRIGGER IF EXISTS audit_bons_livraison_reels ON public.bons_livraison_reels;
CREATE TRIGGER audit_bons_livraison_reels
AFTER INSERT OR UPDATE OR DELETE ON public.bons_livraison_reels
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();