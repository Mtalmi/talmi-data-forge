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
  Lock,
  Download,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  // Computed fields - Extended severity types for color-coding
  severity: 'critical' | 'warning' | 'afterhours' | 'info';
  humanMessage: string;
  icon: React.ElementType;
  ruleType: 'ghost_deletion' | 'price_variance' | 'formula_integrity' | 'midnight_bypass' | 'role_elevation' | 'standard';
}

// Check if timestamp is in after-hours window (18:00 - 00:00 Casablanca)
function isAfterHours(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    // Get hour in Casablanca timezone
    const casablancaHour = parseInt(
      date.toLocaleString('en-US', { 
        timeZone: 'Africa/Casablanca', 
        hour: 'numeric', 
        hour12: false 
      })
    );
    return casablancaHour >= 18 || casablancaHour < 0;
  } catch {
    return false;
  }
}

// Calculate percentage change between two values
function calculatePercentChange(oldVal: number, newVal: number): number | null {
  if (!oldVal || oldVal === 0) return null;
  return Math.round(((newVal - oldVal) / oldVal) * 100);
}

// Enhanced human-readable message generator with 5 security rules
function generateHumanMessage(log: AuditLogEntry): { 
  message: string; 
  severity: 'critical' | 'warning' | 'afterhours' | 'info';
  ruleType: ForensicAlert['ruleType'];
} {
  const userName = log.user_name || 'Utilisateur inconnu';
  const tableName = log.table_name.toLowerCase();
  const actionType = log.action_type.toUpperCase();
  const isNightAction = isAfterHours(log.created_at);

  // ============================================================
  // RULE 5: ROLE ELEVATION (Security Breach) - RED
  // If role in profiles/user_roles is changed
  // ============================================================
  if (actionType === 'UPDATE' && (tableName.includes('profile') || tableName.includes('user_role'))) {
    const oldRole = log.old_data?.role;
    const newRole = log.new_data?.role;
    if (oldRole !== newRole && (oldRole || newRole)) {
      return {
        message: `🔑 SECURITY ALERT: Rôle utilisateur modifié (${oldRole || '?'} → ${newRole || '?'}) par ${userName}`,
        severity: 'critical',
        ruleType: 'role_elevation'
      };
    }
  }

  // ============================================================
  // RULE 3: GHOST DELETION (Evidence Destruction) - RED
  // Any record deletion
  // ============================================================
  if (actionType === 'DELETE') {
    return {
      message: `🚨 CRITICAL: Enregistrement ${tableName} supprimé définitivement par ${userName}!`,
      severity: 'critical',
      ruleType: 'ghost_deletion'
    };
  }

  // ============================================================
  // RULE 1: PRICE VARIANCE (Theft Detection) - ORANGE
  // Devis or Expense amount update with % change
  // ============================================================
  if (actionType === 'UPDATE' && (tableName.includes('devis') || tableName.includes('depense') || tableName.includes('expense'))) {
    const oldAmount = log.old_data?.montant_total || log.old_data?.montant || log.old_data?.prix_unitaire;
    const newAmount = log.new_data?.montant_total || log.new_data?.montant || log.new_data?.prix_unitaire;
    
    if (oldAmount && newAmount && oldAmount !== newAmount) {
      const percentChange = calculatePercentChange(parseFloat(oldAmount), parseFloat(newAmount));
      if (percentChange !== null) {
        const direction = percentChange > 0 ? '+' : '';
        return {
          message: `⚠️ PRICE VARIANCE: Montant changé de ${direction}${percentChange}% par ${userName} (${oldAmount} → ${newAmount} DH)`,
          severity: 'warning',
          ruleType: 'price_variance'
        };
      }
    }
  }

  // ============================================================
  // RULE 2: FORMULA INTEGRITY (Quality) - ORANGE
  // Composition changes in formules table
  // ============================================================
  if (actionType === 'UPDATE' && tableName.includes('formule')) {
    // Check for composition-related field changes
    const compositionFields = ['composition', 'dosage', 'ciment', 'sable', 'gravier', 'eau', 'adjuvant', 'ratio'];
    const hasCompositionChange = compositionFields.some(field => {
      const oldVal = JSON.stringify(log.old_data?.[field]);
      const newVal = JSON.stringify(log.new_data?.[field]);
      return oldVal !== newVal && (log.old_data?.[field] || log.new_data?.[field]);
    });
    
    if (hasCompositionChange) {
      const formuleName = log.new_data?.nom_formule || log.old_data?.nom_formule || 'Formule';
      return {
        message: `🧪 SECRET SAUCE MODIFIED: Composition "${formuleName}" changée par ${userName}`,
        severity: 'warning',
        ruleType: 'formula_integrity'
      };
    }
    
    // Generic formula change
    const formuleName = log.new_data?.nom_formule || log.old_data?.nom_formule || 'Formule';
    return {
      message: `🧪 FORMULE MODIFIÉE: "${formuleName}" mise à jour par ${userName}`,
      severity: 'warning',
      ruleType: 'formula_integrity'
    };
  }

  // ============================================================
  // RULE 4: MIDNIGHT BYPASS (After-Hours) - BLUE
  // Any action between 18:00 and 00:00
  // ============================================================
  if (isNightAction) {
    const actionLabel = actionType === 'INSERT' ? 'Création' : actionType === 'UPDATE' ? 'Modification' : actionType;
    return {
      message: `⏰ AFTER-HOURS ACTIVITY: ${actionLabel} sur ${tableName} par ${userName} pendant la Fenêtre d'Urgence`,
      severity: 'afterhours',
      ruleType: 'midnight_bypass'
    };
  }

  // ============================================================
  // STANDARD RULES (Fallback)
  // ============================================================
  
  // UPDATE operations
  if (actionType === 'UPDATE') {
    if (tableName.includes('prix')) {
      const oldPrice = log.old_data?.prix || log.old_data?.montant;
      const newPrice = log.new_data?.prix || log.new_data?.montant;
      if (oldPrice && newPrice) {
        const percentChange = calculatePercentChange(parseFloat(oldPrice), parseFloat(newPrice));
        const pctLabel = percentChange !== null ? ` (${percentChange > 0 ? '+' : ''}${percentChange}%)` : '';
        return {
          message: `⚠️ PRIX MODIFIÉ: ${oldPrice} → ${newPrice} DH${pctLabel} par ${userName}`,
          severity: 'warning',
          ruleType: 'price_variance'
        };
      }
    }
    if (tableName.includes('stock')) {
      return {
        message: `⚠️ STOCK AJUSTÉ par ${userName}`,
        severity: 'warning',
        ruleType: 'standard'
      };
    }
    return {
      message: `📝 MODIFICATION: ${tableName} mis à jour par ${userName}`,
      severity: 'info',
      ruleType: 'standard'
    };
  }

  // INSERT operations
  if (actionType === 'INSERT') {
    if (tableName.includes('formule')) {
      const formuleName = log.new_data?.nom_formule || 'Nouvelle formule';
      return {
        message: `➕ NOUVELLE FORMULE: "${formuleName}" créée par ${userName}`,
        severity: 'info',
        ruleType: 'standard'
      };
    }
    if (tableName.includes('devis')) {
      return {
        message: `➕ NOUVEAU DEVIS créé par ${userName}`,
        severity: 'info',
        ruleType: 'standard'
      };
    }
    return {
      message: `➕ CRÉATION: ${tableName} par ${userName}`,
      severity: 'info',
      ruleType: 'standard'
    };
  }

  // Default
  return {
    message: log.description || `${actionType} sur ${tableName} par ${userName}`,
    severity: 'info',
    ruleType: 'standard'
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
  const { isCeo, isSuperviseur, loading: authLoading, user } = useAuth();
  const [alerts, setAlerts] = useState<ForensicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
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
            const { message, severity, ruleType } = generateHumanMessage({
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
              ruleType,
            };
          });
          setAlerts(processedAlerts);
        }
        setLoading(false);
        return;
      }

      // Process audit_logs entries
      const processedAlerts: ForensicAlert[] = (data || []).map((log: AuditLogEntry) => {
        const { message, severity, ruleType } = generateHumanMessage(log);
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
          ruleType,
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

  // PDF Export function
  const handleExportPdf = async () => {
    setExporting(true);
    
    try {
      // Fetch all audit logs for comprehensive report (up to 100)
      const { data: allLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
      const criticalCount = allLogs?.filter((l: any) => l.action_type === 'DELETE').length || 0;
      const warningCount = allLogs?.filter((l: any) => l.action_type === 'UPDATE').length || 0;
      const infoCount = allLogs?.filter((l: any) => l.action_type === 'INSERT').length || 0;

      const formatJsonData = (data: any): string => {
        if (!data) return '—';
        try {
          return Object.entries(data)
            .map(([key, value]) => `<strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('<br>');
        } catch {
          return JSON.stringify(data);
        }
      };

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport Forensique - ${reportDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 30px; 
              color: #1a1a1a;
              line-height: 1.5;
              font-size: 11px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #dc2626;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .header h1 {
              font-size: 22px;
              color: #dc2626;
              margin-bottom: 5px;
            }
            .header .subtitle {
              color: #666;
              font-size: 12px;
            }
            .header .confidential {
              display: inline-block;
              background: #dc2626;
              color: white;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              margin-top: 10px;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin-bottom: 25px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item .count {
              font-size: 24px;
              font-weight: bold;
            }
            .summary-item .label {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
            }
            .critical .count { color: #dc2626; }
            .warning .count { color: #f59e0b; }
            .info .count { color: #3b82f6; }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .log-entry {
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 10px;
              margin-bottom: 8px;
              page-break-inside: avoid;
            }
            .log-entry.critical {
              border-left: 4px solid #dc2626;
              background: #fef2f2;
            }
            .log-entry.warning {
              border-left: 4px solid #f97316;
              background: #fff7ed;
            }
            .log-entry.afterhours {
              border-left: 4px solid #3b82f6;
              background: #eff6ff;
            }
            .log-entry.info {
              border-left: 4px solid #22c55e;
              background: #f0fdf4;
            }
            .log-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
            }
            .log-action {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .log-action.DELETE { background: #dc2626; color: white; }
            .log-action.UPDATE { background: #f59e0b; color: white; }
            .log-action.INSERT { background: #3b82f6; color: white; }
            .log-table {
              font-family: monospace;
              color: #666;
              font-size: 10px;
            }
            .log-time {
              color: #999;
              font-size: 10px;
            }
            .log-message {
              font-weight: 500;
              margin-bottom: 6px;
            }
            .log-user {
              color: #666;
              font-size: 10px;
            }
            .data-comparison {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-top: 8px;
              font-size: 9px;
            }
            .data-box {
              padding: 8px;
              border-radius: 4px;
              overflow: hidden;
            }
            .data-box.old {
              background: #fee2e2;
              border: 1px solid #fca5a5;
            }
            .data-box.new {
              background: #dcfce7;
              border: 1px solid #86efac;
            }
            .data-box-title {
              font-weight: bold;
              font-size: 8px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              color: #888;
              font-size: 10px;
            }
            @media print {
              body { padding: 15px; }
              .log-entry { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 RAPPORT FORENSIQUE</h1>
            <p class="subtitle">Talmi Beton Operating System • Black Box Audit Trail</p>
            <p class="subtitle">Généré le ${reportDate}</p>
            <span class="confidential">🔒 CONFIDENTIEL - CEO UNIQUEMENT</span>
          </div>

          <div class="summary">
            <div class="summary-item critical">
              <div class="count">${criticalCount}</div>
              <div class="label">🚨 Critiques (DELETE)</div>
            </div>
            <div class="summary-item warning">
              <div class="count">${warningCount}</div>
              <div class="label">⚠️ Alertes (UPDATE)</div>
            </div>
            <div class="summary-item info">
              <div class="count">${infoCount}</div>
              <div class="label">ℹ️ Infos (INSERT)</div>
            </div>
            <div class="summary-item">
              <div class="count">${allLogs?.length || 0}</div>
              <div class="label">📊 Total Entrées</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 Journal d'Audit Complet</div>
            ${(allLogs || []).map((log: any) => {
              const { message, severity } = generateHumanMessage({
                id: log.id,
                user_id: log.user_id,
                user_name: log.user_name,
                action_type: log.action_type,
                table_name: log.table_name,
                record_id: log.record_id,
                old_data: log.old_data,
                new_data: log.new_data,
                description: log.description,
                created_at: log.created_at,
              });
              return `
                <div class="log-entry ${severity}">
                  <div class="log-header">
                    <div>
                      <span class="log-action ${log.action_type}">${log.action_type}</span>
                      <span class="log-table">${log.table_name}</span>
                    </div>
                    <span class="log-time">${format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</span>
                  </div>
                  <div class="log-message">${message}</div>
                  <div class="log-user">👤 ${log.user_name || 'Système'} ${log.record_id ? `• ID: ${log.record_id}` : ''}</div>
                  ${(log.old_data || log.new_data) ? `
                    <div class="data-comparison">
                      <div class="data-box old">
                        <div class="data-box-title">Avant</div>
                        ${formatJsonData(log.old_data)}
                      </div>
                      <div class="data-box new">
                        <div class="data-box-title">Après</div>
                        ${formatJsonData(log.new_data)}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <div class="footer">
            <p><strong>TALMI BETON</strong> • Système de Traçabilité Forensique</p>
            <p>Ce document est généré automatiquement et constitue une preuve légale d'audit.</p>
            <p>Généré par: ${user?.email || 'CEO'} • ${reportDate}</p>
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        toast.success('Rapport forensique généré avec succès');
      } else {
        toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setExporting(false);
    }
  };

  const getSeverityStyles = (severity: ForensicAlert['severity']) => {
    switch (severity) {
      // RED - Ghost Deletion & Role Elevation
      case 'critical':
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-500/10',
          iconBg: 'bg-red-500/20 text-red-600',
          badge: 'border-red-500 text-red-600 bg-red-500/10'
        };
      // ORANGE - Price Variance & Formula Integrity
      case 'warning':
        return {
          border: 'border-l-orange-500',
          bg: 'bg-orange-500/10',
          iconBg: 'bg-orange-500/20 text-orange-600',
          badge: 'border-orange-500 text-orange-600 bg-orange-500/10'
        };
      // BLUE - Midnight Bypass (After-Hours)
      case 'afterhours':
        return {
          border: 'border-l-blue-500',
          bg: 'bg-blue-500/10',
          iconBg: 'bg-blue-500/20 text-blue-600',
          badge: 'border-blue-500 text-blue-600 bg-blue-500/10'
        };
      // DEFAULT - Info
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
                <Badge variant="outline" className="text-[9px] ml-1">DIRECTION</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Audit en temps réel • Cliquez pour comparer les changements
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
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
                onClick={handleExportPdf}
                disabled={exporting || alerts.length === 0}
                title="Exporter rapport PDF"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
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
                          className={cn("text-[9px] shrink-0 font-bold", styles.badge)}
                        >
                          {alert.severity === 'critical' ? '🚨 CRITIQUE' : 
                           alert.severity === 'warning' ? '⚠️ ALERTE' : 
                           alert.severity === 'afterhours' ? '⏰ NUIT' : 'ℹ️ INFO'}
                        </Badge>
                      </div>

                      {/* Human-Readable Message */}
                      <p className="text-xs text-foreground font-medium line-clamp-2 mb-1.5">
                        {alert.humanMessage}
                      </p>

                      {/* Rule Type Badge */}
                      {alert.ruleType !== 'standard' && (
                        <div className="mb-1.5">
                          <Badge variant="secondary" className="text-[8px] font-mono">
                            {alert.ruleType === 'ghost_deletion' && '🚨 GHOST DELETION'}
                            {alert.ruleType === 'price_variance' && '💰 PRICE VARIANCE'}
                            {alert.ruleType === 'formula_integrity' && '🧪 FORMULA INTEGRITY'}
                            {alert.ruleType === 'midnight_bypass' && '⏰ MIDNIGHT BYPASS'}
                            {alert.ruleType === 'role_elevation' && '🔑 ROLE ELEVATION'}
                          </Badge>
                        </div>
                      )}

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
