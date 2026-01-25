import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Truck, ArrowRight, RotateCcw, Camera, ClipboardCheck, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ValidateDeliverySimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_ORDERS = [
  { id: 'DEMO-DEVIS-001', client: 'Entreprise BTP Demo', volume: 10, product: 'B/25', total: 7200 },
  { id: 'DEMO-DEVIS-002', client: 'Construction Plus', volume: 15, product: 'B/30', total: 11250 },
];

const QUALITY_CHECKLIST = [
  { id: 'color', label: 'Béton couleur correcte (Correct color)' },
  { id: 'consistency', label: 'Consistance correcte (Correct consistency)' },
  { id: 'segregation', label: 'Pas de ségrégation (No segregation)' },
  { id: 'temperature', label: 'Température correcte (Correct temperature)' },
];

export function ValidateDeliverySim({ onComplete, onClose }: ValidateDeliverySimProps) {
  const [step, setStep] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [deliveredQuantity, setDeliveredQuantity] = useState('10');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [qualityChecks, setQualityChecks] = useState<Record<string, boolean>>({});
  const [qualityNotes, setQualityNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const order = DEMO_ORDERS.find(o => o.id === selectedOrder);
  const allChecksComplete = QUALITY_CHECKLIST.every(item => qualityChecks[item.id]);

  const handlePhotoUpload = () => {
    setTimeout(() => {
      setPhotoUploaded(true);
      toast.success('[SIMULATION] Photo livraison capturée');
    }, 500);
  };

  const handleCheckChange = (id: string, checked: boolean) => {
    setQualityChecks(prev => ({ ...prev, [id]: checked }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Validation livraison:', {
      orderId: selectedOrder,
      deliveredQuantity,
      qualityChecks,
      qualityNotes,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Livraison validée avec succès!', {
      description: `Commande ${selectedOrder} marquée comme complétée.`,
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setSelectedOrder(null);
    setDeliveredQuantity('10');
    setPhotoUploaded(false);
    setQualityChecks({});
    setQualityNotes('');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

        {/* Steps */}
        <div className="space-y-4 py-4">
          {/* Step 1: Select Order */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Étape 1/4: Sélectionner la Commande
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez une commande à valider.
                </p>
                <div className="space-y-2">
                  {DEMO_ORDERS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOrder(o.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        selectedOrder === o.id
                          ? "bg-amber-100 border-amber-400 dark:bg-amber-900/50"
                          : "bg-background hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-amber-600">{o.id}</span>
                          <p className="text-sm">{o.client}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{o.volume} M³ {o.product}</Badge>
                          <p className="text-sm font-bold mt-1">{o.total.toLocaleString()} DH</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedOrder}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Verify Delivery */}
          {step === 2 && order && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Étape 2/4: Vérifier la Livraison
                </h4>
                
                <div className="p-3 bg-background rounded-lg border mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Commande:</span>
                      <p className="font-mono font-bold">{order.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Produit:</span>
                      <p className="font-medium">{order.product} Béton</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantité Commandée:</span>
                      <p className="font-bold">{order.volume} M³</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Livraison:</span>
                      <p>Aujourd'hui</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chauffeur:</span>
                      <p>Jean Dupont</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Quantité Livrée (M³)</Label>
                    <Input
                      type="number"
                      value={deliveredQuantity}
                      onChange={(e) => setDeliveredQuantity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Photo du Bon de Livraison</Label>
                    {!photoUploaded ? (
                      <button
                        onClick={handlePhotoUpload}
                        className={cn(
                          "w-full h-24 rounded-lg border-2 border-dashed transition-all",
                          "border-amber-300 bg-amber-100/50 dark:bg-amber-900/20",
                          "hover:border-amber-400 hover:bg-amber-200/50",
                          "flex flex-col items-center justify-center gap-2"
                        )}
                      >
                        <Camera className="h-6 w-6 text-amber-500" />
                        <span className="text-sm text-amber-700 dark:text-amber-300">
                          Télécharger Photo
                        </span>
                      </button>
                    ) : (
                      <div className="w-full h-24 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 flex flex-col items-center justify-center gap-1">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">
                          Photo capturée ✓
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!photoUploaded || parseFloat(deliveredQuantity) <= 0}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 3: Quality Inspection */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Étape 3/4: Inspection Qualité
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez tous les points de contrôle qualité.
                </p>

                <div className="space-y-3">
                  {QUALITY_CHECKLIST.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border transition-all",
                        qualityChecks[item.id]
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30"
                          : "bg-background"
                      )}
                    >
                      <Checkbox
                        id={item.id}
                        checked={qualityChecks[item.id] || false}
                        onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer flex-1">
                        {qualityChecks[item.id] ? '☑️' : '☐'} {item.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    placeholder="Observations supplémentaires..."
                    value={qualityNotes}
                    onChange={(e) => setQualityNotes(e.target.value)}
                  />
                </div>

                {allChecksComplete && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      ✅ Tous les contrôles qualité sont conformes
                    </p>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => setStep(4)} 
                disabled={!allChecksComplete}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 4: Complete Validation */}
          {step === 4 && order && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Étape 4/4: Récapitulatif Final
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Quantité vérifiée: {deliveredQuantity} M³</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Photo bon de livraison: Capturée</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Qualité inspectée: Conforme (4/4 checks)</span>
                  </div>
                  <div className="pt-2 border-t mt-2">
                    <div className="flex justify-between">
                      <span>Statut:</span>
                      <Badge className="bg-emerald-500">VALIDÉE</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                  [SIMULATION] Livraison Validée - {order.id} - {deliveredQuantity} M³ - Qualité: Conforme
                </p>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Validation en cours...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Finaliser Validation
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
