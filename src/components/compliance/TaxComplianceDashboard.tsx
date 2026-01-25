import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  TrendingDown, 
  XCircle,
  Building2,
  Heart,
  Percent,
  Receipt,
  Banknote
} from 'lucide-react';
import { useTaxCompliance, ObligationType } from '@/hooks/useTaxCompliance';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TaxPaymentDialog } from './TaxPaymentDialog';
import { TaxComplianceCalendar } from './TaxComplianceCalendar';

const TYPE_ICONS: Record<ObligationType, React.ReactNode> = {
  cnss: <Building2 className="h-4 w-4" />,
  mutuelle: <Heart className="h-4 w-4" />,
  ir: <Percent className="h-4 w-4" />,
  tva: <Receipt className="h-4 w-4" />,
  timbre: <FileText className="h-4 w-4" />,
  patente: <Banknote className="h-4 w-4" />,
  taxe_professionnelle: <Building2 className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

export function TaxComplianceDashboard() {
  const currentYear = new Date().getFullYear();
  const { 
    obligations, 
    summary, 
    byType, 
    loading, 
    getUpcomingObligations,
    getOverdueObligations,
    getArrears,
    getTotalArrears,
    OBLIGATION_LABELS,
    refetch,
  } = useTaxCompliance(currentYear);

  const [selectedObligation, setSelectedObligation] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const upcomingObligations = getUpcomingObligations(30);
  const overdueObligations = getOverdueObligations();
  const arrears = getArrears();
  const totalArrears = getTotalArrears();

  const handlePayObligation = (obligationId: string) => {
    setSelectedObligation(obligationId);
    setShowPaymentDialog(true);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Arrears Alert Banner */}
      {totalArrears > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">Arriérés Fiscaux Détectés</h3>
                  <p className="text-sm text-muted-foreground">
                    {arrears.length} obligation(s) en arriéré pour un total de {totalArrears.toLocaleString()} DH
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm">
                Régulariser Immédiatement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conformité</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.complianceRate.toFixed(0)}%</div>
            <Progress value={summary.complianceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {summary.paidCount}/{summary.totalObligations} obligations payées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Obligations en Retard</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Montant: {summary.totalOutstanding.toLocaleString()} DH
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pénalités Estimées</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {summary.totalPenalties.toLocaleString()} DH
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Taux: 6% par mois de retard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prochaines Échéances</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingObligations.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Dans les 30 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            En Retard
            {overdueObligations.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {overdueObligations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">À Venir</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* By Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détail par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {byType.map(item => (
                  <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {TYPE_ICONS[item.type]}
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.paidCount}/{item.totalCount} payées
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.totalAmount.toLocaleString()} DH</p>
                      {item.totalPenalties > 0 && (
                        <p className="text-sm text-destructive">
                          +{item.totalPenalties.toLocaleString()} DH pénalités
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Arrears Section */}
          {arrears.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Arriérés à Régulariser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {arrears.map(arrear => (
                    <div key={arrear.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-medium">{arrear.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Échéance: {format(new Date(arrear.due_date), 'dd MMM yyyy', { locale: fr })} 
                            ({arrear.days_overdue} jours de retard)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{Number(arrear.amount).toLocaleString()} DH</p>
                        <p className="text-sm text-destructive">
                          +{Number(arrear.penalty_amount).toLocaleString()} DH pénalité
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handlePayObligation(arrear.id)}
                      >
                        Payer
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <TaxComplianceCalendar obligations={obligations} onPayObligation={handlePayObligation} />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Obligations en Retard ({overdueObligations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueObligations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Aucune obligation en retard</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueObligations.map(ob => (
                    <div key={ob.id} className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                      <div className="flex items-center gap-3">
                        {TYPE_ICONS[ob.obligation_type]}
                        <div>
                          <p className="font-medium">{ob.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Échéance: {format(new Date(ob.due_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {ob.days_overdue} jours
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{Number(ob.amount).toLocaleString()} DH</p>
                          <p className="text-sm text-destructive">
                            Pénalité: {Number(ob.penalty_amount).toLocaleString()} DH
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handlePayObligation(ob.id)}
                        >
                          Payer Maintenant
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Obligations à Venir (30 jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingObligations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Aucune obligation à venir dans les 30 prochains jours</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingObligations.map(ob => {
                    const daysUntil = differenceInDays(new Date(ob.due_date), new Date());
                    const urgency = daysUntil <= 7 ? 'destructive' : daysUntil <= 14 ? 'warning' : 'default';
                    
                    return (
                      <div key={ob.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {TYPE_ICONS[ob.obligation_type]}
                          <div>
                            <p className="font-medium">{ob.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(ob.due_date), 'dd MMM yyyy', { locale: fr })}
                              </span>
                              <Badge variant={urgency === 'warning' ? 'secondary' : urgency} className="text-xs">
                                {daysUntil === 0 ? "Aujourd'hui" : `${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{Number(ob.amount).toLocaleString()} DH</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePayObligation(ob.id)}
                          >
                            Payer
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPaymentDialog && selectedObligation && (
        <TaxPaymentDialog
          obligationId={selectedObligation}
          obligations={obligations}
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
