import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/rate-limit-check`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

Deno.test("rate-limit: first attempt is allowed", async () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: uniqueEmail, action: "login" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.allowed, true);
  assertEquals(data.remaining_attempts, 4);
});

Deno.test("rate-limit: rejects missing email", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "login" }),
  });
  assertEquals(res.status, 400);
  await res.text();
});

Deno.test("rate-limit: CORS preflight", async () => {
  const res = await fetch(BASE, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  await res.text();
});
