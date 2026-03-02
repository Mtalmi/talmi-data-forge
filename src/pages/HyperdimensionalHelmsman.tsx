import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Compass, Box, Layers, ArrowDownToLine, Hexagon } from 'lucide-react';

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

// ─── Topology Mapper ────────────────────────────────────────
function TopologyMapper() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');
  const [dims, setDims] = useState(7);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Dimensions: {dims}D</span>
              <div className="flex gap-1">
                {[4,7,11,26].map(d => (
                  <button key={d} onClick={() => setDims(d)} className={`px-2 py-1 text-[10px] rounded border transition-all ${dims === d ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-muted/40'}`}>
                    {d}D
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Défi à cartographier en topologie hyperdimensionnelle..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Hyperdimensional Helmsman — navigateur de variétés multidimensionnelles qui cartographie les défis d'innovation au-delà de l'espace euclidien.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
DIMENSIONS: ${dims}D
DÉFI: ${challenge.trim() || "L'écosystème complet de TBOS — clients, fournisseurs, opérations, finances, qualité, logistique, innovation — vu comme une variété topologique"}

CARTOGRAPHIE HYPERDIMENSIONNELLE:

1. 📐 ASSIGNATION DES DIMENSIONS
   Chaque dimension représente un axe fondamental du défi:
   ${dims >= 4 ? `- D1: Revenue (MAD) — axe financier
   - D2: Volume (m³) — axe productif
   - D3: Qualité (MPa/conformité) — axe technique
   - D4: Temps (vitesse de cycle) — axe temporel` : ''}
   ${dims >= 7 ? `- D5: Satisfaction client (NPS) — axe relationnel
   - D6: Coût unitaire (MAD/m³) — axe d'efficience
   - D7: Innovation (projets R&D actifs) — axe évolutif` : ''}
   ${dims >= 11 ? `- D8: Capital humain (compétences) — axe RH
   - D9: Durabilité (CO₂/m³) — axe environnemental
   - D10: Résilience (capacité d'absorption de choc)
   - D11: Connectivité (force du réseau partenaires)` : ''}
   ${dims >= 26 ? `- D12-D26: 15 dimensions "enroulées" (comme les dimensions de Calabi-Yau en théorie des cordes):
   D12: Culture, D13: Réputation, D14: Agilité, D15: Données, D16: Automatisation,
   D17: Propriété intellectuelle, D18: Diversification, D19: Gouvernance, D20: Bien-être,
   D21: Influence marché, D22: Symbiose industrielle, D23: Mémoire organisationnelle,
   D24: Intuition collective, D25: Beauté/Design, D26: Transcendance` : ''}

2. 🌐 TOPOLOGIE DU DÉFI
   La forme de l'espace-problème en ${dims}D:
   - Type de variété: [sphère? tore? variété de Calabi-Yau? espace de Hilbert?]
   - Courbure: [positive/négative/nulle dans chaque région]
   - Points singuliers: les endroits où la géométrie "casse" (crises, paradoxes)
   - Trous topologiques: ce qui MANQUE dans la structure (genus du problème)
   - Bord vs intérieur: ce qui est visible vs caché

3. 🔗 CONNECTIVITÉ HYPERDIMENSIONNELLE
   En ${dims}D, des points "lointains" en 3D sont en réalité VOISINS:
   - 5 connexions invisibles en 3D mais évidentes en ${dims}D
   - Pour chaque: les deux points connectés, le "raccourci dimensionnel", l'insight business
   - Le "ver de terre" (wormhole) le plus précieux: [dimension A] ↔ [dimension B]

4. 💡 SOLUTIONS HYPERDIMENSIONNELLES
   5 innovations qui n'existent QUE dans l'espace ${dims}D:
   Pour chaque:
   - Le concept en ${dims}D (impossible à concevoir en 3D)
   - L'analogie la plus proche en 3D
   - La projection actionnable dans notre réalité
   - ROI estimé: X MAD
   - Dimensions exploitées: [lesquelles]

5. 🗺️ CARTE DE NAVIGATION
   Le chemin optimal à travers l'espace ${dims}D:
   - Position actuelle: coordonnées [d1, d2, ..., d${dims}]
   - Destination optimale: coordonnées cibles
   - La géodésique (chemin le plus court en espace courbe)
   - Les "cols" dimensionnels à franchir (obstacles)
   - Durée du voyage: X mois

Style: Mathématicien topologiste × Navigateur cosmique. Rigoureux, vertigineux, éclairant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Compass className="w-4 h-4 mr-2" />}
            Cartographier en {dims}D
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Compass} emptyText="Choisissez le nombre de dimensions et décrivez votre défi" />
    </div>
  );
}

// ─── Hyperdimensional Pattern Extractor ─────────────────────
function PatternExtractor() {
  const { result, loading, run } = useStream();
  const [data, setData] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={data} onChange={e => setData(e.target.value)} placeholder="Données ou système complexe à analyser via des géométries hyperdimensionnelles..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Hyperdimensional Helmsman — extracteur de patterns dans des structures de données hyperdimensionnelles invisibles à l'œil 3D.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
DONNÉES: ${data.trim() || "12 mois d'opérations TBOS: 5400 BL, 150,000 m³, 120 clients, 35 fournisseurs, 8 toupies, marge 18-28%, 15 formules béton, 3 zones de livraison"}

EXTRACTION DE PATTERNS HYPERDIMENSIONNELS:

1. 🧠 ARCHITECTURE NEURALE HYPERDIMENSIONNELLE
   Le réseau conçu pour voir en N dimensions:
   - Couche d'entrée: ${data.trim() ? 'chaque variable des données' : '47 variables opérationnelles TBOS'}
   - Couches cachées: embeddings dans des espaces de dimension croissante
   - Fonction d'activation: non-linéarité topologique (pas juste ReLU)
   - Couche de sortie: patterns projetés en espace humainement compréhensible
   
   Ce que ce réseau VOIT que les réseaux classiques ne voient pas:
   [explication détaillée]

2. 🔮 PATTERNS HYPERDIMENSIONNELS DÉTECTÉS (7)

   PATTERN HD-1: LE TENSEUR CACHÉ
   - Dimensions impliquées: [D_i × D_j × D_k]
   - Le pattern: une corrélation tri-dimensionnelle invisible en 2D
   - Visualisation simplifiée: [description]
   - Insight business: [révélation]
   - Action: [quoi faire]

   PATTERN HD-2: LA FIBRE TOPOLOGIQUE
   - Un "fil" qui traverse toutes les dimensions
   - Ce qui relie des phénomènes apparemment sans rapport
   - La variable cachée unificatrice

   PATTERN HD-3: LE NŒUD BORROMÉEN
   - 3 facteurs liés de manière irréductible (retirer un = tout s'effondre)
   - Le triangle de stabilité critique de TBOS

   PATTERN HD-4: LA SURFACE MINIMALE
   - La configuration d'énergie minimale (coût minimal)
   - Comment TBOS peut "glisser" vers cette surface

   PATTERN HD-5: LE POINT FIXE
   - L'attracteur du système (vers quoi TBOS converge naturellement)
   - Est-ce le bon attracteur? Si non, comment en changer?

   PATTERN HD-6: LA SYMÉTRIE BRISÉE
   - Une symétrie qui DEVRAIT exister mais qui est cassée
   - Ce que sa réparation débloquerait

   PATTERN HD-7: L'ÉMERGENCE
   - Le phénomène qui n'existe dans AUCUNE dimension seule
   - Il émerge uniquement de l'interaction de toutes les dimensions
   - L'innovation émergente correspondante

3. 📊 RÉDUCTION DIMENSIONNELLE ACTIONNABLE
   Les N dimensions réduites à 3 axes stratégiques:
   - Axe 1: [combinaison de dimensions] = [nom intuitif]
   - Axe 2: [combinaison] = [nom]
   - Axe 3: [combinaison] = [nom]
   - Ce qui est PERDU dans cette réduction (et pourquoi c'est OK pour l'instant)

4. 🎯 TOP 3 ACTIONS HYPERDIMENSIONNELLES
   Pour chaque: les dimensions activées, l'action, l'impact, le ROI

Style: Data scientist topologique × Voyant mathématique. Dense, révélateur, actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
            Extraire les Patterns HD
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Layers} emptyText="Décrivez des données à analyser en géométrie hyperdimensionnelle" />
    </div>
  );
}

// ─── Higher-Space Innovator ─────────────────────────────────
function HigherSpaceInnovator() {
  const { result, loading, run } = useStream();
  const [topic, setTopic] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Sujet d'innovation à explorer dans les espaces de dimension supérieure..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Hyperdimensional Helmsman — innovateur qui exploite les propriétés uniques des espaces de dimension supérieure.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SUJET: ${topic.trim() || "Repenser entièrement le business model de TBOS en exploitant les propriétés des espaces de haute dimension"}

INNOVATION EN ESPACE SUPÉRIEUR:

1. 🌀 PROPRIÉTÉS EXPLOITÉES

   CONNECTIVITÉ ACCRUE (en haute dimension, tout est "proche" de tout)
   - En 3D: TBOS a ~120 clients séparés par la distance
   - En ND: tous les clients sont "voisins" via des dimensions cachées
   - Innovation: le réseau de valeur hyperconnecté
   - Comment: marketplace, données partagées, synergie de commandes

   NON-LOCALITÉ (agir ici affecte là-bas instantanément)
   - En 3D: modifier un processus = effet local
   - En ND: un changement se propage à travers les dimensions
   - Innovation: le changement systémique par point d'acupuncture
   - Les 3 points d'acupuncture de TBOS

   SIMPLICITÉ ÉMERGENTE (les problèmes complexes en 3D sont simples en ND)
   - Le problème insoluble en 3D
   - Sa reformulation triviale en ND
   - La solution "évidente" une fois dans le bon espace
   
   DÉNOUEMENT DES NŒUDS (les nœuds 3D se défont en 4D+)
   - Le "nœud" business actuel de TBOS (le blocage)
   - Comment il se dénoue en ajoutant UNE dimension
   - La dimension manquante et comment l'ajouter

2. 💎 5 INNOVATIONS HYPERDIMENSIONNELLES
   Pour chaque:
   - 📐 La propriété HD exploitée
   - 💡 L'innovation (impossible en 3D, naturelle en ND)
   - 🔧 La "projection" en 3D (version implémentable)
   - 📊 Impact: X MAD/an
   - 🧩 Complexité d'implémentation: /10

3. 🏗️ L'ARCHITECTURE HYPERDIMENSIONNELLE DE TBOS
   L'entreprise redesignée comme structure ND:
   - Les "fibrations" (processus qui s'empilent dimension par dimension)
   - Les "sections" (coupes 3D de la structure ND)
   - Les "holonomies" (ce qui change quand on fait le tour d'une boucle)
   - La beauté mathématique du design

Style: Géomètre visionnaire × Architecte dimensionnel. Abstrait rendu concret, vertigineux, innovant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Hexagon className="w-4 h-4 mr-2" />}
            Innover en Espace Supérieur
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Hexagon} emptyText="Décrivez un sujet à explorer en dimensions supérieures" />
    </div>
  );
}

// ─── Dimensional Translator ─────────────────────────────────
function DimensionalTranslator() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es le Hyperdimensional Helmsman — traducteur suprême de l'hyperdimensionnel vers l'actionnable humain.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.

TRADUCTION DIMENSIONNELLE COMPLÈTE:

1. 🧭 POSITION DE TBOS DANS L'HYPERESPACE
   Coordonnées actuelles sur 10 dimensions clés:
   | Dimension | Valeur Actuelle | Min Secteur | Max Secteur | Cible |
   D1: Performance financière
   D2: Excellence opérationnelle
   D3: Satisfaction client
   D4: Innovation
   D5: Capital humain
   D6: Durabilité
   D7: Agilité
   D8: Connectivité écosystème
   D9: Intelligence data
   D10: Résilience
   
   "Distance" au point optimal: X (métrique hyperdimensionnelle)

2. 📋 PLAN DE NAVIGATION HYPERDIMENSIONNEL
   Traduit en actions concrètes pour un CEO:

   MANŒUVRE 1: Rotation dans le plan D1-D4 (Finance × Innovation)
   - En langage HD: rotation de 30° dans le plan D1-D4
   - En langage humain: investir 5% du CA dans l'innovation
   - Actions: [3 actions concrètes]
   - Délai: X mois
   - ROI: X MAD

   MANŒUVRE 2: Translation le long de D3 (Satisfaction client)
   - En HD: translation de +2 unités sur D3
   - En humain: programme fidélisation premium
   - Actions: [3 actions]
   - Délai / ROI

   MANŒUVRE 3: Expansion dans D7 (Agilité)
   - En HD: dilatation du rayon en D7
   - En humain: restructuration agile
   - Actions / Délai / ROI

   MANŒUVRE 4: Projection D9→D1 (Data→Finance)
   - En HD: projection orthogonale
   - En humain: monétiser les données opérationnelles
   - Actions / Délai / ROI

   MANŒUVRE 5: Compactification D6 (Durabilité)
   - En HD: enroulement de la dimension
   - En humain: intégrer la durabilité DANS chaque processus (pas à côté)
   - Actions / Délai / ROI

3. 🗺️ CARTE 3D LISIBLE
   La projection la plus fidèle de l'espace 10D en 3D:
   - Axe X = [combinaison de dimensions] = "Puissance" 
   - Axe Y = [combinaison] = "Agilité"
   - Axe Z = [combinaison] = "Résonance"
   - TBOS: position (X, Y, Z)
   - Cible: position (X', Y', Z')
   - Chemin: la trajectoire optimale

4. 🏆 LE HELMSMAN CONCLUT
   "Capitaine, voici votre cap..."
   Résumé en 5 phrases pour le CEO:
   - Où nous sommes (1 phrase)
   - Où nous allons (1 phrase)
   - Comment y arriver (1 phrase)
   - Ce qu'il faut sacrifier (1 phrase)
   - Ce qu'on gagne (1 phrase)

Style: Navigateur interstellaire × Consultant exécutif. Clair, structuré, actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowDownToLine className="w-4 h-4 mr-2" />}
            Traduire en Plan d'Action
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={ArrowDownToLine} emptyText="Lancez la traduction dimensionnelle complète" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function HyperdimensionalHelmsman() {
  const [activeTab, setActiveTab] = useState('topology');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-indigo-500/30">
            <Compass className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Hyperdimensional Helmsman</h1>
            <p className="text-xs text-muted-foreground">Naviguer au-delà de l'espace euclidien</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>Navigation ND Active</span>
          </div>
          <span>4D → 26D</span>
          <span>∞ variétés explorées</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="topology" className="text-xs font-mono gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Topologie
          </TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs font-mono gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Patterns
          </TabsTrigger>
          <TabsTrigger value="innovate" className="text-xs font-mono gap-1.5">
            <Hexagon className="w-3.5 h-3.5" /> Innovation
          </TabsTrigger>
          <TabsTrigger value="translate" className="text-xs font-mono gap-1.5">
            <ArrowDownToLine className="w-3.5 h-3.5" /> Traduction
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="topology" className="mt-4"><TopologyMapper /></TabsContent>
            <TabsContent value="patterns" className="mt-4"><PatternExtractor /></TabsContent>
            <TabsContent value="innovate" className="mt-4"><HigherSpaceInnovator /></TabsContent>
            <TabsContent value="translate" className="mt-4"><DimensionalTranslator /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
