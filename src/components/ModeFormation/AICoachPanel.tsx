import { CoachFeedback } from '@/hooks/useAITrainingCoach';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Loader2, 
  Target, 
  ShieldCheck, 
  Zap,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AICoachPanelProps {
  feedback: CoachFeedback | null;
  isCoaching: boolean;
  averageScore: number;
  className?: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500';
  const bg = score >= 80 ? 'bg-emerald-500/10' : score >= 50 ? 'bg-amber-500/10' : 'bg-rose-500/10';
  const border = score >= 80 ? 'border-emerald-500/30' : score >= 50 ? 'border-amber-500/30' : 'border-rose-500/30';
  
  return (
    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border', bg, border)}>
      <Sparkles className={cn('h-3.5 w-3.5', color)} />
      <span className={cn('text-sm font-bold', color)}>{score}/100</span>
    </div>
  );
}

function CriterionBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className={cn('h-1.5', `[&>div]:${color}`)} />
    </div>
  );
}

export function AICoachPanel({ feedback, isCoaching, averageScore, className }: AICoachPanelProps) {
  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br from-violet-50/80 to-indigo-50/50',
      'dark:from-violet-950/30 dark:to-indigo-950/20',
      'border-violet-200/60 dark:border-violet-800/40',
      'p-4 space-y-3',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/20">
            <Bot className="h-4 w-4 text-violet-500" />
          </div>
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Coach AI
          </span>
        </div>
        {averageScore > 0 && (
          <Badge variant="outline" className="text-xs bg-violet-100/50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300">
            Moyenne: {averageScore}%
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isCoaching ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground py-2"
          >
            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            <span>Analyse en cours...</span>
          </motion.div>
        ) : feedback ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Score */}
            <div className="flex items-center justify-between">
              <ScoreBadge score={feedback.score} />
            </div>

            {/* Hint */}
            <div className="p-2.5 rounded-lg bg-violet-100/60 dark:bg-violet-900/30 border border-violet-200/50 dark:border-violet-800/30">
              <p className="text-sm text-violet-800 dark:text-violet-200">
                💡 {feedback.hint}
              </p>
            </div>

            {/* Correction if any */}
            {feedback.correction && (
              <div className="p-2.5 rounded-lg bg-rose-100/60 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/30">
                <p className="text-sm text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  {feedback.correction}
                </p>
              </div>
            )}

            {/* Criteria */}
            <div className="space-y-2">
              <CriterionBar label="Précision" value={feedback.criteria.precision} icon={Target} />
              <CriterionBar label="Conformité" value={feedback.criteria.conformite} icon={ShieldCheck} />
              <CriterionBar label="Rapidité" value={feedback.criteria.rapidite} icon={Zap} />
            </div>

            {/* Encouragement */}
            <p className="text-xs text-muted-foreground italic">
              {feedback.encouragement}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground py-1"
          >
            Effectuez une action pour recevoir un feedback AI.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
