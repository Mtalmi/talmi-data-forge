import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, FileText, ArrowRight, RotateCcw, MapPin, Package, Calculator, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAITrainingCoach } from '@/hooks/useAITrainingCoach';
import { AICoachPanel } from './AICoachPanel';

interface CreateQuoteSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DELIVERY_ZONES = [
  { id: 'A', name: 'Zone A: Ain Aouda et région', transportCost: 150 },
  { id: 'B', name: 'Zone B: Temara', transportCost: 200 },
  { id: 'C', name: 'Zone C: Autres régions', transportCost: 250 },
];

const CONCRETE_PRODUCTS = [
  { id: 'B25', name: 'B/25 (25 MPa)', basePrice: 450, minOrder: 2, maxOrder: 50 },
  { id: 'B30', name: 'B/30 (30 MPa)', basePrice: 500, minOrder: 2, maxOrder: 50 },
  { id: 'B35', name: 'B/35 (35 MPa)', basePrice: 550, minOrder: 2, maxOrder: 50 },
];

const TVA_RATE = 0.20;

export function CreateQuoteSim({ onComplete, onClose }: CreateQuoteSimProps) {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('Entreprise BTP Demo');
  const [contactName, setContactName] = useState('Ahmed Bennani');
  const [contactPhone, setContactPhone] = useState('+212 6 12 34 56 78');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('10');
  const [notes, setNotes] = useState('Livraison samedi matin, site en montée');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenario, setScenario] = useState<Record<string, any> | null>(null);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const { getCoachFeedback, generateScenario, isCoaching, lastFeedback, averageScore, resetSession } = useAITrainingCoach();

  useEffect(() => {
    generateScenario('create_quote').then(data => { if (data) setScenario(data); });
  }, [generateScenario]);

  const handleStepChange = (nextStep: number, action: string) => {
    setStep(nextStep);
    getCoachFeedback({ simulation: 'create_quote', step: nextStep, totalSteps, action, data: { clientName, selectedZone, selectedProduct, quantity } });
  };

  const zone = DELIVERY_ZONES.find(z => z.id === selectedZone);
  const product = CONCRETE_PRODUCTS.find(p => p.id === selectedProduct);
  const qty = parseFloat(quantity) || 0;
  
  const pricePerM3 = product ? product.basePrice + (zone?.transportCost || 0) : 0;
  const subtotal = pricePerM3 * qty;
  const tva = subtotal * TVA_RATE;
  const totalTTC = subtotal + tva;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Création devis béton:', {
      quoteId: 'DEMO-DEVIS-001',
      client: clientName,
      contact: contactName,
      zone: selectedZone,
      product: selectedProduct,
      quantity: qty,
      totalTTC,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Devis créé et envoyé avec succès!', {
      description: `Devis DEMO-DEVIS-001 envoyé à ${clientName}`,
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setClientName('Entreprise BTP Demo');
    setContactName('Ahmed Bennani');
    setContactPhone('+212 6 12 34 56 78');
    setSelectedZone(null);
    setSelectedProduct(null);
    setQuantity('10');
    setNotes('Livraison samedi matin, site en montée');
    resetSession();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            Simulation: Créer un Devis Béton
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
          {/* Step 1: Client Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📋 Étape 1/6: Informations Client</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez un nouveau devis pour béton prêt à l'emploi.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">N° Devis:</span>
                    <span className="font-mono font-bold text-amber-600">DEMO-DEVIS-001</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="space-y-1">
                    <Label>Client</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Contact</Label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Téléphone</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => handleStepChange(2, 'Info client saisie')} 
                disabled={!clientName || !contactName}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Select Zone */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Étape 2/6: Zone de Livraison
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez la zone de livraison pour calculer les frais de transport.
                </p>
                <div className="space-y-2">
                  {DELIVERY_ZONES.map((z) => (
                    <button
                      key={z.id}
                      onClick={() => setSelectedZone(z.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        selectedZone === z.id
                          ? "bg-amber-100 border-amber-400 dark:bg-amber-900/50"
                          : "bg-background hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{z.name}</span>
                        <Badge variant="outline">{z.transportCost} DH/M³</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                onClick={() => handleStepChange(3, `Zone sélectionnée: ${selectedZone}`)} 
                disabled={!selectedZone}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 3: Select Product */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Étape 3/6: Type de Béton
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez le type de béton prêt à l'emploi.
                </p>
                <div className="space-y-2">
                  {CONCRETE_PRODUCTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        selectedProduct === p.id
                          ? "bg-amber-100 border-amber-400 dark:bg-amber-900/50"
                          : "bg-background hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <p className="text-xs text-muted-foreground">
                            Min: {p.minOrder} M³ | Max: {p.maxOrder} M³
                          </p>
                        </div>
                        <Badge variant="outline">{p.basePrice} DH/M³</Badge>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedProduct && zone && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Prix unitaire:</span>
                        <span>{product?.basePrice} DH/M³</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transport ({zone.name.split(':')[0]}):</span>
                        <span>{zone.transportCost} DH/M³</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t">
                        <span>Prix total/M³:</span>
                        <span className="text-emerald-600">{pricePerM3} DH/M³</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => handleStepChange(4, `Produit: ${selectedProduct}`)} 
                disabled={!selectedProduct}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 4: Quantity */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Étape 4/6: Quantité
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Indiquez le volume de béton en M³.
                </p>
                <div className="space-y-2">
                  <Label>Quantité (M³)</Label>
                  <Input
                    type="number"
                    min={product?.minOrder || 2}
                    max={product?.maxOrder || 50}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: {product?.minOrder} M³ | Maximum: {product?.maxOrder} M³
                  </p>
                </div>
                {qty > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Quantité:</span>
                        <span>{qty} M³</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prix/M³:</span>
                        <span>{pricePerM3} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sous-total HT:</span>
                        <span>{subtotal.toLocaleString()} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (20%):</span>
                        <span>{tva.toLocaleString()} DH</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t text-lg">
                        <span>Total TTC:</span>
                        <span className="text-emerald-600">{totalTTC.toLocaleString()} DH</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => handleStepChange(5, `Quantité: ${quantity} M³`)} 
                disabled={qty < (product?.minOrder || 2) || qty > (product?.maxOrder || 50)}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 5: Notes */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📝 Étape 5/6: Notes Spéciales</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez des notes pour la livraison (optionnel).
                </p>
                <Textarea
                  placeholder="Ex: Livraison le samedi, accès difficile, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button 
                onClick={() => handleStepChange(6, 'Notes ajoutées')} 
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 6: Review & Send */}
          {step === 6 && (
            <div className="space-y-4 animate-fade-in">
              <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
                <CardContent className="pt-4">
                  <h4 className="font-bold mb-3 text-center">DEVIS BÉTON PRÊT À L'EMPLOI</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">N° Devis:</span>
                      <span className="font-mono font-bold">DEMO-DEVIS-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">{clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span>{contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Téléphone:</span>
                      <span>{contactPhone}</span>
                    </div>
                    <div className="border-t my-2 pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zone:</span>
                        <span>{zone?.name.split(':')[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Produit:</span>
                        <span>{product?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantité:</span>
                        <span>{qty} M³</span>
                      </div>
                    </div>
                    <div className="border-t my-2 pt-2">
                      <div className="flex justify-between">
                        <span>Prix unitaire:</span>
                        <span>{product?.basePrice} DH/M³</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transport:</span>
                        <span>{zone?.transportCost} DH/M³</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prix total/M³:</span>
                        <span>{pricePerM3} DH/M³</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span>Sous-total:</span>
                        <span>{subtotal.toLocaleString()} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (20%):</span>
                        <span>{tva.toLocaleString()} DH</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>TOTAL TTC:</span>
                        <span className="text-emerald-600">{totalTTC.toLocaleString()} DH</span>
                      </div>
                    </div>
                    {notes && (
                      <div className="border-t my-2 pt-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="italic">{notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Envoi en cours...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer Devis
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
