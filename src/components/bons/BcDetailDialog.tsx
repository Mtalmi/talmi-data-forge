import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BonCommande } from '@/hooks/useSalesWorkflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Truck,
  Package,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  Factory,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Plus,
  ExternalLink,
  Calendar,
  Zap,
  Shield,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BcApprovalTimeline } from '@/components/ventes/BcApprovalTimeline';
import { ClientTrackingToggle } from '@/components/dashboard/ClientTrackingToggle';

interface LinkedBL {
  bl_id: string;
  volume_m3: number;
  date_livraison: string;
  workflow_status: string;
  facture_generee: boolean;
  facture_id: string | null;
  cur_reel: number | null;
  prix_vente_m3: number | null;
  toupie_assignee: string | null;
}

interface BcDetailDialogProps {
  bc: BonCommande | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDelivery: (bc: BonCommande) => void;
  onGenerateInvoice: (bcId: string) => Promise<string | null>;
  onRefresh: () => void;
}

const WORKFLOW_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  planification: { label: 'Planification', color: 'bg-muted text-muted-foreground', icon: <Clock className="h-3 w-3" /> },
  production: { label: 'Production', color: 'bg-warning/10 text-warning', icon: <Factory className="h-3 w-3" /> },
  validation_tech: { label: 'Validation', color: 'bg-primary/10 text-primary', icon: <CheckCircle className="h-3 w-3" /> },
  livre: { label: 'Livré', color: 'bg-success/10 text-success', icon: <Truck className="h-3 w-3" /> },
  facture: { label: 'Facturé', color: 'bg-primary/10 text-primary', icon: <Receipt className="h-3 w-3" /> },
};

export function BcDetailDialog({
  bc,
  open,
  onOpenChange,
  onAddDelivery,
  onGenerateInvoice,
  onRefresh,
}: BcDetailDialogProps) {
  const navigate = useNavigate();
  const { isCeo, isAgentAdministratif } = useAuth();
  const [linkedBLs, setLinkedBLs] = useState<LinkedBL[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    if (open && bc) {
      fetchLinkedBLs();
    }
  }, [open, bc]);

  const fetchLinkedBLs = async () => {
    if (!bc) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bons_livraison_reels')
        .select('bl_id, volume_m3, date_livraison, workflow_status, facture_generee, facture_id, cur_reel, prix_vente_m3, toupie_assignee')
        .eq('bc_id', bc.bc_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLinkedBLs(data || []);
    } catch (error) {
      console.error('Error fetching linked BLs:', error);
      toast.error('Erreur lors du chargement des livraisons');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!bc) return;
    setGeneratingInvoice(true);
    try {
      const factureId = await onGenerateInvoice(bc.bc_id);
      if (factureId) {
        await fetchLinkedBLs();
        onRefresh();
      }
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (!bc) return null;

  // Calculate progress
  const volumeLivre = bc.volume_livre || linkedBLs.reduce((sum, bl) => sum + bl.volume_m3, 0);
  const volumeTotal = bc.volume_m3;
  const volumeRestant = volumeTotal - volumeLivre;
  const progressPercent = (volumeLivre / volumeTotal) * 100;
  const nbLivraisons = bc.nb_livraisons || linkedBLs.length;

  // Calculate stats
  const blsLivres = linkedBLs.filter(bl => bl.workflow_status === 'livre');
  const blsFactures = linkedBLs.filter(bl => bl.facture_generee);
  const blsAFacturer = blsLivres.filter(bl => !bl.facture_generee);
  const canGenerateInvoice = (isCeo || isAgentAdministratif) && blsAFacturer.length > 0;

  // Calculate financial summary
  const totalHT = linkedBLs.reduce((sum, bl) => sum + (bl.volume_m3 * (bl.prix_vente_m3 || bc.prix_vente_m3)), 0);
  const totalCost = linkedBLs.reduce((sum, bl) => sum + (bl.volume_m3 * (bl.cur_reel || 0)), 0);
  const marginDH = totalHT - totalCost;
  const marginPct = totalHT > 0 ? (marginDH / totalHT) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-primary" />
            Détail Commande {bc.bc_id}
          </DialogTitle>
          <DialogDescription>
            Suivi des livraisons et facturation consolidée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Emergency Banner */}
          {bc.notes?.includes('[URGENCE/EMERGENCY') && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">Commande d'Urgence (Nuit)</p>
                <p className="text-xs text-muted-foreground">
                  Créée en mode bypass - Alertes envoyées au CEO et Superviseur
                </p>
              </div>
            </div>
          )}

          {/* Approval Timeline */}
          <Card className="border-muted">
            <CardContent className="pt-4">
              <BcApprovalTimeline bc={bc} />
            </CardContent>
          </Card>

          {/* BC Summary Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-semibold">{bc.client?.nom_client || bc.client_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Formule</p>
                  <p className="font-mono text-sm">{bc.formule_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prix/m³</p>
                  <p className="font-mono font-semibold">{bc.prix_vente_m3.toLocaleString()} DH</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Commande</p>
                  <p className="font-mono font-bold text-primary">{bc.total_ht.toLocaleString()} DH</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Tracking Toggle - CEO Only */}
          {isCeo && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-500" />
                  Portail Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientTrackingToggle
                  bcId={bc.bc_id}
                  trackingToken={(bc as any).tracking_token || null}
                  trackingEnabled={(bc as any).tracking_enabled || false}
                  onToggle={() => onRefresh()}
                />
              </CardContent>
            </Card>
          )}

          {/* Delivery Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Progression des Livraisons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {volumeLivre.toFixed(1)} m³ sur {volumeTotal} m³
                  </span>
                  <span className="font-semibold">{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{nbLivraisons}</p>
                  <p className="text-xs text-muted-foreground">Livraisons</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-success">{volumeLivre.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">m³ Livrés</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className={cn("text-2xl font-bold", volumeRestant > 0 ? "text-warning" : "text-success")}>
                    {volumeRestant.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">m³ Restants</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {volumeRestant > 0 && (bc.statut === 'pret_production' || bc.statut === 'en_production') && (
                  <Button
                    onClick={() => onAddDelivery(bc)}
                    className="flex-1 gap-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter Livraison ({Math.min(volumeRestant, 12).toFixed(1)} m³ max)
                  </Button>
                )}
                {linkedBLs.some(bl => bl.workflow_status === 'production' || bl.workflow_status === 'en_livraison') && bc.date_livraison_souhaitee && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/planning?date=${bc.date_livraison_souhaitee}`);
                    }}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Planning
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked BLs Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Bons de Livraison Liés ({linkedBLs.length})
                </span>
                {blsFactures.length > 0 && (
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {blsFactures.length} facturé(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : linkedBLs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune livraison lancée</p>
                  <p className="text-xs mt-1">Cliquez sur "Lancer Production" pour créer le premier BL</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° BL</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead>Toupie</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Facture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedBLs.map((bl) => {
                      const statusConfig = WORKFLOW_STATUS_CONFIG[bl.workflow_status] || WORKFLOW_STATUS_CONFIG.planification;
                      return (
                        <TableRow key={bl.bl_id}>
                          <TableCell className="font-mono font-medium">{bl.bl_id}</TableCell>
                          <TableCell>
                            {format(new Date(bl.date_livraison), 'dd/MM/yy')}
                          </TableCell>
                          <TableCell className="text-right font-mono">{bl.volume_m3} m³</TableCell>
                          <TableCell>
                            {bl.toupie_assignee ? (
                              <Badge variant="outline" className="font-mono">
                                {bl.toupie_assignee}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {bl.facture_generee ? (
                              <Badge variant="outline" className="bg-success/10 text-success gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {bl.facture_id}
                              </Badge>
                            ) : bl.workflow_status === 'livre' ? (
                              <Badge variant="outline" className="bg-warning/10 text-warning gap-1">
                                <Clock className="h-3 w-3" />
                                À facturer
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary & Invoice Generation */}
          {linkedBLs.length > 0 && (
            <Card className={cn(
              "border-2",
              canGenerateInvoice ? "border-primary/50 bg-primary/5" : "border-border"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Récapitulatif Financier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-mono font-bold">{totalHT.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total HT (DH)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-mono font-bold">{(totalHT * 1.2).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total TTC (DH)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-mono font-bold">{marginDH.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Marge (DH)</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg text-center",
                    marginPct >= 20 ? "bg-success/10" : "bg-warning/10"
                  )}>
                    <p className={cn(
                      "text-lg font-mono font-bold",
                      marginPct >= 20 ? "text-success" : "text-warning"
                    )}>
                      {marginPct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Marge %</p>
                  </div>
                </div>

                {/* Invoice Status & Generation */}
                {blsAFacturer.length > 0 ? (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span>
                        <strong>{blsAFacturer.length}</strong> BL(s) livré(s) en attente de facturation
                        ({blsAFacturer.reduce((sum, bl) => sum + bl.volume_m3, 0).toFixed(1)} m³)
                      </span>
                    </div>
                    
                    {canGenerateInvoice && (
                      <Button
                        onClick={handleGenerateInvoice}
                        disabled={generatingInvoice}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {generatingInvoice ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Génération en cours...
                          </>
                        ) : (
                          <>
                            <Receipt className="h-4 w-4" />
                            Générer Facture Consolidée ({blsAFacturer.length} BL)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : bc.facture_consolidee_id ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Facture consolidée générée: {bc.facture_consolidee_id}</span>
                  </div>
                ) : blsFactures.length === linkedBLs.length && linkedBLs.length > 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Tous les BLs sont facturés</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
