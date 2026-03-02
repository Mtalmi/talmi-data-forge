import { useState, useCallback, useRef, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Lightbulb, FlaskConical, Radar, Send, Loader2, Sparkles,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Play, RotateCcw,
  Zap, BarChart3, Target, Gauge, Activity, Search, ChevronRight,
  Star, ArrowUpRight, Clock, Layers, Eye, ThumbsUp, ThumbsDown,
  Cpu, Database, LineChart, Shuffle, Filter, Plus, X
} from 'lucide-react';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

// ─── Tab 1: Data Synthesis Engine ───────────────────────────────────────
const DATA_SOURCES = [
  { id: 'production', label: 'Production', icon: Cpu, records: '12,847', status: 'live' },
  { id: 'quality', label: 'Qualité Labo', icon: FlaskConical, records: '3,291', status: 'live' },
  { id: 'logistics', label: 'Logistique', icon: Activity, records: '8,503', status: 'live' },
  { id: 'finance', label: 'Finance', icon: BarChart3, records: '5,672', status: 'live' },
  { id: 'clients', label: 'Retours Clients', icon: Star, records: '1,204', status: 'live' },
  { id: 'market', label: 'Tendances Marché', icon: TrendingUp, records: '946', status: 'sync' },
];

interface Insight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  sources: string[];
}

function DataSynthesisEngine() {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [streamedAnalysis, setStreamedAnalysis] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const runSynthesis = useCallback(async () => {
    if (!query.trim()) return;
    setIsAnalyzing(true);
    setStreamedAnalysis('');
    setInsights([]);

    const controller = new AbortController();
    abortRef.current = controller;
    let content = '';

    try {
      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `En tant qu'analyste AI industriel pour une centrale à béton au Maroc (TBOS), analyse cette demande et fournis des insights actionnables:\n\n"${query}"\n\nStructure ta réponse avec:\n1. 🔍 SYNTHÈSE des données pertinentes\n2. 💡 INSIGHTS clés (3-5 points)\n3. ⚡ OPPORTUNITÉS identifiées\n4. 📊 MÉTRIQUES à surveiller\n5. 🎯 RECOMMANDATIONS prioritaires`
          }],
          mode: 'chat'
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`Erreur ${resp.status}`);
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
            const delta = JSON.parse(json).choices?.[0]?.delta?.content;
            if (delta) { content += delta; setStreamedAnalysis(content); }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }

      // Generate mock insights after analysis
      setInsights([
        { id: '1', title: 'Optimisation dosage ciment', description: 'Réduction de 8% possible sur les formules B25 sans impact qualité', impact: 'high', category: 'Production', confidence: 92, sources: ['Production', 'Qualité Labo'] },
        { id: '2', title: 'Pic demande zone Bouskoura', description: 'Hausse de 23% des commandes détectée — préparer capacité supplémentaire', impact: 'high', category: 'Commercial', confidence: 87, sources: ['Clients', 'Logistique'] },
        { id: '3', title: 'Maintenance préventive T-05', description: 'Patterns de consommation anormaux détectés — intervention recommandée sous 72h', impact: 'medium', category: 'Maintenance', confidence: 78, sources: ['Logistique', 'Production'] },
      ]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setStreamedAnalysis(`❌ ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Data Sources Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {DATA_SOURCES.map(src => (
          <Card key={src.id} className="border-border/50 bg-card/50">
            <CardContent className="p-3 text-center">
              <src.icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
              <p className="text-[10px] font-semibold">{src.label}</p>
              <p className="text-xs font-bold text-primary">{src.records}</p>
              <Badge variant={src.status === 'live' ? 'default' : 'secondary'} className="text-[8px] mt-1">
                {src.status === 'live' ? '● Live' : '↻ Sync'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Query Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runSynthesis()}
            placeholder="Ex: Analyse les tendances de marge par formule sur les 3 derniers mois…"
            className="pl-10 h-12 rounded-xl"
            disabled={isAnalyzing}
          />
        </div>
        <Button onClick={runSynthesis} disabled={!query.trim() || isAnalyzing} size="lg" className="h-12 px-6 rounded-xl gap-2">
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Synthétiser
        </Button>
      </div>

      {/* Streamed Analysis */}
      {streamedAnalysis && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Analyse Multi-Sources
              {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{streamedAnalysis}</div>
          </CardContent>
        </Card>
      )}

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insights Extraits</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <motion.div key={ins.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`border-border/50 ${ins.impact === 'high' ? 'bg-primary/5 border-primary/20' : 'bg-card/50'}`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={ins.impact === 'high' ? 'default' : 'secondary'} className="text-[9px]">{ins.impact.toUpperCase()}</Badge>
                      <span className="text-[10px] text-muted-foreground">{ins.confidence}% confiance</span>
                    </div>
                    <p className="text-sm font-semibold">{ins.title}</p>
                    <p className="text-xs text-muted-foreground">{ins.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      {ins.sources.map(s => <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Idea Generator & Refiner ────────────────────────────────────
interface Idea {
  id: string;
  title: string;
  description: string;
  score: number;
  feasibility: number;
  impact: number;
  novelty: number;
  status: 'draft' | 'refining' | 'validated' | 'rejected';
  iteration: number;
}

function IdeaGenerator() {
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([
    { id: '1', title: 'Béton auto-cicatrisant', description: 'Intégrer des capsules bactériennes dans les formules B35+ pour auto-réparation des micro-fissures', score: 88, feasibility: 65, impact: 95, novelty: 92, status: 'validated', iteration: 3 },
    { id: '2', title: 'Livraison prédictive', description: 'Pré-positionner les toupies basé sur l\'historique de commandes et la météo', score: 82, feasibility: 85, impact: 78, novelty: 74, status: 'refining', iteration: 2 },
    { id: '3', title: 'Marketplace résidus béton', description: 'Revendre les retours de béton non-utilisés aux petits chantiers à prix réduit', score: 76, feasibility: 90, impact: 68, novelty: 71, status: 'draft', iteration: 1 },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [refinementOutput, setRefinementOutput] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const generateIdeas = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setRefinementOutput('');

    const controller = new AbortController();
    abortRef.current = controller;
    let content = '';

    try {
      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `En tant que moteur d'innovation pour une centrale à béton (TBOS), génère 3 idées innovantes basées sur ce contexte:\n\n"${prompt}"\n\nPour chaque idée:\n- 🏷️ Titre accrocheur\n- 📝 Description (2-3 phrases)\n- 🎯 Impact business estimé\n- ⚡ Faisabilité technique\n- 🔮 Degré d'innovation\n- 📋 Prochaines étapes concrètes` }],
          mode: 'chat'
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`Erreur ${resp.status}`);
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
            const delta = JSON.parse(json).choices?.[0]?.delta?.content;
            if (delta) { content += delta; setRefinementOutput(content); }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setRefinementOutput(`❌ ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

  const refineIdea = useCallback(async (idea: Idea) => {
    setSelectedIdea(idea);
    setIsGenerating(true);
    setRefinementOutput('');

    const controller = new AbortController();
    abortRef.current = controller;
    let content = '';

    try {
      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Affine et améliore cette idée d'innovation pour TBOS (centrale à béton):\n\nIdée: "${idea.title}"\nDescription: "${idea.description}"\nItération actuelle: ${idea.iteration}\n\nFournis:\n1. 🔄 Version améliorée de l'idée\n2. 🧪 Tests de validation suggérés\n3. 💰 Estimation ROI\n4. ⚠️ Risques identifiés\n5. 📅 Roadmap d'implémentation (3 phases)` }],
          mode: 'chat'
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`Erreur ${resp.status}`);
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
            const delta = JSON.parse(json).choices?.[0]?.delta?.content;
            if (delta) { content += delta; setRefinementOutput(content); }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }

      // Update iteration count
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, iteration: i.iteration + 1, status: 'refining' as const } : i));
    } catch (err: any) {
      if (err.name !== 'AbortError') setRefinementOutput(`❌ ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const statusColor = (s: string) => s === 'validated' ? 'text-green-500' : s === 'refining' ? 'text-primary' : s === 'rejected' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Ideas pipeline */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex gap-2">
          <Input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateIdeas()} placeholder="Décrivez un défi ou une opportunité…" className="h-10 rounded-xl" />
          <Button onClick={generateIdeas} disabled={!prompt.trim() || isGenerating} size="sm" className="gap-1 rounded-xl">
            {isGenerating && !selectedIdea ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
            Générer
          </Button>
        </div>

        <div className="space-y-3">
          {ideas.map((idea, i) => (
            <motion.div key={idea.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border-border/50 cursor-pointer transition-all hover:border-primary/30 ${selectedIdea?.id === idea.id ? 'border-primary bg-primary/5' : 'bg-card/50'}`} onClick={() => setSelectedIdea(idea)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[9px]">Itération {idea.iteration}</Badge>
                    <span className={`text-[10px] font-semibold ${statusColor(idea.status)}`}>
                      {idea.status === 'validated' ? '✓ Validée' : idea.status === 'refining' ? '↻ En raffinement' : idea.status === 'rejected' ? '✕ Rejetée' : '◌ Brouillon'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-1">{idea.title}</p>
                  <p className="text-[11px] text-muted-foreground mb-3">{idea.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[9px] text-muted-foreground">Faisabilité</p><p className="text-xs font-bold">{idea.feasibility}%</p></div>
                    <div><p className="text-[9px] text-muted-foreground">Impact</p><p className="text-xs font-bold">{idea.impact}%</p></div>
                    <div><p className="text-[9px] text-muted-foreground">Innovation</p><p className="text-xs font-bold">{idea.novelty}%</p></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={e => { e.stopPropagation(); refineIdea(idea); }}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Raffiner
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={e => { e.stopPropagation(); setIdeas(prev => prev.map(x => x.id === idea.id ? { ...x, status: 'validated' } : x)); }}>
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={e => { e.stopPropagation(); setIdeas(prev => prev.map(x => x.id === idea.id ? { ...x, status: 'rejected' } : x)); }}>
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Score overview */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold">Score Portfolio Innovation</p>
            </div>
            <div className="text-2xl font-bold text-primary">{Math.round(ideas.reduce((a, i) => a + i.score, 0) / ideas.length)}<span className="text-sm text-muted-foreground">/100</span></div>
            <p className="text-[10px] text-muted-foreground mt-1">{ideas.filter(i => i.status === 'validated').length} idées validées • {ideas.filter(i => i.status === 'refining').length} en cours</p>
          </CardContent>
        </Card>
      </div>

      {/* Refinement output */}
      <div className="lg:col-span-7">
        {refinementOutput ? (
          <Card className="border-border/50 bg-card/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {selectedIdea ? `Raffinement: ${selectedIdea.title}` : 'Nouvelles Idées Générées'}
                {isGenerating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="text-sm whitespace-pre-wrap leading-relaxed pr-4">{refinementOutput}</div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center space-y-3">
              <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Sélectionnez une idée et cliquez "Raffiner"<br />ou générez de nouvelles idées</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: Predictive Simulator ────────────────────────────────────────
function PredictiveSimulator() {
  const [scenario, setScenario] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const runSimulation = useCallback(async () => {
    if (!scenario.trim()) return;
    setIsSimulating(true);
    setSimResult('');

    const controller = new AbortController();
    abortRef.current = controller;
    let content = '';

    try {
      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `En tant que moteur de simulation prédictive pour TBOS (centrale à béton au Maroc), simule ce scénario:\n\n"${scenario}"\n\nStructure la simulation:\n1. 📋 PARAMÈTRES du scénario\n2. 🔮 PRÉDICTIONS (court terme: 1 mois, moyen terme: 6 mois, long terme: 1 an)\n3. 📊 MÉTRIQUES IMPACTÉES avec valeurs chiffrées\n4. ⚠️ RISQUES et points de vigilance\n5. ✅ PROBABILITÉ DE SUCCÈS (/100)\n6. 🎯 DÉCISION RECOMMANDÉE (Go / No-Go / Conditionnel)` }],
          mode: 'chat'
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`Erreur ${resp.status}`);
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
            const delta = JSON.parse(json).choices?.[0]?.delta?.content;
            if (delta) { content += delta; setSimResult(content); }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setSimResult(`❌ ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  }, [scenario]);

  const PRESET_SCENARIOS = [
    "Que se passe-t-il si le prix du ciment augmente de 20% pendant 6 mois ?",
    "Impact d'ajouter une 2ème ligne de production sur le CA annuel",
    "Conséquences d'une pénurie de sable pendant la haute saison",
    "ROI d'un système de recyclage des eaux de lavage",
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRESET_SCENARIOS.map((s, i) => (
          <button key={i} onClick={() => { setScenario(s); }} className="text-left p-3 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-all text-xs">
            <span className="text-primary mr-2">💭</span>{s}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="Décrivez votre scénario what-if…" className="rounded-xl min-h-[80px]" disabled={isSimulating} />
        <Button onClick={runSimulation} disabled={!scenario.trim() || isSimulating} className="self-end gap-2 rounded-xl h-12 px-6">
          {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Simuler
        </Button>
      </div>

      {simResult && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              Résultats de Simulation
              {isSimulating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="text-sm whitespace-pre-wrap leading-relaxed pr-4">{simResult}</div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 4: Opportunity Radar ───────────────────────────────────────────
interface Opportunity {
  id: string;
  title: string;
  score: number;
  urgency: 'now' | 'soon' | 'plan';
  category: string;
  description: string;
  estimatedROI: string;
  effort: 'low' | 'medium' | 'high';
}

const OPPORTUNITIES: Opportunity[] = [
  { id: '1', title: 'Contrat cadre TGCC — 50 000 m³/an', score: 95, urgency: 'now', category: 'Commercial', description: 'Appel d\'offres ouvert — deadline dans 12 jours', estimatedROI: '+8.2M MAD/an', effort: 'medium' },
  { id: '2', title: 'Formule B50 haute performance', score: 88, urgency: 'soon', category: 'R&D', description: 'Demande croissante pour projets infrastructure — aucun concurrent local', estimatedROI: '+2.1M MAD/an', effort: 'high' },
  { id: '3', title: 'Optimisation tournées logistique', score: 84, urgency: 'soon', category: 'Opérations', description: 'Algorithme de routing pour réduire les km à vide de 30%', estimatedROI: '420K MAD/an', effort: 'low' },
  { id: '4', title: 'Partenariat carrière Berrechid', score: 79, urgency: 'plan', category: 'Supply Chain', description: 'Sécuriser l\'approvisionnement gravier avec prix préférentiel', estimatedROI: '680K MAD/an', effort: 'medium' },
  { id: '5', title: 'Certification ISO 14001', score: 72, urgency: 'plan', category: 'Qualité', description: 'Ouvre l\'accès aux marchés publics internationaux', estimatedROI: '+3.5M MAD/an', effort: 'high' },
];

function OpportunityRadar() {
  const [opps] = useState<Opportunity[]>(OPPORTUNITIES);
  const urgencyLabel = (u: string) => u === 'now' ? '🔴 Immédiat' : u === 'soon' ? '🟡 Court terme' : '🔵 Planifié';
  const effortColor = (e: string) => e === 'low' ? 'text-green-500' : e === 'medium' ? 'text-yellow-500' : 'text-destructive';

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50"><CardContent className="p-4 text-center">
          <Radar className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{opps.length}</p><p className="text-[10px] text-muted-foreground">Opportunités détectées</p>
        </CardContent></Card>
        <Card className="border-border/50 bg-card/50"><CardContent className="p-4 text-center">
          <Zap className="h-5 w-5 text-destructive mx-auto mb-1" />
          <p className="text-2xl font-bold">{opps.filter(o => o.urgency === 'now').length}</p><p className="text-[10px] text-muted-foreground">Action immédiate</p>
        </CardContent></Card>
        <Card className="border-border/50 bg-card/50"><CardContent className="p-4 text-center">
          <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">+14.9M</p><p className="text-[10px] text-muted-foreground">ROI potentiel total</p>
        </CardContent></Card>
        <Card className="border-border/50 bg-card/50"><CardContent className="p-4 text-center">
          <Target className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{Math.round(opps.reduce((a, o) => a + o.score, 0) / opps.length)}</p><p className="text-[10px] text-muted-foreground">Score moyen</p>
        </CardContent></Card>
      </div>

      {/* Opportunity list */}
      <div className="space-y-3">
        {opps.map((opp, i) => (
          <motion.div key={opp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="border-border/50 bg-card/50 hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Score gauge */}
                  <div className="shrink-0 text-center">
                    <div className="relative h-14 w-14">
                      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="2" />
                        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="2" strokeDasharray={`${opp.score} ${100 - opp.score}`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{opp.score}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{opp.title}</p>
                      <Badge variant="outline" className="text-[8px]">{opp.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{opp.description}</p>
                    <div className="flex items-center gap-4 text-[10px]">
                      <span>{urgencyLabel(opp.urgency)}</span>
                      <span className="text-primary font-semibold">{opp.estimatedROI}</span>
                      <span className={effortColor(opp.effort)}>Effort: {opp.effort}</span>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="shrink-0 gap-1 text-[10px]">
                    Explorer <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────
export default function AIInnovationEngine() {
  return (
    <MainLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Innovation Engine</h1>
            <p className="text-xs text-muted-foreground">Synthèse • Idéation • Simulation • Radar d'Opportunités</p>
          </div>
        </div>

        <Tabs defaultValue="synthesis" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="synthesis" className="gap-1.5 text-xs"><Database className="h-3.5 w-3.5" /> Synthèse</TabsTrigger>
            <TabsTrigger value="ideation" className="gap-1.5 text-xs"><Lightbulb className="h-3.5 w-3.5" /> Idéation</TabsTrigger>
            <TabsTrigger value="simulation" className="gap-1.5 text-xs"><FlaskConical className="h-3.5 w-3.5" /> Simulation</TabsTrigger>
            <TabsTrigger value="radar" className="gap-1.5 text-xs"><Radar className="h-3.5 w-3.5" /> Radar</TabsTrigger>
          </TabsList>

          <TabsContent value="synthesis"><DataSynthesisEngine /></TabsContent>
          <TabsContent value="ideation"><IdeaGenerator /></TabsContent>
          <TabsContent value="simulation"><PredictiveSimulator /></TabsContent>
          <TabsContent value="radar"><OpportunityRadar /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
