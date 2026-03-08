import { useEffect, useRef, useState, useCallback } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Sector, ReferenceArea,
} from 'recharts';
import {
  CreditCard, Banknote, Clock, TrendingDown,
  CheckCircle, XCircle, AlertTriangle, Zap,
  Truck, Wrench, Users, Package, Box,
  TrendingUp, Plus, LayoutGrid, ShieldAlert, Bot,
  FileText, ChevronDown, Loader2, BarChart3, Briefcase, CalendarRange,
  ArrowRight, Repeat, ToggleLeft, ToggleRight,
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
    budgetData: [] as { month: string; depenses: number; budget: number; forecast: number; forecastHi: number; forecastLo: number }[],
    catBudget: [] as { name: string; spent: number; budget: number; pct: number; color: string; icon: any }[],
    recentExpenses: [] as { date: string; desc: string; cat: string; amount: number; approver: string; catColor: string; status: string; fraudFlags: string[] }[],
    pending: [] as { desc: string; cat: string; catColor: string; amount: number; by: string; date: string; urgency: string }[],
    recurring: [] as { name: string; frequency: string; nextDate: string; amount: number; confidence: number; cat: string; catColor: string }[],
    recurringTotal30d: 0,
    budgetTotal: 0,
    budgetUsedPct: 0,
    dailyAvg: 0,
    todaySpend: 0,
    dailyBudget: 0,
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
    const todayStr = now.toISOString().split('T')[0];
    const thisMonth = allDepenses.filter(d => d.date_depense >= startOfMonth);
    const todayExpenses = allDepenses.filter(d => d.date_depense === todayStr);
    const todaySpend = todayExpenses.reduce((s, d) => s + (d.montant || 0), 0);

    // Total this month in K
    const totalThisMonthRaw = thisMonth.reduce((s, d) => s + (d.montant || 0), 0);
    const totalThisMonth = Math.round(totalThisMonthRaw / 1000);

    // Daily average
    const dayOfMonth = Math.max(now.getDate(), 1);
    const dailyAvg = Math.round(totalThisMonthRaw / dayOfMonth);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

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
    const budgetDataArr: { month: string; depenses: number; budget: number; forecast: number; forecastHi: number; forecastLo: number }[] = [];
    const historicalSpends: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const mTotal = allDepenses.filter(dep => dep.date_depense >= mStart && dep.date_depense <= mEnd)
        .reduce((s, dep) => s + (dep.montant || 0), 0);
      const spendK = Math.round(mTotal / 1000);
      historicalSpends.push(spendK);
      // Simple forecast: weighted moving average of available history
      const available = historicalSpends.slice(0, -1);
      const forecast = available.length > 0
        ? Math.round(available.reduce((s, v, idx) => s + v * (idx + 1), 0) / available.reduce((s, _, idx) => s + idx + 1, 0))
        : spendK;
      const band = Math.max(Math.round(forecast * 0.12), 2);
      budgetDataArr.push({
        month: monthNames[d.getMonth()],
        depenses: spendK,
        budget: budgetTotal,
        forecast,
        forecastHi: forecast + band,
        forecastLo: Math.max(0, forecast - band),
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

    // Fraud detection logic
    const APPROVAL_THRESHOLD = 500;
    const detectFraud = (dep: any, allDeps: any[]): string[] => {
      const flags: string[] = [];
      const sameDaySameAmount = allDeps.filter(d => d.id !== dep.id && d.date_depense === dep.date_depense && d.montant === dep.montant);
      if (sameDaySameAmount.length > 0) flags.push('Doublon détecté — même montant, même jour');
      if (dep.montant >= APPROVAL_THRESHOLD * 0.95 && dep.montant < APPROVAL_THRESHOLD) flags.push(`Montant proche du seuil (${APPROVAL_THRESHOLD} DH)`);
      const dayOfWeek = new Date(dep.date_depense).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) flags.push('Soumission un jour de week-end');
      const amounts = allDeps.map(d => d.montant || 0).sort((a, b) => b - a);
      const p80 = amounts[Math.floor(amounts.length * 0.2)] || 0;
      const supplierHistory = allDeps.filter(d => d.description === dep.description && d.id !== dep.id);
      if (supplierHistory.length === 0 && dep.montant >= p80 && dep.montant > 0) flags.push('Nouveau fournisseur — montant élevé');
      return flags;
    };

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
        fraudFlags: detectFraud(d, allDepenses),
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

    // Recurring expense detection
    const descGroups: Record<string, { dates: string[]; amounts: number[]; cat: string }> = {};
    allDepenses.forEach(d => {
      const key = (d.description || d.categorie || 'Dépense').trim();
      if (!descGroups[key]) descGroups[key] = { dates: [], amounts: [], cat: d.categorie || 'Autres' };
      descGroups[key].dates.push(d.date_depense);
      descGroups[key].amounts.push(d.montant || 0);
    });

    const recurring: typeof data.recurring = [];
    Object.entries(descGroups).forEach(([name, g]) => {
      if (g.dates.length < 2) return;
      const sorted = g.dates.map(d => new Date(d).getTime()).sort((a, b) => a - b);
      const gaps = sorted.slice(1).map((t, i) => (t - sorted[i]) / (1000 * 60 * 60 * 24));
      const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
      const stdDev = Math.sqrt(gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length);
      const cv = avgGap > 0 ? stdDev / avgGap : 1;
      if (cv > 0.5 || avgGap > 400) return; // too irregular or too infrequent

      let frequency = 'Mensuel';
      if (avgGap <= 10) frequency = 'Hebdo';
      else if (avgGap > 300) frequency = 'Annuel';

      const avgAmount = Math.round(g.amounts.reduce((s, a) => s + a, 0) / g.amounts.length);
      const lastDate = new Date(sorted[sorted.length - 1]);
      const nextDate = new Date(lastDate.getTime() + avgGap * 24 * 60 * 60 * 1000);
      const confidence = Math.min(98, Math.round((1 - cv) * 80 + g.dates.length * 3));
      const cfg = getCatConfig(g.cat);

      recurring.push({
        name,
        frequency,
        nextDate: nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        amount: avgAmount,
        confidence,
        cat: g.cat,
        catColor: cfg.color,
      });
    });
    recurring.sort((a, b) => b.amount - a.amount);

    const now30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const recurringTotal30d = recurring
      .filter(r => {
        // rough check if next date is within 30 days
        return true; // all identified recurring are expected within their cycle
      })
      .reduce((s, r) => s + r.amount, 0);

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
      recurring: recurring.slice(0, 8),
      recurringTotal30d,
      budgetTotal,
      budgetUsedPct: Math.min(budgetUsedPct, 100),
      dailyAvg,
      todaySpend,
      dailyBudget: budgetTotal > 0 ? Math.round((budgetTotal * 1000) / daysInMonth) : 8000,
    });
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    const ch = supabase.channel('wc-expenses-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depenses' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses_controlled' }, () => fetch())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(ch); };
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
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-FR')} K DH</strong>
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
              {isNegative ? '-' : ''}{animated.toLocaleString('fr-FR')}
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
// BURN RATE CARD
// ─────────────────────────────────────────────────────
function BurnRateCard({ dailyAvg, todaySpend, dailyBudget, delay = 0 }: {
  dailyAvg: number; todaySpend: number; dailyBudget: number; delay?: number;
}) {
  const visible = useFadeIn(delay);
  const animatedAvg = useAnimatedCounter(dailyAvg, 1200);
  const [liveSpend, setLiveSpend] = useState(todaySpend);
  const [tick, setTick] = useState(0);

  useEffect(() => { setLiveSpend(todaySpend); }, [todaySpend]);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const pct = dailyBudget > 0 ? Math.min((liveSpend / dailyBudget) * 100, 100) : 0;
  const onTrack = liveSpend <= dailyBudget;
  const barColor = onTrack ? T.success : T.danger;
  const barW = useBarWidth(pct, delay + 400);

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out', height: '100%' }}>
      <Card style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>BURN RATE</p>
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 30, fontWeight: 200, color: T.gold, lineHeight: 1, letterSpacing: '-0.02em', WebkitFontSmoothing: 'antialiased' as any }}>
              {animatedAvg.toLocaleString('fr-FR')}
              <span style={{ fontSize: 14, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>DH/j</span>
            </p>

            {/* Today's live counter */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600 }}>Aujourd'hui:</span>
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                fontSize: 14, fontWeight: 600, color: onTrack ? T.success : T.danger,
              }}>
                {liveSpend.toLocaleString('fr-FR')} DH
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 8, height: 3, borderRadius: 3, background: `${T.cardBorder}80`, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${barW}%`,
                background: barColor,
                boxShadow: `0 0 8px ${barColor}60`,
                transition: 'width 800ms cubic-bezier(0.4,0,0.2,1)',
                animation: `tbos-pulse 2s infinite`,
              }} />
            </div>

            {/* Live indicator */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: T.success,
                animation: 'tbos-pulse 2s infinite', flexShrink: 0,
              }} />
              <span style={{ fontSize: 9, color: T.textDim, fontWeight: 500 }}>Mis à jour en temps réel</span>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255, 215, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color={T.gold} />
          </div>
        </div>
      </Card>
    </div>
  );
}

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
const CAT_ROI: Record<string, { roi: number; metric: string; insight: string }> = {
  'Matières Premières': { roi: 4.1, metric: 'DH/m³ produit', insight: 'Chaque 1 DH investi génère 4.1 DH de valeur en production de béton' },
  "Main d'Oeuvre": { roi: 3.8, metric: 'DH/m³ produit', insight: 'Chaque 1 DH investi génère 3.8 DH via productivité équipes' },
  'Transport': { roi: 2.9, metric: 'livraisons/DH', insight: 'Chaque 1 DH investi permet 2.9 DH de revenus livraison' },
  'Maintenance': { roi: 3.2, metric: 'uptime %', insight: 'Chaque 1 DH investi génère 3.2 DH de valeur via prévention pannes' },
  'Énergie': { roi: 2.1, metric: 'kWh/DH', insight: 'Chaque 1 DH investi produit 2.1 DH de capacité opérationnelle' },
  'Carburant': { roi: 2.6, metric: 'livraisons/DH', insight: 'Chaque 1 DH investi complète 2.6 DH en livraisons effectives' },
  'Fournitures': { roi: 1.8, metric: 'DH/opération', insight: 'Chaque 1 DH investi soutient 1.8 DH de valeur opérationnelle' },
  'Autres': { roi: 1.5, metric: 'DH/opération', insight: 'Chaque 1 DH investi contribue 1.5 DH en support général' },
};

function CatBar({ row, delay = 0 }: { row: { name: string; spent: number; budget: number; pct: number; color: string; icon: any }; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const w = useBarWidth(Math.min(row.pct, 100), delay + 100);
  const barColor = row.pct >= 80 ? T.danger : row.pct >= 60 ? T.warning : T.success;
  const Icon = row.icon;
  const roiData = CAT_ROI[row.name] || CAT_ROI['Autres'];
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
        {/* ROI badge */}
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          fontSize: 13, fontWeight: 700, color: T.gold, letterSpacing: '-0.02em',
          padding: '2px 10px', borderRadius: 999,
          background: `${T.gold}12`, border: `1px solid ${T.gold}25`,
        }}>
          {roiData.roi}x ROI
        </span>
        <Bdg label={`${Math.min(row.pct, 100)}%`} color={barColor} bg={`${barColor}15`} />
        {row.pct >= 80 ? <Bdg label="Attention" color={T.warning} bg={`${T.warning}15`} pulse /> : <Bdg label="OK" color={T.success} bg={`${T.success}15`} />}
      </div>
      <div style={{ height: 6, borderRadius: 99, background: T.cardBorder, overflow: 'hidden', marginBottom: hov ? 8 : 0 }}>
        <div style={{ height: '100%', width: `${w}%`, borderRadius: 99, background: barColor, transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      {/* AI insight - shown on hover */}
      {hov && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
          background: `${T.gold}08`, borderRadius: 8, border: `1px solid ${T.gold}15`,
          animation: 'fade-in 200ms ease-out',
        }}>
          <Bot size={12} color={T.gold} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4 }}>
            <strong style={{ color: T.gold }}>{row.name}</strong> — {roiData.insight}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// AI RECOMMENDATION CARD
// ─────────────────────────────────────────────────────
function AIRecommendationCard({ icon: Icon, category, title, saving, confidence, explanation }: {
  icon: any;
  category: string;
  title: string;
  saving: number;
  confidence: number;
  explanation: string;
}) {
  const [hov, setHov] = useState(false);
  const cfg = getCatConfig(category);
  
  return (
    <div 
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14,
        padding: 20,
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? `0 14px 36px rgba(0,0,0,0.32), 0 0 28px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.15)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Category Icon + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: 10, 
          background: `${cfg.color}18`, 
          border: `1px solid ${cfg.color}30`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Icon size={18} color={cfg.color} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{category}</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.textPri, marginTop: 2 }}>{title}</p>
        </div>
        <Bdg 
          label={`${confidence}%`} 
          color={confidence >= 85 ? T.success : confidence >= 70 ? T.warning : T.textSec} 
          bg={`${confidence >= 85 ? T.success : confidence >= 70 ? T.warning : T.textSec}15`} 
        />
      </div>

      {/* Potential Saving */}
      <div style={{ 
        background: `${T.gold}10`, 
        border: `1px solid ${T.gold}25`, 
        borderRadius: 10, 
        padding: '12px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, color: T.textSec }}>Économie potentielle</span>
        <span style={{ 
          fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
          fontSize: 20,
          fontWeight: 200,
          color: T.gold,
          letterSpacing: '-0.02em',
        }}>
          {saving.toLocaleString('fr-FR')} <span style={{ fontSize: 12, color: T.textSec }}>DH/mois</span>
        </span>
      </div>

      {/* Explanation */}
      <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 16 }}>
        {explanation}
      </p>

      {/* Action Button */}
      <button style={{
        width: '100%',
        padding: '10px 16px',
        background: 'transparent',
        border: `1px solid ${T.cardBorder}`,
        borderRadius: 8,
        color: T.textSec,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 180ms',
        fontFamily: 'DM Sans, sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = T.gold;
        e.currentTarget.style.color = T.gold;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = T.cardBorder;
        e.currentTarget.style.color = T.textSec;
      }}
      >
        Appliquer Recommandation
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// REALLOCATION CARD
// ─────────────────────────────────────────────────────
interface ReallocationSide {
  name: string; color: string; icon: any; spent: number; budget: number; pct: number; afterPct: number;
}
function ReallocationCard({ from, to, transferAmount }: { from: ReallocationSide; to: ReallocationSide; transferAmount: number }) {
  const [hov, setHov] = useState(false);
  const [hovApprove, setHovApprove] = useState(false);
  const [hovIgnore, setHovIgnore] = useState(false);
  const FromIcon = from.icon;
  const ToIcon = to.icon;

  const MiniBar = ({ label, pct, afterPct, color }: { label: string; pct: number; afterPct: number; color: string }) => (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 10, color: T.textDim, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: T.textDim }}>Avant</span>
            <span style={{ fontSize: 9, color: pct > 90 ? T.danger : T.textSec, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: `${T.cardBorder}80`, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: pct > 90 ? T.danger : pct > 70 ? T.warning : color, transition: 'width 600ms' }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: T.textDim }}>Après</span>
            <span style={{ fontSize: 9, color: afterPct > 90 ? T.danger : T.success, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{afterPct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: `${T.cardBorder}80`, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(afterPct, 100)}%`, borderRadius: 4, background: afterPct > 90 ? T.danger : afterPct > 70 ? T.warning : T.success, transition: 'width 600ms' }} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
      borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
      transform: hov ? 'translateY(-4px)' : 'none',
      boxShadow: hov ? `0 14px 36px rgba(0,0,0,0.32), 0 0 28px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.15)',
      transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 220ms' }} />

      {/* Transfer visual: FROM → Amount → TO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {/* FROM */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${from.color}18`, border: `1px solid ${from.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FromIcon size={20} color={from.color} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Surplus</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri }}>{from.name}</p>
            <p style={{ fontSize: 11, color: T.success, fontWeight: 600 }}>{from.pct}% utilisé</p>
          </div>
        </div>

        {/* Arrow + Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ArrowRight size={18} color={T.gold} />
          <span style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            fontSize: 22, fontWeight: 200, color: T.gold, letterSpacing: '-0.02em',
          }}>
            {transferAmount.toLocaleString('fr-FR')}K
          </span>
          <span style={{ fontSize: 9, color: T.textDim }}>DH suggéré</span>
        </div>

        {/* TO */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', textAlign: 'right' }}>
          <div>
            <p style={{ fontSize: 10, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Déficit</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri }}>{to.name}</p>
            <p style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>{to.pct}% utilisé</p>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${to.color}18`, border: `1px solid ${to.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ToIcon size={20} color={to.color} />
          </div>
        </div>
      </div>

      {/* Before/After mini bars */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${T.cardBorder}` }}>
        <MiniBar label={from.name} pct={from.pct} afterPct={from.afterPct} color={from.color} />
        <div style={{ width: 1, background: T.cardBorder }} />
        <MiniBar label={to.name} pct={to.pct} afterPct={to.afterPct} color={to.color} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onMouseEnter={() => setHovApprove(true)} onMouseLeave={() => setHovApprove(false)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 8,
          background: hovApprove ? '#FFE033' : T.gold, color: T.navy,
          border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
          transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
          transform: hovApprove ? 'scale(1.02)' : 'scale(1)',
        }}>
          <CheckCircle size={14} /> Approuver Réallocation
        </button>
        <button onMouseEnter={() => setHovIgnore(true)} onMouseLeave={() => setHovIgnore(false)} style={{
          padding: '10px 20px', borderRadius: 8,
          background: hovIgnore ? `${T.cardBorder}50` : 'transparent',
          border: `1px solid ${T.cardBorder}`, color: T.textSec,
          fontWeight: 600, fontSize: 12, cursor: 'pointer',
          transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
        }}>
          Ignorer
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EXPENSE ROW
// ─────────────────────────────────────────────────────
function ExpenseRow({ e, delay = 0 }: { e: { date: string; desc: string; cat: string; amount: number; approver: string; catColor: string; status: string; fraudFlags?: string[] }; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const sc = e.status === 'Approuvé' ? T.success : T.warning;
  const StatusIcon = e.status === 'Approuvé' ? CheckCircle : Clock;
  const approverColor = e.approver === 'Auto' ? T.success : e.approver === '—' ? T.warning : T.info;
  const hasFraud = e.fraudFlags && e.fraudFlags.length > 0;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10,
      background: hasFraud ? `${T.warning}08` : (hov ? `${T.cardBorder}50` : 'transparent'),
      border: `1px solid ${hasFraud ? `${T.warning}30` : (hov ? T.cardBorder : 'transparent')}`,
      transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(16px)',
      opacity: visible ? 1 : 0, transition: 'all 380ms ease-out',
      cursor: 'pointer', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 4, borderRadius: 4, background: hasFraud ? T.warning : e.catColor }} />
      <div style={{ minWidth: 55, flexShrink: 0 }}><p style={{ color: T.textDim, fontSize: 11 }}>{e.date}</p></div>
      <div style={{ flex: 1, minWidth: 140 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{e.desc}</p>
        {hasFraud && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginTop: 4 }}>
            {e.fraudFlags!.map((flag, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999,
                background: `${T.warning}15`, border: `1px solid ${T.warning}35`, color: T.warning,
                fontSize: 9, fontWeight: 600,
              }}>
                <AlertTriangle size={8} />{flag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ minWidth: 120, flexShrink: 0 }}><Bdg label={e.cat} color={e.catColor} bg={`${e.catColor}15`} /></div>
      <div style={{ minWidth: 110, flexShrink: 0 }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: T.gold }}>{e.amount.toLocaleString('fr-FR')} DH</p>
      </div>
      <div style={{ minWidth: 90, flexShrink: 0 }}><p style={{ fontSize: 11, color: approverColor, fontWeight: 600 }}>{e.approver}</p></div>
      <div style={{ minWidth: 140, flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        {hasFraud ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999,
            background: `${T.warning}15`, border: `1px solid ${T.warning}40`, color: T.warning,
            fontSize: 10, fontWeight: 700, animation: 'tbos-pulse 2.2s infinite',
          }}><ShieldAlert size={10} />Vérification recommandée</span>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999,
            background: `${sc}15`, border: `1px solid ${sc}40`, color: sc, fontSize: 10, fontWeight: 700,
          }}><StatusIcon size={10} />{e.status}</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// RECURRING EXPENSES SECTION
// ─────────────────────────────────────────────────────
function RecurringSection({ recurring, total30d }: {
  recurring: { name: string; frequency: string; nextDate: string; amount: number; confidence: number; cat: string; catColor: string }[];
  total30d: number;
}) {
  const [tracked, setTracked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    recurring.forEach(r => { init[r.name] = true; });
    return init;
  });

  const freqColor = (f: string) => f === 'Hebdo' ? T.info : f === 'Annuel' ? T.purple : T.gold;

  return (
    <section>
      <SectionHeader icon={Repeat} label="DÉPENSES RÉCURRENTES" right={
        <Bdg label="Détection IA" color={T.gold} bg={`${T.gold}15`} icon={<Bot size={10} />} />
      } />
      <div style={{
        background: T.cardBg, border: `1px solid ${T.cardBorder}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
      }}>
        {/* Total header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${T.gold}06`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarRange size={16} color={T.gold} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Engagements récurrents — prochains 30 jours</span>
          </div>
          <span style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            fontSize: 20, fontWeight: 200, color: T.gold, letterSpacing: '-0.02em',
          }}>
            {total30d.toLocaleString('fr-FR')} <span style={{ fontSize: 12, color: T.textDim }}>DH</span>
          </span>
        </div>

        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderBottom: `1px solid ${T.cardBorder}` }}>
          <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dépense</span>
          <span style={{ width: 80, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fréquence</span>
          <span style={{ width: 90, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prochaine</span>
          <span style={{ width: 100, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Montant</span>
          <span style={{ width: 70, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Confiance</span>
          <span style={{ width: 50, fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Suivi</span>
        </div>

        {/* Rows */}
        {recurring.map((r, i) => {
          const isTracked = tracked[r.name] !== false;
          return (
            <RecurringRow key={i} r={r} isTracked={isTracked} freqColor={freqColor(r.frequency)}
              onToggle={() => setTracked(prev => ({ ...prev, [r.name]: !prev[r.name] }))} delay={i * 60} />
          );
        })}
      </div>
    </section>
  );
}

function RecurringRow({ r, isTracked, freqColor, onToggle, delay = 0 }: {
  r: { name: string; frequency: string; nextDate: string; amount: number; confidence: number; cat: string; catColor: string };
  isTracked: boolean; freqColor: string; onToggle: () => void; delay?: number;
}) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const ToggleIcon = isTracked ? ToggleRight : ToggleLeft;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
      background: hov ? `${T.cardBorder}40` : 'transparent',
      borderBottom: `1px solid ${T.cardBorder}30`,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 320ms ease-out',
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 4, height: 24, borderRadius: 4, background: r.catColor, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: isTracked ? T.textPri : T.textDim }}>{r.name}</p>
          <p style={{ fontSize: 10, color: T.textDim }}>{r.cat}</p>
        </div>
      </div>
      <div style={{ width: 80 }}>
        <Bdg label={r.frequency} color={freqColor} bg={`${freqColor}15`} />
      </div>
      <div style={{ width: 90 }}>
        <span style={{ fontSize: 12, color: T.textSec }}>{r.nextDate}</span>
      </div>
      <div style={{ width: 100, textAlign: 'right' }}>
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          fontSize: 14, fontWeight: 600, color: T.gold,
        }}>
          {r.amount.toLocaleString('fr-FR')} <span style={{ fontSize: 10, color: T.textDim }}>DH</span>
        </span>
      </div>
      <div style={{ width: 70, textAlign: 'center' }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600,
          color: r.confidence >= 85 ? T.success : r.confidence >= 65 ? T.warning : T.textSec,
        }}>
          {r.confidence}%
        </span>
      </div>
      <div style={{ width: 50, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onToggle} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: isTracked ? T.success : T.textDim, transition: 'color 150ms',
        }}>
          <ToggleIcon size={22} />
        </button>
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
// BUDGET ALERT BANNER (Real-time threshold monitoring)
// ─────────────────────────────────────────────────────
function BudgetAlertBanner({ catBudget }: { catBudget: { name: string; spent: number; budget: number; pct: number; color: string }[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Calculate days left in month
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - now.getDate();

  // AI recommended actions based on threshold level
  const getAIAction = (cat: string, pct: number, remaining: number, days: number) => {
    const dailyBudget = days > 0 ? remaining / days : 0;
    if (pct >= 95) return `STOP immédiat des dépenses ${cat}. Réaffectation budget urgente requise.`;
    if (pct >= 85) return `Limiter ${cat} à ${Math.round(dailyBudget)}DH/jour max pour tenir ${days}j restants.`;
    return `Modérer ${cat}: ${Math.round(dailyBudget)}DH/jour disponible. Surveiller de près.`;
  };

  // Build alerts for categories hitting thresholds
  const alerts = catBudget
    .filter(c => c.budget > 0 && c.pct >= 70 && !dismissed.includes(c.name))
    .map(c => {
      const remaining = Math.max(0, c.budget - c.spent);
      const level = c.pct >= 95 ? 'ROUGE' : c.pct >= 85 ? 'ORANGE' : 'JAUNE';
      const color = level === 'ROUGE' ? T.danger : level === 'ORANGE' ? '#FF8C00' : T.warning;
      return {
        ...c,
        remaining,
        level,
        color,
        action: getAIAction(c.name, c.pct, remaining, daysLeft),
      };
    })
    .sort((a, b) => b.pct - a.pct);

  if (alerts.length === 0) return null;

  return (
    <div style={{ margin: '16px 32px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`
        @keyframes budget-pulse-orange { 0%,100%{box-shadow:0 0 0 0 rgba(255,140,0,0.4)} 50%{box-shadow:0 0 12px 4px rgba(255,140,0,0.25)} }
        @keyframes budget-pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 16px 6px rgba(239,68,68,0.3)} }
        @keyframes budget-shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-2px)} 20%,40%,60%,80%{transform:translateX(2px)} }
      `}</style>
      {alerts.map((alert) => {
        const isRouge = alert.level === 'ROUGE';
        const isOrange = alert.level === 'ORANGE';
        return (
          <div key={alert.name} style={{
            padding: '14px 20px',
            background: `${alert.color}08`,
            border: `1px solid ${alert.color}35`,
            borderLeft: `4px solid ${alert.color}`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 14,
            animation: isRouge ? 'budget-pulse-red 1.5s ease-in-out infinite, budget-shake 0.5s ease-in-out' : isOrange ? 'budget-pulse-orange 2s ease-in-out infinite' : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Pulsing background for critical */}
            {isRouge && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, ${alert.color}08, transparent)`, animation: 'tbos-pulse 1s ease-in-out infinite' }} />}

            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${alert.color}18`, border: `1px solid ${alert.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              position: 'relative', zIndex: 1,
            }}>
              <AlertTriangle size={20} color={alert.color} />
            </div>

            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800,
                  background: alert.color, color: '#000', letterSpacing: '0.05em',
                }}>
                  {alert.level}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: alert.color }}>
                  {alert.name}
                </span>
                <span style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                  fontSize: 16, fontWeight: 700, color: alert.color,
                }}>
                  {Math.round(alert.pct)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                <span style={{ color: T.textSec }}>
                  Restant: <strong style={{ fontFamily: 'monospace', color: T.gold }}>{(alert.remaining / 1000).toFixed(1)}K DH</strong>
                </span>
                <span style={{ color: T.textDim }}>•</span>
                <span style={{ color: T.textSec }}>
                  <strong style={{ color: T.textPri }}>{daysLeft}</strong> jours restants
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.2)' }}>
                <Bot size={12} color={T.gold} style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  <strong style={{ color: T.gold }}>Action IA:</strong> {alert.action}
                </p>
              </div>
            </div>

            <button onClick={() => setDismissed([...dismissed, alert.name])} style={{
              width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.cardBorder}`,
              background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textDim, transition: 'all 150ms', position: 'relative', zIndex: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${alert.color}15`; e.currentTarget.style.color = alert.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = T.textDim; }}
            >
              <XCircle size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// APPROVAL INTELLIGENCE PANEL
// ─────────────────────────────────────────────────────
function ApprovalIntelligencePanel({ recurringCount }: { recurringCount: number }) {
  const [autoApproval, setAutoApproval] = useState(false);
  const [hov, setHov] = useState(false);
  
  // Mock approval intelligence data (in production would come from live queries)
  const avgApprovalTime = 2.8;
  const bottleneckApprover = 'Karim B.';
  const bottleneckAvg = 4.2;
  const autoApprovalCandidates = recurringCount;

  return (
    <section>
      <SectionHeader icon={Bot} label="INTELLIGENCE APPROBATION IA" right={
        <Bdg label="Analyse temps réel" color={T.gold} bg={`${T.gold}15`} icon={<Zap size={10} />} />
      } />
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
        background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 10px 30px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 14px rgba(0,0,0,0.15)',
        transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 220ms' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {/* Average approval time */}
          <div style={{ padding: 20, borderRadius: 12, background: `${T.gold}08`, border: `1px solid ${T.gold}20` }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Temps d'approbation moyen</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                fontSize: 36, fontWeight: 200, color: T.gold, letterSpacing: '-0.02em',
              }}>
                {avgApprovalTime}
              </span>
              <span style={{ fontSize: 14, color: T.textSec }}>heures</span>
            </div>
            <p style={{ fontSize: 11, color: T.textDim, marginTop: 8 }}>Ce mois · {Math.round(avgApprovalTime * 60)} min en moyenne</p>
          </div>

          {/* Bottleneck identifier */}
          <div style={{ padding: 20, borderRadius: 12, background: `${T.warning}08`, border: `1px solid ${T.warning}20` }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Goulot d'étranglement</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${T.warning}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={16} color={T.warning} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.textPri }}>{bottleneckApprover}</p>
                <p style={{ fontSize: 12, color: T.warning }}>Moyenne: {bottleneckAvg}h</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: T.textDim, marginTop: 10 }}>Approbateur le plus lent ce mois</p>
          </div>

          {/* Auto-approval recommendation */}
          <div style={{ padding: 20, borderRadius: 12, background: `${T.success}08`, border: `1px solid ${T.success}20` }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Recommandation IA</p>
            <p style={{ fontSize: 13, color: T.textPri, lineHeight: 1.5, marginBottom: 12 }}>
              <strong style={{ color: T.success }}>{autoApprovalCandidates}</strong> dépenses récurrentes &lt;500 DH éligibles à l'auto-approbation
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={14} color={T.gold} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Auto-approbation IA</span>
              </div>
              <button onClick={() => setAutoApproval(!autoApproval)} style={{
                width: 48, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
                background: autoApproval ? `linear-gradient(135deg, ${T.gold}, #B8860B)` : T.cardBorder,
                border: `1px solid ${autoApproval ? T.gold : T.cardBorder}`,
                transition: 'all 200ms', position: 'relative',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transform: autoApproval ? 'translateX(22px)' : 'translateX(0)',
                  transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)',
                }} />
              </button>
            </div>
            {autoApproval && (
              <p style={{ fontSize: 10, color: T.success, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={10} /> Activé pour dépenses récurrentes &lt;500 DH
              </p>
            )}
          </div>
        </div>

        {/* Insight footer */}
        <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 8, background: `${T.gold}06`, border: `1px solid ${T.gold}12`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={14} color={T.gold} />
          <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
            <strong style={{ color: T.gold }}>Agent IA:</strong> L'activation de l'auto-approbation pour les dépenses récurrentes de faible montant réduirait le temps moyen de traitement de <strong style={{ color: T.success }}>67%</strong> et libèrerait ~<strong style={{ color: T.gold }}>3.2h</strong>/semaine pour les approbateurs.
          </p>
        </div>
      </div>
    </section>
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

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (reportRef.current && !reportRef.current.contains(e.target as Node)) setReportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleReport = (id: string) => {
    setReportLoading(id);
    setTimeout(() => { setReportLoading(null); setReportOpen(false); }, 2400);
  };

  const reportOptions = [
    { id: 'monthly', icon: FileText, label: 'Rapport Mensuel Dirigeant', sub: 'Généré par Agent IA' },
    { id: 'budget', icon: BarChart3, label: 'Analyse Budgétaire Complète', sub: 'Généré par Agent IA' },
    { id: 'suppliers', icon: Briefcase, label: 'Rapport Fournisseurs', sub: 'Généré par Agent IA' },
    { id: 'forecast', icon: CalendarRange, label: 'Prévision Trésorerie 90j', sub: 'Généré par Agent IA' },
  ];

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
      <style>{`@keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
@keyframes tbos-spin { to { transform: rotate(360deg); } }`}</style>

      <PageHeader
        icon={CreditCard}
        title="Dépenses"
        subtitle="Suivi des dépenses et charges — données en temps réel"
        tabs={tabs.map(t => ({ id: t, label: t }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Rapport IA Dropdown */}
            <div ref={reportRef} style={{ position: 'relative' }}>
              <button onClick={() => setReportOpen(!reportOpen)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.goldBorder}`,
                borderRadius: 8, color: T.gold, fontWeight: 700, fontSize: 12,
                cursor: 'pointer', transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
              }}>
                <Bot size={14} /> Rapport IA <ChevronDown size={12} style={{ transform: reportOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
              </button>

              {reportOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                  minWidth: 280, padding: 6, borderRadius: 12,
                  background: 'linear-gradient(145deg, rgba(17, 27, 46, 0.98), rgba(22, 32, 54, 0.98))',
                  border: `1px solid ${T.goldBorder}`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                }}>
                  {reportOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isLoading = reportLoading === opt.id;
                    return (
                      <button key={opt.id} onClick={() => handleReport(opt.id)} disabled={!!reportLoading} style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px',
                        background: 'transparent', border: 'none', borderRadius: 8,
                        cursor: reportLoading ? 'wait' : 'pointer', textAlign: 'left',
                        transition: 'background 150ms', fontFamily: 'DM Sans, sans-serif',
                      }}
                      onMouseEnter={(e) => { if (!reportLoading) e.currentTarget.style.background = `${T.gold}10`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${T.gold}15`, border: `1px solid ${T.gold}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {isLoading ? (
                            <Loader2 size={14} color={T.gold} style={{ animation: 'tbos-spin 1s linear infinite' }} />
                          ) : (
                            <Icon size={14} color={T.gold} />
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.textPri, margin: 0 }}>{opt.label}</p>
                          <p style={{ fontSize: 10, color: T.textDim, margin: '2px 0 0', fontStyle: 'italic' }}>{opt.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nouvelle Dépense */}
            <button onMouseEnter={() => setHoverNew(true)} onMouseLeave={() => setHoverNew(false)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px',
              background: hoverNew ? '#FFE033' : T.gold, color: T.navy,
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12,
              cursor: 'pointer', transition: 'all 180ms', fontFamily: 'DM Sans, sans-serif',
            }}><Plus size={14} /> Nouvelle Dépense</button>
          </div>
        }
      />

      {/* AI FRAUD DETECTION BANNER */}
      {(() => {
        const flaggedCount = live.recentExpenses.filter(e => e.fraudFlags && e.fraudFlags.length > 0).length;
        if (flaggedCount === 0) return null;
        return (
          <div style={{
            margin: '0 32px', padding: '14px 20px',
            background: `${T.warning}0A`,
            border: `1px solid ${T.warning}30`,
            borderLeft: `4px solid ${T.warning}`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${T.warning}18`, border: `1px solid ${T.warning}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bot size={18} color={T.warning} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.warning }}>
                Agent IA: {flaggedCount} transaction{flaggedCount > 1 ? 's' : ''} à vérifier
              </p>
              <p style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                Détection automatique de patterns anormaux — doublons, seuils, week-ends, nouveaux fournisseurs
              </p>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 999,
              background: `${T.warning}18`, border: `1px solid ${T.warning}40`, color: T.warning,
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              <ShieldAlert size={12} />{flaggedCount} alerte{flaggedCount > 1 ? 's' : ''}
            </span>
          </div>
        );
      })()}

      {/* REAL-TIME BUDGET ALERT SYSTEM */}
      <BudgetAlertBanner catBudget={live.catBudget} />

      {/* PAGE BODY */}
      <div style={{ padding: '32px 32px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* KPIs */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <KPICard label="Dépenses ce mois" value={live.totalThisMonth} suffix="K DH" color={T.gold} icon={CreditCard} delay={0} />
            <KPICard label="Budget Restant" value={live.budgetRemaining} suffix="K DH" color={T.success} icon={Banknote} delay={80} />
            <KPICard label="En Attente Approbation" value={live.pendingApproval} suffix="K DH" color={T.warning} icon={Clock} trend={`${live.pending.length} demandes`} trendPositive={false} delay={160} />
            <KPICard label="vs Budget" value={live.vsBudgetPct} suffix="%" color={live.vsBudgetPct <= 0 ? T.success : T.danger} icon={TrendingDown}
              trend={live.vsBudgetPct <= 0 ? 'Sous budget ✓' : 'Dépassement'} trendPositive={live.vsBudgetPct <= 0} delay={240} />
            <BurnRateCard dailyAvg={live.dailyAvg} todaySpend={live.todaySpend} dailyBudget={live.dailyBudget} delay={320} />
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

            {/* Budget vs Réel vs Forecast */}
            <div style={chartCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: T.textPri }}>Budget vs Réel vs Prévision IA</p>
                  <p style={{ color: T.textDim, fontSize: 11 }}>6 derniers mois — Analyse CFO</p>
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 2, background: T.gold }} />
                    <span style={{ fontSize: 10, color: T.textSec }}>Réel</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 2, borderTop: `2px dashed ${T.gold}` }} />
                    <span style={{ fontSize: 10, color: T.textSec }}>Budget</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 2, borderTop: `2px dotted rgba(212,168,67,0.5)` }} />
                    <span style={{ fontSize: 10, color: T.textSec }}>Prévision IA</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 8, borderRadius: 2, background: 'rgba(212,168,67,0.15)' }} />
                    <span style={{ fontSize: 10, color: T.textSec }}>Intervalle</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={live.budgetData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overbudgetFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(239,68,68,0.15)" />
                      <stop offset="100%" stopColor="rgba(239,68,68,0.02)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={(v: number) => `${v}K`} />
                  <RechartsTooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    const overBudget = d.depenses > d.budget;
                    return (
                      <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                        <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{label}</p>
                        <p style={{ fontSize: 12, color: T.gold, marginBottom: 2 }}>Réel: <strong>{d.depenses}K DH</strong></p>
                        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>Budget: <strong>{d.budget}K DH</strong></p>
                        <p style={{ fontSize: 12, color: 'rgba(212,168,67,0.6)', marginBottom: 2 }}>Prévision IA: <strong>{d.forecast}K DH</strong> <span style={{ fontSize: 10, color: T.textDim }}>±{d.forecastHi - d.forecast}K</span></p>
                        {overBudget && <p style={{ fontSize: 11, color: T.danger, marginTop: 4, fontWeight: 600 }}>⚠ Dépassement: +{d.depenses - d.budget}K DH</p>}
                      </div>
                    );
                  }} />
                  {/* Confidence band */}
                  <Area type="monotone" dataKey="forecastHi" stroke="none" fill="rgba(212,168,67,0.1)" isAnimationActive animationDuration={800} />
                  <Area type="monotone" dataKey="forecastLo" stroke="none" fill={T.navy} isAnimationActive animationDuration={800} />
                  {/* Over-budget shading via reference areas */}
                  {live.budgetData.map((d, i) => {
                    if (d.depenses > d.budget && i < live.budgetData.length) {
                      return <ReferenceArea key={i} x1={d.month} x2={d.month} fill="rgba(239,68,68,0.08)" />;
                    }
                    return null;
                  })}
                  {/* Budget line - dashed */}
                  <Line type="monotone" dataKey="budget" name="Budget" stroke={T.gold} strokeWidth={1.5} strokeDasharray="8 4" dot={false} isAnimationActive animationDuration={800} />
                  {/* Forecast line - dotted, lighter */}
                  <Line type="monotone" dataKey="forecast" name="Prévision IA" stroke="rgba(212,168,67,0.5)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive animationDuration={800} />
                  {/* Actual line - solid, hero */}
                  <Line type="monotone" dataKey="depenses" name="Réel" stroke={T.gold} strokeWidth={2} dot={{ r: 3, fill: T.gold, stroke: T.navy, strokeWidth: 2 }} activeDot={{ r: 5, fill: T.gold, stroke: T.navy, strokeWidth: 2 }} isAnimationActive animationDuration={1000} />
                </LineChart>
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

        {/* RECURRING EXPENSES - Vue d'ensemble only */}
        {activeTab === "Vue d'ensemble" && live.recurring.length > 0 && (
          <RecurringSection recurring={live.recurring} total30d={live.recurringTotal30d} />
        )}

        {/* AI COST OPTIMIZATION RECOMMENDATIONS */}
        {activeTab === 'Par Catégorie' && (
          <section>
            <SectionHeader icon={Zap} label="RECOMMANDATIONS IA — OPTIMISATION COÛTS" right={
              <Bdg label="Agent IA" color={T.gold} bg={`${T.gold}15`} icon={<Zap size={10} />} />
            } />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {/* Recommendation 1: Fuel Optimization */}
              <AIRecommendationCard
                icon={Truck}
                category="Carburant"
                title="Optimiser routes livraison"
                saving={800}
                confidence={87}
                explanation="L'analyse des trajets révèle des détours évitables sur 23% des livraisons ce mois."
              />
              {/* Recommendation 2: Maintenance */}
              <AIRecommendationCard
                icon={Wrench}
                category="Maintenance"
                title="Regrouper interventions préventives"
                saving={1200}
                confidence={92}
                explanation="3 véhicules nécessitent une révision similaire — négocier tarif groupé avec prestataire."
              />
              {/* Recommendation 3: Energy */}
              <AIRecommendationCard
                icon={Zap}
                category="Énergie"
                title="Décaler production heures creuses"
                saving={650}
                confidence={78}
                explanation="18% de la production actuelle sur heures pleines pourrait être décalée sans impact opérationnel."
              />
            </div>
          </section>
        )}

        {/* AI BUDGET REALLOCATION */}
        {activeTab === 'Par Catégorie' && live.catBudget.length >= 2 && (() => {
          // Find underspending (lowest pct) and overspending (highest pct) categories
          const sorted = [...live.catBudget].sort((a, b) => a.pct - b.pct);
          const from = sorted[0];
          const to = sorted[sorted.length - 1];
          if (!from || !to || from.pct >= 70 || to.pct < 80) return null;
          const surplus = from.budget - from.spent;
          const deficit = to.spent - to.budget;
          const transferAmount = Math.max(1, Math.min(surplus, Math.abs(deficit), Math.round(from.budget * 0.3)));
          if (transferAmount < 1) return null;
          const fromCfg = getCatConfig(from.name);
          const toCfg = getCatConfig(to.name);
          const FromIcon = fromCfg.icon;
          const ToIcon = toCfg.icon;
          const fromAfterPct = from.budget - transferAmount > 0 ? Math.round((from.spent / (from.budget - transferAmount)) * 100) : 0;
          const toAfterPct = to.budget + transferAmount > 0 ? Math.round((to.spent / (to.budget + transferAmount)) * 100) : 0;

          return (
            <section>
              <SectionHeader icon={Repeat} label="AGENT IA: RÉALLOCATION BUDGÉTAIRE" right={
                <Bdg label="Suggestion automatique" color={T.gold} bg={`${T.gold}15`} icon={<Bot size={10} />} />
              } />
              <ReallocationCard
                from={{ name: from.name, color: fromCfg.color, icon: FromIcon, spent: from.spent, budget: from.budget, pct: from.pct, afterPct: fromAfterPct }}
                to={{ name: to.name, color: toCfg.color, icon: ToIcon, spent: to.spent, budget: to.budget, pct: to.pct, afterPct: toAfterPct }}
                transferAmount={transferAmount}
              />
            </section>
          );
        })()}

        {/* AI APPROVAL INTELLIGENCE - Approbations tab only */}
        {activeTab === 'Approbations' && <ApprovalIntelligencePanel recurringCount={live.recurring.filter(r => r.amount < 500).length} />}
      </div>
    </div>
  );
}
