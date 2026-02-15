import { useState, useRef, useEffect } from 'react';
import { Camera, Package, Check, Loader2, X, ChevronRight, Lock, Shield, Truck, Bot, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';
import { hapticSuccess, hapticError, hapticTap } from '@/lib/haptics';
import { CaptureRealityZone } from '@/components/ui/VaultWizard';
import { TacticalSwitch } from '@/components/ui/TacticalSwitch';
import { VaultSubmitButton } from '@/components/ui/VaultSubmitButton';
import { AIVerifiedBadge } from '@/components/ui/AIVerifiedBadge';
import { AIVerificationPanel } from '@/components/ui/AIVerificationPanel';
import { useAIDocumentVerification } from '@/hooks/useAIDocumentVerification';
import { useI18n } from '@/i18n/I18nContext';

interface Stock { materiau: string; unite: string; quantite_actuelle: number; }
interface TwoStepReceptionWizardProps { stocks: Stock[]; onRefresh?: () => void; }

const MATERIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Ciment': Shield, 'Sable': Package, 'Gravette': Truck,
};

export function TwoStepReceptionWizard({ stocks, onRefresh }: TwoStepReceptionWizardProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { isScanning, extractedData, verificationResult, scanDocument, verifyAgainstUserData, hasCriticalMismatch, reset: resetAI } = useAIDocumentVerification();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => { setStep(1); setPhotoUrl(null); setPhotoPreview(null); setMateriau(''); setQuantite(''); setFournisseur(''); setNumeroBl(''); setNotes(''); resetAI(); };
  const handleOpenChange = (isOpen: boolean) => { setOpen(isOpen); if (!isOpen) resetForm(); };

  const handlePhotoCapture = async (file: File) => {
    try {
      setUploadingPhoto(true); hapticTap();
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPhotoPreview(reader.result as string); };
      reader.readAsDataURL(compressedFile);
      const fileName = `reception_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('documents').upload(`receptions/${fileName}`, compressedFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`receptions/${fileName}`);
      const publicUrl = urlData.publicUrl;
      setPhotoUrl(publicUrl); hapticSuccess();
      const extracted = await scanDocument(publicUrl, 'stock');
      if (extracted) {
        if (extracted.supplier) setFournisseur(extracted.supplier);
        if (extracted.bl_number) setNumeroBl(extracted.bl_number);
        toast.success(t.pages.stocks.aiPrefilled, { duration: 3000 });
      }
      setTimeout(() => { setStep(2); }, 800);
    } catch (error) {
      console.error('Error uploading photo:', error); hapticError();
      toast.error(t.pages.stocks.uploadError);
    } finally { setUploadingPhoto(false); }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!photoUrl) { hapticError(); toast.error(t.pages.stocks.blPhotoMandatory); throw new Error('Missing photo'); }
    if (extractedData) {
      const verification = verifyAgainstUserData(extractedData, { supplier: fournisseur, bl_number: numeroBl });
      if (verification.mismatches.some(m => m.severity === 'critical')) {
        hapticError(); toast.error(t.pages.stocks.submissionBlocked, { duration: 8000 });
        throw new Error('AI verification failed - critical mismatch');
      }
      if (verification.mismatches.length > 0) {
        toast.warning(t.pages.stocks.aiMismatchWarning, { duration: 5000 });
      }
    }
    setSubmitting(true);
    try {
      const aiVerificationNote = extractedData ? `[AI_VERIFIED: ${verificationResult?.isVerified ? 'OK' : 'MISMATCH'} - Confiance: ${extractedData.confidence}%]` : '[AI_NOT_SCANNED]';
      const finalNotes = notes ? `${aiVerificationNote} | ${notes}` : aiVerificationNote;
      const { data, error } = await supabase.rpc('secure_add_reception', { p_materiau: materiau, p_quantite: parseFloat(quantite), p_fournisseur: fournisseur, p_numero_bl: numeroBl, p_photo_bl_url: photoUrl, p_notes: finalNotes });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) { hapticError(); toast.error(result.error || t.pages.stocks.receptionError); throw new Error(result.error); }
      hapticSuccess();
      const verifiedText = verificationResult?.isVerified ? ` ✅ ${t.pages.stocks.aiVerified}` : '';
      toast.success(`${result.message || t.pages.stocks.securedSuccess}${verifiedText}`);
      setTimeout(() => { handleOpenChange(false); onRefresh?.(); }, 1500);
    } catch (error) { console.error('Error adding reception:', error); hapticError(); throw error; } finally { setSubmitting(false); }
  };

  const selectedStock = stocks.find((s) => s.materiau === materiau);
  const materialOptions = stocks.map(s => ({ value: s.materiau, label: s.materiau, icon: MATERIAL_ICONS[s.materiau] || Package }));
  const isStep1Complete = !!photoUrl;
  const isStep2Complete = !!materiau;
  const isStep3Complete = !!quantite && parseFloat(quantite) > 0;
  const isStep4Complete = !!fournisseur && !!numeroBl;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="gap-2 min-h-[44px] btn-premium-primary" onClick={() => hapticTap()}>
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">{t.pages.stocks.newReception}</span>
            <span className="sm:hidden">{t.pages.stocks.reception}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 bg-background border-primary/20">
          <div className="p-6 border-b border-border/30 bg-gradient-to-r from-background to-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30"><Shield className="h-5 w-5 text-primary" /></div>
                <div>
                  <span className="text-foreground">{t.pages.stocks.vaultReception}</span>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">{t.pages.stocks.secureProtocol}</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between mt-6">
              {[
                { step: 1, label: t.pages.stocks.proof, complete: isStep1Complete },
                { step: 2, label: t.pages.stocks.what, complete: isStep2Complete },
                { step: 3, label: t.pages.stocks.howMuch, complete: isStep3Complete },
                { step: 4, label: t.pages.stocks.who, complete: isStep4Complete },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', 'transition-all duration-500 border-2',
                    s.complete ? ['bg-gradient-to-br from-primary to-primary/80', 'border-primary', 'shadow-[0_0_20px_hsl(var(--primary)/0.4)]'] :
                    step === s.step ? ['bg-transparent border-primary', 'shadow-[0_0_15px_hsl(var(--primary)/0.2)]'] : ['bg-transparent border-border/40']
                  )}>
                    {s.complete ? <Check className="h-5 w-5 text-primary-foreground" /> : step === s.step ? <span className="text-sm font-bold text-primary">{s.step}</span> : <Lock className="h-4 w-4 text-muted-foreground/50" />}
                  </div>
                  {i < 3 && <div className={cn('w-6 h-0.5 mx-1 transition-all duration-500', s.complete ? 'bg-primary' : 'bg-border/30')} />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 min-h-[350px] flex flex-col">
            {step === 1 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{t.pages.stocks.proofQuestion}</h2>
                  <p className="text-sm text-muted-foreground">{t.pages.stocks.captureSupplierBL}</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <CaptureRealityZone photoUrl={photoUrl} photoPreview={photoPreview} onCapture={handlePhotoCapture} uploading={uploadingPhoto} label={t.pages.stocks.scanBL} sublabel={t.pages.stocks.photoMandatory} className="w-full" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{t.pages.stocks.what}</h2>
                  <p className="text-sm text-muted-foreground">{t.pages.stocks.selectReceivedMaterial}</p>
                </div>
                <div className="flex-1 flex items-center">
                  <TacticalSwitch options={materialOptions} value={materiau} onChange={(val) => { setMateriau(val); setTimeout(() => setStep(3), 400); }} className="w-full" />
                </div>
                {photoPreview && (
                  <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-primary/5 border border-primary/20">
                    <img src={photoPreview} alt="BL" className="h-10 w-10 rounded object-cover" />
                    <div className="flex-1"><p className="text-xs font-semibold text-primary">{t.pages.stocks.proofCaptured}</p></div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{t.pages.stocks.howMuch}</h2>
                  <p className="text-sm text-muted-foreground">{t.pages.stocks.quantityOf} {materiau} {t.pages.stocks.received}</p>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="relative">
                    <Input type="number" inputMode="decimal" step="0.01" min="0" placeholder="0" value={quantite} onChange={(e) => setQuantite(e.target.value)}
                      className={cn('h-20 text-4xl text-center font-bold rounded-xl', 'bg-transparent border-2', quantite ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]' : 'border-border/50')} />
                    {selectedStock && (<span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-semibold">{selectedStock.unite}</span>)}
                  </div>
                  {selectedStock && quantite && (
                    <div className="p-4 rounded-xl border border-border/30 bg-muted/10">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">{t.pages.stocks.currentStockLabel}</span>
                        <span className="font-mono font-bold">{selectedStock.quantite_actuelle.toLocaleString()} {selectedStock.unite}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t.pages.stocks.afterReception}</span>
                        <span className="font-mono font-bold text-primary">{(selectedStock.quantite_actuelle + parseFloat(quantite || '0')).toLocaleString()} {selectedStock.unite}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-none">{t.pages.stocks.back}</Button>
                  <Button onClick={() => setStep(4)} disabled={!isStep3Complete} className={cn('flex-1 gap-2', isStep3Complete && 'btn-premium-primary')}>
                    {t.pages.stocks.continue}<ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex-1 flex flex-col animate-fade-in-up">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{t.pages.stocks.who}</h2>
                  <p className="text-sm text-muted-foreground">{t.pages.stocks.supplierInfo}</p>
                </div>
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.pages.stocks.supplier}</Label>
                    <Input placeholder={t.pages.stocks.supplierName} value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} className="min-h-[52px] text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.pages.stocks.deliveryNoteNumber}</Label>
                    <Input placeholder="BL-2024-001" value={numeroBl} onChange={(e) => setNumeroBl(e.target.value)} className="min-h-[52px] text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t.pages.stocks.notesOptional}</Label>
                    <Textarea placeholder={t.pages.stocks.remarks} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  </div>
                </div>

                {(extractedData || isScanning) && (
                  <AIVerificationPanel isScanning={isScanning} extractedData={extractedData} verificationResult={verificationResult}
                    onApplySuggestion={(field, value) => { if (field === 'supplier') setFournisseur(String(value)); if (field === 'bl_number') setNumeroBl(String(value)); }} className="mb-4" />
                )}

                {hasCriticalMismatch && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription><strong>{t.pages.stocks.aiBlockedWarning}</strong></AlertDescription>
                  </Alert>
                )}

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-4 mt-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t.pages.stocks.material}:</span>
                    <span className="font-semibold text-foreground">{materiau}</span>
                    <span className="text-muted-foreground">{t.pages.stocks.quantity}:</span>
                    <span className="font-semibold text-primary">{quantite} {selectedStock?.unite}</span>
                    {verificationResult && (
                      <>
                        <span className="text-muted-foreground">{t.pages.stocks.aiStatusLabel}</span>
                        <AIVerifiedBadge status={hasCriticalMismatch ? 'blocked' : verificationResult.mismatches.length > 0 ? 'mismatch' : verificationResult.isVerified ? 'verified' : 'pending'} confidence={extractedData?.confidence} compact />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(3)} className="flex-none">{t.pages.stocks.back}</Button>
                  <div className="flex-1">
                    <VaultSubmitButton onClick={handleSubmit} disabled={!isStep4Complete || submitting || hasCriticalMismatch}>
                      {verificationResult?.isVerified ? t.pages.stocks.secureAIVerified : t.pages.stocks.secureReception}
                    </VaultSubmitButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
