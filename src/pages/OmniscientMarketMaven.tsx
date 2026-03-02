import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Globe, Radar, Target, TrendingUp, Loader2, Sparkles,
  Activity, Eye, Users, BarChart3, Zap, Search, MapPin,
  ShieldAlert, Crosshair, LineChart, PieChart, ArrowUpRight,
  CheckCircle2, Signal, Telescope
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

// ─── Signal Scanner ──────────────────────────────────────────
function SignalScanner() {
  const streams = [
    { id: 'consumer', name: 'Tendances Consommateurs', icon: Users, desc: 'Évolution des besoins BTP, normes construction, préférences clients' },
    { id: 'competitor', name: 'Mouvements Concurrents', icon: ShieldAlert, desc: 'Prix, capacités, alliances, innovations des rivaux' },
    { id: 'technology', name: 'Shifts Technologiques', icon: Zap, desc: 'Béton bas carbone, impression 3D, IoT chantier, matériaux bio-sourcés' },
    { id: 'regulatory', name: 'Évolutions Réglementaires', icon: Globe, desc: 'Normes NM, directive CO₂, PPP gouvernementaux, urbanisme' },
  ];

  const [selected, setSelected] = useState<string[]>(['consumer', 'competitor']);
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
    const names = streams.filter(d => selected.includes(d.id)).map(d => `${d.name}: ${d.desc}`);
    try {
      await streamAI(
        `Tu es l'Omniscient Market Maven de TBOS — oracle de l'intelligence marché pour le béton prêt à l'emploi au Maroc.

MISSION: Scan omnidirectionnel des flux: ${names.join('; ')}

CONTEXTE TBOS: Centrale béton Rabat-Salé, 80M MAD CA, 200+ clients, marché BTP Maroc ~120B MAD/an.

Pour CHAQUE flux sélectionné:
1. 📡 SIGNAUX DÉTECTÉS — 5 signaux classés par force (🔴 Fort / 🟡 Moyen / 🟢 Émergent)
2. 📊 DONNÉES CLÉS — Chiffres, pourcentages, tendances quantifiées
3. ⚡ IMPLICATIONS TBOS — Impact direct sur notre business
4. ⏱️ FENÊTRE D'ACTION — Urgence: immédiat / 3 mois / 6 mois / 12 mois

Synthèse finale:
5. 🎯 TOP 3 SIGNAUX CRITIQUES — Ceux qui changent la donne
6. 🧭 DIRECTION STRATÉGIQUE — "Le marché nous dit de..."
7. ⚠️ ANGLES MORTS — Ce qu'on ne surveille pas assez

Style: Analyste Bloomberg + stratège BCG. Factuel, chiffré, orienté décision. Français.`,
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
            <Signal className="w-4 h-4 text-primary" />
            Flux d'Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {streams.map(d => (
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Radar className="w-4 h-4 mr-2" />}
            Scanner ({selected.length} flux)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            Intelligence Marché
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Radar className="w-8 h-8 opacity-30" />
                <span>Sélectionnez des flux et lancez le scan</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Market Modeler ──────────────────────────────────────────
function MarketModeler() {
  const [focus, setFocus] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [lens, setLens] = useState<'segments' | 'competitive' | 'forecast'>('segments');
  const ctrlRef = useRef<AbortController | null>(null);

  const lenses = [
    { id: 'segments' as const, label: 'Segments', icon: PieChart, desc: 'Carte des segments clients' },
    { id: 'competitive' as const, label: 'Concurrence', icon: Crosshair, desc: 'Paysage concurrentiel dynamique' },
    { id: 'forecast' as const, label: 'Prévisions', icon: LineChart, desc: 'Projections et scénarios' },
  ];

  const generate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setModel('');
    setLoading(true);

    const lensPrompt = lens === 'segments'
      ? `MODÈLE DE SEGMENTATION CLIENT:
1. 🎯 SEGMENTS IDENTIFIÉS — 5-6 segments avec taille, croissance, rentabilité
2. 📊 PROFIL PAR SEGMENT — Besoins, comportement d'achat, sensibilité prix, fidélité
3. 💎 SEGMENTS SOUS-SERVIS — Opportunités non-exploitées
4. 🔄 MIGRATIONS — Flux de clients entre segments (tendances)
5. 💰 VALEUR VIE CLIENT (CLV) — Par segment avec potentiel d'expansion
6. 🎯 STRATÉGIE PAR SEGMENT — Proposition de valeur différenciée`
      : lens === 'competitive'
        ? `MODÈLE CONCURRENTIEL DYNAMIQUE:
1. 🗺️ CARTE CONCURRENTIELLE — Positionnement de chaque acteur (prix vs qualité vs service)
2. ⚔️ FORCES EN PRÉSENCE — Top 5 concurrents avec CA estimé, parts de marché, forces/faiblesses
3. 🔍 MOUVEMENTS RÉCENTS — Investissements, alliances, innovations des rivaux (6 derniers mois)
4. 📊 ANALYSE DES GAPS — Où personne ne joue (espaces blancs)
5. 🛡️ BARRIÈRES À L'ENTRÉE — Ce qui protège TBOS (et ce qui ne protège pas)
6. 🎯 AVANTAGES DURABLES — Comment creuser l'écart`
        : `MODÈLE PRÉVISIONNEL:
1. 📈 PROJECTIONS MARCHÉ — BTP Maroc 2025-2030 (3 scénarios: optimiste/base/pessimiste)
2. 🏗️ PIPELINE PROJETS — Grands projets annoncés et impact sur la demande béton
3. 💰 ÉVOLUTION PRIX — Ciment, agrégats, adjuvants sur 24 mois
4. 📊 DEMANDE PAR ZONE — Rabat-Salé, Casablanca, Tanger, régions
5. 🔮 INFLECTION POINTS — Moments clés qui vont changer la dynamique
6. 🎯 POSITIONNEMENT OPTIMAL — Où être dans 3 ans`;

    try {
      await streamAI(
        `Tu es l'Omniscient Market Maven — modélisateur de marchés pour le BPE au Maroc.

${lensPrompt}
${focus ? `FOCUS SPÉCIFIQUE: ${focus}` : ''}
TBOS: 80M MAD CA, 200+ clients, zone Rabat-Salé-Kénitra, formules B25-B50.

Style: Analyste marché senior + data scientist. Modèles chiffrés et visuels. Français.`,
        (t) => setModel(m => m + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setModel(m => m + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [focus, lens]);

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
            <Textarea value={focus} onChange={e => setFocus(e.target.value)} placeholder="Focus optionnel: un segment, une zone, un concurrent..." className="text-xs min-h-[45px] bg-muted/30 flex-1" />
            <Button onClick={generate} disabled={loading} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Modèle — {lenses.find(l => l.id === lens)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {model ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{model}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <BarChart3 className="w-8 h-8 opacity-30" />
                <span>Choisissez une lentille et modélisez le marché</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Opportunity Radar ───────────────────────────────────────
function OpportunityRadar() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState<'quick' | 'growth' | 'disrupt'>('quick');
  const ctrlRef = useRef<AbortController | null>(null);

  const horizons = [
    { id: 'quick' as const, label: 'Quick Wins', icon: Zap, desc: '0-6 mois, ROI rapide' },
    { id: 'growth' as const, label: 'Croissance', icon: TrendingUp, desc: '6-18 mois, expansion' },
    { id: 'disrupt' as const, label: 'Disruption', icon: Telescope, desc: '18-36 mois, transformation' },
  ];

  const detect = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Omniscient Market Maven — radar d'opportunités d'innovation pour TBOS.

HORIZON: ${horizons.find(h => h.id === horizon)?.label} (${horizons.find(h => h.id === horizon)?.desc})
TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients BTP, zone Rabat-Salé.

DÉTECTE ET PRIORISE LES OPPORTUNITÉS D'INNOVATION:

Pour chaque opportunité (génère-en 5):
1. 🎯 NOM — Titre accrocheur
2. 📊 ATTRACTIVITÉ MARCHÉ — Score /10 avec justification (taille, croissance, marges)
3. 🔧 ALIGNEMENT CAPACITÉS — Score /10 (nos forces vs ce qu'il faut)
4. 💎 POTENTIEL DIFFÉRENCIATION — Score /10 (unicité, barrières)
5. 📈 IMPACT ESTIMÉ — En MAD/an et % de croissance CA
6. ⏱️ TIME-TO-MARKET — Délai de mise sur le marché
7. 💰 INVESTISSEMENT — Budget requis
8. ⚠️ RISQUE PRINCIPAL — Et comment le mitiger
9. 🏆 SCORE GLOBAL — Moyenne pondérée des 3 critères

Termine par:
🥇 TOP 3 PRIORITAIRES — Classement final avec argumentaire
📋 PLAN D'ACTION — 5 premières étapes pour l'opportunité #1
🔑 DÉCISION CLÉ — Ce qu'il faut décider cette semaine

Style: VP Strategy + Market Intelligence Director. Décisif et chiffré. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [horizon]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            {horizons.map(h => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${horizon === h.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <h.icon className={`w-4 h-4 ${horizon === h.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{h.label}</span>
                <span className="text-[9px] text-muted-foreground">{h.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={detect} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
            Détecter Opportunités — {horizons.find(h => h.id === horizon)?.label}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Radar d'Opportunités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Target className="w-8 h-8 opacity-30" />
                <span>Sélectionnez un horizon et détectez les opportunités</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Decision Intelligence ───────────────────────────────────
function DecisionIntelligence() {
  const [question, setQuestion] = useState('');
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    if (!question.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setInsight('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Omniscient Market Maven — conseiller stratégique temps réel pour décisions d'innovation.

QUESTION/DÉCISION: ${question}
TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, 50 camions, formules B25-B50.

FOURNIS UNE INTELLIGENCE DÉCISIONNELLE COMPLÈTE:

1. 📊 CONTEXTE MARCHÉ — Données pertinentes pour cette décision
2. 🔍 ANALYSE MULTI-ANGLE
   - Vue Client: ce que les clients veulent/attendent
   - Vue Concurrence: comment les rivaux se positionnent
   - Vue Technologie: ce que la tech rend possible
   - Vue Réglementaire: contraintes et opportunités légales

3. ⚖️ OPTIONS ET TRADE-OFFS
   - Option A: [description] — Pour / Contre / Impact financier
   - Option B: [description] — Pour / Contre / Impact financier
   - Option C: [description] — Pour / Contre / Impact financier

4. 📈 DONNÉES DÉCISIONNELLES
   - Taille d'opportunité (MAD)
   - Probabilité de succès (%)
   - Temps de retour (mois)
   - Coût d'inaction (MAD/mois de retard)

5. 🎯 RECOMMANDATION
   - Option recommandée avec conviction (/10)
   - Conditions de succès
   - Red flags à surveiller
   - Point de non-retour (quand décider)

6. 📋 NEXT STEPS
   - 3 actions cette semaine
   - Données à collecter pour affiner

Style: Chief Strategy Officer + data analyst. Tranché, chiffré, actionnable. Français.`,
        (t) => setInsight(i => i + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setInsight(i => i + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [question]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Quelle décision d'innovation avez-vous besoin d'éclairer? (ex: 'Faut-il investir 5M MAD dans une ligne de béton bas carbone?', 'Quel pricing pour le nouveau B50 haute performance?')"
              className="text-xs min-h-[60px] bg-muted/30 flex-1"
            />
            <Button onClick={analyze} disabled={loading || !question.trim()} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            Intelligence Décisionnelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {insight ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{insight}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Eye className="w-8 h-8 opacity-30" />
                <span>Posez une question de décision d'innovation</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function OmniscientMarketMaven() {
  const [activeTab, setActiveTab] = useState('signals');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Omniscient Market Maven</h1>
            <p className="text-xs text-muted-foreground">Scanner, Modéliser, Détecter, Décider — l'oracle de l'intelligence marché</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Oracle Actif</span>
          </div>
          <span>4 flux d'intelligence</span>
          <span>3 modèles de marché</span>
          <span>3 horizons d'opportunité</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="signals" className="text-xs font-mono gap-1.5">
            <Signal className="w-3.5 h-3.5" /> Signaux
          </TabsTrigger>
          <TabsTrigger value="model" className="text-xs font-mono gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Modèles
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="text-xs font-mono gap-1.5">
            <Target className="w-3.5 h-3.5" /> Opportunités
          </TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs font-mono gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Décisions
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="signals" className="mt-4"><SignalScanner /></TabsContent>
            <TabsContent value="model" className="mt-4"><MarketModeler /></TabsContent>
            <TabsContent value="opportunities" className="mt-4"><OpportunityRadar /></TabsContent>
            <TabsContent value="decisions" className="mt-4"><DecisionIntelligence /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
