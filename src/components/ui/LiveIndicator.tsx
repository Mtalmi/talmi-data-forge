import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Small green pulsing dot indicating an active realtime subscription.
 * Place next to section headers that have live data.
 */
export function LiveIndicator({ label = 'Données en temps réel' }: { label?: string }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tbos-live-dot" aria-label={label} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
