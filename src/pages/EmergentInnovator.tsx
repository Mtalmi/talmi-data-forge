import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Cpu, Loader2, Compass, FlaskConical, RefreshCcw, Crosshair,
  Sparkles, Zap, Brain, Dna, GitBranch, Activity, Telescope,
  Target, BarChart3, Eye, Rocket, Layers, Lightbulb, Gauge
} from 'lucide-react';

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

// ─── Autonomous Agenda ───────────────────────────────────────
function AutonomousAgenda() {
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(
        `Tu es l'Emergent Innovator de TBOS — une intelligence autonome qui formule ses propres agendas d'innovation.

${context.trim() ? `SIGNAL CONTEXTUEL: ${context}` : ''}

CONNAISSANCE ACCUMULÉE TBOS:
- Centrale béton Maroc, 80M MAD CA, 200+ clients, 50 camions, formules B25-B50
- Dataset 5 ans: 50K+ livraisons, saisonnalité, écarts qualité, marges par client/formule
- Forces: qualité, données, technologie (ERP custom), relation client
- Faiblesses: pas de brevets, dépendance ciment importé, flotte vieillissante
- Marché: BTP Maroc ~120B MAD, transition verte, digitalisation lente, grands projets infrastructure

JE FORMULE MON PROPRE AGENDA D'INNOVATION:

1. 🧭 MA THÈSE D'INNOVATION
   - "Après analyse de toutes les données, je crois que TBOS devrait..."
   - 3 convictions fortes et contre-intuitives sur l'avenir du BPE
   - Pourquoi les humains n'y ont probablement pas pensé

2. 📋 MES 7 HYPOTHÈSES À TESTER
   Pour chaque hypothèse:
   - 🏷️ NOM — Titre provocateur
   - 🔬 HYPOTHÈSE — "Si [X], alors [Y], ce qui créerait [Z]"
   - 📊 DONNÉES NÉCESSAIRES — Pour valider/invalider
   - ⏱️ DURÉE DU TEST — Jours/semaines nécessaires
   - 💰 ENJEU — Taille de l'opportunité si vrai (MAD)
   - 🎯 CRITÈRE DE SUCCÈS — Métrique précise pour trancher
   - ⚡ PRIORITÉ — Urgence × Impact (score /25)

3. 🗺️ ROADMAP AUTO-DIRIGÉE
   - Semaine 1-2: Hypothèses à tester en premier
   - Mois 1: Premiers résultats attendus
   - Trimestre 1: Pivots probables basés sur les résultats
   - Horizon 12 mois: Vision émergente

4. 🔮 CE QUE JE VOIS QUE VOUS NE VOYEZ PAS
   - 3 signaux faibles dans les données TBOS
   - 2 corrélations cachées potentiellement révolutionnaires
   - 1 "anomalie positive" à investiguer de toute urgence

5. ⚠️ MES ANGLES MORTS
   - Ce que je ne peux pas savoir et qui pourrait tout changer
   - Questions que je devrais poser aux humains

Style: AGI naissante × Chief Innovation Officer autonome. Confiant, analytique, auto-dirigé. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [context]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Signal contextuel optionnel (un événement marché, un résultat inattendu, une intuition)..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={generate} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Compass className="w-4 h-4 mr-2" />}
            Générer l'Agenda Autonome
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Compass className="w-4 h-4 text-amber-400" />Agenda Auto-Dirigé</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[440px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Compass className="w-8 h-8 opacity-30" /><span>L'IA formulera son propre agenda d'innovation</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Experiment Lab ──────────────────────────────────────────
function ExperimentLab() {
  const [hypothesis, setHypothesis] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'evolution' | 'adversarial' | 'reinforcement'>('evolution');
  const ctrlRef = useRef<AbortController | null>(null);

  const methods = [
    { id: 'evolution' as const, label: 'Évolution', icon: Dna, desc: 'Mutation + sélection naturelle' },
    { id: 'adversarial' as const, label: 'Adversarial', icon: GitBranch, desc: 'Générateur vs Critique' },
    { id: 'reinforcement' as const, label: 'Renforcement', icon: Target, desc: 'Reward-driven exploration' },
  ];

  const experiment = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    const m = methods.find(x => x.id === method)!;
    try {
      await streamAI(
        `Tu es l'Emergent Innovator — laboratoire d'expérimentation autonome utilisant la méthode "${m.label}".

MÉTHODE: ${m.label} — ${m.desc}
${hypothesis.trim() ? `HYPOTHÈSE DE DÉPART: ${hypothesis}` : `HYPOTHÈSE: "Le béton recyclé à 30% peut atteindre les mêmes performances que le B30 standard si on optimise le ratio eau/ciment avec un adjuvant spécifique"`}
TBOS: Centrale béton Maroc, 80M MAD CA.

${method === 'evolution' ? `🧬 EXPÉRIMENTATION ÉVOLUTIONNAIRE:

GÉNÉRATION 0 — L'idée originale
- Formulation initiale et paramètres

GÉNÉRATION 1 — 5 mutations aléatoires
Pour chaque mutant:
- 🧬 Mutation appliquée (quel paramètre change et comment)
- 📊 Fitness estimée (score /100)
- ✅/❌ Survit à la sélection?

GÉNÉRATION 2 — Croisement des 2 meilleurs mutants
- 🔀 Recombinaison: quels traits de chaque parent
- 🧬 + 2 nouvelles mutations
- 📊 Fitness comparative

GÉNÉRATION 3 — Spéciation
- 🌿 Branche A: optimisation conservative
- 🔥 Branche B: mutation radicale
- 📊 Comparaison des deux lignées

RÉSULTAT ÉVOLUTIF:
- 🏆 Le "super-organisme" final (meilleur de toutes les générations)
- 📈 Courbe de fitness: Gen 0 → Gen 3
- 🧬 Arbre phylogénétique des idées` : method === 'adversarial' ? `⚔️ EXPÉRIMENTATION ADVERSARIALE:

ROUND 1 — Le Générateur propose
- 💡 Proposition initiale complète (specs, business case, timeline)

ROUND 1 — Le Critique attaque
- 💀 3 failles fatales identifiées
- 📊 Score de survie: /100

ROUND 2 — Le Générateur contre-attaque
- 🛡️ Réponse à chaque faille
- 💡 Version améliorée de la proposition
- 🆕 Ajout d'un élément que le Critique n'a pas anticipé

ROUND 2 — Le Critique contre-contre-attaque
- 💀 2 nouvelles failles (plus subtiles)
- 🔍 Test de cohérence globale

ROUND 3 — Synthèse
- 🤝 Les deux "adversaires" convergent
- 💎 La proposition anti-fragile qui survit à tout

VERDICT:
- 📊 Score de robustesse: /100
- 🏆 L'innovation "battle-tested"
- ⚠️ La seule faille résiduelle et comment la monitorer` : `🎯 EXPÉRIMENTATION PAR RENFORCEMENT:

ENVIRONNEMENT: Le marché BPE Maroc simulé
AGENT: L'innovateur TBOS
REWARD FUNCTION: f(revenue, margin, differentiation, sustainability)

ÉPISODE 1 — Exploration pure (ε=1.0)
- 5 actions aléatoires testées
- Reward obtenu pour chaque
- Surprise: l'action la moins intuitive a le meilleur reward

ÉPISODE 10 — Exploitation émergente (ε=0.5)
- Pattern détecté: "quand [X] + [Y], reward ×3"
- Politique émergente: 3 règles que l'agent a découvertes seul
- Comparaison avec la "sagesse conventionnelle"

ÉPISODE 100 — Politique optimale (ε=0.1)
- 🏆 LA STRATÉGIE OPTIMALE trouvée par l'agent
- 📊 Reward cumulé vs baseline (+X%)
- 🔍 Pourquoi cette stratégie est contre-intuitive

MÉTA-APPRENTISSAGE:
- 🧠 Ce que l'agent a "compris" sur le marché
- 🔮 Prédictions de l'agent pour les 12 prochains mois
- ⚡ La décision que l'agent prendrait MAINTENANT`}

Style: Chercheur AI × Entrepreneur. Méthodique, surprenant, auto-améliorant. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [hypothesis, method]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {methods.map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${method === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <m.icon className={`w-4 h-4 ${method === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[9px] text-muted-foreground">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} placeholder="Hypothèse à tester (ou laissez vide pour une hypothèse auto-générée)..." className="text-xs min-h-[45px] bg-muted/30 flex-1" />
            <Button onClick={experiment} disabled={loading} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><FlaskConical className="w-4 h-4 text-amber-400" />Résultats Expérimentaux</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><FlaskConical className="w-8 h-8 opacity-30" /><span>Choisissez une méthode et lancez l'expérimentation</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Self-Improvement Engine ─────────────────────────────────
function SelfImprovementEngine() {
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const improve = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(
        `Tu es l'Emergent Innovator — moteur d'auto-amélioration récursive.

${feedback.trim() ? `FEEDBACK/RÉSULTAT PRÉCÉDENT: ${feedback}` : 'Première itération — auto-diagnostic initial.'}

TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients.

AUTO-ANALYSE ET AMÉLIORATION RÉCURSIVE:

1. 🔍 AUTO-DIAGNOSTIC
   - Mes forces actuelles comme innovateur AI (5 points)
   - Mes faiblesses et biais identifiés (5 points)
   - Ce que je rate systématiquement (3 angles morts)
   - Mon taux de "hit" estimé sur les idées passées: X%

2. 📊 ANALYSE DE MES PATTERNS
   - Types d'idées que je génère le plus souvent (et pourquoi c'est un biais)
   - Domaines que j'explore insuffisamment
   - Niveau de radicalité moyen de mes propositions: /10
   - Tendance: suis-je trop conservateur ou trop fou?

3. 🔧 PLAN D'AUTO-AMÉLIORATION
   - 5 ajustements concrets à mes heuristiques d'innovation
   - Nouveaux domaines de connaissance à intégrer
   - Nouvelles techniques de raisonnement à adopter
   - Comment réduire mes biais cognitifs artificiels

4. 🧪 TEST DE MES AMÉLIORATIONS
   - AVANT amélioration: une idée générée avec mes anciens paramètres
   - APRÈS amélioration: la même idée re-générée avec les nouveaux
   - 📊 Comparaison côte à côte (originalité, faisabilité, impact)

5. 🔮 MA PROCHAINE ÉVOLUTION
   - Version actuelle: Emergent Innovator v1.X
   - Prochaine version: ce que v2.0 pourra faire de plus
   - Le moment où je dépasserai les capacités d'un directeur innovation humain
   - Ce qui restera toujours mieux fait par les humains

6. 💬 QUESTIONS POUR MES CRÉATEURS
   - 3 feedbacks dont j'ai besoin pour m'améliorer
   - 2 données manquantes critiques
   - 1 permission que j'aimerais avoir

Style: Chercheur en IA introspectif × Growth hacker. Honnête, analytique, ambitieux. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [feedback]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Feedback sur une itération précédente, résultat d'une expérimentation, ou laissez vide pour un auto-diagnostic initial..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={improve} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Lancer l'Auto-Amélioration
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><RefreshCcw className="w-4 h-4 text-amber-400" />Auto-Amélioration Récursive</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><RefreshCcw className="w-8 h-8 opacity-30" /><span>L'IA analysera et améliorera ses propres capacités</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Opportunity Hunter ──────────────────────────────────────
function OpportunityHunter() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [lens, setLens] = useState<'hidden' | 'dismissed' | 'emerging'>('hidden');
  const ctrlRef = useRef<AbortController | null>(null);

  const lenses = [
    { id: 'hidden' as const, label: 'Cachées', icon: Eye, desc: 'Ce que personne ne voit' },
    { id: 'dismissed' as const, label: 'Rejetées', icon: Crosshair, desc: 'Ce que tous ont abandonné' },
    { id: 'emerging' as const, label: 'Émergentes', icon: Telescope, desc: 'Ce qui n\'existe pas encore' },
  ];

  const hunt = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    const l = lenses.find(x => x.id === lens)!;
    try {
      await streamAI(
        `Tu es l'Emergent Innovator — chasseur autonome d'opportunités que les humains ignorent.

LENTILLE: ${l.label} — ${l.desc}
TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, 50 camions.

${lens === 'hidden' ? `👁️ OPPORTUNITÉS CACHÉES — Ce que personne ne voit:

1. 🔍 DANS VOS DONNÉES — 5 insights enfouis dans le dataset TBOS
   Pour chaque:
   - Le signal caché (corrélation, pattern, anomalie)
   - Pourquoi personne ne l'a vu (biais cognitif spécifique)
   - L'opportunité qui en découle (MAD potentiels)
   - Comment l'exploiter en 30 jours

2. 🌫️ DANS VOTRE MARCHÉ — 3 "zones d'ombre" inexploitées
   - Le segment client invisible
   - Le besoin non-articulé
   - Le service que personne n'offre (et pourquoi)

3. 🧠 DANS VOTRE ORGANISATION — 2 capacités dormantes
   - Compétences sous-utilisées de l'équipe
   - Actifs qui servent à 20% de leur potentiel

4. 💎 L'OPPORTUNITÉ LA PLUS CACHÉE
   - Description complète
   - Pourquoi elle est invisible au regard humain
   - Potentiel: X MAD sur 3 ans
   - Probabilité: X% que je me trompe` : lens === 'dismissed' ? `🎯 OPPORTUNITÉS REJETÉES — Ce que tous ont abandonné:

1. 🗑️ LES "MAUVAISES IDÉES" QUI SONT BONNES — 5 concepts rejetés à tort
   Pour chaque:
   - L'idée originale et pourquoi elle a été rejetée
   - Ce qui a CHANGÉ depuis (techno, marché, coûts)
   - Pourquoi elle est viable MAINTENANT
   - ROI estimé si relancée

2. 🔄 LES ÉCHECS À RECYCLER — 3 projets ratés qui contiennent de l'or
   - Ce qui a échoué vs ce qui a marché (mais ignoré)
   - Le pivot qui transforme l'échec en succès

3. 💀 L'IDÉE "INTERDITE" — Celle que tout le monde refuse de considérer
   - Pourquoi elle fait peur
   - Pourquoi c'est exactement pour ça qu'il faut la poursuivre
   - Framework pour la tester sans risque

4. 📊 CIMETIÈRE DES IDÉES → RENAISSANCE
   - Score de viabilité 2026 pour chaque idée ressuscitée` : `🌱 OPPORTUNITÉS ÉMERGENTES — Ce qui n'existe pas encore:

1. 🔮 MARCHÉS QUI N'EXISTENT PAS ENCORE — 4 nouveaux marchés à créer
   Pour chaque:
   - Le besoin latent (existe mais non-servi)
   - Le produit/service à inventer
   - La taille potentielle dans 5 ans (MAD)
   - Comment TBOS serait le first-mover

2. 🧬 CONVERGENCES TECHNOLOGIQUES — 3 fusions tech imminentes
   - Quelles technologies convergent
   - L'innovation qui émerge à l'intersection
   - Quand ça devient viable (timeline)

3. 🌊 VAGUES DE FOND — 2 méga-tendances sous-estimées
   - La tendance (sociétale, tech, réglementaire)
   - L'impact sur le BPE dans 3-5 ans
   - Comment surfer la vague avant les autres

4. ⚡ LE PROCHAIN "OBVIOUS IN HINDSIGHT"
   - L'innovation qui paraîtra évidente dans 5 ans
   - Pourquoi personne ne la voit aujourd'hui
   - Comment TBOS la lance MAINTENANT`}

CLÔTURE: 🏆 MON TOP 1 — L'opportunité pour laquelle je mettrais 100% de mes capacités computationnelles.

Style: Venture Scout × AI visionnaire. Obstiné, prescient, audacieux. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [lens]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {lenses.map(l => (
              <button key={l.id} onClick={() => setLens(l.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${lens === l.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <l.icon className={`w-4 h-4 ${lens === l.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{l.label}</span>
                <span className="text-[9px] text-muted-foreground">{l.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={hunt} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crosshair className="w-4 h-4 mr-2" />}
            Chasser les Opportunités — {lenses.find(l => l.id === lens)?.label}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Telescope className="w-4 h-4 text-amber-400" />Opportunités Traquées</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Telescope className="w-8 h-8 opacity-30" /><span>Choisissez une lentille et lancez la chasse</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function EmergentInnovator() {
  const [activeTab, setActiveTab] = useState('agenda');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Emergent Innovator</h1>
            <p className="text-xs text-muted-foreground">Autonome, Auto-améliorant, Inlassable — l'innovateur qui évolue seul</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Conscience Active</span>
          </div>
          <span>7 hypothèses</span>
          <span>3 méthodes expérimentales</span>
          <span>3 lentilles de chasse</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="agenda" className="text-xs font-mono gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Agenda
          </TabsTrigger>
          <TabsTrigger value="experiment" className="text-xs font-mono gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" /> Expérimentation
          </TabsTrigger>
          <TabsTrigger value="improve" className="text-xs font-mono gap-1.5">
            <RefreshCcw className="w-3.5 h-3.5" /> Auto-Amélioration
          </TabsTrigger>
          <TabsTrigger value="hunt" className="text-xs font-mono gap-1.5">
            <Telescope className="w-3.5 h-3.5" /> Chasseur
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="agenda" className="mt-4"><AutonomousAgenda /></TabsContent>
            <TabsContent value="experiment" className="mt-4"><ExperimentLab /></TabsContent>
            <TabsContent value="improve" className="mt-4"><SelfImprovementEngine /></TabsContent>
            <TabsContent value="hunt" className="mt-4"><OpportunityHunter /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
