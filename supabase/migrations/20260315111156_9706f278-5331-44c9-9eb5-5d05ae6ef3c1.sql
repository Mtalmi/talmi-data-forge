
-- === DATABASE FUNCTIONS & TRIGGERS ===

-- Calculate stock autonomy
CREATE OR REPLACE FUNCTION calculate_stock_autonomie()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consommation_moy_jour IS NOT NULL AND NEW.consommation_moy_jour > 0 THEN
    NEW.autonomie_jours = NEW.quantite_actuelle / NEW.consommation_moy_jour;
  ELSE
    NEW.autonomie_jours = 999;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stock_autonomie ON stocks;
CREATE TRIGGER trigger_stock_autonomie
  BEFORE INSERT OR UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_stock_autonomie();

-- Auto-update facture status to en_retard (validation trigger, not CHECK)
CREATE OR REPLACE FUNCTION check_facture_retard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_echeance IS NOT NULL AND NEW.date_echeance < CURRENT_DATE AND NEW.statut NOT IN ('payee', 'litige') AND NEW.date_paiement IS NULL THEN
    NEW.statut = 'en_retard';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_facture_retard ON factures;
CREATE TRIGGER trigger_facture_retard
  BEFORE INSERT OR UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION check_facture_retard();

-- Update client payment_score based on invoice history
CREATE OR REPLACE FUNCTION update_client_score()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_score numeric;
  v_total_invoices integer;
  v_paid_on_time integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE statut = 'payee' AND (date_paiement IS NULL OR date_paiement <= date_echeance))
  INTO v_total_invoices, v_paid_on_time
  FROM factures
  WHERE client_id = NEW.client_id;

  IF v_total_invoices > 0 THEN
    v_payment_score = (v_paid_on_time::numeric / v_total_invoices) * 100;
    UPDATE clients SET payment_score = v_payment_score::integer, updated_at = now() WHERE client_id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_score ON factures;
CREATE TRIGGER trigger_update_client_score
  AFTER INSERT OR UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION update_client_score();

-- Generate sequential numbers utility
CREATE OR REPLACE FUNCTION generate_numero(prefix text, tbl_name text)
RETURNS text AS $$
DECLARE
  year_month text;
  seq_num integer;
  result text;
BEGIN
  year_month = to_char(now(), 'YYMM');
  EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM ''[0-9]+$'') AS integer)), 0) + 1 FROM %I WHERE numero LIKE $1', tbl_name)
  INTO seq_num
  USING prefix || '-' || year_month || '-%';
  result = prefix || '-' || year_month || '-' || lpad(seq_num::text, 3, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- === REALTIME ===
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'livraisons') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE livraisons;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'alertes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE alertes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'activity_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'daily_scores') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_scores;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ai_analyses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_analyses;
  END IF;
END $$;
