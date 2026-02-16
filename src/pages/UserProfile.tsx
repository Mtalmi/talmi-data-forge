import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Shield, Mail, Calendar, Save, Loader2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { user, role, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const p = t.userProfile;
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [exportingData, setExportingData] = useState(false);

  // GDPR Data Export
  const handleGdprExport = useCallback(async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Session expirée'); return; }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gdpr-export`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-tbos-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Données exportées avec succès');
    } catch {
      toast.error("Erreur lors de l'export des données");
    } finally {
      setExportingData(false);
    }
  }, [user]);

  const ROLE_LABELS: Record<string, string> = {
    ceo: p.ceo,
    supervisor: p.supervisor,
    resp_technique: p.resp_technique,
    frontdesk: p.frontdesk,
    directeur_operationnel: p.directeur_operationnel,
    centraliste: p.centraliste,
    operator: p.operator,
    accounting: p.accounting,
    commercial: p.commercial,
    auditeur: p.auditeur,
  };

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
      toast.success(p.profileUpdated);
    } catch (err: any) {
      toast.error(p.updateError + err.message);
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
    ? new Date(user.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR', {
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
            <h1 className="text-2xl font-bold">{p.title}</h1>
            <p className="text-muted-foreground text-sm">{p.subtitle}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {p.roleAccess}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{p.assignedRole}</span>
              <Badge variant="secondary" className="text-sm">
                {role ? (ROLE_LABELS[role] || role) : p.undefined}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{p.memberSince}</span>
              <span className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {createdAt}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{p.personalInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{p.fullName}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={p.fullNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{p.email}</Label>
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
                {p.emailReadonly}
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {p.save}
            </Button>
          </CardContent>
        </Card>

        {/* GDPR Data Export Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Mes données (RGPD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Téléchargez une copie complète de vos données personnelles stockées dans TBOS, conformément au RGPD.
            </p>
            <Button 
              variant="outline" 
              onClick={handleGdprExport} 
              disabled={exportingData}
              className="w-full"
            >
              {exportingData ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Export en cours...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" />Télécharger mes données</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
