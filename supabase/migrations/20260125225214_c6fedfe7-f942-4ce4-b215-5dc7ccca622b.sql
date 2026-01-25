-- =====================================================
-- EMERGENCY BC CONDITIONS SYSTEM
-- Implements Tight Times + After 18h Same-Day Delivery
-- =====================================================

-- 1. Create ENUM for tight times trigger types
CREATE TYPE tight_times_trigger_type AS ENUM (
  'STOCK_CRITICAL',
  'ORDER_SURGE',
  'EQUIPMENT_BREAKDOWN',
  'SUPPLIER_FAILURE',
  'QUALITY_ISSUE',
  'MANUAL'
);

-- 2. Create tight_times_status table
CREATE TABLE public.tight_times_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'INACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  reason TEXT NOT NULL,
  triggered_by tight_times_trigger_type NOT NULL,
  activated_by UUID NOT NULL REFERENCES auth.users(id),
  activated_by_name TEXT,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  affected_materials TEXT[],
  notes TEXT,
  deactivated_by UUID REFERENCES auth.users(id),
  deactivated_by_name TEXT,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX idx_tight_times_status ON tight_times_status(status);
CREATE INDEX idx_tight_times_expires_at ON tight_times_status(expires_at);
CREATE INDEX idx_tight_times_activated_at ON tight_times_status(activated_at);

-- 4. Enable RLS
ALTER TABLE tight_times_status ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - CEO and Superviseur can manage, others read
CREATE POLICY "CEO and Superviseur can manage tight times" 
  ON tight_times_status FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_id = auth.uid() 
      AND role IN ('ceo', 'superviseur', 'responsable_technique')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_id = auth.uid() 
      AND role IN ('ceo', 'superviseur')
    )
  );

CREATE POLICY "Authenticated users can view tight times status"
  ON tight_times_status FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 6. Create emergency_bc_approvals table for tracking approval workflow
CREATE TABLE public.emergency_bc_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bc_id TEXT NOT NULL,
  bc_uuid UUID REFERENCES bons_commande(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_by_name TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  approval_timeout_minutes INTEGER NOT NULL DEFAULT 30,
  emergency_condition TEXT NOT NULL CHECK (emergency_condition IN ('AFTER_18H_SAME_DAY', 'TIGHT_TIMES')),
  emergency_reason TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  approved_by UUID REFERENCES auth.users(id),
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  notified_production BOOLEAN DEFAULT FALSE,
  notified_production_at TIMESTAMPTZ,
  notified_resp_technique BOOLEAN DEFAULT FALSE,
  notified_resp_technique_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create indexes for emergency_bc_approvals
CREATE INDEX idx_emergency_bc_status ON emergency_bc_approvals(status);
CREATE INDEX idx_emergency_bc_expires_at ON emergency_bc_approvals(expires_at);
CREATE INDEX idx_emergency_bc_requested_by ON emergency_bc_approvals(requested_by);
CREATE INDEX idx_emergency_bc_bc_id ON emergency_bc_approvals(bc_id);

-- 8. Enable RLS
ALTER TABLE emergency_bc_approvals ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Users can view their own emergency BC requests"
  ON emergency_bc_approvals FOR SELECT
  USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_id = auth.uid() 
      AND role IN ('ceo', 'superviseur', 'responsable_technique', 'agent_administratif')
    )
  );

CREATE POLICY "Directeur Ops can create emergency BC requests"
  ON emergency_bc_approvals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_id = auth.uid() 
      AND role IN ('ceo', 'superviseur', 'directeur_operations')
    )
  );

CREATE POLICY "CEO and Superviseur can update emergency BC approvals"
  ON emergency_bc_approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2 
      WHERE user_id = auth.uid() 
      AND role IN ('ceo', 'superviseur')
    )
  );

-- 10. Function to check if tight times is currently active
CREATE OR REPLACE FUNCTION is_tight_times_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tight_times_status
    WHERE status = 'ACTIVE'
    AND expires_at > now()
  );
$$;

-- 11. Function to get current tight times details
CREATE OR REPLACE FUNCTION get_active_tight_times()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'id', id,
        'status', status,
        'reason', reason,
        'triggered_by', triggered_by,
        'activated_by_name', activated_by_name,
        'activated_at', activated_at,
        'expires_at', expires_at,
        'duration_minutes', duration_minutes,
        'affected_materials', affected_materials,
        'remaining_minutes', EXTRACT(EPOCH FROM (expires_at - now())) / 60
      )
      FROM tight_times_status
      WHERE status = 'ACTIVE'
      AND expires_at > now()
      ORDER BY activated_at DESC
      LIMIT 1
    ),
    '{}'::jsonb
  );
$$;

-- 12. Function to activate tight times (CEO/Superviseur only)
CREATE OR REPLACE FUNCTION activate_tight_times(
  p_reason TEXT,
  p_triggered_by tight_times_trigger_type,
  p_duration_minutes INTEGER DEFAULT 120,
  p_affected_materials TEXT[] DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
  v_tight_times_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check role
  SELECT role INTO v_user_role
  FROM user_roles_v2
  WHERE user_id = v_user_id;
  
  IF v_user_role NOT IN ('ceo', 'superviseur') THEN
    RAISE EXCEPTION 'Only CEO or Superviseur can activate tight times';
  END IF;
  
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;
  
  -- Deactivate any existing active tight times
  UPDATE tight_times_status
  SET status = 'INACTIVE',
      deactivated_by = v_user_id,
      deactivated_by_name = v_user_name,
      deactivated_at = now()
  WHERE status = 'ACTIVE';
  
  -- Create new tight times
  INSERT INTO tight_times_status (
    status, reason, triggered_by, activated_by, activated_by_name,
    expires_at, duration_minutes, affected_materials, notes
  )
  VALUES (
    'ACTIVE', p_reason, p_triggered_by, v_user_id, v_user_name,
    now() + (p_duration_minutes || ' minutes')::interval,
    p_duration_minutes, p_affected_materials, p_notes
  )
  RETURNING id INTO v_tight_times_id;
  
  -- Create audit log entry
  INSERT INTO audit_superviseur (
    table_name, action, record_id, user_id, user_name,
    new_data
  )
  VALUES (
    'tight_times_status', 'INSERT', v_tight_times_id::text, v_user_id, v_user_name,
    jsonb_build_object(
      'reason', p_reason,
      'triggered_by', p_triggered_by,
      'duration_minutes', p_duration_minutes,
      'affected_materials', p_affected_materials
    )
  );
  
  -- Create system alert
  INSERT INTO alertes_systeme (
    type_alerte, niveau, titre, message,
    destinataire_role, dismissible
  )
  VALUES (
    'tight_times_activated', 'warning',
    '⚠️ Mode TIGHT TIMES Activé',
    format('Activé par %s. Raison: %s. Durée: %s minutes.', v_user_name, p_reason, p_duration_minutes),
    'ceo', false
  );
  
  RETURN v_tight_times_id;
END;
$$;

-- 13. Function to deactivate tight times
CREATE OR REPLACE FUNCTION deactivate_tight_times()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT role INTO v_user_role
  FROM user_roles_v2
  WHERE user_id = v_user_id;
  
  IF v_user_role NOT IN ('ceo', 'superviseur') THEN
    RAISE EXCEPTION 'Only CEO or Superviseur can deactivate tight times';
  END IF;
  
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;
  
  UPDATE tight_times_status
  SET status = 'INACTIVE',
      deactivated_by = v_user_id,
      deactivated_by_name = v_user_name,
      deactivated_at = now()
  WHERE status = 'ACTIVE';
  
  RETURN TRUE;
END;
$$;

-- 14. Function to check emergency BC eligibility
CREATE OR REPLACE FUNCTION check_emergency_bc_eligibility(p_delivery_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_hour INTEGER;
  v_current_date DATE;
  v_is_after_18h BOOLEAN;
  v_is_same_day BOOLEAN;
  v_condition_1_met BOOLEAN;
  v_condition_2_met BOOLEAN;
  v_tight_times JSONB;
  v_condition_met TEXT;
  v_reason TEXT;
BEGIN
  -- Get current time in Casablanca timezone
  v_current_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Africa/Casablanca'));
  v_current_date := (now() AT TIME ZONE 'Africa/Casablanca')::date;
  
  -- Condition 1: After 18h for same-day delivery
  v_is_after_18h := v_current_hour >= 18;
  v_is_same_day := v_current_date = p_delivery_date;
  v_condition_1_met := v_is_after_18h AND v_is_same_day;
  
  -- Condition 2: Tight times active
  v_condition_2_met := is_tight_times_active();
  v_tight_times := get_active_tight_times();
  
  -- Determine which condition was met
  IF v_condition_1_met THEN
    v_condition_met := 'AFTER_18H_SAME_DAY';
    v_reason := format('Heure actuelle: %s:00, livraison prévue aujourd''hui', v_current_hour);
  ELSIF v_condition_2_met THEN
    v_condition_met := 'TIGHT_TIMES';
    v_reason := v_tight_times->>'reason';
  ELSE
    v_condition_met := NULL;
    v_reason := NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'can_create_emergency_bc', v_condition_1_met OR v_condition_2_met,
    'condition_met', v_condition_met,
    'reason', v_reason,
    'current_hour', v_current_hour,
    'current_date', v_current_date,
    'delivery_date', p_delivery_date,
    'is_after_18h', v_is_after_18h,
    'is_same_day', v_is_same_day,
    'tight_times_active', v_condition_2_met,
    'tight_times_details', v_tight_times,
    'approval_required', TRUE,
    'approval_timeout_minutes', 30
  );
END;
$$;

-- 15. Function to create emergency BC approval request
CREATE OR REPLACE FUNCTION create_emergency_bc_approval(
  p_bc_id TEXT,
  p_bc_uuid UUID,
  p_delivery_date DATE,
  p_emergency_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_eligibility JSONB;
  v_approval_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;
  
  -- Check eligibility
  v_eligibility := check_emergency_bc_eligibility(p_delivery_date);
  
  IF NOT (v_eligibility->>'can_create_emergency_bc')::boolean THEN
    RAISE EXCEPTION 'Emergency BC not allowed: conditions not met';
  END IF;
  
  -- Create approval request
  INSERT INTO emergency_bc_approvals (
    bc_id, bc_uuid, requested_by, requested_by_name,
    expires_at, emergency_condition, emergency_reason, delivery_date
  )
  VALUES (
    p_bc_id, p_bc_uuid, v_user_id, v_user_name,
    now() + interval '30 minutes',
    v_eligibility->>'condition_met',
    p_emergency_reason,
    p_delivery_date
  )
  RETURNING id INTO v_approval_id;
  
  -- Create alert for CEO
  INSERT INTO alertes_systeme (
    type_alerte, niveau, titre, message,
    destinataire_role, reference_id, reference_table, dismissible
  )
  VALUES (
    'emergency_bc_approval_request', 'critical',
    format('🚨 Approbation BC Urgence: %s', p_bc_id),
    format('Demande de %s. Raison: %s. Expire dans 30 minutes.', v_user_name, p_emergency_reason),
    'ceo', p_bc_id, 'bons_commande', false
  );
  
  -- Create alert for Superviseur
  INSERT INTO alertes_systeme (
    type_alerte, niveau, titre, message,
    destinataire_role, reference_id, reference_table, dismissible
  )
  VALUES (
    'emergency_bc_approval_request', 'critical',
    format('🚨 Approbation BC Urgence: %s', p_bc_id),
    format('Demande de %s. Raison: %s. Expire dans 30 minutes.', v_user_name, p_emergency_reason),
    'superviseur', p_bc_id, 'bons_commande', false
  );
  
  RETURN v_approval_id;
END;
$$;

-- 16. Function to approve/reject emergency BC
CREATE OR REPLACE FUNCTION process_emergency_bc_approval(
  p_approval_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
  v_approval RECORD;
BEGIN
  v_user_id := auth.uid();
  
  -- Check role
  SELECT role INTO v_user_role
  FROM user_roles_v2
  WHERE user_id = v_user_id;
  
  IF v_user_role NOT IN ('ceo', 'superviseur') THEN
    RAISE EXCEPTION 'Only CEO or Superviseur can approve emergency BCs';
  END IF;
  
  -- Get approval record
  SELECT * INTO v_approval
  FROM emergency_bc_approvals
  WHERE id = p_approval_id;
  
  IF v_approval IS NULL THEN
    RAISE EXCEPTION 'Approval request not found';
  END IF;
  
  IF v_approval.status != 'PENDING' THEN
    RAISE EXCEPTION 'Approval already processed';
  END IF;
  
  IF v_approval.expires_at < now() THEN
    -- Auto-expire
    UPDATE emergency_bc_approvals
    SET status = 'EXPIRED'
    WHERE id = p_approval_id;
    RAISE EXCEPTION 'Approval request has expired';
  END IF;
  
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;
  
  -- Update approval
  UPDATE emergency_bc_approvals
  SET status = CASE WHEN p_action = 'APPROVE' THEN 'APPROVED' ELSE 'REJECTED' END,
      approved_by = v_user_id,
      approved_by_name = v_user_name,
      approved_at = now(),
      approval_notes = p_notes
  WHERE id = p_approval_id;
  
  IF p_action = 'APPROVE' THEN
    -- Update BC status to pret_production
    UPDATE bons_commande
    SET statut = 'pret_production',
        validated_by = v_user_id,
        validated_at = now(),
        validated_by_name = v_user_name,
        validated_by_role = v_user_role
    WHERE id = v_approval.bc_uuid;
    
    -- Mark notifications sent
    UPDATE emergency_bc_approvals
    SET notified_production = TRUE,
        notified_production_at = now(),
        notified_resp_technique = TRUE,
        notified_resp_technique_at = now()
    WHERE id = p_approval_id;
    
    -- Create notification for production team
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message,
      destinataire_role, reference_id, reference_table
    )
    VALUES (
      'emergency_bc_approved', 'warning',
      format('🚚 BC Urgence Approuvé: %s', v_approval.bc_id),
      'Matériaux en cours de commande. Préparez la réception.',
      'centraliste', v_approval.bc_id, 'bons_commande'
    );
    
    -- Create notification for Resp. Technique
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message,
      destinataire_role, reference_id, reference_table
    )
    VALUES (
      'emergency_bc_quality_check', 'warning',
      format('🔬 Contrôle Qualité Requis: %s', v_approval.bc_id),
      'BC urgence approuvé. Préparez le contrôle qualité pour les matériaux.',
      'responsable_technique', v_approval.bc_id, 'bons_commande'
    );
    
    -- Notify requester
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message,
      reference_id, reference_table
    )
    VALUES (
      'emergency_bc_result', 'info',
      format('✅ BC Urgence Approuvé: %s', v_approval.bc_id),
      format('Votre demande a été approuvée par %s.', v_user_name),
      v_approval.bc_id, 'bons_commande'
    );
  ELSE
    -- Update BC status to refused
    UPDATE bons_commande
    SET statut = 'refuse',
        notes = format('[URGENCE REFUSÉE] %s%s', COALESCE(p_notes, 'Aucune raison spécifiée'), E'\n\n' || COALESCE(notes, ''))
    WHERE id = v_approval.bc_uuid;
    
    -- Notify requester
    INSERT INTO alertes_systeme (
      type_alerte, niveau, titre, message,
      reference_id, reference_table
    )
    VALUES (
      'emergency_bc_result', 'warning',
      format('❌ BC Urgence Refusé: %s', v_approval.bc_id),
      format('Votre demande a été refusée par %s. Raison: %s', v_user_name, COALESCE(p_notes, 'Non spécifiée')),
      v_approval.bc_id, 'bons_commande'
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 17. Function to check stock criticality (for auto-detecting tight times triggers)
CREATE OR REPLACE FUNCTION check_stock_criticality()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_critical_stocks JSONB;
  v_any_critical BOOLEAN := FALSE;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'materiau', s.materiau,
      'quantite_actuelle', s.quantite_actuelle,
      'seuil_alerte', s.seuil_alerte,
      'unite', s.unite,
      'avg_daily_consumption', COALESCE(c.avg_daily, 0),
      'days_remaining', CASE 
        WHEN COALESCE(c.avg_daily, 0) > 0 
        THEN s.quantite_actuelle / c.avg_daily 
        ELSE 999 
      END,
      'is_critical', CASE 
        WHEN COALESCE(c.avg_daily, 0) > 0 
        THEN (s.quantite_actuelle / c.avg_daily) < 2 
        ELSE FALSE 
      END
    )
  )
  INTO v_critical_stocks
  FROM stocks s
  LEFT JOIN LATERAL (
    SELECT materiau, 
           SUM(quantite) / 7.0 as avg_daily
    FROM mouvements_stock
    WHERE type_mouvement = 'consommation'
    AND created_at > now() - interval '7 days'
    AND materiau = s.materiau
    GROUP BY materiau
  ) c ON TRUE
  WHERE s.quantite_actuelle <= s.seuil_alerte * 1.5;
  
  -- Check if any stock is below 2 days
  SELECT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(v_critical_stocks) elem
    WHERE (elem->>'is_critical')::boolean = TRUE
  ) INTO v_any_critical;
  
  RETURN jsonb_build_object(
    'has_critical_stocks', v_any_critical,
    'critical_stocks', COALESCE(v_critical_stocks, '[]'::jsonb)
  );
END;
$$;

-- 18. Enable realtime for tight_times_status
ALTER PUBLICATION supabase_realtime ADD TABLE tight_times_status;
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_bc_approvals;