import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const isReady = progress >= 100;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ height: isRefreshing ? 56 : pullDistance }}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2 rounded-full',
          'bg-primary/10 text-primary transition-all duration-200',
          isReady && !isRefreshing && 'bg-primary/20 scale-110'
        )}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Actualisation...</span>
          </>
        ) : (
          <>
            <ArrowDown
              className={cn(
                'h-5 w-5 transition-transform duration-200',
                isReady && 'rotate-180'
              )}
              style={{
                transform: `rotate(${Math.min(progress * 1.8, 180)}deg)`,
              }}
            />
            <span className="text-sm font-medium">
              {isReady ? 'Relâchez pour actualiser' : 'Tirez pour actualiser'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
