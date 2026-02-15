import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, Upload, Camera, Fuel, Car, CheckCircle, AlertTriangle,
  XCircle, Loader2, Ban, ShieldAlert, Moon, Clock, Bot, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';
import { isCurrentlyOffHours, getCasablancaHour } from '@/lib/timezone';
import { AIVerifiedBadge } from '@/components/ui/AIVerifiedBadge';
import { AIVerificationPanel } from '@/components/ui/AIVerificationPanel';
import { useAIDocumentVerification } from '@/hooks/useAIDocumentVerification';
import { useI18n } from '@/i18n/I18nContext';

interface ExpenseRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const EXPENSE_CATEGORY_KEYS = [
  { value: 'carburant', icon: Fuel, requiresFuel: true },
  { value: 'maintenance', icon: Car },
  { value: 'fournitures', icon: Receipt },
  { value: 'transport', icon: Car },
  { value: 'reparation', icon: Car },
  { value: 'nettoyage', icon: Receipt },
  { value: 'petit_equipement', icon: Receipt },
  { value: 'services_externes', icon: Receipt },
  { value: 'frais_administratifs', icon: Receipt },
  { value: 'location_camion', icon: Car, requiresContract: 'camion_rental' },
  { value: 'location_trax', icon: Car, requiresContract: 'trax_rental' },
  { value: 'location_terrain', icon: Receipt, requiresContract: 'terrain_rental' },
  { value: 'autre', icon: Receipt },
] as const;

const RENTAL_CATEGORIES = ['location_camion', 'location_trax', 'location_terrain'];
const CATEGORY_CONTRACT_MAP: Record<string, string> = {
  'location_camion': 'camion_rental',
  'location_trax': 'trax_rental',
  'location_terrain': 'terrain_rental',
};

const BLOCKED_KEYWORDS = [
  'avance personnelle', 'personal advance', 'prêt personnel',
  'decision verbale', 'verbal decision', 'sans justificatif', 'no receipt',
];

const MIN_JUSTIFICATION_LENGTH = 20;

export function ExpenseRequestForm({ onSuccess, onCancel }: ExpenseRequestFormProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const er = t.expenseRequest;

  const {
    isScanning, extractedData, verificationResult, scanDocument,
    verifyAgainstUserData, hasCriticalMismatch, reset: resetAI,
  } = useAIDocumentVerification();
  
  const [description, setDescription] = useState('');
  const [montantHT, setMontantHT] = useState('');
  const [tvaPct, setTvaPct] = useState('20');
  const [categorie, setCategorie] = useState('');
  const [sousCategorie, setSousCategorie] = useState('');
  const [notes, setNotes] = useState('');
  const [vehiculeId, setVehiculeId] = useState('');
  const [kilometrage, setKilometrage] = useState('');
  const [contractId, setContractId] = useState('');
  const [availableContracts, setAvailableContracts] = useState<Array<{
    id: string; title: string; provider_name: string; monthly_amount: number;
    contract_type: string; ras_applicable: boolean; ras_rate: number;
  }>>([]);
  const [rasAmount, setRasAmount] = useState(0);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [justificationUrgence, setJustificationUrgence] = useState('');
  const [isOffHoursMode] = useState(() => isCurrentlyOffHours());
  const [currentCasablancaHour] = useState(() => getCasablancaHour());
  const [monthlyCapStatus, setMonthlyCapStatus] = useState<{
    spent: number; cap: number; exceeded: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [showComplianceAlert, setShowComplianceAlert] = useState(false);

  const isRentalCategory = RENTAL_CATEGORIES.includes(categorie);
  const requiredContractType = CATEGORY_CONTRACT_MAP[categorie] || null;
  const montantTTC = montantHT ? parseFloat(montantHT) * (1 + parseFloat(tvaPct || '0') / 100) : 0;
  const approvalLevel = montantTTC <= 2000 ? 'level_1' : montantTTC <= 20000 ? 'level_2' : 'level_3';

  useEffect(() => {
    const textToCheck = (description + ' ' + notes + ' ' + sousCategorie).toLowerCase();
    const blocked = BLOCKED_KEYWORDS.find(keyword => textToCheck.includes(keyword.toLowerCase()));
    if (blocked) {
      setBlockedReason(er.blocked.replace('{keyword}', blocked));
    } else {
      setBlockedReason(null);
    }
  }, [description, notes, sousCategorie, er.blocked]);

  useEffect(() => { fetchMonthlyCapStatus(); }, []);

  useEffect(() => {
    if (isRentalCategory && requiredContractType) {
      fetchContracts(requiredContractType);
    } else {
      setContractId(''); setAvailableContracts([]); setRasAmount(0);
    }
  }, [categorie, isRentalCategory, requiredContractType]);

  useEffect(() => {
    if (contractId && montantHT) {
      const contract = availableContracts.find(c => c.id === contractId);
      if (contract?.ras_applicable && contract?.ras_rate) {
        setRasAmount(parseFloat(montantHT) * (contract.ras_rate / 100));
      } else { setRasAmount(0); }
    } else { setRasAmount(0); }
  }, [contractId, montantHT, availableContracts]);

  const fetchContracts = async (contractType: string) => {
    const { data } = await supabase
      .from('contracts')
      .select('id, title, provider_name, monthly_amount, contract_type, ras_applicable, ras_rate')
      .eq('contract_type', contractType as 'camion_rental' | 'trax_rental' | 'terrain_rental')
      .eq('is_active', true);
    setAvailableContracts(data || []);
  };

  const fetchMonthlyCapStatus = async () => {
    try {
      const monthYear = new Date().toISOString().slice(0, 7);
      const { data } = await supabase
        .from('monthly_expense_caps')
        .select('level1_spent, level1_cap, cap_exceeded')
        .eq('month_year', monthYear)
        .maybeSingle();
      if (data) {
        setMonthlyCapStatus({ spent: data.level1_spent, cap: data.level1_cap, exceeded: data.cap_exceeded });
      } else {
        setMonthlyCapStatus({ spent: 0, cap: 15000, exceeded: false });
      }
    } catch {
      setMonthlyCapStatus({ spent: 0, cap: 15000, exceeded: false });
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    resetAI();
    try {
      const compressedFile = await compressImage(file, { maxWidth: 1920, quality: 0.8 });
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(compressedFile);
      const fileName = `expense-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { data, error } = await supabase.storage.from('expense-receipts').upload(fileName, compressedFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('expense-receipts').getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;
      setReceiptUrl(publicUrl);
      toast.success(er.receiptUploaded);
      const extracted = await scanDocument(publicUrl, 'expense');
      if (extracted) {
        if (extracted.amount !== null && !montantHT) {
          const calculatedHT = extracted.amount / (1 + parseFloat(tvaPct) / 100);
          setMontantHT(calculatedHT.toFixed(2));
          toast.success(er.amountPrefilled.replace('{amount}', extracted.amount.toLocaleString()), { duration: 4000 });
        }
        if (extracted.supplier && !description) {
          setDescription(`Facture ${extracted.supplier}${extracted.bl_number ? ` - ${extracted.bl_number}` : ''}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(er.uploadError);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!description.trim()) { toast.error(er.descRequired); return; }
    if (!montantHT || parseFloat(montantHT) <= 0) { toast.error(er.invalidAmount); return; }
    if (!categorie) { toast.error(er.categoryRequired); return; }
    if (blockedReason) { toast.error(blockedReason); return; }
    if (!asDraft && !receiptUrl) { toast.error(er.receiptRequired); return; }
    if (!asDraft && categorie === 'carburant') {
      if (!vehiculeId.trim()) { toast.error(er.vehicleRequired); return; }
      if (!kilometrage || parseFloat(kilometrage) <= 0) { toast.error(er.mileageRequired); return; }
    }
    if (!asDraft && isRentalCategory && !contractId) { toast.error(er.contractReq); return; }
    if (!asDraft && isOffHoursMode) {
      if (!justificationUrgence.trim()) { toast.error(er.nightJustRequired); return; }
      if (justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH) {
        toast.error(er.justTooShort.replace('{min}', String(MIN_JUSTIFICATION_LENGTH))); return;
      }
    }
    if (!asDraft && extractedData) {
      const verification = verifyAgainstUserData(extractedData, { amount: montantTTC });
      if (verification.mismatches.some(m => m.severity === 'critical')) {
        toast.error(er.submissionBlocked, { duration: 8000 }); return;
      }
      if (verification.mismatches.length > 0) {
        toast.warning(er.mismatchWarning, { duration: 5000 });
      }
    }

    setSubmitting(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user?.id).single();
      const calculatedLevel = montantTTC <= 2000 ? 'level_1' : montantTTC <= 20000 ? 'level_2' : 'level_3';
      const { error } = await supabase.from('expenses_controlled').insert({
        description: description.trim(),
        montant_ht: parseFloat(montantHT),
        montant_ttc: montantTTC,
        tva_pct: parseFloat(tvaPct || '0'),
        categorie: categorie as Database['public']['Enums']['expense_category'],
        sous_categorie: sousCategorie || null,
        vehicule_id: categorie === 'carburant' ? vehiculeId : null,
        kilometrage: categorie === 'carburant' ? parseFloat(kilometrage) : null,
        contract_id: isRentalCategory ? contractId : null,
        receipt_photo_url: receiptUrl || null,
        requested_by: user?.id as string,
        requested_by_name: profile?.full_name || 'Utilisateur',
        notes: (() => {
          const parts: string[] = [];
          if (extractedData) {
            const aiTag = verificationResult?.isVerified 
              ? `[AI_VERIFIED: OK - ${extractedData.confidence}%]`
              : `[AI_VERIFIED: MISMATCH - ${extractedData.confidence}%]`;
            parts.push(aiTag);
          }
          if (isOffHoursMode && justificationUrgence.trim()) {
            parts.push(`[URGENCE: ${justificationUrgence.trim()}]`);
          }
          if (notes) parts.push(notes);
          return parts.length > 0 ? parts.join(' | ') : null;
        })(),
        statut: asDraft ? 'brouillon' : 'en_attente',
        approval_level: calculatedLevel as Database['public']['Enums']['expense_approval_level'],
      });
      if (error) throw error;
      toast.success(asDraft ? er.draftSaved : er.submitted);
      onSuccess();
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMessage = error.message || error.details || '';
      if (errorMessage.includes('LIMIT_EXCEEDED')) {
        setShowComplianceAlert(true);
        fetchMonthlyCapStatus();
      } else if (errorMessage.includes('EVIDENCE_REQUIRED')) {
        toast.error(er.receiptMandatory);
      } else if (errorMessage.includes('FUEL_PROTOCOL')) {
        toast.error(er.fuelDataMissing);
      } else {
        toast.error(er.submitError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFuelCategory = categorie === 'carburant';
  const capPercentage = monthlyCapStatus ? Math.min(100, (monthlyCapStatus.spent / monthlyCapStatus.cap) * 100) : 0;

  return (
    <div className="space-y-6">
      {isOffHoursMode && (
        <Alert className="border-destructive bg-destructive/10">
          <Moon className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <div className="flex items-center gap-2">
              <span className="font-bold">{er.nightMode}</span>
              <Badge variant="destructive" className="text-[10px] animate-pulse">
                {currentCasablancaHour}h 🇲🇦
              </Badge>
            </div>
            <p className="text-xs mt-1">{er.nightDesc}</p>
          </AlertDescription>
        </Alert>
      )}

      {monthlyCapStatus && monthlyCapStatus.exceeded && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>{er.capReached}</strong> {er.capDesc}
          </AlertDescription>
        </Alert>
      )}

      {monthlyCapStatus && approvalLevel === 'level_1' && (
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{er.level1Expenses}</span>
            <span className={cn(
              'font-mono font-semibold',
              capPercentage >= 90 ? 'text-destructive' : capPercentage >= 70 ? 'text-warning' : 'text-success'
            )}>
              {monthlyCapStatus.spent.toLocaleString()} / {monthlyCapStatus.cap.toLocaleString()} MAD
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={cn(
              'h-full transition-all',
              capPercentage >= 90 ? 'bg-destructive' : capPercentage >= 70 ? 'bg-warning' : 'bg-success'
            )} style={{ width: `${capPercentage}%` }} />
          </div>
        </div>
      )}

      {blockedReason && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertDescription>{blockedReason}</AlertDescription>
        </Alert>
      )}

      {showComplianceAlert && (
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/30">
                <Shield className="h-6 w-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  {er.complianceTitle}
                </h3>
                <p className="text-xs text-amber-500/80 font-medium">{er.complianceSubtitle}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold text-base">{er.complianceLimitReached}</p>
              <p className="text-slate-300 text-sm">{er.complianceCeoRequired}</p>
              <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-400">{er.complianceCapReached}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowComplianceAlert(false)}
              className="w-full border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400">
              {er.understood}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <span className="font-semibold">{er.mandatoryProof}</span>
          <Badge variant="destructive" className="text-[10px] animate-pulse">{er.required}</Badge>
        </Label>
        
        {receiptPreview ? (
          <div className="relative">
            <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-contain rounded-lg border-2 border-success bg-muted" />
            <Badge className="absolute top-2 right-2 bg-success gap-1">
              <CheckCircle className="h-3 w-3" />{er.proofValidated}
            </Badge>
            <Button type="button" variant="secondary" size="sm" className="absolute bottom-2 right-2"
              onClick={() => { setReceiptUrl(''); setReceiptPreview(''); }}>
              {er.change}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-full w-fit mx-auto">
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-500">{er.auditRequirement}</span>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-destructive/50 rounded-lg cursor-pointer hover:border-destructive hover:bg-destructive/5 transition-all">
              <div className="flex flex-col items-center justify-center py-4">
                {uploadingReceipt ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-destructive/10 mb-2">
                      <Camera className="h-8 w-8 text-destructive" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{er.photographReceipt}</p>
                    <p className="text-xs text-destructive mt-1 font-bold">{er.proofRequired}</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={handleReceiptUpload} disabled={uploadingReceipt} />
            </label>
          </div>
        )}
      </div>

      {(extractedData || isScanning) && (
        <AIVerificationPanel isScanning={isScanning} extractedData={extractedData}
          verificationResult={verificationResult}
          onApplySuggestion={(field, value) => {
            if (field === 'amount' && typeof value === 'number') {
              const calculatedHT = value / (1 + parseFloat(tvaPct) / 100);
              setMontantHT(calculatedHT.toFixed(2));
            }
          }}
        />
      )}

      {hasCriticalMismatch && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{er.blockedCritical}</strong> - {er.blockedDesc}
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{er.amountHT}</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={montantHT}
            onChange={(e) => setMontantHT(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label>{er.tva}</Label>
          <Select value={tvaPct} onValueChange={setTvaPct}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% ({er.tvaOptions.exempt})</SelectItem>
              <SelectItem value="7">7%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="14">14%</SelectItem>
              <SelectItem value="20">20%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {montantTTC > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <span className="text-sm text-muted-foreground">{er.totalTTC}</span>
            <span className="ml-2 text-lg font-bold font-mono">{montantTTC.toFixed(2)} MAD</span>
          </div>
          <Badge className={cn(
            approvalLevel === 'level_1' ? 'text-success' : approvalLevel === 'level_2' ? 'text-warning' : 'text-destructive',
            'bg-transparent border'
          )}>
            {er.approvalLevels[approvalLevel as keyof typeof er.approvalLevels]}
          </Badge>
        </div>
      )}

      <div className="space-y-2">
        <Label>{er.category}</Label>
        <Select value={categorie} onValueChange={setCategorie}>
          <SelectTrigger><SelectValue placeholder={er.selectCategory} /></SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORY_KEYS.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-4 w-4" />
                  {er.categories[cat.value as keyof typeof er.categories]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFuelCategory && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <Fuel className="h-4 w-4" />{er.fuelProtocol}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{er.vehicleId}</Label>
              <Input placeholder="ex: TOUPIE-01" value={vehiculeId} onChange={(e) => setVehiculeId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{er.mileage}</Label>
              <Input type="number" placeholder="ex: 125430" value={kilometrage}
                onChange={(e) => setKilometrage(e.target.value)} className="font-mono" />
            </div>
          </CardContent>
        </Card>
      )}

      {isRentalCategory && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
              <Shield className="h-4 w-4" />{er.rentalContract}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger><SelectValue placeholder={er.selectContract} /></SelectTrigger>
              <SelectContent>
                {availableContracts.length === 0 ? (
                  <SelectItem value="_none" disabled>{er.noActiveContract}</SelectItem>
                ) : (
                  availableContracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.title} - {contract.provider_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {rasAmount > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{er.ras}</span>
                </div>
                <span className="font-mono font-bold text-amber-500">{rasAmount.toFixed(2)} MAD</span>
              </div>
            )}
            {!contractId && (
              <p className="text-xs text-destructive">{er.contractRequired}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label>{er.description}</Label>
        <Textarea placeholder={er.descPlaceholder} value={description}
          onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      {isOffHoursMode && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <Moon className="h-4 w-4" />{er.urgencyJustification}
              <Badge variant="destructive" className="text-[10px] animate-pulse">{er.required}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{er.urgencyExplain}</p>
            <Textarea placeholder={er.urgencyPlaceholder} value={justificationUrgence}
              onChange={(e) => setJustificationUrgence(e.target.value)} rows={3}
              className={cn("border-destructive/50",
                justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH && "border-success"
              )} />
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH ? "text-success" : "text-destructive"
              )}>
                {justificationUrgence.trim().length}/{MIN_JUSTIFICATION_LENGTH} {er.minChars}
              </span>
              {justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH && (
                <Badge className="bg-success text-[10px] gap-1">
                  <CheckCircle className="h-2.5 w-2.5" />{er.validated}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label>{er.notesOptional}</Label>
        <Textarea placeholder={er.notesPlaceholder} value={notes}
          onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>{er.cancel}</Button>
        <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={submitting || !!blockedReason}>
          {er.saveDraft}
        </Button>
        <Button onClick={() => handleSubmit(false)}
          disabled={submitting || !receiptUrl || !!blockedReason || hasCriticalMismatch ||
            (isOffHoursMode && justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH)}
          className={cn("gap-2",
            (isOffHoursMode && justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH) && "opacity-50",
            hasCriticalMismatch && "opacity-50 cursor-not-allowed"
          )}>
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{er.sending}</>
          ) : verificationResult?.isVerified ? (
            <><Bot className="h-4 w-4" />{er.submitAI}</>
          ) : (
            <><CheckCircle className="h-4 w-4" />{er.submit}</>
          )}
        </Button>
      </div>
    </div>
  );
}