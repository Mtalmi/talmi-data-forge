import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckSquare, Loader2, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Approbation {
  id: string;
  type_approbation: string;
  reference_id: string;
  reference_table: string;
  demande_par: string;
  demande_at: string;
  statut: string;
  approuve_par: string | null;
  approuve_at: string | null;
  commentaire: string | null;
  montant: number | null;
  details: unknown;
}

export default function Approbations() {
  const { user, isCeo } = useAuth();
  const [approbations, setApprobations] = useState<Approbation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');

  if (!isCeo) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchApprobations();
  }, []);

  const fetchApprobations = async () => {
    try {
      const { data, error } = await supabase
        .from('approbations_ceo')
        .select('*')
        .order('demande_at', { ascending: false });

      if (error) throw error;
      setApprobations(data || []);
    } catch (error) {
      console.error('Error fetching approbations:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, approved: boolean) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('approbations_ceo')
        .update({
          statut: approved ? 'approuve' : 'rejete',
          approuve_par: user?.id,
          approuve_at: new Date().toISOString(),
          commentaire: commentaire || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(approved ? 'Demande approuvée' : 'Demande rejetée');
      setCommentaire('');
      fetchApprobations();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Erreur lors du traitement');
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit: 'Dépassement Crédit',
      prix: 'Modification Prix',
      derogation: 'Dérogation Livraison',
      annulation: 'Annulation BL',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (statut: string) => {
    const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      en_attente: { label: 'En Attente', className: 'bg-warning/20 text-warning', icon: <Clock className="h-3 w-3" /> },
      approuve: { label: 'Approuvé', className: 'bg-success/20 text-success', icon: <Check className="h-3 w-3" /> },
      rejete: { label: 'Rejeté', className: 'bg-destructive/20 text-destructive', icon: <X className="h-3 w-3" /> },
    };
    return config[statut] || config.en_attente;
  };

  const pendingCount = approbations.filter(a => a.statut === 'en_attente').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Approbations CEO</h1>
            <p className="text-muted-foreground mt-1">
              Demandes en attente de votre validation
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30">
              <Clock className="h-5 w-5 text-warning" />
              <span className="font-semibold text-warning">{pendingCount} en attente</span>
            </div>
          )}
        </div>

        <div className="card-industrial overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : approbations.length === 0 ? (
            <div className="p-8 text-center">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucune demande d'approbation</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Demandé le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approbations.map((a) => {
                  const status = getStatusBadge(a.statut);
                  const isPending = a.statut === 'en_attente';
                  const isProcessing = processingId === a.id;

                  return (
                    <TableRow key={a.id} className={isPending ? 'bg-warning/5' : ''}>
                      <TableCell className="font-medium">
                        {getTypeLabel(a.type_approbation)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {a.reference_id}
                      </TableCell>
                      <TableCell>
                        {a.montant ? `${a.montant.toLocaleString()} DH` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(a.demande_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold', status.className)}>
                          {status.icon}
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-success text-success hover:bg-success hover:text-success-foreground"
                              onClick={() => handleApproval(a.id, true)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleApproval(a.id, false)}
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {a.approuve_at && format(new Date(a.approuve_at), 'dd/MM HH:mm', { locale: fr })}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
