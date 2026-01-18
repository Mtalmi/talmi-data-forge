import { ClientCreditScore } from '@/hooks/useClientCreditScore';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Ban,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditScoreCardProps {
  client: ClientCreditScore;
  compact?: boolean;
}

const GRADE_STYLES = {
  A: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  B: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  C: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  D: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  F: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
};

const RISK_STYLES = {
  low: { label: 'Risque Faible', color: 'bg-success/10 text-success' },
  medium: { label: 'Risque Moyen', color: 'bg-warning/10 text-warning' },
  high: { label: 'Risque Élevé', color: 'bg-orange-500/10 text-orange-500' },
  critical: { label: 'Risque Critique', color: 'bg-destructive/10 text-destructive' },
};

export function CreditScoreCard({ client, compact = false }: CreditScoreCardProps) {
  const gradeStyle = GRADE_STYLES[client.score_grade];
  const riskStyle = RISK_STYLES[client.risk_level];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl',
          gradeStyle.bg, gradeStyle.text
        )}>
          {client.score_grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{client.nom_client}</span>
            {client.is_blocked && <Ban className="h-3 w-3 text-destructive flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{client.credit_score}/100</span>
            <Badge variant="outline" className={cn('text-xs', riskStyle.color)}>
              {riskStyle.label}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header with Score */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2',
              gradeStyle.bg, gradeStyle.text, gradeStyle.border
            )}>
              <span className="text-2xl font-bold">{client.score_grade}</span>
              <span className="text-xs">{client.credit_score}/100</span>
            </div>
            <div>
              <h3 className="font-semibold">{client.nom_client}</h3>
              <p className="text-sm text-muted-foreground">{client.client_id}</p>
              <Badge variant="outline" className={cn('mt-1', riskStyle.color)}>
                {riskStyle.label}
              </Badge>
            </div>
          </div>
          {client.is_blocked && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Ban className="h-3 w-3" />
              Bloqué
            </Badge>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Score de Crédit</span>
            <span className="font-medium">{client.score_label}</span>
          </div>
          <Progress value={client.credit_score} className="h-2" />
        </div>

        {/* Factor Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Historique
                </span>
                <span className="font-mono">{client.factors.paymentHistoryScore}/35</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Basé sur le ratio de factures payées</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-warning" />
                  Délais
                </span>
                <span className="font-mono">{client.factors.delayFrequencyScore}/30</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fréquence des retards de paiement</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-primary" />
                  Solde
                </span>
                <span className="font-mono">{client.factors.balanceTrendScore}/20</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tendance du solde dû</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-accent" />
                  Ancienneté
                </span>
                <span className="font-mono">{client.factors.accountAgeScore}/10</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Durée de la relation client</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-bold">{client.on_time_payment_rate}%</p>
            <p className="text-xs text-muted-foreground">Paiements à temps</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{client.credit_utilization}%</p>
            <p className="text-xs text-muted-foreground">Utilisation crédit</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{client.average_days_to_pay}j</p>
            <p className="text-xs text-muted-foreground">Délai moyen</p>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="p-2 rounded-lg bg-muted/50 flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{client.recommended_action}</p>
        </div>
      </CardContent>
    </Card>
  );
}
