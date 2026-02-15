import { Lock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface EditLockBannerProps {
  isLocked: boolean;
  lockedByName: string | null;
  expiresAt: Date | null;
  className?: string;
}

export function EditLockBanner({ isLocked, lockedByName, expiresAt, className }: EditLockBannerProps) {
  const { t } = useI18n();
  const r = t.driverRotation;

  if (!isLocked) return null;

  const expiresIn = expiresAt 
    ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000))
    : null;

  return (
    <Alert variant="destructive" className={cn('border-destructive/50 bg-destructive/10', className)}>
      <Lock className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {r.readOnlyMode}
      </AlertTitle>
      <AlertDescription>
        {r.documentLockedBy} <strong>{lockedByName}</strong>.
        {expiresIn !== null && expiresIn > 0 && (
          <span className="block mt-1 text-xs">
            {r.lockExpiresIn} ~{expiresIn} {expiresIn > 1 ? r.minutes : r.minute}.
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
