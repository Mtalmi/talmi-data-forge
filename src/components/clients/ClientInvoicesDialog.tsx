import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FacturePdfGenerator } from '@/components/documents/FacturePdfGenerator';
import { 
  Loader2, 
  FileText, 
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Facture {
  id: string;
  facture_id: string;
  bl_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  tva_pct: number;
  total_ttc: number;
  statut: string;
  date_facture: string; // This is the actual column name in DB
  mode_paiement: string | null;
  prix_livraison_m3: number | null;
  cur_reel: number | null;
  marge_brute_dh: number | null;
  marge_brute_pct: number | null;
}

interface ClientInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function ClientInvoicesDialog({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName 
}: ClientInvoicesDialogProps) {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && clientId) {
      fetchFactures();
    }
  }, [open, clientId]);

  const fetchFactures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('factures')
        .select('*')
        .eq('client_id', clientId)
        .order('date_facture', { ascending: false });

      if (error) throw error;
      setFactures(data || []);
    } catch (error) {
      console.error('Error fetching factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'payee':
      case 'payé':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payée
          </Badge>
        );
      case 'en_attente':
      case 'en attente':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En Attente
          </Badge>
        );
      case 'retard':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            En Retard
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut || 'N/A'}</Badge>;
    }
  };

  const totalFactures = factures.reduce((sum, f) => sum + (f.total_ttc || 0), 0);
  const totalPayees = factures
    .filter(f => f.statut?.toLowerCase() === 'payee' || f.statut?.toLowerCase() === 'payé')
    .reduce((sum, f) => sum + (f.total_ttc || 0), 0);
  const totalEnAttente = totalFactures - totalPayees;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Factures - {clientName}
          </DialogTitle>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground font-medium">Total Facturé</p>
            <p className="text-lg font-bold">{totalFactures.toLocaleString('fr-FR')} DH</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10">
            <p className="text-xs text-success font-medium">Payé</p>
            <p className="text-lg font-bold text-success">{totalPayees.toLocaleString('fr-FR')} DH</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10">
            <p className="text-xs text-warning font-medium">En Attente</p>
            <p className="text-lg font-bold text-warning">{totalEnAttente.toLocaleString('fr-FR')} DH</p>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : factures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucune facture pour ce client</p>
              <p className="text-xs text-muted-foreground mt-1">
                Les factures seront générées lors de la livraison des commandes
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>BL</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factures.map((facture) => (
                  <TableRow key={facture.id}>
                    <TableCell className="font-mono font-medium">
                      {facture.facture_id}
                    </TableCell>
                    <TableCell>
                      {facture.date_facture 
                        ? format(new Date(facture.date_facture), 'dd MMM yyyy', { locale: fr })
                        : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {facture.bl_id}
                    </TableCell>
                    <TableCell className="text-right">
                      {facture.volume_m3} m³
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {facture.total_ttc?.toLocaleString('fr-FR')} DH
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(facture.statut)}
                    </TableCell>
                    <TableCell className="text-right">
                      <FacturePdfGenerator 
                        facture={{
                          facture_id: facture.facture_id,
                          bl_id: facture.bl_id,
                          volume_m3: facture.volume_m3,
                          prix_vente_m3: facture.prix_vente_m3,
                          total_ht: facture.total_ht,
                          tva_pct: facture.tva_pct,
                          total_ttc: facture.total_ttc,
                          cur_reel: facture.cur_reel,
                          marge_brute_pct: facture.marge_brute_pct,
                          date_emission: facture.date_facture,
                          formule_id: facture.formule_id,
                          client: {
                            nom_client: clientName,
                            adresse: null,
                            telephone: null,
                          },
                        }}
                        compact
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}