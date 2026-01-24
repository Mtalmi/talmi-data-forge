import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Play, X, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  id: string;
  title: string;
  content: string;
  steps?: string[];
  duration?: number; // in seconds
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function InfoTooltip({ 
  id, 
  title, 
  content, 
  steps,
  duration = 15,
  position = 'top',
  className 
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimStep, setCurrentAnimStep] = useState(0);

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

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className={cn("relative inline-flex", className)}>
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
              "absolute z-50 w-72",
              "bg-popover/95 backdrop-blur-xl border border-border/50",
              "rounded-xl shadow-2xl overflow-hidden",
              positionClasses[position]
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/20">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" />
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

              {/* Steps Animation */}
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
                      Voir la démo ({duration}s)
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
}
