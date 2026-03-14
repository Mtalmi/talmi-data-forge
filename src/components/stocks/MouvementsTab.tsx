import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

const T = {
  amber: '#FFD700',
  amberGrid: 'rgba(245, 158, 11, 0.08)',
  amberSubtle: 'rgba(255, 215, 0, 0.04)',
  cardBg: 'linear-gradient(to bottom right, #1a1f2e, #141824)',
  cardBorder: 'rgba(245, 158, 11, 0.15)',
  success: '#10B981',
  danger: '#EF4444',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textDim: '#64748B',
};

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

// ── Animated counter ──
function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

// ── Card wrapper ──
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.cardBorder}`,
      borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden', ...style,
    }}>{children}</div>
  );
}

// ── Section Header ──
function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.amber} />
      <span style={{ color: '#FFD700', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.4), transparent 80%)' }} />
      {right}
    </div>
  );
}

// ── KPI Card ──
function MouvKPI({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color: string }) {
  const animated = useCountUp(value);
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.04)', borderTop: '2px solid #D4A843',
      borderRadius: 9, border: '1px solid rgba(245,158,11,0.15)',
      borderTopWidth: 2, borderTopColor: '#D4A843', padding: '20px 16px',
    }}>
      <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 32, fontWeight: 200, color, lineHeight: 1 }}>
        {animated.toLocaleString('fr-FR')}
        {suffix && <span style={{ fontSize: 14, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: MONO }}>{suffix}</span>}
      </p>
    </div>
  );
}

function MouvKPIText({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.04)', borderTop: '2px solid #D4A843',
      borderRadius: 9, border: '1px solid rgba(245,158,11,0.15)',
      borderTopWidth: 2, borderTopColor: '#D4A843', padding: '20px 16px',
    }}>
      <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 32, fontWeight: 200, color, lineHeight: 1 }}>{text}</p>
    </div>
  );
}

// ── Crosshair Tooltip ──
function CrosshairTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(22, 32, 54, 0.95)', backdropFilter: 'blur(8px)',
      border: `1px solid ${T.cardBorder}`, borderRadius: 10,
      padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: T.amber, fontWeight: 700, marginBottom: 6, fontFamily: MONO, fontSize: 12 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.dataKey === 'entrees' ? '#22C55E' : '#EF4444', fontSize: 12, marginBottom: 2, fontFamily: MONO }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-FR')}{suffix}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Value Tooltip ──
function ValueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(22, 32, 54, 0.95)', backdropFilter: 'blur(8px)',
      border: `1px solid ${T.cardBorder}`, borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: T.amber, fontWeight: 700, marginBottom: 4, fontFamily: MONO }}>{label}</p>
      <p style={{ color: payload[0]?.fill, fontSize: 12, fontFamily: MONO }}>{payload[0]?.value} K DH</p>
    </div>
  );
}

// ── Last Update Timer ──
function LastUpdateTimer() {
  const [mounted] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  const mins = Math.floor((now - mounted) / 60000);
  const label = mins < 1 ? "à l'instant" : `il y a ${mins}m`;
  return <span style={{ fontSize: 11, color: T.textDim, fontFamily: MONO }}>dernière mise à jour: {label}</span>;
}

// ── Movement Row ──
function MovementRow({ m, index, isFirst = false }: { m: { date: string; type: string; material: string; qty: string; ref: string; resp: string }; index: number; isFirst?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  const [showNew, setShowNew] = useState(isFirst);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 60); return () => clearTimeout(t); }, [index]);
  useEffect(() => { if (isFirst) { const t = setTimeout(() => setShowNew(false), 10000); return () => clearTimeout(t); } }, [isFirst]);

  const isEntree = m.type === 'Entrée';
  const isAjustement = m.type === 'Ajustement';
  const leftBorder = isEntree ? '#22c55e' : isAjustement ? '#D4A843' : '#ef4444';
  const typeColor = isEntree ? T.success : isAjustement ? T.amber : T.danger;
  const TypeIcon = isEntree ? ArrowUp : ArrowDown;
  const qtyColor = isEntree ? '#22c55e' : '#ef4444';
  const isOdd = index % 2 === 1;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 350ms ease-out',
        background: hov ? 'rgba(212,168,67,0.05)' : isOdd ? 'rgba(212,168,67,0.03)' : isFirst ? 'rgba(212,168,67,0.04)' : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        borderLeft: `2px solid ${leftBorder}`,
        borderRadius: 8, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        position: 'relative',
      }}
    >
      {showNew && (
        <span style={{
          position: 'absolute', top: 6, right: 10,
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: '#D4A843', background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)',
          padding: '2px 6px', borderRadius: 4,
          animation: 'nouveau-fade 10s forwards',
        }}>
          NOUVEAU
        </span>
      )}

      {/* Type badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 4,
        background: isEntree ? 'rgba(34, 197, 94, 0.15)' : isAjustement ? 'rgba(212,168,67,0.15)' : 'rgba(239, 68, 68, 0.15)',
        color: typeColor, fontSize: 11, fontWeight: 700, fontFamily: MONO, flexShrink: 0,
      }}>
        <TypeIcon size={10} />
        {m.type}
      </span>

      <span style={{ color: T.textDim, fontSize: 11, flexShrink: 0, minWidth: 130 }}>{m.date}</span>
      <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri, flex: 1 }}>{m.material}</span>
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 200, color: qtyColor, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {isEntree ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {m.qty}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{m.ref || '—'}</span>
      <span style={{ color: T.textSec, fontSize: 11, flexShrink: 0, minWidth: 110 }}>{m.resp}</span>
    </div>
  );
}

// ── MAIN COMPONENT ──
interface MouvementsTabProps {
  MOVEMENT_DATA: { day: string; entrees: number; sorties: number }[];
  MOVEMENTS: { date: string; type: string; material: string; qty: string; ref: string; resp: string }[];
  VALUE_BREAKDOWN: { cat: string; value: number; color: string }[];
}

export function MouvementsTab({ MOVEMENT_DATA, MOVEMENTS, VALUE_BREAKDOWN }: MouvementsTabProps) {
  // Compute KPI values
  const todayMovements = MOVEMENTS.length || 12;
  const totalEntrees = MOVEMENT_DATA.reduce((s, d) => s + d.entrees, 0) || 8400;
  const totalSorties = MOVEMENT_DATA.reduce((s, d) => s + d.sorties, 0) || 6200;

  // Chart summary stats
  const allEntrees = MOVEMENT_DATA.map(d => d.entrees);
  const allSorties = MOVEMENT_DATA.map(d => d.sorties);
  const pic = Math.max(...allEntrees, ...allSorties, 1);
  const creux = Math.min(...allEntrees.filter(v => v > 0), ...allSorties.filter(v => v > 0), pic);
  const moy = Math.round((allEntrees.reduce((a, b) => a + b, 0) + allSorties.reduce((a, b) => a + b, 0)) / (MOVEMENT_DATA.length || 1) / 2);

  // Value breakdown total
  const totalValue = VALUE_BREAKDOWN.reduce((s, v) => s + v.value, 0);
  const sortedBreakdown = [...VALUE_BREAKDOWN].sort((a, b) => b.value - a.value);

  return (
    <>
      {/* ── SECTION 1: KPI STRIP ── */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <MouvKPI label="MOUVEMENTS AUJOURD'HUI" value={todayMovements} color="#FFFFFF" />
          <MouvKPI label="ENTRÉES" value={totalEntrees} suffix="kg" color="#22C55E" />
          <MouvKPI label="SORTIES" value={totalSorties} suffix="kg" color="#EF4444" />
          <MouvKPIText label="VALEUR STOCK" text="2.4 M DH" color="#D4A843" />
        </div>
      </section>

      {/* ── SECTION 2: CHART ── */}
      <section>
        <SectionHeader icon={ArrowUpDown} label="Mouvements de Stock" />
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ color: T.textPri, fontWeight: 700, fontSize: 14 }}>Mouvements de Stock</p>
              <p style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>7 derniers jours</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSec, fontSize: 11 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(135deg, #C49A3C, #D4A843)', display: 'inline-block' }} />Entrées
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSec, fontSize: 11 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444', display: 'inline-block' }} />Sorties
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MOVEMENT_DATA} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A843" />
                  <stop offset="100%" stopColor="#C49A3C" />
                </linearGradient>
                <filter id="goldGlow2"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(212,168,67,0.3)" /></filter>
                <filter id="redGlow2"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(239,68,68,0.3)" /></filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.amberGrid} vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
              <RechartsTooltip content={<CrosshairTooltip suffix=" kg" />} cursor={{ fill: 'rgba(212,168,67,0.06)', stroke: '#D4A843', strokeDasharray: '3 3', strokeOpacity: 0.3 }} />
              <Bar dataKey="entrees" name="Entrées" fill="url(#goldBarGrad)" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} style={{ filter: 'url(#goldGlow2)' }} />
              <Bar dataKey="sorties" name="Sorties" fill="#EF4444" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} animationBegin={150} style={{ filter: 'url(#redGlow2)' }} />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(212,168,67,0.1)' }}>
            {[
              { label: 'PIC', value: `${pic.toLocaleString('fr-FR')} kg`, color: '#D4A843' },
              { label: 'CREUX', value: `${creux.toLocaleString('fr-FR')} kg`, color: '#9CA3AF' },
              { label: 'MOY.', value: `${moy.toLocaleString('fr-FR')} kg`, color: '#D4A843' },
              { label: 'VS SEM. DERN.', value: '+12%', color: '#22C55E' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.1em' }}>{s.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: s.color, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── SECTION 3: RECENT MOVEMENTS TABLE ── */}
      <section>
        <SectionHeader icon={ArrowUpDown} label="Derniers Mouvements" right={<LastUpdateTimer />} />
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', gap: 14, padding: '0 14px 10px', borderBottom: `1px solid ${T.cardBorder}` }}>
              {['Type', 'Date', 'Matériau', 'Quantité', 'Référence', 'Responsable'].map(h => (
                <span key={h} style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{h}</span>
              ))}
            </div>
            {MOVEMENTS.map((m, i) => <MovementRow key={i} m={m} index={i} isFirst={i === 0} />)}
          </div>
        </Card>
      </section>

      {/* ── SECTION 4: VALUE BREAKDOWN ── */}
      <section>
        <SectionHeader
          icon={TrendingUp}
          label="Valeur par Catégorie"
          right={<span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: '#D4A843' }}>Total: {totalValue > 0 ? `${(totalValue / 1000).toFixed(1)} M DH` : '2.4 M DH'}</span>}
        />
        <Card>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={sortedBreakdown}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="goldHorizGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C49A3C" />
                  <stop offset="100%" stopColor="#D4A843" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.amberGrid} horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10, fontFamily: MONO }}
                tickFormatter={(v) => `${v}K`} />
              <YAxis dataKey="cat" type="category" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12, fontFamily: MONO }} width={70} />
              <RechartsTooltip content={<ValueTooltip />} cursor={{ fill: T.amberSubtle }} />
              <Bar dataKey="value" name="Valeur" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1000} minPointSize={40}
                fill="url(#goldHorizGrad)"
                label={({ x, y, width, height, value }: any) => {
                  const total = totalValue || 2400;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <g>
                      {width > 40 && (
                        <text x={x + width / 2} y={y + height / 2} dominantBaseline="central" textAnchor="middle" fill="#fff" fontSize={11} fontFamily={MONO}>
                          {pct}%
                        </text>
                      )}
                      <text x={x + width + 6} y={y + height / 2} dominantBaseline="central" fill="#fff" fontSize={11} fontFamily={MONO}>
                        {Number(value).toLocaleString('fr-FR')} DH
                      </text>
                    </g>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* ── SECTION 5: AI INSIGHT ── */}
      <section>
        <Card style={{ borderTop: '2px solid #D4A843' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 600 }}>
              ✦ INSIGHT IA — FLUX MATIÈRES
            </span>
            <span style={{
              fontFamily: MONO, fontSize: 10, color: '#D4A843',
              background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)',
              padding: '4px 10px', borderRadius: 999,
            }}>
              Généré par IA · Claude Opus
            </span>
          </div>
          <p style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF', lineHeight: 1.8 }}>
            Consommation de ciment en hausse de <span style={{ color: '#EF4444', fontWeight: 600 }}>+18%</span> cette semaine vs moyenne mensuelle.
            Les entrées de sable sont concentrées en début de semaine (lundi-mardi <span style={{ color: '#D4A843', fontWeight: 600 }}>72%</span>).
            Recommandation : échelonner les livraisons pour optimiser le stockage et réduire les temps d'attente camion.
          </p>
        </Card>
      </section>
    </>
  );
}
