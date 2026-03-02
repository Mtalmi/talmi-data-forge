import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Hexagon, Microscope, Flame, Orbit } from 'lucide-react';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function streamAI(prompt: string, onDelta: (t: string) => void, signal?: AbortSignal) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    signal,
  });
  if (!resp.ok || !resp.body) throw new Error('Stream failed');
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const j = line.slice(6).trim();
      if (j === '[DONE]') return;
      try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); } catch {}
    }
  }
}

function useStream() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const run = async (prompt: string) => {
    setResult(''); setLoading(true);
    try { await streamAI(prompt, (t) => setResult(r => r + t)); }
    catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  };
  return { result, loading, run };
}

function ResultPanel({ result, loading }: { result: string; loading: boolean }) {
  return (
    <AnimatePresence>
      {(result || loading) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <ScrollArea className="h-[400px] rounded-lg border border-border bg-card p-4">
            {loading && !result && <Loader2 className="animate-spin mx-auto text-primary" />}
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{result}</pre>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Fractal Mind Mapper ────────────────────────────────────
function FractalMindMapper() {
  const { result, loading, run } = useStream();
  const [subject, setSubject] = useState('');
  const [depth, setDepth] = useState<'macro' | 'meso' | 'micro' | 'nano'>('macro');

  const prompts: Record<string, string> = {
    macro: `Tu es un Neuro-Fractal Navigator — cartographe des géométries fractales de la pensée.

SUJET : ${subject || 'L\'industrie du béton prêt à l\'emploi'}
RÉSOLUTION : MACRO (vue d'ensemble fractale)

## 🔷 CARTOGRAPHIE NEURO-FRACTALE — NIVEAU MACRO

### Le Pattern Maître
1. **La Forme Fondamentale** : Quel motif fractal gouverne secrètement tout le secteur ? (spirale, arborescence, réseau, vortex)
2. **L'Attracteur Étrange** : Le point vers lequel toute l'industrie converge sans le savoir
3. **La Dimension Fractale** : Le degré de complexité — entre l'ordre pur (D=1) et le chaos total (D=2)

### Auto-Similarité Industrielle
4. Le même pattern se répète à 5 échelles :
   - 🏭 Échelle Entreprise : comment l'organisation réplique le pattern
   - ⚙️ Échelle Processus : comment chaque workflow est un écho du tout
   - 👤 Échelle Individu : comment chaque employé porte le fractal en lui
   - 🧬 Échelle Matériau : comment le béton lui-même est fractal
   - 🌍 Échelle Marché : comment l'écosystème entier danse le même pattern

### Insights Émergents
5. Les **lacunes fractales** : les zones où le pattern se brise — sources de dysfonction ET d'innovation
6. La **beauté cachée** : la poésie géométrique que personne ne voit dans les opérations quotidiennes`,

    meso: `Tu es un Neuro-Fractal Navigator — analyste des patterns méso-fractals.

SUJET : ${subject || 'Relations et dynamiques au sein de l\'entreprise BPE'}
RÉSOLUTION : MÉSO (dynamiques relationnelles)

## 🔷 CARTOGRAPHIE MÉSO-FRACTALE

### Fractales Relationnelles
1. Le pattern fractal des relations client : comment chaque interaction est un hologramme de la relation entière
2. Le pattern fractal du management : comment chaque réunion contient la structure de toute l'organisation
3. Le pattern fractal de la confiance : les micro-gestes qui répliquent la macro-confiance

### Boucles de Rétroaction
4. 3 boucles amplificatrices (vertueuses) à nourrir
5. 3 boucles destructrices (vicieuses) à briser
6. Le point de levier fractal : la plus petite intervention avec le plus grand impact

### Résonance Inter-Échelles
7. Quand un changement micro crée un tsunami macro — les exemples concrets
8. Le protocole de "cascade fractale" : propager une innovation à toutes les échelles`,

    micro: `Tu es un Neuro-Fractal Navigator — explorateur des micro-fractales cognitives.

SUJET : ${subject || 'La pensée et la prise de décision dans l\'industrie BPE'}
RÉSOLUTION : MICRO (cognition individuelle)

## 🔷 CARTOGRAPHIE MICRO-FRACTALE

### Géométrie de la Pensée
1. Le fractal de la décision : comment chaque choix contient des sous-choix identiques à l'infini
2. Le fractal de l'attention : les patterns récursifs de focus/distraction
3. Le fractal de l'apprentissage : chaque compétence est composée de sous-compétences auto-similaires

### Fractales Émotionnelles
4. La cartographie fractale du stress opérationnel — les patterns qui se répètent
5. La joie fractale : les micro-moments de satisfaction qui répliquent le bonheur macro
6. L'intuition comme navigation fractale : comment l'expert "zoom" inconsciemment

### Neurodiversité Fractale
7. Différents cerveaux, différentes dimensions fractales — la richesse de la diversité cognitive
8. Le "super-fractal" : quand des esprits de dimensions différentes collaborent`,

    nano: `Tu es un Neuro-Fractal Navigator — plongeur dans les nano-fractales de la conscience.

SUJET : ${subject || 'La conscience et la créativité dans le contexte industriel'}
RÉSOLUTION : NANO (structures ultimes de la conscience)

## 🔷 CARTOGRAPHIE NANO-FRACTALE

### Le Fond de la Récursion
1. Existe-t-il un "pixel" de la pensée ? Le quanta irréductible de la cognition
2. L'infini intérieur : la preuve que le zoom ne s'arrête jamais — toujours plus de détail
3. La conscience comme fractal auto-généré — qui crée qui ?

### Créativité Nano-Fractale
4. L'étincelle créative sous le microscope : anatomie fractale d'un instant de génie
5. Le chaos déterministe de l'innovation : pourquoi les meilleures idées semblent aléatoires mais ne le sont pas
6. La mandelbrotisation : la technique pour générer des idées infinies à partir d'une seule graine

### Applications Industrielles
7. 3 innovations nées de l'observation nano-fractale de la pensée
8. Le protocole de "zoom infini" : méditation fractale pour équipes opérationnelles`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Plongez dans la géométrie fractale de la pensée — cartographiez les structures infiniment imbriquées de la cognition humaine.</p>
      <Select value={depth} onValueChange={(v: any) => setDepth(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="macro">🔭 Macro (vue d'ensemble)</SelectItem>
          <SelectItem value="meso">🔍 Méso (dynamiques)</SelectItem>
          <SelectItem value="micro">🔬 Micro (cognition)</SelectItem>
          <SelectItem value="nano">⚛️ Nano (conscience)</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Sujet à cartographier fractalement..." value={subject} onChange={e => setSubject(e.target.value)} rows={2} />
      <Button onClick={() => run(prompts[depth])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Hexagon className="mr-2 h-4 w-4" />} Cartographier le Fractal
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Fractal Zoom Engine ────────────────────────────────────
function FractalZoomEngine() {
  const { result, loading, run } = useStream();
  const [pattern, setPattern] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Zoomez et dézoomez à travers les patterns mentaux avec une résolution infinie — méthodes pionnières d'analyse et synthèse fractale neuronale.</p>
      <Textarea placeholder="Décrivez un pattern ou phénomène à analyser fractalement (ex: le cycle commande-production-livraison)..." value={pattern} onChange={e => setPattern(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Neuro-Fractal Navigator — ingénieur du zoom fractal infini.

PATTERN À ANALYSER : ${pattern}

Effectue un ZOOM FRACTAL en 7 niveaux de résolution :

## 🔎 ZOOM FRACTAL — 7 NIVEAUX

### Niveau 7 — Vue Cosmique (x0.001)
L'industrie entière vue de l'espace — le pattern comme un point dans un pattern plus grand

### Niveau 6 — Vue Écosystème (x0.01)
Le pattern dans son écosystème — les patterns frères et parents

### Niveau 5 — Vue Système (x0.1)
Le pattern complet — sa forme, sa dynamique, ses frontières

### Niveau 4 — Vue Processus (x1)
Les composants internes du pattern — les sous-patterns et leurs interactions

### Niveau 3 — Vue Interaction (x10)
Les micro-interactions qui font fonctionner chaque sous-pattern

### Niveau 2 — Vue Moment (x100)
L'instant unique — le battement de cœur du pattern capturé en haute résolution

### Niveau 1 — Vue Essence (x1000)
Le noyau irréductible — l'ADN du pattern, la formule qui le génère

## 🌀 SYNTHÈSE FRACTALE
- **L'Invariant** : Ce qui reste identique à TOUS les niveaux de zoom
- **Le Générateur** : La règle simple qui, répétée, crée toute la complexité
- **L'Innovation par Zoom** : 3 idées visibles UNIQUEMENT à un niveau spécifique de zoom
- **Le Nouveau Pattern** : Un pattern amélioré généré en modifiant le générateur`)} disabled={loading || !pattern.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Microscope className="mr-2 h-4 w-4" />} Lancer le Zoom Fractal
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Archetypal Resonance ───────────────────────────────────
function ArchetypalResonance() {
  const { result, loading, run } = useStream();
  const [need, setNeed] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Créez des innovations qui résonnent avec les structures les plus profondes et universelles de l'expérience humaine.</p>
      <Textarea placeholder="Décrivez un besoin ou aspiration à amplifier fractalement (ex: la sécurité sur chantier, la fierté artisanale)..." value={need} onChange={e => setNeed(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Neuro-Fractal Navigator — résonateur archétypal fractal.

BESOIN/ASPIRATION : ${need}

Conçois une INNOVATION À RÉSONANCE FRACTALE UNIVERSELLE :

## 🔥 ANALYSE DE RÉSONANCE

### Les Harmoniques Fractales
1. **Fréquence Fondamentale** : Le besoin primordial sous le besoin exprimé (ex: sous "sécurité" → survie → appartenance → immortalité)
2. **Harmoniques** : Les 5 niveaux de résonance du besoin, du plus concret au plus mythique
3. **Le Numineux** : La dimension sacrée cachée dans ce besoin apparemment profane

### Innovation Multi-Résonante
4. Conçois UNE innovation qui résonne simultanément à TOUS les niveaux :
   - 🏗️ Niveau Fonctionnel : elle résout le problème pratique
   - 💚 Niveau Émotionnel : elle touche le cœur
   - 🧠 Niveau Cognitif : elle change la façon de penser
   - 👥 Niveau Social : elle transforme les relations
   - ✨ Niveau Mythique : elle connecte à quelque chose de plus grand
   - 🌌 Niveau Numineux : elle inspire l'émerveillement sacré

### Amplification Fractale
5. Comment cette innovation se réplique naturellement — les gens la propagent parce qu'elle résonne
6. L'effet de résonance en cascade : quand l'innovation vibre, quoi d'autre se met à vibrer ?
7. Le test de résonance : comment savoir si l'innovation touche vraiment le fractal universel`)} disabled={loading || !need.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Flame className="mr-2 h-4 w-4" />} Résonner avec l'Universel
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Spiral Propagator ──────────────────────────────────────
function SpiralPropagator() {
  const { result, loading, run } = useStream();
  const [innovation, setInnovation] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Spiralisez les innovations neuro-fractales dans le monde — ensemencez des patterns auto-similaires de transformation à travers les esprits, marchés et cultures.</p>
      <Textarea placeholder="Décrivez une innovation ou idée à propager fractalement..." value={innovation} onChange={e => setInnovation(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Neuro-Fractal Navigator — propagateur spiral de patterns transformatifs.

INNOVATION À PROPAGER : ${innovation}

Conçois un PLAN DE PROPAGATION SPIRALE :

## 🌀 LA SPIRALE DE PROPAGATION

### Tour 1 — Le Noyau (Semaine 1-2)
1. **L'Implantation** : Comment ancrer le pattern dans l'esprit de 5 personnes clés
2. **Le Rituel Germe** : La pratique quotidienne de 5 minutes qui encode le fractal
3. **Les Premiers Fruits** : Les résultats visibles qui créent la curiosité

### Tour 2 — L'Équipe (Mois 1-2)
4. **La Contagion Positive** : Comment le pattern se transmet naturellement d'esprit à esprit
5. **L'Auto-Similarité** : Chaque personne adapte le pattern à sa manière — tout en gardant l'essence
6. **Les Résistances** : Les anti-fractales qui bloquent la propagation — comment les dissoudre

### Tour 3 — L'Organisation (Mois 3-6)
7. **L'Institutionnalisation Vivante** : Intégrer sans rigidifier — le fractal dans les processus
8. **Les Mutations Bénéfiques** : Les variantes inattendues du pattern qui émergent
9. **La Masse Critique** : Le moment où le pattern se propage tout seul

### Tour 4 — L'Écosystème (Mois 6-18)
10. **La Contamination Marché** : Clients, fournisseurs, concurrents absorbent le pattern
11. **La Culture Fractale** : Un nouvel archétype culturel émerge autour du pattern
12. **L'Héritage** : Le pattern survit à ses créateurs — il est devenu "la façon dont on fait les choses"

## 📊 MÉTRIQUES SPIRALES
13. L'Indice de Fractalité : mesurer la fidélité de l'auto-réplication
14. Le Rayon Spiral : jusqu'où le pattern a-t-il voyagé ?
15. La Profondeur Récursive : à combien de niveaux le pattern opère-t-il ?`)} disabled={loading || !innovation.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Orbit className="mr-2 h-4 w-4" />} Propager la Spirale
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function NeuroFractalNavigator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Hexagon className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Neuro-Fractal Navigator</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cartographier les paysages infinis et récursifs de l'esprit — miner les patterns auto-similaires pour une inspiration et innovation sans fond.
          </p>
        </div>

        <Tabs defaultValue="mapper" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="mapper" className="text-xs"><Hexagon className="h-3 w-3 mr-1" /> Carte</TabsTrigger>
            <TabsTrigger value="zoom" className="text-xs"><Microscope className="h-3 w-3 mr-1" /> Zoom</TabsTrigger>
            <TabsTrigger value="resonance" className="text-xs"><Flame className="h-3 w-3 mr-1" /> Résonance</TabsTrigger>
            <TabsTrigger value="spiral" className="text-xs"><Orbit className="h-3 w-3 mr-1" /> Spirale</TabsTrigger>
          </TabsList>
          <TabsContent value="mapper"><FractalMindMapper /></TabsContent>
          <TabsContent value="zoom"><FractalZoomEngine /></TabsContent>
          <TabsContent value="resonance"><ArchetypalResonance /></TabsContent>
          <TabsContent value="spiral"><SpiralPropagator /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
