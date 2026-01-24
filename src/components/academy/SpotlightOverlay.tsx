import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react';
import { TRAINING_STEPS, useTrainingProgress } from '@/hooks/useTrainingProgress';
import { cn } from '@/lib/utils';

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SpotlightOverlay() {
  const {
    currentStep,
    currentStepData,
    isWalkthroughActive,
    completedSteps,
    totalSteps,
    completeStep,
    nextStep,
    prevStep,
    endWalkthrough,
  } = useTrainingProgress();

  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isWalkthroughActive || !currentStepData) return;

    const updatePosition = () => {
      const target = document.querySelector(currentStepData.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        const padding = 8;
        
        setSpotlightPos({
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Calculate tooltip position
        const tooltipWidth = 380;
        const tooltipHeight = 200;
        let tooltipTop = rect.bottom + 16 + window.scrollY;
        let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Adjust if off-screen
        if (tooltipLeft < 16) tooltipLeft = 16;
        if (tooltipLeft + tooltipWidth > window.innerWidth - 16) {
          tooltipLeft = window.innerWidth - tooltipWidth - 16;
        }
        if (tooltipTop + tooltipHeight > window.innerHeight + window.scrollY) {
          tooltipTop = rect.top - tooltipHeight - 16 + window.scrollY;
        }

        setTooltipPos({ top: tooltipTop, left: tooltipLeft });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isWalkthroughActive, currentStepData, currentStep]);

  const handleNext = () => {
    if (currentStepData) {
      completeStep(currentStepData.id);
    }
    nextStep();
  };

  if (!isWalkthroughActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-auto"
      >
        {/* Dark overlay with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlightPos && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={spotlightPos.left}
                  y={spotlightPos.top}
                  width={spotlightPos.width}
                  height={spotlightPos.height}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
            <filter id="spotlight-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.85)"
            mask="url(#spotlight-mask)"
          />
          {/* Spotlight border glow */}
          {spotlightPos && (
            <motion.rect
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              x={spotlightPos.left}
              y={spotlightPos.top}
              width={spotlightPos.width}
              height={spotlightPos.height}
              rx="12"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              filter="url(#spotlight-glow)"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Tooltip Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute z-[101]"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <Card className="w-[380px] bg-card/95 backdrop-blur-xl border-primary/30 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{currentStepData?.title}</h3>
                    <p className="text-xs text-muted-foreground">{currentStepData?.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/20"
                  onClick={endWalkthrough}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {currentStepData?.content}
              </p>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mt-4">
                {TRAINING_STEPS.map((step, idx) => (
                  <div
                    key={step.id}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-all duration-300",
                      idx < currentStep ? "bg-primary" :
                      idx === currentStep ? "bg-primary animate-pulse" :
                      "bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Progress text */}
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>Étape {currentStep + 1} sur {totalSteps}</span>
                <div className="flex items-center gap-1">
                  {completedSteps.includes(currentStepData?.id || '') && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complété
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-4 bg-muted/30 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              {currentStep === totalSteps - 1 ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Sparkles className="h-4 w-4" />
                  Terminer
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Skip button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 z-[101]"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={endWalkthrough}
            className="bg-background/80 backdrop-blur-sm"
          >
            Passer le tutoriel
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
