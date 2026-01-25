import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  GraduationCap, 
  Play, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  BookOpen,
  Target,
  Video,
  X
} from 'lucide-react';
import { useTrainingProgress, TRAINING_STEPS } from '@/hooks/useTrainingProgress';
import { CertifiedBadge } from './CertifiedBadge';
import { AcademyVideoPlayer } from './AcademyVideoPlayer';
import { cn } from '@/lib/utils';

interface AcademyLauncherProps {
  showOnFirstVisit?: boolean;
}

// Session storage key for showing instruction card
export const INSTRUCTION_CARD_KEY = 'tbos-show-instruction-card';

// Training video modules
const TRAINING_VIDEOS = [
  {
    id: 'reception_stock',
    title: 'Réception Stock - Le Handshake Photo-First',
    description: 'Règle d\'Or #1: Toujours prendre la photo AVANT de saisir les données.',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663300837112/qdTkNXgYXfrcjBbX.mp4',
    duration: '~5 min'
  },
  {
    id: 'expense_entry',
    title: 'Saisie Dépense - La Limite 15k DH',
    description: 'Comprendre le plafond mensuel et le système d\'approbation CEO.',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663300837112/YazaoTKffXYYIlfN.mp4',
    duration: '~4 min'
  },
  {
    id: 'midnight_protocol',
    title: 'Le Protocole Minuit (18h-00h)',
    description: 'Toute transaction requiert une justification d\'urgence.',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663300837112/TiBXaDZbpFGjFHyp.mp4',
    duration: '~3 min'
  }
];

export function AcademyLauncher({ showOnFirstVisit = true }: AcademyLauncherProps) {
  const navigate = useNavigate();
  const { 
    completedSteps, 
    isCertified, 
    progress, 
    loading,
    totalSteps,
    completeStep
  } = useTrainingProgress();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentVideoProgress, setCurrentVideoProgress] = useState(0);
  const [completedVideos, setCompletedVideos] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tbos-completed-videos');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const seen = localStorage.getItem('tbos-academy-seen');
    if (!seen && showOnFirstVisit && !loading && !isCertified) {
      setIsExpanded(true);
      localStorage.setItem('tbos-academy-seen', 'true');
    }
  }, [loading, isCertified, showOnFirstVisit]);

  // Reset progress when changing videos
  useEffect(() => {
    setCurrentVideoProgress(0);
  }, [currentVideoIndex]);

  const handleStart = () => {
    console.log('[Academy] Commencer clicked - opening video player');
    
    // Close the overlay
    setIsExpanded(false);
    
    // Find first incomplete video
    const firstIncompleteIndex = TRAINING_VIDEOS.findIndex(
      v => !completedVideos.includes(v.id)
    );
    
    setCurrentVideoIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
    setCurrentVideoProgress(0);
    setShowVideoPlayer(true);
    
    console.log('[Academy] ✅ Video player opened');
  };

  const handleVideoComplete = () => {
    const currentVideo = TRAINING_VIDEOS[currentVideoIndex];
    
    if (!completedVideos.includes(currentVideo.id)) {
      const newCompleted = [...completedVideos, currentVideo.id];
      setCompletedVideos(newCompleted);
      localStorage.setItem('tbos-completed-videos', JSON.stringify(newCompleted));
      
      // Also mark the training step as complete
      const stepId = currentVideo.id === 'reception_stock' ? 'stock_reception' :
                     currentVideo.id === 'expense_entry' ? 'expense_entry' :
                     'midnight_alert';
      completeStep(stepId);
    }
  };

  const handleProgressChange = (progress: number) => {
    setCurrentVideoProgress(progress);
  };

  const canAdvance = currentVideoProgress >= 95 || completedVideos.includes(TRAINING_VIDEOS[currentVideoIndex]?.id);

  const currentVideo = TRAINING_VIDEOS[currentVideoIndex];
  const videoProgress = (completedVideos.length / TRAINING_VIDEOS.length) * 100;

  // If certified, show minimal badge
  if (isCertified) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 right-4 z-50 md:bottom-6"
      >
        <CertifiedBadge level="gold" size="lg" showLabel />
      </motion.div>
    );
  }

  return (
    <>
      {/* Video Player Dialog */}
      <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-slate-950 border-amber-500/30">
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-amber-100">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                  <Video className="h-4 w-4 text-white" />
                </div>
                TBOS Academy - Formation {currentVideoIndex + 1}/{TRAINING_VIDEOS.length}
              </DialogTitle>
            </div>
            {/* Video Progress */}
            <div className="flex gap-1 mt-2">
              {TRAINING_VIDEOS.map((video, idx) => (
                <button
                  key={video.id}
                  onClick={() => setCurrentVideoIndex(idx)}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-all",
                    idx === currentVideoIndex
                      ? "bg-amber-500"
                      : completedVideos.includes(video.id)
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                  )}
                />
              ))}
            </div>
          </DialogHeader>
          
          <div className="p-4 pt-0">
            <AcademyVideoPlayer
              videoUrl={currentVideo.videoUrl}
              videoTitle={currentVideo.title}
              videoId={currentVideo.id}
              onComplete={handleVideoComplete}
              onProgressChange={handleProgressChange}
              className="aspect-video"
            />
            
            {/* Video Description */}
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-semibold text-amber-200 mb-1">{currentVideo.title}</h4>
              <p className="text-sm text-amber-300/80">{currentVideo.description}</p>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentVideoIndex(prev => Math.max(0, prev - 1))}
                disabled={currentVideoIndex === 0}
                className="border-amber-500/30 text-amber-300"
              >
                Précédent
              </Button>
              
              <span className="text-sm text-amber-400">
                {completedVideos.length}/{TRAINING_VIDEOS.length} complétés
              </span>
              
              <Button
                onClick={() => {
                  if (currentVideoIndex < TRAINING_VIDEOS.length - 1) {
                    setCurrentVideoIndex(prev => prev + 1);
                  } else {
                    setShowVideoPlayer(false);
                  }
                }}
                disabled={!canAdvance}
                className={cn(
                  "transition-all",
                  canAdvance 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    : "bg-slate-600 cursor-not-allowed opacity-60"
                )}
                title={!canAdvance ? "Regardez 95% de la vidéo pour continuer" : undefined}
              >
                {currentVideoIndex < TRAINING_VIDEOS.length - 1 ? 'Suivant' : 'Terminer'}
                {!canAdvance && (
                  <span className="ml-2 text-xs">({Math.round(currentVideoProgress)}%)</span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Badge/Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "fixed bottom-20 right-4 z-50 md:bottom-6",
          "flex items-center gap-2 px-4 py-2",
          "bg-gradient-to-r from-primary to-primary/80",
          "text-primary-foreground rounded-full shadow-lg",
          "hover:shadow-primary/30 transition-all",
          isExpanded && "ring-2 ring-primary/50"
        )}
      >
        <GraduationCap className="h-5 w-5" />
        <span className="font-medium text-sm">Academy</span>
        {completedVideos.length > 0 && (
          <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px]">
            {completedVideos.length}/{TRAINING_VIDEOS.length}
          </Badge>
        )}
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-32 right-4 z-50 md:bottom-20 w-80"
          >
            <Card className="bg-card/95 backdrop-blur-xl border-primary/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-4 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.2),transparent_60%)]" />
                <div className="relative flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">TBOS Academy</h3>
                    <p className="text-xs text-muted-foreground">Formation Vidéo Interactive</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Progression Vidéos</span>
                    <span className="font-medium text-foreground">
                      {completedVideos.length}/{TRAINING_VIDEOS.length} vidéos
                    </span>
                  </div>
                  <Progress value={videoProgress} className="h-2" />
                </div>
              </div>

              {/* Video Modules Preview */}
              <div className="p-4 space-y-2">
                {TRAINING_VIDEOS.map((video, idx) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setCurrentVideoIndex(idx);
                      setShowVideoPlayer(true);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                      completedVideos.includes(video.id) 
                        ? "bg-success/10 hover:bg-success/20" 
                        : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      completedVideos.includes(video.id)
                        ? "bg-success text-success-foreground"
                        : "bg-amber-500/20 text-amber-500"
                    )}>
                      {completedVideos.includes(video.id) ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        completedVideos.includes(video.id) ? "text-success" : "text-foreground"
                      )}>
                        {video.title.split(' - ')[0]}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {video.duration}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 space-y-2">
                <Button
                  onClick={handleStart}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Play className="h-4 w-4" />
                  {completedVideos.length > 0 ? 'Continuer la Formation' : 'Commencer'}
                </Button>
                
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    <span>3 vidéos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>~12 min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Badge</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
