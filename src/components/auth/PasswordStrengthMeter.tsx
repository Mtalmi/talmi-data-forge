import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
}

const RULES = [
  { test: (p: string) => p.length >= 8, label: 'Min. 8 caractères' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Une majuscule' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Un chiffre' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Un caractère spécial' },
];

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const passed = RULES.filter(r => r.test(password)).length;
  const strength = passed / RULES.length;

  const barColor = strength <= 0.25 ? 'bg-destructive' 
    : strength <= 0.5 ? 'bg-orange-500'
    : strength <= 0.75 ? 'bg-yellow-500'
    : 'bg-emerald-500';

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < passed ? barColor : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Rules checklist */}
      <div className="grid grid-cols-2 gap-1">
        {RULES.map(rule => {
          const ok = rule.test(password);
          return (
            <div key={rule.label} className="flex items-center gap-1.5 text-[10px]">
              {ok ? (
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className={cn(ok ? 'text-emerald-500' : 'text-muted-foreground')}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
