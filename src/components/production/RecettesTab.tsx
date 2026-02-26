import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Beaker, Search, Download, Plus, Eye, Pencil, Trash2,
  FlaskConical, Droplets, Mountain, Waves, TestTube,
} from 'lucide-react';

const T = {
  gold:       '#D4A843',
  cardBg:     'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

interface Formule {
  formule_id: string;
  designation: string | null;
  ciment_kg_m3: number;
  sable_kg_m3: number | null;
  gravier_kg_m3: number | null;
  eau_l_m3: number | null;
  adjuvant_l_m3: number | null;
  cut_dh_m3: number | null;
  created_at: string;
}

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Icon size={16} strokeWidth={1.5} style={{ color: T.gold, flexShrink: 0 }} />
      <span style={{
        color: T.gold, fontWeight: 600, fontSize: 13,
        textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${T.gold}4D 0%, transparent 80%)` }} />
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Icon size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.08)' }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500 }}>{message}</p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{sub}</p>
    </div>
  );
}

export default function RecettesTab() {
  const [formules, setFormules] = useState<Formule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('formules_theoriques')
        .select('formule_id, designation, ciment_kg_m3, sable_kg_m3, gravier_kg_m3, eau_l_m3, adjuvant_l_m3, cut_dh_m3, created_at')
        .order('designation');
      setFormules((data || []) as Formule[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return formules;
    const q = searchQuery.toLowerCase();
    return formules.filter(f =>
      (f.formule_id || '').toLowerCase().includes(q) ||
      (f.designation || '').toLowerCase().includes(q)
    );
  }, [formules, searchQuery]);

  // KPIs
  const totalFormules = formules.length;
  const avgCiment = formules.length > 0
    ? Math.round(formules.reduce((s, f) => s + (f.ciment_kg_m3 || 0), 0) / formules.length)
    : 0;
  const avgCUT = formules.length > 0
    ? (formules.reduce((s, f) => s + (f.cut_dh_m3 || 0), 0) / formules.length).toFixed(0)
    : '0';
  const withAdjuvant = formules.filter(f => (f.adjuvant_l_m3 || 0) > 0).length;

  const kpis = [
    { label: 'Recettes', value: totalFormules, suffix: '', icon: Beaker },
    { label: 'Ciment Moyen', value: avgCiment, suffix: 'kg/m³', icon: Mountain },
    { label: 'CUT Moyen', value: avgCUT, suffix: 'DH/m³', icon: FlaskConical },
    { label: 'Avec Adjuvant', value: withAdjuvant, suffix: '', icon: TestTube },
  ];

  const columns = [
    { key: 'id', label: 'CODE', align: 'left' as const },
    { key: 'designation', label: 'DÉSIGNATION', align: 'left' as const },
    { key: 'ciment', label: 'CIMENT (KG/M³)', align: 'right' as const },
    { key: 'sable', label: 'SABLE (KG/M³)', align: 'right' as const },
    { key: 'gravier', label: 'GRAVIER (KG/M³)', align: 'right' as const },
    { key: 'eau', label: 'EAU (L/M³)', align: 'right' as const },
    { key: 'adjuvant', label: 'ADJUVANT (L/M³)', align: 'right' as const },
    { key: 'cut', label: 'CUT (DH/M³)', align: 'right' as const },
    { key: 'actions', label: 'ACTIONS', align: 'right' as const },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 300, color: '#fff', marginBottom: 4 }}>Gestion des Recettes</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Formules théoriques du béton — dosages et coûts unitaires</p>
        </div>
        <div className="flex items-center gap-2">
          <button style={{
            padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
            background: T.gold, color: '#0B1120', fontWeight: 700, fontSize: 13, border: 'none',
          }}>
            <div className="flex items-center gap-2"><Plus size={14} /> Nouvelle Recette</div>
          </button>
          <button style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: T.textSec, fontWeight: 600, fontSize: 13,
            border: `1px solid ${T.cardBorder}`,
          }}>
            <div className="flex items-center gap-2"><Download size={14} /> Exporter</div>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <SectionHeader icon={FlaskConical} label="Aperçu des Recettes" />
      <div className="grid grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '14px 16px' }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{k.label}</span>
              <k.icon size={14} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {k.value}
              {k.suffix && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>{k.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            placeholder="Rechercher par code ou désignation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.cardBorder}`,
              color: '#fff', fontSize: 13, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <SectionHeader icon={Beaker} label="Catalogue des Formules" />
      <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* Header */}
        <div className="grid" style={{
          gridTemplateColumns: '100px 1fr 100px 100px 100px 80px 100px 100px 80px',
          padding: '12px 16px', borderBottom: `1px solid ${T.cardBorder}`,
        }}>
          {columns.map(col => (
            <span key={col.key} style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)', fontWeight: 500, textAlign: col.align,
            }}>{col.label}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 48 }}>
            <EmptyState icon={Beaker} message="Chargement..." sub="Récupération des formules" />
          </div>
        ) : filtered.length > 0 ? (
          <div>
            {filtered.map(f => (
              <div
                key={f.formule_id}
                className="grid"
                style={{
                  gridTemplateColumns: '100px 1fr 100px 100px 100px 80px 100px 100px 80px',
                  padding: '12px 16px',
                  borderBottom: `1px solid ${T.cardBorder}`,
                  cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: T.gold }}>
                  {f.formule_id}
                </span>
                <span style={{ fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.designation || '—'}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#fff', textAlign: 'right' }}>
                  {f.ciment_kg_m3?.toLocaleString('fr-FR') || '—'}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec, textAlign: 'right' }}>
                  {f.sable_kg_m3?.toLocaleString('fr-FR') || '—'}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec, textAlign: 'right' }}>
                  {f.gravier_kg_m3?.toLocaleString('fr-FR') || '—'}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec, textAlign: 'right' }}>
                  {f.eau_l_m3?.toLocaleString('fr-FR') || '—'}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec, textAlign: 'right' }}>
                  {f.adjuvant_l_m3?.toLocaleString('fr-FR') || '—'}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, textAlign: 'right',
                  color: (f.cut_dh_m3 || 0) > 0 ? T.gold : T.textDim,
                }}>
                  {f.cut_dh_m3 ? f.cut_dh_m3.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                </span>
                <div className="flex items-center justify-end gap-1">
                  <button style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: `1px solid ${T.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={12} style={{ color: T.textSec }} />
                  </button>
                  <button style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: `1px solid ${T.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pencil size={12} style={{ color: T.textSec }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Beaker} message="Aucune recette trouvée" sub="Ajoutez une formule théorique pour commencer" />
        )}
      </div>

      {/* Bottom summary */}
      <div style={{
        background: T.cardBg, border: `1px solid ${T.cardBorder}`,
        borderRadius: 10, padding: '10px 20px',
      }}>
        <div className="flex items-center gap-4" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          <span><span style={{ color: '#fff', fontWeight: 600 }}>{totalFormules}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> recettes</span></span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Ciment moyen: <span style={{ color: '#fff', fontWeight: 600 }}>{avgCiment} kg/m³</span></span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>CUT moyen: <span style={{ color: T.gold, fontWeight: 600 }}>{avgCUT} DH/m³</span></span>
        </div>
      </div>
    </div>
  );
}
