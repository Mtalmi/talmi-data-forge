import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { GoldSpinner } from '@/hooks/useActionButton';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

type BtnState = 'idle' | 'loading' | 'done';

interface QueueRow {
  priority: number;
  materiau: string;
  qty: string;
  fournisseur: string;
  cost: string;
  autonomy: string;
  autonomyColor: string;
  urgencyLabel: string;
  urgencyColor: string;
  urgencyBg: string;
  urgencyBorder: string;
  isCritical: boolean;
  btnStyle: 'red' | 'goldFilled' | 'goldOutline';
}

const ROWS: QueueRow[] = [
  { priority: 1, materiau: 'Adjuvant', qty: '500 L', fournisseur: 'Sika Maroc', cost: '42,500 DH', autonomy: '6j 16h', autonomyColor: '#EF4444', urgencyLabel: '🔴 CRITIQUE', urgencyColor: '#EF4444', urgencyBg: 'rgba(239,68,68,0.12)', urgencyBorder: '#EF4444', isCritical: true, btnStyle: 'red' },
  { priority: 2, materiau: 'Eau', qty: '10,000 L', fournisseur: 'ONEP', cost: '80,000 DH', autonomy: '6j 0h', autonomyColor: '#EF4444', urgencyLabel: '🔴 CRITIQUE', urgencyColor: '#EF4444', urgencyBg: 'rgba(239,68,68,0.12)', urgencyBorder: '#EF4444', isCritical: true, btnStyle: 'goldFilled' },
  { priority: 3, materiau: 'Sable', qty: '80,000 m³', fournisseur: 'Carrières du Sud', cost: '9,600,000 DH', autonomy: '6j 12h', autonomyColor: '#F59E0B', urgencyLabel: '⚠ URGENT', urgencyColor: '#F59E0B', urgencyBg: 'rgba(245,158,11,0.12)', urgencyBorder: '#F59E0B', isCritical: false, btnStyle: 'goldFilled' },
  { priority: 4, materiau: 'Gravette', qty: '60,000 m³', fournisseur: 'Carrières du Sud', cost: '5,700,000 DH', autonomy: '7j 2h', autonomyColor: '#F59E0B', urgencyLabel: '⚠ URGENT', urgencyColor: '#F59E0B', urgencyBg: 'rgba(245,158,11,0.12)', urgencyBorder: '#F59E0B', isCritical: false, btnStyle: 'goldOutline' },
  { priority: 5, materiau: 'Ciment', qty: '20,000 kg', fournisseur: 'LafargeHolcim', cost: '9,000 DH', autonomy: '7j 12h', autonomyColor: '#D4A843', urgencyLabel: '● MODÉRÉ', urgencyColor: '#D4A843', urgencyBg: 'rgba(212,168,67,0.12)', urgencyBorder: '#D4A843', isCritical: false, btnStyle: 'goldOutline' },
];

const prioritySize = (p: number) => p <= 1 ? 18 : p <= 2 ? 16 : 14;

export function SmartReorderQueue() {
  const [hovRow, setHovRow] = useState<number | null>(null);
  const [rowStates, setRowStates] = useState<Record<number, BtnState>>({});
  const [allState, setAllState] = useState<BtnState>('idle');

  const approveRow = useCallback((priority: number) => {
    if (rowStates[priority] === 'done' || rowStates[priority] === 'loading') return;
    setRowStates(prev => ({ ...prev, [priority]: 'loading' }));
    setTimeout(() => {
      setRowStates(prev => ({ ...prev, [priority]: 'done' }));
      const row = ROWS.find(r => r.priority === priority);
      if (row) toast.success(`Commande ${row.materiau} approuvée — ${row.qty}`);
    }, 1000);
  }, [rowStates]);

  const approveAll = useCallback(() => {
    if (allState !== 'idle') return;
    setAllState('loading');
    ROWS.forEach((row, i) => {
      setTimeout(() => {
        setRowStates(prev => ({ ...prev, [row.priority]: 'loading' }));
        setTimeout(() => {
          setRowStates(prev => ({ ...prev, [row.priority]: 'done' }));
          if (i === ROWS.length - 1) setAllState('done');
        }, 1000);
      }, i * 100);
    });
  }, [allState]);

  const getRowBtnContent = (row: QueueRow) => {
    const st = rowStates[row.priority] || 'idle';
    if (st === 'loading') return <GoldSpinner size={14} color={row.btnStyle === 'red' ? '#fff' : '#0F1629'} />;
    if (st === 'done') return '✓ Approuvé';
    return 'Approuver';
  };

  const getRowBtnStyle = (row: QueueRow): React.CSSProperties => {
    const st = rowStates[row.priority] || 'idle';
    const base: React.CSSProperties = {
      fontFamily: MONO, fontSize: 11, fontWeight: 600,
      borderRadius: 6, padding: '6px 14px',
      cursor: st === 'idle' ? 'pointer' : 'default',
      transition: 'all 200ms', border: 'none',
      pointerEvents: st === 'idle' ? 'auto' : 'none',
      opacity: st === 'done' ? 0.7 : 1,
    };
    if (st === 'done') return { ...base, background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' };
    if (row.btnStyle === 'red') return { ...base, background: '#EF4444', color: '#fff' };
    if (row.btnStyle === 'goldFilled') return { ...base, background: '#D4A843', color: '#0F1629' };
    return { ...base, background: 'transparent', color: '#D4A843', border: '1px solid #D4A843' };
  };

  const getUrgencyLabel = (row: QueueRow) => {
    const st = rowStates[row.priority] || 'idle';
    if (st === 'done') return { label: 'COMMANDÉ', color: '#D4A843', bg: 'rgba(212,168,67,0.12)', border: '#D4A843' };
    return { label: row.urgencyLabel, color: row.urgencyColor, bg: row.urgencyBg, border: row.urgencyBorder };
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: MONO, fontSize: 10, fontWeight: 600, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '1.5px',
    padding: '12px 8px', textAlign: 'left', whiteSpace: 'nowrap',
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px 8px', verticalAlign: 'middle',
  };

  return (
    <div>
      <div style={{ borderTop: '2px solid #D4A843', paddingTop: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShoppingCart size={16} color="#D4A843" />
        <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
          ✦ FILE DE COMMANDES INTELLIGENTE
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.4), transparent 80%)' }} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: '#D4A843', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(212,168,67,0.06)' }}>
          Généré par IA · Claude Opus
        </span>
      </div>
      <p style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>
        Priorité calculée par urgence × coût × délai fournisseur
      </p>

      <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(212,168,67,0.12)' }}>
              <th style={{ ...headerStyle, textAlign: 'center', width: 60 }}>PRIORITÉ</th>
              <th style={headerStyle}>MATÉRIAU</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>QTÉ RECOMMANDÉE</th>
              <th style={headerStyle}>FOURNISSEUR</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>COÛT ESTIMÉ</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>AUTONOMIE</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>URGENCE</th>
              <th style={{ ...headerStyle, textAlign: 'center', width: 110 }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const isHov = hovRow === row.priority;
              const rowBg = row.isCritical
                ? (isHov ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)')
                : (isHov ? 'rgba(212,168,67,0.03)' : 'transparent');
              const urgency = getUrgencyLabel(row);

              return (
                <tr key={row.priority} onMouseEnter={() => setHovRow(row.priority)} onMouseLeave={() => setHovRow(null)}
                  style={{ background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 150ms' }}>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: prioritySize(row.priority), fontWeight: 600, color: '#D4A843' }}>#{row.priority}</span>
                  </td>
                  <td style={cellStyle}><span style={{ fontFamily: MONO, fontSize: 13, color: '#fff', fontWeight: 500 }}>{row.materiau}</span></td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}><span style={{ fontFamily: MONO, fontSize: 13, color: '#D4A843', fontWeight: 600 }}>{row.qty}</span></td>
                  <td style={cellStyle}><span style={{ fontFamily: MONO, fontSize: 12, color: '#fff', fontWeight: 400 }}>{row.fournisseur}</span></td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}><span style={{ fontFamily: MONO, fontSize: 13, color: '#D4A843', fontWeight: 600 }}>{row.cost}</span></td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}><span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: row.autonomyColor }}>{row.autonomy}</span></td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                      color: urgency.color, background: urgency.bg, border: `1px solid ${urgency.border}`,
                      animation: (rowStates[row.priority] || 'idle') === 'idle' && row.isCritical ? 'tbos-pulse 2s infinite' : 'none',
                      display: 'inline-block', whiteSpace: 'nowrap',
                    }}>
                      {urgency.label}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => approveRow(row.priority)}
                      onMouseDown={e => { if ((rowStates[row.priority] || 'idle') === 'idle') (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                      style={getRowBtnStyle(row)}
                    >
                      {getRowBtnContent(row)}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid rgba(212,168,67,0.1)', padding: '12px 16px', background: 'rgba(34,197,94,0.03)', borderLeft: '3px solid #22C55E' }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
            💡 Économie estimée si commande groupée (Sable + Gravette chez Carrières du Sud) :{' '}
            <span style={{ color: '#22C55E', fontWeight: 600 }}>-340,000 DH (-2.2%)</span>.{' '}
            Recommandation : regrouper les commandes #3 et #4.
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(212,168,67,0.12)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 16, color: '#D4A843', fontWeight: 600 }}>
            Coût total estimé : 15,422,500 DH
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => toast.info('Export PDF en cours…')}
              style={{ border: '1px solid #D4A843', color: '#D4A843', background: 'transparent', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontFamily: MONO, fontWeight: 500 }}>
              Exporter PDF
            </button>
            <button
              onClick={approveAll}
              onMouseDown={e => { if (allState === 'idle') (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              style={{
                background: allState === 'done' ? 'rgba(34,197,94,0.15)' : '#D4A843',
                color: allState === 'done' ? '#22C55E' : '#0F1629',
                border: allState === 'done' ? '1px solid rgba(34,197,94,0.3)' : 'none',
                borderRadius: 8, padding: '8px 24px',
                cursor: allState === 'idle' ? 'pointer' : 'default',
                fontSize: 14, fontWeight: 600, fontFamily: MONO,
                pointerEvents: allState === 'idle' ? 'auto' : 'none',
                opacity: allState === 'done' ? 0.7 : 1,
                transition: 'all 200ms',
              }}
            >
              {allState === 'loading' ? <GoldSpinner size={16} /> : allState === 'done' ? '✓ Tout Approuvé' : 'Approuver Tout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
