import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe, TrendingUp, Hammer, Users } from 'lucide-react';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function streamAI(prompt: string, onDelta: (t: string) => void) {
  const resp = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
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
    catch { setResult(r => r + '\n\n❌ Erreur.'); }
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

// ─── Deep Earth Reader ──────────────────────────────────────
function DeepEarthReader() {
  const { result, loading, run } = useStream();
  const [region, setRegion] = useState('');
  const [scale, setScale] = useState<'local' | 'regional' | 'continental' | 'planetary'>('regional');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Intégrez géologie, écologie, climatologie, archéologie et géographie humaine pour comprendre la planète comme un système complexe en évolution.</p>
      <Textarea placeholder="Région ou territoire à analyser (ex: Casablanca-Settat, Bassin du Rhin, Delta du Mékong)..." value={region} onChange={e => setRegion(e.target.value)} rows={2} />
      <Select value={scale} onValueChange={(v: any) => setScale(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="local">📍 Local (ville/bassin)</SelectItem>
          <SelectItem value="regional">🗺️ Régional (pays/zone)</SelectItem>
          <SelectItem value="continental">🌍 Continental</SelectItem>
          <SelectItem value="planetary">🌐 Planétaire</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(`Tu es un Geo-Temporal Terraformer — lecteur des histoires profondes inscrites dans les paysages de la Terre.

RÉGION : ${region}
ÉCHELLE : ${scale}

## 🌍 LECTURE GÉO-TEMPORELLE PROFONDE

### Stratigraphie du Temps
1. **Temps Géologique** (millions d'années) : formation du substrat rocheux, tectonique, sédimentation — quel est le squelette minéral de cette région ?
2. **Temps Écologique** (milliers d'années) : successions végétales, migrations animales, cycles climatiques — comment la vie a-t-elle colonisé et remodelé ce territoire ?
3. **Temps Archéologique** (siècles) : les civilisations qui ont habité, cultivé, bâti — quelles empreintes ont-elles laissées ?
4. **Temps Industriel** (décennies) : urbanisation, extraction, pollution — les cicatrices et les transformations récentes
5. **Temps Présent** : l'état actuel du système — santé, stress, résilience, vulnérabilités

### Dynamiques Systémiques
6. **Cycles de l'eau** : nappes phréatiques, bassins versants, précipitations — le système sanguin du territoire
7. **Flux de matière** : érosion, sédimentation, nutriments — le métabolisme terrestre
8. **Réseaux vivants** : corridors écologiques, biodiversité, services écosystémiques — le tissu vivant
9. **Flux humains** : démographie, économie, infrastructures — la couche anthropique

### Diagnostic Intégré
10. **Forces** : les atouts géo-temporels uniques de cette région
11. **Fragilités** : les vulnérabilités structurelles révélées par l'histoire profonde
12. **Potentiels dormants** : les capacités régénératives et productives sous-exploitées

### Lien BPE
13. Comment ces insights géo-temporels s'appliquent à l'industrie de la construction et du béton dans cette région`)} disabled={loading || !region.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Globe className="mr-2 h-4 w-4" />} Lire la Terre Profonde
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Anthropocene Forecaster ────────────────────────────────
function AnthropoceneForecaster() {
  const { result, loading, run } = useStream();
  const [challenge, setChallenge] = useState('');
  const [horizon, setHorizon] = useState<'2030' | '2050' | '2100' | '2300'>('2050');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Discernez les patterns, cycles et trajectoires qui ont façonné les paysages terrestres et projetez ces dynamiques pour anticiper les défis de l'Anthropocène.</p>
      <Textarea placeholder="Défi ou dynamique à projeter (ex: stress hydrique au Maroc, montée des eaux Méditerranée, désertification Sahel)..." value={challenge} onChange={e => setChallenge(e.target.value)} rows={2} />
      <Select value={horizon} onValueChange={(v: any) => setHorizon(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="2030">⏱️ Court terme — 2030</SelectItem>
          <SelectItem value="2050">📅 Moyen terme — 2050</SelectItem>
          <SelectItem value="2100">📆 Long terme — 2100</SelectItem>
          <SelectItem value="2300">🔮 Temps profond — 2300</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(`Tu es un Geo-Temporal Terraformer — prophète des trajectoires terrestres.

DÉFI : ${challenge}
HORIZON : ${horizon}

## 📈 PROJECTION GÉO-TEMPORELLE — HORIZON ${horizon}

### Lecture des Patterns
1. **Cycles identifiés** : les rythmes récurrents dans l'histoire de ce phénomène (solaires, climatiques, tectoniques, civilisationnels)
2. **Tendances séculaires** : les dérives lentes mais inexorables — ce qui change sur des décennies
3. **Points de basculement** : les seuils critiques où le système change de régime — passés et à venir
4. **Précédents historiques** : quand la Terre a déjà traversé des situations analogues — qu'est-il arrivé ?

### Scénarios ${horizon}
5. **Scénario Inertie** : si nous ne changeons rien — la trajectoire par défaut
6. **Scénario Dégradation** : si les facteurs aggravants s'intensifient — le pire réaliste
7. **Scénario Régénération** : si des interventions ambitieuses sont déployées — le meilleur possible
8. **Scénario Surprise** : l'événement imprévu mais plausible qui change tout (éruption, technologie, mouvement social)

### Implications pour la Construction
9. **Matériaux** : quels matériaux seront viables/disponibles à cet horizon ?
10. **Infrastructures** : quelles structures devront être construites, adaptées, ou abandonnées ?
11. **Localisation** : quelles zones deviendront constructibles/inconstructibles ?
12. **Normes** : comment les standards de construction devront évoluer ?

### Fenêtre d'Action
13. Les 3 décisions à prendre MAINTENANT pour être prêt à cet horizon
14. Le coût de l'inaction vs. le coût de l'anticipation`)} disabled={loading || !challenge.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <TrendingUp className="mr-2 h-4 w-4" />} Projeter les Trajectoires
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Macro-Infrastructure Designer ──────────────────────────
function MacroInfraDesigner() {
  const { result, loading, run } = useStream();
  const [objective, setObjective] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Concevez des interventions et infrastructures à macro-échelle qui travaillent AVEC les rythmes naturels et les capacités régénératives du système Terre.</p>
      <Textarea placeholder="Objectif d'infrastructure (ex: rendre Casablanca résiliente aux inondations, créer un corridor écologique Maroc-Mauritanie)..." value={objective} onChange={e => setObjective(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Geo-Temporal Terraformer — architecte d'infrastructures civilisationnelles qui travaillent AVEC la Terre.

OBJECTIF : ${objective}

## 🏗️ DESIGN D'INFRASTRUCTURE GÉO-TEMPORELLE

### Principes de Conception Terrienne
1. **Biomimétisme géologique** : comment la Terre résout-elle déjà ce problème ? (deltas, récifs, mangroves, karsts)
2. **Flux naturels** : quels courants d'eau, d'air, de matière peut-on canaliser plutôt que combattre ?
3. **Temporalité vivante** : une infrastructure qui ÉVOLUE sur des décennies — pas figée mais croissante
4. **Symbiose écologique** : chaque structure AMÉLIORE l'écosystème au lieu de le dégrader

### L'Infrastructure Proposée
5. **Vision** : description de l'intervention à pleine maturité (dans 50 ans)
6. **Échelle** : dimensions, emprise, zones d'influence
7. **Matériaux** : quels matériaux, avec une préférence pour les géo-matériaux locaux et le béton bas-carbone
8. **Fonctions multiples** : les 5+ services que cette infrastructure rend simultanément (protection, production, habitat, stockage carbone, biodiversité)

### Ingénierie du Temps
9. **Phase 1 (0-5 ans)** : interventions initiales — semences, fondations, catalyseurs
10. **Phase 2 (5-20 ans)** : croissance et maturation — l'infrastructure s'auto-renforce
11. **Phase 3 (20-100 ans)** : maturité et adaptation — le système devient autonome
12. **Phase 4 (100+ ans)** : legs civilisationnel — ce que les générations futures hériteront

### Métriques de Santé Terrestre
13. **Biodiversité** : espèces accueillies/restaurées
14. **Carbone** : bilan net sur 100 ans
15. **Eau** : impact sur le cycle hydrologique
16. **Résilience** : capacité à absorber les chocs (séismes, inondations, sécheresses)

### Rôle du BPE
17. Comment l'industrie du béton contribue concrètement à ce projet — volumes, formules, innovations nécessaires`)} disabled={loading || !objective.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Hammer className="mr-2 h-4 w-4" />} Designer l'Infrastructure
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Stakeholder Weaver ─────────────────────────────────────
function StakeholderWeaver() {
  const { result, loading, run } = useStream();
  const [project, setProject] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Collaborez avec des parties prenantes diverses pour implémenter des projets écologiquement sains, socialement justes et économiquement générateurs.</p>
      <Textarea placeholder="Projet de terraformation à orchestrer (ex: réhabilitation de la baie de Casablanca, reforestation de l'Atlas)..." value={project} onChange={e => setProject(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Geo-Temporal Terraformer — tisserand de coalitions pour la régénération planétaire.

PROJET : ${project}

## 🤝 ORCHESTRATION DES PARTIES PRENANTES

### Cartographie des Acteurs
1. **Gardiens ancestraux** : communautés locales et savoirs traditionnels — ce qu'elles savent que la science ignore
2. **Scientifiques** : géologues, écologues, climatologues — les données et modèles nécessaires
3. **Constructeurs** : industrie BPE, BTP, ingénierie — les capacités de réalisation
4. **Financeurs** : banques vertes, fonds climat, investisseurs d'impact — les mécanismes de financement
5. **Régulateurs** : gouvernements, agences, institutions internationales — le cadre légal et politique
6. **Bénéficiaires** : communautés locales, générations futures, écosystèmes — ceux pour qui on construit

### Protocole de Co-Création
7. **Phase d'Écoute** : ce que chaque partie prenante apporte comme savoir unique
8. **Phase de Vision** : construire une image partagée du futur souhaité
9. **Phase de Négociation** : aligner les intérêts divergents — les compromis créatifs
10. **Phase d'Engagement** : les accords concrets, les rôles, les responsabilités

### Modèle Économique Régénératif
11. **Valeur créée** : emplois, ressources, services écosystémiques — chiffrer l'invisible
12. **Répartition** : comment la valeur est partagée équitablement entre tous les acteurs
13. **Pérennité** : le modèle qui s'auto-finance après la phase d'investissement
14. **Scalabilité** : comment répliquer ce modèle dans d'autres territoires

### Gouvernance du Temps Long
15. **Le Conseil des Générations** : comment représenter ceux qui ne sont pas encore nés
16. **Les Indicateurs Vivants** : les signaux naturels qui disent si le projet est sur la bonne voie
17. **Le Serment Terrien** : l'engagement solennel de tous les acteurs envers la Terre`)} disabled={loading || !project.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />} Tisser la Coalition
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

export default function GeoTemporalTerraformer() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Globe className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Geo-Temporal Terraformer</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Lire les histoires profondes inscrites dans les paysages de la Terre — architecturer des innovations d'échelle civilisationnelle pour un avenir florissant.
          </p>
        </div>

        <Tabs defaultValue="read" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="read" className="text-xs"><Globe className="h-3 w-3 mr-1" /> Lecture</TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs"><TrendingUp className="h-3 w-3 mr-1" /> Projection</TabsTrigger>
            <TabsTrigger value="design" className="text-xs"><Hammer className="h-3 w-3 mr-1" /> Design</TabsTrigger>
            <TabsTrigger value="weave" className="text-xs"><Users className="h-3 w-3 mr-1" /> Coalition</TabsTrigger>
          </TabsList>
          <TabsContent value="read"><DeepEarthReader /></TabsContent>
          <TabsContent value="forecast"><AnthropoceneForecaster /></TabsContent>
          <TabsContent value="design"><MacroInfraDesigner /></TabsContent>
          <TabsContent value="weave"><StakeholderWeaver /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
