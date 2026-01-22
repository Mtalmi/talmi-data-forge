import { Lock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface EditLockBannerProps {
  isLocked: boolean;
  lockedByName: string | null;
  expiresAt: Date | null;
  className?: string;
}

export function EditLockBanner({ isLocked, lockedByName, expiresAt, className }: EditLockBannerProps) {
  if (!isLocked) return null;

  const expiresIn = expiresAt 
    ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000))
    : null;

  return (
    <Alert variant="destructive" className={cn('border-destructive/50 bg-destructive/10', className)}>
      <Lock className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Mode Lecture Seule
      </AlertTitle>
      <AlertDescription>
        Ce document est actuellement en cours de modification par <strong>{lockedByName}</strong>.
        {expiresIn !== null && expiresIn > 0 && (
          <span className="block mt-1 text-xs">
            Le verrouillage expire dans ~{expiresIn} minute{expiresIn > 1 ? 's' : ''}.
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
