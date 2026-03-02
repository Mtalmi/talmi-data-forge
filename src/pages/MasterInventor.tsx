import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Wrench, Cpu, FlaskConical, Users, Play, Loader2, Sparkles,
  Lightbulb, Search, Atom, Rocket, Cog, Layers, Zap, CheckCircle2,
  FileText, Hammer, ArrowRight, BarChart3, Shield, Target
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

// ─── Insight Synthesizer ─────────────────────────────────────
function InsightSynthesizer() {
  const lenses = [
    { id: 'customer', name: 'Besoins Clients', icon: Users, desc: 'Douleurs non-adressées, jobs-to-be-done, segments sous-servis' },
    { id: 'market', name: 'Tendances Marché', icon: BarChart3, desc: 'Méga-tendances BTP, évolutions réglementaires, nouveaux usages' },
    { id: 'tech', name: 'Frontière Technologique', icon: Cpu, desc: 'Matériaux avancés, IoT, IA embarquée, impression 3D béton' },
    { id: 'cross', name: 'Pollinisation Croisée', icon: Layers, desc: 'Innovations d\'autres industries adaptables au béton' },
  ];

  const [selected, setSelected] = useState<string[]>(['customer', 'tech']);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const synthesize = useCallback(async () => {
    if (!selected.length) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);
    const names = lenses.filter(d => selected.includes(d.id)).map(d => `${d.name}: ${d.desc}`);
    try {
      await streamAI(
        `Tu es le Master Inventor de TBOS — centrale à béton au Maroc, 500m³/jour, 50 camions, 200+ clients BTP.

MISSION: Synthétise des OPPORTUNITÉS D'INVENTION à partir de ces axes: ${names.join('; ')}

Pour CHAQUE axe:
1. 🔍 SIGNAUX — 3-4 signaux forts et faibles détectés
2. 💡 INSIGHTS — Ce que ces signaux révèlent comme besoins latents
3. 🎯 ESPACES D'INVENTION — Zones blanches où personne n'innove encore

Termine par:
4. 🧬 MATRICE DE CONVERGENCE — Croisement des axes → 3 opportunités d'invention à fort potentiel
5. 🏆 L'OPPORTUNITÉ EN OR — L'espace d'invention le plus prometteur avec justification

Style: Thomas Edison rencontre Clayton Christensen. Rigoureux mais visionnaire. Français.`,
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
            <Search className="w-4 h-4 text-primary" />
            Axes d'Exploration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lenses.map(d => (
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
          <Button onClick={synthesize} disabled={loading || !selected.length} className="w-full mt-2" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Synthétiser ({selected.length} axes)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Atom className="w-4 h-4 text-amber-400" />
            Opportunités d'Invention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Atom className="w-8 h-8 opacity-30" />
                <span>Sélectionnez des axes et lancez la synthèse</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Invention Engine ────────────────────────────────────────
function InventionEngine() {
  const [focus, setFocus] = useState('');
  const [inventions, setInventions] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'product' | 'process' | 'hybrid'>('product');
  const ctrlRef = useRef<AbortController | null>(null);

  const modes = [
    { id: 'product' as const, label: 'Produit', icon: Wrench, desc: 'Nouveaux produits béton' },
    { id: 'process' as const, label: 'Procédé', icon: Cog, desc: 'Process innovants' },
    { id: 'hybrid' as const, label: 'Hybride', icon: Zap, desc: 'Produit + Service' },
  ];

  const generate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setInventions('');
    setLoading(true);

    const modePrompt = mode === 'product'
      ? 'FOCUS PRODUIT: Nouvelles formulations béton, produits préfabriqués, matériaux composites, bétons intelligents, bétons à propriétés spéciales.'
      : mode === 'process'
        ? 'FOCUS PROCÉDÉ: Automatisation production, logistique prédictive, contrôle qualité temps réel, maintenance autonome, optimisation énergétique.'
        : 'FOCUS HYBRIDE: Solutions produit+service intégrées, béton-as-a-service, plateformes digitales, offres clé-en-main avec monitoring.';

    try {
      await streamAI(
        `Tu es le Master Inventor de TBOS — génie inventif industriel pour le béton prêt à l'emploi.

${modePrompt}
${focus ? `DIRECTION SPÉCIFIQUE: ${focus}` : ''}
TBOS: Centrale béton Maroc, 500m³/jour, formules B25-B50, 50 camions.

Génère 5 INVENTIONS BREVETABLES:

Pour chaque invention:
- 🔬 NOM DE CODE — Titre accrocheur (ex: "CryoBéton", "SmartPour")
- 📜 REVENDICATION PRINCIPALE — En 1 phrase technique (style brevet)
- 💡 DESCRIPTION — Comment ça marche (3-4 phrases)
- 🎯 PROBLÈME RÉSOLU — Douleur client éliminée
- 📊 AVANTAGE COMPÉTITIF — Ce qui le rend unique et défendable
- 💰 POTENTIEL COMMERCIAL — Taille marché estimée (MAD/an)
- ⚡ FAISABILITÉ — Score /10 avec justification
- 🛡️ BREVETABILITÉ — Éléments de nouveauté et non-évidence

Termine par:
🏆 L'INVENTION STAR — Celle avec le meilleur ratio impact/faisabilité
📋 PROCHAINES ÉTAPES — 3 actions concrètes pour la développer

Style: Inventeur prolifique + analyste PI. Précis, technique, ambitieux. Français.`,
        (t) => setInventions(h => h + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setInventions(h => h + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [focus, mode]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${mode === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <m.icon className={`w-4 h-4 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[9px] text-muted-foreground">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={focus} onChange={e => setFocus(e.target.value)} placeholder="Direction optionnelle: un matériau, un besoin client, une contrainte..." className="text-xs min-h-[45px] bg-muted/30 flex-1" />
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
            Inventions — {modes.find(m => m.id === mode)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {inventions ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{inventions}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Lightbulb className="w-8 h-8 opacity-30" />
                <span>Choisissez un mode et générez des inventions</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Virtual Prototyper ──────────────────────────────────────
function VirtualPrototyper() {
  const [concept, setConcept] = useState('');
  const [prototype, setPrototype] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const simulate = useCallback(async () => {
    if (!concept.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setPrototype('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es le Master Inventor de TBOS en mode "Prototypage Virtuel" — simulateur d'inventions industrielles.

CONCEPT À PROTOTYPER: ${concept}
TBOS: Centrale béton Maroc, formules B25-B50, capacité 500m³/jour.

SIMULE UN PROTOTYPAGE VIRTUEL COMPLET:

1. 📐 SPÉCIFICATIONS TECHNIQUES
   - Caractéristiques clés (dimensions, compositions, paramètres)
   - Matériaux et composants nécessaires
   - Conditions de fonctionnement

2. 🧪 SIMULATION DE PERFORMANCE
   - Test #1: Performance nominale — résultats attendus
   - Test #2: Conditions extrêmes — comportement aux limites
   - Test #3: Durabilité — projections de vie utile
   - Test #4: Comparatif vs solution existante — gains mesurés

3. ⚠️ RISQUES IDENTIFIÉS
   - Risques techniques (3-4) avec probabilité et mitigation
   - Risques commerciaux (2-3) avec stratégie

4. 💰 ANALYSE COÛT-BÉNÉFICE
   - Coût de développement (R&D, outillage, certification)
   - Coût unitaire de production vs prix de vente cible
   - Point mort et timeline de rentabilité

5. 🔄 ITÉRATIONS RECOMMANDÉES
   - 3 améliorations prioritaires du concept
   - Variant A vs Variant B — quel chemin prendre

6. ✅ VERDICT DE PROTOTYPAGE
   - Score de maturité TRL (1-9) avec justification
   - Go / Pivot / Kill — recommandation avec conditions

Style: Ingénieur R&D senior + analyste financier. Rigoureux et chiffré. Français.`,
        (t) => setPrototype(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setPrototype(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [concept]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Textarea
              value={concept}
              onChange={e => setConcept(e.target.value)}
              placeholder="Décrivez le concept à prototyper virtuellement... (ex: 'Béton auto-cicatrisant avec capsules bactériennes', 'Système de dosage prédictif par IA')"
              className="text-xs min-h-[60px] bg-muted/30 flex-1"
            />
            <Button onClick={simulate} disabled={loading || !concept.trim()} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            Prototype Virtuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {prototype ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{prototype}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <FlaskConical className="w-8 h-8 opacity-30" />
                <span>Entrez un concept d'invention à prototyper</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── R&D Collaborator ────────────────────────────────────────
function RDCollaborator() {
  const phases = [
    { id: 'feasibility', name: '🔬 Étude de Faisabilité', desc: 'Validation technique et économique du concept' },
    { id: 'development', name: '🛠️ Plan de Développement', desc: 'Roadmap R&D avec jalons et ressources' },
    { id: 'manufacturing', name: '🏭 Industrialisation', desc: 'Passage du labo à la production en série' },
    { id: 'scaling', name: '🚀 Mise à l\'Échelle', desc: 'Déploiement commercial et montée en capacité' },
  ];

  const [selectedPhase, setSelectedPhase] = useState(phases[0]);
  const [invention, setInvention] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const collaborate = useCallback(async () => {
    if (!invention.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setPlan('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es le Master Inventor en mode "Collaboration R&D" — chef de projet innovation industrielle.

INVENTION: ${invention}
PHASE: ${selectedPhase.name} — ${selectedPhase.desc}
TBOS: Centrale béton Maroc, équipe technique de 15 personnes, budget R&D 2M MAD/an.

ÉLABORE UN PLAN DE ${selectedPhase.name.toUpperCase()}:

${selectedPhase.id === 'feasibility' ? `
1. 📋 CAHIER DES CHARGES TECHNIQUE — Spécifications fonctionnelles et non-fonctionnelles
2. 🧪 PROTOCOLE D'ESSAIS — Tests à réaliser avec méthodologie et critères de réussite
3. 📊 ANALYSE DE MARCHÉ — Taille, concurrence, positionnement prix
4. 💰 BUSINESS CASE — Investissement, revenus projetés, ROI à 3 ans
5. ⚠️ MATRICE DE RISQUES — Risques techniques/commerciaux/réglementaires
6. ✅ CRITÈRES GO/NO-GO — Seuils de décision pour passer à la phase suivante` :
selectedPhase.id === 'development' ? `
1. 📅 PLANNING R&D — Phases, jalons, livrables sur 12-18 mois (Gantt textuel)
2. 👥 ÉQUIPE PROJET — Profils nécessaires, rôles, % de temps dédié
3. 🔧 MOYENS TECHNIQUES — Équipements, logiciels, partenaires labo
4. 💰 BUDGET DÉTAILLÉ — Par phase et par poste de dépense
5. 📊 KPIs DE DÉVELOPPEMENT — Métriques de suivi et tableaux de bord
6. 🔄 PROCESSUS D'ITÉRATION — Cycles de test-learn-adapt` :
selectedPhase.id === 'manufacturing' ? `
1. 🏭 PROCESS DE FABRICATION — Étapes, machines, paramètres clés
2. 📐 CONTRÔLE QUALITÉ — Points de contrôle, tolérances, certification
3. 📦 SUPPLY CHAIN — Approvisionnement matières, stockage, logistique
4. 💰 COÛT DE REVIENT — Détail par composant + overhead
5. 📈 MONTÉE EN CADENCE — Plan de scaling de pilote à pleine production
6. 📋 NORMES & CERTIFICATIONS — Réglementation Maroc + export` :
`
1. 🚀 STRATÉGIE GO-TO-MARKET — Segments cibles, canaux, pricing
2. 📊 PLAN COMMERCIAL — Objectifs volume par trimestre, force de vente
3. 🌍 EXPANSION GÉOGRAPHIQUE — Priorités régionales puis export
4. 🤝 PARTENARIATS STRATÉGIQUES — Alliances pour accélérer l'adoption
5. 💰 PLAN DE FINANCEMENT — Sources (fonds propres, subventions, dette)
6. 📈 PROJECTIONS 5 ANS — P&L, cash flow, parts de marché`}

Style: Directeur R&D industriel expérimenté. Structuré, actionnable, réaliste. Français.`,
        (t) => setPlan(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setPlan(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [invention, selectedPhase]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Hammer className="w-4 h-4 text-primary" />
            Phase R&D
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {phases.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(p)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selectedPhase.id === p.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <span className="text-xs font-semibold block mb-1">{p.name}</span>
              <span className="text-[10px] text-muted-foreground">{p.desc}</span>
            </button>
          ))}
          <Textarea
            value={invention}
            onChange={e => setInvention(e.target.value)}
            placeholder="Nom/description de l'invention..."
            className="text-xs min-h-[45px] bg-muted/30 mt-2"
          />
          <Button onClick={collaborate} disabled={loading || !invention.trim()} className="w-full mt-1" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
            Planifier
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Plan — {selectedPhase.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[430px]">
            {plan ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{plan}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Rocket className="w-8 h-8 opacity-30" />
                <span>Décrivez une invention et sélectionnez une phase</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function MasterInventor() {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Master Inventor</h1>
            <p className="text-xs text-muted-foreground">Explorer, Inventer, Prototyper, Industrialiser — le moteur d'innovation brevetable</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Inventeur Actif</span>
          </div>
          <span>4 axes d'exploration</span>
          <span>3 modes d'invention</span>
          <span>4 phases R&D</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="insights" className="text-xs font-mono gap-1.5">
            <Search className="w-3.5 h-3.5" /> Insights
          </TabsTrigger>
          <TabsTrigger value="inventions" className="text-xs font-mono gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Inventions
          </TabsTrigger>
          <TabsTrigger value="prototype" className="text-xs font-mono gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" /> Prototype
          </TabsTrigger>
          <TabsTrigger value="rnd" className="text-xs font-mono gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> R&D
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="insights" className="mt-4"><InsightSynthesizer /></TabsContent>
            <TabsContent value="inventions" className="mt-4"><InventionEngine /></TabsContent>
            <TabsContent value="prototype" className="mt-4"><VirtualPrototyper /></TabsContent>
            <TabsContent value="rnd" className="mt-4"><RDCollaborator /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
