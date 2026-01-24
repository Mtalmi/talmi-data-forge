import { cn } from '@/lib/utils';
import { hapticTap } from '@/lib/haptics';

interface TacticalSwitchOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TacticalSwitchProps {
  options: TacticalSwitchOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Tactical Switch - Premium toggle switches that feel like high-end physical controls
 * Part of the "Obsidian & Liquid Gold" design system
 */
export function TacticalSwitch({ options, value, onChange, label, className }: TacticalSwitchProps) {
  const handleSelect = (newValue: string) => {
    hapticTap();
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, 1fr)` }}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
                'transition-all duration-300 ease-out',
                'min-h-[80px] text-center',
                'border-2',
                isSelected ? [
                  'bg-gradient-to-br from-primary/15 to-primary/5',
                  'border-primary',
                  'shadow-[0_0_30px_hsl(var(--primary)/0.3)]',
                  'text-primary',
                ] : [
                  'bg-transparent',
                  'border-border/50',
                  'hover:border-primary/40',
                  'hover:bg-primary/5',
                  'text-muted-foreground',
                  'hover:text-foreground',
                ]
              )}
            >
              {/* Active Glow Ring */}
              {isSelected && (
                <span className="absolute inset-0 rounded-xl animate-pulse-ring opacity-50 pointer-events-none border border-primary" />
              )}

              {/* Icon */}
              {Icon && (
                <Icon className={cn(
                  'h-6 w-6 transition-all duration-300',
                  isSelected ? 'text-primary scale-110' : 'text-muted-foreground'
                )} />
              )}

              {/* Label */}
              <span className={cn(
                'text-sm font-bold tracking-tight transition-all duration-300',
                isSelected && 'text-primary'
              )}>
                {option.label}
              </span>

              {/* Active Indicator Dot */}
              {isSelected && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
