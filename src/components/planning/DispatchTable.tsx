import { useMemo, useState } from 'react';
import { List, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const COLS = [
    { key: 'bl', label: 'BL', width: '10%', align: 'left' as const },
    { key: 'client', label: 'CLIENT', width: '22%', align: 'left' as const },
    { key: 'formule', label: 'FORMULE', width: '10%', align: 'center' as const },
    { key: 'vol', label: 'VOL', width: '9%', align: 'center' as const },
    { key: 'toupie', label: 'TOUPIE', width: '10%', align: 'center' as const },
    { key: 'depart', label: 'DÉPART', width: '10%', align: 'center' as const },
    { key: 'eta', label: 'ETA', width: '10%', align: 'center' as const },
    { key: 'statut', label: 'STATUT', width: '19%', align: 'right' as const },
  ];

  return (
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
        <span style={{
          padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600,
          background: 'rgba(212,168,67,0.12)', color: '#D4A843',
          border: '1px solid rgba(212,168,67,0.25)',
        }}>
          {uniqueToupies.size} toupies · {rows.length} livraisons
        </span>
      </div>

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
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 215, 0, 0.04)')}
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
            {/* STATUT */}
            <div style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
