import { motion } from 'framer-motion';
import { Shield, Award, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CertifiedBadgeProps {
  level?: 'bronze' | 'silver' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const BADGE_CONFIG = {
  bronze: {
    label: 'Opérateur Certifié',
    icon: Shield,
    gradient: 'from-amber-700 to-amber-500',
    glow: 'shadow-amber-500/30',
    ring: 'ring-amber-500/50',
  },
  silver: {
    label: 'Expert Certifié',
    icon: Award,
    gradient: 'from-slate-400 to-slate-200',
    glow: 'shadow-slate-400/30',
    ring: 'ring-slate-400/50',
  },
  gold: {
    label: 'Maître Certifié',
    icon: Star,
    gradient: 'from-yellow-500 to-yellow-300',
    glow: 'shadow-yellow-500/40',
    ring: 'ring-yellow-500/50',
  },
};

const SIZE_CONFIG = {
  sm: { icon: 'h-3 w-3', badge: 'h-5 w-5', text: 'text-[10px]' },
  md: { icon: 'h-4 w-4', badge: 'h-7 w-7', text: 'text-xs' },
  lg: { icon: 'h-5 w-5', badge: 'h-9 w-9', text: 'text-sm' },
};

export function CertifiedBadge({ 
  level = 'gold', 
  size = 'md',
  showLabel = false,
  className 
}: CertifiedBadgeProps) {
  const config = BADGE_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={cn("inline-flex items-center gap-1.5", className)}
        >
          <div className={cn(
            "relative flex items-center justify-center rounded-full",
            "bg-gradient-to-br shadow-lg ring-2",
            config.gradient,
            config.glow,
            config.ring,
            sizeConfig.badge
          )}>
            <Icon className={cn("text-white drop-shadow-sm", sizeConfig.icon)} />
            
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          </div>
          
          {showLabel && (
            <span className={cn(
              "font-medium text-foreground",
              sizeConfig.text
            )}>
              {config.label}
            </span>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>{config.label}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
