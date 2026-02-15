import { useState, useRef } from 'react';
import { 
  Camera, FlaskConical, Check, Loader2, X, ChevronRight, Droplets,
  Eye, AlertTriangle, Shield, Mountain, Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';
import { hapticSuccess, hapticError, hapticTap } from '@/lib/haptics';
import { useI18n } from '@/i18n/I18nContext';

interface Stock { materiau: string; unite: string; quantite_actuelle: number; }
interface QualityStockEntryDialogProps { stocks: Stock[]; onRefresh?: () => void; }
type PhotoType = 'gravel' | 'humidity' | 'material' | 'bl';

export function QualityStockEntryDialog({ stocks, onRefresh }: QualityStockEntryDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<PhotoType | null>(null);

  const PHOTO_CONFIG: Record<PhotoType, { label: string; sublabel: string; icon: typeof Camera; mandatory: boolean }> = {
    gravel: { label: `${t.pages.stocks.gravel}`, sublabel: t.pages.stocks.gravelRequired, icon: Mountain, mandatory: true },
    humidity: { label: `${t.pages.stocks.humidity}`, sublabel: t.pages.stocks.humidityRequired, icon: Droplets, mandatory: true },
    material: { label: `${t.pages.stocks.truck}`, sublabel: t.pages.stocks.truck, icon: Truck, mandatory: false },
    bl: { label: 'BL', sublabel: t.pages.stocks.blNumber, icon: FlaskConical, mandatory: false },
  };

  const [photos, setPhotos] = useState<Record<PhotoType, { url: string | null; preview: string | null }>>({
    gravel: { url: null, preview: null }, humidity: { url: null, preview: null },
    material: { url: null, preview: null }, bl: { url: null, preview: null },
  });

  const [materiau, setMateriau] = useState('');
  const [quantite, setQuantite] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [numeroBl, setNumeroBl] = useState('');
  const [humiditePct, setHumiditePct] = useState('');
  const [qualiteVisuelle, setQualiteVisuelle] = useState<'conforme' | 'non_conforme' | 'reserve'>('conforme');
  const [notes, setNotes] = useState('');

  const fileInputRefs = {
    gravel: useRef<HTMLInputElement>(null), humidity: useRef<HTMLInputElement>(null),
    material: useRef<HTMLInputElement>(null), bl: useRef<HTMLInputElement>(null),
  };

  const resetForm = () => {
    setStep(1);
    setPhotos({ gravel: { url: null, preview: null }, humidity: { url: null, preview: null }, material: { url: null, preview: null }, bl: { url: null, preview: null } });
    setMateriau(''); setQuantite(''); setFournisseur(''); setNumeroBl(''); setHumiditePct(''); setQualiteVisuelle('conforme'); setNotes('');
  };

  const handleOpenChange = (isOpen: boolean) => { setOpen(isOpen); if (!isOpen) resetForm(); };

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>, type: PhotoType) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(type);
      hapticTap();
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPhotos(prev => ({ ...prev, [type]: { ...prev[type], preview: reader.result as string } })); };
      reader.readAsDataURL(compressedFile);
      const fileName = `quality_${type}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('documents').upload(`quality-checks/${fileName}`, compressedFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`quality-checks/${fileName}`);
      setPhotos(prev => ({ ...prev, [type]: { ...prev[type], url: urlData.publicUrl } }));
      hapticSuccess();
      toast.success(`${PHOTO_CONFIG[type].label} ${t.pages.stocks.photoCaptured}`);
    } catch (error) {
      console.error('Error uploading photo:', error);
      hapticError();
      toast.error(t.pages.stocks.uploadError);
    } finally { setUploadingPhoto(null); }
  };

  const mandatoryPhotosReady = photos.gravel.url && photos.humidity.url;

  const handleProceedToStep2 = () => {
    if (!mandatoryPhotosReady) { hapticError(); toast.error(t.pages.stocks.mandatoryPhotosError); return; }
    hapticTap(); setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandatoryPhotosReady) { hapticError(); toast.error(t.pages.stocks.mandatoryPhotosError); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_quality_stock_entry', {
        p_materiau: materiau, p_quantite: parseFloat(quantite), p_fournisseur: fournisseur, p_numero_bl: numeroBl,
        p_photo_materiel_url: photos.material.url || photos.gravel.url, p_photo_bl_url: photos.bl.url || null,
        p_photo_gravel_url: photos.gravel.url, p_photo_humidity_url: photos.humidity.url,
        p_humidite_pct: humiditePct ? parseFloat(humiditePct) : null, p_qualite_visuelle: qualiteVisuelle, p_notes: notes || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) { hapticError(); toast.error(result.error || t.pages.stocks.creationError); return; }
      hapticSuccess();
      toast.success(result.message || t.pages.stocks.qualityValidated);
      handleOpenChange(false); onRefresh?.();
    } catch (error) {
      console.error('Error creating quality entry:', error);
      hapticError(); toast.error(t.pages.stocks.saveError);
    } finally { setSubmitting(false); }
  };

  const selectedStock = stocks.find((s) => s.materiau === materiau);

  const renderPhotoZone = (type: PhotoType) => {
    const config = PHOTO_CONFIG[type];
    const photo = photos[type];
    const Icon = config.icon;
    const isUploading = uploadingPhoto === type;
    return (
      <div key={type} className="space-y-2">
        <input ref={fileInputRefs[type]} type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoCapture(e, type)} className="hidden" />
        {isUploading ? (
          <div className="h-32 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">{t.pages.stocks.processing}</span>
          </div>
        ) : photo.preview ? (
          <div className="relative rounded-xl border-2 border-success/50 overflow-hidden">
            <img src={photo.preview} alt={config.label} className="w-full h-28 object-cover" />
            <Button type="button" size="icon" variant="secondary" className="absolute top-1 right-1 h-7 w-7" onClick={() => setPhotos(prev => ({ ...prev, [type]: { url: null, preview: null } }))}>
              <X className="h-3 w-3" />
            </Button>
            <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-success/90 text-white px-2 py-0.5 rounded text-[10px] font-medium">
              <Check className="h-3 w-3" />{config.label}
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRefs[type].current?.click()} className={cn('w-full h-28 rounded-xl border-2 border-dashed transition-all', 'flex flex-col items-center justify-center gap-1.5', config.mandatory ? 'border-destructive/50 bg-destructive/5 hover:border-destructive hover:bg-destructive/10' : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5')}>
            <Icon className={cn('h-6 w-6', config.mandatory ? 'text-destructive' : 'text-muted-foreground')} />
            <span className="text-xs font-medium">{config.label}</span>
            <span className="text-[10px] text-muted-foreground">{config.sublabel}</span>
            {config.mandatory && (<Badge variant="destructive" className="text-[9px] h-4 animate-pulse">{t.pages.stocks.required}</Badge>)}
          </button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 min-h-[44px] border-primary/50 text-primary hover:bg-primary/10" onClick={() => hapticTap()}>
          <FlaskConical className="h-4 w-4" />
          <span className="hidden sm:inline">{t.pages.stocks.qualityControl}</span>
          <span className="sm:hidden">{t.pages.stocks.quality}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary" />{t.pages.stocks.qualityReceptionControl}</DialogTitle>
          <DialogDescription className="text-xs">{t.pages.stocks.doubleLockStep1}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-2">
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all', step === 1 ? 'bg-primary text-primary-foreground' : 'bg-success/20 text-success')}>
            {step > 1 ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span>1. {t.pages.stocks.photos}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all', step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            <FlaskConical className="h-3 w-3" /><span>2. {t.pages.stocks.data}</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-full">
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-500">{t.pages.stocks.mandatoryPhotoEvidence}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide">{t.pages.stocks.mandatoryPhotos}</p>
              <div className="grid grid-cols-2 gap-3">{renderPhotoZone('gravel')}{renderPhotoZone('humidity')}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t.pages.stocks.optionalPhotos}</p>
              <div className="grid grid-cols-2 gap-3">{renderPhotoZone('material')}{renderPhotoZone('bl')}</div>
            </div>
            <div className={cn('p-3 rounded-lg border flex items-center gap-2', mandatoryPhotosReady ? 'bg-success/10 border-success/30' : 'bg-destructive/5 border-destructive/30')}>
              {mandatoryPhotosReady ? (
                <><Check className="h-4 w-4 text-success" /><span className="text-sm font-medium text-success">{t.pages.stocks.mandatoryPhotosComplete}</span></>
              ) : (
                <><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive">
                  {!photos.gravel.url && !photos.humidity.url ? t.pages.stocks.gravelHumidityRequired : !photos.gravel.url ? t.pages.stocks.gravelRequired : t.pages.stocks.humidityRequired}
                </span></>
              )}
            </div>
            <Button className="w-full min-h-[56px] gap-2" onClick={handleProceedToStep2} disabled={!mandatoryPhotosReady}>
              <ChevronRight className="h-5 w-5" />{t.pages.stocks.continueToQualityData}
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(Object.entries(photos) as [PhotoType, { url: string | null; preview: string | null }][]).filter(([, p]) => p.preview).map(([type, p]) => (
                <div key={type} className="flex-shrink-0 relative rounded-lg border border-success/30 overflow-hidden">
                  <img src={p.preview!} alt={type} className="h-12 w-12 object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5">{PHOTO_CONFIG[type].label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>{t.pages.stocks.material}</Label>
              <Select value={materiau} onValueChange={setMateriau} required>
                <SelectTrigger className="min-h-[48px]"><SelectValue placeholder={t.pages.stocks.selectMaterial} /></SelectTrigger>
                <SelectContent>{stocks.map((s) => (<SelectItem key={s.materiau} value={s.materiau}>{s.materiau} ({s.unite})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.pages.stocks.quantity} {selectedStock ? `(${selectedStock.unite})` : ''}</Label>
                <Input type="number" inputMode="decimal" step="0.01" min="0" placeholder="0" value={quantite} onChange={(e) => setQuantite(e.target.value)} required className="min-h-[48px]" />
              </div>
              <div className="space-y-2">
                <Label>{t.pages.stocks.blNumber}</Label>
                <Input placeholder="BL-2024-001" value={numeroBl} onChange={(e) => setNumeroBl(e.target.value)} required className="min-h-[48px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.pages.stocks.supplier}</Label>
              <Input placeholder={t.pages.stocks.supplierName} value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} required className="min-h-[48px]" />
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" />{t.pages.stocks.qualityTests}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Droplets className="h-3 w-3" />{t.pages.stocks.humidityPct}</Label>
                  <Input type="number" inputMode="decimal" step="0.1" min="0" max="100" placeholder="Ex: 5.2" value={humiditePct} onChange={(e) => setHumiditePct(e.target.value)} className="min-h-[48px]" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Eye className="h-3 w-3" />{t.pages.stocks.visualAspect}</Label>
                  <Select value={qualiteVisuelle} onValueChange={(v) => setQualiteVisuelle(v as 'conforme' | 'non_conforme' | 'reserve')}>
                    <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conforme"><span className="flex items-center gap-2"><Check className="h-3 w-3 text-success" />{t.pages.stocks.compliant}</span></SelectItem>
                      <SelectItem value="reserve"><span className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-warning" />{t.pages.stocks.withReserve}</span></SelectItem>
                      <SelectItem value="non_conforme"><span className="flex items-center gap-2"><X className="h-3 w-3 text-destructive" />{t.pages.stocks.nonCompliant}</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.pages.stocks.qualityNotes}</Label>
              <Textarea placeholder={t.pages.stocks.observations} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            {qualiteVisuelle === 'non_conforme' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{t.pages.stocks.nonCompliantWarning}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 min-h-[48px]" onClick={() => setStep(1)}>{t.pages.stocks.back}</Button>
              <Button type="submit" disabled={submitting} className="flex-1 min-h-[48px] gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t.pages.stocks.submitQuality}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
