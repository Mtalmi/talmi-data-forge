import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Employee {
  email: string;
  full_name: string;
  role: string;
}

/** Generate a cryptographically random password */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const values = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(values, v => chars[v % chars.length]).join('') + '!A1';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Employee definitions — no hardcoded passwords
    const employees: Employee[] = [
      { email: "imad@talmi-beton.ma", full_name: "Imad", role: "directeur_operations" },
      { email: "abdel.sadek@talmi-beton.ma", full_name: "Abdel Sadek", role: "responsable_technique" },
      { email: "tarek@talmi-beton.ma", full_name: "Tarek", role: "responsable_technique" },
      { email: "agent.admin@talmi-beton.ma", full_name: "Agent Administratif", role: "agent_administratif" },
      { email: "centraliste@talmi-beton.ma", full_name: "Centraliste", role: "centraliste" },
      { email: "auditeur@talmi-beton.ma", full_name: "Auditeur Externe", role: "auditeur" },
    ];

    const results = [];

    for (const emp of employees) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === emp.email);

      if (existingUser) {
        // Ensure role is set
        await supabaseAdmin.from("user_roles_v2").upsert({
          user_id: existingUser.id,
          role: emp.role,
          full_name: emp.full_name,
          email: emp.email,
        });
        results.push({ email: emp.email, status: "already_exists", user_id: existingUser.id });
        continue;
      }

      // Generate random password — never returned or logged
      const password = generatePassword();

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: emp.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: emp.full_name },
      });

      if (authError) {
        results.push({ email: emp.email, status: "auth_error", error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({ user_id: userId, full_name: emp.full_name, email: emp.email });

      if (profileError) {
        results.push({ email: emp.email, status: "profile_error", error: profileError.message, user_id: userId });
        continue;
      }

      const { error: roleError } = await supabaseAdmin
        .from("user_roles_v2")
        .upsert({ user_id: userId, role: emp.role, full_name: emp.full_name, email: emp.email });

      if (roleError) {
        results.push({ email: emp.email, status: "role_error", error: roleError.message, user_id: userId });
        continue;
      }

      // Generate password reset link so user sets their own password
      await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: emp.email });

      results.push({ 
        email: emp.email, 
        status: "created", 
        user_id: userId, 
        role: emp.role,
        note: "Password reset link generated",
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
