import { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Trophy, Target, CheckCircle2, XCircle } from 'lucide-react';
import { BonCommande, Devis } from '@/hooks/useSalesWorkflow';
import { useCountUp } from '@/hooks/useCountUp';

interface SalesPerformanceChartsProps {
  bcList: BonCommande[];
  devisList: Devis[];
}

/* ───── Palette ───── */
const GOLD = '#FDB913';
const GOLD_COLORS = [GOLD, 'rgba(253,185,19,0.55)', 'rgba(253,185,19,0.30)'];
// Status colors are mapped dynamically in the component using statusColorMap
const SUCCESS = '#10B981';
const DANGER = '#FF6B6B';
const WARNING = '#FB923C';

/* ───── Custom Tooltip ───── */
const GoldTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      borderRadius: 10, padding: '8px 14px',
      background: 'rgba(13,18,32,0.95)',
      border: '1px solid rgba(253,185,19,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {label && <p style={{ fontWeight: 700, color: 'white', fontSize: 11, marginBottom: 4 }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color || entry.fill }} />
          <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 10 }}>{entry.name}:</span>
          <span style={{ fontWeight: 700, marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: entry.color || entry.fill }}>
            {typeof entry.value === 'number'
              ? entry.value >= 1000 ? `${(entry.value / 1000).toFixed(1)}K DH` : `${entry.value}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ───── Animated stat chip ───── */
function StatChip({ value, label, color }: { value: number; label: string; color: string }) {
  const animated = useCountUp(Math.round(value), 1200);
  return (
    <div style={{
      textAlign: 'center', padding: 12, borderRadius: 12,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <p style={{ fontSize: '1.25rem', fontWeight: 200, fontFamily: 'JetBrains Mono, monospace', color }}>
        {animated >= 1000 ? `${(animated / 1000).toFixed(1)}K` : animated}
      </p>
      <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginTop: 4 }}>{label}</p>
    </div>
  );
}

/* ───── Section Header ───── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(253,185,19,0.25), rgba(253,185,19,0.05), transparent)' }} />
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.25em',
        color: 'rgba(253,185,19,0.45)', textTransform: 'uppercase' as const,
        whiteSpace: 'nowrap' as const,
      }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(253,185,19,0.05), rgba(253,185,19,0.25))' }} />
    </div>
  );
}

export function SalesPerformanceCharts({ bcList, devisList }: SalesPerformanceChartsProps) {
  const { t } = useI18n();
  const vt = t.pages.ventes;
  /* ── Sales by product (formule) ── */
  const productData = useMemo(() => {
    const map = new Map<string, number>();
    bcList.forEach(bc => {
      const key = bc.formule?.designation || bc.formule_id || 'Autre';
      map.set(key, (map.get(key) || 0) + bc.total_ht);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bcList]);

  const totalProductRevenue = productData.reduce((s, d) => s + d.value, 0);

  /* ── Win / Loss analysis ── */
  const winLossData = useMemo(() => {
    const won = devisList.filter(d => d.statut === 'converti' || d.statut === 'accepte').length;
    const lost = devisList.filter(d => d.statut === 'refuse' || d.statut === 'expire').length;
    const pending = devisList.filter(d => d.statut === 'en_attente').length;
    return { won, lost, pending, total: won + lost + pending };
  }, [devisList]);

  const winRate = winLossData.total > 0
    ? Math.round((winLossData.won / (winLossData.won + winLossData.lost || 1)) * 100)
    : 0;

  const winLossPie = [
    { name: vt.inProgress, value: winLossData.pending, color: GOLD },
    { name: vt.won, value: winLossData.won, color: SUCCESS },
    { name: vt.lost, value: winLossData.lost, color: DANGER },
  ].filter(d => d.value > 0);

  /* ── Revenue by BC status (bar chart) ── */
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
    [vt.validated]: GOLD,
    [vt.statusLivre]: 'rgba(253,185,19,0.55)',
    [vt.other]: 'rgba(148,163,184,0.20)',
    Production: 'rgba(253,185,19,0.40)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Revenue by Product ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 24,
        overflow: 'hidden',
      }}>
        <SectionHeader title={vt.revenueByFormula} />
        {productData.length > 0 ? (
          <>
            <div style={{ height: 176 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={900}
                  >
                    {productData.map((_, i) => (
                      <Cell key={i} fill={GOLD_COLORS[i % GOLD_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                    fill="white" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 200, fontSize: 14 }}>
                    {totalProductRevenue >= 1000
                      ? `${(totalProductRevenue / 1000).toFixed(0)}K`
                      : totalProductRevenue.toFixed(0)}
                  </text>
                  <text x="50%" y="50%" dy={14} textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(148,163,184,0.4)" style={{ fontSize: 8 }}>
                    DH Total
                  </text>
                  <Tooltip content={<GoldTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {productData.map((d, i) => {
                const pct = totalProductRevenue > 0 ? Math.round((d.value / totalProductRevenue) * 100) : 0;
                const color = GOLD_COLORS[i % GOLD_COLORS.length];
                return (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ height: 176, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Trophy style={{ width: 32, height: 32, color: 'rgba(148,163,184,0.2)' }} />
            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)' }}>Aucune commande enregistrée</p>
          </div>
        )}
      </div>

      {/* ── Revenue by Status (bar) ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 24,
        overflow: 'hidden',
      }}>
        <SectionHeader title={vt.pipelineByStatus} />
        {statusRevenueData.length > 0 ? (
          <div style={{ height: 208 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusRevenueData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.5)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.5)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<GoldTooltip />} />
                <Bar dataKey="value" name="CA" radius={[6, 6, 0, 0]} animationDuration={900}>
                  {statusRevenueData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || 'rgba(148,163,184,0.20)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 208, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Target style={{ width: 32, height: 32, color: 'rgba(148,163,184,0.2)' }} />
            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)' }}>Aucune donnée disponible</p>
          </div>
        )}
        {statusRevenueData.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {statusRevenueData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[d.name] }} />
                <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>{d.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', color: STATUS_COLORS[d.name] }}>
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value} DH
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Win / Loss Analysis ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 24,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionHeader title={vt.quoteAnalysis} />
          {winRate > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              padding: '3px 10px', borderRadius: 6,
              background: winRate >= 50 ? 'rgba(16,185,129,0.08)' : 'rgba(255,107,107,0.08)',
              color: winRate >= 50 ? SUCCESS : DANGER,
            }}>
              {winRate}% taux
            </span>
          )}
        </div>

        {/* Summary chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <StatChip value={winLossData.won} label={vt.won} color={SUCCESS} />
          <StatChip value={winLossData.lost} label={vt.lost} color={DANGER} />
          <StatChip value={winLossData.pending} label={vt.inProgress} color={WARNING} />
        </div>

        {/* Pie chart */}
        {winLossPie.length > 0 ? (
          <div style={{ height: 144 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={winLossPie} cx="50%" cy="50%" outerRadius={54} paddingAngle={4} dataKey="value" animationBegin={0} animationDuration={900}>
                  {winLossPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<GoldTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 144, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle2 style={{ width: 32, height: 32, color: 'rgba(148,163,184,0.2)' }} />
            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)' }}>Aucun devis enregistré</p>
          </div>
        )}

        {/* Win rate bar */}
        <div style={{ marginTop: 16 }}>
          {(winLossData.won === 0 && winLossData.lost === 0) ? (
            <div style={{
              height: 8, borderRadius: 4,
              background: 'rgba(148,163,184,0.15)',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                fontSize: 10, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap',
              }}>{vt.noCompletedDeals}</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(148,163,184,0.5)' }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color: SUCCESS }} /> {vt.won}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(148,163,184,0.5)' }}>
                  <XCircle style={{ width: 12, height: 12, color: DANGER }} /> {vt.lost}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ width: `${winRate}%`, height: '100%', background: SUCCESS, borderRadius: '4px 0 0 4px', transition: 'width 1s ease' }} />
                <div style={{ width: `${100 - winRate}%`, height: '100%', background: DANGER, borderRadius: '0 4px 4px 0', transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: SUCCESS }}>{winRate}%</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: DANGER }}>{100 - winRate}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
