import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Play, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  BookOpen,
  Target
} from 'lucide-react';
import { useTrainingProgress, TRAINING_STEPS } from '@/hooks/useTrainingProgress';
import { CertifiedBadge } from './CertifiedBadge';
import { cn } from '@/lib/utils';

interface AcademyLauncherProps {
  showOnFirstVisit?: boolean;
}

// Session storage key for showing instruction card
const INSTRUCTION_CARD_KEY = 'tbos-show-instruction-card';

export function AcademyLauncher({ showOnFirstVisit = true }: AcademyLauncherProps) {
  const navigate = useNavigate();
  const { 
    completedSteps, 
    isCertified, 
    progress, 
    loading,
    totalSteps
  } = useTrainingProgress();
  
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tbos-academy-seen');
    if (!seen && showOnFirstVisit && !loading && !isCertified) {
      setIsExpanded(true);
      localStorage.setItem('tbos-academy-seen', 'true');
    }
  }, [loading, isCertified, showOnFirstVisit]);

  const handleStart = () => {
    console.log('[Academy] Commencer clicked - navigating to Nouveau Devis');
    
    // Close overlay
    setIsExpanded(false);
    
    // Set flag to show instruction card
    sessionStorage.setItem(INSTRUCTION_CARD_KEY, 'true');
    
    // Navigate to Ventes page with query param to open new devis form
    navigate('/ventes?action=nouveau-devis');
    
    console.log('[Academy] ✅ Navigation triggered');
  };

  if (loading) return null;

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
        {completedSteps.length > 0 && (
          <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px]">
            {completedSteps.length}/{totalSteps}
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
                    <p className="text-xs text-muted-foreground">Formation Interactive</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium text-foreground">
                      {completedSteps.length}/{totalSteps} étapes
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>

              {/* Steps Preview */}
              <div className="p-4 space-y-2">
                {TRAINING_STEPS.map((step, idx) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-all",
                      completedSteps.includes(step.id) 
                        ? "bg-success/10" 
                        : "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                      completedSteps.includes(step.id)
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        completedSteps.includes(step.id) ? "text-success" : "text-foreground"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 space-y-2">
                <Button
                  onClick={handleStart}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Play className="h-4 w-4" />
                  {completedSteps.length > 0 ? 'Continuer' : 'Commencer'}
                </Button>
                
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>3 tâches</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>~5 min</span>
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
