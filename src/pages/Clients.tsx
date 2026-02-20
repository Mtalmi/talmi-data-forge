import { useEffect, useState } from 'react';
import WorldClassClients from '@/components/clients/WorldClassClients';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { getNumberLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
import SmartQuoteCalculator from '@/components/quotes/SmartQuoteCalculator';
import { ClientPortalDashboard } from '@/components/client-portal/ClientPortalDashboard';
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
  const { t, lang } = useI18n();
  const numberLocale = getNumberLocale(lang);
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
  
  // Portal dialog state
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [portalClient, setPortalClient] = useState<{ id: string; name: string } | null>(null);
  
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
        toast.error(t.pages.clients.unsupportedFormat);
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t.pages.clients.fileTooLarge);
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
      toast.error(t.pages.clients.uploadError);
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
      toast.error(isEditMode ? t.pages.clients.updateError : t.pages.clients.createError);
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
      toast.error(t.pages.clients.deleteError);
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
    toast.success(t.pages.clients.copied);
  };

  const getDelaiLabel = (jours: number | null) => {
    if (jours === 0) return t.pages.clients.cashLabel;
    return `${jours} ${t.pages.clients.days}`;
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
      <WorldClassClients />
      {/* Legacy content hidden — WorldClassClients is the active UI */}
    </MainLayout>
  );
}
