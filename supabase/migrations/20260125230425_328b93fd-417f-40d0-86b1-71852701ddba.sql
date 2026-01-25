
-- Create escalation contacts table
CREATE TABLE public.escalation_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INT NOT NULL,
  role VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  availability VARCHAR(50) DEFAULT '24/7',
  response_time_sla_minutes INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create emergency BC action items table
CREATE TABLE public.emergency_bc_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.emergency_bc_notifications(id) ON DELETE CASCADE,
  bc_id VARCHAR(50) NOT NULL,
  action_code VARCHAR(50) NOT NULL,
  action_name VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- SYSTEM_INTERACTION, COMMUNICATION, PHYSICAL_PREPARATION, CREW_COORDINATION, MONITORING, COORDINATION, DOCUMENTATION, SYSTEM_UPDATE
  phase INT NOT NULL, -- 1-5 representing the phases
  phase_name VARCHAR(100) NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  assigned_to_role VARCHAR(100) NOT NULL,
  assigned_to_phone VARCHAR(50),
  assigned_to_email VARCHAR(255),
  deadline_minutes INT NOT NULL,
  deadline_at TIMESTAMPTZ,
  priority VARCHAR(20) NOT NULL DEFAULT 'HIGH', -- CRITICAL, HIGH, MEDIUM
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, ESCALATED, FAILED
  steps JSONB DEFAULT '[]'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  success_criteria JSONB DEFAULT '[]'::jsonb,
  escalation_after_minutes INT,
  escalate_to VARCHAR(100),
  escalate_to_phone VARCHAR(50),
  escalate_to_email VARCHAR(255),
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  escalated_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  completed_by_name VARCHAR(255),
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create action item status history for audit trail
CREATE TABLE public.emergency_bc_action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID REFERENCES public.emergency_bc_action_items(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID,
  changed_by_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escalation_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_bc_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_bc_action_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for escalation_contacts (read by authenticated, write by admins)
CREATE POLICY "Authenticated users can view escalation contacts"
  ON public.escalation_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage escalation contacts"
  ON public.escalation_contacts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personnel_registry pr
      WHERE pr.user_id = auth.uid()
      AND pr.role_code IN ('CEO', 'SUPERVISEUR')
    )
  );

-- RLS policies for action items
CREATE POLICY "Authenticated users can view action items"
  ON public.emergency_bc_action_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update action items"
  ON public.emergency_bc_action_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "System can insert action items"
  ON public.emergency_bc_action_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS policies for action history
CREATE POLICY "Authenticated users can view action history"
  ON public.emergency_bc_action_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert action history"
  ON public.emergency_bc_action_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default escalation contacts
INSERT INTO public.escalation_contacts (level, role, name, phone, email, whatsapp, response_time_sla_minutes) VALUES
  (1, 'WAREHOUSE_MANAGER', 'Hassan', '+212 5XX XXX XXX', 'hassan@tbos.ma', '+212 5XX XXX XXX', 5),
  (2, 'CREW_LEADER', 'Mohamed', '+212 5XX XXX XXX', 'mohamed@tbos.ma', '+212 5XX XXX XXX', 5),
  (3, 'SUPERVISEUR', 'Karim', '+212 5XX XXX XXX', 'karim@tbos.ma', '+212 5XX XXX XXX', 3),
  (4, 'CEO', 'Max', '+212 5XX XXX XXX', 'max@tbos.ma', '+212 5XX XXX XXX', 2);

-- Function to create action items for emergency BC notification
CREATE OR REPLACE FUNCTION public.create_emergency_bc_action_items(
  p_notification_id UUID,
  p_bc_id TEXT,
  p_base_time TIMESTAMPTZ DEFAULT now()
)
RETURNS SETOF public.emergency_bc_action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action RECORD;
  v_actions JSONB;
BEGIN
  -- Define all 13 action items
  v_actions := '[
    {
      "action_code": "PROD_ACTION_001",
      "action_name": "Acknowledge Notification",
      "action_type": "SYSTEM_INTERACTION",
      "phase": 1,
      "phase_name": "IMMEDIATE ALERT & PREPARATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 2,
      "priority": "CRITICAL",
      "escalation_after_minutes": 5,
      "escalate_to": "Karim",
      "steps": ["Receive notification", "Open notification details", "Click ACKNOWLEDGE button", "Confirm acknowledgment"],
      "success_criteria": ["Notification marked as acknowledged", "Timestamp recorded", "Visible to supervisors"]
    },
    {
      "action_code": "PROD_ACTION_002",
      "action_name": "Notify Crew Leader",
      "action_type": "COMMUNICATION",
      "phase": 1,
      "phase_name": "IMMEDIATE ALERT & PREPARATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 3,
      "priority": "CRITICAL",
      "escalation_after_minutes": 6,
      "escalate_to": "Karim",
      "steps": ["Call Mohamed directly", "Confirm receipt", "Send SMS with BC details", "Send WhatsApp notification"],
      "success_criteria": ["Mohamed confirms receipt by phone", "SMS delivered", "Verbal acknowledgment received"]
    },
    {
      "action_code": "PROD_ACTION_003",
      "action_name": "Alert Resp. Technique Coordinator",
      "action_type": "COMMUNICATION",
      "phase": 1,
      "phase_name": "IMMEDIATE ALERT & PREPARATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 3,
      "priority": "CRITICAL",
      "escalation_after_minutes": 5,
      "escalate_to": "Karim",
      "steps": ["Call Abdel Sadek directly", "Confirm notification received", "Verify availability for quality check", "Confirm inspection location"],
      "success_criteria": ["Abdel Sadek confirms receipt", "Confirms availability", "Confirms inspection location ready"]
    },
    {
      "action_code": "PROD_ACTION_004",
      "action_name": "Prepare Receiving Area",
      "action_type": "PHYSICAL_PREPARATION",
      "phase": 2,
      "phase_name": "RECEIVING AREA PREPARATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 10,
      "priority": "HIGH",
      "escalation_after_minutes": 12,
      "escalate_to": "Karim",
      "checklist": ["Bay 3 cleared", "Bay accessible", "Forklift operational", "Pallet jacks available", "Tarps available", "Adequate lighting", "Documentation station ready", "Scale operational", "Safety equipment available"],
      "success_criteria": ["Bay 3 is clear and ready", "All equipment operational", "Safety equipment available", "Documentation station ready"]
    },
    {
      "action_code": "PROD_ACTION_005",
      "action_name": "Prepare Storage Location",
      "action_type": "PHYSICAL_PREPARATION",
      "phase": 2,
      "phase_name": "RECEIVING AREA PREPARATION",
      "assigned_to": "Fatima",
      "assigned_to_role": "STORAGE_MANAGER",
      "deadline_minutes": 10,
      "priority": "HIGH",
      "escalation_after_minutes": 12,
      "escalate_to": "Hassan",
      "checklist": ["Storage area cleared", "Adequate space verified", "Area is dry/protected", "Shelving available", "Moisture protection available", "Access clear", "Documentation prepared"],
      "success_criteria": ["Storage area is clear and ready", "Adequate space confirmed", "Area is dry and protected", "Documentation area ready"]
    },
    {
      "action_code": "PROD_ACTION_006",
      "action_name": "Prepare Quality Check Area",
      "action_type": "PHYSICAL_PREPARATION",
      "phase": 2,
      "phase_name": "RECEIVING AREA PREPARATION",
      "assigned_to": "Abdel Sadek",
      "assigned_to_role": "TECH_VALIDATOR",
      "deadline_minutes": 10,
      "priority": "HIGH",
      "escalation_after_minutes": 12,
      "escalate_to": "Karim",
      "checklist": ["Lab cleared", "Karl Fischer Titrator operational", "Pycnometer available", "Blaine Apparatus operational", "Vicat Apparatus operational", "Sample area prepared", "Documentation ready", "Safety equipment available"],
      "success_criteria": ["Lab is clean and organized", "All equipment operational", "Sample collection area ready", "Documentation ready"]
    },
    {
      "action_code": "PROD_ACTION_007",
      "action_name": "Mobilize Unloading Crew",
      "action_type": "CREW_COORDINATION",
      "phase": 3,
      "phase_name": "CREW MOBILIZATION",
      "assigned_to": "Mohamed",
      "assigned_to_role": "CREW_LEADER",
      "deadline_minutes": 15,
      "priority": "HIGH",
      "escalation_after_minutes": 17,
      "escalate_to": "Hassan",
      "steps": ["Assemble 4-person crew", "Brief crew on emergency", "Explain material type/quantity", "Review unloading procedure", "Assign roles", "Verify safety equipment"],
      "success_criteria": ["4-person crew assembled", "Crew briefed and understands", "Safety equipment distributed", "Crew positioned at receiving bay"]
    },
    {
      "action_code": "PROD_ACTION_008",
      "action_name": "Verify Delivery Coordination",
      "action_type": "COMMUNICATION",
      "phase": 3,
      "phase_name": "CREW MOBILIZATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 15,
      "priority": "HIGH",
      "escalation_after_minutes": 20,
      "escalate_to": "Karim",
      "steps": ["Call supplier", "Confirm BC details", "Verify delivery address", "Confirm ETA", "Provide receiving contact", "Request 30-min arrival alert"],
      "success_criteria": ["Supplier confirms BC received", "Delivery address confirmed", "ETA confirmed", "Driver will call 30 min before arrival"]
    },
    {
      "action_code": "PROD_ACTION_009",
      "action_name": "Position Crew at Receiving Bay",
      "action_type": "CREW_COORDINATION",
      "phase": 4,
      "phase_name": "STANDBY & MONITORING",
      "assigned_to": "Mohamed",
      "assigned_to_role": "CREW_LEADER",
      "deadline_minutes": 20,
      "priority": "HIGH",
      "escalation_after_minutes": 25,
      "escalate_to": "Hassan",
      "checklist": ["Crew at receiving bay", "Forklift positioned", "Pallet jacks ready", "Safety equipment in place", "Communication with Hassan", "Documentation person ready"],
      "success_criteria": ["Crew positioned at receiving bay", "All equipment ready", "Communication established", "Crew ready to unload"]
    },
    {
      "action_code": "PROD_ACTION_010",
      "action_name": "Monitor Delivery Status",
      "action_type": "MONITORING",
      "phase": 4,
      "phase_name": "STANDBY & MONITORING",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 60,
      "priority": "HIGH",
      "escalation_after_minutes": 90,
      "escalate_to": "Karim",
      "steps": ["Monitor for supplier SMS", "Alert crew on driver approach", "Monitor for driver arrival", "Confirm delivery details", "Verify material matches BC", "Begin unloading", "Provide real-time updates"],
      "success_criteria": ["All status updates provided", "Crew alerted of arrival", "Delivery confirmed", "Unloading completed"]
    },
    {
      "action_code": "PROD_ACTION_011",
      "action_name": "Coordinate Quality Check",
      "action_type": "COORDINATION",
      "phase": 5,
      "phase_name": "POST-DELIVERY COORDINATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 5,
      "priority": "CRITICAL",
      "escalation_after_minutes": 10,
      "escalate_to": "Karim",
      "steps": ["Notify Abdel Sadek of arrival", "Provide material details", "Prepare samples", "Transport samples to lab", "Coordinate timing"],
      "success_criteria": ["Abdel Sadek notified immediately", "Samples prepared", "Quality check begins within 10 min", "Decision received"]
    },
    {
      "action_code": "PROD_ACTION_012",
      "action_name": "Document Receiving",
      "action_type": "DOCUMENTATION",
      "phase": 5,
      "phase_name": "POST-DELIVERY COORDINATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 10,
      "priority": "HIGH",
      "escalation_after_minutes": 15,
      "escalate_to": "Hassan",
      "checklist": ["Invoice received", "Delivery note verified", "Quality certificate received", "Batch certificate received", "Receiving timestamp recorded", "Material condition documented", "Crew names recorded", "Storage location recorded", "Receiving report created", "Documents filed", "System updated"],
      "success_criteria": ["All documents received", "Receiving timestamp recorded", "Material condition documented", "Receiving report completed", "System updated"]
    },
    {
      "action_code": "PROD_ACTION_013",
      "action_name": "Update Production Schedule",
      "action_type": "SYSTEM_UPDATE",
      "phase": 5,
      "phase_name": "POST-DELIVERY COORDINATION",
      "assigned_to": "Hassan",
      "assigned_to_role": "WAREHOUSE_MANAGER",
      "deadline_minutes": 5,
      "priority": "HIGH",
      "escalation_after_minutes": 10,
      "escalate_to": "Karim",
      "steps": ["Receive quality approval", "Update production schedule", "Mark materials AVAILABLE", "Notify production team", "Update related orders", "Notify customers", "Confirm production can proceed"],
      "success_criteria": ["Production schedule updated", "Production team notified", "Related orders updated", "Production can proceed"]
    }
  ]'::jsonb;

  -- Insert action items
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_actions)
  LOOP
    INSERT INTO public.emergency_bc_action_items (
      notification_id,
      bc_id,
      action_code,
      action_name,
      action_type,
      phase,
      phase_name,
      assigned_to,
      assigned_to_role,
      deadline_minutes,
      deadline_at,
      priority,
      steps,
      checklist,
      success_criteria,
      escalation_after_minutes,
      escalate_to
    ) VALUES (
      p_notification_id,
      p_bc_id,
      v_action.value->>'action_code',
      v_action.value->>'action_name',
      v_action.value->>'action_type',
      (v_action.value->>'phase')::int,
      v_action.value->>'phase_name',
      v_action.value->>'assigned_to',
      v_action.value->>'assigned_to_role',
      (v_action.value->>'deadline_minutes')::int,
      p_base_time + ((v_action.value->>'deadline_minutes')::int || ' minutes')::interval,
      v_action.value->>'priority',
      COALESCE(v_action.value->'steps', '[]'::jsonb),
      COALESCE(v_action.value->'checklist', '[]'::jsonb),
      COALESCE(v_action.value->'success_criteria', '[]'::jsonb),
      (v_action.value->>'escalation_after_minutes')::int,
      v_action.value->>'escalate_to'
    );
  END LOOP;

  RETURN QUERY SELECT * FROM public.emergency_bc_action_items 
    WHERE notification_id = p_notification_id 
    ORDER BY phase, action_code;
END;
$$;

-- Function to update action item status
CREATE OR REPLACE FUNCTION public.update_action_item_status(
  p_action_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.emergency_bc_action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action public.emergency_bc_action_items;
  v_previous_status TEXT;
  v_user_id UUID;
  v_user_name TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
  FROM auth.users WHERE id = v_user_id;

  -- Get previous status
  SELECT status INTO v_previous_status FROM public.emergency_bc_action_items WHERE id = p_action_id;

  -- Update action item
  UPDATE public.emergency_bc_action_items
  SET 
    status = p_status,
    started_at = CASE WHEN p_status = 'IN_PROGRESS' AND started_at IS NULL THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_status = 'COMPLETED' THEN now() ELSE completed_at END,
    completed_by = CASE WHEN p_status = 'COMPLETED' THEN v_user_id ELSE completed_by END,
    completed_by_name = CASE WHEN p_status = 'COMPLETED' THEN v_user_name ELSE completed_by_name END,
    completion_notes = CASE WHEN p_status = 'COMPLETED' THEN COALESCE(p_notes, completion_notes) ELSE completion_notes END,
    escalated = CASE WHEN p_status = 'ESCALATED' THEN true ELSE escalated END,
    escalated_at = CASE WHEN p_status = 'ESCALATED' THEN now() ELSE escalated_at END,
    escalated_reason = CASE WHEN p_status = 'ESCALATED' THEN COALESCE(p_notes, 'Deadline exceeded') ELSE escalated_reason END,
    updated_at = now()
  WHERE id = p_action_id
  RETURNING * INTO v_action;

  -- Log status change
  INSERT INTO public.emergency_bc_action_history (
    action_item_id,
    previous_status,
    new_status,
    changed_by,
    changed_by_name,
    notes
  ) VALUES (
    p_action_id,
    v_previous_status,
    p_status,
    v_user_id,
    v_user_name,
    p_notes
  );

  RETURN v_action;
END;
$$;

-- Function to get action items with escalation status
CREATE OR REPLACE FUNCTION public.get_emergency_bc_action_items(p_notification_id UUID)
RETURNS TABLE (
  id UUID,
  action_code TEXT,
  action_name TEXT,
  action_type TEXT,
  phase INT,
  phase_name TEXT,
  assigned_to TEXT,
  assigned_to_role TEXT,
  deadline_minutes INT,
  deadline_at TIMESTAMPTZ,
  priority TEXT,
  status TEXT,
  steps JSONB,
  checklist JSONB,
  success_criteria JSONB,
  escalation_after_minutes INT,
  escalate_to TEXT,
  escalated BOOLEAN,
  escalated_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by_name TEXT,
  is_overdue BOOLEAN,
  should_escalate BOOLEAN,
  minutes_remaining INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id,
    ai.action_code::TEXT,
    ai.action_name::TEXT,
    ai.action_type::TEXT,
    ai.phase,
    ai.phase_name::TEXT,
    ai.assigned_to::TEXT,
    ai.assigned_to_role::TEXT,
    ai.deadline_minutes,
    ai.deadline_at,
    ai.priority::TEXT,
    ai.status::TEXT,
    ai.steps,
    ai.checklist,
    ai.success_criteria,
    ai.escalation_after_minutes,
    ai.escalate_to::TEXT,
    ai.escalated,
    ai.escalated_at,
    ai.started_at,
    ai.completed_at,
    ai.completed_by_name::TEXT,
    (now() > ai.deadline_at AND ai.status NOT IN ('COMPLETED', 'ESCALATED')) AS is_overdue,
    (now() > (ai.created_at + (ai.escalation_after_minutes || ' minutes')::interval) 
      AND NOT ai.escalated 
      AND ai.status NOT IN ('COMPLETED')) AS should_escalate,
    GREATEST(0, EXTRACT(EPOCH FROM (ai.deadline_at - now())) / 60)::INT AS minutes_remaining
  FROM public.emergency_bc_action_items ai
  WHERE ai.notification_id = p_notification_id
  ORDER BY ai.phase, ai.action_code;
END;
$$;

-- Enable realtime for action items
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_bc_action_items;

-- Create indexes for performance
CREATE INDEX idx_emergency_bc_action_items_notification ON public.emergency_bc_action_items(notification_id);
CREATE INDEX idx_emergency_bc_action_items_status ON public.emergency_bc_action_items(status);
CREATE INDEX idx_emergency_bc_action_items_deadline ON public.emergency_bc_action_items(deadline_at);
CREATE INDEX idx_emergency_bc_action_history_action ON public.emergency_bc_action_history(action_item_id);
