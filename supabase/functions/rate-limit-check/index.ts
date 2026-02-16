import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit store (resets on function cold start, which is fine for brute-force protection)
const attempts = new Map<string, { count: number; firstAttempt: number; blocked: boolean }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_MS = 30 * 60 * 1000; // 30 min block after exceeding

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, val] of attempts) {
    if (now - val.firstAttempt > BLOCK_MS) {
      attempts.delete(key);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: corsHeaders });
    }

    const key = `${email.toLowerCase().trim()}:${action || "login"}`;
    const now = Date.now();

    cleanupOldEntries();

    const entry = attempts.get(key);

    if (entry) {
      // Check if blocked
      if (entry.blocked && now - entry.firstAttempt < BLOCK_MS) {
        const remainingMin = Math.ceil((BLOCK_MS - (now - entry.firstAttempt)) / 60000);
        return new Response(JSON.stringify({
          allowed: false,
          message: `Trop de tentatives. Réessayez dans ${remainingMin} minutes.`,
          remaining_attempts: 0,
          blocked_until: new Date(entry.firstAttempt + BLOCK_MS).toISOString(),
        }), { headers: corsHeaders });
      }

      // Reset window if expired
      if (now - entry.firstAttempt > WINDOW_MS) {
        attempts.set(key, { count: 1, firstAttempt: now, blocked: false });
        return new Response(JSON.stringify({ allowed: true, remaining_attempts: MAX_ATTEMPTS - 1 }), { headers: corsHeaders });
      }

      // Increment
      entry.count++;
      if (entry.count > MAX_ATTEMPTS) {
        entry.blocked = true;
        return new Response(JSON.stringify({
          allowed: false,
          message: "Trop de tentatives. Compte temporairement bloqué.",
          remaining_attempts: 0,
        }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({
        allowed: true,
        remaining_attempts: MAX_ATTEMPTS - entry.count,
      }), { headers: corsHeaders });
    }

    // First attempt
    attempts.set(key, { count: 1, firstAttempt: now, blocked: false });
    return new Response(JSON.stringify({
      allowed: true,
      remaining_attempts: MAX_ATTEMPTS - 1,
    }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
