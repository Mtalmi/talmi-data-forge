import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Users, ArrowRight, RotateCcw, Building2, Phone, Mail, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClientManagementSimProps {
  onComplete: () => void;
  onClose: () => void;
}

export function ClientManagementSim({ onComplete, onClose }: ClientManagementSimProps) {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCreated, setClientCreated] = useState(false);
  const [historyViewed, setHistoryViewed] = useState(false);
  const [receivablesChecked, setReceivablesChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('[SIMULATION] Client Management:', {
      clientName,
      clientPhone,
      clientEmail,
      historyViewed,
      receivablesChecked,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('🎉 Simulation terminée!', {
      description: 'Gestion client complète',
    });
    
    setIsSubmitting(false);
    onComplete();
  };

  const handleReset = () => {
    setStep(1);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientCreated(false);
    setHistoryViewed(false);
    setReceivablesChecked(false);
  };

  const isFormValid = clientName.length >= 3 && clientPhone.length >= 10;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Simulation: Gestion Clients
            <Badge variant="outline" className="ml-2 bg-rose-100 text-rose-700 border-rose-300">
              EXECUTIVE
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Étape {step}/{totalSteps}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName="bg-rose-500" />
        </div>

        {/* Steps */}
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Étape 1: Créer un Client
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Saisissez les informations du nouveau client.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label>Nom de l'entreprise</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Constructions ABC SARL"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Téléphone
                    </Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: 0661234567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email (optionnel)
                    </Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="contact@exemple.ma"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!isFormValid}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2">✅ Étape 2: Confirmer la Création</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez les informations saisies.
                </p>
                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entreprise:</span>
                    <span className="font-medium">{clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone:</span>
                    <span className="font-medium">{clientPhone}</span>
                  </div>
                  {clientEmail && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{clientEmail}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Limite crédit:</span>
                    <span className="font-medium">50,000 DH (défaut)</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setClientCreated(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    clientCreated && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {clientCreated ? 'Client créé ✓' : 'Créer le client'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!clientCreated}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Étape 3: Historique Client
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Consultez l'historique des transactions (demo).
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-sm flex justify-between">
                    <span>Dernière commande</span>
                    <span className="text-muted-foreground">Nouveau client</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-sm flex justify-between">
                    <span>Volume total</span>
                    <span className="font-medium">0 m³</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-sm flex justify-between">
                    <span>CA cumulé</span>
                    <span className="font-medium">0 DH</span>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg text-sm flex justify-between">
                    <span>Score crédit</span>
                    <Badge className="bg-emerald-100 text-emerald-700">A (Nouveau)</Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setHistoryViewed(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    historyViewed && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {historyViewed ? 'Historique consulté ✓' : 'Valider consultation'}
                </Button>
              </div>
              <Button 
                onClick={handleNext} 
                disabled={!historyViewed}
                className="w-full gap-2"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-medium mb-2">💰 Étape 4: Suivi des Créances</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez la situation des créances client.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Limite crédit</span>
                      <span className="font-bold">50,000 DH</span>
                    </div>
                    <Progress value={0} className="h-2" indicatorClassName="bg-emerald-500" />
                    <p className="text-xs text-muted-foreground mt-1">0% utilisé</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Solde dû</span>
                      <span className="font-medium text-emerald-600">0 DH</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Factures en retard</span>
                      <span className="font-medium text-emerald-600">0</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setReceivablesChecked(true)}
                  className={cn(
                    "w-full mt-4 gap-2",
                    receivablesChecked && "bg-emerald-50 border-emerald-300 text-emerald-700"
                  )}
                >
                  {receivablesChecked ? 'Créances vérifiées ✓' : 'Valider vérification'}
                </Button>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !receivablesChecked}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>Finalisation...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer la Simulation
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
