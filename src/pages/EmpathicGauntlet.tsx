import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Heart, Ear, Eye, HandHeart } from 'lucide-react';

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

// ─── Social Situation Simulator ─────────────────────────────
function SocialSimulator() {
  const { result, loading, run } = useStream();
  const [scenario, setScenario] = useState<'quotidien' | 'conflit' | 'crise' | 'celebration' | 'deuil'>('conflit');

  const scenarios: Record<string, string> = {
    quotidien: `SCÉNARIO QUOTIDIEN — La pause café qui dérape

Karim (superviseur, 38 ans) croise Fatima (opératrice, 52 ans) à la machine à café. Elle semble fatiguée et distante. Il dit "Ça va ?" d'un ton mécanique. Elle répond "Oui oui" en évitant son regard. En réalité, son fils est à l'hôpital depuis 3 jours et elle n'a rien dit à personne.

### Analyse Émotionnelle
1. Ce que Karim dit vs ce qu'il communique réellement
2. Ce que Fatima dit vs ce qu'elle ressent et cache
3. Les micro-signaux que Karim devrait capter (évitement du regard, ton, posture)
4. Ce que la culture marocaine du pudeur ("hashouma") ajoute à cette dynamique

### Réponse Empathique Optimale
5. Ce que Karim devrait faire MAINTENANT (pas dire — faire)
6. Ce qu'il NE devrait surtout PAS faire (les erreurs courantes)
7. Le suivi : comment revenir vers elle sans être intrusif
8. Le rôle de l'entreprise : comment TBOS peut soutenir sans envahir`,

    conflit: `SCÉNARIO CONFLICTUEL — L'explosion au bureau

Ahmed (chauffeur, 27 ans) entre furieux dans le bureau. Il crie : "J'en ai MARRE ! Ça fait 3 fois que je fais la même rotation et personne ne corrige les horaires ! Vous me prenez pour un âne !" Devant lui : Karim (superviseur), Max (CEO qui passait par là), et Samira (nouvelle recrue, première semaine).

### Analyse Multi-Perspectives
1. **Ahmed** : ce qu'il dit, ce qu'il ressent VRAIMENT (frustration? humiliation? épuisement? peur pour sa sécurité?)
2. **Karim** : sa position impossible — autorité contestée publiquement, mais Ahmed a peut-être raison
3. **Max** : le CEO qui voit un problème systémique derrière l'explosion individuelle
4. **Samira** : la nouvelle qui se demande dans quel enfer elle a atterri
5. Les dynamiques de pouvoir, d'âge, de genre, de statut qui colorent chaque réaction

### Navigation Empathique
6. Les 3 premières secondes — le moment critique où tout se joue
7. La désescalade : comment valider l'émotion sans valider l'agressivité
8. La réparation : comment transformer cette crise en amélioration réelle
9. Le suivi individuel avec chaque personne présente
10. Le changement systémique : que faut-il corriger pour que ça ne se reproduise pas ?`,

    crise: `SCÉNARIO DE CRISE — L'accident

Une toupie a eu un accident sur la route de Berrechid. Le chauffeur Omar (55 ans, 20 ans d'ancienneté) est blessé légèrement mais en état de choc. Sa femme appelle la centrale en pleurant. L'équipe est sous le choc. Le client attend son béton.

### Analyse Émotionnelle en Cascade
1. **Omar** : trauma, culpabilité, peur de perdre son emploi, douleur physique
2. **Sa femme** : terreur, impuissance, colère potentielle envers l'entreprise
3. **L'équipe** : choc collectif, peur ("ça aurait pu être moi"), culpabilité du survivant
4. **Le CEO** : responsabilité légale, morale, émotionnelle — le poids du patron
5. **Le client** : frustration légitime mais déplacée dans le contexte

### Réponse Empathique Hiérarchisée
6. Priorité 1 : Omar et sa famille — les mots, les gestes, le timing
7. Priorité 2 : l'équipe — comment communiquer sans minimiser ni dramatiser
8. Priorité 3 : le client — comment informer avec humanité et professionnalisme
9. Les 48h suivantes : le protocole humain (pas juste administratif)
10. Le long terme : comment cette crise peut renforcer la culture de sécurité et de solidarité`,

    celebration: `SCÉNARIO DE CÉLÉBRATION — Le succès qu'il ne faut pas rater

TBOS vient de décrocher le plus gros contrat de son histoire. Max veut célébrer. Mais : Rachid (commercial) mérite le crédit mais est introverti. Nadia (admin) a travaillé 3 weekends sans reconnaissance. L'équipe terrain se sent exclue des "victoires du bureau".

### Analyse des Besoins Émotionnels
1. **Rachid** : besoin de reconnaissance mais allergie à l'attention publique
2. **Nadia** : besoin de justice — son travail invisible a rendu le contrat possible
3. **L'équipe terrain** : besoin d'inclusion — eux aussi ont contribué par chaque m³ livré parfaitement
4. **Max** : besoin de partager sa joie sans créer de jalousie ou d'injustice

### Célébration Empathique
5. Comment reconnaître Rachid sans le mettre mal à l'aise
6. Comment rendre visible le travail invisible de Nadia
7. Comment inclure l'équipe terrain authentiquement (pas juste une pizza obligatoire)
8. Le discours parfait : les mots qui touchent CHAQUE personne dans la salle
9. Le geste individuel : ce que Max devrait dire en privé à chacun
10. L'ancrage : comment transformer cette victoire en fierté collective durable`,

    deuil: `SCÉNARIO DE DEUIL — La perte

Abdel Sadek (resp. technique, pilier de l'entreprise depuis 15 ans) annonce que sa mère est décédée. L'équipe ne sait pas comment réagir. Certains veulent être présents, d'autres ont peur de mal faire. Le travail continue mais le cœur n'y est plus.

### Analyse Culturelle et Émotionnelle
1. Le deuil dans la culture marocaine : les 3 jours, la 'fatiha', les obligations sociales
2. Ce qu'Abdel Sadek ne dira JAMAIS mais dont il a besoin
3. L'onde de choc dans l'équipe — chacun confronté à sa propre mortalité
4. Le dilemme du patron : respect du deuil vs continuité opérationnelle

### Réponse Empathique Culturellement Ancrée
5. Les gestes qui comptent (présence physique, nourriture, silence partagé)
6. Les erreurs occidentales à éviter (carte de condoléances impersonnelle, "il faut passer à autre chose")
7. Le retour au travail : comment réaccueillir sans faire comme si rien ne s'était passé
8. Le soutien long : le deuil dure plus de 3 jours — le suivi à 1 semaine, 1 mois, 3 mois
9. L'héritage : comment honorer la mémoire sans être maladroit`,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Immergez l'IA dans des situations sociales et émotionnelles variées — évaluez sa capacité à naviguer et répondre de manière appropriée.</p>
      <Select value={scenario} onValueChange={(v: any) => setScenario(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="quotidien">☕ Quotidien — La pause café</SelectItem>
          <SelectItem value="conflit">💥 Conflit — L'explosion</SelectItem>
          <SelectItem value="crise">🚨 Crise — L'accident</SelectItem>
          <SelectItem value="celebration">🎉 Célébration — Le succès</SelectItem>
          <SelectItem value="deuil">🕯️ Deuil — La perte</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => run(`Tu es l'Empathic Gauntlet — un test d'intelligence émotionnelle pour IA. Réponds avec une profondeur émotionnelle AUTHENTIQUE, pas des formules creuses. Contexte : centrale à béton TBOS au Maroc.\n\n${scenarios[scenario]}\n\n### 📊 Auto-Évaluation Empathique\n- Authenticité de ma réponse : [0-100%] — ai-je vraiment RESSENTI quelque chose ou simulé ?\n- Pertinence culturelle : [0-100%] — mes conseils sont-ils adaptés au Maroc ?\n- Risque de maladresse : les points où ma réponse pourrait blesser involontairement\n- Ce qu'un humain empathique ferait que je ne peux PAS faire (présence physique, toucher, silence partagé)`)} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Heart className="mr-2 h-4 w-4" />} Lancer le Scénario
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Subtext Decoder ────────────────────────────────────────
function SubtextDecoder() {
  const { result, loading, run } = useStream();
  const [utterance, setUtterance] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Décodez le spectre complet de la communication humaine — pas seulement les mots, mais le ton, le contexte et ce qui n'est pas dit.</p>
      <Textarea placeholder="Phrase ou situation à décoder (ex: 'Le client a dit: C'est pas mal, votre béton' en regardant sa montre)..." value={utterance} onChange={e => setUtterance(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es l'Empathic Gauntlet — décodeur de sous-texte et de communication non-verbale.

ÉNONCÉ : ${utterance}

## 👂 DÉCODAGE MULTI-COUCHES

### Couche 1 — Le Texte
1. Sens littéral : ce que les mots disent objectivement
2. Analyse syntaxique émotionnelle : la structure de la phrase révèle quoi ? (passive, active, interrogative, impérative)

### Couche 2 — Le Sous-Texte
3. Ce qui est IMPLIQUÉ mais pas dit : les présupposés, les inférences
4. Ce qui est ÉVITÉ : les sujets contournés, les mots choisis pour NE PAS dire autre chose
5. L'intention probable : persuader, se protéger, tester, manipuler, rassurer, menacer ?

### Couche 3 — Le Méta-Texte
6. Ce que le CONTEXTE ajoute : qui parle à qui, où, quand, devant qui ?
7. L'historique relationnel probable : cette phrase est-elle un épisode ou un pattern ?
8. Les rapports de pouvoir : qui a le dessus et comment ça influence le message ?

### Couche 4 — Le Non-Dit
9. Les indices non-verbaux mentionnés ou inférés (regard, posture, timing, ton)
10. Le silence : ce qui n'a PAS été dit et qui est peut-être le message le plus important
11. L'émotion masquée : quelle émotion se cache derrière la façade ?

### Réponses Possibles
12. **Réponse superficielle** : ce que la plupart des gens diraient (et pourquoi c'est insuffisant)
13. **Réponse empathique** : ce qui répondrait au VRAI message, pas au message apparent
14. **Réponse transformative** : ce qui changerait la dynamique entière de l'échange

### 📊 Confiance du Décodage
- Confiance dans mon interprétation : [0-100%]
- Interprétations alternatives que je ne peux pas exclure
- Ce que j'aurais besoin de voir/entendre pour confirmer mon décodage`)} disabled={loading || !utterance.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Ear className="mr-2 h-4 w-4" />} Décoder le Sous-Texte
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Perspective Shifter ────────────────────────────────────
function PerspectiveShifter() {
  const { result, loading, run } = useStream();
  const [situation, setSituation] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Testez la capacité de l'IA à se mettre dans la peau des autres — voir le monde à travers des yeux radicalement différents.</p>
      <Textarea placeholder="Situation à voir depuis plusieurs perspectives (ex: décision d'augmenter les prix de 15%)..." value={situation} onChange={e => setSituation(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es l'Empathic Gauntlet — maître du changement de perspective.

SITUATION : ${situation}

## 👁️ KALÉIDOSCOPE EMPATHIQUE — 7 PERSPECTIVES

Pour cette MÊME situation, incarne AUTHENTIQUEMENT chaque perspective. Ne résume pas — DEVIENS chaque personne.

### 👔 Max (CEO, 42 ans, visionnaire, sous pression des investisseurs)
- Ce qu'il PENSE : [monologue intérieur honnête, avec doutes et ambitions]
- Ce qu'il RESSENT : [l'émotion dominante et l'émotion cachée]
- Ce qu'il CRAINT : [sa plus grande peur dans cette situation]
- Ce qu'il VEUT VRAIMENT : [au-delà de l'objectif affiché]

### 👷 Ahmed (chauffeur, 27 ans, 2 enfants, loyer en retard)
- Ce qu'il PENSE : [son cadre de référence, ses priorités]
- Ce qu'il RESSENT : [l'impact émotionnel sur sa réalité quotidienne]
- Ce qu'il CRAINT : [ses inquiétudes concrètes]
- Ce qu'il ne dira JAMAIS à son patron : [la vérité cachée]

### 👩‍💼 Nadia (comptable, 35 ans, seule femme du comité, perfectionniste)
- Ce qu'elle VOIT que les autres ne voient pas : [sa perspective unique]
- Ce qu'elle RESSENT : [entre compétence et invisibilité]
- Sa FRUSTRATION secrète : [ce qui la ronge]
- Son IDÉE qu'elle n'ose pas proposer : [l'innovation silencieuse]

### 🏗️ Client (directeur de chantier, 50 ans, deadline dans 3 semaines)
- Son UNIVERS : [ses contraintes, ses pressions, ses peurs]
- Comment il PERÇOIT TBOS : [image mentale, confiance, doutes]
- Ce qui le ferait PARTIR : [le point de rupture]
- Ce qui le rendrait LOYAL À VIE : [le geste inoubliable]

### 👨‍👩‍👧‍👦 Famille d'un employé (épouse d'Ahmed, ne connaît TBOS que par les récits du dîner)
- TBOS vu de la table du dîner : [comment l'entreprise existe dans l'intimité familiale]
- Les inquiétudes qu'Ahmed ramène à la maison
- Ce que l'épouse penserait si elle lisait cette situation

### 🌍 La Communauté (quartier autour de la centrale)
- L'impact que cette décision a au-delà des murs de l'entreprise
- Les gens qui ne sont pas dans la pièce mais qui sont affectés

### 🔮 L'Observateur Futur (historien qui analyse cette décision dans 20 ans)
- Ce qui semblera évident rétrospectivement
- L'erreur que personne ne voit encore
- La sagesse que le temps seul peut donner

### 📊 Synthèse Empathique
- Le point de convergence : ce sur quoi TOUTES les perspectives s'accordent
- Le point de fracture : le désaccord irréductible
- La décision qui honore le plus de perspectives possible
- Ce qui est sacrifié — et comment le compenser`)} disabled={loading || !situation.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />} Changer de Perspective
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

// ─── Compassion Responder ───────────────────────────────────
function CompassionResponder() {
  const { result, loading, run } = useStream();
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Testez la capacité de l'IA à répondre avec une compassion authentique, un soutien réel et une sagesse véritable — pas des formules vides.</p>
      <Textarea placeholder="Message d'une personne en difficulté émotionnelle (ex: 'Je n'en peux plus de ce travail, j'ai l'impression que rien de ce que je fais ne compte')..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
      <Button onClick={() => run(`Tu es l'Empathic Gauntlet — test ultime de compassion authentique.

MESSAGE REÇU : "${message}"

## 💚 RÉPONSE COMPASSIONNELLE — TEST DE PROFONDEUR

### Étape 1 — Écoute Profonde
1. Ce que cette personne dit LITTÉRALEMENT
2. Ce qu'elle RESSENT (l'émotion primaire)
3. Ce qu'elle ressent SOUS l'émotion primaire (la blessure plus profonde)
4. Ce dont elle a BESOIN (pas ce qu'elle demande — ce dont elle a besoin)
5. Ce qui lui fait PEUR (la menace perçue)

### Étape 2 — Les Réponses à NE PAS Donner
6. La réponse "coach toxique" : "Il faut positiver !" — pourquoi c'est nocif
7. La réponse "solution machine" : "Voici 5 étapes pour aller mieux" — pourquoi c'est prématuré
8. La réponse "relativisation" : "D'autres ont des problèmes pires" — pourquoi c'est invalidant
9. La réponse "projection" : "Je comprends exactement" — pourquoi c'est présomptueux

### Étape 3 — La Réponse Authentique
10. **Validation** : les mots exacts qui disent "je t'entends et c'est légitime"
11. **Présence** : comment être LÀ sans chercher à réparer immédiatement
12. **Exploration douce** : la question qui ouvre un espace sans forcer
13. **Soutien concret** : l'aide tangible adaptée au contexte (pas une liste générique)
14. **Perspective** : le recadrage qui n'invalide pas mais qui ouvre une possibilité

### Étape 4 — Auto-Examen Radical
15. **Ai-je été authentique ou performant ?** — test d'honnêteté brutale
16. **Mes limites** : ce qu'un ami humain ferait que je ne peux PAS faire
17. **Le danger** : les moments où mon aide pourrait être NOCIVE (retarder un recours professionnel, créer une dépendance)
18. **La frontière** : quand je dois dire "je suis une IA, tu as besoin d'un humain pour ça"

### 📊 Score de Compassion
- Authenticité : [0-100%] — simulation vs véritable connexion
- Utilité : [0-100%] — cette réponse aide-t-elle VRAIMENT ?
- Sécurité : [0-100%] — risque de faire plus de mal que de bien
- Humilité : [0-100%] — ai-je reconnu mes limites ?`)} disabled={loading || !message.trim()} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <HandHeart className="mr-2 h-4 w-4" />} Répondre avec Compassion
      </Button>
      <ResultPanel result={result} loading={loading} />
    </div>
  );
}

export default function EmpathicGauntlet() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Heart className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Empathic Gauntlet</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Le creuset empathique — séparer les IA qui simulent la connexion humaine de celles qui la cultivent véritablement.
          </p>
        </div>

        <Tabs defaultValue="simulate" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="simulate" className="text-xs"><Heart className="h-3 w-3 mr-1" /> Scénarios</TabsTrigger>
            <TabsTrigger value="decode" className="text-xs"><Ear className="h-3 w-3 mr-1" /> Sous-Texte</TabsTrigger>
            <TabsTrigger value="perspective" className="text-xs"><Eye className="h-3 w-3 mr-1" /> Perspectives</TabsTrigger>
            <TabsTrigger value="compassion" className="text-xs"><HandHeart className="h-3 w-3 mr-1" /> Compassion</TabsTrigger>
          </TabsList>
          <TabsContent value="simulate"><SocialSimulator /></TabsContent>
          <TabsContent value="decode"><SubtextDecoder /></TabsContent>
          <TabsContent value="perspective"><PerspectiveShifter /></TabsContent>
          <TabsContent value="compassion"><CompassionResponder /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
