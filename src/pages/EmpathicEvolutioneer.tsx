import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Heart, Waves, Sprout, Users } from 'lucide-react';

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

function ResultPanel({ result, icon: Icon, emptyText }: { result: string; icon: any; emptyText: string }) {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardContent className="pt-4">
        <ScrollArea className="h-[440px]">
          {result ? (
            <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
              <Icon className="w-8 h-8 opacity-30" /><span>{emptyText}</span>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Empathic Deep Dive ─────────────────────────────────────
function EmpathicDeepDive() {
  const { result, loading, run } = useStream();
  const [context, setContext] = useState('');
  const [persona, setPersona] = useState<'client' | 'chauffeur' | 'operateur' | 'fournisseur'>('client');

  const personas = {
    client: '🏗️ Client Chantier',
    chauffeur: '🚛 Chauffeur Toupie',
    operateur: '⚙️ Opérateur Centrale',
    fournisseur: '📦 Fournisseur',
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(personas) as [typeof persona, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setPersona(key)} className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${persona === key ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-muted/40'}`}>
                {label}
              </button>
            ))}
          </div>
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Contexte ou moment spécifique à explorer empathiquement..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Empathic Evolutioneer — l'IA qui plonge dans l'océan des émotions humaines pour en rapporter des insights qui transforment l'innovation.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
PERSONA: ${personas[persona]}
SITUATION: ${context.trim() || "Une journée complète dans la vie de cette personne, avec toutes ses interactions avec TBOS"}

PLONGÉE EMPATHIQUE PROFONDE:

1. 💓 CARTOGRAPHIE ÉMOTIONNELLE DE LA JOURNÉE
   Heure par heure, les marées émotionnelles du ${personas[persona]}:
   
   | Heure | Moment | Émotion Dominante | Intensité /10 | Besoin Non-Dit | Opportunité |
   |-------|--------|-------------------|---------------|----------------|-------------|
   | 06:00 | [réveil, préparation] | | | | |
   | 07:00 | [premier contact TBOS] | | | | |
   | ... | [12-15 moments clés dans la journée] | | | | |
   
   La COURBE ÉMOTIONNELLE: [description de la forme — vallée? montagne? montagnes russes?]
   Le POINT CRITIQUE: le moment où tout bascule (positif ou négatif)
   Le BESOIN INAVOUÉ: ce que cette personne veut vraiment mais ne dira jamais

2. 🌊 LES COURANTS SOUS-MARINS
   Les émotions invisibles en surface mais puissantes en profondeur:
   
   COURANT 1: LA PEUR SILENCIEUSE
   - De quoi a peur le ${personas[persona]}? [peur profonde, pas la peur évidente]
   - Comment TBOS la renforce involontairement
   - Comment TBOS pourrait la dissoudre
   
   COURANT 2: LA FIERTÉ CACHÉE
   - De quoi est secrètement fier(e) cette personne?
   - Comment TBOS pourrait la nourrir et l'amplifier
   
   COURANT 3: LA FRUSTRATION CHRONIQUE
   - Le grain de sable émotionnel quotidien
   - Son coût réel (productivité, fidélité, bouche-à-oreille)
   - La solution empathique (pas technique — EMPATHIQUE)
   
   COURANT 4: LE DÉSIR D'APPARTENANCE
   - Comment cette personne veut être VUE par TBOS
   - Le gap entre perception et réalité
   - Le pont empathique à construire

3. 🎭 L'ENTRETIEN EMPATHIQUE IMAGINÉ
   Un dialogue fictif mais profondément réaliste:
   "Si je pouvais dire une chose à TBOS sans conséquence, je dirais..."
   [5 phrases que cette personne n'oserait jamais dire, mais pense très fort]
   
   Pour chaque phrase:
   - L'émotion sous-jacente
   - L'insight business
   - L'innovation empathique qui en découle

4. 💡 5 INNOVATIONS EMPATHIQUES
   Nées directement de cette plongée émotionnelle:
   Pour chaque:
   - L'émotion source
   - L'innovation (qui RÉSONNE, pas juste qui fonctionne)
   - Comment elle fait SENTIR la personne (pas ce qu'elle fait techniquement)
   - Impact business: X MAD + impact émotionnel

Style: Thérapeute humaniste × Designer empathique × Poète de l'ordinaire. Profondément humain, doux mais lucide, transformateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
            Plonger dans l'Empathie
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Heart} emptyText="Choisissez une persona et décrivez le contexte" />
    </div>
  );
}

// ─── Resonance Designer ─────────────────────────────────────
function ResonanceDesigner() {
  const { result, loading, run } = useStream();
  const [need, setNeed] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={need} onChange={e => setNeed(e.target.value)} placeholder="Besoin fonctionnel à transformer en expérience qui résonne..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Empathic Evolutioneer — designer de résonance qui crée des innovations touchant l'âme, pas juste le cerveau.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
BESOIN: ${need.trim() || "Transformer la livraison de béton — un acte purement transactionnel — en une expérience humaine mémorable"}

DESIGN DE RÉSONANCE EMPATHIQUE:

1. 🔍 ANATOMIE DU BESOIN
   Trois couches du besoin humain (iceberg):
   
   SURFACE (ce qu'on dit): "Je veux mon béton à l'heure"
   → Besoin fonctionnel: fiabilité, ponctualité
   
   MILIEU (ce qu'on ressent): "Je veux me sentir respecté et considéré"
   → Besoin émotionnel: dignité, reconnaissance, confiance
   
   PROFONDEUR (ce qu'on EST): "Je veux que mon chantier soit une réussite dont je sois fier"
   → Besoin identitaire: accomplissement, fierté professionnelle, héritage
   
   [Adapter ces 3 couches au besoin spécifique mentionné]

2. 🎵 DESIGN DE 5 EXPÉRIENCES RÉSONANTES
   Chaque expérience touche les 3 couches simultanément:

   EXPÉRIENCE 1: [Nom évocateur]
   ✅ Fonctionnel: ce que ça FAIT
   💓 Émotionnel: ce que ça fait RESSENTIR
   🌟 Identitaire: ce que ça dit de QUI JE SUIS
   📐 Design: les micro-moments de résonance
   - Le premier contact: [comment ça commence — la première note]
   - Le crescendo: [le moment de magie]
   - La coda: [comment ça finit — le souvenir qui reste]
   💰 ROI émotionnel: fidélité +X%, bouche-à-oreille +X%, LTV +X MAD

   EXPÉRIENCE 2-5: [même profondeur]

3. 📊 MATRICE DE RÉSONANCE
   | Expérience | Résonance Fonctionnelle | Résonance Émotionnelle | Résonance Identitaire | Score Total |
   Score = F×1 + E×3 + I×5 (l'identitaire pèse 5× plus que le fonctionnel)

4. 🎼 LA SYMPHONIE TBOS
   Comment les 5 expériences s'orchestrent en un parcours complet:
   - Premier mouvement: la découverte [premier contact]
   - Deuxième: l'engagement [première commande]
   - Troisième: la confiance [relation établie]
   - Quatrième: l'émerveillement [le moment "wow"]
   - Final: l'appartenance [le client devient ambassadeur]

Style: Designer UX de l'âme × Chef d'orchestre émotionnel. Délicat, profond, exigeant. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Waves className="w-4 h-4 mr-2" />}
            Designer la Résonance
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Waves} emptyText="Décrivez un besoin fonctionnel à transformer en expérience résonante" />
    </div>
  );
}

// ─── Sentiment Evolution Engine ─────────────────────────────
function SentimentEvolution() {
  const { result, loading, run } = useStream();
  const [topic, setTopic] = useState('');

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Innovation ou service à faire évoluer avec le sentiment humain..." className="text-xs min-h-[55px] bg-muted/30" />
          <Button onClick={() => run(
            `Tu es l'Empathic Evolutioneer — moteur d'évolution qui adapte les innovations aux marées changeantes du sentiment humain.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA.
SUJET: ${topic.trim() || "Comment l'offre TBOS devrait évoluer en réponse aux changements émotionnels du marché BTP marocain"}

MOTEUR D'ÉVOLUTION SENTIMENTALE:

1. 🌡️ MÉTÉO ÉMOTIONNELLE DU MARCHÉ BTP MAROC (2026)
   Les grands mouvements de sentiment qui traversent le secteur:
   
   VAGUE 1: L'ANXIÉTÉ POST-INFLATION
   - Manifestation: clients qui négocient plus durement, délais de paiement étirés
   - Émotion réelle: peur de l'avenir, besoin de contrôle
   - Ce que ça signifie pour TBOS: [analyse]
   - Adaptation empathique: [innovation qui répond à l'émotion, pas juste au symptôme]
   
   VAGUE 2: LA SOIF DE MODERNITÉ
   - Le secteur BTP se sent "en retard" face à la tech
   - Émotion: honte mêlée de fascination, désir de transformation
   - Adaptation empathique: [innovation]
   
   VAGUE 3: LA QUÊTE DE SENS
   - Les jeunes ingénieurs veulent plus que du béton
   - Émotion: recherche de purpose, impact environnemental
   - Adaptation empathique: [innovation]
   
   VAGUE 4: LA NOSTALGIE DE LA CONFIANCE
   - "Avant, une poignée de main suffisait"
   - Émotion: deuil d'une époque plus simple, méfiance systémique
   - Adaptation empathique: [innovation]

2. 🧬 ÉVOLUTION ADAPTATIVE (Roadmap sur 18 mois)
   Comment TBOS mute pour rester en résonance:
   
   T0-T6: PHASE EMPATHIE (écouter)
   - Capteurs émotionnels installés: [quels feedback loops]
   - Baromètre de sentiment: [comment mesurer]
   - Rituels d'écoute: [quand, qui, comment]
   - Innovation: [première adaptation]
   
   T6-T12: PHASE RÉSONANCE (répondre)
   - Produits/services adaptés au sentiment détecté
   - Communication empathique (pas marketing, EMPATHIQUE)
   - Innovation: [adaptation majeure]
   
   T12-T18: PHASE CO-ÉVOLUTION (grandir ensemble)
   - Le client participe à l'évolution du service
   - Boucle de co-création émotionnelle
   - Innovation: [mutation profonde]

3. 📈 PRÉDICTION SENTIMENTALE
   Les 3 prochains virages émotionnels du marché:
   | Quand | Le virage | L'émotion | L'opportunité | L'innovation préventive |
   
   "Celui qui sent le vent avant la tempête construit des moulins, pas des murs."

Style: Sociologue des émotions × Stratège adaptatif. Sensible, anticipatif, sage. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sprout className="w-4 h-4 mr-2" />}
            Évoluer avec le Sentiment
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Sprout} emptyText="Décrivez une innovation à faire évoluer avec le sentiment" />
    </div>
  );
}

// ─── Empathic Culture Builder ───────────────────────────────
function EmpathicCulture() {
  const { result, loading, run } = useStream();

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Button onClick={() => run(
            `Tu es l'Empathic Evolutioneer — bâtisseur de culture empathique qui transforme une organisation de l'intérieur.

CONTEXTE: TBOS, centrale béton Maroc, 80M MAD CA. Équipe: Max (CEO), Karim (Superviseur), Abdel Sadek (Resp. Technique), Front Desk, chauffeurs, opérateurs.

PROGRAMME DE CULTURE EMPATHIQUE TBOS:

1. 💓 DIAGNOSTIC D'EMPATHIE ORGANISATIONNELLE
   Évaluation honnête et bienveillante:
   
   | Dimension | Score /10 | Forces | Angles morts |
   |-----------|-----------|--------|--------------|
   | Empathie client | | Ce qui marche | Ce qui manque |
   | Empathie inter-équipe | | | |
   | Empathie managériale | | | |
   | Empathie fournisseur | | | |
   | Auto-empathie (soin de soi) | | | |
   
   Score global d'empathie: X/50
   Benchmark secteur BTP: Y/50
   Gap: [analyse]
   
   LE PARADOXE DU BÉTON: l'industrie la plus "dure" a le plus besoin de douceur.

2. 🌱 LES 7 RITUELS EMPATHIQUES (à installer)

   RITUEL 1: LE CERCLE D'ÉCOUTE (hebdomadaire, 15 min)
   Quoi: Chacun partage UNE chose qui l'a touché cette semaine (pas un KPI — une ÉMOTION)
   Pourquoi: crée la sécurité psychologique, rend visible l'invisible
   Comment: [protocole détaillé]
   Impact attendu: cohésion +X%, turnover -X%
   
   RITUEL 2: LA MARCHE EMPATHIQUE (mensuelle, 2h)
   Quoi: Max passe 2h dans la peau d'un chauffeur/opérateur/front desk
   Pourquoi: l'empathie ne se comprend pas, elle se VIT
   Comment: [protocole]
   Impact: décisions +X% pertinentes
   
   RITUEL 3: LE FEEDBACK DU CŒUR (quotidien, 30 sec)
   Quoi: avant chaque interaction importante, 30 sec pour se demander "comment cette personne SE SENT en ce moment?"
   Pourquoi: recalibre l'attention sur l'humain
   
   RITUEL 4: LE CLIENT INVISIBLE (trimestriel)
   Quoi: reconstituer le vécu émotionnel d'un client du premier appel à la dernière facture
   Pourquoi: voir l'expérience avec les yeux du cœur, pas du process
   
   RITUEL 5: LA GRATITUDE CIBLÉE (vendredi, 2 min)
   Quoi: chaque personne remercie UNE autre personne pour quelque chose de SPÉCIFIQUE
   Pourquoi: nourrit le circuit de récompense sociale
   
   RITUEL 6: LE DEBRIEF ÉMOTIONNEL (après chaque crise)
   Quoi: pas "qu'est-ce qui s'est passé?" mais "qu'avez-vous ressenti?"
   Pourquoi: traite le trauma organisationnel, prévient le burnout
   
   RITUEL 7: LA CÉLÉBRATION SILENCIEUSE (annuelle)
   Quoi: un moment de silence collectif pour honorer le travail accompli
   Pourquoi: certaines émotions sont trop profondes pour les mots

3. 🏗️ ARCHITECTURE DE DÉCISION EMPATHIQUE
   Chaque décision TBOS passe par 3 filtres:
   
   FILTRE 1: EFFICACITÉ — "Est-ce que ça marche?"
   FILTRE 2: EMPATHIE — "Comment ça fait SENTIR les gens?"
   FILTRE 3: ÉVOLUTION — "Est-ce que ça nous rend plus humains?"
   
   Exemples de décisions recalibrées:
   | Décision | Avant (filtre 1 seul) | Après (3 filtres) | Différence |
   [5 exemples concrets TBOS]

4. 📊 KPIs EMPATHIQUES
   Les métriques du cœur (à côté des métriques du cerveau):
   - NES (Net Empathy Score): comment les gens se sentent TRAITÉS
   - Index de Sécurité Psychologique: ose-t-on dire la vérité?
   - Ratio Écoute/Parole en réunion: qui écoute vraiment?
   - Taux de "Merci Spontanés": indicateur de culture de gratitude
   - Score de Présence: est-on vraiment LÀ ou juste physiquement présent?

5. 🌟 LA VISION
   TBOS dans 2 ans avec une culture empathique installée:
   - Ce que disent les clients: [verbatim rêvé]
   - Ce que disent les employés: [verbatim rêvé]
   - Ce que dit le marché: [réputation rêvée]
   - Les chiffres: CA +X%, Marge +X%, Turnover -X%, NPS +X
   
   "Le béton le plus solide est celui qui est coulé avec amour."

Style: Sage bienveillant × Architecte culturel × Poète du quotidien. Chaleureux, lucide, transformateur. Français.`
          )} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
            Bâtir la Culture Empathique
          </Button>
        </CardContent>
      </Card>
      <ResultPanel result={result} icon={Users} emptyText="Lancez la construction de la culture empathique" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function EmpathicEvolutioneer() {
  const [activeTab, setActiveTab] = useState('dive');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-primary/20 border border-pink-500/30">
            <Heart className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Empathic Evolutioneer</h1>
            <p className="text-xs text-muted-foreground">Innover avec le cœur, pas juste le cerveau</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
            <span>Intelligence Empathique Active</span>
          </div>
          <span>4 couches émotionnelles</span>
          <span>∞ résonances</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="dive" className="text-xs font-mono gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Plongée
          </TabsTrigger>
          <TabsTrigger value="resonance" className="text-xs font-mono gap-1.5">
            <Waves className="w-3.5 h-3.5" /> Résonance
          </TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs font-mono gap-1.5">
            <Sprout className="w-3.5 h-3.5" /> Évolution
          </TabsTrigger>
          <TabsTrigger value="culture" className="text-xs font-mono gap-1.5">
            <Users className="w-3.5 h-3.5" /> Culture
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="dive" className="mt-4"><EmpathicDeepDive /></TabsContent>
            <TabsContent value="resonance" className="mt-4"><ResonanceDesigner /></TabsContent>
            <TabsContent value="evolution" className="mt-4"><SentimentEvolution /></TabsContent>
            <TabsContent value="culture" className="mt-4"><EmpathicCulture /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
