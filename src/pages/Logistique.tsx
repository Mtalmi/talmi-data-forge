import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useFlotte } from '@/hooks/useFlotte';
import { ProviderLeaderboard } from '@/components/logistics/ProviderLeaderboard';
import { FuelEntryForm } from '@/components/logistics/FuelEntryForm';
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
import {
  Truck,
  RefreshCw,
  Loader2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
  Trophy,
  Fuel,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Logistique() {
  const { isCeo, isDirecteurOperations, isSuperviseur } = useAuth();
  const {
    vehicules,
    carburant,
    incidents,
    providerStats,
    loading,
    fetchVehicules,
    fetchCarburant,
    addVehicule,
    updateVehiculeStatus,
    addFuelEntry,
    addIncident,
    getAverageConsumption,
  } = useFlotte();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New vehicle form state
  const [newIdCamion, setNewIdCamion] = useState('');
  const [newType, setNewType] = useState('Toupie');
  const [newProprietaire, setNewProprietaire] = useState('Interne');
  const [newChauffeur, setNewChauffeur] = useState('');
  const [newCapacite, setNewCapacite] = useState('8');

  const canManage = isCeo || isDirecteurOperations;

  const resetForm = () => {
    setNewIdCamion('');
    setNewType('Toupie');
    setNewProprietaire('Interne');
    setNewChauffeur('');
    setNewCapacite('8');
  };

  const handleAddVehicule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await addVehicule({
      id_camion: newIdCamion,
      type: newType,
      proprietaire: newProprietaire,
      is_interne: newProprietaire === 'Interne',
      chauffeur: newChauffeur || null,
      capacite_m3: parseFloat(newCapacite) || 8,
    });

    if (success) {
      resetForm();
      setDialogOpen(false);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (statut: string) => {
    const config: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
      'Disponible': { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
      'En Livraison': { icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
      'Maintenance': { icon: Wrench, color: 'text-warning', bg: 'bg-warning/10' },
      'Hors Service': { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    };
    const c = config[statut] || config['Disponible'];
    const Icon = c.icon;
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', c.bg, c.color)}>
        <Icon className="h-3 w-3" />
        {statut}
      </span>
    );
  };

  const disponibles = vehicules.filter(v => v.statut === 'Disponible').length;
  const enLivraison = vehicules.filter(v => v.statut === 'En Livraison').length;
  const maintenance = vehicules.filter(v => v.statut === 'Maintenance').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Truck className="h-7 w-7 text-primary" />
              Logistique & Flotte
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion des véhicules, rotations et performance prestataires
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              fetchVehicules();
              fetchCarburant();
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <FuelEntryForm vehicules={vehicules} onSubmit={addFuelEntry} />
            {canManage && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Véhicule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un Véhicule</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVehicule} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="form-label-industrial">ID Camion</Label>
                        <Input
                          placeholder="T-001"
                          value={newIdCamion}
                          onChange={(e) => setNewIdCamion(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="form-label-industrial">Type</Label>
                        <Select value={newType} onValueChange={setNewType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Toupie">Toupie</SelectItem>
                            <SelectItem value="Pompe">Pompe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="form-label-industrial">Propriétaire</Label>
                        <Input
                          placeholder="Interne ou nom prestataire"
                          value={newProprietaire}
                          onChange={(e) => setNewProprietaire(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="form-label-industrial">Capacité (m³)</Label>
                        <Input
                          type="number"
                          placeholder="8"
                          value={newCapacite}
                          onChange={(e) => setNewCapacite(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Chauffeur</Label>
                      <Input
                        placeholder="Nom du chauffeur"
                        value={newChauffeur}
                        onChange={(e) => setNewChauffeur(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Fleet Status Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="kpi-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Véhicules</p>
            <p className="text-3xl font-bold mt-1">{vehicules.length}</p>
          </div>
          <div className="kpi-card positive">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Disponibles</p>
            <p className="text-3xl font-bold mt-1 text-success">{disponibles}</p>
          </div>
          <div className="kpi-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">En Livraison</p>
            <p className="text-3xl font-bold mt-1 text-primary">{enLivraison}</p>
          </div>
          <div className="kpi-card warning">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Maintenance</p>
            <p className="text-3xl font-bold mt-1 text-warning">{maintenance}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="flotte" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flotte" className="gap-2">
              <Truck className="h-4 w-4" />
              Flotte
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Trophy className="h-4 w-4" />
              Performance Prestataires
            </TabsTrigger>
            <TabsTrigger value="carburant" className="gap-2">
              <Fuel className="h-4 w-4" />
              Carburant
            </TabsTrigger>
          </TabsList>

          {/* Fleet Tab */}
          <TabsContent value="flotte">
            <div className="card-industrial overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table className="data-table-industrial">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Camion</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Chauffeur</TableHead>
                      <TableHead className="text-right">Capacité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Conso. Moy.</TableHead>
                      {canManage && <TableHead className="w-32"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicules.map((v) => {
                      const avgConso = getAverageConsumption(v.id_camion);
                      return (
                        <TableRow key={v.id_camion}>
                          <TableCell className="font-mono font-medium">{v.id_camion}</TableCell>
                          <TableCell>{v.type}</TableCell>
                          <TableCell>
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                              v.is_interne ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            )}>
                              {v.proprietaire}
                            </span>
                          </TableCell>
                          <TableCell>{v.chauffeur || '—'}</TableCell>
                          <TableCell className="text-right font-mono">
                            {v.type === 'Toupie' ? `${v.capacite_m3} m³` : '—'}
                          </TableCell>
                          <TableCell>{getStatusBadge(v.statut)}</TableCell>
                          <TableCell className="text-right">
                            {avgConso !== null ? (
                              <span className={cn(
                                'font-mono',
                                avgConso > 35 ? 'text-destructive font-semibold' : 'text-muted-foreground'
                              )}>
                                {avgConso.toFixed(1)} L/100
                              </span>
                            ) : '—'}
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              <Select
                                value={v.statut}
                                onValueChange={(val) => updateVehiculeStatus(v.id_camion, val)}
                              >
                                <SelectTrigger className="h-8 w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Disponible">Disponible</SelectItem>
                                  <SelectItem value="En Livraison">En Livraison</SelectItem>
                                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                                  <SelectItem value="Hors Service">Hors Service</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Provider Performance Tab */}
          <TabsContent value="performance">
            <div className="card-industrial p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Classement des Prestataires
              </h2>
              <ProviderLeaderboard stats={providerStats} />
            </div>
          </TabsContent>

          {/* Fuel Tab */}
          <TabsContent value="carburant">
            <div className="card-industrial overflow-x-auto">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Historique Carburant</h2>
              </div>
              {carburant.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Aucun relevé carburant enregistré
                </div>
              ) : (
                <Table className="data-table-industrial">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead className="text-right">Litres</TableHead>
                      <TableHead className="text-right">Compteur</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead className="text-right">Conso. L/100</TableHead>
                      <TableHead className="text-right">Coût</TableHead>
                      <TableHead>Station</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carburant.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(c.date_releve), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-mono font-medium">{c.id_camion}</TableCell>
                        <TableCell className="text-right font-mono">{c.litres} L</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {c.km_compteur.toLocaleString()} km
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {c.km_parcourus ? `${c.km_parcourus.toLocaleString()} km` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.consommation_l_100km !== null ? (
                            <span className={cn(
                              'font-mono font-semibold',
                              c.consommation_l_100km > 35 ? 'text-destructive' :
                              c.consommation_l_100km > 30 ? 'text-warning' : 'text-success'
                            )}>
                              {c.consommation_l_100km.toFixed(1)}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {c.cout_total_dh ? `${c.cout_total_dh.toLocaleString()} DH` : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.station || '—'}</TableCell>
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
