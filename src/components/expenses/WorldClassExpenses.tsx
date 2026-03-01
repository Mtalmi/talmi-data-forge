import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Sector,
} from 'recharts';
import {
  CreditCard, Banknote, Clock, TrendingDown,
  CheckCircle, XCircle, AlertTriangle, Zap,
  Truck, Wrench, Users, Package, Box,
  TrendingUp, Plus, LayoutGrid,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold:       '#FFD700',
  goldGlow:   'rgba(255,215,0,0.22)',
  goldBorder: 'rgba(255,215,0,0.28)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
  cardBorder: '#1E2D4A',
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  info:       '#3B82F6',
  purple:     '#8B5CF6',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

const CAT_CONFIG: Record<string, { color: string; icon: any }> = {
  'Matières Premières': { color: T.gold, icon: Package },
  "Main d'Oeuvre": { color: T.info, icon: Users },
  'Transport': { color: T.success, icon: Truck },
  'Maintenance': { color: T.purple, icon: Wrench },
  'Énergie': { color: T.warning, icon: Zap },
  'Carburant': { color: T.warning, icon: Zap },
  'Fournitures': { color: T.info, icon: Box },
  'Autres': { color: T.textSec, icon: Box },
};

function getCatConfig(cat: string) {
  return CAT_CONFIG[cat] || { color: T.textSec, icon: Box };
}

// ─────────────────────────────────────────────────────
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function useExpensesLiveData() {
  const [data, setData] = useState({
    totalThisMonth: 0,
    budgetRemaining: 0,
    pendingApproval: 0,
    vsBudgetPct: 0,
    categories: [] as { name: string; amount: number; color: string; pct: number; icon: any }[],
    budgetData: [] as { month: string; depenses: number; budget: number }[],
    catBudget: [] as { name: string; spent: number; budget: number; pct: number; color: string; icon: any }[],
    recentExpenses: [] as { date: string; desc: string; cat: string; amount: number; approver: string; catColor: string; status: string }[],
    pending: [] as { desc: string; cat: string; catColor: string; amount: number; by: string; date: string; urgency: string }[],
    budgetTotal: 0,
    budgetUsedPct: 0,
  });

  const fetch = useCallback(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Fetch depenses
    const { data: depenses } = await supabase
      .from('depenses')
      .select('*')
      .order('date_depense', { ascending: false })
      .limit(500);

    // Fetch expenses_controlled for approvals
    const { data: controlled } = await supabase
      .from('expenses_controlled')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200) as { data: any[] | null };

    const allDepenses = depenses || [];
    const thisMonth = allDepenses.filter(d => d.date_depense >= startOfMonth);

    // Total this month in K
    const totalThisMonthRaw = thisMonth.reduce((s, d) => s + (d.montant || 0), 0);
    const totalThisMonth = Math.round(totalThisMonthRaw / 1000);

    // Estimate budget (use average of last 3 months * 1.1 or fixed 250K if no history)
    const monthTotals: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString().split('T')[0];
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString().split('T')[0];
      const mTotal = allDepenses.filter(d => d.date_depense >= mStart && d.date_depense <= mEnd)
        .reduce((s, d) => s + (d.montant || 0), 0);
      monthTotals.push(mTotal);
    }
    const avgMonthly = monthTotals.reduce((s, t) => s + t, 0) / Math.max(monthTotals.filter(t => t > 0).length, 1);
    const budgetTotal = avgMonthly > 0 ? Math.round((avgMonthly * 1.1) / 1000) : 250;
    const budgetRemaining = Math.max(0, budgetTotal - totalThisMonth);
    const budgetUsedPct = budgetTotal > 0 ? Math.round((totalThisMonth / budgetTotal) * 100) : 0;
    const vsBudgetPct = budgetTotal > 0 ? Math.round(((totalThisMonth - budgetTotal) / budgetTotal) * 100) : 0;

    // Categories breakdown
    const catTotals: Record<string, number> = {};
    thisMonth.forEach(d => {
      const cat = d.categorie || 'Autres';
      catTotals[cat] = (catTotals[cat] || 0) + (d.montant || 0);
    });
    const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const categories = catEntries.map(([name, amount]) => {
      const cfg = getCatConfig(name);
      return {
        name,
        amount: Math.round(amount / 1000),
        color: cfg.color,
        pct: totalThisMonthRaw > 0 ? Math.round((amount / totalThisMonthRaw) * 100) : 0,
        icon: cfg.icon,
      };
    });

    // Budget vs Actual last 6 months
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const budgetDataArr: { month: string; depenses: number; budget: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const mTotal = allDepenses.filter(dep => dep.date_depense >= mStart && dep.date_depense <= mEnd)
        .reduce((s, dep) => s + (dep.montant || 0), 0);
      budgetDataArr.push({
        month: monthNames[d.getMonth()],
        depenses: Math.round(mTotal / 1000),
        budget: budgetTotal,
      });
    }

    // Category budget (proportional allocation)
    const catBudget = categories.map(cat => ({
      name: cat.name,
      spent: cat.amount,
      budget: Math.round(budgetTotal * (cat.pct / 100) * 1.2),
      pct: Math.round(budgetTotal * (cat.pct / 100) * 1.2) > 0
        ? Math.round((cat.amount / (budgetTotal * (cat.pct / 100) * 1.2)) * 100)
        : 0,
      color: cat.color,
      icon: cat.icon,
    }));

    // Recent expenses
    const recent = thisMonth.slice(0, 6);
    const recentExpenses = recent.map(d => {
      const cfg = getCatConfig(d.categorie || 'Autres');
      return {
        date: new Date(d.date_depense).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        desc: d.description || d.categorie || 'Dépense',
        cat: d.categorie || 'Autres',
        amount: d.montant || 0,
        approver: 'Auto',
        catColor: cfg.color,
        status: 'Approuvé',
      };
    });

    // Pending approvals from expenses_controlled
    const pendingControlled = (controlled || []).filter((e: any) => e.approval_status === 'pending');
    const pendingApproval = Math.round(pendingControlled.reduce((s: number, e: any) => s + (e.amount || 0), 0) / 1000);
    const pending = pendingControlled.slice(0, 4).map((e: any) => {
      const cfg = getCatConfig(e.category || 'Autres');
      return {
        desc: e.description || 'Dépense',
        cat: e.category || 'Autres',
        catColor: cfg.color,
        amount: e.amount || 0,
        by: e.created_by_name || 'Employé',
        date: new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        urgency: (e.amount || 0) > 10000 ? 'Urgent' : 'Normal',
      };
    });

    setData({
      totalThisMonth,
      budgetRemaining,
      pendingApproval,
      vsBudgetPct,
      categories,
      budgetData: budgetDataArr,
      catBudget,
      recentExpenses,
      pending,
      budgetTotal,
      budgetUsedPct: Math.min(budgetUsedPct, 100),
    });
  }, []);

  useEffect(() => {
    fetch();
    const ch = supabase.channel('wc-expenses-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depenses' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses_controlled' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  return data;
}

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

function useBarWidth(target: number, delay = 0) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(target), delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return w;
}

// ─────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div className={className}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.997)' : hov ? 'translateY(-4px) scale(1.005)' : 'none',
        boxShadow: hov ? `0 14px 36px rgba(0,0,0,0.32), 0 0 28px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.15)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)', ...style,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 220ms' }} />
      {children}
    </div>
  );
}

function Bdg({ label, color, bg, pulse = false, icon }: { label: string; color: string; bg: string; pulse?: boolean; icon?: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: pulse ? 'tbos-pulse 2s infinite' : 'none', flexShrink: 0,
    }}>
      {icon || <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      {right}
    </div>
  );
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill || T.gold, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-MA')} K DH</strong>
        </p>
      ))}
      {payload.length === 2 && (
        <p style={{ color: T.textSec, fontSize: 11, marginTop: 6, borderTop: `1px solid ${T.cardBorder}`, paddingTop: 6 }}>
          Écart: <strong style={{ color: T.warning }}>{Math.abs(payload[1].value - payload[0].value)}K DH</strong>
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// GAUGE
// ─────────────────────────────────────────────────────
function BudgetGauge({ value = 74 }: { value?: number }) {
  const r = 72; const cx = 110; const cy = 100;
  const startAngle = 210; const sweep = 120;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const bgStart = toRad(startAngle); const bgEnd = toRad(startAngle + sweep);
  const bgPath = `M ${cx + r * Math.cos(bgStart)},${cy + r * Math.sin(bgStart)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(bgEnd)},${cy + r * Math.sin(bgEnd)}`;
  const filled = (Math.min(value, 100) / 100) * sweep;
  const fEnd = toRad(startAngle + filled);
  const fPath = `M ${cx + r * Math.cos(bgStart)},${cy + r * Math.sin(bgStart)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(fEnd)},${cy + r * Math.sin(fEnd)}`;
  const nx = cx + r * Math.cos(toRad(startAngle + filled));
  const ny = cy + r * Math.sin(toRad(startAngle + filled));
  return (
    <svg width={220} height={140} viewBox="0 0 220 140">
      <defs><linearGradient id="expGaugeGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={T.warning} /><stop offset="100%" stopColor={T.gold} /></linearGradient></defs>
      <path d={bgPath} fill="none" stroke="#1E2D4A" strokeWidth={14} strokeLinecap="round" />
      <path d={fPath} fill="none" stroke="url(#expGaugeGrad)" strokeWidth={14} strokeLinecap="round" />
      <circle cx={nx} cy={ny} r={7} fill={T.gold} />
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, fill: T.gold }}>{value}%</text>
      <text x={cx} y={cy + 18} textAnchor="middle" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, fill: T.textDim }}>Utilisation Budget</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive = true, delay = 0 }: {
  label: string; value: number; suffix?: string; color: string;
  icon: any; trend?: string; trendPositive?: boolean; delay?: number;
}) {
  const animated = useAnimatedCounter(Math.abs(value), 1200);
  const visible = useFadeIn(delay);
  const isNegative = value < 0;
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out', height: '100%' }}>
      <Card style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {isNegative ? '-' : ''}{animated.toLocaleString('fr-MA')}
              {suffix && <span style={{ fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>}
            </p>
            {trend && <p style={{ fontSize: 12, fontWeight: 500, marginTop: 6, color: trendPositive ? '#10B981' : '#EF4444' }}>{trendPositive ? '↑' : '↓'} {trend}</p>}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#F59E0B" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// DONUT LEGEND ITEM
// ─────────────────────────────────────────────────────
function DonutLegendItem({ cat, active, onHover }: { cat: { name: string; amount: number; color: string; pct: number }; active: boolean; onHover: () => void }) {
  return (
    <div onMouseEnter={onHover} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
      background: active ? `${cat.color}12` : 'transparent',
      border: `1px solid ${active ? cat.color + '30' : 'transparent'}`, transition: 'all 180ms',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 11, color: active ? T.textPri : T.textSec, fontWeight: active ? 700 : 400 }}>{cat.name}</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.amount}K</span>
      <span style={{ fontSize: 10, color: T.textDim }}>{cat.pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CATEGORY PROGRESS BAR
// ─────────────────────────────────────────────────────
function CatBar({ row, delay = 0 }: { row: { name: string; spent: number; budget: number; pct: number; color: string; icon: any }; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const w = useBarWidth(Math.min(row.pct, 100), delay + 100);
  const barColor = row.pct >= 80 ? T.danger : row.pct >= 60 ? T.warning : T.success;
  const Icon = row.icon;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      padding: '12px 16px', borderRadius: 10,
      background: hov ? `${T.cardBorder}50` : 'transparent',
      border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 380ms ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${row.color}18`, border: `1px solid ${row.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color={row.color} />
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: T.textPri }}>{row.name}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.textSec }}>{row.spent}K / {row.budget}K DH</span>
        <Bdg label={`${Math.min(row.pct, 100)}%`} color={barColor} bg={`${barColor}15`} />
        {row.pct >= 80 ? <Bdg label="Attention" color={T.warning} bg={`${T.warning}15`} pulse /> : <Bdg label="OK" color={T.success} bg={`${T.success}15`} />}
      </div>
      <div style={{ height: 6, borderRadius: 99, background: T.cardBorder, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, borderRadius: 99, background: barColor, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EXPENSE ROW
// ─────────────────────────────────────────────────────
function ExpenseRow({ e, delay = 0 }: { e: { date: string; desc: string; cat: string; amount: number; approver: string; catColor: string; status: string }; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const sc = e.status === 'Approuvé' ? T.success : T.warning;
  const StatusIcon = e.status === 'Approuvé' ? CheckCircle : Clock;
  const approverColor = e.approver === 'Auto' ? T.success : e.approver === '—' ? T.warning : T.info;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10,
      background: hov ? `${T.cardBorder}50` : 'transparent',
      border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
      transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(16px)',
      opacity: visible ? 1 : 0, transition: 'all 380ms ease-out',
      cursor: 'pointer', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 4, borderRadius: 4, background: e.catColor }} />
      <div style={{ minWidth: 55, flexShrink: 0 }}><p style={{ color: T.textDim, fontSize: 11 }}>{e.date}</p></div>
      <div style={{ flex: 1, minWidth: 140 }}><p style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{e.desc}</p></div>
      <div style={{ minWidth: 120, flexShrink: 0 }}><Bdg label={e.cat} color={e.catColor} bg={`${e.catColor}15`} /></div>
      <div style={{ minWidth: 110, flexShrink: 0 }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: T.gold }}>{e.amount.toLocaleString('fr-MA')} DH</p>
      </div>
      <div style={{ minWidth: 90, flexShrink: 0 }}><p style={{ fontSize: 11, color: approverColor, fontWeight: 600 }}>{e.approver}</p></div>
      <div style={{ minWidth: 100, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999,
          background: `${sc}15`, border: `1px solid ${sc}40`, color: sc, fontSize: 10, fontWeight: 700,
          animation: e.status !== 'Approuvé' ? 'tbos-pulse 2.2s infinite' : 'none',
        }}><StatusIcon size={10} />{e.status}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PENDING APPROVAL CARD
// ─────────────────────────────────────────────────────
function ApprovalCard({ p, delay = 0 }: { p: { desc: string; cat: string; catColor: string; amount: number; by: string; date: string; urgency: string }; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hovApp, setHovApp] = useState(false);
  const [hovRej, setHovRej] = useState(false);
  const urgColor = p.urgency === 'Urgent' ? T.danger : T.warning;
  return (
    <div style={{
      background: 'rgba(245,158,11,0.04)', border: `1px solid ${T.warning}50`,
      borderLeft: `4px solid ${T.warning}`, borderRadius: 14, padding: 20,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'all 480ms ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 4 }}>{p.desc}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <Bdg label={p.cat} color={p.catColor} bg={`${p.catColor}15`} />
            <Bdg label={p.urgency} color={urgColor} bg={`${urgColor}15`} pulse={p.urgency === 'Urgent'} />
          </div>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 800, color: T.gold }}>{p.amount.toLocaleString('fr-MA')} DH</p>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: T.textDim }}>Demandé par: <span style={{ color: T.textSec, fontWeight: 600 }}>{p.by}</span></p>
        <p style={{ fontSize: 11, color: T.textDim }}>{p.date}</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onMouseEnter={() => setHovApp(true)} onMouseLeave={() => setHovApp(false)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
          background: hovApp ? '#059669' : T.success, border: 'none', color: '#fff',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 180ms',
          transform: hovApp ? 'scale(1.03)' : 'scale(1)',
        }}><CheckCircle size={13} /> Approuver</button>
        <button onMouseEnter={() => setHovRej(true)} onMouseLeave={() => setHovRej(false)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
          background: hovRej ? `${T.danger}20` : 'transparent',
          border: `1px solid ${T.danger}60`, color: T.danger,
          fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 180ms',
        }}><XCircle size={13} /> Rejeter</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────
export default function WorldClassExpenses() {
  const [activeTab, setActiveTab] = useState('Vue d\'ensemble');
  const [activeDonut, setActiveDonut] = useState<number | null>(null);
  const [hoverNew, setHoverNew] = useState(false);
  const live = useExpensesLiveData();

  const tabs = ["Vue d'ensemble", 'Par Catégorie', 'Approbations'];

  const chartCardStyle = {
    background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)',
    border: `1px solid ${T.cardBorder}`,
    borderRadius: 14, padding: 24,
    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
    transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g><Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} /></g>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: T.navy, fontFamily: 'DM Sans, sans-serif', color: T.textPri, padding: '0 0 60px 0' }}>
      <style>{`@keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }`}</style>

      <PageHeader
        icon={CreditCard}
        title="Dépenses"
        subtitle="Suivi des dépenses et charges — données en temps réel"
        tabs={tabs.map(t => ({ id: t, label: t }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button onMouseEnter={() => setHoverNew(true)} onMouseLeave={() => setHoverNew(false)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px',
            background: hoverNew ? '#FFE033' : T.gold, color: T.navy,
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12,
            cursor: 'pointer', transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
          }}><Plus size={14} /> Nouvelle Dépense</button>
        }
      />

      {/* PAGE BODY */}
      <div style={{ padding: '32px 32px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* KPIs */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <KPICard label="Dépenses ce mois" value={live.totalThisMonth} suffix="K DH" color={T.gold} icon={CreditCard} delay={0} />
            <KPICard label="Budget Restant" value={live.budgetRemaining} suffix="K DH" color={T.success} icon={Banknote} delay={80} />
            <KPICard label="En Attente Approbation" value={live.pendingApproval} suffix="K DH" color={T.warning} icon={Clock} trend={`${live.pending.length} demandes`} trendPositive={false} delay={160} />
            <KPICard label="vs Budget" value={live.vsBudgetPct} suffix="%" color={live.vsBudgetPct <= 0 ? T.success : T.danger} icon={TrendingDown}
              trend={live.vsBudgetPct <= 0 ? 'Sous budget ✓' : 'Dépassement'} trendPositive={live.vsBudgetPct <= 0} delay={240} />
          </div>
        </section>

        {/* DONUT + BAR CHART */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: 20 }}>
            {/* Donut */}
            <div style={chartCardStyle}>
              <SectionHeader icon={LayoutGrid} label="Par Catégorie" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={live.categories} cx={95} cy={95} innerRadius={60} outerRadius={90}
                        dataKey="amount" nameKey="name" startAngle={90} endAngle={-270}
                        isAnimationActive animationDuration={800}
                        activeIndex={activeDonut ?? undefined} activeShape={renderActiveShape}
                        onMouseEnter={(_, i) => setActiveDonut(i)} onMouseLeave={() => setActiveDonut(null)}>
                        {live.categories.map((cat, i) => <Cell key={i} fill={cat.color} stroke="transparent" />)}
                      </Pie>
                      <RechartsTooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '8px 12px' }}>
                            <p style={{ color: d.color, fontWeight: 700, fontSize: 12 }}>{d.name}</p>
                            <p style={{ color: T.textPri, fontSize: 12 }}>{d.amount}K DH · {d.pct}%</p>
                          </div>
                        );
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold, lineHeight: 1 }}>{live.totalThisMonth}K</p>
                    <p style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>DH</p>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {live.categories.map((cat, i) => (
                    <DonutLegendItem key={i} cat={cat} active={activeDonut === i} onHover={() => setActiveDonut(i)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Budget vs Actual */}
            <div style={chartCardStyle}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>Budget vs Réel</p>
                <p style={{ color: T.textDim, fontSize: 11 }}>6 derniers mois</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={live.budgetData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={(v: number) => `${v}K`} />
                  <RechartsTooltip content={<DarkTooltip />} cursor={{ fill: `${T.gold}08` }} />
                  <Bar dataKey="depenses" name="Dépenses" fill={T.gold} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} />
                  <Bar dataKey="budget" name="Budget" fill="#1E2D4A" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} stroke="#94A3B8" strokeWidth={1} strokeDasharray="4 3" />
                </BarChart>
              </ResponsiveContainer>
              {live.vsBudgetPct <= 0 && (
                <div style={{ marginTop: 14, padding: '8px 14px', borderRadius: 8, background: `${T.success}12`, border: `1px solid ${T.success}30`, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={13} color={T.success} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.success }}>Sous budget de {live.budgetRemaining}K DH ce mois</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* GAUGE */}
        <section>
          <div style={{ ...chartCardStyle, display: 'flex', alignItems: 'center', gap: 32, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <div style={{ textAlign: 'center', padding: '16px 28px', borderRadius: 12, background: `${T.cardBorder}60`, border: `1px solid ${T.cardBorder}` }}>
              <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Budget Total</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.textPri }}>{live.budgetTotal}K DH</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <BudgetGauge value={live.budgetUsedPct} />
              <p style={{ color: T.textDim, fontSize: 11, marginTop: 4 }}>Utilisation Budget Mensuel</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '16px 28px', borderRadius: 12, background: `${T.gold}0A`, border: `1px solid ${T.goldBorder}` }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Dépensé</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.gold }}>{live.totalThisMonth}K DH</p>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 28px', borderRadius: 12, background: `${T.success}0A`, border: `1px solid ${T.success}30` }}>
                <p style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Restant</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: T.success }}>{live.budgetRemaining}K DH</p>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY PROGRESS BARS */}
        <section>
          <div style={chartCardStyle}>
            <SectionHeader icon={TrendingDown} label="Dépenses par Catégorie" right={<span style={{ color: T.textDim, fontSize: 11 }}>Dépensé vs Budget</span>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {live.catBudget.map((row, i) => <CatBar key={i} row={row} delay={i * 100} />)}
            </div>
          </div>
        </section>

        {/* RECENT EXPENSES */}
        <section>
          <div style={chartCardStyle}>
            <SectionHeader icon={CreditCard} label="Dépenses Récentes" right={<span style={{ color: T.textDim, fontSize: 11 }}>{live.recentExpenses.length} opérations</span>} />
            <div style={{ display: 'flex', gap: 14, padding: '4px 16px 8px', borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 8 }}>
              {['Date', 'Description', 'Catégorie', 'Montant', 'Approuvé par', 'Statut'].map((h, i) => (
                <p key={i} style={{
                  color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  flex: i === 1 ? 1 : undefined,
                  minWidth: i === 0 ? 55 : i === 2 ? 120 : i === 3 ? 110 : i === 4 ? 90 : i === 5 ? 100 : undefined,
                }}>{h}</p>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {live.recentExpenses.length > 0 ? live.recentExpenses.map((e, i) => (
                <ExpenseRow key={i} e={e} delay={i * 60} />
              )) : (
                <p style={{ color: T.textDim, fontSize: 13, padding: '20px 16px', textAlign: 'center' }}>Aucune dépense ce mois</p>
              )}
            </div>
          </div>
        </section>

        {/* PENDING APPROVALS */}
        {live.pending.length > 0 && (
          <section>
            <SectionHeader icon={Clock} label="En Attente d'Approbation" right={
              <Bdg label={`${live.pending.length} demandes`} color={T.warning} bg={`${T.warning}15`} pulse />
            } />
            <div style={{ display: 'grid', gridTemplateColumns: live.pending.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
              {live.pending.map((p, i) => <ApprovalCard key={i} p={p} delay={i * 100} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
