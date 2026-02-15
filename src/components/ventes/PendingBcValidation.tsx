import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  DollarSign,
  User,
  Package,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { format } from 'date-fns';

interface PendingBc {
  id: string;
  bc_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  prix_vente_m3: number;
  total_ht: number;
  date_livraison_souhaitee: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  client?: { nom_client: string };
  formule?: { designation: string };
}

interface PendingBcValidationProps {
  onRefresh: () => void;
}

export function PendingBcValidation({ onRefresh }: PendingBcValidationProps) {
  const { user, canValidateBcPrice, isCeo, isSuperviseur } = useAuth();
  const [pendingBcs, setPendingBcs] = useState<PendingBc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBc, setSelectedBc] = useState<PendingBc | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPendingBcs = async () => {
    try {
      const { data, error } = await supabase
        .from('bons_commande')
        .select(`
          id, bc_id, client_id, formule_id, volume_m3, prix_vente_m3, total_ht,
          date_livraison_souhaitee, notes, created_at, created_by,
          client:clients!client_id(nom_client),
          formule:formules_theoriques!formule_id(designation)
        `)
        .eq('statut', 'en_attente_validation')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingBcs(data || []);
    } catch (error) {
      console.error('Error fetching pending BCs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBcs();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('pending-bc-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bons_commande',
        filter: 'statut=eq.en_attente_validation',
      }, () => {
        fetchPendingBcs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async () => {
    if (!selectedBc || !canValidateBcPrice) return;
    
    setProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userRole } = await supabase
        .from('user_roles_v2')
        .select('role')
        .eq('user_id', userData.user?.id)
        .single();

      // Get user name from profiles or email
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userData.user?.id)
        .single();

      const { error } = await supabase
        .from('bons_commande')
        .update({
          statut: 'pret_production',
          prix_verrouille: true,
          validated_by: userData.user?.id,
          validated_at: new Date().toISOString(),
          validated_by_name: profile?.full_name || userData.user?.email,
          validated_by_role: userRole?.role,
        })
        .eq('id', selectedBc.id);

      if (error) throw error;

      // Notify the creator
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'bc_valide',
        niveau: 'info',
        titre: `✅ BC Validé: ${selectedBc.bc_id}`,
        message: `Votre commande pour ${selectedBc.client?.nom_client || selectedBc.client_id} a été approuvée. Prix verrouillé à ${selectedBc.prix_vente_m3} DH/m³`,
        destinataire_role: 'directeur_operations',
        reference_id: selectedBc.bc_id,
        reference_table: 'bons_commande',
      });

      triggerHaptic('success');
      toast.success(`BC ${selectedBc.bc_id} approuvé - Production autorisée`);
      setApprovalDialogOpen(false);
      setSelectedBc(null);
      fetchPendingBcs();
      onRefresh();
    } catch (error) {
      console.error('Error approving BC:', error);
      triggerHaptic('error');
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBc || !rejectionReason) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('bons_commande')
        .update({
          statut: 'refuse',
          notes: `[REFUSÉ] ${rejectionReason}\n\n${selectedBc.notes || ''}`,
        })
        .eq('id', selectedBc.id);

      if (error) throw error;

      // Notify the creator
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'bc_refuse',
        niveau: 'warning',
        titre: `❌ BC Refusé: ${selectedBc.bc_id}`,
        message: `Votre commande pour ${selectedBc.client?.nom_client || selectedBc.client_id} a été refusée. Raison: ${rejectionReason}`,
        destinataire_role: 'directeur_operations',
        reference_id: selectedBc.bc_id,
        reference_table: 'bons_commande',
      });

      triggerHaptic('success');
      toast.info(`BC ${selectedBc.bc_id} refusé`);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedBc(null);
      fetchPendingBcs();
      onRefresh();
    } catch (error) {
      console.error('Error rejecting BC:', error);
      triggerHaptic('error');
      toast.error('Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  const isEmergencyBc = (notes: string | null) => {
    return notes?.includes('[URGENCE/EMERGENCY') || false;
  };

  if (!canValidateBcPrice || pendingBcs.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-amber-500" />
            BC en Attente de Validation Prix
            <Badge variant="secondary" className="ml-auto">
              {pendingBcs.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BC</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Prix/m³</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBcs.map((bc) => (
                  <TableRow key={bc.id} className={isEmergencyBc(bc.notes) ? 'bg-amber-500/10' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bc.bc_id}</span>
                        {isEmergencyBc(bc.notes) && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <Zap className="h-3 w-3" />
                            URGENCE
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{bc.client?.nom_client || bc.client_id}</TableCell>
                    <TableCell className="font-mono text-xs">{bc.formule_id}</TableCell>
                    <TableCell className="text-right">{bc.volume_m3} m³</TableCell>
                    <TableCell className="text-right font-mono">
                      {bc.prix_vente_m3.toLocaleString()} DH
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {bc.total_ht.toLocaleString()} DH
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setSelectedBc(bc);
                            setApprovalDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedBc(bc);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Refuser
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Confirmation Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmer l'Approbation
            </DialogTitle>
            <DialogDescription>
              Vous allez approuver ce BC et verrouiller le prix de vente.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-xs text-muted-foreground">BC</p>
                  <p className="font-mono font-semibold">{selectedBc.bc_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-semibold">{selectedBc.client?.nom_client}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p>{selectedBc.volume_m3} m³</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prix/m³</p>
                  <p className="font-mono">{selectedBc.prix_vente_m3.toLocaleString()} DH</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-green-700">
                  ✓ Le prix sera verrouillé à {selectedBc.prix_vente_m3.toLocaleString()} DH/m³
                </p>
                <p className="text-sm text-green-700">
                  ✓ La production pourra démarrer immédiatement
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={processing}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approuver & Verrouiller Prix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Refuser le BC
            </DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du refus.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBc && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-semibold">{selectedBc.bc_id} - {selectedBc.client?.nom_client}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBc.volume_m3} m³ × {selectedBc.prix_vente_m3.toLocaleString()} DH = {selectedBc.total_ht.toLocaleString()} DH
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Raison du Refus *</label>
                <Textarea
                  placeholder="Ex: Prix trop bas pour cette formule, marge insuffisante..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectionReason(''); }}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject} 
              disabled={processing || !rejectionReason}
              className="gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Refuser le BC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}