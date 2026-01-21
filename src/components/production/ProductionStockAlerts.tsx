import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Stock {
  materiau: string;
  quantite_actuelle: number;
  seuil_alerte: number;
  unite: string;
  capacite_max: number | null;
}

interface ProductionStockAlertsProps {
  stocks: Stock[];
  className?: string;
}

export function ProductionStockAlerts({ stocks, className }: ProductionStockAlertsProps) {
  const criticalStocks = stocks.filter(s => s.quantite_actuelle <= s.seuil_alerte);
  const lowStocks = stocks.filter(s => 
    s.quantite_actuelle > s.seuil_alerte && 
    s.quantite_actuelle <= s.seuil_alerte * 1.5
  );

  if (criticalStocks.length === 0 && lowStocks.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border-warning/50 bg-warning/5", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alertes Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {criticalStocks.map(stock => {
          const percentage = stock.capacite_max 
            ? (stock.quantite_actuelle / stock.capacite_max) * 100 
            : (stock.quantite_actuelle / stock.seuil_alerte) * 50;
          
          return (
            <div key={stock.materiau} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-destructive" />
                  <span className="font-medium">{stock.materiau}</span>
                </div>
                <span className="text-destructive font-mono text-xs">
                  {stock.quantite_actuelle.toFixed(0)} {stock.unite}
                </span>
              </div>
              <Progress value={percentage} className="h-1.5 bg-destructive/20" />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-destructive" />
                Seuil: {stock.seuil_alerte} {stock.unite}
              </p>
            </div>
          );
        })}
        
        {lowStocks.map(stock => {
          const percentage = stock.capacite_max 
            ? (stock.quantite_actuelle / stock.capacite_max) * 100 
            : (stock.quantite_actuelle / stock.seuil_alerte) * 75;
          
          return (
            <div key={stock.materiau} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-warning" />
                  <span className="font-medium">{stock.materiau}</span>
                </div>
                <span className="text-warning font-mono text-xs">
                  {stock.quantite_actuelle.toFixed(0)} {stock.unite}
                </span>
              </div>
              <Progress value={percentage} className="h-1.5 bg-warning/20" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
