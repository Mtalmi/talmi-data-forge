import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  Package, AlertTriangle, ArrowUpDown, RefreshCw,
  Droplets, Bell, ArrowUp, ArrowDown, TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS — TBOS Amber Design System
// ─────────────────────────────────────────────────────
const T = {
  amber:      '#FFD700',
  amberDark:  '#D97706',
  amberDeep:  '#B45309',
  amberHover: 'rgba(245, 158, 11, 0.15)',
  amberBorder:'rgba(245, 158, 11, 0.15)',
  amberSubtle:'rgba(255, 215, 0, 0.04)',
  amberGrid:  'rgba(245, 158, 11, 0.08)',
  navy:       '#0B1120',
  cardBg:     'linear-gradient(to bottom right, #1a1f2e, #141824)',
  cardBorder: 'rgba(245, 158, 11, 0.15)',
  success:    '#10B981',
  danger:     '#EF4444',
  textPri:    '#F1F5F9',
  textSec:    '#94A3B8',
  textDim:    '#64748B',
};

// ─────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const raw = eased * target;
      setValue(parseFloat(raw.toFixed(decimals)));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return value;
}

// ─────────────────────────────────────────────────────
// ANIMATED WIDTH (for progress bars)
// ─────────────────────────────────────────────────────
function useAnimatedWidth(target: number, delay = 0, duration = 900) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setWidth(eased * target);
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay, duration]);
  return width;
}

// ─────────────────────────────────────────────────────
// CARD — Vogue Standard
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────
function Badge({ label, color, bg, pulse = false }: { label: string; color: string; bg: string; pulse?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      animation: pulse ? 'tbos-pulse 2s infinite' : 'none',
      flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.amber} />
      <span style={{ color: '#FFD700', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, rgba(255,215,0,0.4), transparent 80%)` }} />
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function useStocksLiveData() {
  const [STOCKS, setStocks] = useState<{ name: string; current: number; max: number; unit: string; pct: number; liquid: boolean }[]>([]);
  const [MOVEMENT_DATA, setMovementData] = useState<{ day: string; entrees: number; sorties: number }[]>([]);
  const [ALERTS, setAlerts] = useState<{ name: string; current: string; min: string; deficit: string; urgency: string; color: string }[]>([]);
  const [MOVEMENTS, setMovements] = useState<{ date: string; type: string; material: string; qty: string; ref: string; resp: string }[]>([]);
  const [VALUE_BREAKDOWN, setValueBreakdown] = useState<{ cat: string; value: number; color: string }[]>([]);
  const [AUTONOMY, setAutonomy] = useState<Record<string, { days: number | null; calculated_at: string | null }>>({});
  const [loading, setLoading] = useState(true);

  // Amber gradient palette for value breakdown
  const amberPalette: Record<string, string> = {
    Sable: '#F59E0B',
    Granulats: '#D97706',
    Ciment: '#B45309',
    Eau: '#92400E',
    Adjuvants: '#78350F',
    Autre: '#F59E0B',
  };

  const fetchAll = useCallback(async () => {
    try {
      const [stocksRes, movementsRes, autonomyRes] = await Promise.all([
        supabase.from('stocks').select('*'),
        supabase.from('mouvements_stock')
          .select('id, materiau, type_mouvement, quantite, reference_id, created_by, created_at, fournisseur')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('stock_autonomy_cache').select('materiau, days_remaining, last_calculated_at'),
      ]);

      // Autonomy map
      const autoMap: Record<string, { days: number | null; calculated_at: string | null }> = {};
      if (autonomyRes.data?.length) {
        autonomyRes.data.forEach((a: any) => {
          autoMap[(a.materiau || '').toLowerCase()] = { days: a.days_remaining, calculated_at: a.last_calculated_at };
        });
      }
      setAutonomy(autoMap);

      // Stock levels
      if (stocksRes.data?.length) {
        const liquidMaterials = ['eau', 'adjuvant', 'plastifiant', 'retardateur'];
        const stocks = stocksRes.data.map(s => {
          const max = s.capacite_max || (s.quantite_actuelle || 0) * 2 || 10000;
          const current = s.quantite_actuelle || 0;
          const pct = max > 0 ? Math.round((current / max) * 100) : 0;
          const isLiquid = liquidMaterials.some(l => (s.materiau || '').toLowerCase().includes(l));
          return { name: s.materiau || 'Inconnu', current, max, unit: s.unite || 'kg', pct, liquid: isLiquid };
        });
        setStocks(stocks);

        // Alerts (items below seuil_alerte)
        const alerts = stocksRes.data
          .filter(s => s.seuil_alerte && s.quantite_actuelle !== null && s.quantite_actuelle < s.seuil_alerte)
          .map(s => {
            const deficit = (s.quantite_actuelle || 0) - (s.seuil_alerte || 0);
            const urgency = deficit < -(s.seuil_alerte || 0) * 0.5 ? 'Critique' : 'Attention';
            return {
              name: s.materiau || 'Inconnu',
              current: `${(s.quantite_actuelle || 0).toLocaleString('fr-FR')} ${s.unite || 'kg'}`,
              min: `${(s.seuil_alerte || 0).toLocaleString('fr-FR')} ${s.unite || 'kg'}`,
              deficit: `${deficit.toLocaleString('fr-FR')} ${s.unite || 'kg'}`,
              urgency,
              color: urgency === 'Critique' ? T.danger : T.amber,
            };
          });
        setAlerts(alerts);

        // Value breakdown by category — amber palette
        const catMap: Record<string, { value: number; color: string }> = {};
        stocks.forEach(s => {
          const key = s.name.toLowerCase().includes('ciment') ? 'Ciment'
            : s.name.toLowerCase().includes('gravel') || s.name.toLowerCase().includes('gravette') ? 'Granulats'
            : s.name.toLowerCase().includes('adjuvant') ? 'Adjuvants'
            : s.name.toLowerCase().includes('sable') ? 'Sable'
            : s.name.toLowerCase().includes('eau') ? 'Eau' : 'Autre';
          const clr = '#D4A843';
          if (!catMap[key]) catMap[key] = { value: 0, color: clr };
          catMap[key].value += Math.round(s.current / 1000);
        });
        setValueBreakdown(Object.entries(catMap).map(([cat, v]) => ({ cat, ...v })));
      }

      // Recent movements
      if (movementsRes.data?.length) {
        setMovements(movementsRes.data.map(m => ({
          date: m.created_at ? format(new Date(m.created_at), 'dd/MM HH:mm') : '—',
          type: m.type_mouvement === 'reception' ? 'Entrée' : 'Sortie',
          material: m.materiau || '—',
          qty: `${m.type_mouvement === 'reception' ? '+' : '-'}${Math.abs(m.quantite || 0).toLocaleString('fr-FR')}`,
          ref: m.id ? m.id.substring(0, 8).toUpperCase() : '—',
          resp: m.fournisseur || 'Atlas Concrete',
        })));

        // Weekly movement chart
        const dayBuckets: Record<string, { entrees: number; sorties: number }> = {};
        ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(d => dayBuckets[d] = { entrees: 0, sorties: 0 });
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        movementsRes.data.forEach(m => {
          if (m.created_at) {
            const dayName = dayNames[new Date(m.created_at).getDay()];
            if (dayBuckets[dayName]) {
              if (m.type_mouvement === 'entree') dayBuckets[dayName].entrees += Math.abs(m.quantite || 0);
              else dayBuckets[dayName].sorties += Math.abs(m.quantite || 0);
            }
          }
        });
        setMovementData(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => ({
          day, entrees: dayBuckets[day].entrees, sorties: dayBuckets[day].sorties,
        })));
      }
    } catch (err) {
      console.error('WorldClassStocks fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('wc-stocks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mouvements_stock' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_autonomy_cache' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { STOCKS, MOVEMENT_DATA, ALERTS, MOVEMENTS, VALUE_BREAKDOWN, AUTONOMY, loading };
}

// ─────────────────────────────────────────────────────
// KPI CARD — All amber icons (alert uses red when >0)
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0, decimals = 0, isAlert = false }: {
  label: string; value: number; suffix: string; color: string;
  icon: any; trend: string; trendPositive: boolean; delay?: number; decimals?: number; isAlert?: boolean;
}) {
  const animated = useAnimatedCounter(value, 1200, decimals);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  // Icon color: amber by default, red only for alert card when value > 0
  const iconColor = isAlert && value > 0 ? T.danger : T.amber;
  const iconBg = isAlert && value > 0 ? 'rgba(239, 68, 68, 0.15)' : T.amberHover;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out', height: '100%' }}>
      <Card style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 30, fontWeight: 200, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString('fr-FR')}
              <span style={{ fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>
            </p>
            {trend ? (
              <p style={{ fontSize: 12, color: trendPositive ? '#10B981' : '#EF4444', marginTop: 6, fontWeight: 500 }}>
                {trendPositive ? '↑' : '↓'} {trend}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: value > 0 ? '#EF4444' : '#10B981', marginTop: 6, fontWeight: 500 }}>
                {value > 0 ? `⚠ ${value} critique${value > 1 ? 's' : ''}` : '✓ Aucune alerte'}
              </p>
            )}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={iconColor} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// STOCK LEVEL ROW — Amber progress system
// ─────────────────────────────────────────────────────
function StockRow({ stock, index, autonomy }: { stock: { name: string; current: number; max: number; unit: string; pct: number; liquid: boolean }; index: number; autonomy?: { days: number | null; calculated_at: string | null } }) {
  const [visible, setVisible] = useState(false);
  const barColor = stock.pct > 30 ? T.amber : stock.pct > 10 ? T.amberDark : T.danger;
  const isAlert = stock.pct < 30;
  const animatedWidth = useAnimatedWidth(stock.pct, index * 100);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 80); return () => clearTimeout(t); }, [index]);
  const Icon = stock.liquid ? Droplets : Package;

  // Autonomy badge logic
  const days = autonomy?.days;
  const autoLabel = days == null ? 'N/A'
    : days <= 2 ? `${days}j — Critique`
    : days <= 5 ? `${days}j — Bas`
    : days <= 14 ? `${days}j — Normal`
    : `${days}j — Élevé`;
  const autoColor = days == null ? T.textDim
    : days <= 2 ? T.danger
    : days <= 5 ? '#F59E0B'
    : days <= 14 ? T.success
    : '#3B82F6';
  const autoPulse = days != null && days <= 2;

  const relTime = autonomy?.calculated_at ? (() => {
    const mins = Math.floor((Date.now() - new Date(autonomy.calculated_at!).getTime()) / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  })() : null;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'all 500ms ease-out',
      padding: '14px 16px',
      background: isAlert ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
      border: `1px solid ${isAlert ? 'rgba(245, 158, 11, 0.3)' : T.cardBorder}`,
      borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: T.amberHover, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={T.amber} />
      </div>
      <div style={{ minWidth: 150, flexShrink: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{stock.name}</p>
      </div>
      <div style={{ flex: 1, minWidth: 100 }}>
        <div style={{ height: 8, borderRadius: 6, background: T.amberGrid, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${animatedWidth}%`, background: barColor, borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 130 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: T.textPri }}>
          {stock.current.toLocaleString('fr-FR')}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>
          {' '}/ {stock.max.toLocaleString('fr-FR')} {stock.unit}
        </span>
      </div>
      {/* Autonomy badge */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 100 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700,
          background: `${autoColor}18`, border: `1px solid ${autoColor}40`, color: autoColor,
          animation: autoPulse ? 'tbos-pulse 2s infinite' : 'none',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: autoColor, flexShrink: 0 }} />
          {autoLabel}
        </span>
        {relTime && <span style={{ fontSize: 9, color: T.textDim }}>Calculé {relTime}</span>}
      </div>
      {/* Pct badge */}
      <div style={{ flexShrink: 0 }}>
        {stock.pct < 10
          ? <Badge label="Alerte ⚠" color={T.danger} bg="rgba(239, 68, 68, 0.15)" pulse />
          : isAlert
          ? <Badge label="Alerte ⚠" color={T.amber} bg={T.amberHover} pulse />
          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.amber }}>{stock.pct}%</span>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ALERT CARD
// ─────────────────────────────────────────────────────
function AlertCard({ alert, delay = 0 }: { alert: { name: string; current: string; min: string; deficit: string; urgency: string; color: string }; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isCritique = alert.urgency === 'Critique';

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 400ms ease-out',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderLeft: `4px solid ${alert.color}`,
        borderRadius: 12, padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>{alert.name}</p>
        <Badge label={alert.urgency} color={alert.color} bg={`${alert.color}18`} pulse={isCritique} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Actuel</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.danger }}>{alert.current}</p>
        </div>
        <div style={{ color: T.textDim }}>→</div>
        <div>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Minimum</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: T.textSec }}>{alert.min}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Déficit</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.danger }}>
            ↓ {alert.deficit}
          </p>
        </div>
      </div>
      <button style={{
        width: '100%', padding: '7px 0', borderRadius: 8,
        background: T.amber, color: T.navy,
        fontWeight: 700, fontSize: 12,
        border: 'none', cursor: 'pointer',
        transition: 'filter 150ms',
      }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        Commander
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MOVEMENT ROW — truncate references
// ─────────────────────────────────────────────────────
function MovementRow({ m, delay = 0 }: { m: { date: string; type: string; material: string; qty: string; ref: string; resp: string }; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const isEntree = m.type === 'Entrée';
  const typeColor = isEntree ? T.success : T.danger;
  const TypeIcon = isEntree ? ArrowUp : ArrowDown;

  // Truncate UUID-like references to first 8 chars (uppercase)
  const displayRef = (() => {
    if (!m.ref || m.ref === '—') return '—';
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}/i;
    if (uuidPattern.test(m.ref)) return m.ref.substring(0, 8).toUpperCase();
    return m.ref.length > 16 ? m.ref.substring(0, 16) + '…' : m.ref;
  })();

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 350ms ease-out',
        background: hov ? T.amberSubtle : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        borderRadius: 8, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}
    >
      {/* Type badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 999,
        background: isEntree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        border: `1px solid ${typeColor}30`,
        color: typeColor, fontSize: 10, fontWeight: 700, flexShrink: 0,
      }}>
        <TypeIcon size={10} />
        {m.type}
      </span>

      {/* Date */}
      <span style={{ color: T.textDim, fontSize: 11, flexShrink: 0, minWidth: 130 }}>{m.date}</span>

      {/* Material */}
      <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri, flex: 1 }}>{m.material}</span>

      {/* Qty */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: isEntree ? T.success : T.danger, flexShrink: 0 }}>
        {m.qty}
      </span>

      {/* Ref — truncated */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim, flexShrink: 0 }}>{displayRef}</span>

      {/* Responsable */}
      <span style={{ color: T.textSec, fontSize: 11, flexShrink: 0, minWidth: 110 }}>{m.resp}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: T.amber, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString('fr-FR')}{suffix}</strong>
        </p>
      ))}
    </div>
  );
}

function ValueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#162036', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <p style={{ color: T.amber, fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color: payload[0]?.fill, fontSize: 12 }}>{payload[0]?.value} K DH</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function WorldClassStocks() {
  const [activeTab, setActiveTab] = useState('overview');
  const { STOCKS, MOVEMENT_DATA, ALERTS, MOVEMENTS, VALUE_BREAKDOWN, AUTONOMY, loading } = useStocksLiveData();
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'mouvements', label: 'Mouvements' },
    { id: 'alertes', label: 'Alertes' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
      `}</style>

      {/* ── SEAMLESS HEADER ── */}
      <PageHeader
        icon={Package}
        title="Stocks"
        subtitle="Gestion des stocks et inventaire"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button style={{
            padding: '7px 16px', borderRadius: 8, background: '#F59E0B', color: '#000000',
            fontWeight: 700, fontSize: 12,
            border: 'none', cursor: 'pointer',
            transition: 'background 150ms',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D97706')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F59E0B')}
          >
            + Nouveau Mouvement
          </button>
        }
      />

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── SECTION 1: KPIs ── */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <KPICard label="Valeur Totale Stock"      value={2.4}  suffix="M DH" color={T.amber}   icon={Package}      trend="+5% vs mois dernier" trendPositive decimals={1} delay={0} />
            <KPICard label="Articles en Alerte"       value={3}    suffix=""     color={T.danger}  icon={AlertTriangle} trend=""                    trendPositive={false} delay={80} isAlert />
            <KPICard label="Mouvements Aujourd'hui"   value={12}   suffix=""     color={T.amber}   icon={ArrowUpDown}  trend="+4 vs hier"          trendPositive delay={160} />
            <KPICard label="Rotation Moyenne"         value={4.2}  suffix="x"   color={T.amber}   icon={RefreshCw}    trend="+0.3 vs semaine"     trendPositive decimals={1} delay={240} />
          </div>
        </section>

        {/* ── SECTION 2: STOCK LEVELS ── */}
        <section>
          <SectionHeader icon={Package} label="Niveaux de Stock" />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STOCKS.map((s, i) => <StockRow key={s.name} stock={s} index={i} autonomy={AUTONOMY[s.name.toLowerCase()]} />)}
            </div>
          </Card>
        </section>

        {/* ── SECTION 3 + 4: CHART + ALERTS ── */}
        <section>
          <SectionHeader icon={ArrowUpDown} label="Mouvements & Alertes" />
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 24 }}>

            {/* Movement chart */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ color: T.textPri, fontWeight: 700, fontSize: 14 }}>Mouvements de Stock</p>
                  <p style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>7 derniers jours</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSec, fontSize: 11 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: T.success, display: 'inline-block' }} />Entrées
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSec, fontSize: 11 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: T.amber, display: 'inline-block' }} />Sorties
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={MOVEMENT_DATA} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.amberGrid} vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }}
                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                  <RechartsTooltip content={<DarkTooltip suffix=" kg" />} cursor={{ fill: T.amberSubtle }} />
                  <Bar dataKey="entrees" name="Entrées"  fill={T.success} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} />
                  <Bar dataKey="sorties" name="Sorties"  fill={T.amber}   radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} animationBegin={150} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Alerts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={14} color={T.danger} />
                <span style={{ color: T.danger, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Alertes Stock</span>
                <Badge label={`${ALERTS.length} actives`} color={T.danger} bg="rgba(239, 68, 68, 0.15)" pulse />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ALERTS.map((a, i) => <AlertCard key={a.name} alert={a} delay={i * 100} />)}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: RECENT MOVEMENTS ── */}
        <section>
          <SectionHeader icon={ArrowUpDown} label="Derniers Mouvements" />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header row */}
              <div style={{ display: 'flex', gap: 14, padding: '0 14px 10px', borderBottom: `1px solid ${T.cardBorder}` }}>
                {['Type', 'Date', 'Matériau', 'Quantité', 'Référence', 'Responsable'].map(h => (
                  <span key={h} style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{h}</span>
                ))}
              </div>
              {MOVEMENTS.map((m, i) => <MovementRow key={i} m={m} delay={i * 60} />)}
            </div>
          </Card>
        </section>

        {/* ── SECTION 6: VALUE BREAKDOWN — Amber Gradient ── */}
        <section>
          <SectionHeader
            icon={TrendingUp}
            label="Valeur par Catégorie"
            right={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.amber }}>Total: 2.4 M DH</span>}
          />
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[...VALUE_BREAKDOWN].sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.amberGrid} horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                  tickFormatter={(v) => `${v}K`} />
                <YAxis dataKey="cat" type="category" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} width={70} />
                <RechartsTooltip content={<ValueTooltip />} cursor={{ fill: T.amberSubtle }} />
                <Bar dataKey="value" name="Valeur" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1000}>
                  {VALUE_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Stocks v2.0 — {new Date().toLocaleDateString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Stocks synchronisés</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
