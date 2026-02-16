import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Order {
  bc_id: string;
  statut: string;
  volume_m3: number;
  total_ht: number;
  date_livraison_souhaitee: string | null;
  adresse_livraison: string | null;
  formule_designation: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-muted/50 text-muted-foreground' },
  confirme: { label: 'Confirmé', color: 'bg-blue-500/15 text-blue-500 border-blue-500/20' },
  en_cours: { label: 'En Cours', color: 'bg-primary/15 text-primary border-primary/20' },
  planifie: { label: 'Planifié', color: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/20' },
  livre: { label: 'Livré', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
  facture: { label: 'Facturé', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' },
  annule: { label: 'Annulé', color: 'bg-destructive/15 text-destructive border-destructive/20' },
};

export function ClientPortalOrders({ clientId }: { clientId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('bons_commande')
        .select(`
          bc_id, statut, volume_m3, total_ht, 
          date_livraison_souhaitee, adresse_livraison, created_at,
          formules_theoriques (designation)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50);

      setOrders((data || []).map((o: any) => ({
        ...o,
        formule_designation: o.formules_theoriques?.designation || 'Béton',
      })));
      setLoading(false);
    }
    fetch();
  }, [clientId]);

  if (loading) {
    return <div className="space-y-2 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30" />)}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aucune commande</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order, i) => {
        const status = STATUS_MAP[order.statut] || STATUS_MAP.brouillon;
        return (
          <motion.div
            key={order.bc_id}
            initial={{ x: -8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 bg-card/50 transition-colors cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold font-mono">{order.bc_id}</span>
                <Badge variant="outline" className={cn('text-[10px]', status.color)}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{order.formule_designation}</span>
                <span>•</span>
                <span className="font-medium">{order.volume_m3} m³</span>
                {order.date_livraison_souhaitee && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.date_livraison_souhaitee), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold tabular-nums">{order.total_ht.toLocaleString('fr-FR')} DH</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        );
      })}
    </div>
  );
}
