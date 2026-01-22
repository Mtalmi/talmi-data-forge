import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Send, KeyRound, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface CeoCodeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blId: string;
  clientId: string;
  clientName: string;
  solde: number;
  limite: number;
  onCodeVerified: () => void;
}

type RequestStatus = 'idle' | 'requesting' | 'pending' | 'entering_code' | 'verifying';

export function CeoCodeRequestDialog({
  open,
  onOpenChange,
  blId,
  clientId,
  clientName,
  solde,
  limite,
  onCodeVerified,
}: CeoCodeRequestDialogProps) {
  const { user, isAgentAdministratif } = useAuth();
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [reason, setReason] = useState('');
  const [code, setCode] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleRequestCode = async () => {
    if (!user?.id) return;
    
    setStatus('requesting');
    setError('');
    
    try {
      // Create the code request
      const { data, error: insertError } = await supabase
        .from('ceo_emergency_codes')
        .insert([{
          bl_id: blId,
          client_id: clientId,
          requested_by: user.id,
          reason: reason || `Override crédit pour ${clientName}`,
          status: 'pending',
          code: '0000', // Placeholder, CEO will set real code
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Create a system alert for the CEO
      await supabase.from('alertes_systeme').insert({
        type_alerte: 'credit_override_request',
        niveau: 'warning',
        titre: `Demande Code CEO - ${blId}`,
        message: `L'Agent Admin demande un code pour débloquer ${blId} (${clientName}). Solde: ${solde.toLocaleString()} DH / Limite: ${limite.toLocaleString()} DH`,
        destinataire_role: 'ceo',
        reference_table: 'ceo_emergency_codes',
        reference_id: data.id,
      });

      setRequestId(data.id);
      setStatus('pending');
      toast.success('Demande envoyée au CEO!');
    } catch (err) {
      console.error('Error requesting code:', err);
      setError('Erreur lors de la demande');
      setStatus('idle');
    }
  };

  const handleVerifyCode = async () => {
    if (!requestId || code.length !== 4) return;
    
    setStatus('verifying');
    setError('');

    try {
      // Check if there's an approved code matching
      const { data, error: fetchError } = await supabase
        .from('ceo_emergency_codes')
        .select('*')
        .eq('id', requestId)
        .eq('code', code)
        .eq('status', 'approved')
        .single();

      if (fetchError || !data) {
        setError('Code incorrect ou non approuvé');
        setStatus('entering_code');
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('Code expiré');
        setStatus('entering_code');
        return;
      }

      // Mark as used
      await supabase
        .from('ceo_emergency_codes')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      toast.success('Code validé! Livraison débloquée.');
      onCodeVerified();
      onOpenChange(false);
      
      // Reset state
      setStatus('idle');
      setCode('');
      setReason('');
      setRequestId(null);
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Erreur de vérification');
      setStatus('entering_code');
    }
  };

  const handleCheckStatus = async () => {
    if (!requestId) return;
    
    try {
      const { data } = await supabase
        .from('ceo_emergency_codes')
        .select('status, code')
        .eq('id', requestId)
        .single();

      if (data?.status === 'approved') {
        setStatus('entering_code');
        toast.success('Le CEO a approuvé! Entrez le code.');
      } else {
        toast.info('En attente d\'approbation...');
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Demande Code CEO
          </DialogTitle>
          <DialogDescription>
            Le client a un blocage crédit. Demandez un code d'urgence au CEO.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">BL:</span>
              <span className="font-mono font-medium">{blId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{clientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Solde Dû:</span>
              <span className="font-medium text-red-500">{solde.toLocaleString()} DH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limite Crédit:</span>
              <span className="font-medium">{limite.toLocaleString()} DH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dépassement:</span>
              <Badge variant="destructive" className="text-xs">
                +{(solde - limite).toLocaleString()} DH
              </Badge>
            </div>
          </div>

          {/* Status: Idle - Show request form */}
          {status === 'idle' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="reason">Raison (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Paiement prévu demain, client historique..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Status: Requesting */}
          {status === 'requesting' && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {/* Status: Pending - Waiting for CEO */}
          {status === 'pending' && (
            <div className="text-center py-4 space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="font-medium">Demande envoyée!</p>
                <p className="text-sm text-muted-foreground">
                  Le CEO va générer un code. Vérifiez le statut.
                </p>
              </div>
              <Button variant="outline" onClick={handleCheckStatus} className="gap-2">
                <Clock className="h-4 w-4" />
                Vérifier Statut
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setStatus('entering_code')}
                className="text-xs"
              >
                J'ai déjà le code
              </Button>
            </div>
          )}

          {/* Status: Entering Code */}
          {status === 'entering_code' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Entrez le code à 4 chiffres du CEO
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={code}
                    onChange={setCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-14 w-14 text-2xl" />
                      <InputOTPSlot index={1} className="h-14 w-14 text-2xl" />
                      <InputOTPSlot index={2} className="h-14 w-14 text-2xl" />
                      <InputOTPSlot index={3} className="h-14 w-14 text-2xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Status: Verifying */}
          {status === 'verifying' && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {error && status === 'idle' && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleRequestCode} className="gap-2">
                <Send className="h-4 w-4" />
                Demander Code CEO
              </Button>
            </>
          )}
          {status === 'entering_code' && (
            <>
              <Button variant="outline" onClick={() => setStatus('pending')}>
                Retour
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={code.length !== 4}
                className="gap-2"
              >
                <KeyRound className="h-4 w-4" />
                Valider Code
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}