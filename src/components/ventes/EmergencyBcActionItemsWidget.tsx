import React from 'react';
import { useEmergencyBcActionItems } from '@/hooks/useEmergencyBcActionItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ListChecks,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmergencyBcActionItemsWidgetProps {
  notificationId: string;
  onViewDetails?: () => void;
}

export function EmergencyBcActionItemsWidget({ 
  notificationId,
  onViewDetails 
}: EmergencyBcActionItemsWidgetProps) {
  const {
    actionItems,
    loading,
    progressPercent,
    completedCount,
    pendingCount,
    overdueCount,
    totalCount
  } = useEmergencyBcActionItems(notificationId);

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (actionItems.length === 0) {
    return null;
  }

  // Get next pending action
  const nextAction = actionItems.find(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');

  return (
    <Card className={cn(
      'bg-card/50 transition-all',
      overdueCount > 0 && 'border-red-500/50'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Actions Production
          </CardTitle>
          <Badge variant={overdueCount > 0 ? 'destructive' : 'secondary'}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <Progress value={progressPercent} className="h-2" />
        
        {/* Stats Row */}
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>{completedCount} terminé</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{pendingCount} en attente</span>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span>{overdueCount} en retard</span>
            </div>
          )}
        </div>

        {/* Next Action Preview */}
        {nextAction && (
          <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Prochaine action:</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{nextAction.action_name}</p>
                <p className="text-xs text-muted-foreground">
                  {nextAction.assigned_to} • {nextAction.minutes_remaining} min restantes
                </p>
              </div>
              <Badge variant="outline" className={cn(
                'text-xs',
                nextAction.priority === 'CRITICAL' && 'border-red-500/50 text-red-400',
                nextAction.priority === 'HIGH' && 'border-amber-500/50 text-amber-400'
              )}>
                {nextAction.priority}
              </Badge>
            </div>
          </div>
        )}

        {/* View Details Button */}
        {onViewDetails && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full" 
            onClick={onViewDetails}
          >
            Voir tous les détails
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
