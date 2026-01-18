import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSalesWorkflow, Devis, BonCommande } from '@/hooks/useSalesWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  Lock,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CalendarIcon,
  MapPin,
  User,
  Phone,
  FileCheck,
  Building2,
  Play,
  Factory,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DevisPdfGenerator from '@/components/quotes/DevisPdfGenerator';
import { BcPdfGenerator } from '@/components/documents/BcPdfGenerator';
import SmartQuoteCalculator from '@/components/quotes/SmartQuoteCalculator';
import { cn } from '@/lib/utils';

const DEVIS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En Attente', color: 'bg-warning/10 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
  accepte: { label: 'Accepté', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
  refuse: { label: 'Refusé', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-3 w-3" /> },
  converti: { label: 'Converti en BC', color: 'bg-primary/10 text-primary border-primary/30', icon: <ArrowRight className="h-3 w-3" /> },
  expire: { label: 'Expiré', color: 'bg-muted text-muted-foreground border-muted', icon: <AlertTriangle className="h-3 w-3" /> },
};

const BC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pret_production: { label: 'Prêt Production', color: 'bg-primary/10 text-primary border-primary/30', icon: <CheckCircle className="h-3 w-3" /> },
  en_production: { label: 'En Production', color: 'bg-warning/10 text-warning border-warning/30', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  livre: { label: 'Livré', color: 'bg-success/10 text-success border-success/30', icon: <Truck className="h-3 w-3" /> },
};

export default function Ventes() {
  const navigate = useNavigate();
  const { isCeo, canCreateBons } = useAuth();
  const { devisList, bcList, loading, stats, fetchData, convertToBc, createBlFromBc, updateDevisStatus } = useSalesWorkflow();
  
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [launchingProduction, setLaunchingProduction] = useState<string | null>(null);
  
  // Enhanced form state
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactChantier, setContactChantier] = useState('');
  const [telephoneChantier, setTelephoneChantier] = useState('');
  const [referenceClient, setReferenceClient] = useState('');
  const [conditionsAcces, setConditionsAcces] = useState('');
  const [pompeRequise, setPompeRequise] = useState(false);
  const [typePompe, setTypePompe] = useState('');
  const [notes, setNotes] = useState('');

  const resetFormState = () => {
    setDeliveryDate(undefined);
    setDeliveryTime('08:00');
    setDeliveryAddress('');
    setContactChantier('');
    setTelephoneChantier('');
    setReferenceClient('');
    setConditionsAcces('');
    setPompeRequise(false);
    setTypePompe('');
    setNotes('');
  };

  const handleConvertToBc = async () => {
    if (!selectedDevis) return;
    
    setConverting(true);
    await convertToBc(selectedDevis, {
      date_livraison_souhaitee: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : undefined,
      heure_livraison_souhaitee: deliveryTime || undefined,
      adresse_livraison: deliveryAddress || undefined,
      contact_chantier: contactChantier || undefined,
      telephone_chantier: telephoneChantier || undefined,
      reference_client: referenceClient || undefined,
      conditions_acces: conditionsAcces || undefined,
      pompe_requise: pompeRequise,
      type_pompe: typePompe || undefined,
      notes: notes || undefined,
    });
    setConverting(false);
    setConvertDialogOpen(false);
    setSelectedDevis(null);
    resetFormState();
  };

  const openConvertDialog = (devis: Devis) => {
    resetFormState();
    setSelectedDevis(devis);
    setDeliveryAddress(devis.client?.adresse || '');
    setConvertDialogOpen(true);
  };

  // Handle launching production from BC - creates BL and navigates to Planning
  const handleLaunchProduction = async (bc: BonCommande) => {
    setLaunchingProduction(bc.bc_id);
    const blId = await createBlFromBc(bc);
    setLaunchingProduction(null);
    
    if (blId) {
      // Navigate to Planning page
      navigate('/planning');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline Commercial</h1>
            <p className="text-muted-foreground">
              Gestion des devis et bons de commande
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
            <SmartQuoteCalculator />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.devisEnAttente}</p>
                  <p className="text-xs text-muted-foreground">Devis en attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bcPretProduction}</p>
                  <p className="text-xs text-muted-foreground">BC prêts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDevisHT.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">DH en devis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Truck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bcLivre}</p>
                  <p className="text-xs text-muted-foreground">BC livrés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Flux Commercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 py-4">
              {/* Devis Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-warning/10 border border-warning/30">
                  <FileText className="h-8 w-8 text-warning" />
                  <p className="font-semibold">{stats.devisEnAttente} Devis</p>
                  <p className="text-xs text-muted-foreground">En Attente</p>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              {/* BC Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                  <p className="font-semibold">{stats.bcPretProduction} BC</p>
                  <p className="text-xs text-muted-foreground">Validés</p>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              {/* Production Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-accent/10 border border-accent/30">
                  <Loader2 className="h-8 w-8 text-accent" />
                  <p className="font-semibold">{stats.bcEnProduction} BC</p>
                  <p className="text-xs text-muted-foreground">En Production</p>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              {/* Delivered Stage */}
              <div className="flex-1 text-center">
                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-success/10 border border-success/30">
                  <Truck className="h-8 w-8 text-success" />
                  <p className="font-semibold">{stats.bcLivre} BC</p>
                  <p className="text-xs text-muted-foreground">Livrés</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Devis and BC */}
        <Tabs defaultValue="devis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="devis" className="gap-2">
              <FileText className="h-4 w-4" />
              Devis ({devisList.length})
            </TabsTrigger>
            <TabsTrigger value="bc" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Bons de Commande ({bcList.length})
            </TabsTrigger>
          </TabsList>

          {/* Devis Tab */}
          <TabsContent value="devis">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : devisList.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun devis enregistré</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Utilisez le Calculateur de Devis pour créer votre premier devis
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Devis</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Formule</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead className="text-right">Prix/m³</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devisList.map((devis) => {
                        const statusConfig = DEVIS_STATUS_CONFIG[devis.statut] || DEVIS_STATUS_CONFIG.en_attente;
                        return (
                          <TableRow key={devis.id}>
                            <TableCell className="font-mono font-medium">{devis.devis_id}</TableCell>
                            <TableCell>{devis.client?.nom_client || '—'}</TableCell>
                            <TableCell>
                              <span className="text-xs">{devis.formule_id}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">{devis.volume_m3} m³</TableCell>
                            <TableCell className="text-right font-mono">{devis.prix_vente_m3.toLocaleString()} DH</TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {devis.total_ht.toLocaleString()} DH
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                                {statusConfig.icon}
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DevisPdfGenerator devis={devis} />
                                {devis.statut === 'en_attente' && devis.client_id && (
                                  <Button
                                    size="sm"
                                    onClick={() => openConvertDialog(devis)}
                                    className="gap-1"
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                    Valider BC
                                  </Button>
                                )}
                                {devis.statut === 'en_attente' && !devis.client_id && (
                                  <span className="text-xs text-muted-foreground">
                                    Client requis
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BC Tab */}
          <TabsContent value="bc">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : bcList.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun bon de commande</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Convertissez un devis pour créer un BC
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° BC</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Formule</TableHead>
                        <TableHead>Date Livraison</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bcList.map((bc) => {
                        const statusConfig = BC_STATUS_CONFIG[bc.statut] || BC_STATUS_CONFIG.pret_production;
                        return (
                          <TableRow key={bc.id}>
                            <TableCell className="font-mono font-medium">{bc.bc_id}</TableCell>
                            <TableCell>{bc.client?.nom_client || '—'}</TableCell>
                            <TableCell>
                              <span className="text-xs">{bc.formule_id}</span>
                            </TableCell>
                            <TableCell>
                              {bc.date_livraison_souhaitee ? (
                                <span className="text-sm">
                                  {format(new Date(bc.date_livraison_souhaitee), 'dd/MM/yyyy', { locale: fr })}
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono">{bc.volume_m3} m³</TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {bc.total_ht.toLocaleString()} DH
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", statusConfig.color)}>
                                {statusConfig.icon}
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {bc.prix_verrouille ? (
                                <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/30">
                                  <Lock className="h-3 w-3" />
                                  Verrouillé
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                                  Modifiable
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {bc.statut === 'pret_production' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleLaunchProduction(bc)}
                                    disabled={launchingProduction === bc.bc_id}
                                    className="gap-1"
                                  >
                                    {launchingProduction === bc.bc_id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Factory className="h-3 w-3" />
                                    )}
                                    Lancer Production
                                  </Button>
                                )}
                                <BcPdfGenerator bc={bc} compact />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Convert to BC Dialog - Professional Order Form */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileCheck className="h-6 w-6 text-primary" />
              Création Bon de Commande Officiel
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevis && (
            <div className="space-y-6">
              {/* Quote Summary Card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Récapitulatif du Devis Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">N° Devis</p>
                      <p className="font-mono font-semibold">{selectedDevis.devis_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Client</p>
                      <p className="font-semibold">{selectedDevis.client?.nom_client}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Formule</p>
                      <p className="font-mono text-sm">{selectedDevis.formule_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Volume</p>
                      <p className="font-semibold">{selectedDevis.volume_m3} m³</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Prix/m³</p>
                      <p className="font-mono">{selectedDevis.prix_vente_m3.toLocaleString()} DH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total HT</p>
                      <p className="font-mono font-bold text-primary text-lg">
                        {selectedDevis.total_ht.toLocaleString()} DH
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  Informations de Livraison
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      Date de livraison *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !deliveryDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryDate ? format(deliveryDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={setDeliveryDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Heure souhaitée
                    </Label>
                    <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Heure" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="06:00">06:00</SelectItem>
                        <SelectItem value="07:00">07:00</SelectItem>
                        <SelectItem value="08:00">08:00</SelectItem>
                        <SelectItem value="09:00">09:00</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="12:00">12:00</SelectItem>
                        <SelectItem value="13:00">13:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                        <SelectItem value="17:00">17:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Adresse du chantier *
                  </Label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Adresse complète du chantier..."
                    rows={2}
                  />
                </div>

                {/* Conditions d'accès */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Conditions d'accès
                  </Label>
                  <Input
                    value={conditionsAcces}
                    onChange={(e) => setConditionsAcces(e.target.value)}
                    placeholder="Ex: Portail bleu, accès par la rue principale..."
                  />
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                  <User className="h-4 w-4" />
                  Contact Chantier
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Nom du contact
                    </Label>
                    <Input
                      value={contactChantier}
                      onChange={(e) => setContactChantier(e.target.value)}
                      placeholder="Responsable chantier..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Téléphone chantier
                    </Label>
                    <Input
                      value={telephoneChantier}
                      onChange={(e) => setTelephoneChantier(e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              {/* Reference & Options */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Références & Options
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Référence client (N° commande interne)</Label>
                    <Input
                      value={referenceClient}
                      onChange={(e) => setReferenceClient(e.target.value)}
                      placeholder="REF-CLIENT-001"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        Pompe à béton requise ?
                      </Label>
                      <Switch
                        checked={pompeRequise}
                        onCheckedChange={setPompeRequise}
                      />
                    </div>

                    {pompeRequise && (
                      <Select value={typePompe} onValueChange={setTypePompe}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type de pompe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pompe_automotrice">Pompe automotrice</SelectItem>
                          <SelectItem value="pompe_stationnaire">Pompe stationnaire</SelectItem>
                          <SelectItem value="pompe_bras">Pompe à bras (36m)</SelectItem>
                          <SelectItem value="pompe_bras_xl">Pompe à bras (42m+)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes / Instructions spéciales</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instructions particulières pour la livraison..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Price Lock Warning */}
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4" />
                  ATTENTION: Prix de vente verrouillé après validation
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Le prix convenu de {selectedDevis.prix_vente_m3.toLocaleString()} DH/m³ sera verrouillé. Seul le CEO pourra modifier ce prix une fois le BC validé.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConvertToBc} 
              disabled={converting || !deliveryDate} 
              className="gap-2"
              size="lg"
            >
              {converting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Valider le Bon de Commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
