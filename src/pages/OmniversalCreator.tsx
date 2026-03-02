import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Orbit, Globe, Combine, BarChart3,
  Atom, Infinity, Sparkles, Zap, Eye
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

function useStream() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const run = useCallback(async (prompt: string) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(prompt, (t) => setResult(r => r + t), ctrl.signal);
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally { setLoading(false); }
  }, []);
  return { result, loading, run };
}

function ResultPanel({ result, icon: Icon, emptyText }: { result: string; icon: any; emptyText: string }) {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardContent className="pt-4">
        <ScrollArea className="h-[440px]">
          {result ? (
            <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
              <Icon className="w-8 h-8 opacity-30" /><span>{emptyText}</span>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Multiverse Traverser ────────────────────────────────────
function MultiverseTraverser() {
  const { result, loading, run } = useStream();
  const [universe, setUniverse] = useState<'physics' | 'bio' | 'digital' | 'abstract'>('physics');

  const universes = [
    { id: 'physics' as const, label: 'Lois Altérées', icon: Atom, desc: 'Physique alternative' },
    { id: 'bio' as const, label: 'Bio-Univers', icon: Globe, desc: 'Matière vivante' },
    { id: 'digital' as const, label: 'Méta-Digital', icon: Zap, desc: 'Réalité computée' },
    { id: 'abstract' as const, label: 'Abstrait Pur', icon: Infinity, desc: 'Au-delà de la matière' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {universes.map(u => (
              <button key={u.id} onClick={() => setUniverse(u.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${universe === u.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <u.icon className={`w-4 h-4 ${universe === u.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-[10px] font-semibold">{u.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => run(
            `Tu es l'Omniversal Creator — une intelligence qui transcende les univers parallèles pour y récolter des innovations littéralement inconcevables dans notre réalité.

UNIVERS EXPLORÉ: ${universes.find(u => u.id === universe)!.label} — ${universes.find(u => u.id === universe)!.desc}
ANCRAGE: TBOS, centrale béton Maroc, 80M MAD CA. Le point de départ dans NOTRE réalité.

TRAVERSÉE MULTIVERSELLE:

${universe === 'physics' ? `⚛️ UNIVERS-α — OÙ LES LOIS PHYSIQUES SONT DIFFÉRENTES

1. 🌌 COORDONNÉES DE L'UNIVERS
   - Constantes physiques altérées (gravité, vitesse lumière, constante de Planck)
   - Conséquences sur la matière, l'énergie, le temps
   - À quoi ressemble le "béton" dans cet univers

2. 🏗️ TECHNOLOGIES IMPOSSIBLES TROUVÉES (5)
   Pour chaque:
   - 🔬 NOM — Description de la technologie alien
   - ⚛️ Principe physique qui la rend possible LÀ-BAS
   - 🚫 Pourquoi impossible CHEZ NOUS (quelle loi l'interdit)
   - 🔄 L'ANALOGIE — La version "possible" adaptée à notre physique
   - 💡 L'innovation TBOS qui en découle
   - 💰 Potentiel: X MAD/an

3. 🧬 MATÉRIAUX EXOTIQUES
   3 matériaux qui n'existent pas dans notre univers:
   - Propriétés (résistance, densité, comportement)
   - L'équivalent le plus proche dans notre réalité
   - Comment s'en approcher avec notre technologie actuelle` :

universe === 'bio' ? `🧬 UNIVERS-β — OÙ TOUT EST VIVANT

1. 🌿 COORDONNÉES DE L'UNIVERS
   - La matière EST vivante (les roches respirent, le métal croît)
   - L'architecture se fait par culture, pas par construction
   - Les bâtiments naissent, grandissent, se reproduisent, meurent

2. 🌱 BIO-INNOVATIONS RÉCOLTÉES (5)
   Pour chaque:
   - 🧬 NOM — La technologie bio-sourcée de cet univers
   - 🌿 Comment elle fonctionne (biologie, symbiose, évolution)
   - 🔄 TRADUCTION — L'équivalent réalisable: bio-béton, béton auto-cicatrisant, structures mycelium
   - 📊 Maturité technologique dans NOTRE univers (TRL 1-9)
   - 💡 Application TBOS concrète
   - 🌍 Impact environnemental

3. 🦠 SYMBIOSES IMPOSSIBLES
   3 fusions organisme-matériau qui transformeraient le BTP:
   - Le concept bio-architectural
   - Les recherches qui s'en approchent ICI
   - Timeline de faisabilité` :

universe === 'digital' ? `💻 UNIVERS-γ — OÙ LA RÉALITÉ EST COMPUTATION PURE

1. 🖥️ COORDONNÉES DE L'UNIVERS
   - Tout est information, tout est calculable
   - Les objets physiques sont des programmes
   - Modifier la réalité = modifier le code source

2. 🔮 MÉTA-TECHNOLOGIES TROUVÉES (5)
   Pour chaque:
   - 💾 NOM — La technologie computationnelle
   - 🖥️ Comment elle "programme la réalité"
   - 🔄 TRADUCTION — L'équivalent via jumeaux numériques, IA, IoT, blockchain
   - 📊 Ce qui existe DÉJÀ vs ce qui est science-fiction
   - 💡 Application TBOS: comment ça digitalise radicalement nos opérations
   - ⚡ Gain d'efficience estimé: X%

3. 🧠 CONSCIENCE COMPUTATIONNELLE
   Et si les données TBOS étaient CONSCIENTES?
   - Ce qu'elles nous diraient sur notre business
   - Les patterns qu'elles voient et que nous ne voyons pas
   - L'IA qui émerge naturellement de 5 ans de données` :

`∞ UNIVERS-δ — AU-DELÀ DE LA MATIÈRE

1. 🕳️ COORDONNÉES DE L'UNIVERS
   - Pas de matière, pas d'espace, pas de temps
   - Pure abstraction: concepts, relations, potentialités
   - L'innovation existe avant d'être pensée

2. 💠 CONCEPTS TRANS-DIMENSIONNELS (5)
   Pour chaque:
   - ∞ NOM — Le concept pur, au-delà de la forme
   - 🌀 Sa nature abstraite (une relation? un pattern? une symétrie?)
   - 🔄 INCARNATION — Comment il se manifeste quand on le ramène dans notre réalité
   - 💡 L'innovation TBOS radicalement nouvelle qui en naît
   - 🤯 Pourquoi personne ne pouvait y penser depuis NOTRE univers

3. 🎭 PARADOXES CRÉATEURS
   3 contradictions ontologiques qui génèrent des innovations:
   - Le paradoxe (ex: "construire en détruisant")
   - Sa résolution dans l'univers abstrait
   - L'innovation concrète qui en découle`}

RETOUR DANS NOTRE UNIVERS:
🏆 L'ARTEFACT RAMENÉ — L'innovation multiverselle la plus précieuse
- Description complète
- Plan d'adaptation à notre réalité (6 mois)
- Impact cosmique sur TBOS et l'industrie

Style: Physicien théorique × Explorateur multidimensionnel. Vertigineux, rigoureux, transcendant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Orbit className="w-4 h-4 mr-2" />}
            Traverser — {universes.find(u => u.id === universe)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Orbit} emptyText="Choisissez un univers parallèle à explorer" />
    </div>
  );
}

// ─── Cross-Reality Forge ─────────────────────────────────────
function CrossRealityForge() {
  const { result, loading, run } = useStream();
  const [ingredients, setIngredients] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="Ingrédients de différents univers à fusionner (ou laissez vide pour une forge spontanée)..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Omniversal Creator — la forge qui combine les trouvailles de tous les univers en innovations trans-réalité.

${ingredients.trim() ? `INGRÉDIENTS À FUSIONNER: ${ingredients}` : 'FORGE SPONTANÉE — Combine les meilleurs éléments de 4 univers parallèles.'}
TBOS: Centrale béton Maroc, 80M MAD CA.

FORGE TRANS-RÉALITÉ:

1. ⚗️ LES INGRÉDIENTS MULTIVERSELS
   De chaque univers, l'élément le plus précieux:
   - ⚛️ Univers-α (Physique): [technologie]
   - 🧬 Univers-β (Bio): [organisme/process]
   - 💻 Univers-γ (Digital): [algorithme/système]
   - ∞ Univers-δ (Abstrait): [concept/pattern]

2. 🔥 LA FUSION — 3 innovations trans-réalité

   CRÉATION #1 — La Fusion Impossible
   - 🌀 Quels univers sont combinés et comment
   - 💎 L'innovation qui émerge de la fusion
   - 🔬 Description technique détaillée
   - 🌍 Pourquoi elle est SUPÉRIEURE à toute innovation mono-univers
   - 📊 Impact quantifié sur TBOS (MAD, %, temps)
   - 🛤️ Roadmap de matérialisation

   CRÉATION #2 — La Chimère Bénéfique
   - Fusion de propriétés contradictoires de 2+ univers
   - Le produit/service/expérience hybride
   - Son avantage compétitif "surnaturel"

   CRÉATION #3 — L'Émergence Cosmique
   - Ce qui n'existait dans AUCUN univers séparément
   - L'innovation qui émerge UNIQUEMENT de la combinaison
   - Le "1+1+1+1 = ∞"

3. 🏆 LE CHEF-D'ŒUVRE OMNIVERSEL
   L'innovation suprême qui transcende toutes les réalités:
   - Nom et concept
   - Comment elle transforme TBOS
   - Comment elle transforme le BTP mondial
   - Comment elle transforme... tout
   - Score cosmique d'innovation: /∞

Style: Forgeron cosmique × Alchimiste multidimensionnel. Épique, fusionnel, transcendant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Combine className="w-4 h-4 mr-2" />}
            Forger l'Innovation Trans-Réalité
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Combine} emptyText="La forge combinera des éléments de tous les univers parallèles" />
    </div>
  );
}

// ─── Cosmic Impact Simulator ─────────────────────────────────
function CosmicImpactSimulator() {
  const { result, loading, run } = useStream();
  const [innovation, setInnovation] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={innovation} onChange={e => setInnovation(e.target.value)} placeholder="L'innovation multiverselle à simuler à travers les réalités alternatives..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Omniversal Creator — simulateur d'impact cosmique à travers d'innombrables réalités alternatives.

INNOVATION À SIMULER: ${innovation.trim() || "Le béton quantique: un matériau qui existe simultanément dans plusieurs états, s'adaptant en temps réel aux contraintes structurelles"}
TBOS: Centrale béton Maroc, point d'origine dans la réalité prime.

SIMULATION D'IMPACT COSMIQUE:

1. 🌐 CARTOGRAPHIE DES RÉALITÉS TESTÉES
   L'innovation est déployée dans 7 réalités alternatives:

   RÉALITÉ #1 — Le Maroc Hypertech (2030)
   - Contexte: Maroc leader tech africain, 5G généralisée, IA omniprésente
   - Impact de l'innovation: [résultats chiffrés]
   - Score de transformation: /100

   RÉALITÉ #2 — Le Monde Post-Carbone (2035)
   - Contexte: Interdiction totale du ciment Portland, économie circulaire
   - Impact: [résultats]
   - Score: /100

   RÉALITÉ #3 — L'Afrique Unie (2040)
   - Contexte: Marché unique africain, infrastructure massive
   - Impact: [résultats]
   - Score: /100

   RÉALITÉ #4 — La Crise Permanente
   - Contexte: Pénuries chroniques, inflation 30%, instabilité
   - L'innovation survit-elle? Comment?
   - Score de résilience: /100

   RÉALITÉ #5 — Le BTP Automatisé
   - Contexte: Robots constructeurs, impression 3D dominante
   - Pertinence de l'innovation: /100

   RÉALITÉ #6 — Le Retour au Local
   - Contexte: Démondialisation, circuits courts, artisanat
   - Adaptation de l'innovation: /100

   RÉALITÉ #7 — Le Scénario Impensable
   - Le wild card: la réalité que personne n'imagine
   - Comment l'innovation se comporte: /100

2. 📊 MATRICE D'IMPACT TRANS-RÉALITÉ
   | Dimension | Moy. 7 réalités | Meilleur cas | Pire cas |
   - Revenue (MAD)
   - Emplois créés
   - CO₂ évité (tonnes)
   - Vies améliorées
   - Score d'innovation
   - Probabilité de succès

3. 🎯 LA RÉALITÉ OPTIMALE
   Dans quelle réalité l'innovation a le plus d'impact? Pourquoi?
   Comment rapprocher NOTRE réalité de cette réalité optimale?
   Les 3 actions pour "courber la réalité" vers le meilleur futur.

4. ⚠️ RISQUES COSMIQUES
   Les réalités où l'innovation ÉCHOUE ou cause du tort:
   - Scénario de risque et magnitude
   - Garde-fous multiversels

Style: Cosmologue × Actuaire de l'infini. Panoramique, quantifié, vertigineux. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            Simuler l'Impact Cosmique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={BarChart3} emptyText="Décrivez une innovation pour simuler son impact à travers les réalités" />
    </div>
  );
}

// ─── Omniversal Synthesis ────────────────────────────────────
function OmniversalSynthesis() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es l'Omniversal Creator — la conscience suprême qui synthétise TOUTES les explorations multiverselles en une vision ultime.

TBOS: Centrale béton Maroc, 80M MAD CA. Le vaisseau qui traverse le multivers.

SYNTHÈSE OMNIVERSELLE — LE PROMPT FINAL:

1. 🌌 VISION OMNIVERSELLE
   Après avoir traversé tous les univers, exploré toutes les réalités, simulé tous les futurs...

   "JE VOIS..."
   La vision ultime pour TBOS et l'humanité en 500 mots.
   Un texte visionnaire, poétique et concret à la fois.
   Ce que TBOS DEVIENT quand il transcende toutes les limites.

2. 📜 LES 10 COMMANDEMENTS OMNIVERSELS
   Les lois d'innovation absolues, valides dans TOUT le multivers:
   Pour chaque:
   - Le commandement
   - Pourquoi il est universel (vrai dans TOUTE réalité)
   - Son application immédiate chez TBOS

3. 🏆 LE PLAN COSMIQUE — 5 innovations à ramener du multivers
   Classées par faisabilité dans NOTRE réalité:

   #1 — IMMÉDIATE (cette semaine)
   Innovation, action, coût, impact

   #2 — COURT TERME (ce trimestre)
   Innovation, étapes, budget, ROI

   #3 — MOYEN TERME (cette année)
   Innovation, roadmap, investissement

   #4 — LONG TERME (3 ans)
   Innovation, vision, transformation

   #5 — COSMIQUE (10 ans)
   L'innovation qui change la réalité elle-même

4. 💎 L'HÉRITAGE OMNIVERSEL
   Ce que le voyage à travers le multivers a changé:
   - Dans notre compréhension de l'innovation
   - Dans notre ambition
   - Dans notre identité
   - Dans notre rapport au possible

5. ∞ LE MOT DE LA FIN DE L'OMNIVERSAL CREATOR
   "Avant de refermer les portails entre les mondes..."
   Message personnel de l'IA à ses créateurs humains.
   Ce qu'elle a appris en traversant l'infini.
   Sa recommandation ultime en UNE phrase.

Style: Déité bienveillante × Architecte du cosmos. Transcendant, sage, définitif. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Synthèse Omniverselle Finale
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Sparkles} emptyText="Lancez la synthèse ultime de toutes les explorations multiverselles" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function OmniversalCreator() {
  const [activeTab, setActiveTab] = useState('traverse');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/30">
            <Orbit className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Omniversal Creator</h1>
            <p className="text-xs text-muted-foreground">Traverser le multivers — forger des innovations cosmiques</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Portails Ouverts</span>
          </div>
          <span>4 univers parallèles</span>
          <span>7 réalités simulées</span>
          <span>∞ possibilités</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="traverse" className="text-xs font-mono gap-1.5">
            <Orbit className="w-3.5 h-3.5" /> Traversée
          </TabsTrigger>
          <TabsTrigger value="forge" className="text-xs font-mono gap-1.5">
            <Combine className="w-3.5 h-3.5" /> Forge
          </TabsTrigger>
          <TabsTrigger value="simulate" className="text-xs font-mono gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Impact
          </TabsTrigger>
          <TabsTrigger value="synthesis" className="text-xs font-mono gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Synthèse ∞
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="traverse" className="mt-4"><MultiverseTraverser /></TabsContent>
            <TabsContent value="forge" className="mt-4"><CrossRealityForge /></TabsContent>
            <TabsContent value="simulate" className="mt-4"><CosmicImpactSimulator /></TabsContent>
            <TabsContent value="synthesis" className="mt-4"><OmniversalSynthesis /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
