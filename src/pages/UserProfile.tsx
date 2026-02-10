import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Shield, Mail, Calendar, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO / Directeur Général',
  supervisor: 'Superviseur',
  resp_technique: 'Responsable Technique',
  frontdesk: 'Front Desk / Admin',
  directeur_operationnel: 'Directeur Opérationnel',
  centraliste: 'Centraliste',
  operator: 'Opérateur',
  accounting: 'Comptabilité',
  commercial: 'Commercial',
  auditeur: 'Auditeur',
};

export default function UserProfile() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_profiles' as any)
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setFullName((data as any).full_name || user.user_metadata?.full_name || '');
        if ((data as any).email) setEmail((data as any).email);
      } else {
        setFullName(user.user_metadata?.full_name || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles' as any)
        .update({ full_name: fullName } as any)
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profil mis à jour avec succès');
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mon Profil</h1>
            <p className="text-muted-foreground text-sm">Gérer vos informations personnelles</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Rôle & Accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rôle attribué</span>
              <Badge variant="secondary" className="text-sm">
                {role ? (ROLE_LABELS[role] || role) : 'Non défini'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Membre depuis</span>
              <span className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {createdAt}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié ici.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
