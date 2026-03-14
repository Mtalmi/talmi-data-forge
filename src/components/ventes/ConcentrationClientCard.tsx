import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const mono = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const segments = [
  { name: 'Saudi Readymix', value: 38, color: '#D4A843' },
  { name: 'Constructions Modernes', value: 26, color: '#E8C96A' },
  { name: 'BTP Maroc', value: 18, color: '#C49A3C' },
  { name: 'Autres', value: 18, color: '#9CA3AF' },
];

const prospects = [
  { name: 'LafargeHolcim Maroc', city: 'Casablanca', potentiel: '120 m³/mois' },
  { name: "Ciments de l'Atlas", city: 'Settat', potentiel: '80 m³/mois' },
  { name: 'ONCF Projets', city: 'Rabat-Salé', potentiel: '200 m³/mois' },
];

export function ConcentrationClientCard() {
  return (
    <div style={{
      background: 'rgba(15,23,41,0.6)', border: '1px solid rgba(212,168,67,0.12)',
      borderRadius: 12, borderTop: '2px solid #F59E0B', padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ color: '#D4A843', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: mono }}>
          ✦ Agent IA: Détecteur de Concentration Client
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: '#D4A843', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 100, padding: '3px 10px', fontFamily: mono }}>
          ✨ Généré par IA · Claude Opus
        </span>
      </div>

      {/* Donut + Risk level */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Left — Donut */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 200, height: 200, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segments} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} strokeWidth={0}>
                  {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <span style={{ fontFamily: mono, fontSize: 28, fontWeight: 100, color: '#D4A843', display: 'block' }}>2,840</span>
              <span style={{ fontSize: 9, color: '#9CA3AF', fontFamily: mono }}>HHI</span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#9CA3AF', fontFamily: mono, marginTop: 4 }}>Indice de concentration</p>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, justifyContent: 'center' }}>
            {segments.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: mono }}>{s.name} {s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Risk level */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono }}>Niveau de Risque</p>
          <span style={{
            display: 'inline-block', alignSelf: 'flex-start',
            fontSize: 16, fontWeight: 600, color: '#F59E0B',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: '8px 20px', fontFamily: mono,
          }}>
            MODÉRÉ
          </span>
          <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: mono }}>
            Seuil critique: 1 client &gt; 35% du CA
          </p>
          <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, fontFamily: mono }}>
            Saudi Readymix: 38%
          </p>
        </div>
      </div>

      {/* Diversification targets */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12, fontFamily: mono }}>Cibles de Diversification</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {prospects.map(p => (
            <div key={p.name} style={{
              border: '1px solid rgba(212,168,67,0.2)', borderRadius: 10, padding: 14,
              background: 'rgba(255,255,255,0.02)', transition: 'border-color 200ms', cursor: 'default',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#D4A843')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)')}>
              <p style={{ fontSize: 13, color: 'white', fontWeight: 500, marginBottom: 4 }}>{p.name}</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>{p.city}</p>
              <p style={{ fontSize: 11, color: '#D4A843', fontFamily: mono }}>Potentiel: {p.potentiel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommandation */}
      <div style={{ background: 'rgba(212,168,67,0.04)', borderLeft: '3px solid #D4A843', borderRadius: '0 8px 8px 0', padding: 16 }}>
        <span style={{ color: '#F59E0B', fontWeight: 600, fontFamily: mono, fontSize: 13 }}>Diversification nécessaire : </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          Saudi Readymix représente <span style={{ color: '#D4A843', fontFamily: mono, fontWeight: 600 }}>38%</span> du pipeline, dépassant le seuil de <span style={{ color: '#D4A843', fontFamily: mono }}>35%</span>. Objectif Q2 : ramener à <span style={{ color: '#D4A843', fontFamily: mono }}>&lt;30%</span> en activant <span style={{ color: '#D4A843', fontFamily: mono, fontWeight: 600 }}>2</span> nouveaux comptes. ONCF Projets offre le meilleur potentiel (<span style={{ color: '#D4A843', fontFamily: mono, fontWeight: 600 }}>200 m³/mois</span>).
        </span>
      </div>
    </div>
  );
}
