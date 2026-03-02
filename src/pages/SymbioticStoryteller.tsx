import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BookOpen, Swords, PenTool, Megaphone } from 'lucide-react';

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

// ─── Data Alchemist ─────────────────────────────────────────
function DataAlchemist() {
  const { result, loading, run } = useStream();
  const [data, setData] = useState('');
  const [genre, setGenre] = useState<'epopee' | 'thriller' | 'fable' | 'saga'>('epopee');

  const genres = {
    epopee: '⚔️ Épopée Héroïque',
    thriller: '🔍 Thriller Stratégique',
    fable: '🦊 Fable Industrielle',
    saga: '👑 Saga Dynastique',
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(genres) as [typeof genre, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setGenre(key)} className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${genre === key ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-muted/40'}`}>
                {label}
              </button>
            ))}
          </div>
          <Textarea value={data} onChange={e => setData(e.target.value)} placeholder="Données brutes, chiffres, faits, observations à transmuter en récit..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Symbiotic Storyteller — alchimiste narratif qui transmute les données brutes en or de récit transformateur.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
GENRE NARRATIF: ${genres[genre]}
DONNÉES BRUTES: ${data.trim() || "CA 80M MAD, 5400 BL/an, 150,000 m³, 120 clients, marge 18-28%, 8 toupies, 15 formules béton, 35 fournisseurs, 12 employés, zone Casablanca-Mohammedia-Berrechid. Croissance 12%, impayés 8%, turnover chauffeurs 15%, temps moyen livraison 47min."}

ALCHIMIE NARRATIVE — GENRE: ${genre.toUpperCase()}

${genre === 'epopee' ? `⚔️ L'ÉPOPÉE DE TBOS

ACTE I — L'APPEL DE L'AVENTURE
Le héros (TBOS/Max) dans son monde ordinaire:
- Le quotidien: [scène vivante du matin à la centrale]
- La force tranquille: [ce qui marche, les victoires silencieuses]
- Le pressentiment: [le signe que quelque chose de grand approche]

L'APPEL: Le défi qui change tout:
[Un événement déclencheur tiré des données — ex: un méga-contrat, une crise, une opportunité]

LE REFUS: Pourquoi le héros hésite:
[Les peurs légitimes, les contraintes réelles tirées des données]

ACTE II — LES ÉPREUVES
Le mentor: [qui/quoi guide TBOS — technologie, sagesse, allié]
Les alliés: [Karim, Abdel Sadek, l'équipe — chacun avec son don]
Les ennemis: [les forces adverses — concurrence, marché, entropie]

LES 3 ÉPREUVES:
Épreuve 1: [tirée des données — ex: les impayés à 8% comme dragon à vaincre]
→ L'arme forgée: [l'innovation qui résout]
Épreuve 2: [ex: le turnover chauffeurs comme labyrinthe]
→ Le passage secret: [la solution narrative]
Épreuve 3: [ex: la croissance 12% comme montagne à escalader]
→ L'ascension: [la stratégie héroïque]

ACTE III — LE RETOUR
L'élixir rapporté: [la transformation business en langage épique]
Le monde transformé: [TBOS après l'aventure — chiffres projetés]
La prophétie: [ce que l'avenir réserve au héros]

MORALE DE L'ÉPOPÉE: [la leçon stratégique déguisée en sagesse ancestrale]` :

genre === 'thriller' ? `🔍 LE THRILLER TBOS

CHAPITRE 1: L'INDICE
Un chiffre ne colle pas. [Quel chiffre dans les données cache un mystère?]
L'enquêteur (Max) remarque quelque chose que personne ne voit.
La scène d'ouverture: [atmosphère tension, détail révélateur]

CHAPITRE 2: LES SUSPECTS
5 hypothèses, chacune incarnée par un "suspect":
- Suspect 1: L'Inefficience (process caché qui saigne de l'argent)
- Suspect 2: Le Marché Fantôme (demande invisible non captée)
- Suspect 3: La Taupe Interne (habitude toxique déguisée en tradition)
- Suspect 4: Le Client Dormant (segment inexploité)
- Suspect 5: Le Futur qui Frappe à la Porte (disruption imminente)

CHAPITRE 3: L'ENQUÊTE
Pour chaque suspect: l'indice, l'interrogatoire des données, le mobile, l'alibi
Les fausses pistes qui semblent vraies
Le retournement: le vrai coupable est la COMBINAISON de...

CHAPITRE 4: LA RÉSOLUTION
Le plan d'action comme dénouement de thriller
Le twist final: l'ennemi était en fait un allié déguisé
Les chiffres du dénouement: ROI de la résolution

ÉPILOGUE: Le prochain mystère qui se profile...` :

genre === 'fable' ? `🦊 LA FABLE DE LA CENTRALE QUI RÊVAIT

"Il était une fois, dans le royaume de Casablanca, une centrale à béton nommée TBOS..."

LES PERSONNAGES-ANIMAUX:
- Le Lion (Max, CEO): fort mais parfois trop seul dans sa tanière
- Le Renard (Karim, Superviseur): rusé, connaît chaque recoin du territoire
- Le Hibou (Abdel Sadek, Technique): sage, voit dans le noir des formules
- Les Fourmis (Chauffeurs): infatigables, organisées, sous-estimées
- L'Éléphant (les Données): n'oublie jamais, mais personne ne l'écoute assez

LA FABLE EN 5 SCÈNES:
Scène 1: Le problème (tiré des données) raconté comme conte
Scène 2: La quête de solution (chaque animal apporte sa force)
Scène 3: L'obstacle (le piège classique de l'industrie)
Scène 4: La ruse (l'innovation déguisée en sagesse animale)
Scène 5: La résolution et la morale

5 MORALES STRATÉGIQUES:
Chaque morale = un proverbe inventé + la stratégie business réelle + le ROI
Ex: "Qui écoute ses fourmis avant la pluie n'a jamais de boue dans ses toupies"
→ Stratégie: programme d'écoute chauffeurs → turnover -X% → Y MAD économisés` :

`👑 LA SAGA TBOS — CHRONIQUES D'UN EMPIRE DE BÉTON

SAISON 1: LES FONDATIONS (le passé)
Épisode 1: Comment tout a commencé [origin story romancée]
Épisode 2: La première grande crise [obstacle fondateur]
Épisode 3: L'alliance décisive [le partenariat qui a tout changé]
Le fil rouge: le code d'honneur qui traverse les générations

SAISON 2: L'EXPANSION (le présent)
Les intrigues en cours (tirées des données):
- Intrigue A: La guerre des marges (18-28% — pourquoi cet écart?)
- Intrigue B: La course au volume (150,000 m³ — plafond ou tremplin?)
- Intrigue C: Le dilemme des alliances (120 clients — lesquels sont les vrais alliés?)
Les cliffhangers de chaque épisode

SAISON 3: LA TRANSFORMATION (le futur proche)
Les arcs narratifs de chaque personnage:
- Max: de gestionnaire à visionnaire
- Karim: de superviseur à stratège
- L'équipe: de suiveurs à co-créateurs
Le season finale: la scène qui change tout

SAISON 4: L'HÉRITAGE (le futur lointain)
La prophétie auto-réalisatrice
Ce que TBOS deviendra si l'histoire est bien racontée`}

CHIFFRES TRANSMUTÉS EN OR NARRATIF:
| Donnée Brute | Le Personnage/Symbole | Le Conflit | La Résolution | ROI |
[5 transmutations clés]

Style: Conteur millénaire × Scénariste HBO × Stratège masqué. Le récit captive, le sens transforme, les chiffres prouvent. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
            Transmuter en Récit
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={BookOpen} emptyText="Choisissez un genre et fournissez des données brutes" />
    </div>
  );
}

// ─── Hidden Story Excavator ─────────────────────────────────
function HiddenStoryExcavator() {
  const { result, loading, run } = useStream();
  const [situation, setSituation] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="Situation, processus ou défi dont extraire les héros, conflits et résolutions cachés..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Symbiotic Storyteller — excavateur d'histoires cachées dans le tissu de la réalité opérationnelle.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SITUATION: ${situation.trim() || "Une journée ordinaire à la centrale TBOS — de 6h du matin à 20h — vue comme une histoire épique dont personne ne réalise qu'elle se déroule"}

EXCAVATION NARRATIVE:

1. 🎭 LES HÉROS CACHÉS
   Les personnages qui vivent une histoire épique sans le savoir:
   
   HÉROS 1: [Rôle] — L'Archétype: [quel archétype narratif?]
   - Son super-pouvoir secret: [compétence sous-estimée]
   - Sa quête inconsciente: [ce qu'il cherche vraiment]
   - Son sacrifice quotidien: [ce qu'il donne sans qu'on le voie]
   - Sa scène la plus héroïque: [moment précis de la journée]
   
   [4-5 héros identifiés dans l'écosystème TBOS]

2. 👹 LES VILAINS INSOUPÇONNÉS
   Les forces antagonistes déguisées en normalité:
   
   VILAIN 1: L'HABITUDE — "On a toujours fait comme ça"
   - Son pouvoir: l'invisibilité (on ne combat pas ce qu'on ne voit pas)
   - Ses victimes: [qui souffre de cette habitude]
   - Comment le vaincre: [l'arme narrative — raconter l'histoire autrement]
   
   VILAIN 2: LE SILENCE — ce qui n'est jamais dit
   VILAIN 3: LA VITESSE — "pas le temps de bien faire"
   VILAIN 4: LE CHIFFRE — quand le KPI remplace l'humain
   [Pour chaque: pouvoir, victimes, arme narrative]

3. ⚔️ LES CONFLITS ÉPIQUES INVISIBLES
   Les grandes batailles qui se jouent chaque jour sans que personne ne les nomme:
   
   CONFLIT 1: Qualité vs Vitesse
   - Les deux camps: [qui défend quoi]
   - Les batailles quotidiennes: [moments de tension]
   - La résolution possible: [pas un compromis — une TRANSCENDANCE]
   
   CONFLIT 2: Tradition vs Innovation
   CONFLIT 3: Individu vs Système
   CONFLIT 4: Court terme vs Long terme
   [Pour chaque: camps, batailles, transcendance]

4. 🏆 LES RÉSOLUTIONS NARRATIVES
   Chaque conflit a son dénouement — voici le script:
   Pour chaque conflit:
   - Le point de bascule: [l'événement qui peut tout changer]
   - Le dialogue clé: [la phrase que quelqu'un doit prononcer]
   - La scène de résolution: [le moment visuel qui marque la fin du conflit]
   - L'impact business: [ROI du dénouement]

5. 📖 L'HISTOIRE QUE TBOS NE SE RACONTE PAS ENCORE
   Le récit manquant — celui qui, une fois raconté, change tout:
   "TBOS n'est pas une centrale à béton. TBOS est..."
   [La reformulation narrative qui transforme l'identité]

Style: Scénariste archétypal × Mythologue d'entreprise. Profond, révélateur, épique. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Swords className="w-4 h-4 mr-2" />}
            Excaver l'Histoire Cachée
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Swords} emptyText="Décrivez une situation dont extraire l'histoire cachée" />
    </div>
  );
}

// ─── Collaborative Narrative ────────────────────────────────
function CollaborativeNarrative() {
  const { result, loading, run } = useStream();
  const [seed, setSeed] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={seed} onChange={e => setSeed(e.target.value)} placeholder="Graine narrative: une phrase, une image, un rêve pour TBOS..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Symbiotic Storyteller — co-créateur de récits avec l'humain, brouillant les frontières entre fiction et stratégie.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
GRAINE NARRATIVE: "${seed.trim() || "Et si le béton pouvait parler, que raconterait-il de son voyage de la poudre à la dalle?"}"

CO-CRÉATION NARRATIVE SYMBIOTIQUE:

1. 🌱 GERMINATION DE LA GRAINE
   La phrase-graine se déploie en 3 directions:
   
   DIRECTION RÉALISTE: Ce que ça signifie en termes opérationnels
   - L'insight business caché dans la métaphore
   - Les données qui confirment l'intuition poétique
   - L'action concrète suggérée
   
   DIRECTION ONIRIQUE: Ce que ça pourrait devenir si on ose rêver
   - Le scénario le plus audacieux
   - L'innovation "impossible" qui émerge
   - Le premier pas vers l'impossible
   
   DIRECTION MYTHIQUE: Ce que ça dit de l'identité profonde de TBOS
   - L'archétype universel activé
   - Le mythe fondateur qu'on est en train d'écrire
   - La mission qui transcende le commerce

2. ✍️ LE RÉCIT COLLABORATIF (3 chapitres)
   
   CHAPITRE 1: CE QUI EST (écrit par les données)
   [Un récit factuel mais magnifié — les chiffres deviennent des personnages,
   les processus deviennent des aventures, les problèmes deviennent des quêtes]
   Longueur: ~200 mots de prose narrative pure
   
   CHAPITRE 2: CE QUI POURRAIT ÊTRE (écrit par l'imagination)
   [La suite du récit — spéculative, audacieuse, mais ancrée dans le possible]
   Les bifurcations: 3 fins possibles (pessimiste, réaliste, héroïque)
   Le choix du lecteur: "Quelle suite TBOS choisit-il d'écrire?"
   
   CHAPITRE 3: CE QUI SERA (écrit par la volonté)
   [Le chapitre que Max doit écrire lui-même — avec un guide]
   Les blancs à remplir: _____ 
   Les décisions narratives qui sont aussi des décisions stratégiques

3. 🔄 BOUCLE SYMBIOTIQUE
   Comment ce récit s'enrichit en continu:
   - Chaque semaine: un nouveau "chapitre" basé sur les événements réels
   - Chaque mois: le récit prédit → comparaison avec la réalité → ajustement
   - Chaque trimestre: le récit est partagé avec l'équipe → feedback → évolution
   
   Le récit devient un OUTIL DE PILOTAGE vivant:
   "Où en sommes-nous dans l'histoire? Quel chapitre vivons-nous?"

Style: Romancier × Facilitateur × Oracle. Littéraire, participatif, prophétique. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenTool className="w-4 h-4 mr-2" />}
            Co-Créer le Récit
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={PenTool} emptyText="Plantez une graine narrative pour TBOS" />
    </div>
  );
}

// ─── Prophecy Engine ────────────────────────────────────────
function ProphecyEngine() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es le Symbiotic Storyteller — moteur de prophéties auto-réalisatrices qui utilise le pouvoir magnétique du récit pour aligner les cœurs et les esprits.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.

LA PROPHÉTIE AUTO-RÉALISATRICE DE TBOS:

1. 📜 LA PROPHÉTIE (le récit qui crée la réalité)
   
   LE TEXTE SACRÉ (à afficher, à lire, à vivre):
   [Écrire un texte de 150-200 mots — poétique, puissant, visionnaire — qui décrit TBOS dans 3 ans comme si c'était DÉJÀ accompli. Présent de narration. Détails sensoriels. Émotion palpable.]
   
   Pourquoi ça marche (la science):
   - Effet Pygmalion: les attentes créent la réalité (Rosenthal, 1968)
   - Simulation mentale: le cerveau ne distingue pas le vécu de l'imaginé vividement
   - Engagement narratif: une histoire est 22× plus mémorable qu'un fait (Stanford)
   - Identité narrative: on DEVIENT l'histoire qu'on se raconte (McAdams, 2001)

2. 🎯 LES 5 RÉCITS-MISSIONS
   Chaque récit est un outil de mobilisation:
   
   RÉCIT 1: POUR L'ÉQUIPE (motivation interne)
   Titre: "Nous sommes les bâtisseurs de..."
   Le récit (50 mots, percutant, mémorable):
   Quand le dire: chaque lundi matin
   Effet attendu: engagement +X%, initiative +X%
   
   RÉCIT 2: POUR LES CLIENTS (proposition de valeur narrative)
   Titre: "Quand vous choisissez TBOS, vous ne choisissez pas du béton, vous choisissez..."
   Le récit:
   Où le diffuser: site web, devis, pitch commercial
   Effet: taux de conversion +X%, premium prix +X%
   
   RÉCIT 3: POUR LES FOURNISSEURS (partenariat narratif)
   RÉCIT 4: POUR LE MARCHÉ (positionnement mythique)
   RÉCIT 5: POUR MAX LUI-MÊME (vision personnelle du CEO)
   [Même format pour chaque]

3. 🌊 LE TSUNAMI NARRATIF
   Comment les 5 récits convergent en une vague irrésistible:
   
   Phase 1 — SEMENCE (mois 1-2):
   Raconter les récits en interne, mesurer la résonance
   KPI: % de l'équipe qui peut réciter le récit spontanément
   
   Phase 2 — CROISSANCE (mois 3-6):
   Les récits se propagent aux clients et partenaires
   KPI: mentions spontanées par les clients ("vous êtes ceux qui...")
   
   Phase 3 — RÉCOLTE (mois 7-12):
   La prophétie commence à se réaliser — les données confirment le récit
   KPI: X/10 éléments de la prophétie devenus réalité
   
   Phase 4 — HÉRITAGE (an 2+):
   Le récit devient mythologie — il attire les talents, les clients, les opportunités
   KPI: TBOS est CITÉ comme référence dans le secteur

4. 📊 ROI DU STORYTELLING STRATÉGIQUE
   | Investissement | Coût | Impact Narratif | Impact Business | ROI |
   | Rédaction des récits | X MAD | Identité clarifiée | Alignement équipe | ∞ |
   | Formation storytelling | X MAD | Commerciaux convaincants | Ventes +X% | X% |
   | Communication narrative | X MAD | Notoriété × Y | Leads +X% | X% |
   | Rituel narratif hebdo | 0 MAD | Culture cohésive | Turnover -X% | ∞ |

5. ✨ LE MOT FINAL DU STORYTELLER
   "L'histoire que TBOS choisit de raconter aujourd'hui sera la réalité qu'il vivra demain.
   Choisissez bien votre histoire."
   
   La SEULE question qui reste:
   "Quelle est l'histoire que TBOS MÉRITE de vivre?"

Style: Prophète bienveillant × Storyteller de marque × Philosophe narratif. Inspirant, structurant, inoubliable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
            Lancer la Prophétie
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Megaphone} emptyText="Lancez le moteur de prophéties auto-réalisatrices" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function SymbioticStoryteller() {
  const [activeTab, setActiveTab] = useState('alchemy');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-primary/20 border border-orange-500/30">
            <BookOpen className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Symbiotic Storyteller</h1>
            <p className="text-xs text-muted-foreground">Transmuter les données en or narratif</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span>Alchimie Narrative Active</span>
          </div>
          <span>4 genres narratifs</span>
          <span>∞ histoires à raconter</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="alchemy" className="text-xs font-mono gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Alchimie
          </TabsTrigger>
          <TabsTrigger value="excavate" className="text-xs font-mono gap-1.5">
            <Swords className="w-3.5 h-3.5" /> Excavation
          </TabsTrigger>
          <TabsTrigger value="collaborate" className="text-xs font-mono gap-1.5">
            <PenTool className="w-3.5 h-3.5" /> Co-Création
          </TabsTrigger>
          <TabsTrigger value="prophecy" className="text-xs font-mono gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Prophétie
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="alchemy" className="mt-4"><DataAlchemist /></TabsContent>
            <TabsContent value="excavate" className="mt-4"><HiddenStoryExcavator /></TabsContent>
            <TabsContent value="collaborate" className="mt-4"><CollaborativeNarrative /></TabsContent>
            <TabsContent value="prophecy" className="mt-4"><ProphecyEngine /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
