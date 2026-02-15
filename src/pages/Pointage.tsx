import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { usePointage } from '@/hooks/usePointage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  LogIn,
  LogOut,
  Users,
  ClipboardList,
  CheckCircle2,
  UserPlus,
  Loader2,
  RefreshCw,
  Building2,
  Smartphone,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Pointage() {
  const { isCeo, isDirecteurOperations, isSuperviseur, user } = useAuth();
  const { t } = useI18n();
  const {
    employes,
    pointages,
    rapports,
    loading,
    fetchPointages,
    fetchRapports,
    clockIn,
    clockOut,
    submitRapport,
    addEmploye,
    validatePointage,
    getTodayPointage,
  } = usePointage();

  const canManage = isCeo || isDirecteurOperations || isSuperviseur;

  // Kiosk mode state
  const [kioskMode, setKioskMode] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState('');
  const [clockingIn, setClockingIn] = useState(false);

  // Add employee dialog state
  const [addEmployeOpen, setAddEmployeOpen] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newRole, setNewRole] = useState('ouvrier');
  const [newTelephone, setNewTelephone] = useState('');
  const [adding, setAdding] = useState(false);

  // Daily report state
  const [reportEmployeId, setReportEmployeId] = useState('');
  const [tachesCompletees, setTachesCompletees] = useState('');
  const [tachesEnCours, setTachesEnCours] = useState('');
  const [problemes, setProblemes] = useState('');
  const [observations, setObservations] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleKioskClockIn = async () => {
    if (!selectedEmploye) return;
    setClockingIn(true);
    await clockIn(selectedEmploye, 'bureau');
    setClockingIn(false);
    setSelectedEmploye('');
  };

  const handleKioskClockOut = async () => {
    if (!selectedEmploye) return;
    setClockingIn(true);
    await clockOut(selectedEmploye);
    setClockingIn(false);
    setSelectedEmploye('');
  };

  const handleAddEmploye = async () => {
    if (!newNom || !newPrenom) return;
    setAdding(true);
    const success = await addEmploye(newNom, newPrenom, newRole, newTelephone);
    setAdding(false);
    if (success) {
      setAddEmployeOpen(false);
      setNewNom('');
      setNewPrenom('');
      setNewRole('ouvrier');
      setNewTelephone('');
    }
  };

  const handleSubmitReport = async () => {
    if (!reportEmployeId || !tachesCompletees) return;
    setSubmittingReport(true);
    const success = await submitRapport(
      reportEmployeId,
      tachesCompletees,
      tachesEnCours,
      problemes,
      observations
    );
    setSubmittingReport(false);
    if (success) {
      setReportEmployeId('');
      setTachesCompletees('');
      setTachesEnCours('');
      setProblemes('');
      setObservations('');
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return format(new Date(dateStr), 'HH:mm', { locale: fr });
  };

  const calculateHours = (entree: string | null, sortie: string | null) => {
    if (!entree || !sortie) return null;
    const diff = new Date(sortie).getTime() - new Date(entree).getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  // Kiosk mode UI
  if (kioskMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Pointage Bureau</CardTitle>
            <p className="text-muted-foreground">Sélectionnez votre nom pour pointer</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select value={selectedEmploye} onValueChange={setSelectedEmploye}>
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder="Choisir un employé..." />
              </SelectTrigger>
              <SelectContent>
                {employes.map((emp) => {
                  const todayPointage = getTodayPointage(emp.id);
                  return (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <span>{emp.prenom} {emp.nom}</span>
                        {todayPointage?.heure_entree && !todayPointage.heure_sortie && (
                          <Badge variant="outline" className="bg-success/10 text-success">Présent</Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedEmploye && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  className="h-20 text-lg gap-3"
                  onClick={handleKioskClockIn}
                  disabled={clockingIn || !!getTodayPointage(selectedEmploye)?.heure_entree}
                >
                  {clockingIn ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <LogIn className="h-6 w-6" />
                  )}
                  Entrée
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 text-lg gap-3"
                  onClick={handleKioskClockOut}
                  disabled={
                    clockingIn ||
                    !getTodayPointage(selectedEmploye)?.heure_entree ||
                    !!getTodayPointage(selectedEmploye)?.heure_sortie
                  }
                >
                  {clockingIn ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <LogOut className="h-6 w-6" />
                  )}
                  Sortie
                </Button>
              </div>
            )}

            <div className="text-center text-4xl font-mono font-bold text-primary">
              {format(new Date(), 'HH:mm:ss', { locale: fr })}
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setKioskMode(false)}
            >
              ← Retour à l'administration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Clock className="h-7 w-7 text-primary" />
              {t.pages.pointage.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.pages.pointage.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                fetchPointages();
                fetchRapports();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={() => setKioskMode(true)} className="gap-2">
              <Building2 className="h-4 w-4" />
              Mode Kiosque
            </Button>
            {canManage && (
              <Dialog open={addEmployeOpen} onOpenChange={setAddEmployeOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Ajouter Employé
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvel Employé</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={newNom}
                          onChange={(e) => setNewNom(e.target.value)}
                          placeholder="SADEK"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prénom</Label>
                        <Input
                          value={newPrenom}
                          onChange={(e) => setNewPrenom(e.target.value)}
                          placeholder="Abdel"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ouvrier">Ouvrier</SelectItem>
                          <SelectItem value="chauffeur">Chauffeur</SelectItem>
                          <SelectItem value="technicien">Technicien</SelectItem>
                          <SelectItem value="magasinier">Magasinier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        value={newTelephone}
                        onChange={(e) => setNewTelephone(e.target.value)}
                        placeholder="+212 6XX XXX XXX"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddEmploye} disabled={adding || !newNom || !newPrenom}>
                      {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employes.length}</p>
                  <p className="text-xs text-muted-foreground">Employés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <LogIn className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {pointages.filter(p => p.heure_entree && !p.heure_sortie).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Présents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {pointages.filter(p => p.heure_sortie).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Terminés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <ClipboardList className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rapports.length}</p>
                  <p className="text-xs text-muted-foreground">Rapports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pointages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pointages" className="gap-2">
              <Clock className="h-4 w-4" />
              Pointages ({pointages.length})
            </TabsTrigger>
            <TabsTrigger value="rapports" className="gap-2">
              <FileText className="h-4 w-4" />
              Rapports ({rapports.length})
            </TabsTrigger>
            <TabsTrigger value="saisie" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Saisie Rapport
            </TabsTrigger>
          </TabsList>

          {/* Pointages Tab */}
          <TabsContent value="pointages">
            <Card>
              <CardHeader>
                <CardTitle>Pointages du {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  </div>
                ) : pointages.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Aucun pointage aujourd'hui
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employé</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Entrée</TableHead>
                        <TableHead>Sortie</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Statut</TableHead>
                        {canManage && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pointages.map((p) => {
                        const hours = calculateHours(p.heure_entree, p.heure_sortie);
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {p.employe?.prenom} {p.employe?.nom}
                            </TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {p.employe?.role}
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatTime(p.heure_entree)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatTime(p.heure_sortie)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {hours ? `${hours}h` : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                {p.source === 'bureau' ? (
                                  <Building2 className="h-3 w-3" />
                                ) : (
                                  <Smartphone className="h-3 w-3" />
                                )}
                                {p.source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {p.valide ? (
                                <Badge className="bg-success/10 text-success border-success/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Validé
                                </Badge>
                              ) : (
                                <Badge variant="outline">En attente</Badge>
                              )}
                            </TableCell>
                            {canManage && (
                              <TableCell>
                                {!p.valide && user?.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => validatePointage(p.id, user.id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rapports Tab */}
          <TabsContent value="rapports">
            <Card>
              <CardHeader>
                <CardTitle>Rapports du {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</CardTitle>
              </CardHeader>
              <CardContent>
                {rapports.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Aucun rapport soumis aujourd'hui
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rapports.map((r) => (
                      <Card key={r.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold">
                                {r.employe?.prenom} {r.employe?.nom}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {r.employe?.role} • {format(new Date(r.soumis_at), 'HH:mm', { locale: fr })}
                              </p>
                            </div>
                            {r.valide ? (
                              <Badge className="bg-success/10 text-success">Validé</Badge>
                            ) : (
                              <Badge variant="outline">En attente</Badge>
                            )}
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground">Tâches complétées:</p>
                              <p>{r.taches_completees}</p>
                            </div>
                            {r.taches_en_cours && (
                              <div>
                                <p className="font-medium text-muted-foreground">En cours:</p>
                                <p>{r.taches_en_cours}</p>
                              </div>
                            )}
                            {r.problemes_rencontres && (
                              <div>
                                <p className="font-medium text-destructive">Problèmes:</p>
                                <p>{r.problemes_rencontres}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saisie Rapport Tab */}
          <TabsContent value="saisie">
            <Card>
              <CardHeader>
                <CardTitle>Soumettre un Rapport Journalier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Employé</Label>
                  <Select value={reportEmployeId} onValueChange={setReportEmployeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employes.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.prenom} {emp.nom} - {emp.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tâches complétées *</Label>
                  <Textarea
                    value={tachesCompletees}
                    onChange={(e) => setTachesCompletees(e.target.value)}
                    placeholder="Décrivez les tâches terminées aujourd'hui..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tâches en cours</Label>
                  <Textarea
                    value={tachesEnCours}
                    onChange={(e) => setTachesEnCours(e.target.value)}
                    placeholder="Tâches non terminées à continuer..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Problèmes rencontrés</Label>
                  <Textarea
                    value={problemes}
                    onChange={(e) => setProblemes(e.target.value)}
                    placeholder="Pannes, retards, difficultés..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observations</Label>
                  <Textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Autres remarques..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSubmitReport}
                  disabled={submittingReport || !reportEmployeId || !tachesCompletees}
                  className="w-full"
                >
                  {submittingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ClipboardList className="h-4 w-4 mr-2" />
                  )}
                  Soumettre le Rapport
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
