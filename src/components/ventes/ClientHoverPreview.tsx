import { useState, useEffect } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
  CreditCard,
  Star,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ClientData {
  client_id: string;
  nom_client: string;
  telephone?: string | null;
  adresse?: string | null;
  credit_score?: number | null;
  encours_total?: number | null;
  plafond_credit?: number | null;
  delai_paiement_moyen?: number | null;
}

interface ClientStats {
  totalOrders: number;
  totalVolume: number;
  totalRevenue: number;
  lastOrderDate: string | null;
}

interface ClientHoverPreviewProps {
  clientId: string;
  clientName: string;
  children?: React.ReactNode;
}

export function ClientHoverPreview({ clientId, clientName, children }: ClientHoverPreviewProps) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClientData = async () => {
    if (!clientId || client) return;
    
    setLoading(true);
    
    try {
      // Fetch client details
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (clientData) {
        setClient(clientData);
      }

      // Fetch client stats from bons_commande
      const { data: ordersData } = await supabase
        .from('bons_commande')
        .select('volume_m3, total_ht, created_at')
        .eq('client_id', clientId);

      if (ordersData) {
        setStats({
          totalOrders: ordersData.length,
          totalVolume: ordersData.reduce((sum, o) => sum + (o.volume_m3 || 0), 0),
          totalRevenue: ordersData.reduce((sum, o) => sum + (o.total_ht || 0), 0),
          lastOrderDate: ordersData.length > 0 
            ? ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : null,
        });
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10';
    if (score >= 60) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getCreditUsagePercent = () => {
    if (!client?.plafond_credit || !client?.encours_total) return 0;
    return Math.min(100, (client.encours_total / client.plafond_credit) * 100);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M DH`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K DH`;
    return `${value.toLocaleString()} DH`;
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild onMouseEnter={fetchClientData}>
        {children || (
          <span className="cursor-pointer hover:underline decoration-dotted">
            {clientName}
          </span>
        )}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : client ? (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">{client.nom_client}</h4>
                </div>
                {client.telephone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {client.telephone}
                  </div>
                )}
                {client.adresse && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{client.adresse}</span>
                  </div>
                )}
              </div>
              
              {/* Credit Score Badge */}
              {client.credit_score && (
                <Badge 
                  variant="outline" 
                  className={cn("gap-1", getCreditScoreColor(client.credit_score))}
                >
                  <Star className="h-3 w-3" />
                  {client.credit_score}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Credit Status */}
            {client.plafond_credit && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Encours / Plafond
                  </span>
                  <span className="font-medium">
                    {formatCurrency(client.encours_total || 0)} / {formatCurrency(client.plafond_credit)}
                  </span>
                </div>
                <Progress 
                  value={getCreditUsagePercent()} 
                  className={cn(
                    "h-2",
                    getCreditUsagePercent() > 90 && "[&>div]:bg-destructive",
                    getCreditUsagePercent() > 70 && getCreditUsagePercent() <= 90 && "[&>div]:bg-warning"
                  )}
                />
                {getCreditUsagePercent() > 80 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Proche du plafond de crédit
                  </p>
                )}
              </div>
            )}

            {/* Stats */}
            {stats && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Package className="h-3 w-3" />
                      Commandes
                    </div>
                    <p className="font-semibold">{stats.totalOrders}</p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <TrendingUp className="h-3 w-3" />
                      Volume total
                    </div>
                    <p className="font-semibold">{stats.totalVolume.toFixed(0)} m³</p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <CreditCard className="h-3 w-3" />
                      CA Total
                    </div>
                    <p className="font-semibold">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="h-3 w-3" />
                      Délai paiement
                    </div>
                    <p className="font-semibold">
                      {client.delai_paiement_moyen 
                        ? `${client.delai_paiement_moyen}j` 
                        : '—'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Client non trouvé
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
