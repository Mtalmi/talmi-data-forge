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

type AppRole = 'ceo' | 'operator' | 'accounting' | 'commercial';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface Profile {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

export default function Users() {
  const { isCeo } = useAuth();
  const [userRoles, setUserRoles] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('operator');

  // Redirect if not CEO
  if (!isCeo) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
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

      // Check if already has this role
      const existing = userRoles.find(
        r => r.user_id === selectedUserId && r.role === selectedRole
      );
      if (existing) {
        toast.error('Cet utilisateur a déjà ce rôle');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('user_roles').insert([{
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
        .from('user_roles')
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

  const getRoleBadge = (role: AppRole) => {
    const styles: Record<AppRole, string> = {
      ceo: 'bg-primary/20 text-primary',
      operator: 'bg-accent/20 text-accent',
      accounting: 'bg-success/20 text-success',
      commercial: 'bg-warning/20 text-warning',
    };
    const labels: Record<AppRole, string> = {
      ceo: 'CEO',
      operator: 'Opérateur',
      accounting: 'Comptabilité',
      commercial: 'Commercial',
    };
    return { className: styles[role], label: labels[role] };
  };

  // Get users without any role
  const usersWithoutRole = profiles.filter(
    p => !userRoles.some(r => r.user_id === p.user_id)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              Attribution des rôles et permissions
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assigner un Rôle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                          {p.email || p.full_name || p.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="form-label-industrial">Rôle</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ceo">CEO (Accès complet)</SelectItem>
                      <SelectItem value="operator">Opérateur (Bons de livraison)</SelectItem>
                      <SelectItem value="accounting">Comptabilité (Paiements)</SelectItem>
                      <SelectItem value="commercial">Commercial (Clients)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-2">Permissions du rôle:</p>
                  {selectedRole === 'ceo' && (
                    <p className="text-muted-foreground">Accès complet à toutes les fonctionnalités</p>
                  )}
                  {selectedRole === 'operator' && (
                    <p className="text-muted-foreground">Création de bons de livraison, lecture des formules et prix</p>
                  )}
                  {selectedRole === 'accounting' && (
                    <p className="text-muted-foreground">Mise à jour des statuts de paiement uniquement</p>
                  )}
                  {selectedRole === 'commercial' && (
                    <p className="text-muted-foreground">Gestion des clients, lecture des bons</p>
                  )}
                </div>

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

        {/* Users without role warning */}
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

        {/* Table */}
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
                  <TableHead>Rôle</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((ur) => {
                  const badge = getRoleBadge(ur.role);
                  return (
                    <TableRow key={ur.id}>
                      <TableCell className="font-medium">
                        {ur.profile?.full_name || 'Non défini'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ur.profile?.email || ur.user_id.slice(0, 8) + '...'}
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold', badge.className)}>
                          {badge.label}
                        </span>
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
      </div>
    </MainLayout>
  );
}
