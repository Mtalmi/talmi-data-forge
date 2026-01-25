-- =============================================
-- Emergency BC Notifications - Detailed Data System
-- Version 1.0 - January 2026
-- =============================================

-- Create the emergency_bc_notifications table with comprehensive data fields
CREATE TABLE IF NOT EXISTS public.emergency_bc_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('PRODUCTION_TEAM', 'RESP_TECHNIQUE')),
  bc_id TEXT NOT NULL,
  bc_uuid UUID REFERENCES bons_commande(id),
  approval_id UUID REFERENCES emergency_bc_approvals(id),
  
  -- Recipient
  recipient_id UUID REFERENCES auth.users(id),
  recipient_role TEXT NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  
  -- Notification metadata
  severity TEXT NOT NULL DEFAULT 'URGENT' CHECK (severity IN ('INFO', 'WARNING', 'URGENT', 'CRITICAL')),
  
  -- Complete data payload (JSONB for flexibility)
  data_fields JSONB NOT NULL DEFAULT '{}',
  
  -- BC Information
  bc_status TEXT,
  bc_approved_by TEXT,
  bc_approved_by_role TEXT,
  bc_approved_at TIMESTAMPTZ,
  
  -- Material Details
  material_type TEXT,
  material_code TEXT,
  material_name TEXT,
  quantity NUMERIC,
  quantity_unit TEXT,
  quality_grade TEXT,
  
  -- Supplier Info
  supplier_id TEXT,
  supplier_name TEXT,
  supplier_contact TEXT,
  supplier_phone TEXT,
  supplier_email TEXT,
  
  -- Delivery Details
  delivery_address TEXT,
  delivery_date DATE,
  delivery_time_window TEXT,
  expected_arrival TIMESTAMPTZ,
  
  -- Emergency Context
  emergency_reason TEXT,
  emergency_trigger TEXT,
  production_impact TEXT,
  
  -- Status tracking
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  sent_via TEXT[], -- ['email', 'sms', 'in_app']
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_by_name TEXT,
  
  -- Action items completed
  action_items_completed JSONB DEFAULT '[]',
  
  -- For QC: Quality decision
  quality_decision TEXT CHECK (quality_decision IS NULL OR quality_decision IN ('APPROVE', 'APPROVE_WITH_NOTES', 'HOLD_FOR_RETEST', 'REJECT')),
  quality_decision_at TIMESTAMPTZ,
  quality_decision_by UUID REFERENCES auth.users(id),
  quality_decision_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ebn_bc_id ON emergency_bc_notifications(bc_id);
CREATE INDEX IF NOT EXISTS idx_ebn_recipient ON emergency_bc_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_ebn_type ON emergency_bc_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_ebn_created ON emergency_bc_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebn_unread ON emergency_bc_notifications(recipient_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_ebn_unacked ON emergency_bc_notifications(recipient_id, acknowledged) WHERE acknowledged = FALSE;

-- Enable RLS
ALTER TABLE emergency_bc_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON emergency_bc_notifications FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "CEO and Superviseur can view all notifications"
ON emergency_bc_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles_v2
    WHERE user_id = auth.uid()
    AND role IN ('ceo', 'superviseur')
  )
);

CREATE POLICY "System can insert notifications"
ON emergency_bc_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Recipients can update their notifications"
ON emergency_bc_notifications FOR UPDATE
USING (auth.uid() = recipient_id);

-- Function to generate comprehensive notification payload for Production Team
CREATE OR REPLACE FUNCTION generate_production_notification_payload(
  p_approval_id UUID,
  p_bc_id TEXT,
  p_bc_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval RECORD;
  v_bc RECORD;
  v_client RECORD;
  v_formule RECORD;
  v_payload JSONB;
BEGIN
  -- Get approval details
  SELECT * INTO v_approval
  FROM emergency_bc_approvals
  WHERE id = p_approval_id;
  
  -- Get BC details
  SELECT * INTO v_bc
  FROM bons_commande
  WHERE id = p_bc_uuid;
  
  -- Get client details
  SELECT * INTO v_client
  FROM clients
  WHERE client_id = v_bc.client_id;
  
  -- Get formule details
  SELECT * INTO v_formule
  FROM formules_theoriques
  WHERE formule_id = v_bc.formule_id;
  
  v_payload := jsonb_build_object(
    'notification_type', 'EMERGENCY_BC_APPROVED',
    'severity', 'URGENT',
    'timestamp', now(),
    
    -- BC Information
    'bc_id', p_bc_id,
    'bc_status', 'APPROVED',
    'bc_created_at', v_bc.created_at,
    'bc_approved_at', v_approval.approved_at,
    'bc_approved_by', v_approval.approved_by_name,
    'bc_approved_by_role', COALESCE((SELECT role FROM user_roles_v2 WHERE user_id = v_approval.approved_by), 'unknown'),
    
    -- Material Details
    'material_type', COALESCE(v_formule.type_beton, 'Béton'),
    'material_code', v_bc.formule_id,
    'material_name', COALESCE(v_formule.formule_id, 'Formule Standard'),
    'quantity', v_bc.volume_m3,
    'quantity_unit', 'm³',
    'quality_grade', COALESCE(v_formule.qualite_cible, 'Standard'),
    
    -- Client Information
    'client_name', COALESCE(v_client.nom, 'Client'),
    'client_phone', v_client.telephone,
    'client_email', v_client.email,
    
    -- Delivery Details
    'delivery_address', COALESCE(v_bc.adresse_livraison, 'Adresse non spécifiée'),
    'delivery_date', v_bc.date_livraison_souhaitee,
    'delivery_time_window', COALESCE(v_bc.heure_livraison_souhaitee, '08:00 - 18:00'),
    'delivery_urgency', 'SAME_DAY',
    
    -- Receiving Instructions
    'receiving_instructions', jsonb_build_object(
      'unloading_location', 'Zone de déchargement principale',
      'storage_location', 'Aire de stockage A',
      'receiving_contact', 'Hassan (Responsable Réception)',
      'special_handling', 'Vérifier conformité avant stockage',
      'documentation_required', jsonb_build_array('Bon de Livraison', 'Certificat Qualité', 'Facture'),
      'inspection_required', true,
      'inspection_by', 'Resp. Technique (Abdel Sadek)'
    ),
    
    -- Crew Coordination
    'crew_alert', jsonb_build_object(
      'alert_crew', true,
      'crew_leader', 'Chef d''équipe',
      'crew_size_needed', 3,
      'estimated_unloading_time_minutes', 30,
      'equipment_needed', jsonb_build_array('Chariot élévateur', 'Transpalette')
    ),
    
    -- Quality Check Coordination
    'quality_check_required', true,
    'quality_check_by', 'Abdel Sadek',
    'quality_check_by_role', 'TECH_VALIDATOR',
    'quality_check_instructions', 'Inspection complète requise - vérifier humidité, densité et intégrité',
    
    -- Emergency Context
    'emergency_reason', v_approval.emergency_reason,
    'emergency_trigger', v_approval.emergency_condition,
    'production_impact', 'Livraison urgente - Production affectée',
    
    -- Action Items
    'action_items', jsonb_build_array(
      jsonb_build_object(
        'action_id', 1,
        'action', 'Préparer zone de réception',
        'assigned_to', 'Hassan',
        'status', 'PENDING'
      ),
      jsonb_build_object(
        'action_id', 2,
        'action', 'Alerter équipe pour déchargement',
        'assigned_to', 'Chef d''équipe',
        'status', 'PENDING'
      ),
      jsonb_build_object(
        'action_id', 3,
        'action', 'Coordonner avec Resp. Technique pour contrôle qualité',
        'assigned_to', 'Hassan',
        'status', 'PENDING'
      ),
      jsonb_build_object(
        'action_id', 4,
        'action', 'Préparer documentation réception',
        'assigned_to', 'Admin',
        'status', 'PENDING'
      )
    ),
    
    -- Escalation Contact
    'escalation_contact', 'Karim',
    'escalation_contact_role', 'RESP_OPERATIONS',
    
    -- Notification channels
    'notification_channel', jsonb_build_array('email', 'in_app')
  );
  
  RETURN v_payload;
END;
$$;

-- Function to generate comprehensive notification payload for Resp. Technique
CREATE OR REPLACE FUNCTION generate_qc_notification_payload(
  p_approval_id UUID,
  p_bc_id TEXT,
  p_bc_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval RECORD;
  v_bc RECORD;
  v_formule RECORD;
  v_payload JSONB;
BEGIN
  -- Get approval details
  SELECT * INTO v_approval
  FROM emergency_bc_approvals
  WHERE id = p_approval_id;
  
  -- Get BC details
  SELECT * INTO v_bc
  FROM bons_commande
  WHERE id = p_bc_uuid;
  
  -- Get formule details
  SELECT * INTO v_formule
  FROM formules_theoriques
  WHERE formule_id = v_bc.formule_id;
  
  v_payload := jsonb_build_object(
    'notification_type', 'EMERGENCY_BC_APPROVED_QC_ALERT',
    'severity', 'URGENT',
    'timestamp', now(),
    
    -- BC Information
    'bc_id', p_bc_id,
    'bc_status', 'APPROVED',
    'bc_approved_at', v_approval.approved_at,
    'bc_approved_by', v_approval.approved_by_name,
    
    -- Material Specifications
    'material_type', COALESCE(v_formule.type_beton, 'Béton'),
    'material_code', v_bc.formule_id,
    'material_name', COALESCE(v_formule.formule_id, 'Formule Standard'),
    'quantity', v_bc.volume_m3,
    'quantity_unit', 'm³',
    'quality_grade', COALESCE(v_formule.qualite_cible, 'Standard'),
    
    -- Delivery Details
    'delivery_date', v_bc.date_livraison_souhaitee,
    'delivery_time_window', COALESCE(v_bc.heure_livraison_souhaitee, '08:00 - 18:00'),
    
    -- Quality Requirements
    'quality_requirements', jsonb_build_object(
      'material_type', COALESCE(v_formule.type_beton, 'Béton'),
      'standard', 'NM 10.1.001',
      'specifications', jsonb_build_object(
        'ciment_kg_m3', jsonb_build_object(
          'value', v_formule.ciment_kg_m3,
          'tolerance', '±5%'
        ),
        'eau_l_m3', jsonb_build_object(
          'value', v_formule.eau_l_m3,
          'tolerance', '±3%'
        ),
        'affaissement_min_mm', v_formule.affaissement_min_mm,
        'affaissement_max_mm', v_formule.affaissement_max_mm,
        'resistance_cible_mpa', v_formule.resistance_cible_mpa
      )
    ),
    
    -- Quality Check Instructions
    'quality_check_instructions', jsonb_build_object(
      'inspection_type', 'FULL_INSPECTION',
      'inspection_level', 'CRITICAL',
      'inspection_urgency', 'IMMEDIATE_UPON_ARRIVAL',
      'checks_required', jsonb_build_array(
        jsonb_build_object(
          'check_id', 1,
          'check_name', 'Inspection Visuelle',
          'description', 'Vérifier absence de contamination et intégrité emballage',
          'method', 'Visuel',
          'pass_criteria', 'Aucun défaut visible',
          'estimated_time_minutes', 10
        ),
        jsonb_build_object(
          'check_id', 2,
          'check_name', 'Test Affaissement',
          'description', 'Mesurer affaissement au cône d''Abrams',
          'method', 'Cône Abrams',
          'pass_criteria', format('%s - %s mm', v_formule.affaissement_min_mm, v_formule.affaissement_max_mm),
          'estimated_time_minutes', 15
        ),
        jsonb_build_object(
          'check_id', 3,
          'check_name', 'Vérification Documentation',
          'description', 'Vérifier tous les certificats et documents',
          'method', 'Revue documentaire',
          'pass_criteria', 'Tous documents présents et valides',
          'estimated_time_minutes', 10
        ),
        jsonb_build_object(
          'check_id', 4,
          'check_name', 'Photo Preuve',
          'description', 'Prendre photos horodatées de la livraison',
          'method', 'Photo numérique',
          'pass_criteria', 'Photos claires avec timestamp visible',
          'estimated_time_minutes', 5
        )
      ),
      'total_estimated_inspection_time_minutes', 40,
      'inspection_location', 'Zone de contrôle qualité',
      'sample_size', 'Selon protocole standard'
    ),
    
    -- Documentation Required
    'documentation_required', jsonb_build_array(
      jsonb_build_object('doc_name', 'Bon de Livraison', 'required', true),
      jsonb_build_object('doc_name', 'Certificat Qualité Fournisseur', 'required', true),
      jsonb_build_object('doc_name', 'Facture', 'required', true),
      jsonb_build_object('doc_name', 'Certificat de Lot', 'required', false)
    ),
    
    -- Decision Options
    'decision_options', jsonb_build_array(
      jsonb_build_object(
        'decision', 'APPROVE',
        'description', 'Matériau conforme - libérer pour production',
        'notification_to', jsonb_build_array('Production', 'Karim', 'Max')
      ),
      jsonb_build_object(
        'decision', 'APPROVE_WITH_NOTES',
        'description', 'Acceptable avec notes mineures',
        'notification_to', jsonb_build_array('Production', 'Karim', 'Max')
      ),
      jsonb_build_object(
        'decision', 'HOLD_FOR_RETEST',
        'description', 'Retest nécessaire - en attente',
        'notification_to', jsonb_build_array('Production', 'Karim', 'Max')
      ),
      jsonb_build_object(
        'decision', 'REJECT',
        'description', 'Non conforme - retour fournisseur',
        'notification_to', jsonb_build_array('Production', 'Karim', 'Max', 'Fournisseur')
      )
    ),
    
    -- Emergency Context
    'emergency_reason', v_approval.emergency_reason,
    'emergency_trigger', v_approval.emergency_condition,
    'production_impact', 'Contrôle qualité urgent requis',
    'time_pressure', 'Contrôle qualité doit être terminé sous 45 minutes',
    
    -- Contact Information
    'receiving_contact', 'Hassan (Responsable Réception)',
    'escalation_contact', 'Karim',
    
    -- Notification channels
    'notification_channel', jsonb_build_array('email', 'in_app')
  );
  
  RETURN v_payload;
END;
$$;

-- Function to create and store notifications
CREATE OR REPLACE FUNCTION create_emergency_bc_notifications(
  p_approval_id UUID
)
RETURNS TABLE(production_notification_id UUID, qc_notification_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval RECORD;
  v_prod_notif_id UUID;
  v_qc_notif_id UUID;
  v_prod_payload JSONB;
  v_qc_payload JSONB;
  v_prod_recipient UUID;
  v_qc_recipient UUID;
  v_timestamp TEXT;
BEGIN
  -- Get approval record
  SELECT * INTO v_approval
  FROM emergency_bc_approvals
  WHERE id = p_approval_id
  AND status = 'APPROVED';
  
  IF v_approval IS NULL THEN
    RAISE EXCEPTION 'Approval not found or not approved';
  END IF;
  
  v_timestamp := to_char(now(), 'YYYYMMDD_HH24MISS');
  
  -- Generate payloads
  v_prod_payload := generate_production_notification_payload(p_approval_id, v_approval.bc_id, v_approval.bc_uuid);
  v_qc_payload := generate_qc_notification_payload(p_approval_id, v_approval.bc_id, v_approval.bc_uuid);
  
  -- Find production team recipient (centraliste role)
  SELECT user_id INTO v_prod_recipient
  FROM user_roles_v2
  WHERE role = 'centraliste'
  LIMIT 1;
  
  -- Find QC recipient (responsable_technique role)
  SELECT user_id INTO v_qc_recipient
  FROM user_roles_v2
  WHERE role IN ('responsable_technique', 'superviseur')
  LIMIT 1;
  
  -- Create Production Team notification
  INSERT INTO emergency_bc_notifications (
    notification_id,
    notification_type,
    bc_id,
    bc_uuid,
    approval_id,
    recipient_id,
    recipient_role,
    recipient_name,
    severity,
    data_fields,
    bc_status,
    bc_approved_by,
    bc_approved_at,
    material_type,
    material_code,
    quantity,
    quantity_unit,
    delivery_date,
    emergency_reason,
    emergency_trigger,
    production_impact,
    sent_via
  )
  VALUES (
    'NOTIF_PROD_' || v_timestamp,
    'PRODUCTION_TEAM',
    v_approval.bc_id,
    v_approval.bc_uuid,
    p_approval_id,
    v_prod_recipient,
    'centraliste',
    (SELECT full_name FROM profiles WHERE id = v_prod_recipient),
    'URGENT',
    v_prod_payload,
    'APPROVED',
    v_approval.approved_by_name,
    v_approval.approved_at,
    v_prod_payload->>'material_type',
    v_prod_payload->>'material_code',
    (v_prod_payload->>'quantity')::NUMERIC,
    v_prod_payload->>'quantity_unit',
    v_approval.delivery_date,
    v_approval.emergency_reason,
    v_approval.emergency_condition,
    'Livraison urgente - Préparer réception',
    ARRAY['in_app']
  )
  RETURNING id INTO v_prod_notif_id;
  
  -- Create QC notification
  INSERT INTO emergency_bc_notifications (
    notification_id,
    notification_type,
    bc_id,
    bc_uuid,
    approval_id,
    recipient_id,
    recipient_role,
    recipient_name,
    severity,
    data_fields,
    bc_status,
    bc_approved_by,
    bc_approved_at,
    material_type,
    material_code,
    quantity,
    quantity_unit,
    delivery_date,
    emergency_reason,
    emergency_trigger,
    production_impact,
    sent_via
  )
  VALUES (
    'NOTIF_QC_' || v_timestamp,
    'RESP_TECHNIQUE',
    v_approval.bc_id,
    v_approval.bc_uuid,
    p_approval_id,
    v_qc_recipient,
    'responsable_technique',
    (SELECT full_name FROM profiles WHERE id = v_qc_recipient),
    'URGENT',
    v_qc_payload,
    'APPROVED',
    v_approval.approved_by_name,
    v_approval.approved_at,
    v_qc_payload->>'material_type',
    v_qc_payload->>'material_code',
    (v_qc_payload->>'quantity')::NUMERIC,
    v_qc_payload->>'quantity_unit',
    v_approval.delivery_date,
    v_approval.emergency_reason,
    v_approval.emergency_condition,
    'Contrôle qualité urgent requis',
    ARRAY['in_app']
  )
  RETURNING id INTO v_qc_notif_id;
  
  RETURN QUERY SELECT v_prod_notif_id, v_qc_notif_id;
END;
$$;

-- Function to acknowledge a notification
CREATE OR REPLACE FUNCTION acknowledge_emergency_notification(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;
  
  UPDATE emergency_bc_notifications
  SET acknowledged = TRUE,
      acknowledged_at = now(),
      acknowledged_by = v_user_id,
      acknowledged_by_name = v_user_name,
      read = TRUE,
      read_at = COALESCE(read_at, now()),
      updated_at = now()
  WHERE id = p_notification_id
  AND (recipient_id = v_user_id OR EXISTS (
    SELECT 1 FROM user_roles_v2
    WHERE user_id = v_user_id AND role IN ('ceo', 'superviseur')
  ));
  
  RETURN FOUND;
END;
$$;

-- Function for QC to submit quality decision
CREATE OR REPLACE FUNCTION submit_emergency_quality_decision(
  p_notification_id UUID,
  p_decision TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_notification RECORD;
BEGIN
  v_user_id := auth.uid();
  
  -- Check role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles_v2
    WHERE user_id = v_user_id
    AND role IN ('ceo', 'superviseur', 'responsable_technique')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only Resp. Technique, Superviseur or CEO can submit quality decisions';
  END IF;
  
  -- Validate decision
  IF p_decision NOT IN ('APPROVE', 'APPROVE_WITH_NOTES', 'HOLD_FOR_RETEST', 'REJECT') THEN
    RAISE EXCEPTION 'Invalid decision: must be APPROVE, APPROVE_WITH_NOTES, HOLD_FOR_RETEST, or REJECT';
  END IF;
  
  -- Get notification
  SELECT * INTO v_notification
  FROM emergency_bc_notifications
  WHERE id = p_notification_id
  AND notification_type = 'RESP_TECHNIQUE';
  
  IF v_notification IS NULL THEN
    RAISE EXCEPTION 'QC notification not found';
  END IF;
  
  IF v_notification.quality_decision IS NOT NULL THEN
    RAISE EXCEPTION 'Quality decision already submitted';
  END IF;
  
  -- Update notification
  UPDATE emergency_bc_notifications
  SET quality_decision = p_decision,
      quality_decision_at = now(),
      quality_decision_by = v_user_id,
      quality_decision_notes = p_notes,
      acknowledged = TRUE,
      acknowledged_at = COALESCE(acknowledged_at, now()),
      acknowledged_by = v_user_id,
      updated_at = now()
  WHERE id = p_notification_id;
  
  -- Create alert based on decision
  INSERT INTO alertes_systeme (
    type_alerte,
    niveau,
    titre,
    message,
    destinataire_role,
    reference_id,
    reference_table
  )
  VALUES (
    'emergency_bc_qc_result',
    CASE 
      WHEN p_decision = 'REJECT' THEN 'critical'
      WHEN p_decision = 'HOLD_FOR_RETEST' THEN 'warning'
      ELSE 'info'
    END,
    format('🔬 Résultat Contrôle Qualité: %s', v_notification.bc_id),
    format('Décision: %s. %s', p_decision, COALESCE(p_notes, '')),
    'ceo',
    v_notification.bc_id,
    'emergency_bc_notifications'
  );
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_production_notification_payload TO authenticated;
GRANT EXECUTE ON FUNCTION generate_qc_notification_payload TO authenticated;
GRANT EXECUTE ON FUNCTION create_emergency_bc_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION acknowledge_emergency_notification TO authenticated;
GRANT EXECUTE ON FUNCTION submit_emergency_quality_decision TO authenticated;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_bc_notifications;