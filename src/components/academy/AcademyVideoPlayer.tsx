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
  Lock
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
  className?: string;
}

const COMPLETION_THRESHOLD = 95; // 95% watched = complete

export function AcademyVideoPlayer({ 
  videoUrl, 
  videoTitle, 
  videoId,
  onComplete,
  className 
}: AcademyVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasWatchedOnce, setHasWatchedOnce] = useState(false);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if video was previously completed
  useEffect(() => {
    const checkCompletion = async () => {
      if (!user?.id || !videoId) return;
      
      try {
        // Check localStorage for first watch status
        const watchedKey = `tbos-video-watched-${videoId}`;
        const wasWatched = localStorage.getItem(watchedKey);
        if (wasWatched === 'true') {
          setHasWatchedOnce(true);
        }
        
        // Check if already logged as complete
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

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      // Track max watched time for first-watch enforcement
      if (current > maxWatchedTime) {
        setMaxWatchedTime(current);
      }
      
      // Check for completion at 95%
      const percentWatched = (current / duration) * 100;
      if (percentWatched >= COMPLETION_THRESHOLD && !isCompleted) {
        handleVideoCompletion();
      }
    }
  };

  // Log video completion to audit_logs
  const handleVideoCompletion = async () => {
    if (isCompleted || !user?.id) return;
    
    setIsCompleted(true);
    
    // Mark as watched in localStorage
    const watchedKey = `tbos-video-watched-${videoId}`;
    localStorage.setItem(watchedKey, 'true');
    setHasWatchedOnce(true);
    
    try {
      // Log to audit_logs
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

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime + seconds;
      
      // First watch enforcement: prevent forward seeking beyond watched content
      if (!hasWatchedOnce && seconds > 0 && newTime > maxWatchedTime + 1) {
        toast.warning('⏸️ Veuillez regarder la vidéo en entier', {
          description: 'Avance rapide désactivée pour la première visualisation.'
        });
        return;
      }
      
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
    }
  }, [hasWatchedOnce, maxWatchedTime, duration]);

  // Handle seek bar change
  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current) {
      const seekTime = value[0];
      
      // First watch enforcement
      if (!hasWatchedOnce && seekTime > maxWatchedTime + 1) {
        toast.warning('⏸️ Veuillez regarder la vidéo en entier', {
          description: 'La navigation est limitée à la partie visionnée.'
        });
        videoRef.current.currentTime = maxWatchedTime;
        return;
      }
      
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [hasWatchedOnce, maxWatchedTime]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  // Toggle fullscreen
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

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
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

  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
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
      {/* Video Element */}
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
          <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* First Watch Lock Indicator */}
      {!hasWatchedOnce && !isCompleted && (
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 gap-1">
            <Lock className="h-3 w-3" />
            Première visualisation
          </Badge>
        </div>
      )}

      {/* Completion Badge */}
      {isCompleted && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Complété
          </Badge>
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50"
          >
            {/* Title Bar */}
            <div className="absolute top-0 left-0 right-0 p-4">
              <h3 className="text-lg font-bold text-amber-100 truncate">
                {videoTitle}
              </h3>
            </div>

            {/* Center Play Button */}
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

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              {/* Progress Bar */}
              <div className="relative">
                {/* First-watch progress indicator */}
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

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
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

                  {/* Rewind 10s */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => skip(-10)}
                    className="h-9 w-9 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
                  >
                    <RotateCcw className="h-4 w-4 text-amber-300" />
                  </Button>

                  {/* Forward 10s */}
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

                  {/* Time Display */}
                  <span className="text-sm font-mono text-amber-200 ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Volume */}
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

                  {/* Fullscreen */}
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

              {/* Progress Percentage */}
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
