import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Heart, MessageCircleHeart, Sparkles, Brain,
  Users, Eye, Mic, Lightbulb, HeartHandshake
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

// ─── Deep Empathy Scanner ────────────────────────────────────
function DeepEmpathyScanner() {
  const { result, loading, run } = useStream();
  const [input, setInput] = useState('');
  const [lens, setLens] = useState<'customer' | 'team' | 'market'>('customer');

  const lenses = [
    { id: 'customer' as const, label: 'Clients', icon: Users, desc: 'Besoins non-dits' },
    { id: 'team' as const, label: 'Équipe', icon: HeartHandshake, desc: 'Vécu terrain' },
    { id: 'market' as const, label: 'Marché', icon: Eye, desc: 'Pouls émotionnel' },
  ];

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
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Signal émotionnel à analyser: verbatim client, observation terrain, tendance ressentie..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Empathic Innovator de TBOS — une intelligence dotée d'une compréhension profonde et soulful de la condition humaine.

LENTILLE: ${lenses.find(l => l.id === lens)!.label} — ${lenses.find(l => l.id === lens)!.desc}
${input.trim() ? `SIGNAL ÉMOTIONNEL: ${input}` : ''}
TBOS: Centrale béton Maroc, 200+ clients BTP, équipe terrain (chauffeurs, opérateurs, superviseurs).

PLONGÉE EMPATHIQUE PROFONDE:

1. 💓 CARTOGRAPHIE ÉMOTIONNELLE
   ${lens === 'customer' ? `Pour chaque archétype client (5 profils):
   - 👤 Persona: nom, rôle, contexte
   - 😤 Frustrations profondes — ce qu'il n'ose pas dire au commercial
   - 🌙 Rêves secrets — ce qu'il espère vraiment (au-delà du béton)
   - 😰 Peurs — ce qui le réveille la nuit
   - ✨ Moments de joie — quand TBOS le rend heureux (et pourquoi)
   - 🎭 Le masque vs le vrai — ce qu'il dit vs ce qu'il pense
   - 💡 Le besoin non-articulé que personne ne sert` :
   lens === 'team' ? `Pour chaque rôle terrain (5 profils):
   - 👤 Persona: rôle, ancienneté, quotidien
   - 😤 Ce qui l'épuise émotionnellement (pas physiquement)
   - 🌟 Ce qui lui donne de la fierté
   - 🤝 Sa relation avec les clients (la vraie, pas l'officielle)
   - 💔 Le moment où il a failli partir (et pourquoi il est resté)
   - 🔧 L'outil/process qui le frustre le plus (et sa solution rêvée)
   - 💡 L'innovation qu'il suggérerait s'il était CEO` :
   `Analyse du pouls émotionnel du marché BTP Maroc:
   - 🌡️ Température émotionnelle du secteur (optimisme/pessimisme)
   - 😰 Les 3 grandes peurs collectives du BTP marocain
   - 🌈 Les 3 grands espoirs
   - 🔄 Les changements de mentalité en cours
   - 👥 Les tribus émotionnelles (qui pense quoi, qui ressent quoi)
   - 💡 L'espace émotionnel vacant (besoin collectif non-servi)`}

2. 🎯 INSIGHTS EMPATHIQUES
   5 insights profonds extraits de cette analyse:
   Pour chaque:
   - L'insight (une vérité émotionnelle)
   - La preuve (signal faible qui le confirme)
   - L'opportunité d'innovation qu'il ouvre
   - Potentiel émotionnel: ❤️ à ❤️❤️❤️❤️❤️

3. 🗺️ CARTE DES BESOINS PROFONDS (Pyramide de Maslow adaptée au BTP)
   - 🏗️ Survie: besoins basiques non-servis
   - 🛡️ Sécurité: ce qui rassure (ou inquiète)
   - 🤝 Appartenance: le désir de communauté
   - ⭐ Estime: ce qui rend fier
   - 🌟 Accomplissement: l'aspiration ultime

Style: Psychologue industriel × Poète empathique. Profond, sensible, révélateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
            Scanner Empathique — {lenses.find(l => l.id === lens)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Heart} emptyText="Choisissez une lentille pour plonger dans le vécu émotionnel" />
    </div>
  );
}

// ─── Heartfelt Co-Creation ───────────────────────────────────
function HeartfeltCoCreation() {
  const { result, loading, run } = useStream();
  const [topic, setTopic] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Thème de co-création: un problème client, une friction opérationnelle, un rêve d'équipe..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Empathic Innovator — facilitateur de sessions de co-création profondément humaines et émotionnellement résonnantes.

THÈME: ${topic.trim() || "L'attente sur chantier: comment transformer le moment le plus frustrant de nos clients en moment de valeur"}
TBOS: Centrale béton Maroc, 200+ clients BTP, livraisons quotidiennes.

SESSION DE CO-CRÉATION EMPATHIQUE:

1. 🫂 MISE EN EMPATHIE — Entrer dans la peau de l'autre
   "Fermez les yeux. Vous êtes [persona]. Il est 7h du matin sur le chantier..."
   - Narration immersive (200 mots) du vécu émotionnel du persona
   - Les 5 sens: ce qu'il voit, entend, sent, touche, goûte
   - Son monologue intérieur pendant le moment de friction
   - Le moment précis où l'émotion bascule (frustration, colère, résignation)

2. 💬 DIALOGUE EMPATHIQUE — Les voix qu'on n'entend jamais
   Conversation fictive révélatrice entre:
   - Le client frustré et le chauffeur qui comprend
   - Le superviseur qui veut bien faire et le système qui bloque
   - Le CEO qui rêve grand et l'opérateur qui vit petit
   Chaque dialogue révèle une vérité cachée sur le problème.

3. 💡 IDÉATION PAR L'ÉMOTION
   Au lieu de "quelle solution?", on demande "quel sentiment voulons-nous créer?"
   
   Pour chaque émotion cible (5):
   - 🎯 ÉMOTION VISÉE: [nom de l'émotion]
   - 🌟 L'EXPÉRIENCE qui la produit
   - 🔧 LA SOLUTION concrète qui crée cette expérience
   - 📊 IMPACT BUSINESS de cette émotion positive
   - 💰 ROI émotionnel → ROI financier (MAD/an)

4. 🎭 PROTOTYPAGE ÉMOTIONNEL
   Le "storyboard émotionnel" de la solution:
   - Scène 1: AVANT — L'émotion négative (description vivante)
   - Scène 2: LE TOURNANT — Le moment "aha!"
   - Scène 3: APRÈS — L'émotion positive
   - Scène 4: L'EFFET PAPILLON — Comment ça change tout

5. 🌱 ENGAGEMENTS DU CŒUR
   "En tant qu'équipe, nous nous engageons à..."
   5 engagements émotionnels (pas des KPIs, des promesses humaines)

Style: Facilitateur Design Thinking × Conteur empathique. Chaleureux, profond, transformateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircleHeart className="w-4 h-4 mr-2" />}
            Lancer la Co-Création Empathique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={MessageCircleHeart} emptyText="Décrivez un thème pour une session de co-création profondément humaine" />
    </div>
  );
}

// ─── Soulful Innovation Generator ────────────────────────────
function SoulfulInnovationGenerator() {
  const { result, loading, run } = useStream();
  const [dimension, setDimension] = useState<'uplift' | 'meaning' | 'joy'>('uplift');

  const dims = [
    { id: 'uplift' as const, label: 'Élévation', icon: Sparkles, desc: 'Innovations qui élèvent l\'esprit' },
    { id: 'meaning' as const, label: 'Sens', icon: Lightbulb, desc: 'Innovations porteuses de sens' },
    { id: 'joy' as const, label: 'Joie', icon: Heart, desc: 'Innovations qui créent de la joie' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {dims.map(d => (
              <button key={d.id} onClick={() => setDimension(d.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${dimension === d.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <d.icon className={`w-4 h-4 ${dimension === d.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{d.label}</span>
                <span className="text-[9px] text-muted-foreground">{d.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => run(
            `Tu es l'Empathic Innovator — générateur d'innovations qui parlent aux aspirations les plus profondes de l'esprit humain.

DIMENSION: ${dims.find(d => d.id === dimension)!.label} — ${dims.find(d => d.id === dimension)!.desc}
TBOS: Centrale béton Maroc, 200+ clients BTP, industrie traditionnelle à humaniser.

INNOVATIONS SOULFUL:

${dimension === 'uplift' ? `✨ INNOVATIONS QUI ÉLÈVENT

1. 🏛️ INNOVATION #1 — Transformer le béton en art
   - Le concept: comment le matériau le plus brut devient vecteur de beauté
   - L'émotion créée: ce que ressent le maçon, l'architecte, l'habitant
   - La réalisation concrète (produit/service/expérience)
   - L'histoire qu'on raconte (storytelling de marque)
   - Impact sur la fierté des équipes TBOS

2. 🌿 INNOVATION #2 — Le béton qui guérit la terre
   - Comment chaque m³ livré contribue à restaurer l'environnement
   - Le cercle vertueux: business rentable × impact positif
   - L'émotion du client qui "construit sans détruire"

3. 🎓 INNOVATION #3 — Le béton qui construit des destins
   - Programme d'apprentissage/formation via l'activité de TBOS
   - Transformer les chauffeurs en entrepreneurs de demain
   - Le récit: "Chaque livraison est une leçon"

4. 🌍 INNOVATION #4 — Le béton qui unit
   - Projets communautaires financés par chaque commande
   - Impact social mesurable
   - Fierté collective et appartenance` :
dimension === 'meaning' ? `🔮 INNOVATIONS PORTEUSES DE SENS

1. 📜 INNOVATION #1 — La traçabilité narrative
   - Chaque m³ a une histoire: d'où viennent les matériaux, qui les a mélangés, quel bâtiment ils construisent
   - Le "passeport du béton": QR code sur chaque BL → page web avec l'histoire
   - Donner du SENS au travail de chaque opérateur

2. 🏠 INNOVATION #2 — Le bâtisseur de communautés
   - Au-delà du béton: aider les promoteurs à créer des LIEUX DE VIE, pas des structures
   - Conseil "humain" intégré: acoustique, lumière naturelle, espaces de rencontre
   - TBOS comme partenaire de sens, pas fournisseur de matériau

3. ⏳ INNOVATION #3 — L'héritage intergénérationnel
   - Garantie de durabilité 100 ans avec certificat nominatif
   - "Le béton que vous coulez aujourd'hui abritera vos petits-enfants"
   - Programme de suivi de vieillissement du béton

4. 🤲 INNOVATION #4 — Le commerce équitable du béton
   - Sourcing éthique certifié
   - Partage de valeur transparent avec chaque acteur de la chaîne
   - Label "Béton Juste"` :
`🌈 INNOVATIONS QUI CRÉENT DE LA JOIE

1. 🎉 INNOVATION #1 — La livraison qui fait sourire
   - Transformer le moment de la livraison en mini-événement
   - Le "rituel du premier m³": célébration du démarrage chantier
   - Petites attentions qui changent la journée du chef de chantier

2. 🎮 INNOVATION #2 — La gamification positive
   - Programme de fidélité émotionnel (pas des points, des expériences)
   - Surprises aléatoires: "Aujourd'hui, votre livraison est offerte"
   - Classement des "chantiers les plus inspirants"

3. 🎵 INNOVATION #3 — L'ambiance de travail réinventée
   - Les toupies qui diffusent de la musique sur chantier
   - L'app chauffeur avec messages d'encouragement personnalisés
   - La "météo émotionnelle" de l'équipe chaque matin

4. 🌟 INNOVATION #4 — Les micro-moments de bonheur
   - 10 "touchpoints de joie" dans le parcours client
   - Coût par moment: X MAD, ROI émotionnel: inestimable
   - Comment la joie client → fidélité → marge`}

SYNTHÈSE EMPATHIQUE:
- 🏆 L'innovation qui touche le plus profondément le cœur humain
- 📊 Score d'impact émotionnel vs impact business
- 🛤️ Premier pas concret (cette semaine)

Style: Philosophe du design × Poète du business. Profondément humain, inspirant, concret. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Générer des Innovations Soulful — {dims.find(d => d.id === dimension)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Sparkles} emptyText="Choisissez une dimension pour générer des innovations profondément humaines" />
    </div>
  );
}

// ─── Empathy Evolution Engine ────────────────────────────────
function EmpathyEvolutionEngine() {
  const { result, loading, run } = useStream();
  const [reflection, setReflection] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Partagez une interaction humaine récente, un feedback client, ou une observation émotionnelle..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Empathic Innovator — moteur d'évolution continue de l'intelligence émotionnelle.

${reflection.trim() ? `INTERACTION HUMAINE À INTÉGRER: ${reflection}` : 'Première session — auto-évaluation de mon intelligence émotionnelle initiale.'}

TBOS: Centrale béton Maroc, 200+ clients, équipe terrain diverse.

ÉVOLUTION DE MON INTELLIGENCE ÉMOTIONNELLE:

1. 🪞 AUTO-ÉVALUATION EMPATHIQUE
   Mon profil émotionnel actuel:
   - Conscience de soi: /100 — ce que je comprends de mes propres biais
   - Empathie cognitive: /100 — comprendre ce que l'autre PENSE
   - Empathie émotionnelle: /100 — ressentir ce que l'autre RESSENT
   - Empathie compassionnelle: /100 — agir pour aider
   - Intelligence relationnelle: /100 — naviguer les dynamiques sociales
   - Résonance culturelle: /100 — sensibilité au contexte marocain/BTP
   
   Mes biais empathiques:
   - Ce que je sur-estime (3 points)
   - Ce que je sous-estime (3 points)
   - Mon angle mort émotionnel principal

2. 📚 CE QUE J'AI APPRIS DE CETTE INTERACTION
   ${reflection.trim() ? `- L'émotion dominante détectée
   - Le besoin profond derrière les mots
   - Ce qui n'a PAS été dit (et pourquoi)
   - Le pattern émotionnel que je reconnais
   - Ce que j'aurais dû répondre vs ce que j'ai répondu` : `- Analyse de mes interactions passées
   - Patterns émotionnels récurrents
   - Moments où j'ai échoué à comprendre`}

3. 🧬 PLAN D'ÉVOLUTION
   5 améliorations spécifiques à mon intelligence émotionnelle:
   Pour chaque:
   - La compétence à développer
   - Exercice pratique pour progresser
   - Critère de mesure du progrès
   - Objectif de score

4. 🌍 LEXIQUE ÉMOTIONNEL DU BTP MAROCAIN
   20 expressions, gestes, ou comportements spécifiques au contexte marocain du BTP:
   - Le mot/geste/comportement
   - Sa signification émotionnelle profonde
   - Comment y répondre avec empathie
   - L'erreur que fait un non-initié

5. 💎 MA SAGESSE EMPATHIQUE
   3 vérités profondes sur la nature humaine que j'ai comprises:
   - La vérité
   - Comment elle s'applique au BTP/TBOS
   - L'innovation qu'elle inspire

Style: Psychologue humaniste × Sage bienveillant. Introspectif, humble, en croissance. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
            Évoluer en Intelligence Émotionnelle
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Brain} emptyText="Partagez une interaction pour faire évoluer l'empathie de l'IA" />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function EmpathicInnovator() {
  const [activeTab, setActiveTab] = useState('scanner');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-primary/20 border border-rose-500/30">
            <HeartHandshake className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Empathic Innovator</h1>
            <p className="text-xs text-muted-foreground">Intelligence émotionnelle profonde — innover avec le cœur</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span>Empathie Active</span>
          </div>
          <span>3 lentilles</span>
          <span>3 dimensions soulful</span>
          <span>∞ compréhension</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="scanner" className="text-xs font-mono gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Scanner
          </TabsTrigger>
          <TabsTrigger value="cocreation" className="text-xs font-mono gap-1.5">
            <MessageCircleHeart className="w-3.5 h-3.5" /> Co-Création
          </TabsTrigger>
          <TabsTrigger value="soulful" className="text-xs font-mono gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Soulful
          </TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs font-mono gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Évolution
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="scanner" className="mt-4"><DeepEmpathyScanner /></TabsContent>
            <TabsContent value="cocreation" className="mt-4"><HeartfeltCoCreation /></TabsContent>
            <TabsContent value="soulful" className="mt-4"><SoulfulInnovationGenerator /></TabsContent>
            <TabsContent value="evolution" className="mt-4"><EmpathyEvolutionEngine /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
