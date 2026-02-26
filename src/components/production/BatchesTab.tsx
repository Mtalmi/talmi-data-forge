import { useState, useMemo, useEffect } from 'react';
import {
  Factory, CheckCircle, Shield, Clock, Search, SlidersHorizontal,
  Play, Eye, RefreshCw, Download, BarChart3, Wifi, AlertTriangle,
  ChevronRight, Zap, Activity, Droplets, TrendingUp, Maximize2,
} from 'lucide-react';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#D4A843',
  goldBorder: 'rgba(212,168,67,0.3)',
  cardBg:     'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────
interface BonRow {
  bl_id: string;
  volume_m3: number;
  workflow_status: string;
  heure_prevue: string | null;
  camion_assigne: string | null;
  chauffeur_nom: string | null;
  formule_id: string | null;
  client_id?: string;
  bc_id?: string;
  quality_status: string | null;
  production_batch_time: string | null;
  variance_ciment_pct: number | null;
  variance_eau_pct: number | null;
}

interface BatchesTabProps {
  bons: BonRow[];
  batches: any[];
  loading: boolean;
}

// ─────────────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────────────
function getStatusInfo(status: string, variancePct: number | null) {
  const hasHighVariance = (variancePct || 0) > 5;
  if (hasHighVariance) return { label: 'Écart', color: T.danger, dot: T.danger };
  switch (status) {
    case 'planification': return { label: 'Planifié', color: T.gold, dot: T.gold };
    case 'production': return { label: 'En Production', color: T.info, dot: T.info };
    case 'validation_technique': return { label: 'Validé', color: T.success, dot: T.success };
    default: return { label: status || '—', color: T.textDim, dot: T.textDim };
  }
}

function getProgressPercent(status: string) {
  switch (status) {
    case 'planification': return 15;
    case 'production': return 55;
    case 'validation_technique': return 100;
    default: return 0;
  }
}

// ─────────────────────────────────────────────────────
// MINI KPI CARD
// ─────────────────────────────────────────────────────
function MiniKPI({ label, value, suffix, sub, icon: Icon }: {
  label: string; value: string | number; suffix?: string; sub?: string; icon: any;
}) {
  return (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.cardBorder}`,
      borderRadius: 12, padding: 16,
    }}>
      <Icon size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: 8 }} />
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
        {value}
        {suffix && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginLeft: 3 }}>{suffix}</span>}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{sub}</p>}
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.40)', fontWeight: 500, marginTop: 4 }}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────────────────
function InlineClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// FILTER TAB ICONS
// ─────────────────────────────────────────────────────
const tabIcons: Record<string, any> = {
  planifies: Clock,
  production: Play,
  valides: CheckCircle,
  ecarts: AlertTriangle,
};

// ─────────────────────────────────────────────────────
// MAIN BATCHES TAB
// ─────────────────────────────────────────────────────
export default function BatchesTab({ bons, batches, loading }: BatchesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('tous');

  // ── Derived counts ──
  const counts = useMemo(() => {
    const planned = bons.filter(b => b.workflow_status === 'planification').length;
    const inProd = bons.filter(b => b.workflow_status === 'production').length;
    const validated = bons.filter(b => b.workflow_status === 'validation_technique').length;
    const ecarts = bons.filter(b => (b.variance_ciment_pct || 0) > 5 || (b.variance_eau_pct || 0) > 5).length;
    return { total: bons.length, planned, inProd, validated, ecarts };
  }, [bons]);

  // ── KPI metrics ──
  const metrics = useMemo(() => {
    const totalVol = bons.reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const inProdCount = bons.filter(b => b.workflow_status === 'production').length;
    const validatedCount = bons.filter(b => b.workflow_status === 'validation_technique').length;
    const syncRate = bons.length > 0 ? Math.round((bons.filter(b => b.production_batch_time).length / bons.length) * 100) : 0;
    const alertCount = bons.filter(b => (b.variance_ciment_pct || 0) > 5).length;
    const ecartCount = bons.filter(b => (b.variance_ciment_pct || 0) > 2).length;
    return { inProdCount, totalVol, validatedCount, syncRate, alertCount, ecartCount };
  }, [bons]);

  // ── Filter tabs ──
  const filterTabs = [
    { id: 'tous', label: 'Tous', count: counts.total },
    { id: 'planifies', label: 'Planifiés', count: counts.planned },
    { id: 'production', label: 'En Production', count: counts.inProd },
    { id: 'valides', label: 'Validés', count: counts.validated },
    { id: 'ecarts', label: 'Écarts', count: counts.ecarts },
  ];

  // ── Filtered rows ──
  const filteredBons = useMemo(() => {
    let result = [...bons];
    switch (activeFilter) {
      case 'planifies': result = result.filter(b => b.workflow_status === 'planification'); break;
      case 'production': result = result.filter(b => b.workflow_status === 'production'); break;
      case 'valides': result = result.filter(b => b.workflow_status === 'validation_technique'); break;
      case 'ecarts': result = result.filter(b => (b.variance_ciment_pct || 0) > 5 || (b.variance_eau_pct || 0) > 5); break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.bl_id || '').toLowerCase().includes(q) ||
        (b.formule_id || '').toLowerCase().includes(q) ||
        (b.chauffeur_nom || '').toLowerCase().includes(q) ||
        (b.bc_id || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [bons, activeFilter, searchQuery]);

  // ── Live feed items ──
  const feedItems = useMemo(() => {
    return batches.slice(0, 15).map(b => ({
      id: b.id,
      blId: b.bl_id || `B-${b.batch_number}`,
      batchNum: b.batch_number,
      quality: b.quality_status,
      time: b.entered_at ? format(new Date(b.entered_at), 'HH:mm') : '—',
      ciment: b.ciment_reel_kg || 0,
      formula: b.formule_id || '—',
      volume: b.volume_m3 || 0,
      client: b.client_name || '—',
      variance: b.variance_ciment_pct || 0,
    }));
  }, [batches]);

  // ── Bottom metrics ──
  const totalVol = Math.round(metrics.totalVol);
  const batchCount = bons.length;
  const cadence = batchCount > 0 ? Math.round(totalVol / Math.max(1, batchCount) * 4.5) : 0;

  // ── Column definitions ──
  const columns = ['N° BL', 'CLIENT', 'BC', 'FORMULE', 'VOL (M³)', 'HEURE', 'STATUT', 'PROGRESSION', 'ACTIONS'];

  return (
    <div className="flex flex-col gap-6">

      {/* ═══ 1. ACTION BUTTONS ROW ═══ */}
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 cursor-pointer"
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: T.gold, color: '#0B1120', fontWeight: 500, fontSize: 13,
            border: 'none', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Play size={16} strokeWidth={1.5} />
          Lancer Production
        </button>
        <button
          className="flex items-center gap-2 cursor-pointer"
          style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'transparent', color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 13,
            border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Download size={16} strokeWidth={1.5} />
          Exporter
        </button>
        <button
          className="flex items-center gap-2 cursor-pointer"
          style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'transparent', color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 13,
            border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <RefreshCw size={16} strokeWidth={1.5} />
          Actualiser
        </button>
      </div>

      {/* ═══ 2. SEARCH BAR + FILTRES + CLOCK ═══ */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} strokeWidth={1.5} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.30)' }} />
          <input
            type="text"
            placeholder="Rechercher BL, BC, client, formule..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full outline-none"
            style={{
              padding: '12px 14px 12px 40px', borderRadius: 8,
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>
        <button
          className="flex items-center gap-2 cursor-pointer"
          style={{
            padding: '12px 16px', borderRadius: 8,
            background: 'transparent', border: `1px solid ${T.cardBorder}`,
            color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <SlidersHorizontal size={14} strokeWidth={1.5} />
          Filtres
        </button>
        <InlineClock />
      </div>

      {/* ═══ 3. 6 KPI CARDS ═══ */}
      <div className="grid grid-cols-6 gap-4">
        <MiniKPI label="En Production" value={metrics.inProdCount} suffix="bons" icon={Activity} />
        <MiniKPI label="Volume" value={Math.round(metrics.totalVol)} suffix="m³" icon={Droplets} />
        <MiniKPI label="CUR Moyen" value={metrics.totalVol > 0 ? '—' : '—'} suffix="DH/m³" icon={TrendingUp} />
        <MiniKPI label="Validés" value={metrics.validatedCount} sub={`/ ${bons.length}`} icon={CheckCircle} />
        <MiniKPI label="Sync Machine" value={metrics.syncRate} suffix="%" icon={Wifi} />
        <MiniKPI label="Alertes" value={metrics.alertCount} sub={`${metrics.ecartCount} écarts`} icon={AlertTriangle} />
      </div>

      {/* ═══ 4. FILTER TABS ═══ */}
      <div className="flex items-center gap-1" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
        {filterTabs.map(tab => {
          const isActive = activeFilter === tab.id;
          const TabIcon = tabIcons[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="flex items-center gap-2 cursor-pointer"
              style={{
                padding: '10px 16px', background: 'transparent', border: 'none',
                borderBottom: isActive ? `2px solid ${T.gold}` : '2px solid transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                fontWeight: isActive ? 500 : 400, fontSize: 13,
                fontFamily: 'DM Sans, sans-serif', transition: 'all 150ms',
              }}
            >
              {TabIcon && <TabIcon size={14} strokeWidth={1.5} />}
              {tab.label}
              <span style={{
                padding: '1px 8px', borderRadius: 999, fontSize: 11,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.60)',
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 500,
              }}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ 5. MAIN: TABLE + SIDEBAR ═══ */}
      <div className="flex gap-6">

        {/* ── DATA TABLE ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, overflow: 'hidden', flex: 1 }}>
            {/* Column headers */}
            <div className="grid items-center" style={{
              gridTemplateColumns: '110px 1fr 90px 110px 80px 70px 120px 100px 80px',
              padding: '12px 16px', borderBottom: `1px solid ${T.cardBorder}`,
            }}>
              {columns.map(h => (
                <span key={h} style={{
                  fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                  textAlign: ['VOL (M³)', 'HEURE'].includes(h) ? 'right' as const : 'left' as const,
                }}>{h}</span>
              ))}
            </div>

            {/* Table body */}
            {filteredBons.length > 0 ? (
              <div>
                {filteredBons.map((bon, i) => {
                  const status = getStatusInfo(bon.workflow_status, bon.variance_ciment_pct);
                  const progress = getProgressPercent(bon.workflow_status);
                  return (
                    <div
                      key={bon.bl_id + i}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: '110px 1fr 90px 110px 80px 70px 120px 100px 80px',
                        padding: '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer', transition: 'background 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* BL ID */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                        {bon.bl_id}
                      </span>
                      {/* Client */}
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bon.chauffeur_nom || '—'}
                      </span>
                      {/* BC */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
                        {bon.bc_id || '—'}
                      </span>
                      {/* Formule */}
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
                        {bon.formule_id || '—'}
                      </span>
                      {/* Volume — right-aligned */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: '#fff', textAlign: 'right' }}>
                        {(bon.volume_m3 || 0).toFixed(1)}
                      </span>
                      {/* Heure — right-aligned */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'rgba(255,255,255,0.50)', textAlign: 'right' }}>
                        {bon.heure_prevue?.slice(0, 5) || bon.production_batch_time?.slice(0, 5) || '—'}
                      </span>
                      {/* Statut badge */}
                      <div className="flex items-center gap-2">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 10px', borderRadius: 999,
                          background: `${status.color}1F`, fontSize: 11, fontWeight: 500,
                          color: status.color, whiteSpace: 'nowrap',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
                          {status.label}
                        </span>
                      </div>
                      {/* Progression */}
                      <div className="flex flex-col gap-1">
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', width: 80 }}>
                          <div style={{
                            width: `${progress}%`, height: '100%', borderRadius: 3,
                            background: progress === 100 ? T.success : T.gold,
                            transition: 'width 300ms ease',
                          }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>
                          {progress === 100 ? `${bon.volume_m3}/${bon.volume_m3}m³` : `0/${bon.volume_m3}m³`}
                        </span>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          className="flex items-center justify-center cursor-pointer"
                          style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 'none' }}
                          title="Voir détails"
                        >
                          <Eye size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.30)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.60)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
                          />
                        </button>
                        {bon.workflow_status === 'planification' && (
                          <button
                            className="flex items-center justify-center cursor-pointer"
                            style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 'none' }}
                            title="Lancer"
                          >
                            <Play size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.30)' }}
                              onMouseEnter={e => (e.currentTarget.style.color = T.gold)}
                              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
                            />
                          </button>
                        )}
                        {bon.workflow_status === 'production' && (
                          <button
                            className="flex items-center justify-center cursor-pointer"
                            style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 'none' }}
                            title="Valider"
                          >
                            <CheckCircle size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.30)' }}
                              onMouseEnter={e => (e.currentTarget.style.color = T.success)}
                              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── EMPTY STATE ── */
              <div style={{ padding: '80px 24px' }}>
                <div className="flex flex-col items-center justify-center">
                  <BarChart3 size={56} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.06)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: 14, fontWeight: 500, marginTop: 16 }}>
                    Aucun batch enregistré aujourd'hui
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12, marginTop: 4 }}>
                    Les batches apparaîtront ici dès le lancement de la production
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ═══ BOTTOM STATUS BAR ═══ */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${T.cardBorder}`,
            padding: '12px 24px', borderRadius: '0 0 14px 14px',
            marginTop: -1,
          }}>
            <div className="flex items-center justify-between" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
              <div className="flex items-center gap-3">
                <span>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{totalVol}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}> m³</span>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{batchCount}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}> batches</span>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Cadence: <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{cadence} m³/h</span>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>— vs hier</span>
              </div>
              <InlineClock />
            </div>
          </div>
        </div>

        {/* ═══ 6. LIVE PRODUCTION FEED SIDEBAR ═══ */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, height: '100%', display: 'flex', flexDirection: 'column',
          }}>
            {/* Sidebar header */}
            <div style={{ padding: 16, borderBottom: `1px solid ${T.cardBorder}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={16} strokeWidth={1.5} style={{ color: T.gold }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Live Production Feed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399' }} />
                    <span style={{ color: '#34d399', fontSize: 11, fontWeight: 500 }}>Temps réel</span>
                  </div>
                  <button className="cursor-pointer" style={{ background: 'transparent', border: 'none', padding: 4 }}>
                    <Maximize2 size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.20)' }} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Suivi temps réel des batches
              </p>
            </div>

            {/* Feed items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }} className="scrollbar-thin">
              {feedItems.length > 0 ? (
                feedItems.map((item, i) => {
                  const borderColor = item.quality === 'ok' ? T.success : item.quality === 'pending' ? T.gold : 'rgba(255,255,255,0.10)';
                  return (
                    <div
                      key={item.id + i}
                      style={{
                        padding: '10px 16px', borderLeft: `2px solid ${borderColor}`,
                        margin: '0 12px 4px 12px', borderRadius: '0 8px 8px 0',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                          #{item.batchNum}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.variance > 0 && (
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.gold, fontWeight: 500 }}>
                              {Math.round(item.variance)}%
                            </span>
                          )}
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                            {item.time}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                        {item.formula} · {item.volume} m³ · {item.client}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Clock size={40} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.06)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: 500 }}>Aucun batch enregistré</p>
                  <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, textAlign: 'center', padding: '0 24px' }}>
                    Les batches de production apparaîtront ici en temps réel
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar footer */}
            <div style={{ padding: 12, borderTop: `1px solid ${T.cardBorder}` }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
                Total file: {Math.round(metrics.totalVol)} m³
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
