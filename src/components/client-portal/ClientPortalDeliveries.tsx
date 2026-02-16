import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Truck, Calendar, CheckCircle2, Clock, Package, Navigation, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Delivery {
  bl_id: string;
  bc_id: string | null;
  workflow_status: string | null;
  volume_m3: number;
  date_livraison: string;
  statut_paiement: string;
  chauffeur_nom: string | null;
  camion_assigne: string | null;
  client_confirmed_at: string | null;
  client_confirmed_by_name: string | null;
}

const WORKFLOW_STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  planification: { label: 'Planifié', icon: Clock, color: 'text-muted-foreground bg-muted/30' },
  production: { label: 'Production', icon: Package, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  validation_technique: { label: 'Contrôle', icon: CheckCircle2, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
  en_livraison: { label: 'En Route', icon: Navigation, color: 'text-primary bg-primary/10 border-primary/20' },
  livre: { label: 'Livré', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  annule: { label: 'Annulé', icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20' },
};

export function ClientPortalDeliveries({ clientId }: { clientId: string }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, bc_id, workflow_status, volume_m3, date_livraison, statut_paiement, chauffeur_nom, camion_assigne, client_confirmed_at, client_confirmed_by_name')
        .eq('client_id', clientId)
        .order('date_livraison', { ascending: false })
        .limit(50);

      setDeliveries(data || []);
      setLoading(false);
    }
    fetch();
  }, [clientId]);

  if (loading) {
    return <div className="space-y-2 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30" />)}</div>;
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aucune livraison</p>
      </div>
    );
  }

  // Group by date
  const grouped = deliveries.reduce<Record<string, Delivery[]>>((acc, d) => {
    const key = d.date_livraison;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {format(new Date(date), 'EEEE dd MMMM yyyy', { locale: fr })}
            </span>
            <Badge variant="outline" className="text-[10px]">{items.length} BL</Badge>
          </div>
          <div className="space-y-1.5 ml-5">
            {items.map((delivery, i) => {
              const statusConfig = WORKFLOW_STATUS[delivery.workflow_status || 'planification'] || WORKFLOW_STATUS.planification;
              const StatusIcon = statusConfig.icon;
              return (
                <motion.div
                  key={delivery.bl_id}
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-primary/30 bg-card/50 transition-colors"
                >
                  <div className={cn('h-7 w-7 rounded-md flex items-center justify-center shrink-0', statusConfig.color)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono">{delivery.bl_id}</span>
                      <Badge variant="outline" className={cn('text-[9px]', statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                      {delivery.client_confirmed_at && (
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          ✓ Confirmé
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-medium">{delivery.volume_m3} m³</span>
                      {delivery.camion_assigne && <span>• {delivery.camion_assigne}</span>}
                      {delivery.chauffeur_nom && <span>• {delivery.chauffeur_nom}</span>}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] shrink-0',
                      delivery.statut_paiement === 'Payé'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-primary/10 text-primary border-primary/20'
                    )}
                  >
                    {delivery.statut_paiement}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
