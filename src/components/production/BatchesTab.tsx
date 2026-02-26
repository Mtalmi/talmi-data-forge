import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle, Clock, Search, SlidersHorizontal, Pause,
  Play, Eye, RefreshCw, Download, BarChart3, Wifi, AlertTriangle,
  Zap, Activity, Droplets, TrendingUp, Maximize2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold: '#D4A843',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  success: '#10B981',
  danger: '#EF4444',
  info: '#3B82F6',
  textDim: '#64748B',
};

// ─────────────────────────────────────────────────────
// FALLBACK DATA — 14 realistic batches
// ─────────────────────────────────────────────────────
interface FallbackRow {
  bl_id: string;
  client: string;
  formule: string;
  volume: number;
  heure: string;
  status: 'valide' | 'production' | 'planifie' | 'ecart';
  progress: number;
}

const FALLBACK_ROWS: FallbackRow[] = [
  { bl_id: 'BL-2602-001', client: 'BTP Maroc SARL', formule: 'F-B25', volume: 8, heure: '07:15', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-002', client: 'Ciments & Béton du Sud', formule: 'F-B30', volume: 45, heure: '07:42', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-003', client: 'BTP Maroc SARL', formule: 'F-B25', volume: 12, heure: '08:20', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-004', client: 'Constructions Modernes SA', formule: 'F-B20', volume: 80, heure: '08:55', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-005', client: 'Ciments & Béton du Sud', formule: 'F-B30', volume: 30, heure: '09:30', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-006', client: 'BTP Maroc SARL', formule: 'F-B25', volume: 8, heure: '10:10', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-007', client: 'Saudi Readymix Co.', formule: 'F-B25', volume: 50, heure: '10:45', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-008', client: 'Constructions Modernes SA', formule: 'F-B30', volume: 20, heure: '11:30', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-009', client: 'BTP Maroc SARL', formule: 'F-B20', volume: 35, heure: '12:15', status: 'valide', progress: 100 },
  { bl_id: 'BL-2602-010', client: 'Ciments & Béton du Sud', formule: 'F-B25', volume: 45, heure: '13:40', status: 'production', progress: 72 },
  { bl_id: 'BL-2602-011', client: 'BTP Maroc SARL', formule: 'F-B30', volume: 8, heure: '14:20', status: 'production', progress: 34 },
  { bl_id: 'BL-2602-012', client: 'Constructions Modernes SA', formule: 'F-B25', volume: 20, heure: '15:00', status: 'planifie', progress: 0 },
  { bl_id: 'BL-2602-013', client: 'Saudi Readymix Co.', formule: 'F-B20', volume: 10, heure: '15:30', status: 'planifie', progress: 0 },
  { bl_id: 'BL-2602-014', client: 'Ciments & Béton du Sud', formule: 'F-B30', volume: 20, heure: '16:00', status: 'planifie', progress: 0 },
  { bl_id: 'BL-2602-015', client: 'BTP Maroc SARL', formule: 'F-B25', volume: 12, heure: '16:30', status: 'ecart', progress: 88 },
];

const FEED_ITEMS = [
  { id: '011', num: '#2602-011', info: 'F-B30 · 8 m³ · BTP Maroc', pct: '34%', time: '14:20', active: true },
  { id: '010', num: '#2602-010', info: 'F-B25 · 45 m³ · Ciments & Béton du Sud', pct: '72%', time: '13:40', active: true },
  { id: '009', num: '#2602-009', info: 'F-B20 · 35 m³ · BTP Maroc', pct: null, time: '12:15', active: false },
  { id: '008', num: '#2602-008', info: 'F-B30 · 20 m³ · Constructions Modernes', pct: null, time: '11:30', active: false },
  { id: '007', num: '#2602-007', info: 'F-B25 · 50 m³ · Saudi Readymix', pct: null, time: '10:45', active: false },
  { id: '006', num: '#2602-006', info: 'F-B25 · 8 m³ · BTP Maroc', pct: null, time: '10:10', active: false },
];

function statusStyle(s: FallbackRow['status']) {
  switch (s) {
    case 'valide': return { label: 'Validé', bg: 'rgba(52,211,153,0.12)', color: '#34d399', dot: '#34d399' };
    case 'production': return { label: 'En Production', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', dot: '#60a5fa' };
    case 'planifie': return { label: 'Planifié', bg: 'rgba(212,168,67,0.12)', color: T.gold, dot: T.gold };
    case 'ecart': return { label: 'Écart', bg: 'rgba(248,113,113,0.12)', color: '#f87171', dot: '#f87171' };
  }
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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
interface BatchesTabProps {
  bons: any[];
  batches: any[];
  loading: boolean;
}

export default function BatchesTab({ bons, batches, loading }: BatchesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('tous');

  // Use live data if available, otherwise fallback
  const rows: FallbackRow[] = useMemo(() => {
    if (bons.length > 0) {
      return bons.map(b => ({
        bl_id: b.bl_id,
        client: b.chauffeur_nom || b.client_id || '—',
        formule: b.formule_id || '—',
        volume: b.volume_m3 || 0,
        heure: (b.heure_prevue || b.production_batch_time || '—').slice(0, 5),
        status: (b.variance_ciment_pct || 0) > 5 ? 'ecart' as const :
          b.workflow_status === 'planification' ? 'planifie' as const :
          b.workflow_status === 'production' ? 'production' as const :
          'valide' as const,
        progress: b.workflow_status === 'validation_technique' ? 100 :
          b.workflow_status === 'production' ? 55 : 0,
      }));
    }
    return FALLBACK_ROWS;
  }, [bons]);

  // Counts
  const counts = useMemo(() => {
    const c = { total: rows.length, planifie: 0, production: 0, valide: 0, ecart: 0 };
    rows.forEach(r => { if (r.status in c) (c as any)[r.status]++; });
    return c;
  }, [rows]);

  // Filtered
  const filtered = useMemo(() => {
    let r = [...rows];
    if (activeFilter === 'planifies') r = r.filter(x => x.status === 'planifie');
    else if (activeFilter === 'production') r = r.filter(x => x.status === 'production');
    else if (activeFilter === 'valides') r = r.filter(x => x.status === 'valide');
    else if (activeFilter === 'ecarts') r = r.filter(x => x.status === 'ecart');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(x => x.bl_id.toLowerCase().includes(q) || x.client.toLowerCase().includes(q) || x.formule.toLowerCase().includes(q));
    }
    return r;
  }, [rows, activeFilter, searchQuery]);

  const filterTabs = [
    { id: 'tous', label: 'Tous', count: counts.total },
    { id: 'planifies', label: 'Planifiés', count: counts.planifie, icon: Clock },
    { id: 'production', label: 'En Production', count: counts.production, icon: Play },
    { id: 'valides', label: 'Validés', count: counts.valide, icon: CheckCircle },
    { id: 'ecarts', label: 'Écarts', count: counts.ecart, icon: AlertTriangle },
  ];

  const mono = 'JetBrains Mono, monospace';

  return (
    <div className="flex flex-col gap-6">

      {/* ═══ 1. ACTION BUTTONS ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 cursor-pointer" style={{
            padding: '10px 20px', borderRadius: 8, background: T.gold, color: '#0B1120',
            fontWeight: 500, fontSize: 13, border: 'none', fontFamily: 'DM Sans, sans-serif',
          }}>
            <Play size={16} strokeWidth={1.5} /> Lancer Production
          </button>
          {[{ icon: Download, label: 'Exporter' }, { icon: RefreshCw, label: 'Actualiser' }].map(b => (
            <button key={b.label} className="flex items-center gap-2 cursor-pointer" style={{
              padding: '10px 14px', borderRadius: 8, background: 'transparent',
              color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 13,
              border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'DM Sans, sans-serif',
            }}>
              <b.icon size={16} strokeWidth={1.5} /> {b.label}
            </button>
          ))}
        </div>
        <InlineClock />
      </div>

      {/* ═══ 2. SEARCH BAR ═══ */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} strokeWidth={1.5} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.30)' }} />
          <input
            type="text" placeholder="Rechercher BL, BC, client, formule..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full outline-none"
            style={{
              padding: '12px 14px 12px 40px', borderRadius: 8,
              background: T.cardBg, border: `1px solid ${T.cardBorder}`,
              color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </div>
        <button className="flex items-center gap-2 cursor-pointer" style={{
          padding: '12px 16px', borderRadius: 8, background: 'transparent',
          border: `1px solid ${T.cardBorder}`, color: 'rgba(255,255,255,0.6)',
          fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
        }}>
          <SlidersHorizontal size={14} strokeWidth={1.5} /> Filtres
        </button>
      </div>

      {/* ═══ 3. KPI CARDS ═══ */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: 'EN PRODUCTION', icon: Activity, value: '2', suffix: 'bons' },
          { label: 'VOLUME', icon: Droplets, value: '671', suffix: 'm³' },
          { label: 'CUR MOYEN', icon: TrendingUp, value: '847', suffix: 'DH/m³' },
          { label: 'VALIDÉS', icon: CheckCircle, value: '9', suffix: '/ 14' },
          { label: 'SYNC MACHINE', icon: Wifi, value: '98', suffix: '%' },
          { label: 'ALERTES', icon: AlertTriangle, value: '1', suffix: '1 écart' },
        ].map(k => (
          <div key={k.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 16 }}>
            <k.icon size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.20)', marginBottom: 8 }} />
            <p style={{ fontFamily: mono, fontSize: 24, fontWeight: 400, color: '#fff', lineHeight: 1 }}>
              {k.value}
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginLeft: 4 }}>{k.suffix}</span>
            </p>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.40)', fontWeight: 500, marginTop: 6 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ 4. FILTER TABS ═══ */}
      <div className="flex items-center gap-1" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
        {filterTabs.map(tab => {
          const active = activeFilter === tab.id;
          const Icon = (tab as any).icon;
          return (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
              className="flex items-center gap-2 cursor-pointer" style={{
                padding: '10px 16px', background: 'transparent', border: 'none',
                borderBottom: active ? `2px solid ${T.gold}` : '2px solid transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                fontWeight: active ? 500 : 400, fontSize: 13,
                fontFamily: 'DM Sans, sans-serif', transition: 'all 150ms',
              }}>
              {Icon && <Icon size={14} strokeWidth={1.5} />}
              {tab.label}
              <span style={{
                padding: '1px 8px', borderRadius: 999, fontSize: 11,
                background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                color: active ? '#fff' : 'rgba(255,255,255,0.60)',
                fontFamily: mono, fontWeight: 500,
              }}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ 5. TABLE + SIDEBAR ═══ */}
      <div className="flex gap-6">

        {/* ── TABLE ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
            {/* Headers */}
            <div className="grid items-center" style={{
              gridTemplateColumns: '120px 1fr 100px 80px 65px 130px 110px 90px',
              padding: '12px 16px', borderBottom: `1px solid ${T.cardBorder}`,
            }}>
              {['N° BL', 'CLIENT', 'FORMULE', 'VOL (M³)', 'HEURE', 'STATUT', 'PROGRESSION', 'ACTIONS'].map(h => (
                <span key={h} style={{
                  fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                  textAlign: ['VOL (M³)', 'HEURE'].includes(h) ? 'right' as const : 'left' as const,
                }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {filtered.length > 0 ? filtered.map((row, i) => {
              const st = statusStyle(row.status);
              const delivered = Math.round(row.volume * row.progress / 100);
              const isInProd = row.status === 'production';
              return (
                <div key={row.bl_id} className="grid items-center" style={{
                  gridTemplateColumns: '120px 1fr 100px 80px 65px 130px 110px 90px',
                  padding: '16px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: isInProd ? '2px solid rgba(96,165,250,0.50)' : '2px solid transparent',
                  cursor: 'pointer', transition: 'background 150ms',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: '#fff' }}>{row.bl_id}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.client}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: 'rgba(255,255,255,0.60)' }}>{row.formule}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 400, color: '#fff', textAlign: 'right' }}>{row.volume}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>{row.heure}</span>
                  {/* Status badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content',
                    padding: '4px 10px', borderRadius: 999, background: st.bg,
                    fontSize: 11, fontWeight: 500, color: st.color, whiteSpace: 'nowrap',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                    {st.label}
                  </span>
                  {/* Progress */}
                  <div className="flex flex-col gap-1">
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', width: 80 }}>
                      <div style={{
                        width: `${row.progress}%`, height: '100%', borderRadius: 3,
                        background: row.progress === 100 ? T.success : row.progress > 0 ? T.info : 'transparent',
                        transition: 'width 300ms ease',
                      }} />
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                      {delivered}/{row.volume}m³
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 'none' }}>
                      <Eye size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)' }} />
                    </button>
                    {row.status === 'planifie' && (
                      <button className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 'none' }}>
                        <Play size={16} strokeWidth={1.5} style={{ color: T.gold }} />
                      </button>
                    )}
                    {row.status === 'production' && (
                      <button className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 'none' }}>
                        <Pause size={16} strokeWidth={1.5} style={{ color: '#60a5fa' }} />
                      </button>
                    )}
                    {row.status === 'valide' && (
                      <button className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: 'none' }}>
                        <CheckCircle size={16} strokeWidth={1.5} style={{ color: '#34d399' }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '80px 24px' }}>
                <div className="flex flex-col items-center justify-center">
                  <BarChart3 size={56} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.06)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: 14, fontWeight: 500, marginTop: 16 }}>Aucun batch enregistré aujourd'hui</p>
                  <p style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12, marginTop: 4 }}>Les batches apparaîtront ici dès le lancement de la production</p>
                </div>
              </div>
            )}
          </div>

          {/* ═══ BOTTOM STATUS BAR ═══ */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${T.cardBorder}`,
            padding: '12px 24px', borderRadius: '0 0 14px 14px',
          }}>
            <div className="flex items-center justify-between" style={{ fontFamily: mono, fontSize: 12 }}>
              <div className="flex items-center gap-3">
                <span><span style={{ color: 'rgba(255,255,255,0.55)' }}>671</span><span style={{ color: 'rgba(255,255,255,0.35)' }}> m³</span></span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span><span style={{ color: 'rgba(255,255,255,0.55)' }}>14</span><span style={{ color: 'rgba(255,255,255,0.35)' }}> batches</span></span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Cadence: <span style={{ color: 'rgba(255,255,255,0.55)' }}>47 m³/h</span></span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span style={{ color: '#34d399' }}>▲ +12% vs hier</span>
              </div>
              <InlineClock />
            </div>
          </div>
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, height: '100%', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
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
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Suivi temps réel des batches</p>
            </div>

            {/* Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {FEED_ITEMS.map(item => (
                <div key={item.id} style={{
                  padding: '10px 16px',
                  borderLeft: `2px solid ${item.active ? 'rgba(96,165,250,0.70)' : 'rgba(52,211,153,0.50)'}`,
                  margin: '0 12px 4px 12px', borderRadius: '0 8px 8px 0',
                  transition: 'background 150ms',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: '#fff' }}>{item.num}</span>
                    <div className="flex items-center gap-2">
                      {item.pct ? (
                        <span style={{ fontFamily: mono, fontSize: 11, color: '#60a5fa' }}>{item.pct}</span>
                      ) : (
                        <span style={{ color: '#34d399', fontSize: 11 }}>✓</span>
                      )}
                      <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.20)' }}>{item.time}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{item.info}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: 12, borderTop: `1px solid ${T.cardBorder}` }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
                Total file: 186 m³ restants
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
