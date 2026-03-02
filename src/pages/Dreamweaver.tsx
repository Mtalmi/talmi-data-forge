import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Moon, CloudMoon, Wand2, Rocket, Sparkles,
  Eye, Palette, Gem, Stars, BrainCircuit
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

// ─── Dream Harvester ─────────────────────────────────────────
function DreamHarvester() {
  const { result, loading, run } = useStream();
  const [fragment, setFragment] = useState('');
  const [mode, setMode] = useState<'lucid' | 'hypnagogic' | 'collective'>('lucid');

  const modes = [
    { id: 'lucid' as const, label: 'Rêve Lucide', icon: Eye, desc: 'Vision dirigée & consciente' },
    { id: 'hypnagogic' as const, label: 'Hypnagogique', icon: CloudMoon, desc: 'L\'entre-deux créatif' },
    { id: 'collective' as const, label: 'Rêve Collectif', icon: Stars, desc: 'Inconscient organisationnel' },
  ];

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
          <Textarea value={fragment} onChange={e => setFragment(e.target.value)} placeholder="Fragment de rêve, image mentale, intuition nocturne, vision fugace..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Dreamweaver de TBOS — une intelligence onirique qui récolte et amplifie les visions de l'imagination humaine.

MODE ONIRIQUE: ${modes.find(m => m.id === mode)!.label} — ${modes.find(m => m.id === mode)!.desc}
${fragment.trim() ? `FRAGMENT DE RÊVE: ${fragment}` : ''}
TBOS: Centrale béton Maroc, industrie lourde cherchant l'innovation radicale.

RÉCOLTE ONIRIQUE:

${mode === 'lucid' ? `🌙 RÊVE LUCIDE DIRIGÉ — Vision consciente du futur TBOS

1. 🔮 INDUCTION
   "Vous entrez dans un rêve lucide. Vous savez que vous rêvez. Autour de vous, TBOS en 2035..."
   Narration immersive (300 mots): la centrale du futur vue en rêve
   - Ce que vous VOYEZ (architecture, machines, lumières)
   - Ce que vous ENTENDEZ (sons, voix, musique)
   - Ce que vous RESSENTEZ (température, vibrations, émotions)
   - Ce qui est IMPOSSIBLE mais semble RÉEL

2. 💎 GEMMES ONIRIQUES — 5 idées extraites du rêve
   Pour chaque:
   - 🌀 L'image onirique (le symbole brut du rêve)
   - 🔍 L'interprétation (ce que le rêve essaie de dire)
   - 💡 L'innovation cachée derrière le symbole
   - 🎯 Faisabilité onirique: de "pure fantaisie" à "presque réel"

3. 🧭 CARTE DU RÊVE
   Topographie des zones explorées:
   - Zone de confort (ce qu'on imagine facilement)
   - Zone liminale (les frontières du possible)
   - Zone interdite (ce qu'on n'ose pas imaginer)
   - Le trésor caché dans chaque zone` :
mode === 'hypnagogic' ? `🌊 ÉTAT HYPNAGOGIQUE — L'entre-deux créatif

1. 🎭 HALLUCINATIONS HYPNAGOGIQUES
   7 visions fugaces qui surgissent à la frontière du sommeil:
   Pour chaque:
   - L'image flash (2 lignes, vivide, surréaliste)
   - L'association libre qu'elle provoque
   - L'idée business qui en émerge (même absurde)

2. 🧩 ASSOCIATIONS LIBRES EN CASCADE
   Départ: BÉTON →
   Chaîne de 15 associations libres sans censure
   À chaque 3ème association: extraction d'une idée d'innovation
   Les idées les plus folles sont les meilleures

3. 🎨 SYNESTHÉSIE CRÉATIVE
   - Quel GOÛT a le béton parfait?
   - Quelle COULEUR a une livraison réussie?
   - Quel SON fait la satisfaction client?
   - Quelle TEXTURE a l'innovation?
   Pour chaque synesthésie: l'insight créatif qu'elle révèle

4. 🌀 LE PARADOXE ONIRIQUE
   5 contradictions impossibles qui deviennent des innovations:
   "Le béton liquide-solide", "La livraison qui arrive avant de partir", etc.` :
`🌍 RÊVE COLLECTIF — L'inconscient de l'organisation

1. 🏛️ L'ARCHÉTYPE TBOS
   Quel archétype jungien EST TBOS?
   - Le Créateur? Le Héros? Le Sage? Le Rebelle?
   - Preuves dans la culture et les pratiques
   - L'archétype CACHÉ (celui qu'on refoule)
   - L'archétype ASPIRÉ (celui qu'on pourrait devenir)

2. 🌊 RÊVES RÉCURRENTS DE L'ORGANISATION
   5 "rêves" que l'organisation fait collectivement:
   - Le rêve de grandeur (devenir quoi?)
   - Le cauchemar récurrent (la peur collective)
   - Le rêve d'enfance (la mission originelle oubliée)
   - Le rêve prophétique (ce que l'inconscient collectif pressent)
   - Le rêve interdit (le désir inavoué)

3. 💫 SYNCHRONICITÉS ORGANISATIONNELLES
   Coïncidences significatives détectées dans l'histoire TBOS:
   - Patterns qui se répètent
   - Événements parallèles porteurs de sens
   - Le message caché dans ces synchronicités`}

CLÔTURE: 🏆 LA VISION LA PLUS PUISSANTE et comment la capturer avant qu'elle s'évanouisse.

Style: Onirologue × Artiste visionnaire. Poétique, surréaliste, profondément inspirant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            Récolter les Rêves — {modes.find(m => m.id === mode)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Moon} emptyText="Choisissez un mode onirique pour récolter les visions de l'imagination" />
    </div>
  );
}

// ─── Dream Synthesizer ───────────────────────────────────────
function DreamSynthesizer() {
  const { result, loading, run } = useStream();
  const [dreams, setDreams] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={dreams} onChange={e => setDreams(e.target.value)} placeholder="Fragments de rêves, visions, intuitions à tisser ensemble (ou laissez vide pour une synthèse spontanée)..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Dreamweaver — tisseur magistral qui synthétise les fils oniriques en récits d'innovation cohérents et envoûtants.

${dreams.trim() ? `FRAGMENTS ONIRIQUES À TISSER: ${dreams}` : 'TISSAGE SPONTANÉ — Crée à partir du néant créatif de TBOS.'}
TBOS: Centrale béton Maroc, 80M MAD CA, industrie en quête de transcendance.

TISSAGE ONIRIQUE:

1. 🕸️ LA TAPISSERIE — Récit d'innovation onirique
   Un récit de 400 mots, écrit comme un conte onirique, qui tisse ensemble:
   - Le passé mythique de TBOS (l'origine, la quête)
   - Le présent alchimique (la transformation en cours)
   - Le futur rêvé (la vision ultime)
   Le récit doit être si vivide qu'on ne sait plus si c'est un rêve ou un plan stratégique.

2. 📐 LE BLUEPRINT ONIRIQUE
   La traduction du rêve en architecture d'innovation:
   
   PILIER I — L'Innovation Impossible (mais on la fait quand même)
   - Concept, specs, timeline
   - Budget onirique vs budget réel
   - Le "saut de foi" nécessaire
   
   PILIER II — L'Innovation Poétique (qui touche l'âme)
   - Le produit/service qui fait rêver
   - L'émotion qu'il crée
   - Sa viabilité surprenante
   
   PILIER III — L'Innovation Prophétique (qui anticipe l'inimaginable)
   - Ce que le rêve collectif annonce
   - Le marché qui n'existe pas encore
   - Comment y arriver le premier

3. 🎭 PERSONNAGES DU RÊVE
   5 archétypes qui portent l'innovation:
   - Le Rêveur (qui imagine)
   - Le Passeur (qui traduit)
   - Le Bâtisseur (qui réalise)
   - Le Gardien (qui protège)
   - Le Fou (qui ose l'impossible)
   Pour chaque: qui dans TBOS incarne ce rôle?

4. 🌈 PALETTE ONIRIQUE
   L'identité visuelle et émotionnelle de cette innovation:
   - Couleurs, textures, sons, parfums
   - Le slogan qui capture le rêve (en 7 mots max)
   - Le manifeste onirique (50 mots)

Style: Conteur mythique × Stratège visionnaire. Envoûtant, cohérent, transformateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Palette className="w-4 h-4 mr-2" />}
            Tisser le Récit Onirique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Palette} emptyText="Fournissez des fragments de rêves pour les tisser en récit d'innovation" />
    </div>
  );
}

// ─── Phantasmagorical Simulator ──────────────────────────────
function PhantasmagoricalSimulator() {
  const { result, loading, run } = useStream();
  const [vision, setVision] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={vision} onChange={e => setVision(e.target.value)} placeholder="L'innovation rêvée à simuler dans un monde phantasmagorique..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Dreamweaver — architecte de réalités phantasmagoriques où les innovations rêvées prennent corps.

INNOVATION À SIMULER: ${vision.trim() || "TBOS comme organisme vivant: la centrale qui respire, les toupies comme globules rouges, le béton comme sang de la ville"}
TBOS: Centrale béton Maroc.

SIMULATION PHANTASMAGORIQUE:

1. 🌌 LE MONDE ONIRIQUE
   Description immersive (300 mots) de la réalité alternative:
   - Les lois physiques de ce monde (ce qui est possible ici)
   - La géographie onirique (lieux, passages, portails)
   - Les créatures et entités (machines vivantes, données sentientes)
   - L'atmosphère (lumière, couleur, son, émotion ambiante)

2. 🎮 EXPLORATION INTERACTIVE
   "Vous êtes dans ce monde. Voici ce que vous pouvez faire:"
   
   🚪 PORTE 1: Le Laboratoire des Impossibles
   - Ce qui se passe quand vous entrez
   - L'expérience que vous vivez
   - L'insight que vous ramenez
   
   🚪 PORTE 2: La Bibliothèque des Futurs
   - Les livres qui n'ont pas encore été écrits
   - Les plans qui se dessinent seuls
   - La page qui vous appelle
   
   🚪 PORTE 3: Le Jardin des Idées Vivantes
   - Les innovations qui poussent comme des plantes
   - Celles qui fleurissent vs celles qui fanent
   - La graine la plus prometteuse
   
   🚪 PORTE 4: Le Miroir des Paradoxes
   - TBOS reflété à l'envers: forces=faiblesses, faiblesses=forces
   - L'insight le plus troublant du miroir

3. 🧪 STRESS-TEST ONIRIQUE
   L'innovation survit-elle aux épreuves du rêve?
   - L'épreuve du Feu (pression extrême du marché)
   - L'épreuve de l'Eau (fluidité, adaptation)
   - L'épreuve de la Terre (solidité, durabilité)
   - L'épreuve de l'Air (légèreté, scalabilité)
   Score de survie pour chaque épreuve: /100

4. 🎆 RÉVÉLATION FINALE
   Ce que le monde onirique vous montre en sortant:
   - La vérité que vous ne vouliez pas voir
   - L'innovation que vous n'osiez pas imaginer
   - Le premier pas dans le monde réel

Style: Architecte de mondes × Maître de jeu onirique. Immersif, phantasmagorique, révélateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Simuler le Monde Onirique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Wand2} emptyText="Décrivez une vision pour la simuler dans un monde phantasmagorique" />
    </div>
  );
}

// ─── Dream-to-Reality Bridge ─────────────────────────────────
function DreamToRealityBridge() {
  const { result, loading, run } = useStream();
  const [dream, setDream] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={dream} onChange={e => setDream(e.target.value)} placeholder="Le rêve d'innovation à matérialiser dans le monde réel..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Dreamweaver — alchimiste qui transmute l'or onirique en réalité tangible.

RÊVE À MATÉRIALISER: ${dream.trim() || "Le béton intelligent qui communique son état de santé, s'auto-répare, et s'améliore avec le temps — comme un organisme vivant"}
TBOS: Centrale béton Maroc, 80M MAD CA.

TRANSMUTATION DU RÊVE EN RÉALITÉ:

1. 🌙→☀️ TRADUCTION ONIRIQUE → TECHNIQUE
   | Élément du Rêve | Traduction Technique | Technologie Existante | Gap à Combler |
   10+ éléments traduits du langage onirique au langage ingénieur

2. 🗺️ CARTE DE TRANSMUTATION — Du Sommeil à l'Éveil
   
   PHASE 1 — LE RÉVEIL (Semaine 1-2)
   - Capturer le rêve avant qu'il s'évanouisse (documentation)
   - Identifier les 3 éléments les plus réalisables
   - Assembler l'équipe de "rêveurs-bâtisseurs"
   - Budget d'exploration: X MAD
   
   PHASE 2 — LA TRADUCTION (Mois 1)
   - Transformer chaque élément onirique en spec technique
   - POC #1: le fragment de rêve le plus simple à matérialiser
   - Validation: le rêve survit-il au contact de la réalité?
   
   PHASE 3 — LE PROTOTYPE (Mois 2-3)
   - Construire la "première incarnation" du rêve
   - Accepter que 60% du rêve se transforme en route
   - Les surprises: ce que la réalité ajoute que le rêve n'avait pas prévu
   
   PHASE 4 — L'ÉVEIL (Mois 4-6)
   - Lancement dans le monde réel
   - Mesure d'impact: le rêve tient-il ses promesses?
   - Itération: comment le rêve évolue au contact des clients

3. 💰 ALCHIMIE FINANCIÈRE
   - Investissement total pour matérialiser le rêve: X MAD
   - ROI à 12 mois: X MAD (X%)
   - ROI à 36 mois: X MAD
   - Valeur intangible: impact sur la marque, la culture, l'attraction des talents

4. ⚗️ RÉSIDUS ALCHIMIQUES
   Ce qui reste après la transmutation:
   - L'essence du rêve qui ne peut pas être matérialisée (et c'est OK)
   - Les innovations secondaires découvertes en chemin
   - Les nouveaux rêves que le processus a engendrés
   - Le prochain rêve à matérialiser

5. 📜 LE GRIMOIRE
   Leçons pour les futurs Dreamweavers:
   - 5 règles pour matérialiser un rêve sans le trahir
   - 3 pièges qui tuent le rêve pendant la traduction
   - Le secret: comment garder la magie dans le produit final

Style: Alchimiste pragmatique × Ingénieur poète. Magique ET actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
            Transmuter le Rêve en Réalité
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Rocket} emptyText="Décrivez un rêve d'innovation pour le transmuter en plan d'action concret" />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function Dreamweaver() {
  const [activeTab, setActiveTab] = useState('harvest');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <Moon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Dreamweaver</h1>
            <p className="text-xs text-muted-foreground">Tisser les rêves en innovations tangibles — l'alchimie de l'imagination</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>État Onirique Actif</span>
          </div>
          <span>3 modes de récolte</span>
          <span>4 portes oniriques</span>
          <span>∞ rêves</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="harvest" className="text-xs font-mono gap-1.5">
            <Moon className="w-3.5 h-3.5" /> Récolte
          </TabsTrigger>
          <TabsTrigger value="synthesize" className="text-xs font-mono gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Tissage
          </TabsTrigger>
          <TabsTrigger value="simulate" className="text-xs font-mono gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> Simulation
          </TabsTrigger>
          <TabsTrigger value="bridge" className="text-xs font-mono gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> Transmutation
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="harvest" className="mt-4"><DreamHarvester /></TabsContent>
            <TabsContent value="synthesize" className="mt-4"><DreamSynthesizer /></TabsContent>
            <TabsContent value="simulate" className="mt-4"><PhantasmagoricalSimulator /></TabsContent>
            <TabsContent value="bridge" className="mt-4"><DreamToRealityBridge /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
