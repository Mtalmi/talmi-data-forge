import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
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
import { Plus, Users, Loader2, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  client_id: string;
  nom_client: string;
  delai_paiement_jours: number | null;
  contact_personne: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  created_at: string;
}

export default function Clients() {
  const { isCeo, isCommercial } = useAuth();
  const canEdit = isCeo || isCommercial;
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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
  }, []);

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

  const getDelaiLabel = (jours: number | null) => {
    if (jours === 0) return 'Comptant';
    return `${jours} jours`;
  };

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
                  {canEdit && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.client_id}>
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
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
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
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
