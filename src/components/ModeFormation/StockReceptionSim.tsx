import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Package,
  Camera,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Upload,
  Truck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StockReceptionSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_ORDER = {
  id: 'DEMO-001',
  supplier: 'Fournisseur Test',
  date: new Date().toLocaleDateString('fr-FR'),
  materials: [
    { name: 'Ciment CPJ 45', expectedQty: 50, unit: 'Tonnes' },
    { name: 'Sable 0/4', expectedQty: 30, unit: 'Tonnes' },
    { name: 'Gravette 8/16', expectedQty: 40, unit: 'Tonnes' },
  ],
};

export function StockReceptionSim({ onComplete, onClose }: StockReceptionSimProps) {
  const [step, setStep] = useState(1);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const totalSteps = 4;

  const handlePhotoUpload = () => {
    // Simulate photo upload
    setTimeout(() => {
      setPhotoUploaded(true);
      toast.success('[SIMULATION] Photo du bon de livraison capturée');
    }, 500);
  };

  const handleQuantityChange = (material: string, value: string) => {
    setQuantities((prev) => ({
      ...prev,
      [material]: parseFloat(value) || 0,
    }));
  };

  const handleConfirm = () => {
    toast.success('[SIMULATION] Réception Stock Validée!', {
      description: 'Audit log: SIMULATION_STOCK_RECEPTION',
    });
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setPhotoUploaded(false);
    setQuantities({});
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Simulation: Réception Stock</h2>
              <p className="text-xs text-muted-foreground">
                Données Sandbox - Aucune écriture réelle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">Étape {step}/{totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          {/* Step 1: View Order */}
          {step === 1 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-amber-600" />
                  Commande à Réceptionner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">N° Commande:</span>
                    <p className="font-mono font-bold">{DEMO_ORDER.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fournisseur:</span>
                    <p className="font-medium">{DEMO_ORDER.supplier}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p>{DEMO_ORDER.date}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Matériaux Attendus:</h4>
                  <div className="space-y-2">
                    {DEMO_ORDER.materials.map((mat) => (
                      <div
                        key={mat.name}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                      >
                        <span>{mat.name}</span>
                        <Badge variant="outline">
                          {mat.expectedQty} {mat.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full mt-4 gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setStep(2)}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Photo Upload */}
          {step === 2 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-amber-600" />
                  Preuve Obligatoire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Photographiez le bon de livraison du fournisseur avant de saisir
                  les quantités.
                </p>

                {!photoUploaded ? (
                  <button
                    onClick={handlePhotoUpload}
                    className={cn(
                      "w-full h-40 rounded-xl border-2 border-dashed transition-all",
                      "border-amber-300 bg-amber-100/50 dark:bg-amber-900/20",
                      "hover:border-amber-400 hover:bg-amber-200/50",
                      "flex flex-col items-center justify-center gap-3"
                    )}
                  >
                    <Upload className="h-10 w-10 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Cliquez pour capturer la photo
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-40 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Photo capturée avec succès
                    </span>
                  </div>
                )}

                <Button
                  className="w-full mt-4 gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setStep(3)}
                  disabled={!photoUploaded}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Verify Quantities */}
          {step === 3 && (
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-amber-600" />
                  Vérifier les Quantités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Saisissez les quantités réellement reçues:
                </p>

                <div className="space-y-4">
                  {DEMO_ORDER.materials.map((mat) => (
                    <div key={mat.name} className="space-y-2">
                      <Label className="text-sm">
                        {mat.name}{' '}
                        <span className="text-muted-foreground">
                          (attendu: {mat.expectedQty} {mat.unit})
                        </span>
                      </Label>
                      <Input
                        type="number"
                        placeholder={`Quantité en ${mat.unit}`}
                        value={quantities[mat.name] || ''}
                        onChange={(e) =>
                          handleQuantityChange(mat.name, e.target.value)
                        }
                        className="bg-background"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full mt-4 gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setStep(4)}
                  disabled={
                    Object.keys(quantities).length !== DEMO_ORDER.materials.length
                  }
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-medium mb-3">Récapitulatif:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Commande:</span>
                      <span className="font-mono">{DEMO_ORDER.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fournisseur:</span>
                      <span>{DEMO_ORDER.supplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Photo:</span>
                      <Badge className="bg-emerald-500">✓ Validée</Badge>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-300 dark:border-emerald-700">
                    {DEMO_ORDER.materials.map((mat) => (
                      <div key={mat.name} className="flex justify-between text-sm py-1">
                        <span>{mat.name}:</span>
                        <span className="font-medium">
                          {quantities[mat.name] || 0} {mat.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleConfirm}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider la Réception
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
