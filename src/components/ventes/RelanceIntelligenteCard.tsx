import { useCountUp } from '@/hooks/useCountUp';

const mono = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

export function RelanceIntelligenteCard() {
  const retardVal = useCountUp(2, 1500);
  const revenuVal = useCountUp(47, 1500);
  const tauxVal = useCountUp(68, 1500);

  const rows = [
    { client: 'Alliances', devis: 'DEV-2602-XXX', montant: '22,400 DH', jours: 34, joursColor: '#EF4444', action: 'Relancer par WhatsApp' },
    { client: 'Palmeraie', devis: 'DEV-2602-XXX', montant: '24,600 DH', jours: 31, joursColor: '#F59E0B', action: 'Relancer par Email' },
  ];

  return (
    <div style={{
      background: 'rgba(15,23,41,0.6)', border: '1px solid rgba(212,168,67,0.12)',
      borderRadius: 12, borderTop: '2px solid #F59E0B', padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ color: '#D4A843', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: mono }}>
          ✦ Agent IA: Relance Intelligente
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 100, padding: '3px 10px', fontFamily: mono }}>
          ✨ Généré par IA · Claude Opus
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: mono }}>Devis en Retard</p>
          <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 100, color: '#F59E0B' }}>{retardVal}</span>
          <p style={{ fontSize: 10, color: '#9CA3AF', fontFamily: mono, marginTop: 4 }}>&gt; 30 jours sans réponse</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: mono }}>Revenu à Risque</p>
          <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 100, color: '#EF4444' }}>{revenuVal}K</span>
          <span style={{ fontSize: 16, color: '#9CA3AF', fontFamily: mono, marginLeft: 4 }}>DH</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: mono }}>Taux de Récupération</p>
          <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 100, color: '#22C55E' }}>{tauxVal}%</span>
          <p style={{ fontSize: 10, color: '#9CA3AF', fontFamily: mono, marginTop: 4 }}>historique relances</p>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Client', 'Devis', 'Montant', 'Jours sans réponse', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#9CA3AF', padding: '0 12px 10px 0', fontFamily: mono }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 200ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 13, color: 'white', fontWeight: 500 }}>{r.client}</td>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#D4A843', fontFamily: mono }}>{r.devis}</td>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 13, color: '#D4A843', fontFamily: mono }}>{r.montant}</td>
                <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: r.joursColor, fontFamily: mono, fontWeight: 600 }}>{r.jours} jours</td>
                <td style={{ padding: '10px 12px 10px 0' }}>
                  <button style={{ background: '#D4A843', color: '#0F1629', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: mono }}>{r.action}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommandation */}
      <div style={{ background: 'rgba(212,168,67,0.04)', borderLeft: '3px solid #D4A843', borderRadius: '0 8px 8px 0', padding: 16 }}>
        <span style={{ color: '#D4A843', fontWeight: 600, fontFamily: mono, fontSize: 13 }}>Relance prioritaire : </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          Alliances (<span style={{ color: '#D4A843', fontFamily: mono }}>34j</span>) — historique d'achat régulier, probabilité de conversion <span style={{ color: '#D4A843', fontFamily: mono, fontWeight: 600 }}>72%</span> si relancé sous <span style={{ color: '#D4A843', fontFamily: mono }}>48h</span>. Proposer remise volume <span style={{ color: '#D4A843', fontFamily: mono, fontWeight: 600 }}>3%</span> pour débloquer.
        </span>
      </div>
    </div>
  );
}
