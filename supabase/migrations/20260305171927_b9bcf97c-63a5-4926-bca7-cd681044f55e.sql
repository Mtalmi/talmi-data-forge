
-- ai_briefings: allow authenticated and anon SELECT
CREATE POLICY "Allow authenticated read access" ON public.ai_briefings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow anon read access" ON public.ai_briefings FOR SELECT TO anon USING (true);

-- client_intelligence: allow authenticated and anon SELECT
CREATE POLICY "Allow authenticated read access" ON public.client_intelligence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow anon read access" ON public.client_intelligence FOR SELECT TO anon USING (true);

-- cash_flow_forecasts: allow authenticated and anon SELECT
CREATE POLICY "Allow authenticated read access" ON public.cash_flow_forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow anon read access" ON public.cash_flow_forecasts FOR SELECT TO anon USING (true);
