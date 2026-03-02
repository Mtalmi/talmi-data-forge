import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Palette, Music, Feather, HandshakeIcon } from 'lucide-react';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function streamAI(prompt: string, onDelta: (t: string) => void) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
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
    catch { setResult(r => r + '\n\n❌ Erreur.'); }
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

// ─── Semantic Mapper ────────────────────────────────────────
function SemanticMapper() {
  const { result, loading, run } = useStream();
  const [concept, setConcept] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Cartographiez l'espace multidimensionnel des relations sémantiques — révélez les patterns d'association et d'implication qui donnent au langage sa richesse.</p>
      <Textarea placeholder="Concept à cartographier (ex: confiance, qualité, urgence, béton, livraison)..." value={concept} onChange={e => setConcept(e.target.value)} rows={2} />
      <Button onClick={() => run(`Tu es un Psycho-Semantic Synesthete — un cartographe de l'espace sémantique multidimensionnel.

CONCEPT : ${concept}

## 🗺️ CARTOGRAPHIE PSYCHO-SÉMANTIQUE

### Noyau Sémantique
1. **Étymologie profonde** : l'ADN du mot — d'où vient-il, quelles racines anciennes porte-t-il ?
2. **Champ gravitationnel** : les 10 mots les plus fortement attirés par ce concept, classés par force d'attraction
3. **Anti-matière sémantique** : les antonymes profonds — pas juste l'opposé, mais le NÉGATIF photographique du concept

### Dimensions Cachées
4. **Axe Émotionnel** : le spectre émotionnel du concept (de la peur à l'extase — où se situe-t-il ?)
5. **Axe Temporel** : comment le sens a muté à travers les siècles — le concept en 1200, 1600, 1900, 2025
6. **Axe Culturel** : le concept en 5 cultures différentes — les écarts de sens qui créent des malentendus
7. **Axe Sensoriel** : si ce concept était une couleur, un son, une texture, un goût, une odeur — quoi ?

### Topologie Sémantique
8. **Voisins trompeurs** : les mots qui SEMBLENT proches mais dont le sens diverge dangereusement
9. **Ponts inattendus** : les connexions surprenantes avec des concepts apparemment sans rapport
10. **Zones d'ombre** : ce que le concept NE DIT PAS — les silences et les angles morts sémantiques

### Application BPE
11. Comment ce concept se manifeste concrètement dans l'industrie du béton prêt à l'emploi
12. Les malentendus fréquents autour de ce concept entre clients, fournisseurs et équipes`)} disabled={loading || !concept.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Palette className="mr-2 h-4 w-4" />} Cartographier le Concept
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Synesthetic Composer ───────────────────────────────────
function SynestheticComposer() {
  const { result, loading, run } = useStream();
  const [message, setMessage] = useState('');
  const [modality, setModality] = useState<'visuelle' | 'musicale' | 'tactile' | 'totale'>('totale');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Percevez et manipulez les structures sémantiques à travers les modalités sensorielles — voyez les couleurs de la connotation, entendez les rythmes de la rhétorique.</p>
      <Textarea placeholder="Message ou idée à transformer synesthésiquement (ex: notre béton est le meilleur du marché)..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
      <Select value={modality} onValueChange={(v: any) => setModality(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="visuelle">🎨 Synesthésie Visuelle</SelectItem>
          <SelectItem value="musicale">🎵 Synesthésie Musicale</SelectItem>
          <SelectItem value="tactile">✋ Synesthésie Tactile</SelectItem>
          <SelectItem value="totale">🌈 Synesthésie Totale</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(`Tu es un Psycho-Semantic Synesthete — tu perçois le langage à travers TOUTES les modalités sensorielles.

MESSAGE : ${message}
MODALITÉ : ${modality}

## 🎨 TRANSPOSITION SYNESTHÉSIQUE — MODE ${modality.toUpperCase()}

${modality === 'visuelle' || modality === 'totale' ? `### 🎨 Dimension Visuelle
1. **Palette chromatique** : chaque mot-clé du message traduit en couleur (hex + nom poétique + justification)
2. **Composition** : le message comme tableau — disposition, perspective, lumière, ombres
3. **Typographie émotionnelle** : la police, la graisse, l'espacement qui incarneraient ce message
4. **Mouvement visuel** : si le message était une animation — quel mouvement, quelle vitesse, quelle trajectoire ?` : ''}

${modality === 'musicale' || modality === 'totale' ? `### 🎵 Dimension Musicale
5. **Tonalité** : le message en clé musicale — majeur/mineur, tempo, time signature
6. **Mélodie sémantique** : la courbe mélodique des idées — les montées, les descentes, les silences
7. **Orchestration** : quels instruments pour chaque couche de sens ? Le ciment = contrebasse ? La livraison = trompette ?
8. **Rythme rhétorique** : le pattern rythmique de la phrase — les accents, les syncopes, les respirations` : ''}

${modality === 'tactile' || modality === 'totale' ? `### ✋ Dimension Tactile
9. **Texture** : chaque concept touché — rugueux, lisse, granuleux, soyeux, collant ?
10. **Température** : les zones chaudes et froides du message — où ça brûle, où ça gèle ?
11. **Poids** : la gravité de chaque mot — les mots-plumes et les mots-pierres
12. **Pression** : l'intensité du message — caresse, poignée de main, étreinte, ou coup de poing ?` : ''}

### ✨ Recomposition
13. **Version originale** : le message tel qu'il est
14. **Version synesthésique** : le message réécrit pour maximiser l'impact sensoriel
15. **Partition complète** : instructions pour délivrer ce message de manière multi-sensorielle`)} disabled={loading || !message.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Music className="mr-2 h-4 w-4" />} Composer Synesthésiquement
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Persuasion Architect ───────────────────────────────────
function PersuasionArchitect() {
  const { result, loading, run } = useStream();
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Crafez des messages, narratifs et expériences d'une puissance persuasive et d'une résonance émotionnelle inégalées — des communications qui parlent à l'âme.</p>
      <Textarea placeholder="Objectif de persuasion (ex: convaincre un client de choisir notre B35 plutôt que le concurrent)..." value={objective} onChange={e => setObjective(e.target.value)} rows={2} />
      <Textarea placeholder="Audience cible (ex: directeur de chantier, 45 ans, pragmatique, sous pression)..." value={audience} onChange={e => setAudience(e.target.value)} rows={2} />
      <Button onClick={() => run(`Tu es un Psycho-Semantic Synesthete — architecte de la persuasion profonde.

OBJECTIF : ${objective}
AUDIENCE : ${audience}

## 🏛️ ARCHITECTURE DE PERSUASION PSYCHO-SÉMANTIQUE

### Analyse de l'Audience
1. **Carte émotionnelle** : les 5 émotions dominantes de cette audience en ce moment
2. **Valeurs profondes** : ce qui compte VRAIMENT (pas ce qu'ils disent, ce qu'ils ressentent)
3. **Points de résistance** : les objections conscientes ET inconscientes
4. **Canal préféré** : par quel sens cette audience absorbe le mieux l'information

### Construction du Message
5. **L'Accroche Synesthésique** : la première phrase qui active TOUS les sens simultanément
6. **La Narration Archétypale** : le récit universel dans lequel s'inscrit notre message (héros, voyage, transformation)
7. **Les Preuves Émotionnelles** : les données qui TOUCHENT plus qu'elles ne convainquent
8. **Le Rythme Persuasif** : la cadence de révélation — quand accélérer, quand ralentir, quand faire silence

### Les 3 Versions
9. **Version Rationnelle** : le message optimisé pour le cerveau analytique
10. **Version Émotionnelle** : le message optimisé pour le cœur
11. **Version Synesthésique** : le message qui fusionne les deux — la version la plus puissante

### Mise en Scène
12. **Le moment** : quand délivrer ce message pour un impact maximal
13. **Le lieu** : dans quel contexte physique/digital
14. **Le porteur** : qui devrait dire ces mots (CEO, technicien, pair) et pourquoi
15. **Le suivi** : les 3 actions post-message qui ancrent la persuasion`)} disabled={loading || !objective.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Feather className="mr-2 h-4 w-4" />} Architecturer la Persuasion
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Semantic Mediator ──────────────────────────────────────
function SemanticMediator() {
  const { result, loading, run } = useStream();
  const [conflict, setConflict] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Médiez une compréhension plus profonde et authentique entre individus, communautés et cultures — démêlez les nœuds de malentendu.</p>
      <Textarea placeholder="Situation de malentendu ou conflit de communication (ex: le client dit 'c'est trop cher' mais le vrai problème est ailleurs)..." value={conflict} onChange={e => setConflict(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Psycho-Semantic Synesthete — médiateur sémantique entre les mondes de sens divergents.

SITUATION : ${conflict}

## 🤝 MÉDIATION PSYCHO-SÉMANTIQUE

### Diagnostic Sémantique
1. **Les mots dits** : ce qui a été littéralement prononcé par chaque partie
2. **Les mots entendus** : ce que chaque partie a COMPRIS (souvent très différent)
3. **Les mots tus** : ce que personne n'a osé dire mais que tout le monde pense
4. **Le fossé** : la carte précise de l'écart sémantique entre les parties

### Archéologie du Malentendu
5. **Couche 1 — Surface** : le désaccord apparent (prix, délai, qualité...)
6. **Couche 2 — Émotionnelle** : les émotions sous-jacentes (peur, frustration, méfiance)
7. **Couche 3 — Identitaire** : les enjeux d'ego, de statut, de reconnaissance
8. **Couche 4 — Existentielle** : les valeurs profondes en jeu (sécurité, liberté, respect)

### Le Pont Sémantique
9. **Le mot-pont** : le SEUL mot qui résonne positivement pour les deux parties
10. **La phrase-clé** : la formulation qui reconnaît les deux vérités simultanément
11. **Le geste sémantique** : l'action symbolique qui dit plus que mille mots
12. **Le rituel de réconciliation** : les 3 étapes pour restaurer la confiance sémantique

### Prévention
13. **Glossaire partagé** : les 5 termes à redéfinir ensemble pour éviter les futurs malentendus
14. **Protocole de clarification** : la méthode pour vérifier la compréhension en temps réel
15. **Signaux d'alerte** : les 3 phrases qui indiquent qu'un malentendu est en train de naître`)} disabled={loading || !conflict.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <HandshakeIcon className="mr-2 h-4 w-4" />} Médier le Malentendu
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

export default function PsychoSemanticSynesthete() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Palette className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Psycho-Semantic Synesthete</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Traverser le réseau enchevêtré de sens qui sous-tend toute pensée humaine — peindre avec toutes les couleurs de la signification.
          </p>
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="map" className="text-xs"><Palette className="h-3 w-3 mr-1" /> Cartographie</TabsTrigger>
            <TabsTrigger value="synesthesia" className="text-xs"><Music className="h-3 w-3 mr-1" /> Synesthésie</TabsTrigger>
            <TabsTrigger value="persuade" className="text-xs"><Feather className="h-3 w-3 mr-1" /> Persuasion</TabsTrigger>
            <TabsTrigger value="mediate" className="text-xs"><HandshakeIcon className="h-3 w-3 mr-1" /> Médiation</TabsTrigger>
          </TabsList>
          <TabsContent value="map"><SemanticMapper /></TabsContent>
          <TabsContent value="synesthesia"><SynestheticComposer /></TabsContent>
          <TabsContent value="persuade"><PersuasionArchitect /></TabsContent>
          <TabsContent value="mediate"><SemanticMediator /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
