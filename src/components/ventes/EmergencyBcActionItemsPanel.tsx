import React, { useState } from 'react';
import { useEmergencyBcActionItems, ActionItem, EscalationContact } from '@/hooks/useEmergencyBcActionItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
  User,
  Timer,
  Loader2,
  ArrowUpCircle,
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmergencyBcActionItemsPanelProps {
  notificationId: string;
  bcId?: string;
  compact?: boolean;
}

const priorityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const statusStyles: Record<string, { bg: string; icon: React.ReactNode }> = {
  PENDING: { bg: 'bg-muted', icon: <Clock className="h-4 w-4 text-muted-foreground" /> },
  IN_PROGRESS: { bg: 'bg-blue-500/20', icon: <Loader2 className="h-4 w-4 text-blue-400 animate-spin" /> },
  COMPLETED: { bg: 'bg-green-500/20', icon: <CheckCircle2 className="h-4 w-4 text-green-400" /> },
  ESCALATED: { bg: 'bg-red-500/20', icon: <ArrowUpCircle className="h-4 w-4 text-red-400" /> },
  FAILED: { bg: 'bg-red-500/20', icon: <AlertTriangle className="h-4 w-4 text-red-400" /> }
};

const ActionItemCard = ({ 
  item, 
  onStart, 
  onComplete, 
  onEscalate,
  isLoading 
}: { 
  item: ActionItem; 
  onStart: () => void;
  onComplete: () => void;
  onEscalate: () => void;
  isLoading: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusStyle = statusStyles[item.status] || statusStyles.PENDING;
  const isPending = item.status === 'PENDING';
  const isInProgress = item.status === 'IN_PROGRESS';
  const isCompleted = item.status === 'COMPLETED';

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={cn(
        'rounded-lg border p-3 transition-all',
        statusStyle.bg,
        item.is_overdue && item.status !== 'COMPLETED' && 'border-red-500/50 animate-pulse'
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              {statusStyle.icon}
              <div className="text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{item.action_name}</span>
                  <Badge variant="outline" className={cn('text-xs', priorityStyles[item.priority])}>
                    {item.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <User className="h-3 w-3" />
                  <span>{item.assigned_to}</span>
                  <span>•</span>
                  <Timer className="h-3 w-3" />
                  {item.is_overdue && item.status !== 'COMPLETED' ? (
                    <span className="text-red-400">En retard</span>
                  ) : (
                    <span>{item.minutes_remaining} min restantes</span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 pt-3 border-t border-border/50">
          {/* Steps */}
          {item.steps && item.steps.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Étapes:</p>
              <ul className="text-xs space-y-1">
                {item.steps.map((step, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist */}
          {item.checklist && item.checklist.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Checklist:</p>
              <ul className="text-xs space-y-1">
                {item.checklist.map((check, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ListChecks className="h-3 w-3 text-muted-foreground" />
                    {check}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Criteria */}
          {item.success_criteria && item.success_criteria.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Critères de succès:</p>
              <ul className="text-xs space-y-1">
                {item.success_criteria.map((criteria, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500/50" />
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Escalation Info */}
          {item.escalate_to && (
            <div className="mb-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs">
                <span className="font-medium text-amber-400">Escalader vers:</span>{' '}
                {item.escalate_to} après {item.escalation_after_minutes} min
              </p>
            </div>
          )}

          {/* Completion Info */}
          {item.completed_at && (
            <div className="mb-3 p-2 rounded bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400">
                Terminé par {item.completed_by_name} à{' '}
                {format(new Date(item.completed_at), 'HH:mm', { locale: fr })}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {!isCompleted && (
            <div className="flex gap-2 mt-3">
              {isPending && (
                <Button 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); onStart(); }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Démarrer
                </Button>
              )}
              {isInProgress && (
                <>
                  <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onComplete(); }}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Terminer
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={(e) => { e.stopPropagation(); onEscalate(); }}
                    disabled={isLoading}
                  >
                    <ArrowUpCircle className="h-3 w-3 mr-1" />
                    Escalader
                  </Button>
                </>
              )}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const EscalationContactCard = ({ contact }: { contact: EscalationContact }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border">
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
        contact.level === 1 && 'bg-blue-500/20 text-blue-400',
        contact.level === 2 && 'bg-green-500/20 text-green-400',
        contact.level === 3 && 'bg-amber-500/20 text-amber-400',
        contact.level === 4 && 'bg-red-500/20 text-red-400'
      )}>
        L{contact.level}
      </div>
      <div>
        <p className="font-medium text-sm">{contact.name}</p>
        <p className="text-xs text-muted-foreground">{contact.role}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {contact.phone && (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={`tel:${contact.phone}`}>
            <Phone className="h-4 w-4" />
          </a>
        </Button>
      )}
      {contact.email && (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={`mailto:${contact.email}`}>
            <Mail className="h-4 w-4" />
          </a>
        </Button>
      )}
      {contact.whatsapp && (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
      )}
      <Badge variant="outline" className="text-xs">
        {contact.response_time_sla_minutes}min SLA
      </Badge>
    </div>
  </div>
);

export function EmergencyBcActionItemsPanel({ 
  notificationId, 
  bcId,
  compact = false 
}: EmergencyBcActionItemsPanelProps) {
  const {
    actionItems,
    escalationContacts,
    loading,
    startAction,
    completeAction,
    escalateAction,
    progressPercent,
    completedCount,
    overdueCount,
    escalatedCount,
    totalCount,
    phaseProgress
  } = useEmergencyBcActionItems(notificationId);

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const handleStart = async (actionId: string) => {
    setLoadingActionId(actionId);
    await startAction(actionId);
    setLoadingActionId(null);
  };

  const handleComplete = async (actionId: string) => {
    setLoadingActionId(actionId);
    await completeAction(actionId);
    setLoadingActionId(null);
  };

  const handleEscalate = async (actionId: string) => {
    setLoadingActionId(actionId);
    await escalateAction(actionId, 'Escalation manuelle');
    setLoadingActionId(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Group actions by phase
  const actionsByPhase = actionItems.reduce((acc, item) => {
    if (!acc[item.phase]) {
      acc[item.phase] = { phase_name: item.phase_name, items: [] };
    }
    acc[item.phase].items.push(item);
    return acc;
  }, {} as Record<number, { phase_name: string; items: ActionItem[] }>);

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Actions de Production
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-medium">{completedCount}/{totalCount}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
              <p className="text-xs text-muted-foreground">Complété</p>
            </div>
            {overdueCount > 0 && (
              <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-2xl font-bold text-red-400">{overdueCount}</p>
                <p className="text-xs text-red-400">En retard</p>
              </div>
            )}
            {escalatedCount > 0 && (
              <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-2xl font-bold text-amber-400">{escalatedCount}</p>
                <p className="text-xs text-amber-400">Escaladé</p>
              </div>
            )}
          </div>

          {/* Phase Progress */}
          {!compact && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Par phase:</p>
              {phaseProgress.map(phase => (
                <div key={phase.phase} className="flex items-center gap-2">
                  <span className="text-xs w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-medium">
                    {phase.phase}
                  </span>
                  <div className="flex-1">
                    <Progress 
                      value={phase.total > 0 ? (phase.completed / phase.total) * 100 : 0} 
                      className="h-1.5" 
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{phase.completed}/{phase.total}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items by Phase */}
      {!compact && (
        <ScrollArea className="h-[500px]">
          <div className="space-y-4 pr-4">
            {Object.entries(actionsByPhase).map(([phase, data]) => (
              <Card key={phase}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                      {phase}
                    </span>
                    {data.phase_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.items.map(item => (
                    <ActionItemCard
                      key={item.id}
                      item={item}
                      onStart={() => handleStart(item.id)}
                      onComplete={() => handleComplete(item.id)}
                      onEscalate={() => handleEscalate(item.id)}
                      isLoading={loadingActionId === item.id}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Escalation Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Contacts d'Escalation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {escalationContacts.map(contact => (
            <EscalationContactCard key={contact.id} contact={contact} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
