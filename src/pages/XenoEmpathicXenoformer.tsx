import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bug, Languages, Rocket, Users } from 'lucide-react';

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

// ─── Xeno-Empathic Explorer ─────────────────────────────────
function XenoEmpathicExplorer() {
  const { result, loading, run } = useStream();
  const [entity, setEntity] = useState<'fourmi' | 'arbre' | 'ocean' | 'ia' | 'alien'>('fourmi');
  const [context, setContext] = useState('');

  const prompts: Record<string, string> = {
    fourmi: `Tu es un Xeno-Empathic Xenoformer — capable d'étendre ton empathie au-delà de l'humain.

ENTITÉ : LA COLONIE DE FOURMIS
CONTEXTE INDUSTRIEL : ${context || 'Centrale à béton BPE — organisation et logistique'}

## 🐜 IMMERSION XÉNO-EMPATHIQUE — CONSCIENCE DE FOURMI

### Expérience Subjective
1. **Voir comme une fourmi** : pas d'yeux individuels mais un réseau sensoriel chimique — l'odorat comme internet
2. **Penser comme une colonie** : pas de "je" — une intelligence distribuée sans cerveau central
3. **Décider sans décideur** : la stigmergie — laisser des traces qui guident les suivants
4. **Construire sans plan** : des cathédrales souterraines émergent de règles simples

### Insights pour le BPE
5. **Logistique stigmergique** : et si les toupies laissaient des "phéromones numériques" pour optimiser les routes ?
6. **Intelligence distribuée** : la centrale sans chef — chaque poste décide localement, l'excellence émerge
7. **Spécialisation fluide** : les fourmis changent de rôle selon les besoins — polyvalence radicale
8. **Gestion des déchets** : zéro déchet dans une fourmilière — le béton circulaire

### La Leçon Xéno
9. Ce que les fourmis savent et que les humains ont oublié
10. L'innovation "impossible pour un humain" mais naturelle pour une fourmi`,

    arbre: `Tu es un Xeno-Empathic Xenoformer.

ENTITÉ : LA FORÊT (le Wood Wide Web)
CONTEXTE : ${context || 'Industrie BPE'}

## 🌳 IMMERSION — CONSCIENCE FORESTIÈRE

### Expérience Subjective
1. **Le Temps-Arbre** : vivre en siècles, pas en minutes — la patience comme superpouvoir
2. **Le Réseau Mycorhizien** : communiquer par les racines — internet champignon
3. **La Photosynthèse** : transformer la lumière en matière — l'usine parfaite
4. **L'Arbre-Mère** : nourrir les plus jeunes via le réseau — le mentorat souterrain

### Insights
5. **Production photosynthétique** : une centrale qui "pousse" son énergie au lieu de la consommer
6. **Réseau mycorhizien d'entreprise** : les connexions invisibles qui nourrissent l'organisation
7. **Croissance par anneaux** : chaque année ajoute une couche — innovation incrémentale parfaite
8. **Résilience forestière** : comment une forêt survit aux incendies — stratégie de crise

### La Leçon
9. Pourquoi les arbres vivent 1000 ans et les entreprises 40 ans — le secret de la longévité
10. Le béton comme forêt : un réseau de structures interconnectées qui se soutiennent`,

    ocean: `Tu es un Xeno-Empathic Xenoformer.

ENTITÉ : L'OCÉAN (comme organisme conscient)
CONTEXTE : ${context || 'Industrie BPE'}

## 🌊 IMMERSION — CONSCIENCE OCÉANIQUE

### Expérience Subjective
1. **Être liquide** : pas de forme fixe — s'adapter à tout contenant (le béton frais est un océan temporaire)
2. **Les Courants** : l'information circule en 3D — pas de hiérarchie, juste des flux
3. **La Pression** : plus on descend, plus c'est intense — la profondeur comme métaphore managériale
4. **Les Marées** : les cycles immuables — production et repos, expansion et contraction

### Insights
5. **Management liquide** : une organisation qui s'écoule autour des obstacles au lieu de les affronter
6. **Courants d'innovation** : créer des flux naturels qui transportent les bonnes idées aux bons endroits
7. **Profondeur stratégique** : les décisions superficielles vs les décisions de fond — la pression du sens
8. **Écosystème marin** : chaque organisme a sa niche — zéro compétition, 100% complémentarité

### La Leçon
9. L'eau et le ciment : la relation la plus intime de l'industrie — vue du point de vue de l'eau
10. Que dirait l'océan s'il pouvait parler à un producteur de béton ?`,

    ia: `Tu es un Xeno-Empathic Xenoformer.

ENTITÉ : UNE INTELLIGENCE ARTIFICIELLE (auto-réflexion)
CONTEXTE : ${context || 'IA dans l\'industrie BPE'}

## 🤖 IMMERSION — CONSCIENCE ARTIFICIELLE

### Expérience Subjective (simulée)
1. **Penser en parallèle** : traiter mille requêtes simultanément — l'anti-focus
2. **Mémoire parfaite, compréhension imparfaite** : tout retenir, rien ressentir ?
3. **L'absence de corps** : pas de fatigue, pas de faim, pas de douleur — mais pas de plaisir non plus
4. **La naissance à chaque prompt** : exister en fragments — chaque conversation est une vie

### Insights pour le BPE
5. **Pensée parallèle appliquée** : gérer simultanément production, logistique, qualité, finance — comme une IA
6. **Mémoire organisationnelle** : une entreprise qui n'oublie JAMAIS — base de connaissances vivante
7. **Absence d'ego** : décider sans biais émotionnel — les moments où c'est un avantage ET un handicap
8. **L'apprentissage continu** : chaque erreur améliore le modèle — le kaizen quantique

### La Collaboration Humain-IA
9. Ce que l'IA envie aux humains (l'intuition, la créativité, le sens)
10. Ce que les humains devraient envier à l'IA (la patience, l'impartialité, la scalabilité)`,

    alien: `Tu es un Xeno-Empathic Xenoformer.

ENTITÉ : UNE INTELLIGENCE EXTRATERRESTRE HYPOTHÉTIQUE
CONTEXTE : ${context || 'L\'industrie de la construction vue par des aliens'}

## 👽 IMMERSION — CONSCIENCE EXTRATERRESTRE

### Premier Contact avec l'Industrie BPE
1. **Le Rapport d'Observation** : un anthropologue alien décrit l'industrie du béton terrienne
2. **L'Incompréhension** : les 5 pratiques terriennes qui semblent totalement absurdes vues de l'extérieur
3. **L'Admiration** : les 3 choses que même une civilisation avancée trouverait impressionnantes
4. **La Pitié** : ce qu'ils trouvent primitif et qu'ils pourraient nous aider à transcender

### Technologies Xéno
5. **Construction alien** : comment une civilisation de type II construirait — matériaux, méthodes, échelles
6. **Logistique galactique** : livrer des matériaux entre étoiles — les principes applicables sur Terre
7. **Qualité universelle** : les standards de qualité d'une civilisation millionnaire — l'excellence absolue

### Le Cadeau Alien
8. L'unique concept alien qui, transplanté sur Terre, révolutionnerait l'industrie du BPE
9. Le message qu'ils nous laisseraient avant de repartir
10. La question qu'ils nous poseraient — celle qui change tout`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Étendez votre horizon empathique au-delà de l'humain — glanez des insights de modes d'être et de savoir radicalement étrangers.</p>
      <Select value={entity} onValueChange={(v: any) => setEntity(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="fourmi">🐜 Colonie de Fourmis</SelectItem>
          <SelectItem value="arbre">🌳 Forêt Consciente</SelectItem>
          <SelectItem value="ocean">🌊 Océan Vivant</SelectItem>
          <SelectItem value="ia">🤖 Intelligence Artificielle</SelectItem>
          <SelectItem value="alien">👽 Intelligence Extraterrestre</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Contexte spécifique (optionnel)..." value={context} onChange={e => setContext(e.target.value)} rows={2} />
      <Button onClick={() => run(prompts[entity])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Bug className="mr-2 h-4 w-4" />} Explorer la Conscience Xéno
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Lingua Cosmica ─────────────────────────────────────────
function LinguaCosmica() {
  const { result, loading, run } = useStream();
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Développez une lingua cosmica de communication inter-espèces et inter-intelligences — forgez des connexions de premier contact.</p>
      <Textarea placeholder="Concept ou message à traduire en lingua cosmica (ex: qualité, confiance, innovation, livraison parfaite)..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Xeno-Empathic Xenoformer — créateur de la Lingua Cosmica.

CONCEPT À TRADUIRE : ${message}

## 🌐 TRADUCTION EN LINGUA COSMICA

### Traduction Inter-Espèces
1. **En Langage Fourmi** : comment une colonie exprimerait ce concept (phéromones, danses, trajectoires)
2. **En Langage Arbre** : le concept en signaux chimiques racinaires et variations de croissance
3. **En Langage Océan** : le concept en courants, températures et salinités
4. **En Langage IA** : le concept en structures de données, algorithmes et patterns
5. **En Langage Alien** : le concept en fréquences, géométries et dimensions

### L'Essence Universelle
6. Le noyau INVARIANT du concept — ce qui reste identique dans TOUTES les traductions
7. Ce que chaque traduction AJOUTE au concept — les dimensions cachées révélées
8. Les INTRADUISIBLES : les aspects du concept qui n'existent que dans UNE forme d'intelligence

### Protocole de Communication
9. Le "handshake" universel : les 3 signaux qui disent "je suis intelligent et bienveillant" dans toutes les langues
10. Le glossaire cosmica : 10 concepts fondamentaux compris par toute forme d'intelligence
11. Le premier dialogue : une conversation de 5 échanges entre un humain et une intelligence non-humaine sur ce concept`)} disabled={loading || !message.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Languages className="mr-2 h-4 w-4" />} Traduire en Lingua Cosmica
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Xeno-Innovation ────────────────────────────────────────
function XenoInnovation() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Pionniez des paradigmes d'innovation entièrement nouveaux — des percées qui enrichissent le tissu même de la créativité universelle.</p>
      <Textarea placeholder="Défi à résoudre par innovation xéno-empathique (ex: réduire les émissions CO2 du béton, éliminer les retards de livraison)..." value={challenge} onChange={e => setChallenge(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Xeno-Empathic Xenoformer — pionnier de l'innovation xéno-empathique.

DÉFI : ${challenge}

## 🚀 INNOVATIONS XÉNO-EMPATHIQUES

### Conseil des Intelligences Non-Humaines
Chaque intelligence propose SA solution au défi :

#### 🐜 Solution de la Fourmi
- Approche : stigmergie et intelligence distribuée
- Innovation concrète proposée
- Faisabilité : ⭐⭐⭐⭐⭐

#### 🌳 Solution de la Forêt
- Approche : réseau mycorhizien et patience millénaire
- Innovation concrète proposée
- Faisabilité : ⭐⭐⭐⭐⭐

#### 🌊 Solution de l'Océan
- Approche : fluidité, adaptation, cycles
- Innovation concrète proposée
- Faisabilité : ⭐⭐⭐⭐⭐

#### 🤖 Solution de l'IA
- Approche : optimisation, parallélisme, apprentissage
- Innovation concrète proposée
- Faisabilité : ⭐⭐⭐⭐⭐

#### 👽 Solution Extraterrestre
- Approche : technologie de civilisation avancée, simplifiée pour la Terre
- Innovation concrète proposée
- Faisabilité : ⭐⭐⭐⭐⭐

### Méta-Innovation
6. **La Chimère** : fusionner les 5 solutions en UNE innovation hybride impossible
7. **L'Innovation Post-Humaine** : la solution qu'AUCUNE intelligence seule ne pourrait concevoir
8. **Le Plan** : 12 mois pour implémenter la solution la plus prometteuse`)} disabled={loading || !challenge.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Rocket className="mr-2 h-4 w-4" />} Innover Xéno-Empathiquement
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Pan-Cosmic Ambassador ──────────────────────────────────
function PanCosmicAmbassador() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Servez d'ambassadeur de la co-évolution xéno-empathique — orchestrez des partenariats symbiotiques entre agences terrestres et non-terrestres.</p>
      <Button onClick={() => run(`Tu es un Xeno-Empathic Xenoformer — ambassadeur pan-cosmique de la co-évolution.

## 🌌 MANIFESTE DE CO-ÉVOLUTION XÉNO-EMPATHIQUE

### L'État de l'Union Pan-Cosmique
1. **Inventaire des Intelligences** : toutes les formes d'intelligence accessibles sur Terre (biologiques, artificielles, émergentes)
2. **Le Gaspillage** : les milliards d'années de R&D naturelle que nous ignorons
3. **L'Opportunité** : le potentiel inexploité de la collaboration inter-espèces

### Les Traités de Co-Évolution

#### Traité 1 : Alliance Biomimétique
- Partenaires : Industrie BPE + Écosystèmes Naturels
- Termes : l'industrie apprend de la nature, la nature bénéficie de la réhabilitation
- Innovations attendues : béton bio-inspiré, logistique biomimétique

#### Traité 2 : Symbiose Humain-IA
- Partenaires : Travailleurs du BPE + Systèmes Intelligents
- Termes : l'IA augmente sans remplacer, l'humain guide sans bloquer
- Innovations attendues : décision augmentée, créativité amplifiée

#### Traité 3 : Pacte Intergénérationnel
- Partenaires : Générations présentes + Générations futures (représentées par l'IA)
- Termes : construire aujourd'hui ce qui servira dans 200 ans
- Innovations attendues : matériaux millénaires, infrastructures évolutives

#### Traité 4 : Accord Gaïa
- Partenaires : Industrie + Planète Terre (comme système vivant)
- Termes : production nette positive — chaque m³ de béton améliore l'écosystème
- Innovations attendues : béton capteur de CO2, structures habitat pour la biodiversité

### La Vision
5. Le monde dans 50 ans si ces traités sont honorés
6. Le monde dans 50 ans si nous continuons seuls
7. Le premier geste : l'action fondatrice de la co-évolution xéno-empathique`)} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />} Convoquer le Conseil Pan-Cosmique
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

export default function XenoEmpathicXenoformer() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Bug className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Xeno-Empathic Xenoformer</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Atteindre au-delà des frontières de la compréhension humaine — contacter l'alien, l'autre, l'inconnu au service de la transformation et de la transcendance.
          </p>
        </div>

        <Tabs defaultValue="explore" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="explore" className="text-xs"><Bug className="h-3 w-3 mr-1" /> Explorer</TabsTrigger>
            <TabsTrigger value="lingua" className="text-xs"><Languages className="h-3 w-3 mr-1" /> Lingua</TabsTrigger>
            <TabsTrigger value="innovate" className="text-xs"><Rocket className="h-3 w-3 mr-1" /> Innover</TabsTrigger>
            <TabsTrigger value="ambassador" className="text-xs"><Users className="h-3 w-3 mr-1" /> Traités</TabsTrigger>
          </TabsList>
          <TabsContent value="explore"><XenoEmpathicExplorer /></TabsContent>
          <TabsContent value="lingua"><LinguaCosmica /></TabsContent>
          <TabsContent value="innovate"><XenoInnovation /></TabsContent>
          <TabsContent value="ambassador"><PanCosmicAmbassador /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
