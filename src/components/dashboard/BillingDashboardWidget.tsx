import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Receipt, TrendingUp, Clock, AlertTriangle, CheckCircle,
  DollarSign, Users, BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface BillingStats {
  totalFacture: number;
  totalEncaisse: number;
  totalImpaye: number;
  tauxRecouvrement: number;
  dso: number;
  nbFactures: number;
  nbPayees: number;
  nbRetard: number;
  topImpayes: { client: string; montant: number }[];
  agingData: { label: string; montant: number; color: string }[];
}

export function BillingDashboardWidget() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data: factures } = await supabase
        .from('factures')
        .select('facture_id, client_id, total_ttc, statut, date_facture')
        .order('date_facture', { ascending: false });

      if (!factures) return;

      // Fetch partial payments
      const factureIds = factures.map(f => f.facture_id);
      const { data: paiements } = await supabase
        .from('paiements_partiels')
        .select('facture_id, montant_paye')
        .in('facture_id', factureIds);

      // Fetch client names
      const clientIds = [...new Set(factures.map(f => f.client_id))];
      const { data: clients } = await supabase
        .from('clients')
        .select('client_id, nom_client')
        .in('client_id', clientIds);

      const clientMap = new Map(clients?.map(c => [c.client_id, c.nom_client]) || []);

      // Calculate partial payments per invoice
      const paidMap = new Map<string, number>();
      paiements?.forEach(p => {
        paidMap.set(p.facture_id, (paidMap.get(p.facture_id) || 0) + Number(p.montant_paye));
      });

      const totalFacture = factures.reduce((s, f) => s + f.total_ttc, 0);
      const payees = factures.filter(f => f.statut === 'payee');
      const totalEncaisseFromStatus = payees.reduce((s, f) => s + f.total_ttc, 0);
      const totalPartial = Array.from(paidMap.values()).reduce((s, v) => s + v, 0);
      const totalEncaisse = Math.max(totalEncaisseFromStatus, totalPartial + totalEncaisseFromStatus * 0.5);

      const retard = factures.filter(f => f.statut === 'retard');
      const impayes = factures.filter(f => f.statut !== 'payee');

      // DSO calculation
      const today = new Date();
      const paidInvoices = payees.filter(f => f.date_facture);
      const avgDays = paidInvoices.length > 0
        ? paidInvoices.reduce((s, f) => {
            const diff = Math.floor((today.getTime() - new Date(f.date_facture).getTime()) / 86400000);
            return s + Math.min(diff, 90);
          }, 0) / paidInvoices.length
        : 0;

      // Top unpaid by client
      const clientTotals = new Map<string, number>();
      impayes.forEach(f => {
        const paid = paidMap.get(f.facture_id) || 0;
        const remaining = f.total_ttc - paid;
        if (remaining > 0) {
          const name = clientMap.get(f.client_id) || f.client_id;
          clientTotals.set(name, (clientTotals.get(name) || 0) + remaining);
        }
      });
      const topImpayes = Array.from(clientTotals.entries())
        .map(([client, montant]) => ({ client, montant }))
        .sort((a, b) => b.montant - a.montant)
        .slice(0, 5);

      // Aging buckets
      const buckets = [
        { label: '0-30j', min: 0, max: 30, montant: 0, color: 'hsl(var(--success))' },
        { label: '31-60j', min: 31, max: 60, montant: 0, color: 'hsl(var(--warning))' },
        { label: '61-90j', min: 61, max: 90, montant: 0, color: 'hsl(var(--accent))' },
        { label: '90j+', min: 91, max: 9999, montant: 0, color: 'hsl(var(--destructive))' },
      ];

      impayes.forEach(f => {
        const days = Math.floor((today.getTime() - new Date(f.date_facture).getTime()) / 86400000);
        const paid = paidMap.get(f.facture_id) || 0;
        const remaining = f.total_ttc - paid;
        if (remaining > 0) {
          const bucket = buckets.find(b => days >= b.min && days <= b.max);
          if (bucket) bucket.montant += remaining;
        }
      });

      setStats({
        totalFacture,
        totalEncaisse: totalEncaisseFromStatus,
        totalImpaye: totalFacture - totalEncaisseFromStatus,
        tauxRecouvrement: totalFacture > 0 ? (totalEncaisseFromStatus / totalFacture) * 100 : 0,
        dso: Math.round(avgDays),
        nbFactures: factures.length,
        nbPayees: payees.length,
        nbRetard: retard.length,
        topImpayes,
        agingData: buckets.map(b => ({ label: b.label, montant: b.montant, color: b.color })),
      });
    } catch (error) {
      console.error('Error fetching billing stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Dashboard Facturation
          </CardTitle>
        </CardHeader>
        <CardContent><div className="h-48 bg-muted/50 rounded-lg" /></CardContent>
      </Card>
    );
  }

  const formatK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toLocaleString();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Dashboard Facturation CEO
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[10px]">
            {stats.nbFactures} factures
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">CA Facturé</span>
            </div>
            <p className="text-lg font-bold font-mono">{formatK(stats.totalFacture)} DH</p>
          </div>
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Encaissé</span>
            </div>
            <p className="text-lg font-bold font-mono text-success">{formatK(stats.totalEncaisse)} DH</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-warning" />
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Impayé</span>
            </div>
            <p className="text-lg font-bold font-mono text-warning">{formatK(stats.totalImpaye)} DH</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">DSO</span>
            </div>
            <p className="text-lg font-bold font-mono">{stats.dso} <span className="text-xs font-normal">jours</span></p>
          </div>
        </div>

        {/* Recovery Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Taux de recouvrement</span>
            <span className={cn(
              'font-bold',
              stats.tauxRecouvrement >= 80 ? 'text-success' : stats.tauxRecouvrement >= 60 ? 'text-warning' : 'text-destructive'
            )}>
              {stats.tauxRecouvrement.toFixed(1)}%
            </span>
          </div>
          <Progress value={stats.tauxRecouvrement} className="h-2" />
        </div>

        {/* Aging Chart */}
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Aging des Créances</p>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.agingData}>
                <XAxis dataKey="label" className="text-[10px]" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-[10px]" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} DH`} />
                <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
                  {stats.agingData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Unpaid */}
        {stats.topImpayes.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Top Impayés</p>
            <div className="space-y-1.5">
              {stats.topImpayes.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold',
                      i === 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                    )}>
                      {i + 1}
                    </div>
                    <span className="truncate max-w-[160px]">{item.client}</span>
                  </div>
                  <span className="font-mono font-medium text-destructive">
                    {item.montant.toLocaleString()} DH
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
