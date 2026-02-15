import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Shield, KeyRound, Check, X, Clock, RefreshCw, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';

interface CodeRequest {
  id: string;
  code: string;
  bl_id: string;
  client_id: string;
  requested_by: string;
  requested_at: string;
  status: string;
  reason: string | null;
  expires_at: string | null;
}

export function CeoCodeManager() {
  const { user, isCeo } = useAuth();
  const { lang, t } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [requests, setRequests] = useState<CodeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ceo_emergency_codes')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCeo) {
      fetchRequests();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('ceo_codes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ceo_emergency_codes' },
          () => fetchRequests()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isCeo]);

  const generateCode = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleApprove = async (request: CodeRequest) => {
    if (!user?.id) return;
    
    setGeneratingFor(request.id);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    try {
      const { error } = await supabase
        .from('ceo_emergency_codes')
        .update({
          code,
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      // Update alert as read
      await supabase
        .from('alertes_systeme')
        .update({ lu: true, lu_par: user.id, lu_at: new Date().toISOString() })
        .eq('reference_id', request.id);

      toast.success(`Code généré: ${code}`, {
        description: 'Valide 30 minutes. Communiquez-le à l\'Agent Admin.',
        duration: 10000,
      });

      fetchRequests();
    } catch (err) {
      console.error('Error approving:', err);
      toast.error(t.ceoCode?.approvalError || "Erreur lors de l'approbation");
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleReject = async (request: CodeRequest) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('ceo_emergency_codes')
        .update({
          status: 'expired',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          notes: 'Rejeté par CEO',
        })
        .eq('id', request.id);

      if (error) throw error;

      // Update alert as read
      await supabase
        .from('alertes_systeme')
        .update({ lu: true, lu_par: user.id, lu_at: new Date().toISOString() })
        .eq('reference_id', request.id);

      toast.info('Demande rejetée');
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting:', err);
      toast.error(t.ceoCode?.rejectionError || 'Erreur lors du rejet');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t.ceoCode?.codeCopied || 'Code copié!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Approuvé</Badge>;
      case 'used':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Utilisé</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Expiré/Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isCeo) return null;

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Codes d'Urgence CEO</CardTitle>
              <CardDescription>Gérer les demandes de déblocage crédit</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <Badge className="bg-amber-500 animate-pulse">
                {pendingRequests.length} en attente
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={fetchRequests}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">{t.ceoCode?.loading || 'Chargement...'}</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {t.ceoCode?.noRequests || 'Aucune demande de code'}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {requests.map((request) => (
              <div
                key={request.id}
                className={cn(
                  "p-3 rounded-lg border",
                  request.status === 'pending' && "bg-amber-500/5 border-amber-500/30",
                  request.status === 'approved' && "bg-blue-500/5 border-blue-500/30",
                  request.status === 'used' && "bg-emerald-500/5 border-emerald-500/30",
                  request.status === 'expired' && "bg-muted/50 border-muted"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-medium text-sm">{request.bl_id}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {request.reason || 'Pas de raison spécifiée'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(new Date(request.requested_at), 'dd MMM HH:mm', { locale: dateLocale || undefined })}
                    </p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                        onClick={() => handleApprove(request)}
                        disabled={generatingFor === request.id}
                      >
                        {generatingFor === request.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <KeyRound className="h-3 w-3" />
                        )}
                        Générer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleReject(request)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {request.status === 'approved' && request.code && (
                    <div className="flex items-center gap-2">
                      <div className="bg-background border rounded-md px-3 py-1.5 font-mono text-lg font-bold tracking-wider">
                        {request.code}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => copyCode(request.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {request.status === 'used' && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs">Utilisé</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}