import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Maximize, 
  Minimize,
  Volume2,
  VolumeX,
  CheckCircle2,
  Lock,
  HardHat,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AcademyVideoPlayerProps {
  videoUrl: string;
  videoTitle: string;
  videoId: string;
  onComplete?: () => void;
  onProgressChange?: (progress: number) => void;
  className?: string;
}

const COMPLETION_THRESHOLD = 95;
const PLACEHOLDER_MODE = false;

export function AcademyVideoPlayer({ 
  videoUrl, 
  videoTitle, 
  videoId,
  onComplete,
  onProgressChange,
  className 
}: AcademyVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(PLACEHOLDER_MODE ? 300 : 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasWatchedOnce, setHasWatchedOnce] = useState(false);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(!PLACEHOLDER_MODE);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const playbackIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    onProgressChange?.(progress);
  }, [currentTime, duration, onProgressChange]);

  useEffect(() => {
    const checkCompletion = async () => {
      if (!user?.id || !videoId) return;
      
      try {
        const watchedKey = `tbos-video-watched-${videoId}`;
        const wasWatched = localStorage.getItem(watchedKey);
        if (wasWatched === 'true') {
          setHasWatchedOnce(true);
        }
        
        const { data } = await supabase
          .from('audit_logs')
          .select('id')
          .eq('action_type', 'VIDEO_COMPLETED')
          .eq('record_id', videoId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setIsCompleted(true);
          setHasWatchedOnce(true);
        }
      } catch (error) {
        console.error('Error checking video completion:', error);
      }
    };
    
    checkCompletion();
  }, [user?.id, videoId]);

  useEffect(() => {
    if (PLACEHOLDER_MODE && isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime > maxWatchedTime) {
            setMaxWatchedTime(newTime);
          }
          
          const percentWatched = (newTime / duration) * 100;
          if (percentWatched >= COMPLETION_THRESHOLD && !isCompleted) {
            handleVideoCompletion();
          }
          
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 1000);
      
      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
        }
      };
    }
  }, [isPlaying, duration, isCompleted, maxWatchedTime]);

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      if (current > maxWatchedTime) {
        setMaxWatchedTime(current);
      }
      
      const percentWatched = (current / duration) * 100;
      if (percentWatched >= COMPLETION_THRESHOLD && !isCompleted) {
        handleVideoCompletion();
      }
    }
  };

  const handleVideoCompletion = async () => {
    if (isCompleted || !user?.id) return;
    
    setIsCompleted(true);
    
    const watchedKey = `tbos-video-watched-${videoId}`;
    localStorage.setItem(watchedKey, 'true');
    setHasWatchedOnce(true);
    
    try {
      await supabase.from('audit_logs').insert({
        action_type: 'VIDEO_COMPLETED',
        table_name: 'training_videos',
        record_id: videoId,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Unknown',
        description: `Formation vidéo "${videoTitle}" visionnée à 95%`,
        new_data: {
          video_title: videoTitle,
          video_id: videoId,
          completion_percentage: 95,
          watched_at: new Date().toISOString()
        }
      });
      
      toast.success('🎓 Formation complétée!', {
        description: `"${videoTitle}" a été ajouté à votre parcours.`
      });
      
      onComplete?.();
    } catch (error) {
      console.error('Error logging video completion:', error);
    }
  };

  const togglePlay = useCallback(() => {
    if (PLACEHOLDER_MODE) {
      setIsPlaying(!isPlaying);
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const skip = useCallback((seconds: number) => {
    const currentPos = PLACEHOLDER_MODE ? currentTime : (videoRef.current?.currentTime || 0);
    const newTime = currentPos + seconds;
    
    if (!hasWatchedOnce && seconds > 0 && newTime > maxWatchedTime + 1) {
      toast.warning('⏸️ Veuillez regarder la vidéo en entier', {
        description: 'Avance rapide désactivée pour la première visualisation.'
      });
      return;
    }
    
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    
    if (PLACEHOLDER_MODE) {
      setCurrentTime(clampedTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = clampedTime;
    }
  }, [hasWatchedOnce, maxWatchedTime, duration, currentTime]);

  const handleSeek = useCallback((value: number[]) => {
    const seekTime = value[0];
    
    if (!hasWatchedOnce && seekTime > maxWatchedTime + 1) {
      toast.warning('⏸️ Veuillez regarder la vidéo en entier', {
        description: 'La navigation est limitée à la partie visionnée.'
      });
      if (PLACEHOLDER_MODE) {
        setCurrentTime(maxWatchedTime);
      } else if (videoRef.current) {
        videoRef.current.currentTime = maxWatchedTime;
      }
      return;
    }
    
    if (PLACEHOLDER_MODE) {
      setCurrentTime(seekTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [hasWatchedOnce, maxWatchedTime]);

  const toggleMute = useCallback(() => {
    if (!PLACEHOLDER_MODE && videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    if (!PLACEHOLDER_MODE && videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-950 border-2 border-amber-500/30",
        "shadow-[0_0_40px_-10px_rgba(255,215,0,0.3)]",
        className
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {PLACEHOLDER_MODE ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-[300px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                animation: 'pulse 4s ease-in-out infinite'
              }}
            />
          </div>
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.15),transparent_70%)]" />
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-10 left-10"
            >
              <HardHat className="h-12 w-12 text-amber-500/30" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute top-20 right-16"
            >
              <Building2 className="h-16 w-16 text-amber-500/20" />
            </motion.div>
          </div>
          
          <div className="relative z-10 text-center px-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6 p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30"
            >
              <HardHat className="h-12 w-12 text-amber-400" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl md:text-2xl font-bold text-amber-400 tracking-wide">
                EN ATTENTE DU CONTENU MASTER
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
                <span className="text-amber-500/80 text-sm font-medium tracking-widest">
                  PROTOCOLE TALMI BETON
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-amber-300/60 text-sm">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-amber-500"
                />
                <span>Simulation de formation en cours</span>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain bg-black"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          playsInline
        />
      )}

      {!PLACEHOLDER_MODE && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
          <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!hasWatchedOnce && !isCompleted && (
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 gap-1">
            <Lock className="h-3 w-3" />
            Première visualisation
          </Badge>
        </div>
      )}

      {isCompleted && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Complété
          </Badge>
        </div>
      )}

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50"
          >
            <div className="absolute top-0 left-0 right-0 p-4">
              <h3 className="text-lg font-bold text-amber-100 truncate">
                {videoTitle}
              </h3>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                variant="ghost"
                onClick={togglePlay}
                className="h-20 w-20 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/50 backdrop-blur-sm"
              >
                {isPlaying ? (
                  <Pause className="h-10 w-10 text-amber-400" />
                ) : (
                  <Play className="h-10 w-10 text-amber-400 ml-1" />
                )}
              </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              <div className="relative">
                {!hasWatchedOnce && (
                  <div 
                    className="absolute h-1 bg-amber-500/30 rounded-full top-1/2 -translate-y-1/2 left-0 z-0"
                    style={{ width: `${(maxWatchedTime / duration) * 100}%` }}
                  />
                )}
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-400 [&_.relative]:bg-slate-700 [&_[data-orientation=horizontal]>:first-child]:bg-amber-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
                    className="h-9 w-9 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Play className="h-4 w-4 text-amber-400" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => skip(-10)}
                    className="h-9 w-9 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
                  >
                    <RotateCcw className="h-4 w-4 text-amber-300" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => skip(10)}
                    className={cn(
                      "h-9 w-9 rounded-lg border border-amber-500/20",
                      !hasWatchedOnce && currentTime >= maxWatchedTime - 1
                        ? "bg-slate-500/10 cursor-not-allowed opacity-50"
                        : "bg-amber-500/10 hover:bg-amber-500/20"
                    )}
                    disabled={!hasWatchedOnce && currentTime >= maxWatchedTime - 1}
                  >
                    <RotateCw className="h-4 w-4 text-amber-300" />
                  </Button>

                  <span className="text-sm font-mono text-amber-200 ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="h-9 w-9 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-amber-300" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-amber-300" />
                      )}
                    </Button>
                    <div className="w-20 hidden sm:block">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="[&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-400 [&_.relative]:bg-slate-700 [&_[data-orientation=horizontal]>:first-child]:bg-amber-500"
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleFullscreen}
                    className="h-9 w-9 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4 text-amber-300" />
                    ) : (
                      <Maximize className="h-4 w-4 text-amber-300" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300/70">
                  Progression: {progressPercentage.toFixed(0)}%
                </span>
                {progressPercentage >= COMPLETION_THRESHOLD && (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Audit enregistré
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
