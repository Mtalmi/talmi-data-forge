import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Play, Sparkles } from 'lucide-react';

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  category: 'Fondamentaux' | 'Opérations' | 'Avancé';
  duration: number;
  durationDisplay: string;
  videoUrl: string;
  icon: React.ReactNode;
}

interface VideoTutorialCardProps {
  video: VideoTutorial;
  onClick: () => void;
}

const CATEGORY_STYLES = {
  Fondamentaux: 'bg-orange-200 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
  Opérations: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
  Avancé: 'bg-pink-200 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300',
};

export function VideoTutorialCard({ video, onClick }: VideoTutorialCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "relative cursor-pointer overflow-hidden",
          "bg-amber-50/80 dark:bg-amber-900/10",
          "border border-amber-200/50 dark:border-amber-500/20",
          "hover:shadow-lg hover:shadow-amber-500/10",
          "transition-all duration-300",
          "p-6 h-full min-h-[220px]"
        )}
      >
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant="secondary" 
            className={cn("text-xs font-medium", CATEGORY_STYLES[video.category])}
          >
            {video.category}
          </Badge>
          <div className="p-1.5 rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>

        {/* Icon */}
        <div className="flex items-center justify-center h-16 mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            {video.icon}
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-16 right-4">
          <Badge 
            variant="secondary" 
            className="bg-slate-800 text-white dark:bg-slate-700 text-xs font-mono"
          >
            {video.durationDisplay}
          </Badge>
        </div>

        {/* Title & Description */}
        <div className="mt-auto">
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
            {video.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        </div>

        {/* Play Overlay on Hover */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            whileHover={{ scale: 1 }}
            className="p-4 rounded-full bg-white/90 shadow-xl"
          >
            <Play className="h-8 w-8 text-primary fill-primary" />
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  );
}
