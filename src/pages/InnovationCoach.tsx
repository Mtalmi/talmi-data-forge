import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  GraduationCap, Users, Zap, TrendingUp, Loader2, Sparkles,
  UserCheck, MessageCircle, Network, Brain, Target, Lightbulb,
  Heart, Shield, BookOpen, ArrowRight, BarChart3, Star, Compass,
  CheckCircle2, RefreshCw
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

// ─── Innovator Profiler ──────────────────────────────────────
function InnovatorProfiler() {
  const profiles = [
    { id: 'ceo', name: 'Max (CEO)', role: 'Décideur stratégique', strengths: 'Vision, audace, réseau', style: 'Directif-Visionnaire' },
    { id: 'karim', name: 'Karim (Superviseur)', role: 'Pilote opérationnel', strengths: 'Rigueur, terrain, équipe', style: 'Analytique-Pragmatique' },
    { id: 'abdel', name: 'Abdel Sadek (Resp. Tech)', role: 'Expert technique', strengths: 'Formulation, qualité, innovation matériaux', style: 'Scientifique-Méthodique' },
    { id: 'frontdesk', name: 'Front Desk (Admin)', role: 'Interface client', strengths: 'Relationnel, organisation, process', style: 'Collaboratif-Structuré' },
  ];

  const [selected, setSelected] = useState(profiles[0]);
  const [coaching, setCoaching] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setCoaching('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Innovation Coach de TBOS — coach personnalisé pour l'excellence en innovation industrielle.

PROFIL: ${selected.name}
RÔLE: ${selected.role}
FORCES: ${selected.strengths}
STYLE: ${selected.style}
TBOS: Centrale béton Maroc, culture d'amélioration continue.

CRÉE UN PROFIL D'INNOVATION PERSONNALISÉ:

1. 🧠 PROFIL COGNITIF
   - Style de pensée dominant (convergent/divergent/systémique)
   - Zone de génie naturel — là où cette personne excelle
   - Angles morts — ce qu'elle tend à négliger
   - Déclencheurs créatifs — ce qui active son meilleur travail

2. 💪 FORCES D'INNOVATION
   - Top 3 superpouvoirs avec exemples concrets
   - Comment les amplifier (levier x2)
   - Pièges à éviter (quand la force devient faiblesse)

3. 🎯 PLAN DE DÉVELOPPEMENT
   - 3 compétences à développer en priorité
   - Pour chaque: exercice pratique + timeline + métrique de progrès
   - Mentor/ressource recommandé

4. 🏆 DÉFIS D'INNOVATION
   - 3 mini-challenges personnalisés (1 semaine chacun)
   - Adaptés à son rôle et son style
   - Avec critères de réussite mesurables

5. 📊 MATRICE DE COMPLÉMENTARITÉ
   - Avec qui collaborer pour maximiser l'impact
   - Dynamiques de duo/trio idéales dans l'équipe TBOS

Style: Coach sportif de haut niveau + psychologue organisationnel. Bienveillant mais exigeant. Français.`,
        (t) => setCoaching(c => c + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setCoaching(c => c + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Équipe Innovation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected.id === p.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {selected.id === p.id ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Users className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-xs font-semibold">{p.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground ml-5">{p.role} · {p.style}</p>
            </button>
          ))}
          <Button onClick={analyze} disabled={loading} className="w-full mt-2" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
            Profiler
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Profil Innovation — {selected.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[430px]">
            {coaching ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{coaching}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Brain className="w-8 h-8 opacity-30" />
                <span>Sélectionnez un innovateur et lancez le profiling</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Real-Time Coach ─────────────────────────────────────────
function RealTimeCoach() {
  const [challenge, setChallenge] = useState('');
  const [guidance, setGuidance] = useState('');
  const [loading, setLoading] = useState(false);
  const [coachMode, setCoachMode] = useState<'unblock' | 'levelup' | 'challenge'>('unblock');
  const ctrlRef = useRef<AbortController | null>(null);

  const modes = [
    { id: 'unblock' as const, label: 'Débloquer', icon: Zap, desc: 'Surmonter un blocage créatif' },
    { id: 'levelup' as const, label: 'Level Up', icon: TrendingUp, desc: 'Monter en compétence' },
    { id: 'challenge' as const, label: 'Challenger', icon: Shield, desc: 'Stress-tester une idée' },
  ];

  const coach = useCallback(async () => {
    if (!challenge.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setGuidance('');
    setLoading(true);

    const modePrompt = coachMode === 'unblock'
      ? `MODE DÉBLOCAGE: L'innovateur est bloqué. Utilise des techniques de créativité (SCAMPER, pensée latérale, analogies, inversion) pour ouvrir de nouvelles pistes. Sois encourageant et progressif — donne des indices, pas des solutions toutes faites.`
      : coachMode === 'levelup'
        ? `MODE LEVEL UP: L'innovateur veut progresser. Identifie la compétence à développer, propose un micro-apprentissage (15 min), un exercice pratique, et une ressource. Connecte au contexte béton/BTP.`
        : `MODE CHALLENGER: Stress-teste l'idée ou l'approche. Joue l'avocat du diable constructif. Pose les questions que personne n'ose poser. Force la rigueur sans tuer la créativité.`;

    try {
      await streamAI(
        `Tu es l'Innovation Coach de TBOS en mode coaching temps réel.

${modePrompt}

SITUATION/DÉFI: ${challenge}
TBOS: Centrale béton Maroc, équipe de 4 innovateurs clés.

${coachMode === 'unblock' ? `
COACHING DE DÉBLOCAGE:
1. 🎯 DIAGNOSTIC — Quel type de blocage? (technique, créatif, décisionnel, émotionnel)
2. 🔑 RECADRAGE — Reformule le problème sous 3 angles différents
3. 💡 TECHNIQUES — 3 exercices de créativité adaptés (avec instructions pas-à-pas)
4. 🚀 AMORCES — 5 pistes concrètes pour relancer le mouvement
5. ⚡ ACTION IMMÉDIATE — La chose à faire dans les 10 prochaines minutes` :
coachMode === 'levelup' ? `
COACHING LEVEL UP:
1. 📊 DIAGNOSTIC DE COMPÉTENCE — Où en est l'innovateur sur ce sujet
2. 🎓 MICRO-FORMATION — Concept clé expliqué simplement (5 min de lecture)
3. 🛠️ EXERCICE PRATIQUE — Application immédiate au contexte TBOS (15 min)
4. 📚 RESSOURCES — 3 références (article, vidéo, outil) pour approfondir
5. 🏆 DÉFI 7 JOURS — Challenge pour ancrer la compétence
6. 📈 MÉTRIQUE — Comment mesurer le progrès` :
`
COACHING CHALLENGER:
1. ❓ LES 5 QUESTIONS QUI DÉRANGENT — Ce qu'un investisseur sceptique demanderait
2. 💀 PRE-MORTEM — "Il est 2027 et ça a échoué. Pourquoi?"
3. ⚖️ AVOCAT DU DIABLE — 3 contre-arguments solides
4. 🔍 ANGLES MORTS — Ce que l'innovateur ne voit pas
5. 💪 RENFORCEMENT — Comment rendre l'idée anti-fragile
6. ✅ VERDICT — Score de robustesse /10 avec pistes d'amélioration`}

Style: Coach bienveillant mais exigeant, type coach olympique. Français.`,
        (t) => setGuidance(g => g + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setGuidance(g => g + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [challenge, coachMode]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setCoachMode(m.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${coachMode === m.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <m.icon className={`w-4 h-4 ${coachMode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
                <span className="text-[9px] text-muted-foreground">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Décrivez votre situation, blocage ou idée à challenger..." className="text-xs min-h-[50px] bg-muted/30 flex-1" />
            <Button onClick={coach} disabled={loading || !challenge.trim()} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-amber-400" />
            Coaching — {modes.find(m => m.id === coachMode)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {guidance ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{guidance}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <MessageCircle className="w-8 h-8 opacity-30" />
                <span>Décrivez votre situation pour recevoir du coaching</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Collaboration Catalyst ──────────────────────────────────
function CollaborationCatalyst() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalystMode, setCatalystMode] = useState<'matchmaking' | 'workshop' | 'culture'>('matchmaking');
  const ctrlRef = useRef<AbortController | null>(null);

  const catalysts = [
    { id: 'matchmaking' as const, label: 'Matchmaking', icon: Network, desc: 'Duos & trios d\'innovation' },
    { id: 'workshop' as const, label: 'Atelier', icon: BookOpen, desc: 'Sessions de co-création' },
    { id: 'culture' as const, label: 'Culture', icon: Heart, desc: 'Rituels d\'innovation' },
  ];

  const catalyze = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setResult('');
    setLoading(true);

    try {
      await streamAI(
        `Tu es l'Innovation Coach de TBOS en mode "${catalysts.find(c => c.id === catalystMode)?.label}".

ÉQUIPE TBOS:
- Max (CEO): Visionnaire, décideur, réseau externe. Style directif.
- Karim (Superviseur): Terrain, rigueur, données. Style analytique.
- Abdel Sadek (Resp. Technique): Expert formulation, R&D, qualité. Style scientifique.
- Front Desk (Admin): Interface client, process, coordination. Style collaboratif.
CONTEXTE: Centrale béton Maroc, 200+ clients, culture d'amélioration continue.

${catalystMode === 'matchmaking' ? `
MATCHMAKING D'INNOVATION:
1. 🤝 DUOS DE CHOC — 3 pairings optimaux avec:
   - Pourquoi ces deux profils ensemble (complémentarité)
   - Projet d'innovation idéal pour ce duo
   - Risques de friction et comment les gérer
   - Format de collaboration recommandé

2. 👥 TRIO D'OR — La combinaison de 3 personnes la plus puissante
   - Dynamique de groupe prédite
   - Type de projet adapté
   - Rôles naturels dans le trio

3. 🌟 POLLINISATION CROISÉE
   - 3 opportunités de transfert de connaissances inter-rôles
   - Format: "X enseigne Y à Z" avec bénéfice mutuel
   - Planning proposé (1 session/semaine)` :
catalystMode === 'workshop' ? `
DESIGN D'ATELIER DE CO-CRÉATION:

Crée 3 ateliers d'innovation pour l'équipe TBOS:

Pour CHAQUE atelier:
- 🎯 OBJECTIF — Résultat concret attendu
- ⏱️ FORMAT — Durée, lieu, matériel nécessaire
- 📋 DÉROULÉ — Agenda minute par minute
- 🛠️ EXERCICES — 2-3 activités créatives détaillées (instructions complètes)
- 🎭 RÔLES — Qui fait quoi dans l'atelier
- 📊 LIVRABLES — Ce qui sort de l'atelier
- 🔥 L'ÉTINCELLE — L'élément surprise qui rend l'atelier mémorable

Ateliers adaptés au contexte béton/BTP avec données réelles.` :
`
RITUELS DE CULTURE D'INNOVATION:

Conçois un SYSTÈME DE RITUELS pour ancrer l'innovation dans l'ADN de TBOS:

1. 📅 RITUELS QUOTIDIENS (5 min)
   - Le "café innovation" — format et contenu
   - Le "signal du jour" — veille partagée

2. 📅 RITUELS HEBDOMADAIRES (30 min)
   - Le "lab meeting" — revue d'expérimentations
   - Le "fail forward" — célébration des apprentissages

3. 📅 RITUELS MENSUELS (2h)
   - Le "innovation sprint" — hackathon focalisé
   - Le "client safari" — immersion terrain

4. 📅 RITUELS TRIMESTRIELS (1 jour)
   - Le "demo day" — présentation des innovations
   - Le "moonshot challenge" — rêver grand

5. 🏆 SYSTÈME DE RECONNAISSANCE
   - Badges d'innovation (5 niveaux)
   - Tableau de bord gamifié
   - Récompenses alignées sur les valeurs

6. 📈 MÉTRIQUES DE CULTURE
   - Comment mesurer le progrès culturel
   - KPIs d'innovation à tracker`}

Style: Facilitateur world-class + designer organisationnel. Inspirant et concret. Français.`,
        (t) => setResult(r => r + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setResult(r => r + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [catalystMode]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            {catalysts.map(c => (
              <button
                key={c.id}
                onClick={() => setCatalystMode(c.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${catalystMode === c.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20 hover:bg-muted/40'}`}
              >
                <c.icon className={`w-4 h-4 ${catalystMode === c.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{c.label}</span>
                <span className="text-[9px] text-muted-foreground">{c.desc}</span>
              </button>
            ))}
          </div>
          <Button onClick={catalyze} disabled={loading} className="w-full" size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Catalyser — {catalysts.find(c => c.id === catalystMode)?.label}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Network className="w-4 h-4 text-amber-400" />
            {catalysts.find(c => c.id === catalystMode)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px]">
            {result ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <Network className="w-8 h-8 opacity-30" />
                <span>Choisissez un mode et lancez la catalyse</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Learning Engine ─────────────────────────────────────────
function LearningEngine() {
  const [projectDesc, setProjectDesc] = useState('');
  const [learnings, setLearnings] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const learn = useCallback(async () => {
    if (!projectDesc.trim()) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLearnings('');
    setLoading(true);
    try {
      await streamAI(
        `Tu es l'Innovation Coach de TBOS en mode "Moteur d'Apprentissage" — extracteur de leçons et optimiseur de stratégies.

PROJET/EXPÉRIENCE À ANALYSER: ${projectDesc}
TBOS: Centrale béton Maroc, équipe innovation de 4 personnes.

RÉTROSPECTIVE D'INNOVATION COMPLÈTE:

1. 📊 ANALYSE DE RÉSULTAT
   - Ce qui a fonctionné (top 3) — pourquoi exactement
   - Ce qui n'a pas fonctionné (top 3) — cause racine réelle
   - Ce qui a surpris — les découvertes inattendues

2. 🧬 EXTRACTION DE PATTERNS
   - 3 patterns de succès à reproduire systématiquement
   - 3 anti-patterns à éviter absolument
   - Conditions de succès identifiées (contexte, timing, équipe)

3. 📚 LEÇONS CAPITALISÉES
   - Pour chaque leçon: Situation → Action → Résultat → Enseignement
   - Format "carte de connaissance" réutilisable
   - Tags: #technique #process #humain #marché

4. 🔄 MISE À JOUR DES STRATÉGIES
   - Quelles croyances/hypothèses sont confirmées ou invalidées
   - Ajustements recommandés au playbook d'innovation TBOS
   - Nouvelles heuristiques de décision

5. 🎯 RECOMMANDATIONS FORWARD
   - 3 prochaines expérimentations à lancer (basées sur les apprentissages)
   - Ce qui change dans l'approche coaching pour chaque membre
   - Évolution du scoring de maturité innovation de l'équipe

6. 🏆 SCORE D'APPRENTISSAGE
   - Vélocité d'apprentissage /10
   - Qualité d'exécution /10
   - Capacité d'adaptation /10
   - Recommandation: zone de focus prioritaire

Style: Learning scientist + coach Agile. Données first, empathie second. Français.`,
        (t) => setLearnings(l => l + t),
        ctrl.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') setLearnings(l => l + '\n\n❌ Erreur.');
    } finally {
      setLoading(false);
    }
  }, [projectDesc]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Textarea
              value={projectDesc}
              onChange={e => setProjectDesc(e.target.value)}
              placeholder="Décrivez un projet, une expérimentation ou une initiative d'innovation récente... (ex: 'Lancement du béton B40+ éco, test pilote sur 3 clients pendant 2 mois')"
              className="text-xs min-h-[60px] bg-muted/30 flex-1"
            />
            <Button onClick={learn} disabled={loading || !projectDesc.trim()} className="self-end" size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Rétrospective & Apprentissage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {learnings ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{learnings}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 py-16">
                <RefreshCw className="w-8 h-8 opacity-30" />
                <span>Décrivez un projet pour extraire les apprentissages</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function InnovationCoach() {
  const [activeTab, setActiveTab] = useState('profiler');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 border border-primary/30">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Innovation Coach</h1>
            <p className="text-xs text-muted-foreground">Profiler, Coacher, Catalyser, Apprendre — le catalyseur de culture d'innovation</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Coach Actif</span>
          </div>
          <span>4 profils innovateurs</span>
          <span>3 modes de coaching</span>
          <span>3 catalyseurs collaboratifs</span>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="profiler" className="text-xs font-mono gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Profils
          </TabsTrigger>
          <TabsTrigger value="coach" className="text-xs font-mono gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> Coach
          </TabsTrigger>
          <TabsTrigger value="catalyst" className="text-xs font-mono gap-1.5">
            <Network className="w-3.5 h-3.5" /> Catalyse
          </TabsTrigger>
          <TabsTrigger value="learn" className="text-xs font-mono gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Apprentissage
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <TabsContent value="profiler" className="mt-4"><InnovatorProfiler /></TabsContent>
            <TabsContent value="coach" className="mt-4"><RealTimeCoach /></TabsContent>
            <TabsContent value="catalyst" className="mt-4"><CollaborationCatalyst /></TabsContent>
            <TabsContent value="learn" className="mt-4"><LearningEngine /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
