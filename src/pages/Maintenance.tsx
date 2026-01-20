import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { fr } from 'date-fns/locale';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EtalonnageForm } from '@/components/maintenance/EtalonnageForm';

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

      toast.success('Photo uploadée');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingPhoto(null);
    }
  };

  // Submit cleaning record
  const submitCleaningMutation = useMutation({
    mutationFn: async () => {
      // Validate mandatory photos
      if (!cleaningData.malaxeur_photo_url) {
        throw new Error('Photo du malaxeur obligatoire');
      }
      if (!cleaningData.goulotte_photo_url) {
        throw new Error('Photo de la goulotte obligatoire');
      }
      if (!cleaningData.residus_photo_url) {
        throw new Error('Photo des résidus ciment obligatoire');
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
      toast.success('Nettoyage enregistré');
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
        return <Badge className="bg-success/20 text-success">Opérationnel</Badge>;
      case 'maintenance':
        return <Badge className="bg-warning/20 text-warning">Maintenance</Badge>;
      case 'panne':
        return <Badge className="bg-destructive/20 text-destructive">Panne</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getCriticiteBadge = (criticite: string) => {
    switch (criticite) {
      case 'critique':
        return <Badge variant="destructive">Critique</Badge>;
      case 'important':
        return <Badge className="bg-warning/20 text-warning border-warning">Important</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
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
              Maintenance & Centrale
            </h1>
            <p className="text-muted-foreground">
              Équipements, nettoyage quotidien, étalonnage et incidents
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Dialog open={showCleaningForm} onOpenChange={setShowCleaningForm}>
              <DialogTrigger asChild>
                <Button>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Checklist Nettoyage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Nettoyage Quotidien - {format(new Date(), 'dd/MM/yyyy')}
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
                        Malaxeur nettoyé <span className="text-destructive">*</span>
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
                      📷 Photo de l'intérieur du malaxeur après nettoyage (OBLIGATOIRE)
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
                        Goulotte nettoyée <span className="text-destructive">*</span>
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
                      📷 Photo de la goulotte propre (OBLIGATOIRE)
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
                        Résidus ciment enlevés <span className="text-destructive">*</span>
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
                      📷 Photo de la zone sans résidus de ciment (OBLIGATOIRE)
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
                        Zone centrale propre
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
                    Soumettre le Nettoyage
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
                  <p className="text-xs text-muted-foreground">Équipements</p>
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
                  <p className="text-xs text-muted-foreground">En maintenance</p>
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
                  <p className="text-xs text-muted-foreground">Maint. en retard</p>
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
                  <p className="text-xs text-muted-foreground">Étalonnage dû</p>
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
                  <p className="text-xs text-muted-foreground">Incidents ouverts</p>
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
              Nettoyage du jour - {format(new Date(), 'EEEE dd MMMM', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCleaning ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : todayCleaning ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  {todayCleaning.malaxeur_nettoye ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span>Malaxeur</span>
                  {todayCleaning.malaxeur_photo_url && (
                    <Badge variant="outline" className="text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {todayCleaning.goulotte_nettoyee ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span>Goulotte</span>
                  {todayCleaning.goulotte_photo_url && (
                    <Badge variant="outline" className="text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {todayCleaning.residus_ciment_enleves ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span>Résidus</span>
                  {todayCleaning.residus_photo_url && (
                    <Badge variant="outline" className="text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {todayCleaning.zone_centrale_propre ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>Zone centrale</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg">
                <FileWarning className="h-6 w-6 text-warning" />
                <div>
                  <p className="font-medium text-warning">Nettoyage non enregistré</p>
                  <p className="text-sm text-muted-foreground">
                    Le checklist de nettoyage quotidien n'a pas encore été soumis
                  </p>
                </div>
                <Button variant="outline" className="ml-auto" onClick={() => setShowCleaningForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Soumettre
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Equipment, Incidents, Calibrations */}
        <Tabs defaultValue="equipements">
          <TabsList>
            <TabsTrigger value="equipements" className="gap-2">
              <Settings className="h-4 w-4" />
              Équipements
            </TabsTrigger>
            <TabsTrigger value="incidents" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Incidents
              {openIncidents.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {openIncidents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="etalonnage" className="gap-2">
              <Gauge className="h-4 w-4" />
              Étalonnage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipements" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Équipement</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Criticité</th>
                        <th className="text-left p-3 font-medium">Statut</th>
                        <th className="text-left p-3 font-medium">Proch. Maintenance</th>
                        <th className="text-left p-3 font-medium">Proch. Étalonnage</th>
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
                <CardTitle className="text-lg">Incidents Récents</CardTitle>
              </CardHeader>
              <CardContent>
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                    <p>Aucun incident récent</p>
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
                                {incident.resolu ? 'Résolu' : 'Ouvert'}
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
                  <CardTitle className="text-lg">Équipements à Étalonner</CardTitle>
                  <CardDescription>
                    Balances, doseurs et instruments de mesure nécessitant un étalonnage
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
                            Dernier: {equip.dernier_etalonnage_at 
                              ? format(new Date(equip.dernier_etalonnage_at), 'dd/MM/yyyy')
                              : 'N/A'}
                          </p>
                          <p className={cn(
                            'text-sm font-medium',
                            equip.prochain_etalonnage_at && new Date(equip.prochain_etalonnage_at) < new Date() 
                              ? 'text-destructive' 
                              : 'text-muted-foreground'
                          )}>
                            Prochain: {equip.prochain_etalonnage_at 
                              ? format(new Date(equip.prochain_etalonnage_at), 'dd/MM/yyyy')
                              : 'À planifier'}
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
