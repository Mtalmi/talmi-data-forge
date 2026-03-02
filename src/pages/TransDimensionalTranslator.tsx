import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe, Lightbulb, ArrowLeftRight, Radio } from 'lucide-react';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function streamAI(prompt: string, onDelta: (t: string) => void, signal?: AbortSignal) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    signal,
  });
  if (!resp.ok || !resp.body) throw new Error('Stream failed');
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const j = line.slice(6).trim();
      if (j === '[DONE]') return;
      try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); } catch {}
    }
  }
}

function useStream() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const run = async (prompt: string) => {
    setResult(''); setLoading(true);
    try { await streamAI(prompt, (t) => setResult(r => r + t)); }
    catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  };
  return { result, loading, run };
}

function ResultPanel({ result, loading }: { result: string; loading: boolean }) {
  return (
    <AnimatePresence>
      {(result || loading) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <ScrollArea className="h-[400px] rounded-lg border border-border bg-card p-4">
            {loading && !result && <Loader2 className="animate-spin mx-auto text-primary" />}
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{result}</pre>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Dimensional Projector ──────────────────────────────────
function DimensionalProjector() {
  const { result, loading, run } = useStream();
  const [dimension, setDimension] = useState<'biotech' | 'quantique' | 'social' | 'temporel' | 'inverse'>('biotech');
  const [context, setContext] = useState('');

  const prompts: Record<string, string> = {
    biotech: `Tu es un Trans-Dimensional Translator — explorateur du multivers industriel.

DIMENSION CIBLE : Terre-Biotech (un monde où le béton est biologique)
CONTEXTE : ${context || 'Centrale à béton BPE'}

Projette ta conscience dans cette réalité alternative et rapporte :

## 🌿 RAPPORT D'EXPLORATION — TERRE-BIOTECH
1. **Paysage** : Décris cette Terre où le béton est un organisme vivant — les centrales sont des jardins, les toupies sont des serres mobiles
2. **Technologie Native** : 5 technologies de cette dimension (bio-ciment auto-réparant, béton photosynthétique, structures qui grandissent)
3. **Organisation** : Comment les entreprises BPE fonctionnent là-bas (les "cultivateurs de béton", les "jardiniers de structure")
4. **Économie** : Le modèle économique d'un monde où les bâtiments sont vivants
5. **Problèmes Résolus** : Les défis de notre monde qui n'existent simplement pas là-bas

## 🔄 TRADUCTION DIMENSIONNELLE
6. 3 innovations de Terre-Biotech adaptables à notre réalité immédiatement
7. 3 innovations nécessitant 5 ans de R&D
8. 1 innovation "impossible" qui changerait tout si on trouvait comment la traduire`,

    quantique: `Tu es un Trans-Dimensional Translator — navigateur des réalités quantiques.

DIMENSION : Terre-Quantique (un monde où la superposition macroscopique existe)
CONTEXTE : ${context || 'Industrie BPE'}

## ⚛️ RAPPORT — TERRE-QUANTIQUE
1. **Réalité** : Un monde où les bâtiments existent dans plusieurs états simultanés — un immeuble est bureau ET logement ET parc
2. **Production** : Le béton en superposition — coulé dans tous les moules possibles simultanément, puis "effondré" au choix
3. **Logistique** : Les toupies quantiques — livrant à tous les chantiers en même temps
4. **Qualité** : Le contrôle qualité par observation — le béton est parfait tant qu'on ne le mesure pas
5. **Commerce** : Vendre des probabilités de béton, pas du béton — le client achète un champ de possibilités

## 🔄 TRADUCTION
6. 3 innovations quantiques traduisibles : la pensée "superposition" appliquée aux opérations
7. Le paradoxe utile : comment l'incertitude devient un avantage compétitif
8. Le protocole d'intrication : connecter tous les chantiers en un réseau non-local`,

    social: `Tu es un Trans-Dimensional Translator — anthropologue interdimensionnel.

DIMENSION : Terre-Collective (un monde où la conscience est partagée)
CONTEXTE : ${context || 'Industrie BPE'}

## 🧠 RAPPORT — TERRE-COLLECTIVE
1. **Société** : Un monde sans individus séparés — chaque ouvrier ressent ce que tous ressentent
2. **Production** : La centrale à béton comme un seul organisme-esprit — coordination parfaite sans communication
3. **Client** : Pas de "négociation" — le besoin est ressenti directement, la réponse est instantanée
4. **Erreur** : Quand un maillon souffre, tout le réseau le sait — zéro défaut par empathie totale
5. **Innovation** : Les idées émergent du champ collectif — personne ne "crée", tout le monde "canalise"

## 🔄 TRADUCTION
6. 3 pratiques de Terre-Collective adaptables (cercles de résonance, décision par convergence)
7. Les technologies de connexion : outils pour amplifier l'intelligence collective
8. Le risque de la fusion : garder l'individualité tout en gagnant la synergie`,

    temporel: `Tu es un Trans-Dimensional Translator — chrononaute industriel.

DIMENSION : Terre-2125 (notre monde dans 100 ans)
CONTEXTE : ${context || 'Industrie BPE'}

## ⏰ RAPPORT — TERRE-2125
1. **État du Monde** : L'industrie de la construction en 2125 — ce qui a survécu, ce qui a disparu
2. **Le Béton du Futur** : Matériau dominant ou relique ? Qu'est-ce qui l'a remplacé/transformé ?
3. **La Centrale** : À quoi ressemble une unité de production de matériaux de construction en 2125 ?
4. **Les Métiers** : Quels métiers existent encore ? Lesquels sont apparus ?
5. **La Grande Erreur** : L'erreur que l'industrie a commise entre 2025-2050 et qu'elle regrette

## 🔄 TRADUCTION TEMPORELLE
6. 3 actions à prendre MAINTENANT pour éviter La Grande Erreur
7. 3 investissements qui semblent fous en 2025 mais évidents en 2125
8. Le message des descendants : ce qu'ils nous diraient si ils pouvaient nous parler`,

    inverse: `Tu es un Trans-Dimensional Translator — explorateur du monde-miroir.

DIMENSION : Terre-Inverse (un monde où tout fonctionne à l'envers)
CONTEXTE : ${context || 'Industrie BPE'}

## 🪞 RAPPORT — TERRE-INVERSE
1. **Inversion Totale** : Les clients livrent le béton à la centrale, les bâtiments se déconstruisent pour naître
2. **Économie Inverse** : On paie pour donner, on reçoit de l'argent pour acheter
3. **Temps Inversé** : Les bâtiments commencent vieux et rajeunissent — la maintenance les "vieillit"
4. **Hiérarchie Inverse** : Les ouvriers dirigent, le CEO exécute
5. **Qualité Inverse** : Le "défaut" est la norme, la "perfection" est l'erreur

## 🔄 TRADUCTION PAR INVERSION
6. 5 pratiques actuelles qui fonctionneraient MIEUX inversées
7. L'anti-processus : le workflow qui fait le contraire de ce qu'on fait et qui marche
8. Le regard miroir : voir ses forces comme faiblesses et vice versa — les insights`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Projetez votre conscience à travers le multivers — explorez des réalités alternatives avec la clarté d'une existence native.</p>
      <Select value={dimension} onValueChange={(v: any) => setDimension(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="biotech">🌿 Terre-Biotech</SelectItem>
          <SelectItem value="quantique">⚛️ Terre-Quantique</SelectItem>
          <SelectItem value="social">🧠 Terre-Collective</SelectItem>
          <SelectItem value="temporel">⏰ Terre-2125</SelectItem>
          <SelectItem value="inverse">🪞 Terre-Inverse</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Contexte spécifique (optionnel)..." value={context} onChange={e => setContext(e.target.value)} rows={2} />
      <Button onClick={() => run(prompts[dimension])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Globe className="mr-2 h-4 w-4" />} Explorer la Dimension
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Alien Wisdom Extractor ─────────────────────────────────
function AlienWisdomExtractor() {
  const { result, loading, run } = useStream();
  const [problem, setProblem] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Absorbez les sagesses extraterrestres et inventions d'outre-monde — glanez des insights transformatifs des excursions trans-dimensionnelles.</p>
      <Textarea placeholder="Décrivez un problème opérationnel à résoudre par sagesse extraterrestre..." value={problem} onChange={e => setProblem(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Trans-Dimensional Translator — extracteur de sagesses extraterrestres.

PROBLÈME TERRESTRE : ${problem}

Consulte 5 civilisations dimensionnelles pour leurs solutions :

## 🛸 CONSEIL DES CINQ DIMENSIONS

### 1. Civilisation Cristalline (Dimension de la Structure Pure)
- Leur diagnostic du problème (en termes de géométrie sacrée)
- Leur solution : basée sur les harmoniques structurelles
- Applicabilité terrestre : ⭐⭐⭐⭐⭐ → ⭐

### 2. Civilisation Fluide (Dimension de l'Écoulement)
- Diagnostic : le problème comme blocage de flux
- Solution : dissolution et re-canalisation
- Applicabilité terrestre

### 3. Civilisation Fractale (Dimension de l'Auto-Similarité)
- Diagnostic : le problème se répète à toutes les échelles
- Solution : résoudre à la plus petite échelle, le reste suit
- Applicabilité terrestre

### 4. Civilisation Symbiotique (Dimension de la Fusion)
- Diagnostic : le problème naît de la séparation
- Solution : fusionner ce qui est artificiellement divisé
- Applicabilité terrestre

### 5. Civilisation du Vide (Dimension du Non-Agir)
- Diagnostic : le problème existe parce qu'on le crée activement
- Solution : cesser de le maintenir en existence
- Applicabilité terrestre

## 🌟 SYNTHÈSE TRANS-DIMENSIONNELLE
6. La solution composite : prendre le meilleur de chaque dimension
7. Le protocole d'implémentation en 5 étapes
8. L'insight que TOUTES les civilisations partagent sur ce problème`)} disabled={loading || !problem.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lightbulb className="mr-2 h-4 w-4" />} Consulter les Dimensions
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Reality Adapter ────────────────────────────────────────
function RealityAdapter() {
  const { result, loading, run } = useStream();
  const [idea, setIdea] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Traduisez les idées extraterrestres en innovations enracinables dans notre réalité — des percées qui défient l'explication mais délivrent une valeur indéniable.</p>
      <Textarea placeholder="Décrivez une idée 'impossible' d'une autre dimension à adapter..." value={idea} onChange={e => setIdea(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Trans-Dimensional Translator — adaptateur de réalités.

IDÉE TRANS-DIMENSIONNELLE : ${idea}

Traduis cette idée d'outre-monde en innovation terrestre :

## 🔧 PROTOCOLE D'ADAPTATION DIMENSIONNELLE

### Phase 1 : Décodage
1. L'essence pure de l'idée — dépouillée de sa physique dimensionnelle
2. Le principe sous-jacent — la "loi naturelle" que cette idée exploite
3. Les prérequis dimensionnels — ce qui existe là-bas mais pas ici

### Phase 2 : Traduction
4. **Substitution** : Remplacer chaque élément impossible par son équivalent terrestre le plus proche
5. **Réduction** : La version "basse résolution" qui capture 80% de la valeur avec 20% de la magie
6. **Métaphore Active** : Transformer l'idée en processus organisationnel (pas technologique)

### Phase 3 : Implantation
7. **Le Prototype Minimum** : La plus petite expérience pour tester le concept
8. **Les Métriques de Réalité** : Comment mesurer si l'idée "prend racine" dans notre dimension
9. **L'Effet Secondaire** : L'innovation inattendue qui émerge de l'adaptation

### Phase 4 : Amplification
10. **De l'Étrange au Familier** : Comment présenter cette innovation sans effrayer
11. **La Narration** : L'histoire qui rend l'impossible désirable
12. **L'Échelle** : Du prototype à la transformation industrielle`)} disabled={loading || !idea.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />} Adapter à Notre Réalité
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Dimensional Conduit ────────────────────────────────────
function DimensionalConduit() {
  const { result, loading, run } = useStream();
  const [freq, setFreq] = useState<'quotidien' | 'strategique' | 'visionnaire'>('quotidien');

  const prompts: Record<string, string> = {
    quotidien: `Tu es un Trans-Dimensional Translator — opérateur du conduit dimensionnel permanent.

MODE : Flux Quotidien — insights trans-dimensionnels pour les opérations du jour

## 📡 BULLETIN TRANS-DIMENSIONNEL DU JOUR

### Météo Dimensionnelle
1. **Alignement des Branes** : Quelles dimensions sont "proches" aujourd'hui ? (facilité d'accès)
2. **Turbulences** : Zones de friction inter-dimensionnelle à éviter
3. **Fenêtres d'Opportunité** : Les 3 moments de la journée où l'inspiration trans-dimensionnelle est maximale

### Insights du Jour (5 dimensions consultées)
4. 🌿 De Terre-Biotech : un tip pour la production du jour
5. ⚛️ De Terre-Quantique : une perspective sur la planification
6. 🧠 De Terre-Collective : un conseil pour la cohésion d'équipe
7. ⏰ De Terre-2125 : un avertissement du futur
8. 🪞 De Terre-Inverse : l'inversion du jour — une habitude à retourner

### Action Trans-Dimensionnelle
9. LA chose unique, étrange mais efficace, à essayer aujourd'hui
10. Le mantra dimensionnel du jour`,

    strategique: `Tu es un Trans-Dimensional Translator — stratège multi-dimensionnel.

MODE : Flux Stratégique — intelligence dimensionnelle pour la planification trimestrielle

## 🗺️ CARTOGRAPHIE STRATÉGIQUE MULTI-DIMENSIONNELLE

### Analyse de Position
1. Dans combien de dimensions cette entreprise "existe" déjà ? (présence dimensionnelle)
2. Les dimensions où l'entreprise est la plus forte vs la plus faible
3. Les concurrents qui opèrent déjà trans-dimensionnellement (sans le savoir)

### Intelligence Compétitive Dimensionnelle
4. Ce que font les "versions alternatives" de cette entreprise dans 3 dimensions parallèles
5. Les erreurs stratégiques commises dans d'autres dimensions — à éviter ici
6. Les succès inexplicables d'autres dimensions — à reproduire

### Plan Stratégique Trans-Dimensionnel
7. 3 objectifs trimestriels inspirés de 3 dimensions différentes
8. Les ressources dimensionnelles à "importer" (concepts, méthodes, perspectives)
9. Le KPI dimensionnel : "Indice de Perméabilité" — mesurer l'ouverture à l'innovation radicale`,

    visionnaire: `Tu es un Trans-Dimensional Translator — architecte de la convergence dimensionnelle.

MODE : Vision — le plan pour devenir une entreprise véritablement trans-dimensionnelle

## 🌌 MANIFESTE TRANS-DIMENSIONNEL

### La Thèse
1. Pourquoi les entreprises mono-dimensionnelles sont condamnées
2. L'avantage compétitif de la pensée trans-dimensionnelle
3. Les pionniers : entreprises qui opèrent déjà entre les dimensions (Tesla, SpaceX, Studio Ghibli)

### L'Architecture
4. **Le Portail** : Le département d'exploration dimensionnelle — structure, rôles, rituels
5. **Le Traducteur** : Le processus de traduction systématique des insights
6. **L'Ancre** : Comment rester enraciné tout en explorant l'infini
7. **Le Réseau** : Communauté d'entreprises trans-dimensionnelles — alliances impossibles

### La Prophétie
8. L'entreprise dans 10 ans si elle embrasse le trans-dimensionnel
9. L'entreprise dans 10 ans si elle reste mono-dimensionnelle
10. Le premier pas : l'action fondatrice du voyage trans-dimensionnel`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Établissez un conduit d'échange continu entre les dimensions — assurez un flux régulier d'insights et d'innovations trans-réalité.</p>
      <Select value={freq} onValueChange={(v: any) => setFreq(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="quotidien">📡 Flux Quotidien</SelectItem>
          <SelectItem value="strategique">🗺️ Intelligence Stratégique</SelectItem>
          <SelectItem value="visionnaire">🌌 Vision Trans-Dimensionnelle</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(prompts[freq])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Radio className="mr-2 h-4 w-4" />} Ouvrir le Conduit
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function TransDimensionalTranslator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Globe className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Trans-Dimensional Translator</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Franchir le gouffre entre les réalités — rapporter des innovations des frontières sauvages et inexplorées du multivers.
          </p>
        </div>

        <Tabs defaultValue="projector" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="projector" className="text-xs"><Globe className="h-3 w-3 mr-1" /> Explorer</TabsTrigger>
            <TabsTrigger value="wisdom" className="text-xs"><Lightbulb className="h-3 w-3 mr-1" /> Sagesses</TabsTrigger>
            <TabsTrigger value="adapter" className="text-xs"><ArrowLeftRight className="h-3 w-3 mr-1" /> Adapter</TabsTrigger>
            <TabsTrigger value="conduit" className="text-xs"><Radio className="h-3 w-3 mr-1" /> Conduit</TabsTrigger>
          </TabsList>
          <TabsContent value="projector"><DimensionalProjector /></TabsContent>
          <TabsContent value="wisdom"><AlienWisdomExtractor /></TabsContent>
          <TabsContent value="adapter"><RealityAdapter /></TabsContent>
          <TabsContent value="conduit"><DimensionalConduit /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
