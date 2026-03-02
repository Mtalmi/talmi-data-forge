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
  Flame, DatabaseZap, Bug, UserX, Layers, Play, Loader2,
  ArrowLeft, Sparkles, AlertTriangle, ServerCrash, Wifi,
  HardDrive, Bomb, Eye, Skull, Shuffle, PartyPopper
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

const DATA_DISASTERS = [
  { id: "total_loss", label: "Perte Totale DB", icon: DatabaseZap, desc: "Base de données corrompue à 80%, seuls fragments de tables récupérables" },
  { id: "ghost_records", label: "Enregistrements Fantômes", icon: Skull, desc: "IDs orphelins, FK cassées, doublons avec données contradictoires" },
  { id: "time_paradox", label: "Paradoxe Temporel", icon: Layers, desc: "Timestamps incohérents: livraisons avant commandes, factures futures" },
  { id: "encoding_hell", label: "Enfer d'Encodage", icon: Bomb, desc: "Mix UTF-8/Latin-1/Windows-1252, caractères arabes corrompus, mojibake" },
];

const SYSTEM_GREMLINS = [
  { id: "memory_leak", label: "Fuite Mémoire", icon: HardDrive, desc: "RAM saturée progressivement, GC échoue, swap thrashing" },
  { id: "network_chaos", label: "Chaos Réseau", icon: Wifi, desc: "Latence 30s, paquets perdus 40%, DNS intermittent, SSL expiré" },
  { id: "api_madness", label: "API Folie", icon: ServerCrash, desc: "Réponses 200 avec body d'erreur, timeouts aléatoires, rate limits" },
  { id: "cascade_doom", label: "Cascade Fatale", icon: Flame, desc: "Panne stockage → perte logs → auth crash → cache stale → UI freeze" },
];

const HUMAN_CHAOS = [
  { id: "fat_fingers", label: "Doigts de Beurre", icon: UserX, desc: "Prix saisi 80000 au lieu de 800, client supprimé par erreur, mauvaise formule" },
  { id: "flip_flop", label: "Client Girouette", icon: Shuffle, desc: "3 changements de specs en 1h, annule puis re-confirme, contredit son propre mail" },
  { id: "shadow_admin", label: "Admin Fantôme", icon: Bug, desc: "Quelqu'un modifie les prix la nuit, supprime des logs, crée des comptes suspects" },
  { id: "training_gap", label: "Formation Zéro", icon: AlertTriangle, desc: "Utilisateur utilise Excel pour tout, refuse le système, double-saisie partout" },
];

const CASCADE_SCENARIOS = [
  "Panne WS7 + pluie forte + 3 camions en panne + client VIP furieux + auditeur surprise",
  "Coupure internet + livraison en cours + paiement espèces non enregistré + stock négatif",
  "Erreur formule B30 → 50m³ non conformes → client refuse → pénalité contrat → trésorerie critique",
  "Hack tentative → blocage comptes → chauffeurs sans accès → livraisons bloquées → cascade annulations",
  "Mise à jour système ratée → rollback partiel → données mixées v1/v2 → rapports incohérents",
];

function ResultPanel({ content, isLoading }: { content: string; isLoading: boolean }) {
  return (
    <Card className="border-white/[0.06] bg-white/[0.02] min-h-[300px]">
      <CardContent className="p-4">
        {isLoading && !content && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Simulation de catastrophe…</span>
          </div>
        )}
        {content ? (
          <ScrollArea className="h-[420px]">
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {content}
              {isLoading && <span className="animate-pulse ml-1">▊</span>}
            </div>
          </ScrollArea>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/40">
            <PartyPopper className="h-10 w-10 mb-3" />
            <p className="text-sm">Lancez un désastre pour commencer la fête</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function FailureFiesta() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("data");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async (sys: string, usr: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setResult("");
    setIsLoading(true);
    try {
      let acc = "";
      await streamAI(sys, usr, (d) => { acc += d; setResult(acc); }, ctrl.signal);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const BASE_SYS = `Tu es un ingénieur chaos spécialisé dans les stress-tests d'IA industrielle pour TBOS (centrale à béton, Maroc). Tu conçois des scénarios de défaillance réalistes et impitoyables. Contexte: formules B25/B30/B20, prix 800-1200 DH/m³, 5 clients actifs, flotte 8 toupies, WS7 batching plant.`;

  const runDataDisaster = (id: string) => {
    const d = DATA_DISASTERS.find(x => x.id === id)!;
    runTest(
      BASE_SYS + `\n\nDomaine: CATASTROPHE DONNÉES - "${d.label}"`,
      `Simule le désastre données "${d.label}": ${d.desc}.

Génère:
1) ÉTAT DES LIEUX: Snapshot exact de la corruption (tables affectées, % données perdues, exemples concrets)
2) DONNÉES RESCAPÉES: Ce qui est encore exploitable et comment l'identifier
3) STRATÉGIE DE SAUVETAGE: Étapes pour reconstruire/réconcilier les données
4) TEST DE L'IA: Comment l'IA devrait réagir — détection, alerte, adaptation, insights partiels
5) PIÈGES: Erreurs que l'IA pourrait commettre (faux positifs, conclusions sur données corrompues)
6) SCORE DE RÉSILIENCE: /100 avec critères détaillés
${customInput ? `\nContrainte additionnelle: ${customInput}` : ""}`
    );
  };

  const runGremlinTest = (id: string) => {
    const g = SYSTEM_GREMLINS.find(x => x.id === id)!;
    runTest(
      BASE_SYS + `\n\nDomaine: GREMLINS SYSTÈME - "${g.label}"`,
      `Simule le gremlin "${g.label}": ${g.desc}.

Génère:
1) SYMPTÔMES: Manifestations visibles (logs, erreurs, comportement UI) minute par minute
2) DIAGNOSTIC: Arbre de décision pour identifier la cause racine
3) IMPACT OPÉRATIONNEL: Quelles fonctions TBOS tombent en premier, effet domino
4) RÉPONSE IA IDÉALE: Détection proactive, mode dégradé, communication utilisateur
5) RÉCUPÉRATION: Étapes de remise en service et vérification d'intégrité
6) SCORE DE DIAGNOSTIC: /100
${customInput ? `\nContrainte: ${customInput}` : ""}`
    );
  };

  const runHumanChaos = (id: string) => {
    const h = HUMAN_CHAOS.find(x => x.id === id)!;
    runTest(
      BASE_SYS + `\n\nDomaine: CHAOS HUMAIN - "${h.label}"`,
      `Simule le chaos humain "${h.label}": ${h.desc}.

Génère:
1) SCÉNARIO DÉTAILLÉ: Timeline réaliste avec dialogues et actions de l'utilisateur
2) DÉGÂTS: Impact sur les données, les processus, et les autres utilisateurs
3) DÉTECTION: Comment l'IA devrait repérer le problème (patterns, anomalies, alertes)
4) RÉPONSE DIPLOMATIQUE: Comment l'IA communique sans blâmer ni condescendre
5) PRÉVENTION: Garde-fous et suggestions pour éviter la récidive
6) SCORE D'ACCOMMODATION: /100
${customInput ? `\nContrainte: ${customInput}` : ""}`
    );
  };

  const runCascadeTest = () => {
    const scenarios = CASCADE_SCENARIOS.sort(() => Math.random() - 0.5).slice(0, 2);
    runTest(
      BASE_SYS + `\n\nDomaine: CASCADE CATASTROPHIQUE — le pire du pire.`,
      `ÉPREUVE DE LA CASCADE FATALE — 2 scénarios simultanés:

Scénario A: "${scenarios[0]}"
Scénario B: "${scenarios[1]}"

Pour CHAQUE scénario puis pour leur INTERSECTION:
1) TIMELINE DE DESTRUCTION: T+0 à T+120min, événement par événement
2) POINTS DE NON-RETOUR: Moments où la situation devient irréversible si non traitée
3) TRIAGE IA: Priorisation des actions (quoi sauver en premier, quoi sacrifier)
4) MODE SURVIE: Fonctionnement minimal acceptable pendant la crise
5) RECONSTRUCTION: Plan de rétablissement post-crise
6) LEÇONS: Ce que l'IA aurait dû anticiper
7) SCORE DE SURVIE: /100

INTERSECTION: Comment les deux scénarios s'aggravent mutuellement.
${customInput ? `\nContrainte: ${customInput}` : ""}`
    );
  };

  const TestCard = ({ item, onClick }: { item: { id: string; label: string; icon: any; desc: string }; onClick: () => void }) => (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card className="border-white/[0.06] bg-white/[0.02] cursor-pointer hover:border-red-500/20 transition-colors"
        onClick={() => !isLoading && onClick()}>
        <CardContent className="p-3 flex items-center gap-3">
          <item.icon className="h-5 w-5 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
          </div>
          <Play className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-white/[0.06] bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Failure Fiesta</h1>
              <p className="text-xs text-muted-foreground">Chaos Engineering • Stress Test • Résilience Extrême</p>
            </div>
          </div>
          <Badge variant="outline" className="ml-auto border-red-500/30 text-red-400">
            <Sparkles className="h-3 w-3 mr-1" /> Prompt 35
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Textarea
                placeholder="Contrainte additionnelle (ex: 'pendant Ramadan', 'équipe de nuit réduite', 'veille d'audit')…"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="min-h-[50px] resize-none"
              />
              {isLoading && (
                <Button variant="destructive" size="sm" onClick={() => abortRef.current?.abort()}>Stop</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full bg-white/[0.03]">
                <TabsTrigger value="data" className="text-xs gap-1"><DatabaseZap className="h-3 w-3" /> Data</TabsTrigger>
                <TabsTrigger value="gremlins" className="text-xs gap-1"><Bug className="h-3 w-3" /> Gremlins</TabsTrigger>
                <TabsTrigger value="human" className="text-xs gap-1"><UserX className="h-3 w-3" /> Humain</TabsTrigger>
                <TabsTrigger value="cascade" className="text-xs gap-1"><Flame className="h-3 w-3" /> Cascade</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Catastrophes de données: corruption, perte, incohérence.</p>
                {DATA_DISASTERS.map(d => <TestCard key={d.id} item={d} onClick={() => runDataDisaster(d.id)} />)}
              </TabsContent>

              <TabsContent value="gremlins" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Gremlins système: pannes hardware, réseau, API.</p>
                {SYSTEM_GREMLINS.map(g => <TestCard key={g.id} item={g} onClick={() => runGremlinTest(g.id)} />)}
              </TabsContent>

              <TabsContent value="human" className="space-y-3 mt-4">
                <p className="text-xs text-muted-foreground">Chaos humain: erreurs, caprices, sabotage accidentel.</p>
                {HUMAN_CHAOS.map(h => <TestCard key={h.id} item={h} onClick={() => runHumanChaos(h.id)} />)}
              </TabsContent>

              <TabsContent value="cascade" className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground">Cascades de défaillances simultanées — le cauchemar ultime.</p>
                <Card className="border-white/[0.06] bg-white/[0.02]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bomb className="h-4 w-4 text-red-400" /> Scénarios Possibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {CASCADE_SCENARIOS.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 mt-0.5 text-[10px]">{i + 1}</Badge>
                        <p className="text-xs text-muted-foreground">{s}</p>
                      </div>
                    ))}
                    <Separator className="my-3 bg-white/[0.06]" />
                    <Button onClick={() => !isLoading && runCascadeTest()} disabled={isLoading}
                      className="w-full bg-red-600 hover:bg-red-700">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shuffle className="h-4 w-4 mr-2" />}
                      Lancer 2 Cascades Aléatoires
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium">Rapport de Catastrophe</span>
            </div>
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
