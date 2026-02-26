import { useState, useMemo, useEffect } from 'react';
import {
  Factory, CheckCircle, Shield, Clock, Search, Filter,
  Play, Eye, RefreshCw, Download, BarChart3, Wifi, AlertTriangle,
  ChevronRight, Zap, Activity,
} from 'lucide-react';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS (shared with WorldClassProduction)
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
  if (hasHighVariance) return { label: 'Écart > 5%', color: T.danger, dot: T.danger };
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
function MiniKPI({ label, value, suffix, icon: Icon }: {
  label: string; value: string | number; suffix?: string; icon: any;
}) {
  return (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.cardBorder}`,
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</span>
        <Icon size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.15)' }} />
      </div>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
        {value}
        {suffix && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>{suffix}</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// LIVE CLOCK (inline)
// ─────────────────────────────────────────────────────
function InlineClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

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
    const inProdVol = bons.filter(b => b.workflow_status === 'production').reduce((s, b) => s + (b.volume_m3 || 0), 0);
    const validatedCount = bons.filter(b => b.workflow_status === 'validation_technique').length;
    const avgCUR = bons.length > 0 ? 0.42 : 0; // Placeholder
    const syncRate = bons.length > 0 ? 98 : 0;
    const alertCount = bons.filter(b => (b.variance_ciment_pct || 0) > 5).length;
    return { inProdVol, totalVol, avgCUR, validatedCount, syncRate, alertCount };
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

    // Filter by tab
    switch (activeFilter) {
      case 'planifies': result = result.filter(b => b.workflow_status === 'planification'); break;
      case 'production': result = result.filter(b => b.workflow_status === 'production'); break;
      case 'valides': result = result.filter(b => b.workflow_status === 'validation_technique'); break;
      case 'ecarts': result = result.filter(b => (b.variance_ciment_pct || 0) > 5 || (b.variance_eau_pct || 0) > 5); break;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.bl_id || '').toLowerCase().includes(q) ||
        (b.formule_id || '').toLowerCase().includes(q) ||
        (b.chauffeur_nom || '').toLowerCase().includes(q)
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
      variance: b.variance_ciment_pct || 0,
      enteredBy: b.entered_by_name || '—',
    }));
  }, [batches]);

  // ── Bottom metrics ──
  const totalVol = Math.round(metrics.totalVol);
  const batchCount = bons.length;
  const cadence = batchCount > 0 ? Math.round(totalVol / Math.max(1, batchCount) * 4.5) : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── TAB HEADER ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 4 }}>Batches du Jour</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Suivi des bons de livraison en production</p>
        </div>
        <div className="flex items-center gap-2">
          <button style={{
            padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
            background: T.gold, color: '#0B1120', fontWeight: 700, fontSize: 13, border: 'none',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <div className="flex items-center gap-2">
              <Play size={14} />
              Lancer Production
            </div>
          </button>
          <button style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: T.textSec, fontWeight: 600, fontSize: 13,
            border: `1px solid ${T.cardBorder}`, fontFamily: 'DM Sans, sans-serif',
          }}>
            <div className="flex items-center gap-2">
              <RefreshCw size={14} />
              Actualiser
            </div>
          </button>
          <button style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: T.textSec, fontWeight: 600, fontSize: 13,
            border: `1px solid ${T.cardBorder}`, fontFamily: 'DM Sans, sans-serif',
          }}>
            <div className="flex items-center gap-2">
              <Download size={14} />
              Exporter
            </div>
          </button>
        </div>
      </div>

      {/* ── SEARCH + CLOCK ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            placeholder="Rechercher BL, BC, client, formule..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.cardBorder}`,
              color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
              outline: 'none',
            }}
          />
        </div>
        <button style={{
          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
          background: 'transparent', border: `1px solid ${T.cardBorder}`,
          color: T.textSec, fontSize: 13, fontWeight: 600,
        }}>
          <div className="flex items-center gap-2">
            <Filter size={14} />
            Filtres
          </div>
        </button>
        <InlineClock />
      </div>

      {/* ── 6 KPI CARDS ── */}
      <div className="grid grid-cols-6 gap-3">
        <MiniKPI label="En Production" value={Math.round(metrics.inProdVol)} suffix="m³" icon={Play} />
        <MiniKPI label="Volume Total" value={Math.round(metrics.totalVol)} suffix="m³" icon={Activity} />
        <MiniKPI label="CUR Moyen" value={metrics.avgCUR.toFixed(2)} icon={Zap} />
        <MiniKPI label="Validés" value={metrics.validatedCount} icon={CheckCircle} />
        <MiniKPI label="Sync Machine" value={`${metrics.syncRate}%`} icon={Wifi} />
        <MiniKPI label="Alertes" value={metrics.alertCount} icon={AlertTriangle} />
      </div>

      {/* ── FILTER TABS ── */}
      <div className="flex items-center gap-1" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: '10px 16px', cursor: 'pointer', background: 'transparent',
              border: 'none', borderBottom: activeFilter === tab.id ? `2px solid ${T.gold}` : '2px solid transparent',
              color: activeFilter === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
              fontWeight: 600, fontSize: 13, fontFamily: 'DM Sans, sans-serif',
              transition: 'all 150ms',
            }}
          >
            <div className="flex items-center gap-2">
              {tab.label}
              <span style={{
                padding: '1px 7px', borderRadius: 999, fontSize: 11,
                background: activeFilter === tab.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                color: activeFilter === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
              }}>{tab.count}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── MAIN: TABLE + SIDEBAR ── */}
      <div className="flex gap-5">

        {/* ── DATA TABLE ── */}
        <div className="flex-1 min-w-0">
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Table header */}
            <div className="grid" style={{
              gridTemplateColumns: '120px 1fr 90px 110px 80px 70px 120px 100px 80px',
              padding: '12px 16px', borderBottom: `1px solid ${T.cardBorder}`,
            }}>
              {['N° BL', 'CLIENT', 'BC', 'FORMULE', 'VOL (M³)', 'HEURE', 'STATUT', 'PROGRESSION', 'ACTIONS'].map(h => (
                <span key={h} style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 500,
                  textAlign: ['VOL (M³)', 'HEURE'].includes(h) ? 'right' : 'left',
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
                      className="grid"
                      style={{
                        gridTemplateColumns: '120px 1fr 90px 110px 80px 70px 120px 100px 80px',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${T.cardBorder}`,
                        cursor: 'pointer',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* BL ID */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                        {bon.bl_id}
                      </span>
                      {/* Client */}
                      <span style={{ fontSize: 12, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bon.chauffeur_nom || '—'}
                      </span>
                      {/* BC */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>
                        {(bon as any).bc_id || '—'}
                      </span>
                      {/* Formule */}
                      <span style={{ fontSize: 12, color: T.textSec }}>
                        {bon.formule_id || '—'}
                      </span>
                      {/* Volume */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'right' }}>
                        {(bon.volume_m3 || 0).toFixed(1)}
                      </span>
                      {/* Heure */}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim, textAlign: 'right' }}>
                        {bon.heure_prevue?.slice(0, 5) || bon.production_batch_time?.slice(0, 5) || '—'}
                      </span>
                      {/* Statut */}
                      <div className="flex items-center gap-2">
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0, boxShadow: `0 0 6px ${status.dot}40` }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: status.color, whiteSpace: 'nowrap' }}>{status.label}</span>
                      </div>
                      {/* Progression */}
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{
                            width: `${progress}%`, height: '100%', borderRadius: 2,
                            background: progress === 100 ? T.success : progress > 30 ? T.info : T.gold,
                            transition: 'width 300ms ease',
                          }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', minWidth: 28, textAlign: 'right' }}>
                          {progress}%
                        </span>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: `1px solid ${T.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Eye size={12} style={{ color: T.textSec }} />
                        </button>
                        {bon.workflow_status === 'planification' && (
                          <button style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: `1px solid ${T.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={12} style={{ color: T.info }} />
                          </button>
                        )}
                        {bon.workflow_status === 'production' && (
                          <button style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: `1px solid ${T.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={12} style={{ color: T.success }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '48px 24px' }}>
                <div className="flex flex-col items-center justify-center gap-3">
                  <BarChart3 size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500 }}>Aucun batch enregistré aujourd'hui</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Les batches apparaîtront ici dès le lancement de la production</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── LIVE FEED SIDEBAR ── */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, height: '100%', display: 'flex', flexDirection: 'column',
          }}>
            {/* Sidebar header */}
            <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.cardBorder}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Live Production Feed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  <span style={{ color: '#34d399', fontSize: 10, fontWeight: 500 }}>Live</span>
                </div>
              </div>
            </div>

            {/* Feed items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }} className="scrollbar-thin">
              {feedItems.length > 0 ? (
                feedItems.map((item, i) => {
                  const borderColor = item.quality === 'ok' ? T.success : item.quality === 'pending' ? T.gold : item.quality === 'warning' ? T.warning : 'rgba(255,255,255,0.1)';
                  return (
                    <div
                      key={item.id + i}
                      style={{
                        padding: '10px 16px', borderLeft: `3px solid ${borderColor}`,
                        marginLeft: 12, marginRight: 12, marginBottom: 4,
                        borderRadius: '0 6px 6px 0',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                          #{item.batchNum}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                          {item.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: T.textSec }}>{item.blId}</span>
                        <span style={{ fontSize: 10, color: T.textDim }}>•</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>{Math.round(item.ciment)}kg</span>
                      </div>
                      {item.variance > 2 && (
                        <span style={{
                          fontSize: 10, color: item.variance > 5 ? T.danger : T.warning,
                          fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                        }}>
                          Δ {item.variance.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Clock size={40} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500 }}>Aucun batch enregistré</p>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', padding: '0 16px' }}>
                    Les batches de production apparaîtront ici en temps réel
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM METRICS BAR ── */}
      <div style={{
        background: T.cardBg, border: `1px solid ${T.cardBorder}`,
        borderRadius: 10, padding: '10px 20px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            <span><span style={{ color: '#fff', fontWeight: 600 }}>{totalVol}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> m³</span></span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span><span style={{ color: '#fff', fontWeight: 600 }}>{batchCount}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> batches</span></span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Cadence: <span style={{ color: '#fff', fontWeight: 600 }}>{cadence} m³/h</span></span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span style={{ color: T.success, fontWeight: 600 }}>▲ +12% vs hier</span>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            {format(new Date(), 'HH:mm:ss')} UTC
          </span>
        </div>
      </div>
    </div>
  );
}
