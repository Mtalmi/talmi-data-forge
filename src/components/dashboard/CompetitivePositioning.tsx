import React from 'react';

const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

type CellStatus = 'yes' | 'no' | 'partial' | 'soon' | 'text';

interface RowDef {
  feature: string;
  tbos: CellStatus;
  tbosNote?: string;
  commandAlkon: CellStatus;
  commandAlkonNote?: string;
  sysdyne: CellStatus;
  sysdyneNote?: string;
  marcotte: CellStatus;
  marcotteNote?: string;
  excel: CellStatus;
  excelNote?: string;
}

const ROWS: RowDef[] = [
  { feature: 'Intelligence IA (24 agents)', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Prédiction arrêt usine', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Fraude/Vol détection', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Béton Vivant (fraîcheur)', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Profit par toupie', tbos: 'yes', commandAlkon: 'partial', commandAlkonNote: 'partiel', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Multi-marchés (MENA/EU/US)', tbos: 'yes', commandAlkon: 'partial', commandAlkonNote: 'US only', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'RTL Arabe', tbos: 'soon', tbosNote: 'bientôt', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Conformité NM/EN/ASTM', tbos: 'yes', commandAlkon: 'partial', commandAlkonNote: 'ASTM only', sysdyne: 'partial', sysdyneNote: 'ASTM only', marcotte: 'no', excel: 'no' },
  { feature: 'GPS flotte intégré', tbos: 'yes', commandAlkon: 'partial', commandAlkonNote: 'addon payant', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'WhatsApp intégré', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Portail client tracking', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Briefing IA quotidien', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'Surestaries automatiques', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
  { feature: 'ROI Calculator', tbos: 'yes', commandAlkon: 'no', sysdyne: 'no', marcotte: 'no', excel: 'no' },
];

const PRICING = [
  { label: '~180K DH', color: '#D4A843', bg: 'rgba(212,168,67,0.12)' },
  { label: '~500K DH', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  { label: '~300K DH', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { label: '~200K DH', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { label: '~50K DH', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', note: '0 intelligence' },
];

const HEADERS = ['FONCTIONNALITÉ', 'TBOS', 'COMMAND ALKON', 'SYSDYNE', 'MARCOTTE', 'EXCEL/ERP'];

function StatusCell({ status, note }: { status: CellStatus; note?: string }) {
  if (status === 'yes') return (
    <div className="flex flex-col items-center gap-0.5">
      <span style={{ color: '#22C55E', fontSize: 14 }}>✓</span>
    </div>
  );
  if (status === 'no') return (
    <span style={{ color: '#EF4444', fontSize: 14 }}>✗</span>
  );
  if (status === 'partial') return (
    <div className="flex flex-col items-center gap-0.5">
      <span style={{ color: '#F59E0B', fontSize: 14 }}>●</span>
      {note && <span style={{ fontFamily: MN, fontSize: 8, color: '#F59E0B', opacity: 0.7 }}>{note}</span>}
    </div>
  );
  if (status === 'soon') return (
    <div className="flex flex-col items-center gap-0.5">
      <span style={{ color: '#D4A843', fontSize: 14 }}>✓</span>
      {note && <span style={{ fontFamily: MN, fontSize: 8, color: '#D4A843', opacity: 0.7 }}>{note}</span>}
    </div>
  );
  return null;
}

export function CompetitivePositioning() {
  return (
    <div style={{
      background: 'rgba(15,23,41,0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderTop: '2px solid #D4A843',
      borderRadius: 12,
      overflow: 'hidden',
      backdropFilter: 'blur(4px)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MN, fontWeight: 700, fontSize: 14, color: '#F1F5F9' }}>
          ✦ POSITIONNEMENT CONCURRENTIEL — TBOS vs MARCHÉ
        </span>
        <span style={{
          fontFamily: MN, fontSize: 9, padding: '2px 8px', borderRadius: 4,
          border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843',
          background: 'rgba(212,168,67,0.08)', marginLeft: 'auto', flexShrink: 0,
        }}>
          Généré par IA · Claude Opus
        </span>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MN, fontSize: 11 }}>
          <thead>
            <tr>
              {HEADERS.map((h, i) => (
                <th key={h} style={{
                  padding: '8px 10px', textAlign: i === 0 ? 'left' : 'center',
                  fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  ...(i === 1 ? { background: 'rgba(212,168,67,0.08)', color: '#D4A843' } : {}),
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => {
              const cells: { status: CellStatus; note?: string }[] = [
                { status: row.tbos, note: row.tbosNote },
                { status: row.commandAlkon, note: row.commandAlkonNote },
                { status: row.sysdyne, note: row.sysdyneNote },
                { status: row.marcotte, note: row.marcotteNote },
                { status: row.excel, note: row.excelNote },
              ];
              return (
                <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.02)' }}>
                  <td style={{ padding: '7px 10px', color: '#CBD5E1', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {row.feature}
                  </td>
                  {cells.map((c, ci) => (
                    <td key={ci} style={{
                      padding: '7px 10px', textAlign: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      ...(ci === 0 ? { background: 'rgba(212,168,67,0.08)' } : {}),
                    }}>
                      <StatusCell status={c.status} note={c.note} />
                    </td>
                  ))}
                </tr>
              );
            })}
            {/* Pricing row */}
            <tr style={{ borderTop: '1px solid rgba(212,168,67,0.15)' }}>
              <td style={{ padding: '10px 10px', color: '#F1F5F9', fontSize: 11, fontWeight: 600 }}>
                Prix/an estimé
              </td>
              {PRICING.map((p, i) => (
                <td key={i} style={{
                  padding: '10px 10px', textAlign: 'center',
                  ...(i === 0 ? { background: 'rgba(212,168,67,0.08)' } : {}),
                }}>
                  <div className="flex flex-col items-center gap-0.5">
                    <span style={{ fontFamily: MN, fontSize: 12, fontWeight: 600, color: p.color, padding: '2px 8px', borderRadius: 4, background: p.bg }}>
                      {p.label}
                    </span>
                    {p.note && <span style={{ fontSize: 8, color: '#9CA3AF', fontStyle: 'italic' }}>{p.note}</span>}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Moat Summary */}
      <div style={{
        margin: '0 16px 16px',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, rgba(212,168,67,0.06) 0%, rgba(212,168,67,0.02) 100%)',
        borderLeft: '3px solid #D4A843',
        borderRadius: 8,
      }}>
        <p style={{ fontFamily: MN, fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, margin: 0 }}>
          TBOS possède <span style={{ color: '#D4A843', fontWeight: 700 }}>14 exclusivités</span> qu'aucun concurrent n'offre. La combinaison Intelligence IA + Multi-marchés + Anti-fraude crée une barrière d'entrée estimée à <span style={{ color: '#D4A843', fontWeight: 700 }}>18 mois</span> de développement pour un concurrent.
        </p>
      </div>
    </div>
  );
}
