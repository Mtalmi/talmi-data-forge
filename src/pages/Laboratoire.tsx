import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useLabTests } from '@/hooks/useLabTests';
import { TestCalendar } from '@/components/lab/TestCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SlumpEntry } from '@/components/lab/SlumpEntry';
import { useEffect } from 'react';

interface Formule {
  formule_id: string;
  designation: string;
  affaissement_cible_mm: number | null;
  affaissement_tolerance_mm: number | null;
  resistance_cible_28j_mpa: number | null;
}

interface BonLivraison {
  bl_id: string;
  client_id: string;
  formule_id: string;
  date_livraison: string;
  volume_m3: number;
}

export default function Laboratoire() {
  const { isCeo, isResponsableTechnique, isCentraliste } = useAuth();
  const { tests, loading, calendar, createTest, updateResistance, getPendingTests, refresh } = useLabTests();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formules, setFormules] = useState<Formule[]>([]);
  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [selectedBl, setSelectedBl] = useState('');
  const [selectedFormule, setSelectedFormule] = useState<Formule | null>(null);
  const [slumpValue, setSlumpValue] = useState(0);
  const [slumpValid, setSlumpValid] = useState(true);
  const [technicien, setTechnicien] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = isCeo || isResponsableTechnique || isCentraliste;
  const pendingTests = getPendingTests();

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [formulesRes, bonsRes] = await Promise.all([
        supabase
          .from('formules_theoriques')
          .select('formule_id, designation, affaissement_cible_mm, affaissement_tolerance_mm, resistance_cible_28j_mpa'),
        supabase
          .from('bons_livraison_reels')
          .select('bl_id, client_id, formule_id, date_livraison, volume_m3')
          .in('workflow_status', ['production', 'validation_technique', 'en_livraison', 'livre'])
          .order('date_livraison', { ascending: false })
          .limit(50),
      ]);

      if (formulesRes.error) throw formulesRes.error;
      if (bonsRes.error) throw bonsRes.error;

      setFormules(formulesRes.data || []);
      setBons(bonsRes.data || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleBlSelect = (blId: string) => {
    setSelectedBl(blId);
    const bon = bons.find(b => b.bl_id === blId);
    if (bon) {
      const formule = formules.find(f => f.formule_id === bon.formule_id);
      setSelectedFormule(formule || null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBl || !slumpValue) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!slumpValid) {
      toast.warning('Attention: L\'affaissement est hors tolérance');
    }

    setSaving(true);
    const bon = bons.find(b => b.bl_id === selectedBl);
    const success = await createTest(
      selectedBl,
      bon?.formule_id || '',
      slumpValue,
      technicien || undefined
    );
    setSaving(false);

    if (success) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedBl('');
    setSelectedFormule(null);
    setSlumpValue(0);
    setTechnicien('');
    setSlumpValid(true);
  };

  const handleRecordResult = async (testId: string, type: '7j' | '28j', value: number): Promise<boolean> => {
    return updateResistance(testId, type, value);
  };

  // Quality stats
  const qualityStats = {
    totalTests: tests.length,
    slumpConform: tests.filter(t => t.affaissement_conforme === true).length,
    resistanceConform: tests.filter(t => t.resistance_conforme === true).length,
    pendingResistance: tests.filter(t => t.resistance_28j_mpa === null).length,
    alerts: tests.filter(t => t.alerte_qualite === true).length,
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <FlaskConical className="h-5 w-5 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span className="truncate">Laboratoire & Qualité</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Gestion des tests d'affaissement et d'écrasement
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={refresh} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="min-h-[40px]">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nouveau Prélèvement</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-primary" />
                      Enregistrer un Prélèvement
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">N° Bon de Livraison *</Label>
                      <Select value={selectedBl} onValueChange={handleBlSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un BL" />
                        </SelectTrigger>
                        <SelectContent>
                          {bons.map(bon => (
                            <SelectItem key={bon.bl_id} value={bon.bl_id}>
                              {bon.bl_id} - {bon.client_id} ({bon.formule_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedFormule && (
                      <div className="p-3 rounded bg-muted/30 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Formule:</span>
                          <span className="font-mono">{selectedFormule.formule_id}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground">Affaissement cible:</span>
                          <span>
                            {selectedFormule.affaissement_cible_mm || 150}mm 
                            (±{selectedFormule.affaissement_tolerance_mm || 20}mm)
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground">Résistance cible 28j:</span>
                          <span>{selectedFormule.resistance_cible_28j_mpa || 25} MPa</span>
                        </div>
                      </div>
                    )}

                    <SlumpEntry
                      value={slumpValue}
                      onChange={setSlumpValue}
                      targetSlump={selectedFormule?.affaissement_cible_mm || 150}
                      tolerance={selectedFormule?.affaissement_tolerance_mm || 20}
                      disabled={!selectedBl}
                      onValidationChange={(v) => setSlumpValid(v.isValid)}
                    />

                    <div className="space-y-2">
                      <Label className="form-label-industrial">Technicien</Label>
                      <Input
                        value={technicien}
                        onChange={(e) => setTechnicien(e.target.value)}
                        placeholder="Nom du technicien"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleSubmit} disabled={saving || !selectedBl || !slumpValue}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Pending Tests Alert */}
        {pendingTests.length > 0 && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  {pendingTests.length} Test(s) à effectuer aujourd'hui ou en retard!
                </p>
                <p className="text-sm text-muted-foreground">
                  Veuillez enregistrer les résultats d'écrasement ci-dessous.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-industrial p-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{qualityStats.totalTests}</p>
                <p className="text-xs text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </div>
          <div className="card-industrial p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{qualityStats.slumpConform}</p>
                <p className="text-xs text-muted-foreground">Affaissement OK</p>
              </div>
            </div>
          </div>
          <div className="card-industrial p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{qualityStats.resistanceConform}</p>
                <p className="text-xs text-muted-foreground">Résistance OK</p>
              </div>
            </div>
          </div>
          <div className="card-industrial p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{qualityStats.pendingResistance}</p>
                <p className="text-xs text-muted-foreground">En Attente</p>
              </div>
            </div>
          </div>
          <div className="card-industrial p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn(
                'h-8 w-8',
                qualityStats.alerts > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'
              )} />
              <div>
                <p className="text-2xl font-bold">{qualityStats.alerts}</p>
                <p className="text-xs text-muted-foreground">Alertes Qualité</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendrier Écrasements
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Historique Tests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <TestCalendar
              items={calendar}
              onRecordResult={handleRecordResult}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="history">
            <div className="card-industrial overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : tests.length === 0 ? (
                <div className="p-8 text-center">
                  <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Aucun test enregistré</p>
                </div>
              ) : (
                <Table className="data-table-industrial">
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° BL</TableHead>
                      <TableHead>Date Prélèvement</TableHead>
                      <TableHead>Formule</TableHead>
                      <TableHead className="text-center">Affaissement</TableHead>
                      <TableHead className="text-center">Rés. 7j</TableHead>
                      <TableHead className="text-center">Rés. 28j</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map(test => (
                      <TableRow
                        key={test.id}
                        className={cn(test.alerte_qualite && 'bg-destructive/5')}
                      >
                        <TableCell className="font-mono">{test.bl_id}</TableCell>
                        <TableCell>
                          {format(new Date(test.date_prelevement), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{test.formule_id}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1',
                            test.affaissement_conforme === false && 'text-destructive'
                          )}>
                            {test.affaissement_mm || '-'} mm
                            {test.affaissement_conforme === false && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {test.resistance_7j_mpa ? `${test.resistance_7j_mpa} MPa` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1',
                            test.resistance_conforme === false && 'text-destructive font-semibold'
                          )}>
                            {test.resistance_28j_mpa ? `${test.resistance_28j_mpa} MPa` : '-'}
                            {test.resistance_conforme === false && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {test.alerte_qualite ? (
                            <Badge variant="destructive" className="animate-pulse">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              ALERTE
                            </Badge>
                          ) : test.resistance_conforme === true ? (
                            <Badge variant="default" className="bg-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Conforme
                            </Badge>
                          ) : (
                            <Badge variant="secondary">En Attente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
