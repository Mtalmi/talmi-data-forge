import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Database, Search, Cpu, RotateCcw, Play, Loader2, Sparkles,
  TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Layers,
  Gauge, FlaskConical, Factory, ShoppingCart, Lightbulb,
  CheckCircle2, AlertTriangle, Target, Workflow, Zap
} from 'lucide-react';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function streamAI(prompt: string, onDelta: (t: string) => void, signal?: AbortSignal) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'chat' }),
    signal,
  });
  if (!resp.ok || !resp.body) throw new Error(`Error ${resp.status}`);
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let ni: number;
    while ((ni = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, ni);
      buf = buf.slice(ni + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ') || line.trim() === '') continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') return;
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { buf = line + '\n' + buf; break; }
    }
  }
}

// ─── Data Synthesis Hub ──────────────────────────────────────
function DataSynthesisHub() {
  const domains = [
    { id: 'rnd', name: 'R&D / Formulation', icon: FlaskConical, records: '12.4K', freshness: '2min', health: 97 },
    { id: 'prod', name: 'Production & Quality', icon: Factory, records: '89.2K', freshness: '< 1min', health: 99 },
    { id: 'supply', name: 'Supply Chain', icon: Layers, records: '34.7K', freshness: '5min', health: 94 },
    { id: 'market', name: 'Marché & Ventes', icon: ShoppingCart, records: '45.1K', freshness: '15min', health: 91 },
    { id: 'finance', name: 'Finance & Coûts', icon: TrendingUp, records: '28.3K', freshness: '1h', health: 88 },
    { id: 'fleet', name: 'Flotte & Logistique', icon: Gauge, records: '67.8K', freshness: '< 1min', health: 96 },
  ];

  const [selected, setSelected] = useState<string[]>(['prod', 'supply']);
  const [synthesis, setSynthesis] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const synthesize = useCallback(async () => {
    if (!selected.length) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setSynthesis('');
    setLoading(true);
    const names = domains.filter(d => selected.includes(d.id)).map(d => d.name);
    try {
      await streamAI(
        `Tu es l'Optimiseur Omniscient de TBOS (centrale à béton, Maroc, ~50 camions, CA ~80M MAD).

MISSION: Synthèse cross-domaine des données suivantes: ${names.join(', ')}

Fournis:
1. 🔗 CORRÉLATIONS CACHÉES — Liens non-évidents entre ces domaines (min 3)
2. 💎 OPPORTUNITÉS — Optimisations identifiées grâce au croisement de données
3. ⚠️ RISQUES SYSTÉMIQUES — Vulnérabilités détectées par l'analyse multi-domaine
4. 📊 MÉTRIQUES CLÉS — KPIs cross-domaine à surveiller
5. 🎯 ACTIONS PRIORITAIRES — Top 3 actions à impact immédiat

Sois un data scientist senior. Précis, chiffré, actionnable. Français.`,
        (t) => setSynthesis(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setSynthesis(p => p + '\n\n❌ Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Sources de Données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {domains.map(d => (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${selected.includes(d.id) ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selected.includes(d.id) ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <d.icon className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="text-xs font-medium">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{d.records}</span>
                  <Badge variant={d.health > 95 ? 'default' : 'secondary'} className="text-[9px] h-4">{d.health}%</Badge>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 ml-5">Fraîcheur: {d.freshness}</div>
            </button>
          ))}
          <Button onClick={synthesize} disabled={loading || !selected.length} className="w-full mt-3" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Synthétiser ({selected.length} sources)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400" />
            Synthèse Cross-Domaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[370px]">
            {synthesis ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{synthesis}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Database className="w-8 h-8 opacity-30" />
                <span>Sélectionnez des sources et lancez la synthèse</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Pattern Discovery ───────────────────────────────────────
function PatternDiscovery() {
  const [patterns] = useState([
    { id: '1', category: 'production', title: 'Corrélation Température → Slump', desc: 'Chaque +5°C ambiant réduit l\'affaissement de 12mm en moyenne. Impact qualité détecté sur 847 BLs.', impact: 'high', confidence: 92 },
    { id: '2', category: 'finance', title: 'Cycle Paiement Sectoriel', desc: 'Clients BTP résidentiel: DSO moyen 67j vs 42j pour infrastructure publique. Delta = 1.2M MAD trésorerie.', impact: 'high', confidence: 88 },
    { id: '3', category: 'logistics', title: 'Fenêtre Optimale Livraison', desc: 'Les livraisons entre 7h-9h30 ont 23% moins de temps d\'attente chantier vs après-midi.', impact: 'medium', confidence: 85 },
    { id: '4', category: 'supply', title: 'Lead Time Fournisseur Drift', desc: 'Le délai moyen ciment CPJ45 a glissé de 3j à 5.2j sur 6 mois. Risque rupture stock x2.', impact: 'critical', confidence: 79 },
    { id: '5', category: 'market', title: 'Saisonnalité Formule BHP', desc: 'Demande BHP25/30 +35% en Q1 (saison construction). Opportunité pricing dynamique.', impact: 'medium', confidence: 91 },
  ]);

  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const explore = useCallback(async (p: typeof patterns[0]) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setSelectedId(p.id);
    setAnalysis('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Optimiseur Omniscient. Analyse approfondie de ce pattern découvert:

CATÉGORIE: ${p.category}
TITRE: ${p.title}
DESCRIPTION: ${p.desc}
IMPACT: ${p.impact} | CONFIANCE: ${p.confidence}%

Fournis:
1. 🔬 ANALYSE RACINE — Pourquoi ce pattern existe
2. 💰 QUANTIFICATION — Impact financier estimé (MAD/an)
3. ⚡ OPTIMISATION — Comment exploiter ce pattern
4. 🔄 MONITORING — Comment suivre l'évolution
5. 🎯 ACTION IMMÉDIATE — Prochaine étape concrète

Français, chiffré, actionnable.`,
        (t) => setAnalysis(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setAnalysis(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, []);

  const impactColor = (i: string) => i === 'critical' ? 'text-red-400' : i === 'high' ? 'text-amber-400' : 'text-blue-400';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Patterns Découverts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            <div className="space-y-2">
              {patterns.map(p => (
                <button
                  key={p.id}
                  onClick={() => explore(p)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedId === p.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{p.title}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] h-4">{p.confidence}%</Badge>
                      <AlertTriangle className={`w-3 h-3 ${impactColor(p.impact)}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{p.desc}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Analyse & Optimisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {analysis ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{analysis}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Search className="w-8 h-8 opacity-30" />
                <span>Cliquez sur un pattern pour l'analyser</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Lifecycle Optimizer ─────────────────────────────────────
function LifecycleOptimizer() {
  const stages = [
    { id: 'ideation', name: 'Idéation', icon: Lightbulb, status: 'active' as const },
    { id: 'design', name: 'Conception', icon: FlaskConical, status: 'active' as const },
    { id: 'validation', name: 'Validation', icon: CheckCircle2, status: 'active' as const },
    { id: 'execution', name: 'Exécution', icon: Factory, status: 'active' as const },
    { id: 'scaling', name: 'Scale-Up', icon: TrendingUp, status: 'pending' as const },
  ];

  const [selectedStage, setSelectedStage] = useState(stages[0]);
  const [optimization, setOptimization] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const optimize = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setOptimization('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Optimiseur Omniscient de TBOS (centrale à béton, Maroc).

MISSION: Optimiser la phase "${selectedStage.name}" du cycle d'innovation industriel.

Contexte TBOS: Production béton ~500m³/jour, 12 formules actives, 50 camions, 200+ clients BTP.

Fournis pour cette phase:
1. 📋 ÉTAT ACTUEL — Évaluation de la maturité (score /10)
2. 🔧 OPTIMISATIONS — 5 améliorations concrètes classées par ROI
3. 🤖 AUTOMATISATION — Ce qui peut être automatisé par l'IA
4. 📊 KPIs — 3 métriques de suivi avec cibles
5. ⏱️ TIMELINE — Plan d'implémentation sur 90 jours
6. 💰 ROI ESTIMÉ — Gain attendu (MAD/an)

Sois un consultant innovation industrielle senior. Français.`,
        (t) => setOptimization(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setOptimization(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selectedStage]);

  return (
    <div className="space-y-4">
      {/* Pipeline */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-1">
            {stages.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  onClick={() => setSelectedStage(s)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all flex-1 ${selectedStage.id === s.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
                >
                  <s.icon className={`w-5 h-5 ${selectedStage.id === s.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-[10px] font-mono font-medium">{s.name}</span>
                </button>
                {i < stages.length - 1 && <Zap className="w-3 h-3 text-muted-foreground/30 mx-1 shrink-0" />}
              </div>
            ))}
          </div>
          <Button onClick={optimize} disabled={loading} className="w-full mt-3" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cpu className="w-4 h-4 mr-2" />}
            Optimiser: {selectedStage.name}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Workflow className="w-4 h-4 text-amber-400" />
            Plan d'Optimisation — {selectedStage.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[340px]">
            {optimization ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{optimization}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Cpu className="w-8 h-8 opacity-30" />
                <span>Sélectionnez une phase et lancez l'optimisation</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Feedback Loop ───────────────────────────────────────────
function FeedbackLoop() {
  const [feedback, setFeedback] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const [history] = useState([
    { id: '1', input: 'Réduction ciment -3% sur BHP25', result: 'Résistance maintenue à 28j. Économie 45K MAD/mois.', status: 'success' as const },
    { id: '2', input: 'Livraison nuit 22h-6h', result: 'Temps rotation -40% mais coûts RH +25%. Net négatif.', status: 'revised' as const },
    { id: '3', input: 'Pricing dynamique zone Nord', result: 'CA +8% mais perte 2 clients. Ajustement seuil en cours.', status: 'learning' as const },
  ]);

  const submit = useCallback(async () => {
    if (!feedback.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResponse('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Optimiseur Omniscient en mode apprentissage continu. Un utilisateur te donne ce feedback terrain:

FEEDBACK: ${feedback}

HISTORIQUE RÉCENT:
${history.map(h => `- "${h.input}" → ${h.result} (${h.status})`).join('\n')}

Réagis:
1. 🧠 INTÉGRATION — Comment ce feedback change tes modèles
2. 🔄 RECALIBRATION — Quelles prédictions doivent être ajustées
3. 📈 AMÉLIORATION — Score de précision avant/après intégration
4. 💡 NOUVELLE HYPOTHÈSE — Ce que ce feedback te suggère de tester
5. ✅ CONFIRMATION — Prochaine recommandation mise à jour

Montre que tu apprends et t'améliores. Français.`,
        (t) => setResponse(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResponse(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [feedback, history]);

  const statusIcon = (s: string) => s === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : s === 'revised' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-400" /> : <RotateCcw className="w-3.5 h-3.5 text-blue-400" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-400" />
            Boucle de Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-[10px] text-muted-foreground font-mono uppercase mb-2 block">Historique d'Apprentissage</span>
            <div className="space-y-1.5">
              {history.map(h => (
                <div key={h.id} className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-1">
                    {statusIcon(h.status)}
                    <span className="text-[10px] font-semibold">{h.input}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-5">{h.result}</p>
                </div>
              ))}
            </div>
          </div>
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Partagez un résultat terrain, une correction, ou une observation..."
            className="text-xs min-h-[70px] bg-muted/30"
          />
          <Button onClick={submit} disabled={loading || !feedback.trim()} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Soumettre le Feedback
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            Recalibration du Modèle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {response ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{response}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <RotateCcw className="w-8 h-8 opacity-30" />
                <span>Soumettez un feedback pour voir la recalibration</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function OmniscientOptimizer() {
  const [activeTab, setActiveTab] = useState('synthesis');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Omniscient Optimizer</h1>
            <p className="text-xs text-muted-foreground">Synthétiser, Découvrir, Optimiser, Apprendre — le cycle complet</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Moteur Actif</span>
          </div>
          <span>6 domaines connectés</span>
          <span>277K enregistrements indexés</span>
          <span>5 patterns actifs</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="synthesis" className="text-xs font-mono gap-1.5">
            <Database className="w-3.5 h-3.5" /> Synthèse
          </TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs font-mono gap-1.5">
            <Search className="w-3.5 h-3.5" /> Patterns
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="text-xs font-mono gap-1.5">
            <Workflow className="w-3.5 h-3.5" /> Lifecycle
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs font-mono gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Feedback
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="synthesis" className="mt-4"><DataSynthesisHub /></TabsContent>
            <TabsContent value="patterns" className="mt-4"><PatternDiscovery /></TabsContent>
            <TabsContent value="lifecycle" className="mt-4"><LifecycleOptimizer /></TabsContent>
            <TabsContent value="feedback" className="mt-4"><FeedbackLoop /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
