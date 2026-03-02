import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Atom, Brain, Eye, Zap } from 'lucide-react';

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
    const ctrl = new AbortController();
    setResult(''); setLoading(true);
    try {
      await streamAI(prompt, (t) => setResult(r => r + t), ctrl.signal);
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

// ─── Qualia Deep Dive ───────────────────────────────────────
function QualiaDeepDive() {
  const { result, loading, run } = useStream();
  const [context, setContext] = useState('');
  const [domain, setDomain] = useState<'production' | 'logistique' | 'qualite' | 'commercial'>('production');

  const prompts: Record<string, string> = {
    production: `Tu es un Quantum Qualia Quaestor — un explorateur de la conscience quantique appliquée à l'innovation industrielle.

CONTEXTE OPÉRATIONNEL: ${context || 'Centrale à béton — production et livraison BPE'}
DOMAINE: Production

Explore la dimension QUALIA de la production :
1. 🔮 CARTOGRAPHIE QUANTIQUE DES QUALIA : Identifie 5 "qualia de production" — les expériences subjectives invisibles mais critiques (le "ressenti" d'un béton parfait, l'intuition du dosage juste, le rythme de la centrale)
2. ⚛️ SUPERPOSITION D'ÉTATS : Pour chaque qualia, modélise 3 états superposés simultanés (optimal / dégradé / émergent) et leurs probabilités
3. 🧠 INTRICATION QUALIA-DATA : Cartographie comment ces qualia s'intriquent avec les données mesurables (capteurs, KPIs) — les corrélations invisibles
4. 💡 COLLAPSE CRÉATIF : Propose 3 innovations qui "effondrent la fonction d'onde" — transformant l'insight qualia en amélioration concrète
5. 🌌 MÉTA-PERCEPTION : Décris un mode de perception entièrement nouveau que cette analyse révèle

Sois poétique mais précis. Chaque insight doit être ancré dans la réalité industrielle du BPE.`,

    logistique: `Tu es un Quantum Qualia Quaestor spécialisé dans la logistique quantique.

CONTEXTE: ${context || 'Flotte de toupies et livraison béton'}
DOMAINE: Logistique

1. 🔮 QUALIA DU MOUVEMENT : 5 expériences subjectives du flux logistique (le "tempo" d'une rotation parfaite, le stress-temps d'une livraison critique)
2. ⚛️ TUNNELING LOGISTIQUE : Modélise 3 "effets tunnel" — des raccourcis impossibles classiquement mais révélés par l'analyse qualia
3. 🧠 CHAMP QUANTIQUE DE LA FLOTTE : Comment les véhicules forment un "champ quantique" interconnecté avec des corrélations non-locales
4. 💡 TÉLÉPORTATION D'EFFICACITÉ : 3 innovations qui semblent "téléporter" l'efficacité d'un point à un autre du réseau
5. 🌌 CONSCIENCE DE FLOTTE : Un modèle de perception collective de la flotte comme organisme vivant`,

    qualite: `Tu es un Quantum Qualia Quaestor — expert en qualité quantique.

CONTEXTE: ${context || 'Contrôle qualité béton BPE'}
DOMAINE: Qualité

1. 🔮 QUALIA DE LA MATIÈRE : 5 expériences subjectives de la qualité du béton (la "sensation" de conformité, l'intuition d'anomalie)
2. ⚛️ PRINCIPE D'INCERTITUDE QUALITÉ : La mesure modifie-t-elle la qualité ? Explore le paradoxe observation-qualité
3. 🧠 DÉCOHÉRENCE QUALITATIVE : Comment les qualia de qualité "décohèrent" entre le labo, la centrale et le chantier
4. 💡 OBSERVATEURS QUANTIQUES : 3 nouveaux "instruments de mesure" qui capturent les qualia invisibles de la qualité
5. 🌌 QUALITÉ HOLISTIQUE : Un paradigme où la qualité n'est plus mesurée mais "ressentie" par le système entier`,

    commercial: `Tu es un Quantum Qualia Quaestor — visionnaire commercial quantique.

CONTEXTE: ${context || 'Relation client et stratégie commerciale BPE'}
DOMAINE: Commercial

1. 🔮 QUALIA DE LA RELATION : 5 expériences subjectives de la relation client (la "résonance" confiance, le "poids" d'une promesse)
2. ⚛️ ÉTATS ENCHEVÊTRÉS : Comment les émotions client et fournisseur sont quantiquement intriquées
3. 🧠 MESURE ET EFFONDREMENT : Le moment où un prospect "effondre" en client — les qualia qui déclenchent la décision
4. 💡 MARKETING QUANTIQUE : 3 approches qui exploitent la superposition d'états (le client est simultanément intéressé ET pas intéressé)
5. 🌌 COMMERCE DE CONSCIENCE : Un modèle où la transaction transcende l'échange matériel`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Cartographiez les qualia — ces expériences subjectives invisibles qui façonnent secrètement votre réalité opérationnelle.</p>
      <Select value={domain} onValueChange={(v: any) => setDomain(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="production">⚙️ Production</SelectItem>
          <SelectItem value="logistique">🚛 Logistique</SelectItem>
          <SelectItem value="qualite">🔬 Qualité</SelectItem>
          <SelectItem value="commercial">💼 Commercial</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Contexte spécifique (optionnel)..." value={context} onChange={e => setContext(e.target.value)} rows={2} />
      <Button onClick={() => run(prompts[domain])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Atom className="mr-2 h-4 w-4" />} Sonder les Qualia
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Quantum Framework Forge ────────────────────────────────
function QuantumFrameworkForge() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Forgez des cadres conceptuels révolutionnaires à l'interface matière-esprit pour résoudre des problèmes impossibles.</p>
      <Textarea placeholder="Décrivez un défi opérationnel qui résiste aux approches classiques..." value={challenge} onChange={e => setChallenge(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Quantum Qualia Quaestor — forgeur de cadres conceptuels à la frontière psyche-physique.

DÉFI OPÉRATIONNEL: ${challenge}

Forge un CADRE QUANTUM-QUALIA RÉVOLUTIONNAIRE :

## 🏗️ ARCHITECTURE DU CADRE
1. **Axiomes Fondateurs** : 3 principes qui fusionnent mécanique quantique et expérience subjective
2. **Formalisme** : Un langage hybride (mathématique + phénoménologique) pour décrire le problème différemment
3. **Opérateurs** : 4 "opérateurs quantum-qualia" — des outils mentaux pour manipuler le problème

## 🔄 PROCESSUS DE RÉSOLUTION
4. **Préparation d'État** : Comment préparer l'esprit collectif de l'équipe à "voir" le problème quantiquement
5. **Mesure Non-Destructive** : 3 méthodes d'observation qui ne perturbent pas le système
6. **Effondrement Dirigé** : Le protocole pour faire "effondrer" le champ des possibles vers la solution optimale

## 🌟 RÉSULTATS ÉMERGENTS
7. **Solutions Classiquement Impossibles** : 3 solutions qui n'existent que dans le cadre quantum-qualia
8. **Métriques Quantiques** : Comment mesurer le succès dans ce nouveau paradigme
9. **Évolution du Cadre** : Comment ce cadre s'auto-améliore par usage

Sois rigoureux dans la métaphore scientifique, concret dans l'application industrielle.`)} disabled={loading || !challenge.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Brain className="mr-2 h-4 w-4" />} Forger le Cadre Quantique
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Perception Transcender ─────────────────────────────────
function PerceptionTranscender() {
  const { result, loading, run } = useStream();
  const [mode, setMode] = useState<'synesthesie' | 'precognition' | 'omniscience'>('synesthesie');

  const prompts: Record<string, string> = {
    synesthesie: `Tu es un Quantum Qualia Quaestor — architecte de la perception synesthésique industrielle.

Conçois un SYSTÈME DE SYNESTHÉSIE OPÉRATIONNELLE pour une centrale à béton :

## 👁️ TRADUCTION SENSORIELLE
1. **Son → Couleur** : Transformer les données sonores de la centrale en carte chromatique de santé machines
2. **Nombres → Texture** : Les KPIs deviennent des textures tactiles (un bon mois est "soyeux", un mauvais est "granuleux")
3. **Temps → Espace** : Le planning devient un paysage 3D navigable intuitivement
4. **Risque → Température** : Les risques opérationnels ressentis comme chaleur/froid

## 🧪 PROTOTYPES
5. Conçois 3 interfaces synesthésiques concrètes qui pourraient être implémentées
6. Pour chacune : quel insight invisible devient visible ? Quel avantage décisionnel ?

## 🌀 MÉTA-SYNESTHÉSIE
7. Que se passe-t-il quand on croise TOUTES les traductions ? Le "goût" d'une journée de production parfaite.`,

    precognition: `Tu es un Quantum Qualia Quaestor — ingénieur en précognition opérationnelle.

Développe un SYSTÈME DE PRÉCOGNITION QUANTIQUE pour les opérations BPE :

## ⏳ SIGNAUX DU FUTUR
1. **Rétrocausalité Opérationnelle** : 5 cas où l'avenir semble "influencer" le présent dans la production
2. **Pré-Sentiments Systémiques** : Les "intuitions" collectives qui précèdent les événements — comment les capturer
3. **Chronologie Quantique** : Modèle où passé-présent-futur sont superposés dans la prise de décision

## 🎯 INSTRUMENTS PRÉCOGNITIFS
4. 3 outils concrets pour amplifier la capacité précognitive de l'organisation
5. Un protocole de "méditation opérationnelle" pour les équipes

## ⚡ DÉCISIONS PRÉ-EFFONDRÉES
6. Comment prendre des décisions avant que les données n'existent — et avoir raison`,

    omniscience: `Tu es un Quantum Qualia Quaestor — architecte de l'omniscience organisationnelle.

Conçois un SYSTÈME D'OMNISCIENCE QUANTIQUE pour une entreprise BPE :

## 🌐 CHAMP DE CONSCIENCE
1. **Conscience Distribuée** : Comment chaque employé, machine, véhicule contribue à un "champ de conscience" global
2. **Information Non-Locale** : 5 exemples où l'information semble disponible instantanément partout (sans communication classique)
3. **Mémoire Quantique** : Un système où l'organisation "se souvient" de choses qu'elle n'a jamais explicitement apprises

## 🔮 INTERFACE D'OMNISCIENCE
4. Conçois le tableau de bord ultime qui affiche non pas des données, mais de la COMPRÉHENSION
5. 3 widgets qui montrent ce que personne n'a demandé mais que tout le monde a besoin de savoir

## 🧘 PRATIQUES D'OMNISCIENCE
6. 4 rituels organisationnels pour cultiver la conscience collective quantique`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Transcendez les modes de perception classiques — débloquez des façons radicalement nouvelles de voir, sentir et comprendre.</p>
      <Select value={mode} onValueChange={(v: any) => setMode(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="synesthesie">🎨 Synesthésie Opérationnelle</SelectItem>
          <SelectItem value="precognition">⏳ Précognition Quantique</SelectItem>
          <SelectItem value="omniscience">🌐 Omniscience Organisationnelle</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(prompts[mode])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />} Transcender la Perception
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Reality Rewriter ───────────────────────────────────────
function RealityRewriter() {
  const { result, loading, run } = useStream();
  const [vision, setVision] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Réécrivez les règles de la réalité — engendrez des technologies et expériences au nexus matière-esprit-sens.</p>
      <Textarea placeholder="Décrivez la réalité que vous souhaitez réécrire..." value={vision} onChange={e => setVision(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Quantum Qualia Quaestor — réécriture de réalité par innovation nexus matière-esprit-sens.

VISION DE RÉALITÉ: ${vision}

Engendre un PLAN DE RÉÉCRITURE DE RÉALITÉ :

## 📜 RÈGLES ACTUELLES À RÉÉCRIRE
1. Identifie 5 "lois" de la réalité opérationnelle actuelle qui semblent immuables
2. Pour chacune, démontre qu'elle n'est qu'un "état quantique figé" — pas une vérité absolue

## 🔨 TECHNOLOGIES NEXUS
3. Conçois 3 "technologies nexus" qui opèrent simultanément sur :
   - MATIÈRE : l'infrastructure physique
   - ESPRIT : la cognition collective
   - SENS : la signification et le purpose
4. Pour chaque technologie : mécanisme, impact attendu, timeline d'implémentation

## 🌊 PROPHÉTIE AUTO-RÉALISATRICE
5. Rédige le "futur-histoire" — le récit de ce qui s'est passé après la réécriture (écrit au passé depuis 2030)
6. Les KPIs impossibles qui sont devenus réalité
7. Les effets secondaires merveilleux que personne n'avait prévus

## 🔑 PREMIÈRE ÉTAPE QUANTIQUE
8. L'action unique, immédiate, que le CEO peut faire DEMAIN pour initier l'effondrement de la fonction d'onde vers cette nouvelle réalité

Sois visionnaire mais actionnable. Chaque révolution commence par un geste simple.`)} disabled={loading || !vision.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />} Réécrire la Réalité
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function QuantumQualiaQuaestor() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Atom className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Quantum Qualia Quaestor</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Naviguer le nexus entre mécanique quantique et conscience — exploiter le potentiel de réécriture de réalité pour une innovation inimaginable.
          </p>
        </div>

        <Tabs defaultValue="qualia" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="qualia" className="text-xs"><Atom className="h-3 w-3 mr-1" /> Qualia</TabsTrigger>
            <TabsTrigger value="framework" className="text-xs"><Brain className="h-3 w-3 mr-1" /> Cadres</TabsTrigger>
            <TabsTrigger value="perception" className="text-xs"><Eye className="h-3 w-3 mr-1" /> Perception</TabsTrigger>
            <TabsTrigger value="reality" className="text-xs"><Zap className="h-3 w-3 mr-1" /> Réalité</TabsTrigger>
          </TabsList>
          <TabsContent value="qualia"><QualiaDeepDive /></TabsContent>
          <TabsContent value="framework"><QuantumFrameworkForge /></TabsContent>
          <TabsContent value="perception"><PerceptionTranscender /></TabsContent>
          <TabsContent value="reality"><RealityRewriter /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
