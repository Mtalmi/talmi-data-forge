// Front Desk Validation - Step 2 (Front Desk Personnel)
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  FileText,
  Upload,
  Camera,
  User,
  Shield,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  QualityCheckData,
  VerificationFormData,
  RejectionFormData,
  VerificationAction,
  RejectionAction,
  StockReceptionOrder,
  DEMO_USERS,
} from './types';

interface FrontDeskValidationProps {
  order: StockReceptionOrder;
  qualityCheck: QualityCheckData;
  onComplete: (
    confirmedQuantity: number,
    verificationForm?: VerificationFormData,
    rejectionForm?: RejectionFormData
  ) => void;
}

export function FrontDeskValidation({ 
  order, 
  qualityCheck, 
  onComplete 
}: FrontDeskValidationProps) {
  const [confirmedQuantity, setConfirmedQuantity] = useState(order.quantity.toString());
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  
  // Verification form state
  const [verificationReason, setVerificationReason] = useState('');
  const [verificationPhoto, setVerificationPhoto] = useState(false);
  const [verificationAction, setVerificationAction] = useState<VerificationAction | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  
  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionPhoto, setRejectionPhoto] = useState(false);
  const [rejectionAction, setRejectionAction] = useState<RejectionAction | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectionSubmitted, setRejectionSubmitted] = useState(false);

  const frontDesk = DEMO_USERS.FRONT_DESK;
  const totalAmount = order.unitPrice * parseFloat(confirmedQuantity || '0');

  const canValidate = 
    qualityCheck.status === 'conforme' || 
    (qualityCheck.status === 'a_verifier' && verificationSubmitted && verificationAction === 'accept_with_conditions') ||
    (qualityCheck.status === 'non_conforme' && rejectionSubmitted);

  const isBlocked = 
    (qualityCheck.status === 'a_verifier' && !verificationSubmitted) ||
    (qualityCheck.status === 'non_conforme' && !rejectionSubmitted);

  const handleVerificationPhotoUpload = () => {
    setTimeout(() => {
      setVerificationPhoto(true);
      toast.success('[SIMULATION] Photo de préoccupation capturée');
    }, 500);
  };

  const handleRejectionPhotoUpload = () => {
    setTimeout(() => {
      setRejectionPhoto(true);
      toast.success('[SIMULATION] Photo du défaut capturée');
    }, 500);
  };

  const handleVerificationSubmit = () => {
    const formData: VerificationFormData = {
      reason: verificationReason,
      photoUploaded: verificationPhoto,
      recommendedAction: verificationAction,
      notes: verificationNotes,
      submittedBy: frontDesk.name,
      timestamp: new Date().toISOString(),
    };

    console.log('[VERIFICATION_FORM]:', formData);
    setVerificationSubmitted(true);
    setShowVerificationForm(false);
    
    if (verificationAction === 'accept_with_conditions') {
      toast.success('✅ Formulaire de vérification soumis - Validation possible');
    } else if (verificationAction === 'reject') {
      setShowRejectionForm(true);
    } else {
      toast.info('🔄 Demande de nouvelle inspection envoyée à Abdel Sadek');
    }
  };

  const handleRejectionSubmit = () => {
    const formData: RejectionFormData = {
      reason: rejectionReason,
      photoUploaded: rejectionPhoto,
      recommendedAction: rejectionAction,
      notes: rejectionNotes,
      submittedBy: frontDesk.name,
      timestamp: new Date().toISOString(),
    };

    console.log('[REJECTION_FORM]:', formData);
    setRejectionSubmitted(true);
    setShowRejectionForm(false);
    toast.info('📋 Formulaire de rejet soumis - Livraison marquée comme REJETÉE');
  };

  const handleComplete = () => {
    const verificationData: VerificationFormData | undefined = verificationSubmitted ? {
      reason: verificationReason,
      photoUploaded: verificationPhoto,
      recommendedAction: verificationAction,
      notes: verificationNotes,
      submittedBy: frontDesk.name,
      timestamp: new Date().toISOString(),
    } : undefined;

    const rejectionData: RejectionFormData | undefined = rejectionSubmitted ? {
      reason: rejectionReason,
      photoUploaded: rejectionPhoto,
      recommendedAction: rejectionAction,
      notes: rejectionNotes,
      submittedBy: frontDesk.name,
      timestamp: new Date().toISOString(),
    } : undefined;

    onComplete(parseFloat(confirmedQuantity), verificationData, rejectionData);
  };

  const getStatusBadge = () => {
    switch (qualityCheck.status) {
      case 'conforme':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            CONFORME
          </Badge>
        );
      case 'a_verifier':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            À VÉRIFIER
          </Badge>
        );
      case 'non_conforme':
        return (
          <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            NON-CONFORME
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with role badge */}
      <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
              <ClipboardList className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 dark:text-purple-100">
                Phase 2: Validation Accueil
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-300">
                Front Desk - Validation finale
              </p>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300">
            <User className="h-3 w-3 mr-1" />
            {frontDesk.name}
          </Badge>
        </div>
      </div>

      {/* Quality Check Summary */}
      <Card className="border-purple-200 dark:border-purple-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Résultat Contrôle Qualité
            </span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Technicien:</span>
              <span className="font-medium">{qualityCheck.technician}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Humidité:</span>
              <span className={cn(
                "font-medium",
                qualityCheck.humidity.isHighHumidity ? "text-yellow-600" : "text-emerald-600"
              )}>
                {qualityCheck.humidity.reading}% {qualityCheck.humidity.isHighHumidity ? '⚠️' : '✓'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gravier:</span>
              <span className="font-medium">{qualityCheck.gravel.grade} ✓</span>
            </div>
            {qualityCheck.notes && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Notes:</span>
                <p className="text-sm mt-1">{qualityCheck.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status-specific content */}
      {qualityCheck.status === 'conforme' && (
        <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              ✅ QUALITÉ CONFORME - Validation Possible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-background border">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantité Commandée:</span>
                  <p className="font-bold">{order.quantity} {order.unit}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prix Unitaire:</span>
                  <p className="font-medium">{order.unitPrice} DH/{order.unit}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantité Reçue ({order.unit})</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={confirmedQuantity}
                onChange={(e) => setConfirmedQuantity(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                  {totalAmount.toLocaleString('fr-FR')} DH
                </span>
              </div>
            </div>

            <Button
              className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
              onClick={handleComplete}
              disabled={parseFloat(confirmedQuantity) <= 0}
            >
              <CheckCircle2 className="h-4 w-4" />
              Finaliser Réception
            </Button>
          </CardContent>
        </Card>
      )}

      {qualityCheck.status === 'a_verifier' && (
        <Card className={cn(
          "border-yellow-200 dark:border-yellow-800/50",
          verificationSubmitted && verificationAction === 'accept_with_conditions'
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200"
            : "bg-yellow-50/50 dark:bg-yellow-950/20"
        )}>
          <CardHeader>
            <CardTitle className={cn(
              "flex items-center gap-2 text-lg",
              verificationSubmitted && verificationAction === 'accept_with_conditions'
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-yellow-700 dark:text-yellow-300"
            )}>
              {!verificationSubmitted ? (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  ⚠️ VÉRIFICATION REQUISE - Formulaire Obligatoire
                </>
              ) : verificationAction === 'accept_with_conditions' ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  ✅ Accepté avec conditions - Validation Possible
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  🔄 En attente de nouvelle inspection
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!verificationSubmitted ? (
              <>
                <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 flex items-start gap-3">
                  <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Validation BLOQUÉE
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Remplissez le formulaire de vérification avant de continuer.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => setShowVerificationForm(true)}
                >
                  <FileText className="h-4 w-4" />
                  Remplir Formulaire de Vérification
                </Button>

                <Button
                  className="w-full gap-2"
                  variant="outline"
                  disabled
                >
                  <Lock className="h-4 w-4" />
                  Finaliser Réception (Bloqué)
                </Button>
              </>
            ) : verificationAction === 'accept_with_conditions' ? (
              <>
                <div className="p-4 rounded-lg bg-background border">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quantité Commandée:</span>
                      <p className="font-bold">{order.quantity} {order.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prix Unitaire:</span>
                      <p className="font-medium">{order.unitPrice} DH/{order.unit}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quantité Reçue ({order.unit})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={confirmedQuantity}
                    onChange={(e) => setConfirmedQuantity(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <Button
                  className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleComplete}
                  disabled={parseFloat(confirmedQuantity) <= 0}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finaliser Réception
                </Button>
              </>
            ) : (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🔄 En attente de nouvelle inspection par le responsable technique.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {qualityCheck.status === 'non_conforme' && (
        <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-300">
              <XCircle className="h-5 w-5" />
              ❌ NON-CONFORME - Validation BLOQUÉE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!rejectionSubmitted ? (
              <>
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 flex items-start gap-3">
                  <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Validation IMPOSSIBLE
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Le matériau ne répond pas aux spécifications. Formulaire de rejet obligatoire.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-red-100/50 border border-red-200">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    ⚠️ FORMULAIRE DE REJET OBLIGATOIRE
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => setShowRejectionForm(true)}
                >
                  <FileText className="h-4 w-4" />
                  Remplir Formulaire de Rejet
                </Button>

                <Button
                  className="w-full gap-2"
                  variant="outline"
                  disabled
                >
                  <Lock className="h-4 w-4" />
                  Finaliser Réception (Bloqué)
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-bold text-red-800 dark:text-red-200">
                      LIVRAISON REJETÉE
                    </span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Action: {rejectionAction === 'return_to_supplier' ? 'Retourner au fournisseur' :
                             rejectionAction === 'partial_use' ? 'Utilisation partielle' : 
                             'Inspection supplémentaire'}
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-muted hover:bg-muted/80"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Terminer le processus
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Form Modal */}
      <Dialog open={showVerificationForm} onOpenChange={setShowVerificationForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Formulaire de Vérification
            </DialogTitle>
            <DialogDescription>
              Complétez ce formulaire pour procéder à la validation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Raison de la vérification <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
                placeholder="Ex: Humidité légèrement élevée, mais acceptable pour utilisation..."
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Photo de la préoccupation <span className="text-red-500">*</span>
              </Label>
              {!verificationPhoto ? (
                <button
                  onClick={handleVerificationPhotoUpload}
                  className={cn(
                    "w-full h-24 rounded-lg border-2 border-dashed transition-all",
                    "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20",
                    "hover:border-yellow-400 hover:bg-yellow-100",
                    "flex flex-col items-center justify-center gap-2"
                  )}
                >
                  <Camera className="h-6 w-6 text-yellow-500" />
                  <span className="text-xs text-yellow-700">Télécharger Photo</span>
                </button>
              ) : (
                <div className="w-full h-24 rounded-lg bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <span className="text-sm text-emerald-700">Photo capturée ✓</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Action recommandée <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={verificationAction || ''}
                onValueChange={(v) => setVerificationAction(v as VerificationAction)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="accept_with_conditions" id="v_accept" />
                  <Label htmlFor="v_accept" className="cursor-pointer">
                    Accepter avec conditions
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="reject" id="v_reject" />
                  <Label htmlFor="v_reject" className="cursor-pointer">
                    Rejeter
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="request_new_inspection" id="v_reinspect" />
                  <Label htmlFor="v_reinspect" className="cursor-pointer">
                    Demander nouvelle inspection
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Notes additionnelles (optionnel)</Label>
              <Textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Notes supplémentaires..."
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowVerificationForm(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                onClick={handleVerificationSubmit}
                disabled={!verificationReason || !verificationPhoto || !verificationAction}
              >
                Soumettre Vérification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Form Modal */}
      <Dialog open={showRejectionForm} onOpenChange={setShowRejectionForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Formulaire de Rejet - Non-Conformité
            </DialogTitle>
            <DialogDescription>
              Documentez le rejet de cette livraison.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Raison du rejet <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Gravier granulométrie incorrecte, présence de fines excessives..."
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Photo du défaut <span className="text-red-500">*</span>
              </Label>
              {!rejectionPhoto ? (
                <button
                  onClick={handleRejectionPhotoUpload}
                  className={cn(
                    "w-full h-24 rounded-lg border-2 border-dashed transition-all",
                    "border-red-300 bg-red-50 dark:bg-red-900/20",
                    "hover:border-red-400 hover:bg-red-100",
                    "flex flex-col items-center justify-center gap-2"
                  )}
                >
                  <Camera className="h-6 w-6 text-red-500" />
                  <span className="text-xs text-red-700">Télécharger Photo</span>
                </button>
              ) : (
                <div className="w-full h-24 rounded-lg bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <span className="text-sm text-emerald-700">Photo capturée ✓</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Action recommandée <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={rejectionAction || ''}
                onValueChange={(v) => setRejectionAction(v as RejectionAction)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="return_to_supplier" id="r_return" />
                  <Label htmlFor="r_return" className="cursor-pointer">
                    Retourner au fournisseur
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="partial_use" id="r_partial" />
                  <Label htmlFor="r_partial" className="cursor-pointer">
                    Utiliser partiellement
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="additional_inspection" id="r_inspect" />
                  <Label htmlFor="r_inspect" className="cursor-pointer">
                    Inspection supplémentaire
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Notes additionnelles (optionnel)</Label>
              <Textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Notes supplémentaires..."
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectionForm(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleRejectionSubmit}
                disabled={!rejectionReason || !rejectionPhoto || !rejectionAction}
              >
                Soumettre Rejet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
