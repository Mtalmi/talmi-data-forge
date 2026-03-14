import { useCountUp } from '@/hooks/useCountUp';

const mono = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

export function ScoringDynamiquePrixCard() {
  const recalcVal = useCountUp(3, 1500);
  const erosionVal = useCountUp(42, 1500);
  const impactVal = useCountUp(14400, 1500);

  const rows = [
    { devis: 'DEV-2602-349', formule: 'F-B30', init: '38%', initC: '#22C55E', act: '31%', actC: '#F59E0B', ecart: '-7 pts ↓', ecartC: '#EF4444', ok: false },
    { devis: 'DEV-2602-895', formule: 'F-B20', init: '39%', initC: '#22C55E', act: '34%', actC: '#F59E0B', ecart: '-5 pts ↓', ecartC: '#EF4444', ok: false },
    { devis: 'DEV-2602-716', formule: 'F-B25', init: '37%', initC: '#22C55E', act: '36%', actC: '#22C55E', ecart: '-1 pt', ecartC: '#9CA3AF', ok: true },
  ];

  return (
    <div style={{
      background: 'rgba(15,23,41,0.6)', border: '1px solid rgba(212,168,67,0.12)',
      borderRadius: 12, borderTop: '2px solid #EF4444', padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ color: '#D4A843', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: mono }}>
          ✦ Agent IA: Scoring Dynamique de Prix
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 100, padding: '3px 10px', fontFamily: mono }}>
          ✨ Généré par IA · Claude Opus
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: mono }}>Devis à Recalculer</p>
          <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 100, color: '#EF4444' }}>{recalcVal}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: mono }}>Érosion Marge Moy.</p>
          <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 100, color: '#EF4444' }}>-{(erosionVal / 10).toFixed(1)}</span>
          <span style={{ fontSize: 16, color: '#9CA3AF', fontFamily: mono, marginLeft: 4 }}>pts</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: mono }}>Impact Mensuel</p>
          <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 100, color: '#EF4444', textShadow: '0 0 15px rgba(239,68,68,0.3)' }}>
            -{impactVal.toLocaleString('fr-FR')}
          </span>
          <span style={{ fontSize: 16, color: '#9CA3AF', fontFamily: mono, marginLeft: 4 }}>DH</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Devis', 'Formule', 'Marge Initiale', 'Marge Actuelle', 'Écart', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#9CA3AF', padding: '0 12px 10px 0', fontFamily: mono }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 200ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#D4A843', fontFamily: mono }}>{r.devis}</td>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#9CA3AF', fontFamily: mono }}>{r.formule}</td>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: r.initC, fontFamily: mono, fontWeight: 600 }}>{r.init}</td>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: r.actC, fontFamily: mono, fontWeight: 600 }}>{r.act}</td>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: r.ecartC, fontFamily: mono, fontWeight: 600 }}>{r.ecart}</td>
                <td style={{ padding: '10px 12px 10px 0' }}>
                  {r.ok ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '3px 12px', fontFamily: mono }}>OK</span>
                  ) : (
                    <button style={{ background: 'transparent', color: '#D4A843', fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 6, border: '1px solid #D4A843', cursor: 'pointer', fontFamily: mono }}>Recalculer</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommandation */}
      <div style={{ background: 'rgba(212,168,67,0.04)', borderLeft: '3px solid #D4A843', borderRadius: '0 8px 8px 0', padding: 16 }}>
        <span style={{ color: '#EF4444', fontWeight: 600, fontFamily: mono, fontSize: 13 }}>Alerte : </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          le prix du ciment a augmenté de <span style={{ color: '#D4A843', fontFamily: mono, fontWeight: 600 }}>+6%</span> depuis le 1er mars. <span style={{ color: '#D4A843', fontFamily: mono, fontWeight: 600 }}>3</span> devis F-B30/F-B20 en attente ont des marges érodées. Action immédiate recommandée sur <span style={{ color: '#D4A843', fontFamily: mono }}>DEV-2602-349</span> (plus gros écart).
        </span>
      </div>
    </div>
  );
}
