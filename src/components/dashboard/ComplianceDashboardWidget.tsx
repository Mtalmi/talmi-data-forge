import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock,
  TrendingUp, TrendingDown, FileCheck, Eye, Activity,
  BarChart3, Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ComplianceMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  status: 'compliant' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  detail: string;
}

interface AuditViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  user_name: string;
  resolved: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'compliant': return 'text-emerald-500';
    case 'warning': return 'text-amber-500';
    case 'critical': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case 'compliant': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'warning': return 'bg-amber-500/10 border-amber-500/30';
    case 'critical': return 'bg-destructive/10 border-destructive/30';
    default: return 'bg-muted/30 border-border';
  }
}

function getSeverityBadge(severity: string) {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: 'Faible', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    medium: { label: 'Moyen', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    high: { label: 'Élevé', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
    critical: { label: 'Critique', className: 'bg-destructive/20 text-destructive' },
  };
  return config[severity] || config.low;
}

// Risk score radar-style display
function RiskRadar({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-destructive';
  const bg = score >= 80 ? 'from-emerald-500/20 to-emerald-600/5' : score >= 60 ? 'from-amber-500/20 to-amber-600/5' : 'from-destructive/20 to-destructive/5';
  const label = score >= 80 ? 'Conforme' : score >= 60 ? 'À risque' : 'Non conforme';

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'backOut' }}
        className={cn(
          'h-28 w-28 rounded-full border-4 flex items-center justify-center',
          'bg-gradient-to-br', bg,
          score >= 80 ? 'border-emerald-400/50' : score >= 60 ? 'border-amber-400/50' : 'border-destructive/50'
        )}
      >
        <div className="text-center">
          <p className={cn('text-3xl font-bold font-mono', color)}>{score}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</p>
        </div>
      </motion.div>
      <Badge variant="outline" className={cn('text-xs', getStatusBg(score >= 80 ? 'compliant' : score >= 60 ? 'warning' : 'critical'))}>
        <Shield className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    </div>
  );
}

export function ComplianceDashboardWidget() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [violations, setViolations] = useState<AuditViolation[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchComplianceData = useCallback(async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      const last30Days = subDays(now, 30).toISOString();

      // Fetch multiple data sources in parallel
      const [auditRes, expenseRes, blRes, alertsRes, contractRes] = await Promise.all([
        // Latest audit score
        supabase
          .from('audits_externes')
          .select('compliance_score, silo_variance_max_pct, cash_variance_pct, documents_verified_count, documents_missing_count')
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
          .limit(1),
        // Expense compliance (receipts uploaded)
        supabase
          .from('expenses_controlled')
          .select('id, receipt_photo_url, statut')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
        // BL compliance (validated vs total)
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, validated_at, client_signature_url, quality_status')
          .gte('date_livraison', format(subDays(now, 30), 'yyyy-MM-dd')),
        // Security violations
        supabase
          .from('audit_superviseur')
          .select('id, action, table_name, user_name, created_at')
          .gte('created_at', last30Days)
          .order('created_at', { ascending: false })
          .limit(20),
        // Contract compliance (use contract_compliance_summary view)
        supabase
          .from('contract_compliance_summary')
          .select('fournisseur_id, active_contracts, has_active_contract, nearest_expiration')
          .limit(50),
      ]);

      // Calculate metrics
      const auditScore = auditRes.data?.[0]?.compliance_score || 0;
      
      // Receipt compliance
      const expenses = expenseRes.data || [];
      const withReceipts = expenses.filter(e => e.receipt_photo_url);
      const receiptRate = expenses.length > 0 ? Math.round((withReceipts.length / expenses.length) * 100) : 100;

      // BL validation rate
      const bls = blRes.data || [];
      const validatedBLs = bls.filter(b => b.validated_at);
      const blValidationRate = bls.length > 0 ? Math.round((validatedBLs.length / bls.length) * 100) : 100;

      // Signature compliance
      const signedBLs = bls.filter(b => b.client_signature_url);
      const signatureRate = bls.length > 0 ? Math.round((signedBLs.length / bls.length) * 100) : 100;

      // Quality checks
      const qualityChecked = bls.filter(b => b.quality_status === 'passed' || b.quality_status === 'warning');
      const qualityRate = bls.length > 0 ? Math.round((qualityChecked.length / bls.length) * 100) : 100;

      // Contract coverage
      const contractData = contractRes.data || [];
      const totalSuppliers = contractData.length;
      const withoutContract = (contractData as any[]).filter((c: any) => !c.has_active_contract).length;

      const newMetrics: ComplianceMetric[] = [
        {
          id: 'audit_score',
          label: 'Score Audit Externe',
          value: auditScore,
          target: 85,
          status: auditScore >= 85 ? 'compliant' : auditScore >= 60 ? 'warning' : 'critical',
          trend: 'stable',
          detail: `Dernier audit: ${auditScore}%`,
        },
        {
          id: 'receipt_compliance',
          label: 'Justificatifs Dépenses',
          value: receiptRate,
          target: 100,
          status: receiptRate >= 95 ? 'compliant' : receiptRate >= 80 ? 'warning' : 'critical',
          trend: receiptRate >= 95 ? 'up' : 'down',
          detail: `${withReceipts.length}/${expenses.length} avec preuve`,
        },
        {
          id: 'bl_validation',
          label: 'Validation BL',
          value: blValidationRate,
          target: 100,
          status: blValidationRate >= 90 ? 'compliant' : blValidationRate >= 70 ? 'warning' : 'critical',
          trend: blValidationRate >= 90 ? 'up' : 'down',
          detail: `${validatedBLs.length}/${bls.length} validés`,
        },
        {
          id: 'signature_rate',
          label: 'Signatures Client',
          value: signatureRate,
          target: 100,
          status: signatureRate >= 90 ? 'compliant' : signatureRate >= 70 ? 'warning' : 'critical',
          trend: 'stable',
          detail: `${signedBLs.length}/${bls.length} signés`,
        },
        {
          id: 'quality_control',
          label: 'Contrôle Qualité',
          value: qualityRate,
          target: 100,
          status: qualityRate >= 90 ? 'compliant' : qualityRate >= 70 ? 'warning' : 'critical',
          trend: 'stable',
          detail: `${qualityChecked.length}/${bls.length} vérifiés`,
        },
        {
          id: 'contracts',
          label: 'Contrats Actifs',
          value: totalSuppliers > 0 ? Math.round(((totalSuppliers - withoutContract) / totalSuppliers) * 100) : 100,
          target: 100,
          status: withoutContract === 0 ? 'compliant' : withoutContract <= 2 ? 'warning' : 'critical',
          trend: withoutContract > 0 ? 'down' : 'stable',
          detail: `${withoutContract} fournisseur(s) sans contrat`,
        },
      ];

      setMetrics(newMetrics);

      // Calculate overall score
      const avgScore = Math.round(newMetrics.reduce((a, m) => a + m.value, 0) / newMetrics.length);
      setOverallScore(avgScore);

      // Process violations from audit log
      const auditActions = alertsRes.data || [];
      const processedViolations: AuditViolation[] = auditActions
        .filter(a => ['DELETE', 'ROLLBACK', 'OVERRIDE', 'LIMIT_EXCEEDED', 'ACCESS_DENIED'].some(k => a.action?.toUpperCase().includes(k)))
        .map(a => ({
          id: a.id,
          type: a.action,
          severity: a.action?.includes('DELETE') ? 'high' as const : a.action?.includes('LIMIT') ? 'medium' as const : 'low' as const,
          description: `${a.action} sur ${a.table_name}`,
          timestamp: a.created_at,
          user_name: a.user_name || 'Inconnu',
          resolved: false,
        }));
      
      setViolations(processedViolations);
    } catch (err) {
      console.error('[Compliance] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-32 rounded-xl bg-muted/30" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted/30" />)}
        </div>
      </div>
    );
  }

  const criticalCount = metrics.filter(m => m.status === 'critical').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-3">
          <TabsTrigger value="overview" className="text-xs gap-1">
            <Gauge className="h-3 w-3" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs gap-1">
            <BarChart3 className="h-3 w-3" />
            Indicateurs
          </TabsTrigger>
          <TabsTrigger value="violations" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            Violations
            {violations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-bold">
                {violations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <RiskRadar score={overallScore} />
            <div className="flex-1 ml-6 space-y-3">
              {/* Quick Status Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className={cn('p-2 rounded-lg border text-center', getStatusBg('compliant'))}>
                  <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.filter(m => m.status === 'compliant').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Conforme</p>
                </div>
                <div className={cn('p-2 rounded-lg border text-center', getStatusBg('warning'))}>
                  <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{warningCount}</p>
                  <p className="text-[10px] text-muted-foreground">Attention</p>
                </div>
                <div className={cn('p-2 rounded-lg border text-center', getStatusBg('critical'))}>
                  <XCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
                  <p className="text-lg font-bold text-destructive">{criticalCount}</p>
                  <p className="text-[10px] text-muted-foreground">Critique</p>
                </div>
              </div>

              {/* Top issues */}
              {criticalCount > 0 && (
                <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  {criticalCount} indicateur(s) en zone critique nécessitant une action immédiate.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-0">
          <div className="space-y-2">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn('p-3 rounded-lg border', getStatusBg(metric.status))}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                    {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
                    <span className={cn('text-sm font-bold font-mono', getStatusColor(metric.status))}>
                      {metric.value}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={metric.value} 
                  className="h-1.5"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{metric.detail}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="mt-0">
          {violations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-medium">Aucune violation détectée</p>
              <p className="text-xs">Tout est conforme sur les 30 derniers jours</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {violations.map((v, i) => {
                const severityConfig = getSeverityBadge(v.severity);
                return (
                  <motion.div
                    key={v.id}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-2.5 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{v.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {v.user_name} • {format(new Date(v.timestamp), 'dd MMM HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <Badge className={cn('text-[10px] shrink-0', severityConfig.className)}>
                        {severityConfig.label}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
