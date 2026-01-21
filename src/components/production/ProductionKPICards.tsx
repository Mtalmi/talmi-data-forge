import { Factory, TrendingUp, AlertTriangle, CheckCircle, Wifi, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProductionKPICardsProps {
  totalBons: number;
  totalVolume: number;
  avgCUR: number;
  deviationCount: number;
  machineSyncCount: number;
  validatedCount: number;
  criticalStocks: { materiau: string; quantite: number; seuil: number; unite: string }[];
}

export function ProductionKPICards({
  totalBons,
  totalVolume,
  avgCUR,
  deviationCount,
  machineSyncCount,
  validatedCount,
  criticalStocks,
}: ProductionKPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Total Bons */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">En Production</span>
          </div>
          <p className="text-2xl font-bold text-primary mt-1">{totalBons}</p>
          <p className="text-xs text-muted-foreground">bons</p>
        </CardContent>
      </Card>

      {/* Total Volume */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Volume</span>
          </div>
          <p className="text-2xl font-bold text-blue-500 mt-1">{totalVolume.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">m³</p>
        </CardContent>
      </Card>

      {/* Average CUR */}
      <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">CUR Moyen</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {avgCUR > 0 ? avgCUR.toFixed(0) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">DH/m³</p>
        </CardContent>
      </Card>

      {/* Validated */}
      <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Validés</span>
          </div>
          <p className="text-2xl font-bold text-purple-500 mt-1">{validatedCount}</p>
          <p className="text-xs text-muted-foreground">/ {totalBons}</p>
        </CardContent>
      </Card>

      {/* Machine Sync */}
      <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Sync Machine</span>
          </div>
          <p className="text-2xl font-bold text-success mt-1">{machineSyncCount}</p>
          <p className="text-xs text-muted-foreground">
            {totalBons > 0 ? Math.round((machineSyncCount / totalBons) * 100) : 0}%
          </p>
        </CardContent>
      </Card>

      {/* Deviations / Stock Alerts */}
      <Card className={cn(
        "bg-gradient-to-br border",
        deviationCount > 0 || criticalStocks.length > 0
          ? "from-destructive/5 to-destructive/10 border-destructive/20"
          : "from-muted/5 to-muted/10 border-muted/20"
      )}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-4 w-4",
              deviationCount > 0 || criticalStocks.length > 0 ? "text-destructive" : "text-muted-foreground"
            )} />
            <span className="text-xs text-muted-foreground">Alertes</span>
          </div>
          <p className={cn(
            "text-2xl font-bold mt-1",
            deviationCount > 0 || criticalStocks.length > 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {deviationCount + criticalStocks.length}
          </p>
          <p className="text-xs text-muted-foreground">
            {deviationCount} écarts, {criticalStocks.length} stocks
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
