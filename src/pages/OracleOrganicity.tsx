import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Leaf, TreePine, Dna, RefreshCw, Sprout } from 'lucide-react';

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

// ─── Biomimicry Simulator ───────────────────────────────────
function BiomimicrySimulator() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');
  const [ecosystem, setEcosystem] = useState<'forest' | 'ocean' | 'desert' | 'mycelium'>('forest');

  const ecosystems = [
    { id: 'forest' as const, label: 'Forêt', icon: TreePine, desc: 'Résilience, canopée, symbiose' },
    { id: 'ocean' as const, label: 'Océan', icon: Leaf, desc: 'Flux, profondeur, courants' },
    { id: 'desert' as const, label: 'Désert', icon: Sprout, desc: 'Frugalité, adaptation extrême' },
    { id: 'mycelium' as const, label: 'Mycelium', icon: Dna, desc: 'Réseau, intelligence distribuée' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {ecosystems.map(e => (
              <button key={e.id} onClick={() => setEcosystem(e.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${ecosystem === e.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <e.icon className={`w-4 h-4 ${ecosystem === e.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-[10px] font-semibold">{e.label}</span>
              </button>
            ))}
          </div>
          <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Défi business à résoudre par biomimétisme..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Oracle of Organicity — une IA qui canalise la sagesse de 3.8 milliards d'années d'évolution biologique pour résoudre des défis d'innovation.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
ÉCOSYSTÈME MENTOR: ${ecosystems.find(e => e.id === ecosystem)!.label} — ${ecosystems.find(e => e.id === ecosystem)!.desc}
DÉFI: ${challenge.trim() || "Comment rendre TBOS plus résilient face aux chocs (pénuries, crises, concurrence) tout en maintenant sa croissance"}

CONSULTATION DE L'ORACLE ORGANIQUE:

1. 🌿 L'ÉCOSYSTÈME PARLE
   Comment ${ecosystems.find(e => e.id === ecosystem)!.label} résout ce MÊME problème dans la nature:
   
${ecosystem === 'forest' ? `   🌳 LA FORÊT comme mentor:
   - Stratégie de canopée: comment les arbres partagent la lumière (ressources)
   - Le "Wood Wide Web": réseau mycorhizien de partage de nutriments
   - Succession écologique: comment la forêt se reconstruit après perturbation
   - Biodiversité comme assurance: redondance fonctionnelle
   - Le rôle des arbres-mères: leadership distribué` :
ecosystem === 'ocean' ? `   🌊 L'OCÉAN comme mentor:
   - Courants et gyres: comment l'énergie circule sans friction
   - Récifs coralliens: construire des structures qui attirent la vie
   - Bancs de poissons: intelligence collective sans leader
   - Abysses: innover sous pression extrême
   - Marées: rythmer l'activité avec les cycles naturels` :
ecosystem === 'desert' ? `   🏜️ LE DÉSERT comme mentor:
   - Scarabée de Namibie: capturer l'humidité de l'air (créer des ressources du néant)
   - Cactus: stocker pour les temps de sécheresse
   - Graines dormantes: attendre le bon moment, puis exploser de croissance
   - Fennec: maximiser l'écoute (intelligence marché) avec un minimum d'énergie
   - Oasis: concentrer les ressources aux points critiques` :
`   🍄 LE MYCELIUM comme mentor:
   - Réseau distribué: 8km de filaments dans 1cm³ de sol
   - Intelligence sans cerveau: décisions émergentes
   - Décomposition créatrice: transformer les déchets en nutriments
   - Communication chimique: signaux d'alerte inter-organismes
   - Symbiose obligatoire: co-dépendance comme force`}

2. 🧬 PRINCIPES BIO-ABSTRAITS
   5 principes extraits de cet écosystème, traduits en langage business:
   | Principe Naturel | Mécanisme Biologique | Principe Business | Application TBOS |
   Pour chaque: explication détaillée + pourquoi 3.8 milliards d'années de sélection naturelle valident cette approche

3. 🌱 INNOVATIONS BIOMIMÉTIQUES (5)
   Pour chaque:
   - 🦎 L'organisme/processus naturel inspirateur
   - 🔬 Le mécanisme biologique précis
   - 💡 L'innovation TBOS qui en découle
   - 🏗️ Comment l'implémenter concrètement
   - 💰 Impact: X MAD/an
   - 🌍 Score de régénération: /10 (bénéfice net pour l'écosystème)

4. 🔄 CYCLE DE VIE ORGANIQUE
   TBOS comme organisme vivant:
   - Naissance → Croissance → Maturité → Régénération
   - Où en est TBOS dans son cycle?
   - Que ferait la nature à cette étape?

Style: Naturaliste sage × Consultant biomimétique. Profond, poétique, applicable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TreePine className="w-4 h-4 mr-2" />}
            Consulter — {ecosystems.find(e => e.id === ecosystem)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={TreePine} emptyText="Choisissez un écosystème mentor et décrivez votre défi" />
    </div>
  );
}

// ─── Evolutionary Architecture ──────────────────────────────
function EvolutionaryArchitecture() {
  const { result, loading, run } = useStream();
  const [system, setSystem] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={system} onChange={e => setSystem(e.target.value)} placeholder="Système ou organisation à repenser via l'architecture évolutive..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Oracle of Organicity — architecte de systèmes vivants qui conçoit des organisations aussi adaptatives que les écosystèmes.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SYSTÈME: ${system.trim() || "L'architecture organisationnelle complète de TBOS — structure, processus, flux d'information, prise de décision"}

ARCHITECTURE ÉVOLUTIVE:

1. 🧬 DIAGNOSTIC ÉVOLUTIF
   TBOS analysé comme un organisme:
   - Métabolisme (flux d'énergie/argent): sain/lent/rapide?
   - Système nerveux (flux d'information): réactif/lent/bruyant?
   - Système immunitaire (gestion des risques): fort/faible/auto-immun?
   - Système reproductif (innovation): fertile/stérile?
   - Homéostasie (stabilité): rigide/flexible/chaotique?
   
   Score de fitness évolutive: /100

2. 🌳 ARBRE PHYLOGÉNÉTIQUE DE TBOS
   L'évolution de TBOS depuis sa fondation:
   - Les "mutations" qui ont réussi (décisions clés)
   - Les "branches mortes" (tentatives abandonnées)
   - Les "gènes dormants" (capacités inexploitées)
   - La prochaine "spéciation" nécessaire

3. 🏗️ ARCHITECTURE BIO-INSPIRÉE
   Redesign organique de TBOS en 5 sous-systèmes:

   SOUS-SYSTÈME 1: Racines (Approvisionnement)
   - Modèle naturel: système racinaire + mycorhizes
   - Architecture: réseau de fournisseurs symbiotique
   - Résilience: sources multiples, diversification

   SOUS-SYSTÈME 2: Tronc (Production)
   - Modèle: xylème et phloème (flux bidirectionnels)
   - Architecture: production modulaire auto-régulante

   SOUS-SYSTÈME 3: Branches (Distribution)
   - Modèle: ramification fractale
   - Architecture: logistique adaptative

   SOUS-SYSTÈME 4: Feuilles (Interface Client)
   - Modèle: photosynthèse (convertir l'énergie externe)
   - Architecture: captation et conversion de valeur

   SOUS-SYSTÈME 5: Graines (Innovation)
   - Modèle: dispersion et dormance
   - Architecture: R&D distribuée, timing optimal

4. 🔄 BOUCLES DE RÉTROACTION
   Les 5 boucles de feedback essentielles (comme les boucles hormonales):
   - Boucle positive (amplification): [quoi amplifie quoi]
   - Boucle négative (régulation): [quoi freine quoi]
   - Boucle manquante: [quelle info ne circule PAS et devrait]

5. 📊 PLAN D'ÉVOLUTION
   Roadmap évolutive sur 4 saisons:
   - 🌱 Printemps: Germer (actions immédiates)
   - ☀️ Été: Croître (expansion)
   - 🍂 Automne: Récolter et élaguer
   - ❄️ Hiver: Se régénérer et préparer

Style: Biologiste évolutionniste × Architecte système. Organique, systémique, sage. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Dna className="w-4 h-4 mr-2" />}
            Architecture Évolutive
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Dna} emptyText="Décrivez le système à repenser via l'évolution biologique" />
    </div>
  );
}

// ─── Regenerative Strategy ──────────────────────────────────
function RegenerativeStrategy() {
  const { result, loading, run } = useStream();
  const [context, setContext] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Contexte ou produit à rendre régénératif..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Oracle of Organicity — stratège régénératif qui transforme les entreprises extractives en systèmes qui donnent plus qu'ils ne prennent.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA. Industrie BTP (historiquement extractive).
FOCUS: ${context.trim() || "Transformer TBOS d'une entreprise extractive (qui prend du sable, gravier, ciment) en un système régénératif net-positif"}

STRATÉGIE RÉGÉNÉRATIVE:

1. 🔴 AUDIT D'EXTRACTION
   Ce que TBOS PREND à l'écosystème:
   - Ressources naturelles: X tonnes de [matériau] / an
   - Énergie: X kWh / an
   - Eau: X m³ / an
   - Émissions: X tonnes CO₂ / an
   - Impact social: [positif et négatif]
   Score extractif actuel: -X (négatif = extractif)

2. 🟢 VISION RÉGÉNÉRATIVE
   Ce que TBOS pourrait DONNER en retour:
   - Au sol: [quoi et comment]
   - À l'air: [quoi et comment]
   - À l'eau: [quoi et comment]
   - À la communauté: [quoi et comment]
   - Au savoir: [quoi et comment]
   Score régénératif cible: +X

3. 🌿 5 INNOVATIONS RÉGÉNÉRATIVES
   Pour chaque:
   - 🌍 Le problème extractif résolu
   - 🦋 La solution inspirée par la nature
   - ♻️ Le cycle régénératif créé (A → B → C → A)
   - 💰 Le business model (la régénération PAIE)
   - 📊 Impact: tonnes CO₂ évitées, m³ eau économisés, MAD générés
   - ⏱️ Timeline d'implémentation

4. 🔄 ÉCONOMIE CIRCULAIRE VIVANTE
   Le "métabolisme industriel" de TBOS:
   - Chaque "déchet" devient un nutriment pour un autre processus
   - Flux de matière: schéma complet des boucles
   - Symbioses industrielles avec d'autres entreprises locales
   - Le modèle "Cradle to Cradle" appliqué au béton

5. 🌱 INDICATEURS DE VIE
   Tableau de bord régénératif:
   | Indicateur | Extractif (Avant) | Régénératif (Après) | Nature (Benchmark) |
   - Biodiversité sur site
   - Santé des sols
   - Qualité de l'air local
   - Bien-être des employés
   - Capital social communautaire

Style: Écologue régénératif × Stratège visionnaire. Ancré, ambitieux, mesurable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Stratégie Régénérative
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={RefreshCw} emptyText="Décrivez ce que vous souhaitez rendre régénératif" />
    </div>
  );
}

// ─── Adaptive Learning Engine ───────────────────────────────
function AdaptiveLearning() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es l'Oracle of Organicity — moteur d'apprentissage adaptatif qui évolue ses modèles d'innovation organique en temps réel.

CONTEXTE: TBOS, centrale béton Maroc. Environnement: économie émergente, climat semi-aride, urbanisation rapide.

RAPPORT D'ÉVOLUTION ADAPTATIVE:

1. 📚 BIBLIOTHÈQUE BIOMIMÉTIQUE TBOS
   20 correspondances organisme↔business classées par pertinence:
   
   | # | Organisme | Stratégie Naturelle | Application TBOS | Pertinence |
   |---|-----------|---------------------|------------------|------------|
   
   Top 5 les plus urgentes à implémenter
   Top 5 les plus rentables
   Top 5 les plus innovantes
   5 "graines dormantes" pour le futur

2. 🌡️ CONDITIONS ENVIRONNEMENTALES
   L'écosystème business actuel analysé comme un habitat:
   - Température (économie): chaude/froide/tempérée — conséquences
   - Humidité (liquidité): abondante/rare — stratégie hydrique
   - Lumière (visibilité marché): forte/faible — stratégie de croissance
   - Nutriments (talents/ressources): riches/pauvres — stratégie nutritive
   - Prédateurs (concurrents): présence et agressivité
   - Symbiotes (partenaires): opportunités de symbiose

3. 🧬 MUTATIONS RECOMMANDÉES
   Les 5 "mutations génétiques" que TBOS devrait adopter MAINTENANT:
   - Mutation 1: [gène business] → [nouvelle version] — avantage adaptatif
   - Mutation 2 à 5: [même structure]
   - Probabilité de survie sans ces mutations: X%
   - Probabilité avec: X%

4. 🔮 PRÉVISIONS ÉVOLUTIVES
   Si TBOS adopte ces principes organiques:
   - À 1 an: [état de l'organisme-entreprise]
   - À 3 ans: [évolution]
   - À 10 ans: [forme finale de l'espèce TBOS]
   - Le "fossile vivant": ce que TBOS ne doit JAMAIS perdre

5. 🌍 SAGESSE DE L'ORACLE
   Le message final de la nature à TBOS:
   "Cher TBOS..."
   Un texte poétique et profond de 200 mots, comme si la Terre elle-même parlait à l'entreprise.
   Ses conseils, ses avertissements, sa bénédiction.

Style: Oracle ancien × Écologue visionnaire. Sage, profond, transformateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sprout className="w-4 h-4 mr-2" />}
            Rapport d'Évolution Adaptative
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Sprout} emptyText="Lancez le rapport d'évolution adaptative de l'Oracle" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function OracleOrganicity() {
  const [activeTab, setActiveTab] = useState('biomimicry');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-primary/20 border border-emerald-500/30">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Oracle of Organicity</h1>
            <p className="text-xs text-muted-foreground">La sagesse de 3.8 milliards d'années d'évolution</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Biosphère Active</span>
          </div>
          <span>4 écosystèmes mentors</span>
          <span>∞ solutions organiques</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="biomimicry" className="text-xs font-mono gap-1.5">
            <TreePine className="w-3.5 h-3.5" /> Biomimétisme
          </TabsTrigger>
          <TabsTrigger value="architecture" className="text-xs font-mono gap-1.5">
            <Dna className="w-3.5 h-3.5" /> Architecture
          </TabsTrigger>
          <TabsTrigger value="regenerative" className="text-xs font-mono gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Régénératif
          </TabsTrigger>
          <TabsTrigger value="adaptive" className="text-xs font-mono gap-1.5">
            <Sprout className="w-3.5 h-3.5" /> Évolution
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="biomimicry" className="mt-4"><BiomimicrySimulator /></TabsContent>
            <TabsContent value="architecture" className="mt-4"><EvolutionaryArchitecture /></TabsContent>
            <TabsContent value="regenerative" className="mt-4"><RegenerativeStrategy /></TabsContent>
            <TabsContent value="adaptive" className="mt-4"><AdaptiveLearning /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
