import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Check, TrendingDown, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface StockVariance {
  materiau: string;
  app_stock: number;
  audit_stock: number | null;
  variance: number;
  variance_pct: number;
  last_audit_date: string | null;
}

interface StockVarianceWidgetProps {
  className?: string;
}

/**
 * Stock Variance Dashboard Widget
 * Shows gap between App Stock and Physical Audit levels
 * High-contrast Red/Green indicators
 */
export function StockVarianceWidget({ className }: StockVarianceWidgetProps) {
  const [variances, setVariances] = useState<StockVariance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVariances();
  }, []);

  const fetchVariances = async () => {
    try {
      setLoading(true);
      
      // Fetch current stocks
      const { data: stocks, error: stocksError } = await supabase
        .from('stocks')
        .select('materiau, quantite_actuelle, updated_at');
      
      if (stocksError) throw stocksError;

      // Fetch latest audit results (if available)
      const { data: audits, error: auditsError } = await supabase
        .from('audit_superviseur')
        .select('action, new_data, created_at')
        .eq('action', 'STOCK_AUDIT')
        .order('created_at', { ascending: false })
        .limit(10);

      if (auditsError) {
        console.log('No audit data available');
      }

      // Build variance data
      const varianceData: StockVariance[] = (stocks || []).map(stock => {
        // Find matching audit for this material
        const auditEntry = audits?.find(a => {
          const newData = a.new_data as { materiau?: string } | null;
          return newData?.materiau === stock.materiau;
        });

        const auditStock = auditEntry 
          ? (auditEntry.new_data as { audit_quantity?: number } | null)?.audit_quantity ?? null
          : null;
        
        const variance = auditStock !== null 
          ? stock.quantite_actuelle - auditStock 
          : 0;
        
        const variancePct = auditStock && auditStock > 0 
          ? (variance / auditStock) * 100 
          : 0;

        return {
          materiau: stock.materiau,
          app_stock: stock.quantite_actuelle,
          audit_stock: auditStock,
          variance,
          variance_pct: variancePct,
          last_audit_date: auditEntry?.created_at || null,
        };
      });

      setVariances(varianceData);
    } catch (error) {
      console.error('Error fetching variances:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalVariance = variances.reduce((sum, v) => sum + Math.abs(v.variance), 0);
  const hasIssues = variances.some(v => Math.abs(v.variance_pct) > 5);

  if (loading) {
    return (
      <div className={cn("card-industrial p-4", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-industrial overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Écart de Stock</h3>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold",
          hasIssues 
            ? "bg-destructive/20 text-destructive" 
            : "bg-success/20 text-success"
        )}>
          {hasIssues ? (
            <>
              <AlertTriangle className="h-3 w-3" />
              Écarts Détectés
            </>
          ) : (
            <>
              <Check className="h-3 w-3" />
              Stocks Cohérents
            </>
          )}
        </div>
      </div>

      {/* Variance List */}
      <div className="p-4 space-y-4">
        {variances.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Aucun stock configuré
          </div>
        ) : (
          variances.map((v) => {
            const isPositive = v.variance > 0;
            const isNegative = v.variance < 0;
            const isSignificant = Math.abs(v.variance_pct) > 5;
            const hasAuditData = v.audit_stock !== null;

            return (
              <div
                key={v.materiau}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  isSignificant && isNegative && "border-destructive/50 bg-destructive/5",
                  isSignificant && isPositive && "border-warning/50 bg-warning/5",
                  !isSignificant && "border-border bg-muted/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{v.materiau}</span>
                  {hasAuditData && (
                    <span className={cn(
                      "flex items-center gap-1 text-sm font-mono font-semibold",
                      isSignificant && isNegative && "text-destructive",
                      isSignificant && isPositive && "text-warning",
                      !isSignificant && "text-success"
                    )}>
                      {isNegative ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : null}
                      {v.variance > 0 ? '+' : ''}{v.variance.toFixed(1)}
                      <span className="text-xs ml-1">
                        ({v.variance_pct > 0 ? '+' : ''}{v.variance_pct.toFixed(1)}%)
                      </span>
                    </span>
                  )}
                </div>

                {hasAuditData ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Application: {v.app_stock.toLocaleString()}</span>
                      <span>Audit: {v.audit_stock?.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.abs(v.variance_pct) * 2)} 
                      className={cn(
                        "h-2",
                        isSignificant && isNegative && "[&>div]:bg-destructive",
                        isSignificant && isPositive && "[&>div]:bg-warning",
                        !isSignificant && "[&>div]:bg-success"
                      )}
                    />
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Stock App: {v.app_stock.toLocaleString()}</span>
                    <span className="text-muted-foreground/50">• Aucun audit</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary */}
      {variances.some(v => v.audit_stock !== null) && (
        <div className="p-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Écart Total:</span>
            <span className={cn(
              "font-mono font-bold",
              totalVariance > 100 ? "text-destructive" : "text-foreground"
            )}>
              {totalVariance.toLocaleString()} unités
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
