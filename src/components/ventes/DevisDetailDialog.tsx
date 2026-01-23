import { useState } from 'react';
import { Devis } from '@/hooks/useSalesWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Calendar,
  User,
  Package,
  MapPin,
  Calculator,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Send,
  Shield,
  Loader2,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import DevisPdfGenerator from '@/components/quotes/DevisPdfGenerator';
import { DevisSendDialog } from '@/components/quotes/DevisSendDialog';
import { ResponsibilityStamp } from '@/components/ventes/ResponsibilityStamp';
import { TechnicalApprovalBadge } from '@/components/ventes/TechnicalApprovalBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DevisDetailDialogProps {
  devis: Devis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert: (devis: Devis) => void;
}

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; isLocked?: boolean }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-4 w-4" />, isLocked: false },
  valide: { label: 'Validé', color: 'bg-success/10 text-success border-success/30', icon: <ShieldCheck className="h-4 w-4" />, isLocked: true },
  accepte: { label: 'Accepté', color: 'bg-success/10 text-success border-success/30', icon: <ShieldCheck className="h-4 w-4" />, isLocked: true },
  converti: { label: 'Converti en BC', color: 'bg-primary/10 text-primary border-primary/30', icon: <Lock className="h-4 w-4" />, isLocked: true },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-4 w-4" />, isLocked: false },
  expire: { label: 'Expiré', color: 'bg-muted text-muted-foreground border-muted', icon: <Clock className="h-4 w-4" />, isLocked: false },
};

export function DevisDetailDialog({
  devis,
  open,
  onOpenChange,
  onConvert,
}: DevisDetailDialogProps) {
  const { canApproveDevis, isDirecteurOperations, isCentraliste, isCeo, isSuperviseur, user, loading: authLoading } = useAuth();
  const [validating, setValidating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  if (!devis) return null;

  const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
  
  // Calculate expiration info
  const expirationDate = devis.date_expiration ? new Date(devis.date_expiration) : null;
  const daysUntilExpiration = expirationDate ? differenceInDays(expirationDate, new Date()) : null;
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0;
  const isExpiring = daysUntilExpiration !== null && daysUntilExpiration >= 0 && daysUntilExpiration <= 3;

  // =====================================================
  // FINANCIAL GATE - Permission Check
  // ONLY CEO, SUPERVISEUR, AGENT_ADMIN can approve
  // DIR_OPS, CENTRALISTE are READ-ONLY
  // =====================================================
  const isReadOnlyRole = isDirecteurOperations || isCentraliste;
  
  // =====================================================
  // ANTI-FRAUD: Self-Approval Block
  // A user CANNOT approve a Devis they created themselves
  // This is enforced at both UI and database levels
  // =====================================================
  const isCreator = devis.created_by === user?.id;
  const canApprove = canApproveDevis && !isReadOnlyRole && !isCreator;
  const canConvert = (devis.statut === 'valide' || devis.statut === 'accepte') && canApproveDevis;
  
  // =====================================================
  // IMMUTABLE APPROVED STATE: Lock Logic
  // Approved devis cannot be modified - only CEO/Superviseur can unlock
  // =====================================================
  const isLocked = statusConfig.isLocked || false;
  const canCancelApproval = (isCeo || isSuperviseur) && (devis.statut === 'valide' || devis.statut === 'accepte');
  
  const handleValidate = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.rpc('approve_devis_with_stamp', {
        p_devis_id: devis.devis_id,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; approved_by?: string; approved_role?: string };
      if (result.success) {
        toast.success(`Devis approuvé par ${result.approved_by} (${result.approved_role})`);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'approbation');
    } finally {
      setValidating(false);
    }
  };
  
  // Handle cancel approval (CEO/Superviseur only)
  const handleCancelApproval = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.rpc('cancel_devis_approval', {
        p_devis_id: devis.devis_id,
        p_reason: cancelReason || null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; cancelled_by?: string };
      if (result.success) {
        toast.success(`Approbation annulée par ${result.cancelled_by}. Devis remis en brouillon.`);
        setCancelReason('');
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-primary" />
            Devis {devis.devis_id}
          </DialogTitle>
          <DialogDescription>
            Créé le {format(new Date(devis.created_at), 'dd MMMM yyyy', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Expiration Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("gap-2 px-3 py-1.5 text-sm", statusConfig.color)}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
              
              {/* Security Seal for Locked Devis */}
              {isLocked && (
                <Badge className="gap-1 bg-slate-800 text-white border-slate-700">
                  <Lock className="h-3 w-3" />
                  Scellé
                </Badge>
              )}
            </div>
            
            {expirationDate && devis.statut === 'en_attente' && (
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-1",
                  isExpired ? "bg-destructive/10 text-destructive" : 
                  isExpiring ? "bg-warning/10 text-warning" : 
                  "bg-muted"
                )}
              >
                <Calendar className="h-3 w-3" />
                {isExpired 
                  ? `Expiré depuis ${Math.abs(daysUntilExpiration!)} jours`
                  : `Expire dans ${daysUntilExpiration} jours`
                }
              </Badge>
            )}
          </div>
          
          {/* =====================================================
              IMMUTABLE STATE ALERT - Security Seal Banner
              Shows when devis is validated/accepted
          ===================================================== */}
          {isLocked && (
            <Alert className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
              <ShieldCheck className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <AlertDescription className="text-slate-700 dark:text-slate-300">
                <strong>Document Scellé</strong> — Ce devis a été validé et ne peut plus être modifié. 
                Les prix et conditions sont désormais contractuels.
                {(devis as any).validated_by_name && (
                  <span className="block text-xs mt-1 opacity-80">
                    Validé par {(devis as any).validated_by_name} 
                    {(devis as any).validated_at && ` le ${format(new Date((devis as any).validated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}`}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Client & Formule Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-semibold">{devis.client?.nom_client || 'Non spécifié'}</p>
                </div>
              </div>
              {devis.client?.adresse && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{devis.client.adresse}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Détails Produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Formule</p>
                  <p className="font-mono font-semibold">{devis.formule_id}</p>
                  {devis.formule?.designation && (
                    <p className="text-xs text-muted-foreground">{devis.formule.designation}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="font-mono text-lg font-bold">{devis.volume_m3} m³</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-mono">{devis.distance_km} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-2xl font-mono font-bold text-primary">
                    {devis.prix_vente_m3.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-muted-foreground">Prix / m³</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-2xl font-mono font-bold text-primary">
                    {devis.total_ht.toLocaleString()} DH
                  </p>
                  <p className="text-xs text-muted-foreground">Total HT</p>
                </div>
              </div>

              {/* Cost Breakdown (internal) */}
              <div className="space-y-1 text-sm pt-2 border-t">
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span>CUT (Coût Unitaire Théorique)</span>
                  <span className="font-mono">{devis.cut_per_m3.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span>Frais fixes</span>
                  <span className="font-mono">{devis.fixed_cost_per_m3.toFixed(2)} DH</span>
                </div>
                {devis.transport_extra_per_m3 > 0 && (
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Supplément transport</span>
                    <span className="font-mono">{devis.transport_extra_per_m3.toFixed(2)} DH</span>
                  </div>
                )}
                <div className="flex justify-between p-2 border rounded font-medium">
                  <span>Coût Total / m³</span>
                  <span className="font-mono">{devis.total_cost_per_m3.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {devis.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{devis.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <DevisPdfGenerator devis={devis} />
            <DevisSendDialog devis={devis} />
            
            {/* =====================================================
                VALIDATE BUTTON - Financial Gate
                Only visible for: CEO, SUPERVISEUR, AGENT_ADMIN
                Hidden for: DIR_OPS, CENTRALISTE
                Hidden when devis is already locked
            ===================================================== */}
            {devis.statut === 'en_attente' && devis.client_id && !isLocked && (
              authLoading ? (
                <Skeleton className="w-24 h-9 rounded-md ml-auto" />
              ) : canApprove ? (
                <Button 
                  onClick={handleValidate}
                  disabled={validating}
                  className="gap-2 ml-auto bg-success hover:bg-success/90"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Valider le Devis
                </Button>
              ) : isCreator && canApproveDevis ? (
                // Anti-fraud warning for creators with approval role
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground italic">
                    Auto-validation impossible.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    En attente d'un autre administrateur.
                  </p>
                </div>
              ) : isReadOnlyRole ? (
                <Badge variant="outline" className="ml-auto text-orange-500 border-orange-500">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente de validation
                </Badge>
              ) : null
            )}
            
            {/* Convert to BC Button after validation */}
            {canConvert && (
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  onConvert(devis);
                }}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Convertir en BC
              </Button>
            )}
            
            {/* =====================================================
                CANCEL APPROVAL BUTTON - CEO/Superviseur Only
                The ONLY way to modify an approved devis
            ===================================================== */}
            {canCancelApproval && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 ml-auto border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Unlock className="h-4 w-4" />
                    Annuler l'Approbation
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-destructive" />
                      Annuler l'Approbation du Devis
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action va remettre le devis en statut "En Attente". 
                      Les prix et conditions pourront être modifiés.
                      <br /><br />
                      <strong>Cette action sera enregistrée dans le journal d'audit.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-2">
                    <label className="text-sm font-medium">Raison de l'annulation (optionnel)</label>
                    <Textarea
                      placeholder="Ex: Erreur de prix, demande client..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelApproval}
                      disabled={cancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Unlock className="h-4 w-4 mr-2" />
                      )}
                      Confirmer l'Annulation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
