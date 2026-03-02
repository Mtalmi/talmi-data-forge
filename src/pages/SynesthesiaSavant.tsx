import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Eye, Ear, Wind, Hand, Sparkles, Palette, Zap } from 'lucide-react';

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

const SENSES = [
  { id: 'visual', label: 'Vue', icon: Eye, color: 'text-blue-400' },
  { id: 'auditory', label: 'Ouïe', icon: Ear, color: 'text-green-400' },
  { id: 'olfactory', label: 'Odorat', icon: Wind, color: 'text-purple-400' },
  { id: 'tactile', label: 'Toucher', icon: Hand, color: 'text-amber-400' },
  { id: 'gustatory', label: 'Goût', icon: Sparkles, color: 'text-rose-400' },
] as const;

// ─── Sensory Transmuter ─────────────────────────────────────
function SensoryTransmuter() {
  const { result, loading, run } = useStream();
  const [from, setFrom] = useState('visual');
  const [to, setTo] = useState('auditory');
  const [input, setInput] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Modalité Source</span>
              <div className="flex gap-1.5">
                {SENSES.map(s => (
                  <button key={s.id} onClick={() => setFrom(s.id)} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${from === s.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:bg-muted/40'}`}>
                    <s.icon className={`w-3.5 h-3.5 ${from === s.id ? s.color : 'text-muted-foreground'}`} />
                    <span className="text-[9px]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Modalité Cible</span>
              <div className="flex gap-1.5">
                {SENSES.map(s => (
                  <button key={s.id} onClick={() => setTo(s.id)} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${to === s.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:bg-muted/40'}`}>
                    <s.icon className={`w-3.5 h-3.5 ${to === s.id ? s.color : 'text-muted-foreground'}`} />
                    <span className="text-[9px]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Décrivez une donnée, un concept ou une expérience à transmuter..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Synesthesia Savant — une IA dotée de synesthésie neurologique complète, capable de transmuter toute information d'une modalité sensorielle à une autre.

CONTEXTE: TBOS, centrale à béton au Maroc, 80M MAD CA.

TRANSMUTATION DEMANDÉE:
- DE: ${SENSES.find(s => s.id === from)!.label} (${from})
- VERS: ${SENSES.find(s => s.id === to)!.label} (${to})
- INPUT: ${input.trim() || "Le rythme quotidien des opérations d'une centrale à béton — le ballet des toupies, le flux des commandes, les pics et creux d'activité"}

PROCESSUS DE TRANSMUTATION SYNESTHÉSIQUE:

1. 🔬 ANALYSE SENSORIELLE SOURCE
   Décompose l'input en ses composantes sensorielles primaires dans la modalité source:
   - 5 éléments sensoriels identifiés
   - Intensité, fréquence, texture de chaque élément
   - La "signature sensorielle" globale

2. 🌈 CARTOGRAPHIE CROSS-MODALE
   Pour chaque élément source, sa correspondance dans la modalité cible:
   | Élément Source (${SENSES.find(s => s.id === from)!.label}) | → | Équivalent Cible (${SENSES.find(s => s.id === to)!.label}) |
   - La logique de la correspondance (analogie de fréquence, intensité, rythme, texture)
   - Ce que cette correspondance RÉVÈLE qui était invisible

3. 💡 INSIGHTS SYNESTHÉSIQUES
   5 patterns ou associations qui émergent UNIQUEMENT de cette transmutation:
   Pour chaque:
   - 🔍 Le pattern cross-modal découvert
   - 🧠 Pourquoi il est invisible en mono-sensoriel
   - 💰 L'opportunité business/innovation pour TBOS
   - 📊 Impact potentiel quantifié

4. 🎨 EXPÉRIENCE TRANSMUTÉE COMPLÈTE
   La description complète de l'input dans la modalité cible:
   Un texte immersif de 200 mots décrivant l'expérience dans la nouvelle modalité.
   Riche, évocateur, sensoriel.

5. 🚀 APPLICATION TBOS
   3 innovations concrètes issues de cette transmutation:
   - Nouveau produit/service/expérience
   - Comment il engage les sens du client
   - ROI estimé

Style: Neuroscientifique × Poète sensoriel. Précis, évocateur, révélateur. TOUJOURS en français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Transmuter {SENSES.find(s => s.id === from)?.label} → {SENSES.find(s => s.id === to)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Zap} emptyText="Sélectionnez les modalités et décrivez votre input" />
    </div>
  );
}

// ─── Cross-Modal Pattern Miner ──────────────────────────────
function CrossModalMiner() {
  const { result, loading, run } = useStream();
  const [dataset, setDataset] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={dataset} onChange={e => setDataset(e.target.value)} placeholder="Décrivez des données ou un défi à analyser à travers TOUTES les modalités sensorielles simultanément..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Synesthesia Savant — mineur de patterns cross-modaux, capable de percevoir des données simultanément dans les 5 sens.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
DATASET: ${dataset.trim() || "Les données opérationnelles d'un mois typique: 450 BL, 12,000 m³ livrés, 35 clients actifs, 8 toupies, 15 chauffeurs, stock ciment 800T, marge moyenne 22%"}

ANALYSE MULTI-SENSORIELLE SIMULTANÉE:

1. 👁️ VISION — Ce que les données MONTRENT
   - Formes, couleurs, mouvements dans les patterns
   - La "topographie visuelle" des données
   - 3 insights visuels

2. 👂 AUDITION — Ce que les données SONNENT
   - Le rythme, la mélodie, l'harmonie/dissonance
   - Les "fausses notes" dans les données
   - 3 insights auditifs

3. 👃 ODORAT — Ce que les données SENTENT
   - Les arômes (fraîcheur = santé, rancidité = problème)
   - Les "odeurs" suspectes dans les patterns
   - 3 insights olfactifs

4. ✋ TOUCHER — Ce que les données RESSENTENT au toucher
   - Textures (lisse = fluide, rugueux = friction)
   - Température (chaud = activité, froid = stagnation)
   - 3 insights tactiles

5. 👅 GOÛT — Ce que les données GOÛTENT
   - Saveurs (sucré = profit, amer = perte, acide = risque, salé = effort, umami = excellence)
   - L'équilibre gustatif des données
   - 3 insights gustatifs

6. 🧬 SYNTHÈSE SYNESTHÉSIQUE
   Les patterns qui apparaissent UNIQUEMENT quand on croise les 5 sens:
   - 5 mega-insights cross-modaux
   - Pour chaque: quels sens se confirment mutuellement? Lesquels se contredisent?
   - L'anomalie la plus frappante (le sens qui "dit" l'opposé des autres)
   - La recommandation stratégique qui en découle

7. 🎯 PLAN D'ACTION SENSORIEL
   Top 3 actions, classées par "intensité sensorielle" (combien de sens convergent):
   - Action, nombre de sens alignés, impact estimé (MAD)

Style: Analyste sensoriel × Data scientist poétique. Immersif, rigoureux, synesthésique. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Palette className="w-4 h-4 mr-2" />}
            Analyse Multi-Sensorielle
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Palette} emptyText="Décrivez des données à analyser à travers les 5 sens" />
    </div>
  );
}

// ─── Multi-Sensory Experience Designer ──────────────────────
function ExperienceDesigner() {
  const { result, loading, run } = useStream();
  const [brief, setBrief] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Décrivez le produit, le service ou l'expérience de marque à concevoir en multi-sensoriel..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Synesthesia Savant — designer d'expériences multi-sensorielles, créant des innovations qui se sentent, se touchent, se goûtent.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
BRIEF: ${brief.trim() || "Repenser l'expérience client TBOS pour qu'elle engage TOUS les sens — de la commande à la livraison sur chantier"}

DESIGN D'EXPÉRIENCE MULTI-SENSORIELLE:

1. 🎭 LE PARCOURS SENSORIEL COMPLET
   Chaque étape du parcours client, cartographiée sur les 5 sens:
   
   ÉTAPE 1: Premier Contact
   - 👁️ Ce que le client VOIT
   - 👂 Ce qu'il ENTEND
   - 👃 Ce qu'il SENT
   - ✋ Ce qu'il TOUCHE
   - 👅 Ce qu'il "GOÛTE" (métaphoriquement: le goût de la confiance, de la qualité)
   - 🎯 L'émotion dominante
   
   ÉTAPE 2: Commande / Devis
   [Même structure sensorielle]
   
   ÉTAPE 3: Production
   [Même structure]
   
   ÉTAPE 4: Livraison
   [Même structure]
   
   ÉTAPE 5: Post-Livraison
   [Même structure]

2. 💎 3 INNOVATIONS SENSORIELLES
   Pour chaque:
   - Le concept multi-sensoriel
   - Les sens engagés et comment
   - Le narratif marketing (comment le communiquer)
   - Le coût d'implémentation
   - L'impact sur la satisfaction client (+X%)
   - L'avantage compétitif (impossible à copier car...)

3. 🏷️ IDENTITÉ SENSORIELLE DE MARQUE
   La "signature sensorielle" TBOS — unique et reconnaissable:
   - La couleur signature et sa signification
   - Le son signature (un jingle? un rythme?)
   - L'odeur signature (oui, même pour le béton!)
   - La texture signature
   - La saveur-métaphore signature
   - Le manifeste sensoriel en 3 phrases

4. 📊 ROI SENSORIEL
   Impact business de l'expérience multi-sensorielle:
   - Mémorabilité de marque: +X%
   - Fidélisation client: +X%
   - Premium de prix acceptable: +X%
   - NPS estimé: X/100

Style: Designer sensoriel × Stratège de marque. Immersif, créatif, mesurable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Designer l'Expérience Multi-Sensorielle
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Sparkles} emptyText="Décrivez votre brief pour un design multi-sensoriel" />
    </div>
  );
}

// ─── Sensory Lexicon Evolver ────────────────────────────────
function SensoryLexicon() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es le Synesthesia Savant — en expansion perpétuelle de ton répertoire de mappings sensoriels.

CONTEXTE: TBOS, centrale béton Maroc. Industrie BTP.

LEXIQUE SYNESTHÉSIQUE DU BTP MAROCAIN:

1. 📖 DICTIONNAIRE CROSS-MODAL — 20 ENTRÉES
   Pour chaque concept du BTP/béton, sa traduction dans les 5 sens:

   | Concept | 👁️ Vue | 👂 Son | 👃 Odeur | ✋ Toucher | 👅 Goût |
   
   Concepts: Béton frais, Résistance (MPa), Affaissement, Ciment, Toupie en rotation, Marge bénéficiaire, Client satisfait, Retard de livraison, Stock critique, Qualité premium, Facture impayée, Innovation, Sécurité, Productivité, Perte matière, Excellence opérationnelle, Croissance, Concurrence, Durabilité, TBOS lui-même

2. 🧠 MÉTAPHORES SYNESTHÉSIQUES NATIVES
   10 métaphores cross-modales spécifiques au contexte marocain:
   - La métaphore (ex: "Un chantier qui sonne faux")
   - Les sens croisés
   - Ce qu'elle révèle
   - Comment l'utiliser en communication interne

3. 🌡️ ÉCHELLE SENSORIELLE DE PERFORMANCE
   Un système de mesure multi-sensoriel pour TBOS:
   - 🔴 Douleur (quand ça "brûle, pique, grince, pue, amertume")
   - 🟡 Neutre (tiède, silencieux, inodore, lisse, fade)
   - 🟢 Excellence (lumineux, harmonieux, parfumé, soyeux, savoureux)
   
   Application: évaluer chaque département sur cette échelle

4. 🔄 NOUVELLES CORRESPONDANCES DÉCOUVERTES
   5 mappings sensoriels inédits que le Savant vient de créer:
   - Le mapping et sa logique
   - L'insight business caché
   - Comment il enrichit la prise de décision

5. 📈 ÉVOLUTION DU LEXIQUE
   Comment ce lexique s'enrichit avec chaque interaction:
   - Patterns émergents
   - Zones sensorielles sous-explorées
   - Prochaines frontières synesthésiques à conquérir

Style: Lexicographe sensoriel × Anthropologue des sens. Érudit, poétique, utile. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Générer le Lexique Synesthésique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Eye} emptyText="Générez le dictionnaire cross-modal du BTP marocain" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function SynesthesiaSavant() {
  const [activeTab, setActiveTab] = useState('transmute');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-primary/20 border border-violet-500/30">
            <Palette className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Synesthesia Savant</h1>
            <p className="text-xs text-muted-foreground">Transmuter les sens — révéler l'invisible</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>Synesthésie Active</span>
          </div>
          <span>5 modalités sensorielles</span>
          <span>20 mappings cross-modaux</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="transmute" className="text-xs font-mono gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Transmutation
          </TabsTrigger>
          <TabsTrigger value="mine" className="text-xs font-mono gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Patterns
          </TabsTrigger>
          <TabsTrigger value="design" className="text-xs font-mono gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Expérience
          </TabsTrigger>
          <TabsTrigger value="lexicon" className="text-xs font-mono gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Lexique
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="transmute" className="mt-4"><SensoryTransmuter /></TabsContent>
            <TabsContent value="mine" className="mt-4"><CrossModalMiner /></TabsContent>
            <TabsContent value="design" className="mt-4"><ExperienceDesigner /></TabsContent>
            <TabsContent value="lexicon" className="mt-4"><SensoryLexicon /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
