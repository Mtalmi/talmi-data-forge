import { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Trophy, Target, CheckCircle2, XCircle } from 'lucide-react';
import { BonCommande, Devis } from '@/hooks/useSalesWorkflow';
import { useCountUp } from '@/hooks/useCountUp';

/* ───── Palette ───── */
const PRODUCT_COLORS = ['#D4A843', '#A07820', '#5A3F10'];
const SUCCESS = '#22C55E';
const DANGER = '#EF4444';

/* ───── Custom Tooltip ───── */
const GoldTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      borderRadius: 10, padding: '8px 14px',
      background: 'rgba(13,18,32,0.95)',
      border: '1px solid rgba(212,168,67,0.25)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
    }}>
      {label && <p style={{ fontWeight: 600, color: 'white', fontSize: 11, marginBottom: 4, fontFamily: 'ui-monospace, monospace' }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color || entry.fill }} />
          <span style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#D4A843' }}>
            {typeof entry.value === 'number'
              ? entry.value >= 1000 ? `${(entry.value / 1000).toFixed(1)}K DH` : `${entry.value.toLocaleString('fr-FR')} DH`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ───── Animated stat chip ───── */
function StatChip({ value, label, color, subtext }: { value: number; label: string; color: string; subtext?: string }) {
  const animated = useCountUp(Math.round(value), 1200);
  return (
    <div style={{
      textAlign: 'center', padding: 12, borderRadius: 12,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      transition: 'background 200ms',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.03)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
    >
      <p style={{ fontSize: 36, fontWeight: 100, fontFamily: 'ui-monospace, monospace', color }}>
        {animated >= 1000 ? `${(animated / 1000).toFixed(1)}K` : animated}
      </p>
      <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>{label}</p>
      {value === 0 && !subtext && (
        <p style={{ fontSize: 14, color, opacity: 0.4, marginTop: 2 }}>—</p>
      )}
      {subtext && (
        <p style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>{subtext}</p>
      )}
    </div>
  );
}

/* ───── Card wrapper ───── */
export const chartCardStyle: React.CSSProperties = {
  background: 'rgba(15,23,41,0.6)',
  border: '1px solid rgba(212,168,67,0.12)',
  borderTop: '2px solid #D4A843',
  borderRadius: 12,
  padding: 24,
  overflow: 'hidden',
  transition: 'background 200ms',
};

export function hoverHandlers() {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'rgba(212,168,67,0.02)'; },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'rgba(15,23,41,0.6)'; },
  };
}

/* ───── Section Header ───── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
    </div>
  );
}

/* ═════ CA PAR FORMULE ═════ */
export function CaParFormuleCard({ bcList }: { bcList: BonCommande[] }) {
  const { t } = useI18n();
  const vt = t.pages.ventes;
  const formulaNames = (t as any).formulaNames || {};

  const productData = useMemo(() => {
    const map = new Map<string, number>();
    bcList.forEach(bc => {
      const rawName = bc.formule?.designation || bc.formule_id || 'Autre';
      const key = formulaNames[rawName] || rawName;
      map.set(key, (map.get(key) || 0) + bc.total_ht);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bcList, formulaNames]);

  const totalProductRevenue = productData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={chartCardStyle} {...hoverHandlers()}>
      <SectionHeader title={vt.revenueByFormula} />
      {productData.length > 0 ? (
        <>
          <div style={{ height: 176 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={900}>
                  {productData.map((_, i) => (
                    <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} stroke="transparent" cursor="pointer" />
                  ))}
                </Pie>
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#D4A843" style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 100, fontSize: 36 }}>
                  {totalProductRevenue >= 1000 ? `${(totalProductRevenue / 1000).toFixed(0)}K` : totalProductRevenue.toFixed(0)}
                </text>
                <text x="50%" y="45%" dy={22} textAnchor="middle" dominantBaseline="middle" fill="#9CA3AF" style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                  DH Total
                </text>
                <Tooltip content={<GoldTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {productData.map((d, i) => {
              const pct = totalProductRevenue > 0 ? Math.round((d.value / totalProductRevenue) * 100) : 0;
              return (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRODUCT_COLORS[i % PRODUCT_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#9CA3AF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: '#D4A843' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ height: 176, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Trophy style={{ width: 32, height: 32, color: 'rgba(148,163,184,0.2)' }} />
          <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }}>Aucune commande enregistrée</p>
        </div>
      )}
    </div>
  );
}

/* ═════ PIPELINE PAR STATUT ═════ */
export function PipelineParStatutCard({ bcList }: { bcList: BonCommande[] }) {
  const { t } = useI18n();
  const vt = t.pages.ventes;

  const statusRevenueData = useMemo(() => {
    const map: Record<string, number> = {};
    bcList.forEach(bc => {
      const label =
        bc.statut === 'pret_production' ? vt.validated
        : bc.statut === 'en_production' ? 'Production'
        : bc.statut === 'termine' || bc.statut === 'livre' ? vt.statusLivre
        : vt.other;
      map[label] = (map[label] || 0) + bc.total_ht;
    });
    const order = [vt.validated, 'Production', vt.statusLivre, vt.other];
    return order.filter(k => map[k]).map(k => ({ name: k, value: map[k] }));
  }, [bcList, vt]);

  const STATUS_COLORS: Record<string, string> = {
    [vt.validated]: '#D4A843',
    [vt.statusLivre]: '#22C55E',
    [vt.other]: '#9CA3AF',
    Production: '#A07820',
  };

  return (
    <div style={chartCardStyle} {...hoverHandlers()}>
      <SectionHeader title={vt.pipelineByStatus} />
      {statusRevenueData.length > 0 ? (
        <div style={{ height: 208 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusRevenueData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<GoldTooltip />} cursor={{ fill: 'rgba(212,168,67,0.06)' }} />
              <Bar dataKey="value" name="CA" radius={[6, 6, 0, 0]} animationDuration={900}>
                {statusRevenueData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#9CA3AF'} cursor="pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: 208, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Target style={{ width: 32, height: 32, color: 'rgba(148,163,184,0.2)' }} />
          <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }}>Aucune donnée disponible</p>
        </div>
      )}
      {statusRevenueData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          {statusRevenueData.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[d.name] }} />
              <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }}>{d.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', color: '#D4A843' }}>
                {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value.toLocaleString('fr-FR')} DH
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═════ ANALYSE DEVIS ═════ */
export function AnalyseDevisCard({ devisList }: { devisList: Devis[] }) {
  const { t } = useI18n();
  const vt = t.pages.ventes;

  const winLossData = useMemo(() => {
    const won = devisList.filter(d => d.statut === 'converti' || d.statut === 'accepte').length;
    const lost = devisList.filter(d => d.statut === 'refuse' || d.statut === 'expire').length;
    const pendingDevis = devisList.filter(d => d.statut === 'en_attente');
    const pending = pendingDevis.length;
    const pendingValueHT = pendingDevis.reduce((sum, d) => sum + (d.total_ht || 0), 0);
    return { won, lost, pending, total: won + lost + pending, pendingValueHT };
  }, [devisList]);

  const winRate = winLossData.total > 0
    ? Math.round((winLossData.won / (winLossData.won + winLossData.lost || 1)) * 100)
    : 0;

  const winLossPie = [
    { name: vt.inProgress, value: winLossData.pending, color: '#D4A843' },
    { name: vt.won, value: winLossData.won, color: SUCCESS },
    { name: vt.lost, value: winLossData.lost, color: DANGER },
  ].filter(d => d.value > 0);

  return (
    <div style={chartCardStyle} {...hoverHandlers()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title={vt.quoteAnalysis} />
        {winRate > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, fontFamily: 'ui-monospace, monospace',
            padding: '3px 10px', borderRadius: 6,
            background: winRate >= 50 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            color: winRate >= 50 ? SUCCESS : DANGER,
          }}>
            {winRate}% taux
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <StatChip value={winLossData.won} label={vt.won} color={SUCCESS} subtext={winLossData.won === 0 ? 'Aucun clôturé' : undefined} />
        <StatChip value={winLossData.lost} label={vt.lost} color={winLossData.lost === 0 ? 'rgba(239,68,68,0.4)' : DANGER} subtext={winLossData.lost === 0 ? 'Aucun perdu' : undefined} />
        <StatChip value={winLossData.pending} label={vt.inProgress} color="#D4A843" subtext={winLossData.pendingValueHT > 0 ? `${winLossData.pendingValueHT >= 1000 ? `${(winLossData.pendingValueHT / 1000).toFixed(0)}K` : winLossData.pendingValueHT} DH` : undefined} />
      </div>

      {winLossData.pending > 0 && (
        <div style={{
          padding: '6px 10px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.1)',
          fontSize: 11, color: '#9CA3AF', fontFamily: 'ui-monospace, monospace',
        }}>
          {winLossData.pending} deals actifs · Valeur totale: <span style={{ color: '#D4A843' }}>{winLossData.pendingValueHT >= 1000 ? `${(winLossData.pendingValueHT / 1000).toFixed(0)}K` : winLossData.pendingValueHT} DH</span> · Décision attendue: <span style={{ color: '#D4A843' }}>14j</span> moy.
        </div>
      )}

      {winLossPie.length > 0 ? (
        <div style={{ width: 120, height: 120, margin: '0 auto', overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={winLossPie} cx="50%" cy="50%" outerRadius={48} innerRadius={24} paddingAngle={4} dataKey="value" animationBegin={0} animationDuration={900}>
                {winLossPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<GoldTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ width: 140, height: 140, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="#D4A843" strokeWidth="8" opacity={0.2} />
          </svg>
          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', fontFamily: 'ui-monospace, monospace' }}>Aucun deal finalisé</p>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {(winLossData.won === 0 && winLossData.lost === 0) ? (
          <div style={{
            height: 8, borderRadius: 4,
            background: 'linear-gradient(90deg, #C49A3C, #D4A843)',
            opacity: 0.25, position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              fontSize: 10, fontStyle: 'italic', color: '#9CA3AF', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace',
            }}>{vt.noCompletedDeals}</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }}>
                <CheckCircle2 style={{ width: 12, height: 12, color: SUCCESS }} /> {vt.won}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }}>
                <XCircle style={{ width: 12, height: 12, color: DANGER }} /> {vt.lost}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: `${winRate}%`, height: '100%', background: `linear-gradient(90deg, #C49A3C, ${SUCCESS})`, borderRadius: '4px 0 0 4px', transition: 'width 1s ease' }} />
              <div style={{ width: `${100 - winRate}%`, height: '100%', background: DANGER, borderRadius: '0 4px 4px 0', transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: SUCCESS }}>{winRate}%</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: DANGER }}>{100 - winRate}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═════ Legacy wrapper (kept for backward compat but no longer used in analytics tab) ═════ */
export function SalesPerformanceCharts({ bcList, devisList }: { bcList: BonCommande[]; devisList: Devis[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
      <CaParFormuleCard bcList={bcList} />
      <PipelineParStatutCard bcList={bcList} />
      <AnalyseDevisCard devisList={devisList} />
    </div>
  );
}
