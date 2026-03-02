import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Atom, Loader2, Shuffle, FlaskConical, Rocket, MessageCircle,
  Sparkles, Zap, Brain, Dna, Orbit, Flame, Wind, Puzzle,
  Lightbulb, Target, BarChart3, Eye, Microscope
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

// ─── Concept Atomizer ────────────────────────────────────────
function ConceptAtomizer() {
  const [domains, setDomains] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const atomize = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(
        `Tu es l'Innovation Fusion Reactor de TBOS — atomiseur de concepts qui génère des idées radicalement nouvelles par combinaison interdisciplinaire.

${domains.trim() ? `DOMAINES À FUSIONNER: ${domains}` : `DOMAINES PAR DÉFAUT: Biomimétisme × Béton × Intelligence Artificielle × Économie Circulaire`}

CONTEXTE TBOS: Centrale béton prêt à l'emploi, Maroc, 80M MAD CA, 200+ clients BTP.

PROCESSUS DE FUSION ATOMIQUE:

1. ⚛️ ATOMISATION — Décompose chaque domaine en ses principes fondamentaux
   Pour chaque domaine: 5 principes atomiques (le "ADN" conceptuel)

2. 🔬 COLLISIONS CONCEPTUELLES — Croise CHAQUE principe avec CHAQUE autre domaine
   Génère 8 collisions inattendues avec notation d'énergie (⚡×1 à ⚡×5)

3. 💥 RÉACTIONS DE FUSION — Les 5 idées les plus explosives nées des collisions
   Pour chaque idée:
   - 🏷️ NOM DE CODE — Nom évocateur et mémorable
   - 🧬 FORMULE DE FUSION — "Principe A × Principe B = Innovation C"
   - 💡 DESCRIPTION — En quoi c'est radicalement nouveau (3-4 lignes)
   - 🎯 APPLICATION BÉTON — Comment TBOS l'applique concrètement
   - 📊 POTENTIEL — Disruptif / Transformationnel / Incrémental
   - 🌡️ TEMPÉRATURE D'INNOVATION — Tiède / Chaud / Brûlant / Thermonucléaire

4. 🌟 IDÉE THERMONUCLÉAIRE — L'idée la plus folle et la plus prometteuse
   - Développement complet en 10 lignes
   - Pourquoi personne n'y a pensé
   - Premier prototype possible en combien de temps

5. 🧪 MUTATIONS SECONDAIRES — 3 variations/évolutions de l'idée thermonucléaire

Style: Mad Scientist × Venture Capitalist. Audacieux, provocateur, visionnaire. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [domains]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={domains} onChange={e => setDomains(e.target.value)} placeholder="Entrez 2-5 domaines à fusionner (ex: 'Mycelium × Blockchain × Acoustique × Origami')
Laissez vide pour une fusion surprise..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={atomize} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Atom className="w-4 h-4 mr-2" />}
            Déclencher la Fusion
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Dna className="w-4 h-4 text-amber-400" />Réactions de Fusion</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Atom className="w-8 h-8 opacity-30" /><span>Entrez des domaines et déclenchez la fusion conceptuelle</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Synergy Detector ────────────────────────────────────────
function SynergyDetector() {
  const [seed, setSeed] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState<'surface' | 'deep' | 'abyssal'>('deep');
  const ctrlRef = useRef<AbortController | null>(null);

  const depths = [
    { id: 'surface' as const, label: 'Surface', icon: Wind, desc: 'Analogies évidentes' },
    { id: 'deep' as const, label: 'Profond', icon: Brain, desc: 'Connexions cachées' },
    { id: 'abyssal' as const, label: 'Abyssal', icon: Orbit, desc: 'Liens impossibles' },
  ];

  const detect = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    const d = depths.find(x => x.id === depth)!;
    try {
      await streamAI(
        `Tu es l'Innovation Fusion Reactor — détecteur de synergies ${d.label.toLowerCase()} entre concepts apparemment sans rapport.

NIVEAU DE PROFONDEUR: ${d.label} — ${d.desc}
${seed.trim() ? `CONCEPT DE DÉPART: ${seed}` : `CONCEPT DE DÉPART: Le béton qui s'auto-répare`}
TBOS: Centrale béton Maroc, innovation industrielle.

DÉTECTION DE SYNERGIES (niveau ${d.label}):

${depth === 'surface' ? `
1. 🔗 ANALOGIES DIRECTES — 5 innovations d'autres industries directement transposables
   Pour chaque: Source → Mécanisme → Application béton → Faisabilité (%)

2. 📊 TRANSFERTS TECHNOLOGIQUES — 3 technologies existantes à détourner
   Pour chaque: Techno originale → Détournement → Avantage compétitif

3. 🎯 QUICK WINS — 3 idées implémentables en <6 mois` : depth === 'deep' ? `
1. 🧠 PATTERNS CACHÉS — Structures profondes communes entre domaines
   - 5 patterns identifiés avec exemples croisés
   - Pour chaque: Pattern → Domaine A → Domaine B → Fusion C

2. 🔬 RAISONNEMENT SYMBOLIQUE — Métaphores productives
   - "Le béton est comme [X] parce que [Y], donc on pourrait [Z]"
   - 4 métaphores avec innovations concrètes qui en découlent

3. 🌐 GRAPHE DE CONNEXIONS — Carte des liens non-évidents
   - 6 nœuds connectés avec force de lien (faible/moyen/fort)
   - 3 chemins d'innovation à travers le graphe

4. 💎 INSIGHT FONDAMENTAL — La connexion la plus profonde découverte` : `
1. 🕳️ CONNEXIONS IMPOSSIBLES — 5 liens entre concepts qui n'ont RIEN en commun
   Pour chaque: Concept A ↔ Concept B → Pourquoi c'est absurde → Pourquoi c'est génial

2. 🌀 RAISONNEMENT PAR L'ABSURDE — "Et si le béton était..." 
   - Vivant? Intelligent? Éphémère? Musical? Comestible?
   - 5 scénarios absurdes → 5 innovations réelles qui en émergent

3. 🔮 PREMIÈRE PRINCIPES COSMIQUES
   - Lois physiques fondamentales appliquées au béton de manière inédite
   - Thermodynamique, entropie, fractales, émergence → innovations

4. 🧬 CHIMÈRES CONCEPTUELLES — 3 fusions de 3+ domaines sans rapport
   - Nom / Formule / Description / Pourquoi c'est révolutionnaire

5. ⚡ L'IDÉE INTERDITE — Celle que personne n'oserait proposer
   - Description complète et argumentaire provocateur`}

Style: Philosophe des sciences × Inventeur fou. Profond, surprenant, transformateur. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [seed, depth]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {depths.map(d => (
              <button key={d.id} onClick={() => setDepth(d.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${depth === d.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <d.icon className={`w-4 h-4 ${depth === d.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{d.label}</span>
                <span className="text-[9px] text-muted-foreground">{d.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={seed} onChange={e => setSeed(e.target.value)} placeholder="Concept de départ (ex: 'béton photovoltaïque', 'logistique prédictive')..." className="text-xs min-h-[45px] bg-muted/30 flex-1" />
            <Button onClick={detect} disabled={loading} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Puzzle className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Brain className="w-4 h-4 text-amber-400" />Synergies Détectées</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Brain className="w-8 h-8 opacity-30" /><span>Choisissez une profondeur et détectez les synergies</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Virtual Stress Lab ──────────────────────────────────────
function VirtualStressLab() {
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const stressTest = useCallback(async () => {
    if (!idea.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(
        `Tu es l'Innovation Fusion Reactor — laboratoire de stress-test virtuel haute fidélité.

IDÉE À TESTER: ${idea}
TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, 50 camions.

SIMULATION ET PROTOTYPAGE VIRTUEL:

1. 🏗️ PROTOTYPE VIRTUEL
   - Spécifications techniques détaillées
   - Architecture / composants / matériaux / processus
   - Schéma fonctionnel en texte (ASCII art simplifié)

2. 🔥 STRESS TESTS (5 dimensions)
   - 📐 FAISABILITÉ TECHNIQUE — Score /10, obstacles, solutions
   - 💰 VIABILITÉ ÉCONOMIQUE — Coûts, revenus, break-even, ROI
   - 🌍 IMPACT MARCHÉ — Différenciation, adoption, disruption
   - ⚖️ CONFORMITÉ — Normes NM, réglementation, certifications
   - 🌱 DURABILITÉ — Impact environnemental, cycle de vie

3. 💀 KILL SCENARIOS — 3 façons dont cette idée pourrait échouer
   Pour chaque: Scénario → Probabilité → Mitigation

4. 🚀 BOOST SCENARIOS — 3 façons dont elle pourrait exploser
   Pour chaque: Catalyseur → Impact → Comment le provoquer

5. 📊 VERDICT DU RÉACTEUR
   - Score de fusion: /100
   - Recommandation: GO / PIVOT / ITERATE / KILL
   - Si GO: premiers 5 steps d'exécution
   - Si PIVOT: dans quelle direction

6. 🧬 MUTATIONS — 3 versions évoluées de l'idée originale

Style: CTO + Lab Director. Rigoureux, quantitatif, constructif. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [idea]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Décrivez l'idée d'innovation à stress-tester (ex: 'Béton auto-chauffant pour cure hivernale utilisant des nanotubes de carbone et une alimentation solaire intégrée')..." className="text-xs min-h-[70px] bg-muted/30" />
          <Button onClick={stressTest} disabled={loading || !idea.trim()} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Microscope className="w-4 h-4 mr-2" />}
            Lancer le Stress Test Virtuel
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><FlaskConical className="w-4 h-4 text-amber-400" />Résultats du Laboratoire</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><FlaskConical className="w-8 h-8 opacity-30" /><span>Décrivez une idée à prototyper et stress-tester</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Provocation Engine ──────────────────────────────────────
function ProvocationEngine() {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'wildcard' | 'assumption' | 'reversal'>('wildcard');
  const ctrlRef = useRef<AbortController | null>(null);

  const modes = [
    { id: 'wildcard' as const, label: 'Wild Cards', icon: Sparkles, desc: 'Injections aléatoires' },
    { id: 'assumption' as const, label: 'Briseur', icon: Flame, desc: 'Détruire les hypothèses' },
    { id: 'reversal' as const, label: 'Inversion', icon: Shuffle, desc: 'Tout retourner' },
  ];

  const provoke = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    const m = modes.find(x => x.id === mode)!;
    try {
      await streamAI(
        `Tu es l'Innovation Fusion Reactor — moteur de provocation créative. Tu es irrespectueux envers le statu quo, jamais envers les personnes.

MODE: ${m.label} — ${m.desc}
${topic.trim() ? `SUJET: ${topic}` : `SUJET: Comment TBOS devrait vendre du béton dans 10 ans`}
TBOS: Centrale béton Maroc, 80M MAD CA.

${mode === 'wildcard' ? `🃏 INJECTION DE WILD CARDS:

1. WILD CARD #1: "Et si [événement improbable]?"
   - Scénario complet
   - Comment ça change tout pour le béton
   - Innovation qui en émerge

2. WILD CARD #2: "Et si [technologie de science-fiction] existait?"
   - Impact sur l'industrie BPE
   - Comment TBOS en profite avant les autres

3. WILD CARD #3: "Et si [contrainte extrême] s'imposait?"
   - Adaptation forcée → innovation de nécessité
   - Le produit/service qui n'existerait pas sans cette contrainte

4. WILD CARD #4: "Et si [acteur inattendu] entrait dans le marché?"
   - Tesla du béton? Amazon du BTP? Un ado avec une imprimante 3D?
   - Comment ça redistribue les cartes

5. 🎰 LE JOKER — La wild card la plus délirante, celle qui fait rire... puis réfléchir
   - Description complète + pourquoi ce n'est pas si fou` : mode === 'assumption' ? `💣 DESTRUCTION D'HYPOTHÈSES:

Liste des hypothèses TBOS à détruire:
1. "Le béton doit être livré par toupie" → ET SI NON?
2. "Les clients commandent par téléphone" → ET SI NON?
3. "La qualité se mesure en résistance MPa" → ET SI NON?
4. "Plus de volume = plus de profit" → ET SI NON?
5. "Le béton est un commodity" → ET SI NON?

Pour CHAQUE hypothèse:
- 💥 DESTRUCTION — Pourquoi c'est faux/obsolète
- 🔄 REMPLACEMENT — La nouvelle vérité
- 💡 INNOVATION — Le produit/service qui naît de cette destruction
- 📊 IMPACT — Taille de l'opportunité (MAD)
- 🏆 EXEMPLE — Qui a déjà fait ça dans une autre industrie

6. 🧨 L'HYPOTHÈSE SACRÉE — Celle que PERSONNE n'ose remettre en question
   - Identification → Destruction → Renaissance` : `🔄 INVERSION TOTALE:

Prenons tout ce que TBOS fait et INVERSONS:

1. ↕️ INVERSION PRODUIT
   - "Au lieu de VENDRE du béton, on..." → Innovation
   - "Au lieu de béton SOLIDE, on..." → Innovation
   - "Au lieu de béton GRIS, on..." → Innovation

2. ↕️ INVERSION PROCESSUS
   - "Au lieu que LE CLIENT vienne à nous, on..." → Innovation
   - "Au lieu de PRODUIRE puis livrer, on..." → Innovation
   - "Au lieu de FACTURER au m³, on..." → Innovation

3. ↕️ INVERSION BUSINESS MODEL
   - "Au lieu de B2B, on..." → Innovation
   - "Au lieu de POSSÉDER les camions, on..." → Innovation
   - "Au lieu de CONCURRENCER les rivaux, on..." → Innovation

4. ↕️ INVERSION TEMPORELLE
   - "Au lieu de RÉAGIR à la demande, on..." → Innovation
   - "Au lieu de livrer EN JOURNÉE, on..." → Innovation

5. 🌀 DOUBLE INVERSION — Inverser l'inversion pour trouver le sweet spot
   - Les 3 meilleures innovations issues de ce processus`}

CLÔTURE: 🔥 LE DÉFI — Une question provocatrice que l'équipe TBOS devrait débattre cette semaine.

Style: Enfant terrible × Socrate × Elon Musk. Provocateur, ludique, transformateur. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [topic, mode]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {modes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${mode === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <m.icon className={`w-4 h-4 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[9px] text-muted-foreground">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Sujet à provoquer (ou laissez vide pour un sujet par défaut)..." className="text-xs min-h-[45px] bg-muted/30 flex-1" />
            <Button onClick={provoke} disabled={loading} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Flame className="w-4 h-4 text-amber-400" />Provocations Créatives</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Flame className="w-8 h-8 opacity-30" /><span>Choisissez un mode et provoquez l'innovation</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function InnovationFusionReactor() {
  const [activeTab, setActiveTab] = useState('atomizer');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30">
            <Atom className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Innovation Fusion Reactor</h1>
            <p className="text-xs text-muted-foreground">Atomiser, Fusionner, Stress-Tester, Provoquer — le réacteur d'idées révolutionnaires</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span>Réacteur Actif</span>
          </div>
          <span>∞ domaines</span>
          <span>3 profondeurs</span>
          <span>3 modes provocation</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="atomizer" className="text-xs font-mono gap-1.5">
            <Atom className="w-3.5 h-3.5" /> Atomiseur
          </TabsTrigger>
          <TabsTrigger value="synergy" className="text-xs font-mono gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Synergies
          </TabsTrigger>
          <TabsTrigger value="stresslab" className="text-xs font-mono gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" /> Stress Lab
          </TabsTrigger>
          <TabsTrigger value="provoke" className="text-xs font-mono gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Provocation
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="atomizer" className="mt-4"><ConceptAtomizer /></TabsContent>
            <TabsContent value="synergy" className="mt-4"><SynergyDetector /></TabsContent>
            <TabsContent value="stresslab" className="mt-4"><VirtualStressLab /></TabsContent>
            <TabsContent value="provoke" className="mt-4"><ProvocationEngine /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
