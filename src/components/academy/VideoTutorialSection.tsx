import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Video, 
  Clock, 
  CheckCircle2, 
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Package,
  Receipt,
  Truck,
  Calculator,
  MapPin,
  Shield,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Mic,
  Camera,
  Plus,
  FileText,
  ClipboardCheck,
  Navigation,
  Target,
  Radar,
  AlertTriangle,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTutorialVoice } from '@/hooks/useTutorialVoice';
import { ScreenRecorderStudio } from './ScreenRecorderStudio';
import { TutorialScreenSimulator } from './TutorialScreenSimulator';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'basics' | 'operations' | 'advanced';
  narration: {
    intro: string;
    steps: string[];
    outro: string;
  };
  steps: string[];
}

const VIDEO_TUTORIALS: VideoTutorial[] = [
  // ========== NOUVEAUX TUTORIELS DÉTAILLÉS ==========
  {
    id: 'creer-devis-bc',
    title: 'Créer un Devis → BC',
    description: 'Workflow complet: devis, validation, conversion en bon de commande',
    duration: '5:00',
    icon: FileText,
    category: 'operations',
    steps: [
      'Accéder à la page Ventes',
      'Cliquer sur "Nouveau Devis"',
      'Sélectionner le client',
      'Choisir la formule béton',
      'Définir volume et zone de livraison',
      'Calculer le prix automatique',
      'Soumettre pour approbation',
      'Validation par Agent Admin ou CEO',
      'Convertir le devis en BC'
    ],
    narration: {
      intro: "Dans ce tutoriel complet, vous allez maîtriser le workflow de création de devis et sa conversion en bon de commande. C'est le processus commercial fondamental de TBOS.",
      steps: [
        "Commencez par accéder à la page Ventes depuis le menu principal. Vous y trouverez trois onglets : Devis, Bons de Commande, et Factures.",
        "Cliquez sur le bouton jaune 'Nouveau Devis' en haut à droite. Un formulaire complet s'affiche.",
        "Sélectionnez le client dans la liste déroulante. Si c'est un nouveau client, cliquez sur 'Créer Client' pour l'ajouter d'abord au système.",
        "Choisissez la formule de béton souhaitée : B25, B30, B35 ou formule spéciale. Chaque formule a un coût de revient calculé automatiquement.",
        "Entrez le volume en mètres cubes et sélectionnez la zone de livraison. La distance impacte directement le prix de transport.",
        "Le système calcule automatiquement le prix de vente en fonction du coût des matériaux, du transport, et de votre marge cible. Vous pouvez ajuster si nécessaire.",
        "Cliquez sur 'Soumettre pour approbation'. Le devis passe en statut 'En attente' et une notification est envoyée aux validateurs.",
        "Seuls l'Agent Admin, le CEO ou le Superviseur peuvent approuver un devis. Une fois validé, le devis est verrouillé et ne peut plus être modifié.",
        "Après approbation, cliquez sur 'Convertir en BC'. Le bon de commande est créé avec toutes les informations du devis. Il est maintenant prêt pour la planification."
      ],
      outro: "Excellent ! Vous maîtrisez maintenant le cycle de vente complet. Rappel : un devis approuvé ne peut plus être modifié. Seul le CEO peut le remettre en brouillon via le code spécial."
    }
  },
  {
    id: 'valider-livraison-complete',
    title: 'Valider une Livraison',
    description: 'Signature client, contrôle qualité, enregistrement paiement et facturation',
    duration: '6:00',
    icon: ClipboardCheck,
    category: 'operations',
    steps: [
      'Accéder à la page Planning',
      'Identifier le BL à valider',
      'Ouvrir le détail de la livraison',
      'Vérifier le contrôle qualité départ',
      'Confirmer l\'arrivée sur chantier',
      'Obtenir la signature client',
      'Enregistrer le mode de paiement',
      'Valider le retour camion',
      'Générer la facture'
    ],
    narration: {
      intro: "Ce tutoriel vous guide à travers le processus complet de validation d'une livraison, de l'arrivée sur chantier jusqu'à la facturation. Chaque étape est tracée pour une traçabilité totale.",
      steps: [
        "Rendez-vous sur la page Planning. La timeline affiche toutes les livraisons du jour avec leur statut en temps réel : planifié, en production, en route, ou livré.",
        "Identifiez le bon de livraison à valider. Les BL en attente de validation sont marqués en orange. Cliquez dessus pour ouvrir le détail.",
        "Le panneau de détail affiche toutes les informations : client, formule, volume, camion assigné, et chauffeur. Vérifiez que tout est correct.",
        "Avant le départ, le responsable qualité doit valider le test de slump. La photo du cône d'Abrams et la mesure d'affaissement sont obligatoires. Sans cette validation, le camion ne peut pas partir.",
        "Une fois sur le chantier, le chauffeur confirme son arrivée via l'application mobile. L'heure d'arrivée est enregistrée automatiquement pour calculer le temps d'attente.",
        "Le client signe directement sur la tablette ou le téléphone du chauffeur. La signature numérique est horodatée et géolocalisée. C'est la preuve de réception.",
        "Enregistrez le mode de paiement : espèces, chèque, virement, ou à crédit. Pour les paiements en espèces, le montant est ajouté au chiffre d'affaires du jour.",
        "Au retour à la centrale, le chauffeur complète le débriefing : kilométrage final, litres de carburant ajoutés, et notes éventuelles. Le système calcule automatiquement la consommation.",
        "Cliquez sur 'Générer Facture' pour créer la facture automatiquement. Elle reprend tous les détails du BL, applique la TVA, et met à jour le solde client."
      ],
      outro: "Parfait ! La livraison est maintenant complète et facturée. Toutes les données sont enregistrées dans le système pour l'audit et le reporting."
    }
  },
  {
    id: 'fleet-predator-avance',
    title: 'Fleet Predator GPS Avancé',
    description: 'Suivi tactique, détection de fraude carburant, alertes géofencing',
    duration: '7:00',
    icon: Radar,
    category: 'advanced',
    steps: [
      'Accéder au menu Logistique',
      'Ouvrir Fleet Predator',
      'Comprendre l\'interface tactique',
      'Activer le Mode Démo',
      'Suivre un camion en mode Follow',
      'Analyser les breadcrumbs de trajet',
      'Configurer les zones de géofencing',
      'Détecter les arrêts suspects',
      'Analyser les alertes carburant',
      'Exporter les données GPS'
    ],
    narration: {
      intro: "Fleet Predator est le centre de commandement tactique de TBOS. Ce tutoriel avancé vous révèle toutes les fonctionnalités de surveillance et de détection de fraude.",
      steps: [
        "Depuis le menu principal, cliquez sur Logistique puis sur Fleet Predator. L'interface s'ouvre en plein écran avec la carte tactique.",
        "Cliquez sur 'Fleet Predator' dans le sous-menu. La carte Mapbox s'affiche avec le style Obsidian, parfait pour les longues sessions de surveillance.",
        "L'interface affiche : la carte centrale, la liste des camions à gauche, et le panneau d'alertes à droite. Chaque camion est représenté par une icône dorée avec son immatriculation.",
        "Pour tester sans hardware GPS, activez le 'Mode Démo' en haut à droite. Quatre camions virtuels apparaissent et simulent des trajets réalistes autour de Casablanca.",
        "Cliquez sur un camion puis sur 'Suivre'. La carte centre automatiquement sur ce véhicule et suit ses mouvements en temps réel. Le zoom s'ajuste pour garder le camion visible.",
        "La queue de trajet montre les deux dernières heures de déplacement en pointillés. Chaque point représente une position GPS. Les couleurs indiquent la vitesse : vert rapide, jaune lent, rouge arrêt.",
        "Dans les paramètres, définissez les zones de géofencing : la centrale, les chantiers clients, et les stations-service autorisées. Tout arrêt hors zone déclenche une alerte.",
        "Les arrêts de plus de 15 minutes hors zone génèrent une alerte 'Arrêt Non Planifié' dans le flux forensique. L'alerte affiche l'adresse exacte et la durée de l'arrêt.",
        "Le système analyse la consommation de carburant en temps réel. Si un camion consomme plus de 35 litres aux 100 kilomètres, ou si le niveau de carburant chute anormalement, une alerte 'Vol de Carburant Potentiel' est déclenchée.",
        "Exportez l'historique GPS pour l'audit. Cliquez sur 'Exporter' pour générer un fichier CSV avec toutes les positions, vitesses, et événements d'un véhicule sur la période sélectionnée."
      ],
      outro: "Vous êtes maintenant un expert Fleet Predator. Utilisez ces outils pour optimiser les trajets, réduire les fraudes, et maintenir une flotte efficace."
    }
  },
  // ========== TUTORIELS EXISTANTS ==========
  {
    id: 'reception-stock',
    title: 'Réception de Stock',
    description: 'Comment enregistrer une nouvelle réception avec photo et validation IA',
    duration: '2:30',
    icon: Package,
    category: 'basics',
    steps: [
      'Photographier le bon de livraison',
      'Sélectionner le matériau et la quantité',
      'Valider les données extraites par IA',
      'Confirmer la réception'
    ],
    narration: {
      intro: "Bienvenue dans ce tutoriel sur la réception de stock. Je vais vous guider étape par étape pour enregistrer une nouvelle livraison de matériaux dans le système TBOS.",
      steps: [
        "Première étape : Photographiez le bon de livraison du fournisseur. Assurez-vous que le montant, la date et le nom du fournisseur sont bien visibles sur la photo.",
        "Deuxième étape : Sélectionnez le type de matériau reçu : ciment, sable, gravette ou adjuvant. Puis entrez la quantité livrée en tonnes.",
        "Troisième étape : L'intelligence artificielle va automatiquement extraire les données de votre photo. Vérifiez que les informations sont correctes.",
        "Dernière étape : Cliquez sur le bouton Confirmer pour finaliser la réception. Le stock sera mis à jour instantanément."
      ],
      outro: "Félicitations ! Vous savez maintenant enregistrer une réception de stock. N'oubliez pas : la photo est obligatoire pour toute réception."
    }
  },
  {
    id: 'nouvelle-depense',
    title: 'Enregistrer une Dépense',
    description: 'Soumettre une dépense avec justificatif photo et niveaux d\'approbation',
    duration: '3:00',
    icon: Receipt,
    category: 'basics',
    steps: [
      'Photographier la facture ou reçu',
      'Sélectionner la catégorie de dépense',
      'Entrer le montant et description',
      'Soumettre pour approbation'
    ],
    narration: {
      intro: "Dans ce tutoriel, vous allez apprendre à soumettre une dépense dans le système TBOS. Le processus inclut une preuve photographique et un système d'approbation multi-niveau.",
      steps: [
        "Commencez par photographier la facture ou le reçu. Le montant et le fournisseur doivent être clairement lisibles.",
        "Sélectionnez ensuite la catégorie de dépense : logistique, maintenance, ou administration. Cela détermine le niveau d'approbation nécessaire.",
        "Entrez le montant en dirhams et ajoutez une description claire de la dépense. Soyez précis pour faciliter l'approbation.",
        "Soumettez la dépense. Les dépenses inférieures à 500 dirhams sont approuvées automatiquement. Les autres nécessitent une validation du CEO."
      ],
      outro: "Vous maîtrisez maintenant le processus de dépense. Rappel : aucune dépense n'est validée sans photo du justificatif."
    }
  },
  {
    id: 'planifier-livraison',
    title: 'Planifier une Livraison',
    description: 'Créer un BC et assigner un camion avec suivi GPS',
    duration: '4:00',
    icon: Truck,
    category: 'operations',
    steps: [
      'Créer le Bon de Commande depuis Ventes',
      'Assigner une toupie et un créneau',
      'Valider le contrôle qualité départ',
      'Activer le tracking client'
    ],
    narration: {
      intro: "Ce tutoriel vous montre comment planifier une livraison de béton, de la commande jusqu'au suivi GPS en temps réel.",
      steps: [
        "Depuis la page Ventes, créez un nouveau Bon de Commande. Sélectionnez le client, la formule de béton souhaitée, et le volume en mètres cubes.",
        "Rendez-vous sur la page Planning. Glissez le bon de commande vers un créneau horaire disponible, puis assignez une toupie de la flotte.",
        "Avant le départ, le responsable technique doit valider le test de slump et prendre les photos de contrôle qualité. C'est une étape obligatoire.",
        "Activez le lien de tracking pour que le client puisse suivre sa livraison en temps réel sur son téléphone. Il recevra le lien par SMS ou WhatsApp."
      ],
      outro: "Parfait ! Vous savez maintenant organiser une livraison complète avec traçabilité GPS. Le client peut suivre son camion en direct."
    }
  },
  {
    id: 'fleet-predator',
    title: 'Fleet Predator GPS',
    description: 'Surveillance tactique des camions et détection d\'anomalies',
    duration: '3:30',
    icon: MapPin,
    category: 'advanced',
    steps: [
      'Accéder à Fleet Predator via Logistique',
      'Activer le Mode Démo pour test',
      'Surveiller les positions en temps réel',
      'Analyser les alertes d\'arrêts suspects'
    ],
    narration: {
      intro: "Fleet Predator est votre centre de commandement GPS. Ce système tactique surveille tous les camions et détecte automatiquement les comportements suspects.",
      steps: [
        "Accédez à Fleet Predator depuis le menu Logistique. L'interface affiche une carte avec tous les véhicules de la flotte.",
        "Pour tester le système, activez le Mode Démo. Des camions virtuels apparaîtront sur la carte avec des mouvements simulés.",
        "Surveillez les positions en temps réel. Chaque camion affiche son statut : en mission, en retour, ou à la centrale. Les couleurs indiquent l'état.",
        "Le système détecte automatiquement les arrêts non planifiés et les anomalies de consommation de carburant. Une alerte rouge signale un problème potentiel."
      ],
      outro: "Fleet Predator vous donne un contrôle total sur votre flotte. Les vols de carburant et les détours non autorisés sont détectés automatiquement."
    }
  },
  {
    id: 'marges-profits',
    title: 'Analyse des Marges',
    description: 'Comprendre le calcul des marges et alertes de rentabilité',
    duration: '2:45',
    icon: Calculator,
    category: 'advanced',
    steps: [
      'Accéder au Dashboard CEO',
      'Consulter les marges par formule',
      'Analyser les écarts de dosage',
      'Configurer les seuils d\'alerte'
    ],
    narration: {
      intro: "Dans ce module avancé, vous apprendrez à analyser les marges de profit en temps réel et à configurer les alertes de rentabilité.",
      steps: [
        "Le Dashboard CEO, appelé Sanctum, affiche le profit net en temps réel. Cliquez dessus pour voir le détail par formule de béton.",
        "Chaque formule a sa marge calculée automatiquement. Comparez les marges entre les clients et identifiez les plus rentables.",
        "Les écarts de dosage impactent directement la marge. Si un batch utilise plus de ciment que prévu, l'alerte se déclenche.",
        "Configurez vos seuils d'alerte. Par défaut, une marge inférieure à 15% génère une notification. Vous pouvez ajuster ce seuil."
      ],
      outro: "Vous avez maintenant une vision claire de la rentabilité. Surveillez les marges quotidiennement pour maximiser les profits."
    }
  },
  {
    id: 'regles-or',
    title: 'Les 3 Règles d\'Or',
    description: 'Comprendre Photo First, Justify Midnight et No Deletions',
    duration: '2:00',
    icon: Shield,
    category: 'basics',
    steps: [
      'Photo First: Toujours photographier',
      'Justify Midnight: Justifier hors-heures',
      'No Deletions: Aucune suppression',
      'Demander un code CEO si nécessaire'
    ],
    narration: {
      intro: "Les trois règles d'or sont le fondement de TBOS. Elles garantissent la traçabilité et la sécurité de toutes les opérations.",
      steps: [
        "Règle numéro un : Photo First. Chaque réception de stock et chaque dépense doit être accompagnée d'une photo. Sans photo, pas de validation.",
        "Règle numéro deux : Justify Midnight. Toute activité entre 18 heures et 6 heures du matin doit être justifiée par écrit. Le CEO reçoit une alerte.",
        "Règle numéro trois : No Deletions. Les données critiques ne peuvent jamais être supprimées. Seules des corrections avec traçabilité sont possibles.",
        "En cas d'urgence, seul le CEO peut générer un code à usage unique pour autoriser une correction exceptionnelle."
      ],
      outro: "Ces trois règles protègent l'entreprise contre la fraude et les erreurs. Respectez-les pour une gestion transparente."
    }
  }
];

const CATEGORY_LABELS = {
  basics: { label: 'Fondamentaux', color: 'bg-primary/20 text-primary border-primary/30' },
  operations: { label: 'Opérations', color: 'bg-warning/20 text-warning border-warning/30' },
  advanced: { label: 'Avancé', color: 'bg-destructive/20 text-destructive border-destructive/30' }
};

interface NarratedTutorialPlayerProps {
  tutorial: VideoTutorial | null;
  open: boolean;
  onClose: () => void;
}

function NarratedTutorialPlayer({ tutorial, open, onClose }: NarratedTutorialPlayerProps) {
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'intro' | 'steps' | 'outro' | 'complete'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const { speak, stop, isLoading, isPlaying, usingFallback, volume, setVolume, cleanup } = useTutorialVoice();
  const abortRef = useRef(false);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
  const estimateNarrationMs = (text: string) => {
    // Defensive: iOS/Safari can block speech/audio mid-flow (NotAllowedError), so we cap wait.
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const estimated = 1200 + words * 320; // ~0.32s/word + base
    return Math.min(12000, Math.max(2500, estimated));
  };

  const safeNarrate = useCallback(
    async (text: string) => {
      if (abortRef.current) return;

      // If muted, just keep the visuals moving.
      if (isMuted) {
        await sleep(1500);
        return;
      }

      // iOS autoplay restrictions can cause narration promises to never resolve.
      // We enforce a timeout so the tutorial never freezes.
      const timeoutMs = estimateNarrationMs(text);
      let timedOut = false;

      try {
        await Promise.race([
          speak(text),
          sleep(timeoutMs).then(() => {
            timedOut = true;
          }),
        ]);
      } catch {
        // Ignore: narration can fail on some browsers/contexts
      } finally {
        if (timedOut) {
          // Stop any stuck audio / TTS so the next step can try cleanly.
          stop();
        }
      }
    },
    [isMuted, speak, stop]
  );

  useEffect(() => {
    if (!open) {
      setCurrentPhase('idle');
      setCurrentStepIndex(0);
      setProgress(0);
      setIsFullscreen(false);
      abortRef.current = true;
      cleanup();
    }
  }, [open, cleanup]);

  const toggleFullscreen = useCallback(async () => {
    const el = fullscreenRef.current;
    if (!el || typeof document === 'undefined') {
      setIsFullscreen(v => !v);
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
        // Ensure element is mounted/rendered before requesting fullscreen
        setTimeout(() => {
          el.requestFullscreen?.().catch(() => {
            // If fullscreen is blocked, still keep the enlarged dialog mode.
          });
        }, 0);
      }
    } catch {
      // Ignore fullscreen errors; dialog enlargement still works.
      setIsFullscreen(v => !v);
    }
  }, []);

  const startTutorial = useCallback(async () => {
    if (!tutorial) return;
    abortRef.current = false;
    
    // Phase 1: Intro
    setCurrentPhase('intro');
    setProgress(5);

    await safeNarrate(tutorial.narration.intro);
    
    if (abortRef.current) return;
    
    // Phase 2: Steps
    setCurrentPhase('steps');
    const totalSteps = tutorial.steps.length;
    
    for (let i = 0; i < totalSteps; i++) {
      if (abortRef.current) return;
      
      setCurrentStepIndex(i);
      setProgress(10 + ((i + 1) / totalSteps) * 70);

      await safeNarrate(tutorial.narration.steps[i]);
    }
    
    if (abortRef.current) return;
    
    // Phase 3: Outro
    setCurrentPhase('outro');
    setProgress(90);

    await safeNarrate(tutorial.narration.outro);
    
    if (abortRef.current) return;
    
    // Complete
    setCurrentPhase('complete');
    setProgress(100);
  }, [tutorial, safeNarrate]);

  const resetTutorial = useCallback(() => {
    abortRef.current = true;
    stop();
    setCurrentPhase('idle');
    setCurrentStepIndex(0);
    setProgress(0);
  }, [stop]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (isPlaying) {
      stop();
    }
  }, [isPlaying, stop]);

  if (!tutorial) return null;

  const Icon = tutorial.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5",
          isFullscreen
            ? "max-w-none w-[calc(100vw-1rem)] h-[calc(100vh-1rem)]"
            : "max-w-3xl"
        )}
      >
        <DialogHeader className="p-4 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <motion.div 
              className="p-3 rounded-xl bg-primary/20 border border-primary/30"
              animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Icon className="h-6 w-6 text-primary" />
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {tutorial.title}
                <Badge className={cn("text-xs", CATEGORY_LABELS[tutorial.category].color)}>
                  {CATEGORY_LABELS[tutorial.category].label}
                </Badge>
                {isPlaying && (
                  <Badge className="bg-success/20 text-success border-success/30 animate-pulse">
                    <Mic className="h-3 w-3 mr-1" />
                    Narration
                  </Badge>
                )}
                {usingFallback && (
                  <Badge className="bg-muted/40 text-muted-foreground border-muted">
                    Navigateur
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{tutorial.description}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8"
                title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className={cn("p-6 space-y-6", isFullscreen && "h-full flex flex-col")}> 
          {/* Player controls */}
          <div className={cn("flex flex-col gap-3", isFullscreen ? "sm:flex-row sm:items-center sm:justify-between" : "sm:flex-row sm:items-center sm:justify-between")}> 
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">Simulateur</Badge>
              {usingFallback && (
                <Badge className="bg-warning/15 text-warning border-warning/30">Voix navigateur (fallback)</Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div className="w-40">
                <Slider
                  value={[Math.round(volume * 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => setVolume((v?.[0] ?? 100) / 100)}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Immersive Video Area - Now with Screen Simulator */}
          <div
            ref={fullscreenRef}
            className={cn(
              "relative w-full bg-gradient-to-br from-background via-muted/30 to-primary/10 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl",
              isFullscreen ? "flex-1 min-h-[320px]" : "aspect-video"
            )}
          >
            
            {/* Content based on phase */}
            <AnimatePresence mode="wait">
              {currentPhase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/10"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl"
                      animate={{
                        x: ['-50%', '50%', '-50%'],
                        y: ['-30%', '30%', '-30%'],
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mb-6 p-6 rounded-full bg-primary/20 border-2 border-primary/40 mx-auto w-fit"
                    >
                      <Video className="h-12 w-12 text-primary" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">Démonstration Interactive</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-6">
                      Regardez une simulation réelle de l'interface avec narration professionnelle
                    </p>
                    <Button
                      onClick={startTutorial}
                      disabled={isLoading}
                      className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-6"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="h-5 w-5" />
                          </motion.div>
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Lancer la Démo
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentPhase === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {/* Show simulator during intro */}
                  <TutorialScreenSimulator 
                    tutorialId={tutorial.id} 
                    currentStep={-1} 
                    isPlaying={false} 
                  />
                  {/* Intro overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-8"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="mb-4 p-4 rounded-full bg-primary/30"
                    >
                      <Volume2 className="h-10 w-10 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-4 text-center">Introduction</h3>
                    <p className="text-center text-muted-foreground max-w-md leading-relaxed text-sm">
                      {tutorial.narration.intro}
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {currentPhase === 'steps' && (
                <motion.div
                  key={`step-${currentStepIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {/* Real screen simulator */}
                  <TutorialScreenSimulator 
                    tutorialId={tutorial.id} 
                    currentStep={currentStepIndex} 
                    // Visuals must keep running even if narration fails or is muted.
                    isPlaying={true} 
                  />
                  
                  {/* Step info overlay at bottom */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-4"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5 }}
                        className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0"
                      >
                        {currentStepIndex + 1}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Étape {currentStepIndex + 1} sur {tutorial.steps.length}</p>
                        <h3 className="text-sm font-bold truncate">{tutorial.steps[currentStepIndex]}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {tutorial.narration.steps[currentStepIndex]}
                        </p>
                      </div>
                      {isPlaying && (
                        <div className="flex items-center gap-1 text-success shrink-0">
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-2 h-2 rounded-full bg-success"
                          />
                          <span className="text-xs">Narration</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {currentPhase === 'outro' && (
                <motion.div
                  key="outro"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="mb-4 p-4 rounded-full bg-success/30"
                  >
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-4 text-center">Conclusion</h3>
                  <p className="text-center text-muted-foreground max-w-md leading-relaxed">
                    {tutorial.narration.outro}
                  </p>
                </motion.div>
              )}

              {currentPhase === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="mb-6"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 w-24 h-24 rounded-full border-4 border-dashed border-success/30"
                      />
                      <div className="p-6 rounded-full bg-success/20 border-2 border-success">
                        <CheckCircle2 className="h-12 w-12 text-success" />
                      </div>
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2 text-success">Tutoriel Terminé !</h3>
                  <p className="text-muted-foreground mb-6">
                    Vous maîtrisez maintenant cette fonctionnalité
                  </p>
                  <Button onClick={resetTutorial} variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Revoir le Tutoriel
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar overlay */}
            {currentPhase !== 'idle' && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Steps Tracker */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Progression du tutoriel
            </h4>
            <div className="grid gap-2">
              {tutorial.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={{
                    scale: currentPhase === 'steps' && idx === currentStepIndex ? 1.02 : 1,
                    opacity: currentPhase === 'steps' && idx <= currentStepIndex ? 1 : 0.5,
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    currentPhase === 'steps' && idx < currentStepIndex 
                      ? "bg-success/10 border-success/30" 
                      : currentPhase === 'steps' && idx === currentStepIndex 
                        ? "bg-primary/10 border-primary/30" 
                        : currentPhase === 'complete'
                          ? "bg-success/10 border-success/30"
                          : "bg-muted/30 border-transparent"
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    (currentPhase === 'steps' && idx < currentStepIndex) || currentPhase === 'complete'
                      ? "bg-success text-success-foreground" 
                      : currentPhase === 'steps' && idx === currentStepIndex 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                  )}>
                    {(currentPhase === 'steps' && idx < currentStepIndex) || currentPhase === 'complete' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    (currentPhase === 'steps' && idx <= currentStepIndex) || currentPhase === 'complete'
                      ? "text-foreground" 
                      : "text-muted-foreground"
                  )}>
                    {step}
                  </span>
                  {currentPhase === 'steps' && idx === currentStepIndex && isPlaying && (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="ml-auto"
                    >
                      <Volume2 className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Durée: {tutorial.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="h-4 w-4" />
              <span>{tutorial.steps.length} étapes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mic className="h-4 w-4 text-primary" />
              <span>Narration IA</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VideoTutorialSection() {
  const [selectedTutorial, setSelectedTutorial] = useState<VideoTutorial | null>(null);
  const [filter, setFilter] = useState<'all' | 'basics' | 'operations' | 'advanced'>('all');
  const [showRecorder, setShowRecorder] = useState(false);

  const filteredTutorials = filter === 'all' 
    ? VIDEO_TUTORIALS 
    : VIDEO_TUTORIALS.filter(t => t.category === filter);

  const handleRecordingSaved = (videoUrl: string, metadata: { title: string; description: string; category: string; duration: number }) => {
    console.log('Recording saved:', videoUrl, metadata);
    // TODO: Save to database and refresh tutorial list
  };

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 relative">
              <Video className="h-6 w-6 text-primary" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success flex items-center justify-center"
              >
                <Mic className="h-2.5 w-2.5 text-success-foreground" />
              </motion.div>
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Tutoriels Vidéo
                <Badge className="bg-gradient-to-r from-primary/20 to-success/20 text-primary border-primary/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Narration IA
                </Badge>
              </CardTitle>
              <CardDescription>
                Apprenez avec des tutoriels narrés par intelligence artificielle
              </CardDescription>
            </div>
          </div>

          {/* Filter buttons + Record button */}
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'basics', 'operations', 'advanced'] as const).map((cat) => (
              <Button
                key={cat}
                variant={filter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(cat)}
                className="text-xs"
              >
                {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat].label}
              </Button>
            ))}
            
            {/* Screen Record Button */}
            <Button
              onClick={() => setShowRecorder(true)}
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-destructive to-primary hover:from-destructive/90 hover:to-primary/90 ml-2"
            >
              <Camera className="h-3.5 w-3.5" />
              <Plus className="h-3 w-3" />
              Enregistrer
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTutorials.map((tutorial) => {
            const Icon = tutorial.icon;
            return (
              <motion.div
                key={tutorial.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all h-full group overflow-hidden"
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-muted via-muted/50 to-primary/10 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        className="p-4 rounded-full bg-background/80 backdrop-blur border border-primary/20"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Icon className="h-8 w-8 text-primary" />
                      </motion.div>
                    </div>
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.div 
                        className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Play className="h-6 w-6" />
                      </motion.div>
                    </div>
                    
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tutorial.duration}
                    </div>
                    
                    {/* Category badge */}
                    <Badge 
                      className={cn(
                        "absolute top-2 left-2 text-[10px]",
                        CATEGORY_LABELS[tutorial.category].color
                      )}
                    >
                      {CATEGORY_LABELS[tutorial.category].label}
                    </Badge>

                    {/* AI Narration indicator */}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      IA
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {tutorial.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tutorial.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </CardContent>

      {/* Narrated Tutorial Player */}
      <NarratedTutorialPlayer
        tutorial={selectedTutorial}
        open={!!selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
      />

      {/* Screen Recorder Studio */}
      <ScreenRecorderStudio
        open={showRecorder}
        onClose={() => setShowRecorder(false)}
        onSave={handleRecordingSaved}
      />
    </Card>
  );
}
