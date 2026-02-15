import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Cylinder, 
  Coins, 
  FileCheck, 
  Truck, 
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

interface HealthMetric {
  label: string;
  value: number;
  status: 'green' | 'yellow' | 'red';
  icon: typeof Shield;
  trend?: 'up' | 'down' | 'stable';
  detail: string;
}

export function AuditHealthWidget() {
  const { t } = useI18n();
  const ah = t.auditHealth;
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState<number>(100);

  useEffect(() => {
    fetchAuditHealth();
  }, []);

  const fetchAuditHealth = async () => {
    try {
      // Get latest 3 audits for trend analysis
      const { data: audits } = await supabase
        .from('audits_externes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!audits || audits.length === 0) {
        setMetrics([
          { label: 'Stock Variance', value: 0, status: 'green', icon: Cylinder, detail: ah.noAudit },
          { label: 'Cash Gap', value: 0, status: 'green', icon: Coins, detail: ah.noAudit },
          { label: 'BL Compliance', value: 100, status: 'green', icon: FileCheck, detail: ah.noAudit },
          { label: 'KM Drift', value: 0, status: 'green', icon: Truck, detail: ah.noAudit },
        ]);
        setLoading(false);
        return;
      }

      const latest = audits[0];
      const previous = audits[1];

      // Calculate Stock Variance from silo_checks
      const siloChecks = latest.silo_checks as { variance_pct?: number }[] || [];
      const maxSiloVariance = siloChecks.length > 0 
        ? Math.max(...siloChecks.map(s => Math.abs(s.variance_pct || 0)))
        : 0;
      
      // Cash Gap
      const cashVariance = Math.abs(latest.cash_variance_pct || 0);
      
      // BL Compliance (documents verified vs missing)
      const verifiedCount = latest.documents_verified_count || 0;
      const missingCount = latest.documents_missing_count || 0;
      const totalDocs = verifiedCount + missingCount;
      const blCompliance = totalDocs > 0 ? (verifiedCount / totalDocs) * 100 : 100;
      
      // KM Drift detection
      const truckChecks = latest.truck_checks as { anomaly?: boolean }[] || [];
      const hasKmAnomaly = truckChecks.some(t => t.anomaly);

      // Determine statuses
      const getStockStatus = (v: number) => v <= 2 ? 'green' : v <= 5 ? 'yellow' : 'red';
      const getCashStatus = (v: number) => v <= 1 ? 'green' : v <= 3 ? 'yellow' : 'red';
      const getBlStatus = (v: number) => v >= 95 ? 'green' : v >= 80 ? 'yellow' : 'red';
      const getKmStatus = (anomaly: boolean) => anomaly ? 'red' : 'green';

      // Calculate trends
      const getTrend = (current: number, prev: number | null): 'up' | 'down' | 'stable' => {
        if (prev === null) return 'stable';
        const diff = current - prev;
        if (Math.abs(diff) < 0.5) return 'stable';
        return diff > 0 ? 'up' : 'down';
      };

      const prevSiloVariance = previous?.silo_variance_max_pct || null;

      const newMetrics: HealthMetric[] = [
        {
          label: 'Stock Variance',
          value: maxSiloVariance,
          status: getStockStatus(maxSiloVariance),
          icon: Cylinder,
          trend: getTrend(maxSiloVariance, prevSiloVariance),
          detail: `${maxSiloVariance.toFixed(1)}% ${ah.maxVariance}`,
        },
        {
          label: 'Cash Gap',
          value: cashVariance,
          status: getCashStatus(cashVariance),
          icon: Coins,
          detail: `${cashVariance.toFixed(1)}% ${ah.variance}`,
        },
        {
          label: 'BL Compliance',
          value: blCompliance,
          status: getBlStatus(blCompliance),
          icon: FileCheck,
          detail: `${verifiedCount}/${totalDocs} ${ah.docs}`,
        },
        {
          label: 'KM Drift',
          value: hasKmAnomaly ? 1 : 0,
          status: getKmStatus(hasKmAnomaly),
          icon: Truck,
          detail: hasKmAnomaly ? ah.anomalyDetected : ah.compliant,
        },
      ];

      setMetrics(newMetrics);
      setOverallScore(latest.compliance_score || 100);
    } catch (error) {
      console.error('Error fetching audit health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-success/20 text-success border-success/30';
      case 'yellow': return 'bg-warning/20 text-warning border-warning/30';
      case 'red': return 'bg-destructive/20 text-destructive border-destructive/30';
    }
  };

  const getStatusIndicator = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-success';
      case 'yellow': return 'bg-warning';
      case 'red': return 'bg-destructive';
    }
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'text-success' };
    if (score >= 75) return { grade: 'B', color: 'text-success' };
    if (score >= 60) return { grade: 'C', color: 'text-warning' };
    if (score >= 40) return { grade: 'D', color: 'text-warning' };
    return { grade: 'F', color: 'text-destructive' };
  };

  const gradeInfo = getGrade(overallScore);

  if (loading) {
    return (
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">{ah.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold tabular-nums", gradeInfo.color)}>
              {gradeInfo.grade}
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {overallScore.toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Mobile: 2x2 grid, Desktop: 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                "relative p-2 sm:p-3 rounded-lg border-2 transition-all touch-target",
                getStatusColor(metric.status)
              )}
            >
              {/* Traffic Light Indicator */}
              <div className={cn(
                "absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full",
                getStatusIndicator(metric.status),
                metric.status === 'red' && "animate-pulse"
              )} />
              
              <metric.icon className="h-4 w-4 mb-1.5 sm:mb-2 opacity-80" />
              <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider opacity-70 truncate">
                {metric.label}
              </p>
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                <p className="text-[11px] sm:text-xs font-semibold truncate">{metric.detail}</p>
                {metric.trend && metric.trend !== 'stable' && (
                  metric.trend === 'up' 
                    ? <TrendingUp className="h-3 w-3 text-destructive flex-shrink-0" />
                    : <TrendingDown className="h-3 w-3 text-success flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
