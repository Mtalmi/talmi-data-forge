import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShieldAlert, 
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  Ban,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Package,
  FileWarning,
  Activity,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface ForensicAlert {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  changes: {
    reason?: string;
    previous_status?: string;
    new_status?: string;
    cancelled_by_role?: string;
    rollback_number?: number;
    current?: number;
    new?: number;
    cap?: number;
  } | null;
  created_at: string;
}

// Action styling configurations
const ACTION_CONFIG: Record<string, { 
  label: string; 
  icon: React.ElementType;
  badgeClass: string;
  cardClass: string;
  isPulsing?: boolean;
}> = {
  LIMIT_EXCEEDED: { 
    label: 'PLAFOND DÉPASSÉ', 
    icon: Wallet,
    badgeClass: 'bg-red-600 text-white',
    cardClass: 'border-l-red-600 bg-red-500/5',
    isPulsing: true,
  },
  ROLLBACK_APPROVAL: { 
    label: 'DEVIS ROLLBACK', 
    icon: Unlock,
    badgeClass: 'bg-red-600 text-white',
    cardClass: 'border-l-red-600 bg-red-500/5',
  },
  ACCESS_DENIED: { 
    label: 'VIOLATION SÉCURITÉ', 
    icon: Ban,
    badgeClass: 'bg-orange-600 text-white animate-pulse',
    cardClass: 'border-l-orange-600 bg-orange-500/5',
    isPulsing: true,
  },
  EXPENSE_BLOCKED: { 
    label: 'DÉPENSE BLOQUÉE', 
    icon: Lock,
    badgeClass: 'bg-amber-600 text-white',
    cardClass: 'border-l-amber-600 bg-amber-500/5',
  },
  APPROVE_DEVIS: { 
    label: 'APPROBATION', 
    icon: CheckCircle,
    badgeClass: 'bg-emerald-600 text-white',
    cardClass: 'border-l-emerald-600 bg-emerald-500/5',
  },
  STOCK_FINALIZED: { 
    label: 'STOCK FINALISÉ', 
    icon: Package,
    badgeClass: 'bg-green-600 text-white',
    cardClass: 'border-l-green-600 bg-green-500/5',
  },
  PRICE_CHANGE: { 
    label: 'MODIF. PRIX', 
    icon: FileWarning,
    badgeClass: 'bg-amber-600 text-white',
    cardClass: 'border-l-amber-600 bg-amber-500/5',
  },
  default: { 
    label: 'ACTION', 
    icon: Activity,
    badgeClass: 'bg-slate-600 text-white',
    cardClass: 'border-l-muted',
  },
};

// Filter options
type AlertFilter = 'all' | 'critical' | 'blocked' | 'success';

export function ForensicAlertFeed() {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<ForensicAlert[]>([]);
  const [filter, setFilter] = useState<AlertFilter>('all');

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('audit_superviseur')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts((data || []) as ForensicAlert[]);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Realtime subscription
    const channel = supabase
      .channel('forensic_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_superviseur' },
        (payload) => {
          const newAlert = payload.new as ForensicAlert;
          setAlerts(prev => [newAlert, ...prev].slice(0, 50));
          
          // Show toast for critical alerts
          const config = ACTION_CONFIG[newAlert.action] || ACTION_CONFIG.default;
          if (newAlert.action === 'ACCESS_DENIED' || newAlert.action === 'LIMIT_EXCEEDED') {
            toast.error(`🚨 ${config.label}`, {
              description: newAlert.changes?.reason || newAlert.user_name || 'Alerte de sécurité',
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'critical':
        return ['ACCESS_DENIED', 'ROLLBACK_APPROVAL', 'LIMIT_EXCEEDED'].includes(alert.action);
      case 'blocked':
        return ['EXPENSE_BLOCKED', 'ACCESS_DENIED', 'LIMIT_EXCEEDED'].includes(alert.action);
      case 'success':
        return ['APPROVE_DEVIS', 'STOCK_FINALIZED'].includes(alert.action);
      default:
        return true;
    }
  });

  const renderAlertCard = (alert: ForensicAlert) => {
    const config = ACTION_CONFIG[alert.action] || ACTION_CONFIG.default;
    const Icon = config.icon;

    return (
      <div
        key={alert.id}
        className={cn(
          "rounded-xl border-l-4 shadow-sm p-4 mb-3 bg-card transition-all",
          config.cardClass
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="font-bold text-sm text-foreground truncate">
            {alert.user_name || 'Système'}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: false, locale: dateLocale || undefined })}
          </span>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm",
            config.badgeClass,
            config.isPulsing && "animate-pulse"
          )}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Reason */}
          {alert.changes?.reason && (
            <p className="text-sm italic text-muted-foreground text-center px-2">
              "{alert.changes.reason}"
            </p>
          )}

          {/* Cap exceeded details */}
          {alert.action === 'LIMIT_EXCEEDED' && alert.changes && (
            <div className="flex justify-center">
              <div className="text-xs text-center bg-red-500/10 rounded-lg px-3 py-2">
                <span className="font-mono">
                  {alert.changes.current?.toLocaleString()} + {alert.changes.new?.toLocaleString()} &gt; {alert.changes.cap?.toLocaleString()} MAD
                </span>
              </div>
            </div>
          )}

          {/* Target */}
          <div className="flex justify-center">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-muted/50 hover:bg-muted transition-colors",
                "text-sm font-mono font-medium min-h-[44px]"
              )}
              onClick={() => {
                toast.info(`Table: ${alert.table_name}`, {
                  description: alert.record_id ? `ID: ${alert.record_id}` : undefined,
                });
              }}
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-primary">
                {alert.table_name} {alert.record_id && `#${alert.record_id.substring(0, 8)}`}
              </span>
            </button>
          </div>

          {/* Rollback metadata */}
          {alert.action === 'ROLLBACK_APPROVAL' && alert.changes?.rollback_number && (
            <div className="flex justify-center gap-2 pt-2 border-t border-dashed border-red-500/20">
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-red-500/50 text-red-500 font-mono">
                ROLLBACK #{alert.changes.rollback_number}
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border-l-4 border-l-muted p-4 mb-3 animate-pulse">
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex justify-center mb-3">
                <Skeleton className="h-7 w-36 rounded-full" />
              </div>
              <Skeleton className="h-11 w-40 mx-auto rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Flux Forensique
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  Temps réel actif
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                  Connexion...
                </>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {[
            { value: 'all' as const, label: 'Tous' },
            { value: 'critical' as const, label: 'Critiques', color: 'text-red-500' },
            { value: 'blocked' as const, label: 'Bloqués', color: 'text-amber-500' },
            { value: 'success' as const, label: 'Succès', color: 'text-emerald-500' },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors min-h-[32px]",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80",
                color && filter !== value && color
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 dark:from-sky-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-base font-semibold mb-1">Ciel Dégagé ☀️</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Aucune alerte {filter !== 'all' ? `(${filter})` : ''} récente. Tout est sous contrôle.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] sm:h-[450px] pr-2">
            {filteredAlerts.map(renderAlertCard)}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
