import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClipboardCheck, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Shield, Award } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuditRecord {
  id: string;
  audit_period: string;
  compliance_score: number;
  silo_variance_max_pct: number;
  cash_variance_pct: number;
  documents_verified_count: number;
  documents_missing_count: number;
  truck_anomaly_detected: boolean;
  submitted_at: string;
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
      const { data, error } = await supabase
        .from('audits_externes')
        .select('id, audit_period, compliance_score, silo_variance_max_pct, cash_variance_pct, documents_verified_count, documents_missing_count, truck_anomaly_detected, submitted_at, status')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true })
        .limit(12);

      if (error) throw error;
      setAudits((data as AuditRecord[]) || []);
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
    score: a.compliance_score || 0,
    siloVariance: Math.abs(a.silo_variance_max_pct || 0),
    cashVariance: Math.abs(a.cash_variance_pct || 0),
  }));

  // Calculate averages from last 3 audits
  const last3Audits = audits.slice(-3);
  const avgScore = last3Audits.length > 0 
    ? (last3Audits.reduce((sum, a) => sum + (a.compliance_score || 0), 0) / last3Audits.length)
    : 0;

  const latestAudit = audits[audits.length - 1];
  const previousAudit = audits[audits.length - 2];
  const scoreTrend = latestAudit && previousAudit 
    ? (latestAudit.compliance_score || 0) - (previousAudit.compliance_score || 0)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Score de Conformité</CardTitle>
              <CardDescription>Moyenne des 3 derniers audits externes</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAudits}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : audits.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">Aucun audit soumis</p>
            <p className="text-sm">Les audits bi-mensuels apparaîtront ici</p>
          </div>
        ) : (
          <>
            {/* Compliance Score Summary */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl mb-4">
              <div>
                <p className="text-sm text-slate-300 mb-1">Score Moyen (3 derniers)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{avgScore.toFixed(0)}</span>
                  <span className="text-lg text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-5xl font-black",
                  avgScore >= 90 ? "text-emerald-400" : avgScore >= 70 ? "text-amber-400" : "text-red-400"
                )}>
                  {getScoreGrade(avgScore)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Grade</p>
              </div>
              <div className="flex items-center gap-2">
                {scoreTrend >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
                <span className={scoreTrend >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {scoreTrend >= 0 ? '+' : ''}{scoreTrend.toFixed(0)} pts
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Audits</p>
                <p className="text-lg font-bold">{audits.length}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Dernier</p>
                <p className={cn("text-lg font-bold", getScoreColor(latestAudit?.compliance_score || 0))}>
                  {latestAudit?.compliance_score?.toFixed(0) || '—'}
                </p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Écart Max</p>
                <p className="text-lg font-bold">{(latestAudit?.silo_variance_max_pct || 0).toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Anomalies</p>
                <p className="text-lg font-bold">
                  {audits.filter(a => a.truck_anomaly_detected).length}
                </p>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Score Compliance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Alert for low score */}
            {latestAudit && latestAudit.compliance_score < 70 && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Score de conformité critique - Action requise</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}