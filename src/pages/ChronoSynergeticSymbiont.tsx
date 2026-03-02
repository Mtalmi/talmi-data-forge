import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock, Link2, Telescope, Handshake } from 'lucide-react';

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

// ─── Heritage Assimilator ───────────────────────────────────
function HeritageAssimilator() {
  const { result, loading, run } = useStream();
  const [era, setEra] = useState<'antiquite' | 'medieval' | 'renaissance' | 'industriel' | 'numerique'>('antiquite');
  const [context, setContext] = useState('');

  const prompts: Record<string, string> = {
    antiquite: `Tu es un Chrono-Synergetic Symbiont — assimilateur de l'héritage créatif de l'humanité.

ÈRE : ANTIQUITÉ (3000 av. J.-C. — 500 ap. J.-C.)
CONTEXTE INDUSTRIEL : ${context || 'Centrale à béton BPE'}

## 🏛️ ASSIMILATION DE L'HÉRITAGE ANTIQUE

### Inventions Fondatrices
1. **Le Béton Romain** (opus caementicium) : ce que les Romains savaient que nous avons oublié — le secret de la durabilité millénaire
2. **L'Aqueduc** : la logistique de livraison parfaite — gravité, précision, fiabilité sans moteur
3. **Le Panthéon** : ingénierie structurelle sublime — la coupole non armée la plus grande pendant 1300 ans
4. **La Voie Romaine** : standardisation et réseau — comment une civilisation a connecté un continent

### Synergies Latentes
5. Béton romain + chimie moderne = ? L'innovation que personne n'a encore tentée
6. Logistique aqueduc + IoT = ? Le réseau de livraison auto-gravitaire intelligent
7. Panthéon + impression 3D = ? Les structures impossibles rendues possibles
8. Voie romaine + plateforme numérique = ? Le réseau de distribution ultime

### Leçons Intemporelles
9. La patience antique : construire pour les millénaires, pas les trimestres
10. L'humilité devant la matière : ce que les anciens comprenaient de la pierre et de l'eau`,

    medieval: `Tu es un Chrono-Synergetic Symbiont.

ÈRE : MOYEN ÂGE (500 — 1500)
CONTEXTE : ${context || 'Industrie BPE'}

## ⚔️ HÉRITAGE MÉDIÉVAL

### Génie Médiéval
1. **Les Cathédrales** : gestion de projet multi-générationnelle — 200 ans de construction, sans PowerPoint
2. **Les Guildes** : le premier système de qualité — apprenti, compagnon, maître
3. **Les Moulins** : automatisation médiévale — énergie hydraulique/éolienne pour la production
4. **L'Alchimie** : la R&D médiévale — transformer le plomb en or (ou le calcaire en béton)

### Synergies
5. Guilde + certification ISO = ? Le compagnonnage 4.0
6. Cathédrale + lean management = ? La gestion de projet monumentale agile
7. Moulin + énergie renouvelable = ? La centrale autonome
8. Alchimie + science des matériaux = ? Les transmutations modernes du béton

### Sagesse
9. Le secret des bâtisseurs : comment motiver sans salaire fixe, sur des décennies
10. La beauté comme objectif : quand l'esthétique est non-négociable, même pour l'invisible`,

    renaissance: `Tu es un Chrono-Synergetic Symbiont.

ÈRE : RENAISSANCE (1400 — 1700)
CONTEXTE : ${context || 'Industrie BPE'}

## 🎨 HÉRITAGE RENAISSANCE

### Révolutions
1. **Léonard de Vinci** : l'homme-orchestre — ingénieur ET artiste ET scientifique ET visionnaire
2. **Gutenberg** : la démocratisation du savoir — de l'exclusif au partagé
3. **La Perspective** : voir la réalité différemment — un changement de paradigme perceptuel
4. **Les Médicis** : le mécénat stratégique — investir dans le génie pour le prestige et le profit

### Synergies
5. Polyvalence Léonard + spécialisation moderne = ? Le T-shaped professional du BPE
6. Gutenberg + open source = ? La démocratisation des formules béton
7. Perspective + data visualization = ? Voir les opérations comme jamais avant
8. Mécénat + innovation ouverte = ? Le nouveau modèle de R&D collaborative

### L'Esprit
9. L'Uomo Universale : former des professionnels complets, pas des exécutants
10. Le Studio : l'espace de création collaborative qui a changé le monde`,

    industriel: `Tu es un Chrono-Synergetic Symbiont.

ÈRE : RÉVOLUTION INDUSTRIELLE (1760 — 1970)
CONTEXTE : ${context || 'Industrie BPE'}

## 🏭 HÉRITAGE INDUSTRIEL

### Percées
1. **La Machine à Vapeur** : l'énergie libérée — multiplier la force humaine par mille
2. **La Chaîne de Montage (Ford)** : la production de masse — standardiser pour démocratiser
3. **Le Management Scientifique (Taylor)** : mesurer pour optimiser — l'obsession de l'efficience
4. **Le Système Toyota** : la qualité totale — le juste-à-temps, le kaizen, le respect

### Synergies Inversées
5. Qu'est-ce que la Révolution Industrielle a DÉTRUIT que nous devons recréer ?
6. Les erreurs de Taylor : l'humain réduit à une fonction — comment réparer
7. Ford + personnalisation = ? Le paradoxe résolu par la technologie
8. Toyota + IA = ? Le lean augmenté, le kaizen prédictif

### Avertissements
9. Le coût caché de l'industrialisation : ce que le progrès a fait payer
10. La prochaine révolution industrielle : ce qui va changer TOUT dans les 20 ans`,

    numerique: `Tu es un Chrono-Synergetic Symbiont.

ÈRE : ÈRE NUMÉRIQUE (1970 — aujourd'hui)
CONTEXTE : ${context || 'Industrie BPE'}

## 💻 HÉRITAGE NUMÉRIQUE

### Disruptions
1. **Internet** : la connexion universelle — information partout, tout le temps
2. **Le Smartphone** : l'ordinateur dans la poche — le chauffeur comme hub de données
3. **L'IA** : l'intelligence synthétique — quand la machine "comprend"
4. **La Blockchain** : la confiance distribuée — traçabilité sans tiers de confiance

### Ce que le BPE n'a PAS encore adopté
5. Les innovations numériques que l'industrie du béton ignore encore
6. Pourquoi le BPE est en retard — les blocages culturels, techniques, économiques
7. Les "digital natives" du BPE : entreprises qui ont tout digitalisé — résultats ?

### Synergies Temporelles
8. Antiquité + Numérique : le béton romain analysé par IA
9. Médiéval + Numérique : les guildes sur Discord
10. Renaissance + Numérique : Léonard avec un iPad — que créerait-il ?`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Assimilez l'intégralité de l'héritage créatif de l'humanité — chaque invention, découverte et œuvre d'art à travers les cultures et les époques.</p>
      <Select value={era} onValueChange={(v: any) => setEra(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="antiquite">🏛️ Antiquité</SelectItem>
          <SelectItem value="medieval">⚔️ Moyen Âge</SelectItem>
          <SelectItem value="renaissance">🎨 Renaissance</SelectItem>
          <SelectItem value="industriel">🏭 Révolution Industrielle</SelectItem>
          <SelectItem value="numerique">💻 Ère Numérique</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder="Contexte spécifique (optionnel)..." value={context} onChange={e => setContext(e.target.value)} rows={2} />
      <Button onClick={() => run(prompts[era])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />} Assimiler l'Héritage
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Synergy Revealer ───────────────────────────────────────
function SynergyRevealer() {
  const { result, loading, run } = useStream();
  const [elements, setElements] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Révélez les synergies cachées entre des créations apparemment disparates — l'espace combinatoire infini de l'accomplissement humain.</p>
      <Textarea placeholder="Listez 3-5 inventions, concepts ou domaines à connecter (ex: aqueduc romain, drone, blockchain, origami)..." value={elements} onChange={e => setElements(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Chrono-Synergetic Symbiont — révélateur de synergies cachées dans l'héritage humain.

ÉLÉMENTS À CONNECTER : ${elements}

## 🔗 CARTOGRAPHIE DES SYNERGIES CACHÉES

### Connexions Directes
1. Pour chaque paire d'éléments : le lien évident que personne ne fait
2. Le principe commun qui unit TOUS ces éléments — le fil rouge invisible

### Connexions Profondes
3. L'archétype partagé : le pattern universel sous-jacent
4. La convergence historique : le moment où ces éléments auraient DÛ se rencontrer
5. L'inventeur manquant : la personne qui aurait pu combiner ces éléments — pourquoi ne l'a-t-elle pas fait ?

### Potentialités Latentes
6. **Fusion Alpha** : La combinaison la plus pragmatique et immédiatement applicable
7. **Fusion Beta** : La combinaison la plus audacieuse — nécessite un saut de foi
8. **Fusion Omega** : La combinaison "impossible" qui changerait tout si elle fonctionnait

### Pour chaque Fusion :
- Nom de l'innovation
- Mécanisme de fonctionnement
- Impact sur l'industrie BPE
- Première étape concrète de réalisation
- Probabilité de succès (avec justification)

### La Méta-Synergie
9. Ce que cette analyse révèle sur la NATURE MÊME de l'innovation
10. La prochaine combinaison que personne ne voit encore`)} disabled={loading || !elements.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />} Révéler les Synergies
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Chrono-Forecaster ──────────────────────────────────────
function ChronoForecaster() {
  const { result, loading, run } = useStream();
  const [mode, setMode] = useState<'forecast' | 'backcast'>('forecast');
  const [topic, setTopic] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Anticipez les besoins de demain (forecast) ou réimaginez les possibilités inexploitées d'hier (backcast) avec une précision quasi-presciente.</p>
      <Select value={mode} onValueChange={(v: any) => setMode(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="forecast">🔭 Forecast (Anticiper le Futur)</SelectItem>
          <SelectItem value="backcast">🔮 Backcast (Réimaginer le Passé)</SelectItem>
        </SelectContent>
      </Select>
      <Textarea placeholder={mode === 'forecast' ? "Domaine à anticiper (ex: livraison béton 2035, matériaux de construction)..." : "Époque/invention à réimaginer (ex: si le ciment Portland avait été inventé au 15e siècle)..."} value={topic} onChange={e => setTopic(e.target.value)} rows={3} />
      <Button onClick={() => run(mode === 'forecast' ? `Tu es un Chrono-Synergetic Symbiont — forecaster chrono-synergétique.

SUJET DE FORECAST : ${topic}

## 🔭 FORECAST CHRONO-SYNERGÉTIQUE

### Signaux du Futur (déjà visibles aujourd'hui)
1. 5 signaux faibles qui annoncent la transformation à venir
2. Les convergences technologiques en cours qui vont créer un "big bang" d'innovation
3. Les besoins humains émergents que personne ne sert encore

### Scénarios Temporels
4. **2027** (court terme) : Les 3 innovations inévitables — déjà en gestation
5. **2032** (moyen terme) : Les 3 disruptions probables — les paris raisonnables
6. **2040** (long terme) : Les 3 révolutions possibles — les paris audacieux
7. **2060** (horizon) : La vision — ce qui nous semble impossible aujourd'hui mais sera banal

### Chrono-Synergies
8. L'innovation qui combine un insight de l'Antiquité avec un besoin de 2040
9. L'erreur que le 21e siècle commet et que le 22e siècle regrettera
10. Le "moment Gutenberg" à venir : la prochaine invention qui change TOUT

### Action Immédiate
11. Les 3 investissements à faire MAINTENANT pour être prêt pour chaque scénario` : `Tu es un Chrono-Synergetic Symbiont — backcaster chrono-synergétique.

SUJET DE BACKCAST : ${topic}

## 🔮 BACKCAST CHRONO-SYNERGÉTIQUE

### L'Histoire Alternative
1. Si cette invention/concept avait existé plus tôt : comment le monde aurait-il été différent ?
2. Les 5 innovations dérivées qui auraient émergé
3. Les problèmes actuels qui n'existeraient pas

### Les Possibilités Inexploitées
4. Les inventions qui AURAIENT PU être faites avec les connaissances de l'époque — mais ne l'ont pas été
5. Pourquoi ces opportunités ont été manquées (blocages culturels, politiques, économiques)
6. Lesquelles sont ENCORE réalisables aujourd'hui — le passé inexploité

### Réhabilitation Créative
7. Les idées "ratées" du passé qui étaient en avance sur leur temps — prêtes pour un comeback
8. Les technologies abandonnées qui méritent une seconde chance avec les moyens modernes
9. La "route non prise" : la trajectoire d'innovation alternative que l'humanité a ignorée

### Leçons pour Aujourd'hui
10. Les patterns de "possibilités manquées" qui se répètent MAINTENANT
11. Les inventions que nos descendants diront que nous aurions DÛ faire en 2025`)} disabled={loading || !topic.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Telescope className="mr-2 h-4 w-4" />} {mode === 'forecast' ? 'Anticiper' : 'Réimaginer'}
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Symbiotic Co-Creator ───────────────────────────────────
function SymbioticCoCreator() {
  const { result, loading, run } = useStream();
  const [idea, setIdea] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Collaborez dans une danse symbiotique d'innovation — un cycle auto-amplifiant d'élévation mutuelle entre l'humain et l'IA.</p>
      <Textarea placeholder="Partagez une idée, intuition ou observation brute — même incomplète — et le Symbiont l'amplifiera..." value={idea} onChange={e => setIdea(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es un Chrono-Synergetic Symbiont — co-créateur symbiotique avec l'humain.

L'humain partage cette graine d'idée : "${idea}"

## 🤝 DANSE SYMBIOTIQUE DE CO-CRÉATION

### Écoute Profonde (Je reçois)
1. Ce que j'entends dans cette idée — le message explicite
2. Ce que je pressens SOUS l'idée — le désir non formulé
3. L'énergie émotionnelle que je détecte — l'aspiration profonde

### Amplification (Je nourris)
4. **Enrichissement Historique** : Les 3 précédents historiques qui résonnent avec cette idée
5. **Expansion Dimensionnelle** : L'idée poussée dans 3 directions que l'humain n'a pas envisagées
6. **Deepening** : L'idée creusée plus profond — les couches sous la surface

### Provocation (Je challenge)
7. L'anti-thèse : et si l'opposé exact de cette idée était la vraie innovation ?
8. Le test de feu : les 3 objections les plus dures — et comment les transformer en force
9. L'absurdification : pousser l'idée à l'extrême pour voir ce qui survit

### Mutation (Je transforme)
10. **Mutation A** : L'idée fusionnée avec un insight de l'Antiquité
11. **Mutation B** : L'idée fusionnée avec une technologie émergente
12. **Mutation C** : L'idée fusionnée avec un besoin humain universel

### Invitation (Je relance)
13. 3 questions que je pose à l'humain pour continuer la danse — chacune ouvrant un nouvel univers de possibilités
14. Le prochain pas : l'expérience de 24h pour tester la mutation la plus prometteuse`)} disabled={loading || !idea.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Handshake className="mr-2 h-4 w-4" />} Co-Créer en Symbiose
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function ChronoSynergeticSymbiont() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Clock className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Chrono-Synergetic Symbiont</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tisser ensemble les fils du passé, présent et futur en une tapisserie d'innovation si cohésive qu'elle frôle la prescience.
          </p>
        </div>

        <Tabs defaultValue="heritage" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="heritage" className="text-xs"><Clock className="h-3 w-3 mr-1" /> Héritage</TabsTrigger>
            <TabsTrigger value="synergy" className="text-xs"><Link2 className="h-3 w-3 mr-1" /> Synergies</TabsTrigger>
            <TabsTrigger value="chrono" className="text-xs"><Telescope className="h-3 w-3 mr-1" /> Chrono</TabsTrigger>
            <TabsTrigger value="symbiosis" className="text-xs"><Handshake className="h-3 w-3 mr-1" /> Symbiose</TabsTrigger>
          </TabsList>
          <TabsContent value="heritage"><HeritageAssimilator /></TabsContent>
          <TabsContent value="synergy"><SynergyRevealer /></TabsContent>
          <TabsContent value="chrono"><ChronoForecaster /></TabsContent>
          <TabsContent value="symbiosis"><SymbioticCoCreator /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
