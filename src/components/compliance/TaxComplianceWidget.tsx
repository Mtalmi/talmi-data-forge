import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ChevronRight,
  XCircle 
} from 'lucide-react';
import { useTaxCompliance } from '@/hooks/useTaxCompliance';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function TaxComplianceWidget() {
  const currentYear = new Date().getFullYear();
  const { 
    summary, 
    loading, 
    getUpcomingObligations,
    getOverdueObligations,
    getTotalArrears,
  } = useTaxCompliance(currentYear);

  const upcomingObligations = getUpcomingObligations(30).slice(0, 3);
  const overdueObligations = getOverdueObligations().slice(0, 2);
  const totalArrears = getTotalArrears();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={summary.overdueCount > 0 ? 'border-destructive' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          📊 Conformité Fiscale & Sociale
          {summary.overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {summary.overdueCount} en retard
            </Badge>
          )}
        </CardTitle>
        <Link to="/paiements">
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            Détails
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compliance Rate */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Taux de conformité</span>
            <span className="font-medium">{summary.complianceRate.toFixed(0)}%</span>
          </div>
          <Progress 
            value={summary.complianceRate} 
            className={summary.complianceRate < 80 ? '[&>div]:bg-destructive' : ''}
          />
        </div>

        {/* Arrears Alert */}
        {totalArrears > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Arriérés: {totalArrears.toLocaleString()} DH
            </span>
          </div>
        )}

        {/* Overdue Obligations */}
        {overdueObligations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-destructive flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Obligations en retard:
            </p>
            {overdueObligations.map(ob => (
              <div key={ob.id} className="flex items-center justify-between text-sm p-2 rounded bg-destructive/5">
                <span className="truncate">{ob.name}</span>
                <span className="font-medium text-destructive">
                  {Number(ob.amount).toLocaleString()} DH
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Obligations */}
        {upcomingObligations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Prochaines échéances:
            </p>
            {upcomingObligations.map(ob => {
              const daysUntil = differenceInDays(new Date(ob.due_date), new Date());
              return (
                <div key={ob.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{ob.name}</span>
                    <Badge variant={daysUntil <= 7 ? 'destructive' : 'secondary'} className="text-[10px]">
                      {daysUntil}j
                    </Badge>
                  </div>
                  <span className="font-medium">
                    {Number(ob.amount).toLocaleString()} DH
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Penalties */}
        {summary.totalPenalties > 0 && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Pénalités estimées:</span>
            <span className="font-medium text-amber-500">
              {summary.totalPenalties.toLocaleString()} DH
            </span>
          </div>
        )}

        {/* All Good State */}
        {summary.overdueCount === 0 && upcomingObligations.length === 0 && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Toutes les obligations sont à jour</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
