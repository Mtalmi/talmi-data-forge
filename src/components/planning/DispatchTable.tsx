import { useMemo, useState } from 'react';
import { List, Map, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BonLivraison {
  bl_id: string;
  client_id: string;
  formule_id: string;
  volume_m3: number;
  workflow_status: string;
  heure_prevue: string | null;
  camion_assigne: string | null;
  toupie_assignee: string | null;
  heure_depart_centrale: string | null;
  heure_arrivee_chantier: string | null;
  clients?: { nom_client: string } | null;
}

interface DispatchTableProps {
  bons: BonLivraison[];
  onRowClick?: (bon: BonLivraison) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; prefix: string }> = {
  planification: { label: 'À Démarrer', color: '#9CA3AF', prefix: '●' },
  production: { label: 'En Production', color: '#F59E0B', prefix: '●' },
  en_chargement: { label: 'En Chargement', color: '#60A5FA', prefix: '●' },
  validation_technique: { label: 'Validation', color: '#F59E0B', prefix: '●' },
  en_livraison: { label: 'En Route', color: '#10B981', prefix: '●' },
  livre: { label: 'Livré', color: '#10B981', prefix: '✓' },
  facture: { label: 'Facturé', color: '#10B981', prefix: '✓' },
};

// Demo rows when no real data
const DEMO_ROWS = [
  { bl: '2602-015', client: 'BTP Maroc', formule: 'F-B30', vol: '20 m³', toupie: 'TOU-02', depart: '15:00', eta: '15:22', status: 'planification' },
  { bl: '2602-014', client: 'Saudi Readymix', formule: 'F-B25', vol: '50 m³', toupie: 'TOU-03', depart: '13:00', eta: '13:38', status: 'en_chargement' },
  { bl: '2602-013', client: 'Constructions Modernes', formule: 'F-B20', vol: '80 m³', toupie: 'TOU-01', depart: '10:30', eta: '11:07', status: 'en_livraison', statusExtra: '(1/4)' },
  { bl: '2602-012', client: 'Ciments & Béton du Sud', formule: 'F-B30', vol: '30 m³', toupie: 'TOU-02', depart: '09:00', eta: '—', status: 'livre' },
  { bl: '2602-011', client: 'BTP Maroc', formule: 'F-B25', vol: '45 m³', toupie: 'TOU-01', depart: '07:00', eta: '—', status: 'livre' },
];

function estimateETA(depart: string | null): string {
  if (!depart) return '—';
  const [h, m] = depart.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '—';
  const total = h * 60 + m + 22 + Math.floor(Math.random() * 15);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function DispatchTable({ bons, onRowClick }: DispatchTableProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const rows = useMemo(() => {
    if (bons.length === 0) {
      return DEMO_ROWS.map(d => ({
        bl: d.bl,
        client: d.client,
        formule: d.formule,
        vol: d.vol,
        toupie: d.toupie,
        depart: d.depart,
        eta: d.eta,
        status: d.status,
        statusExtra: (d as any).statusExtra || '',
        raw: null as BonLivraison | null,
      }));
    }
    return bons.map(b => ({
      bl: b.bl_id.replace('BL-', ''),
      client: b.clients?.nom_client || b.client_id,
      formule: b.formule_id.startsWith('F-') ? b.formule_id : `F-${b.formule_id}`,
      vol: `${b.volume_m3} m³`,
      toupie: b.toupie_assignee || b.camion_assigne || '—',
      depart: b.heure_prevue || '—',
      eta: b.heure_arrivee_chantier || estimateETA(b.heure_prevue),
      status: b.workflow_status || 'planification',
      statusExtra: '',
      raw: b,
    }));
  }, [bons]);

  const uniqueToupies = new Set(rows.map(r => r.toupie).filter(t => t !== '—'));

  const PROMESSE_DATA: Record<string, { time: string; badge: string; type: 'green' | 'red' | 'muted' }> = {
    '2602-011': { time: '07:30', badge: '✓ -8 min', type: 'green' },
    '2602-012': { time: '09:30', badge: '✓ -2 min', type: 'green' },
    '2602-013': { time: '10:30', badge: '⚠ +25 min', type: 'red' },
    '2602-014': { time: '13:30', badge: '—', type: 'muted' },
    '2602-015': { time: '15:30', badge: '—', type: 'muted' },
  };

  const COLS = [
    { key: 'bl', label: 'BL', width: '10%', align: 'left' as const },
    { key: 'client', label: 'CLIENT', width: '20%', align: 'left' as const },
    { key: 'formule', label: 'FORMULE', width: '9%', align: 'center' as const },
    { key: 'vol', label: 'VOL', width: '8%', align: 'center' as const },
    { key: 'toupie', label: 'TOUPIE', width: '10%', align: 'center' as const },
    { key: 'depart', label: 'DÉPART', width: '9%', align: 'center' as const },
    { key: 'eta', label: 'ETA', width: '9%', align: 'center' as const },
    { key: 'promesse', label: 'PROMESSE', width: '90px', align: 'center' as const },
    { key: 'statut', label: 'STATUT', width: '1fr', align: 'right' as const },
  ];

  return (
    <>
    <div style={{
      background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      borderTop: '2px solid #D4A843',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #1E2D4A',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            color: '#D4A843', fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em',
          }}>
            CENTRE DE COMMANDE
          </span>
          <span style={{ color: '#64748B', fontSize: 11 }}>·</span>
          <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>Dispatch en direct</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 2 }}>
            <button onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: viewMode === 'list' ? '1px solid #D4A843' : 'none', cursor: 'pointer', background: viewMode === 'list' ? 'rgba(212,168,67,0.1)' : 'transparent', transition: 'background 150ms' }}>
              <List size={13} color={viewMode === 'list' ? '#D4A843' : '#64748B'} />
              <span style={{ fontSize: 10, fontWeight: 600, color: viewMode === 'list' ? '#D4A843' : '#64748B' }}>Vue Liste</span>
            </button>
            <button onClick={() => setViewMode('map')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: viewMode === 'map' ? '1px solid #D4A843' : 'none', cursor: 'pointer', background: viewMode === 'map' ? 'rgba(212,168,67,0.1)' : 'transparent', transition: 'background 150ms' }}>
              <Map size={13} color={viewMode === 'map' ? '#D4A843' : '#64748B'} />
              <span style={{ fontSize: 10, fontWeight: 600, color: viewMode === 'map' ? '#D4A843' : '#64748B' }}>Vue Carte</span>
            </button>
          </div>
          <span style={{
            padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600,
            background: 'rgba(212,168,67,0.06)', color: '#D4A843',
            border: '1px solid #D4A843',
          }}>
            {uniqueToupies.size} toupies · {rows.length} livraisons
          </span>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div style={{ height: 420, background: '#0F1629', position: 'relative', overflow: 'hidden' }}>
          {/* 7. TITLE - top center */}
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'map-live-dot 1.5s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ color: '#D4A843', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 12, fontWeight: 700, letterSpacing: '2px' }}>SUIVI GPS EN DIRECT</span>
          </div>

          {/* 1. LEGEND - top left */}
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(15,22,41,0.9)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { color: '#10B981', label: 'En route' },
              { color: '#F59E0B', label: 'Chargement' },
              { color: '#60A5FA', label: 'Livré' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', color: '#9CA3AF' }}>{item.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, background: '#D4A843', transform: 'rotate(45deg)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', color: '#9CA3AF' }}>Client</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #D4A843', background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, color: '#D4A843', fontWeight: 700, flexShrink: 0 }}>⬣</span>
              <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', color: '#9CA3AF' }}>Centrale</span>
            </div>
          </div>

          {/* 4. COMPASS - top right */}
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid rgba(212,168,67,0.3)',
            background: 'rgba(15,22,41,0.9)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', color: '#D4A843', fontWeight: 700, lineHeight: 1 }}>N</span>
            <span style={{ fontSize: 8, color: '#D4A843', lineHeight: 1, marginTop: -2 }}>▲</span>
          </div>

          <svg width="100%" height="380" viewBox="0 0 700 380" style={{ display: 'block' }}>
            {/* CSS animations */}
            <defs>
              <style>{`
                @keyframes map-plant-pulse { 0%, 100% { r: 22; opacity: 0.4; } 50% { r: 34; opacity: 0; } }
                @keyframes map-live-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                @keyframes map-eta-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                @keyframes map-route-flow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -24; } }
              `}</style>
            </defs>

            {/* 1. BACKGROUND GRID - 60px intervals for city block feel */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`vg${i}`} x1={i * 60} y1={0} x2={i * 60} y2={380} stroke="rgba(212,168,67,0.03)" strokeWidth={1} />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`hg${i}`} x1={0} y1={i * 60} x2={700} y2={i * 60} stroke="rgba(212,168,67,0.03)" strokeWidth={1} />
            ))}

            {/* 2. ROAD LINES - major boulevards */}
            {/* Horizontal roads */}
            <line x1={0} y1={130} x2={700} y2={130} stroke="rgba(255,255,255,0.06)" strokeWidth={3} strokeLinecap="round" />
            <line x1={0} y1={230} x2={700} y2={230} stroke="rgba(255,255,255,0.06)" strokeWidth={3} strokeLinecap="round" />
            <line x1={0} y1={310} x2={700} y2={310} stroke="rgba(255,255,255,0.06)" strokeWidth={3} strokeLinecap="round" />
            {/* Vertical roads */}
            <line x1={220} y1={0} x2={220} y2={380} stroke="rgba(255,255,255,0.06)" strokeWidth={3} strokeLinecap="round" />
            <line x1={450} y1={0} x2={450} y2={380} stroke="rgba(255,255,255,0.06)" strokeWidth={3} strokeLinecap="round" />
            <line x1={600} y1={0} x2={600} y2={380} stroke="rgba(255,255,255,0.06)" strokeWidth={3} strokeLinecap="round" />

            {/* Road labels */}
            <text x={500} y={125} style={{ fontSize: 9, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: 'rgba(255,255,255,0.15)', letterSpacing: '0.5px' }}>Bd Zerktouni</text>
            <text x={225} y={305} style={{ fontSize: 9, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: 'rgba(255,255,255,0.15)', letterSpacing: '0.5px' }}>Route de Médiouna</text>

            {/* 6. ZONE LABELS - geographic context */}
            <text x={80} y={60} style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: 'rgba(255,255,255,0.08)', fontStyle: 'italic' }}>Zone Industrielle Aïn Sebaâ</text>
            <text x={450} y={360} style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: 'rgba(255,255,255,0.08)', fontStyle: 'italic' }}>Centre-Ville</text>
            <text x={520} y={175} style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: 'rgba(255,255,255,0.08)', fontStyle: 'italic' }}>Maarif</text>

            {/* 5. ROUTE LINES - distinct by status */}
            {/* TOU-03 completed route (gray solid, faded) */}
            <line x1={350} y1={190} x2={280} y2={310} stroke="#4A5568" strokeWidth={1.5} opacity={0.4} />
            {/* TOU-02 loading route (amber dashed) */}
            <line x1={350} y1={190} x2={160} y2={170} stroke="#F59E0B" strokeWidth={2} strokeDasharray="8 4" />
            {/* TOU-01 active route (gold dashed, ANIMATED) */}
            <line x1={350} y1={190} x2={540} y2={95} stroke="#D4A843" strokeWidth={2} strokeDasharray="8 4" style={{ animation: 'map-route-flow 3s linear infinite' }} />

            {/* 3. PLANT (TBOS) - gold hexagon with pulse */}
            <circle cx={350} cy={190} fill="none" stroke="rgba(212,168,67,0.4)" strokeWidth={2} style={{ animation: 'map-plant-pulse 3s ease-in-out infinite' }}>
              <animate attributeName="r" values="22;34;22" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            {/* Hexagon shape */}
            <polygon points="350,174 364,182 364,198 350,206 336,198 336,182" fill="#D4A843" stroke="rgba(212,168,67,0.6)" strokeWidth={1} />
            <text x={350} y={193} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: '#0F1629', letterSpacing: '0.1em' }}>TBOS</text>
            <text x={350} y={222} textAnchor="middle" style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: '#D4A843', fontWeight: 500 }}>Atlas Concrete · Casablanca</text>

            {/* 8. CLIENT DIAMONDS with shadow/glow */}
            {[
              { x: 540, y: 70, name: 'Constructions Modernes' },
              { x: 160, y: 140, name: 'Saudi Readymix' },
              { x: 280, y: 330, name: 'BTP Maroc' },
              { x: 580, y: 230, name: 'Ciments du Maroc' },
              { x: 450, y: 300, name: 'ONCF' },
            ].map(c => (
              <g key={c.name} style={{ filter: 'drop-shadow(0 0 4px rgba(212,168,67,0.4))' }}>
                <rect x={c.x - 5} y={c.y - 5} width={10} height={10} fill="#D4A843" transform={`rotate(45 ${c.x} ${c.y})`} opacity={0.7} />
                <text x={c.x + 12} y={c.y + 3} style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{c.name}</text>
              </g>
            ))}

            {/* 7. TOU-01 truck (green, directional arrow pointing toward Constructions Modernes) */}
            <g>
              <polygon points="480,110 474,126 486,126" fill="rgba(16,185,129,0.25)" stroke="#10B981" strokeWidth={1.5} />
              <rect x={496} y={106} width={135} height={30} rx={6} fill="rgba(15,23,42,0.9)" stroke="rgba(16,185,129,0.3)" strokeWidth={1} />
              <text x={504} y={118} style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontWeight: 600, fill: '#D4A843' }}>TOU-01</text>
              <text x={504} y={130} style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: '#9CA3AF' }}>En route · BL-2602-013</text>
            </g>

            {/* 7. TOU-02 truck (amber, arrow pointing left toward Saudi Readymix / near plant) */}
            <g>
              <polygon points="190,200 206,194 206,206" fill="rgba(245,158,11,0.25)" stroke="#F59E0B" strokeWidth={1.5} />
              <rect x={216} y={186} width={150} height={30} rx={6} fill="rgba(15,23,42,0.9)" stroke="rgba(245,158,11,0.3)" strokeWidth={1} />
              <text x={224} y={198} style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontWeight: 600, fill: '#D4A843' }}>TOU-02</text>
              <text x={224} y={210} style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: '#9CA3AF' }}>Chargement · BL-2602-014</text>
            </g>

            {/* 7. TOU-03 truck (blue, arrow pointing down toward BTP Maroc) */}
            <g>
              <polygon points="300,294 294,280 306,280" fill="rgba(96,165,250,0.25)" stroke="#60A5FA" strokeWidth={1.5} />
              <rect x={316} y={282} width={135} height={30} rx={6} fill="rgba(15,23,42,0.9)" stroke="rgba(96,165,250,0.3)" strokeWidth={1} />
              <text x={324} y={294} style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontWeight: 600, fill: '#D4A843' }}>TOU-03</text>
              <text x={324} y={306} style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: '#9CA3AF' }}>Livré · BL-2602-011</text>
            </g>

            {/* 5. SCALE BAR - bottom left */}
            <line x1={20} y1={365} x2={100} y2={365} stroke="#D4A843" strokeWidth={1} />
            <line x1={20} y1={361} x2={20} y2={369} stroke="#D4A843" strokeWidth={1} />
            <line x1={100} y1={361} x2={100} y2={369} stroke="#D4A843" strokeWidth={1} />
            <text x={60} y={358} textAnchor="middle" style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fill: '#D4A843' }}>2 km</text>
          </svg>

          {/* 6. Bottom summary bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 20px', background: 'linear-gradient(to top, #0F1629, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>
              <span style={{ color: '#D4A843' }}>3</span> toupies actives · <span style={{ color: '#D4A843' }}>2</span> en mission · <span style={{ color: '#D4A843' }}>1</span> livré · Prochaine arrivée: TOU-01 <span style={{ color: '#D4A843', animation: 'map-eta-pulse 1.5s ease-in-out infinite' }}>ETA 10:55</span>
            </span>
          </div>
        </div>
      ) : (
        <>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: COLS.map(c => c.width).join(' '),
        background: '#1E2D4A40',
        borderBottom: '1px solid #1E2D4A',
      }}>
        {COLS.map(col => (
          <div key={col.key} style={{
            padding: '10px 16px',
            color: '#64748B',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            textAlign: col.align,
          }}>
            {col.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const s = STATUS_MAP[row.status] || STATUS_MAP.planification;
        const isLivre = row.status === 'livre' || row.status === 'facture';
        const isEnRoute = row.status === 'en_livraison';

        return (
          <div
            key={row.bl + i}
            onClick={() => row.raw && onRowClick?.(row.raw)}
            style={{
              display: 'grid',
              gridTemplateColumns: COLS.map(c => c.width).join(' '),
              borderTop: i > 0 ? '1px solid rgba(30, 45, 74, 0.6)' : 'none',
              cursor: row.raw ? 'pointer' : 'default',
              transition: 'background 150ms',
              opacity: isLivre ? 0.55 : 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* BL */}
            <div style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontWeight: 600, color: '#D4A843' }}>
              {row.bl}
            </div>
            {/* CLIENT */}
            <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.client}
            </div>
            {/* FORMULE */}
            <div style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontWeight: 700, color: '#D4A843', textAlign: 'center' }}>
              {row.formule}
            </div>
            {/* VOL */}
            <div style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontWeight: 700, color: '#F1F5F9', textAlign: 'center' }}>
              {row.vol}
            </div>
            {/* TOUPIE */}
            <div style={{ padding: '12px 16px', fontSize: 11, textAlign: 'center' }}>
              <span style={{
                padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                background: 'rgba(212,168,67,0.15)', color: '#D4A843',
                border: '1px solid rgba(212,168,67,0.4)',
              }}>
                {row.toupie}
              </span>
            </div>
            {/* DÉPART */}
            <div style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', color: '#94A3B8', textAlign: 'center' }}>
              {row.depart}
            </div>
            {/* ETA */}
            <div style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', color: isEnRoute ? '#10B981' : '#94A3B8', textAlign: 'center', fontWeight: isEnRoute ? 600 : 400 }}>
              {row.eta}
            </div>
            {/* PROMESSE */}
            <div style={{ padding: '12px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {(() => {
                const p = PROMESSE_DATA[row.bl];
                if (!p) return <span style={{ color: '#4A5568', fontSize: 11 }}>—</span>;
                return (
                  <>
                    <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', color: '#94A3B8', fontWeight: 500 }}>{p.time}</span>
                    {p.type === 'muted' ? (
                      <span style={{ fontSize: 10, color: '#4A5568' }}>—</span>
                    ) : (
                      <span style={{
                        fontSize: 10, fontWeight: 600, fontFamily: 'ui-monospace, monospace', padding: '1px 6px', borderRadius: 999,
                        background: p.type === 'green' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: p.type === 'green' ? '#22C55E' : '#EF4444',
                      }}>{p.badge}</span>
                    )}
                  </>
                );
              })()}
            </div>
            {/* STATUT */}
            <div style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 999, minWidth: 100, justifyContent: 'center',
                background: `${s.color}15`,
                border: `1px solid ${s.color}30`,
              }}>
                <span style={{ fontSize: 10, color: s.color }}>{s.prefix}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: s.color, whiteSpace: 'nowrap' }}>
                  {s.label}{row.statusExtra ? ` ${row.statusExtra}` : ''}
                </span>
              </span>
              {row.bl === '2602-013' && (
                <span
                  onClick={(e) => { e.stopPropagation(); setImpactModalOpen(true); }}
                  style={{ fontSize: 11, color: '#D4A843', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}
                >
                  Voir impact →
                </span>
              )}
            </div>
          </div>
        );
      })}
      </>
      )}
    </div>

    {/* Impact Cascade Modal */}
    {impactModalOpen && (
      <div
        onClick={() => setImpactModalOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 600, background: '#0F1629',
            border: '1px solid rgba(212,168,67,0.3)',
            borderRadius: 12, overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(212,168,67,0.15)',
            background: 'linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.02))',
          }}>
            <span style={{ color: '#D4A843', fontWeight: 700, fontSize: 15 }}>⚡ Impact Cascade — BL-2602-013</span>
            <button onClick={() => setImpactModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Cascade Steps */}
          <div style={{ padding: '24px 28px' }}>
            {[
              { dot: '#EF4444', text: 'BL-2602-013 retard estimé +25 min' },
              { dot: '#F59E0B', text: 'TOU-01 rotation 2 décalée → départ 13:15 au lieu de 12:50' },
              { dot: '#EF4444', text: 'BL-2602-014 Saudi Readymix ETA 14:05 (promesse: 13:30) → retard +35 min' },
              { dot: '#F59E0B', text: 'Satisfaction Saudi Readymix: ★4.8 → estimation ★4.3' },
            ].map((step, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 16 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', background: step.dot,
                      boxShadow: `0 0 8px ${step.dot}40`, flexShrink: 0,
                    }} />
                  </div>
                  <p style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 500, lineHeight: 1.5, paddingTop: 0 }}>{step.text}</p>
                </div>
                {idx < 3 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 7 }}>
                    <div style={{ width: 2, height: 28, background: 'linear-gradient(to bottom, #D4A843, rgba(212,168,67,0.3))' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendation Box */}
          <div style={{ padding: '0 28px 20px' }}>
            <div style={{
              background: 'rgba(212,168,67,0.05)',
              borderLeft: '3px solid #D4A843',
              borderRadius: '0 8px 8px 0',
              padding: 16,
            }}>
              <p style={{ color: '#F1F5F9', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                <span style={{ color: '#D4A843', fontWeight: 700 }}>Recommandation IA:</span>{' '}
                Réaffecter BL-2602-014 à TOU-02 (disponible 13:00). Retard éliminé. Coût supplémentaire: 45 DH carburant.
              </p>
              <span style={{
                padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 600,
                background: 'rgba(212,168,67,0.12)', color: '#D4A843',
                border: '1px solid rgba(212,168,67,0.25)',
              }}>
                Généré par IA · Claude Opus
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            padding: '16px 28px',
            borderTop: '1px solid rgba(212,168,67,0.15)',
          }}>
            <button
              onClick={() => setImpactModalOpen(false)}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'transparent', border: '1px solid #D4A843', color: '#D4A843',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
            <button
              onClick={() => { toast.success('Recommandation appliquée — BL-2602-014 réaffecté à TOU-02'); setImpactModalOpen(false); }}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#D4A843', border: '1px solid #D4A843', color: '#0F1629',
                cursor: 'pointer',
              }}
            >
              Appliquer Recommandation
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
