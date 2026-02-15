import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText, ShoppingCart, Truck, ArrowRight, TrendingUp, Loader2, Percent, CalendarDays, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface PipelineStatsProps {
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

export function PipelineStats({ stats, onStageClick }: PipelineStatsProps) {
  const { t } = useI18n();
  const p = t.pipelineStats;

  const conversionRate = useMemo(() => {
    const totalDevis = stats.devisEnAttente + (stats.devisConverti || 0) + (stats.devisRefuses || 0) + (stats.devisAcceptes || 0);
    if (totalDevis === 0) return 0;
    return Math.round(((stats.devisConverti || 0) / totalDevis) * 100);
  }, [stats]);

  const pipelineValue = useMemo(() => stats.totalBcHT || 0, [stats.totalBcHT]);

  const forecastValue = useMemo(() => {
    const avgBcValue = pipelineValue / Math.max(stats.bcPretProduction + stats.bcEnProduction, 1);
    return avgBcValue * (stats.bcPretProduction + stats.bcEnProduction);
  }, [pipelineValue, stats.bcPretProduction, stats.bcEnProduction]);

  const handleStageClick = (stage: string) => {
    if (onStageClick) onStageClick(stage);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className={cn("cursor-pointer transition-all hover:shadow-md hover:border-warning/50", onStageClick && "hover:scale-[1.02]")} onClick={() => handleStageClick('en_attente')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><FileText className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.devisEnAttente}</p>
                <p className="text-xs text-muted-foreground">{p.pendingQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn("cursor-pointer transition-all hover:shadow-md hover:border-primary/50", onStageClick && "hover:scale-[1.02]")} onClick={() => handleStageClick('pret_production')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><ShoppingCart className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.bcPretProduction}</p>
                <p className="text-xs text-muted-foreground">{p.readyBc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20"><Percent className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold">{conversionRate}</p>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.conversionRate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold">{(stats.totalDevisHT / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">{p.inQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn("cursor-pointer transition-all hover:shadow-md hover:border-success/50", onStageClick && "hover:scale-[1.02]")} onClick={() => handleStageClick('termine')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><Truck className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.bcLivre}</p>
                <p className="text-xs text-muted-foreground">{p.deliveredBc}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {p.commercialFlow}
            </CardTitle>
            {pipelineValue > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30">
                    <DollarSign className="h-3 w-3" />
                    {p.pipeline}: {(pipelineValue / 1000).toFixed(0)}K DH
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{p.totalActiveBc}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex-1 text-center cursor-pointer transition-all", onStageClick && "hover:scale-105")} onClick={() => handleStageClick('en_attente')}>
                  <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-warning/10 border border-warning/30 hover:bg-warning/20 transition-colors">
                    <FileText className="h-8 w-8 text-warning" />
                    <p className="font-semibold">{stats.devisEnAttente}</p>
                    <p className="text-xs text-muted-foreground">{p.quotes}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{p.clickToFilter}</p>
                <p className="text-xs opacity-70">{p.value}: {stats.totalDevisHT.toLocaleString()} DH</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <Badge variant="secondary" className="text-[10px] px-1.5">{conversionRate}%</Badge>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex-1 text-center cursor-pointer transition-all", onStageClick && "hover:scale-105")} onClick={() => handleStageClick('pret_production')}>
                  <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                    <p className="font-semibold">{stats.bcPretProduction}</p>
                    <p className="text-xs text-muted-foreground">{p.validatedBc}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{p.readyForProduction}</TooltipContent>
            </Tooltip>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex-1 text-center cursor-pointer transition-all", onStageClick && "hover:scale-105")} onClick={() => handleStageClick('en_production')}>
                  <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-colors">
                    <Loader2 className={cn("h-8 w-8 text-accent", stats.bcEnProduction > 0 && "animate-spin")} />
                    <p className="font-semibold">{stats.bcEnProduction}</p>
                    <p className="text-xs text-muted-foreground">{p.inProduction}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{p.blCreatedDelivery}</TooltipContent>
            </Tooltip>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex-1 text-center cursor-pointer transition-all", onStageClick && "hover:scale-105")} onClick={() => handleStageClick('termine')}>
                  <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-success/10 border border-success/30 hover:bg-success/20 transition-colors">
                    <Truck className="h-8 w-8 text-success" />
                    <p className="font-semibold">{stats.bcLivre}</p>
                    <p className="text-xs text-muted-foreground">{p.completed}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{p.deliveredInvoiced}</TooltipContent>
            </Tooltip>
          </div>

          {forecastValue > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{p.revenueForecast}</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {forecastValue.toLocaleString()} DH
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all"
                  style={{ width: `${Math.min((stats.bcEnProduction / (stats.bcPretProduction + stats.bcEnProduction + 0.01)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{stats.bcPretProduction} {p.toLaunch}</span>
                <span>{stats.bcEnProduction} {p.inProgress}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
