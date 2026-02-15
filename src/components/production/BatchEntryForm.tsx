import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Loader2,
  ImagePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';
import { useI18n } from '@/i18n/I18nContext';

interface FormuleData {
  ciment_kg_m3: number;
  sable_m3: number | null;
  gravette_m3: number | null;
  eau_l_m3: number;
  adjuvant_l_m3: number | null;
}

interface BatchEntryFormProps {
  blId: string;
  volume: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface VarianceInfo {
  field: string;
  label: string;
  theo: number;
  reel: number;
  percent: number;
  status: 'ok' | 'warning' | 'critical';
}

const SABLE_DENSITY = 1600;
const GRAVETTE_DENSITY = 1500;

export function BatchEntryForm({ blId, volume, onSuccess, onCancel }: BatchEntryFormProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const be = t.batchEntry;
  
  const [formule, setFormule] = useState<FormuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [batchNumber, setBatchNumber] = useState(1);
  
  const [cimentReel, setCimentReel] = useState<string>('');
  const [sableReel, setSableReel] = useState<string>('');
  const [gravetteReel, setGravetteReel] = useState<string>('');
  const [eauReel, setEauReel] = useState<string>('');
  const [adjuvantReel, setAdjuvantReel] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  
  const [variances, setVariances] = useState<VarianceInfo[]>([]);

  useEffect(() => {
    fetchFormuleAndBatchCount();
  }, [blId]);

  const fetchFormuleAndBatchCount = async () => {
    try {
      const { data: bl, error: blError } = await supabase
        .from('bons_livraison_reels')
        .select('formule_id')
        .eq('bl_id', blId)
        .single();

      if (blError) throw blError;

      const { data: formuleData, error: formuleError } = await supabase
        .from('formules_theoriques')
        .select('ciment_kg_m3, sable_m3, gravette_m3, eau_l_m3, adjuvant_l_m3')
        .eq('formule_id', bl.formule_id)
        .single();

      if (formuleError) throw formuleError;
      setFormule(formuleData);

      const { count } = await supabase
        .from('production_batches')
        .select('*', { count: 'exact', head: true })
        .eq('bl_id', blId);

      setBatchNumber((count || 0) + 1);
    } catch (error) {
      console.error('Error fetching formule:', error);
      toast.error(be.loadingError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!formule) return;

    const newVariances: VarianceInfo[] = [];
    
    const theoValues = {
      ciment: formule.ciment_kg_m3 * volume,
      sable: formule.sable_m3 ? formule.sable_m3 * volume * SABLE_DENSITY : null,
      gravette: formule.gravette_m3 ? formule.gravette_m3 * volume * GRAVETTE_DENSITY : null,
      eau: formule.eau_l_m3 * volume,
      adjuvant: formule.adjuvant_l_m3 ? formule.adjuvant_l_m3 * volume : null,
    };

    const addVariance = (
      field: string,
      label: string,
      theo: number | null,
      reelStr: string
    ) => {
      if (theo === null || theo === 0) return;
      const reel = parseFloat(reelStr) || 0;
      if (reel === 0) return;
      
      const percent = Math.abs((reel - theo) / theo) * 100;
      const status: 'ok' | 'warning' | 'critical' = 
        percent > 5 ? 'critical' : 
        percent > 2 ? 'warning' : 
        'ok';
      
      newVariances.push({ field, label, theo, reel, percent, status });
    };

    addVariance('ciment', be.cement, theoValues.ciment, cimentReel);
    addVariance('sable', be.sand, theoValues.sable, sableReel);
    addVariance('gravette', be.gravel, theoValues.gravette, gravetteReel);
    addVariance('eau', be.water, theoValues.eau, eauReel);
    addVariance('adjuvant', be.adjuvant, theoValues.adjuvant, adjuvantReel);

    setVariances(newVariances);
  }, [formule, volume, cimentReel, sableReel, gravetteReel, eauReel, adjuvantReel]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressedFile = await compressImage(file, { maxWidth: 1920, quality: 0.8 });
      
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(compressedFile);

      const fileName = `${blId}-batch${batchNumber}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('plant-photos')
        .upload(fileName, compressedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(data.path);

      setPhotoUrl(urlData.publicUrl);
      toast.success(be.photoUploaded);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(be.uploadError);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!formule) return;

    if (!cimentReel || !eauReel) {
      toast.error(be.cementWaterRequired);
      return;
    }

    if (!photoUrl) {
      toast.error(be.photoRequired);
      return;
    }

    setSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      const theoValues = {
        ciment: formule.ciment_kg_m3 * volume,
        sable: formule.sable_m3 ? formule.sable_m3 * volume * SABLE_DENSITY : null,
        gravette: formule.gravette_m3 ? formule.gravette_m3 * volume * GRAVETTE_DENSITY : null,
        eau: formule.eau_l_m3 * volume,
        adjuvant: formule.adjuvant_l_m3 ? formule.adjuvant_l_m3 * volume : null,
      };

      const { error } = await supabase
        .from('production_batches')
        .insert({
          bl_id: blId,
          batch_number: batchNumber,
          ciment_theo_kg: theoValues.ciment,
          sable_theo_kg: theoValues.sable,
          gravette_theo_kg: theoValues.gravette,
          eau_theo_l: theoValues.eau,
          adjuvant_theo_l: theoValues.adjuvant,
          ciment_reel_kg: parseFloat(cimentReel),
          sable_reel_kg: sableReel ? parseFloat(sableReel) : null,
          gravette_reel_kg: gravetteReel ? parseFloat(gravetteReel) : null,
          eau_reel_l: parseFloat(eauReel),
          adjuvant_reel_l: adjuvantReel ? parseFloat(adjuvantReel) : null,
          photo_pupitre_url: photoUrl,
          entered_by: user?.id,
          entered_by_name: profile?.full_name || 'Opérateur',
          notes: notes || null,
        });

      if (error) throw error;

      toast.success(be.batchSaved);
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(be.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const hasCriticalVariance = variances.some(v => v.status === 'critical');
  const hasWarningVariance = variances.some(v => v.status === 'warning');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formule) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{be.formulaNotFound}</AlertDescription>
      </Alert>
    );
  }

  const theoDisplay = {
    ciment: (formule.ciment_kg_m3 * volume).toFixed(1),
    sable: formule.sable_m3 ? (formule.sable_m3 * volume * SABLE_DENSITY).toFixed(1) : null,
    gravette: formule.gravette_m3 ? (formule.gravette_m3 * volume * GRAVETTE_DENSITY).toFixed(1) : null,
    eau: (formule.eau_l_m3 * volume).toFixed(1),
    adjuvant: formule.adjuvant_l_m3 ? (formule.adjuvant_l_m3 * volume).toFixed(1) : null,
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div>
          <span className="text-sm text-muted-foreground">{be.volume}:</span>
          <span className="ml-2 font-mono font-bold">{volume} m³</span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <span className="text-sm text-muted-foreground">{be.batch}:</span>
          <Badge variant="outline" className="ml-2">#{batchNumber}</Badge>
        </div>
      </div>

      {/* Photo Upload - MANDATORY */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {be.controlPhoto} <span className="text-destructive">*</span>
        </Label>
        
        {photoPreview ? (
          <div className="relative">
            <img 
              src={photoPreview} 
              alt={be.controlPhoto} 
              className="w-full h-48 object-cover rounded-lg border"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <Badge className="bg-success text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                {be.uploaded}
              </Badge>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2"
              onClick={() => {
                setPhotoUrl('');
                setPhotoPreview('');
              }}
            >
              {be.change}
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex flex-col items-center justify-center py-6">
              {uploadingPhoto ? (
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {be.clickToTakePhoto}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {be.photoMandatory} <strong>{be.mandatory}</strong>
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
          </label>
        )}
      </div>

      <Separator />

      {/* Weight Entry Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Ciment */}
        <div className="space-y-2">
          <Label className="flex items-center justify-between">
            <span>{be.cement} (kg) <span className="text-destructive">*</span></span>
            <span className="text-xs text-muted-foreground font-mono">
              {be.theoretical}: {theoDisplay.ciment}
            </span>
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder={be.realWeight}
            value={cimentReel}
            onChange={(e) => setCimentReel(e.target.value)}
            className={cn(
              'font-mono',
              variances.find(v => v.field === 'ciment')?.status === 'critical' && 'border-destructive bg-destructive/5',
              variances.find(v => v.field === 'ciment')?.status === 'warning' && 'border-warning bg-warning/5'
            )}
          />
        </div>

        {/* Eau */}
        <div className="space-y-2">
          <Label className="flex items-center justify-between">
            <span>{be.water} (L) <span className="text-destructive">*</span></span>
            <span className="text-xs text-muted-foreground font-mono">
              {be.theoretical}: {theoDisplay.eau}
            </span>
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder={be.realVolume}
            value={eauReel}
            onChange={(e) => setEauReel(e.target.value)}
            className={cn(
              'font-mono',
              variances.find(v => v.field === 'eau')?.status === 'critical' && 'border-destructive bg-destructive/5',
              variances.find(v => v.field === 'eau')?.status === 'warning' && 'border-warning bg-warning/5'
            )}
          />
        </div>

        {/* Sable */}
        {theoDisplay.sable && (
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{be.sand} (kg)</span>
              <span className="text-xs text-muted-foreground font-mono">
                {be.theoretical}: {theoDisplay.sable}
              </span>
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder={be.realWeight}
              value={sableReel}
              onChange={(e) => setSableReel(e.target.value)}
              className={cn(
                'font-mono',
                variances.find(v => v.field === 'sable')?.status === 'critical' && 'border-destructive bg-destructive/5',
                variances.find(v => v.field === 'sable')?.status === 'warning' && 'border-warning bg-warning/5'
              )}
            />
          </div>
        )}

        {/* Gravette */}
        {theoDisplay.gravette && (
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{be.gravel} (kg)</span>
              <span className="text-xs text-muted-foreground font-mono">
                {be.theoretical}: {theoDisplay.gravette}
              </span>
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder={be.realWeight}
              value={gravetteReel}
              onChange={(e) => setGravetteReel(e.target.value)}
              className={cn(
                'font-mono',
                variances.find(v => v.field === 'gravette')?.status === 'critical' && 'border-destructive bg-destructive/5',
                variances.find(v => v.field === 'gravette')?.status === 'warning' && 'border-warning bg-warning/5'
              )}
            />
          </div>
        )}

        {/* Adjuvant */}
        {theoDisplay.adjuvant && (
          <div className="space-y-2 col-span-2">
            <Label className="flex items-center justify-between">
              <span>{be.adjuvant} (L)</span>
              <span className="text-xs text-muted-foreground font-mono">
                {be.theoretical}: {theoDisplay.adjuvant}
              </span>
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder={be.realVolume}
              value={adjuvantReel}
              onChange={(e) => setAdjuvantReel(e.target.value)}
              className={cn(
                'font-mono',
                variances.find(v => v.field === 'adjuvant')?.status === 'critical' && 'border-destructive bg-destructive/5',
                variances.find(v => v.field === 'adjuvant')?.status === 'warning' && 'border-warning bg-warning/5'
              )}
            />
          </div>
        )}
      </div>

      {/* Variance Alerts */}
      {variances.length > 0 && (hasCriticalVariance || hasWarningVariance) && (
        <Alert variant={hasCriticalVariance ? 'destructive' : 'default'} className={!hasCriticalVariance ? 'border-warning bg-warning/10' : ''}>
          <div className="flex items-start gap-2">
            {hasCriticalVariance ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
            <div className="space-y-1">
              <AlertDescription className="font-medium">
                {hasCriticalVariance ? be.criticalVariances : be.warningVariances}
              </AlertDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {variances.filter(v => v.status !== 'ok').map((v) => (
                  <Badge 
                    key={v.field} 
                    variant="outline"
                    className={cn(
                      v.status === 'critical' ? 'border-destructive text-destructive' : 'border-warning text-warning'
                    )}
                  >
                    {v.label}: {v.percent.toFixed(1)}%
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label>{be.notesOptional}</Label>
        <Textarea
          placeholder={be.observations}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          {be.cancel}
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={submitting || !photoUrl || !cimentReel || !eauReel}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {be.saving}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              {be.saveBatch}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}