import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useStocks } from '@/hooks/useStocks';
import { SiloVisual } from '@/components/stocks/SiloVisual';
import { TwoStepReceptionWizard } from '@/components/stocks/TwoStepReceptionWizard';
import { StockAdjustmentDialog } from '@/components/stocks/StockAdjustmentDialog';
import { RecentReceptionsCard } from '@/components/stocks/RecentReceptionsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Stocks() {
  const { isCeo, isSuperviseur, isAgentAdministratif, isCentraliste } = useAuth();
  const {
    stocks,
    mouvements,
    consumptionStats,
    loading,
    fetchStocks,
    fetchMouvements,
    getCriticalStocks,
  } = useStocks();

  // SEPARATION OF POWERS:
  // - Centraliste: ZERO manual access (read-only)
  // - Agent Admin: Can add receptions ONLY (with photo proof)
  // - CEO/Superviseur: Full access including manual adjustments
  const canAddReception = isCeo || isSuperviseur || isAgentAdministratif;
  const canAdjustManually = isCeo || isSuperviseur;
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
        return 'Réception';
      case 'consommation':
        return 'Consommation';
      default:
        return 'Ajustement';
    }
  };

  const getDaysRemaining = (materiau: string): number | undefined => {
    const stat = consumptionStats.find(s => s.materiau === materiau);
    return stat?.days_remaining;
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <Warehouse className="h-5 w-5 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span className="truncate">Gestion des Stocks</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Suivi en temps réel des niveaux de matières premières
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            
            {/* Reception Button - CEO/Superviseur/Agent Admin only - 2-Step Wizard */}
            {canAddReception && (
              <TwoStepReceptionWizard stocks={stocks} onRefresh={handleRefresh} />
            )}
            
            {/* Manual Adjustment - CEO/Superviseur ONLY */}
            {canAdjustManually && (
              <StockAdjustmentDialog stocks={stocks} onRefresh={handleRefresh} />
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
                Mode Consultation
              </h3>
              <p className="text-sm text-muted-foreground">
                Les stocks sont mis à jour automatiquement lors de la production. Aucune modification manuelle autorisée.
              </p>
            </div>
          </div>
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
                ⚠️ Commande Critique Requise
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {criticalStocks.map(s => s.materiau).join(', ')} - Stock en dessous du seuil d'alerte
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
              Niveaux des Silos
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
            <h2 className="font-semibold">Résumé des Stocks</h2>
          </div>
          <Table className="data-table-industrial">
            <TableHeader>
              <TableRow>
                <TableHead>Matériau</TableHead>
                <TableHead className="text-right">Quantité Actuelle</TableHead>
                <TableHead className="text-right">Seuil Alerte</TableHead>
                <TableHead className="text-right">Capacité Max</TableHead>
                <TableHead className="text-right">Jours Restants</TableHead>
                <TableHead>Dernière Réception</TableHead>
                <TableHead>Statut</TableHead>
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
                        ? format(new Date(stock.derniere_reception_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-destructive/20 text-destructive animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          Critique
                        </span>
                      ) : stock.quantite_actuelle <= stock.seuil_alerte * 1.5 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-warning/20 text-warning">
                          Bas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-success/20 text-success">
                          OK
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
            <h2 className="font-semibold">Derniers Mouvements</h2>
          </div>
          {mouvements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucun mouvement enregistré
            </div>
          ) : (
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Matériau</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Avant</TableHead>
                  <TableHead className="text-right">Après</TableHead>
                  <TableHead>Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.slice(0, 20).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
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
