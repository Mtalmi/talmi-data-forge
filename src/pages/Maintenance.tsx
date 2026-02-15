import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateLocale } from '@/i18n/dateLocale';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  Upload,
  RefreshCw,
  Shield,
  Gauge,
  Calendar,
  Plus,
  Settings,
  ClipboardCheck,
  Zap,
  FileWarning,
  ImageIcon,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EtalonnageForm } from '@/components/maintenance/EtalonnageForm';
import { FleetHealthDashboard } from '@/components/maintenance/FleetHealthDashboard';

interface Equipement {
  id: string;
  code_equipement: string;
  nom: string;
  type: string;
  statut: string;
  criticite: string;
  derniere_maintenance_at: string | null;
  prochaine_maintenance_at: string | null;
  dernier_etalonnage_at: string | null;
  prochain_etalonnage_at: string | null;
}

interface NettoyageQuotidien {
  id: string;
  date_nettoyage: string;
  malaxeur_nettoye: boolean;
  malaxeur_photo_url: string | null;
  goulotte_nettoyee: boolean;
  goulotte_photo_url: string | null;
  residus_ciment_enleves: boolean;
  residus_photo_url: string | null;
  zone_centrale_propre: boolean;
  zone_photo_url: string | null;
  valide: boolean;
  score_proprete: number | null;
}

interface IncidentCentrale {
  id: string;
  type_incident: string;
  niveau_gravite: string;
  titre: string;
  description: string;
  date_incident: string;
  resolu: boolean;
  equipement_id: string | null;
}

export default function Maintenance() {
  const { user, isCeo, isResponsableTechnique } = useAuth();
  const { t, lang } = useI18n();
  const canManageCalibration = isCeo || isResponsableTechnique;
  const queryClient = useQueryClient();
  const [showCleaningForm, setShowCleaningForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [cleaningData, setCleaningData] = useState({
    malaxeur_nettoye: false,
    malaxeur_photo_url: '',
    goulotte_nettoyee: false,
    goulotte_photo_url: '',
    residus_ciment_enleves: false,
    residus_photo_url: '',
    zone_centrale_propre: false,
    zone_photo_url: '',
  });

  // Fetch equipment
  const { data: equipements = [], isLoading: loadingEquipements } = useQuery({
    queryKey: ['equipements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipements')
        .select('*')
        .order('criticite', { ascending: true });
      if (error) throw error;
      return data as Equipement[];
    },
  });

  // Fetch today's cleaning record
  const { data: todayCleaning, isLoading: loadingCleaning } = useQuery({
    queryKey: ['nettoyage-today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('nettoyage_quotidien')
        .select('*')
        .eq('date_nettoyage', today)
        .maybeSingle();
      if (error) throw error;
      return data as NettoyageQuotidien | null;
    },
  });

  // Fetch recent incidents
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-centrale'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents_centrale')
        .select('*')
        .order('date_incident', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as IncidentCentrale[];
    },
  });

  // Upload photo to storage
  const uploadPhoto = async (file: File, type: string) => {
    setUploadingPhoto(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `cleaning/${format(new Date(), 'yyyy-MM-dd')}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(filePath);

      setCleaningData(prev => ({
        ...prev,
        [`${type}_photo_url`]: publicUrl,
      }));

      toast.success(t.pages.maintenance.photoUploaded);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t.pages.maintenance.uploadError);
    } finally {
      setUploadingPhoto(null);
    }
  };

  // Submit cleaning record
  const submitCleaningMutation = useMutation({
    mutationFn: async () => {
      // Validate mandatory photos
      if (!cleaningData.malaxeur_photo_url) {
        throw new Error(t.pages.maintenance.mixerPhotoRequired);
      }
      if (!cleaningData.goulotte_photo_url) {
        throw new Error(t.pages.maintenance.chutePhotoRequired);
      }
      if (!cleaningData.residus_photo_url) {
        throw new Error(t.pages.maintenance.residuesPhotoRequired);
      }

      const { error } = await supabase
        .from('nettoyage_quotidien')
        .upsert({
          date_nettoyage: format(new Date(), 'yyyy-MM-dd'),
          effectue_par: user?.id,
          ...cleaningData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.pages.maintenance.cleaningRecorded);
      queryClient.invalidateQueries({ queryKey: ['nettoyage-today'] });
      setShowCleaningForm(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Stats calculations
  const criticalEquipments = equipements.filter(e => e.criticite === 'critique');
  const equipmentsInMaintenance = equipements.filter(e => e.statut === 'maintenance' || e.statut === 'panne');
  const overdueMaintenances = equipements.filter(e => 
    e.prochaine_maintenance_at && new Date(e.prochaine_maintenance_at) < new Date()
  );
  const overdueCalibrations = equipements.filter(e => 
    e.prochain_etalonnage_at && new Date(e.prochain_etalonnage_at) < new Date()
  );
  const openIncidents = incidents.filter(i => !i.resolu);

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'operationnel':
        return <Badge className="bg-success/20 text-success">{t.pages.maintenance.operational}</Badge>;
      case 'maintenance':
        return <Badge className="bg-warning/20 text-warning">{t.pages.maintenance.maintenance}</Badge>;
      case 'panne':
        return <Badge className="bg-destructive/20 text-destructive">{t.pages.maintenance.breakdown}</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getCriticiteBadge = (criticite: string) => {
    switch (criticite) {
      case 'critique':
        return <Badge variant="destructive">{t.pages.maintenance.critical}</Badge>;
      case 'important':
        return <Badge className="bg-warning/20 text-warning border-warning">{t.pages.maintenance.important}</Badge>;
      default:
        return <Badge variant="outline">{t.pages.maintenance.normal}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              {t.pages.maintenance.title}
            </h1>
            <p className="text-muted-foreground">
              {t.pages.maintenance.subtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.pages.maintenance.refresh}
            </Button>
            <Dialog open={showCleaningForm} onOpenChange={setShowCleaningForm}>
              <DialogTrigger asChild>
                <Button>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  {t.pages.maintenance.cleaningChecklist}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                     <ClipboardCheck className="h-5 w-5" />
                    {t.pages.maintenance.dailyCleaning} - {format(new Date(), 'dd/MM/yyyy')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Malaxeur */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="malaxeur"
                        checked={cleaningData.malaxeur_nettoye}
                        onCheckedChange={(checked) => 
                          setCleaningData(prev => ({ ...prev, malaxeur_nettoye: !!checked }))
                        }
                      />
                       <Label htmlFor="malaxeur" className="font-semibold">
                        {t.pages.maintenance.mixerCleaned} <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], 'malaxeur')}
                        className="flex-1"
                      />
                      {uploadingPhoto === 'malaxeur' && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {cleaningData.malaxeur_photo_url && (
                        <Badge className="bg-success/20 text-success">
                          <ImageIcon className="h-3 w-3 mr-1" /> Photo OK
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.pages.maintenance.mixerPhotoHint}
                    </p>
                  </div>

                  {/* Goulotte */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="goulotte"
                        checked={cleaningData.goulotte_nettoyee}
                        onCheckedChange={(checked) => 
                          setCleaningData(prev => ({ ...prev, goulotte_nettoyee: !!checked }))
                        }
                      />
                       <Label htmlFor="goulotte" className="font-semibold">
                        {t.pages.maintenance.chuteCleaned} <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], 'goulotte')}
                        className="flex-1"
                      />
                      {uploadingPhoto === 'goulotte' && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {cleaningData.goulotte_photo_url && (
                        <Badge className="bg-success/20 text-success">
                          <ImageIcon className="h-3 w-3 mr-1" /> Photo OK
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.pages.maintenance.chutePhotoHint}
                    </p>
                  </div>

                  {/* Résidus Ciment */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="residus"
                        checked={cleaningData.residus_ciment_enleves}
                        onCheckedChange={(checked) => 
                          setCleaningData(prev => ({ ...prev, residus_ciment_enleves: !!checked }))
                        }
                      />
                       <Label htmlFor="residus" className="font-semibold">
                        {t.pages.maintenance.cementResiduesRemoved} <span className="text-destructive">*</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], 'residus')}
                        className="flex-1"
                      />
                      {uploadingPhoto === 'residus' && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {cleaningData.residus_photo_url && (
                        <Badge className="bg-success/20 text-success">
                          <ImageIcon className="h-3 w-3 mr-1" /> Photo OK
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.pages.maintenance.residuesPhotoHint}
                    </p>
                  </div>

                  {/* Zone Centrale */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="zone"
                        checked={cleaningData.zone_centrale_propre}
                        onCheckedChange={(checked) => 
                          setCleaningData(prev => ({ ...prev, zone_centrale_propre: !!checked }))
                        }
                      />
                       <Label htmlFor="zone" className="font-semibold">
                        {t.pages.maintenance.plantAreaClean}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], 'zone')}
                        className="flex-1"
                      />
                      {uploadingPhoto === 'zone' && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {cleaningData.zone_photo_url && (
                        <Badge className="bg-success/20 text-success">
                          <ImageIcon className="h-3 w-3 mr-1" /> Photo OK
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => submitCleaningMutation.mutate()}
                    disabled={submitCleaningMutation.isPending}
                  >
                    {submitCleaningMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {t.pages.maintenance.submitCleaning}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{equipements.length}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.maintenance.equipmentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={equipmentsInMaintenance.length > 0 ? 'border-warning' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{equipmentsInMaintenance.length}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.maintenance.inMaintenanceCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={overdueMaintenances.length > 0 ? 'border-destructive' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Clock className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overdueMaintenances.length}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.maintenance.overdueMaintenanceCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={overdueCalibrations.length > 0 ? 'border-destructive' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Gauge className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overdueCalibrations.length}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.maintenance.overdueCalibration}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={openIncidents.length > 0 ? 'border-destructive' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openIncidents.length}</p>
                  <p className="text-xs text-muted-foreground">{t.pages.maintenance.openIncidents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Cleaning Status */}
        <Card className={todayCleaning?.valide ? 'border-success' : 'border-warning'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              {t.pages.maintenance.todayCleaning} - {format(new Date(), 'EEEE dd MMMM', { locale: getDateLocale(lang) })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCleaning ? (
              <p className="text-muted-foreground">{t.pages.maintenance.loading}</p>
            ) : todayCleaning ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  {todayCleaning.malaxeur_nettoye ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span>{t.pages.maintenance.mixer}</span>
                  {todayCleaning.malaxeur_photo_url && (
                    <Badge variant="outline" className="text-xs">
                     <Camera className="h-3 w-3 mr-1" />
                       {t.pages.maintenance.photo}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {todayCleaning.goulotte_nettoyee ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span>{t.pages.maintenance.chute}</span>
                  {todayCleaning.goulotte_photo_url && (
                    <Badge variant="outline" className="text-xs">
                     <Camera className="h-3 w-3 mr-1" />
                       {t.pages.maintenance.photo}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {todayCleaning.residus_ciment_enleves ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span>{t.pages.maintenance.residues}</span>
                  {todayCleaning.residus_photo_url && (
                    <Badge variant="outline" className="text-xs">
                     <Camera className="h-3 w-3 mr-1" />
                       {t.pages.maintenance.photo}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {todayCleaning.zone_centrale_propre ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>{t.pages.maintenance.centralZone}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg">
                <FileWarning className="h-6 w-6 text-warning" />
                <div>
                   <p className="font-medium text-warning">{t.pages.maintenance.cleaningNotRecorded}</p>
                   <p className="text-sm text-muted-foreground">
                     {t.pages.maintenance.cleaningNotSubmitted}
                   </p>
                </div>
                <Button variant="outline" className="ml-auto" onClick={() => setShowCleaningForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.pages.maintenance.submit}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Fleet Health, Equipment, Incidents, Calibrations */}
        <Tabs defaultValue="flotte">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="flotte" className="gap-2">
              <Truck className="h-4 w-4" />
               {t.pages.maintenance.fleetHealth}
            </TabsTrigger>
            <TabsTrigger value="equipements" className="gap-2">
              <Settings className="h-4 w-4" />
              {t.pages.maintenance.equipmentTab}
            </TabsTrigger>
            <TabsTrigger value="incidents" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t.pages.maintenance.incidentsTab}
              {openIncidents.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {openIncidents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="etalonnage" className="gap-2">
              <Gauge className="h-4 w-4" />
              {t.pages.maintenance.calibrationTab}
            </TabsTrigger>
          </TabsList>

          {/* Fleet Health Tab */}
          <TabsContent value="flotte" className="mt-4">
            <FleetHealthDashboard />
          </TabsContent>

          <TabsContent value="equipements" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                         <th className="text-left p-3 font-medium">{t.pages.maintenance.equipmentCol}</th>
                         <th className="text-left p-3 font-medium">{t.pages.maintenance.typeCol}</th>
                         <th className="text-left p-3 font-medium">{t.pages.maintenance.criticalityCol}</th>
                         <th className="text-left p-3 font-medium">{t.pages.maintenance.statusCol}</th>
                         <th className="text-left p-3 font-medium">{t.pages.maintenance.nextMaintenance}</th>
                         <th className="text-left p-3 font-medium">{t.pages.maintenance.nextCalibration}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipements.map((equip) => (
                        <tr key={equip.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{equip.nom}</p>
                              <p className="text-xs text-muted-foreground">{equip.code_equipement}</p>
                            </div>
                          </td>
                          <td className="p-3 capitalize">{equip.type}</td>
                          <td className="p-3">{getCriticiteBadge(equip.criticite)}</td>
                          <td className="p-3">{getStatusBadge(equip.statut)}</td>
                          <td className="p-3">
                            {equip.prochaine_maintenance_at ? (
                              <span className={cn(
                                new Date(equip.prochaine_maintenance_at) < new Date() && 'text-destructive font-medium'
                              )}>
                                {format(new Date(equip.prochaine_maintenance_at), 'dd/MM/yyyy')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            {equip.prochain_etalonnage_at ? (
                              <span className={cn(
                                new Date(equip.prochain_etalonnage_at) < new Date() && 'text-destructive font-medium'
                              )}>
                                {format(new Date(equip.prochain_etalonnage_at), 'dd/MM/yyyy')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.pages.maintenance.recentIncidents}</CardTitle>
              </CardHeader>
              <CardContent>
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                    <p>{t.pages.maintenance.noRecentIncidents}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className={cn(
                          'p-4 border rounded-lg',
                          !incident.resolu && incident.niveau_gravite === 'critique' && 'border-destructive bg-destructive/5',
                          !incident.resolu && incident.niveau_gravite === 'majeur' && 'border-warning bg-warning/5'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{incident.titre}</h4>
                               <Badge variant={incident.resolu ? 'outline' : 'destructive'}>
                                 {incident.resolu ? t.pages.maintenance.resolved : t.pages.maintenance.open}
                              </Badge>
                              <Badge variant="outline">{incident.type_incident}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(incident.date_incident), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="etalonnage" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-lg">{t.pages.maintenance.equipmentToCalibrate}</CardTitle>
                   <CardDescription>
                     {t.pages.maintenance.calibrationDescription}
                   </CardDescription>
                </div>
                {canManageCalibration && (
                  <EtalonnageForm
                    equipements={equipements}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['equipements'] })}
                  />
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equipements
                    .filter(e => ['balance', 'doseur', 'capteur'].includes(e.type))
                    .map((equip) => (
                      <div
                        key={equip.id}
                        className={cn(
                          'p-4 border rounded-lg flex items-center justify-between',
                          equip.prochain_etalonnage_at && new Date(equip.prochain_etalonnage_at) < new Date() && 'border-destructive bg-destructive/5'
                        )}
                      >
                        <div>
                          <p className="font-medium">{equip.nom}</p>
                          <p className="text-sm text-muted-foreground">{equip.code_equipement}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                             {t.pages.maintenance.lastCalibration}: {equip.dernier_etalonnage_at 
                               ? format(new Date(equip.dernier_etalonnage_at), 'dd/MM/yyyy')
                               : 'N/A'}
                          </p>
                          <p className={cn(
                            'text-sm font-medium',
                            equip.prochain_etalonnage_at && new Date(equip.prochain_etalonnage_at) < new Date() 
                              ? 'text-destructive' 
                              : 'text-muted-foreground'
                          )}>
                             {t.pages.maintenance.nextCalibrationLabel}: {equip.prochain_etalonnage_at 
                               ? format(new Date(equip.prochain_etalonnage_at), 'dd/MM/yyyy')
                               : t.pages.maintenance.toPlan}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
