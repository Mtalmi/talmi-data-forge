import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Loader2, Check, Bell, AlertCircle, TrendingDown, CreditCard, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Alerte {
  id: string;
  type_alerte: string;
  niveau: string;
  titre: string;
  message: string;
  reference_id: string | null;
  reference_table: string | null;
  destinataire_role: string | null;
  lu: boolean;
  lu_par: string | null;
  lu_at: string | null;
  created_at: string;
}

export default function Alertes() {
  const { user, isCeo } = useAuth();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  if (!isCeo) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchAlertes();
  }, []);

  const fetchAlertes = async () => {
    try {
      const { data, error } = await supabase
        .from('alertes_systeme')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlertes(data || []);
    } catch (error) {
      console.error('Error fetching alertes:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alertes_systeme')
        .update({
          lu: true,
          lu_par: user?.id,
          lu_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchAlertes();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      fuite: <TrendingDown className="h-5 w-5" />,
      marge: <AlertCircle className="h-5 w-5" />,
      credit: <CreditCard className="h-5 w-5" />,
      planification: <Truck className="h-5 w-5" />,
      retard: <AlertTriangle className="h-5 w-5" />,
      technique: <AlertCircle className="h-5 w-5" />,
    };
    return icons[type] || <Bell className="h-5 w-5" />;
  };

  const getNiveauStyle = (niveau: string) => {
    const styles: Record<string, string> = {
      info: 'bg-primary/10 text-primary border-primary/30',
      warning: 'bg-warning/10 text-warning border-warning/30',
      critical: 'bg-destructive/10 text-destructive border-destructive/30',
    };
    return styles[niveau] || styles.info;
  };

  const unreadCount = alertes.filter(a => !a.lu).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alertes Système</h1>
            <p className="text-muted-foreground mt-1">
              Notifications critiques et avertissements
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
              <Bell className="h-5 w-5 text-destructive animate-pulse" />
              <span className="font-semibold text-destructive">{unreadCount} non lue(s)</span>
            </div>
          )}
        </div>

        <div className="card-industrial overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : alertes.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucune alerte</p>
              <p className="text-sm text-muted-foreground mt-1">Le système fonctionne normalement</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alertes.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    'p-4 flex items-start gap-4 transition-colors',
                    !a.lu && 'bg-muted/30'
                  )}
                >
                  <div className={cn('p-2 rounded-lg', getNiveauStyle(a.niveau))}>
                    {getTypeIcon(a.type_alerte)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{a.titre}</h4>
                      {!a.lu && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive text-destructive-foreground">
                          NOUVEAU
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.message}</p>
                    {a.reference_id && (
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        Réf: {a.reference_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(a.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  {!a.lu && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => markAsRead(a.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Marquer lu
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
