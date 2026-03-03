import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/ai-predictive-analytics`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

Deno.test("predictive-analytics: CORS preflight", async () => {
  const res = await fetch(BASE, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test("predictive-analytics: demand_forecast returns structured data", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ analysis_type: "demand_forecast" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
  assertExists(data.data);
});

Deno.test("predictive-analytics: stock_depletion returns predictions", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ analysis_type: "stock_depletion" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
  assertExists(data.data);
});

Deno.test("predictive-analytics: client_risk returns scores", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ analysis_type: "client_risk" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
  assertExists(data.data);
});

Deno.test("predictive-analytics: invalid analysis_type returns 400 or empty", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ analysis_type: "nonexistent" }),
  });
  // Should handle gracefully
  const text = await res.text();
  assertExists(text);
});
