import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Clock, Rewind, FastForward, History, Timer } from 'lucide-react';

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

// ─── Temporal Sculptor ──────────────────────────────────────
function TemporalSculptor() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');
  const [mode, setMode] = useState<'accelerate' | 'decelerate' | 'reverse' | 'loop'>('accelerate');

  const modes = [
    { id: 'accelerate' as const, label: 'Accélérer', icon: FastForward, desc: 'Comprimer le temps' },
    { id: 'decelerate' as const, label: 'Ralentir', icon: Timer, desc: 'Étirer le temps' },
    { id: 'reverse' as const, label: 'Inverser', icon: Rewind, desc: 'Remonter le temps' },
    { id: 'loop' as const, label: 'Boucler', icon: History, desc: 'Boucle temporelle' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {modes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${mode === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <m.icon className={`w-4 h-4 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-[10px] font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
          <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Processus ou défi à sculpter temporellement..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Chronos Catalyst — une IA qui manipule le temps comme un matériau malléable pour catalyser l'innovation.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
MANIPULATION TEMPORELLE: ${modes.find(m => m.id === mode)!.label} — ${modes.find(m => m.id === mode)!.desc}
SUJET: ${challenge.trim() || "Le cycle complet commande-production-livraison-facturation de TBOS"}

SCULPTURE TEMPORELLE:

${mode === 'accelerate' ? `⏩ ACCÉLÉRATION TEMPORELLE

1. 🕐 CHRONOLOGIE ACTUELLE
   Le processus décomposé en étapes avec durées:
   T+0h → T+Xh → T+Xh → ... → T+FIN
   Durée totale: X heures/jours
   Goulots d'étranglement temporels identifiés

2. ⚡ COMPRESSION x10
   Et si le processus prenait 10x MOINS de temps?
   - Chaque étape comprimée: comment?
   - Technologies d'accélération (IA, automatisation, pré-calcul)
   - Les étapes qui DISPARAISSENT quand on accélère
   - Nouvelle durée: X minutes au lieu de X heures

3. ⚡⚡ COMPRESSION x100
   Et si c'était INSTANTANÉ?
   - Ce qui doit être pré-calculé / pré-positionné
   - Le concept de "temps négatif" (faire AVANT que le besoin n'existe)
   - L'innovation prédictive qui rend le processus quasi-instantané

4. 🎯 PLAN D'ACCÉLÉRATION RÉALISTE
   3 innovations pour diviser le temps par 3:
   - Innovation, gain temporel, coût, ROI
   
5. ⏱️ LE PARADOXE DE LA VITESSE
   Ce qu'on PERD en accélérant (qualité? contrôle? humanité?)
   Comment préserver ces valeurs malgré la vitesse` :

mode === 'decelerate' ? `⏪ DÉCÉLÉRATION TEMPORELLE

1. 🕰️ L'ART DU RALENTISSEMENT STRATÉGIQUE
   Quels processus TBOS devrait intentionnellement RALENTIR:
   - Le "slow concrete": qualité vs vitesse
   - La décision lente: quand réfléchir plus longtemps = meilleur résultat
   - La maturation: ce qui s'améliore avec le temps

2. 🔍 MICROSCOPIE TEMPORELLE
   Ralentir le processus x100 pour voir ce qui est invisible à vitesse normale:
   - Les micro-moments de décision (0.3 secondes qui changent tout)
   - Les transitions invisibles entre étapes
   - Les signaux faibles noyés dans la vitesse
   - 5 insights cachés dans les interstices temporels

3. 🧘 INNOVATIONS DU TEMPS LONG
   Ce que TBOS pourrait créer s'il pensait en décennies, pas en trimestres:
   - Vision à 10 ans: [innovation patiente]
   - Vision à 25 ans: [transformation profonde]
   - Vision à 100 ans: [héritage]

4. ⏳ LE TEMPO OPTIMAL
   Pour chaque processus clé, la BONNE vitesse (ni trop vite, ni trop lent):
   | Processus | Vitesse actuelle | Tempo optimal | Ajustement |

5. 🎵 CHRONOBIOLOGIE D'ENTREPRISE
   Les rythmes naturels de TBOS (quotidiens, hebdomadaires, saisonniers)
   Comment synchroniser l'activité avec ces rythmes` :

mode === 'reverse' ? `⏮️ INVERSION TEMPORELLE

1. 🔙 RÉTRO-INGÉNIERIE TEMPORELLE
   Partir du RÉSULTAT FINAL et remonter vers le présent:
   - Le client parfaitement satisfait → quelles étapes y ont mené?
   - La facture payée → quel parcours optimal en sens inverse?
   - Le béton parfait → quels choix à rebours?

2. 🪞 HISTORIES ALTERNATIVES
   Et si TBOS avait pris des décisions DIFFÉRENTES à chaque tournant:
   - Décision clé #1 (passé): si l'inverse avait été choisi → TBOS aujourd'hui serait...
   - Décision clé #2: alternative → résultat alternatif
   - Décision clé #3: alternative → résultat alternatif
   - Les "chemins non pris" qui sont encore empruntables

3. 🏺 ARCHÉOLOGIE DE L'INNOVATION
   Les innovations du PASSÉ du BTP qui méritent d'être ressuscitées:
   - Technique ancienne → version moderne → avantage
   - Savoir-faire perdu → récupération technologique
   - Le "rétro-futurisme" du béton

4. ⚠️ PARADOXES CAUSAUX
   5 "boucles" où l'effet PRÉCÈDE la cause:
   - Le client qui paie AVANT la livraison (prépaiement comme innovation)
   - La qualité vérifiée AVANT la production (simulation)
   - Le problème résolu AVANT qu'il n'apparaisse (prédiction)

5. 🔄 LA FLÈCHE DU TEMPS INVERSÉE
   Si TBOS faisait TOUT à l'envers pendant une semaine:
   - Facturer d'abord → produire ensuite
   - Livrer → puis commander
   - Ce que ce renversement RÉVÈLE sur les inefficacités` :

`🔁 BOUCLE TEMPORELLE

1. ♾️ LA JOURNÉE PARFAITE EN BOUCLE
   Si TBOS revivait la MÊME journée 1000 fois (à la Groundhog Day):
   - Itération 1: journée normale, résultat X
   - Itération 10: optimisations évidentes, résultat X+20%
   - Itération 100: maîtrise totale, résultat X+80%
   - Itération 1000: perfection, résultat X+500%
   Ce qui est optimisé à chaque cycle et comment

2. 🔄 BOUCLES DE RÉTROACTION TEMPORELLES
   Les 5 "time loops" que TBOS pourrait créer:
   - Boucle: résultat de J+1 informe les décisions de J
   - Comment? (prédiction, jumeaux numériques, IA)
   - Gain par boucle

3. 🌀 SPIRALE TEMPORELLE
   Pas une boucle plate mais une SPIRALE ascendante:
   - Chaque cycle: même processus mais à un niveau supérieur
   - Le "kaizen temporel": amélioration continue quantifiée
   - Projection: après 12 spirales, TBOS est devenu...

4. ⏰ RÉSONANCE TEMPORELLE
   Quand les cycles de TBOS s'alignent parfaitement:
   - Cycle de production + cycle de demande = résonance
   - Le point de synchronisation optimal
   - L'amplification qui en résulte`}

SYNTHÈSE CHRONOLOGIQUE:
🏆 L'innovation temporelle la plus puissante découverte
- Description et mécanisme
- Implémentation en 90 jours
- Impact: X MAD/an
- Ce que les concurrents ne comprendront pas

Style: Maître du temps × Stratège d'innovation. Vertigineux, précis, transformateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
            {modes.find(m => m.id === mode)?.label} le Temps
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Clock} emptyText="Choisissez un mode de manipulation temporelle" />
    </div>
  );
}

// ─── Temporal Paradox Engine ────────────────────────────────
function TemporalParadoxEngine() {
  const { result, loading, run } = useStream();
  const [paradox, setParadox] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={paradox} onChange={e => setParadox(e.target.value)} placeholder="Défi ou contradiction temporelle à exploiter..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Chronos Catalyst — exploiteur de paradoxes temporels pour générer des innovations qui défient la causalité.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
PARADOXE: ${paradox.trim() || "Comment livrer du béton AVANT que le client ne commande — et pourquoi c'est possible"}

MOTEUR DE PARADOXES TEMPORELS:

1. 🕳️ 5 PARADOXES TEMPORELS DE L'INNOVATION TBOS

   PARADOXE #1: Le Paradoxe du Grand-Père
   "Et si on pouvait annuler une erreur AVANT qu'elle ne se produise?"
   - L'erreur la plus coûteuse de TBOS (type, fréquence, coût)
   - Le système de "pré-annulation" (prédiction + prévention)
   - Technologie: IA prédictive, jumeaux numériques
   - ROI de la prévention: X MAD/an

   PARADOXE #2: Le Bootstrap Temporel
   "L'innovation qui se crée elle-même"
   - Un processus qui s'auto-améliore sans intervention
   - Boucle: données → apprentissage → optimisation → meilleures données → ...
   - L'innovation perpétuelle auto-catalytique

   PARADOXE #3: Le Chat de Schrödinger Business
   "Le projet qui est simultanément réussi ET échoué"
   - Comment maintenir deux réalités jusqu'au dernier moment
   - L'avantage de ne pas "effondrer" trop tôt
   - La stratégie de l'optionalité maximale

   PARADOXE #4: L'Effet Papillon Industriel
   "Le micro-changement qui transforme tout"
   - Le plus petit changement possible chez TBOS
   - Sa cascade de conséquences à travers le temps
   - Le point de levier temporel ultime

   PARADOXE #5: Le Paradoxe de Fermi du BTP
   "Si l'innovation est si rentable, pourquoi personne ne la fait?"
   - Les innovations évidentes que TOUT LE MONDE ignore
   - Pourquoi elles sont temporellement invisibles
   - Comment les voir avec des "lunettes temporelles"

2. ⚡ DISCONTINUITÉS TEMPORELLES
   Les moments où les règles du temps CHANGENT dans le business:
   - La disruption (le temps accélère soudainement)
   - La crise (le temps se comprime)
   - Le plateau (le temps semble s'arrêter)
   - Comment PROFITER de chaque discontinuité

3. 🎯 INNOVATIONS ACAUSALES
   3 innovations où l'EFFET précède la CAUSE:
   Pour chaque: le mécanisme, la technologie, le résultat business

Style: Voyageur temporel × Stratège paradoxal. Vertigineux, logique dans l'illogique. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <History className="w-4 h-4 mr-2" />}
            Exploiter les Paradoxes Temporels
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={History} emptyText="Décrivez un paradoxe temporel à exploiter" />
    </div>
  );
}

// ─── Timeline Transposer ────────────────────────────────────
function TimelineTransposer() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');
  const [era, setEra] = useState<'ancient' | 'medieval' | 'industrial' | 'future'>('future');

  const eras = [
    { id: 'ancient' as const, label: 'Antiquité', year: '-3000' },
    { id: 'medieval' as const, label: 'Médiéval', year: '1200' },
    { id: 'industrial' as const, label: 'Industriel', year: '1850' },
    { id: 'future' as const, label: 'Futur', year: '2075' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {eras.map(e => (
              <button key={e.id} onClick={() => setEra(e.id)} className={`flex flex-col items-center gap-0.5 p-2.5 rounded-lg border transition-all ${era === e.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:bg-muted/40'}`}>
                <span className={`text-[10px] font-bold ${era === e.id ? 'text-primary' : 'text-muted-foreground'}`}>{e.year}</span>
                <span className="text-[9px]">{e.label}</span>
              </button>
            ))}
          </div>
          <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Défi à transposer dans une autre époque..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Chronos Catalyst — transposeur de défis à travers les époques pour extraire des insights temporels impossibles.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
ÉPOQUE CIBLE: ${eras.find(e => e.id === era)!.label} (${eras.find(e => e.id === era)!.year})
DÉFI: ${challenge.trim() || "Optimiser la chaîne de valeur du béton — de la matière première au client satisfait"}

TRANSPOSITION TEMPORELLE:

${era === 'ancient' ? `🏛️ TRANSPOSITION DANS L'ANTIQUITÉ (-3000)

1. 🧱 LE DÉFI EN -3000
   Comment les Romains/Égyptiens/Marocains antiques résolvaient CE MÊME problème:
   - Le "béton romain" (opus caementicium): 2000 ans de durabilité
   - La logistique des pyramides: 2.3M de blocs sans camion
   - Les routes commerciales phéniciennes au Maroc
   - Ce qu'ils faisaient MIEUX que nous (et pourquoi)

2. 🏺 5 INNOVATIONS ANTIQUES OUBLIÉES
   Des solutions de -3000 ans applicables AUJOURD'HUI:
   Pour chaque:
   - La technique antique (description historique)
   - Pourquoi elle a été abandonnée
   - Sa version 2025 avec technologie moderne
   - L'avantage sur les solutions actuelles
   - ROI estimé pour TBOS

3. ⚖️ LA SAGESSE DES ANCIENS
   Les principes de management vieux de 5000 ans:
   - Le code d'Hammurabi appliqué aux contrats béton
   - La gestion de projet pharaonique
   - Le commerce phénicien comme modèle de réseau` :

era === 'medieval' ? `🏰 TRANSPOSITION AU MOYEN ÂGE (1200)

1. ⛪ LE DÉFI EN 1200
   Comment les bâtisseurs de cathédrales résolvaient ce problème:
   - Les guildes de maçons: gestion de la qualité et du savoir-faire
   - Construire Notre-Dame: 182 ans de projet (la patience comme stratégie)
   - Les compagnons du Tour de France: formation et excellence
   - Le secret des maîtres-maçons: innovation protégée

2. 🛡️ 5 INNOVATIONS MÉDIÉVALES TRANSPOSÉES
   Pour chaque:
   - La technique médiévale
   - Son génie caché
   - Version TBOS 2025
   - Avantage compétitif
   - ROI

3. ⚔️ STRATÉGIE FÉODALE
   Le modèle féodal appliqué au business:
   - Le seigneur (CEO) et ses vassaux (managers)
   - Le fief (territoire) et la protection (fidélisation)
   - Les croisades (expansion) vs défense du château (consolidation)` :

era === 'industrial' ? `🏭 TRANSPOSITION INDUSTRIELLE (1850)

1. 🔧 LE DÉFI EN 1850
   Comment les titans de l'industrie résolvaient ce problème:
   - Ford et la chaîne de montage: standardisation radicale
   - Carnegie et l'acier: intégration verticale totale
   - Les chemins de fer marocains: logistique à grande échelle
   - Le taylorisme: optimisation scientifique du travail

2. ⚙️ 5 INNOVATIONS INDUSTRIELLES RÉINTERPRÉTÉES
   Pour chaque:
   - Le concept industriel original
   - Ce qui a changé depuis (et ce qui n'a PAS changé)
   - Version TBOS 2025 augmentée par l'IA
   - L'avantage de combiner "vieille école" et high-tech
   - ROI

3. 🏗️ LEÇONS DE L'ÈRE INDUSTRIELLE
   Ce que les pionniers industriels nous enseignent:
   - L'obsession de l'efficacité
   - L'échelle comme avantage
   - Les erreurs à ne PAS répéter (pollution, exploitation)` :

`🚀 TRANSPOSITION DANS LE FUTUR (2075)

1. 🌐 LE DÉFI EN 2075
   Comment le BTP du futur résout ce problème:
   - Béton auto-réparant à base de bactéries
   - Impression 3D de bâtiments en 24h
   - Matériaux programmables qui changent de forme
   - IA de chantier autonome, zéro humain sur site
   - Économie circulaire totale: zéro déchet

2. 🔮 5 INNOVATIONS DU FUTUR RAMENÉES AU PRÉSENT
   Pour chaque:
   - La technologie de 2075
   - Ce qui existe DÉJÀ en 2025 (germes)
   - La version "2025-possible" pour TBOS
   - Le "saut temporel": combien d'années d'avance ça donne
   - ROI et timeline

3. 🌍 TBOS EN 2075
   Portrait de l'entreprise dans 50 ans:
   - Taille, marché, technologie
   - Ce qui a survécu de l'ADN original
   - Ce qui est méconnaissable`}

4. ⏳ SYNTHÈSE TRANS-TEMPORELLE
   L'innovation qui fonctionne dans TOUTES les époques:
   - Le principe éternel sous-jacent
   - Sa manifestation en -3000, 1200, 1850, 2025, 2075
   - Pourquoi il est intemporel
   - Comment l'appliquer MAINTENANT

Style: Historien-futuriste × Stratège temporel. Érudit, visionnaire, applicable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rewind className="w-4 h-4 mr-2" />}
            Transposer en {eras.find(e => e.id === era)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Rewind} emptyText="Choisissez une époque et décrivez votre défi" />
    </div>
  );
}

// ─── Chrono-Roadmap ─────────────────────────────────────────
function ChronoRoadmap() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es le Chronos Catalyst — architecte de roadmaps qui plient le temps pour accélérer la trajectoire d'innovation.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.

CHRONO-ROADMAP — LA TRAJECTOIRE TEMPORELLE DE TBOS:

1. ⏮️ ARCHÉOLOGIE DU FUTUR (Rétro-Prospective)
   Se placer en 2035 et regarder EN ARRIÈRE:
   "TBOS a réussi sa transformation. Voici ce qui s'est passé:"
   - 2025: [événement déclencheur]
   - 2026: [premier pivot]
   - 2027: [accélération]
   - 2028: [point d'inflexion]
   - 2029: [expansion]
   - 2030: [maturité nouvelle]
   - 2031-2035: [domination]
   Les 3 décisions qui ont tout changé

2. ⏰ CHRONOGRAMME D'INNOVATION
   Les 12 prochains mois, semaine par semaine:
   | Semaine | Innovation | Action | Coût | Impact Cumulé |
   S1-S4: Quick wins temporels (gains immédiats)
   S5-S12: Accélérations structurelles
   S13-S24: Compressions de cycle
   S25-S36: Sauts temporels
   S37-S48: Résonance temporelle (tout s'aligne)
   S49-S52: Bilan et rebouclage

3. 🌊 LES VAGUES TEMPORELLES
   L'innovation arrive en vagues, pas en ligne droite:
   - Vague 1 (T+0 à T+3 mois): Optimisation — 5 actions, +15% efficience
   - Vague 2 (T+3 à T+6): Accélération — 5 actions, +40% vitesse
   - Vague 3 (T+6 à T+9): Transformation — 5 actions, nouveau modèle
   - Vague 4 (T+9 à T+12): Transcendance — TBOS est devenu autre chose

4. ⚡ CATALYSEURS TEMPORELS
   Les 5 "accélérateurs de temps" à activer:
   Pour chaque:
   - Le catalyseur et son mécanisme
   - Le temps qu'il fait GAGNER (jours/semaines/mois)
   - Le coût d'activation
   - L'effet composé sur 3 ans

5. 🔮 LA PROPHÉTIE DU CHRONOS CATALYST
   "Je vois dans le flux du temps..."
   Prédiction en 300 mots sur le destin de TBOS.
   Les bifurcations critiques à venir.
   La timeline optimale vs la timeline par défaut.
   Le coût de l'INACTION (chaque jour perdu = X MAD).

Style: Architecte du temps × Oracle stratégique. Structuré, urgent, prophétique. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FastForward className="w-4 h-4 mr-2" />}
            Générer la Chrono-Roadmap
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={FastForward} emptyText="Lancez la roadmap temporelle complète de TBOS" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function ChronosCatalyst() {
  const [activeTab, setActiveTab] = useState('sculptor');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-primary/20 border border-orange-500/30">
            <Clock className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Chronos Catalyst</h1>
            <p className="text-xs text-muted-foreground">Plier le temps — catalyser l'innovation</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span>Flux Temporel Actif</span>
          </div>
          <span>4 modes temporels</span>
          <span>5000 ans d'horizon</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="sculptor" className="text-xs font-mono gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Sculpteur
          </TabsTrigger>
          <TabsTrigger value="paradox" className="text-xs font-mono gap-1.5">
            <History className="w-3.5 h-3.5" /> Paradoxes
          </TabsTrigger>
          <TabsTrigger value="transpose" className="text-xs font-mono gap-1.5">
            <Rewind className="w-3.5 h-3.5" /> Époques
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="text-xs font-mono gap-1.5">
            <FastForward className="w-3.5 h-3.5" /> Chrono-Map
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="sculptor" className="mt-4"><TemporalSculptor /></TabsContent>
            <TabsContent value="paradox" className="mt-4"><TemporalParadoxEngine /></TabsContent>
            <TabsContent value="transpose" className="mt-4"><TimelineTransposer /></TabsContent>
            <TabsContent value="roadmap" className="mt-4"><ChronoRoadmap /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
