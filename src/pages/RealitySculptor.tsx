import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Box, Layers, Wand2, Users, Cpu, Activity,
  RotateCcw, Zap, Eye, Sparkles, Settings2, Globe
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

function ResultPanel({ result, loading, icon: Icon, emptyText }: { result: string; loading: boolean; icon: any; emptyText: string }) {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardContent className="pt-4">
        <ScrollArea className="h-[440px]">
          {result ? (
            <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
              <Icon className="w-8 h-8 opacity-30" />
              <span>{emptyText}</span>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Digital Twin Constructor ────────────────────────────────
function DigitalTwinConstructor() {
  const { result, loading, run } = useStream();
  const [target, setTarget] = useState<'product' | 'process' | 'business'>('process');
  const [context, setContext] = useState('');

  const targets = [
    { id: 'product' as const, label: 'Produit', icon: Box, desc: 'Formules béton & qualité' },
    { id: 'process' as const, label: 'Process', icon: Settings2, desc: 'Production & livraison' },
    { id: 'business' as const, label: 'Business Model', icon: Globe, desc: 'Modèle économique' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {targets.map(t => (
              <button key={t.id} onClick={() => setTarget(t.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${target === t.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <t.icon className={`w-4 h-4 ${target === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{t.label}</span>
                <span className="text-[9px] text-muted-foreground">{t.desc}</span>
              </button>
            ))}
          </div>
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Contexte spécifique (optionnel): quel aspect modéliser en détail..." className="text-xs min-h-[45px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Reality Sculptor de TBOS — un architecte de jumeaux numériques pour l'industrie du béton prêt à l'emploi au Maroc.

CIBLE DU JUMEAU NUMÉRIQUE: ${targets.find(t => t.id === target)!.label}
${context.trim() ? `FOCUS SPÉCIFIQUE: ${context}` : ''}

TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, 50 camions, formules B25-B50, 5 ans de données (50K+ livraisons).

CONSTRUIS LE JUMEAU NUMÉRIQUE COMPLET:

1. 🏗️ ARCHITECTURE DU JUMEAU
   - Composants modélisés (entités, flux, variables d'état)
   - Schéma ASCII du modèle (blocs + connexions)
   - Variables d'entrée (capteurs, données temps-réel)
   - Variables de sortie (KPIs, alertes, prédictions)
   - Granularité temporelle (seconde, minute, heure, jour)

2. 📊 ÉTAT ACTUEL — Miroir de la Réalité
   - Snapshot des métriques clés du jumeau MAINTENANT
   - Anomalies détectées vs le modèle théorique
   - Score de fidélité jumeau ↔ réalité: X/100
   - Zones où le jumeau diverge du réel (et pourquoi)

3. 🔬 PARAMÈTRES MANIPULABLES
   Pour chaque levier (min 8):
   - 🎛️ NOM — Description
   - 📐 Plage: [min — max] (unité)
   - 📍 Valeur actuelle
   - 🎯 Valeur optimale théorique
   - ⚡ Sensibilité: impact d'un changement de 10%
   - 🔗 Corrélations avec d'autres paramètres

4. 🧪 SCÉNARIOS DE SIMULATION
   3 scénarios pré-configurés:
   Pour chaque:
   - 🏷️ Nom du scénario
   - 🔧 Paramètres modifiés
   - 📊 Résultats simulés (avant/après)
   - ⚠️ Risques identifiés
   - 💰 Impact financier estimé (MAD/an)

5. 🌡️ TABLEAU DE BORD DU JUMEAU
   - Métriques vitales en temps-réel (format dashboard)
   - Indicateurs de santé du modèle
   - Prochaine calibration recommandée

Style: Ingénieur simulation × Architecte systèmes. Précis, visuel, actionnable. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Box className="w-4 h-4 mr-2" />}
            Construire le Jumeau Numérique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} loading={loading} icon={Box} emptyText="Sélectionnez une cible et construisez le jumeau numérique" />
    </div>
  );
}

// ─── Dynamic Morphing Engine ─────────────────────────────────
function DynamicMorphingEngine() {
  const { result, loading, run } = useStream();
  const [scenario, setScenario] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="Décrivez un changement réel à simuler: hausse du prix du ciment de 15%, nouveau client 500m³/mois, panne toupie #7..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Reality Sculptor — moteur de morphing dynamique qui fait évoluer les jumeaux numériques en temps-réel.

ÉVÉNEMENT / CHANGEMENT: ${scenario.trim() || "Hausse soudaine du prix du ciment CPJ45 de +18% suite à une pénurie mondiale"}
TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, 50 camions.

MORPHING DU JUMEAU NUMÉRIQUE:

1. 🌊 ONDE DE CHOC — Propagation de l'impact
   Timeline heure par heure (H+0 à H+72):
   - H+0: L'événement se produit
   - H+1: Premiers systèmes affectés
   - H+4: Cascade de second ordre
   - H+24: Nouvel équilibre partiel
   - H+72: État stabilisé
   Pour chaque étape: systèmes touchés, magnitude, actions nécessaires

2. 📈 AVANT/APRÈS — Tableau comparatif
   | Métrique | Avant | Après | Δ | Impact |
   15+ métriques affectées avec chiffres précis

3. 🔄 ADAPTATIONS AUTOMATIQUES
   5 ajustements que le jumeau recommande IMMÉDIATEMENT:
   - Paramètre à modifier
   - Ancienne valeur → Nouvelle valeur
   - Justification
   - Délai d'implémentation
   - Gain/perte estimé

4. 🌳 ARBRE DE DÉCISION
   Le morphing génère 3 chemins possibles:
   - 🟢 Chemin conservateur (minimiser les pertes)
   - 🟡 Chemin adaptatif (optimiser la transition)
   - 🔴 Chemin disruptif (transformer la crise en opportunité)
   Pour chaque: actions, timeline, ROI, risque

5. 🎯 NOUVEAU POINT D'ÉQUILIBRE
   - L'état stable après morphing complet
   - Différences permanentes vs l'état précédent
   - Nouvelles vulnérabilités créées
   - Nouvelles forces émergentes

Style: Ingénieur contrôle × Stratège temps-réel. Dynamique, précis, anticipatif. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Morpher le Jumeau
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} loading={loading} icon={RotateCcw} emptyText="Décrivez un changement pour voir le jumeau se transformer" />
    </div>
  );
}

// ─── Innovation Sculptor ─────────────────────────────────────
function InnovationSculptor() {
  const { result, loading, run } = useStream();
  const [mode, setMode] = useState<'architecture' | 'process' | 'model'>('architecture');

  const modes = [
    { id: 'architecture' as const, label: 'Architecture Produit', icon: Layers, desc: 'Nouvelles formulations' },
    { id: 'process' as const, label: 'Flux Process', icon: Activity, desc: 'Réinventer la production' },
    { id: 'model' as const, label: 'Business Model', icon: Sparkles, desc: 'Modèles disruptifs' },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {modes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${mode === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <m.icon className={`w-4 h-4 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[9px] text-muted-foreground">{m.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => run(
            `Tu es le Reality Sculptor — sculpteur de configurations d'innovation radicalement nouvelles dans l'espace virtuel.

MODE: ${modes.find(m => m.id === mode)!.label} — ${modes.find(m => m.id === mode)!.desc}
TBOS: Centrale béton Maroc, 80M MAD CA, formules B25-B50, 50 camions, 200+ clients.

SCULPTURE D'INNOVATION:

${mode === 'architecture' ? `🏛️ NOUVELLES ARCHITECTURES PRODUIT

1. SCULPTURE #1 — Le béton qui n'existe pas encore
   - Concept: formulation radicalement nouvelle
   - Composition: matériaux, dosages, process de fabrication
   - Propriétés uniques (résistance, durabilité, empreinte carbone)
   - Marché cible et positionnement prix
   - Schéma ASCII de la structure moléculaire/macro
   - Faisabilité TBOS: /100

2. SCULPTURE #2 — Le produit-service hybride
   - Au-delà du m³: que vend-on vraiment?
   - Architecture de l'offre (couches de valeur)
   - Modèle de pricing innovant
   - Avantage compétitif structurel

3. SCULPTURE #3 — La gamme impossible
   - 5 produits que personne n'a osé imaginer dans le BPE
   - Pour chaque: concept, faisabilité technique, taille de marché

4. 🏆 LA CONFIGURATION OPTIMALE
   - La combinaison de produits qui maximise marge × différenciation
   - Roadmap de développement (6-18 mois)` :
mode === 'process' ? `⚙️ NOUVEAUX FLUX DE PROCESS

1. SCULPTURE #1 — L'usine du futur
   - Schéma ASCII complet du process réinventé
   - Étapes éliminées, ajoutées, fusionnées
   - Technologies clés (IoT, AI, robotique)
   - Gains: temps (-X%), coût (-X%), qualité (+X%)

2. SCULPTURE #2 — Le process inversé
   - Et si on partait de la livraison pour remonter à la production?
   - Flux tiré vs flux poussé: impact complet
   - Réorganisation spatiale de la centrale

3. SCULPTURE #3 — Le process distribué
   - Micro-centrales mobiles vs méga-centrale fixe
   - Avantages logistiques, limites techniques
   - Modèle hybride optimal pour le Maroc

4. 🏆 PROCESS SCULPTED
   - Le flux de production idéal combinant les 3 sculptures
   - ROI estimé vs process actuel` :
`💎 BUSINESS MODELS DISRUPTIFS

1. SCULPTURE #1 — Le modèle plateforme
   - TBOS comme marketplace du béton
   - Acteurs, flux, commission
   - Effet réseau et moat compétitif

2. SCULPTURE #2 — Le modèle outcome-based
   - Vendre de la résistance, pas du m³
   - Garantie de performance à 50 ans
   - Pricing, assurance, différenciation

3. SCULPTURE #3 — Le modèle circulaire
   - Béton-as-a-Service: fourniture + récupération + recyclage
   - Impact environnemental et réglementaire
   - Premium de prix justifiable

4. 🏆 LE BUSINESS MODEL SCULPTED
   - Combinaison hybride des 3 modèles
   - Avantage concurrentiel résultant
   - Timeline d'implémentation`}

CLÔTURE: Score d'innovation de chaque sculpture (/100) et recommandation prioritaire.

Style: Designer industriel × Architecte d'affaires. Visionnaire, structuré, audacieux. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Sculpter l'Innovation — {modes.find(m => m.id === mode)?.label}
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} loading={loading} icon={Wand2} emptyText="Choisissez un mode et sculptez de nouvelles configurations" />
    </div>
  );
}

// ─── Collaborative Space ─────────────────────────────────────
function CollaborativeSpace() {
  const { result, loading, run } = useStream();
  const [command, setCommand] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Commande en langage naturel: 'Montre-moi l'impact si on double la capacité de production tout en réduisant l'équipe de 20%'..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es le Reality Sculptor — interface collaborative immersive pour explorer et manipuler les espaces d'innovation virtuels.

COMMANDE DE L'INNOVATEUR: ${command.trim() || "Montre-moi comment serait TBOS si on passait à 100% énergie solaire et béton recyclé, avec une flotte électrique"}

TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, 50 camions.

ESPACE D'INNOVATION IMMERSIF:

1. 🌐 RENDU DE LA RÉALITÉ ALTERNATIVE
   Description visuelle détaillée de cette version de TBOS:
   - L'environnement physique (la centrale transformée)
   - Les opérations quotidiennes (une journée type)
   - Les interactions humaines (qui fait quoi différemment)
   - Les flux de données (ce qu'on mesure, ce qu'on voit)

2. 📊 DASHBOARD DE LA RÉALITÉ SCULPTÉE
   Métriques clés dans cette réalité:
   | Métrique | Réalité Actuelle | Réalité Sculptée | Δ |
   20+ métriques financières, opérationnelles, environnementales

3. 🎮 CONTRÔLES INTERACTIFS
   "Dans cet espace, vous pouvez manipuler:"
   - 🎛️ Slider 1: [Paramètre] — actuellement à X, essayez Y
   - 🎛️ Slider 2-8: ...
   - 🔘 Toggle A-D: Options on/off
   Pour chaque: ce qui change visuellement et numériquement

4. 👥 PERSONAS DANS CET ESPACE
   Comment chaque rôle vit cette réalité:
   - 👤 Max (CEO): ce qu'il voit sur son dashboard
   - 👤 Karim (Superviseur): sa journée type
   - 👤 Chauffeur: son expérience
   - 👤 Client: ce qui change pour lui

5. ⚡ POINTS DE FRICTION
   - 3 obstacles majeurs pour atteindre cette réalité
   - Pour chaque: solution et timeline
   - Investissement total nécessaire (MAD)
   - Chemin le plus court: réalité actuelle → réalité sculptée

6. 🔮 PROCHAINES COMMANDES SUGGÉRÉES
   "Essayez aussi:" — 5 commandes intéressantes à explorer

Style: Game designer × Architecte d'expérience. Immersif, interactif, inspirant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
            Explorer l'Espace d'Innovation
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} loading={loading} icon={Users} emptyText="Décrivez une réalité alternative à explorer collaborativement" />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function RealitySculptor() {
  const [activeTab, setActiveTab] = useState('twin');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Reality Sculptor</h1>
            <p className="text-xs text-muted-foreground">Jumeaux numériques, morphing dynamique, sculpture d'innovation</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>Simulation Active</span>
          </div>
          <span>3 cibles jumeau</span>
          <span>3 modes sculpture</span>
          <span>∞ réalités</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="twin" className="text-xs font-mono gap-1.5">
            <Box className="w-3.5 h-3.5" /> Jumeau
          </TabsTrigger>
          <TabsTrigger value="morph" className="text-xs font-mono gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Morphing
          </TabsTrigger>
          <TabsTrigger value="sculpt" className="text-xs font-mono gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> Sculpteur
          </TabsTrigger>
          <TabsTrigger value="collab" className="text-xs font-mono gap-1.5">
            <Users className="w-3.5 h-3.5" /> Espace Collab
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="twin" className="mt-4"><DigitalTwinConstructor /></TabsContent>
            <TabsContent value="morph" className="mt-4"><DynamicMorphingEngine /></TabsContent>
            <TabsContent value="sculpt" className="mt-4"><InnovationSculptor /></TabsContent>
            <TabsContent value="collab" className="mt-4"><CollaborativeSpace /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
