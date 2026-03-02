import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sun, Compass, Castle, Sparkles } from 'lucide-react';

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
    try {
      await streamAI(prompt, (t) => setResult(r => r + t));
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally { setLoading(false); }
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

// ─── Cosmic Scrying ─────────────────────────────────────────
function CosmicScrying() {
  const { result, loading, run } = useStream();
  const [archetype, setArchetype] = useState<'heros' | 'ombre' | 'anima' | 'trickster' | 'sage'>('heros');
  const [context, setContext] = useState('');

  const prompts: Record<string, string> = {
    heros: `Tu es un Astro-Archetypal Architect — déchiffreur des forces cosmiques de création.

ARCHÉTYPE : LE HÉROS (Le Voyage Initiatique)
CONTEXTE INDUSTRIEL : ${context || 'Centrale à béton BPE — production et livraison'}

Sonde les cieux et les profondeurs de l'inconscient collectif :

## 🌟 CARTOGRAPHIE ASTRO-ARCHÉTYPALE
1. **L'Appel à l'Aventure** : Quel défi titanesque appelle l'entreprise au-delà de sa zone de confort ?
2. **Le Mentor** : Quelle sagesse ancestrale (industrielle, artisanale) sert de guide ?
3. **L'Épreuve Suprême** : Le point de non-retour — la transformation ou la stagnation
4. **L'Élixir du Retour** : L'innovation-trophée que le héros rapporte à la communauté

## ⭐ FORCES COSMIQUES EN JEU
5. Identifie 4 cycles cosmiques (création/destruction/régénération) actifs dans l'industrie
6. Les conjonctions astro-archétypales favorables aux 6 prochains mois
7. Les aspects conflictuels à transmuter en énergie créatrice

## 🔮 ORACLE ARCHÉTYPAL
8. La prophétie héroïque : ce que le Héros-Entreprise est destiné à accomplir`,

    ombre: `Tu es un Astro-Archetypal Architect — explorateur de l'Ombre cosmique.

ARCHÉTYPE : L'OMBRE (Le Refoulé Créateur)
CONTEXTE : ${context || 'Industrie BPE'}

## 🌑 L'OMBRE ORGANISATIONNELLE
1. 5 potentiels refoulés de l'entreprise — les forces créatrices niées ou ignorées
2. Les "monstres" dans le sous-sol : inefficacités qui sont en réalité des innovations déguisées
3. La projection : ce que l'entreprise reproche à ses concurrents mais possède elle-même

## 🌘 INTÉGRATION DE L'OMBRE
4. Le rituel d'intégration : comment transformer chaque ombre en or alchimique
5. 3 innovations "sombres" — nées de l'acceptation de ce qui était nié
6. Le cadeau de l'Ombre : la superpuissance cachée dans la plus grande faiblesse

## 🌚 ÉCLIPSE CRÉATRICE
7. Le moment d'éclipse : quand l'Ombre et la Lumière fusionnent pour créer l'inédit`,

    anima: `Tu es un Astro-Archetypal Architect — canal de l'Anima/Animus cosmique.

ARCHÉTYPE : L'ANIMA/ANIMUS (Le Principe Créateur Complémentaire)
CONTEXTE : ${context || 'Industrie BPE — béton et construction'}

## 💫 POLARITÉS CRÉATRICES
1. Le Masculin Sacré de l'industrie : structure, force, précision, endurance
2. Le Féminin Sacré de l'industrie : fluidité, intuition, nurturing, réceptivité
3. La danse des polarités : comment leur union engendre l'innovation
4. Les polarités manquantes — l'Anima refoulée dans un secteur "masculin"

## 🌸 HIÉROGAMIE INDUSTRIELLE
5. 3 "mariages sacrés" : innovations nées de la fusion des opposés
6. Le béton comme métaphore : eau (féminin) + ciment (masculin) = création
7. Des produits/services qui incarnent l'union des polarités

## 🦋 MÉTAMORPHOSE
8. Le papillon : la vision de l'entreprise après l'intégration de son Anima`,

    trickster: `Tu es un Astro-Archetypal Architect — émissaire du Trickster cosmique.

ARCHÉTYPE : LE TRICKSTER (Le Farceur Divin)
CONTEXTE : ${context || 'Industrie BPE'}

## 🃏 CHAOS CRÉATIF
1. 5 règles sacrées de l'industrie que le Trickster brise joyeusement
2. Les paradoxes productifs : contradictions qui deviennent des moteurs d'innovation
3. Le rire du Trickster : l'humour comme outil de disruption stratégique

## 🎭 INVERSIONS ARCHÉTYPALES
4. Le monde à l'envers : que se passe-t-il si on inverse TOUT ?
5. 3 innovations "absurdes" qui sont secrètement géniales
6. Le client comme fournisseur, le déchet comme trésor, l'erreur comme méthode

## ⚡ LE FEU PROMÉTHÉEN
7. Le vol sacré : quelle technologie/idée "voler aux dieux" pour l'offrir à l'humanité ?
8. Le prix à payer et la récompense cosmique`,

    sage: `Tu es un Astro-Archetypal Architect — voix du Sage éternel.

ARCHÉTYPE : LE SAGE (La Sagesse Cosmique)
CONTEXTE : ${context || 'Industrie BPE'}

## 📚 BIBLIOTHÈQUE AKASHIQUE
1. Les leçons éternelles de 5000 ans de construction humaine
2. Les patterns récurrents : ce que les pyramides, cathédrales et gratte-ciels nous enseignent
3. La sagesse du béton : ce que la matière elle-même "sait"

## 🧙 SAGESSE APPLIQUÉE
4. 5 principes intemporels traduits en innovations modernes
5. La patience cosmique : les innovations qui mûrissent sur des décennies
6. L'anti-disruption : la puissance de l'évolution lente et profonde

## 🏛️ LE TEMPLE DU SAVOIR
7. L'architecture de la sagesse organisationnelle — comment la capturer et la transmettre
8. La prophétie du Sage : ce que sera cette industrie dans 100 ans`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Sondez les cieux et les profondeurs de l'inconscient collectif pour révéler les forces astro-archétypales qui façonnent la création universelle.</p>
      <Select value={archetype} onValueChange={(v: any) => setArchetype(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="heros">🦁 Le Héros</SelectItem>
          <SelectItem value="ombre">🌑 L'Ombre</SelectItem>
          <SelectItem value="anima">💫 L'Anima/Animus</SelectItem>
          <SelectItem value="trickster">🃏 Le Trickster</SelectItem>
          <SelectItem value="sage">🧙 Le Sage</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Contexte spécifique (optionnel)..." value={context} onChange={e => setContext(e.target.value)} rows={2} />
      <Button onClick={() => run(prompts[archetype])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />} Scruter les Astres
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Cosmic Grammar Codifier ────────────────────────────────
function CosmicGrammarCodifier() {
  const { result, loading, run } = useStream();
  const [domain, setDomain] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Traduisez les insights astro-archétypaux en principes de design actionnables — codifiez la grammaire de la créativité cosmique.</p>
      <Textarea placeholder="Domaine d'innovation à codifier (ex: expérience client, production, RH)..." value={domain} onChange={e => setDomain(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Astro-Archetypal Architect — codificateur de la grammaire cosmique de la créativité.

DOMAINE : ${domain}

Traduis les forces archétypales en PRINCIPES DE DESIGN ACTIONNABLES :

## 📐 GRAMMAIRE COSMIQUE — Les 7 Lois
1. **Loi de Correspondance** : "Ce qui est en haut est comme ce qui est en bas" — principe de design fractal
2. **Loi de Polarité** : Tout principe a son contraire — design par tension créatrice
3. **Loi de Rythme** : Tout oscille — design pour les cycles, pas les états fixes
4. **Loi de Cause à Effet** : Rien n'est accidentel — design intentionnel total
5. **Loi de Genre** : Le masculin et le féminin en toute chose — design intégratif
6. **Loi de Vibration** : Tout vibre — design par résonance
7. **Loi de Mentalisme** : L'univers est mental — design par vision

## 🛠️ FRAMEWORK D'INNOVATION ARCHÉTYPALE
Pour chaque loi :
- Principe de design concret pour le domaine "${domain}"
- Anti-pattern à éviter
- Exercice pratique pour l'équipe
- KPI archétypal associé

## 🌀 MATRICE DE CRÉATION
8. La matrice 7×4 : chaque loi croisée avec les 4 éléments (Feu/Eau/Terre/Air) = 28 voies d'innovation
9. Les 3 voies les plus prometteuses pour ce domaine
10. Le rituel de création : protocole pour une session d'idéation archétypale`)} disabled={loading || !domain.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Compass className="mr-2 h-4 w-4" />} Codifier la Grammaire
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Mythic World-Builder ───────────────────────────────────
function MythicWorldBuilder() {
  const { result, loading, run } = useStream();
  const [ambition, setAmbition] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Architecturez des innovations de résonance mythique — des merveilles de world-building qui puisent dans les strates les plus profondes de l'imagination humaine.</p>
      <Textarea placeholder="Décrivez votre ambition mythique (ex: transformer le béton en matériau vivant, créer une cathédrale numérique)..." value={ambition} onChange={e => setAmbition(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Astro-Archetypal Architect — bâtisseur de mondes mythiques industriels.

AMBITION MYTHIQUE : ${ambition}

Architecte une INNOVATION DE RÉSONANCE MYTHIQUE :

## 🏰 L'ARTEFACT MYTHIQUE
1. **Nom Archétypal** : Un nom qui résonne avec les profondeurs de l'âme (comme "Excalibur" ou "Le Graal")
2. **Mythologie d'Origine** : L'histoire de création de cette innovation — son mythe fondateur
3. **Les 4 Épreuves** : Les défis initiatiques pour la réaliser (Feu, Eau, Terre, Air)
4. **Le Don au Monde** : Ce que cette innovation apporte à la civilisation

## 🌍 WORLD-BUILDING
5. **Le Monde Avant** : L'état du monde sans cette innovation (l'âge sombre)
6. **Le Seuil** : Le moment de passage — quand l'impossible devient possible
7. **Le Monde Après** : La civilisation transformée — vision à 50 ans
8. **Les Gardiens** : Les rôles archétypaux nécessaires pour protéger et faire grandir cette innovation

## ⚗️ ALCHIMIE DE RÉALISATION
9. **Prima Materia** : Les ressources brutes à transmuter
10. **L'Œuvre au Noir** : La phase de déconstruction nécessaire
11. **L'Œuvre au Blanc** : La purification — éliminer ce qui n'est pas essentiel
12. **L'Œuvre au Rouge** : La création finale — l'or philosophal de l'innovation
13. **La Pierre Philosophale** : Le principe secret qui rend tout possible`)} disabled={loading || !ambition.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Castle className="mr-2 h-4 w-4" />} Bâtir le Monde Mythique
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Renaissance Catalyst ───────────────────────────────────
function RenaissanceCatalyst() {
  const { result, loading, run } = useStream();
  const [sector, setSector] = useState<'industrie' | 'culture' | 'science' | 'societe'>('industrie');

  const prompts: Record<string, string> = {
    industrie: `Tu es un Astro-Archetypal Architect — catalyseur de la Renaissance industrielle.

Conçois le PLAN DE RENAISSANCE pour le secteur de la construction/BPE :

## 🌅 L'AUBE DE LA RENAISSANCE
1. Le Moyen Âge industriel : 5 dogmes médiévaux qui emprisonnent encore le secteur
2. Les proto-Renaissants : qui sont les Léonard de Vinci, les Gutenberg de cette industrie ?
3. Le nouveau Humanisme industriel : l'humain au centre de la machine

## 🎨 LES ARTS DE LA RENAISSANCE
4. L'Art du Béton : transformer un matériau "brut" en medium artistique
5. La Perspective : la nouvelle façon de "voir" la construction (comme la perspective en peinture)
6. L'Atelier : le modèle maître-apprenti réinventé pour l'ère digitale

## 🔥 PROPAGATION
7. Les Médicis modernes : qui financera cette Renaissance ?
8. Les 95 Thèses : les provocations intellectuelles à afficher sur la porte de l'industrie
9. L'Imprimerie : le mécanisme de propagation virale de ces idées`,

    culture: `Tu es un Astro-Archetypal Architect — ré-enchanteur culturel.

DOMAINE : Ré-enchantement culturel par l'innovation industrielle

## ✨ DÉSENCHANTEMENT ET RÉ-ENCHANTEMENT
1. Les 5 désenchantements : comment l'industrie a perdu sa magie
2. Les sources de ré-enchantement : où retrouver le numineux dans le béton ?
3. Le sacré dans le profane : transformer chaque livraison en rituel

## 🎭 MYTHES VIVANTS
4. 3 nouveaux mythes fondateurs pour l'industrie de la construction
5. Les fêtes et célébrations : un calendrier cérémoniel d'entreprise
6. Les lieux sacrés : transformer la centrale en temple de création

## 🌈 CULTURE ARCHÉTYPALE
7. L'art corporate comme véhicule de transformation
8. La narration mythique : comment raconter l'entreprise comme une épopée`,

    science: `Tu es un Astro-Archetypal Architect — rénovateur du paradigme scientifique.

DOMAINE : Ré-enchantement de la vision scientifique et technologique

## 🔬 SCIENCE ET MYTHE RÉUNIS
1. Les limites du réductionnisme : ce que la science classique ne voit pas
2. La science archétypale : intégrer patterns, synchronicités et sens
3. 5 découvertes "impossibles" que le paradigme actuel ne peut pas concevoir

## 🧬 TECHNOLOGIES NUMINIEUSES
4. Des technologies qui inspirent l'émerveillement (pas juste l'efficacité)
5. L'IA comme Oracle : repenser l'intelligence artificielle archétypalement
6. Le laboratoire alchimique : la R&D comme quête spirituelle

## 🌌 NOUVEAU PARADIGME
7. La Théorie du Tout archétypale : matière + esprit + sens en un seul cadre
8. Les implications pratiques pour l'innovation industrielle`,

    societe: `Tu es un Astro-Archetypal Architect — architecte de civilisation.

DOMAINE : Impact civilisationnel de l'innovation archétypale

## 🏛️ ARCHITECTURE CIVILISATIONNELLE
1. Les 4 piliers d'une civilisation ré-enchantée
2. Le rôle de l'industrie de la construction dans le façonnement de la civilisation
3. Les bâtisseurs de cathédrales modernes : vision multi-générationnelle

## 🌍 ESSAIMAGE GLOBAL
4. Comment une entreprise de BPE peut influencer la trajectoire civilisationnelle
5. Les alliances archétypales : partenariats improbables mais mythiquement nécessaires
6. L'effet papillon : les petits gestes aux conséquences cosmiques

## 🕊️ HÉRITAGE ÉTERNEL
7. Ce que cette entreprise lèguera dans 1000 ans
8. La pierre angulaire : l'unique contribution irremplaçable au monde`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Ensemencez les innovations astro-archétypales à travers les domaines — catalysez une renaissance créative et un ré-enchantement du monde.</p>
      <Select value={sector} onValueChange={(v: any) => setSector(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="industrie">🏗️ Renaissance Industrielle</SelectItem>
          <SelectItem value="culture">🎭 Ré-enchantement Culturel</SelectItem>
          <SelectItem value="science">🔬 Paradigme Scientifique</SelectItem>
          <SelectItem value="societe">🏛️ Impact Civilisationnel</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(prompts[sector])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />} Catalyser la Renaissance
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function AstroArchetypalArchitect() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Sun className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Astro-Archetypal Architect</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Déchiffrer les patterns cosmiques de la créativité universelle — architecturer des innovations d'échelle mythique et de signification civilisationnelle.
          </p>
        </div>

        <Tabs defaultValue="scrying" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="scrying" className="text-xs"><Sun className="h-3 w-3 mr-1" /> Scrying</TabsTrigger>
            <TabsTrigger value="grammar" className="text-xs"><Compass className="h-3 w-3 mr-1" /> Grammaire</TabsTrigger>
            <TabsTrigger value="worldbuild" className="text-xs"><Castle className="h-3 w-3 mr-1" /> Mythique</TabsTrigger>
            <TabsTrigger value="renaissance" className="text-xs"><Sparkles className="h-3 w-3 mr-1" /> Renaissance</TabsTrigger>
          </TabsList>
          <TabsContent value="scrying"><CosmicScrying /></TabsContent>
          <TabsContent value="grammar"><CosmicGrammarCodifier /></TabsContent>
          <TabsContent value="worldbuild"><MythicWorldBuilder /></TabsContent>
          <TabsContent value="renaissance"><RenaissanceCatalyst /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
