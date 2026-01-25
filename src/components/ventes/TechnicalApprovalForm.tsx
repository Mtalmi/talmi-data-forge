import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TechnicalApprovalFormProps {
  devisId: string;
  onSubmit?: (result: any) => void;
  isLoading?: boolean;
}

export function TechnicalApprovalForm({ devisId, onSubmit, isLoading = false }: TechnicalApprovalFormProps) {
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'BLOCK'>('APPROVE');
  const [validationScore, setValidationScore] = useState('0.95');
  const [discrepanciesCount, setDiscrepanciesCount] = useState('0');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('approve_technical_devis_v2', {
        p_devis_id: devisId,
        p_action: action,
        p_reason: reason || null,
        p_validation_score: parseFloat(validationScore) || 0.95,
        p_discrepancies_count: parseInt(discrepanciesCount) || 0,
      });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; error?: string; message?: string; tech_approval_status?: string };

      if (result.success) {
        setSuccess('Approbation technique enregistrée avec succès');
        toast.success('Approbation technique enregistrée');
        setReason('');
        onSubmit?.(result);
      } else {
        setError(result.error || 'Erreur lors de l\'approbation');
        toast.error(result.error || 'Erreur lors de l\'approbation');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'APPROVE':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'REJECT':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'BLOCK':
        return <Lock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'APPROVE':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'REJECT':
        return 'border-destructive/30 bg-destructive/5';
      case 'BLOCK':
        return 'border-amber-500/30 bg-amber-500/5';
    }
  };

  return (
    <Card className={cn('transition-colors', getActionColor())}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-primary" />
          Approbation Technique
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-600">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getActionIcon()}
                    {action === 'APPROVE' && 'Approuver'}
                    {action === 'REJECT' && 'Rejeter'}
                    {action === 'BLOCK' && 'Bloquer'}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVE">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Approuver
                  </div>
                </SelectItem>
                <SelectItem value="REJECT">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Rejeter
                  </div>
                </SelectItem>
                <SelectItem value="BLOCK">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-500" />
                    Bloquer (Discordances/Docs manquants)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="validation-score">
                Score de Validation
                <span className="text-xs text-muted-foreground ml-1">(0.00 - 1.00)</span>
              </Label>
              <Input
                id="validation-score"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={validationScore}
                onChange={(e) => setValidationScore(e.target.value)}
                className="font-mono"
              />
              {parseFloat(validationScore) < 0.95 && (
                <p className="text-xs text-amber-600">
                  ⚠ Score &lt; 0.95 déclenchera un blocage
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discrepancies">
                Discordances détectées
              </Label>
              <Input
                id="discrepancies"
                type="number"
                min="0"
                value={discrepanciesCount}
                onChange={(e) => setDiscrepanciesCount(e.target.value)}
                className="font-mono"
              />
              {parseInt(discrepanciesCount) > 0 && (
                <p className="text-xs text-amber-600">
                  ⚠ Discordances détectées
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Raison / Notes
              {action !== 'APPROVE' && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                action === 'APPROVE'
                  ? 'Optionnel - Notes d\'approbation...'
                  : 'Obligatoire - Expliquez la raison du rejet/blocage...'
              }
              className="min-h-[80px]"
              required={action !== 'APPROVE'}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || isLoading || (action !== 'APPROVE' && !reason.trim())}
            className={cn(
              'w-full gap-2',
              action === 'APPROVE' && 'bg-emerald-600 hover:bg-emerald-700',
              action === 'REJECT' && 'bg-destructive hover:bg-destructive/90',
              action === 'BLOCK' && 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {getActionIcon()}
            {submitting ? 'Soumission en cours...' : 'Soumettre l\'Approbation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
