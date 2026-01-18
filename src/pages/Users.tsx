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
import { Plus, Shield, Loader2, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type AppRole = 'ceo' | 'operator' | 'accounting' | 'commercial' | 'superviseur' | 'responsable_technique' | 'directeur_operations' | 'agent_administratif' | 'centraliste';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

const ROLE_CONFIG: Record<string, { label: string; description: string; className: string }> = {
  ceo: { 
    label: 'CEO', 
    description: 'Accès complet • Approbations • Prix d\'achat', 
    className: 'bg-primary/20 text-primary' 
  },
  superviseur: { 
    label: 'Superviseur (Karim)', 
    description: 'Lecture tout sauf prix • Ajustements logistique', 
    className: 'bg-blue-500/20 text-blue-500' 
  },
  responsable_technique: { 
    label: 'Resp. Technique (Abdel)', 
    description: 'Validation conformité technique béton', 
    className: 'bg-purple-500/20 text-purple-500' 
  },
  directeur_operations: { 
    label: 'Directeur Opérations', 
    description: 'Planification • Assignation toupies', 
    className: 'bg-orange-500/20 text-orange-500' 
  },
  agent_administratif: { 
    label: 'Agent Administratif', 
    description: 'Clients • Facturation • Paiements', 
    className: 'bg-teal-500/20 text-teal-500' 
  },
  centraliste: { 
    label: 'Centraliste (Hassan)', 
    description: 'Saisie consommations réelles', 
    className: 'bg-pink-500/20 text-pink-500' 
  },
  operator: { 
    label: 'Opérateur (Legacy)', 
    description: 'Bons de livraison', 
    className: 'bg-accent/20 text-accent' 
  },
  accounting: { 
    label: 'Comptabilité (Legacy)', 
    description: 'Paiements uniquement', 
    className: 'bg-success/20 text-success' 
  },
  commercial: { 
    label: 'Commercial (Legacy)', 
    description: 'Gestion clients', 
    className: 'bg-warning/20 text-warning' 
  },
};

export default function Users() {
  const { isCeo } = useAuth();
  const [userRoles, setUserRoles] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('operator');

  if (!isCeo) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        supabase.from('user_roles_v2').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, email, full_name'),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      
      const rolesWithProfiles = (rolesRes.data || []).map(role => ({
        ...role,
        profile: profileMap.get(role.user_id),
      }));

      setUserRoles(rolesWithProfiles);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!selectedUserId || !selectedRole) {
        toast.error('Utilisateur et rôle requis');
        setSubmitting(false);
        return;
      }

      const existing = userRoles.find(
        r => r.user_id === selectedUserId && r.role === selectedRole
      );
      if (existing) {
        toast.error('Cet utilisateur a déjà ce rôle');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('user_roles_v2').insert([{
        user_id: selectedUserId,
        role: selectedRole,
      }]);

      if (error) throw error;

      toast.success('Rôle assigné avec succès');
      setDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('operator');
      fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Erreur lors de l\'assignation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (id: string) => {
    if (!confirm('Retirer ce rôle ?')) return;

    try {
      const { error } = await supabase
        .from('user_roles_v2')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Rôle retiré');
      fetchData();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const usersWithoutRole = profiles.filter(
    p => !userRoles.some(r => r.user_id === p.user_id)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Matrice de Commandement</h1>
            <p className="text-muted-foreground mt-1">
              Attribution des rôles selon la C&C Matrix
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assigner un Rôle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Assigner un Rôle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignRole} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="form-label-industrial">Utilisateur</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un utilisateur..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name || p.email || p.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="form-label-industrial">Rôle C&C</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole && ROLE_CONFIG[selectedRole] && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium mb-1">{ROLE_CONFIG[selectedRole].label}</p>
                    <p className="text-muted-foreground">{ROLE_CONFIG[selectedRole].description}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Assignation...
                      </>
                    ) : (
                      'Assigner'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {usersWithoutRole.length > 0 && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-warning" />
              <span className="font-medium text-warning">
                {usersWithoutRole.length} utilisateur(s) sans rôle assigné
              </span>
            </div>
          </div>
        )}

        <div className="card-industrial overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : userRoles.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aucun rôle assigné</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle C&C</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((ur) => {
                  const config = ROLE_CONFIG[ur.role] || { label: ur.role, className: 'bg-muted text-muted-foreground', description: '' };
                  return (
                    <TableRow key={ur.id}>
                      <TableCell className="font-medium">
                        {ur.profile?.full_name || 'Non défini'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ur.profile?.email || ur.user_id.slice(0, 8) + '...'}
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold', config.className)}>
                          {config.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {config.description}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveRole(ur.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Permission Matrix Overview */}
        <div className="card-industrial p-6">
          <h3 className="text-lg font-semibold mb-4">Matrice des Permissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium">Rôle</th>
                  <th className="text-center py-2 px-2">Prix</th>
                  <th className="text-center py-2 px-2">Formules</th>
                  <th className="text-center py-2 px-2">Bons</th>
                  <th className="text-center py-2 px-2">Clients</th>
                  <th className="text-center py-2 px-2">Approbations</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">CEO</td>
                  <td className="text-center py-2 px-2 text-success">✓ R/W</td>
                  <td className="text-center py-2 px-2 text-success">✓ R/W</td>
                  <td className="text-center py-2 px-2 text-success">✓ TOUT</td>
                  <td className="text-center py-2 px-2 text-success">✓ R/W</td>
                  <td className="text-center py-2 px-2 text-success">✓ TOUT</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">Superviseur</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                  <td className="text-center py-2 px-2 text-warning">R</td>
                  <td className="text-center py-2 px-2 text-warning">Logistique</td>
                  <td className="text-center py-2 px-2 text-warning">R</td>
                  <td className="text-center py-2 px-2 text-warning">Dosage</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">Resp. Technique</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                  <td className="text-center py-2 px-2 text-warning">R</td>
                  <td className="text-center py-2 px-2 text-warning">Validation</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">Dir. Opérations</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                  <td className="text-center py-2 px-2 text-warning">R</td>
                  <td className="text-center py-2 px-2 text-warning">Planif</td>
                  <td className="text-center py-2 px-2 text-warning">R</td>
                  <td className="text-center py-2 px-2 text-warning">Dérog.</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">Agent Admin</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                  <td className="text-center py-2 px-2 text-warning">R</td>
                  <td className="text-center py-2 px-2 text-warning">Paiement</td>
                  <td className="text-center py-2 px-2 text-success">R/W</td>
                  <td className="text-center py-2 px-2 text-warning">Facture</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium">Centraliste</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                  <td className="text-center py-2 px-2 text-warning">R (jour)</td>
                  <td className="text-center py-2 px-2 text-warning">Conso.</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                  <td className="text-center py-2 px-2 text-destructive">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
