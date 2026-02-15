import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { useTightTimes } from '@/hooks/useTightTimes';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { triggerHaptic } from '@/lib/haptics';
import { useI18n } from '@/i18n/I18nContext';

export function EmergencyBcApprovalWidget() {
  const { isCeo, isSuperviseur } = useAuth();
  const { pendingApprovals, processApproval, loading } = useTightTimes();
  const { t } = useI18n();
  const e = t.emergencyBc;
  const c = t.common;
  
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const canApprove = isCeo || isSuperviseur;

  if (!canApprove || pendingApprovals.length === 0) {
    return null;
  }

  const handleAction = (approval: any, action: 'APPROVE' | 'REJECT') => {
    setSelectedApproval(approval);
    setActionType(action);
    setNotes('');
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedApproval) return;
    
    setProcessing(true);
    triggerHaptic('warning');
    
    const success = await processApproval(
      selectedApproval.id,
      actionType,
      notes || undefined
    );
    
    setProcessing(false);
    
    if (success) {
      triggerHaptic('success');
      setDialogOpen(false);
      setSelectedApproval(null);
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'AFTER_18H_SAME_DAY':
        return e.afterSameDay;
      case 'TIGHT_TIMES':
        return e.tightTimesMode;
      default:
        return condition;
    }
  };

  const getUrgencyColor = (remainingMinutes: number) => {
    if (remainingMinutes <= 5) return 'text-red-600 bg-red-500/10 border-red-500/30';
    if (remainingMinutes <= 15) return 'text-amber-600 bg-amber-500/10 border-amber-500/30';
    return 'text-blue-600 bg-blue-500/10 border-blue-500/30';
  };

  return (
    <>
      <Card className="border-red-500/50 bg-red-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
              <CardTitle className="text-base">{e.urgentBcPending}</CardTitle>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              {pendingApprovals.length} {e.pendingCount}
            </Badge>
          </div>
          <CardDescription>
            {e.approvalRequired}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingApprovals.map((approval) => (
            <div 
              key={approval.id}
              className={`p-3 rounded-lg border ${getUrgencyColor(approval.remaining_minutes)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{approval.bc_id}</span>
                    <Badge variant="outline" className="text-xs">
                      {getConditionLabel(approval.emergency_condition)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {approval.requested_by_name || c.unknown}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(approval.delivery_date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${approval.remaining_minutes <= 10 ? 'text-red-600 border-red-500 animate-pulse' : ''}`}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {approval.remaining_minutes} {e.min}
                </Badge>
              </div>
              
              <p className="text-sm mb-3 line-clamp-2">{approval.emergency_reason}</p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction(approval, 'APPROVE')}
                  className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {c.approve}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(approval, 'REJECT')}
                  className="flex-1 gap-1 border-red-500/50 text-red-600 hover:bg-red-500/10"
                >
                  <XCircle className="h-3 w-3" />
                  {c.reject}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'APPROVE' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {e.approveUrgentBc}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  {e.rejectUrgentBc}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'APPROVE' ? e.bcApprovedDesc : e.bcRejectedDesc}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono font-bold">{selectedApproval.bc_id}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedApproval.emergency_reason}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span>{c.by}: {selectedApproval.requested_by_name}</span>
                  <span>{c.delivery}: {format(new Date(selectedApproval.delivery_date), 'dd/MM/yyyy')}</span>
                </div>
              </div>

              {actionType === 'APPROVE' && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm text-green-700 font-medium">{e.notificationsSent}</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• {e.productionTeam}</li>
                    <li>• {e.techManager}</li>
                    <li>• {e.requester}</li>
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {actionType === 'APPROVE' ? e.approveNotes : e.rejectReason}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e_) => setNotes(e_.target.value)}
                  placeholder={actionType === 'APPROVE' 
                    ? e.addNotesPlaceholder 
                    : e.explainRejectPlaceholder}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {c.cancel}
            </Button>
            <Button 
              onClick={confirmAction}
              disabled={processing || (actionType === 'REJECT' && !notes)}
              className={`gap-2 ${actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : actionType === 'APPROVE' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {actionType === 'APPROVE' ? e.confirmApproval : e.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
