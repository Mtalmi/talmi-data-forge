import { useState, useCallback, useRef, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Send, Loader2, Lightbulb, Target, Zap, Users,
  ArrowRight, RefreshCw, Eye, MessageSquare, Shuffle, Compass,
  Puzzle, Layers, GitMerge, Star, ChevronRight, Clock, CheckCircle2,
  TrendingUp, AlertTriangle, Heart, Rocket, Network
} from 'lucide-react';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

// Streaming helper
async function streamAI(
  prompt: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal
) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'chat' }),
    signal,
  });
  if (!resp.ok) throw new Error(`Erreur ${resp.status}`);
  if (!resp.body) throw new Error('No body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') return content;
      try {
        const delta = JSON.parse(json).choices?.[0]?.delta?.content;
        if (delta) { content += delta; onDelta(content); }
      } catch { buffer = line + '\n' + buffer; break; }
    }
  }
  return content;
}

// ─── Tab 1: Lateral Thinking Lab ────────────────────────────────────────
const THINKING_TECHNIQUES = [
  { id: 'reverse', label: 'Pensée Inversée', icon: RefreshCw, desc: 'Et si on faisait exactement l\'opposé ?' },
  { id: 'analogy', label: 'Analogie Sectorielle', icon: Shuffle, desc: 'Comment un autre secteur résout-il ce problème ?' },
  { id: 'constraint', label: 'Contrainte Créative', icon: Puzzle, desc: 'Résoudre avec 10x moins de ressources' },
  { id: 'fusion', label: 'Fusion de Concepts', icon: GitMerge, desc: 'Combiner deux idées non-reliées' },
];

function LateralThinkingLab() {
  const [challenge, setChallenge] = useState('');
  const [technique, setTechnique] = useState('reverse');
  const [output, setOutput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const think = useCallback(async () => {
    if (!challenge.trim()) return;
    setIsThinking(true);
    setOutput('');
    const controller = new AbortController();
    abortRef.current = controller;

    const techniquePrompts: Record<string, string> = {
      reverse: `PENSÉE INVERSÉE: Prends ce défi et inverse-le complètement. Que se passe-t-il si on fait l'exact opposé de ce qu'on ferait normalement ? Trouve 3 solutions contre-intuitives.`,
      analogy: `ANALOGIE SECTORIELLE: Comment les secteurs suivants résoudraient ce même problème : Aéronautique, Gastronomie, Jeux Vidéo ? Extrais les principes transférables au béton.`,
      constraint: `CONTRAINTE CRÉATIVE: Tu dois résoudre ce défi avec : 1/10ème du budget, aucune technologie nouvelle, et en 48h. Quelles solutions émergent de ces contraintes extrêmes ?`,
      fusion: `FUSION DE CONCEPTS: Combine ce défi avec ces domaines aléatoires : Biomimétisme + Économie circulaire + Gamification. Génère 3 innovations hybrides inattendues.`,
    };

    try {
      await streamAI(
        `Tu es un génie créatif spécialisé en innovation industrielle pour TBOS (centrale à béton, Maroc).\n\n${techniquePrompts[technique]}\n\nDéfi: "${challenge}"\n\nPour chaque solution:\n- 🎯 Nom percutant\n- 💡 Concept en 2 phrases\n- 🔗 Connexion inattendue qui l'a inspirée\n- ⚡ Potentiel disruptif (1-10)\n- 🛠️ Premier prototype possible en 1 semaine`,
        setOutput,
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') setOutput(`❌ ${err.message}`);
    } finally {
      setIsThinking(false);
    }
  }, [challenge, technique]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {THINKING_TECHNIQUES.map(t => (
          <button
            key={t.id}
            onClick={() => setTechnique(t.id)}
            className={`p-4 rounded-xl border text-left transition-all ${t.id === technique ? 'border-primary bg-primary/5' : 'border-border/50 bg-card/50 hover:border-primary/30'}`}
          >
            <t.icon className={`h-5 w-5 mb-2 ${t.id === technique ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-semibold">{t.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Décrivez votre défi créatif… Ex: Comment réduire le gaspillage de béton retourné ?" className="rounded-xl min-h-[70px]" />
        <Button onClick={think} disabled={!challenge.trim() || isThinking} className="self-end h-12 px-6 rounded-xl gap-2">
          {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Penser
        </Button>
      </div>

      {output && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Solutions Latérales
              {isThinking && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="text-sm whitespace-pre-wrap leading-relaxed pr-4">{output}</div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 2: Strategic Alignment ─────────────────────────────────────────
interface StrategicGoal {
  id: string;
  title: string;
  priority: number;
  progress: number;
  opportunities: number;
}

const STRATEGIC_GOALS: StrategicGoal[] = [
  { id: '1', title: 'Augmenter la marge brute à 35%', priority: 1, progress: 68, opportunities: 4 },
  { id: '2', title: 'Conquérir le marché infrastructure', priority: 2, progress: 42, opportunities: 3 },
  { id: '3', title: 'Zéro déchet production d\'ici 2027', priority: 3, progress: 25, opportunities: 5 },
  { id: '4', title: 'Digitaliser 100% des opérations', priority: 4, progress: 78, opportunities: 2 },
];

function StrategicAlignment() {
  const [selectedGoal, setSelectedGoal] = useState<StrategicGoal>(STRATEGIC_GOALS[0]);
  const [proactiveIdeas, setProactiveIdeas] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const scanOpportunities = useCallback(async (goal: StrategicGoal) => {
    setSelectedGoal(goal);
    setIsScanning(true);
    setProactiveIdeas('');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAI(
        `Tu es un conseiller stratégique AI proactif pour TBOS (centrale à béton, Maroc).\n\nObjectif stratégique: "${goal.title}"\nProgrès actuel: ${goal.progress}%\nPriorité: #${goal.priority}\n\nTa mission: PROACTIVEMENT identifier les opportunités que l'équipe n'a pas encore vues.\n\n1. 🔭 OPPORTUNITÉS CACHÉES: 3 leviers non-évidents pour accélérer cet objectif\n2. 🚨 ANGLES MORTS: Ce que l'équipe rate probablement\n3. ⚡ QUICK WINS: Actions à impact immédiat (< 1 semaine)\n4. 🔮 TENDANCES: Signaux faibles du marché marocain du BTP à exploiter\n5. 🤝 SYNERGIES: Liens avec les autres objectifs stratégiques\n6. 📅 PLAN D'ACTION: 3 étapes concrètes pour les 30 prochains jours`,
        setProactiveIdeas,
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') setProactiveIdeas(`❌ ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objectifs Stratégiques</p>
        {STRATEGIC_GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => scanOpportunities(g)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${g.id === selectedGoal.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card/50 hover:border-primary/30'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[9px]">P{g.priority}</Badge>
              <Badge variant="secondary" className="text-[9px]">{g.opportunities} opportunités</Badge>
            </div>
            <p className="text-sm font-semibold mb-2">{g.title}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${g.progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{g.progress}%</span>
            </div>
          </button>
        ))}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold">Score Alignement Global</p>
            </div>
            <p className="text-2xl font-bold text-primary">{Math.round(STRATEGIC_GOALS.reduce((a, g) => a + g.progress, 0) / STRATEGIC_GOALS.length)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        {proactiveIdeas ? (
          <Card className="border-border/50 bg-card/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Scan Proactif: {selectedGoal.title}
                {isScanning && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="text-sm whitespace-pre-wrap leading-relaxed pr-4">{proactiveIdeas}</div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center space-y-3">
              <Compass className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Cliquez sur un objectif pour lancer<br />le scan proactif d'opportunités</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: Human-AI Co-Creation ────────────────────────────────────────
interface CoCreateMessage {
  id: string;
  role: 'human' | 'ai';
  content: string;
  type: 'idea' | 'challenge' | 'build' | 'critique';
}

function HumanAICoCreation() {
  const [messages, setMessages] = useState<CoCreateMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'idea' | 'challenge' | 'build' | 'critique'>('idea');
  const [isResponding, setIsResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const modePrompts: Record<string, string> = {
    idea: 'MODE IDÉATION: Rebondis sur ce que dit l\'humain avec 2-3 idées créatives qui complètent et enrichissent sa réflexion. Sois audacieux.',
    challenge: 'MODE DÉFI: Challenge constructivement cette idée. Joue l\'avocat du diable. Identifie les failles et propose comment les combler.',
    build: 'MODE CONSTRUCTION: Prends cette idée et structure-la. Définis les étapes, les ressources, le timeline. Rends-la actionnable.',
    critique: 'MODE CRITIQUE BIENVEILLANTE: Évalue honnêtement les forces et faiblesses. Note sur 10 (Originalité, Faisabilité, Impact). Suggère des améliorations.',
  };

  const modeIcons = { idea: Lightbulb, challenge: AlertTriangle, build: Layers, critique: Star };
  const modeLabels = { idea: 'Idéer', challenge: 'Challenger', build: 'Construire', critique: 'Évaluer' };

  const send = useCallback(async () => {
    if (!input.trim() || isResponding) return;
    const humanMsg: CoCreateMessage = { id: crypto.randomUUID(), role: 'human', content: input, type: mode };
    setMessages(prev => [...prev, humanMsg]);
    setInput('');
    setIsResponding(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const aiId = crypto.randomUUID();

    try {
      const history = [...messages, humanMsg].map(m => `${m.role === 'human' ? 'Humain' : 'AI'} [${m.type}]: ${m.content}`).join('\n\n');

      await streamAI(
        `Tu es un partenaire de co-création AI pour TBOS (centrale à béton, Maroc). Tu travailles en binôme avec un humain.\n\n${modePrompts[mode]}\n\nHistorique de la session:\n${history}\n\nRéponds de manière concise (max 200 mots), engageante, et termine TOUJOURS par une question ouverte pour relancer la co-création.`,
        (text) => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.id === aiId) return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: text } : m);
            return [...prev, { id: aiId, role: 'ai', content: text, type: mode }];
          });
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', content: `❌ ${err.message}`, type: mode }]);
      }
    } finally {
      setIsResponding(false);
    }
  }, [input, mode, messages, isResponding]);

  return (
    <div className="flex flex-col h-[65vh] gap-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        {(Object.keys(modeLabels) as Array<keyof typeof modeLabels>).map(m => {
          const Icon = modeIcons[m];
          return (
            <Button key={m} variant={mode === m ? 'default' : 'outline'} size="sm" onClick={() => setMode(m)} className="gap-1.5 text-xs rounded-xl">
              <Icon className="h-3.5 w-3.5" /> {modeLabels[m]}
            </Button>
          );
        })}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="space-y-4 p-1">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
                <Network className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-bold">Espace de Co-Création</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Choisissez un mode et commencez à co-créer. L'AI s'adapte à votre style :
                elle idée, challenge, construit ou évalue selon le mode actif.
              </p>
            </div>
          )}
          <AnimatePresence>
            {messages.map(msg => {
              const Icon = modeIcons[msg.type];
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'human' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 ${msg.role === 'human' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50'}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="h-3 w-3 opacity-60" />
                      <span className="text-[9px] opacity-60 uppercase">{modeLabels[msg.type]}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Mode ${modeLabels[mode]} — Partagez votre réflexion…`}
          className="h-12 rounded-xl"
          disabled={isResponding}
        />
        <Button onClick={send} disabled={!input.trim() || isResponding} size="lg" className="h-12 px-6 rounded-xl">
          {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Tab 4: Innovation Missions ─────────────────────────────────────────
interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'active' | 'completed' | 'proposed';
  aiContribution: string;
  humanLead: string;
  progress: number;
  milestones: { label: string; done: boolean }[];
}

const MISSIONS: Mission[] = [
  {
    id: '1', title: 'Projet Zéro Retour', objective: 'Éliminer 100% des retours béton non-utilisés', status: 'active', aiContribution: 'Prédiction volumes, matching demande', humanLead: 'Abdel Sadek', progress: 45,
    milestones: [{ label: 'Analyse historique retours', done: true }, { label: 'Modèle prédictif v1', done: true }, { label: 'Test pilote 2 semaines', done: false }, { label: 'Déploiement production', done: false }],
  },
  {
    id: '2', title: 'Smart Pricing Engine', objective: 'Prix dynamiques basés sur demande/stock/météo', status: 'proposed', aiContribution: 'Algorithme pricing, analyse concurrence', humanLead: 'Max', progress: 10,
    milestones: [{ label: 'Étude de marché', done: true }, { label: 'Design algorithme', done: false }, { label: 'Validation juridique', done: false }, { label: 'Lancement beta', done: false }],
  },
  {
    id: '3', title: 'Green Concrete Lab', objective: 'Formule béton bas carbone -40% CO₂', status: 'completed', aiContribution: 'Optimisation dosages, simulation résistance', humanLead: 'Abdel Sadek', progress: 100,
    milestones: [{ label: 'Recherche matériaux alternatifs', done: true }, { label: 'Tests laboratoire', done: true }, { label: 'Certification NM', done: true }, { label: 'Production série', done: true }],
  },
];

function InnovationMissions() {
  const [missions] = useState(MISSIONS);
  const statusIcon = (s: string) => s === 'active' ? <Rocket className="h-4 w-4 text-primary" /> : s === 'completed' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Lightbulb className="h-4 w-4 text-yellow-500" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50"><CardContent className="p-4 text-center">
          <Rocket className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{missions.filter(m => m.status === 'active').length}</p>
          <p className="text-[10px] text-muted-foreground">Missions Actives</p>
        </CardContent></Card>
        <Card className="border-border/50 bg-card/50"><CardContent className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{missions.filter(m => m.status === 'completed').length}</p>
          <p className="text-[10px] text-muted-foreground">Complétées</p>
        </CardContent></Card>
        <Card className="border-border/50 bg-card/50"><CardContent className="p-4 text-center">
          <Lightbulb className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{missions.filter(m => m.status === 'proposed').length}</p>
          <p className="text-[10px] text-muted-foreground">Proposées par AI</p>
        </CardContent></Card>
      </div>

      {missions.map((m, i) => (
        <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">{statusIcon(m.status)}</div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.objective}</p>
                    </div>
                    <Badge variant={m.status === 'active' ? 'default' : m.status === 'completed' ? 'secondary' : 'outline'} className="text-[9px]">
                      {m.status === 'active' ? '● Active' : m.status === 'completed' ? '✓ Complétée' : '💡 Proposée'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Brain className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-muted-foreground">AI: {m.aiContribution}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Lead: {m.humanLead}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${m.progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{m.progress}%</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {m.milestones.map((ms, j) => (
                      <Badge key={j} variant={ms.done ? 'default' : 'outline'} className="text-[9px] gap-1">
                        {ms.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {ms.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────
export default function AutonomousInnovator() {
  return (
    <MainLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Network className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Autonomous Innovator</h1>
            <p className="text-xs text-muted-foreground">Pensée Latérale • Alignement Stratégique • Co-Création • Missions</p>
          </div>
        </div>

        <Tabs defaultValue="lateral" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="lateral" className="gap-1.5 text-xs"><Brain className="h-3.5 w-3.5" /> Pensée Latérale</TabsTrigger>
            <TabsTrigger value="strategic" className="gap-1.5 text-xs"><Compass className="h-3.5 w-3.5" /> Stratégie</TabsTrigger>
            <TabsTrigger value="cocreate" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Co-Création</TabsTrigger>
            <TabsTrigger value="missions" className="gap-1.5 text-xs"><Rocket className="h-3.5 w-3.5" /> Missions</TabsTrigger>
          </TabsList>

          <TabsContent value="lateral"><LateralThinkingLab /></TabsContent>
          <TabsContent value="strategic"><StrategicAlignment /></TabsContent>
          <TabsContent value="cocreate"><HumanAICoCreation /></TabsContent>
          <TabsContent value="missions"><InnovationMissions /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
