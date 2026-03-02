import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Atom, FlaskConical, BarChart3, Presentation, Play, Loader2,
  Sparkles, Target, Gauge, Layers, Cpu, Beaker, TrendingUp,
  ShieldCheck, Users, DollarSign, Zap, RotateCcw, Eye
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

// ─── Physics Simulator ───────────────────────────────────────
function PhysicsSimulator() {
  const [params, setParams] = useState({
    ciment_kg: [350],
    eau_l: [175],
    sable_kg: [800],
    gravier_kg: [1050],
    adjuvant_ml: [3],
    temperature_c: [25],
    cure_days: [28],
  });

  const paramDefs = [
    { key: 'ciment_kg', label: 'Ciment (kg/m³)', min: 250, max: 500, step: 10, icon: Atom },
    { key: 'eau_l', label: 'Eau (L/m³)', min: 120, max: 250, step: 5, icon: Beaker },
    { key: 'sable_kg', label: 'Sable (kg/m³)', min: 600, max: 1000, step: 25, icon: Layers },
    { key: 'gravier_kg', label: 'Gravier (kg/m³)', min: 800, max: 1300, step: 25, icon: Layers },
    { key: 'adjuvant_ml', label: 'Adjuvant (%)', min: 0, max: 5, step: 0.5, icon: FlaskConical },
    { key: 'temperature_c', label: 'Température (°C)', min: 5, max: 45, step: 1, icon: Gauge },
    { key: 'cure_days', label: 'Cure (jours)', min: 3, max: 90, step: 1, icon: RotateCcw },
  ];

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const simulate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    const p = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v[0]]));
    try {
      await streamAI(
        `Tu es le Simulation Sage — expert en science des matériaux et technologie du béton.

PARAMÈTRES DE SIMULATION:
- Ciment: ${p.ciment_kg} kg/m³
- Eau: ${p.eau_l} L/m³ (E/C = ${(p.eau_l / p.ciment_kg).toFixed(2)})
- Sable 0/3: ${p.sable_kg} kg/m³
- Gravier 8/25: ${p.gravier_kg} kg/m³
- Adjuvant: ${p.adjuvant_ml}% masse ciment
- Température ambiante: ${p.temperature_c}°C
- Durée de cure: ${p.cure_days} jours

SIMULE avec précision:
1. 🔬 RÉSISTANCE — Fc estimée à 7j, 14j, 28j (MPa) avec intervalle de confiance
2. 💧 OUVRABILITÉ — Affaissement prévu (mm), classe de consistance
3. ⏱️ PRISE — Temps de début et fin de prise (heures)
4. 🏗️ DURABILITÉ — Perméabilité, résistance gel/dégel, carbonatation
5. ⚠️ RISQUES — Retrait, fissuration, ségrégation
6. 💰 COÛT — Estimation coût matière/m³ (MAD)
7. ✅ VERDICT — Conformité NM/EN 206 et classe d'exposition recommandée

Sois un ingénieur béton senior. Ultra-précis. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Atom className="w-4 h-4 text-primary" />
            Paramètres Matériaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paramDefs.map(d => (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <d.icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-mono">{d.label}</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5 font-mono">
                  {(params as any)[d.key][0]}
                </Badge>
              </div>
              <Slider
                value={(params as any)[d.key]}
                onValueChange={v => setParams(p => ({ ...p, [d.key]: v }))}
                min={d.min} max={d.max} step={d.step}
                className="w-full"
              />
            </div>
          ))}
          <div className="pt-1 border-t border-border/30">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-2">
              <span>Ratio E/C</span>
              <span className={`font-semibold ${params.eau_l[0] / params.ciment_kg[0] > 0.6 ? 'text-red-400' : params.eau_l[0] / params.ciment_kg[0] > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {(params.eau_l[0] / params.ciment_kg[0]).toFixed(2)}
              </span>
            </div>
          </div>
          <Button onClick={simulate} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Lancer la Simulation
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            Résultats de Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[430px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Atom className="w-8 h-8 opacity-30" />
                <span>Ajustez les paramètres et lancez la simulation</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Design Space Explorer ───────────────────────────────────
function DesignSpaceExplorer() {
  const objectives = [
    { id: 'strength', label: 'Résistance Max', icon: ShieldCheck, active: true },
    { id: 'cost', label: 'Coût Minimum', icon: DollarSign, active: true },
    { id: 'durability', label: 'Durabilité Max', icon: Gauge, active: false },
    { id: 'workability', label: 'Ouvrabilité S4+', icon: Beaker, active: false },
    { id: 'speed', label: 'Prise Rapide', icon: Zap, active: false },
    { id: 'eco', label: 'Empreinte CO₂ Min', icon: Target, active: false },
  ];

  const [selected, setSelected] = useState<string[]>(['strength', 'cost']);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const ctrlRef = useRef<AbortController | null>(null);

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const explore = useCallback(async () => {
    if (!selected.length) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 15, 95)), 400);
    const names = objectives.filter(o => selected.includes(o.id)).map(o => o.label);
    try {
      await streamAI(
        `Tu es le Simulation Sage en mode "Design Space Exploration".

OBJECTIFS D'OPTIMISATION (multi-critères): ${names.join(', ')}

CONTEXTE: Centrale TBOS, Maroc. Matériaux: CPJ45, Sable 0/3 local, Gravier 8/15 + 15/25, Adjuvants Sika.

Simule l'exploration de l'espace de conception:
1. 🔄 ESPACE EXPLORÉ — Nombre de configurations testées et plages
2. 🏆 TOP 3 CONFIGURATIONS — Détail complet de chaque formulation optimale
3. 📊 FRONT DE PARETO — Compromis entre les objectifs (avec trade-offs chiffrés)
4. 🎯 CONFIGURATION RECOMMANDÉE — Le meilleur compromis avec justification
5. 📈 GAINS vs ACTUEL — Amélioration estimée par rapport à la formule standard
6. ⚠️ SENSIBILITÉ — Quels paramètres ont le plus d'impact

Simule un processus d'optimisation rigoureux. Ultra-précis. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally {
      clearInterval(interval);
      setProgress(100);
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <span className="text-[10px] text-muted-foreground font-mono uppercase mb-2 block">Objectifs d'Optimisation (sélection multiple)</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {objectives.map(o => (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-all ${selected.includes(o.id) ? 'border-primary bg-primary/10 font-semibold' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <o.icon className={`w-3.5 h-3.5 ${selected.includes(o.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                {o.label}
              </button>
            ))}
          </div>
          {loading && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Exploration en cours...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
          <Button onClick={explore} disabled={loading || !selected.length} className="w-full mt-3" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cpu className="w-4 h-4 mr-2" />}
            Explorer ({selected.length} objectifs)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Configurations Optimales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Cpu className="w-8 h-8 opacity-30" />
                <span>Sélectionnez des objectifs et lancez l'exploration</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Market Oracle ───────────────────────────────────────────
function MarketOracle() {
  const scenarios = [
    { id: 'new_formula', name: 'Nouvelle Formule Verte', desc: 'Béton bas carbone avec 30% de laitier de haut fourneau' },
    { id: 'price_war', name: 'Guerre des Prix', desc: 'Un concurrent baisse ses prix de 15%. Quel impact et quelle réponse?' },
    { id: 'premium_service', name: 'Service Premium 24/7', desc: 'Livraison garantie en 45min, tracking temps réel, support dédié' },
    { id: 'digital_platform', name: 'Plateforme Digitale B2B', desc: 'Commande en ligne, devis instantané, suivi de compte client' },
  ];

  const [selected, setSelected] = useState(scenarios[0]);
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const predict = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setPrediction('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es le Simulation Sage — expert en stratégie de marché pour le BTP au Maroc.

INNOVATION À SIMULER: ${selected.name}
DESCRIPTION: ${selected.desc}
CONTEXTE: TBOS, centrale béton Rabat-Salé, ~500m³/jour, 200+ clients, CA ~80M MAD.

SIMULE LE MARCHÉ:
1. 📊 ADOPTION — Courbe d'adoption sur 12 mois (early adopters → mainstream)
2. 👥 SEGMENTATION — Quels segments clients adoptent en premier et pourquoi
3. ⚔️ RÉACTION CONCURRENCE — Comment les 3-4 concurrents vont réagir (timeline)
4. 💰 P&L PRÉVISIONNEL — Revenue additionnel, coûts, point mort (mois)
5. 📈 PART DE MARCHÉ — Impact sur PDM à 6, 12, 24 mois
6. 🎯 PROBABILITÉ DE SUCCÈS — Score /100 avec facteurs clés
7. ⚠️ RISQUES MARCHÉ — 3 scénarios: pessimiste, réaliste, optimiste
8. 🏆 VERDICT — GO / PIVOT / NO-GO avec rationale

Sois un analyste stratégie BCG spécialisé BTP. Français.`,
        (t) => setPrediction(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setPrediction(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Scénarios Marché
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
          <Button onClick={predict} disabled={loading} className="w-full mt-2" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
            Prédire le Marché
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Prédiction Marché — {selected.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {prediction ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{prediction}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <TrendingUp className="w-8 h-8 opacity-30" />
                <span>Sélectionnez un scénario et lancez la prédiction</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Executive Narrator ──────────────────────────────────────
function ExecutiveNarrator() {
  const reports = [
    { id: 'weekly', label: 'Rapport Hebdo', desc: 'Synthèse de la semaine pour le COMEX' },
    { id: 'innovation', label: 'Pipeline Innovation', desc: 'État des projets R&D et simulations' },
    { id: 'risk', label: 'Tableau de Risques', desc: 'Cartographie des risques opérationnels' },
    { id: 'investment', label: 'Dossier Investissement', desc: 'Business case pour nouvelle capacité' },
  ];

  const [selected, setSelected] = useState(reports[0]);
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setNarrative('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es le Simulation Sage en mode "Executive Narrator" — tu traduis des simulations complexes en narratifs convaincants pour le top management.

TYPE DE RAPPORT: ${selected.label}
DESCRIPTION: ${selected.desc}
CONTEXTE: TBOS, centrale béton Maroc, ~80M MAD CA.

Génère un NARRATIF EXÉCUTIF complet:
1. 📋 RÉSUMÉ EXÉCUTIF — 3 phrases max, impact-first
2. 📊 DONNÉES CLÉS — 5-6 KPIs avec tendance (↑↓→) et couleur (🟢🟡🔴)
3. 🔍 ANALYSE — Interprétation des données avec contexte business
4. 🎯 RECOMMANDATIONS — 3 actions classées par priorité et ROI estimé
5. ⚠️ POINTS D'ATTENTION — Ce qui requiert une décision du COMEX
6. 📅 PROCHAINES ÉTAPES — Timeline sur 2 semaines

Style: McKinsey Presentation. Concis, structuré, orienté décision. Chaque phrase doit servir. Français.`,
        (t) => setNarrative(n => n + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setNarrative(n => n + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Presentation className="w-4 h-4 text-primary" />
            Type de Rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {reports.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected.id === r.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <span className="text-xs font-semibold block mb-1">{r.label}</span>
              <span className="text-[10px] text-muted-foreground">{r.desc}</span>
            </button>
          ))}
          <Button onClick={generate} disabled={loading} className="w-full mt-2" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Presentation className="w-4 h-4 mr-2" />}
            Générer le Narratif
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            Narratif Exécutif — {selected.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {narrative ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{narrative}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Presentation className="w-8 h-8 opacity-30" />
                <span>Sélectionnez un type et générez le narratif</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function SimulationSage() {
  const [activeTab, setActiveTab] = useState('physics');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30">
            <Atom className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Simulation Sage</h1>
            <p className="text-xs text-muted-foreground">Simuler, Explorer, Prédire, Narrer — la boule de cristal industrielle</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Moteur Actif</span>
          </div>
          <span>7 paramètres matériaux</span>
          <span>6 objectifs d'optimisation</span>
          <span>4 scénarios marché</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="physics" className="text-xs font-mono gap-1.5">
            <Atom className="w-3.5 h-3.5" /> Physique
          </TabsTrigger>
          <TabsTrigger value="design" className="text-xs font-mono gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Design Space
          </TabsTrigger>
          <TabsTrigger value="market" className="text-xs font-mono gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Marché
          </TabsTrigger>
          <TabsTrigger value="narrator" className="text-xs font-mono gap-1.5">
            <Presentation className="w-3.5 h-3.5" /> Narrateur
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="physics" className="mt-4"><PhysicsSimulator /></TabsContent>
            <TabsContent value="design" className="mt-4"><DesignSpaceExplorer /></TabsContent>
            <TabsContent value="market" className="mt-4"><MarketOracle /></TabsContent>
            <TabsContent value="narrator" className="mt-4"><ExecutiveNarrator /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
