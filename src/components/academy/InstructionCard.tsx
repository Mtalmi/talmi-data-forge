import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Camera, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INSTRUCTION_CARD_KEY = 'tbos-show-instruction-card';

interface InstructionCardProps {
  step?: number;
  title?: string;
  message?: string;
  onDismiss?: () => void;
}

export function InstructionCard({ 
  step = 1,
  title = 'Formation TBOS',
  message = 'Remplissez les détails client. Rappel: La Photo est Obligatoire.',
  onDismiss
}: InstructionCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we should show the instruction card
    const shouldShow = sessionStorage.getItem(INSTRUCTION_CARD_KEY);
    if (shouldShow === 'true') {
      setIsVisible(true);
      // Clear the flag so it doesn't show again on refresh
      sessionStorage.removeItem(INSTRUCTION_CARD_KEY);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg"
        >
          <div className={cn(
            "relative overflow-hidden rounded-xl",
            "bg-gradient-to-r from-amber-500/95 via-yellow-500/95 to-amber-500/95",
            "border-2 border-amber-300/50",
            "shadow-[0_8px_32px_rgba(245,158,11,0.4),0_0_60px_rgba(245,158,11,0.2)]",
            "backdrop-blur-sm"
          )}>
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
            
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                {/* Step Badge */}
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 border border-white/30">
                  <span className="text-white font-bold text-lg">
                    {step}
                  </span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-4 w-4 text-white" />
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                      {title}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-sm leading-relaxed">
                    {message}
                  </p>
                  
                  {/* Photo reminder badge */}
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 border border-white/30">
                    <Camera className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Photo Obligatoire</span>
                  </div>
                </div>
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="flex-shrink-0 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Got it button */}
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Compris
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export the key so other components can trigger the card
export { INSTRUCTION_CARD_KEY };