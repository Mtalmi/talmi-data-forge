import MainLayout from '@/components/layout/MainLayout';
import WorldClassStocks from '@/components/stocks/WorldClassStocks';
import { useAuth } from '@/hooks/useAuth';
import { useStocks } from '@/hooks/useStocks';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { SiloVisual } from '@/components/stocks/SiloVisual';
import { TwoStepReceptionWizard } from '@/components/stocks/TwoStepReceptionWizard';
import { StockAdjustmentDialog } from '@/components/stocks/StockAdjustmentDialog';
import { RecentReceptionsCard } from '@/components/stocks/RecentReceptionsCard';
import { QualityStockEntryDialog } from '@/components/stocks/QualityStockEntryDialog';
import { PendingReceptionsWidget } from '@/components/stocks/PendingReceptionsWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Warehouse,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingDown,
  Shield,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Stocks() {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const { isCeo, isSuperviseur, isAgentAdministratif, isCentraliste, isResponsableTechnique, canAddStockReception, canAdjustStockManually, loading: authLoading } = useAuth();
  const {
    stocks,
    mouvements,
    consumptionStats,
    loading,
    fetchStocks,
    fetchMouvements,
    getCriticalStocks,
  } = useStocks();

  // =====================================================
  // ZERO-TRUST SEPARATION OF POWERS:
  // - Centraliste: ZERO manual access (read-only)
  // - Resp. Technique: Can create Quality Entry (Step 1 of Double-Lock)
  // - Agent Admin: Can validate Quality Entry (Step 2) or direct reception
  // - CEO/Superviseur: Full access including manual adjustments
  // =====================================================
  const canCreateQualityEntry = isCeo || isSuperviseur || isResponsableTechnique;
  const canValidatePendingReception = isCeo || isSuperviseur || isAgentAdministratif;
  const isReadOnly = isCentraliste && !isCeo && !isSuperviseur;
  
  const criticalStocks = getCriticalStocks();

  const handleRefresh = () => {
    fetchStocks();
    fetchMouvements();
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'reception':
        return <ArrowUp className="h-4 w-4 text-success" />;
      case 'consommation':
        return <ArrowDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'reception':
        return t.pages.stocks.reception;
      case 'consommation':
        return t.pages.stocks.consumption;
      default:
        return t.pages.stocks.adjustment;
    }
  };

  const getDaysRemaining = (materiau: string): number | undefined => {
    const stat = consumptionStats.find(s => s.materiau === materiau);
    return stat?.days_remaining;
  };

  return (
    <MainLayout>
      <WorldClassStocks />
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <Warehouse className="h-5 w-5 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span className="truncate">{t.pages.stocks.title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              {t.pages.stocks.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.common.refresh}</span>
            </Button>
            
            {/* =====================================================
                STOCK ACTION BUTTONS - Role-Based Visibility
                Quality Entry: CEO, SUPERVISEUR, RESP_TECHNIQUE
                Direct Reception: CEO, SUPERVISEUR, AGENT_ADMIN
                Manual Adjustment: CEO, SUPERVISEUR ONLY
                Shows skeleton while auth is loading
            ===================================================== */}
            {authLoading ? (
              <>
                <Skeleton className="w-32 h-10 rounded-md" />
                <Skeleton className="w-32 h-10 rounded-md" />
                <Skeleton className="w-32 h-10 rounded-md" />
              </>
            ) : (
              <>
                {/* Quality Entry Button - Resp. Technique (Double-Lock Step 1) */}
                {canCreateQualityEntry && (
                  <QualityStockEntryDialog stocks={stocks} onRefresh={handleRefresh} />
                )}
                
                {/* Direct Reception Button - CEO/Superviseur/Agent Admin only */}
                {canAddStockReception && (
                  <TwoStepReceptionWizard stocks={stocks} onRefresh={handleRefresh} />
                )}
                
                {/* Manual Adjustment - CEO/Superviseur ONLY */}
                {canAdjustStockManually && (
                  <StockAdjustmentDialog stocks={stocks} onRefresh={handleRefresh} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Read-Only Warning for Centraliste */}
        {isReadOnly && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-center gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t.pages.stocks.readOnlyMode}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.pages.stocks.readOnlyDescription}
              </p>
            </div>
          </div>
        )}

        {/* Pending Receptions Queue - Admin Financial Gate (Double-Lock Step 2) */}
        {canValidatePendingReception && (
          <PendingReceptionsWidget onRefresh={handleRefresh} />
        )}

        {/* Recent Receptions Indicator */}
        <RecentReceptionsCard mouvements={mouvements} />

        {/* Critical Alerts Banner */}
        {criticalStocks.length > 0 && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 flex items-center gap-4">
            <div className="p-2 rounded-full bg-destructive/20 animate-pulse">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-destructive uppercase tracking-wide">
                {t.pages.stocks.criticalOrderRequired}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {criticalStocks.map(s => s.materiau).join(', ')} - {t.pages.stocks.belowAlertThreshold}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {criticalStocks.map(s => {
                const days = getDaysRemaining(s.materiau);
                return (
                  <div key={s.materiau} className="text-center px-3 py-1 rounded bg-destructive/20">
                    <p className="text-xs text-muted-foreground">{s.materiau}</p>
                    <p className="font-mono font-bold text-destructive">
                      {days !== undefined && days <= 999 ? `${days}j` : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Silo Dashboard */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="card-industrial p-8">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              {t.pages.stocks.siloLevels}
            </h2>
            <div className="flex flex-wrap justify-center gap-12">
              {stocks.map((stock) => (
                <SiloVisual
                  key={stock.materiau}
                  materiau={stock.materiau}
                  quantite={stock.quantite_actuelle}
                  capacite={stock.capacite_max || stock.quantite_actuelle * 2}
                  seuil={stock.seuil_alerte}
                  unite={stock.unite}
                  daysRemaining={getDaysRemaining(stock.materiau)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stock Table Summary */}
        <div className="card-industrial overflow-x-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">{t.pages.stocks.stockSummary}</h2>
          </div>
          <Table className="data-table-industrial">
            <TableHeader>
              <TableRow>
                <TableHead>{t.pages.stocks.material}</TableHead>
                <TableHead className="text-right">{t.pages.stocks.currentStock}</TableHead>
                <TableHead className="text-right">{t.pages.stocks.alertThreshold}</TableHead>
                <TableHead className="text-right">{t.pages.stocks.maxCapacity}</TableHead>
                <TableHead className="text-right">{t.pages.stocks.daysRemaining}</TableHead>
                <TableHead>{t.pages.stocks.lastReception}</TableHead>
                <TableHead>{t.common.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => {
                const days = getDaysRemaining(stock.materiau);
                const isCritical = stock.quantite_actuelle <= stock.seuil_alerte;
                
                return (
                  <TableRow key={stock.materiau} className={cn(isCritical && 'bg-destructive/5')}>
                    <TableCell className="font-medium">{stock.materiau}</TableCell>
                    <TableCell className="text-right font-mono">
                      {stock.quantite_actuelle.toLocaleString()} {stock.unite}
                    </TableCell>
                    <TableCell className="text-right font-mono text-warning">
                      {stock.seuil_alerte.toLocaleString()} {stock.unite}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {stock.capacite_max?.toLocaleString() || '—'} {stock.unite}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-mono font-semibold',
                        days !== undefined && days <= 3 ? 'text-destructive' :
                        days !== undefined && days <= 7 ? 'text-warning' :
                        'text-muted-foreground'
                      )}>
                        {days !== undefined && days <= 999 ? `${days}j` : '∞'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {stock.derniere_reception_at
                        ? format(new Date(stock.derniere_reception_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-destructive/20 text-destructive animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          {t.pages.stocks.critical}
                        </span>
                      ) : stock.quantite_actuelle <= stock.seuil_alerte * 1.5 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning">
                          {t.pages.stocks.low}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-success/20 text-success">
                          {t.pages.stocks.ok}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Recent Movements */}
        <div className="card-industrial overflow-x-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">{t.pages.stocks.recentMovements}</h2>
          </div>
          {mouvements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t.pages.stocks.noMovements}
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>{t.common.date}</TableHead>
                  <TableHead>{t.pages.stocks.type}</TableHead>
                  <TableHead>{t.pages.stocks.material}</TableHead>
                  <TableHead className="text-right">{t.pages.stocks.quantity}</TableHead>
                  <TableHead className="text-right">{t.pages.stocks.before}</TableHead>
                  <TableHead className="text-right">{t.pages.stocks.after}</TableHead>
                  <TableHead>{t.pages.stocks.reference}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.slice(0, 20).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        {getMovementIcon(m.type_mouvement)}
                        <span className="text-sm">{getMovementLabel(m.type_mouvement)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{m.materiau}</TableCell>
                    <TableCell className={cn(
                      'text-right font-mono font-semibold',
                      m.type_mouvement === 'reception' ? 'text-success' : 'text-destructive'
                    )}>
                      {m.type_mouvement === 'reception' ? '+' : '-'}{Math.abs(m.quantite).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {m.quantite_avant.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {m.quantite_apres.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.fournisseur || m.reference_id || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
