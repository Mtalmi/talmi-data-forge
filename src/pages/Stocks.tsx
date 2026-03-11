import MainLayout from '@/components/layout/MainLayout';
import { AccessDenied } from '@/components/layout/AccessDenied';
import WorldClassStocks from '@/components/stocks/WorldClassStocks';
import { useAuth } from '@/hooks/useAuth';
import { usePreviewRole } from '@/hooks/usePreviewRole';
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
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const { previewRole } = usePreviewRole();
  const effectiveCentraliste = isCentraliste || previewRole === 'centraliste';
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

  // Sparkline data: 7-day daily net stock per material
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const fetchSparklines = useCallback(async () => {
    try {
      const sevenAgo = startOfDay(subDays(new Date(), 7)).toISOString();
      const { data } = await supabase
        .from('mouvements_stock')
        .select('materiau, quantite, type_mouvement, created_at')
        .gte('created_at', sevenAgo)
        .order('created_at', { ascending: true });
      if (!data) return;
      // Group by material → day → net change
      const byMat: Record<string, Record<string, number>> = {};
      data.forEach(m => {
        const mat = m.materiau;
        const day = m.created_at.slice(0, 10);
        if (!byMat[mat]) byMat[mat] = {};
        const sign = m.type_mouvement === 'consommation' || m.type_mouvement === 'sortie' ? -1 : 1;
        byMat[mat][day] = (byMat[mat][day] || 0) + m.quantite * sign;
      });
      // Build cumulative series per material
      const result: Record<string, number[]> = {};
      for (const [mat, days] of Object.entries(byMat)) {
        const sorted = Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
        let cum = 0;
        result[mat] = sorted.map(([, v]) => { cum += v; return cum; });
      }
      setSparklines(result);
    } catch (e) { console.error('Sparkline fetch error:', e); }
  }, []);
  useEffect(() => { fetchSparklines(); }, [fetchSparklines]);


  const canViewStocks = isCeo || isSuperviseur || isAgentAdministratif || isResponsableTechnique;
  const canCreateStockReception = isCeo || isSuperviseur || isAgentAdministratif;
  const canCreateStockAdjustment = isCeo || isSuperviseur || isAgentAdministratif;
  const canCreateQualityEntry = isCeo || isSuperviseur || isResponsableTechnique;
  const canValidatePendingReception = isCeo || isSuperviseur || isAgentAdministratif;
  const isReadOnly = false; // No read-only mode needed — blocked users simply can't access

  // Hard redirect if Centraliste tries to access Stocks
  if (!authLoading && effectiveCentraliste) {
    return <AccessDenied module="Stocks" reason="Le module Stocks est interdit aux Centralistes pour garantir la séparation des pouvoirs et prévenir la fraude matière." />;
  }
  
  const criticalStocks = getCriticalStocks();
  
  // Smart reorder: materials with < 3 days autonomy (real or mock)
  const criticalAutonomyMaterials = (() => {
    const real = getCriticalMaterials().map(a => {
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
    if (real.length > 0) return real;
    // Fallback: check raw stock levels for materials below 15% capacity
    return stocks
      .filter(s => s.capacite_max && (s.quantite_actuelle / s.capacite_max) < 0.15)
      .map(s => ({
        materiau: s.materiau,
        daysRemaining: 1,
        quantite_actuelle: s.quantite_actuelle,
        seuil_alerte: s.seuil_alerte,
        unite: s.unite,
        capacite_max: s.capacite_max,
      }));
  })();

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

  // Mock autonomy fallbacks when no consumption data exists
  const MOCK_AUTONOMY: Record<string, number> = {
    'Adjuvant': 1, 'Ciment': 5, 'Eau': 3, 'Gravette': 6, 'Sable': 8,
  };

  const getDaysRemaining = (materiau: string): number | undefined => {
    const auto = getAutonomyForMaterial(materiau);
    if (auto && auto.daysRemaining > 0 && auto.daysRemaining < 365) return auto.daysRemaining;
    const stat = consumptionStats.find(s => s.materiau === materiau);
    if (stat?.days_remaining && stat.days_remaining > 0 && stat.days_remaining < 365) return stat.days_remaining;
    // Fallback to mock data for demo
    return MOCK_AUTONOMY[materiau];
  };

  const getHoursRemaining = (materiau: string): number | undefined => {
    const auto = getAutonomyForMaterial(materiau);
    if (auto?.hoursRemaining) return auto.hoursRemaining;
    const mockDays = MOCK_AUTONOMY[materiau];
    return mockDays != null ? mockDays * 24 : undefined;
  };

  const getAvgDailyUsage = (materiau: string): number | undefined => {
    const auto = getAutonomyForMaterial(materiau);
    return auto?.avgDailyUsage;
  };

  const formatDaysRemaining = (days: number | undefined): string => {
    if (days === undefined) return '—';
    if (days > 365) return '—';
    return `~${Math.round(days * 10) / 10}j`;
  };

  const truncateRef = (ref: string | null | undefined): string => {
    if (!ref) return '—';
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}/i;
    if (uuidPattern.test(ref)) return ref.substring(0, 8) + '…';
    return ref.length > 16 ? ref.substring(0, 16) + '…' : ref;
  };

  return (
    <MainLayout>
      <div className="space-y-6" style={{ width: '100%', padding: '32px 24px' }}>

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
              <div className="flex flex-nowrap justify-evenly gap-6 overflow-x-auto">
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
                    sparklineData={sparklines[stock.materiau]}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SMART REORDER BANNER (AI) ── */}
        <SmartReorderBanner />



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

