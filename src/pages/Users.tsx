import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import WorldClassUsers from '@/components/users/WorldClassUsers';
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

type AppRole = 'ceo' | 'operator' | 'accounting' | 'commercial' | 'superviseur' | 'responsable_technique' | 'directeur_operations' | 'agent_administratif' | 'centraliste' | 'auditeur';

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

const ROLE_STYLE: Record<string, string> = {
  ceo: 'bg-primary/20 text-primary',
  superviseur: 'bg-primary/20 text-primary',
  responsable_technique: 'bg-purple-500/20 text-purple-500',
  directeur_operations: 'bg-orange-500/20 text-orange-500',
  agent_administratif: 'bg-teal-500/20 text-teal-500',
  centraliste: 'bg-pink-500/20 text-pink-500',
  operator: 'bg-accent/20 text-accent',
  accounting: 'bg-success/20 text-success',
  commercial: 'bg-warning/20 text-warning',
  auditeur: 'bg-blue-500/20 text-blue-500',
};

export default function Users() {
  const { isCeo } = useAuth();
  const { t } = useI18n();
  const u = t.pages.users;
  const [userRoles, setUserRoles] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('operator');

  useEffect(() => {
    if (isCeo) fetchData();
  }, [isCeo]);

  if (!isCeo) {
    return <Navigate to="/" replace />;
  }

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
      toast.error(u.loadError);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!selectedUserId || !selectedRole) {
        toast.error(u.userAndRoleRequired);
        setSubmitting(false);
        return;
      }

      const existing = userRoles.find(
        r => r.user_id === selectedUserId && r.role === selectedRole
      );
      if (existing) {
        toast.error(u.alreadyHasRole);
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('user_roles_v2').insert([{
        user_id: selectedUserId,
        role: selectedRole,
      }]);

      if (error) throw error;

      toast.success(u.roleAssigned);
      setDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('operator');
      fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error(u.assignError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (id: string) => {
    if (!confirm(u.removeConfirm)) return;

    try {
      const { error } = await supabase
        .from('user_roles_v2')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(u.roleRemoved);
      fetchData();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error(u.removeError);
    }
  };

  const usersWithoutRole = profiles.filter(
    p => !userRoles.some(r => r.user_id === p.user_id)
  );

  const roleKeys = Object.keys(u.roles) as Array<keyof typeof u.roles>;

  return (
    <MainLayout>
      <WorldClassUsers />
      <div className="space-y-6" style={{ display: 'none' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{u.title}</h1>
            <p className="text-muted-foreground mt-1">{u.subtitle}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {u.assignRole}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{u.assignRole}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignRole} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="form-label-industrial">{u.userLabel}</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder={u.selectUser} />
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
                  <Label className="form-label-industrial">{u.ccRole}</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{u.roles[key]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole && u.roles[selectedRole as keyof typeof u.roles] && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium mb-1">{u.roles[selectedRole as keyof typeof u.roles]}</p>
                    <p className="text-muted-foreground">{u.roleDescriptions[selectedRole as keyof typeof u.roleDescriptions]}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {u.cancelLabel}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {u.assigning}
                      </>
                    ) : (
                      u.assign
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
                {usersWithoutRole.length} {u.usersWithoutRoleCount}
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
              <p className="text-muted-foreground">{u.noRoleAssigned}</p>
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>{u.userLabel}</TableHead>
                  <TableHead>{u.emailCol}</TableHead>
                  <TableHead>{u.ccRole}</TableHead>
                  <TableHead>{u.permissions}</TableHead>
                  <TableHead className="w-20">{u.actionsCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((ur) => {
                  const roleLabel = u.roles[ur.role as keyof typeof u.roles] || ur.role;
                  const roleDesc = u.roleDescriptions[ur.role as keyof typeof u.roleDescriptions] || '';
                  const roleStyle = ROLE_STYLE[ur.role] || 'bg-muted text-muted-foreground';
                  return (
                    <TableRow key={ur.id}>
                      <TableCell className="font-medium">
                        {ur.profile?.full_name || u.notDefined}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ur.profile?.email || ur.user_id.slice(0, 8) + '...'}
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold', roleStyle)}>
                          {roleLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {roleDesc}
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
          <h3 className="text-lg font-semibold mb-4">{u.permissionMatrix}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium">{u.colRole}</th>
                  <th className="text-center py-2 px-2">{u.colPrices}</th>
                  <th className="text-center py-2 px-2">{u.colFormulas}</th>
                  <th className="text-center py-2 px-2">{u.colDeliveries}</th>
                  <th className="text-center py-2 px-2">{u.colClients}</th>
                  <th className="text-center py-2 px-2">{u.colApprovals}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{u.roles.ceo}</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.rwAll}</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.rwAll}</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.allAccess}</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.rwAll}</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.allAccess}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{u.roles.superviseur}</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.rwAll}*</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.rwAll}*</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.allAccess}*</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.rwAll}*</td>
                  <td className="text-center py-2 px-2 text-success">✓ {u.allAccess}*</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{u.roles.responsable_technique}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.rOnly}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.validation}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{u.roles.directeur_operations}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.rOnly}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.planning}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.rOnly}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.derogation}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{u.roles.agent_administratif}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.rOnly}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.payment}</td>
                  <td className="text-center py-2 px-2 text-success">{u.rwAll}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.invoice}</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{u.roles.centraliste}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.dailyRead}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.consumption}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium">{u.roles.auditeur}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.verification}</td>
                  <td className="text-center py-2 px-2 text-destructive">{u.noAccess}</td>
                  <td className="text-center py-2 px-2 text-warning">{u.audit}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-4">
              * {u.supervisorNote}
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
