import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye, Brain, TrendingUp, Zap, Activity, AlertTriangle, Target,
  RefreshCw, Play, Loader2, Sparkles, Globe, Shield, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, Clock, Lightbulb, Layers
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

// ─── Data Pulse Monitor ─────────────────────────────────────
function DataPulseMonitor() {
  const [streams] = useState([
    { id: 'prod', name: 'Production Telemetry', rate: 1247, status: 'live', trend: 'up' as const },
    { id: 'quality', name: 'Quality Sensors', rate: 892, status: 'live', trend: 'stable' as const },
    { id: 'logistics', name: 'Fleet & Logistics', rate: 634, status: 'live', trend: 'up' as const },
    { id: 'finance', name: 'Financial Transactions', rate: 421, status: 'live', trend: 'down' as const },
    { id: 'market', name: 'Market Intelligence', rate: 156, status: 'delayed', trend: 'stable' as const },
    { id: 'weather', name: 'Weather & Environment', rate: 89, status: 'live', trend: 'up' as const },
  ]);

  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const runAnalysis = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setAnalysis('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Oracle Industriel de TBOS, une centrale à béton au Maroc. Analyse ces flux de données en temps réel et identifie les tendances émergentes, risques et opportunités:
        
Flux actifs: ${streams.map(s => `${s.name}: ${s.rate} events/min (${s.status}, tendance ${s.trend})`).join('; ')}

Donne une analyse concise en 5-6 points avec des insights actionnables. Utilise des émojis pour marquer la sévérité. Réponds en français.`,
        (t) => setAnalysis(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setAnalysis(p => p + '\n\n❌ Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }, [streams]);

  const trendIcon = (t: string) => t === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : t === 'down' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5 text-muted-foreground" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Flux de Données Actifs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {streams.map(s => (
            <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${s.status === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-xs font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">{s.rate}/min</span>
                {trendIcon(s.trend)}
                <Badge variant={s.status === 'live' ? 'default' : 'secondary'} className="text-[10px] h-5">
                  {s.status}
                </Badge>
              </div>
            </div>
          ))}
          <Button onClick={runAnalysis} disabled={loading} className="w-full mt-3" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Analyser les Flux
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Insights Émergents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px]">
            {analysis ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{analysis}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-12">
                <Eye className="w-8 h-8 opacity-30" />
                <span>Lancez l'analyse pour révéler les insights</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Scenario Forge ──────────────────────────────────────────
interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: typeof TrendingUp;
  variables: string[];
}

function ScenarioForge() {
  const scenarios: Scenario[] = [
    { id: 'expansion', name: 'Expansion Capacité', description: 'Simuler l\'ajout d\'une 2ème ligne de production', icon: Layers, variables: ['Investissement initial', 'Délai mise en service', 'Volume additionnel'] },
    { id: 'market_shift', name: 'Disruption Marché', description: 'Impact d\'un nouveau concurrent ou changement réglementaire', icon: Globe, variables: ['Perte part de marché', 'Pression prix', 'Coûts conformité'] },
    { id: 'supply_crisis', name: 'Crise Approvisionnement', description: 'Rupture chaîne logistique matières premières', icon: AlertTriangle, variables: ['Durée rupture', 'Matériaux affectés', 'Coût substitution'] },
    { id: 'digital', name: 'Transformation Digitale', description: 'ROI complet de l\'automatisation et IoT', icon: Zap, variables: ['Budget techno', 'Gains productivité', 'Réduction erreurs'] },
  ];

  const [selected, setSelected] = useState<Scenario>(scenarios[0]);
  const [result, setResult] = useState('');
  const [simulating, setSimulating] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const simulate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setSimulating(true);
    try {
      await streamAI(
        `Tu es l'Oracle Industriel stratégique de TBOS (centrale à béton, Maroc). Simule ce scénario en détail:

SCÉNARIO: ${selected.name}
DESCRIPTION: ${selected.description}
VARIABLES CLÉS: ${selected.variables.join(', ')}

Fournis:
1. 📊 Modélisation sur 6-12-24 mois (chiffres estimés)
2. ⚡ Impact sur marge, CA, et cash-flow
3. 🎯 Probabilité de succès (%) avec justification
4. ⚠️ Risques majeurs et mitigation
5. ✅ Recommandation GO / NO-GO avec rationale clair
6. 🗺️ Plan d'action en 5 étapes

Sois précis, chiffré, et stratégique. Réponds en français.`,
        (t) => setResult(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(p => p + '\n\n❌ Erreur.');
    } finally {
      setSimulating(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Scénarios Stratégiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected.id === s.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">{s.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{s.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {s.variables.map(v => (
                  <Badge key={v} variant="outline" className="text-[9px] h-4">{v}</Badge>
                ))}
              </div>
            </button>
          ))}
          <Button onClick={simulate} disabled={simulating} className="w-full mt-2" size="sm">
            {simulating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Simuler le Scénario
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Résultat de Simulation — {selected.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <BarChart3 className="w-8 h-8 opacity-30" />
                <span>Sélectionnez un scénario et lancez la simulation</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Strategic Advisor ───────────────────────────────────────
function StrategicAdvisor() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const presets = [
    'Comment réduire nos coûts de production de 15% en 6 mois?',
    'Quelle stratégie pour doubler notre part de marché régionale?',
    'Comment optimiser notre mix produit pour maximiser la marge?',
    'Quel plan pour atteindre zéro-déchet d\'ici 2027?',
  ];

  const ask = useCallback(async (q: string) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResponse('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Oracle Industriel — le conseiller stratégique ultime de TBOS (centrale à béton, Maroc, ~50 camions, CA ~80M MAD/an).

QUESTION STRATÉGIQUE: ${q}

Structure ta réponse:
1. 🔍 DIAGNOSTIC — Analyse de la situation actuelle
2. 🎯 STRATÉGIE — Recommandation principale avec rationale détaillé
3. 📊 PROJECTIONS — Chiffres estimés (ROI, délai, investissement)
4. ⚡ QUICK WINS — 3 actions immédiates (<30 jours)
5. 🛡️ RISQUES — Obstacles et mitigation
6. 💡 INNOVATION — Une idée disruptive bonus

Sois un conseiller McKinsey pour l'industrie du béton. Précis, chiffré, actionnable. Français.`,
        (t) => setResponse(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResponse(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Conseiller Stratégique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Posez votre question stratégique à l'Oracle..."
            className="text-xs min-h-[80px] bg-muted/30"
          />
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Questions Suggérées</span>
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => { setQuestion(p); ask(p); }}
                className="w-full text-left p-2 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-[10px] leading-snug"
              >
                {p}
              </button>
            ))}
          </div>
          <Button onClick={() => ask(question)} disabled={loading || !question.trim()} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
            Consulter l'Oracle
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Recommandation Stratégique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {response ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{response}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Brain className="w-8 h-8 opacity-30" />
                <span>L'Oracle attend votre question stratégique</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Adaptive Learning Feed ──────────────────────────────────
function AdaptiveLearning() {
  const [learnings] = useState([
    { id: '1', timestamp: '14:32', type: 'pattern', title: 'Corrélation détectée', desc: 'Hausse commandes BHP25 les mardis (+23%) — probablement lié aux cycles de chantier BTP.', confidence: 87, icon: TrendingUp },
    { id: '2', timestamp: '13:15', type: 'anomaly', title: 'Anomalie prix ciment', desc: 'Le prix CPJ45 a augmenté de 4.2% cette semaine vs moyenne mobile 30j. Possible tendance haussière.', confidence: 72, icon: AlertTriangle },
    { id: '3', timestamp: '11:48', type: 'prediction', title: 'Prédiction validée ✓', desc: 'La prédiction de pic de demande du 28/02 s\'est confirmée (erreur <3%). Modèle recalibré.', confidence: 94, icon: Target },
    { id: '4', timestamp: '09:22', type: 'insight', title: 'Opportunité marché', desc: 'Secteur résidentiel Tanger: +18% permis construire Q1. Fenêtre d\'opportunité 3-6 mois.', confidence: 65, icon: Globe },
    { id: '5', timestamp: '08:05', type: 'revision', title: 'Modèle mis à jour', desc: 'Intégration données météo Février. Précision prédiction volume: 89% → 91%.', confidence: 91, icon: RefreshCw },
  ]);

  const [deepDive, setDeepDive] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const explore = useCallback(async (l: typeof learnings[0]) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setSelectedId(l.id);
    setDeepDive('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Oracle Industriel de TBOS. Un de tes modules d'apprentissage adaptatif a détecté ceci:

TYPE: ${l.type}
TITRE: ${l.title}
DÉTAIL: ${l.desc}
CONFIANCE: ${l.confidence}%

Fournis une analyse approfondie:
1. Contexte et explication du phénomène
2. Implications business concrètes
3. Actions recommandées (court et moyen terme)
4. Comment l'Oracle a appris cette leçon et comment il s'améliore

Sois précis et stratégique. Français.`,
        (t) => setDeepDive(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setDeepDive(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, []);

  const typeColor = (t: string) => {
    if (t === 'anomaly') return 'text-amber-400';
    if (t === 'prediction') return 'text-emerald-400';
    if (t === 'insight') return 'text-blue-400';
    if (t === 'revision') return 'text-purple-400';
    return 'text-primary';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            Apprentissage Adaptatif — Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            <div className="space-y-2">
              {learnings.map(l => (
                <button
                  key={l.id}
                  onClick={() => explore(l)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedId === l.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <l.icon className={`w-3.5 h-3.5 ${typeColor(l.type)}`} />
                      <span className="text-xs font-semibold">{l.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">{l.timestamp}</span>
                      <Badge variant="outline" className="text-[9px] h-4">{l.confidence}%</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{l.desc}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-400" />
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Analyse Approfondie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {deepDive ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{deepDive}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Clock className="w-8 h-8 opacity-30" />
                <span>Cliquez sur un apprentissage pour explorer</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function IndustrialOracle() {
  const [activeTab, setActiveTab] = useState('pulse');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 border border-primary/30">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Industrial Oracle</h1>
            <p className="text-xs text-muted-foreground">Prédire, Modéliser, Conseiller, Apprendre — en temps réel</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Oracle Actif</span>
          </div>
          <span>6 flux surveillés</span>
          <span>Dernière calibration: il y a 2h</span>
          <span>Précision modèle: 91%</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="pulse" className="text-xs font-mono gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Data Pulse
          </TabsTrigger>
          <TabsTrigger value="forge" className="text-xs font-mono gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Scenario Forge
          </TabsTrigger>
          <TabsTrigger value="advisor" className="text-xs font-mono gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Conseiller
          </TabsTrigger>
          <TabsTrigger value="learning" className="text-xs font-mono gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Apprentissage
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="pulse" className="mt-4"><DataPulseMonitor /></TabsContent>
            <TabsContent value="forge" className="mt-4"><ScenarioForge /></TabsContent>
            <TabsContent value="advisor" className="mt-4"><StrategicAdvisor /></TabsContent>
            <TabsContent value="learning" className="mt-4"><AdaptiveLearning /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
