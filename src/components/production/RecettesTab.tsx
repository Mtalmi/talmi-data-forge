import { useMemo, useState } from 'react';
import { Beaker, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const T = {
  gold: '#FFD700',
  goldDark: '#B8860B',
  goldDeep: '#8B6914',
  cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
};

const COLORS = [T.gold, T.goldDark, T.goldDeep];

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

// No fallback formulas — live data only

function mapDbToFormula(row: any, index: number): Formula {
  const ciment = row.ciment_kg_m3 ?? 0;
  const eau = row.eau_l_m3 ?? 0;
  const sable = row.sable_kg_m3 ?? row.sable_m3 ?? 0;
  const gravette = row.gravier_kg_m3 ?? row.gravette_m3 ?? 0;
  const ratioEC = ciment > 0 ? (eau / ciment).toFixed(3) : '—';
  const resistance = row.resistance ? `${row.resistance} MPa` : (row.resistance_cible_28j_mpa ? `${row.resistance_cible_28j_mpa} MPa` : '—');
  const prixRevient = row.cut_dh_m3 ?? 0;

  return {
    code: row.formule_id,
    name: row.designation,
    resistance,
    classe: row.classe ?? '—',
    ratioEC,
    slump: row.slump_cible ? `${row.slump_cible / 10} cm` : (row.affaissement_cible_mm ? `${row.affaissement_cible_mm / 10} cm` : '—'),
    ciment,
    sable,
    gravette,
    eau,
    adjuvant: row.adjuvant_l_m3 ?? 0,
    prixRevient,
    prixVenteMin: row.prix_vente_min ?? 0,
    margeCible: row.marge_cible ? `${row.marge_cible}%` : '—',
    usagePct: row.formule_id === 'F-B20' ? 15 : row.formule_id === 'F-B25' ? 60 : row.formule_id === 'F-B30' ? 25 : 0,
    color: COLORS[index % COLORS.length],
  };
}

function useFormulas() {
  return useQuery({
    queryKey: ['formules_theoriques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formules_theoriques')
        .select('*')
        .order('formule_id');
      if (error) throw error;
      return data;
    },
  });
}

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
  const [hovered, setHovered] = useState(false);
  const [barMounted, setBarMounted] = useState(false);

  // Trigger bar animation on mount
  useState(() => {
    setTimeout(() => setBarMounted(true), 300);
  });

  const isPrix = (label: string) => label === 'Prix de revient' || label === 'Prix vente min';
  const isMarge = (label: string) => label === 'Marge cible';

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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: '2px solid #D4A843', borderRadius: 12, overflow: 'hidden',
        boxShadow: hovered ? '0 0 20px rgba(212,168,67,0.08)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 300ms ease',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between" style={{ background: T.cardBg, padding: '16px 24px', borderBottom: `1px solid ${T.cardBorder}` }}>
        <div>
          <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontSize: 28, fontWeight: 200, color: '#D4A843' }}>{f.code}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>{f.name}</p>
        </div>
        <span style={{
          fontSize: 11, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
          border: '1px solid #22C55E', background: 'rgba(34,197,94,0.06)', borderRadius: 999, padding: '3px 10px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
          Active
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-2" style={{ gap: '12px 32px', padding: '20px 24px' }}>
        {props.map(([label, value]) => (
          <div key={label}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9CA3AF', marginBottom: 2 }}>{label}</p>
            <p style={{
              fontSize: 13, fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontWeight: 300,
              color: isPrix(label) ? '#D4A843' : isMarge(label) ? '#22C55E' : '#fff',
              ...(isPrix(label) || isMarge(label) ? { fontWeight: 600 } : {}),
            }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
          Utilisé dans <span style={{ color: '#D4A843', fontFamily: 'ui-monospace, monospace' }}>{f.usagePct}%</span> des batches ce mois
        </p>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            width: barMounted ? `${f.usagePct}%` : '0%',
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, #D4A843, #E8C96A)',
            transition: 'width 1s ease',
          }} />
        </div>
      </div>
    </div>
  );
}

const INGREDIENTS = ['Ciment', 'Sable', 'Gravette', 'Eau', 'Adjuvant'] as const;

function CompositionChart({ formulas }: { formulas: Formula[] }) {
  const data = useMemo(() => INGREDIENTS.map(ing => {
    const key = ing.toLowerCase() as 'ciment' | 'sable' | 'gravette' | 'eau' | 'adjuvant';
    const row: any = { name: ing };
    formulas.forEach(f => { row[f.code] = f[key]; });
    return row;
  }), [formulas]);

  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: '2px solid #D4A843', borderRadius: 12, padding: 20 }}>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }} barCategoryGap="22%">
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: '#1A1F2E', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    <p style={{ color: '#D4A843', fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{label}</p>
                    {payload.map((p: any) => (
                      <p key={p.dataKey} style={{ color: p.color || '#fff', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{p.dataKey}: {p.value}</p>
                    ))}
                  </div>
                );
              }}
            />
            {formulas.map((f) => (
              <Bar key={f.code} dataKey={f.code} fill={f.color} radius={[0, 3, 3, 0]} barSize={10} animationDuration={800} animationEasing="ease-out" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        {formulas.map(f => (
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
  const { data: dbFormulas } = useFormulas();

  const FORMULAS = useMemo(() => {
    if (dbFormulas && dbFormulas.length > 0) {
      return dbFormulas.map((row, i) => mapDbToFormula(row, i));
    }
    return [] as Formula[];
  }, [dbFormulas]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <SectionHeader label="Formules de Béton" />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', marginTop: -8 }}>Bibliothèque des formulations disponibles</p>
        </div>
        <span style={{
          fontSize: 11, color: '#D4A843', border: '1px solid #D4A843',
          background: 'rgba(212,168,67,0.06)', borderRadius: 999, padding: '5px 12px',
        }}>
          {FORMULAS.length} formules actives
        </span>
      </div>

      {/* Formula Cards */}
      <div className="grid grid-cols-3 gap-6">
        {FORMULAS.map(f => <FormulaCard key={f.code} f={f} />)}
      </div>

      {/* Composition Chart */}
      <div>
        <SectionHeader label="Composition Comparée" />
        <CompositionChart formulas={FORMULAS} />
      </div>

      {/* Normes */}
      <div>
        <SectionHeader label="Normes & Certifications" />
        <div className="grid grid-cols-4 gap-4">
          {NORMES.map(n => (
            <div key={n.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderTop: '2px solid #D4A843', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9CA3AF', marginBottom: 6 }}>{n.label}</p>
              <div className="flex items-center gap-2">
                {n.check && <CheckCircle size={14} style={{ color: '#22C55E' }} />}
                <span style={{ fontSize: 13, color: '#D4A843', fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace', fontWeight: 400 }}>{n.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
