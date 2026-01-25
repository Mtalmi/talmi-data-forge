import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Lock, XCircle, AlertTriangle, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ApprovalStatus {
  technical_approval_status: string;
  technical_approval_by: string | null;
  technical_approval_timestamp: string | null;
  technical_approval_notes: string | null;
  validation_score: number | null;
  discrepancies_count: number | null;
  administrative_approval_status: string;
  administrative_approval_by: string | null;
  administrative_approval_timestamp: string | null;
  administrative_approval_notes: string | null;
  can_approve_administratively: boolean;
  approval_chain_complete: boolean;
  blocking_reasons: string[];
  next_step: string;
}

interface QuoteApprovalStatusCardProps {
  devisId: string;
  requiresTechnicalApproval?: boolean;
  currentStatus?: string;
}

export function QuoteApprovalStatusCard({ 
  devisId, 
  requiresTechnicalApproval = true,
  currentStatus 
}: QuoteApprovalStatusCardProps) {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_approval_status', {
          p_devis_id: devisId,
        });

        if (error) throw error;
        
        const result = data as { success: boolean } & Partial<ApprovalStatus>;
        if (result.success) {
          setApprovalStatus(result as ApprovalStatus);
        }
      } catch (err) {
        console.error('Error fetching approval status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [devisId]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!approvalStatus) return null;

  const techStatus = approvalStatus.technical_approval_status || 'PENDING';
  const adminStatus = approvalStatus.administrative_approval_status || 'PENDING';

  const getTechStatusBadge = () => {
    switch (techStatus) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Approuvé
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeté
          </Badge>
        );
      case 'BLOCKED_DISCORDANCE':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Bloqué - Discordances
          </Badge>
        );
      case 'BLOCKED_MISSING_DOCS':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Bloqué - Docs manquants
          </Badge>
        );
      case 'BLOCKED_BUDGET':
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Bloqué - Budget
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
    }
  };

  const getAdminStatusBadge = () => {
    if (!approvalStatus.can_approve_administratively) {
      return (
        <Badge className="bg-red-500/20 text-red-600 border-red-500/30 gap-1">
          <Lock className="h-3 w-3" />
          Bloquée
        </Badge>
      );
    }
    
    switch (adminStatus) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Validé
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeté
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Prêt
          </Badge>
        );
    }
  };

  const isComplete = approvalStatus.approval_chain_complete;

  return (
    <Card className={cn(
      'border-2 transition-colors',
      isComplete 
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : techStatus === 'APPROVED'
          ? 'border-blue-500/30 bg-blue-500/5'
          : techStatus.startsWith('BLOCKED')
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-muted'
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Step 1: Technical Approval */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
              techStatus === 'APPROVED'
                ? 'bg-emerald-500 text-white'
                : techStatus.startsWith('BLOCKED') || techStatus === 'REJECTED'
                  ? 'bg-destructive text-white'
                  : 'bg-muted text-muted-foreground border-2 border-muted-foreground/30'
            )}>
              {techStatus === 'APPROVED' ? '✓' : '1'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">Étape 1: Approbation Technique</p>
                {getTechStatusBadge()}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {techStatus === 'APPROVED' && approvalStatus.technical_approval_by
                  ? `Approuvé par ${approvalStatus.technical_approval_by}`
                  : 'Responsable Technique requis'}
                {approvalStatus.validation_score && (
                  <span className="ml-2 font-mono">
                    Score: {(approvalStatus.validation_score * 100).toFixed(0)}%
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Step 2: Administrative Validation */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
              adminStatus === 'APPROVED'
                ? 'bg-emerald-500 text-white'
                : !approvalStatus.can_approve_administratively
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-blue-500/20 text-blue-600 border-2 border-blue-500'
            )}>
              {adminStatus === 'APPROVED' ? '✓' : !approvalStatus.can_approve_administratively ? <Lock className="h-4 w-4" /> : '2'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn(
                  'font-semibold text-sm',
                  !approvalStatus.can_approve_administratively && 'text-muted-foreground'
                )}>
                  Étape 2: Validation Administrative
                </p>
                {getAdminStatusBadge()}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {adminStatus === 'APPROVED' && approvalStatus.administrative_approval_by
                  ? `Validé par ${approvalStatus.administrative_approval_by}`
                  : !approvalStatus.can_approve_administratively
                    ? 'En attente de l\'Étape 1'
                    : 'Front Desk / Agent Admin'}
              </p>
            </div>
          </div>

          {/* Blocking Reasons */}
          {approvalStatus.blocking_reasons && approvalStatus.blocking_reasons.length > 0 && (
            <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Raisons du blocage:
              </p>
              <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                {approvalStatus.blocking_reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Step */}
          <div className="text-xs text-muted-foreground border-t pt-2 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Prochaine étape: {approvalStatus.next_step}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
