import { useState } from 'react';
import { useLoans, Loan, LoanPayment } from '@/hooks/useLoans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Info
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CreateLoanDialog } from './CreateLoanDialog';
import { LoanPaymentDialog } from './LoanPaymentDialog';
import { LoanDetailDialog } from './LoanDetailDialog';

export function LoansDashboard() {
  const { 
    associates, 
    loans, 
    payments, 
    summary, 
    loading, 
    error,
    refetch,
    getOverduePayments,
    getUpcomingPayments,
    getLoanPayments,
  } = useLoans();
  
  const [createLoanOpen, setCreateLoanOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<LoanPayment | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  const overduePayments = getOverduePayments();
  const upcomingPayments = getUpcomingPayments(30);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const hasData = loans.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Prêts Associés</h1>
          <p className="text-muted-foreground">
            Suivi des prêts entre la société et les associés
          </p>
        </div>
        <Button onClick={() => setCreateLoanOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Prêt
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Prêts Actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.activeLoans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              sur {summary.totalLoans} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-amber-500" />
              Prêts Reçus (Société doit)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {summary.toCompanyBalance.toLocaleString('fr-MA')} DH
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.loansToCompany} prêts en cours
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              Prêts Accordés (Société reçoit)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              {summary.fromCompanyBalance.toLocaleString('fr-MA')} DH
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.loansFromCompany} prêts en cours
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-gradient-to-br",
          overduePayments.length > 0 
            ? "from-destructive/10 to-destructive/5 border-destructive/20" 
            : "from-muted/50 to-muted/30"
        )}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className={cn("h-4 w-4", overduePayments.length > 0 && "text-destructive")} />
              Échéances en Retard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", overduePayments.length > 0 && "text-destructive")}>
              {overduePayments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingPayments.length} à venir ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for overdue payments */}
      {overduePayments.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Échéances en Retard</AlertTitle>
          <AlertDescription>
            {overduePayments.length} paiement(s) en retard nécessitent une action immédiate.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun prêt enregistré</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Commencez par créer un prêt entre la société et un associé. 
              Le système générera automatiquement l'échéancier de remboursement.
            </p>
            <Button onClick={() => setCreateLoanOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer le Premier Prêt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      {hasData && (
        <Tabs defaultValue="loans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="loans" className="gap-2">
              <FileText className="h-4 w-4" />
              Prêts ({loans.length})
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Échéancier
              {overduePayments.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px]">
                  {overduePayments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="associates" className="gap-2">
              <Users className="h-4 w-4" />
              Associés ({associates.length})
            </TabsTrigger>
          </TabsList>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-4">
            <div className="grid gap-4">
              {loans.map(loan => {
                const loanPayments = getLoanPayments(loan.id);
                const paidPayments = loanPayments.filter(p => p.status === 'paid').length;
                const progress = (paidPayments / loan.term_months) * 100;
                const totalPaid = loanPayments.reduce((sum, p) => 
                  sum + (p.status === 'paid' || p.status === 'partial' ? Number(p.actual_amount) : 0), 0);
                const outstanding = Number(loan.principal_amount) - totalPaid;

                return (
                  <Card 
                    key={loan.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {loan.loan_type === 'to_company' ? (
                              <ArrowDownLeft className="h-4 w-4 text-amber-500" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                            )}
                            {loan.loan_number}
                          </CardTitle>
                          <CardDescription>
                            {loan.associate_name} • {loan.associate_relationship}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          loan.status === 'active' ? 'default' :
                          loan.status === 'paid_off' ? 'secondary' :
                          loan.status === 'defaulted' ? 'destructive' : 'outline'
                        }>
                          {loan.status === 'active' ? 'Actif' :
                           loan.status === 'paid_off' ? 'Soldé' :
                           loan.status === 'defaulted' ? 'Défaut' : 'Annulé'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Principal</p>
                          <p className="font-semibold">{Number(loan.principal_amount).toLocaleString('fr-MA')} DH</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Taux</p>
                          <p className="font-semibold">{(Number(loan.interest_rate) * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Mensualité</p>
                          <p className="font-semibold">{Number(loan.monthly_payment).toLocaleString('fr-MA')} DH</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Solde Restant</p>
                          <p className="font-semibold text-amber-500">{outstanding.toLocaleString('fr-MA')} DH</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progression: {paidPayments}/{loan.term_months} échéances</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            {/* Overdue Section */}
            {overduePayments.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Échéances en Retard ({overduePayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overduePayments.map(payment => {
                      const loan = loans.find(l => l.id === payment.loan_id);
                      const daysLate = differenceInDays(new Date(), new Date(payment.due_date));
                      
                      return (
                        <div 
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 cursor-pointer hover:bg-destructive/20"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <div>
                            <p className="font-medium">{loan?.loan_number}</p>
                            <p className="text-sm text-muted-foreground">
                              Échéance #{payment.payment_number} • {loan?.associate_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{Number(payment.scheduled_amount).toLocaleString('fr-MA')} DH</p>
                            <p className="text-xs text-destructive">
                              {daysLate} jours de retard
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Échéances à Venir ({upcomingPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingPayments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune échéance dans les 30 prochains jours
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingPayments.map(payment => {
                      const loan = loans.find(l => l.id === payment.loan_id);
                      const daysUntil = differenceInDays(new Date(payment.due_date), new Date());
                      
                      return (
                        <div 
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <div>
                            <p className="font-medium">{loan?.loan_number}</p>
                            <p className="text-sm text-muted-foreground">
                              Échéance #{payment.payment_number} • {loan?.associate_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{Number(payment.scheduled_amount).toLocaleString('fr-MA')} DH</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payment.due_date), 'dd MMM yyyy', { locale: fr })}
                              {daysUntil <= 7 && (
                                <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
                                  {daysUntil} jours
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Associates Tab */}
          <TabsContent value="associates" className="space-y-4">
            {associates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucun associé enregistré. Les associés seront créés automatiquement lors de la création d'un prêt.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {associates.map(associate => {
                  const associateLoans = loans.filter(l => l.associate_id === associate.id);
                  const activeLoans = associateLoans.filter(l => l.status === 'active');
                  
                  return (
                    <Card key={associate.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{associate.name}</CardTitle>
                        <CardDescription>{associate.relationship}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Prêts actifs</span>
                            <span className="font-medium">{activeLoans.length}</span>
                          </div>
                          {associate.email && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Email</span>
                              <span className="text-sm">{associate.email}</span>
                            </div>
                          )}
                          {associate.phone && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Téléphone</span>
                              <span className="text-sm">{associate.phone}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <CreateLoanDialog 
        open={createLoanOpen} 
        onOpenChange={setCreateLoanOpen}
        onSuccess={refetch}
      />

      {selectedPayment && (
        <LoanPaymentDialog
          payment={selectedPayment}
          loan={loans.find(l => l.id === selectedPayment.loan_id)}
          open={!!selectedPayment}
          onOpenChange={(open) => !open && setSelectedPayment(null)}
          onSuccess={refetch}
        />
      )}

      {selectedLoan && (
        <LoanDetailDialog
          loan={selectedLoan}
          payments={getLoanPayments(selectedLoan.id)}
          open={!!selectedLoan}
          onOpenChange={(open) => !open && setSelectedLoan(null)}
          onPaymentClick={setSelectedPayment}
        />
      )}
    </div>
  );
}
