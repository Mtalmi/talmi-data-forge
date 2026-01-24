import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Moon, 
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  Package,
  Receipt,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MidnightTransaction {
  id: string;
  type: 'expense' | 'stock' | 'delivery';
  description: string;
  amount?: number;
  created_at: string;
  created_by_name?: string;
  hour: number;
}

export function MidnightAlertWidget() {
  const [transactions, setTransactions] = useState<MidnightTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOffHours = (dateStr: string): boolean => {
    const date = parseISO(dateStr);
    const hour = date.getHours();
    // Off-hours: 18:00 (6pm) to 00:00 (midnight) - War Room Alert Window
    return hour >= 18 && hour <= 23;
  };

  const fetchMidnightTransactions = useCallback(async () => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses_controlled')
        .select('id, description, montant_ttc, created_at, requested_by_name')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      // Fetch stock receptions
      const { data: stockReceptions } = await supabase
        .from('stock_receptions_pending')
        .select('id, materiau, quantite, created_at')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      // Fetch deliveries (BL) - use bons_livraison_reels with client join
      const { data: deliveries } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, volume_m3, created_at, clients(nom)')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      const allTransactions: MidnightTransaction[] = [];

      // Process expenses
      expenses?.forEach(exp => {
        if (isOffHours(exp.created_at)) {
          allTransactions.push({
            id: exp.id,
            type: 'expense',
            description: exp.description,
            amount: exp.montant_ttc,
            created_at: exp.created_at,
            created_by_name: exp.requested_by_name,
            hour: parseISO(exp.created_at).getHours(),
          });
        }
      });

      // Process stock receptions
      stockReceptions?.forEach(stock => {
        if (isOffHours(stock.created_at)) {
          allTransactions.push({
            id: stock.id,
            type: 'stock',
            description: `${stock.materiau} - ${stock.quantite}T`,
            created_at: stock.created_at,
            hour: parseISO(stock.created_at).getHours(),
          });
        }
      });

      // Process deliveries
      deliveries?.forEach((del: any) => {
        if (del.created_at && isOffHours(del.created_at)) {
          const clientName = del.clients?.nom || 'Client';
          allTransactions.push({
            id: del.bl_id,
            type: 'delivery',
            description: `${clientName} - ${del.volume_m3}m³`,
            created_at: del.created_at,
            hour: parseISO(del.created_at).getHours(),
          });
        }
      });

      // Sort by creation time (newest first)
      allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching midnight transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMidnightTransactions();

    // Realtime subscription
    const channel = supabase
      .channel('midnight_alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses_controlled' },
        () => fetchMidnightTransactions()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_receptions_pending' },
        () => fetchMidnightTransactions()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bons_livraison' },
        () => fetchMidnightTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMidnightTransactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMidnightTransactions();
    setRefreshing(false);
  };

  const getTypeIcon = (type: MidnightTransaction['type']) => {
    switch (type) {
      case 'expense':
        return <Receipt className="h-3.5 w-3.5" />;
      case 'stock':
        return <Package className="h-3.5 w-3.5" />;
      case 'delivery':
        return <Package className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type: MidnightTransaction['type']) => {
    switch (type) {
      case 'expense':
        return 'Dépense';
      case 'stock':
        return 'Réception';
      case 'delivery':
        return 'Livraison';
    }
  };

  if (loading) {
    return (
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border mb-2 animate-pulse">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 transition-colors",
      transactions.length > 0 
        ? "border-destructive/50 bg-destructive/5" 
        : "border-border/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Moon className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                transactions.length > 0 ? "text-destructive" : "text-muted-foreground"
              )} />
              <span className={transactions.length > 0 ? "text-destructive" : ""}>
                Alertes Nocturnes
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Transactions entre 18h et minuit (dernières 24h)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <AlertTriangle className="h-3 w-3" />
                {transactions.length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <ShieldAlert className="h-7 w-7 text-success" />
            </div>
            <p className="font-medium text-sm text-success">Aucune activité nocturne</p>
            <p className="text-xs text-muted-foreground">
              Pas de transactions hors heures
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={`${tx.type}-${tx.id}`}
                  className={cn(
                    "p-3 rounded-lg border-l-4 bg-destructive/10 border-l-destructive",
                    "transition-all hover:bg-destructive/15"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-md bg-destructive/20 text-destructive">
                        {getTypeIcon(tx.type)}
                      </span>
                      <div>
                        <p className="font-semibold text-xs text-destructive">
                          {getTypeLabel(tx.type)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {format(parseISO(tx.created_at), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] border-destructive text-destructive shrink-0"
                    >
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {tx.hour}h
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-foreground line-clamp-2 mb-1">
                    {tx.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(parseISO(tx.created_at), { locale: fr, addSuffix: true })}
                    </span>
                    {tx.amount && (
                      <span className="font-mono font-semibold text-destructive">
                        {tx.amount.toLocaleString('fr-MA')} MAD
                      </span>
                    )}
                    {tx.created_by_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        {tx.created_by_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Warning Banner */}
        {transactions.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-[11px] text-destructive">
                <span className="font-bold">ALERTE SÉCURITÉ:</span> Ces transactions ont été effectuées en dehors des heures normales de travail.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
