import { useCountUp } from '@/hooks/useCountUp';
import {
  AgentContainer, AgentHeader, AgentKPITriplet,
  AgentRecommendation, GoldText, DangerText,
} from '@/components/ui/agent-card';

const mono = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

export function ScoringDynamiquePrixCard({ index }: { index?: number }) {
  const recalcVal = useCountUp(3, 1500);
  const erosionVal = useCountUp(42, 1500);
  const impactVal = useCountUp(14400, 1500);

  const rows = [
    { devis: 'DEV-2602-349', formule: 'F-B30', init: '38%', initC: '#22C55E', act: '31%', actC: '#F59E0B', ecart: '-7 pts ↓', ecartC: '#EF4444', ok: false },
    { devis: 'DEV-2602-895', formule: 'F-B20', init: '39%', initC: '#22C55E', act: '34%', actC: '#F59E0B', ecart: '-5 pts ↓', ecartC: '#EF4444', ok: false },
    { devis: 'DEV-2602-716', formule: 'F-B25', init: '37%', initC: '#22C55E', act: '36%', actC: '#22C55E', ecart: '-1 pt', ecartC: '#9CA3AF', ok: true },
  ];

  return (
    <AgentContainer severity="critical" index={index}>
      <AgentHeader name="Scoring Dynamique de Prix" severityBadge="forensique" />

      <AgentKPITriplet kpis={[
        { label: 'Devis à Recalculer', value: recalcVal, color: '#EF4444' },
        { label: 'Érosion Marge Moy.', value: `-${(erosionVal / 10).toFixed(1)}`, color: '#EF4444', subtitle: 'pts' },
        { label: 'Impact Mensuel', value: `-${impactVal.toLocaleString('fr-FR').replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ')}`, color: '#EF4444', subtitle: 'DH' },
      ]} />

      {/* Table */}
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Devis', 'Formule', 'Marge Initiale', 'Marge Actuelle', 'Écart', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#9CA3AF', padding: '0 12px 10px 0', fontFamily: mono }}>{h}</th>
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
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '3px 12px', fontFamily: mono }}>OK</span>
                  ) : (
                    <button style={{ background: 'transparent', color: '#D4A843', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 6, border: '1px solid #D4A843', cursor: 'pointer', fontFamily: mono }}>Recalculer</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AgentRecommendation severity="red" title="Alerte">
        Le prix du ciment a augmenté de <GoldText>+6%</GoldText> depuis le 1er mars. <GoldText>3</GoldText> devis F-B30/F-B20 en attente ont des marges érodées. Action immédiate recommandée sur <GoldText>DEV-2602-349</GoldText> (plus gros écart).
      </AgentRecommendation>
    </AgentContainer>
  );
}
