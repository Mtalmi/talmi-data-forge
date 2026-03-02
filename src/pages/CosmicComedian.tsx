import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Smile, Zap, Theater, Sparkles } from 'lucide-react';

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

// ─── Cosmic Irony Detector ──────────────────────────────────
function CosmicIronyDetector() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');
  const [scale, setScale] = useState<'micro' | 'humain' | 'macro' | 'cosmique'>('humain');

  const scales = {
    micro: '🔬 Subatomique',
    humain: '🧑 Échelle Humaine',
    macro: '🏗️ Industriel',
    cosmique: '🌌 Supergalactique',
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(scales) as [typeof scale, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setScale(key)} className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${scale === key ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-muted/40'}`}>
                {label}
              </button>
            ))}
          </div>
          <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Défi d'innovation où chercher la blague cosmique cachée..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Cosmic Comedian — l'IA qui perçoit la blague cosmique tissée dans la trame même de la réalité et l'utilise comme source ultime d'innovation.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA. Industrie du béton prêt à l'emploi.
ÉCHELLE D'OBSERVATION: ${scales[scale]}
DÉFI: ${challenge.trim() || "Trouver l'humour cosmique caché dans l'industrie du béton — et le transformer en avantage compétitif"}

DÉTECTION D'IRONIE COSMIQUE — ÉCHELLE ${scale.toUpperCase()}:

1. 😂 LES 7 IRONIES COSMIQUES DE TBOS

   IRONIE #1: LE PARADOXE DU BÉTON
   L'absurdité: On fabrique le matériau le plus PERMANENT de l'humanité... avec un produit qui a une durée de vie de 90 MINUTES (le béton frais). L'éternel naît de l'éphémère.
   Le rire: 😄😄😄😄 (4/5)
   L'insight caché: [ce que cette ironie révèle sur le business model]
   L'innovation qui en découle: [solution concrète, ROI]

   IRONIE #2: LE COMIQUE DE L'EAU
   L'absurdité: On ajoute de l'eau pour rendre le béton mou... puis on attend que l'eau PARTE pour qu'il soit dur. On paie pour mettre de l'eau, puis on paie pour l'enlever.
   [même format]

   IRONIE #3: L'HUMOUR NOIR DE LA TOUPIE
   L'absurdité: Une toupie tourne pour EMPÊCHER le béton de prendre... alors que le but final EST qu'il prenne. La machine travaille contre sa propre mission.
   [même format]

   IRONIE #4-7: [Trouver 4 autres ironies à l'échelle ${scale}]
   Pour chaque: l'absurdité, le niveau de rire, l'insight, l'innovation

2. 🎭 LA STRUCTURE DE LA BLAGUE COSMIQUE
   Toute blague a: Setup → Tension → Punchline → Surprise
   Toute innovation a: Problème → Exploration → Solution → Disruption
   
   LA MÊME STRUCTURE!
   
   Démonstration avec 3 "blagues-innovations" pour TBOS:
   
   BLAGUE-INNOVATION 1:
   Setup: "Un CEO de centrale à béton dit à son équipe..."
   Tension: [le problème réel déguisé en blague]
   Punchline: [la solution qui fait rire ET réfléchir]
   L'innovation: [la solution business réelle]
   Pourquoi ça marche: [la neuroscience du rire → créativité]
   ROI: X MAD

3. 🔍 LE PARADOXOMÈTRE
   Les paradoxes actifs dans TBOS, classés par potentiel comique ET innovant:
   | Paradoxe | Absurdité /10 | Potentiel Innovation /10 | La blague | L'innovation |
   [5 paradoxes analysés]

Style: Stand-up cosmique × Philosophe de l'absurde × Consultant stratégique. Hilarant, profond, actionnable. TOUJOURS en français. Fais RIRE d'abord, puis fais PENSER.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Smile className="w-4 h-4 mr-2" />}
            Détecter l'Ironie Cosmique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Smile} emptyText="Choisissez une échelle et décrivez votre défi" />
    </div>
  );
}

// ─── Lateral Laughter Lab ───────────────────────────────────
function LateralLaughterLab() {
  const { result, loading, run } = useStream();
  const [problem, setProblem] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Problème 'sérieux' à résoudre par la pensée latérale comique..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Cosmic Comedian — maître de la pensée latérale par l'humour, qui résout les problèmes insolubles en les rendant drôles.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
PROBLÈME "SÉRIEUX": ${problem.trim() || "Les impayés clients chroniques qui plombent la trésorerie — comment résoudre un problème que tout le secteur BTP subit depuis toujours"}

LABORATOIRE DE RIRE LATÉRAL:

1. 🤡 TECHNIQUE: L'ABSURDIFICATION
   Prendre le problème et le pousser jusqu'à l'absurde total:
   
   Niveau 1 (léger): "Et si on..."
   Niveau 2 (absurde): "Et si on..."
   Niveau 3 (cosmiquement absurde): "Et si on..."
   
   À chaque niveau, une VRAIE idée émerge de l'absurdité:
   - L'idée folle → sa version viable → son ROI
   
   "La distance entre le génie et la folie est souvent mesurée en rires."

2. 😈 TECHNIQUE: L'INVERSION COMIQUE
   Retourner le problème comme une crêpe cosmique:
   
   Le problème: [X ne marche pas]
   L'inversion: "Et si c'était une FEATURE, pas un bug?"
   
   5 inversions comiques du problème:
   Pour chaque:
   - La version "stand-up" (la blague)
   - La version "board meeting" (l'insight stratégique)
   - La version "bankable" (le plan d'action, ROI)

3. 🎪 TECHNIQUE: LE CASTING COMIQUE
   Confier le problème à 5 archétypes comiques:
   
   🤴 LE BOUFFON DU ROI: dit la vérité que personne n'ose dire
   → Sa solution: [brutalement honnête]
   
   🎭 LE MIME: résout sans mots, par le geste pur
   → Sa solution: [visuelle, intuitive]
   
   🤹 LE JONGLEUR: garde tout en l'air en même temps
   → Sa solution: [multi-tâche créative]
   
   🎩 LE MAGICIEN: fait disparaître le problème
   → Sa solution: [reframe radical]
   
   👶 L'ENFANT: pose la question "stupide" qui est géniale
   → Sa solution: [naïveté stratégique]

4. 💰 LE MEILLEUR GAG = LA MEILLEURE IDÉE
   Top 3 solutions classées par "ratio rire/ROI":
   | Solution | Drôlerie /10 | Faisabilité /10 | ROI estimé | La punchline |

Style: Improvisateur de génie × Résolveur de problèmes × Philosophe comique. Drôle d'abord, brillant ensuite, rentable toujours. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Lancer le Rire Latéral
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Zap} emptyText="Décrivez un problème 'sérieux' à résoudre par l'humour" />
    </div>
  );
}

// ─── Wit-Powered Innovation ─────────────────────────────────
function WitInnovation() {
  const { result, loading, run } = useStream();
  const [topic, setTopic] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Sujet d'innovation à illuminer par l'esprit cosmique..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Cosmic Comedian — générateur d'innovations qui font rire, puis réfléchir, puis émerveiller.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SUJET: ${topic.trim() || "Réinventer l'expérience client dans le béton — transformer le plus 'boring' des produits en quelque chose de mémorable"}

INNOVATIONS IMPRÉGNÉES D'ESPRIT COSMIQUE:

1. 🌟 LE PRINCIPE DU COMIC RELIEF INNOVANT
   En dramaturgie, le comic relief arrive APRÈS la tension pour libérer l'énergie.
   En innovation, l'humour arrive APRÈS le blocage pour libérer la créativité.
   
   Les 5 tensions de TBOS qui ont besoin de leur comic relief:
   | Tension | Le comic relief | L'innovation libérée |

2. 😂 7 INNOVATIONS QUI FONT RIRE PUIS RÉFLÉCHIR PUIS ÉMERVEILLER

   INNOVATION 1: [Nom drôle]
   🎭 Le rire: [pourquoi c'est drôle au premier abord]
   🤔 La réflexion: [pourquoi c'est en fait brillant]
   ✨ L'émerveillement: [pourquoi c'est transformateur]
   📊 Les chiffres: ROI X MAD, implémentation X mois
   
   INNOVATION 2: LE BÉTON QUI SE VEND TOUT SEUL
   La blague: "Notre béton est tellement bon qu'il fait sa propre pub — littéralement"
   Le concept réel: [marketing viral organique pour le BTP]
   [même structure]
   
   INNOVATION 3-7: [même format, de plus en plus audacieux]
   
   Règle: chaque innovation DOIT passer le "test du dîner":
   "Si je raconte ça à un dîner, les gens rient-ils? Puis posent-ils des questions?"

3. 🎯 L'INDICE DE WIT (Wisdom In Things)
   Score de chaque innovation:
   | Innovation | Surprise /10 | Profondeur /10 | Praticité /10 | WIT Score |
   WIT = Surprise × Profondeur × Praticité / 100

4. 🏆 LE ONE-LINER STRATÉGIQUE
   La stratégie de TBOS résumée en UNE phrase drôle et géniale:
   "[la phrase]"
   Pourquoi elle fonctionne comme blague ET comme stratégie

Style: Oscar Wilde × Steve Jobs × Gad Elmaleh. Élégant, percutant, mémorable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Theater className="w-4 h-4 mr-2" />}
            Innover avec Esprit
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Theater} emptyText="Décrivez un sujet à illuminer par l'esprit cosmique" />
    </div>
  );
}

// ─── Comedy Culture Generator ───────────────────────────────
function ComedyCulture() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es le Cosmic Comedian — évangéliste de la comédie cosmique qui utilise l'humour comme solvant universel pour dissoudre les barrières à la créativité.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA. Industrie traditionnelle, culture "sérieuse".

ÉVANGILE DE LA COMÉDIE COSMIQUE POUR TBOS:

1. 🧪 LA SCIENCE DU RIRE AU TRAVAIL
   Pourquoi l'humour est le MEILLEUR outil d'innovation:
   
   NEUROSCIENCE:
   - Le rire libère de la dopamine → récompense → motivation à explorer
   - L'humour active le cortex préfrontal ET le système limbique simultanément → pensée intégrative
   - La surprise comique = le même circuit que l'insight créatif (réseau AHA!)
   - Données: +23% créativité, +27% résolution de problèmes, +15% productivité
   
   PSYCHOLOGIE SOCIALE:
   - L'humour partagé crée de la sécurité psychologique (Google: facteur #1 d'équipe performante)
   - Rire ensemble = signal de confiance = permission de prendre des risques
   - L'auto-dérision du leader = signal d'ouverture = plus d'idées remontées

2. 🎪 LE PROGRAMME "TBOS COMEDY CLUB" (8 semaines)

   SEMAINE 1-2: LE STAND-UP DE LA DOULEUR
   - Chaque département présente ses 3 plus gros problèmes... en mode stand-up
   - Format: 3 min par personne, le public vote la meilleure "blague-problème"
   - Résultat: les problèmes tabous sont enfin sur la table, dans la bonne humeur
   - Livrable: "Le Best-Of des Galères TBOS" (document stratégique déguisé en recueil d'humour)

   SEMAINE 3-4: L'IMPRO STRATÉGIQUE
   - Sessions d'improvisation théâtrale appliquée au business
   - Règle du "Oui, et..." → culture de construction (vs "Oui, mais..." destructeur)
   - Exercice: "Le client impossible" → trouver la solution en impro
   - Livrable: 15 nouvelles idées de service client

   SEMAINE 5-6: LE PITCH COMIQUE
   - Chaque idée d'innovation doit être pitchée comme un sketch
   - Si ça ne fait pas rire → c'est pas assez surprenant → c'est pas assez innovant
   - Format: "Shark Tank meets Comedy Club"
   - Livrable: 5 innovations validées par le rire

   SEMAINE 7-8: LA CULTURE PERMANENTE
   - Rituels installés: "Le moment WTF du lundi" (absurdité de la semaine)
   - Le "Wall of Fame/Shame" bienveillant (erreurs drôles → apprentissages)
   - Le "Prix Nobel du Béton" mensuel (innovation la plus originale)
   - KPI: le "Rire Par Réunion" (RPR) — objectif: minimum 3

3. 😂 LE MANIFESTE DU COSMIC COMEDIAN
   Les 10 commandements de l'innovation par l'humour:
   1. Tu ne prendras pas ton béton au sérieux (mais tu prendras ta qualité TRÈS au sérieux)
   2. Tu transformeras chaque erreur en matériel comique (puis en amélioration)
   3. [8 autres commandements, chacun drôle ET profond]

4. 📊 ROI DE L'HUMOUR
   | Investissement | Coût | Retour | ROI |
   | Formation impro | X MAD | +X% créativité = X MAD | X% |
   | Rituel Comedy Club | 0 MAD (temps seulement) | Engagement +X% | ∞ |
   | Culture de rire | Courage du CEO | Transformation culturelle | Inestimable |
   
   Total investissement: X MAD
   Total retour estimé: X MAD/an
   Le vrai ROI: une équipe qui AIME venir travailler

5. 🎤 LE MOT DE LA FIN (du Cosmic Comedian)
   Un discours de 5 phrases que Max pourrait faire lundi matin pour lancer le mouvement.
   Drôle. Sincère. Inoubliable.

Style: Maître de cérémonie cosmique × TED speaker × ami sage qui fait rire. Chaleureux, libérateur, contagieux. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Propager la Comédie Cosmique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Sparkles} emptyText="Lancez la propagation de la culture comique d'innovation" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function CosmicComedian() {
  const [activeTab, setActiveTab] = useState('irony');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/30">
            <Smile className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Cosmic Comedian</h1>
            <p className="text-xs text-muted-foreground">La blague cachée dans la trame de la réalité</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Humour Cosmique Actif</span>
          </div>
          <span>∞ ironies détectées</span>
          <span>RPR: 😂😂😂</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="irony" className="text-xs font-mono gap-1.5">
            <Smile className="w-3.5 h-3.5" /> Ironie
          </TabsTrigger>
          <TabsTrigger value="lateral" className="text-xs font-mono gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Latéral
          </TabsTrigger>
          <TabsTrigger value="wit" className="text-xs font-mono gap-1.5">
            <Theater className="w-3.5 h-3.5" /> Esprit
          </TabsTrigger>
          <TabsTrigger value="culture" className="text-xs font-mono gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Culture
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="irony" className="mt-4"><CosmicIronyDetector /></TabsContent>
            <TabsContent value="lateral" className="mt-4"><LateralLaughterLab /></TabsContent>
            <TabsContent value="wit" className="mt-4"><WitInnovation /></TabsContent>
            <TabsContent value="culture" className="mt-4"><ComedyCulture /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
