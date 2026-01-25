import { useState } from 'react';
import { useLoans } from '@/hooks/useLoans';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calculator, 
  Calendar, 
  User,
  Plus,
  AlertTriangle
} from 'lucide-react';

interface CreateLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'type' | 'associate' | 'details' | 'review';

export function CreateLoanDialog({ open, onOpenChange, onSuccess }: CreateLoanDialogProps) {
  const { associates, createAssociate, createLoan, calculateMonthlyPayment } = useLoans();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('type');
  const [loading, setLoading] = useState(false);
  const [showNewAssociate, setShowNewAssociate] = useState(false);
  
  // Form state
  const [loanType, setLoanType] = useState<'to_company' | 'from_company'>('to_company');
  const [associateId, setAssociateId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [termMonths, setTermMonths] = useState('12');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  
  // New associate form
  const [newAssociateName, setNewAssociateName] = useState('');
  const [newAssociateRelationship, setNewAssociateRelationship] = useState('');
  const [newAssociateEmail, setNewAssociateEmail] = useState('');
  const [newAssociatePhone, setNewAssociatePhone] = useState('');

  // Calculations
  const principalAmount = parseFloat(principal) || 0;
  const annualRate = parseFloat(interestRate) / 100 || 0;
  const months = parseInt(termMonths) || 12;
  const monthlyPayment = calculateMonthlyPayment(principalAmount, annualRate, months);
  const totalInterest = (monthlyPayment * months) - principalAmount;
  const totalAmount = principalAmount + Math.max(0, totalInterest);
  const endDate = addMonths(new Date(startDate), months);

  const resetForm = () => {
    setStep('type');
    setLoanType('to_company');
    setAssociateId('');
    setPrincipal('');
    setInterestRate('0');
    setTermMonths('12');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setShowNewAssociate(false);
    setNewAssociateName('');
    setNewAssociateRelationship('');
    setNewAssociateEmail('');
    setNewAssociatePhone('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreateAssociate = async () => {
    if (!newAssociateName || !newAssociateRelationship) {
      toast.error('Veuillez remplir le nom et le lien');
      return;
    }

    setLoading(true);
    const newAssociate = await createAssociate({
      name: newAssociateName,
      relationship: newAssociateRelationship,
      email: newAssociateEmail || null,
      phone: newAssociatePhone || null,
      address: null,
      tax_id: null,
      notes: null,
      is_active: true,
    });

    if (newAssociate) {
      setAssociateId(newAssociate.id);
      setShowNewAssociate(false);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!associateId || !principal || !termMonths) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (principalAmount > 500000 && !notes) {
      toast.error('Une justification est requise pour les prêts > 500,000 DH');
      return;
    }

    setLoading(true);
    const result = await createLoan({
      associate_id: associateId,
      loan_type: loanType,
      principal_amount: principalAmount,
      interest_rate: annualRate,
      term_months: months,
      start_date: startDate,
      notes: notes || undefined,
    }, user?.email || 'Système');

    setLoading(false);

    if (result) {
      onSuccess();
      handleClose();
    }
  };

  const selectedAssociate = associates.find(a => a.id === associateId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Prêt Associé</DialogTitle>
          <DialogDescription>
            {step === 'type' && 'Sélectionnez le type de prêt'}
            {step === 'associate' && 'Sélectionnez ou créez un associé'}
            {step === 'details' && 'Configurez les détails du prêt'}
            {step === 'review' && 'Vérifiez et confirmez le prêt'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {(['type', 'associate', 'details', 'review'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-primary text-primary-foreground' :
                (['type', 'associate', 'details', 'review'].indexOf(step) > i) ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        {/* Step 1: Type Selection */}
        {step === 'type' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  loanType === 'to_company' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                }`}
                onClick={() => setLoanType('to_company')}
              >
                <CardContent className="p-6 text-center">
                  <ArrowDownLeft className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="font-semibold mb-2">Prêt à la Société</h3>
                  <p className="text-sm text-muted-foreground">
                    L'associé prête de l'argent à la société
                  </p>
                  <Badge variant="outline" className="mt-4">
                    Société doit à l'Associé
                  </Badge>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  loanType === 'from_company' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                }`}
                onClick={() => setLoanType('from_company')}
              >
                <CardContent className="p-6 text-center">
                  <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                  <h3 className="font-semibold mb-2">Prêt de la Société</h3>
                  <p className="text-sm text-muted-foreground">
                    La société prête de l'argent à l'associé
                  </p>
                  <Badge variant="outline" className="mt-4">
                    Associé doit à la Société
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep('associate')}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Associate Selection */}
        {step === 'associate' && (
          <div className="space-y-4">
            {!showNewAssociate ? (
              <>
                <div className="space-y-2">
                  <Label>Sélectionner un Associé</Label>
                  <Select value={associateId} onValueChange={setAssociateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un associé..." />
                    </SelectTrigger>
                    <SelectContent>
                      {associates.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.relationship})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setShowNewAssociate(true)}
                >
                  <Plus className="h-4 w-4" />
                  Créer un Nouvel Associé
                </Button>
              </>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nouvel Associé
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom Complet *</Label>
                    <Input
                      value={newAssociateName}
                      onChange={(e) => setNewAssociateName(e.target.value)}
                      placeholder="Ahmed Talmi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lien avec la Société *</Label>
                    <Select value={newAssociateRelationship} onValueChange={setNewAssociateRelationship}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Propriétaire</SelectItem>
                        <SelectItem value="partner">Associé</SelectItem>
                        <SelectItem value="shareholder">Actionnaire</SelectItem>
                        <SelectItem value="family">Famille</SelectItem>
                        <SelectItem value="director">Directeur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newAssociateEmail}
                      onChange={(e) => setNewAssociateEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={newAssociatePhone}
                      onChange={(e) => setNewAssociatePhone(e.target.value)}
                      placeholder="+212 600 000 000"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewAssociate(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateAssociate}
                    disabled={loading || !newAssociateName || !newAssociateRelationship}
                  >
                    {loading ? 'Création...' : 'Créer l\'Associé'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('type')}>
                Retour
              </Button>
              <Button 
                onClick={() => setStep('details')}
                disabled={!associateId}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Loan Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant Principal (DH) *</Label>
                <Input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="500000"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Taux d'Intérêt Annuel (%)</Label>
                <Input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="3"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée (Mois) *</Label>
                <Select value={termMonths} onValueChange={setTermMonths}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">12 mois (1 an)</SelectItem>
                    <SelectItem value="24">24 mois (2 ans)</SelectItem>
                    <SelectItem value="36">36 mois (3 ans)</SelectItem>
                    <SelectItem value="48">48 mois (4 ans)</SelectItem>
                    <SelectItem value="60">60 mois (5 ans)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de Début *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* Calculation Preview */}
            {principalAmount > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Simulation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mensualité</p>
                      <p className="text-xl font-bold">{monthlyPayment.toLocaleString('fr-MA')} DH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Intérêts Totaux</p>
                      <p className="text-xl font-bold">{Math.max(0, totalInterest).toLocaleString('fr-MA')} DH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Montant Total</p>
                      <p className="font-semibold">{totalAmount.toLocaleString('fr-MA')} DH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fin du Prêt</p>
                      <p className="font-semibold">{format(endDate, 'dd MMM yyyy', { locale: fr })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Notes / Justification {principalAmount > 500000 && '*'}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motif du prêt, conditions particulières..."
                rows={3}
              />
              {principalAmount > 500000 && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Justification obligatoire pour les prêts {'>'} 500,000 DH
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('associate')}>
                Retour
              </Button>
              <Button 
                onClick={() => setStep('review')}
                disabled={!principal || principalAmount <= 0}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Type de Prêt</p>
                    <p className="font-medium flex items-center gap-2">
                      {loanType === 'to_company' ? (
                        <>
                          <ArrowDownLeft className="h-4 w-4 text-amber-500" />
                          Prêt à la Société
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                          Prêt de la Société
                        </>
                      )}
                    </p>
                  </div>
                  <Badge>{loanType === 'to_company' ? 'Société doit' : 'Associé doit'}</Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Associé</p>
                    <p className="font-medium">{selectedAssociate?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAssociate?.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Principal</p>
                    <p className="font-medium text-xl">{principalAmount.toLocaleString('fr-MA')} DH</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Taux</p>
                    <p className="font-medium">{interestRate}% / an</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Durée</p>
                    <p className="font-medium">{termMonths} mois</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mensualité</p>
                    <p className="font-medium">{monthlyPayment.toLocaleString('fr-MA')} DH</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Début</p>
                    <p className="font-medium">{format(new Date(startDate), 'dd MMM yyyy', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fin</p>
                    <p className="font-medium">{format(endDate, 'dd MMM yyyy', { locale: fr })}</p>
                  </div>
                </div>

                {notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('details')}>
                Retour
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le Prêt'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
