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
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calculator, 
  Calendar, 
  User,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface CreateLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'type' | 'associate' | 'details' | 'review';

export function CreateLoanDialog({ open, onOpenChange, onSuccess }: CreateLoanDialogProps) {
  const { associates, createAssociate, createLoan, calculateMonthlyPayment } = useLoans();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const cl = t.createLoan;
  const dateLocale = getDateLocale(lang);
  
  const [step, setStep] = useState<Step>('type');
  const [loading, setLoading] = useState(false);
  const [showNewAssociate, setShowNewAssociate] = useState(false);
  
  const [loanType, setLoanType] = useState<'to_company' | 'from_company'>('to_company');
  const [associateId, setAssociateId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [termMonths, setTermMonths] = useState('12');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  
  const [newAssociateName, setNewAssociateName] = useState('');
  const [newAssociateRelationship, setNewAssociateRelationship] = useState('');
  const [newAssociateEmail, setNewAssociateEmail] = useState('');
  const [newAssociatePhone, setNewAssociatePhone] = useState('');

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
      toast.error(cl.fillNameAndLink);
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
      toast.error(cl.fillRequired);
      return;
    }

    if (principalAmount > 500000 && !notes) {
      toast.error(cl.justificationRequired);
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
          <DialogTitle>{cl.title}</DialogTitle>
          <DialogDescription>
            {step === 'type' && cl.stepType}
            {step === 'associate' && cl.stepAssociate}
            {step === 'details' && cl.stepDetails}
            {step === 'review' && cl.stepReview}
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
                  <h3 className="font-semibold mb-2">{cl.loanToCompany}</h3>
                  <p className="text-sm text-muted-foreground">{cl.loanToCompanyDesc}</p>
                  <Badge variant="outline" className="mt-4">{cl.companyOwes}</Badge>
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
                  <h3 className="font-semibold mb-2">{cl.loanFromCompany}</h3>
                  <p className="text-sm text-muted-foreground">{cl.loanFromCompanyDesc}</p>
                  <Badge variant="outline" className="mt-4">{cl.associateOwes}</Badge>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep('associate')}>{cl.continue}</Button>
            </div>
          </div>
        )}

        {/* Step 2: Associate Selection */}
        {step === 'associate' && (
          <div className="space-y-4">
            {!showNewAssociate ? (
              <>
                <div className="space-y-2">
                  <Label>{cl.selectAssociate}</Label>
                  <Select value={associateId} onValueChange={setAssociateId}>
                    <SelectTrigger>
                      <SelectValue placeholder={cl.chooseAssociate} />
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
                    <span className="bg-background px-2 text-muted-foreground">{cl.or}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setShowNewAssociate(true)}
                >
                  <Plus className="h-4 w-4" />
                  {cl.createNewAssociate}
                </Button>
              </>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {cl.newAssociate}
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{cl.fullName}</Label>
                    <Input
                      value={newAssociateName}
                      onChange={(e) => setNewAssociateName(e.target.value)}
                      placeholder="Ahmed Talmi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{cl.companyLink}</Label>
                    <Select value={newAssociateRelationship} onValueChange={setNewAssociateRelationship}>
                      <SelectTrigger>
                        <SelectValue placeholder={cl.selectLink} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">{cl.owner}</SelectItem>
                        <SelectItem value="partner">{cl.partner}</SelectItem>
                        <SelectItem value="shareholder">{cl.shareholder}</SelectItem>
                        <SelectItem value="family">{cl.family}</SelectItem>
                        <SelectItem value="director">{cl.director}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{cl.email}</Label>
                    <Input
                      type="email"
                      value={newAssociateEmail}
                      onChange={(e) => setNewAssociateEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{cl.phone}</Label>
                    <Input
                      value={newAssociatePhone}
                      onChange={(e) => setNewAssociatePhone(e.target.value)}
                      placeholder="+212 600 000 000"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewAssociate(false)}>
                    {cl.cancel}
                  </Button>
                  <Button 
                    onClick={handleCreateAssociate}
                    disabled={loading || !newAssociateName || !newAssociateRelationship}
                  >
                    {loading ? cl.creating : cl.createAssociate}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('type')}>{cl.back}</Button>
              <Button onClick={() => setStep('details')} disabled={!associateId}>{cl.continue}</Button>
            </div>
          </div>
        )}

        {/* Step 3: Loan Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{cl.principalAmount}</Label>
                <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="500000" min="0" />
              </div>
              <div className="space-y-2">
                <Label>{cl.interestRate}</Label>
                <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="3" min="0" max="100" step="0.1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{cl.duration}</Label>
                <Select value={termMonths} onValueChange={setTermMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">{cl.months6}</SelectItem>
                    <SelectItem value="12">{cl.months12}</SelectItem>
                    <SelectItem value="24">{cl.months24}</SelectItem>
                    <SelectItem value="36">{cl.months36}</SelectItem>
                    <SelectItem value="48">{cl.months48}</SelectItem>
                    <SelectItem value="60">{cl.months60}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{cl.startDate}</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>

            {principalAmount > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">{cl.simulation}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{cl.monthlyPayment}</p>
                      <p className="text-xl font-bold">{monthlyPayment.toLocaleString('fr-MA')} DH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{cl.totalInterest}</p>
                      <p className="text-xl font-bold">{Math.max(0, totalInterest).toLocaleString('fr-MA')} DH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{cl.totalAmount}</p>
                      <p className="font-semibold">{totalAmount.toLocaleString('fr-MA')} DH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{cl.loanEnd}</p>
                      <p className="font-semibold">{format(endDate, 'dd MMM yyyy', { locale: dateLocale })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>{cl.notesJustification} {principalAmount > 500000 && '*'}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={cl.notesPlaceholder} rows={3} />
              {principalAmount > 500000 && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {cl.notesMandatory}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('associate')}>{cl.back}</Button>
              <Button onClick={() => setStep('review')} disabled={!principal || principalAmount <= 0}>{cl.continue}</Button>
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
                    <p className="text-sm text-muted-foreground">{cl.loanType}</p>
                    <p className="font-medium flex items-center gap-2">
                      {loanType === 'to_company' ? (
                        <><ArrowDownLeft className="h-4 w-4 text-amber-500" />{cl.loanToCompany}</>
                      ) : (
                        <><ArrowUpRight className="h-4 w-4 text-emerald-500" />{cl.loanFromCompany}</>
                      )}
                    </p>
                  </div>
                  <Badge>{loanType === 'to_company' ? cl.companyOwesShort : cl.associateOwesShort}</Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{cl.associate}</p>
                    <p className="font-medium">{selectedAssociate?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAssociate?.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{cl.principal}</p>
                    <p className="font-medium text-xl">{principalAmount.toLocaleString('fr-MA')} DH</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{cl.rate}</p>
                    <p className="font-medium">{interestRate}% {cl.perYear}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{cl.durationLabel}</p>
                    <p className="font-medium">{termMonths} {cl.monthsLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{cl.monthlyPayment}</p>
                    <p className="font-medium">{monthlyPayment.toLocaleString('fr-MA')} DH</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{cl.start}</p>
                    <p className="font-medium">{format(new Date(startDate), 'dd MMM yyyy', { locale: dateLocale })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{cl.end}</p>
                    <p className="font-medium">{format(endDate, 'dd MMM yyyy', { locale: dateLocale })}</p>
                  </div>
                </div>

                {notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">{cl.notes}</p>
                      <p className="text-sm">{notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('details')}>{cl.back}</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? cl.creatingLoan : cl.createLoan}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
