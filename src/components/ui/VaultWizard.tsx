import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Lock, Camera, Check } from 'lucide-react';
import { hapticTap, hapticSuccess } from '@/lib/haptics';

interface WizardStep {
  id: string;
  question: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: ReactNode;
  isComplete: boolean;
}

interface VaultWizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  className?: string;
}

/**
 * Vault Wizard - One question at a time with premium animations
 * Part of the "Camera-First" workflow - fields slide in after photo capture
 */
export function VaultWizard({ steps, onComplete, className }: VaultWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const canProceed = currentStep?.isComplete;

  const handleNext = () => {
    if (!canProceed) return;
    
    hapticTap();
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));
    
    if (isLastStep) {
      hapticSuccess();
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (isFirstStep) return;
    hapticTap();
    setCurrentStepIndex(prev => prev - 1);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-2 mb-8 px-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStepIndex;
          const isPast = index < currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Dot */}
              <div className={cn(
                'relative w-10 h-10 rounded-full flex items-center justify-center',
                'transition-all duration-500 ease-out',
                'border-2',
                isCompleted || isPast ? [
                  'bg-gradient-to-br from-primary to-primary/80',
                  'border-primary',
                  'shadow-[0_0_20px_hsl(var(--primary)/0.4)]',
                ] : isCurrent ? [
                  'bg-transparent',
                  'border-primary',
                  'shadow-[0_0_30px_hsl(var(--primary)/0.3)]',
                ] : [
                  'bg-transparent',
                  'border-border/40',
                ]
              )}>
                {isCompleted || isPast ? (
                  <Check className="h-5 w-5 text-primary-foreground" />
                ) : isCurrent ? (
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground/50" />
                )}
                
                {/* Pulse Ring for Current */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full border border-primary animate-pulse-ring" />
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-1 transition-all duration-500',
                  isPast || isCompleted ? 'bg-primary' : 'bg-border/30'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Content */}
      <div className="flex-1 flex flex-col px-4">
        {/* Question Header - Large & Bold */}
        <div className="text-center mb-8 animate-fade-in">
          {currentStep?.icon && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
              <currentStep.icon className="h-8 w-8 text-primary" />
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
            {currentStep?.question}
          </h2>
          {currentStep?.subtitle && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {currentStep.subtitle}
            </p>
          )}
        </div>

        {/* Step Content with Slide Animation */}
        <div 
          key={currentStep?.id}
          className="flex-1 flex flex-col animate-fade-in-up"
        >
          {currentStep?.content}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-4 p-4 mt-auto border-t border-border/30">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirstStep}
          className={cn(
            'px-4 py-3 rounded-xl font-semibold text-sm',
            'transition-all duration-300',
            isFirstStep ? [
              'opacity-0 pointer-events-none',
            ] : [
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted/50',
            ]
          )}
        >
          Retour
        </button>

        {/* Next / Complete Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm',
            'transition-all duration-300',
            canProceed ? [
              'bg-gradient-to-r from-primary to-primary/80',
              'text-primary-foreground',
              'shadow-[0_0_30px_hsl(var(--primary)/0.3)]',
              'hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)]',
              'hover:scale-[1.02]',
            ] : [
              'bg-muted/30 text-muted-foreground cursor-not-allowed',
              'border border-border/30',
            ]
          )}
        >
          {isLastStep ? (
            <>
              <Lock className="h-4 w-4" />
              Verrouiller
            </>
          ) : (
            <>
              Continuer
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Capture Reality Zone - Hero photo upload area
 */
interface CaptureRealityZoneProps {
  photoUrl: string | null;
  photoPreview: string | null;
  onCapture: (file: File) => Promise<void>;
  uploading: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function CaptureRealityZone({
  photoUrl,
  photoPreview,
  onCapture,
  uploading,
  label = 'Capturer la Réalité',
  sublabel = 'Photo obligatoire avant de continuer',
  className,
}: CaptureRealityZoneProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onCapture(file);
    }
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <label className="relative cursor-pointer w-full max-w-md">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
          disabled={uploading}
        />
        
        <div className={cn(
          'relative aspect-[4/3] w-full rounded-2xl overflow-hidden',
          'transition-all duration-500 ease-out',
          'border-2 border-dashed',
          uploading ? [
            'border-primary',
            'bg-primary/5',
          ] : photoUrl ? [
            'border-primary border-solid',
            'shadow-[0_0_50px_hsl(var(--primary)/0.3)]',
          ] : [
            'border-primary/30',
            'bg-gradient-to-br from-background to-muted/20',
            'hover:border-primary/60',
            'hover:shadow-[0_0_40px_hsl(var(--primary)/0.15)]',
          ]
        )}>
          {/* Photo Preview */}
          {photoPreview ? (
            <div className="relative w-full h-full">
              <img 
                src={photoPreview} 
                alt="Captured" 
                className="w-full h-full object-cover animate-photo-snap"
              />
              {/* Success Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/90 text-primary-foreground">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-semibold">Preuve Capturée</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {/* Scanning Animation */}
              {uploading ? (
                <>
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Camera className="absolute inset-0 m-auto h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-primary animate-pulse">
                    Numérisation en cours...
                  </p>
                </>
              ) : (
                <>
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.1)]">
                      <Camera className="h-10 w-10 text-primary" />
                    </div>
                    {/* Pulse Ring */}
                    <span className="absolute inset-0 rounded-2xl border border-primary/30 animate-pulse-ring" />
                  </div>
                  <p className="text-lg font-bold text-foreground mb-1">{label}</p>
                  <p className="text-sm text-muted-foreground">{sublabel}</p>
                </>
              )}
            </div>
          )}

          {/* Scanning Line Animation (when uploading) */}
          {uploading && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-vertical" />
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
