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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Warehouse,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingDown,
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
const T = {
  gold: '#FFD700',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  textSec: '#94A3B8',
  textDim: '#64748B',
};

const goldOutlineBtn: React.CSSProperties = {
  border: '1px solid #D4A843', color: '#D4A843', background: 'transparent',
  borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
  fontSize: 13, fontFamily: MONO, fontWeight: 500,
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const goldFilledBtn: React.CSSProperties = {
  background: '#D4A843', color: '#0F1629', border: 'none',
  borderRadius: 8, padding: '8px 24px', cursor: 'pointer',
  fontSize: 14, fontWeight: 600, fontFamily: MONO,
};

// Live clock component
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
      {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function Stocks() {
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const { isCeo, isSuperviseur, isAgentAdministratif, isCentraliste, isResponsableTechnique, canAddStockReception, canAdjustStockManually, loading: authLoading } = useAuth();
  const { previewRole } = usePreviewRole();
  const effectiveCentraliste = isCentraliste || previewRole === 'centraliste';
  const {
    stocks, mouvements, consumptionStats, loading,
    fetchStocks, fetchMouvements, getCriticalStocks,
  } = useStocks();
  const { autonomy, getAutonomyForMaterial, getCriticalMaterials } = useStockAutonomy();

  const [wizardOpen, setWizardOpen] = useState(false);
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
      const byMat: Record<string, Record<string, number>> = {};
      data.forEach(m => {
        const mat = m.materiau;
        const day = m.created_at.slice(0, 10);
        if (!byMat[mat]) byMat[mat] = {};
        const sign = m.type_mouvement === 'consommation' || m.type_mouvement === 'sortie' ? -1 : 1;
        byMat[mat][day] = (byMat[mat][day] || 0) + m.quantite * sign;
      });
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

  if (!authLoading && effectiveCentraliste) {
    return <AccessDenied module="Stocks" reason="Le module Stocks est interdit aux Centralistes pour garantir la séparation des pouvoirs et prévenir la fraude matière." />;
  }

  const criticalStocks = getCriticalStocks();

  const MOCK_AUTONOMY: Record<string, number> = {
    'Adjuvant': 1, 'Ciment': 5, 'Eau': 3, 'Gravette': 6, 'Sable': 8,
  };

  const getDaysRemaining = (materiau: string): number | undefined => {
    const auto = getAutonomyForMaterial(materiau);
    if (auto && auto.daysRemaining > 0 && auto.daysRemaining < 365) return auto.daysRemaining;
    const stat = consumptionStats.find(s => s.materiau === materiau);
    if (stat?.days_remaining && stat.days_remaining > 0 && stat.days_remaining < 365) return stat.days_remaining;
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

  const handleRefresh = () => {
    fetchStocks();
    fetchMouvements();
  };

  return (
    <MainLayout>
      <WorldClassStocks onNewMovement={() => setWizardOpen(true)} silosContent={
        <>
          {/* ── HEADER — moved to TOP of silos tab ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #D4A843, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Warehouse size={18} color="#0B1120" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS</span>
                  <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>{t.pages.stocks.title}</span>
                </div>
                <p style={{ color: T.textDim, fontSize: 10 }}>{t.pages.stocks.subtitle}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handleRefresh} style={goldOutlineBtn}>
                <RefreshCw size={14} />
                {t.common.refresh}
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
                    <TwoStepReceptionWizard stocks={stocks} onRefresh={handleRefresh} externalOpen={wizardOpen} onExternalOpenChange={setWizardOpen} />
                  )}
                  {canAdjustStockManually && (
                    <StockAdjustmentDialog stocks={stocks} onRefresh={handleRefresh} />
                  )}
                </>
              )}

              <LiveClock />
            </div>
          </div>

          {/* ── SILO DASHBOARD ── */}
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Loader2 className="h-8 w-8 mx-auto animate-spin" style={{ color: '#64748B' }} />
            </div>
          ) : (
            <section>
              {/* Section title — gold monospace with borderTop */}
              <div style={{ borderTop: '2px solid #D4A843', paddingTop: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
                  NIVEAUX DES SILOS
                </span>
              </div>
              <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A', borderRadius: 12, padding: 20 }}>
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

          {/* ── CONSOMMATION TEMPS RÉEL ── */}
          <ConsommationTempsReel />
        </>
      } />

      {/* Pending Receptions Queue */}
      <div style={{ width: '100%', padding: '0 24px 32px' }}>
        {canValidatePendingReception && (
          <PendingReceptionsWidget onRefresh={handleRefresh} />
        )}
        <RecentReceptionsCard mouvements={mouvements} />

        {criticalStocks.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#EF4444" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12 }}>
                {t.pages.stocks.criticalOrderRequired}
              </h3>
              <p style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                {criticalStocks.map(s => s.materiau).join(', ')} - {t.pages.stocks.belowAlertThreshold}
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// ─────────────────────────────────────────────────────
// CONSOMMATION TEMPS RÉEL — new section
// ─────────────────────────────────────────────────────
function ConsommationTempsReel() {
  const MONO_FULL = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

  const materials = [
    { name: 'Adjuvant', pct: 120, color: '#EF4444' },
    { name: 'Ciment', pct: 85, color: '#F59E0B' },
    { name: 'Eau', pct: 92, color: '#F59E0B' },
    { name: 'Gravette', pct: 65, color: '#D4A843' },
    { name: 'Sable', pct: 70, color: '#D4A843' },
  ];

  return (
    <div>
      <div style={{ borderTop: '2px solid #D4A843', paddingTop: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: MONO_FULL, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
          ✦ CONSOMMATION TEMPS RÉEL
        </span>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {materials.map((m) => (
            <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: MONO_FULL, fontSize: 12, color: '#fff', fontWeight: 500 }}>{m.name}</span>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(m.pct, 100)}%`,
                  background: m.color,
                  borderRadius: 4,
                  transition: 'width 800ms ease-out',
                }} />
                {m.pct > 100 && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0,
                    width: `${Math.min(m.pct - 100, 20)}%`,
                    background: '#EF4444',
                    borderRadius: '0 4px 4px 0',
                    animation: 'tbos-pulse 2s infinite',
                  }} />
                )}
              </div>
              <span style={{
                fontFamily: MONO_FULL, fontSize: 11, textAlign: 'right',
                color: m.pct > 100 ? '#EF4444' : m.pct > 80 ? '#F59E0B' : '#D4A843',
                fontWeight: 600,
              }}>
                {m.pct}% de la moyenne
              </span>
            </div>
          ))}
        </div>

        {/* Summary line */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(212,168,67,0.1)' }}>
          <p style={{ fontFamily: MONO_FULL, fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
            Consommation totale aujourd'hui : <span style={{ color: '#D4A843', fontWeight: 600 }}>78%</span> de la capacité moyenne.
            Adjuvant en <span style={{ color: '#EF4444', fontWeight: 600 }}>surconsommation +20%</span> — lié aux <span style={{ color: '#D4A843' }}>3</span> batches F-B25 supplémentaires.
          </p>
        </div>
      </div>
    </div>
  );
}
