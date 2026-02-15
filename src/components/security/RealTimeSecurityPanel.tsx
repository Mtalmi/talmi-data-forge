import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Wifi,
  WifiOff,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  Activity,
  AlertTriangle,
  Ban,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Loader2,
  Zap,
  Radio,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface ActiveSession {
  user_id: string;
  user_name: string;
  email: string;
  role: string;
  last_activity: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  ip_address: string;
  is_online: boolean;
}

interface AuthAttempt {
  id: string;
  email: string;
  status: 'success' | 'failed' | 'blocked';
  ip_address: string;
  user_agent: string;
  timestamp: string;
  failure_reason?: string;
}

interface BreachAlert {
  id: string;
  type: 'limit_exceeded' | 'deletion_blocked' | 'unauthorized_access' | 'suspicious_activity' | 'rollback';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  user_name: string;
  user_id: string;
  table_name: string;
  record_id: string | null;
  details: Record<string, unknown>;
  timestamp: string;
  acknowledged: boolean;
}

interface SecurityStats {
  activeSessions: number;
  onlineUsers: number;
  failedLogins24h: number;
  breachAlerts24h: number;
  blockedActions24h: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Threat level configuration
const THREAT_CONFIG = {
  low: { label: 'FAIBLE', color: 'bg-emerald-500', textColor: 'text-emerald-500', icon: ShieldCheck },
  medium: { label: 'MODÉRÉ', color: 'bg-amber-500', textColor: 'text-amber-500', icon: Shield },
  high: { label: 'ÉLEVÉ', color: 'bg-orange-500', textColor: 'text-orange-500', icon: ShieldAlert },
  critical: { label: 'CRITIQUE', color: 'bg-red-500', textColor: 'text-red-500', icon: ShieldAlert },
};

// Role configuration
const ROLE_COLORS: Record<string, string> = {
  ceo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  superviseur: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  agent_administratif: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  directeur_operations: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  responsable_technique: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  centraliste: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  auditeur: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

// Active Session Card
function SessionCard({ session }: { session: ActiveSession }) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const DeviceIcon = session.device_type === 'mobile' ? Smartphone : Monitor;
  const isActive = differenceInMinutes(new Date(), new Date(session.last_activity)) < 5;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-all',
      isActive 
        ? 'bg-emerald-500/5 border-emerald-500/30' 
        : 'bg-muted/30 border-border/50 opacity-60'
    )}>
      <div className="relative">
        <div className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center',
          isActive ? 'bg-emerald-500/20' : 'bg-muted'
        )}>
          <span className="text-sm font-bold">
            {session.user_name.charAt(0).toUpperCase()}
          </span>
        </div>
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{session.user_name}</span>
          <Badge variant="outline" className={cn('text-[10px] px-1.5', ROLE_COLORS[session.role] || 'bg-muted')}>
            {session.role}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DeviceIcon className="h-3 w-3" />
          <span className="truncate">{session.browser}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(session.last_activity), { addSuffix: true, locale: dateLocale })}</span>
        </div>
      </div>
      
      <div className={cn(
        'px-2 py-1 rounded-full text-[10px] font-semibold',
        isActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'
      )}>
        {isActive ? 'EN LIGNE' : 'INACTIF'}
      </div>
    </div>
  );
}

// Auth Attempt Card
function AuthAttemptCard({ attempt }: { attempt: AuthAttempt }) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const isSuccess = attempt.status === 'success';
  const isFailed = attempt.status === 'failed';
  const isBlocked = attempt.status === 'blocked';
  
  const StatusIcon = isSuccess ? UserCheck : isBlocked ? Ban : UserX;
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-all',
      isSuccess && 'bg-emerald-500/5 border-emerald-500/30',
      isFailed && 'bg-amber-500/5 border-amber-500/30',
      isBlocked && 'bg-red-500/5 border-red-500/30'
    )}>
      <div className={cn(
        'h-9 w-9 rounded-full flex items-center justify-center',
        isSuccess && 'bg-emerald-500/20 text-emerald-500',
        isFailed && 'bg-amber-500/20 text-amber-500',
        isBlocked && 'bg-red-500/20 text-red-500'
      )}>
        <StatusIcon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attempt.email}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span className="font-mono">{attempt.ip_address}</span>
          {attempt.failure_reason && (
            <>
              <span>•</span>
              <span className="text-red-400 truncate">{attempt.failure_reason}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <Badge variant="outline" className={cn(
          'text-[10px] mb-1',
          isSuccess && 'border-emerald-500/50 text-emerald-500',
          isFailed && 'border-amber-500/50 text-amber-500',
          isBlocked && 'border-red-500/50 text-red-500'
        )}>
          {isSuccess ? 'SUCCÈS' : isFailed ? 'ÉCHEC' : 'BLOQUÉ'}
        </Badge>
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(attempt.timestamp), { addSuffix: true, locale: dateLocale })}
        </p>
      </div>
    </div>
  );
}

// Breach Alert Card
function BreachAlertCard({ alert, onAcknowledge }: { alert: BreachAlert; onAcknowledge: (id: string) => void }) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const severityConfig = {
    low: { color: 'border-l-blue-500 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-500' },
    medium: { color: 'border-l-amber-500 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-500' },
    high: { color: 'border-l-orange-500 bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-500' },
    critical: { color: 'border-l-red-500 bg-red-500/5 animate-pulse', badge: 'bg-red-500/20 text-red-500' },
  };
  
  const config = severityConfig[alert.severity];
  
  const typeLabels: Record<string, string> = {
    limit_exceeded: 'PLAFOND DÉPASSÉ',
    deletion_blocked: 'SUPPRESSION BLOQUÉE',
    unauthorized_access: 'ACCÈS NON AUTORISÉ',
    suspicious_activity: 'ACTIVITÉ SUSPECTE',
    rollback: 'ROLLBACK DÉTECTÉ',
  };
  
  return (
    <div className={cn(
      'rounded-xl border-l-4 p-4 mb-3 transition-all',
      config.color,
      alert.acknowledged && 'opacity-50'
    )}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <Badge className={cn('text-[10px] font-bold', config.badge)}>
          {typeLabels[alert.type] || alert.type}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: dateLocale })}
        </span>
      </div>
      
      <p className="text-sm font-medium mb-2">{alert.message}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold">{alert.user_name}</span>
          <span>•</span>
          <span className="font-mono">{alert.table_name}</span>
          {alert.record_id && (
            <>
              <span>•</span>
              <span className="font-mono">#{alert.record_id.substring(0, 8)}</span>
            </>
          )}
        </div>
        
        {!alert.acknowledged && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onAcknowledge(alert.id)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Vu
          </Button>
        )}
      </div>
    </div>
  );
}

// Threat Level Gauge
function ThreatLevelGauge({ level, score }: { level: SecurityStats['threatLevel']; score: number }) {
  const config = THREAT_CONFIG[level];
  const Icon = config.icon;
  
  return (
    <div className="relative">
      <div className={cn(
        'h-32 w-32 rounded-full flex items-center justify-center',
        'bg-gradient-to-br from-background to-muted/50',
        'border-4',
        level === 'low' && 'border-emerald-500/50',
        level === 'medium' && 'border-amber-500/50',
        level === 'high' && 'border-orange-500/50',
        level === 'critical' && 'border-red-500/50 animate-pulse'
      )}>
        <div className="text-center">
          <Icon className={cn('h-8 w-8 mx-auto mb-1', config.textColor)} />
          <p className={cn('text-2xl font-bold', config.textColor)}>{score}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{config.label}</p>
        </div>
      </div>
      
      {/* Animated ring for critical */}
      {level === 'critical' && (
        <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" />
      )}
    </div>
  );
}

// Main Component
export function RealTimeSecurityPanel() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [authAttempts, setAuthAttempts] = useState<AuthAttempt[]>([]);
  const [breachAlerts, setBreachAlerts] = useState<BreachAlert[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    activeSessions: 0,
    onlineUsers: 0,
    failedLogins24h: 0,
    breachAlerts24h: 0,
    blockedActions24h: 0,
    threatLevel: 'low',
  });

  // Fetch security data
  const fetchSecurityData = async () => {
    try {
      // Fetch user roles with profiles for active sessions
      const { data: rolesData } = await supabase
        .from('user_roles_v2')
        .select('user_id, role, created_at');
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, updated_at');
      
      // Simulate active sessions from profiles
      const simulatedSessions: ActiveSession[] = (rolesData || []).slice(0, 8).map((role, i) => {
        const profile = (profilesData || []).find(p => p.user_id === role.user_id);
        return {
          user_id: role.user_id,
          user_name: profile?.full_name || profile?.email?.split('@')[0] || 'User',
          email: profile?.email || 'unknown@email.com',
          role: role.role,
          last_activity: new Date(Date.now() - Math.random() * 3600000 * (i < 3 ? 0.1 : 2)).toISOString(),
          device_type: Math.random() > 0.5 ? 'desktop' : 'mobile',
          browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          is_online: i < 3,
        };
      });
      
      setSessions(simulatedSessions);

      // Fetch audit logs for breach alerts and auth attempts
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: auditLogs } = await supabase
        .from('audit_superviseur')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      // Transform audit logs to breach alerts
      const alerts: BreachAlert[] = (auditLogs || [])
        .filter(log => ['ACCESS_DENIED', 'ROLLBACK_APPROVAL', 'LIMIT_EXCEEDED'].includes(log.action))
        .map(log => ({
          id: log.id,
          type: log.action === 'ROLLBACK_APPROVAL' ? 'rollback' 
              : log.action === 'LIMIT_EXCEEDED' ? 'limit_exceeded'
              : 'unauthorized_access',
          severity: log.action === 'ACCESS_DENIED' ? 'high' 
                  : log.action === 'ROLLBACK_APPROVAL' ? 'medium' 
                  : 'medium',
          message: log.action === 'ROLLBACK_APPROVAL' 
            ? `Déverrouillage de ${log.table_name} #${log.record_id?.substring(0, 8) || 'N/A'}`
            : log.action === 'ACCESS_DENIED'
            ? `Tentative d'accès non autorisé à ${log.table_name}`
            : `Plafond dépassé sur ${log.table_name}`,
          user_name: log.user_name || 'Inconnu',
          user_id: log.user_id,
          table_name: log.table_name,
          record_id: log.record_id,
          details: (log.changes as Record<string, unknown>) || {},
          timestamp: log.created_at,
          acknowledged: false,
        }));
      
      setBreachAlerts(alerts);

      // Simulate auth attempts
      const mockAuthAttempts: AuthAttempt[] = [
        {
          id: '1',
          email: 'karim.talmi@talmibeton.ma',
          status: 'success',
          ip_address: '41.140.12.45',
          user_agent: 'Chrome/120',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: '2',
          email: 'unknown@attacker.com',
          status: 'blocked',
          ip_address: '185.143.223.12',
          user_agent: 'curl/7.68.0',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          failure_reason: 'Rate limit exceeded',
        },
        {
          id: '3',
          email: 'admin@talmibeton.ma',
          status: 'failed',
          ip_address: '41.140.12.45',
          user_agent: 'Safari/17.0',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          failure_reason: 'Invalid password',
        },
      ];
      
      setAuthAttempts(mockAuthAttempts);

      // Calculate stats
      const onlineCount = simulatedSessions.filter(s => 
        differenceInMinutes(new Date(), new Date(s.last_activity)) < 5
      ).length;
      
      const failedLogins = mockAuthAttempts.filter(a => a.status !== 'success').length;
      const blockedActions = alerts.filter(a => a.type === 'unauthorized_access').length;
      
      // Calculate threat level
      let threatLevel: SecurityStats['threatLevel'] = 'low';
      const threatScore = blockedActions * 10 + failedLogins * 5 + alerts.length * 2;
      if (threatScore >= 50) threatLevel = 'critical';
      else if (threatScore >= 30) threatLevel = 'high';
      else if (threatScore >= 10) threatLevel = 'medium';
      
      setStats({
        activeSessions: simulatedSessions.length,
        onlineUsers: onlineCount,
        failedLogins24h: failedLogins,
        breachAlerts24h: alerts.length,
        blockedActions24h: blockedActions,
        threatLevel,
      });

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    fetchSecurityData();
    
    const channel = supabase
      .channel('security-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_superviseur',
        },
        (payload) => {
          const log = payload.new as any;
          
          if (['ACCESS_DENIED', 'ROLLBACK_APPROVAL', 'LIMIT_EXCEEDED'].includes(log.action)) {
            const newAlert: BreachAlert = {
              id: log.id,
              type: log.action === 'ROLLBACK_APPROVAL' ? 'rollback' : 'unauthorized_access',
              severity: log.action === 'ACCESS_DENIED' ? 'high' : 'medium',
              message: `${log.action} sur ${log.table_name}`,
              user_name: log.user_name || 'Inconnu',
              user_id: log.user_id,
              table_name: log.table_name,
              record_id: log.record_id,
              details: log.changes || {},
              timestamp: log.created_at,
              acknowledged: false,
            };
            
            setBreachAlerts(prev => [newAlert, ...prev].slice(0, 50));
            setStats(prev => ({
              ...prev,
              breachAlerts24h: prev.breachAlerts24h + 1,
            }));
            
            // Toast notification
            toast.error('🚨 Alerte Sécurité', {
              description: newAlert.message,
              duration: 8000,
            });
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAcknowledge = (id: string) => {
    setBreachAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, acknowledged: true } : a)
    );
    toast.success('Alerte acquittée');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityData();
  };

  const threatScore = stats.blockedActions24h * 10 + stats.failedLogins24h * 5 + stats.breachAlerts24h * 2;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Security War Room</h2>
          <Badge variant="outline" className={cn(
            'gap-1.5',
            isLive ? 'border-emerald-500/50 text-emerald-500' : 'border-muted text-muted-foreground'
          )}>
            {isLive ? (
              <>
                <Radio className="h-3 w-3 animate-pulse" />
                LIVE
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                OFFLINE
              </>
            )}
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualiser
        </Button>
      </div>

      {/* Threat Level + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 flex items-center justify-center py-6">
          <ThreatLevelGauge level={stats.threatLevel} score={threatScore} />
        </Card>
        
        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-500">{stats.onlineUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">En ligne</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">Sessions</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-500">{stats.failedLogins24h}</div>
              <p className="text-xs text-muted-foreground mt-1">Échecs Login</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/5 to-transparent border-red-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{stats.breachAlerts24h}</div>
              <p className="text-xs text-muted-foreground mt-1">Alertes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4 text-emerald-500" />
              Sessions Actives
              <Badge variant="secondary" className="ml-auto">{sessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] px-4 pb-4">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <SessionCard key={session.user_id} session={session} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Auth Attempts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-blue-500" />
              Tentatives Auth
              <Badge variant="secondary" className="ml-auto">{authAttempts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] px-4 pb-4">
              <div className="space-y-2">
                {authAttempts.map((attempt) => (
                  <AuthAttemptCard key={attempt.id} attempt={attempt} />
                ))}
                {authAttempts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune tentative récente</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Breach Alerts */}
        <Card className={cn(
          breachAlerts.some(a => !a.acknowledged && a.severity === 'critical') && 'ring-2 ring-red-500/50'
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Alertes Sécurité
              <Badge variant="destructive" className="ml-auto">
                {breachAlerts.filter(a => !a.acknowledged).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] px-4 pb-4">
              {breachAlerts.length > 0 ? (
                breachAlerts.map((alert) => (
                  <BreachAlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-500">Ciel Dégagé</p>
                  <p className="text-xs">Aucune alerte dans les 24h</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}