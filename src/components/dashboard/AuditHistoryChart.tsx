import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClipboardCheck, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuditRecord {
  id: string;
  audit_date: string;
  audit_period: string;
  silo_variance_pct: number;
  cash_variance_pct: number;
  documents_verified_count: number;
  documents_missing_count: number;
  status: string;
}

export function AuditHistoryChart() {
  const { isCeo } = useAuth();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCeo) {
      fetchAudits();
    }
  }, [isCeo]);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('audits_externes' as any)
        .select('id, audit_date, audit_period, silo_variance_pct, cash_variance_pct, documents_verified_count, documents_missing_count, status')
        .eq('status', 'submitted')
        .order('audit_date', { ascending: true })
        .limit(12) as any);

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isCeo) return null;

  // Transform data for chart
  const chartData = audits.map(a => ({
    period: a.audit_period,
    siloVariance: Math.abs(a.silo_variance_pct || 0),
    cashVariance: Math.abs(a.cash_variance_pct || 0),
    docsVerified: a.documents_verified_count,
    docsMissing: a.documents_missing_count,
  }));

  // Calculate averages
  const avgSiloVariance = audits.length > 0 
    ? (audits.reduce((sum, a) => sum + Math.abs(a.silo_variance_pct || 0), 0) / audits.length).toFixed(2)
    : '0';
  const avgCashVariance = audits.length > 0 
    ? (audits.reduce((sum, a) => sum + Math.abs(a.cash_variance_pct || 0), 0) / audits.length).toFixed(2)
    : '0';

  // Trend analysis
  const latestAudit = audits[audits.length - 1];
  const previousAudit = audits[audits.length - 2];
  const siloTrend = latestAudit && previousAudit 
    ? (Math.abs(latestAudit.silo_variance_pct) - Math.abs(previousAudit.silo_variance_pct))
    : 0;
  const cashTrend = latestAudit && previousAudit 
    ? (Math.abs(latestAudit.cash_variance_pct) - Math.abs(previousAudit.cash_variance_pct))
    : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Historique Audits Externes</CardTitle>
              <CardDescription>Tendance des écarts bi-mensuels</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAudits}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : audits.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mb-2 opacity-50" />
            <p>Aucun audit soumis</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Moy. Écart Silo</p>
                <p className="text-lg font-bold">{avgSiloVariance}%</p>
                <div className="flex items-center gap-1 text-xs">
                  {siloTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                  )}
                  <span className={siloTrend > 0 ? 'text-red-500' : 'text-emerald-500'}>
                    {siloTrend > 0 ? '+' : ''}{siloTrend.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Moy. Écart Caisse</p>
                <p className="text-lg font-bold">{avgCashVariance}%</p>
                <div className="flex items-center gap-1 text-xs">
                  {cashTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                  )}
                  <span className={cashTrend > 0 ? 'text-red-500' : 'text-emerald-500'}>
                    {cashTrend > 0 ? '+' : ''}{cashTrend.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Audits</p>
                <p className="text-lg font-bold">{audits.length}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Dernier Audit</p>
                <p className="text-sm font-medium">
                  {latestAudit ? format(new Date(latestAudit.audit_date), 'dd MMM', { locale: fr }) : '-'}
                </p>
              </div>
            </div>

            {/* Variance Trend Chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="siloVariance" 
                    name="Écart Silo" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cashVariance" 
                    name="Écart Caisse" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Alert for high variance */}
            {latestAudit && (Math.abs(latestAudit.silo_variance_pct) > 5 || Math.abs(latestAudit.cash_variance_pct) > 3) && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Écart élevé détecté dans le dernier audit</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}