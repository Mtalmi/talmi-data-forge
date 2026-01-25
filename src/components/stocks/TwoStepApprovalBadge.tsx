// Two-Step Approval Badge for Raw Material Orders
// Shows workflow status inline with blocking indicators

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TwoStepApprovalWorkflow } from './TwoStepApprovalWorkflow';

interface TwoStepApprovalBadgeProps {
  order: {
    id: string;
    materiau: string;
    quantite: number;
    fournisseur: string | null;
    numero_bl_fournisseur: string | null;
    photo_bl_url: string | null;
    created_at: string;
    tech_approval_status: string;
    tech_approval_by_name?: string | null;
    tech_approval_at?: string | null;
    quality_assessment?: string | null;
    humidity_test_pct?: number | null;
    gravel_grade?: string | null;
    tech_approval_notes?: string | null;
    workflow_status: string;
    front_desk_validation_status?: string;
  };
  onUpdate?: () => void;
  showDetails?: boolean;
}

export function TwoStepApprovalBadge({ order, onUpdate, showDetails = true }: TwoStepApprovalBadgeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const workflowStatus = order.workflow_status || 'awaiting_technical';
  const techStatus = order.tech_approval_status || 'pending';

  // Determine badge style based on status
  const getBadgeConfig = () => {
    if (workflowStatus === 'approved') {
      return {
        variant: 'default' as const,
        className: 'bg-emerald-500/20 text-emerald-700 border-emerald-300',
        icon: CheckCircle2,
        label: '✅ Validée',
        tooltip: `Validé par ${order.tech_approval_by_name}`,
      };
    }

    if (workflowStatus === 'rejected') {
      return {
        variant: 'destructive' as const,
        className: 'bg-red-500/20 text-red-700 border-red-300',
        icon: XCircle,
        label: '❌ Rejetée',
        tooltip: 'Rejeté suite au contrôle qualité',
      };
    }

    if (workflowStatus === 'awaiting_frontdesk') {
      return {
        variant: 'secondary' as const,
        className: 'bg-blue-500/20 text-blue-700 border-blue-300',
        icon: CheckCircle2,
        label: '✅ Tech. Approuvée',
        tooltip: `Approuvé par ${order.tech_approval_by_name} - En attente validation Front Desk`,
      };
    }

    // Default: awaiting_technical
    return {
      variant: 'outline' as const,
      className: 'bg-amber-500/20 text-amber-700 border-amber-300',
      icon: Clock,
      label: '⏳ Attente Tech.',
      tooltip: 'En attente d\'approbation par le Responsable Technique',
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn('gap-1', config.className)}>
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={cn('gap-1', config.className)}>
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{config.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Show lock indicator if Front Desk is blocked */}
        {workflowStatus === 'awaiting_technical' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-300/50 gap-1">
                  <Lock className="h-3 w-3" />
                  Front Desk Bloqué
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-warning" />
                  <span>
                    Front Desk ne peut pas valider. En attente d'approbation technique par Abdel Sadek ou Karim.
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* View/Edit button */}
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Eye className="h-3 w-3" />
            Détails
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Workflow Two-Step Approval
          </DialogTitle>
        </DialogHeader>
        <TwoStepApprovalWorkflow
          order={order}
          onUpdate={() => {
            onUpdate?.();
            setDialogOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// Compact inline version for tables
export function TwoStepApprovalInline({ 
  techStatus, 
  frontDeskStatus,
  techApprovedBy,
}: {
  techStatus: string;
  frontDeskStatus: string;
  techApprovedBy?: string | null;
}) {
  const isAwaitingTechnical = techStatus === 'pending';
  const isTechApproved = techStatus === 'approved';
  const isComplete = frontDeskStatus === 'validated';
  const isRejected = techStatus === 'rejected' || frontDeskStatus === 'rejected';

  if (isRejected) {
    return (
      <div className="flex items-center gap-1">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-xs text-red-600 font-medium">Rejetée</span>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="text-xs text-emerald-600 font-medium">Complète</span>
      </div>
    );
  }

  if (isTechApproved) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-blue-600">Tech ✓</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-xs">Front Desk...</span>
        </div>
      </div>
    );
  }

  // Awaiting technical
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4 text-amber-500" />
        <span className="text-xs text-amber-600">Attente Tech.</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Lock className="h-3 w-3 text-red-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Front Desk bloqué jusqu'à approbation technique</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
