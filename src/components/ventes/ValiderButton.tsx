import { useState } from 'react';
import { CheckCircle, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

interface ValiderButtonProps {
  devisId: string;
  techApprovalStatus: string;
  blockingReason?: string | null;
  onValidated?: (result: any) => void;
  disabled?: boolean;
  className?: string;
}

export function ValiderButton({
  devisId,
  techApprovalStatus,
  blockingReason,
  onValidated,
  disabled = false,
  className,
}: ValiderButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const v = t.valider;

  const canValidate = techApprovalStatus === 'APPROVED';
  const isBlocked = techApprovalStatus?.startsWith('BLOCKED');
  const isPending = techApprovalStatus === 'PENDING';
  const isRejected = techApprovalStatus === 'REJECTED';

  const getTooltipMessage = () => {
    if (canValidate) return v.validateStep2;
    if (isPending) return v.awaitingTech;
    if (isRejected) return v.techRejected;
    if (isBlocked) return blockingReason || v.approvalBlocked;
    return v.techRequired;
  };

  const handleValidate = async () => {
    if (!canValidate || loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('approve_administrative_devis', {
        p_devis_id: devisId,
        p_action: 'APPROVE',
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; approved_by?: string; approved_role?: string };

      if (result.success) {
        toast.success(v.quoteValidated.replace('{user}', result.approved_by || '').replace('{role}', result.approved_role || ''));
        onValidated?.(result);
      } else {
        toast.error(result.error || v.validationError);
      }
    } catch (err: any) {
      toast.error(err.message || v.validationError);
    } finally {
      setLoading(false);
    }
  };

  if (!canValidate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <Badge 
              variant="outline" 
              className={cn(
                'gap-1',
                isBlocked && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                isPending && 'bg-muted text-muted-foreground',
                isRejected && 'bg-destructive/10 text-destructive border-destructive/30'
              )}
            >
              {isBlocked && <AlertTriangle className="h-3 w-3" />}
              {isPending && <Lock className="h-3 w-3" />}
              {isRejected && <AlertTriangle className="h-3 w-3" />}
              {v.validationBlocked}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{getTooltipMessage()}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleValidate}
          disabled={disabled || loading}
          className={cn('gap-2 bg-success hover:bg-success/90', className)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {v.validateQuote}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipMessage()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
