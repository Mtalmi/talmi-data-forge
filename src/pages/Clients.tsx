import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import MainLayout from '@/components/layout/MainLayout';
import SmartQuoteCalculator from '@/components/quotes/SmartQuoteCalculator';
import { useAuth } from '@/hooks/useAuth';
import { usePreviewRole } from '@/hooks/usePreviewRole';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
import { ExportButton } from '@/components/documents/ExportButton';
import { CreditScoreDashboard } from '@/components/clients/CreditScoreDashboard';
import CreditScoreTrendDashboard from '@/components/clients/CreditScoreTrendDashboard';
import { ClientInvoicesDialog } from '@/components/clients/ClientInvoicesDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus, 
  Users, 
  Loader2, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Ban, 
  Unlock, 
  FileWarning, 
  AlertTriangle,
  CheckCircle,
  Copy,
  TrendingUp,
  History,
  ChevronRight,
  Upload,
  FileText,
  X,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Client {
  client_id: string;
  nom_client: string;
  delai_paiement_jours: number | null;
  contact_personne: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  rc: string | null;
  ice: string | null;
  identifiant_fiscal: string | null;
  patente: string | null;
  rc_document_url: string | null;
  solde_du: number | null;
  limite_credit_dh: number | null;
  credit_bloque: boolean | null;
  created_at: string;
}

export default function Clients() {
  const { isCeo, isCommercial, isAgentAdministratif, canEditClients, isDirecteurOperations } = useAuth();
  const { t } = useI18n();
  const { previewRole } = usePreviewRole();
  const { blockClient, unblockClient, generateMiseEnDemeure, checkPaymentDelays } = usePaymentDelays();
  
  // Check if currently previewing as Directeur Opérations
  const isPreviewingAsDirecteur = previewRole === 'directeur_operations';
  
  // Directeur Opérations (real or preview) can VIEW but not EDIT
  // Disable editing when previewing as any non-editing role
  const canEdit = (canEditClients && !isDirecteurOperations) && !isPreviewingAsDirecteur;
  const canBlock = isCeo && !previewRole;
  const canSendNotice = (isCeo || isAgentAdministratif) && !isPreviewingAsDirecteur;
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Invoice dialog state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  
  // Edit mode state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [clientId, setClientId] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [delaiPaiement, setDelaiPaiement] = useState('30');
  const [contactPersonne, setContactPersonne] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [rc, setRc] = useState('');
  const [ice, setIce] = useState('');
  const [identifiantFiscal, setIdentifiantFiscal] = useState('');
  const [patente, setPatente] = useState('');
  const [rcDocument, setRcDocument] = useState<File | null>(null);
  const [rcDocumentPreview, setRcDocumentPreview] = useState<string | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    fetchClients();
    // Check payment delays on load
    if (isCeo || isAgentAdministratif) {
      checkPaymentDelays();
    }
  }, [isCeo, isAgentAdministratif]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error(t.pages.clients.loadError);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientId('');
    setNomClient('');
    setDelaiPaiement('30');
    setContactPersonne('');
    setTelephone('');
    setEmail('');
    setAdresse('');
    setVille('');
    setCodePostal('');
    setRc('');
    setIce('');
    setIdentifiantFiscal('');
    setPatente('');
    setRcDocument(null);
    setRcDocumentPreview(null);
    setEditingClient(null);
    setIsEditMode(false);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsEditMode(true);
    setClientId(client.client_id);
    setNomClient(client.nom_client);
    setDelaiPaiement(String(client.delai_paiement_jours || 30));
    setContactPersonne(client.contact_personne || '');
    setTelephone(client.telephone || '');
    setEmail(client.email || '');
    setAdresse(client.adresse || '');
    setVille(client.ville || '');
    setCodePostal(client.code_postal || '');
    setRc(client.rc || '');
    setIce(client.ice || '');
    setIdentifiantFiscal(client.identifiant_fiscal || '');
    setPatente(client.patente || '');
    setRcDocumentPreview(client.rc_document_url || null);
    setDialogOpen(true);
  };

  const handleRcDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format non supporté. Utilisez JPG, PNG, WebP ou PDF.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fichier trop volumineux. Maximum 5 Mo.');
        return;
      }
      setRcDocument(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setRcDocumentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setRcDocumentPreview(null);
      }
    }
  };

  const uploadRcDocument = async (clientIdForUpload: string): Promise<string | null> => {
    if (!rcDocument) return null;
    
    try {
      setUploadingDocument(true);
      const fileExt = rcDocument.name.split('.').pop();
      const fileName = `${clientIdForUpload}-rc-${Date.now()}.${fileExt}`;
      const filePath = `rc/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, rcDocument);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading RC document:', error);
      toast.error('Erreur lors de l\'upload du document RC');
      return null;
    } finally {
      setUploadingDocument(false);
    }
  };

  const removeRcDocument = () => {
    setRcDocument(null);
    setRcDocumentPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!clientId || !nomClient) {
        toast.error(t.pages.clients.idAndNameRequired);
        setSubmitting(false);
        return;
      }

      // Validate ICE format (must be exactly 15 digits if provided)
      if (ice && !/^\d{15}$/.test(ice)) {
        toast.error(t.pages.clients.iceInvalid);
        setSubmitting(false);
        return;
      }

      // Upload RC document first if provided (new upload)
      let rcDocumentUrl: string | null = editingClient?.rc_document_url || null;
      if (rcDocument) {
        rcDocumentUrl = await uploadRcDocument(clientId);
      }

      const clientData = {
        nom_client: nomClient,
        delai_paiement_jours: parseInt(delaiPaiement),
        contact_personne: contactPersonne || null,
        telephone: telephone || null,
        email: email || null,
        adresse: adresse || null,
        ville: ville || null,
        code_postal: codePostal || null,
        rc: rc || null,
        ice: ice || null,
        identifiant_fiscal: identifiantFiscal || null,
        patente: patente || null,
        rc_document_url: rcDocumentUrl,
      };

      if (isEditMode && editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('client_id', editingClient.client_id);

        if (error) throw error;
        toast.success(t.pages.clients.clientUpdated);
      } else {
        // Create new client
        const { error } = await supabase.from('clients').insert([{
          client_id: clientId,
          ...clientData,
        }]);

        if (error) {
          if (error.code === '23505') {
            toast.error(t.pages.bons?.existsAlready || 'Ce client existe déjà');
          } else {
            throw error;
          }
          setSubmitting(false);
          return;
        }
        toast.success(t.pages.clients.clientCreated);
      }

      resetForm();
      setDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(isEditMode ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.pages.clients.deleteClient)) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('client_id', id);

      if (error) throw error;
      toast.success(t.pages.clients.clientDeleted);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleBlock = async (clientId: string, isBlocked: boolean | null) => {
    if (isBlocked) {
      await unblockClient(clientId);
    } else {
      if (!confirm(t.pages.clients.blockClient)) return;
      await blockClient(clientId, 'Blocage manuel par CEO');
    }
    fetchClients();
  };

  const handleSendNotice = async (clientId: string) => {
    const result = await generateMiseEnDemeure(clientId);
    if (result.success && result.content) {
      setNoticeContent(result.content);
      setNoticeDialogOpen(true);
    }
  };

  const copyNotice = () => {
    navigator.clipboard.writeText(noticeContent);
    toast.success('Copié dans le presse-papiers');
  };

  const getDelaiLabel = (jours: number | null) => {
    if (jours === 0) return 'Comptant';
    return `${jours} jours`;
  };

  const getClientStatus = (client: Client) => {
    if (client.credit_bloque) {
      return { status: 'blocked', label: t.pages.clients.blocked, color: 'text-destructive bg-destructive/10' };
    }
    if (client.solde_du && client.solde_du > (client.limite_credit_dh || 50000)) {
      return { status: 'overlimit', label: t.pages.clients.overlimit, color: 'text-warning bg-warning/10' };
    }
    if (client.solde_du && client.solde_du > 0) {
      return { status: 'debt', label: t.pages.clients.debtLabel, color: 'text-muted-foreground bg-muted' };
    }
    return { status: 'ok', label: t.pages.clients.ok, color: 'text-success bg-success/10' };
  };

  const clientsWithDebt = clients.filter(c => c.solde_du && c.solde_du > 0);
  const blockedClients = clients.filter(c => c.credit_bloque);

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{t.pages.clients.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              {t.pages.clients.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButton
              data={clients.map(c => ({
                id: c.client_id,
                nom: c.nom_client,
                contact: c.contact_personne || '',
                telephone: c.telephone || '',
                email: c.email || '',
                delai: c.delai_paiement_jours || 30,
                solde_du: c.solde_du || 0,
                limite_credit: c.limite_credit_dh || 50000,
                bloque: c.credit_bloque ? 'Oui' : 'Non',
              }))}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'nom', label: 'Entreprise' },
                { key: 'contact', label: 'Contact' },
                { key: 'telephone', label: 'Téléphone' },
                { key: 'email', label: 'Email' },
                { key: 'delai', label: 'Délai (jours)' },
                { key: 'solde_du', label: 'Solde Dû (DH)' },
                { key: 'limite_credit', label: 'Limite Crédit (DH)' },
                { key: 'bloque', label: 'Bloqué' },
              ]}
              filename="clients"
            />
            
            {/* Smart Quote Calculator */}
            <SmartQuoteCalculator />
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.pages.clients.newClient}
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? t.pages.clients.editClient : t.pages.clients.createClient}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.clients.clientId}</Label>
                      <Input
                        placeholder="CLI-001"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        required
                        disabled={isEditMode}
                        className={isEditMode ? 'bg-muted' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.clients.paymentDelay}</Label>
                      <Select value={delaiPaiement} onValueChange={setDelaiPaiement}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="0">{t.pages.clients.cash}</SelectItem>
                           <SelectItem value="30">30 {t.pages.clients.days}</SelectItem>
                           <SelectItem value="60">60 {t.pages.clients.days}</SelectItem>
                           <SelectItem value="90">90 {t.pages.clients.days}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="form-label-industrial">{t.pages.clients.companyName}</Label>
                    <Input
                      placeholder="Entreprise ABC"
                      value={nomClient}
                      onChange={(e) => setNomClient(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.clients.contact}</Label>
                      <Input
                        placeholder="M. Dupont"
                        value={contactPersonne}
                        onChange={(e) => setContactPersonne(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.clients.phone}</Label>
                      <Input
                        placeholder="+212 6XX XXX XXX"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="form-label-industrial">{t.pages.clients.email}</Label>
                    <Input
                      type="email"
                      placeholder="contact@entreprise.ma"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="form-label-industrial">{t.pages.clients.address}</Label>
                    <Input
                      placeholder="Adresse complète"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.clients.city}</Label>
                      <Input
                        placeholder="Casablanca"
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">{t.pages.clients.postalCode}</Label>
                      <Input
                        placeholder="20000"
                        value={codePostal}
                        onChange={(e) => setCodePostal(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Business Identifiers Section */}
                  <div className="border-t pt-4 mt-4">
                     <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                       {t.pages.clients.legalIds}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="form-label-industrial">{t.pages.clients.rc}</Label>
                        <Input
                          placeholder="123456"
                          value={rc}
                          onChange={(e) => setRc(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                         <Label className="form-label-industrial">
                           {t.pages.clients.ice} <span className="text-xs text-muted-foreground font-normal">({t.pages.clients.iceDigitsFormat})</span>
                         </Label>
                        <Input
                          placeholder="001234567890123"
                          value={ice}
                          onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/\D/g, '');
                            setIce(value);
                          }}
                          maxLength={15}
                          className={cn(
                            ice && ice.length > 0 && ice.length !== 15 && "border-warning focus-visible:ring-warning"
                          )}
                        />
                        {ice && ice.length > 0 && ice.length !== 15 && (
                          <p className="text-xs text-warning flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                             {15 - ice.length} {t.pages.clients.digitsRemaining}
                          </p>
                        )}
                        {ice && ice.length === 15 && (
                          <p className="text-xs text-success flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {t.pages.clients.validFormat}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="form-label-industrial">{t.pages.clients.ifLabel}</Label>
                        <Input
                          placeholder="12345678"
                          value={identifiantFiscal}
                          onChange={(e) => setIdentifiantFiscal(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="form-label-industrial">{t.pages.clients.patent}</Label>
                        <Input
                          placeholder="12345678"
                          value={patente}
                          onChange={(e) => setPatente(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* RC Document Upload */}
                    <div className="mt-4 space-y-2">
                      <Label className="form-label-industrial">{t.pages.clients.rcDocumentUpload}</Label>
                      {!rcDocument ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleRcDocumentChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                             <p className="text-sm text-muted-foreground">
                               {t.pages.clients.clickOrDrop}
                             </p>
                             <p className="text-xs text-muted-foreground mt-1">
                               {t.pages.clients.maxFileSize}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-center gap-3">
                            {rcDocumentPreview ? (
                              <img 
                                src={rcDocumentPreview} 
                                alt="Aperçu RC" 
                                className="w-16 h-16 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center bg-muted rounded border">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{rcDocument.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(rcDocument.size / 1024).toFixed(1)} Ko
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={removeRcDocument}
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                     <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                       {t.common.cancel}
                     </Button>
                     <Button type="submit" disabled={submitting || uploadingDocument}>
                       {submitting || uploadingDocument ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           {uploadingDocument ? t.pages.clients.uploading : (isEditMode ? t.pages.clients.updating : t.pages.clients.creating)}
                         </>
                       ) : (
                         isEditMode ? t.common.save : t.pages.clients.createClient
                       )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </div>

        {/* Tabs for List and Credit Scores */}
        <Tabs defaultValue="list" className="space-y-4">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-full sm:w-auto inline-flex">
              <TabsTrigger value="list" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 min-h-[40px]">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Liste</span> Clients
              </TabsTrigger>
              <TabsTrigger value="credit-scores" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 min-h-[40px]">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Scores de</span> Crédit
              </TabsTrigger>
              <TabsTrigger value="credit-history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 min-h-[40px]">
                <History className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Historique</span>
                <span className="sm:hidden">Hist.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="space-y-4">
            {/* CEO Quick Stats */}
            {isCeo && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-industrial p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.pages.clients.totalClientsLabel}</p>
                      <p className="text-xl font-bold">{clients.length}</p>
                    </div>
                  </div>
                </div>
                <div className="card-industrial p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.pages.clients.outstandingDues}</p>
                      <p className="text-xl font-bold">{clientsWithDebt.length}</p>
                    </div>
                  </div>
                </div>
                <div className="card-industrial p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Ban className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.pages.clients.blockedLabel}</p>
                      <p className="text-xl font-bold">{blockedClients.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
        <div className="card-industrial overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{t.pages.clients.noClients}</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                   <TableHead>ID</TableHead>
                   <TableHead>{t.pages.clients.entreprise}</TableHead>
                   <TableHead>{t.pages.clients.contact}</TableHead>
                   <TableHead>{t.pages.clients.phone}</TableHead>
                   <TableHead>{t.pages.clients.delai}</TableHead>
                   <TableHead>{t.pages.clients.statut}</TableHead>
                   {(isCeo || isAgentAdministratif) && <TableHead className="text-right">{t.pages.clients.soldeDu}</TableHead>}
                   <TableHead className="w-8"></TableHead>
                  {canEdit && <TableHead className="w-32">{t.pages.clients.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const status = getClientStatus(c);
                  return (
                    <TableRow 
                      key={c.client_id} 
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/50',
                        c.credit_bloque ? 'opacity-60' : ''
                      )}
                      onClick={() => {
                        setSelectedClient({ id: c.client_id, name: c.nom_client });
                        setInvoiceDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-mono font-medium">{c.client_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.nom_client}</p>
                          {c.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{c.contact_personne || '—'}</TableCell>
                      <TableCell>
                        {c.telephone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.telephone}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <span className="status-pill pending">
                          {getDelaiLabel(c.delai_paiement_jours)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', status.color)}>
                          {status.status === 'blocked' && <Ban className="h-3 w-3" />}
                          {status.status === 'overlimit' && <AlertTriangle className="h-3 w-3" />}
                          {status.status === 'ok' && <CheckCircle className="h-3 w-3" />}
                          {status.label}
                        </span>
                      </TableCell>
                      {(isCeo || isAgentAdministratif) && (
                        <TableCell className="text-right">
                          {c.solde_du && c.solde_du > 0 ? (
                            <span className={cn('font-mono font-medium', c.solde_du > (c.limite_credit_dh || 50000) ? 'text-destructive' : 'text-warning')}>
                              {c.solde_du.toLocaleString()} DH
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {/* Chevron indicator for clickable row */}
                      <TableCell className="w-8 pr-0">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      {canEdit && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              title="Modifier le client"
                              onClick={() => openEditDialog(c)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* Block/Unblock - CEO only */}
                            {canBlock && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn('h-8 w-8 p-0', c.credit_bloque ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive')}
                                onClick={() => handleBlock(c.client_id, c.credit_bloque)}
                                title={c.credit_bloque ? 'Débloquer le client' : 'Bloquer le client'}
                              >
                                {c.credit_bloque ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </Button>
                            )}

                            {/* Send Notice - CEO or Agent Admin */}
                            {canSendNotice && c.solde_du && c.solde_du > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-warning hover:text-warning"
                                onClick={() => handleSendNotice(c.client_id)}
                                title="Envoyer une Mise en Demeure"
                              >
                                <FileWarning className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {isCeo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(c.client_id)}
                                title="Supprimer le client"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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

          <TabsContent value="credit-scores">
            <CreditScoreDashboard />
          </TabsContent>

          <TabsContent value="credit-history">
            <CreditScoreTrendDashboard />
          </TabsContent>
        </Tabs>

        {/* Client Invoices Dialog */}
        {selectedClient && (
          <ClientInvoicesDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            clientId={selectedClient.id}
            clientName={selectedClient.name}
          />
        )}

        {/* Mise en Demeure Dialog */}
        <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mise en Demeure Générée</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                {noticeContent}
              </pre>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={copyNotice}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
