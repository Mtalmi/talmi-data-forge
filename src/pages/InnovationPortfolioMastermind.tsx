import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Briefcase, Loader2, Layers, Shuffle, Gauge, PresentationIcon,
  PieChart, TrendingUp, ShieldCheck, Zap, ArrowUpRight, BarChart3,
  GitBranch, Target, Lightbulb, Scale, Activity, DollarSign
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

// ─── Portfolio Architect ─────────────────────────────────────
function PortfolioArchitect() {
  const [initiatives, setInitiatives] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Innovation Portfolio Mastermind de TBOS — architecte de portefeuille d'innovation pour le BPE au Maroc.

MISSION: Construire le scénario de portefeuille optimal à partir des initiatives décrites.

${initiatives.trim() ? `INITIATIVES DÉCRITES:\n${initiatives}` : `UTILISE CES INITIATIVES TBOS PAR DÉFAUT:
1. Béton Bas Carbone (B-Green) — R&D formules -40% CO₂, investissement 3M MAD
2. Plateforme IoT Chantier — Capteurs toupies + dashboard temps réel, 1.5M MAD
3. Service Pompage Premium — Flotte pompes propres vs sous-traitance, 8M MAD
4. Béton Autoplaçant B50+ — Formules haute performance pour infrastructure, 500K MAD
5. App Client Self-Service — Commande en ligne + suivi livraison, 800K MAD
6. Recyclage Retours Béton — Station de recyclage eau+granulats, 2M MAD`}

TBOS: 80M MAD CA, 200+ clients, zone Rabat-Salé, 50 camions, formules B25-B50.

ANALYSE DE PORTEFEUILLE COMPLÈTE:

1. 📊 MATRICE RISQUE/RENDEMENT
   Pour chaque initiative:
   - Rendement potentiel: ROI estimé (%), payback (mois), CA additionnel (MAD/an)
   - Risque: technique (1-5), marché (1-5), exécution (1-5), score composite
   - Ressources: CAPEX, OPEX annuel, FTEs requis, compétences clés
   - Score attractivité global: /100

2. 🔗 CARTE DES INTERDÉPENDANCES
   - Synergies: quelles initiatives se renforcent mutuellement
   - Conflits: lesquelles se cannibalisent ou rivalisent pour les mêmes ressources
   - Séquençage optimal: ordre de lancement pour maximiser les synergies

3. 🎯 SCÉNARIO OPTIMAL
   - Allocation budgétaire recommandée par initiative
   - Timeline sur 36 mois avec jalons
   - Mix stratégique: % Horizon 1 (core) / H2 (adjacent) / H3 (transformationnel)
   - ROI portefeuille consolidé

4. ⚖️ ÉQUILIBRE STRATÉGIQUE
   - Court terme vs long terme
   - Innovation incrémentale vs radicale
   - Défensif (protéger le CA) vs offensif (conquérir)

5. 🏆 VERDICT
   - Top 3 initiatives prioritaires avec justification
   - Initiative à différer/abandonner (et pourquoi)
   - Budget total recommandé et source de financement

Style: Chief Innovation Officer + Private Equity analyst. Chiffré, stratégique, décisif. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally { setLoading(false); }
  }, [initiatives]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Initiatives d'Innovation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={initiatives}
            onChange={e => setInitiatives(e.target.value)}
            placeholder="Décrivez vos initiatives d'innovation (ou laissez vide pour les initiatives TBOS par défaut)..."
            className="text-xs min-h-[80px] bg-muted/30"
          />
          <Button onClick={analyze} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PieChart className="w-4 h-4 mr-2" />}
            Architecturer le Portefeuille
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            Architecture Optimale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Briefcase className="w-8 h-8 opacity-30" />
                <span>Décrivez vos initiatives et lancez l'analyse</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Scenario Simulator ─────────────────────────────────────
function ScenarioSimulator() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<'bull' | 'base' | 'bear' | 'black-swan'>('base');
  const ctrlRef = useRef<AbortController | null>(null);

  const scenarios = [
    { id: 'bull' as const, label: 'Haussier', icon: TrendingUp, desc: 'BTP +15%, commande publique forte' },
    { id: 'base' as const, label: 'Base', icon: BarChart3, desc: 'Croissance stable +5%' },
    { id: 'bear' as const, label: 'Baissier', icon: Activity, desc: 'Ralentissement BTP, hausse ciment' },
    { id: 'black-swan' as const, label: 'Black Swan', icon: ShieldCheck, desc: 'Crise majeure imprévue' },
  ];

  const simulate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    const sc = scenarios.find(s => s.id === scenario)!;
    try {
      await streamAI(
        `Tu es l'Innovation Portfolio Mastermind — simulateur de scénarios pour TBOS.

SCÉNARIO: ${sc.label} — ${sc.desc}
TBOS: Centrale béton Maroc, 80M MAD CA, marge brute 35%, 200+ clients, 50 camions.

PORTEFEUILLE ACTUEL (6 initiatives):
1. B-Green (Béton Bas Carbone) — 3M MAD, Phase R&D
2. IoT Chantier — 1.5M MAD, Phase Pilote
3. Pompage Premium — 8M MAD, Phase Décision
4. B50+ Haute Performance — 500K MAD, Phase Dev
5. App Client — 800K MAD, Phase Dev
6. Recyclage Retours — 2M MAD, Phase Étude

SIMULATION COMPLÈTE SOUS SCÉNARIO "${sc.label.toUpperCase()}":

1. 📊 IMPACT SUR CHAQUE INITIATIVE
   Pour chacune: ROI ajusté, probabilité de succès, timeline modifiée, risque revu

2. 💰 P&L PORTEFEUILLE (36 mois)
   - Investissement total cumulé
   - Revenus additionnels année par année
   - Point mort du portefeuille
   - IRR (taux de rendement interne)

3. ⚡ STRESS TEST
   - Quelle initiative souffre le plus?
   - Quelle initiative surperforme?
   - Corrélations dangereuses entre initiatives

4. 🔄 AJUSTEMENTS RECOMMANDÉS
   - Réallocation budgétaire sous ce scénario
   - Initiatives à accélérer / ralentir / pivoter / abandonner
   - Hedging: comment protéger le portefeuille

5. 📈 SCÉNARIO COMPARATIF
   - Tableau: Base vs ${sc.label} pour chaque KPI
   - Écart de valeur du portefeuille (MAD)
   - Probabilité de ce scénario: X%

6. 🎯 DÉCISION STRATÉGIQUE
   - "Si ${sc.label}: nous devons immédiatement..."
   - Signaux d'alerte à surveiller pour détecter ce scénario
   - Plan de contingence en 5 points

Style: Chief Strategy Officer + Risk Manager. Quantitatif, scénarisé, décisif. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally { setLoading(false); }
  }, [scenario]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${scenario === s.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <s.icon className={`w-4 h-4 ${scenario === s.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{s.label}</span>
                <span className="text-[9px] text-muted-foreground text-center">{s.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={simulate} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shuffle className="w-4 h-4 mr-2" />}
            Simuler — Scénario {scenarios.find(s => s.id === scenario)?.label}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-400" />
            Simulation de Scénario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <GitBranch className="w-8 h-8 opacity-30" />
                <span>Choisissez un scénario et lancez la simulation</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Real-Time Optimizer ─────────────────────────────────────
function RealtimeOptimizer() {
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const optimize = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Innovation Portfolio Mastermind — optimiseur temps réel du portefeuille TBOS.

${context.trim() ? `CHANGEMENT/ÉVÉNEMENT SIGNALÉ:\n${context}` : `ÉVÉNEMENT PAR DÉFAUT: Le prix du ciment CPJ45 vient d'augmenter de 12% suite à la hausse des coûts énergétiques. Par ailleurs, un grand projet d'infrastructure (tramway extension Rabat) vient d'être annoncé pour 2B MAD.`}

PORTEFEUILLE EN COURS:
1. B-Green (3M MAD, ROI estimé 180%, phase R&D) — 40% budget
2. IoT Chantier (1.5M MAD, ROI 120%, pilote) — 15%
3. Pompage Premium (8M MAD, ROI 90%, décision) — 0% (pas encore lancé)
4. B50+ (500K MAD, ROI 250%, dev) — 10%
5. App Client (800K MAD, ROI 150%, dev) — 15%
6. Recyclage (2M MAD, ROI 80%, étude) — 20%

AJUSTEMENTS TEMPS RÉEL:

1. ⚡ IMPACT IMMÉDIAT
   - Quelles initiatives sont touchées et comment
   - Changement de ROI / risque / timeline pour chacune

2. 🔄 RÉALLOCATION RECOMMANDÉE
   - Nouveau mix % par initiative (AVANT → APRÈS)
   - Justification de chaque changement
   - Budget à réallouer (MAD)

3. 🎯 ACTIONS PRIORITAIRES (cette semaine)
   - 3 décisions urgentes
   - 2 investigations à lancer
   - 1 initiative à accélérer

4. 📊 NOUVEAU P&L PROJETÉ
   - ROI portefeuille avant/après ajustement
   - Impact sur le CA additionnel à 24 mois
   - Nouveau risque portefeuille consolidé

5. 🧭 PIVOT STRATÉGIQUE
   - "Cet événement nous pousse vers..."
   - Opportunité cachée à saisir
   - Menace sous-estimée à couvrir

Style: Portfolio Manager + trader de hedge fund. Réactif, chiffré, orienté action. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally { setLoading(false); }
  }, [context]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Événement / Changement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Décrivez l'événement ou le changement (hausse prix ciment, nouveau concurrent, résultat d'un pilote, changement réglementaire...)
Laissez vide pour un scénario par défaut."
            className="text-xs min-h-[70px] bg-muted/30"
          />
          <Button onClick={optimize} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gauge className="w-4 h-4 mr-2" />}
            Optimiser le Portefeuille
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            Ajustements Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Gauge className="w-8 h-8 opacity-30" />
                <span>Décrivez un événement pour recalibrer le portefeuille</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Strategic Narrator ──────────────────────────────────────
function StrategicNarrator() {
  const [audience, setAudience] = useState<'board' | 'team' | 'investors'>('board');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const audiences = [
    { id: 'board' as const, label: 'Conseil d\'Admin', icon: Briefcase, desc: 'Gouvernance et vision stratégique' },
    { id: 'team' as const, label: 'Équipe R&D', icon: Lightbulb, desc: 'Motivation et roadmap exécution' },
    { id: 'investors' as const, label: 'Investisseurs', icon: DollarSign, desc: 'ROI, multiples et exit' },
  ];

  const narrate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    const aud = audiences.find(a => a.id === audience)!;
    try {
      await streamAI(
        `Tu es l'Innovation Portfolio Mastermind — narrateur stratégique pour TBOS.

AUDIENCE: ${aud.label} — ${aud.desc}
TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, en transformation digitale + innovation.

PORTEFEUILLE D'INNOVATION (état actuel):
1. B-Green (Béton Bas Carbone) — 3M MAD investis, Phase R&D, ROI estimé 180%
2. IoT Chantier — 1.5M MAD, Pilote en cours chez 3 clients, satisfaction 9/10
3. Pompage Premium — 8M MAD, En attente de décision CEO
4. B50+ Haute Performance — 500K MAD, Développement avancé, premiers tests réussis
5. App Client Self-Service — 800K MAD, Beta avec 20 clients, NPS 72
6. Recyclage Retours — 2M MAD, Étude de faisabilité positive

GÉNÈRE UNE PRÉSENTATION STRATÉGIQUE POUR "${aud.label.toUpperCase()}":

${audience === 'board' ? `
1. 📋 RÉSUMÉ EXÉCUTIF (1 paragraphe percutant)
2. 🎯 VISION STRATÉGIQUE — Où va TBOS dans 5 ans grâce à l'innovation
3. 📊 TABLEAU DE BORD PORTEFEUILLE
   - Investissement total: X MAD | ROI moyen: X% | Initiatives on-track: X/6
   - Mix H1/H2/H3 et comparaison avec best practices
4. 🏆 FAITS SAILLANTS — 3 victoires majeures ce trimestre
5. ⚠️ POINTS D'ATTENTION — Risques à surveiller et décisions attendues
6. 💰 DEMANDE — Budget/ressources nécessaires pour le prochain trimestre
7. 📅 JALONS CLÉs — Prochains 90 jours` : audience === 'team' ? `
1. 🚀 ÉTAT DE LA MISSION — Où en sommes-nous (avec fierté!)
2. 🏆 CÉLÉBRATIONS — Succès récents de l'équipe (nommer les personnes)
3. 📊 SCOREBOARD — Progression de chaque initiative (% avancement, KPIs)
4. 🎯 FOCUS SPRINT — Les 3 priorités des 30 prochains jours
5. 🔧 BLOCAGES — Ce qu'il faut résoudre (avec solutions proposées)
6. 💡 INSPIRATION — Ce que font les meilleurs (benchmarks internationaux)
7. 🗺️ ROADMAP — Vue trimestre avec responsabilités` : `
1. 💎 THÈSE D'INVESTISSEMENT — Pourquoi TBOS est une plateforme d'innovation
2. 📊 MÉTRIQUES CLÉs
   - TAM/SAM/SOM pour chaque initiative
   - IRR portefeuille et payback
   - Multiples de valorisation sectoriels
3. 🏗️ PIPELINE DE VALEUR — Comment 15.8M MAD deviennent 80M+ MAD de CA additionnel
4. 🛡️ MOAT COMPÉTITIF — Avantages durables construits par l'innovation
5. 📈 PROJECTIONS — P&L à 5 ans avec impact innovation
6. ⚡ CATALYSEURS — Ce qui peut accélérer (partenariats, subventions, réglementation)
7. 🎯 ASK — Montant, utilisation des fonds, timeline de rendement`}

Style: ${audience === 'board' ? 'McKinsey senior partner' : audience === 'team' ? 'CTO inspirant + coach agile' : 'Goldman Sachs MD'}. Convaincant, structuré, impactant. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally { setLoading(false); }
  }, [audience]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {audiences.map(a => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${audience === a.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <a.icon className={`w-4 h-4 ${audience === a.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{a.label}</span>
                <span className="text-[9px] text-muted-foreground text-center">{a.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={narrate} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PresentationIcon className="w-4 h-4 mr-2" />}
            Générer la Présentation — {audiences.find(a => a.id === audience)?.label}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <PresentationIcon className="w-4 h-4 text-amber-400" />
            Narratif Stratégique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <PresentationIcon className="w-8 h-8 opacity-30" />
                <span>Choisissez votre audience et générez le narratif</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function InnovationPortfolioMastermind() {
  const [activeTab, setActiveTab] = useState('architect');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 border border-primary/30">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Innovation Portfolio Mastermind</h1>
            <p className="text-xs text-muted-foreground">Architecturer, Simuler, Optimiser, Narrer — la science du portefeuille d'innovation</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mastermind Actif</span>
          </div>
          <span>6 initiatives</span>
          <span>4 scénarios</span>
          <span>3 audiences</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="architect" className="text-xs font-mono gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Architecte
          </TabsTrigger>
          <TabsTrigger value="simulate" className="text-xs font-mono gap-1.5">
            <GitBranch className="w-3.5 h-3.5" /> Simulateur
          </TabsTrigger>
          <TabsTrigger value="optimize" className="text-xs font-mono gap-1.5">
            <Gauge className="w-3.5 h-3.5" /> Optimiseur
          </TabsTrigger>
          <TabsTrigger value="narrate" className="text-xs font-mono gap-1.5">
            <PresentationIcon className="w-3.5 h-3.5" /> Narrateur
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="architect" className="mt-4"><PortfolioArchitect /></TabsContent>
            <TabsContent value="simulate" className="mt-4"><ScenarioSimulator /></TabsContent>
            <TabsContent value="optimize" className="mt-4"><RealtimeOptimizer /></TabsContent>
            <TabsContent value="narrate" className="mt-4"><StrategicNarrator /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
