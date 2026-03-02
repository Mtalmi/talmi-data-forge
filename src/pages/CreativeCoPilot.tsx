import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Palette, Wand2, MessageSquare, UserCog, Play, Loader2, Sparkles,
  Target, Lightbulb, ThumbsUp, ThumbsDown, Send, RefreshCw,
  Flame, Leaf, Zap, Crown, PenTool, Layers, Star, ArrowRight
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

// ─── Strategic Alignment ─────────────────────────────────────
function StrategicAlignment() {
  const goals = [
    { id: 'margin', label: 'Marge +15%', icon: Target, active: true },
    { id: 'green', label: 'Béton Vert', icon: Leaf, active: true },
    { id: 'speed', label: 'Livraison <45min', icon: Zap, active: false },
    { id: 'premium', label: 'Gamme Premium', icon: Crown, active: false },
  ];

  const [selectedGoals, setSelectedGoals] = useState<string[]>(['margin', 'green']);
  const [constraints, setConstraints] = useState('Budget max 500K MAD, délai 6 mois, pas de recrutement');
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const toggle = (id: string) => setSelectedGoals(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const generateBrief = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setBrief('');
    setLoading(true);
    const names = goals.filter(g => selectedGoals.includes(g.id)).map(g => g.label);
    try {
      await streamAI(
        `Tu es le Creative Co-Pilot de TBOS (centrale à béton, Maroc, ~500m³/jour).

OBJECTIFS STRATÉGIQUES SÉLECTIONNÉS: ${names.join(', ')}
CONTRAINTES: ${constraints}

Génère un BRIEF CRÉATIF complet:
1. 🎯 VISION — Reformulation inspirante de la mission
2. 📐 CADRE D'INNOVATION — Périmètre, contraintes, critères de succès
3. 🧭 AXES CRÉATIFS — 3 directions d'exploration prioritaires
4. ⚡ CRITÈRES D'ÉVALUATION — Grille de scoring des idées (5 critères pondérés)
5. 🚀 AMBITION — Ce à quoi ressemble le succès "moonshot"

Sois un directeur d'innovation industrielle. Inspirant mais pragmatique. Français.`,
        (t) => setBrief(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setBrief(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selectedGoals, constraints]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Alignement Stratégique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-[10px] text-muted-foreground font-mono uppercase mb-2 block">Objectifs</span>
            <div className="grid grid-cols-2 gap-1.5">
              {goals.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggle(g.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-all ${selectedGoals.includes(g.id) ? 'border-primary bg-primary/10 font-semibold' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
                >
                  <g.icon className={`w-3.5 h-3.5 ${selectedGoals.includes(g.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-mono uppercase mb-1 block">Contraintes</span>
            <Textarea value={constraints} onChange={e => setConstraints(e.target.value)} className="text-xs min-h-[60px] bg-muted/30" />
          </div>
          <Button onClick={generateBrief} disabled={loading || !selectedGoals.length} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenTool className="w-4 h-4 mr-2" />}
            Générer le Brief Créatif
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Brief Créatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            {brief ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{brief}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <PenTool className="w-8 h-8 opacity-30" />
                <span>Configurez vos objectifs et générez le brief</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Idea Generator ──────────────────────────────────────────
function IdeaGenerator() {
  const [challenge, setChallenge] = useState('');
  const [ideas, setIdeas] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'divergent' | 'convergent' | 'disruptive'>('divergent');
  const ctrlRef = useRef<AbortController | null>(null);

  const modes = [
    { id: 'divergent' as const, label: 'Divergent', icon: Sparkles, desc: 'Maximum de pistes' },
    { id: 'convergent' as const, label: 'Convergent', icon: Target, desc: 'Idées affinées' },
    { id: 'disruptive' as const, label: 'Disruptif', icon: Flame, desc: 'Rupture totale' },
  ];

  const generate = useCallback(async () => {
    if (!challenge.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setIdeas('');
    setLoading(true);
    const modePrompt = mode === 'divergent'
      ? 'Génère 8-10 idées variées couvrant un maximum de directions créatives. Quantité > raffinement.'
      : mode === 'convergent'
        ? 'Génère 4-5 idées très élaborées et réalistes. Chacune avec plan de mise en œuvre.'
        : 'Génère 5-6 idées radicalement disruptives. Pense "10x" pas "10%". Ose l\'impossible.';

    try {
      await streamAI(
        `Tu es le Creative Co-Pilot de TBOS en mode ${mode.toUpperCase()}.

DÉFI CRÉATIF: ${challenge}
CONTEXTE: Centrale à béton Maroc, 500m³/jour, 50 camions, marché BTP compétitif.

${modePrompt}

Pour chaque idée:
- 💡 NOM — Titre accrocheur (3-5 mots)
- 📝 CONCEPT — Description en 2-3 phrases
- ⭐ POTENTIEL — Score /10 (faisabilité × impact)
- 🔑 FACTEUR CLÉ — Ce qui rend cette idée unique

Termine par un 🏆 TOP PICK avec justification. Français.`,
        (t) => setIdeas(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setIdeas(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [challenge, mode]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${mode === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <m.icon className={`w-4 h-4 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[9px] text-muted-foreground">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Décrivez votre défi créatif..." className="text-xs min-h-[50px] bg-muted/30 flex-1" />
            <Button onClick={generate} disabled={loading || !challenge.trim()} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Idées Générées — Mode {modes.find(m => m.id === mode)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            {ideas ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{ideas}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Wand2 className="w-8 h-8 opacity-30" />
                <span>Décrivez un défi et choisissez un mode créatif</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Co-Creation Chat ────────────────────────────────────────
interface ChatMsg { role: 'user' | 'assistant'; content: string }

function CoCreationChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState<'builder' | 'challenger' | 'visionary'>('builder');
  const ctrlRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const personas = [
    { id: 'builder' as const, label: 'Bâtisseur', icon: Layers, desc: 'Construit sur vos idées' },
    { id: 'challenger' as const, label: 'Challenger', icon: Flame, desc: 'Critique constructive' },
    { id: 'visionary' as const, label: 'Visionnaire', icon: Star, desc: 'Pousse les limites' },
  ];

  const personaPrompt = {
    builder: 'Tu construis sur les idées de l\'utilisateur. Enrichis, développe, ajoute des couches. Dis "Oui, et..." plutôt que "Non, mais...".',
    challenger: 'Tu challenges chaque idée avec bienveillance. Trouve les failles, pose les questions difficiles, pousse à la rigueur. Sois le "Devil\'s Advocate" constructif.',
    visionary: 'Tu vois au-delà de l\'évident. Fais des connexions inattendues, propose des sauts créatifs, inspire l\'audace. Pense "moonshot".',
  };

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    const userMsg: ChatMsg = { role: 'user', content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    let assistantContent = '';
    const history = newMsgs.map(m => `${m.role === 'user' ? 'HUMAIN' : 'CO-PILOT'}: ${m.content}`).join('\n\n');

    try {
      await streamAI(
        `Tu es le Creative Co-Pilot de TBOS en persona "${personas.find(p => p.id === persona)?.label}".
${personaPrompt[persona]}

Contexte: Centrale à béton au Maroc, innovation industrielle.

CONVERSATION:
${history}

Réponds de manière créative, engageante et concise (max 200 mots). Utilise des émojis. Termine par une question ou suggestion pour relancer la co-création. Français.`,
        (t) => {
          assistantContent += t;
          setMessages([...newMsgs, { role: 'assistant', content: assistantContent }]);
        },
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages([...newMsgs, { role: 'assistant', content: assistantContent + '\n\n❌ Erreur.' }]);
      }
    } finally {
      setLoading(false);
    }
  }, [input, messages, persona, loading]);

  return (
    <div className="space-y-4">
      {/* Persona selector */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border transition-all ${persona === p.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <p.icon className={`w-4 h-4 ${persona === p.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <div className="text-xs font-semibold">{p.label}</div>
                  <div className="text-[9px] text-muted-foreground">{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <ScrollArea className="h-[340px] mb-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <MessageSquare className="w-8 h-8 opacity-30" />
                <span>Commencez la co-création avec votre Co-Pilot</span>
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-md justify-center">
                  {['Comment innover dans le béton vert?', 'Idée pour fidéliser les clients BTP', 'Optimiser la chaîne logistique'].map(s => (
                    <button key={s} onClick={() => { setInput(s); }} className="text-[10px] px-2 py-1 rounded-full border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary/20 border border-primary/30' : 'bg-muted/40 border border-border/50'}`}>
                      <div className="whitespace-pre-wrap font-mono">{m.content}</div>
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Partagez une idée, un défi, une intuition..."
              className="text-xs bg-muted/30"
            />
            <Button onClick={send} disabled={loading || !input.trim()} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Style Adapter ───────────────────────────────────────────
function StyleAdapter() {
  const profiles = [
    { id: 'analytical', name: 'Analytique', desc: 'Données, métriques, ROI. Décisions basées sur les chiffres.', icon: Target, traits: ['Data-driven', 'Structuré', 'Prudent'] },
    { id: 'intuitive', name: 'Intuitif', desc: 'Instinct, vision, big picture. Connexions inattendues.', icon: Sparkles, traits: ['Créatif', 'Holistique', 'Rapide'] },
    { id: 'pragmatic', name: 'Pragmatique', desc: 'Faisabilité, timeline, ressources. Solutions qui marchent.', icon: Layers, traits: ['Concret', 'Réaliste', 'Efficace'] },
    { id: 'explorer', name: 'Explorateur', desc: 'Nouveauté, disruption, audace. Repousseur de limites.', icon: Flame, traits: ['Audacieux', 'Curieux', 'Ambitieux'] },
  ];

  const [selected, setSelected] = useState(profiles[0]);
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const adapt = useCallback(async () => {
    if (!topic.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setOutput('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es le Creative Co-Pilot adapté au profil "${selected.name}".
PROFIL: ${selected.desc}
TRAITS: ${selected.traits.join(', ')}

SUJET: ${topic}

Adapte ton style créatif à ce profil:
- ${selected.id === 'analytical' ? 'Utilise des tableaux, chiffres, comparaisons. Structure logique.' : ''}
- ${selected.id === 'intuitive' ? 'Utilise des métaphores, storytelling, analogies surprenantes.' : ''}
- ${selected.id === 'pragmatic' ? 'Plan d\'action concret, étapes claires, quick wins en premier.' : ''}
- ${selected.id === 'explorer' ? 'Provoque, challenge le statu quo, propose l\'impossible puis rends-le possible.' : ''}

Génère 3 propositions créatives adaptées à ce style de pensée. Français.`,
        (t) => setOutput(p => p + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setOutput(p => p + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selected, topic]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" />
            Profil Créatif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected.id === p.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <p.icon className={`w-4 h-4 ${selected.id === p.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{p.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">{p.desc}</p>
              <div className="flex gap-1">
                {p.traits.map(t => <Badge key={t} variant="outline" className="text-[9px] h-4">{t}</Badge>)}
              </div>
            </button>
          ))}
          <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Sujet à explorer dans ce style..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={adapt} disabled={loading || !topic.trim()} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Palette className="w-4 h-4 mr-2" />}
            Créer en Mode {selected.name}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            Output Créatif — Style {selected.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {output ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{output}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Palette className="w-8 h-8 opacity-30" />
                <span>Choisissez un profil et un sujet</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function CreativeCoPilot() {
  const [activeTab, setActiveTab] = useState('alignment');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 border border-primary/30">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Creative Co-Pilot</h1>
            <p className="text-xs text-muted-foreground">Aligner, Générer, Co-créer, Adapter — votre partenaire créatif IA</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Co-Pilot Actif</span>
          </div>
          <span>3 personas disponibles</span>
          <span>4 profils créatifs</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="alignment" className="text-xs font-mono gap-1.5">
            <Target className="w-3.5 h-3.5" /> Alignement
          </TabsTrigger>
          <TabsTrigger value="ideas" className="text-xs font-mono gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> Idéation
          </TabsTrigger>
          <TabsTrigger value="cocreate" className="text-xs font-mono gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Co-Création
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs font-mono gap-1.5">
            <UserCog className="w-3.5 h-3.5" /> Style
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="alignment" className="mt-4"><StrategicAlignment /></TabsContent>
            <TabsContent value="ideas" className="mt-4"><IdeaGenerator /></TabsContent>
            <TabsContent value="cocreate" className="mt-4"><CoCreationChat /></TabsContent>
            <TabsContent value="style" className="mt-4"><StyleAdapter /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
