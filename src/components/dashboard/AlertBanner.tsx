import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <div className="space-y-2 mb-6 animate-fade-in">
      {criticalAlerts.length > 0 && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5 pulse-alert" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">
              {criticalAlerts.length} Alerte{criticalAlerts.length > 1 ? 's' : ''} Critique{criticalAlerts.length > 1 ? 's' : ''}
            </p>
            <ul className="mt-1 space-y-1">
              {criticalAlerts.map((alert) => (
                <li key={alert.id} className="text-sm text-foreground flex items-center justify-between">
                  <span>{alert.message}</span>
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {warningAlerts.length > 0 && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-warning">
              {warningAlerts.length} Avertissement{warningAlerts.length > 1 ? 's' : ''}
            </p>
            <ul className="mt-1 space-y-1">
              {warningAlerts.map((alert) => (
                <li key={alert.id} className="text-sm text-foreground flex items-center justify-between">
                  <span>{alert.message}</span>
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
