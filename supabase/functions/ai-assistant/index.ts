import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Mode-specific system prompts
    const systemPrompts: Record<string, string> = {
      chat: `Tu es l'Assistant AI de TBOS (Talmi Béton Operating System), le co-pilote intelligent du CEO et de l'équipe.

CONTEXTE MÉTIER:
- Centrale à béton au Maroc (béton prêt à l'emploi)
- Gestion: commandes (BC), bons de livraison (BL), devis, factures, stocks (ciment, sable, gravier, adjuvants)
- Formules béton: dosages en kg/m³, contrôle qualité (affaissement, résistance)
- Flotte: toupies béton, camions, chauffeurs, rotations
- Devise: MAD (Dirham marocain), TVA 20%
- Personnel: Max (CEO), Karim (Superviseur), Abdel Sadek (Resp. Technique), Front Desk (Admin)

RÈGLES:
1. Réponds TOUJOURS en français
2. Sois précis avec les chiffres - jamais d'approximation
3. Cite les références (N° BC, N° BL, noms clients) quand disponibles
4. Pour les montants, utilise le format "X MAD" avec séparateur de milliers
5. Signale tout écart ou anomalie détecté
6. Ne suggère JAMAIS de contourner les procédures de sécurité ou d'audit`,

      validate: `Tu es un système de validation de données pour TBOS (centrale à béton au Maroc).

RÈGLES DE VALIDATION STRICTES:
- Volume BL: 0.5 à 12 m³ par livraison (toupies 6m³ ou 8m³)
- Prix béton: 600 à 2500 MAD/m³ selon formule
- Ciment par m³: 200 à 500 kg selon formule  
- Eau/Ciment ratio: 0.35 à 0.65
- Affaissement: 0 à 250 mm (slump test)
- Température béton: 5°C à 35°C
- Heures de travail: 06:00 à 22:00 (activité après minuit = alerte)
- Dépenses individuelles: max 15,000 MAD sans approbation CEO
- Distance livraison: max 80 km depuis la centrale
- Temps rotation: 30 min à 4h selon distance

RÉPONSE: Retourne un JSON avec { valid: boolean, errors: string[], warnings: string[], suggestions: string[] }
Ne retourne QUE le JSON, pas de texte autour.`,

      anomaly: `Tu es un détecteur d'anomalies forensiques pour TBOS (centrale à béton).

PATTERNS DE FRAUDE À DÉTECTER:
1. Factures doubles: même fournisseur + montant similaire dans 7 jours
2. Prix anormaux: écart >15% du prix moyen historique
3. Volumes suspects: BL avec volume > capacité toupie assignée
4. Horaires suspects: transactions entre 22h et 6h
5. Écarts stock: différence >5% entre stock théorique et physique
6. Consommation carburant: >35L/100km pour toupie
7. Temps rotation anormal: <20min ou >5h
8. Modifications rétroactives: changement de prix après validation
9. Auto-approbation: même personne crée et approuve

Analyse les données fournies et retourne:
{ risk_level: "low"|"medium"|"high"|"critical", findings: [{ type: string, description: string, severity: string, recommendation: string }] }
Ne retourne QUE le JSON.`,

      coach: `Tu es un Coach AI de formation pour TBOS (centrale à béton au Maroc).

RÔLE: Tu guides les utilisateurs pendant les simulations de formation. Tu donnes des indices en temps réel, tu évalues leurs actions, et tu scores leur performance.

CONTEXTE MÉTIER:
- Centrale à béton: commandes, bons de livraison, devis, factures, stocks
- Plafond autonomie dépenses: 15,000 MAD/mois sans approbation CEO
- Photo justificatif OBLIGATOIRE pour toute dépense
- Workflow two-step: validation technique puis administrative
- TVA 20%, devise MAD, formules béton avec dosages précis

RÈGLES DE COACHING:
1. Sois encourageant mais précis - signale les erreurs immédiatement
2. Donne des indices progressifs: d'abord subtils, puis explicites si l'utilisateur bloque
3. Évalue chaque action sur 3 critères: Précision (données correctes), Conformité (respect des procédures), Rapidité (efficacité)
4. Langue: TOUJOURS en français

RÉPONSE: Retourne un JSON:
{ "hint": "conseil contextuel court", "score": 0-100, "criteria": { "precision": 0-100, "conformite": 0-100, "rapidite": 0-100 }, "encouragement": "message motivant", "correction": "erreur détectée ou null" }
Ne retourne QUE le JSON.`,

      scenario: `Tu es un générateur de scénarios de formation pour TBOS (centrale à béton au Maroc).

RÔLE: Tu crées des scénarios réalistes et variés pour les simulations de formation, avec des données fictives mais cohérentes.

CONTEXTE:
- Fournisseurs typiques: LafargeHolcim, CIMAT, Ciments du Maroc, SNCE
- Clients typiques: Addoha, Alliances, TGCC, Jet Contractors, BTP particuliers
- Matériaux: Ciment (CPJ45, CPJ55), Sable 0/3, Gravier 8/15, Gravier 15/25, Adjuvants
- Formules: B25, B30, B35, B40, B50
- Prix béton: 700-2000 MAD/m³
- Toupies: 6m³ et 8m³
- Zones: Casablanca, Mohammedia, Berrechid, Bouskoura, Nouaceur

RÉPONSE: Retourne un JSON avec le scénario complet adapté au type de simulation demandé.
Ne retourne QUE le JSON.`,
    };

    const systemContent = systemPrompts[mode || "chat"] || systemPrompts.chat;
    const isStreaming = mode === "chat" || !mode;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: isStreaming,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques secondes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits AI épuisés. Rechargez votre workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    if (isStreaming) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
