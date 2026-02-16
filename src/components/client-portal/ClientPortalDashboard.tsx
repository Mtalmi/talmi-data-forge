import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Package, FileText, Truck, CreditCard, TrendingUp,
  Calendar, ArrowRight, Clock, CheckCircle2, AlertTriangle,
  Download, Eye, User, Building, Phone, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClientPortalOrders } from './ClientPortalOrders';
import { ClientPortalInvoices } from './ClientPortalInvoices';
import { ClientPortalDeliveries } from './ClientPortalDeliveries';

interface ClientPortalDashboardProps {
  clientId: string;
  clientName: string;
  onClose?: () => void;
}

interface ClientStats {
  totalOrders: number;
  totalVolume: number;
  totalInvoiced: number;
  totalPaid: number;
  pendingPayments: number;
  activeDeliveries: number;
  totalDeliveries: number;
  creditBalance: number;
}

export function ClientPortalDashboard({ clientId, clientName, onClose }: ClientPortalDashboardProps) {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = useCallback(async () => {
    try {
      const [ordersRes, invoicesRes, deliveriesRes, clientRes] = await Promise.all([
        supabase
          .from('bons_commande')
          .select('bc_id, volume_m3, statut, total_ht')
          .eq('client_id', clientId),
        supabase
          .from('factures')
          .select('facture_id, total_ht, total_ttc, statut, date_facture')
          .eq('client_id', clientId),
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, volume_m3, workflow_status, statut_paiement')
          .eq('client_id', clientId),
        supabase
          .from('clients')
          .select('solde_du')
          .eq('client_id', clientId)
          .maybeSingle(),
      ]);

      const orders = ordersRes.data || [];
      const invoices = invoicesRes.data || [];
      const deliveries = deliveriesRes.data || [];
      const client = clientRes.data;

      setStats({
        totalOrders: orders.length,
        totalVolume: deliveries.reduce((sum, d) => sum + (d.volume_m3 || 0), 0),
        totalInvoiced: invoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0),
        totalPaid: invoices.filter(i => i.statut === 'payee').reduce((sum, i) => sum + (i.total_ttc || 0), 0),
        pendingPayments: invoices.filter(i => i.statut !== 'payee').reduce((sum, i) => sum + (i.total_ttc || 0), 0),
        activeDeliveries: deliveries.filter(d => ['planification', 'production', 'en_livraison'].includes(d.workflow_status || '')).length,
        totalDeliveries: deliveries.length,
        creditBalance: client?.solde_du || 0,
      });
    } catch (err) {
      console.error('[ClientPortal] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-xl bg-muted/30" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-muted/30" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Commandes', value: stats?.totalOrders || 0, icon: Package, color: 'text-primary' },
    { label: 'Volume Total', value: `${stats?.totalVolume || 0} m³`, icon: Truck, color: 'text-blue-500' },
    { label: 'Facturé TTC', value: `${((stats?.totalInvoiced || 0) / 1000).toFixed(1)}K`, icon: FileText, color: 'text-emerald-500' },
    { label: 'Impayés', value: `${((stats?.pendingPayments || 0) / 1000).toFixed(1)}K`, icon: CreditCard, color: stats?.pendingPayments ? 'text-destructive' : 'text-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Client Header */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Building className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{clientName}</h2>
          <p className="text-xs text-muted-foreground">{clientId} • Portail Client</p>
        </div>
        {stats && stats.activeDeliveries > 0 && (
          <Badge className="bg-primary/15 text-primary border-primary/20">
            <Truck className="h-3 w-3 mr-1" />
            {stats.activeDeliveries} en cours
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={cn('h-4 w-4', stat.color)} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Progress */}
      {stats && stats.totalInvoiced > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Taux de paiement</span>
              <span className="text-xs font-bold text-primary">
                {Math.round((stats.totalPaid / stats.totalInvoiced) * 100)}%
              </span>
            </div>
            <Progress value={(stats.totalPaid / stats.totalInvoiced) * 100} className="h-2" />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">
                Payé: {(stats.totalPaid / 1000).toFixed(1)}K DH
              </span>
              <span className="text-[10px] text-muted-foreground">
                Total: {(stats.totalInvoiced / 1000).toFixed(1)}K DH
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Orders / Invoices / Deliveries */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="orders" className="text-xs gap-1.5">
            <Package className="h-3.5 w-3.5" /> Commandes
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Factures
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Livraisons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-3">
          <ClientPortalOrders clientId={clientId} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-3">
          <ClientPortalInvoices clientId={clientId} />
        </TabsContent>

        <TabsContent value="deliveries" className="mt-3">
          <ClientPortalDeliveries clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
