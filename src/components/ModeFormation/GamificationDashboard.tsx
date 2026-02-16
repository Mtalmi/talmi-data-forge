import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Trophy, Flame, Star, Zap, Target, 
  Award, TrendingUp, Medal, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationType } from './types';

// ============================================================================
// XP & LEVEL SYSTEM
// ============================================================================

const XP_PER_LEVEL = 500;
const MAX_LEVEL = 50;

const DIFFICULTY_XP: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
};

const SCORE_BONUS_THRESHOLDS = [
  { min: 90, bonus: 100, label: 'Excellent' },
  { min: 75, bonus: 50, label: 'Très bien' },
  { min: 50, bonus: 20, label: 'Bien' },
];

export function calculateXP(score: number, difficulty: string): number {
  const base = DIFFICULTY_XP[difficulty] || 50;
  const scoreMultiplier = score / 100;
  const bonus = SCORE_BONUS_THRESHOLDS.find(t => score >= t.min)?.bonus || 0;
  return Math.round(base * scoreMultiplier + bonus);
}

export function getLevelFromXP(xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  const level = Math.min(Math.floor(xp / XP_PER_LEVEL) + 1, MAX_LEVEL);
  const currentXP = xp % XP_PER_LEVEL;
  const nextLevelXP = XP_PER_LEVEL;
  const progress = (currentXP / nextLevelXP) * 100;
  return { level, currentXP, nextLevelXP, progress };
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Recrue',
  5: 'Apprenti',
  10: 'Opérateur',
  15: 'Spécialiste',
  20: 'Expert',
  25: 'Maître',
  30: 'Vétéran',
  40: 'Légende',
  50: 'Grand Maître',
};

export function getLevelTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const key of keys) {
    if (level >= key) return LEVEL_TITLES[key];
  }
  return 'Recrue';
}

// ============================================================================
// BADGE DEFINITIONS
// ============================================================================

export interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  icon: 'trophy' | 'flame' | 'star' | 'medal' | 'crown' | 'target' | 'zap';
  condition: (stats: PlayerStats) => boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PlayerStats {
  completedCount: number;
  totalXP: number;
  level: number;
  streakDays: number;
  avgScore: number;
  perfectScores: number;
}

const BADGES: GamificationBadge[] = [
  { id: 'first_sim', name: 'Premier Pas', description: 'Complétez votre première simulation', icon: 'star', condition: s => s.completedCount >= 1, rarity: 'common' },
  { id: 'five_sims', name: 'Engagé', description: 'Complétez 5 simulations', icon: 'target', condition: s => s.completedCount >= 5, rarity: 'common' },
  { id: 'ten_sims', name: 'Assidu', description: 'Complétez 10 simulations', icon: 'medal', condition: s => s.completedCount >= 10, rarity: 'rare' },
  { id: 'all_sims', name: 'Maître Absolu', description: 'Complétez les 15 simulations', icon: 'crown', condition: s => s.completedCount >= 15, rarity: 'legendary' },
  { id: 'high_scorer', name: 'Perfectionniste', description: 'Score moyen > 85%', icon: 'trophy', condition: s => s.avgScore >= 85, rarity: 'epic' },
  { id: 'perfect', name: 'Sans Faute', description: 'Obtenez un score parfait (100%)', icon: 'zap', condition: s => s.perfectScores >= 1, rarity: 'epic' },
  { id: 'streak_3', name: 'En Flammes', description: '3 jours de suite d\'activité', icon: 'flame', condition: s => s.streakDays >= 3, rarity: 'rare' },
  { id: 'streak_7', name: 'Infatigable', description: '7 jours de suite d\'activité', icon: 'flame', condition: s => s.streakDays >= 7, rarity: 'epic' },
  { id: 'xp_1000', name: 'Millénaire', description: 'Accumulez 1000 XP', icon: 'star', condition: s => s.totalXP >= 1000, rarity: 'rare' },
  { id: 'level_10', name: 'Opérateur Certifié', description: 'Atteignez le niveau 10', icon: 'medal', condition: s => s.level >= 10, rarity: 'rare' },
];

const BADGE_ICONS: Record<string, React.ElementType> = {
  trophy: Trophy, flame: Flame, star: Star, medal: Medal, crown: Crown, target: Target, zap: Zap,
};

const RARITY_COLORS: Record<string, string> = {
  common: 'from-slate-400 to-slate-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-violet-500 to-purple-600',
  legendary: 'from-amber-400 to-amber-600',
};

const RARITY_BORDER: Record<string, string> = {
  common: 'border-slate-300 dark:border-slate-600',
  rare: 'border-blue-300 dark:border-blue-600',
  epic: 'border-violet-300 dark:border-violet-600',
  legendary: 'border-amber-300 dark:border-amber-600',
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface XPBarProps {
  totalXP: number;
  className?: string;
}

export function XPBar({ totalXP, className }: XPBarProps) {
  const { level, currentXP, nextLevelXP, progress } = getLevelFromXP(totalXP);
  const title = getLevelTitle(level);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">Niveau {level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-muted-foreground">{currentXP}/{nextLevelXP} XP</p>
          <p className="text-xs text-muted-foreground">{totalXP} XP total</p>
        </div>
      </div>
      <div className="relative">
        <Progress value={progress} className="h-2.5" />
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  if (streak <= 0) return null;
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30"
    >
      <Flame className="h-4 w-4 text-orange-500" />
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak}</span>
      <span className="text-xs text-muted-foreground">jours</span>
    </motion.div>
  );
}

interface BadgeGridProps {
  earnedBadgeIds: string[];
  stats: PlayerStats;
}

export function BadgeGrid({ earnedBadgeIds, stats }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {BADGES.map(badge => {
        const isEarned = earnedBadgeIds.includes(badge.id) || badge.condition(stats);
        const Icon = BADGE_ICONS[badge.icon];
        
        return (
          <div
            key={badge.id}
            className={cn(
              'relative flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all',
              isEarned
                ? cn('bg-gradient-to-br opacity-100', RARITY_BORDER[badge.rarity])
                : 'bg-muted/30 border-muted opacity-40 grayscale'
            )}
            title={`${badge.name}: ${badge.description}`}
          >
            <div className={cn(
              'p-1.5 rounded-full bg-gradient-to-br',
              isEarned ? RARITY_COLORS[badge.rarity] : 'from-muted to-muted'
            )}>
              <Icon className={cn('h-3.5 w-3.5', isEarned ? 'text-white' : 'text-muted-foreground')} />
            </div>
            <span className="text-[10px] font-medium leading-tight">{badge.name}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ScoreBreakdownProps {
  scores: Array<{ step_id: string; score_global: number; score_precision: number; score_conformite: number; score_rapidite: number }>;
}

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  if (scores.length === 0) return null;

  const avg = (key: 'score_global' | 'score_precision' | 'score_conformite' | 'score_rapidite') => {
    const valid = scores.filter(s => s[key] > 0);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((a, s) => a + s[key], 0) / valid.length);
  };

  const metrics = [
    { label: 'Score Global', value: avg('score_global'), icon: TrendingUp, color: 'text-amber-500' },
    { label: 'Précision', value: avg('score_precision'), icon: Target, color: 'text-blue-500' },
    { label: 'Conformité', value: avg('score_conformite'), icon: Award, color: 'text-emerald-500' },
    { label: 'Rapidité', value: avg('score_rapidite'), icon: Zap, color: 'text-violet-500' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {metrics.map(m => (
        <div key={m.label} className="text-center p-2 rounded-lg bg-muted/30 border border-border">
          <m.icon className={cn('h-4 w-4 mx-auto mb-1', m.color)} />
          <p className="text-lg font-bold">{m.value}%</p>
          <p className="text-[10px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN GAMIFICATION DASHBOARD
// ============================================================================

interface GamificationDashboardProps {
  completedSimulations: SimulationType[];
  className?: string;
}

export function GamificationDashboard({ completedSimulations, className }: GamificationDashboardProps) {
  const { user } = useAuth();
  const [xpProfile, setXpProfile] = useState<{ total_xp: number; streak_days: number; badges: string[] } | null>(null);
  const [scores, setScores] = useState<Array<{ step_id: string; score_global: number; score_precision: number; score_conformite: number; score_rapidite: number }>>([]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    const [profileRes, scoresRes] = await Promise.all([
      supabase
        .from('user_xp_profiles')
        .select('total_xp, streak_days, badges')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('user_training_progress')
        .select('step_id, score_global, score_precision, score_conformite, score_rapidite')
        .eq('user_id', user.id),
    ]);

    if (profileRes.data) setXpProfile(profileRes.data as any);
    if (scoresRes.data) setScores(scoresRes.data as any);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalXP = xpProfile?.total_xp || 0;
  const streakDays = xpProfile?.streak_days || 0;
  const earnedBadgeIds = (xpProfile?.badges as string[]) || [];
  const levelInfo = getLevelFromXP(totalXP);

  const stats: PlayerStats = {
    completedCount: completedSimulations.length,
    totalXP,
    level: levelInfo.level,
    streakDays,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, s) => a + (s.score_global || 0), 0) / scores.filter(s => s.score_global > 0).length) || 0 : 0,
    perfectScores: scores.filter(s => s.score_global >= 100).length,
  };

  return (
    <Card className={cn(
      'bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10',
      'border-amber-200/60 dark:border-amber-800/40',
      className
    )}>
      <CardContent className="p-4 space-y-4">
        {/* XP & Level */}
        <XPBar totalXP={totalXP} />
        
        {/* Streak */}
        <div className="flex items-center justify-between">
          <StreakCounter streak={streakDays} />
          <Badge variant="outline" className="text-xs">
            {completedSimulations.length}/15 simulations
          </Badge>
        </div>

        {/* Score Breakdown */}
        <ScoreBreakdown scores={scores} />

        {/* Badges */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Badges ({BADGES.filter(b => earnedBadgeIds.includes(b.id) || b.condition(stats)).length}/{BADGES.length})
          </p>
          <BadgeGrid earnedBadgeIds={earnedBadgeIds} stats={stats} />
        </div>
      </CardContent>
    </Card>
  );
}
