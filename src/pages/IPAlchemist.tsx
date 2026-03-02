import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  FlaskConical, Loader2, BookOpen, DollarSign, Shield, Handshake,
  Gem, Search, TrendingUp, FileText, Lock, Lightbulb, Scale,
  ArrowUpRight, Target, Zap, BarChart3, Eye
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

// ─── IP Cartographer ─────────────────────────────────────────
function IPCartographer() {
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const map = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(
        `Tu es l'IP Alchemist de TBOS — cartographe d'actifs de propriété intellectuelle pour le BPE au Maroc.

${focus.trim() ? `FOCUS: ${focus}` : ''}

ACTIFS IP TBOS CONNUS:
- 12 formules béton propriétaires (B25→B50, autoplaçant, bas carbone) avec dosages secrets
- Algorithme d'optimisation des rotations toupies (réduction 18% temps mort)
- Base de données 5 ans: 200+ clients, 50K+ livraisons, prix, marges, saisonnalité
- Plateforme TBOS (logiciel ERP béton custom): modules production, logistique, finance, AI
- Savoir-faire: correction temps réel des formules selon météo/agrégats
- Marque TBOS et réputation qualité zone Rabat-Salé
- Processus qualité: contrôle affaissement + résistance + traçabilité complète

CONTEXTE CONCURRENTIEL: LafargeHolcim, Ciments du Maroc, CIMAT, +50 centrales indépendantes.

CARTOGRAPHIE IP COMPLÈTE:

1. 🗺️ INVENTAIRE DES ACTIFS IP
   Pour chaque actif:
   - Type: Brevet / Secret commercial / Droit d'auteur / Marque / Savoir-faire / Données
   - Maturité: Embryonnaire / Développé / Mature / Déclinant
   - Protection actuelle: Formelle (brevet, dépôt) / Informelle (secret) / Non protégé
   - Valeur estimée (MAD) et méthode de valorisation
   - Exclusivité: Unique au marché / Avantage temporaire / Commodité

2. 📊 MATRICE DE VALEUR IP
   - Axe X: Valeur stratégique (faible → critique)
   - Axe Y: Niveau de protection (vulnérable → forteresse)
   - Quadrant par actif avec recommandation d'action

3. 🔍 ANALYSE CONCURRENTIELLE IP
   - IP des concurrents majeurs (brevets publiés, marques, logiciels)
   - Gaps: où TBOS a un avantage IP non exploité
   - Menaces: où les concurrents pourraient nous dépasser

4. ⚠️ VULNÉRABILITÉS
   - Actifs non protégés à risque
   - Dépendances critiques (fournisseurs de savoir-faire)
   - Risques de fuite (personnel clé, sous-traitants)

5. 💎 SCORE IP GLOBAL
   - Score portefeuille IP: /100
   - Benchmark vs industrie BPE
   - Top 3 actifs les plus précieux

Style: IP Attorney + Strategy Consultant. Rigoureux, valorisé, stratégique. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [focus]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={focus} onChange={e => setFocus(e.target.value)} placeholder="Focus optionnel: un actif spécifique, un concurrent, un domaine tech..." className="text-xs min-h-[50px] bg-muted/30" />
          <Button onClick={map} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
            Cartographier le Portefeuille IP
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-400" />Cartographie IP</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><BookOpen className="w-8 h-8 opacity-30" /><span>Lancez la cartographie de vos actifs IP</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Monetization Engine ─────────────────────────────────────
function MonetizationEngine() {
  const [mode, setMode] = useState<'licensing' | 'partnerships' | 'spinoffs' | 'data'>('licensing');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const modes = [
    { id: 'licensing' as const, label: 'Licensing', icon: FileText, desc: 'Licencier formules et logiciel' },
    { id: 'partnerships' as const, label: 'Partenariats', icon: Handshake, desc: 'Co-développement et JV' },
    { id: 'spinoffs' as const, label: 'Spin-offs', icon: Zap, desc: 'Nouvelles entités et produits' },
    { id: 'data' as const, label: 'Data Moat', icon: BarChart3, desc: 'Monétiser les données' },
  ];

  const generate = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    const m = modes.find(x => x.id === mode)!;
    try {
      await streamAI(
        `Tu es l'IP Alchemist — moteur de monétisation IP pour TBOS (BPE Maroc, 80M MAD CA).

MODE: ${m.label} — ${m.desc}

ACTIFS IP DISPONIBLES:
- 12 formules béton propriétaires (dosages optimisés, correctifs météo)
- Plateforme TBOS (ERP béton: production, logistique, finance, AI)
- Algorithme d'optimisation rotations (-18% temps mort)
- Dataset 5 ans: 50K+ livraisons, prix, marges, qualité, saisonnalité
- Savoir-faire: contrôle qualité temps réel, formation opérateurs
- Marque et réputation Rabat-Salé

${mode === 'licensing' ? `ANALYSE DE LICENSING:
1. 📋 ACTIFS LICENCIABLES — Quels actifs, à qui, sous quelles conditions
2. 💰 MODÈLES DE REVENUS — Redevance %, flat fee, per-use, tiered
3. 🌍 MARCHÉS CIBLES — Géographies et segments (Afrique, MENA, centrales indépendantes)
4. 📊 SIZING — Revenus potentiels par actif sur 5 ans (MAD)
5. ⚖️ PROTECTION — Comment licencier sans perdre l'avantage compétitif
6. 📝 STRUCTURE TYPE — Termes clés du contrat de licence
7. 🎯 PREMIERS PAS — 3 deals pilotes à lancer` :
mode === 'partnerships' ? `ANALYSE PARTENARIATS STRATÉGIQUES:
1. 🤝 PARTENAIRES POTENTIELS — 5 partenaires idéaux avec justification
2. 🔬 CO-DÉVELOPPEMENT — Quels projets IP conjoints (béton vert, IoT, recyclage)
3. 💎 VALEUR ÉCHANGÉE — Ce que TBOS apporte vs ce que le partenaire apporte
4. 📊 STRUCTURE — JV, co-licence, consortium R&D, accord cadre
5. 💰 MODÈLE ÉCONOMIQUE — Partage de revenus, equity, milestone payments
6. ⚠️ RISQUES — Fuite IP, dépendance, conflit d'intérêt
7. 🎯 SHORTLIST — Top 3 partenariats à poursuivre immédiatement` :
mode === 'spinoffs' ? `ANALYSE SPIN-OFFS:
1. 🚀 OPPORTUNITÉS — 4 spin-offs possibles à partir de l'IP TBOS
2. 📊 BUSINESS CASE — Pour chacun: TAM, modèle de revenus, break-even
3. 🏗️ ARCHITECTURE — IP parent vs spin-off, licensing interne, gouvernance
4. 💰 VALORISATION — Valeur estimée de chaque spin-off à 3 ans
5. 👥 ÉQUIPE — Compétences nécessaires, recrutement vs interne
6. 💼 FINANCEMENT — Bootstrap, VC, CVC, subventions Maroc Innovation
7. 🎯 CANDIDAT #1 — Le spin-off à lancer en premier avec roadmap 12 mois` :
`MONÉTISATION DES DONNÉES:
1. 📊 DATASET AUDIT — Quelles données ont de la valeur et pourquoi
2. 🔒 ANONYMISATION — Comment protéger la confidentialité client
3. 💰 PRODUITS DATA — Benchmarks sectoriels, indices de prix, prédictions
4. 🎯 CLIENTS — Qui paierait pour ces données (assureurs, banques, gouvernement)
5. 📈 PRICING — Modèle d'abonnement, tiers, prix par API call
6. 🛡️ AVANTAGE COMPÉTITIF — Comment les données deviennent un "moat"
7. 🎯 MVP — Premier produit data à lancer en 90 jours`}

Style: IP Monetization Expert + Business Developer. Créatif, chiffré, actionnable. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [mode]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {modes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${mode === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}>
                <m.icon className={`w-4 h-4 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[9px] text-muted-foreground text-center">{m.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={generate} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
            Identifier les Opportunités — {modes.find(m => m.id === mode)?.label}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Gem className="w-4 h-4 text-amber-400" />Opportunités de Monétisation</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Gem className="w-8 h-8 opacity-30" /><span>Choisissez un mode et explorez les opportunités</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── IP Fortification ────────────────────────────────────────
function IPFortification() {
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const fortify = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(
        `Tu es l'IP Alchemist — stratège de fortification IP pour TBOS (BPE Maroc).

${context.trim() ? `CONTEXTE/MENACE: ${context}` : 'Analyse générale de fortification IP.'}

POSITION IP ACTUELLE TBOS:
- Brevets déposés: 0 (tout est en secret commercial)
- Marques: TBOS déposée OMPIC
- Logiciel: Code source non déposé
- Formules: Documentées en interne, accès restreint
- Données: Stockées sur cloud, pas de politique de valorisation
- Accords: NDA basiques avec employés, aucun avec sous-traitants transport

STRATÉGIE DE FORTIFICATION COMPLÈTE:

1. 🛡️ PROTECTION IMMÉDIATE (0-3 mois)
   - Actions urgentes pour sécuriser les actifs vulnérables
   - NDA/NCA à renforcer ou créer
   - Classification des informations confidentielles
   - Coût estimé et priorité

2. 📋 STRATÉGIE BREVETS
   - Quels actifs breveter (et pourquoi certains doivent rester secrets)
   - Juridictions cibles: Maroc (OMPIC), OAPI, PCT international
   - Budget et timeline par dépôt
   - Claims clés à revendiquer

3. 🔒 DÉFENSE DU SECRET COMMERCIAL
   - Protocoles de protection des formules
   - Compartimentalisation: qui sait quoi
   - Procédures anti-fuite (départ employés, audit)
   - Forensic: comment détecter une fuite

4. 💻 PROTECTION LOGICIELLE
   - Dépôt APP/copyright du code TBOS
   - Architecture SaaS vs licence pour protéger le code
   - Obfuscation et mesures techniques

5. 🎯 ACQUISITIONS IP STRATÉGIQUES
   - Brevets ou technologies à acquérir pour renforcer la position
   - Startups/labos à surveiller pour acquisition
   - Budget recommandé pour M&A IP

6. 🌐 OPEN INNOVATION CALIBRÉE
   - Quoi ouvrir (pour attirer l'écosystème) vs quoi fermer (avantage)
   - Modèle: contribuer aux normes tout en gardant l'implémentation secrète
   - Partenariats académiques (UM5, EMI) pour R&D pré-compétitive

7. 📊 PLAN D'ACTION 12 MOIS
   - Roadmap avec jalons, budget, responsables
   - KPIs de protection IP
   - Score cible: de X/100 à Y/100

Style: IP Attorney + Chief Strategy Officer. Défensif, proactif, chiffré. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [context]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Décrivez une menace ou un contexte spécifique (ex: 'Un ancien employé a rejoint un concurrent', 'Nouvelle réglementation sur les données industrielles')..." className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={fortify} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Fortifier la Position IP
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400" />Stratégie de Fortification</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Shield className="w-8 h-8 opacity-30" /><span>Lancez l'analyse de fortification IP</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Decision War Room ───────────────────────────────────────
function DecisionWarRoom() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    if (!question.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult(''); setLoading(true);
    try {
      await streamAI(
        `Tu es l'IP Alchemist — conseiller décisionnel IP temps réel pour TBOS.

QUESTION/DÉCISION IP: ${question}

CONTEXTE TBOS: Centrale béton Maroc, 80M MAD CA, 200+ clients, 12 formules propriétaires, plateforme ERP custom, dataset 5 ans.

ANALYSE DÉCISIONNELLE IP:

1. 📊 CADRAGE — Enjeu IP de cette décision et parties prenantes
2. ⚖️ OPTIONS
   - Option A: [description] — Impact IP / Coût / Risque / Timeline
   - Option B: [description] — Impact IP / Coût / Risque / Timeline
   - Option C: [description] — Impact IP / Coût / Risque / Timeline
3. 🔍 ANALYSE JURIDIQUE — Lois applicables (Maroc, international), précédents
4. 💰 VALORISATION — Impact financier de chaque option sur la valeur IP
5. ⚠️ RISQUES — Scénarios catastrophe et probabilités
6. 🎯 RECOMMANDATION — Option choisie avec conviction (/10)
7. 📋 NEXT STEPS — 5 actions immédiates avec responsable et deadline

Style: General Counsel + IP Strategist. Tranché, juridiquement fondé, orienté action. Français.`,
        (t) => setResult(r => r + t), ctrl.signal
      );
    } catch (e: any) { if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.'); }
    finally { setLoading(false); }
  }, [question]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Quelle décision IP devez-vous prendre? (ex: 'Breveter notre algorithme de rotation ou le garder en secret?', 'Un concurrent copie notre interface — que faire?')" className="text-xs min-h-[60px] bg-muted/30" />
          <Button onClick={analyze} disabled={loading || !question.trim()} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Analyser la Décision IP
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Scale className="w-4 h-4 text-amber-400" />War Room Décisionnel</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            {result ? <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div> : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16"><Scale className="w-8 h-8 opacity-30" /><span>Posez une question de décision IP</span></div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function IPAlchemist() {
  const [activeTab, setActiveTab] = useState('cartography');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30">
            <FlaskConical className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">IP Alchemist</h1>
            <p className="text-xs text-muted-foreground">Cartographier, Monétiser, Fortifier, Décider — l'alchimie de la propriété intellectuelle</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Alchemist Actif</span>
          </div>
          <span>7 catégories IP</span>
          <span>4 modèles monétisation</span>
          <span>12 actifs analysés</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="cartography" className="text-xs font-mono gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Cartographie
          </TabsTrigger>
          <TabsTrigger value="monetize" className="text-xs font-mono gap-1.5">
            <Gem className="w-3.5 h-3.5" /> Monétisation
          </TabsTrigger>
          <TabsTrigger value="fortify" className="text-xs font-mono gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Fortification
          </TabsTrigger>
          <TabsTrigger value="warroom" className="text-xs font-mono gap-1.5">
            <Scale className="w-3.5 h-3.5" /> War Room
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="cartography" className="mt-4"><IPCartographer /></TabsContent>
            <TabsContent value="monetize" className="mt-4"><MonetizationEngine /></TabsContent>
            <TabsContent value="fortify" className="mt-4"><IPFortification /></TabsContent>
            <TabsContent value="warroom" className="mt-4"><DecisionWarRoom /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
