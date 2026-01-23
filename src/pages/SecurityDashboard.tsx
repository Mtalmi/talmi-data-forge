import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Ban,
  RefreshCw,
  Users,
  Activity,
  Clock,
  Search,
  Eye,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  FileWarning,
  Package,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Types
interface AuditLogEntry {
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
  } | null;
  created_at: string;
}

interface UserWithRole {
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface SecurityMetrics {
  totalRollbacks: number;
  pendingQualityChecks: number;
  blockedActions: number;
  totalAuditLogs: number;
}

// Action styling configurations
const ACTION_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ElementType;
}> = {
  ROLLBACK_APPROVAL: { 
    label: 'Déverrouillage Devis', 
    color: 'text-red-500', 
    bgColor: 'bg-red-500/10 border-red-500/30',
    icon: Unlock,
  },
  APPROVE_DEVIS: { 
    label: 'Approbation Devis', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    icon: CheckCircle,
  },
  STOCK_FINALIZED: { 
    label: 'Stock Finalisé', 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10 border-green-500/30',
    icon: Package,
  },
  PRICE_CHANGE: { 
    label: 'Modification Prix', 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    icon: FileWarning,
  },
  ACCESS_DENIED: { 
    label: 'Accès Refusé', 
    color: 'text-red-600', 
    bgColor: 'bg-red-600/10 border-red-600/30',
    icon: Ban,
  },
  default: { 
    label: 'Action', 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted/30 border-muted',
    icon: Activity,
  },
};

// Role display configurations
const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  ceo: { label: 'CEO', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  superviseur: { label: 'Superviseur', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  agent_administratif: { label: 'Agent Admin', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  directeur_operations: { label: 'Dir. Opérations', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  responsable_technique: { label: 'Resp. Technique', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  centraliste: { label: 'Centraliste', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  commercial: { label: 'Commercial', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  accounting: { label: 'Comptabilité', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  auditeur: { label: 'Auditeur', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  operator: { label: 'Opérateur', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export default function SecurityDashboard() {
  const { isCeo, isSuperviseur, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalRollbacks: 0,
    pendingQualityChecks: 0,
    blockedActions: 0,
    totalAuditLogs: 0,
  });
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch all security data
  const fetchSecurityData = useCallback(async () => {
    try {
      // Fetch audit logs
      const { data: logs, error: logsError } = await supabase
        .from('audit_superviseur')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setAuditLogs((logs || []) as AuditLogEntry[]);

      // Calculate metrics from audit logs
      const rollbacks = (logs || []).filter(l => l.action === 'ROLLBACK_APPROVAL').length;
      const blocked = (logs || []).filter(l => l.action === 'ACCESS_DENIED').length;

      // Fetch pending stock receptions (waiting for photo/finalization)
      const { count: pendingCount } = await supabase
        .from('stock_receptions_pending' as any)
        .select('*', { count: 'exact', head: true })
        .eq('finalized', false);

      // Fetch users with roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles_v2')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Fetch profiles for user names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email, full_name');

      // Merge roles with profiles
      const usersWithRoles: UserWithRole[] = (rolesData || []).map(role => {
        const profile = (profilesData || []).find(p => p.user_id === role.user_id);
        return {
          user_id: role.user_id,
          role: role.role,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          created_at: role.created_at,
        };
      });

      setUsers(usersWithRoles);
      setMetrics({
        totalRollbacks: rollbacks,
        pendingQualityChecks: pendingCount || 0,
        blockedActions: blocked,
        totalAuditLogs: (logs || []).length,
      });

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityData();
  };

  // Filter audit logs by search
  const filteredLogs = auditLogs.filter(log => {
    if (!searchFilter) return true;
    const search = searchFilter.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.record_id?.toLowerCase().includes(search) ||
      log.table_name.toLowerCase().includes(search)
    );
  });

  // ACCESS CONTROL - CEO/Superviseur ONLY
  if (!isCeo && !isSuperviseur) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Card className="max-w-md border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="pt-8 pb-8 text-center">
              <ShieldAlert className="h-20 w-20 text-destructive/60 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3 text-destructive">Accès Refusé</h2>
              <p className="text-muted-foreground text-lg">
                Ce tableau de bord est exclusivement réservé au <strong>CEO</strong> et au <strong>Superviseur</strong>.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Zone de Commandement Sécurisée</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord Sécurité</h1>
                <p className="text-sm text-muted-foreground">
                  Centre de Commandement — Vue Forensique
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-primary/5">
              <Eye className="h-3 w-3" />
              Mode: {isCeo ? 'CEO' : 'Superviseur'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Rollbacks */}
          <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Corrections Totales
                  </p>
                  {loading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-red-500 mt-1">
                      {metrics.totalRollbacks}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <Unlock className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Devis déverrouillés après approbation
              </p>
            </CardContent>
          </Card>

          {/* Pending Quality Checks */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Contrôles en Attente
                  </p>
                  {loading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-amber-500 mt-1">
                      {metrics.pendingQualityChecks}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-amber-500/10">
                  <Camera className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Réceptions stock en attente de photo
              </p>
            </CardContent>
          </Card>

          {/* Blocked Actions */}
          <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Actions Bloquées
                  </p>
                  {loading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-destructive mt-1">
                      {metrics.blockedActions}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <Ban className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Tentatives d'accès refusées
              </p>
            </CardContent>
          </Card>

          {/* Total Audit Logs */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Logs d'Audit
                  </p>
                  {loading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-primary mt-1">
                      {metrics.totalAuditLogs}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Entrées dans le journal d'audit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Forensic Feed + User Access */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forensic Feed (2 cols) */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Flux Forensique</CardTitle>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
              </div>
              <CardDescription>
                Journal d'audit chronologique — Actions sensibles en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune entrée d'audit trouvée</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {filteredLogs.map((log) => {
                      const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.default;
                      const Icon = config.icon;
                      const isRollback = log.action === 'ROLLBACK_APPROVAL';
                      const isSuccess = log.action === 'STOCK_FINALIZED' || log.action === 'APPROVE_DEVIS';

                      return (
                        <div
                          key={log.id}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            config.bgColor,
                            isRollback && "ring-1 ring-red-500/20"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-full shrink-0",
                              isRollback ? "bg-red-500/20" : isSuccess ? "bg-green-500/20" : "bg-muted"
                            )}>
                              <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={cn("font-medium", config.color)}>
                                    {config.label}
                                  </Badge>
                                  <span className="text-sm font-semibold">
                                    {log.user_name || 'Utilisateur inconnu'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(log.created_at), { 
                                    addSuffix: true, 
                                    locale: fr 
                                  })}
                                </div>
                              </div>
                              
                              <div className="mt-1.5 text-sm text-muted-foreground">
                                <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                                  {log.table_name}
                                </span>
                                {log.record_id && (
                                  <span className="ml-2 font-mono text-xs">
                                    #{log.record_id}
                                  </span>
                                )}
                              </div>

                              {/* Rollback reason display */}
                              {isRollback && log.changes?.reason && (
                                <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/20">
                                  <p className="text-sm italic text-red-400">
                                    "{log.changes.reason}"
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Rollback #{log.changes.rollback_number} par {log.changes.cancelled_by_role?.toUpperCase()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* User Access Audit (1 col) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Accès Utilisateurs</CardTitle>
              </div>
              <CardDescription>
                Rôles actuels du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {users.map((user) => {
                      const roleConfig = ROLE_CONFIG[user.role] || { 
                        label: user.role, 
                        color: 'bg-gray-500/20 text-gray-400' 
                      };

                      return (
                        <div
                          key={user.user_id}
                          className="p-3 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {user.full_name || 'Sans nom'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email || 'email@inconnu'}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("shrink-0 text-xs", roleConfig.color)}
                            >
                              {roleConfig.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-4 border-t">
          <Lock className="h-3 w-3" />
          <span>Données chiffrées • Audit immuable • Accès journalisé</span>
          <span className="mx-2">|</span>
          <span>Dernière actualisation: {format(new Date(), 'HH:mm:ss', { locale: fr })}</span>
        </div>
      </div>
    </MainLayout>
  );
}
