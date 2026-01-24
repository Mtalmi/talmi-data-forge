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
  Receipt, 
  Upload, 
  Camera,
  Fuel,
  Car,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Ban,
  ShieldAlert,
  Moon,
  Clock,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';
import { isCurrentlyOffHours, getCasablancaHour } from '@/lib/timezone';
import { AIVerifiedBadge } from '@/components/ui/AIVerifiedBadge';
import { AIVerificationPanel } from '@/components/ui/AIVerificationPanel';
import { useAIDocumentVerification } from '@/hooks/useAIDocumentVerification';

interface ExpenseRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'carburant', label: 'Carburant', icon: Fuel, requiresFuel: true },
  { value: 'maintenance', label: 'Maintenance', icon: Car },
  { value: 'fournitures', label: 'Fournitures', icon: Receipt },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'reparation', label: 'Réparation', icon: Car },
  { value: 'nettoyage', label: 'Nettoyage', icon: Receipt },
  { value: 'petit_equipement', label: 'Petit Équipement', icon: Receipt },
  { value: 'services_externes', label: 'Services Externes', icon: Receipt },
  { value: 'frais_administratifs', label: 'Frais Administratifs', icon: Receipt },
  { value: 'autre', label: 'Autre', icon: Receipt },
];

// INTERDICTIONS - Hard blocked categories per Section 8
const BLOCKED_KEYWORDS = [
  'avance personnelle',
  'personal advance',
  'prêt personnel',
  'decision verbale',
  'verbal decision',
  'sans justificatif',
  'no receipt',
];

// Minimum justification length for off-hours transactions (Titanium Shield)
const MIN_JUSTIFICATION_LENGTH = 20;

export function ExpenseRequestForm({ onSuccess, onCancel }: ExpenseRequestFormProps) {
  const { user } = useAuth();
  
  // AI Document Verification
  const {
    isScanning,
    extractedData,
    verificationResult,
    scanDocument,
    verifyAgainstUserData,
    hasCriticalMismatch,
    reset: resetAI,
  } = useAIDocumentVerification();
  
  const [description, setDescription] = useState('');
  const [montantHT, setMontantHT] = useState('');
  const [tvaPct, setTvaPct] = useState('20');
  const [categorie, setCategorie] = useState('');
  const [sousCategorie, setSousCategorie] = useState('');
  const [notes, setNotes] = useState('');
  
  // Fuel-specific
  const [vehiculeId, setVehiculeId] = useState('');
  const [kilometrage, setKilometrage] = useState('');
  
  // Receipt
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  // Off-hours justification (Midnight Alert Protocol)
  const [justificationUrgence, setJustificationUrgence] = useState('');
  const [isOffHoursMode] = useState(() => isCurrentlyOffHours());
  const [currentCasablancaHour] = useState(() => getCasablancaHour());
  
  // Monthly cap status
  const [monthlyCapStatus, setMonthlyCapStatus] = useState<{
    spent: number;
    cap: number;
    exceeded: boolean;
  } | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  // Calculate TTC
  const montantTTC = montantHT 
    ? parseFloat(montantHT) * (1 + parseFloat(tvaPct || '0') / 100) 
    : 0;

  // Determine approval level
  const approvalLevel = montantTTC <= 2000 ? 'level_1' : montantTTC <= 20000 ? 'level_2' : 'level_3';
  
  const approvalLabels = {
    level_1: { label: 'Niveau 1', desc: '≤ 2,000 MAD - Admin/Exploitation', color: 'text-success' },
    level_2: { label: 'Niveau 2', desc: '2,001-20,000 MAD - Superviseur', color: 'text-warning' },
    level_3: { label: 'Niveau 3', desc: '> 20,000 MAD - CEO uniquement', color: 'text-destructive' },
  };

  // Check for blocked keywords (Section 8 interdictions)
  useEffect(() => {
    const textToCheck = (description + ' ' + notes + ' ' + sousCategorie).toLowerCase();
    const blocked = BLOCKED_KEYWORDS.find(keyword => textToCheck.includes(keyword.toLowerCase()));
    
    if (blocked) {
      setBlockedReason(`INTERDIT (Section 8): "${blocked}" n'est pas autorisé.`);
    } else {
      setBlockedReason(null);
    }
  }, [description, notes, sousCategorie]);

  // Fetch monthly cap status
  useEffect(() => {
    fetchMonthlyCapStatus();
  }, []);

  const fetchMonthlyCapStatus = async () => {
    try {
      const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data } = await supabase
        .from('monthly_expense_caps')
        .select('level1_spent, level1_cap, cap_exceeded')
        .eq('month_year', monthYear)
        .single();

      if (data) {
        setMonthlyCapStatus({
          spent: data.level1_spent,
          cap: data.level1_cap,
          exceeded: data.cap_exceeded,
        });
      } else {
        setMonthlyCapStatus({ spent: 0, cap: 15000, exceeded: false });
      }
    } catch (error) {
      // No data for this month yet
      setMonthlyCapStatus({ spent: 0, cap: 15000, exceeded: false });
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    resetAI(); // Reset previous AI state
    
    try {
      const compressedFile = await compressImage(file, { maxWidth: 1920, quality: 0.8 });
      
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(compressedFile);

      const fileName = `expense-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { data, error } = await supabase.storage
        .from('expense-receipts')
        .upload(fileName, compressedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setReceiptUrl(publicUrl);
      toast.success('Justificatif téléchargé');

      // 🤖 AI OCR Scan - Smart Fill
      const extracted = await scanDocument(publicUrl, 'expense');
      if (extracted) {
        // Auto-fill amount if extracted and field is empty
        if (extracted.amount !== null && !montantHT) {
          // Calculate HT from TTC (assuming 20% TVA by default)
          const calculatedHT = extracted.amount / (1 + parseFloat(tvaPct) / 100);
          setMontantHT(calculatedHT.toFixed(2));
          toast.success(`🤖 Montant pré-rempli: ${extracted.amount.toLocaleString()} MAD TTC`, { duration: 4000 });
        }
        // Auto-fill description with supplier if empty
        if (extracted.supplier && !description) {
          setDescription(`Facture ${extracted.supplier}${extracted.bl_number ? ` - ${extracted.bl_number}` : ''}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    // Validate
    if (!description.trim()) {
      toast.error('Description requise');
      return;
    }
    if (!montantHT || parseFloat(montantHT) <= 0) {
      toast.error('Montant HT invalide');
      return;
    }
    if (!categorie) {
      toast.error('Catégorie requise');
      return;
    }
    
    // Block if interdiction detected
    if (blockedReason) {
      toast.error(blockedReason);
      return;
    }

    // If submitting (not draft), check receipt
    if (!asDraft && !receiptUrl) {
      toast.error('Justificatif obligatoire pour soumettre');
      return;
    }

    // Fuel protocol checks
    if (!asDraft && categorie === 'carburant') {
      if (!vehiculeId.trim()) {
        toast.error('ID Véhicule obligatoire pour le carburant');
        return;
      }
      if (!kilometrage || parseFloat(kilometrage) <= 0) {
        toast.error('Kilométrage obligatoire pour le carburant');
        return;
      }
    }

    // Off-hours justification check (Midnight Alert Protocol)
    if (!asDraft && isOffHoursMode) {
      if (!justificationUrgence.trim()) {
        toast.error('Justification d\'urgence obligatoire pour les transactions nocturnes');
        return;
      }
      if (justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH) {
        toast.error(`Justification trop courte (minimum ${MIN_JUSTIFICATION_LENGTH} caractères)`);
        return;
      }
    }

    // 🤖 AI Verification - Compare extracted data with user input (only on final submit)
    if (!asDraft && extractedData) {
      const verification = verifyAgainstUserData(extractedData, {
        amount: montantTTC,
      });

      // Block submission if critical mismatch detected
      if (verification.mismatches.some(m => m.severity === 'critical')) {
        toast.error(
          '🚫 SOUMISSION BLOQUÉE - Écart critique détecté entre le montant saisi et le document. Cette tentative a été enregistrée.',
          { duration: 8000 }
        );
        return;
      }

      // Warn but allow for non-critical mismatches  
      if (verification.mismatches.length > 0) {
        toast.warning(
          '⚠️ Écart détecté par l\'AI - Vérifiez le montant avant soumission',
          { duration: 5000 }
        );
      }
    }

    setSubmitting(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      // Determine approval level
      const calculatedLevel = montantTTC <= 2000 ? 'level_1' : montantTTC <= 20000 ? 'level_2' : 'level_3';

      const { error } = await supabase
        .from('expenses_controlled')
        .insert({
          description: description.trim(),
          montant_ht: parseFloat(montantHT),
          montant_ttc: montantTTC,
          tva_pct: parseFloat(tvaPct || '0'),
          categorie: categorie as Database['public']['Enums']['expense_category'],
          sous_categorie: sousCategorie || null,
          vehicule_id: categorie === 'carburant' ? vehiculeId : null,
          kilometrage: categorie === 'carburant' ? parseFloat(kilometrage) : null,
          receipt_photo_url: receiptUrl || null,
          requested_by: user?.id as string,
          requested_by_name: profile?.full_name || 'Utilisateur',
          // Include AI verification status and urgency justification in notes
          notes: (() => {
            const parts: string[] = [];
            // AI verification tag
            if (extractedData) {
              const aiTag = verificationResult?.isVerified 
                ? `[AI_VERIFIED: OK - ${extractedData.confidence}%]`
                : `[AI_VERIFIED: MISMATCH - ${extractedData.confidence}%]`;
              parts.push(aiTag);
            }
            // Off-hours justification
            if (isOffHoursMode && justificationUrgence.trim()) {
              parts.push(`[URGENCE: ${justificationUrgence.trim()}]`);
            }
            // User notes
            if (notes) parts.push(notes);
            return parts.length > 0 ? parts.join(' | ') : null;
          })(),
          statut: asDraft ? 'brouillon' : 'en_attente',
          approval_level: calculatedLevel as Database['public']['Enums']['expense_approval_level'],
        });

      if (error) throw error;

      toast.success(asDraft ? 'Brouillon enregistré' : 'Demande de dépense soumise');
      onSuccess();
    } catch (error: any) {
      console.error('Submit error:', error);
      
      // Parse specific error messages from database triggers
      const errorMessage = error.message || error.details || '';
      
      if (errorMessage.includes('LIMIT_EXCEEDED')) {
        // Extract the custom message from the trigger
        toast.error(
          <div className="space-y-1">
            <p className="font-semibold">🚫 Plafond mensuel de 15,000 MAD atteint</p>
            <p className="text-sm">Cette dépense nécessite désormais la validation de Karim.</p>
          </div>,
          { duration: 8000 }
        );
        // Refresh monthly cap status to update UI
        fetchMonthlyCapStatus();
      } else if (errorMessage.includes('EVIDENCE_REQUIRED')) {
        toast.error('Justificatif obligatoire!');
      } else if (errorMessage.includes('FUEL_PROTOCOL')) {
        toast.error('Données véhicule manquantes pour le carburant');
      } else {
        toast.error('Erreur lors de la soumission');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFuelCategory = categorie === 'carburant';
  const capPercentage = monthlyCapStatus 
    ? Math.min(100, (monthlyCapStatus.spent / monthlyCapStatus.cap) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Off-Hours Alert Banner (Midnight Protocol) */}
      {isOffHoursMode && (
        <Alert className="border-destructive bg-destructive/10">
          <Moon className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <div className="flex items-center gap-2">
              <span className="font-bold">🌙 MODE NUIT ACTIF</span>
              <Badge variant="destructive" className="text-[10px] animate-pulse">
                {currentCasablancaHour}h 🇲🇦
              </Badge>
            </div>
            <p className="text-xs mt-1">
              Transaction nocturne (18h-00h Casablanca). <strong>Justification d'urgence obligatoire.</strong>
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Monthly Cap Warning */}
      {monthlyCapStatus && monthlyCapStatus.exceeded && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>Plafond mensuel atteint!</strong> Les dépenses Level 1 nécessitent maintenant l'approbation du Superviseur.
          </AlertDescription>
        </Alert>
      )}

      {/* Monthly Cap Progress */}
      {monthlyCapStatus && approvalLevel === 'level_1' && (
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Dépenses Level 1 ce mois</span>
            <span className={cn(
              'font-mono font-semibold',
              capPercentage >= 90 ? 'text-destructive' : capPercentage >= 70 ? 'text-warning' : 'text-success'
            )}>
              {monthlyCapStatus.spent.toLocaleString()} / {monthlyCapStatus.cap.toLocaleString()} MAD
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full transition-all',
                capPercentage >= 90 ? 'bg-destructive' : capPercentage >= 70 ? 'bg-warning' : 'bg-success'
              )}
              style={{ width: `${capPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Blocked Reason Alert */}
      {blockedReason && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertDescription>{blockedReason}</AlertDescription>
        </Alert>
      )}

      {/* Receipt Upload - MANDATORY - Preuve Obligatoire */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <span className="font-semibold">Preuve Obligatoire</span>
          <Badge variant="destructive" className="text-[10px] animate-pulse">
            REQUIS
          </Badge>
        </Label>
        
        {receiptPreview ? (
          <div className="relative">
            <img 
              src={receiptPreview} 
              alt="Receipt" 
              className="w-full max-h-48 object-contain rounded-lg border-2 border-success bg-muted"
            />
            <Badge className="absolute top-2 right-2 bg-success gap-1">
              <CheckCircle className="h-3 w-3" />
              Preuve Validée
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2"
              onClick={() => {
                setReceiptUrl('');
                setReceiptPreview('');
              }}
            >
              Changer
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-destructive/50 rounded-lg cursor-pointer hover:border-destructive hover:bg-destructive/5 transition-all">
            <div className="flex flex-col items-center justify-center py-4">
              {uploadingReceipt ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <>
                  <div className="p-3 rounded-full bg-destructive/10 mb-2">
                    <Camera className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    📸 Photographier le justificatif
                  </p>
                  <p className="text-xs text-destructive mt-1 font-bold">
                    ⚠️ PREUVE OBLIGATOIRE - Soumission bloquée sans photo
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReceiptUpload}
              disabled={uploadingReceipt}
            />
          </label>
        )}
      </div>

      {/* AI Verification Panel */}
      {(extractedData || isScanning) && (
        <AIVerificationPanel
          isScanning={isScanning}
          extractedData={extractedData}
          verificationResult={verificationResult}
          onApplySuggestion={(field, value) => {
            if (field === 'amount' && typeof value === 'number') {
              // Calculate HT from extracted TTC
              const calculatedHT = value / (1 + parseFloat(tvaPct) / 100);
              setMontantHT(calculatedHT.toFixed(2));
            }
          }}
        />
      )}

      {/* Critical Mismatch Block Alert */}
      {hasCriticalMismatch && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>🚫 SOUMISSION BLOQUÉE</strong> - L'AI a détecté un écart critique entre le montant saisi ({montantTTC.toFixed(2)} MAD) 
            et le document ({extractedData?.amount?.toLocaleString()} MAD). Corrigez le montant ou contactez un superviseur.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Amount and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Montant HT (MAD) *</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={montantHT}
            onChange={(e) => setMontantHT(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>TVA %</Label>
          <Select value={tvaPct} onValueChange={setTvaPct}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (Exonéré)</SelectItem>
              <SelectItem value="7">7%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="14">14%</SelectItem>
              <SelectItem value="20">20%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TTC Display with Approval Level */}
      {montantTTC > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <span className="text-sm text-muted-foreground">Total TTC:</span>
            <span className="ml-2 text-lg font-bold font-mono">{montantTTC.toFixed(2)} MAD</span>
          </div>
          <Badge className={cn(approvalLabels[approvalLevel].color, 'bg-transparent border')}>
            {approvalLabels[approvalLevel].label}
          </Badge>
        </div>
      )}

      {/* Category */}
      <div className="space-y-2">
        <Label>Catégorie *</Label>
        <Select value={categorie} onValueChange={setCategorie}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fuel Protocol Fields */}
      {isFuelCategory && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <Fuel className="h-4 w-4" />
              Protocole Carburant
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Véhicule *</Label>
              <Input
                placeholder="ex: TOUPIE-01"
                value={vehiculeId}
                onChange={(e) => setVehiculeId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kilométrage *</Label>
              <Input
                type="number"
                placeholder="ex: 125430"
                value={kilometrage}
                onChange={(e) => setKilometrage(e.target.value)}
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          placeholder="Décrivez la dépense..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Off-Hours Justification - MANDATORY during 18h-00h */}
      {isOffHoursMode && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <Moon className="h-4 w-4" />
              Justification d'Urgence
              <Badge variant="destructive" className="text-[10px] animate-pulse">
                OBLIGATOIRE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Expliquez pourquoi vous travaillez après 18h. Cette information sera visible par le CEO.
            </p>
            <Textarea
              placeholder="Raison de cette transaction nocturne... (minimum 20 caractères)"
              value={justificationUrgence}
              onChange={(e) => setJustificationUrgence(e.target.value)}
              rows={3}
              className={cn(
                "border-destructive/50",
                justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH && "border-success"
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH 
                  ? "text-success" 
                  : "text-destructive"
              )}>
                {justificationUrgence.trim().length}/{MIN_JUSTIFICATION_LENGTH} caractères minimum
              </span>
              {justificationUrgence.trim().length >= MIN_JUSTIFICATION_LENGTH && (
                <Badge className="bg-success text-[10px] gap-1">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Validé
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes (optionnel)</Label>
        <Textarea
          placeholder="Informations supplémentaires..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => handleSubmit(true)} 
          disabled={submitting || !!blockedReason}
        >
          Sauvegarder Brouillon
        </Button>
        <Button 
          onClick={() => handleSubmit(false)} 
          disabled={
            submitting || 
            !receiptUrl || 
            !!blockedReason || 
            hasCriticalMismatch ||
            (isOffHoursMode && justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH)
          }
          className={cn(
            "gap-2",
            (isOffHoursMode && justificationUrgence.trim().length < MIN_JUSTIFICATION_LENGTH) && "opacity-50",
            hasCriticalMismatch && "opacity-50 cursor-not-allowed"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </>
          ) : verificationResult?.isVerified ? (
            <>
              <Bot className="h-4 w-4" />
              ✅ Soumettre (AI Vérifié)
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Soumettre
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
