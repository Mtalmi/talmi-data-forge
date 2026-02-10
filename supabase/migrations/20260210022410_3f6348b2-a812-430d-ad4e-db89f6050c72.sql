-- Add specific quality check photo columns to stock_receptions_pending
ALTER TABLE public.stock_receptions_pending 
ADD COLUMN IF NOT EXISTS photo_gravel_url TEXT,
ADD COLUMN IF NOT EXISTS photo_humidity_url TEXT;

-- Update the RPC to accept the new photo parameters
CREATE OR REPLACE FUNCTION public.create_quality_stock_entry(
  p_materiau TEXT,
  p_quantite NUMERIC,
  p_fournisseur TEXT,
  p_numero_bl TEXT,
  p_photo_materiel_url TEXT,
  p_photo_bl_url TEXT DEFAULT NULL,
  p_humidite_pct NUMERIC DEFAULT NULL,
  p_qualite_visuelle TEXT DEFAULT 'conforme',
  p_notes TEXT DEFAULT NULL,
  p_photo_gravel_url TEXT DEFAULT NULL,
  p_photo_humidity_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_name TEXT;
  v_reception_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT role INTO v_user_role FROM user_roles_v2 WHERE user_id = v_user_id;
  
  IF v_user_role NOT IN ('ceo', 'superviseur', 'responsable_technique') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusée: Seul le Resp. Technique peut créer une entrée qualité');
  END IF;
  
  -- Gravel photo is mandatory
  IF p_photo_gravel_url IS NULL OR p_photo_gravel_url = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Photo du gravier obligatoire!');
  END IF;
  
  -- Humidity photo is mandatory
  IF p_photo_humidity_url IS NULL OR p_photo_humidity_url = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Photo du test humidité obligatoire!');
  END IF;
  
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;
  
  INSERT INTO stock_receptions_pending (
    materiau, quantite, fournisseur, numero_bl,
    photo_materiel_url, photo_bl_url, photo_gravel_url, photo_humidity_url,
    humidite_pct, qualite_visuelle, notes_qualite,
    qualite_approuvee_par, qualite_approuvee_at, statut, created_by
  ) VALUES (
    p_materiau, p_quantite, p_fournisseur, p_numero_bl,
    p_photo_materiel_url, p_photo_bl_url, p_photo_gravel_url, p_photo_humidity_url,
    p_humidite_pct, p_qualite_visuelle, p_notes,
    v_user_id, NOW(), 'approuve_qualite', v_user_id
  )
  RETURNING id INTO v_reception_id;
  
  INSERT INTO audit_superviseur (user_id, user_name, action, table_name, record_id, new_data)
  VALUES (v_user_id, v_user_name, 'CREATE_QUALITY_ENTRY', 'stock_receptions_pending', v_reception_id::TEXT,
    jsonb_build_object(
      'materiau', p_materiau, 
      'quantite', p_quantite, 
      'fournisseur', p_fournisseur,
      'gravel_photo', p_photo_gravel_url IS NOT NULL,
      'humidity_photo', p_photo_humidity_url IS NOT NULL
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Contrôle qualité validé ✅ - En attente validation Front Desk', 'id', v_reception_id);
END;
$$;