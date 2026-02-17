import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { analysis_type } = await req.json();

    // ============================================
    // 1. DEMAND FORECASTING
    // ============================================
    if (analysis_type === "demand_forecast") {
      // Get last 90 days of BCs
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: bcs } = await supabase
        .from("bons_commande")
        .select("formule_id, volume_m3, date_livraison_souhaitee, created_at, statut")
        .gte("created_at", ninetyDaysAgo)
        .not("statut", "eq", "annule");

      const { data: formules } = await supabase
        .from("formules_theoriques")
        .select("formule_id, nom_formule, resistance_classe");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Tu es un analyste prédictif pour une centrale à béton au Maroc.
Analyse les données historiques de commandes et prédis la demande pour les 7 prochains jours.

RÈGLES:
1. Identifie les tendances hebdomadaires (jours forts/faibles)
2. Détecte la saisonnalité
3. Calcule la demande prévue par formule
4. Donne un intervalle de confiance

Retourne UNIQUEMENT un JSON:
{
  "weekly_forecast": [
    { "day": "lundi", "date": "YYYY-MM-DD", "predicted_volume_m3": number, "confidence": 0-100 }
  ],
  "by_formule": [
    { "formule_id": "string", "nom": "string", "predicted_weekly_m3": number, "trend": "up"|"down"|"stable", "change_pct": number }
  ],
  "insights": ["string"],
  "overall_trend": "up"|"down"|"stable",
  "total_predicted_m3": number
}`
            },
            {
              role: "user",
              content: `Données historiques (90 jours):\n\nCommandes: ${JSON.stringify(bcs?.slice(0, 200))}\n\nFormules disponibles: ${JSON.stringify(formules)}\n\nDate actuelle: ${new Date().toISOString().split("T")[0]}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "demand_forecast",
                description: "Return demand forecast prediction",
                parameters: {
                  type: "object",
                  properties: {
                    weekly_forecast: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          day: { type: "string" },
                          date: { type: "string" },
                          predicted_volume_m3: { type: "number" },
                          confidence: { type: "number" },
                        },
                        required: ["day", "date", "predicted_volume_m3", "confidence"],
                      },
                    },
                    by_formule: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          formule_id: { type: "string" },
                          nom: { type: "string" },
                          predicted_weekly_m3: { type: "number" },
                          trend: { type: "string", enum: ["up", "down", "stable"] },
                          change_pct: { type: "number" },
                        },
                        required: ["formule_id", "nom", "predicted_weekly_m3", "trend", "change_pct"],
                      },
                    },
                    insights: { type: "array", items: { type: "string" } },
                    overall_trend: { type: "string", enum: ["up", "down", "stable"] },
                    total_predicted_m3: { type: "number" },
                  },
                  required: ["weekly_forecast", "by_formule", "insights", "overall_trend", "total_predicted_m3"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "demand_forecast" } },
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI error:", aiResponse.status, errText);
        throw new Error(`AI error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================
    // 2. STOCK DEPLETION PREDICTION
    // ============================================
    if (analysis_type === "stock_depletion") {
      const { data: stocks } = await supabase
        .from("stocks")
        .select("materiau, quantite_actuelle, unite, seuil_alerte, updated_at");

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: mouvements } = await supabase
        .from("mouvements_stock")
        .select("materiau, type_mouvement, quantite, date_mouvement, reference")
        .gte("date_mouvement", thirtyDaysAgo)
        .order("date_mouvement", { ascending: true });

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Tu es un expert en gestion de stocks pour une centrale à béton.
Analyse la consommation récente et prédis quand chaque matériau sera épuisé.

MATÉRIAUX CRITIQUES: Ciment (CPJ45, CPJ55), Sable 0/3, Gravier 8/15, Gravier 15/25, Adjuvants

Retourne UNIQUEMENT via l'outil fourni.`,
            },
            {
              role: "user",
              content: `Stocks actuels:\n${JSON.stringify(stocks)}\n\nMouvements (30 jours):\n${JSON.stringify(mouvements?.slice(0, 150))}\n\nDate: ${new Date().toISOString().split("T")[0]}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "stock_depletion",
                description: "Return stock depletion predictions",
                parameters: {
                  type: "object",
                  properties: {
                    predictions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          materiau: { type: "string" },
                          current_qty: { type: "number" },
                          daily_consumption: { type: "number" },
                          days_until_empty: { type: "number" },
                          depletion_date: { type: "string" },
                          urgency: { type: "string", enum: ["critical", "warning", "ok"] },
                          recommendation: { type: "string" },
                        },
                        required: ["materiau", "current_qty", "daily_consumption", "days_until_empty", "depletion_date", "urgency", "recommendation"],
                      },
                    },
                    alerts: { type: "array", items: { type: "string" } },
                  },
                  required: ["predictions", "alerts"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "stock_depletion" } },
        }),
      });

      if (!aiResponse.ok) throw new Error(`AI error: ${aiResponse.status}`);
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================
    // 3. CLIENT RISK SCORING
    // ============================================
    if (analysis_type === "client_risk") {
      const { data: clients } = await supabase
        .from("clients")
        .select("client_id, nom_entreprise, secteur_activite, credit_max, credit_used, statut, created_at")
        .eq("statut", "actif")
        .limit(50);

      const { data: factures } = await supabase
        .from("factures")
        .select("client_id, montant_ttc, statut_paiement, date_facture, date_echeance, date_paiement, retard_jours")
        .order("date_facture", { ascending: false })
        .limit(200);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Tu es un analyste crédit pour une centrale à béton au Maroc.
Évalue le risque de chaque client basé sur:
1. Historique de paiement (retards, impayés)
2. Utilisation crédit vs limite
3. Fréquence des commandes (churn risk)
4. Montants moyens

Score de 0 (risque nul) à 100 (risque maximal).
Retourne UNIQUEMENT via l'outil fourni.`,
            },
            {
              role: "user",
              content: `Clients actifs:\n${JSON.stringify(clients)}\n\nFactures récentes:\n${JSON.stringify(factures?.slice(0, 150))}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "client_risk_scores",
                description: "Return client risk analysis",
                parameters: {
                  type: "object",
                  properties: {
                    clients: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          client_id: { type: "string" },
                          nom: { type: "string" },
                          risk_score: { type: "number" },
                          risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                          payment_reliability: { type: "number" },
                          avg_delay_days: { type: "number" },
                          churn_probability: { type: "number" },
                          recommendation: { type: "string" },
                        },
                        required: ["client_id", "nom", "risk_score", "risk_level", "payment_reliability", "avg_delay_days", "churn_probability", "recommendation"],
                      },
                    },
                    summary: {
                      type: "object",
                      properties: {
                        total_at_risk_amount: { type: "number" },
                        high_risk_count: { type: "number" },
                        avg_portfolio_score: { type: "number" },
                      },
                      required: ["total_at_risk_amount", "high_risk_count", "avg_portfolio_score"],
                    },
                  },
                  required: ["clients", "summary"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "client_risk_scores" } },
        }),
      });

      if (!aiResponse.ok) throw new Error(`AI error: ${aiResponse.status}`);
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================
    // 4. NIGHTLY ANOMALY SCAN (cron-triggered)
    // ============================================
    if (analysis_type === "nightly_scan") {
      // Fetch last 24h of data
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [expensesRes, blsRes, auditsRes] = await Promise.all([
        supabase.from("depenses").select("*").gte("created_at", oneDayAgo).limit(50),
        supabase.from("bons_livraison_reels").select("bl_id, date_livraison, volume_m3, prix_vente_m3, camion_assigne, chauffeur_nom, ciment_reel_kg, variance_ciment_pct, created_at, statut_paiement").gte("created_at", oneDayAgo).limit(50),
        supabase.from("audit_superviseur").select("action, table_name, user_name, created_at, changes").gte("created_at", oneDayAgo).limit(30),
      ]);

      const scanPayload = {
        expenses: expensesRes.data || [],
        deliveries: blsRes.data || [],
        audit_actions: auditsRes.data || [],
        scan_time: new Date().toISOString(),
      };

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Tu es un système de surveillance nocturne pour TBOS (centrale à béton).
Analyse les données des dernières 24h pour détecter:
1. Factures doubles (même fournisseur + montant similaire)
2. Prix anormaux (écart >15% de la moyenne)
3. Volumes suspects (>8m³ par toupie)
4. Activité nocturne (22h-6h)
5. Écarts matériaux (variance ciment >5%)
6. Modifications suspectes (rollbacks, deletions)

Retourne UNIQUEMENT via l'outil fourni.`,
            },
            {
              role: "user",
              content: `Données des dernières 24h:\n${JSON.stringify(scanPayload)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "nightly_scan_result",
                description: "Return nightly anomaly scan results",
                parameters: {
                  type: "object",
                  properties: {
                    risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    anomaly_count: { type: "number" },
                    findings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string" },
                          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                          description: { type: "string" },
                          recommendation: { type: "string" },
                          reference: { type: "string" },
                        },
                        required: ["type", "severity", "description", "recommendation"],
                      },
                    },
                    summary: { type: "string" },
                  },
                  required: ["risk_level", "anomaly_count", "findings", "summary"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "nightly_scan_result" } },
        }),
      });

      if (!aiResponse.ok) throw new Error(`AI error: ${aiResponse.status}`);
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

      // Store scan result and create alert if needed
      if (result && result.anomaly_count > 0) {
        await supabase.from("alertes_systeme").insert({
          titre: `🤖 Scan Nocturne: ${result.anomaly_count} anomalie(s)`,
          message: result.summary,
          niveau: result.risk_level === "critical" ? "critique" : result.risk_level === "high" ? "urgent" : "info",
          type_alerte: "ai_nightly_scan",
          destinataire_role: "ceo",
          reference_table: "ai_scan",
        });
      }

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid analysis_type. Use: demand_forecast, stock_depletion, client_risk, nightly_scan" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-predictive-analytics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
