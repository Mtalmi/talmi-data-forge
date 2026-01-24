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
  ShieldAlert,
  Bell,
  Send,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  isOffHoursCasablanca, 
  getHourInCasablanca, 
  formatCasablancaTime,
  isCurrentlyOffHours 
} from '@/lib/timezone';

interface MidnightTransaction {
  id: string;
  type: 'expense' | 'stock' | 'delivery';
  description: string;
  amount?: number;
  created_at: string;
  created_by_name?: string;
  hour: number;
  justification_urgence?: string;
}

export function MidnightAlertWidget() {
  const [transactions, setTransactions] = useState<MidnightTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingAlerts, setSendingAlerts] = useState<Set<string>>(new Set());
  const [sentAlerts, setSentAlerts] = useState<Set<string>>(new Set());

  const fetchMidnightTransactions = useCallback(async () => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses_controlled')
        .select('id, description, montant_ttc, created_at, requested_by_name, notes')
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

      // Process expenses - using timezone-locked Casablanca time
      expenses?.forEach(exp => {
        if (isOffHoursCasablanca(exp.created_at)) {
          // Check if notes contain justification (format: [URGENCE: ...])
          const justificationMatch = exp.notes?.match(/\[URGENCE:\s*(.+?)\]/);
          allTransactions.push({
            id: exp.id,
            type: 'expense',
            description: exp.description,
            amount: exp.montant_ttc,
            created_at: exp.created_at,
            created_by_name: exp.requested_by_name,
            hour: getHourInCasablanca(exp.created_at),
            justification_urgence: justificationMatch?.[1],
          });
        }
      });

      // Process stock receptions - using timezone-locked Casablanca time
      stockReceptions?.forEach(stock => {
        if (isOffHoursCasablanca(stock.created_at)) {
          allTransactions.push({
            id: stock.id,
            type: 'stock',
            description: `${stock.materiau} - ${stock.quantite}T`,
            created_at: stock.created_at,
            hour: getHourInCasablanca(stock.created_at),
          });
        }
      });

      // Process deliveries - using timezone-locked Casablanca time
      deliveries?.forEach((del: any) => {
        if (del.created_at && isOffHoursCasablanca(del.created_at)) {
          const clientName = del.clients?.nom || 'Client';
          allTransactions.push({
            id: del.bl_id,
            type: 'delivery',
            description: `${clientName} - ${del.volume_m3}m³`,
            created_at: del.created_at,
            hour: getHourInCasablanca(del.created_at),
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

  const handleSendCeoAlert = async (tx: MidnightTransaction) => {
    const txKey = `${tx.type}-${tx.id}`;
    setSendingAlerts(prev => new Set(prev).add(txKey));
    
    try {
      // Simulate sending alert to CEO (in production, this would call an edge function)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log the alert to audit_superviseur for forensic trail
      const { error } = await supabase
        .from('audit_superviseur')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id || 'system',
          user_name: 'Système Alerte Nocturne',
          action: 'CEO_MIDNIGHT_ALERT',
          table_name: tx.type === 'expense' ? 'expenses_controlled' : 
                      tx.type === 'stock' ? 'stock_receptions_pending' : 'bons_livraison_reels',
          record_id: tx.id,
          changes: {
            type: tx.type,
            description: tx.description,
            amount: tx.amount,
            hour: tx.hour,
            justification: tx.justification_urgence || 'Non fournie',
            created_by: tx.created_by_name,
          },
        });

      if (error) throw error;

      setSentAlerts(prev => new Set(prev).add(txKey));
      
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">📱 Alerte CEO Envoyée</p>
          <p className="text-xs text-muted-foreground">
            {tx.description} ({tx.hour}h) - Notifié au tableau de bord CEO
          </p>
        </div>,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Error sending CEO alert:', error);
      toast.error('Erreur lors de l\'envoi de l\'alerte');
    } finally {
      setSendingAlerts(prev => {
        const next = new Set(prev);
        next.delete(txKey);
        return next;
      });
    }
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

  // Check if currently in off-hours window (for status indicator)
  const currentlyOffHours = isCurrentlyOffHours();

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
              {currentlyOffHours && (
                <Badge variant="destructive" className="text-[9px] animate-pulse">
                  MODE NUIT ACTIF
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Transactions 18h-00h</span>
              <Badge variant="outline" className="text-[9px] ml-1">
                🇲🇦 Casablanca
              </Badge>
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
              Pas de transactions hors heures (18h-00h Casablanca)
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-2">
              {transactions.map((tx) => {
                const txKey = `${tx.type}-${tx.id}`;
                const isSending = sendingAlerts.has(txKey);
                const isSent = sentAlerts.has(txKey);
                
                return (
                  <div
                    key={txKey}
                    className={cn(
                      "p-3 rounded-lg border-l-4 bg-destructive/10 border-l-destructive",
                      "transition-all hover:bg-destructive/15"
                    )}
                  >
                    {/* Header with EMERGENCY Badge */}
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
                            {formatCasablancaTime(tx.created_at)}
                          </p>
                        </div>
                      </div>
                      {/* EMERGENCY Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant="destructive" 
                          className="text-[9px] animate-pulse gap-1"
                        >
                          🚨 EMERGENCY
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-[10px] border-destructive text-destructive shrink-0"
                        >
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          {tx.hour}h 🇲🇦
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-foreground line-clamp-2 mb-1">
                      {tx.description}
                    </p>

                    {/* STICKY NOTE: Always visible justification */}
                    <div className={cn(
                      "mt-2 p-2.5 rounded-lg border-2 shadow-sm",
                      tx.justification_urgence 
                        ? "bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 border-warning/50" 
                        : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-destructive/50"
                    )}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📝</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-[10px] font-bold uppercase tracking-wider mb-1",
                            tx.justification_urgence ? "text-warning" : "text-destructive"
                          )}>
                            {tx.justification_urgence ? "Justification d'Urgence" : "⚠️ Aucune Justification"}
                          </p>
                          <p className={cn(
                            "text-[11px] leading-relaxed",
                            tx.justification_urgence ? "text-foreground italic" : "text-muted-foreground"
                          )}>
                            {tx.justification_urgence 
                              ? `"${tx.justification_urgence}"` 
                              : "Travail nocturne sans justification fournie - Investigation CEO recommandée"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
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

                    {/* CEO Alert Button */}
                    <div className="mt-2 pt-2 border-t border-destructive/20">
                      <Button
                        variant={isSent ? "secondary" : "destructive"}
                        size="sm"
                        className="w-full h-8 text-xs gap-1.5"
                        onClick={() => handleSendCeoAlert(tx)}
                        disabled={isSending || isSent}
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : isSent ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Alerte CEO Envoyée
                          </>
                        ) : (
                          <>
                            <Bell className="h-3 w-3" />
                            <Send className="h-3 w-3" />
                            Alerter CEO
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Warning Banner */}
        {transactions.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-[11px] text-destructive">
                <span className="font-bold">ALERTE SÉCURITÉ:</span> Transactions effectuées hors heures (18h-00h heure Casablanca).
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
