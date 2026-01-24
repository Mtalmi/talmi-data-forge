import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Video, 
  Clock, 
  CheckCircle2, 
  X,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Package,
  Receipt,
  Truck,
  Calculator,
  MapPin,
  Shield,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'basics' | 'operations' | 'advanced';
  videoUrl?: string;
  steps: string[];
}

const VIDEO_TUTORIALS: VideoTutorial[] = [
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  }
];

const CATEGORY_LABELS = {
  basics: { label: 'Fondamentaux', color: 'bg-primary/20 text-primary border-primary/30' },
  operations: { label: 'Opérations', color: 'bg-warning/20 text-warning border-warning/30' },
  advanced: { label: 'Avancé', color: 'bg-destructive/20 text-destructive border-destructive/30' }
};

interface VideoPlayerModalProps {
  tutorial: VideoTutorial | null;
  open: boolean;
  onClose: () => void;
}

function VideoPlayerModal({ tutorial, open, onClose }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Simulate step progression for demo
  const startDemo = () => {
    if (!tutorial) return;
    setIsPlaying(true);
    setCurrentStep(0);
    setProgress(0);
    
    const stepDuration = 3000; // 3 seconds per step
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      if (step >= tutorial.steps.length) {
        clearInterval(interval);
        setIsPlaying(false);
        setProgress(100);
      } else {
        setCurrentStep(step);
        setProgress((step / tutorial.steps.length) * 100);
      }
    }, stepDuration);
  };

  if (!tutorial) return null;

  const Icon = tutorial.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {tutorial.title}
                <Badge className={cn("text-xs", CATEGORY_LABELS[tutorial.category].color)}>
                  {CATEGORY_LABELS[tutorial.category].label}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{tutorial.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Video/Demo Area */}
          <div className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl overflow-hidden border">
            {tutorial.videoUrl ? (
              <video
                ref={videoRef}
                src={tutorial.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                muted={isMuted}
                playsInline
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="mb-4 p-4 rounded-full bg-primary/10">
                  <GraduationCap className="h-12 w-12 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-center mb-2">
                  Tutoriel Interactif
                </h4>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Cliquez sur "Lancer la Démo" pour voir les étapes animées
                </p>
              </div>
            )}

            {/* Play overlay if not playing */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Button
                  onClick={tutorial.videoUrl ? handlePlayPause : startDemo}
                  className="gap-2 bg-primary/90 hover:bg-primary"
                  size="lg"
                >
                  <Play className="h-5 w-5" />
                  Lancer la Démo
                </Button>
              </div>
            )}

            {/* Progress bar */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <Progress value={progress} className="h-1 mb-2" />
                <div className="flex items-center justify-between text-white text-xs">
                  <span>{tutorial.steps[currentStep]}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Étapes du tutoriel
            </h4>
            <div className="grid gap-2">
              {tutorial.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.5 }}
                  animate={{ 
                    opacity: idx <= currentStep && isPlaying ? 1 : 0.7,
                    scale: idx === currentStep && isPlaying ? 1.02 : 1
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    idx < currentStep && isPlaying ? "bg-success/10 border-success/30" :
                    idx === currentStep && isPlaying ? "bg-primary/10 border-primary/30" :
                    "bg-muted/30 border-transparent"
                  )}
                >
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                    idx < currentStep && isPlaying ? "bg-success text-success-foreground" :
                    idx === currentStep && isPlaying ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {idx < currentStep && isPlaying ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    idx <= currentStep && isPlaying ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Duration badge */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Durée: {tutorial.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span>{tutorial.steps.length} étapes</span>
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

  const filteredTutorials = filter === 'all' 
    ? VIDEO_TUTORIALS 
    : VIDEO_TUTORIALS.filter(t => t.category === filter);

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Tutoriels Vidéo
                <Badge className="bg-success/20 text-success border-success/30">
                  {VIDEO_TUTORIALS.length} vidéos
                </Badge>
              </CardTitle>
              <CardDescription>
                Apprenez chaque fonctionnalité avec des démonstrations interactives
              </CardDescription>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all h-full"
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-t-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 rounded-full bg-background/80 backdrop-blur">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="p-3 rounded-full bg-primary text-primary-foreground">
                        <Play className="h-6 w-6" />
                      </div>
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
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{tutorial.title}</h3>
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

      {/* Video Player Modal */}
      <VideoPlayerModal
        tutorial={selectedTutorial}
        open={!!selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
      />
    </Card>
  );
}
