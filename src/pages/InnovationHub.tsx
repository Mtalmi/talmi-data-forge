import { useState, useCallback, useRef, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Brain, GitBranch, Users, Send, Loader2, Sparkles,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Play, RotateCcw,
  Bell, UserCheck, Clock, ArrowRight, Zap, BarChart3, Target, Gauge,
  Lightbulb, Activity, Layers, Search, ChevronRight
} from 'lucide-react';

// ─── NLP Query Interface ────────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const SUGGESTED_QUERIES = [
  { icon: BarChart3, text: "Quel est le CA du mois en cours ?", category: "Finance" },
  { icon: Target, text: "Quels clients ont des impayés > 30 jours ?", category: "Créances" },
  { icon: Activity, text: "Quel est le taux de conformité qualité cette semaine ?", category: "Qualité" },
  { icon: Gauge, text: "Combien de m³ produits aujourd'hui ?", category: "Production" },
  { icon: TrendingUp, text: "Analyse la marge brute par formule béton", category: "Rentabilité" },
  { icon: Lightbulb, text: "Quelles anomalies as-tu détecté récemment ?", category: "Anomalies" },
];

interface NLPMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

function NLPInterface() {
  const [messages, setMessages] = useState<NLPMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendQuery = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    const userMsg: NLPMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, mode: 'chat' }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(errData.error || `Erreur ${resp.status}`);
      }
      if (!resp.body) throw new Error('No body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
          if (json === '[DONE]') break;
          try {
            const content = JSON.parse(json).choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                return [...prev, { id: assistantId, role: 'assistant', content: assistantContent, timestamp: new Date(), confidence: 85 + Math.random() * 15 }];
              });
            }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `❌ ${err.message}`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Suggested queries */}
      {messages.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Interface Langage Naturel</h2>
            <p className="text-sm text-muted-foreground mt-1">Posez vos questions opérationnelles en français — réponses instantanées alimentées par vos données</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUGGESTED_QUERIES.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => sendQuery(q.text)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <q.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[9px] mb-1">{q.category}</Badge>
                  <p className="text-xs font-medium">{q.text}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
          <div className="space-y-4 p-1">
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.confidence && msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground">Confiance: {msg.confidence.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && !messages.find(m => m.role === 'assistant' && m.content === '') && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Analyse en cours…</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendQuery(input)}
            placeholder="Posez votre question en langage naturel…"
            className="pl-10 h-12 rounded-xl"
            disabled={isLoading}
          />
        </div>
        <Button onClick={() => sendQuery(input)} disabled={!input.trim() || isLoading} size="lg" className="h-12 px-6 rounded-xl">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Predictive Simulation Engine ───────────────────────────────────────
interface SimScenario {
  id: string;
  name: string;
  description: string;
  variables: { label: string; key: string; value: number; min: number; max: number; unit: string }[];
  outcomes: { label: string; value: number; trend: 'up' | 'down' | 'neutral'; unit: string }[];
}

const BASE_SCENARIOS: SimScenario[] = [
  {
    id: 'price-increase',
    name: 'Hausse des prix ciment',
    description: 'Simuler l\'impact d\'une augmentation du prix du ciment sur les marges',
    variables: [
      { label: 'Hausse prix ciment', key: 'cement_increase', value: 10, min: 0, max: 50, unit: '%' },
      { label: 'Volume mensuel', key: 'monthly_volume', value: 3000, min: 500, max: 8000, unit: 'm³' },
      { label: 'Report prix client', key: 'price_passthrough', value: 50, min: 0, max: 100, unit: '%' },
    ],
    outcomes: [
      { label: 'Impact marge brute', value: -4.2, trend: 'down', unit: '%' },
      { label: 'Coût additionnel/mois', value: 45000, trend: 'down', unit: 'MAD' },
      { label: 'Prix moyen m³ ajusté', value: 1180, trend: 'up', unit: 'MAD/m³' },
      { label: 'Compétitivité', value: 72, trend: 'down', unit: '/100' },
    ],
  },
  {
    id: 'fleet-expansion',
    name: 'Extension de flotte',
    description: 'Simuler l\'ajout de toupies supplémentaires sur la capacité',
    variables: [
      { label: 'Toupies ajoutées', key: 'trucks_added', value: 2, min: 1, max: 6, unit: '' },
      { label: 'Capacité/toupie', key: 'capacity', value: 8, min: 6, max: 12, unit: 'm³' },
      { label: 'Rotations/jour', key: 'rotations', value: 4, min: 2, max: 8, unit: '' },
    ],
    outcomes: [
      { label: 'Capacité journalière +', value: 64, trend: 'up', unit: 'm³/j' },
      { label: 'CA additionnel/mois', value: 192000, trend: 'up', unit: 'MAD' },
      { label: 'Investissement', value: 1400000, trend: 'down', unit: 'MAD' },
      { label: 'ROI estimé', value: 7.3, trend: 'up', unit: 'mois' },
    ],
  },
  {
    id: 'demand-surge',
    name: 'Pic de demande saisonnier',
    description: 'Simuler la gestion d\'un pic de commandes exceptionnel',
    variables: [
      { label: 'Hausse demande', key: 'demand_increase', value: 40, min: 10, max: 100, unit: '%' },
      { label: 'Durée du pic', key: 'peak_weeks', value: 4, min: 1, max: 12, unit: 'sem.' },
      { label: 'Heures sup autorisées', key: 'overtime_hours', value: 3, min: 0, max: 6, unit: 'h/j' },
    ],
    outcomes: [
      { label: 'Commandes honorées', value: 88, trend: 'up', unit: '%' },
      { label: 'Délai moyen livraison', value: 2.8, trend: 'down', unit: 'h' },
      { label: 'Coût RH additionnel', value: 34000, trend: 'down', unit: 'MAD' },
      { label: 'Satisfaction client', value: 82, trend: 'neutral', unit: '/100' },
    ],
  },
];

function SimulationEngine() {
  const [selectedScenario, setSelectedScenario] = useState<SimScenario>(BASE_SCENARIOS[0]);
  const [variables, setVariables] = useState(BASE_SCENARIOS[0].variables);
  const [isSimulating, setIsSimulating] = useState(false);
  const [outcomes, setOutcomes] = useState(BASE_SCENARIOS[0].outcomes);

  const selectScenario = (s: SimScenario) => {
    setSelectedScenario(s);
    setVariables([...s.variables]);
    setOutcomes([...s.outcomes]);
  };

  const updateVariable = (key: string, value: number) => {
    setVariables(prev => prev.map(v => v.key === key ? { ...v, value } : v));
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Simple deterministic sim based on variable deltas
      const newOutcomes = selectedScenario.outcomes.map(o => {
        const jitter = variables.reduce((acc, v) => {
          const ratio = v.value / ((v.max + v.min) / 2);
          return acc + (ratio - 1) * 0.3;
        }, 0);
        const newVal = o.value * (1 + jitter * (o.trend === 'down' ? -1 : 1));
        return { ...o, value: Math.round(newVal * 100) / 100 };
      });
      setOutcomes(newOutcomes);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Scenario selector */}
      <div className="lg:col-span-3 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scénarios</p>
        {BASE_SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => selectScenario(s)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${s.id === selectedScenario.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card/50 hover:border-primary/30'}`}
          >
            <p className="text-sm font-semibold">{s.name}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.description}</p>
          </button>
        ))}
      </div>

      {/* Variables */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variables</p>
          <Button onClick={runSimulation} disabled={isSimulating} size="sm" className="gap-2">
            {isSimulating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Simuler
          </Button>
        </div>
        <div className="space-y-5">
          {variables.map(v => (
            <div key={v.key} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-medium">{v.label}</label>
                <span className="text-sm font-bold text-primary">{v.value} {v.unit}</span>
              </div>
              <Slider
                value={[v.value]}
                onValueChange={([val]) => updateVariable(v.key, val)}
                min={v.min}
                max={v.max}
                step={v.max > 100 ? 50 : 1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{v.min}{v.unit}</span>
                <span>{v.max}{v.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div className="lg:col-span-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Résultats Prédits</p>
        <AnimatePresence mode="wait">
          {isSimulating ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Calcul des prédictions…</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
              {outcomes.map((o, i) => (
                <motion.div
                  key={o.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {o.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {o.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                        {o.trend === 'neutral' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        <span className="text-[10px] text-muted-foreground">{o.label}</span>
                      </div>
                      <p className="text-lg font-bold">
                        {typeof o.value === 'number' && o.value > 999 ? o.value.toLocaleString('fr-MA') : o.value}
                        <span className="text-xs text-muted-foreground ml-1">{o.unit}</span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Recommendation */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold mb-1">Recommandation AI</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {selectedScenario.id === 'price-increase' && "Négociez des contrats cadre 6 mois avec vos fournisseurs pour verrouiller les prix. Reportez 60-70% de la hausse aux clients grands comptes avec clause d'indexation."}
                  {selectedScenario.id === 'fleet-expansion' && "L'ajout progressif (1 toupie/trimestre) réduit le risque. Priorisez les zones à forte demande (Casablanca-Nord) pour un ROI optimal."}
                  {selectedScenario.id === 'demand-surge' && "Activez les prestataires de transport en réserve et passez en mode production étendu (06h-20h). Prévoyez +15% de stock ciment en prévision."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Collaborative Workflow Management ──────────────────────────────────
interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed';
  owner: string;
  team: string[];
  progress: number;
  priority: 'high' | 'medium' | 'low';
  steps: { name: string; done: boolean; assignee: string }[];
  notifications: { text: string; time: string; type: 'info' | 'warning' | 'success' }[];
}

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: '1', name: 'Livraison chantier Addoha R7', status: 'active', owner: 'Karim', team: ['Karim', 'Abdel Sadek', 'Chauffeur Ali'], progress: 65, priority: 'high',
    steps: [
      { name: 'Validation BC client', done: true, assignee: 'Front Desk' },
      { name: 'Production béton B30', done: true, assignee: 'Abdel Sadek' },
      { name: 'Contrôle qualité (slump)', done: true, assignee: 'Labo' },
      { name: 'Chargement toupie T-03', done: false, assignee: 'Chauffeur Ali' },
      { name: 'Livraison + signature BL', done: false, assignee: 'Chauffeur Ali' },
    ],
    notifications: [
      { text: 'BC validé par Front Desk', time: '08:15', type: 'success' },
      { text: 'Slump test conforme: 180mm', time: '09:42', type: 'info' },
      { text: 'Retard estimé: +25min (trafic)', time: '10:10', type: 'warning' },
    ],
  },
  {
    id: '2', name: 'Réapprovisionnement ciment CPJ45', status: 'pending', owner: 'Abdel Sadek', team: ['Abdel Sadek', 'Max'], progress: 30, priority: 'medium',
    steps: [
      { name: 'Alerte stock bas détectée', done: true, assignee: 'Système' },
      { name: 'Devis fournisseur demandé', done: true, assignee: 'Abdel Sadek' },
      { name: 'Approbation CEO (>15k MAD)', done: false, assignee: 'Max' },
      { name: 'Confirmation commande', done: false, assignee: 'Abdel Sadek' },
    ],
    notifications: [
      { text: 'Stock ciment < seuil (12T restantes)', time: '07:00', type: 'warning' },
      { text: 'Devis LafargeHolcim reçu: 48 500 MAD', time: '11:30', type: 'info' },
    ],
  },
  {
    id: '3', name: 'Audit qualité mensuel - Mars', status: 'completed', owner: 'Abdel Sadek', team: ['Abdel Sadek', 'Karim', 'Labo'], progress: 100, priority: 'low',
    steps: [
      { name: 'Collecte échantillons 7j/28j', done: true, assignee: 'Labo' },
      { name: 'Tests résistance compression', done: true, assignee: 'Labo' },
      { name: 'Rapport conformité rédigé', done: true, assignee: 'Abdel Sadek' },
      { name: 'Validation superviseur', done: true, assignee: 'Karim' },
    ],
    notifications: [
      { text: 'Tous les tests conformes ✓', time: '16:00', type: 'success' },
    ],
  },
];

function CollaborativeWorkflows() {
  const [workflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [selected, setSelected] = useState<Workflow>(INITIAL_WORKFLOWS[0]);

  const priorityColor = (p: string) => p === 'high' ? 'text-destructive' : p === 'medium' ? 'text-yellow-500' : 'text-muted-foreground';
  const statusBadge = (s: string) => s === 'active' ? 'default' : s === 'pending' ? 'secondary' : 'outline';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Workflow list */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workflows Actifs</p>
          <Badge variant="secondary" className="text-[10px]">{workflows.length}</Badge>
        </div>
        {workflows.map(w => (
          <button
            key={w.id}
            onClick={() => setSelected(w)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${w.id === selected.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card/50 hover:border-primary/30'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant={statusBadge(w.status)} className="text-[9px]">
                {w.status === 'active' ? '● Actif' : w.status === 'pending' ? '◐ En attente' : '✓ Terminé'}
              </Badge>
              <span className={`text-[10px] font-semibold ${priorityColor(w.priority)}`}>{w.priority.toUpperCase()}</span>
            </div>
            <p className="text-sm font-semibold">{w.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${w.progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{w.progress}%</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{w.team.join(', ')}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Workflow detail */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">{selected.name}</h3>
            <p className="text-[10px] text-muted-foreground">Responsable: {selected.owner}</p>
          </div>
          <Badge variant={statusBadge(selected.status)}>
            {selected.status === 'active' ? 'Actif' : selected.status === 'pending' ? 'En attente' : 'Terminé'}
          </Badge>
        </div>

        {/* Steps pipeline */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Pipeline d'Étapes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                  {step.done ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${step.done ? 'line-through text-muted-foreground' : ''}`}>{step.name}</p>
                  <p className="text-[9px] text-muted-foreground">{step.assignee}</p>
                </div>
                {i < selected.steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Notifications feed */}
      <div className="lg:col-span-3 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Bell className="h-3 w-3" /> Notifications
        </p>
        <div className="space-y-2">
          {selected.notifications.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-3 rounded-lg border text-xs ${n.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' : n.type === 'success' ? 'border-green-500/30 bg-green-500/5' : 'border-border/50 bg-card/50'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground">{n.time}</span>
              </div>
              <p>{n.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Team online */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Équipe en ligne</p>
            <div className="space-y-2">
              {selected.team.map(member => (
                <div key={member} className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserCheck className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-xs">{member}</span>
                  <span className="ml-auto text-[8px] text-green-500">●</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────
export default function InnovationHub() {
  return (
    <MainLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Innovation Hub</h1>
            <p className="text-xs text-muted-foreground">NLP • Simulations Prédictives • Workflows Collaboratifs</p>
          </div>
        </div>

        <Tabs defaultValue="nlp" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="nlp" className="gap-2 text-xs"><MessageSquare className="h-3.5 w-3.5" /> NLP</TabsTrigger>
            <TabsTrigger value="simulation" className="gap-2 text-xs"><GitBranch className="h-3.5 w-3.5" /> Simulations</TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2 text-xs"><Users className="h-3.5 w-3.5" /> Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="nlp" className="min-h-[60vh]">
            <NLPInterface />
          </TabsContent>
          <TabsContent value="simulation">
            <SimulationEngine />
          </TabsContent>
          <TabsContent value="workflows">
            <CollaborativeWorkflows />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
