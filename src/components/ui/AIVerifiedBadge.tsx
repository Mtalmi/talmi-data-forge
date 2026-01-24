import { cn } from '@/lib/utils';
import { Bot, CheckCircle, AlertTriangle, XCircle, Sparkles, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIVerifiedBadgeProps {
  status: 'verified' | 'mismatch' | 'scanning' | 'pending' | 'blocked';
  confidence?: number;
  compact?: boolean;
  className?: string;
  tooltip?: string;
}

/**
 * AI Verified Badge - Visual indicator for AI-verified transactions
 * Shows verification status with confidence level
 */
export function AIVerifiedBadge({
  status,
  confidence,
  compact = false,
  className,
  tooltip,
}: AIVerifiedBadgeProps) {
  const configs = {
    verified: {
      icon: CheckCircle,
      label: 'AI VÉRIFIÉ',
      shortLabel: '✓ AI',
      color: 'bg-success/10 text-success border-success/30',
      iconColor: 'text-success',
      glow: 'shadow-[0_0_10px_hsl(var(--success)/0.3)]',
    },
    mismatch: {
      icon: AlertTriangle,
      label: 'ÉCART DÉTECTÉ',
      shortLabel: '⚠️ AI',
      color: 'bg-warning/10 text-warning border-warning/30',
      iconColor: 'text-warning',
      glow: 'shadow-[0_0_10px_hsl(var(--warning)/0.3)]',
    },
    blocked: {
      icon: XCircle,
      label: 'BLOQUÉ - MISMATCH',
      shortLabel: '🚫 AI',
      color: 'bg-destructive/10 text-destructive border-destructive/30 animate-pulse',
      iconColor: 'text-destructive',
      glow: 'shadow-[0_0_10px_hsl(var(--destructive)/0.3)]',
    },
    scanning: {
      icon: Bot,
      label: 'SCAN EN COURS...',
      shortLabel: '🤖',
      color: 'bg-primary/10 text-primary border-primary/30',
      iconColor: 'text-primary animate-pulse',
      glow: '',
    },
    pending: {
      icon: Shield,
      label: 'EN ATTENTE AI',
      shortLabel: '⏳',
      color: 'bg-muted/50 text-muted-foreground border-muted',
      iconColor: 'text-muted-foreground',
      glow: '',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  const content = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-semibold transition-all',
        config.color,
        config.glow,
        compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        className
      )}
    >
      <Icon className={cn(
        config.iconColor,
        compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
        status === 'scanning' && 'animate-spin'
      )} />
      <span>{compact ? config.shortLabel : config.label}</span>
      {confidence !== undefined && status === 'verified' && !compact && (
        <span className="ml-1 opacity-70">{confidence}%</span>
      )}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Bot className="h-3.5 w-3.5" />
                {config.label}
              </p>
              <p className="text-xs text-muted-foreground">{tooltip}</p>
              {confidence !== undefined && (
                <p className="text-xs">
                  Confiance AI: <span className="font-mono font-bold">{confidence}%</span>
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

/**
 * AI Verification Status Inline - Smaller inline indicator
 */
export function AIVerificationIcon({
  verified,
  className,
}: {
  verified: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center',
              'h-5 w-5 rounded-full',
              verified
                ? 'bg-success/20 text-success'
                : 'bg-muted/50 text-muted-foreground',
              className
            )}
          >
            {verified ? (
              <Sparkles className="h-3 w-3" />
            ) : (
              <Bot className="h-3 w-3" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {verified ? '✅ Vérifié par AI' : '⏳ Non vérifié par AI'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
