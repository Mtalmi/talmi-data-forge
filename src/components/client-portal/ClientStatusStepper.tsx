import { cn } from '@/lib/utils';
import { ClipboardList, Factory, Truck, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ClientStatusStepperProps {
  status: string;
  departureTime: string | null;
  arrivalTime: string | null;
  confirmedAt: string | null;
}

const STEPS = [
  { key: 'planification', label: 'En Préparation', icon: ClipboardList },
  { key: 'production', label: 'En Production', icon: Factory },
  { key: 'en_livraison', label: 'En Route', icon: Truck },
  { key: 'livre', label: 'Livré', icon: CheckCircle },
];

const STATUS_ORDER = ['planification', 'production', 'validation_technique', 'en_livraison', 'livre'];

export function ClientStatusStepper({
  status,
  departureTime,
  arrivalTime,
  confirmedAt,
}: ClientStatusStepperProps) {
  const normalizedStatus = status === 'validation_technique' ? 'production' : status;
  const currentIndex = STATUS_ORDER.indexOf(status);

  const getStepState = (stepKey: string): 'completed' | 'current' | 'upcoming' => {
    const stepIndex = STEPS.findIndex(s => s.key === stepKey);
    const normalizedCurrentIndex = STEPS.findIndex(s => s.key === normalizedStatus);
    
    if (stepIndex < normalizedCurrentIndex) return 'completed';
    if (stepIndex === normalizedCurrentIndex) return 'current';
    return 'upcoming';
  };

  const getTimeForStep = (stepKey: string): string | null => {
    if (stepKey === 'en_livraison' && departureTime) {
      return departureTime;
    }
    if (stepKey === 'livre' && (confirmedAt || arrivalTime)) {
      const time = confirmedAt || arrivalTime;
      return time ? format(new Date(time), 'HH:mm') : null;
    }
    return null;
  };

  return (
    <div className="p-4 bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-amber-500/20 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-amber-400/80">Statut de la Livraison</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Temps réel</span>
        </div>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
            style={{ 
              width: `${(STEPS.findIndex(s => s.key === normalizedStatus) / (STEPS.length - 1)) * 100}%` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-4 gap-2">
          {STEPS.map((step) => {
            const state = getStepState(step.key);
            const Icon = step.icon;
            const time = getTimeForStep(step.key);

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    'relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    state === 'completed' && 'bg-amber-500 border-amber-500 text-black',
                    state === 'current' && 'bg-amber-500/20 border-amber-500 text-amber-500 animate-pulse',
                    state === 'upcoming' && 'bg-gray-900 border-gray-700 text-gray-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    'mt-2 text-[10px] font-medium leading-tight',
                    state === 'completed' && 'text-amber-400',
                    state === 'current' && 'text-amber-400',
                    state === 'upcoming' && 'text-gray-600'
                  )}
                >
                  {step.label}
                </span>
                {time && (
                  <span className="text-[9px] text-gray-500 mt-0.5">{time}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
