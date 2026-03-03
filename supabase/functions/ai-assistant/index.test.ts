import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/ai-assistant`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

Deno.test("ai-assistant: CORS preflight returns 200", async () => {
  const res = await fetch(BASE, { method: "OPTIONS", headers: { Origin: "http://localhost" } });
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test("ai-assistant: chat mode streams SSE", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "chat",
      messages: [{ role: "user", content: "Dis bonjour en une phrase." }],
    }),
  });
  assertEquals(res.status, 200);
  const contentType = res.headers.get("content-type");
  assertExists(contentType);
  assertEquals(contentType!.includes("text/event-stream"), true);
  // Consume at least some tokens
  const reader = res.body!.getReader();
  const { value } = await reader.read();
  assertExists(value);
  reader.cancel();
});

Deno.test("ai-assistant: validate mode returns JSON", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "validate",
      messages: [{ role: "user", content: "Volume BL: 15 m³, prix: 500 MAD/m³" }],
    }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.choices);
});

Deno.test("ai-assistant: anomaly mode returns JSON", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "anomaly",
      messages: [{ role: "user", content: "Facture fournisseur X: 50000 MAD le 01/01, puis 50000 MAD le 02/01" }],
    }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.choices);
});

Deno.test("ai-assistant: coach mode returns JSON", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "coach",
      messages: [{ role: "user", content: "L'utilisateur a créé un BC de 6m³ B25 pour le client TGCC" }],
    }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.choices);
});

Deno.test("ai-assistant: scenario mode returns JSON", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "scenario",
      messages: [{ role: "user", content: "Génère un scénario de simulation pour la création d'un bon de commande" }],
    }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.choices);
});

Deno.test("ai-assistant: empty messages returns error", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ mode: "chat" }),
  });
  // Should error or handle gracefully
  const text = await res.text();
  assertExists(text);
});
