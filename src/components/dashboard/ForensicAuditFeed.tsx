import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileSearch,
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  DollarSign,
  FlaskConical,
  FileText,
  ArrowRight,
  Shield,
  Trash2,
  Edit,
  Plus,
  Eye,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action_type: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  description: string | null;
  created_at: string;
}

interface ForensicAlert {
  id: string;
  action_type: string;
  table_name: string;
  record_id: string | null;
  user_name: string | null;
  old_data: any;
  new_data: any;
  description: string | null;
  created_at: string;
  // Computed fields
  severity: 'info' | 'warning' | 'critical';
  humanMessage: string;
  icon: React.ElementType;
}

// Human-readable message generator
function generateHumanMessage(log: AuditLogEntry): { message: string; severity: 'info' | 'warning' | 'critical' } {
  const userName = log.user_name || 'Utilisateur inconnu';
  const tableName = log.table_name.toLowerCase();
  const actionType = log.action_type.toUpperCase();

  // CRITICAL: DELETE operations
  if (actionType === 'DELETE') {
    if (tableName.includes('expense') || tableName.includes('depense')) {
      return {
        message: `🚨 CRITIQUE: Enregistrement dépense supprimé par ${userName}!`,
        severity: 'critical'
      };
    }
    if (tableName.includes('formule')) {
      return {
        message: `🚨 CRITIQUE: Formule supprimée par ${userName}!`,
        severity: 'critical'
      };
    }
    if (tableName.includes('prix')) {
      return {
        message: `🚨 CRITIQUE: Prix supprimé par ${userName}!`,
        severity: 'critical'
      };
    }
    return {
      message: `🚨 SUPPRESSION: ${tableName} supprimé par ${userName}`,
      severity: 'critical'
    };
  }

  // WARNING: UPDATE operations
  if (actionType === 'UPDATE') {
    if (tableName.includes('formule')) {
      const formuleName = log.new_data?.nom_formule || log.old_data?.nom_formule || 'Formule';
      return {
        message: `⚠️ FORMULE MODIFIÉE: ${formuleName} changée par ${userName}`,
        severity: 'warning'
      };
    }
    if (tableName.includes('prix')) {
      const oldPrice = log.old_data?.prix || log.old_data?.montant;
      const newPrice = log.new_data?.prix || log.new_data?.montant;
      if (oldPrice && newPrice) {
        return {
          message: `⚠️ PRIX MODIFIÉ: ${oldPrice} DH → ${newPrice} DH par ${userName}`,
          severity: 'warning'
        };
      }
      return {
        message: `⚠️ PRIX MODIFIÉ par ${userName}`,
        severity: 'warning'
      };
    }
    if (tableName.includes('devis')) {
      return {
        message: `⚠️ DEVIS MODIFIÉ par ${userName}`,
        severity: 'warning'
      };
    }
    if (tableName.includes('stock')) {
      return {
        message: `⚠️ STOCK AJUSTÉ par ${userName}`,
        severity: 'warning'
      };
    }
    return {
      message: `📝 MODIFICATION: ${tableName} mis à jour par ${userName}`,
      severity: 'warning'
    };
  }

  // INFO: INSERT operations
  if (actionType === 'INSERT') {
    if (tableName.includes('formule')) {
      const formuleName = log.new_data?.nom_formule || 'Nouvelle formule';
      return {
        message: `➕ NOUVELLE FORMULE: ${formuleName} créée par ${userName}`,
        severity: 'info'
      };
    }
    if (tableName.includes('devis')) {
      return {
        message: `➕ NOUVEAU DEVIS créé par ${userName}`,
        severity: 'info'
      };
    }
    return {
      message: `➕ CRÉATION: ${tableName} par ${userName}`,
      severity: 'info'
    };
  }

  // Default
  return {
    message: log.description || `${actionType} sur ${tableName} par ${userName}`,
    severity: 'info'
  };
}

function getActionIcon(actionType: string): React.ElementType {
  switch (actionType.toUpperCase()) {
    case 'DELETE':
      return Trash2;
    case 'UPDATE':
      return Edit;
    case 'INSERT':
      return Plus;
    default:
      return FileText;
  }
}

// Compare Dialog Component
function CompareDialog({ 
  alert, 
  open, 
  onClose 
}: { 
  alert: ForensicAlert | null; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!alert) return null;

  const oldData = alert.old_data || {};
  const newData = alert.new_data || {};
  
  // Get all unique keys from both objects
  const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];
  
  // Filter to only show changed fields
  const changedKeys = allKeys.filter(key => {
    const oldVal = JSON.stringify(oldData[key]);
    const newVal = JSON.stringify(newData[key]);
    return oldVal !== newVal;
  });

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-primary" />
            Comparaison des Changements
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Alert Info */}
          <div className="p-2 rounded-lg bg-muted/50 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                {alert.action_type}
              </Badge>
              <span className="font-mono text-muted-foreground">{alert.table_name}</span>
            </div>
            <p className="text-muted-foreground">
              Par {alert.user_name || 'Inconnu'} • {format(parseISO(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </p>
          </div>

          {/* Changes List */}
          <ScrollArea className="h-[300px] pr-2">
            {changedKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucun changement détectable</p>
                <p className="text-xs text-muted-foreground">Les données avant/après sont identiques ou manquantes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {changedKeys.map((key) => (
                  <div key={key} className="p-2 rounded-lg border bg-background">
                    <p className="font-medium text-xs mb-1.5 text-primary">{key}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Old Value */}
                      <div className="p-1.5 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-[10px] text-destructive font-medium mb-0.5">AVANT</p>
                        <p className="font-mono text-destructive line-through break-all">
                          {formatValue(oldData[key])}
                        </p>
                      </div>
                      {/* New Value */}
                      <div className="p-1.5 rounded bg-success/10 border border-success/20">
                        <p className="text-[10px] text-success font-medium mb-0.5">APRÈS</p>
                        <p className="font-mono text-success font-semibold break-all">
                          {formatValue(newData[key])}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ForensicAuditFeed() {
  const { isCeo, isSuperviseur, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<ForensicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ForensicAlert | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  // CEO-only access check
  const hasAccess = isCeo || isSuperviseur;

  const fetchAuditLogs = useCallback(async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    try {
      // Fetch latest 20 entries from audit_logs (Forensic Black Box)
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching audit_logs:', error);
        // Fallback to audit_superviseur if audit_logs not accessible
        const { data: fallbackData } = await supabase
          .from('audit_superviseur')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (fallbackData) {
          const processedAlerts = fallbackData.map((log: any) => {
            const { message, severity } = generateHumanMessage({
              ...log,
              action_type: log.action || 'UPDATE',
              old_data: log.changes?.before || null,
              new_data: log.changes?.after || null,
            });
            return {
              id: log.id,
              action_type: log.action || 'UPDATE',
              table_name: log.table_name || 'unknown',
              record_id: log.record_id,
              user_name: log.user_name,
              old_data: log.changes?.before || null,
              new_data: log.changes?.after || null,
              description: log.notes,
              created_at: log.created_at,
              severity,
              humanMessage: message,
              icon: getActionIcon(log.action || 'UPDATE'),
            };
          });
          setAlerts(processedAlerts);
        }
        setLoading(false);
        return;
      }

      // Process audit_logs entries
      const processedAlerts: ForensicAlert[] = (data || []).map((log: AuditLogEntry) => {
        const { message, severity } = generateHumanMessage(log);
        return {
          id: log.id,
          action_type: log.action_type,
          table_name: log.table_name,
          record_id: log.record_id,
          user_name: log.user_name,
          old_data: log.old_data,
          new_data: log.new_data,
          description: log.description,
          created_at: log.created_at,
          severity,
          humanMessage: message,
          icon: getActionIcon(log.action_type),
        };
      });

      setAlerts(processedAlerts);
    } catch (error) {
      console.error('Error in fetchAuditLogs:', error);
    } finally {
      setLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    if (authLoading) return;
    
    fetchAuditLogs();

    // Realtime subscription to audit_logs
    const channel = supabase
      .channel('forensic_audit_logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => fetchAuditLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAuditLogs, authLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditLogs();
    setRefreshing(false);
  };

  const handleAlertClick = (alert: ForensicAlert) => {
    setSelectedAlert(alert);
    setCompareOpen(true);
  };

  const getSeverityStyles = (severity: ForensicAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-l-destructive',
          bg: 'bg-destructive/5',
          iconBg: 'bg-destructive/20 text-destructive',
          badge: 'border-destructive text-destructive'
        };
      case 'warning':
        return {
          border: 'border-l-warning',
          bg: 'bg-warning/5',
          iconBg: 'bg-warning/20 text-warning',
          badge: 'border-warning text-warning'
        };
      default:
        return {
          border: 'border-l-primary',
          bg: 'bg-primary/5',
          iconBg: 'bg-primary/20 text-primary',
          badge: 'border-primary text-primary'
        };
    }
  };

  // Don't render for non-CEO users
  if (!authLoading && !hasAccess) {
    return null;
  }

  if (loading || authLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border mb-2 animate-pulse">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <FileSearch className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                🔐 Forensic Black Box
                <Badge variant="outline" className="text-[9px] ml-1">CEO ONLY</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Audit en temps réel • Cliquez pour comparer les changements
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="animate-pulse gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalCount} CRITIQUE{criticalCount > 1 ? 'S' : ''}
                </Badge>
              )}
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
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <Shield className="h-7 w-7 text-success" />
              </div>
              <p className="font-medium text-sm text-success">Système propre</p>
              <p className="text-xs text-muted-foreground">
                Aucune activité suspecte détectée
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[280px] pr-2">
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const styles = getSeverityStyles(alert.severity);
                  const IconComponent = alert.icon;
                  
                  return (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className={cn(
                        "p-3 rounded-lg border-l-4 transition-all cursor-pointer hover:shadow-md hover:scale-[1.01]",
                        styles.border,
                        styles.bg
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("p-1.5 rounded-md", styles.iconBg)}>
                            <IconComponent className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="font-semibold text-xs">
                              {alert.table_name} • {alert.action_type}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {format(parseISO(alert.created_at), 'dd/MM HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn("text-[9px] shrink-0", styles.badge)}
                        >
                          {alert.severity === 'critical' ? '🚨 CRITIQUE' : 
                           alert.severity === 'warning' ? '⚠️ ALERTE' : 'ℹ️ INFO'}
                        </Badge>
                      </div>

                      {/* Human-Readable Message */}
                      <p className="text-xs text-foreground font-medium line-clamp-2 mb-1.5">
                        {alert.humanMessage}
                      </p>

                      {/* Quick Compare Preview */}
                      {(alert.old_data || alert.new_data) && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>Cliquez pour voir les détails</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(parseISO(alert.created_at), { locale: fr, addSuffix: true })}
                        </span>
                        {alert.user_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            {alert.user_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Compare Dialog */}
      <CompareDialog 
        alert={selectedAlert} 
        open={compareOpen} 
        onClose={() => setCompareOpen(false)} 
      />
    </>
  );
}
