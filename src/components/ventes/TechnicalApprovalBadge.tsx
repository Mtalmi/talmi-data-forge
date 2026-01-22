import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface TechnicalApprovalBadgeProps {
  devisId: string;
  requiresApproval: boolean;
  isApproved: boolean;
  approvedByName: string | null;
  approvedAt: string | null;
  canApprove: boolean;
  onApproved?: () => void;
}

export function TechnicalApprovalBadge({
  devisId,
  requiresApproval,
  isApproved,
  approvedByName,
  approvedAt,
  canApprove,
  onApproved,
}: TechnicalApprovalBadgeProps) {
  const [loading, setLoading] = useState(false);

  if (!requiresApproval) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('approve_technical_devis', {
        p_devis_id: devisId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (result.success) {
        toast.success('Approbation technique accordée');
        onApproved?.();
      } else {
        toast.error(result.error || 'Erreur lors de l\'approbation');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'approbation');
    } finally {
      setLoading(false);
    }
  };

  if (isApproved) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Approuvé Tech.
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Approuvé par {approvedByName}</p>
          {approvedAt && <p className="text-xs text-muted-foreground">{new Date(approvedAt).toLocaleDateString('fr-FR')}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Formule Spéciale
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ce devis requiert une approbation du Responsable Technique avant validation.</p>
        </TooltipContent>
      </Tooltip>
      
      {canApprove && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
          onClick={handleApprove}
          disabled={loading}
        >
          <Shield className="h-3 w-3" />
          {loading ? 'Approbation...' : 'Approuver Tech.'}
        </Button>
      )}
    </div>
  );
}
