import MainLayout from '@/components/layout/MainLayout';
import WorldClassStocks from '@/components/stocks/WorldClassStocks';
import { useAuth } from '@/hooks/useAuth';
import { useStocks } from '@/hooks/useStocks';
import { useStockAutonomy } from '@/hooks/useStockAutonomy';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { SiloVisual } from '@/components/stocks/SiloVisual';
import { SmartReorderBanner } from '@/components/stocks/SmartReorderBanner';
import { TwoStepReceptionWizard } from '@/components/stocks/TwoStepReceptionWizard';
import { StockAdjustmentDialog } from '@/components/stocks/StockAdjustmentDialog';
import { RecentReceptionsCard } from '@/components/stocks/RecentReceptionsCard';
import { QualityStockEntryDialog } from '@/components/stocks/QualityStockEntryDialog';
import { PendingReceptionsWidget } from '@/components/stocks/PendingReceptionsWidget';
import { Button } from '@/components/ui/button';
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
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── DESIGN TOKENS (unified) ───
const T = {
  gold: '#FFD700',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  textSec: '#94A3B8',
  textDim: '#64748B',
};

// ─── SECTION HEADER ───
function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon size={16} strokeWidth={1.5} style={{ color: T.gold, flexShrink: 0 }} />
      <span style={{
        color: T.gold, fontWeight: 700, fontSize: 12,
        textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${T.gold}33 0%, transparent 80%)` }} />
    </div>
  );
}

// ─── TABLE HEADER CELL STYLE ───
const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: T.textSec,
};

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
  const { autonomy, getAutonomyForMaterial, getCriticalMaterials } = useStockAutonomy();

  const canViewStocks = isCeo || isSuperviseur || isAgentAdministratif || isCentraliste || isResponsableTechnique;
  const canCreateStockReception = isCeo || isSuperviseur || isAgentAdministratif;
  const canCreateStockAdjustment = isCeo || isSuperviseur || isAgentAdministratif;
  const canCreateQualityEntry = isCeo || isSuperviseur || isResponsableTechnique;
  const canValidatePendingReception = isCeo || isSuperviseur || isAgentAdministratif;
  const isReadOnly = isCentraliste && !isCeo && !isSuperviseur;
  
  const criticalStocks = getCriticalStocks();
  
  // Smart reorder: materials with < 3 days autonomy
  const criticalAutonomyMaterials = getCriticalMaterials().map(a => {
    const stock = stocks.find(s => s.materiau === a.materiau);
    return {
      materiau: a.materiau,
      daysRemaining: a.daysRemaining,
      quantite_actuelle: a.quantite_actuelle,
      seuil_alerte: a.seuil_alerte,
      unite: a.unite,
      capacite_max: stock?.capacite_max || null,
    };
  });

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
    const auto = getAutonomyForMaterial(materiau);
    if (auto) return auto.daysRemaining;
    const stat = consumptionStats.find(s => s.materiau === materiau);
    return stat?.days_remaining;
  };

  const getHoursRemaining = (materiau: string): number | undefined => {
    const auto = getAutonomyForMaterial(materiau);
    return auto?.hoursRemaining;
  };

  const getAvgDailyUsage = (materiau: string): number | undefined => {
    const auto = getAutonomyForMaterial(materiau);
    return auto?.avgDailyUsage;
  };

  const formatDaysRemaining = (days: number | undefined): string => {
    if (days === undefined) return '—';
    if (days > 365) return '—';
    return `${days}j`;
  };

  const truncateRef = (ref: string | null | undefined): string => {
    if (!ref) return '—';
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}/i;
    if (uuidPattern.test(ref)) return ref.substring(0, 8) + '…';
    return ref.length > 16 ? ref.substring(0, 16) + '…' : ref;
  };

  return (
    <MainLayout>
      <div className="space-y-6" style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── HEADER — transparent, no card wrapper ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #D4A843, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Warehouse size={18} color="#0B1120" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS</span>
                <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>{t.pages.stocks.title}</span>
              </div>
              <p style={{ color: T.textDim, fontSize: 10 }}>{t.pages.stocks.subtitle}</p>
            </div>
          </div>

          {/* Action buttons — floating in header row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              style={{
                padding: '6px 16px', borderRadius: 8,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                color: T.textSec, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">{t.common.refresh}</span>
            </button>

            {authLoading ? (
              <>
                <Skeleton className="w-32 h-9 rounded-md" />
                <Skeleton className="w-32 h-9 rounded-md" />
              </>
            ) : (
              <>
                {canCreateQualityEntry && (
                  <QualityStockEntryDialog stocks={stocks} onRefresh={handleRefresh} />
                )}
                {canAddStockReception && (
                  <TwoStepReceptionWizard stocks={stocks} onRefresh={handleRefresh} />
                )}
                {canAdjustStockManually && (
                  <StockAdjustmentDialog stocks={stocks} onRefresh={handleRefresh} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Read-Only Warning for Centraliste */}
        {isReadOnly && (
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} color={T.gold} />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: T.textSec, fontSize: 13 }}>
                <Shield className="h-4 w-4" />
                {t.pages.stocks.readOnlyMode}
              </h3>
              <p style={{ color: T.textDim, fontSize: 11 }}>
                {t.pages.stocks.readOnlyDescription}
              </p>
            </div>
          </div>
        )}

        {/* Pending Receptions Queue */}
        {canValidatePendingReception && (
          <PendingReceptionsWidget onRefresh={handleRefresh} />
        )}

        {/* Recent Receptions Indicator */}
        <RecentReceptionsCard mouvements={mouvements} />

        {/* Critical Alerts Banner */}
        {criticalStocks.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#EF4444" />
            </div>
            <div className="flex-1">
              <h3 style={{ fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12 }}>
                {t.pages.stocks.criticalOrderRequired}
              </h3>
              <p style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                {criticalStocks.map(s => s.materiau).join(', ')} - {t.pages.stocks.belowAlertThreshold}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {criticalStocks.map(s => {
                const days = getDaysRemaining(s.materiau);
                return (
                  <div key={s.materiau} style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)' }}>
                    <p style={{ fontSize: 10, color: T.textDim }}>{s.materiau}</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#EF4444', fontSize: 13 }}>
                      {formatDaysRemaining(days)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SILO DASHBOARD ── */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin" style={{ color: T.textDim }} />
          </div>
        ) : (
          <section>
            <SectionHeader icon={TrendingDown} label={t.pages.stocks.siloLevels} />
            <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20 }}>
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
                    hoursRemaining={getHoursRemaining(stock.materiau)}
                    avgDailyUsage={getAvgDailyUsage(stock.materiau)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SMART REORDER BANNER (AI) ── */}
        <SmartReorderBanner criticalMaterials={criticalAutonomyMaterials} />

        {/* ── STOCK SUMMARY TABLE ── */}
        <section>
          <SectionHeader icon={Activity} label={t.pages.stocks.stockSummary} />
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
            <Table className="data-table-industrial">
              <TableHeader>
                <TableRow>
                  <TableHead style={thStyle}>{t.pages.stocks.material}</TableHead>
                  <TableHead style={{ ...thStyle, textAlign: 'right' }}>{t.pages.stocks.currentStock}</TableHead>
                  <TableHead style={{ ...thStyle, textAlign: 'right' }}>{t.pages.stocks.alertThreshold}</TableHead>
                  <TableHead style={{ ...thStyle, textAlign: 'right' }}>{t.pages.stocks.maxCapacity}</TableHead>
                  <TableHead style={{ ...thStyle, textAlign: 'right' }}>{t.pages.stocks.daysRemaining}</TableHead>
                  <TableHead style={thStyle}>{t.pages.stocks.lastReception}</TableHead>
                  <TableHead style={thStyle}>{t.common.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => {
                  const days = getDaysRemaining(stock.materiau);
                  const isCritical = stock.quantite_actuelle <= stock.seuil_alerte;
                  
                  return (
                    <TableRow key={stock.materiau} className="table-row-hover" style={isCritical ? { background: 'rgba(239,68,68,0.04)' } : undefined}>
                      <TableCell className="font-medium">{stock.materiau}</TableCell>
                      <TableCell className="text-right font-mono">
                        {stock.quantite_actuelle.toLocaleString()} {stock.unite}
                      </TableCell>
                      <TableCell className="text-right font-mono" style={{ color: T.gold }}>
                        {stock.seuil_alerte.toLocaleString()} {stock.unite}
                      </TableCell>
                      <TableCell className="text-right font-mono" style={{ color: T.textDim }}>
                        {stock.capacite_max?.toLocaleString() || '—'} {stock.unite}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-semibold" style={{
                          color: days !== undefined && days <= 3 ? '#EF4444' :
                                 days !== undefined && days <= 7 ? T.gold : T.textDim
                        }}>
                          {formatDaysRemaining(days)}
                        </span>
                      </TableCell>
                      <TableCell style={{ color: T.textDim }}>
                        {stock.derniere_reception_at
                          ? format(new Date(stock.derniere_reception_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {isCritical ? (
                          <span className="animate-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
                            <AlertTriangle size={10} />
                            {t.pages.stocks.critical}
                          </span>
                        ) : stock.quantite_actuelle <= stock.seuil_alerte * 1.5 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,215,0,0.12)', border: `1px solid rgba(255,215,0,0.3)`, color: T.gold, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
                            {t.pages.stocks.low}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
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
        </section>

        {/* ── RECENT MOVEMENTS TABLE ── */}
        <section>
          <SectionHeader icon={Activity} label={t.pages.stocks.recentMovements} />
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
            {mouvements.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: T.textDim, fontSize: 13 }}>
                {t.pages.stocks.noMovements}
              </div>
            ) : (
              <Table className="data-table-industrial">
                <TableHeader>
                  <TableRow>
                    <TableHead style={thStyle}>{t.common.date}</TableHead>
                    <TableHead style={thStyle}>{t.pages.stocks.type}</TableHead>
                    <TableHead style={thStyle}>{t.pages.stocks.material}</TableHead>
                    <TableHead style={{ ...thStyle, textAlign: 'right' }}>{t.pages.stocks.quantity}</TableHead>
                    <TableHead style={{ ...thStyle, textAlign: 'right' }}>{t.pages.stocks.before}</TableHead>
                    <TableHead style={{ ...thStyle, textAlign: 'right' }}>{t.pages.stocks.after}</TableHead>
                    <TableHead style={thStyle}>{t.pages.stocks.reference}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mouvements.slice(0, 20).map((m) => (
                    <TableRow key={m.id} className="table-row-hover">
                      <TableCell style={{ color: T.textDim }}>
                        {format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale || undefined })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          {getMovementIcon(m.type_mouvement)}
                          <span style={{ fontSize: 12 }}>{getMovementLabel(m.type_mouvement)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{m.materiau}</TableCell>
                      <TableCell className="text-right font-mono font-semibold" style={{
                        color: m.type_mouvement === 'reception' ? '#10B981' : '#EF4444'
                      }}>
                        {m.type_mouvement === 'reception' ? '+' : '-'}{Math.abs(m.quantite).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono" style={{ color: T.textDim }}>
                        {m.quantite_avant.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {m.quantite_apres.toLocaleString()}
                      </TableCell>
                      <TableCell style={{ color: T.textDim, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                        {truncateRef(m.fournisseur || m.reference_id)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </section>

      </div>
      <WorldClassStocks />
    </MainLayout>
  );
}

