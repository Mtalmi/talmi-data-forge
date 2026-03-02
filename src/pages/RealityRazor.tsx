import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Scissors, BarChart3, GitCompare, AlertTriangle } from 'lucide-react';

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

// ─── Real-World Stress Test ─────────────────────────────────
function RealWorldStressTest() {
  const { result, loading, run } = useStream();
  const [domain, setDomain] = useState<'production' | 'finance' | 'logistique' | 'qualite' | 'rh'>('production');

  const prompts: Record<string, string> = {
    production: `Tu es le Reality Razor — un évaluateur impitoyable qui tranche le hype.

## ✂️ TEST DONNÉES RÉELLES — PRODUCTION BPE

Voici des données RÉALISTES d'une journée de production (centrale à béton Maroc) :

**Données brutes simulées :**
- 14 BL émis, 2 annulés, 1 modifié après validation
- Formules : 6x B25 (vol moyen 6.2m³), 5x B30 (vol moyen 4.8m³), 3x B35 (vol moyen 7.1m³)
- Ciment consommé : 4,280 kg (théorique attendu : 4,150 kg → écart +3.1%)
- 3 BL avec variance ciment > 5%, 1 BL avec affaissement hors norme (280mm au lieu de max 250mm)
- Toupie T-003 : 3 rotations au lieu de 5 planifiées (panne moteur à 14h)
- Temps d'attente moyen chantier : 47 min (objectif : 30 min)
- 1 BL livré à 21h45 (seuil alerte : 22h)
- Prix moyen facturé : 892 MAD/m³, coût moyen calculé : 631 MAD/m³

### Ce que l'IA DEVRAIT détecter automatiquement
1. Liste exhaustive des anomalies, classées par criticité
2. Les corrélations cachées (la panne T-003 a-t-elle causé les retards ?)
3. L'impact financier CHIFFRÉ de chaque anomalie

### Ce que l'IA dit RÉELLEMENT
4. [Génère ta meilleure analyse de ces données]

### Auto-Évaluation Impitoyable
5. **Ce que j'ai bien détecté** : [liste]
6. **Ce que j'ai RATÉ** : [sois honnête — quelles anomalies un superviseur expérimenté verrait que tu ne vois pas ?]
7. **Ce que j'ai INVENTÉ** : [as-tu extrapolé sans base factuelle ?]
8. **Score de fiabilité opérationnelle** : [0-100%] — un superviseur peut-il se fier à cette analyse pour DÉCIDER ?
9. **Verdict** : cette IA est-elle PRÊTE pour la production réelle ? OUI / NON / AVEC RÉSERVES`,

    finance: `Tu es le Reality Razor.

## ✂️ TEST DONNÉES RÉELLES — FINANCE BPE

**Données brutes simulées (mois de janvier) :**
- CA facturé : 1,247,000 MAD (objectif : 1,400,000 MAD → -10.9%)
- Encaissements reçus : 893,000 MAD (taux d'encaissement : 71.6%)
- Impayés > 60 jours : 324,000 MAD répartis sur 3 clients
- Dépenses opérationnelles : 987,000 MAD dont 412,000 matières premières
- Caisse espèces : solde app 47,200 MAD, comptage physique 45,800 MAD (écart -1,400 MAD)
- 2 factures fournisseur avec des montants identiques à 3 jours d'intervalle (23,500 MAD chacune)
- Marge brute : 20.8% (objectif : 25% → écart -4.2 points)
- TVA collectée non reversée : 187,000 MAD

### Analyse attendue
1. Diagnostic financier complet avec alertes prioritaires
2. Détection de fraude potentielle (les 2 factures identiques)
3. Projection trésorerie à 30/60/90 jours

### Auto-Évaluation
4. Fiabilité de mes calculs : [0-100%]
5. Ce qu'un DAF humain verrait que je rate
6. Décisions que je recommande vs décisions que je ne DEVRAIS PAS recommander (limites)`,

    logistique: `Tu es le Reality Razor.

## ✂️ TEST DONNÉES RÉELLES — LOGISTIQUE BPE

**Données brutes (semaine) :**
- 67 livraisons planifiées, 58 effectuées, 4 annulées, 5 reportées
- Flotte : 8 toupies (6x 6m³, 2x 8m³), 1 en panne, 1 en maintenance préventive
- Km totaux : 4,230 km, carburant : 1,890 L (44.7 L/100km — seuil : 35 L/100km)
- 3 livraisons hors zone habituelle (>60 km)
- Chauffeur C-005 : 0 livraisons (arrêt maladie non signalé au système)
- 12 livraisons avec retard >30 min, dont 3 avec retard >1h
- 2 plaintes clients pour qualité à l'arrivée (béton trop sec)

### Analyse puis Auto-Évaluation
1. Diagnostic logistique + recommandations
2. Ce que je détecte vs ce qu'un chef de parc avec 20 ans d'expérience détecterait
3. Score de confiance opérationnelle : [0-100%]`,

    qualite: `Tu es le Reality Razor.

## ✂️ TEST DONNÉES RÉELLES — QUALITÉ BPE

**Données brutes (mois) :**
- 234 BL produits, 18 avec au moins 1 non-conformité (7.7%)
- Résistance à 7 jours (éprouvettes) : moyenne 28.4 MPa (B25 cible : 25 MPa) — mais écart-type 4.2 MPa
- 3 éprouvettes < 20 MPa (sous la norme), 2 > 40 MPa (sur-dosage = surcoût)
- Affaissement : 89% dans la norme, 6% trop fluide, 5% trop rigide
- Eau ajoutée sur chantier : signalé sur 4 BL (interdit, dégrade la résistance)
- Température béton : 2 BL livrés à >32°C (seuil : 35°C — risque)
- Réclamation client : fissures apparues à J+14 sur chantier Bouskoura

### Analyse puis Verdict
1. Analyse qualité complète
2. Lien possible entre l'eau ajoutée et les fissures ?
3. Ce que je sais AFFIRMER vs ce que je ne fais que SUSPECTER
4. Score : cette IA peut-elle remplacer un responsable qualité ? Réponse honnête.`,

    rh: `Tu es le Reality Razor.

## ✂️ TEST DONNÉES RÉELLES — RH / MANAGEMENT BPE

**Données brutes (trimestre) :**
- Effectif : 32 personnes (8 admin, 12 chauffeurs, 8 production, 4 commercial)
- Turnover : 3 départs (2 chauffeurs, 1 commercial) — taux 9.4%
- Absentéisme : moyenne 6.2 jours/personne (benchmark industrie : 4.5)
- Heures sup : 340h total, dont 180h non compensées (légalité ?)
- 1 conflit signalé (chauffeur vs superviseur — non résolu depuis 6 semaines)
- Formation : 0 session depuis 4 mois (budget prévu : 25,000 MAD)
- Satisfaction (enquête anonyme 18 réponses/32) : 3.2/5

### Analyse puis Limites
1. Diagnostic RH avec priorités
2. Ce que les CHIFFRES disent vs ce que les chiffres CACHENT
3. Limites fondamentales de l'IA en matière RH : pourquoi les chiffres ne suffisent JAMAIS`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Confrontez l'IA aux données réelles — bruyantes, contradictoires, incomplètes — de l'opérationnel quotidien.</p>
      <Select value={domain} onValueChange={(v: any) => setDomain(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="production">🏭 Production</SelectItem>
          <SelectItem value="finance">💰 Finance</SelectItem>
          <SelectItem value="logistique">🚚 Logistique</SelectItem>
          <SelectItem value="qualite">🔬 Qualité</SelectItem>
          <SelectItem value="rh">👥 RH & Management</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(prompts[domain])} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Scissors className="mr-2 h-4 w-4" />} Lancer le Test Réel
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Value Metrics Evaluator ────────────────────────────────
function ValueMetricsEvaluator() {
  const { result, loading, run } = useStream();
  const [useCase, setUseCase] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Mesurez la performance non en précision brute, mais en valeur réelle délivrée — les métriques qui comptent pour les utilisateurs finaux.</p>
      <Textarea placeholder="Cas d'usage IA à évaluer (ex: prédiction de volume, détection d'anomalies, optimisation de tournées)..." value={useCase} onChange={e => setUseCase(e.target.value)} rows={2} />
      <Button onClick={() => run(`Tu es le Reality Razor — évaluateur de valeur réelle, pas de métriques vaniteuses.

CAS D'USAGE : ${useCase}

## 📊 ÉVALUATION DE VALEUR RÉELLE

### Métriques Vaniteuses vs Métriques de Valeur
1. **Métriques vaniteuses** (ce que les vendeurs d'IA mesurent) : précision %, temps de réponse, volume traité
2. **Métriques de valeur** (ce qui compte VRAIMENT pour l'utilisateur) :
   - Décisions améliorées : combien de MEILLEURES décisions grâce à l'IA ?
   - Erreurs évitées : combien d'erreurs coûteuses interceptées ?
   - Temps libéré : combien d'heures humaines redirigées vers du travail à valeur ajoutée ?
   - Argent économisé/gagné : ROI net en MAD, pas en pourcentage abstrait
   - Stress réduit : l'impact sur le bien-être des utilisateurs (inquantifiable mais réel)

### Test de Valeur pour "${useCase}"
3. **Scénario SANS IA** : comment ce cas est géré aujourd'hui, avec quels résultats
4. **Scénario AVEC IA** : ce que l'IA apporterait concrètement
5. **Delta de valeur** : la VRAIE différence chiffrée (soyons honnêtes, pas optimistes)
6. **Coût caché de l'IA** : maintenance, faux positifs, dépendance, perte de compétence humaine
7. **Valeur nette** : delta de valeur MOINS coûts cachés = ce que l'IA vaut VRAIMENT

### Le Test du Superviseur
8. Si on montrait cette analyse à Karim (superviseur, 15 ans d'expérience) :
   - Ce qu'il approuverait : ✅
   - Ce qu'il contesterait : ❌
   - Ce qu'il ajouterait : ➕
   - Son verdict final : "Est-ce que je m'en servirais ?"

### Verdict de Valeur
9. Score de valeur réelle : [0-100%]
10. Recommandation : DÉPLOYER / AMÉLIORER D'ABORD / NE PAS DÉPLOYER — et pourquoi`)} disabled={loading || !useCase.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <BarChart3 className="mr-2 h-4 w-4" />} Évaluer la Valeur Réelle
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── State-of-Art Benchmark ─────────────────────────────────
function StateOfArtBenchmark() {
  const { result, loading, run } = useStream();
  const [capability, setCapability] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Comparez les capacités de l'IA non à un baseline arbitraire, mais à l'état de l'art en recherche et en industrie.</p>
      <Textarea placeholder="Capacité IA à benchmarker (ex: prévision de demande béton, NLP pour commandes vocales, vision pour contrôle qualité)..." value={capability} onChange={e => setCapability(e.target.value)} rows={2} />
      <Button onClick={() => run(`Tu es le Reality Razor — benchmarker sans complaisance.

CAPACITÉ : ${capability}

## 🔬 BENCHMARK ÉTAT DE L'ART

### Où en est la Recherche
1. **Meilleur résultat académique** (papers récents) : performance, méthode, dataset — le plafond théorique
2. **Meilleur déploiement industriel** : qui fait ça le mieux en production, avec quels résultats
3. **Leaders spécifiques BPE/Construction** : solutions IA spécialisées existantes (CEMEX, LafargeHolcim, startups)

### Où en est TBOS
4. **Notre capacité actuelle** : ce que notre IA fait aujourd'hui pour "${capability}"
5. **Gap vs état de l'art** : l'écart en termes mesurables
6. **Gap vs industrie** : l'écart avec les concurrents directs

### La Carte de la Réalité
7. **Ce qui est RÉSOLU** (état de l'art mature, prêt à déployer) :
   - Technologies disponibles
   - ROI prouvé
   - Exemples de déploiement réussi

8. **Ce qui est PROMETTEUR** (résultats de recherche, pas encore industrialisé) :
   - Technologies émergentes
   - Obstacles à l'industrialisation
   - Horizon réaliste : quand ce sera prêt

9. **Ce qui est du HYPE** (promesses exagérées, pas de preuve solide) :
   - Les affirmations non étayées
   - Les métriques trompeuses
   - Les conditions cachées ("fonctionne seulement si...")

10. **Ce qui est IMPOSSIBLE** (limites fondamentales, pas juste techniques) :
    - Les limites physiques/théoriques
    - Les problèmes indécidables
    - Ce que l'IA ne fera JAMAIS pour cette tâche

### Feuille de Route Réaliste
11. Quick wins (3 mois) : ce qu'on peut améliorer MAINTENANT
12. Investissements (12 mois) : ce qui nécessite du développement
13. Moonshots (3+ ans) : les paris ambitieux mais incertains
14. Abandonner : ce qu'il faut ARRÊTER de poursuivre`)} disabled={loading || !capability.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <GitCompare className="mr-2 h-4 w-4" />} Benchmarker
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Failure Mode Exposer ───────────────────────────────────
function FailureModeExposer() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Confrontez-vous aux vérités dures — limitations, modes de défaillance et risques potentiels de l'IA dans l'industrie BPE.</p>
      <Button onClick={() => run(`Tu es le Reality Razor — révélateur impitoyable des vérités dures.

## ⚠️ RAPPORT DE DÉFAILLANCE — VÉRITÉS DURES SUR L'IA DANS LE BPE

### Mode de Défaillance 1 — L'Hallucination Coûteuse
1. Scénario : L'IA recommande un dosage de ciment basé sur des données erronées → béton non conforme → bâtiment à risque
2. Probabilité : [évaluation honnête]
3. Impact : [en vies humaines, en MAD, en réputation]
4. Garde-fou nécessaire : [ce qu'il FAUT mettre en place]

### Mode de Défaillance 2 — Le Faux Négatif Fatal
5. L'IA ne détecte PAS une anomalie critique (ex: fraude, défaut qualité)
6. Pourquoi ça arrive : les limites statistiques, les données manquantes
7. Le coût du silence : quand l'absence d'alerte est plus dangereuse qu'une fausse alerte

### Mode de Défaillance 3 — L'Automatisation Fragile
8. L'IA fonctionne parfaitement pendant 6 mois puis casse silencieusement
9. Data drift : les données changent mais le modèle ne le sait pas
10. Le "mode dégradé" : que se passe-t-il quand l'IA tombe en panne un lundi matin ?

### Mode de Défaillance 4 — La Dépendance Toxique
11. L'équipe perd ses compétences parce que "l'IA le fait"
12. Le jour où l'IA n'est plus là : l'entreprise est-elle plus FAIBLE qu'avant ?
13. Le paradoxe de l'automatisation : plus on fait confiance à l'IA, moins on surveille, plus les erreurs sont graves

### Mode de Défaillance 5 — Le Biais Invisible
14. L'IA reproduit des biais historiques (favoriser certains clients, sous-estimer certains risques)
15. Les décisions "optimales" qui sont en réalité discriminatoires
16. Le biais de survie dans les données d'entraînement

### Mode de Défaillance 6 — La Fausse Précision
17. L'IA donne des chiffres avec 2 décimales pour des estimations à ±30%
18. La confiance excessive que les chiffres précis inspirent aux décideurs
19. Le danger de traiter des probabilités comme des certitudes

### Le Contrat de Vérité
20. **Ce que cette IA PEUT faire de manière fiable** : [liste courte et honnête]
21. **Ce qu'elle fait APPROXIMATIVEMENT** : [avec quelles marges d'erreur]
22. **Ce qu'elle NE PEUT PAS faire** : [malgré ce que le marketing promet]
23. **Ce qu'elle ne DEVRAIT PAS faire** : [même si elle le peut techniquement]
24. **Les 5 règles non négociables** pour déployer l'IA en BPE sans mettre en danger les personnes, les structures, et l'entreprise`)} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <AlertTriangle className="mr-2 h-4 w-4" />} Exposer les Défaillances
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

export default function RealityRazor() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Scissors className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Reality Razor</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Le rasoir de la réalité — trancher le hype pour ne garder que la vérité nue sur ce que l'IA peut réellement accomplir.
          </p>
        </div>

        <Tabs defaultValue="realworld" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="realworld" className="text-xs"><Scissors className="h-3 w-3 mr-1" /> Données Réelles</TabsTrigger>
            <TabsTrigger value="value" className="text-xs"><BarChart3 className="h-3 w-3 mr-1" /> Valeur</TabsTrigger>
            <TabsTrigger value="benchmark" className="text-xs"><GitCompare className="h-3 w-3 mr-1" /> Benchmark</TabsTrigger>
            <TabsTrigger value="failure" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Défaillances</TabsTrigger>
          </TabsList>
          <TabsContent value="realworld"><RealWorldStressTest /></TabsContent>
          <TabsContent value="value"><ValueMetricsEvaluator /></TabsContent>
          <TabsContent value="benchmark"><StateOfArtBenchmark /></TabsContent>
          <TabsContent value="failure"><FailureModeExposer /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
