import { useState, useMemo, useEffect, useRef } from 'react';
import { Smile } from 'lucide-react';
import { BatchDetailDrawer } from './BatchDetailDrawer';
import {
  CheckCircle, Clock, Search, SlidersHorizontal, Pause,
  Play, Eye, RefreshCw, Download, BarChart3, Wifi, AlertTriangle,
  Zap, Activity, Droplets, TrendingUp, Maximize2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold: '#FFD700',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success: '#10B981',
  danger: '#EF4444',
  info: '#3B82F6',
  textDim: '#64748B',
};

// ─────────────────────────────────────────────────────
// ROW TYPE
// ─────────────────────────────────────────────────────
interface BatchRow {
  bl_id: string;
  client: string;
  formule: string;
  volume: number;
  heure: string;
  cout: string;
  marge: number;
  status: 'valide' | 'production' | 'planifie' | 'ecart';
  progress: number;
}

function statusStyle(s: BatchRow['status']) {
  switch (s) {
    case 'valide': return { label: 'Validé', bg: 'rgba(52,211,153,0.12)', color: '#34d399', dot: '#34d399' };
    case 'production': return { label: 'En Production', bg: 'rgba(212,168,67,0.15)', color: '#D4A843', dot: '#D4A843' };
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Demo fallback data
  const DEMO_ROWS: BatchRow[] = [
    { bl_id: '#403-068', client: 'BTP Maroc SARL', formule: 'F-B25', volume: 8, heure: '10:42', cout: '550 DH/m³', marge: 38, status: 'valide', progress: 100 },
    { bl_id: '#403-067', client: 'Constructions Modernes SA', formule: 'F-B30', volume: 12, heure: '11:28', cout: '650 DH/m³', marge: 35, status: 'valide', progress: 100 },
    { bl_id: '#403-066', client: 'Ciments & Béton du Sud', formule: 'F-B25', volume: 8, heure: '11:55', cout: '550 DH/m³', marge: 38, status: 'production', progress: 72 },
    { bl_id: '#403-065', client: 'BTP Maroc SARL', formule: 'F-B35', volume: 10, heure: '12:35', cout: '720 DH/m³', marge: 31, status: 'valide', progress: 100 },
    { bl_id: '#403-064', client: 'Saudi Readymix', formule: 'F-B25', volume: 8, heure: '13:21', cout: '550 DH/m³', marge: 38, status: 'valide', progress: 100 },
    { bl_id: '#403-063', client: 'ATLAS CONSTRUCT', formule: 'F-B30', volume: 15, heure: '14:10', cout: '650 DH/m³', marge: 35, status: 'production', progress: 45 },
    { bl_id: '#403-062', client: 'Ciments & Béton du Sud', formule: 'F-B20', volume: 6, heure: '14:55', cout: '480 DH/m³', marge: 42, status: 'planifie', progress: 0 },
    { bl_id: '#403-061', client: 'Constructions Modernes SA', formule: 'F-B25', volume: 10, heure: '15:20', cout: '550 DH/m³', marge: 38, status: 'planifie', progress: 0 },
  ];

  // Live data with demo fallback
  const rows: BatchRow[] = useMemo(() => {
    const liveRows = bons.map(b => ({
      bl_id: b.bl_id,
      client: b.chauffeur_nom || b.client_id || '—',
      formule: b.formule_id || '—',
      volume: b.volume_m3 || 0,
      heure: (b.heure_prevue || b.production_batch_time || '—').slice(0, 5),
      cout: '—',
      marge: 0,
      status: (b.variance_ciment_pct || 0) > 5 ? 'ecart' as const :
        b.workflow_status === 'planification' ? 'planifie' as const :
        b.workflow_status === 'production' ? 'production' as const :
        'valide' as const,
      progress: b.workflow_status === 'validation_technique' ? 100 :
        b.workflow_status === 'production' ? 55 : 0,
    }));
    return liveRows.length > 0 ? liveRows : DEMO_ROWS;
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
    <>
    <style>{`@keyframes batch-pulse { 0%, 100% { box-shadow: 0 0 0px rgba(212,168,67,0); } 50% { box-shadow: 0 0 8px rgba(212,168,67,0.3); } } @keyframes live-dot-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.5; } }`}</style>
    <div className="flex flex-col gap-6">

      {/* ═══ 1. ACTION BUTTONS ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => {
            const toast = document.createElement('div');
            toast.innerHTML = `
              <div style="display:flex;align-items:flex-start;gap:10px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <div>
                  <p style="color:#fff;font-size:13px;font-weight:500;margin:0;">Production lancée avec succès</p>
                  <p style="color:rgba(255,255,255,0.40);font-size:11px;margin:2px 0 0;">Batch #2602-016 initialisé</p>
                </div>
              </div>
            `;
            Object.assign(toast.style, {
              position:'fixed',bottom:'24px',right:'24px',zIndex:'9999',
              background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'12px',padding:'12px 20px',backdropFilter:'blur(12px)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.4)',opacity:'1',transition:'opacity 300ms',
            });
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; }, 2700);
            setTimeout(() => { document.body.removeChild(toast); }, 3000);
          }} style={{
            background: '#D4A843', color: '#0F1629', border: 'none', borderRadius: '8px',
            padding: '8px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}>
            <Play size={16} strokeWidth={1.5} /> Lancer Production
          </button>
          {[{ icon: Download, label: 'Exporter' }, { icon: RefreshCw, label: 'Actualiser' }].map(b => (
            <button key={b.label} style={{
              border: '1px solid #D4A843', color: '#D4A843', background: 'transparent',
              borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
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
        <button style={{
          border: '1px solid #D4A843', color: '#D4A843', background: 'transparent',
          borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px',
          display: 'inline-flex', alignItems: 'center', gap: '8px',
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
          <div key={k.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: '2px solid #D4A843', borderRadius: 12, padding: 16 }}>
            <k.icon size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.20)', marginBottom: 8 }} />
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 24, fontWeight: 200, color: '#fff', lineHeight: 1 }}>
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
          <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: '2px solid #D4A843', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
            {/* Headers */}
            <div className="grid items-center" style={{
              gridTemplateColumns: '110px 1fr 90px 70px 65px 90px 70px 60px 120px 100px 80px',
              padding: '12px 16px', borderBottom: `1px solid ${T.cardBorder}`,
            }}>
              {['N° BL', 'CLIENT', 'FORMULE', 'VOL (M³)', 'HEURE', 'COÛT', 'MARGE', 'SATISF.', 'STATUT', 'PROGRESSION', 'ACTIONS'].map(h => {
                const align: 'left' | 'center' | 'right' =
                  ['FORMULE', 'VOL (M³)', 'HEURE', 'COÛT', 'MARGE', 'SATISF.', 'STATUT', 'PROGRESSION', 'ACTIONS'].includes(h) ? 'center' : 'left';
                return (
                  <span key={h} style={{
                    fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                    textAlign: align,
                    display: 'flex',
                    width: '100%',
                    justifyContent: align === 'center' ? 'center' : 'flex-start',
                  }}>{h === 'SATISF.' ? <Smile size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.35)' }} /> : h}</span>
                );
              })}
            </div>

            {/* Rows */}
            {filtered.length > 0 ? filtered.map((row, i) => {
              const st = statusStyle(row.status);
              const delivered = Math.round(row.volume * row.progress / 100);
              const isInProd = row.status === 'production';
              return (
                <div key={row.bl_id} className="grid items-center batch-row-hover" style={{
                  gridTemplateColumns: '110px 1fr 90px 70px 65px 90px 70px 60px 120px 100px 80px',
                  padding: '16px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: '3px solid transparent',
                  cursor: 'pointer', transition: 'all 200ms ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.04)'; e.currentTarget.style.borderLeft = '3px solid #D4A843'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; }}
                  onClick={() => setDrawerOpen(true)}
                >
                  <span style={{ color: '#D4A843', fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 500 }}>{row.bl_id}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.client}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: 'rgba(255,255,255,0.60)', display: 'flex', width: '100%', justifyContent: 'center' }}>{row.formule}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 400, color: '#fff', display: 'flex', width: '100%', justifyContent: 'center' }}>{row.volume}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: 'rgba(255,255,255,0.45)', display: 'flex', width: '100%', justifyContent: 'center' }}>{row.heure}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: 'rgba(255,255,255,0.60)', display: 'flex', width: '100%', justifyContent: 'center' }}>{row.cout}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 500, display: 'flex', width: '100%', justifyContent: 'center', color: row.marge >= 35 ? '#34d399' : row.marge >= 30 ? '#F59E0B' : '#EF4444' }}>{row.marge}%</span>
                  {/* Client satisfaction */}
                  {(() => {
                    const satisfMap: Record<string, { color: string; label: string }> = {
                      '#403-068': { color: '#10B981', label: 'Satisfait' },
                      '#403-067': { color: '#F59E0B', label: 'En attente retour' },
                      '#403-066': { color: '#6B7280', label: 'En cours' },
                      '#403-065': { color: '#10B981', label: 'Satisfait' },
                      '#403-064': { color: '#10B981', label: 'Satisfait' },
                      '#403-063': { color: '#6B7280', label: 'En cours' },
                      '#403-062': { color: '#F59E0B', label: 'Réclamation: slump hors tolérance' },
                      '#403-061': { color: '#10B981', label: 'Satisfait' },
                    };
                    const s = satisfMap[row.bl_id] || { color: '#6B7280', label: '—' };
                    return (
                      <span style={{ display: 'flex', justifyContent: 'center', position: 'relative' }} title={s.label}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, cursor: 'default' }} />
                      </span>
                    );
                  })()}
                  {/* Status badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content',
                    padding: '4px 10px', borderRadius: 999, background: st.bg,
                    fontSize: 11, fontWeight: 500, color: st.color, whiteSpace: 'nowrap',
                    margin: '0 auto',
                    ...(row.status === 'production' ? { border: '1px solid #D4A843', animation: 'batch-pulse 2s infinite' } : {}),
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                    {st.label}
                  </span>
                  {/* Progress */}
                  <div className="flex flex-col gap-1 items-center">
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
                  <div className="flex items-center justify-center gap-1">
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
            padding: '12px 24px', borderRadius: '0 0 12px 12px',
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
            borderTop: '2px solid #D4A843',
            borderRadius: 12, height: '100%', display: 'flex', flexDirection: 'column',
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

            {/* Feed — live from rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {(() => {
                const DEMO_FEED = [
                  { time: '10:45', id: '#403-068', status: 'validé', formule: 'F-B25', vol: '8 m³', note: 'Conforme.', color: '#34d399' },
                  { time: '11:30', id: '#403-067', status: 'validé', formule: 'F-B30', vol: '12 m³', note: 'Variance slump +2cm.', color: '#fbbf24' },
                  { time: '11:58', id: '#403-066', status: 'lancé', formule: 'F-B25', vol: '8 m³', note: 'En production.', color: '#60a5fa' },
                  { time: '14:12', id: '#403-063', status: 'lancé', formule: 'F-B30', vol: '15 m³', note: 'En production.', color: '#60a5fa' },
                ];
                const feedItems = rows.length > 0 && rows !== DEMO_ROWS
                  ? rows.slice(0, 6).map(item => {
                      const isActive = item.status === 'production';
                      const pct = item.progress > 0 && item.progress < 100 ? `${item.progress}%` : null;
                      return (
                        <div key={item.bl_id} style={{
                          padding: '10px 16px',
                          borderLeft: `2px solid ${isActive ? 'rgba(96,165,250,0.70)' : 'rgba(52,211,153,0.50)'}`,
                          margin: '0 12px 4px 12px', borderRadius: '0 8px 8px 0',
                          transition: 'background 150ms',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: '#fff' }}>{item.bl_id}</span>
                            <div className="flex items-center gap-2">
                              {pct ? (
                                <span style={{ fontFamily: mono, fontSize: 11, color: '#60a5fa' }}>{pct}</span>
                              ) : (
                                <span style={{ color: '#34d399', fontSize: 11 }}>✓</span>
                              )}
                              <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.20)' }}>{item.heure}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{item.formule} · {item.volume} m³ · {item.client}</p>
                        </div>
                      );
                    })
                  : DEMO_FEED.map(f => (
                      <div key={f.id + f.time} style={{
                        padding: '10px 16px',
                        borderLeft: `2px solid ${f.color}`,
                        margin: '0 12px 4px 12px', borderRadius: '0 8px 8px 0',
                        transition: 'background 150ms',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: '#fff' }}>{f.id}</span>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 11, color: f.color }}>{f.status}</span>
                            <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.20)' }}>{f.time}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{f.formule}, {f.vol}. {f.note}</p>
                      </div>
                    ));
                return feedItems;
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: 12, borderTop: `1px solid ${T.cardBorder}` }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
                Total file: {rows.filter(r => r.status === 'planifie').reduce((s, r) => s + r.volume, 0)} m³ restants
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <BatchDetailDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
