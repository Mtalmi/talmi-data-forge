import { useMemo } from 'react';
import { Beaker, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const T = {
  gold: '#FFD700',
  goldDark: '#B8860B',
  goldDeep: '#8B6914',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
};

interface Formula {
  code: string;
  name: string;
  resistance: string;
  classe: string;
  ratioEC: string;
  slump: string;
  ciment: number;
  sable: number;
  gravette: number;
  eau: number;
  adjuvant: number;
  prixRevient: number;
  prixVenteMin: number;
  margeCible: string;
  usagePct: number;
  color: string;
}

const FORMULAS: Formula[] = [
  { code: 'F-B25', name: 'Béton B25 Standard', resistance: '25 MPa', classe: 'C25/30', ratioEC: '0.502', slump: '18 cm', ciment: 350, sable: 780, gravette: 1050, eau: 176, adjuvant: 2.8, prixRevient: 620, prixVenteMin: 850, margeCible: '37%', usagePct: 45, color: T.gold },
  { code: 'F-B30', name: 'Béton B30 Structurel', resistance: '30 MPa', classe: 'C30/37', ratioEC: '0.465', slump: '16 cm', ciment: 400, sable: 750, gravette: 1080, eau: 186, adjuvant: 3.2, prixRevient: 710, prixVenteMin: 980, margeCible: '38%', usagePct: 35, color: T.goldDark },
  { code: 'F-B20', name: 'Béton B20 Fondation', resistance: '20 MPa', classe: 'C20/25', ratioEC: '0.550', slump: '20 cm', ciment: 300, sable: 820, gravette: 1020, eau: 165, adjuvant: 2.4, prixRevient: 540, prixVenteMin: 750, margeCible: '39%', usagePct: 20, color: T.goldDeep },
];

const NORMES = [
  { label: 'Norme marocaine béton', value: 'NM 10.1.008', check: false },
  { label: 'Norme européenne', value: 'EN 206', check: false },
  { label: 'Laboratoire agréé', value: 'Certifié', check: true },
  { label: 'Dernière calibration', value: '15/02/2026', check: false },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Beaker size={15} strokeWidth={1.5} style={{ color: T.gold, flexShrink: 0 }} />
      <span style={{ color: T.gold, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${T.gold}4D 0%, transparent 80%)` }} />
    </div>
  );
}

function FormulaCard({ f }: { f: Formula }) {
  const props: [string, string][] = [
    ['Résistance', f.resistance],
    ['Classe', f.classe],
    ['Ratio E/C', f.ratioEC],
    ['Slump cible', f.slump],
    ['Ciment', `${f.ciment} kg/m³`],
    ['Sable', `${f.sable} kg/m³`],
    ['Gravette', `${f.gravette} kg/m³`],
    ['Eau', `${f.eau} L/m³`],
    ['Adjuvant', `${f.adjuvant} L/m³`],
    ['Prix de revient', `${f.prixRevient} DH/m³`],
    ['Prix vente min', `${f.prixVenteMin} DH/m³`],
    ['Marge cible', f.margeCible],
  ];

  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-start justify-between" style={{ background: T.cardBg, padding: '16px 24px', borderBottom: `1px solid ${T.cardBorder}` }}>
        <div>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 500, color: '#fff' }}>{f.code}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>{f.name}</p>
        </div>
        <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          Active
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-2" style={{ gap: '12px 32px', padding: '20px 24px' }}>
        {props.map(([label, value]) => (
          <div key={label}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 400, color: '#fff' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
          Utilisé dans {f.usagePct}% des batches ce mois
        </p>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ width: `${f.usagePct}%`, height: '100%', borderRadius: 2, background: T.gold }} />
        </div>
      </div>
    </div>
  );
}

const INGREDIENTS = ['Ciment', 'Sable', 'Gravette', 'Eau', 'Adjuvant'] as const;

function CompositionChart() {
  const data = useMemo(() => INGREDIENTS.map(ing => {
    const key = ing.toLowerCase() as 'ciment' | 'sable' | 'gravette' | 'eau' | 'adjuvant';
    return { name: ing, 'F-B25': FORMULAS[0][key], 'F-B30': FORMULAS[1][key], 'F-B20': FORMULAS[2][key] };
  }), []);

  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20 }}>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }} barCategoryGap="22%">
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</p>
                    {payload.map((p: any) => (
                      <p key={p.dataKey} style={{ color: p.color || '#fff' }}>{p.dataKey}: {p.value}</p>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="F-B25" fill={T.gold} radius={[0, 3, 3, 0]} barSize={10} />
            <Bar dataKey="F-B30" fill={T.goldDark} radius={[0, 3, 3, 0]} barSize={10} />
            <Bar dataKey="F-B20" fill={T.goldDeep} radius={[0, 3, 3, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        {FORMULAS.map(f => (
          <div key={f.code} className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: 2, background: f.color, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{f.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecettesTab() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <SectionHeader label="Formules de Béton" />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', marginTop: -8 }}>Bibliothèque des formulations disponibles</p>
        </div>
        <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.12)', borderRadius: 999, padding: '5px 12px' }}>
          3 formules actives
        </span>
      </div>

      {/* Formula Cards */}
      <div className="grid grid-cols-3 gap-6">
        {FORMULAS.map(f => <FormulaCard key={f.code} f={f} />)}
      </div>

      {/* Composition Chart */}
      <div>
        <SectionHeader label="Composition Comparée" />
        <CompositionChart />
      </div>

      {/* Normes */}
      <div>
        <SectionHeader label="Normes & Certifications" />
        <div className="grid grid-cols-4 gap-4">
          {NORMES.map(n => (
            <div key={n.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{n.label}</p>
              <div className="flex items-center gap-2">
                {n.check && <CheckCircle size={14} style={{ color: '#10B981' }} />}
                <span style={{ fontSize: 13, color: '#fff', fontFamily: n.label.includes('calibration') ? 'JetBrains Mono, monospace' : 'inherit', fontWeight: 400 }}>{n.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
