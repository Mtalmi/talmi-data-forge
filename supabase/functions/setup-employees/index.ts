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
  password: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Define employees to create
    const employees: Employee[] = [
      {
        email: "imad@talmi-beton.ma",
        full_name: "Imad",
        role: "directeur_operations",
        password: "TalmiImad2024!",
      },
      {
        email: "abdel.sadek@talmi-beton.ma",
        full_name: "Abdel Sadek",
        role: "responsable_technique",
        password: "TalmiAbdel2024!",
      },
      {
        email: "tarek@talmi-beton.ma",
        full_name: "Tarek",
        role: "responsable_technique",
        password: "TalmiTarek2024!",
      },
      {
        email: "agent.admin@talmi-beton.ma",
        full_name: "Agent Administratif",
        role: "agent_administratif",
        password: "TalmiAgent2024!",
      },
      {
        email: "centraliste@talmi-beton.ma",
        full_name: "Centraliste",
        role: "centraliste",
        password: "TalmiCentral2024!",
      },
    ];

    const results = [];

    for (const emp of employees) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === emp.email);

      if (existingUser) {
        results.push({ email: emp.email, status: "already_exists", user_id: existingUser.id });
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: emp.email,
        password: emp.password,
        email_confirm: true,
        user_metadata: { full_name: emp.full_name },
      });

      if (authError) {
        results.push({ email: emp.email, status: "auth_error", error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          user_id: userId,
          full_name: emp.full_name,
          email: emp.email,
        });

      if (profileError) {
        results.push({ email: emp.email, status: "profile_error", error: profileError.message, user_id: userId });
        continue;
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles_v2")
        .upsert({
          user_id: userId,
          role: emp.role,
          full_name: emp.full_name,
          email: emp.email,
        });

      if (roleError) {
        results.push({ email: emp.email, status: "role_error", error: roleError.message, user_id: userId });
        continue;
      }

      results.push({ 
        email: emp.email, 
        status: "created", 
        user_id: userId, 
        role: emp.role,
        password: emp.password 
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
