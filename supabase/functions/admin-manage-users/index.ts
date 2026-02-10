import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This function is disabled after initial setup
  return new Response(JSON.stringify({ error: "This function is disabled" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
