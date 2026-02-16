import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Download, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Invoice {
  facture_id: string;
  bl_id: string;
  date_facture: string;
  total_ht: number;
  total_ttc: number;
  tva_pct: number;
  statut: string;
  volume_m3: number;
  mode_paiement: string | null;
}

const INVOICE_STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  brouillon: { label: 'Brouillon', icon: Clock, color: 'text-muted-foreground bg-muted/30' },
  emise: { label: 'Émise', icon: FileText, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  payee: { label: 'Payée', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  en_retard: { label: 'En Retard', icon: AlertTriangle, color: 'text-destructive bg-destructive/10 border-destructive/20' },
  annulee: { label: 'Annulée', icon: AlertTriangle, color: 'text-muted-foreground bg-muted/30' },
};

export function ClientPortalInvoices({ clientId }: { clientId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('factures')
        .select('facture_id, bl_id, date_facture, total_ht, total_ttc, tva_pct, statut, volume_m3, mode_paiement')
        .eq('client_id', clientId)
        .order('date_facture', { ascending: false })
        .limit(50);

      setInvoices(data || []);
      setLoading(false);
    }
    fetch();
  }, [clientId]);

  if (loading) {
    return <div className="space-y-2 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30" />)}</div>;
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aucune facture</p>
      </div>
    );
  }

  const totalPaid = invoices.filter(i => i.statut === 'payee').reduce((s, i) => s + i.total_ttc, 0);
  const totalDue = invoices.filter(i => i.statut !== 'payee' && i.statut !== 'annulee').reduce((s, i) => s + i.total_ttc, 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-medium">Payé</p>
          <p className="text-lg font-bold text-emerald-500 tabular-nums">{(totalPaid / 1000).toFixed(1)}K DH</p>
        </div>
        <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="text-[10px] text-destructive uppercase tracking-wider font-medium">Restant dû</p>
          <p className="text-lg font-bold text-destructive tabular-nums">{(totalDue / 1000).toFixed(1)}K DH</p>
        </div>
      </div>

      {/* Invoice List */}
      {invoices.map((inv, i) => {
        const statusConfig = INVOICE_STATUS[inv.statut] || INVOICE_STATUS.brouillon;
        const StatusIcon = statusConfig.icon;
        return (
          <motion.div
            key={inv.facture_id}
            initial={{ x: -8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 bg-card/50 transition-colors"
          >
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', statusConfig.color)}>
              <StatusIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold font-mono">{inv.facture_id}</span>
                <Badge variant="outline" className={cn('text-[10px]', statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{format(new Date(inv.date_facture), 'dd MMM yyyy', { locale: fr })}</span>
                <span>•</span>
                <span>{inv.volume_m3} m³</span>
                {inv.mode_paiement && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{inv.mode_paiement}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold tabular-nums">{inv.total_ttc.toLocaleString('fr-FR')} DH</p>
              <p className="text-[10px] text-muted-foreground">HT: {inv.total_ht.toLocaleString('fr-FR')}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
