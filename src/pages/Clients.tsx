import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentDelays } from '@/hooks/usePaymentDelays';
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
  Copy
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
  solde_du: number | null;
  limite_credit_dh: number | null;
  credit_bloque: boolean | null;
  created_at: string;
}

export default function Clients() {
  const { isCeo, isCommercial, isAgentAdministratif } = useAuth();
  const { blockClient, unblockClient, generateMiseEnDemeure, checkPaymentDelays } = usePaymentDelays();
  const canEdit = isCeo || isCommercial || isAgentAdministratif;
  const canBlock = isCeo;
  const canSendNotice = isCeo || isAgentAdministratif;
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [clientId, setClientId] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [delaiPaiement, setDelaiPaiement] = useState('30');
  const [contactPersonne, setContactPersonne] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');

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
      toast.error('Erreur lors du chargement des clients');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!clientId || !nomClient) {
        toast.error('ID et Nom du client requis');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('clients').insert([{
        client_id: clientId,
        nom_client: nomClient,
        delai_paiement_jours: parseInt(delaiPaiement),
        contact_personne: contactPersonne || null,
        telephone: telephone || null,
        email: email || null,
        adresse: adresse || null,
      }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Ce client existe déjà');
        } else {
          throw error;
        }
        setSubmitting(false);
        return;
      }

      toast.success('Client créé avec succès');
      resetForm();
      setDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('client_id', id);

      if (error) throw error;
      toast.success('Client supprimé');
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
      if (!confirm('Bloquer ce client ? Il ne pourra plus passer de commandes.')) return;
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
      return { status: 'blocked', label: 'Bloqué', color: 'text-destructive bg-destructive/10' };
    }
    if (client.solde_du && client.solde_du > (client.limite_credit_dh || 50000)) {
      return { status: 'overlimit', label: 'Hors Limite', color: 'text-warning bg-warning/10' };
    }
    if (client.solde_du && client.solde_du > 0) {
      return { status: 'debt', label: 'Solde Dû', color: 'text-muted-foreground bg-muted' };
    }
    return { status: 'ok', label: 'OK', color: 'text-success bg-success/10' };
  };

  const clientsWithDebt = clients.filter(c => c.solde_du && c.solde_du > 0);
  const blockedClients = clients.filter(c => c.credit_bloque);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des clients et conditions de paiement
            </p>
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer un Client</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">ID Client</Label>
                      <Input
                        placeholder="CLI-001"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Délai Paiement</Label>
                      <Select value={delaiPaiement} onValueChange={setDelaiPaiement}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Comptant</SelectItem>
                          <SelectItem value="30">30 jours</SelectItem>
                          <SelectItem value="60">60 jours</SelectItem>
                          <SelectItem value="90">90 jours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="form-label-industrial">Nom de l'entreprise</Label>
                    <Input
                      placeholder="Entreprise ABC"
                      value={nomClient}
                      onChange={(e) => setNomClient(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Contact</Label>
                      <Input
                        placeholder="M. Dupont"
                        value={contactPersonne}
                        onChange={(e) => setContactPersonne(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="form-label-industrial">Téléphone</Label>
                      <Input
                        placeholder="+212 6XX XXX XXX"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="form-label-industrial">Email</Label>
                    <Input
                      type="email"
                      placeholder="contact@entreprise.ma"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="form-label-industrial">Adresse</Label>
                    <Input
                      placeholder="Adresse complète"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* CEO Quick Stats */}
        {isCeo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-industrial p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Clients</p>
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Soldes Dus</p>
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bloqués</p>
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
              <p className="text-muted-foreground">Aucun client enregistré</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Statut</TableHead>
                  {(isCeo || isAgentAdministratif) && <TableHead className="text-right">Solde Dû</TableHead>}
                  {canEdit && <TableHead className="w-32">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const status = getClientStatus(c);
                  return (
                    <TableRow key={c.client_id} className={c.credit_bloque ? 'opacity-60' : ''}>
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
                      {canEdit && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* Block/Unblock - CEO only */}
                            {canBlock && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn('h-8 w-8 p-0', c.credit_bloque ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive')}
                                onClick={() => handleBlock(c.client_id, c.credit_bloque)}
                                title={c.credit_bloque ? 'Débloquer' : 'Bloquer'}
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
                                title="Mise en Demeure"
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
