import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Key,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonnel } from '@/hooks/usePersonnel';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLE_OPTIONS = [
  { value: 'superviseur', label: 'Hassan (Superviseur)', description: 'Opérations terrain' },
  { value: 'agent_administratif', label: 'Abdel Sadek (Admin)', description: 'Validation administrative' },
  { value: 'responsable_technique', label: 'Karim (Resp. Technique)', description: 'Validation technique' },
];

export function CeoBypassTokenManager() {
  const { isCeo } = useAuth();
  const { 
    bypassTokens, 
    activeTokens,
    generateBypassToken, 
    refetchTokens,
    canGenerateBypassTokens,
  } = usePersonnel();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form state
  const [forRole, setForRole] = useState('superviseur');
  const [reason, setReason] = useState('');
  const [amountLimit, setAmountLimit] = useState<string>('');
  const [validMinutes, setValidMinutes] = useState(30);

  // Only show for CEO or users who can generate tokens
  if (!isCeo && !canGenerateBypassTokens) return null;

  const handleGenerate = async () => {
    if (reason.trim().length < 10) {
      toast.error('Justification requise (min. 10 caractères)');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateBypassToken(
        forRole,
        reason.trim(),
        amountLimit ? parseFloat(amountLimit) : undefined,
        validMinutes
      );

      if (result.success && result.tokenCode) {
        toast.success(`Token généré: ${result.tokenCode}`);
        
        // Auto-copy
        await navigator.clipboard.writeText(result.tokenCode);
        setCopiedToken(result.tokenCode);
        toast.success('Token copié dans le presse-papier');
        
        setDialogOpen(false);
        setReason('');
        setAmountLimit('');
        
        setTimeout(() => setCopiedToken(null), 5000);
      } else {
        toast.error(result.error || 'Erreur lors de la génération');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération');
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

  return (
    <>
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                🔑 CEO Bypass Tokens (15k MAD)
                <Badge variant="outline" className="text-[9px] bg-amber-500/10 border-amber-500/30 text-amber-600">
                  MASTER_ADMIN
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Tokens pour contourner la limite de 15,000 MAD
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {activeTokens.length > 0 && (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  {activeTokens.length} actif{activeTokens.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refetchTokens}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Generate Button */}
          <Button
            onClick={() => setDialogOpen(true)}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
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
              <ScrollArea className="h-[140px]">
                <div className="space-y-2">
                  {activeTokens.map((token) => {
                    const roleInfo = ROLE_OPTIONS.find(r => r.value === token.generated_for);
                    const expiresIn = formatDistanceToNow(parseISO(token.expires_at), { locale: fr, addSuffix: true });

                    return (
                      <div
                        key={token.id}
                        className="p-2 rounded-lg border bg-amber-500/5 border-amber-500/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-medium">{roleInfo?.label || token.generated_for}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyToken(token.token_code)}
                          >
                            {copiedToken === token.token_code ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="font-mono text-sm bg-background/80 rounded px-2 py-1 mb-1 text-center font-bold tracking-widest">
                          {token.token_code}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[150px]">{token.reason}</span>
                          <span className="text-orange-600 font-medium shrink-0 ml-2">
                            Expire {expiresIn}
                          </span>
                        </div>
                        {token.amount_limit && (
                          <Badge variant="outline" className="text-[9px] mt-1">
                            Limite: {token.amount_limit.toLocaleString()} MAD
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {bypassTokens.length === 0 && (
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
              <Key className="h-5 w-5 text-amber-500" />
              Générer Token de Bypass 15k MAD
            </DialogTitle>
            <DialogDescription>
              Ce token permet de contourner la limite mensuelle de 15,000 MAD.
              Valide {validMinutes} minutes, usage unique, entièrement tracé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* For Role Selection */}
            <div className="space-y-2">
              <Label>Pour quel utilisateur</Label>
              <Select value={forRole} onValueChange={setForRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Limit (optional) */}
            <div className="space-y-2">
              <Label>Limite de montant (optionnel)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={amountLimit}
                  onChange={(e) => setAmountLimit(e.target.value)}
                  placeholder="Laisser vide pour illimité"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  MAD
                </span>
              </div>
            </div>

            {/* Validity Duration */}
            <div className="space-y-2">
              <Label>Durée de validité</Label>
              <Select value={validMinutes.toString()} onValueChange={(v) => setValidMinutes(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                  <SelectItem value="120">2 heures</SelectItem>
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
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>AUDIT:</strong> Ce token sera enregistré dans le journal forensique
                  avec votre identité et la justification fournie.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || reason.trim().length < 10}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {generating ? (
                <>
                  <Shield className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Générer Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
