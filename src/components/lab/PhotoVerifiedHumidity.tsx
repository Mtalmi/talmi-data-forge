import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Droplets, 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Clock,
  Calculator,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { compressImage } from '@/lib/imageCompression';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface PhotoVerifiedHumidityProps {
  type: 'reception' | 'quotidien';
  receptionId?: string;
  onSubmit?: (data: HumidityData) => void;
  trigger?: React.ReactNode;
}

interface HumidityData {
  taux_humidite_pct: number;
  correction_eau_l_m3: number;
  photo_url: string;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

export function PhotoVerifiedHumidity({ type, receptionId, onSubmit, trigger }: PhotoVerifiedHumidityProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const ph = t.photoHumidity;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [tauxHumidite, setTauxHumidite] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [notes, setNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate water correction in real-time
  const humidityValue = parseFloat(tauxHumidite) || 0;
  const standardHumidity = 3.0;
  const excessHumidity = Math.max(0, humidityValue - standardHumidity);
  const waterCorrection = (excessHumidity / 100) * 0.4 * 1600;

  // Get geolocation on mount
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, [open]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      
      const compressedFile = await compressImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
      
      const fileName = `humidity_${type}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('qc-photos')
        .upload(`humidity/${fileName}`, compressedFile);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('qc-photos')
        .getPublicUrl(`humidity/${fileName}`);
      
      setPhotoUrl(urlData.publicUrl);
      toast.success(ph.uploadSuccess);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(ph.uploadError);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photoUrl) {
      toast.error(ph.photoRequired);
      return;
    }
    
    if (!tauxHumidite || humidityValue < 0 || humidityValue > 100) {
      toast.error(ph.invalidRate);
      return;
    }
    
    setSubmitting(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      const { error } = await supabase
        .from('controles_humidite')
        .insert({
          type_controle: type,
          materiau: 'Sable',
          taux_humidite_pct: humidityValue,
          taux_standard_pct: standardHumidity,
          photo_url: photoUrl,
          photo_timestamp: new Date().toISOString(),
          photo_latitude: geoLocation?.latitude || null,
          photo_longitude: geoLocation?.longitude || null,
          verified_by: user?.id,
          verified_by_name: profile?.full_name || user?.email,
          reception_id: receptionId || null,
          notes: notes || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success(ph.savedSuccess);
      
      if (onSubmit) {
        onSubmit({
          taux_humidite_pct: humidityValue,
          correction_eau_l_m3: waterCorrection,
          photo_url: photoUrl
        });
      }
      
      setTauxHumidite('');
      setPhotoUrl(null);
      setPhotoPreview(null);
      setNotes('');
      setOpen(false);
    } catch (error) {
      console.error('Error saving humidity control:', error);
      toast.error(ph.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 min-h-[44px]">
            <Droplets className="h-4 w-4" />
            {ph.triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            {ph.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-warning">
            <Camera className="h-4 w-4" />
            {ph.photoMandatory}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="form-label-industrial">
              {ph.humidityRate}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="Ex: 8.5"
              value={tauxHumidite}
              onChange={(e) => setTauxHumidite(e.target.value)}
              required
              className="min-h-[48px] text-lg font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {ph.standard}: {standardHumidity}% | {ph.current}: {humidityValue}%
            </p>
          </div>

          {humidityValue > 0 && (
            <Card className={cn(
              'border-2',
              excessHumidity > 0 ? 'border-warning bg-warning/10' : 'border-success bg-success/10'
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {ph.autoWaterCorrection}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{ph.humidityGap}:</span>
                  <span className={cn(
                    'font-mono font-bold',
                    excessHumidity > 0 ? 'text-warning' : 'text-success'
                  )}>
                    {excessHumidity > 0 ? '+' : ''}{excessHumidity.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{ph.waterCorrectionPerM3}:</span>
                  <span className={cn(
                    'font-mono font-bold text-lg',
                    waterCorrection > 0 ? 'text-destructive' : 'text-success'
                  )}>
                    {waterCorrection > 0 ? '-' : ''}{waterCorrection.toFixed(1)} L
                  </span>
                </div>
                {waterCorrection > 0 && (
                  <p className="text-xs text-warning mt-2 p-2 bg-warning/20 rounded">
                    ⚠️ {ph.centralWarning.replace('{value}', waterCorrection.toFixed(1))}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label className="form-label-industrial flex items-center gap-2">
              <Camera className="h-4 w-4" />
              {ph.testPhoto}
              <span className="text-destructive">* {ph.mandatory}</span>
            </Label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            {photoPreview ? (
              <div className="relative rounded-lg border-2 border-success bg-success/10 p-2">
                <img 
                  src={photoPreview} 
                  alt="Test Preview" 
                  className="w-full h-40 object-cover rounded"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-3 right-3 h-8 w-8"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 mt-2 text-success text-sm">
                  <CheckCircle className="h-4 w-4" />
                  {ph.photoVerified}
                </div>
                
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date().toLocaleString()}
                  </span>
                  {geoLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {geoLocation.latitude.toFixed(4)}, {geoLocation.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full min-h-[80px] border-dashed border-2",
                  !photoUrl && "border-destructive text-destructive hover:bg-destructive/10"
                )}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {ph.uploading}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8" />
                    <span>{ph.takePhoto}</span>
                    <span className="text-xs">{ph.hygrometerOrBalance}</span>
                  </div>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="form-label-industrial">{ph.notesOptional}</Label>
            <Textarea
              placeholder={ph.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-[44px]">
              {ph.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || uploadingPhoto || !photoUrl}
              className="min-h-[44px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {ph.saving}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {ph.validate}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
