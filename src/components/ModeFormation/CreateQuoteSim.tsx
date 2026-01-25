import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, FileText, ArrowRight, RotateCcw, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateQuoteSimProps {
  onComplete: () => void;
  onClose: () => void;
}

const DEMO_CLIENTS = [
  { id: 'demo-1', name: 'Client Test SARL' },
  { id: 'demo-2', name: 'Entreprise Demo' },
  { id: 'demo-3', name: 'Construction ABC' },
];

const DEMO_PRODUCTS = [
  { id: 'cement', name: 'Ciment Portland', unit: 'sacs', price: 500 },
  { id: 'gravel', name: 'Gravier 8/15', unit: 'tonnes', price: 350 },
  { id: 'sand', name: 'Sable fin', unit: 'tonnes', price: 280 },
];

export function CreateQuoteSim({ onComplete, onClose }: CreateQuoteSimProps) {
  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const selectedProductData = DEMO_PRODUCTS.find(p => p.id === selectedProduct);
  const total = selectedProductData ? selectedProductData.price * parseInt(quantity || '0') : 0;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Création devis:', {
      client: selectedClient,
      product: selectedProduct,
      quantity,
      total,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Devis DEMO-DEV-001 créé avec succès',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setSelectedClient('');
    setSelectedProduct('');
    setQuantity('10');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            Simulation: Créer un Devis
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
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📋 Étape 1: Sélectionner le Client</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez le client pour ce devis demo.
                </p>
                <Label>Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_CLIENTS.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!selectedClient}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">📦 Étape 2: Sélectionner le Produit</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez le produit à ajouter au devis.
                </p>
                <Label>Produit</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_PRODUCTS.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.price} DH/{product.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!selectedProduct}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">🔢 Étape 3: Définir la Quantité</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Indiquez la quantité souhaitée.
                </p>
                <Label>Quantité ({selectedProductData?.unit})</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="mt-1"
                />
                {selectedProductData && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total estimé:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {total.toLocaleString()} DH
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!quantity || parseInt(quantity) <= 0}
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
                  <Calculator className="h-4 w-4" />
                  Récapitulatif du Devis
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{DEMO_CLIENTS.find(c => c.id === selectedClient)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produit:</span>
                    <span className="font-medium">{selectedProductData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantité:</span>
                    <span className="font-medium">{quantity} {selectedProductData?.unit}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total HT:</span>
                    <span className="text-lg font-bold text-emerald-600">{total.toLocaleString()} DH</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Création en cours...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Valider le Devis
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
