import { useState, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Play, X, Clock, CheckCircle2, Video, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface InfoTooltipProps {
  id: string;
  title: string;
  content: string;
  steps?: string[];
  duration?: number; // in seconds
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  videoUrl?: string; // URL to video tutorial (MP4, WebM, or YouTube embed)
  videoThumbnail?: string; // Optional thumbnail for video
}

export const InfoTooltip = forwardRef<HTMLDivElement, InfoTooltipProps>(function InfoTooltip({ 
  id, 
  title, 
  content, 
  steps,
  duration = 15,
  position = 'top',
  className,
  videoUrl,
  videoThumbnail
}, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimStep, setCurrentAnimStep] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isYouTubeUrl = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
  const isVimeoUrl = videoUrl?.includes('vimeo.com');

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.includes('youtu.be') 
      ? url.split('/').pop()?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.split('/').pop();
    return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
  };

  const startAnimation = () => {
    if (!steps?.length) return;
    setIsAnimating(true);
    setCurrentAnimStep(0);

    const stepDuration = (duration * 1000) / steps.length;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps.length) {
        clearInterval(interval);
        setIsAnimating(false);
      } else {
        setCurrentAnimStep(step);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    setVideoProgress(0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1 rounded-full transition-all duration-200",
          "text-muted-foreground hover:text-primary hover:bg-primary/10",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          isOpen && "text-primary bg-primary/10"
        )}
        aria-label={`Information: ${title}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "absolute z-50",
              videoUrl ? "w-80" : "w-72",
              "bg-popover/95 backdrop-blur-xl border border-border/50",
              "rounded-xl shadow-2xl overflow-hidden",
              positionClasses[position]
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/20">
                  {videoUrl ? (
                    <Video className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <span className="font-medium text-sm text-foreground">{title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setIsOpen(false);
                  setIsAnimating(false);
                  setShowVideo(false);
                  setIsVideoPlaying(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {content}
              </p>

              {/* Video Tutorial Section */}
              {videoUrl && (
                <div className="mb-3">
                  {!showVideo ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowVideo(true)}
                      className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group cursor-pointer"
                    >
                      {videoThumbnail ? (
                        <img 
                          src={videoThumbnail} 
                          alt="Video thumbnail"
                          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Video className="h-8 w-8 text-primary/60 mx-auto mb-1" />
                            <span className="text-xs text-muted-foreground">Tutoriel Vidéo</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="p-3 rounded-full bg-primary/90 text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Voir le tutoriel
                      </div>
                    </motion.button>
                  ) : (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                      {isYouTubeUrl || isVimeoUrl ? (
                        <iframe
                          src={isYouTubeUrl ? getYouTubeEmbedUrl(videoUrl) : getVimeoEmbedUrl(videoUrl)}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            src={videoUrl}
                            className="absolute inset-0 w-full h-full object-cover"
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleVideoEnded}
                            muted={isMuted}
                            playsInline
                            onClick={handleVideoPlay}
                          />
                          {/* Video Controls */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <Progress value={videoProgress} className="h-1 mb-2" />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-white hover:bg-white/20"
                                  onClick={handleVideoPlay}
                                >
                                  {isVideoPlaying ? (
                                    <Pause className="h-3.5 w-3.5" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-white hover:bg-white/20"
                                  onClick={toggleMute}
                                >
                                  {isMuted ? (
                                    <VolumeX className="h-3.5 w-3.5" />
                                  ) : (
                                    <Volume2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white hover:bg-white/20"
                                onClick={handleFullscreen}
                              >
                                <Maximize2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Steps Animation (fallback or additional) */}
              {steps && steps.length > 0 && (
                <div className="space-y-2">
                  {!isAnimating ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={startAnimation}
                    >
                      <Play className="h-3 w-3" />
                      {videoUrl ? 'Voir les étapes' : 'Voir la démo'} ({duration}s)
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 animate-spin" />
                        <span>Animation en cours...</span>
                      </div>
                      {steps.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0.5, x: -10 }}
                          animate={{
                            opacity: idx <= currentAnimStep ? 1 : 0.5,
                            x: 0,
                          }}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-lg text-xs",
                            "transition-all duration-300",
                            idx <= currentAnimStep ? "bg-primary/10" : "bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "mt-0.5 p-0.5 rounded-full",
                            idx < currentAnimStep ? "bg-success text-success-foreground" :
                            idx === currentAnimStep ? "bg-primary text-primary-foreground" :
                            "bg-muted"
                          )}>
                            {idx < currentAnimStep ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <span className="block w-3 h-3 text-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                          <span className={cn(
                            idx <= currentAnimStep ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
