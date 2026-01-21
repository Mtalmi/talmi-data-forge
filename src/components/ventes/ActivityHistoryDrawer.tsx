import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  History,
  FileText,
  ShoppingCart,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  Truck,
  Factory,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'devis' | 'bc' | 'bl';
  action: string;
  reference_id: string;
  client_name?: string;
  timestamp: string;
  details?: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <FileText className="h-4 w-4 text-primary" />,
  converted: <ArrowRight className="h-4 w-4 text-success" />,
  accepted: <CheckCircle className="h-4 w-4 text-success" />,
  refused: <XCircle className="h-4 w-4 text-destructive" />,
  expired: <Clock className="h-4 w-4 text-muted-foreground" />,
  production_launched: <Factory className="h-4 w-4 text-warning" />,
  delivered: <Truck className="h-4 w-4 text-success" />,
  status_changed: <RefreshCw className="h-4 w-4 text-primary" />,
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Créé',
  converted: 'Converti en BC',
  accepted: 'Accepté',
  refused: 'Refusé',
  expired: 'Expiré',
  production_launched: 'Production lancée',
  delivered: 'Livré',
  status_changed: 'Statut modifié',
};

export function ActivityHistoryDrawer() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchRecentActivity();
    }
  }, [open]);

  const fetchRecentActivity = async () => {
    setLoading(true);
    try {
      // Fetch recent devis
      const { data: recentDevis } = await supabase
        .from('devis')
        .select('devis_id, client_id, statut, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(15);

      // Fetch recent BC
      const { data: recentBc } = await supabase
        .from('bons_commande')
        .select('bc_id, client_id, statut, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(15);

      // Fetch client names
      const clientIds = [
        ...(recentDevis?.map(d => d.client_id).filter(Boolean) || []),
        ...(recentBc?.map(b => b.client_id).filter(Boolean) || []),
      ];
      
      const { data: clients } = await supabase
        .from('clients')
        .select('client_id, nom_client')
        .in('client_id', [...new Set(clientIds)]);

      const clientMap = new Map(clients?.map(c => [c.client_id, c.nom_client]) || []);

      // Build activity list
      const activityList: ActivityItem[] = [];

      // Add devis activities
      recentDevis?.forEach(d => {
        const action = d.statut === 'en_attente' ? 'created' :
                       d.statut === 'converti' ? 'converted' :
                       d.statut === 'accepte' ? 'accepted' :
                       d.statut === 'refuse' ? 'refused' :
                       d.statut === 'expire' ? 'expired' : 'status_changed';
        
        activityList.push({
          id: `devis-${d.devis_id}`,
          type: 'devis',
          action,
          reference_id: d.devis_id,
          client_name: d.client_id ? clientMap.get(d.client_id) : undefined,
          timestamp: d.updated_at,
        });
      });

      // Add BC activities
      recentBc?.forEach(b => {
        const action = b.statut === 'pret_production' ? 'created' :
                       b.statut === 'en_production' ? 'production_launched' :
                       b.statut === 'termine' || b.statut === 'livre' ? 'delivered' : 'status_changed';
        
        activityList.push({
          id: `bc-${b.bc_id}`,
          type: 'bc',
          action,
          reference_id: b.bc_id,
          client_name: clientMap.get(b.client_id),
          timestamp: b.updated_at,
        });
      });

      // Sort by timestamp
      activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(activityList.slice(0, 25));
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: 'devis' | 'bc' | 'bl') => {
    switch (type) {
      case 'devis':
        return <Badge variant="outline" className="bg-warning/10 text-warning text-xs">Devis</Badge>;
      case 'bc':
        return <Badge variant="outline" className="bg-primary/10 text-primary text-xs">BC</Badge>;
      case 'bl':
        return <Badge variant="outline" className="bg-success/10 text-success text-xs">BL</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Historique
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Activité Récente
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-1 pr-4">
                {activities.map((activity, index) => {
                  const icon = ACTION_ICONS[activity.action] || ACTION_ICONS.status_changed;
                  const label = ACTION_LABELS[activity.action] || 'Mis à jour';
                  const isToday = format(new Date(activity.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
                        index === 0 && "bg-primary/5 border border-primary/20"
                      )}
                    >
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeBadge(activity.type)}
                          <span className="font-mono text-sm font-medium truncate">
                            {activity.reference_id}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {label}
                          {activity.client_name && (
                            <> • <span className="text-foreground">{activity.client_name}</span></>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isToday
                            ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: fr })
                            : format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={fetchRecentActivity}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
