import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  ShoppingCart,
  RefreshCw,
  Truck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FluxCommercialWidgetProps {
  stats: {
    devisEnAttente: number;
    devisAcceptes?: number;
    devisConverti?: number;
    devisRefuses?: number;
    bcPretProduction: number;
    bcEnProduction: number;
    bcLivre: number;
    totalDevisHT: number;
    totalBcHT?: number;
  };
  onStageClick?: (stage: string) => void;
}

interface FluxStage {
  id: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  route?: string;
  tooltip: string;
}

export function FluxCommercialWidget({ stats, onStageClick }: FluxCommercialWidgetProps) {
  const navigate = useNavigate();

  // Calculate conversion rate
  const conversionRate = useMemo(() => {
    const totalDevis = stats.devisEnAttente + (stats.devisConverti || 0) + (stats.devisRefuses || 0) + (stats.devisAcceptes || 0);
    if (totalDevis === 0) return 0;
    return Math.round(((stats.devisConverti || 0) / totalDevis) * 100);
  }, [stats]);

  const stages: FluxStage[] = [
    {
      id: 'en_attente',
      label: 'Devis',
      count: stats.devisEnAttente,
      icon: <FileText className="h-6 w-6 md:h-7 md:w-7" />,
      bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
      iconColor: 'text-amber-500 dark:text-amber-400',
      tooltip: 'Devis en attente de validation',
    },
    {
      id: 'pret_production',
      label: 'BC Validés',
      count: stats.bcPretProduction,
      icon: <ShoppingCart className="h-6 w-6 md:h-7 md:w-7" />,
      bgColor: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50',
      iconColor: 'text-rose-500 dark:text-rose-400',
      tooltip: 'Bons de commande prêts pour production',
    },
    {
      id: 'en_production',
      label: 'En Production',
      count: stats.bcEnProduction,
      icon: <RefreshCw className={cn("h-6 w-6 md:h-7 md:w-7", stats.bcEnProduction > 0 && "animate-spin")} style={{ animationDuration: '3s' }} />,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      route: '/production',
      tooltip: 'En cours de production / livraison',
    },
    {
      id: 'termine',
      label: 'Terminés',
      count: stats.bcLivre,
      icon: <Truck className="h-6 w-6 md:h-7 md:w-7" />,
      bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50',
      iconColor: 'text-green-600 dark:text-green-400',
      route: '/journal',
      tooltip: 'Journal quotidien des livraisons',
    },
  ];

  const handleStageClick = (stage: FluxStage) => {
    // If stage has a dedicated route, navigate there
    if (stage.route) {
      navigate(stage.route);
      return;
    }
    // Otherwise trigger filter callback and scroll to tabs section
    if (onStageClick) {
      onStageClick(stage.id);
      // Scroll to tabs section after a brief delay to let the tab switch
      setTimeout(() => {
        document.getElementById('ventes-tabs-section')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-rose-500" />
            Flux Commercial
          </CardTitle>
          {conversionRate > 0 && (
            <Badge variant="secondary" className="text-xs font-medium">
              {conversionRate}% conversion
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <div className="flex items-center justify-between gap-1 md:gap-3">
          {stages.map((stage, index) => (
            <div key={stage.id} className="contents">
              {/* Stage Card */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStageClick(stage)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all duration-200",
                      "hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                      stage.bgColor
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      stage.iconColor
                    )}>
                      {stage.icon}
                    </div>
                    <span className="text-xl md:text-2xl font-bold text-foreground">
                      {stage.count}
                    </span>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight text-center">
                      {stage.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-sm">{stage.tooltip}</p>
                  {stage.route && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliquer pour ouvrir {stage.label}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Arrow between stages (except after last) */}
              {index < stages.length - 1 && (
                <div className="flex flex-col items-center gap-0.5 px-0.5 md:px-1">
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/50" />
                  {index === 0 && conversionRate > 0 && (
                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium">
                      {conversionRate}%
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
