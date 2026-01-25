import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Truck, ArrowRight, RotateCcw, Camera, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ValidateDeliverySimProps {
  onComplete: () => void;
  onClose: () => void;
}

export function ValidateDeliverySim({ onComplete, onClose }: ValidateDeliverySimProps) {
  const [step, setStep] = useState(1);
  const [quantityVerified, setQuantityVerified] = useState(false);
  const [qualityChecked, setQualityChecked] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [paymentRecorded, setPaymentRecorded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Validation livraison:', {
      quantityVerified,
      qualityChecked,
      photoUploaded,
      signatureComplete,
      paymentRecorded,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Livraison DEMO-001 validée avec succès',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setQuantityVerified(false);
    setQualityChecked(false);
    setPhotoUploaded(false);
    setSignatureComplete(false);
    setPaymentRecorded(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-500" />
            Simulation: Valider une Livraison
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-300">
              SANDBOX
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Étape {step}/{totalSteps}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName="bg-amber-500" />
        </div>

        {/* Demo Delivery Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <div className="flex justify-between">
            <span>BL:</span>
            <span className="font-mono font-medium">DEMO-001</span>
          </div>
          <div className="flex justify-between">
            <span>Client:</span>
            <span className="font-medium">Client Test SARL</span>
          </div>
          <div className="flex justify-between">
            <span>Volume:</span>
            <span className="font-medium">8 m³ Béton B25</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📦 Étape 1: Vérification des Quantités</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Confirmez que le volume livré correspond à la commande.
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="qty" 
                    checked={quantityVerified}
                    onCheckedChange={(checked) => setQuantityVerified(checked as boolean)}
                  />
                  <Label htmlFor="qty">Volume vérifié: 8 m³ conforme</Label>
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!quantityVerified}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">🧪 Étape 2: Contrôle Qualité</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez les paramètres qualité du béton.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Affaissement (Slump):</span>
                    <Badge className="bg-emerald-100 text-emerald-700">120mm ✓</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Température:</span>
                    <Badge className="bg-emerald-100 text-emerald-700">22°C ✓</Badge>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="quality" 
                      checked={qualityChecked}
                      onCheckedChange={(checked) => setQualityChecked(checked as boolean)}
                    />
                    <Label htmlFor="quality">Qualité conforme aux spécifications</Label>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!qualityChecked}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📸 Étape 3: Photo du Bon</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Capturez une photo du bon de livraison signé.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setPhotoUploaded(true)}
                  className={cn(
                    "w-full gap-2",
                    photoUploaded && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  <Camera className="h-4 w-4" />
                  {photoUploaded ? 'Photo capturée ✓' : 'Simuler capture photo'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!photoUploaded}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">✍️ Étape 4: Signature Client</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Obtenez la signature du client pour confirmer la réception.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSignatureComplete(true)}
                  className={cn(
                    "w-full gap-2",
                    signatureComplete && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  <PenTool className="h-4 w-4" />
                  {signatureComplete ? 'Signature obtenue ✓' : 'Simuler signature'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!signatureComplete}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-2">💳 Étape 5: Enregistrer le Paiement</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Confirmez le mode de paiement utilisé.
                </p>
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentRecorded ? "default" : "outline"}
                      onClick={() => setPaymentRecorded(true)}
                      size="sm"
                    >
                      Espèces
                    </Button>
                    <Button
                      variant={paymentRecorded ? "default" : "outline"}
                      onClick={() => setPaymentRecorded(true)}
                      size="sm"
                    >
                      Crédit
                    </Button>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !paymentRecorded}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Validation en cours...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Finaliser la Livraison
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="flex justify-center pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
