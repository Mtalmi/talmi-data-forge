import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FlaskConical, ArrowRight, RotateCcw, Camera, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QualityControlSimProps {
  onComplete: () => void;
  onClose: () => void;
}

export function QualityControlSim({ onComplete, onClose }: QualityControlSimProps) {
  const [step, setStep] = useState(1);
  const [slumpValue, setSlumpValue] = useState('');
  const [tempValue, setTempValue] = useState('');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const slumpOk = parseInt(slumpValue) >= 100 && parseInt(slumpValue) <= 150;
  const tempOk = parseInt(tempValue) >= 15 && parseInt(tempValue) <= 30;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Contrôle qualité:', {
      slumpValue,
      tempValue,
      photoTaken,
      reportGenerated,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Contrôle qualité validé',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setSlumpValue('');
    setTempValue('');
    setPhotoTaken(false);
    setReportGenerated(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            Simulation: Contrôle Qualité
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

        {/* Batch Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <div className="flex justify-between">
            <span>Lot:</span>
            <span className="font-mono font-medium">DEMO-BATCH-001</span>
          </div>
          <div className="flex justify-between">
            <span>Formule:</span>
            <span className="font-medium">B25 S3</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📏 Étape 1: Test d'Affaissement</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Mesurez l'affaissement du béton (cône d'Abrams).
                </p>
                <div className="space-y-3">
                  <div>
                    <Label>Affaissement (mm)</Label>
                    <Input
                      type="number"
                      value={slumpValue}
                      onChange={(e) => setSlumpValue(e.target.value)}
                      placeholder="Ex: 120"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Plage acceptable: 100-150 mm
                    </p>
                  </div>
                  {slumpValue && (
                    <Badge className={slumpOk ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                      {slumpOk ? '✓ Conforme' : '✗ Hors tolérance'}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!slumpOk}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">🌡️ Étape 2: Température</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez la température du béton frais.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label>Température (°C)</Label>
                    <Input
                      type="number"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="Ex: 22"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Plage acceptable: 15-30 °C
                    </p>
                  </div>
                  {tempValue && (
                    <Badge className={tempOk ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                      {tempOk ? '✓ Conforme' : '✗ Hors tolérance'}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!tempOk}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📸 Étape 3: Preuve Photo</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Capturez une photo du test d'affaissement.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setPhotoTaken(true)}
                  className={cn(
                    "w-full gap-2",
                    photoTaken && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  <Camera className="h-4 w-4" />
                  {photoTaken ? 'Photo capturée ✓' : 'Simuler capture photo'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!photoTaken}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Étape 4: Rapport QC
                </h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Affaissement:</span>
                    <span className="font-medium">{slumpValue} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Température:</span>
                    <span className="font-medium">{tempValue} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Photo:</span>
                    <Badge className="bg-emerald-100 text-emerald-700">Capturée</Badge>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Verdict:</span>
                    <Badge className="bg-emerald-600 text-white">CONFORME</Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setReportGenerated(true)}
                  className={cn(
                    "w-full gap-2",
                    reportGenerated && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  <FileCheck className="h-4 w-4" />
                  {reportGenerated ? 'Rapport généré ✓' : 'Générer rapport QC'}
                </Button>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !reportGenerated}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Validation...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Valider le Contrôle
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
