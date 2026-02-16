import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, ShieldCheck, Zap, Star, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SimulationScore } from './useSimulationScoring';

interface SimulationResultsModalProps {
  open: boolean;
  onClose: () => void;
  simulationTitle: string;
  score: SimulationScore | null;
}

function getGrade(score: number): { label: string; emoji: string; color: string } {
  if (score >= 95) return { label: 'S', emoji: '👑', color: 'text-amber-500' };
  if (score >= 85) return { label: 'A', emoji: '🏆', color: 'text-emerald-500' };
  if (score >= 70) return { label: 'B', emoji: '⭐', color: 'text-blue-500' };
  if (score >= 50) return { label: 'C', emoji: '👍', color: 'text-orange-500' };
  return { label: 'D', emoji: '📚', color: 'text-rose-500' };
}

export function SimulationResultsModal({ open, onClose, simulationTitle, score }: SimulationResultsModalProps) {
  if (!score) return null;

  const grade = getGrade(score.global);
  const minutes = Math.floor(score.timeSpentSeconds / 60);
  const seconds = score.timeSpentSeconds % 60;

  const criteria = [
    { label: 'Précision', value: score.precision, icon: Target, color: 'bg-blue-500' },
    { label: 'Conformité', value: score.conformite, icon: ShieldCheck, color: 'bg-emerald-500' },
    { label: 'Rapidité', value: score.rapidite, icon: Zap, color: 'bg-violet-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Résultats - {simulationTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Score Circle */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="flex flex-col items-center gap-2"
          >
            <div className={cn(
              'h-24 w-24 rounded-full border-4 flex items-center justify-center',
              'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30',
              score.global >= 85 ? 'border-amber-400' : score.global >= 50 ? 'border-blue-400' : 'border-rose-400'
            )}>
              <div className="text-center">
                <p className="text-3xl font-bold">{score.global}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{grade.emoji}</span>
              <span className={cn('text-2xl font-bold', grade.color)}>Grade {grade.label}</span>
            </div>
          </motion.div>

          {/* Criteria Bars */}
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <c.icon className="h-3.5 w-3.5" />
                    {c.label}
                  </span>
                  <span className="font-bold">{c.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', c.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.value}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Temps</p>
              <p className="font-mono font-bold text-sm">{minutes}:{seconds.toString().padStart(2, '0')}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">XP Gagné</p>
              <p className="font-bold text-sm text-amber-600 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                +{score.xpEarned}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Grade</p>
              <p className={cn('font-bold text-lg', grade.color)}>{grade.label}</p>
            </div>
          </div>

          <Button onClick={onClose} className="w-full gap-2">
            Continuer <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
