import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Brain, Map, Lightbulb, Zap } from 'lucide-react';

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

// ─── Cognitive Landscape Explorer ───────────────────────────
function CognitiveLandscape() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');
  const [terrain, setTerrain] = useState<'emotion' | 'memory' | 'imagination' | 'intuition'>('imagination');

  const terrains = {
    emotion: { label: '🌊 Océan Émotionnel', color: 'text-blue-400' },
    memory: { label: '🌿 Jungle Mnésique', color: 'text-emerald-400' },
    imagination: { label: '🏔️ Pics Imaginatifs', color: 'text-violet-400' },
    intuition: { label: '🌌 Cosmos Intuitif', color: 'text-amber-400' },
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(terrains) as [typeof terrain, typeof terrains[typeof terrain]][]).map(([key, val]) => (
              <button key={key} onClick={() => setTerrain(key)} className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${terrain === key ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-muted/40'}`}>
                {val.label}
              </button>
            ))}
          </div>
          <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Défi d'innovation à explorer dans les paysages neurocognitifs..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Neuro-Nomad — explorateur des territoires inexplorés de l'esprit humain qui rapporte des trésors d'insight pour l'innovation.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
TERRAIN MENTAL: ${terrains[terrain].label}
DÉFI: ${challenge.trim() || "Comment libérer le potentiel créatif latent de l'équipe TBOS pour transformer une industrie traditionnelle"}

EXPLORATION DU TERRAIN: ${terrain.toUpperCase()}

${terrain === 'emotion' ? `🌊 VOYAGE DANS L'OCÉAN ÉMOTIONNEL

1. CARTOGRAPHIE DES COURANTS ÉMOTIONNELS
   Les 7 courants émotionnels qui traversent TBOS:
   - Courant de fierté: quand un BL arrive parfait, quand la qualité B35 est impeccable
   - Courant de frustration: les retards, les écarts stock, les pannes toupie
   - Courant d'anxiété: les fins de mois, les impayés clients, la pression
   - Courant d'excitation: nouveau client, gros contrat, innovation
   - Courant de confiance: routines maîtrisées, équipe soudée
   - Courant de colère: injustices, erreurs répétées, manque de reconnaissance
   - Courant de curiosité: "et si on faisait autrement?"
   
   Pour chaque courant:
   - Intensité actuelle (1-10)
   - Son influence sur la performance (+ ou -)
   - Comment le canaliser vers l'innovation

2. NEUROCHIMIE DE L'INNOVATION
   Les molécules en jeu et comment les activer:
   - Dopamine: le système de récompense → design de feedback loops
   - Sérotonine: la confiance → rituels de reconnaissance
   - Noradrénaline: l'alerte → gestion de l'urgence productive
   - Ocytocine: la connexion → team building stratégique
   - Endorphines: le flow → optimisation des conditions de travail
   
   Le "cocktail neurochimique" optimal pour l'équipe TBOS

3. INTELLIGENCE ÉMOTIONNELLE APPLIQUÉE
   5 protocoles pour transformer les émotions en carburant d'innovation:
   Pour chaque: le déclencheur, la transformation, le résultat business, le ROI` :

terrain === 'memory' ? `🌿 EXPÉDITION DANS LA JUNGLE MNÉSIQUE

1. ARCHÉOLOGIE DE LA MÉMOIRE ORGANISATIONNELLE
   Les strates de mémoire enfouies dans TBOS:
   - Mémoire procédurale: les gestes automatiques (dosage, chargement, livraison)
   - Mémoire épisodique: les "histoires" de l'entreprise (crises, victoires, échecs)
   - Mémoire sémantique: le savoir-faire technique (formules, clients, fournisseurs)
   - Mémoire prospective: les intentions et plans (projets, promesses, échéances)
   
   Pour chaque strate:
   - Ce qui est bien préservé vs ce qui se perd
   - Les "fossiles" précieux à déterrer (anciens savoirs oubliés)
   - Comment les numériser et les rendre accessibles

2. PATTERNS MNÉSIQUES D'INNOVATION
   Les connexions cachées dans la mémoire collective:
   - Le problème de 2020 qui ressemble au défi de 2026
   - La solution abandonnée qui est maintenant viable
   - Le client perdu dont les besoins annoncent le marché futur
   - L'erreur récurrente qui cache une innovation systémique
   
   5 "mémoires dormantes" à réactiver pour innover

3. NEUROPLASTICITÉ ORGANISATIONNELLE
   Comment recâbler la mémoire collective de TBOS:
   - Désapprendre: les habitudes toxiques à effacer
   - Reconsolider: les processus à mettre à jour
   - Potentialiser: les connexions mnésiques à renforcer
   Programme en 12 semaines, ROI estimé` :

terrain === 'imagination' ? `🏔️ ASCENSION DES PICS IMAGINATIFS

1. TOPOGRAPHIE DE L'IMAGINATION COLLECTIVE
   Les zones imaginatives de l'équipe TBOS:
   - Zone convergente: résoudre (optimiser ce qui existe)
   - Zone divergente: explorer (imaginer ce qui n'existe pas)
   - Zone combinatoire: fusionner (associer des idées distantes)
   - Zone transformatrice: métamorphoser (changer la nature même du problème)
   
   Diagnostic: quelle zone est dominante? Laquelle est atrophiée?
   Exercices spécifiques pour muscler chaque zone

2. TECHNIQUES DE HAUTE ALTITUDE CRÉATIVE
   7 techniques neurocognitives pour atteindre les "pics":
   - Le Rêve Lucide Organisationnel: visualiser TBOS dans 10 ans en détail sensoriel
   - La Synesthésie Stratégique: "quel goût a notre béton B35?" → insights
   - Le Détournement Conceptuel: appliquer les règles du jazz au planning de livraison
   - L'Inversion Radicale: que ferait TBOS si le béton était GRATUIT?
   - La Bisociation: croiser deux domaines impossibles
   - Le Voyage Mental: être un m³ de béton de la commande à la dalle
   - La Pensée Fractale: le pattern qui se répète à toutes les échelles
   
   Pour chaque: protocole, durée, participants idéaux, exemples de résultats

3. SOMMETS ATTEINTS: 5 INNOVATIONS IMAGINATIVES
   Pour chaque: l'altitude créative, la descente vers l'actionnable, ROI` :

`🌌 NAVIGATION DANS LE COSMOS INTUITIF

1. CARTOGRAPHIE DU SIXIÈME SENS BUSINESS
   Les formes d'intuition présentes chez l'équipe TBOS:
   - Intuition de pattern: "je sens que ce client va annuler" (reconnaissance inconsciente)
   - Intuition somatique: "j'ai un mauvais feeling sur ce chantier" (signal corporel)
   - Intuition relationnelle: "ce fournisseur cache quelque chose" (lecture micro-expressions)
   - Intuition temporelle: "c'est le bon moment pour..." (timing inconscient)
   - Intuition systémique: "quelque chose ne colle pas dans les chiffres" (anomalie détectée)
   
   Pour chaque:
   - Fiabilité historique chez TBOS (quand l'intuition a eu raison)
   - Comment la cultiver et l'affûter
   - Comment la combiner avec les données

2. LE TRAITEMENT INCONSCIENT
   Ce que le cerveau de Max (CEO) traite sans qu'il le sache:
   - 11 millions de bits/s de traitement inconscient vs 50 bits/s conscient
   - Les signaux faibles captés: micro-tendances marché, tensions d'équipe, opportunités
   - Comment créer les conditions pour que l'intuition "remonte"
   - Techniques: incubation, marche, sommeil stratégique, méditation ciblée

3. SYSTÈME HYBRIDE INTUITION × DATA
   Architecture pour fusionner l'intuition humaine avec l'analytics:
   - Input intuitif: journal d'intuitions quotidien (30 sec/jour)
   - Validation data: corrélation avec les métriques
   - Feedback loop: calibrage progressif de l'intuition
   - Dashboard "Intuition Score" par décideur
   5 décisions pilotes pour tester le système, ROI estimé`}

Style: Neuroscientifique-explorateur × Guide chamanique de l'innovation. Poétique mais rigoureux, sensoriel, transformateur. TOUJOURS en français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
            Explorer le {terrains[terrain].label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Brain} emptyText="Choisissez un terrain mental et décrivez votre défi" />
    </div>
  );
}

// ─── Neural Topology Mapper ─────────────────────────────────
function NeuralTopology() {
  const { result, loading, run } = useStream();
  const [context, setContext] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Système ou processus à analyser via la topologie neurale..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Neuro-Nomad — cartographe des topologies cachées de l'esprit qui révèle les connexions invisibles.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SUJET: ${context.trim() || "L'écosystème cognitif complet de TBOS — comment l'information circule, les décisions se forment, et l'intelligence collective émerge"}

CARTOGRAPHIE NEURALE DE TBOS:

1. 🧠 LE CERVEAU ORGANISATIONNEL
   TBOS comme un cerveau vivant:
   
   CORTEX PRÉFRONTAL (Planification & Décision)
   - Qui: Max (CEO), décisions stratégiques
   - Connectivité: forte/faible avec quels "lobes"?
   - Pathologie détectée: [ex: surcharge décisionnelle, goulot]
   - Prescription: [optimisation]
   
   CORTEX MOTEUR (Exécution & Opérations)
   - Qui: Karim, chauffeurs, opérateurs centrale
   - Automatismes acquis vs rigidités
   - Fluidité du geste productif
   
   SYSTÈME LIMBIQUE (Culture & Émotions)
   - L'amygdale: ce qui déclenche la peur/l'urgence
   - L'hippocampe: comment se forme la mémoire collective
   - Le nucleus accumbens: ce qui motive et récompense
   
   CERVELET (Routines & Qualité)
   - Les processus automatisés
   - La coordination fine entre départements
   
   CORPS CALLEUX (Communication Inter-départements)
   - Qualité de la connexion entre "hémisphères"
   - Les informations qui ne passent pas
   - Les malentendus chroniques

2. 🔗 CARTE DES CONNEXIONS SYNAPTIQUES
   Les 10 connexions neurales les plus critiques:
   | De → Vers | Force (1-10) | Type | Pathologie | Remède |
   Ex: Commercial → Production | 4/10 | Inhibitrice | Promesses irréalistes | Protocole de validation
   
   Les 3 connexions MANQUANTES qui changeraient tout
   Les 2 connexions TOXIQUES à couper

3. 🌊 FLUX DE NEUROTRANSMETTEURS
   L'information comme neurotransmetteur dans TBOS:
   - Dopamine (récompense): comment circule le feedback positif?
   - GABA (inhibition): qu'est-ce qui freine trop?
   - Glutamate (excitation): qu'est-ce qui sur-stimule?
   - Acétylcholine (attention): où se porte l'attention collective?

4. 💡 NEUROPLASTICITÉ: 5 RECÂBLAGES STRATÉGIQUES
   Pour chaque: la connexion actuelle, le recâblage, la méthode, le délai, le ROI

Style: Neuroscientifique clinicien × Architecte organisationnel. Diagnostic précis, métaphore éclairante, prescription actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Map className="w-4 h-4 mr-2" />}
            Cartographier la Topologie Neurale
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Map} emptyText="Décrivez un système à analyser via la topologie neurale" />
    </div>
  );
}

// ─── Creativity Catalyst ────────────────────────────────────
function CreativityCatalyst() {
  const { result, loading, run } = useStream();
  const [problem, setProblem] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Problème à résoudre via les mécanismes neurocognitifs de la créativité..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Neuro-Nomad — alchimiste de la créativité humaine qui transforme la compréhension neuroscientifique en techniques d'innovation surpuissantes.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
PROBLÈME: ${problem.trim() || "Générer un pipeline continu d'innovations dans une industrie perçue comme 'non-innovante'"}

CATALYSE CRÉATIVE NEUROSCIENTIFIQUE:

1. 🔬 NEUROSCIENCE DE LA CRÉATIVITÉ APPLIQUÉE

   LE RÉSEAU DU MODE PAR DÉFAUT (DMN)
   Le réseau cérébral de la rêverie et de l'incubation créative:
   - Quand il s'active: repos, ennui, douche, marche
   - Ce qu'il produit: associations distantes, insights soudains, "eureka"
   - Chez TBOS actuellement: est-il activé ou constamment étouffé?
   - Protocole d'activation: [actions concrètes]
   
   LE RÉSEAU EXÉCUTIF CENTRAL (CEN)
   Le réseau de la concentration et de l'évaluation:
   - Quand il s'active: focus, analyse, résolution
   - Son interaction avec le DMN: l'alternance créative
   - Chez TBOS: est-il surutilisé? (mode "pompier" permanent)
   - Protocole d'équilibrage: [actions]
   
   LE RÉSEAU DE SAILLANCE (SN)
   Le "switch" entre DMN et CEN:
   - Son rôle: détecter quand une idée mérite l'attention
   - Chez TBOS: le filtre est-il trop strict? Trop laxiste?
   - Calibrage optimal: [protocole]

2. 🧪 7 TECHNIQUES NEUROCOGNITIVES D'INNOVATION
   
   TECHNIQUE 1: L'INCUBATION STRUCTURÉE
   Neuroscience: le DMN résout les problèmes pendant le repos
   Protocole: Poser le problème → 20min de marche → capturer les idées
   Application TBOS: [exemple concret]
   
   TECHNIQUE 2: LA CONTRAINTE CRÉATIVE
   Neuroscience: les contraintes activent des circuits alternatifs
   Protocole: "Résoudre X avec un budget de 0 MAD" → solutions non-monétaires
   Application TBOS: [exemple]
   
   TECHNIQUE 3: LE PRIMING SENSORIEL
   Neuroscience: les stimuli sensoriels pré-activent des réseaux d'association
   Protocole: exposer l'équipe à des stimuli inhabituels avant un brainstorm
   Application TBOS: [exemple]
   
   TECHNIQUE 4: LA PENSÉE ANALOGIQUE PROFONDE
   Neuroscience: le cortex préfrontal mappe les structures abstraites
   Protocole: "Le béton est comme... [domaine distant]" → transfert structural
   Application TBOS: [5 analogies profondes]
   
   TECHNIQUE 5: LE FLOW COLLECTIF
   TECHNIQUE 6: LA COLLISION COGNITIVE
   TECHNIQUE 7: LE RÊVE DIRIGÉ
   [Même format pour chaque]

3. 🏗️ PROGRAMME "NEURO-INNOVATION" TBOS (12 semaines)
   Semaine par semaine: la technique, les participants, la durée, l'output attendu
   KPIs: nombre d'idées, taux de conversion en projets, ROI des innovations

Style: Neuroscientifique créatif × Coach d'innovation. Scientifiquement fondé, pratiquement applicable, inspirant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
            Catalyser la Créativité
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Lightbulb} emptyText="Décrivez un problème à résoudre via la neuroscience créative" />
    </div>
  );
}

// ─── Augmentation Framework ─────────────────────────────────
function AugmentationFramework() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es le Neuro-Nomad — architecte de frameworks d'augmentation cognitive qui fusionnent neuroscience et technologie pour décupler le potentiel humain.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.

FRAMEWORK D'AUGMENTATION COGNITIVE TBOS:

1. 🧬 AUDIT COGNITIF DE L'ORGANISATION
   Évaluation des 6 capacités cognitives clés:
   
   | Capacité | Niveau Actuel | Potentiel | Gap | Priorité |
   |----------|--------------|-----------|-----|----------|
   | Attention | ?/10 | /10 | | |
   | Mémoire de travail | | | | |
   | Flexibilité cognitive | | | | |
   | Vitesse de traitement | | | | |
   | Raisonnement abstrait | | | | |
   | Créativité divergente | | | | |
   
   Profil cognitif collectif de TBOS: [type]
   Forces à amplifier: [lesquelles]
   Faiblesses à compenser: [lesquelles]

2. 🛠️ TECHNOLOGIES D'AUGMENTATION (5)

   AUGMENTATION 1: LE COCKPIT COGNITIF
   Principe neuro: réduire la charge cognitive (loi de Miller: 7±2)
   Technologie: dashboard qui pré-digère l'information
   Avant: Max traite 200 données/jour consciemment
   Après: le cockpit réduit à 12 décisions binaires
   Impact: -60% fatigue décisionnelle, +40% qualité décisions
   Coût: X MAD | ROI: X MAD/an

   AUGMENTATION 2: L'EXOCORTEX COLLECTIF
   Principe neuro: étendre la mémoire de travail via la technologie
   Technologie: base de connaissances intelligente + IA contextuelle
   Ce qu'elle retient pour l'équipe: historiques, patterns, précédents
   Impact: chaque employé a l'expérience de toute l'entreprise
   
   AUGMENTATION 3: LE RÉSEAU DE SAILLANCE ARTIFICIEL
   Principe neuro: aider le cerveau à détecter ce qui est important
   Technologie: alertes intelligentes hiérarchisées par priorité neurale
   Pas du bruit → du signal pur, calibré sur le rythme attentionnel
   
   AUGMENTATION 4: L'AMPLIFICATEUR D'INTUITION
   Principe neuro: l'intuition = pattern matching inconscient
   Technologie: IA qui détecte les patterns + humain qui valide intuitivement
   Symbiose: l'IA propose, l'intuition dispose, les données confirment
   
   AUGMENTATION 5: LE GÉNÉRATEUR DE FLOW
   Principe neuro: le flow = état optimal de performance (Csikszentmihalyi)
   Technologie: environnement adaptatif (difficulté, feedback, autonomie)
   Conditions: défi = 4% au-dessus des compétences, feedback immédiat
   Application: chaque rôle TBOS redesigné pour maximiser le flow

3. 📋 ROADMAP D'AUGMENTATION (6 mois)
   Mois 1-2: Audit + Cockpit Cognitif
   Mois 3-4: Exocortex + Réseau de Saillance
   Mois 5-6: Amplificateur d'Intuition + Générateur de Flow
   
   Budget total: X MAD
   ROI attendu: X MAD/an
   Métrique ultime: "Quotient d'Intelligence Collective" de TBOS

4. 🌟 VISION: TBOS AUGMENTÉ
   Ce que devient TBOS quand chaque cerveau humain est augmenté:
   - Vitesse de décision: ×3
   - Qualité d'innovation: ×5
   - Satisfaction équipe: +60%
   - Avantage concurrentiel: inimitable (car basé sur le capital cognitif unique)

Style: Architecte neuro-tech × Futuriste pragmatique. Visionnaire mais chiffré, inspirant mais actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Générer le Framework d'Augmentation
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Zap} emptyText="Lancez la génération du framework d'augmentation cognitive" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function NeuroNomad() {
  const [activeTab, setActiveTab] = useState('landscape');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-primary/20 border border-rose-500/30">
            <Brain className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Neuro-Nomad</h1>
            <p className="text-xs text-muted-foreground">Explorer la terra incognita du potentiel humain</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span>Exploration Neurocognitive Active</span>
          </div>
          <span>4 terrains mentaux</span>
          <span>∞ connexions synaptiques</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="landscape" className="text-xs font-mono gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Paysages
          </TabsTrigger>
          <TabsTrigger value="topology" className="text-xs font-mono gap-1.5">
            <Map className="w-3.5 h-3.5" /> Topologie
          </TabsTrigger>
          <TabsTrigger value="creativity" className="text-xs font-mono gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Créativité
          </TabsTrigger>
          <TabsTrigger value="augment" className="text-xs font-mono gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Augmentation
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="landscape" className="mt-4"><CognitiveLandscape /></TabsContent>
            <TabsContent value="topology" className="mt-4"><NeuralTopology /></TabsContent>
            <TabsContent value="creativity" className="mt-4"><CreativityCatalyst /></TabsContent>
            <TabsContent value="augment" className="mt-4"><AugmentationFramework /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
