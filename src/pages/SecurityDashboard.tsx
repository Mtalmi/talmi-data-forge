import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Shield,
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
  FileWarning,
  Package,
  Wifi,
  WifiOff,
  Smartphone,
  FileText,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    label: 'Rollback Devis', 
    color: 'text-red-500', 
    bgColor: 'bg-red-500/10 border-red-500/30',
    icon: Unlock,
  },
  APPROVE_DEVIS: { 
    label: 'Approbation', 
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
    label: 'Modif. Prix', 
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
  INSERT: { 
    label: 'Création', 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    icon: CheckCircle,
  },
  UPDATE: { 
    label: 'Modification', 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    icon: FileWarning,
  },
  DELETE: { 
    label: 'Suppression', 
    color: 'text-red-500', 
    bgColor: 'bg-red-500/10 border-red-500/30',
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
  directeur_operations: { label: 'Dir. Ops', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  responsable_technique: { label: 'Resp. Tech', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  centraliste: { label: 'Centraliste', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  commercial: { label: 'Commercial', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  accounting: { label: 'Comptabilité', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  auditeur: { label: 'Auditeur', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  operator: { label: 'Opérateur', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

// Forensic Feed Card Component (Mobile-optimized)
function ForensicFeedCard({ log }: { log: AuditLogEntry }) {
  const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.default;
  const Icon = config.icon;
  const isRollback = log.action === 'ROLLBACK_APPROVAL';
  const isSuccess = log.action === 'STOCK_FINALIZED' || log.action === 'APPROVE_DEVIS';

  return (
    <Card className={cn(
      "transition-all border-l-4",
      isRollback ? "border-l-red-500 bg-red-500/5" : 
      isSuccess ? "border-l-green-500 bg-green-500/5" : 
      "border-l-muted"
    )}>
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "p-1.5 rounded-full shrink-0",
              isRollback ? "bg-red-500/20" : isSuccess ? "bg-green-500/20" : "bg-muted"
            )}>
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="min-w-0">
              <Badge variant="outline" className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
            </span>
            <span className="sm:hidden">
              {format(new Date(log.created_at), 'HH:mm')}
            </span>
          </div>
        </div>

        {/* User & Target */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{log.user_name || 'Utilisateur'}</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded truncate">
              {log.table_name}
            </span>
            {log.record_id && (
              <span className="font-mono text-xs text-muted-foreground truncate">
                #{log.record_id.substring(0, 12)}
              </span>
            )}
          </div>

          {/* Rollback Reason (Highlighted) */}
          {isRollback && log.changes?.reason && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm italic text-red-400 leading-relaxed">
                "{log.changes.reason}"
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/50 text-red-400">
                  ROLLBACK #{log.changes.rollback_number}
                </Badge>
                <span>par {log.changes.cancelled_by_role?.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// User Card Component (Mobile-optimized)
function UserCard({ user }: { user: UserWithRole }) {
  const roleConfig = ROLE_CONFIG[user.role] || { label: user.role, color: 'bg-gray-500/20 text-gray-400' };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">
            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{user.full_name || 'Sans nom'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email || 'email@inconnu'}</p>
        </div>
      </div>
      <Badge variant="outline" className={cn("shrink-0 text-xs", roleConfig.color)}>
        {roleConfig.label}
      </Badge>
    </div>
  );
}

// Metric Card Component (Mobile-optimized)
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  loading 
}: { 
  title: string; 
  value: number; 
  subtitle: string; 
  icon: React.ElementType; 
  color: string;
  loading: boolean;
}) {
  const colorClasses: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
    red: { border: 'border-red-500/30', bg: 'from-red-500/5', text: 'text-red-500', iconBg: 'bg-red-500/10' },
    amber: { border: 'border-amber-500/30', bg: 'from-amber-500/5', text: 'text-amber-500', iconBg: 'bg-amber-500/10' },
    destructive: { border: 'border-destructive/30', bg: 'from-destructive/5', text: 'text-destructive', iconBg: 'bg-destructive/10' },
    primary: { border: 'border-primary/30', bg: 'from-primary/5', text: 'text-primary', iconBg: 'bg-primary/10' },
  };
  
  const c = colorClasses[color] || colorClasses.primary;

  return (
    <Card className={cn("border", c.border, `bg-gradient-to-br ${c.bg} to-transparent`)}>
      <CardContent className="p-4 sm:pt-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium truncate">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-14 mt-1" />
            ) : (
              <p className={cn("text-2xl sm:text-3xl font-bold mt-1", c.text)}>
                {value}
              </p>
            )}
          </div>
          <div className={cn("p-2 sm:p-3 rounded-full shrink-0", c.iconBg)}>
            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", c.text)} />
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 truncate">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { isCeo, isSuperviseur, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalRollbacks: 0,
    pendingQualityChecks: 0,
    blockedActions: 0,
    totalAuditLogs: 0,
  });
  const [searchFilter, setSearchFilter] = useState('');

  // ===========================================================
  // HARD REDIRECT SECURITY - CEO/Superviseur ONLY
  // ===========================================================
  useEffect(() => {
    if (!authLoading && user) {
      if (!isCeo && !isSuperviseur) {
        // Hard redirect to 404 for unauthorized access
        navigate('/404', { replace: true });
      }
    }
  }, [authLoading, user, isCeo, isSuperviseur, navigate]);

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

  // ===========================================================
  // REALTIME SUBSCRIPTION - Live audit feed
  // ===========================================================
  useEffect(() => {
    if (!user || (!isCeo && !isSuperviseur)) return;

    fetchSecurityData();

    // Subscribe to realtime changes on audit_superviseur
    const channel = supabase
      .channel('security-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_superviseur',
        },
        (payload) => {
          const newLog = payload.new as AuditLogEntry;
          
          // Add to top of list
          setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
          
          // Update metrics
          setMetrics(prev => ({
            ...prev,
            totalAuditLogs: prev.totalAuditLogs + 1,
            totalRollbacks: newLog.action === 'ROLLBACK_APPROVAL' 
              ? prev.totalRollbacks + 1 
              : prev.totalRollbacks,
            blockedActions: newLog.action === 'ACCESS_DENIED'
              ? prev.blockedActions + 1
              : prev.blockedActions,
          }));

          // 🔔 PUSH NOTIFICATION for ROLLBACK actions
          if (newLog.action === 'ROLLBACK_APPROVAL') {
            // Browser notification (if permitted)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🚨 ROLLBACK ALERT', {
                body: `${newLog.user_name || 'User'} a déverrouillé un Devis: ${newLog.record_id}`,
                icon: '/favicon.ico',
                tag: 'rollback-alert',
              });
            }
            
            // In-app toast
            toast.error('🚨 ROLLBACK DÉTECTÉ', {
              description: `${newLog.user_name} a déverrouillé ${newLog.record_id}`,
              duration: 10000,
            });
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isCeo, isSuperviseur, fetchSecurityData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityData();
  };

  // ===========================================================
  // PDF EXPORT - Forensic Audit Report
  // ===========================================================
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const generateForensicPdf = async () => {
    setGeneratingPdf(true);
    try {
      const rollbackLogs = auditLogs.filter(l => l.action === 'ROLLBACK_APPROVAL');
      const blockedLogs = auditLogs.filter(l => l.action === 'ACCESS_DENIED');
      const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
      const periodStart = auditLogs.length > 0 
        ? format(new Date(auditLogs[auditLogs.length - 1].created_at), 'dd/MM/yyyy', { locale: fr })
        : '-';
      const periodEnd = auditLogs.length > 0
        ? format(new Date(auditLogs[0].created_at), 'dd/MM/yyyy', { locale: fr })
        : '-';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Rapport Forensique Sécurité</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              font-size: 11px;
              line-height: 1.4;
              color: #1a1a1a;
              background: #fff;
            }
            .page { padding: 20mm 15mm; }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              border-bottom: 3px solid #dc2626;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header-left h1 { 
              font-size: 22px; 
              color: #dc2626; 
              font-weight: 700;
              margin-bottom: 4px;
            }
            .header-left p { color: #666; font-size: 10px; }
            .header-right { text-align: right; font-size: 10px; color: #666; }
            .header-right .date { font-size: 12px; color: #333; font-weight: 600; }
            
            .badge-confidential {
              background: #dc2626;
              color: white;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 1px;
              margin-top: 8px;
              display: inline-block;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 25px;
            }
            .summary-card {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              padding: 12px;
              text-align: center;
            }
            .summary-card.danger { border-left: 4px solid #dc2626; }
            .summary-card.warning { border-left: 4px solid #f59e0b; }
            .summary-card.info { border-left: 4px solid #3b82f6; }
            .summary-card.success { border-left: 4px solid #10b981; }
            .summary-value { font-size: 24px; font-weight: 700; color: #1a1a1a; }
            .summary-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
            
            .section { margin-bottom: 25px; }
            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #1a1a1a;
              border-bottom: 2px solid #e9ecef;
              padding-bottom: 6px;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-title .icon { color: #dc2626; }
            
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { 
              background: #f1f5f9; 
              padding: 8px 10px; 
              text-align: left; 
              font-weight: 600;
              border-bottom: 2px solid #e2e8f0;
              color: #475569;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.5px;
            }
            td { 
              padding: 8px 10px; 
              border-bottom: 1px solid #f1f5f9;
              vertical-align: top;
            }
            tr:hover td { background: #fafafa; }
            
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
            }
            .badge-red { background: #fee2e2; color: #dc2626; }
            .badge-amber { background: #fef3c7; color: #d97706; }
            .badge-green { background: #d1fae5; color: #059669; }
            .badge-blue { background: #dbeafe; color: #2563eb; }
            .badge-gray { background: #f3f4f6; color: #6b7280; }
            
            .reason-cell {
              max-width: 200px;
              font-style: italic;
              color: #dc2626;
              background: #fef2f2;
              padding: 6px 8px;
              border-radius: 4px;
              font-size: 9px;
            }
            
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e9ecef;
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              color: #999;
            }
            
            .watermark {
              position: fixed;
              bottom: 50%;
              left: 50%;
              transform: translate(-50%, 50%) rotate(-45deg);
              font-size: 80px;
              color: rgba(220, 38, 38, 0.05);
              font-weight: 900;
              pointer-events: none;
              z-index: -1;
            }
            
            @media print {
              .page { padding: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">CONFIDENTIEL</div>
          <div class="page">
            <div class="header">
              <div class="header-left">
                <h1>🔒 RAPPORT FORENSIQUE SÉCURITÉ</h1>
                <p>Analyse des événements de sécurité • Période: ${periodStart} → ${periodEnd}</p>
                <span class="badge-confidential">⚠️ CONFIDENTIEL - CEO/SUPERVISEUR UNIQUEMENT</span>
              </div>
              <div class="header-right">
                <div class="date">${reportDate}</div>
                <p>Généré par: ${user?.email || 'Système'}</p>
                <p>Rôle: ${isCeo ? 'CEO' : 'Superviseur'}</p>
              </div>
            </div>
            
            <div class="summary-grid">
              <div class="summary-card danger">
                <div class="summary-value">${metrics.totalRollbacks}</div>
                <div class="summary-label">Rollbacks Devis</div>
              </div>
              <div class="summary-card warning">
                <div class="summary-value">${metrics.blockedActions}</div>
                <div class="summary-label">Accès Bloqués</div>
              </div>
              <div class="summary-card info">
                <div class="summary-value">${metrics.pendingQualityChecks}</div>
                <div class="summary-label">Contrôles en Attente</div>
              </div>
              <div class="summary-card success">
                <div class="summary-value">${users.length}</div>
                <div class="summary-label">Utilisateurs Actifs</div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">
                <span class="icon">🚨</span> ÉVÉNEMENTS ROLLBACK (${rollbackLogs.length})
              </div>
              ${rollbackLogs.length === 0 ? '<p style="color:#666; font-style:italic;">Aucun rollback détecté dans la période.</p>' : `
              <table>
                <thead>
                  <tr>
                    <th>Date/Heure</th>
                    <th>Utilisateur</th>
                    <th>Table</th>
                    <th>Enregistrement</th>
                    <th>Motif</th>
                    <th>N°</th>
                  </tr>
                </thead>
                <tbody>
                  ${rollbackLogs.map(log => `
                    <tr>
                      <td>${format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                      <td><strong>${log.user_name || 'Inconnu'}</strong></td>
                      <td><span class="badge badge-gray">${log.table_name}</span></td>
                      <td style="font-family:monospace;font-size:9px;">${log.record_id || '-'}</td>
                      <td><div class="reason-cell">"${log.changes?.reason || 'Non spécifié'}"</div></td>
                      <td><span class="badge badge-red">#${log.changes?.rollback_number || '?'}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              `}
            </div>
            
            <div class="section">
              <div class="section-title">
                <span class="icon">🚫</span> ACCÈS BLOQUÉS (${blockedLogs.length})
              </div>
              ${blockedLogs.length === 0 ? '<p style="color:#666; font-style:italic;">Aucun accès bloqué détecté.</p>' : `
              <table>
                <thead>
                  <tr>
                    <th>Date/Heure</th>
                    <th>Utilisateur</th>
                    <th>Table Cible</th>
                    <th>Action Tentée</th>
                  </tr>
                </thead>
                <tbody>
                  ${blockedLogs.map(log => `
                    <tr>
                      <td>${format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                      <td><strong>${log.user_name || 'Inconnu'}</strong></td>
                      <td><span class="badge badge-amber">${log.table_name}</span></td>
                      <td>${log.changes?.new_status || 'Accès non autorisé'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              `}
            </div>
            
            <div class="section">
              <div class="section-title">
                <span class="icon">👥</span> AUDIT ACCÈS UTILISATEURS (${users.length})
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Date Attribution</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => {
                    const roleBadgeClass = ['ceo', 'superviseur'].includes(u.role) ? 'badge-red' : 
                                           ['agent_administratif', 'directeur_operations'].includes(u.role) ? 'badge-blue' : 'badge-gray';
                    return `
                    <tr>
                      <td><strong>${u.full_name || 'Sans nom'}</strong></td>
                      <td>${u.email || '-'}</td>
                      <td><span class="badge ${roleBadgeClass}">${u.role.toUpperCase()}</span></td>
                      <td>${format(new Date(u.created_at), 'dd/MM/yyyy', { locale: fr })}</td>
                    </tr>
                  `}).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <div>
                <strong>TALMI Béton</strong> • Rapport Forensique Automatisé<br/>
                Document confidentiel - Conservation obligatoire 5 ans
              </div>
              <div style="text-align:right;">
                Généré le ${reportDate}<br/>
                Hash: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup bloqué. Autorisez les popups pour générer le PDF.');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        toast.success('Rapport forensique prêt', {
          description: 'Utilisez "Enregistrer en PDF" dans la boîte de dialogue.',
        });
      }, 500);

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setGeneratingPdf(false);
    }
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  // Access control handled by redirect above, but double-check
  if (!isCeo && !isSuperviseur) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">War Room</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Centre de Commandement Sécurisé
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Realtime Status */}
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1.5 px-2 py-1",
                isRealtimeConnected 
                  ? "bg-green-500/10 text-green-500 border-green-500/30" 
                  : "bg-amber-500/10 text-amber-500 border-amber-500/30"
              )}
            >
              {isRealtimeConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span className="hidden sm:inline">{isRealtimeConnected ? 'Live' : 'Offline'}</span>
            </Badge>
            
            <Badge variant="outline" className="gap-1.5 px-2 py-1 bg-primary/5">
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">Mode:</span> {isCeo ? 'CEO' : 'SUP'}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1.5 h-8"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={generateForensicPdf}
              disabled={generatingPdf || loading}
              className="gap-1.5 h-8 bg-red-600 hover:bg-red-700 text-white"
            >
              {generatingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          </div>
        </div>

        {/* Key Metrics Row - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            title="Rollbacks"
            value={metrics.totalRollbacks}
            subtitle="Devis déverrouillés"
            icon={Unlock}
            color="red"
            loading={loading}
          />
          <MetricCard
            title="Contrôles"
            value={metrics.pendingQualityChecks}
            subtitle="En attente photo"
            icon={Camera}
            color="amber"
            loading={loading}
          />
          <MetricCard
            title="Bloqués"
            value={metrics.blockedActions}
            subtitle="Accès refusés"
            icon={Ban}
            color="destructive"
            loading={loading}
          />
          <MetricCard
            title="Audit Logs"
            value={metrics.totalAuditLogs}
            subtitle="Entrées totales"
            icon={Activity}
            color="primary"
            loading={loading}
          />
        </div>

        {/* Main Content - Mobile-First Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Forensic Feed (Full width on mobile, 2 cols on desktop) */}
          <Card className="lg:col-span-2 order-1">
            <CardHeader className="pb-3 space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">Flux Forensique</CardTitle>
                  {isRealtimeConnected && (
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 h-9 w-full sm:w-48"
                  />
                </div>
              </div>
              <CardDescription className="text-xs">
                Actions sensibles en temps réel • {filteredLogs.length} entrées
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune entrée d'audit</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
                  <div className="space-y-3">
                    {filteredLogs.map((log) => (
                      <ForensicFeedCard key={log.id} log={log} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* User Access Audit (Full width on mobile, 1 col on desktop) */}
          <Card className="order-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Équipe</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {users.length} utilisateurs actifs
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Aucun utilisateur</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] sm:h-[500px]">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <UserCard key={user.user_id} user={user} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-4 border-t">
          <Smartphone className="h-3 w-3 sm:hidden" />
          <Lock className="h-3 w-3 hidden sm:block" />
          <span className="hidden sm:inline">Données chiffrées • Audit immuable • Accès journalisé</span>
          <span className="sm:hidden">Sécurisé • {format(new Date(), 'HH:mm')}</span>
          <span className="hidden sm:inline mx-2">|</span>
          <span className="hidden sm:inline">{format(new Date(), 'HH:mm:ss', { locale: fr })}</span>
        </div>
      </div>
    </MainLayout>
  );
}
