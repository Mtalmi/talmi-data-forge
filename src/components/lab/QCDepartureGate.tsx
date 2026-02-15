import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Clock,
  Truck,
  Droplets,
  X,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { compressImage } from '@/lib/imageCompression';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface QCDepartureGateProps {
  blId: string;
  camion?: string;
  formule?: string;
  volume?: number;
  onApproved?: () => void;
  trigger?: React.ReactNode;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

// Plant coordinates for geo-fence validation (example: Talmi Béton plant)
const PLANT_COORDS = {
  latitude: 33.5731, // Casablanca area
  longitude: -7.5898,
  radiusKm: 0.5 // 500m radius
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function QCDepartureGate({ blId, camion, formule, volume, onApproved, trigger }: QCDepartureGateProps) {
  const { user, canValidateTechnique } = useAuth();
  const { t } = useI18n();
  const qc = t.qcDeparture;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSlump, setUploadingSlump] = useState(false);
  const [uploadingTexture, setUploadingTexture] = useState(false);
  
  // Slump test
  const [affaissement, setAffaissement] = useState('');
  const [slumpPhotoUrl, setSlumpPhotoUrl] = useState<string | null>(null);
  const [slumpPhotoPreview, setSlumpPhotoPreview] = useState<string | null>(null);
  const [slumpGeo, setSlumpGeo] = useState<GeoLocation | null>(null);
  
  // Texture
  const [textureConforme, setTextureConforme] = useState(true);
  const [texturePhotoUrl, setTexturePhotoUrl] = useState<string | null>(null);
  const [texturePhotoPreview, setTexturePhotoPreview] = useState<string | null>(null);
  const [textureGeo, setTextureGeo] = useState<GeoLocation | null>(null);
  
  // Water correction
  const [humiditeSable, setHumiditeSable] = useState('');
  const [correctionEau, setCorrectionEau] = useState('');
  
  const [notes, setNotes] = useState('');
  
  const slumpInputRef = useRef<HTMLInputElement>(null);
  const textureInputRef = useRef<HTMLInputElement>(null);

  // Get geolocation
  const getGeoLocation = (): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  // Check if within plant geo-fence
  const isWithinPlant = (geo: GeoLocation | null): boolean => {
    if (!geo) return false;
    const distance = calculateDistance(
      geo.latitude, geo.longitude,
      PLANT_COORDS.latitude, PLANT_COORDS.longitude
    );
    return distance <= PLANT_COORDS.radiusKm;
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'slump' | 'texture'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'slump' ? setUploadingSlump : setUploadingTexture;
    const setPhotoUrl = type === 'slump' ? setSlumpPhotoUrl : setTexturePhotoUrl;
    const setPhotoPreview = type === 'slump' ? setSlumpPhotoPreview : setTexturePhotoPreview;
    const setGeo = type === 'slump' ? setSlumpGeo : setTextureGeo;

    try {
      setUploading(true);
      
      // Get geo-location when photo is taken
      const geo = await getGeoLocation();
      setGeo(geo);
      
      const compressedFile = await compressImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
      
      // Upload
      const fileName = `qc_${type}_${blId}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('qc-photos')
        .upload(`departures/${fileName}`, compressedFile);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('qc-photos')
        .getPublicUrl(`departures/${fileName}`);
      
      setPhotoUrl(urlData.publicUrl);
      toast.success(type === 'slump' ? qc.slumpUploaded : qc.textureUploaded);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(qc.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STRICT VALIDATION: Both photos MANDATORY
    if (!slumpPhotoUrl) {
      toast.error(qc.slumpPhotoRequired);
      return;
    }
    if (!texturePhotoUrl) {
      toast.error(qc.texturePhotoRequired);
      return;
    }
    
    const affaissementValue = parseInt(affaissement);
    if (isNaN(affaissementValue) || affaissementValue < 0 || affaissementValue > 300) {
      toast.error(qc.invalidSlump);
      return;
    }
    
    setSubmitting(true);

    try {
      // Get user info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      // Determine slump conformity (typically 50-200mm is acceptable)
      const slumpConforme = affaissementValue >= 50 && affaissementValue <= 200;
      
      // Check geo-validation
      const geoValidated = isWithinPlant(slumpGeo) && isWithinPlant(textureGeo);

      const { error } = await supabase
        .from('controles_depart')
        .insert({
          bl_id: blId,
          affaissement_mm: affaissementValue,
          affaissement_conforme: slumpConforme,
          photo_slump_url: slumpPhotoUrl,
          photo_slump_timestamp: new Date().toISOString(),
          photo_slump_latitude: slumpGeo?.latitude || null,
          photo_slump_longitude: slumpGeo?.longitude || null,
          texture_conforme: textureConforme,
          photo_texture_url: texturePhotoUrl,
          photo_texture_timestamp: new Date().toISOString(),
          photo_texture_latitude: textureGeo?.latitude || null,
          photo_texture_longitude: textureGeo?.longitude || null,
          correction_eau_appliquee_l: correctionEau ? parseFloat(correctionEau) : null,
          humidite_sable_pct: humiditeSable ? parseFloat(humiditeSable) : null,
          valide_par: user?.id,
          valide_par_name: profile?.full_name || user?.email,
          geo_validated: geoValidated,
          geo_validation_notes: geoValidated ? 'Photos prises dans la zone de la centrale' : 'Attention: Photos hors zone centrale',
          notes: notes || null
        });

      if (error) throw error;

      toast.success(qc.validated);
      
      onApproved?.();
      setOpen(false);
    } catch (error) {
      console.error('Error saving departure control:', error);
      toast.error(qc.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canValidateTechnique) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 min-h-[44px] bg-success hover:bg-success/90">
            <Shield className="h-4 w-4" />
            {qc.triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            {qc.title}
          </DialogTitle>
          <DialogDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{blId}</Badge>
              {camion && <Badge variant="secondary"><Truck className="h-3 w-3 mr-1" />{camion}</Badge>}
              {volume && <Badge>{volume} m³</Badge>}
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* PHOTO 1: Slump Test */}
          <Card className="border-2 border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                {qc.photo1Title}
                <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>{qc.slump}</Label>
                <Input
                  type="number"
                  min="0"
                  max="300"
                  placeholder="Ex: 120"
                  value={affaissement}
                  onChange={(e) => setAffaissement(e.target.value)}
                  required
                  className="min-h-[48px] font-mono text-lg"
                />
              </div>
              
              <input
                ref={slumpInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoUpload(e, 'slump')}
                className="hidden"
              />
              
              {slumpPhotoPreview ? (
                <div className="relative rounded-lg border-2 border-success bg-success/10 p-2">
                  <img src={slumpPhotoPreview} alt="Slump" className="w-full h-32 object-cover rounded" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-3 right-3 h-7 w-7"
                    onClick={() => { setSlumpPhotoUrl(null); setSlumpPhotoPreview(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date().toLocaleTimeString('fr-FR')}
                    </span>
                    {slumpGeo && (
                      <span className={cn(
                        "flex items-center gap-1",
                        isWithinPlant(slumpGeo) ? "text-success" : "text-warning"
                      )}>
                        <MapPin className="h-3 w-3" />
                        {isWithinPlant(slumpGeo) ? qc.plantZone : qc.outsideZone}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[60px] border-dashed border-2 border-destructive"
                  onClick={() => slumpInputRef.current?.click()}
                  disabled={uploadingSlump}
                >
                  {uploadingSlump ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5 mr-2" />
                      {qc.photoSlump}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* PHOTO 2: Concrete Texture */}
          <Card className="border-2 border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                {qc.photo2Title}
                <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{qc.textureConform}</Label>
                <Switch
                  checked={textureConforme}
                  onCheckedChange={setTextureConforme}
                />
              </div>
              
              <input
                ref={textureInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoUpload(e, 'texture')}
                className="hidden"
              />
              
              {texturePhotoPreview ? (
                <div className="relative rounded-lg border-2 border-success bg-success/10 p-2">
                  <img src={texturePhotoPreview} alt="Texture" className="w-full h-32 object-cover rounded" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-3 right-3 h-7 w-7"
                    onClick={() => { setTexturePhotoUrl(null); setTexturePhotoPreview(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date().toLocaleTimeString('fr-FR')}
                    </span>
                    {textureGeo && (
                      <span className={cn(
                        "flex items-center gap-1",
                        isWithinPlant(textureGeo) ? "text-success" : "text-warning"
                      )}>
                        <MapPin className="h-3 w-3" />
                        {isWithinPlant(textureGeo) ? qc.plantZone : qc.outsideZone}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[60px] border-dashed border-2 border-destructive"
                  onClick={() => textureInputRef.current?.click()}
                  disabled={uploadingTexture}
                >
                  {uploadingTexture ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5 mr-2" />
                      {qc.photoTexture}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Water Correction Applied */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">{qc.sandHumidity}</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 8"
                value={humiditeSable}
                onChange={(e) => setHumiditeSable(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{qc.waterCorrection}</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: -32"
                value={correctionEau}
                onChange={(e) => setCorrectionEau(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="form-label-industrial">{qc.notesOptional}</Label>
            <Textarea
              placeholder={qc.observations}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-[44px]">
              {qc.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !slumpPhotoUrl || !texturePhotoUrl}
              className="min-h-[44px] bg-success hover:bg-success/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {qc.validating}
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  {qc.authorize}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
