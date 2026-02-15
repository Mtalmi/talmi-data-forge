import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ExternalLink,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import { useNotifications, SystemAlert } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';

const NIVEAU_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  critical: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-950/50' },
  warning: { icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-950/50' },
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-950/50' },
  success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-950/50' },
};

interface NotificationItemProps {
  alert: SystemAlert;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (alert: SystemAlert) => void;
  getTypeLabel: (type: string) => string;
}

function NotificationItem({ alert, onRead, onDismiss, onNavigate, getTypeLabel }: NotificationItemProps) {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const config = NIVEAU_CONFIG[alert.niveau] || NIVEAU_CONFIG.info;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: dateLocale || undefined });

  const handleClick = () => {
    if (!alert.lu) {
      onRead(alert.id);
    }
    onNavigate(alert);
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-colors group relative',
        !alert.lu && config.bgColor,
        alert.lu && 'hover:bg-muted/50',
        'border-l-4',
        alert.niveau === 'critical' && 'border-l-red-500',
        alert.niveau === 'warning' && 'border-l-amber-500',
        alert.niveau === 'info' && 'border-l-blue-500',
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-1.5 rounded-full', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {getTypeLabel(alert.type_alerte)}
            </Badge>
            {!alert.lu && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <p className="font-medium text-sm mt-1 line-clamp-1">{alert.titre}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {alert.message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(alert);
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          {alert.dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(alert.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const n = t.notifications;
  const [open, setOpen] = useState(false);
  const {
    alerts,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    getAlertRoute,
    getAlertTypeLabel,
  } = useNotifications();

  const handleNavigate = (alert: SystemAlert) => {
    const route = getAlertRoute(alert);
    setOpen(false);
    navigate(route);
  };

  const unreadAlerts = alerts.filter(a => !a.lu);
  const readAlerts = alerts.filter(a => a.lu).slice(0, 20);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {stats.unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1">
              {stats.unread > 99 ? '99+' : stats.unread}
            </span>
          )}
          {stats.critical > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">{n.title}</h3>
            <p className="text-xs text-muted-foreground">
              {stats.unread} {stats.unread !== 1 ? n.unreadPlural : n.unread}
              {stats.critical > 0 && (
                <span className="text-red-600 ml-2">
                  • {stats.critical} {stats.critical !== 1 ? n.criticalPlural : n.critical}
                </span>
              )}
            </p>
          </div>
          {stats.unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              {n.markAllRead}
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{n.noNotifications}</p>
              <p className="text-xs text-muted-foreground/70">
                {n.alertsAppearHere}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Unread section */}
              {unreadAlerts.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                    {n.new}
                  </p>
                  {unreadAlerts.map(alert => (
                    <NotificationItem
                      key={alert.id}
                      alert={alert}
                      onRead={markAsRead}
                      onDismiss={dismissAlert}
                      onNavigate={handleNavigate}
                      getTypeLabel={getAlertTypeLabel}
                    />
                  ))}
                </>
              )}

              {/* Read section */}
              {readAlerts.length > 0 && (
                <>
                  {unreadAlerts.length > 0 && <Separator className="my-2" />}
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                    {n.previous}
                  </p>
                  {readAlerts.map(alert => (
                    <NotificationItem
                      key={alert.id}
                      alert={alert}
                      onRead={markAsRead}
                      onDismiss={dismissAlert}
                      onNavigate={handleNavigate}
                      getTypeLabel={getAlertTypeLabel}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            className="w-full text-sm" 
            onClick={() => {
              setOpen(false);
              navigate('/alertes');
            }}
          >
            {n.viewAllAlerts}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
