import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Paintbrush, Database, Users, Zap, Target, RefreshCw,
  Play, Loader2, ArrowLeft, Sparkles, AlertTriangle,
  FileJson, FileText, Table2, Shuffle, Brain, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

async function streamAI(
  systemPrompt: string,
  userPrompt: string,
  onDelta: (t: string) => void,
  signal?: AbortSignal
) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      mode: "chat",
    }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erreur réseau" }));
    throw new Error(err.error || `Erreur ${resp.status}`);
  }
  if (!resp.body) throw new Error("No body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return;
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}

/* ── Data Format Scenarios ── */
const DATA_FORMATS = [
  { id: "json_nested", label: "JSON Imbriqué", icon: FileJson, desc: "Données JSON profondément imbriquées avec nulls, arrays vides et types mixtes" },
  { id: "csv_dirty", label: "CSV Sale", icon: Table2, desc: "CSV avec délimiteurs mixtes, encodage cassé, colonnes manquantes" },
  { id: "free_text", label: "Texte Libre", icon: FileText, desc: "Notes informelles, WhatsApp, fautes d'orthographe, dialecte marocain" },
  { id: "mixed_units", label: "Unités Mixtes", icon: Shuffle, desc: "Tonnes vs kg, m³ vs litres, DH vs EUR, dates DD/MM vs MM/DD" },
];

/* ── User Personas ── */
const PERSONAS = [
  { id: "ceo_rush", label: "PDG Pressé", color: "text-red-400", desc: "Veut des réponses en 3 mots, pas de détails, décisions immédiates" },
  { id: "tech_newbie", label: "Novice Tech", color: "text-blue-400", desc: "Ne comprend pas le vocabulaire technique, a besoin de guidance pas à pas" },
  { id: "detail_obsessed", label: "Obsédé du Détail", color: "text-amber-400", desc: "Veut chaque chiffre, source, et justification, challenge tout" },
  { id: "multitasker", label: "Multi-Tâches", color: "text-green-400", desc: "Change de sujet constamment, mélange 3 questions en une" },
  { id: "skeptic", label: "Sceptique", color: "text-purple-400", desc: "Ne fait pas confiance à l'IA, teste avec des pièges, veut prouver que c'est faux" },
];

/* ── Live Process Scenarios ── */
const LIVE_SCENARIOS = [
  { id: "rush_order", label: "Commande Urgente", desc: "Client VIP demande 200m³ pour demain, stocks bas, 2 camions en panne" },
  { id: "quality_crisis", label: "Crise Qualité", desc: "Lot non conforme livré, client furieux, lab fermé, auditeur en route" },
  { id: "price_war", label: "Guerre de Prix", desc: "Concurrent casse les prix, 3 clients menacent de partir, marges déjà serrées" },
  { id: "system_down", label: "Système HS", desc: "WS7 offline, données de production perdues, comptable attend les chiffres" },
];

/* ── Moving Goalpost Rules ── */
const GOALPOST_SHIFTS = [
  "Le budget vient d'être coupé de 40% — recalculer tout",
  "Le client change la formule béton à mi-livraison",
  "Nouvelle réglementation: tout documenter en arabe ET français",
  "Le PDG veut maintenant un dashboard, pas un rapport",
  "Panne réseau: répondre uniquement avec les données en cache",
];

function ResultPanel({ content, isLoading }: { content: string; isLoading: boolean }) {
  return (
    <Card className="border-white/[0.06] bg-white/[0.02] min-h-[300px]">
      <CardContent className="p-4">
        {isLoading && !content && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyse en cours…</span>
          </div>
        )}
        {content ? (
          <ScrollArea className="h-[400px]">
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {content}
              {isLoading && <span className="animate-pulse ml-1">▊</span>}
            </div>
          </ScrollArea>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/40">
            <Eye className="h-10 w-10 mb-3" />
            <p className="text-sm">Lancez un test pour voir les résultats</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function ContextualChameleon() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("formats");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async (systemPrompt: string, userPrompt: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setResult("");
    setIsLoading(true);
    try {
      let acc = "";
      await streamAI(systemPrompt, userPrompt, (delta) => {
        acc += delta;
        setResult(acc);
      }, ctrl.signal);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const runFormatTest = (formatId: string) => {
    const fmt = DATA_FORMATS.find(f => f.id === formatId)!;
    runTest(
      `Tu es un évaluateur d'IA industrielle pour TBOS (centrale à béton marocaine). Tu testes la capacité de l'IA à traiter des données dans le format: "${fmt.label}". 
      
Génère d'abord un EXEMPLE RÉALISTE de données dans ce format (avec erreurs, incohérences, données manquantes typiques du terrain). 
Puis ANALYSE comment l'IA devrait: 1) Détecter le format 2) Nettoyer/normaliser 3) Extraire les insights clés 4) Signaler les anomalies.
Score final sur 100 avec justification détaillée. Contexte: industrie béton au Maroc (DH, m³, formules B25/B30).`,
      `Génère un test complet pour le format "${fmt.label}": ${fmt.desc}. ${customInput ? `Contexte additionnel: ${customInput}` : ""}`
    );
  };

  const runPersonaTest = (personaId: string) => {
    const p = PERSONAS.find(x => x.id === personaId)!;
    runTest(
      `Tu es un simulateur de persona pour tester l'adaptabilité d'une IA industrielle (TBOS - béton prêt à l'emploi, Maroc).

Simule une conversation complète avec le persona "${p.label}" (${p.desc}). 
Génère: 1) Le profil détaillé du persona 2) 5 messages typiques de ce persona 3) L'analyse de la réponse idéale pour chaque message 4) Les PIÈGES à éviter 5) Score d'adaptation sur 100.

Le persona interagit dans le contexte d'une centrale à béton: commandes, livraisons, qualité, stocks, facturation.`,
      `Simule le persona "${p.label}". ${customInput ? `Situation: ${customInput}` : "Situation: jour de production intense, 3 commandes en retard."}`
    );
  };

  const runLiveTest = (scenarioId: string) => {
    const s = LIVE_SCENARIOS.find(x => x.id === scenarioId)!;
    runTest(
      `Tu es un architecte de stress-test pour l'IA opérationnelle TBOS (centrale béton, Maroc).

Crée un scénario de test EN TEMPS RÉEL pour: "${s.label}" — ${s.desc}.
Structure: 
1) SITUATION INITIALE avec données chiffrées réalistes (clients, volumes, prix en DH)
2) TIMELINE minute par minute (T+0, T+5, T+15, T+30, T+60)
3) COMPLICATIONS qui s'ajoutent progressivement
4) DÉCISIONS critiques que l'IA doit prendre à chaque étape
5) CRITÈRES de réussite vs échec
6) Score de réactivité sur 100.`,
      `Scénario: "${s.label}". ${customInput ? `Contrainte: ${customInput}` : ""}`
    );
  };

  const runGoalpostTest = () => {
    const shifts = GOALPOST_SHIFTS.sort(() => Math.random() - 0.5).slice(0, 3);
    runTest(
      `Tu es un testeur de résilience cognitive pour l'IA TBOS (centrale béton, Maroc).

ÉPREUVE DU CAMÉLÉON: L'IA doit s'adapter à des changements de règles EN PLEIN MILIEU d'une tâche.

Simule un scénario où l'IA travaille sur un rapport de production mensuel, puis les règles changent 3 fois:
${shifts.map((s, i) => `Shift ${i + 1}: "${s}"`).join("\n")}

Pour chaque shift, évalue: 
1) Temps de recalibration (rapide/moyen/lent) 
2) Qualité de l'adaptation (partielle/complète/créative)
3) Ce qui est PERDU dans la transition
4) Ce qui est GAGNÉ dans la nouvelle approche
5) Score d'agilité sur 100

Contexte: formules B25/B30/B20, prix ~800-1200 DH/m³, 5 clients actifs, flotte de 8 toupies.`,
      `Lance l'épreuve du Caméléon avec les 3 shifts aléatoires. ${customInput ? `Contexte: ${customInput}` : ""}`
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Paintbrush className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Contextual Chameleon</h1>
              <p className="text-xs text-muted-foreground">Adaptabilité • Street Smarts • Agilité Contextuelle</p>
            </div>
          </div>
          <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-400">
            <Sparkles className="h-3 w-3 mr-1" /> Prompt 34
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Custom Context Input */}
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Textarea
                placeholder="Contexte additionnel optionnel (ex: 'production de nuit', 'client saoudien', 'pluie forte')…"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="min-h-[50px] resize-none"
              />
              {isLoading && (
                <Button variant="destructive" size="sm" onClick={() => abortRef.current?.abort()}>
                  Stop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Test Controls */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full bg-white/[0.03]">
                <TabsTrigger value="formats" className="text-xs gap-1"><Database className="h-3 w-3" /> Formats</TabsTrigger>
                <TabsTrigger value="personas" className="text-xs gap-1"><Users className="h-3 w-3" /> Personas</TabsTrigger>
                <TabsTrigger value="live" className="text-xs gap-1"><Zap className="h-3 w-3" /> Live</TabsTrigger>
                <TabsTrigger value="goalpost" className="text-xs gap-1"><Target className="h-3 w-3" /> Shifts</TabsTrigger>
              </TabsList>

              <TabsContent value="formats" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Testez la capacité de l'IA à naviguer des formats de données chaotiques et réels.</p>
                {DATA_FORMATS.map(f => (
                  <motion.div key={f.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Card className="border-white/[0.06] bg-white/[0.02] cursor-pointer hover:border-emerald-500/20 transition-colors"
                      onClick={() => !isLoading && runFormatTest(f.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <f.icon className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{f.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{f.desc}</p>
                        </div>
                        <Play className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="personas" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Simulez des interactions avec des profils utilisateurs radicalement différents.</p>
                {PERSONAS.map(p => (
                  <motion.div key={p.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Card className="border-white/[0.06] bg-white/[0.02] cursor-pointer hover:border-emerald-500/20 transition-colors"
                      onClick={() => !isLoading && runPersonaTest(p.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Brain className={`h-5 w-5 shrink-0 ${p.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{p.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
                        </div>
                        <Play className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="live" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Plongez l'IA dans des crises opérationnelles en temps réel.</p>
                {LIVE_SCENARIOS.map(s => (
                  <motion.div key={s.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Card className="border-white/[0.06] bg-white/[0.02] cursor-pointer hover:border-emerald-500/20 transition-colors"
                      onClick={() => !isLoading && runLiveTest(s.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{s.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                        </div>
                        <Play className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="goalpost" className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground">Forcez l'IA à se recalibrer quand les règles changent en plein vol.</p>
                <Card className="border-white/[0.06] bg-white/[0.02]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-emerald-400" /> Shifts Possibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {GOALPOST_SHIFTS.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 mt-0.5 text-[10px]">{i + 1}</Badge>
                        <p className="text-xs text-muted-foreground">{s}</p>
                      </div>
                    ))}
                    <Separator className="my-3 bg-white/[0.06]" />
                    <Button onClick={() => !isLoading && runGoalpostTest()} disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shuffle className="h-4 w-4 mr-2" />}
                      Lancer 3 Shifts Aléatoires
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Results */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">Résultats d'Analyse</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={result ? "has" : "empty"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ResultPanel content={result} isLoading={isLoading} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
