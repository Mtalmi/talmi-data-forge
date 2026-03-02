import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Compass, Telescope, FlaskConical, Map, Play, Loader2, Sparkles,
  Target, TrendingUp, Shield, Swords, Eye, Lightbulb, Crown,
  ArrowRight, CheckCircle2, AlertTriangle, BarChart3, Layers, Zap
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

// ─── Strategic Context Scanner ───────────────────────────────
function StrategicContextScanner() {
  const dimensions = [
    { id: 'market', name: 'Dynamique Marché', icon: TrendingUp, desc: 'Croissance BTP, tendances régionales, réglementations' },
    { id: 'competition', name: 'Paysage Concurrentiel', icon: Swords, desc: 'Positionnement, forces/faiblesses, mouvements récents' },
    { id: 'internal', name: 'Capacités Internes', icon: Shield, desc: 'Actifs différenciants, compétences clés, gaps' },
    { id: 'disruption', name: 'Signaux Faibles', icon: Telescope, desc: 'Technologies émergentes, ruptures possibles, wildcards' },
  ];

  const [selected, setSelected] = useState<string[]>(['market', 'competition']);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const scan = useCallback(async () => {
    if (!selected.length) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    const names = dimensions.filter(d => selected.includes(d.id)).map(d => `${d.name} (${d.desc})`);
    try {
      await streamAI(
        `Tu es le Visionary Strategist de TBOS — centrale à béton au Maroc (Rabat-Salé), ~500m³/jour, 50 camions, CA ~80M MAD, 200+ clients BTP.

MISSION: Scan stratégique approfondi des dimensions: ${names.join('; ')}

Pour CHAQUE dimension sélectionnée:
1. 📊 ÉTAT DES LIEUX — Analyse factuelle de la situation (données marché Maroc 2024-2025)
2. 🔍 INSIGHTS CLÉS — 3 observations non-évidentes
3. ⚡ IMPLICATIONS STRATÉGIQUES — Ce que ça signifie pour TBOS
4. 🎯 OPPORTUNITÉS — Fenêtres d'action identifiées

Termine par:
5. 🧩 SYNTHÈSE CROISÉE — Connexions entre les dimensions analysées
6. 💎 LE "SO WHAT" — La question stratégique centrale à résoudre

Style: Associé senior BCG/McKinsey. Factuel, incisif, orienté action. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Dimensions Stratégiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dimensions.map(d => (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected.includes(d.id) ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {selected.includes(d.id) ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <d.icon className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-xs font-semibold">{d.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground ml-5">{d.desc}</p>
            </button>
          ))}
          <Button onClick={scan} disabled={loading || !selected.length} className="w-full mt-2" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Scanner ({selected.length} dimensions)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Analyse Stratégique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Compass className="w-8 h-8 opacity-30" />
                <span>Sélectionnez des dimensions et lancez le scan</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Bold Hypothesis Generator ───────────────────────────────
function BoldHypothesisGenerator() {
  const [context, setContext] = useState('');
  const [hypotheses, setHypotheses] = useState('');
  const [loading, setLoading] = useState(false);
  const [lens, setLens] = useState<'contrarian' | 'adjacent' | 'moonshot'>('contrarian');
  const ctrlRef = useRef<AbortController | null>(null);

  const lenses = [
    { id: 'contrarian' as const, label: 'Contrarian', icon: Swords, desc: 'Inverser les certitudes' },
    { id: 'adjacent' as const, label: 'Adjacent', icon: Layers, desc: 'Marchés voisins' },
    { id: 'moonshot' as const, label: 'Moonshot', icon: Crown, desc: 'Paris audacieux' },
  ];

  const generate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setHypotheses('');
    setLoading(true);

    const lensPrompt = lens === 'contrarian'
      ? 'APPROCHE CONTRARIAN: Challenge chaque hypothèse dominante. "Et si le contraire était vrai?" Questionne ce que tout le monde tient pour acquis.'
      : lens === 'adjacent'
        ? 'APPROCHE ADJACENTE: Explore les marchés et modèles voisins. Que peut-on emprunter au digital, à l\'agroalimentaire, à la logistique? Cross-pollination.'
        : 'APPROCHE MOONSHOT: Pense 10x, pas 10%. Si on avait des ressources illimitées et zéro contrainte, que ferait-on? Puis rends-le réaliste.';

    try {
      await streamAI(
        `Tu es le Visionary Strategist en mode "${lenses.find(l => l.id === lens)?.label}".

${lensPrompt}

CONTEXTE TBOS: Centrale béton Maroc, 80M MAD CA, marché BTP en croissance.
${context ? `FOCUS ADDITIONNEL: ${context}` : ''}

Génère 5 HYPOTHÈSES STRATÉGIQUES AUDACIEUSES:

Pour chaque hypothèse:
- 🎲 NOM CODE — Titre provocateur (3-4 mots)
- 💡 HYPOTHÈSE — "Nous croyons que SI... ALORS... PARCE QUE..."
- 🔬 COMMENT TESTER — Expérimentation rapide (<30 jours, <50K MAD)
- ⚡ POTENTIEL — Impact estimé si validée (MAD/an)
- 🎯 PROBABILITÉ — Score conviction /10

Termine par 🏆 L'HYPOTHÈSE LA PLUS DANGEREUSE — celle qui change tout si elle est vraie. Français.`,
        (t) => setHypotheses(h => h + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setHypotheses(h => h + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [context, lens]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            {lenses.map(l => (
              <button
                key={l.id}
                onClick={() => setLens(l.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${lens === l.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <l.icon className={`w-4 h-4 ${lens === l.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{l.label}</span>
                <span className="text-[9px] text-muted-foreground">{l.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Focus optionnel: un enjeu, un marché, une tendance..." className="text-xs min-h-[45px] bg-muted/30 flex-1" />
            <Button onClick={generate} disabled={loading} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Hypothèses Stratégiques — {lenses.find(l => l.id === lens)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {hypotheses ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{hypotheses}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Lightbulb className="w-8 h-8 opacity-30" />
                <span>Choisissez une approche et générez des hypothèses</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Scenario War Room ───────────────────────────────────────
function ScenarioWarRoom() {
  const scenarios = [
    { id: 'boom', name: '🚀 Boom Infra 2026', desc: 'Le Maroc lance 50B MAD de projets infra. Comment capter notre part?' },
    { id: 'green', name: '🌿 Réglementation Verte', desc: 'Nouvelle norme CO₂ obligatoire. Transformer la contrainte en avantage.' },
    { id: 'digital', name: '🤖 Disruption Digitale', desc: 'Un acteur tech lance une plateforme béton-as-a-service.' },
    { id: 'crisis', name: '⚠️ Crise Matières', desc: 'Prix ciment +40%, pénurie sable. Stratégie de résilience.' },
  ];

  const [selected, setSelected] = useState(scenarios[0]);
  const [warGame, setWarGame] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const simulate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setWarGame('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es le Visionary Strategist en mode "War Room" — simulation stratégique de haute intensité.

SCÉNARIO: ${selected.name}
SITUATION: ${selected.desc}
TBOS: Centrale béton Rabat-Salé, 80M MAD CA, 200+ clients, 50 camions.

SIMULE UN WAR GAME COMPLET:
1. 📡 SITUATION BRIEFING — Cadrage du scénario (timeline, ampleur, déclencheurs)
2. ⚔️ MOUVEMENTS CONCURRENTS — Comment chaque concurrent réagit (3-4 acteurs)
3. 🎯 OPTIONS STRATÉGIQUES — 3 réponses possibles pour TBOS (Défensif / Offensif / Disruptif)
4. 📊 STRESS TEST — Chaque option testée contre 3 variantes du scénario (optimiste/base/pessimiste)
5. 🏆 STRATÉGIE RECOMMANDÉE — Le meilleur mouvement avec timing et séquençage
6. 📋 PLAN DE BATAILLE — 10 actions sur 90 jours, classées par priorité
7. 🔑 DÉCISIONS IRRÉVERSIBLES — Ce qu'il faut décider maintenant vs ce qui peut attendre

Style: Chef d'état-major stratégique. Incisif, séquencé, sans ambiguïté. Français.`,
        (t) => setWarGame(w => w + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setWarGame(w => w + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            Scénarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected.id === s.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <span className="text-xs font-semibold block mb-1">{s.name}</span>
              <span className="text-[10px] text-muted-foreground">{s.desc}</span>
            </button>
          ))}
          <Button onClick={simulate} disabled={loading} className="w-full mt-2" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Lancer le War Game
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            War Room — {selected.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {warGame ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{warGame}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Swords className="w-8 h-8 opacity-30" />
                <span>Sélectionnez un scénario et lancez le war game</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Innovation Roadmap ──────────────────────────────────────
function InnovationRoadmap() {
  const horizons = [
    { id: 'h1', label: 'H1 — Optimiser (0-6 mois)', desc: 'Quick wins sur le core business', icon: Target },
    { id: 'h2', label: 'H2 — Étendre (6-18 mois)', desc: 'Nouveaux marchés et services', icon: Layers },
    { id: 'h3', label: 'H3 — Transformer (18-36 mois)', desc: 'Modèle disruptif futur', icon: Crown },
  ];

  const [selectedHorizon, setSelectedHorizon] = useState(horizons[0]);
  const [roadmap, setRoadmap] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const build = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setRoadmap('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es le Visionary Strategist — architecte de roadmaps d'innovation industrielle.

HORIZON: ${selectedHorizon.label}
FOCUS: ${selectedHorizon.desc}
TBOS: Centrale béton Maroc, 80M MAD CA, objectif croissance 20%/an.

CONSTRUIS UNE ROADMAP D'INNOVATION:
1. 🎯 VISION D'HORIZON — Ce à quoi TBOS ressemble à la fin de cet horizon
2. 📋 INITIATIVES — 5-7 projets classés par priorité avec:
   - Nom du projet
   - Description (2 phrases)
   - Impact estimé (MAD/an ou % amélioration)
   - Investissement requis (MAD)
   - Timeline (semaines)
   - Risque (🟢🟡🔴)
   - Dépendances
3. 💰 BUDGET TOTAL — Enveloppe globale et ROI attendu
4. 👥 RESSOURCES — Équipe nécessaire (profils, FTE)
5. 📊 MÉTRIQUES DE SUCCÈS — 5 KPIs avec cibles trimestrielles
6. 🚦 JALONS — Go/No-Go checkpoints avec critères de décision

Style: VP Innovation qui présente au Board. Structuré, chiffré, convaincant. Français.`,
        (t) => setRoadmap(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setRoadmap(r => r + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selectedHorizon]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            {horizons.map((h, i) => (
              <div key={h.id} className="flex items-center flex-1">
                <button
                  onClick={() => setSelectedHorizon(h)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all flex-1 ${selectedHorizon.id === h.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
                >
                  <h.icon className={`w-5 h-5 ${selectedHorizon.id === h.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-[10px] font-mono font-semibold text-center">{h.label}</span>
                  <span className="text-[9px] text-muted-foreground text-center">{h.desc}</span>
                </button>
                {i < horizons.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/30 mx-1 shrink-0" />}
              </div>
            ))}
          </div>
          <Button onClick={build} disabled={loading} className="w-full mt-3" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Map className="w-4 h-4 mr-2" />}
            Construire la Roadmap — {selectedHorizon.label.split('—')[0].trim()}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Map className="w-4 h-4 text-amber-400" />
            Roadmap Innovation — {selectedHorizon.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[370px]">
            {roadmap ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{roadmap}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Map className="w-8 h-8 opacity-30" />
                <span>Sélectionnez un horizon et construisez la roadmap</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function VisionaryStrategist() {
  const [activeTab, setActiveTab] = useState('context');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/30">
            <Compass className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Visionary Strategist</h1>
            <p className="text-xs text-muted-foreground">Scanner, Hypothéser, Simuler, Planifier — la stratégie IA à 360°</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Stratège Actif</span>
          </div>
          <span>4 dimensions stratégiques</span>
          <span>3 lentilles d'hypothèses</span>
          <span>3 horizons d'innovation</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="context" className="text-xs font-mono gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Contexte
          </TabsTrigger>
          <TabsTrigger value="hypotheses" className="text-xs font-mono gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Hypothèses
          </TabsTrigger>
          <TabsTrigger value="warroom" className="text-xs font-mono gap-1.5">
            <Swords className="w-3.5 h-3.5" /> War Room
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="text-xs font-mono gap-1.5">
            <Map className="w-3.5 h-3.5" /> Roadmap
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="context" className="mt-4"><StrategicContextScanner /></TabsContent>
            <TabsContent value="hypotheses" className="mt-4"><BoldHypothesisGenerator /></TabsContent>
            <TabsContent value="warroom" className="mt-4"><ScenarioWarRoom /></TabsContent>
            <TabsContent value="roadmap" className="mt-4"><InnovationRoadmap /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
