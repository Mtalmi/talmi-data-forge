import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { 
  FileText, 
  Plus, 
  Truck, 
  Tractor, 
  MapPin, 
  Upload, 
  Loader2, 
  ExternalLink,
  Calendar,
  DollarSign,
  Shield,
  Building,
  Check,
  X,
  AlertTriangle,
  TrendingDown,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContractCompliance } from '@/hooks/useContractCompliance';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ContractType = 'camion_rental' | 'trax_rental' | 'terrain_rental';

interface Contract {
  id: string;
  contract_type: ContractType;
  title: string;
  description: string | null;
  provider_name: string;
  monthly_amount: number;
  start_date: string;
  end_date: string | null;
  pdf_url: string;
  is_active: boolean;
  ras_applicable: boolean;
  ras_rate: number;
  created_at: string;
}

const CONTRACT_TYPE_CONFIG: Record<ContractType, { label: string; icon: React.ReactNode; color: string }> = {
  camion_rental: { 
    label: 'Location Camion', 
    icon: <Truck className="h-4 w-4" />, 
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' 
  },
  trax_rental: { 
    label: 'Location Trax', 
    icon: <Tractor className="h-4 w-4" />, 
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' 
  },
  terrain_rental: { 
    label: 'Location Terrain', 
    icon: <MapPin className="h-4 w-4" />, 
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
  },
};

export default function Contracts() {
  const { user, canApproveDevis, isCeo } = useAuth();
  const { stats, expirationAlerts, suppliers } = useContractCompliance();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [contractType, setContractType] = useState<ContractType>('camion_rental');
  const [title, setTitle] = useState('');
  const [providerName, setProviderName] = useState('');
  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [equipmentCount, setEquipmentCount] = useState('1');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des contrats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${contractType}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      setPdfUrl(urlData.publicUrl);
      setPdfFileName(file.name);
      toast.success('PDF téléchargé avec succès');
    } catch (error: any) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setContractType('camion_rental');
    setTitle('');
    setProviderName('');
    setSelectedFournisseur('');
    setMonthlyAmount('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setContactPerson('');
    setContactPhone('');
    setContactEmail('');
    setEquipmentCount('1');
    setEquipmentDescription('');
    setPdfUrl('');
    setPdfFileName('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !providerName.trim() || !monthlyAmount || !startDate || !pdfUrl) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .insert({
          contract_type: contractType,
          title: title.trim(),
          description: description.trim() || null,
          provider_name: providerName.trim(),
          fournisseur_id: selectedFournisseur && selectedFournisseur !== 'none' ? selectedFournisseur : null,
          monthly_amount: parseFloat(monthlyAmount),
          start_date: startDate,
          end_date: endDate || null,
          pdf_url: pdfUrl,
          is_active: true,
          ras_applicable: contractType === 'terrain_rental',
          ras_rate: contractType === 'terrain_rental' ? 15 : 0,
          contact_person: contactPerson.trim() || null,
          contact_phone: contactPhone.trim() || null,
          contact_email: contactEmail.trim() || null,
          equipment_count: parseInt(equipmentCount) || 1,
          equipment_description: equipmentDescription.trim() || null,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Contrat ajouté avec succès');
      setDialogOpen(false);
      resetForm();
      fetchContracts();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout du contrat');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleContractStatus = async (contract: Contract) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ is_active: !contract.is_active })
        .eq('id', contract.id);

      if (error) throw error;

      toast.success(`Contrat ${contract.is_active ? 'désactivé' : 'activé'}`);
      fetchContracts();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const groupedContracts = {
    camion_rental: contracts.filter(c => c.contract_type === 'camion_rental'),
    trax_rental: contracts.filter(c => c.contract_type === 'trax_rental'),
    terrain_rental: contracts.filter(c => c.contract_type === 'terrain_rental'),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Contrats de Location
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion des contrats de location (Camion, Trax, Terrain)
            </p>
          </div>
          
          {canApproveDevis && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau Contrat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Ajouter un Contrat
                  </DialogTitle>
                  <DialogDescription>
                    Téléchargez le PDF du contrat et renseignez les informations
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Contract Type */}
                  <div className="space-y-2">
                    <Label>Type de Contrat *</Label>
                    <Select value={contractType} onValueChange={(v) => setContractType(v as ContractType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTRACT_TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {config.icon}
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Terrain Rental RAS Notice */}
                  {contractType === 'terrain_rental' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <Shield className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-amber-500">
                        <strong>RAS 15%</strong> sera automatiquement appliquée aux dépenses liées à ce contrat
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-2">
                    <Label>Titre du Contrat *</Label>
                    <Input 
                      placeholder="Ex: Location Camion Benne 20T" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Provider */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prestataire *</Label>
                      <Input 
                        placeholder="Nom du prestataire" 
                        value={providerName}
                        onChange={(e) => setProviderName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lier à Fournisseur</Label>
                      <Select value={selectedFournisseur} onValueChange={setSelectedFournisseur}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nom_fournisseur}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Monthly Amount & Equipment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Montant Mensuel (MAD) *</Label>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={monthlyAmount}
                        onChange={(e) => setMonthlyAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre d'Équipements</Label>
                      <Input 
                        type="number"
                        placeholder="1" 
                        value={equipmentCount}
                        onChange={(e) => setEquipmentCount(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Equipment Description */}
                  <div className="space-y-2">
                    <Label>Description Équipement</Label>
                    <Input 
                      placeholder="Ex: Camion 1 (MAT-123), Camion 2 (MAT-456)" 
                      value={equipmentDescription}
                      onChange={(e) => setEquipmentDescription(e.target.value)}
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date Début *</Label>
                      <Input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date Fin</Label>
                      <Input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <Separator />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personne de Contact
                    </Label>
                    <Input 
                      placeholder="Nom du contact" 
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </Label>
                      <Input 
                        placeholder="+212 6XX XXX XXX" 
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input 
                        type="email"
                        placeholder="contact@example.com" 
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* PDF Upload */}
                  <Separator />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Document PDF *
                    </Label>
                    
                    {pdfUrl ? (
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                        <FileText className="h-5 w-5 text-success" />
                        <span className="text-sm flex-1 truncate">{pdfFileName}</span>
                        <Check className="h-4 w-4 text-success" />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setPdfUrl(''); setPdfFileName(''); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                          "hover:border-primary hover:bg-primary/5",
                          "flex flex-col items-center gap-2"
                        )}
                      >
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Cliquez pour télécharger le PDF
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Notes (optionnel)</Label>
                    <Textarea 
                      placeholder="Notes additionnelles" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitting || !pdfUrl}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Compliance Summary Banner */}
        {stats.missingContracts > 0 && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-warning">
                  ⚠️ {stats.missingContracts} contrats manquants détectés
                </span>
                <span className="text-muted-foreground ml-2">
                  Risque fiscal: {stats.potentialNonDeductible.toLocaleString('fr-FR')} DH/an
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-warning text-warning hover:bg-warning/10"
                onClick={() => setDialogOpen(true)}
              >
                Ajouter Contrats
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className={cn(
              "absolute inset-0 opacity-10",
              stats.complianceRate >= 90 ? "bg-success" : 
              stats.complianceRate >= 70 ? "bg-warning" : "bg-destructive"
            )} />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Taux de Conformité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={cn(
                  "text-3xl font-bold",
                  stats.complianceRate >= 90 ? "text-success" : 
                  stats.complianceRate >= 70 ? "text-warning" : "text-destructive"
                )}>
                  {stats.complianceRate}%
                </span>
              </div>
              <Progress 
                value={stats.complianceRate} 
                className={cn(
                  "h-2",
                  stats.complianceRate >= 90 ? "[&>div]:bg-success" : 
                  stats.complianceRate >= 70 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                )} 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contrats Actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.activeContracts}</span>
                <span className="text-sm text-muted-foreground">/ {stats.totalContracts}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.missingContracts > 0 && (
                  <span className="text-warning">{stats.missingContracts} manquants</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Mensuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {stats.monthlyTotal.toLocaleString('fr-FR')}
                <span className="text-sm font-normal text-muted-foreground ml-1">DH</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats.monthlyTotal * 12).toLocaleString('fr-FR')} DH/an
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            stats.expiringSoon > 0 && "border-warning/50"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Expirations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  stats.expiringSoon > 0 ? "text-warning" : "text-success"
                )}>
                  {stats.expiringSoon}
                </span>
                <span className="text-sm text-muted-foreground">&lt; 30 jours</span>
              </div>
              {expirationAlerts.length > 0 && (
                <p className="text-xs text-warning mt-1">
                  Prochain: {expirationAlerts[0]?.providerName}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(CONTRACT_TYPE_CONFIG).map(([type, config]) => {
            const typeContracts = groupedContracts[type as ContractType];
            const activeCount = typeContracts.filter(c => c.is_active).length;
            const totalMonthly = typeContracts
              .filter(c => c.is_active)
              .reduce((sum, c) => sum + c.monthly_amount, 0);

            return (
              <Card key={type} className="relative overflow-hidden">
                <div className={cn("absolute inset-0 opacity-5", config.color.split(' ')[0])} />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge className={cn("gap-1", config.color)}>
                      {config.icon}
                      {config.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{activeCount}</span>
                    <span className="text-sm text-muted-foreground">contrat(s) actif(s)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total mensuel: <span className="font-mono font-semibold text-foreground">
                      {totalMonthly.toLocaleString()} MAD
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Contrats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun contrat enregistré</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Montant/mois</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>RAS</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const config = CONTRACT_TYPE_CONFIG[contract.contract_type];
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Badge className={cn("gap-1", config.color)}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{contract.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {contract.provider_name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {contract.monthly_amount.toLocaleString()} MAD
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(contract.start_date), 'dd/MM/yy', { locale: fr })}
                            {contract.end_date && (
                              <>
                                {' → '}
                                {format(new Date(contract.end_date), 'dd/MM/yy', { locale: fr })}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contract.ras_applicable ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                              {contract.ras_rate}% RAS
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={contract.is_active ? 'default' : 'secondary'}
                            className={contract.is_active ? 'bg-success/10 text-success border-success/30' : ''}
                          >
                            {contract.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(contract.pdf_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {canApproveDevis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleContractStatus(contract)}
                              >
                                {contract.is_active ? (
                                  <X className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Check className="h-4 w-4 text-success" />
                                )}
                              </Button>
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
      </div>
    </MainLayout>
  );
}
