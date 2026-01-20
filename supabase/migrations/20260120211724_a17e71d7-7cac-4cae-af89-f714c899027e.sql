-- =====================================================
-- SUPERVISEUR AUDIT SYSTEM - Triggers on existing tables
-- =====================================================

-- Triggers on tables that exist

-- Prix table trigger
DROP TRIGGER IF EXISTS audit_superviseur_prix ON prix_achat_actuels;
CREATE TRIGGER audit_superviseur_prix
  AFTER INSERT OR UPDATE OR DELETE ON prix_achat_actuels
  FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

-- Clients table trigger (status changes, blocking, etc.)
DROP TRIGGER IF EXISTS audit_superviseur_clients ON clients;
CREATE TRIGGER audit_superviseur_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

-- Factures table trigger (payment status changes)
DROP TRIGGER IF EXISTS audit_superviseur_factures ON factures;
CREATE TRIGGER audit_superviseur_factures
  AFTER INSERT OR UPDATE OR DELETE ON factures
  FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

-- BL (delivery notes) trigger - for price and status changes
DROP TRIGGER IF EXISTS audit_superviseur_bl ON bons_livraison_reels;
CREATE TRIGGER audit_superviseur_bl
  AFTER UPDATE ON bons_livraison_reels
  FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

-- BC (purchase orders) trigger
DROP TRIGGER IF EXISTS audit_superviseur_bc ON bons_commande;
CREATE TRIGGER audit_superviseur_bc
  AFTER INSERT OR UPDATE OR DELETE ON bons_commande
  FOR EACH ROW EXECUTE FUNCTION log_superviseur_change();

-- Enable realtime for audit table so CEO sees alerts immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_superviseur;