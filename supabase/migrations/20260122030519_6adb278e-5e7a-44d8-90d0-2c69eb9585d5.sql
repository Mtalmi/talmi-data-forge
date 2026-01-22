-- Update stock alert function to call edge function for email notifications
CREATE OR REPLACE FUNCTION public.check_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_alert RECORD;
  v_alert_id UUID;
BEGIN
  -- Check if stock fell below alert threshold
  FOR v_alert IN 
    SELECT ar.*, s.quantite_actuelle, s.id as stock_id, s.unite
    FROM alertes_reapprovisionnement ar
    JOIN stocks s ON LOWER(ar.materiau) = LOWER(s.materiau)
    WHERE ar.actif = true 
    AND s.quantite_actuelle <= ar.seuil_alerte
    AND (ar.derniere_alerte IS NULL OR ar.derniere_alerte < now() - INTERVAL '24 hours')
  LOOP
    -- Create system alert and get the ID
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message, reference_id, reference_table, destinataire_role
    ) VALUES (
      'stock_critique',
      CASE WHEN v_alert.quantite_actuelle <= v_alert.seuil_alerte / 2 THEN 'critical' ELSE 'warning' END,
      'Stock bas - ' || v_alert.materiau,
      'Le stock de ' || v_alert.materiau || ' est à ' || v_alert.quantite_actuelle || ' ' || COALESCE(v_alert.unite, '') || '. Seuil d''alerte: ' || v_alert.seuil_alerte || '. Quantité à commander: ' || v_alert.quantite_reorder,
      v_alert.stock_id::TEXT,
      'stocks',
      'ceo'
    )
    RETURNING id INTO v_alert_id;
    
    -- Update last alert time
    UPDATE alertes_reapprovisionnement SET derniere_alerte = now() WHERE id = v_alert.id;
    
    -- Note: Email notification is triggered via edge function call from frontend
    -- The notify-stock-critique function handles sending emails to Procurement Manager and CEO
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS check_stock_alerts_trigger ON public.stocks;
CREATE TRIGGER check_stock_alerts_trigger
AFTER UPDATE ON public.stocks
FOR EACH ROW EXECUTE FUNCTION public.check_stock_alerts();

-- Add comment for documentation
COMMENT ON FUNCTION public.check_stock_alerts() IS 'Monitors stock levels and creates system alerts when quantities fall below thresholds. Email notifications are handled by notify-stock-critique edge function.';