
-- AI Briefings log (Morning & End-of-Day AI-generated reports)
CREATE TABLE IF NOT EXISTS public.ai_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  type text NOT NULL, -- 'morning_briefing' | 'end_of_day_report'
  content text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  plant_name text DEFAULT 'Atlas Concrete Morocco'
);

ALTER TABLE public.ai_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view briefings"
ON public.ai_briefings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert briefings"
ON public.ai_briefings FOR INSERT TO service_role WITH CHECK (true);

-- Maintenance Orders (AI-generated from Predictive Maintenance workflow)
CREATE TABLE IF NOT EXISTS public.maintenance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id text,
  equipment_name text,
  plant_name text DEFAULT 'Atlas Concrete Morocco',
  risk_level text DEFAULT 'medium', -- 'critical' | 'high' | 'medium' | 'low'
  failure_type text,
  predicted_failure_days integer,
  confidence_percent integer,
  recommended_action text,
  parts_needed jsonb DEFAULT '[]',
  estimated_cost numeric DEFAULT 0,
  status text DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ai_generated boolean DEFAULT true,
  ai_analysis text,
  warning_signs jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view maintenance orders"
ON public.maintenance_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update maintenance orders"
ON public.maintenance_orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can manage maintenance orders"
ON public.maintenance_orders FOR ALL TO service_role USING (true);

-- Purchase Orders (AI-generated from Smart Reorder Agent)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name text NOT NULL,
  quantity_tons numeric DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  current_stock_tons numeric DEFAULT 0,
  daily_consumption_tons numeric DEFAULT 0,
  days_remaining integer DEFAULT 0,
  urgency text DEFAULT 'this_week', -- 'immediate' | 'this_week' | 'this_month'
  status text DEFAULT 'pending_approval', -- 'pending_approval' | 'approved' | 'ordered' | 'delivered' | 'cancelled'
  ai_generated boolean DEFAULT true,
  ai_reasoning text,
  supplier_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view purchase orders"
ON public.purchase_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update purchase orders"
ON public.purchase_orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can manage purchase orders"
ON public.purchase_orders FOR ALL TO service_role USING (true);

-- Quality Failure Tickets (from Quality Failure Agent workflow)
CREATE TABLE IF NOT EXISTS public.quality_failure_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text,
  plant_name text,
  mix_type text,
  slump_value numeric,
  slump_target numeric,
  temperature numeric,
  air_content numeric,
  severity text DEFAULT 'high', -- 'critical' | 'high' | 'medium'
  ai_analysis text,
  hold_decision boolean DEFAULT false,
  status text DEFAULT 'open', -- 'open' | 'in_review' | 'resolved'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quality_failure_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view quality tickets"
ON public.quality_failure_tickets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage quality tickets"
ON public.quality_failure_tickets FOR ALL TO service_role USING (true);

-- Enable realtime for live updates on the agent dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_briefings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quality_failure_tickets;
