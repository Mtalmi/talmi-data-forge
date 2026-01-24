import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Zap,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  RefreshCw,
  Trash2,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BiometricScanOverlay } from './BiometricScanOverlay';

interface OverrideToken {
  id: string;
  override_type: 'expense_cap' | 'price_drop';
  reason: string;
  token: string;
  is_used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

const OVERRIDE_TYPES = {
  expense_cap: {
    label: 'Limite 15,000 MAD',
    icon: DollarSign,
    description: 'Contourne la limite mensuelle de dépenses autonomes',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
  },
  price_drop: {
    label: 'Blocage Prix -10%',
    icon: TrendingDown,
    description: 'Contourne le blocage de baisse de prix > 10%',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
};

export function CeoEmergencyOverride() {
  const { isCeo, user } = useAuth();
  const [tokens, setTokens] = useState<OverrideToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showBiometricScan, setShowBiometricScan] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form state
  const [overrideType, setOverrideType] = useState<'expense_cap' | 'price_drop'>('expense_cap');
  const [reason, setReason] = useState('');

  const fetchTokens = useCallback(async () => {
    if (!isCeo) return;

    try {
      const { data, error } = await supabase
        .from('ceo_emergency_overrides')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTokens((data || []) as OverrideToken[]);
    } catch (error) {
      console.error('Error fetching override tokens:', error);
    } finally {
      setLoading(false);
    }
  }, [isCeo]);

  useEffect(() => {
    fetchTokens();

    // Realtime subscription
    const channel = supabase
      .channel('ceo_overrides')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ceo_emergency_overrides' },
        () => fetchTokens()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTokens]);

  const startBiometricScan = () => {
    if (reason.trim().length < 10) {
      toast.error('Justification requise (min. 10 caractères)');
      return;
    }
    setShowBiometricScan(true);
  };

  const handleBiometricComplete = async () => {
    setShowBiometricScan(false);
    setGenerating(true);

    try {
      const { data, error } = await supabase
        .from('ceo_emergency_overrides')
        .insert({
          ceo_user_id: user?.id,
          override_type: overrideType,
          reason: reason.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Token de bypass généré avec succès');
      setDialogOpen(false);
      setReason('');
      fetchTokens();

      // Auto-copy the new token
      if (data?.token) {
        await navigator.clipboard.writeText(data.token);
        setCopiedToken(data.token);
        toast.success('Token copié dans le presse-papier');
        setTimeout(() => setCopiedToken(null), 3000);
      }
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error('Erreur lors de la génération du token');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      toast.success('Token copié');
      setTimeout(() => setCopiedToken(null), 3000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm('Révoquer ce token ? Il ne pourra plus être utilisé.')) return;

    try {
      const { error } = await supabase
        .from('ceo_emergency_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Token révoqué');
      fetchTokens();
    } catch (error) {
      console.error('Error revoking token:', error);
      toast.error('Erreur lors de la révocation');
    }
  };

  const isTokenValid = (token: OverrideToken) => {
    return !token.is_used && new Date(token.expires_at) > new Date();
  };

  const activeTokens = tokens.filter(isTokenValid);
  const usedOrExpiredTokens = tokens.filter(t => !isTokenValid(t));

  // Only render for CEO
  if (!isCeo) return null;

  if (loading) {
    return (
      <Card className="border-red-500/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Biometric Scan Overlay */}
      <BiometricScanOverlay
        isActive={showBiometricScan}
        onComplete={handleBiometricComplete}
        duration={2000}
      />

      <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                🔐 CEO Emergency Override
                <Badge variant="destructive" className="text-[9px] ml-1">CEO ONLY</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Bypass temporaire pour transactions urgentes (30 min)
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {activeTokens.length > 0 && (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  {activeTokens.length} actif{activeTokens.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={fetchTokens}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Generate Button */}
          <Button
            onClick={() => setDialogOpen(true)}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Générer Token de Bypass
          </Button>

          {/* Active Tokens */}
          {activeTokens.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Tokens Actifs
              </p>
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {activeTokens.map((token) => {
                    const config = OVERRIDE_TYPES[token.override_type];
                    const Icon = config.icon;
                    const expiresIn = formatDistanceToNow(parseISO(token.expires_at), { locale: fr, addSuffix: true });

                    return (
                      <div
                        key={token.id}
                        className={cn(
                          "p-2 rounded-lg border transition-all",
                          config.bgColor
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", config.color)} />
                            <span className="text-xs font-medium">{config.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyToken(token.token)}
                            >
                              {copiedToken === token.token ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => handleRevokeToken(token.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="font-mono text-[10px] bg-background/50 rounded px-2 py-1 mb-1 truncate">
                          {token.token}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[150px]">{token.reason}</span>
                          <span className="text-orange-600 font-medium shrink-0 ml-2">
                            Expire {expiresIn}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Used/Expired Tokens (collapsed) */}
          {usedOrExpiredTokens.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                {usedOrExpiredTokens.length} token{usedOrExpiredTokens.length > 1 ? 's' : ''} utilisé{usedOrExpiredTokens.length > 1 ? 's' : ''}/expiré{usedOrExpiredTokens.length > 1 ? 's' : ''}
              </summary>
              <div className="mt-2 space-y-1">
                {usedOrExpiredTokens.slice(0, 3).map((token) => (
                  <div key={token.id} className="p-2 rounded-lg bg-muted/30 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px]">{token.token.slice(0, 8)}...</span>
                      <Badge variant={token.is_used ? 'default' : 'secondary'} className="text-[8px]">
                        {token.is_used ? '✓ Utilisé' : '⏰ Expiré'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {tokens.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucun token généré</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Token Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-500" />
              Générer Token de Bypass
            </DialogTitle>
            <DialogDescription>
              Ce token permet de contourner UNE FOIS une limitation système.
              Valide 30 minutes, usage unique, entièrement tracé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Override Type Selection */}
            <div className="space-y-2">
              <Label>Type de Bypass</Label>
              <Select value={overrideType} onValueChange={(v) => setOverrideType(v as typeof overrideType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OVERRIDE_TYPES).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config.color)} />
                          <div>
                            <span className="font-medium">{config.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {config.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>
                Justification <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({reason.length}/10 min)
                </span>
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi ce bypass est nécessaire..."
                className="min-h-[80px]"
              />
              {reason.length > 0 && reason.length < 10 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Minimum 10 caractères requis
                </p>
              )}
            </div>

            {/* Warning */}
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>ATTENTION:</strong> Ce token sera enregistré dans le journal forensique.
                  L'usage abusif sera visible dans le rapport de conformité.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={startBiometricScan}
              disabled={generating || reason.trim().length < 10}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {generating ? (
                <>
                  <Shield className="h-4 w-4 mr-2 animate-spin" />
                  Sécurisation...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Autorisation Biométrique
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
