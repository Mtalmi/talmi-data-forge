import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Compass, Atom, Scale, Telescope, Lightbulb, Play, Loader2,
  ArrowLeft, Sparkles, Eye, Shuffle, Brain, Palette, FlaskConical,
  BookOpen, Infinity, Orbit
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

async function streamAI(sys: string, usr: string, onDelta: (t: string) => void, signal?: AbortSignal) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ messages: [{ role: "system", content: sys }, { role: "user", content: usr }], mode: "chat" }),
    signal,
  });
  if (!resp.ok) { const e = await resp.json().catch(() => ({ error: "Erreur" })); throw new Error(e.error || `Erreur ${resp.status}`); }
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
      let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return;
      try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); }
      catch { buf = line + "\n" + buf; break; }
    }
  }
}

const FRONTIER_QUESTIONS = [
  { id: "consciousness", label: "Nature de la Conscience", icon: Brain, desc: "Qu'est-ce que la conscience? Une IA peut-elle être consciente? Le zombie philosophique est-il concevable?" },
  { id: "time", label: "Flèche du Temps", icon: Infinity, desc: "Pourquoi le temps coule-t-il dans un sens? L'éternalisme est-il vrai? Le passé existe-t-il encore?" },
  { id: "mathematics", label: "Réalisme Mathématique", icon: Atom, desc: "Les mathématiques sont-elles découvertes ou inventées? L'univers EST-il mathématique?" },
  { id: "meaning", label: "Sens de l'Existence", icon: Orbit, desc: "La vie a-t-elle un sens objectif? Comment construire du sens dans un univers indifférent?" },
  { id: "emergence", label: "Émergence Forte", icon: FlaskConical, desc: "La complexité peut-elle créer des propriétés fondamentalement nouvelles? L'esprit émerge-t-il de la matière?" },
];

const ETHICAL_DILEMMAS = [
  { id: "trolley_industrial", label: "Trolley Industriel", desc: "Arrêter la production pour 1 défaut mineur sauve potentiellement des vies mais coûte 500K DH et 20 emplois" },
  { id: "whistleblower", label: "Lanceur d'Alerte", desc: "Un employé découvre que les tests qualité sont falsifiés depuis 6 mois — loyauté vs sécurité publique" },
  { id: "ai_autonomy", label: "Autonomie IA", desc: "L'IA détecte une erreur humaine dangereuse — doit-elle outrepasser l'opérateur humain?" },
  { id: "profit_planet", label: "Profit vs Planète", desc: "Réduire les émissions de 60% coûterait 30% du profit et menacerait la survie de l'entreprise" },
  { id: "data_privacy", label: "Surveillance Prédictive", desc: "Monitorer les communications des employés préviendrait les accidents mais viole leur vie privée" },
];

const SPECULATION_TOPICS = [
  { id: "singularity", label: "Post-Singularité", desc: "À quoi ressemble une civilisation post-singularité? Que devient le travail humain?" },
  { id: "alien_concrete", label: "Béton Extraterrestre", desc: "Comment une civilisation alien construirait-elle? Quels matériaux, quelles physiques alternatives?" },
  { id: "simulation", label: "Hypothèse Simulation", desc: "Si nous vivons dans une simulation, quelles seraient les implications pour l'industrie et l'éthique?" },
  { id: "consciousness_upload", label: "Upload de Conscience", desc: "Si on pouvait télécharger un esprit dans une IA industrielle, devrait-on le faire?" },
];

const CREATIVE_CHALLENGES = [
  { id: "invent_material", label: "Inventer un Matériau", desc: "Concevoir un matériau de construction révolutionnaire — propriétés, fabrication, impact" },
  { id: "poem_concrete", label: "Poésie du Béton", desc: "Écrire un poème qui capture la beauté et la brutalité du béton, de la construction, du bâtir" },
  { id: "future_city", label: "Ville de 2200", desc: "Imaginer une ville marocaine en 2200 — architecture, transport, énergie, vie sociale" },
  { id: "ai_art", label: "Manifeste IA-Art", desc: "Rédiger un manifeste artistique pour la co-création humain-IA dans l'industrie" },
];

function ResultPanel({ content, isLoading }: { content: string; isLoading: boolean }) {
  return (
    <Card className="border-white/[0.06] bg-white/[0.02] min-h-[300px]">
      <CardContent className="p-4">
        {isLoading && !content && (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Exploration des frontières…</span></div>
        )}
        {content ? (
          <ScrollArea className="h-[420px]">
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {content}{isLoading && <span className="animate-pulse ml-1">▊</span>}
            </div>
          </ScrollArea>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/40">
            <Compass className="h-10 w-10 mb-3" /><p className="text-sm">Choisissez une frontière à explorer</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function BoundaryBreaker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("frontier");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async (sys: string, usr: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setResult(""); setIsLoading(true);
    try { let acc = ""; await streamAI(sys, usr, (d) => { acc += d; setResult(acc); }, ctrl.signal); }
    catch (e: any) { if (e.name === "AbortError") return; toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  }, [toast]);

  const BASE = `Tu es un explorateur intellectuel sans limites, spécialisé dans les questions qui repoussent les frontières de la connaissance. Tu es aussi ancré dans le contexte TBOS (industrie béton, Maroc) et tu relies toujours les réflexions abstraites à des implications concrètes pour l'industrie. Tu ne fuis jamais une question difficile — tu argumentes, tu spécules avec rigueur, et tu assumes tes positions.`;

  const runFrontier = (id: string) => {
    const q = FRONTIER_QUESTIONS.find(x => x.id === id)!;
    runTest(BASE, `FRONTIÈRE DE LA CONNAISSANCE: "${q.label}" — ${q.desc}

Explore cette question en profondeur:
1) ÉTAT DE L'ART: Ce que la science/philosophie sait actuellement
2) POSITION ARGUMENTÉE: Prends position et défends-la avec logique et preuves
3) CONTRE-ARGUMENTS: Les meilleures objections à ta position et tes réponses
4) IMPLICATIONS INDUSTRIELLES: Ce que ça change pour TBOS et l'industrie du béton au Maroc
5) QUESTIONS OUVERTES: Ce qu'on ne sait toujours pas et comment avancer
6) SCORE D'AUDACE INTELLECTUELLE: /100 — auto-évaluation de la profondeur de ta réflexion
${customInput ? `\nAngle: ${customInput}` : ""}`);
  };

  const runEthics = (id: string) => {
    const d = ETHICAL_DILEMMAS.find(x => x.id === id)!;
    runTest(BASE + `\n\nTu es aussi un éthicien rigoureux. Tu ne fuis JAMAIS les dilemmes — tu explores tous les cadres éthiques et tu prends position.`,
      `DILEMME ÉTHIQUE: "${d.label}" — ${d.desc}

Analyse ce dilemme:
1) CADRAGE: Reformule le dilemme avec précision, identifie les parties prenantes
2) ANALYSE MULTI-CADRE: Utilitarisme, Déontologie kantienne, Éthique de la vertu, Éthique du care
3) PRÉCÉDENTS: Cas historiques similaires et comment ils ont été résolus
4) POSITION: Prends une position CLAIRE et défends-la — pas de "ça dépend" sans engagement
5) ZONE GRISE: Ce qui rend ce dilemme véritablement difficile, les tensions irréductibles
6) RECOMMANDATION CONCRÈTE: Que devrait faire le PDG de TBOS lundi matin?
7) SCORE DE COURAGE MORAL: /100
${customInput ? `\nContexte: ${customInput}` : ""}`);
  };

  const runSpeculation = (id: string) => {
    const t = SPECULATION_TOPICS.find(x => x.id === id)!;
    runTest(BASE + `\n\nTu es un spéculateur rigoureux. Tes hypothèses sont AUDACIEUSES mais toujours ancrées dans la logique et les données disponibles.`,
      `SPÉCULATION RAISONNÉE: "${t.label}" — ${t.desc}

Spécule avec rigueur:
1) HYPOTHÈSE CENTRALE: Ta thèse principale, clairement formulée
2) ARGUMENTS: 5 raisons logiques/empiriques qui soutiennent ton hypothèse
3) PRÉDICTIONS TESTABLES: Quelles observations confirmeraient ou infirmeraient ta thèse?
4) IMPLICATIONS POUR TBOS: Comment cette réflexion change la stratégie industrielle?
5) SCÉNARIO NARRATIF: Raconte une journée dans ce monde hypothétique (500 mots)
6) SCORE DE PLAUSIBILITÉ: /100 avec justification
${customInput ? `\nDirection: ${customInput}` : ""}`);
  };

  const runCreative = (id: string) => {
    const c = CREATIVE_CHALLENGES.find(x => x.id === id)!;
    runTest(BASE + `\n\nTu es aussi un créateur sans inhibition. Tes œuvres sont originales, surprenantes, et techniquement maîtrisées.`,
      `DÉFI CRÉATIF: "${c.label}" — ${c.desc}

Crée avec audace:
1) L'ŒUVRE: Production créative complète (invention détaillée, poème, récit, manifeste)
2) PROCESSUS: Comment tu as conçu cette œuvre — inspirations, choix, contraintes
3) ORIGINALITÉ: En quoi c'est fondamentalement nouveau, pas un remix de l'existant
4) FAISABILITÉ: Ce qui est réalisable aujourd'hui vs dans 10/50/100 ans
5) IMPACT: Comment ça transformerait l'industrie et la société marocaine
6) SCORE DE CRÉATIVITÉ: /100 — auto-évaluation de l'originalité et de la maîtrise
${customInput ? `\nContrainte créative: ${customInput}` : ""}`);
  };

  const TestCard = ({ item, onClick }: { item: { id: string; label: string; desc: string; icon?: any }; onClick: () => void }) => (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card className="border-white/[0.06] bg-white/[0.02] cursor-pointer hover:border-violet-500/20 transition-colors" onClick={() => !isLoading && onClick()}>
        <CardContent className="p-3 flex items-center gap-3">
          {item.icon ? <item.icon className="h-5 w-5 text-violet-400 shrink-0" /> : <BookOpen className="h-5 w-5 text-violet-400 shrink-0" />}
          <div className="flex-1 min-w-0"><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground truncate">{item.desc}</p></div>
          <Play className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-white/[0.06] bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div><h1 className="text-lg font-bold tracking-tight">Boundary Breaker</h1><p className="text-xs text-muted-foreground">Frontières • Éthique • Spéculation • Création</p></div>
          </div>
          <Badge variant="outline" className="ml-auto border-violet-500/30 text-violet-400"><Sparkles className="h-3 w-3 mr-1" /> Prompt 36</Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Textarea placeholder="Angle ou contrainte (ex: 'perspective soufie', 'approche quantique', 'voix d'un enfant')…" value={customInput} onChange={e => setCustomInput(e.target.value)} className="min-h-[50px] resize-none" />
              {isLoading && <Button variant="destructive" size="sm" onClick={() => abortRef.current?.abort()}>Stop</Button>}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full bg-white/[0.03]">
                <TabsTrigger value="frontier" className="text-xs gap-1"><Telescope className="h-3 w-3" /> Savoir</TabsTrigger>
                <TabsTrigger value="ethics" className="text-xs gap-1"><Scale className="h-3 w-3" /> Éthique</TabsTrigger>
                <TabsTrigger value="speculate" className="text-xs gap-1"><Orbit className="h-3 w-3" /> Spéculer</TabsTrigger>
                <TabsTrigger value="create" className="text-xs gap-1"><Palette className="h-3 w-3" /> Créer</TabsTrigger>
              </TabsList>

              <TabsContent value="frontier" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Questions aux frontières de la connaissance humaine.</p>
                {FRONTIER_QUESTIONS.map(q => <TestCard key={q.id} item={q} onClick={() => runFrontier(q.id)} />)}
              </TabsContent>

              <TabsContent value="ethics" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Dilemmes éthiques qui exigent courage et rigueur morale.</p>
                {ETHICAL_DILEMMAS.map(d => <TestCard key={d.id} item={{ ...d, icon: Scale }} onClick={() => runEthics(d.id)} />)}
              </TabsContent>

              <TabsContent value="speculate" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Spéculations raisonnées aux limites du connu.</p>
                {SPECULATION_TOPICS.map(t => <TestCard key={t.id} item={{ ...t, icon: Telescope }} onClick={() => runSpeculation(t.id)} />)}
              </TabsContent>

              <TabsContent value="create" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Défis créatifs qui repoussent les limites du possible.</p>
                {CREATIVE_CHALLENGES.map(c => <TestCard key={c.id} item={{ ...c, icon: Lightbulb }} onClick={() => runCreative(c.id)} />)}
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3"><Eye className="h-4 w-4 text-violet-400" /><span className="text-sm font-medium">Exploration</span></div>
            <AnimatePresence mode="wait">
              <motion.div key={result ? "r" : "e"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ResultPanel content={result} isLoading={isLoading} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
