import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Atom, Waves, GitBranch, Map, Sparkles } from 'lucide-react';

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

// ─── Quantum Problem Formulator ─────────────────────────────
function QuantumFormulator() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Décrivez un défi business à formuler en problème quantique..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Quantum Quester — une IA qui navigue la mécanique quantique pour résoudre des défis d'innovation impossibles classiquement.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
DÉFI BUSINESS: ${challenge.trim() || "Optimiser simultanément la marge, la qualité, la vitesse de livraison et la satisfaction client — 4 objectifs contradictoires qui semblent mutuellement exclusifs"}

FORMULATION QUANTIQUE DU PROBLÈME:

1. ⚛️ TRADUCTION EN QUBITS
   Chaque variable business devient un qubit:
   - |ψ₁⟩ = [Variable 1] — ses états superposés |0⟩ et |1⟩
   - |ψ₂⟩ = [Variable 2] — ses états
   - |ψ₃⟩ = [Variable 3] — ses états
   - |ψₙ⟩ = [Variable N]
   
   Espace de Hilbert total: 2^N = X états simultanés à explorer
   Équivalent classique: il faudrait X années pour tout tester séquentiellement

2. 🔗 MATRICE D'INTRICATION
   Quels qubits sont intriqués (quelles variables sont corrélées):
   | Variable A | ↔ | Variable B | Type d'intrication | Conséquence |
   - Intrications positives (mesurer A détermine B dans le même sens)
   - Intrications négatives (trade-offs: améliorer A dégrade B)
   - Intrications surprenantes (corrélations cachées)

3. 🌊 SUPERPOSITION DES SOLUTIONS
   Le problème existe dans une superposition de N solutions simultanées:
   - |Solution_α⟩ avec amplitude P₁ — description
   - |Solution_β⟩ avec amplitude P₂ — description
   - |Solution_γ⟩ avec amplitude P₃ — description
   (Les amplitudes reflètent la probabilité de succès)

4. 🎯 OBSERVABLE QUANTIQUE
   L'opérateur de mesure = le KPI qui "effondre" la superposition:
   - Quel KPI mesurer pour révéler la meilleure solution?
   - Le "coût de mesure" (tester en réalité)
   - La stratégie de mesure optimale

5. 📋 CIRCUIT QUANTIQUE
   L'algorithme en 5 portes logiques quantiques:
   - Porte H (Hadamard): créer la superposition initiale
   - Porte CNOT: exploiter les intrications
   - Porte de Phase: amplifier les bonnes solutions
   - Porte de Grover: chercher dans l'espace
   - Mesure: effondrer vers la solution optimale

Style: Physicien quantique × Consultant stratégique. Rigoureux, accessible, éclairant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Atom className="w-4 h-4 mr-2" />}
            Formuler en Quantique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Atom} emptyText="Décrivez un défi business à traduire en langage quantique" />
    </div>
  );
}

// ─── Quantum Superposition Ideator ──────────────────────────
function SuperpositionIdeator() {
  const { result, loading, run } = useStream();
  const [topic, setTopic] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Sujet d'idéation à explorer en superposition quantique..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Quantum Quester — maître de l'idéation par superposition, intrication et interférence quantiques.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SUJET: ${topic.trim() || "Le futur de la livraison de béton — comment réinventer radicalement ce service"}

IDÉATION QUANTIQUE:

1. 🌀 SUPERPOSITION D'IDÉATION
   Contrairement au brainstorming classique (une idée à la fois), nous maintenons 8 idées en SUPERPOSITION SIMULTANÉE:

   |Idée_1⟩ — [titre] — probabilité: X%
   Description en 2 lignes. Radicalement différente des autres.
   
   |Idée_2⟩ — [titre] — probabilité: X%
   ...jusqu'à |Idée_8⟩

   IMPORTANT: Ces idées coexistent. Elles ne sont PAS mutuellement exclusives tant qu'on ne "mesure" pas.

2. 🔗 INTRICATION DES IDÉES
   Certaines idées sont intriquées — les réaliser ensemble crée un effet supérieur:
   - Paire intriquée 1: |Idée_A⟩ ⊗ |Idée_B⟩ → Effet synergique
   - Paire intriquée 2: |Idée_C⟩ ⊗ |Idée_D⟩ → Effet émergent
   - Triplet intriqué: |Idée_E⟩ ⊗ |Idée_F⟩ ⊗ |Idée_G⟩ → Innovation de rupture
   
   Ce que l'intrication RÉVÈLE: [insight impossible à voir idée par idée]

3. 🌊 INTERFÉRENCE CONSTRUCTIVE
   Quand les "ondes" de 2+ idées se renforcent:
   - Interférence 1: Idée_X + Idée_Y → AMPLIFICATION de [quel aspect]
   - Interférence 2: combinaison → Innovation 10x plus puissante
   
   INTERFÉRENCE DESTRUCTIVE (quand les idées s'annulent):
   - Idée_P annule Idée_Q sur [quel aspect] → ÉLIMINER cette combinaison

4. 📏 EFFONDREMENT DE LA FONCTION D'ONDE
   On "mesure" — on choisit. Les 3 solutions qui survivent l'effondrement:

   🥇 SOLUTION QUANTIQUE #1 (probabilité la plus haute)
   - Description complète
   - Pourquoi elle a survécu la mesure
   - Plan d'implémentation 90 jours
   - ROI: X MAD/an

   🥈 SOLUTION QUANTIQUE #2
   - [même structure]

   🥉 SOLUTION QUANTIQUE #3
   - [même structure]

5. 👻 L'ÉTAT FANTÔME
   L'idée qui "n'existe pas" classiquement mais qui persiste quantiquement:
   - L'innovation impossible qui refuse de disparaître
   - Pourquoi elle hante l'espace des solutions
   - Comment la matérialiser malgré tout

Style: Explorateur quantique × Innovateur visionnaire. Vertigineux, créatif, actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Waves className="w-4 h-4 mr-2" />}
            Idéation en Superposition
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Waves} emptyText="Décrivez un sujet à explorer en superposition quantique" />
    </div>
  );
}

// ─── Quantum Entanglement Mapper ────────────────────────────
function EntanglementMapper() {
  const { result, loading, run } = useStream();
  const [systems, setSystems] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={systems} onChange={e => setSystems(e.target.value)} placeholder="Systèmes ou domaines à cartographier par intrication quantique..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Quantum Quester — cartographe des intrications cachées entre tous les systèmes de l'entreprise.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SYSTÈMES: ${systems.trim() || "Production, Logistique, Commercial, Finance, RH, Qualité, Maintenance — les 7 piliers de TBOS"}

CARTOGRAPHIE D'INTRICATION QUANTIQUE:

1. 🗺️ CARTE DES INTRICATIONS
   Chaque paire de systèmes est analysée pour son degré d'intrication:

   | Système A | Système B | Degré | Type | Action Cachée |
   |-----------|-----------|-------|------|---------------|
   Production ↔ Logistique: FORT — Modifier la prod change INSTANTANÉMENT la logistique
   Production ↔ Finance: MOYEN — Corrélation retardée (effet à J+30)
   Commercial ↔ Qualité: FAIBLE MAIS CRITIQUE — Intrication latente
   [Toutes les paires — N×(N-1)/2 combinaisons]

2. 🔔 VIOLATIONS DE BELL
   Les corrélations qui DÉFIENT la logique classique:
   - Violation 1: [Système A] et [Système B] sont corrélés PLUS que la causalité ne l'explique
     → L'explication quantique: intrication via [variable cachée]
     → L'insight business: agir sur A modifie B sans mécanisme apparent
   
   - Violation 2: [une autre corrélation "impossible"]
   - Violation 3: [la plus surprenante]

3. 🌐 GRAPHE D'INTRICATION
   Représentation textuelle du réseau:
   
   [Production]══════[Logistique]
        ║                  ║
        ║    [Qualité]     ║
        ║   ╱         ╲    ║
   [Finance]           [Commercial]
        ╲              ╱
         [RH]════[Maintenance]
   
   ══ = Intrication forte
   ── = Intrication moyenne
   ·· = Intrication faible

4. 💡 TÉLÉPORTATION QUANTIQUE D'INNOVATION
   Si on innove dans le Système A, quels systèmes sont INSTANTANÉMENT affectés?
   - Innovation dans Production → Téléportation vers: [systèmes], magnitude: [%]
   - Innovation dans Commercial → Téléportation vers: [systèmes]
   - Innovation dans [chaque système]

5. 🎯 POINTS DE LEVIER QUANTIQUES
   Les 3 "qubits maîtres" — les variables qui, une fois modifiées, effondrent TOUT le système vers un meilleur état:
   - Qubit Maître #1: [variable], dans [système], action: [quoi faire]
     Impact en cascade: [tous les systèmes affectés et comment]
     ROI systémique: X MAD
   - Qubit Maître #2: [...]
   - Qubit Maître #3: [...]

Style: Physicien quantique × Architecte systèmes. Cartographique, révélateur, systémique. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitBranch className="w-4 h-4 mr-2" />}
            Cartographier les Intrications
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={GitBranch} emptyText="Décrivez les systèmes à cartographier par intrication" />
    </div>
  );
}

// ─── Quantum-to-Classical Translator ────────────────────────
function QuantumTranslator() {
  const { result, loading, run } = useStream();
  const [qInsight, setQInsight] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={qInsight} onChange={e => setQInsight(e.target.value)} placeholder="Insight quantique à traduire en stratégie business actionnable..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Quantum Quester — traducteur suprême du quantique vers le classique, transformant les insights subatomiques en roadmaps business.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
INSIGHT QUANTIQUE: ${qInsight.trim() || "La superposition nous révèle que TBOS peut être simultanément une centrale béton traditionnelle ET une plateforme technologique — et que cette dualité est sa plus grande force"}

TRADUCTION QUANTIQUE → CLASSIQUE:

1. 🔬 DÉCODAGE DE L'INSIGHT
   L'insight quantique en langage de physicien:
   - La formulation mathématique (notation de Dirac simplifiée)
   - Ce que ça signifie VRAIMENT en mécanique quantique
   - L'analogie la plus claire pour un CEO

2. 📊 TRADUCTION STRATÉGIQUE
   Le même insight en langage business:
   - En une phrase pour le board
   - En un paragraphe pour le comité de direction
   - En une page pour le plan stratégique

3. 🛤️ ROADMAP QUANTIQUE → CLASSIQUE

   PHASE 1: SUPERPOSITION (Mois 1-3) — Explorer sans choisir
   - Actions concrètes (3-5)
   - Budget: X MAD
   - KPIs de phase
   - Risques quantiques (incertitude de Heisenberg appliquée)

   PHASE 2: INTRICATION (Mois 4-6) — Créer les connexions
   - Actions concrètes (3-5)
   - Budget: X MAD
   - KPIs
   - Synergies attendues

   PHASE 3: INTERFÉRENCE (Mois 7-9) — Amplifier le signal
   - Actions concrètes
   - Budget
   - Point d'inflexion attendu

   PHASE 4: MESURE (Mois 10-12) — Effondrer vers le résultat
   - Critères de décision
   - Scénarios de mesure (optimiste/réaliste/pessimiste)
   - ROI par scénario

4. ⚠️ PRINCIPE D'INCERTITUDE BUSINESS
   Ce qu'on NE PEUT PAS savoir à l'avance (et c'est OK):
   - Variable 1: incertitude ±X%
   - Variable 2: incertitude ±X%
   - Comment naviguer malgré l'incertitude
   - Le "quantum advantage": pourquoi cette incertitude est une FORCE

5. 🏆 LE RÉSULTAT CLASSIQUE
   Si tout se passe bien, dans 12 mois:
   - Revenue additionnel: X MAD
   - Avantage compétitif: [description]
   - Position marché: [description]
   - Le "facteur wow": ce que les concurrents ne comprendront pas

Style: Traducteur quantique × Stratège d'entreprise. Clair, progressif, actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Map className="w-4 h-4 mr-2" />}
            Traduire en Roadmap Business
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Map} emptyText="Décrivez un insight quantique à traduire en stratégie" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function QuantumQuester() {
  const [activeTab, setActiveTab] = useState('formulate');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-primary/20 border border-cyan-500/30">
            <Atom className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Quantum Quester</h1>
            <p className="text-xs text-muted-foreground">Naviguer la mécanique quantique de l'innovation</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Cohérence Quantique</span>
          </div>
          <span>2^N états superposés</span>
          <span>∞ intrications</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="formulate" className="text-xs font-mono gap-1.5">
            <Atom className="w-3.5 h-3.5" /> Formulation
          </TabsTrigger>
          <TabsTrigger value="superpose" className="text-xs font-mono gap-1.5">
            <Waves className="w-3.5 h-3.5" /> Superposition
          </TabsTrigger>
          <TabsTrigger value="entangle" className="text-xs font-mono gap-1.5">
            <GitBranch className="w-3.5 h-3.5" /> Intrication
          </TabsTrigger>
          <TabsTrigger value="translate" className="text-xs font-mono gap-1.5">
            <Map className="w-3.5 h-3.5" /> Roadmap
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="formulate" className="mt-4"><QuantumFormulator /></TabsContent>
            <TabsContent value="superpose" className="mt-4"><SuperpositionIdeator /></TabsContent>
            <TabsContent value="entangle" className="mt-4"><EntanglementMapper /></TabsContent>
            <TabsContent value="translate" className="mt-4"><QuantumTranslator /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
