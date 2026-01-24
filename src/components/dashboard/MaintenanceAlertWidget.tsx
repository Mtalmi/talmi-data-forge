import { useFleetMaintenance } from '@/hooks/useFleetMaintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Gauge,
  Droplets,
  CircleDot,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MaintenanceAlertWidget() {
  const navigate = useNavigate();
  const { loading, getFleetHealthStats } = useFleetMaintenance();
  const stats = getFleetHealthStats();

  const criticalVehicles = stats.vehicleHealth
    .filter(h => h.overall_status === 'overdue' || h.overall_status === 'due_soon')
    .sort((a, b) => {
      if (a.overall_status === 'overdue' && b.overall_status !== 'overdue') return -1;
      if (a.overall_status !== 'overdue' && b.overall_status === 'overdue') return 1;
      return 0;
    })
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'due_soon':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'vidange':
        return <Droplets className="h-3 w-3" />;
      case 'pneumatiques':
        return <CircleDot className="h-3 w-3" />;
      case 'visite':
        return <FileCheck className="h-3 w-3" />;
      default:
        return <Wrench className="h-3 w-3" />;
    }
  };

  const formatKm = (km: number) => new Intl.NumberFormat('fr-FR').format(Math.round(km));

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const hasIssues = stats.overdue > 0 || stats.due_soon > 0;

  return (
    <Card 
      className={cn(
        'bg-card/50 backdrop-blur border-border/50 cursor-pointer transition-all hover:shadow-lg',
        stats.overdue > 0 && 'border-destructive/50',
        stats.overdue === 0 && stats.due_soon > 0 && 'border-warning/50',
      )}
      onClick={() => navigate('/maintenance')}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className={cn(
              'h-5 w-5',
              stats.overdue > 0 ? 'text-destructive' : 
              stats.due_soon > 0 ? 'text-warning' : 'text-success'
            )} />
            Santé Flotte
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-success/10">
            <p className="text-lg font-bold text-success">{stats.healthy}</p>
            <p className="text-[10px] text-muted-foreground">OK</p>
          </div>
          <div className={cn(
            'p-2 rounded-lg',
            stats.due_soon > 0 ? 'bg-warning/10' : 'bg-muted/30'
          )}>
            <p className={cn('text-lg font-bold', stats.due_soon > 0 && 'text-warning')}>
              {stats.due_soon}
            </p>
            <p className="text-[10px] text-muted-foreground">À prévoir</p>
          </div>
          <div className={cn(
            'p-2 rounded-lg',
            stats.overdue > 0 ? 'bg-destructive/10 animate-pulse' : 'bg-muted/30'
          )}>
            <p className={cn('text-lg font-bold', stats.overdue > 0 && 'text-destructive')}>
              {stats.overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">En retard</p>
          </div>
        </div>

        {/* Critical Vehicles List */}
        {hasIssues ? (
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {criticalVehicles.map((health) => {
                const issues: string[] = [];
                if (health.vidange.status !== 'healthy') issues.push('vidange');
                if (health.pneumatiques.status !== 'healthy') issues.push('pneumatiques');
                if (health.visite_technique.status !== 'healthy' && health.visite_technique.status !== 'unknown') {
                  issues.push('visite');
                }

                return (
                  <div 
                    key={health.vehicle.id_camion}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg text-sm',
                      health.overall_status === 'overdue' ? 'bg-destructive/10' : 'bg-warning/10'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(health.overall_status)}
                      <div>
                        <p className="font-medium">{health.vehicle.id_camion}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {issues.map(issue => (
                            <span key={issue} className="flex items-center gap-0.5">
                              {getServiceIcon(issue)}
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px]',
                        health.overall_status === 'overdue' 
                          ? 'border-destructive text-destructive' 
                          : 'border-warning text-warning'
                      )}
                    >
                      {health.overall_status === 'overdue' ? 'RETARD' : 'BIENTÔT'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mb-2" />
            <p className="text-sm font-medium text-success">Flotte en bonne santé</p>
            <p className="text-xs text-muted-foreground">
              Tous les véhicules sont à jour
            </p>
          </div>
        )}

        {/* Overall Health Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Santé globale de la flotte</span>
            <span>{Math.round((stats.healthy / stats.total) * 100)}%</span>
          </div>
          <Progress 
            value={(stats.healthy / stats.total) * 100}
            className="h-2"
            indicatorClassName={
              stats.overdue > 0 ? 'bg-destructive' :
              stats.due_soon > 0 ? 'bg-warning' : 'bg-success'
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
