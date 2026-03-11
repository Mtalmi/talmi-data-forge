import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  Package, AlertTriangle, ArrowUpDown, ShoppingCart,
  Droplets, Bell, ArrowUp, ArrowDown, TrendingUp, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';

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
  const [STOCK_ALERTS_DB, setStockAlertsDb] = useState<{ id: string; materiau: string; alert_type: string; severity: string; message: string; created_at: string }[]>([]);
  const [VALUE_BREAKDOWN, setValueBreakdown] = useState<{ cat: string; value: number; color: string }[]>([]);
  const [AUTONOMY, setAutonomy] = useState<Record<string, { days: number | null; calculated_at: string | null }>>({});
  const [SPARKLINES, setSparklines] = useState<Record<string, number[]>>({});
  const [REORDER_RECS, setReorderRecs] = useState<{ id: string; materiau: string; recommended_qty: number; urgency: string; fournisseur: string | null; unite: string; days_remaining: number | null; created_at: string }[]>([]);
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
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7)).toISOString();
      const [stocksRes, movementsRes, autonomyRes, consumptionRes, stockAlertsRes, reorderRes] = await Promise.all([
        supabase.from('stocks').select('*'),
        supabase.from('mouvements_stock')
          .select('id, materiau, type_mouvement, quantite, reference_id, created_by, created_at, fournisseur')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('stock_autonomy_cache').select('materiau, days_remaining, last_calculated_at'),
        supabase.from('mouvements_stock')
          .select('materiau, quantite, created_at')
          .eq('type_mouvement', 'consumption')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true }),
        supabase.from('stock_alerts')
          .select('id, materiau, alert_type, severity, message, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.from('reorder_recommendations')
          .select('id, materiau, recommended_qty, urgency, fournisseur, unite, days_remaining, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      // Stock alerts from DB
      if (stockAlertsRes.data) {
        setStockAlertsDb(stockAlertsRes.data);
      }

      // Reorder recommendations from DB
      if (reorderRes.data) {
        setReorderRecs(reorderRes.data as any);
      }

      // Autonomy map
      const autoMap: Record<string, { days: number | null; calculated_at: string | null }> = {};
      if (autonomyRes.data?.length) {
        autonomyRes.data.forEach((a: any) => {
          autoMap[(a.materiau || '').toLowerCase()] = { days: a.days_remaining, calculated_at: a.last_calculated_at };
        });
      }
      setAutonomy(autoMap);

      // Sparkline data: 7-day consumption per material
      const sparkMap: Record<string, number[]> = {};
      if (consumptionRes.data?.length) {
        const byMat: Record<string, Record<number, number>> = {};
        consumptionRes.data.forEach((m: any) => {
          const key = (m.materiau || '').toLowerCase();
          const dayIdx = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000);
          const bucket = Math.min(6, Math.max(0, 6 - dayIdx));
          if (!byMat[key]) byMat[key] = {};
          byMat[key][bucket] = (byMat[key][bucket] || 0) + Math.abs(m.quantite || 0);
        });
        Object.entries(byMat).forEach(([key, days]) => {
          sparkMap[key] = Array.from({ length: 7 }, (_, i) => days[i] || 0);
        });
      }
      setSparklines(sparkMap);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_alerts' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reorder_recommendations' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { STOCKS, MOVEMENT_DATA, ALERTS, MOVEMENTS, VALUE_BREAKDOWN, AUTONOMY, SPARKLINES, STOCK_ALERTS_DB, REORDER_RECS, loading };
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
function StockRow({ stock, index, autonomy, sparkline }: { stock: { name: string; current: number; max: number; unit: string; pct: number; liquid: boolean }; index: number; autonomy?: { days: number | null; calculated_at: string | null }; sparkline?: number[] }) {
  const [visible, setVisible] = useState(false);
  const barColor = stock.pct > 30 ? T.amber : stock.pct > 10 ? T.amberDark : T.danger;
  const isAlert = stock.pct < 30;
  const animatedWidth = useAnimatedWidth(stock.pct, index * 100);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 80); return () => clearTimeout(t); }, [index]);
  const Icon = stock.liquid ? Droplets : Package;

  // Autonomy badge logic
  const days = autonomy?.days;
  const roundedDays = days != null ? Math.round(days * 10) / 10 : null;
  const autoBadgeConfig = roundedDays == null
    ? { badge: 'N/A', color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)', pulse: false }
    : roundedDays <= 2
    ? { badge: `${roundedDays}j`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', pulse: true }
    : roundedDays <= 5
    ? { badge: `${roundedDays}j`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', pulse: false }
    : { badge: `${roundedDays}j`, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', pulse: false };

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
      {/* Sparkline — 7-day consumption */}
      {(() => {
        const data = sparkline && sparkline.length === 7 ? sparkline : null;
        if (!data || data.every(v => v === 0)) return <div style={{ width: 80, height: 24, flexShrink: 0 }} />;
        const max = Math.max(...data, 1);
        const isIncreasing = data[5] + data[6] > data[0] + data[1];
        const color = isIncreasing ? '#ef4444' : '#D4A843';
        const points = data.map((v, i) => `${(i / 6) * 76 + 2},${22 - (v / max) * 18}`).join(' ');
        return (
          <svg width={80} height={24} style={{ flexShrink: 0 }}>
            <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      })()}
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 130 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: T.textPri }}>
          {stock.current.toLocaleString('fr-FR')}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textDim }}>
          {' '}/ {stock.max.toLocaleString('fr-FR')} {stock.unit}
        </span>
      </div>
      {/* Autonomy badge */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, minWidth: 120 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
          background: autoBadgeConfig.bg, border: `1px solid ${autoBadgeConfig.color}`, color: autoBadgeConfig.color,
          animation: autoBadgeConfig.pulse ? 'tbos-pulse 2s infinite' : 'none',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: autoBadgeConfig.color, flexShrink: 0 }} />
          {autoBadgeConfig.badge}
        </span>
        {days != null && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.textSec, fontWeight: 600 }}>{Math.round(days * 10) / 10}j</span>}
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
function MovementRow({ m, delay = 0, isFirst = false }: { m: { date: string; type: string; material: string; qty: string; ref: string; resp: string }; delay?: number; isFirst?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  const [showNew, setShowNew] = useState(isFirst);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => { if (isFirst) { const t = setTimeout(() => setShowNew(false), 10000); return () => clearTimeout(t); } }, [isFirst]);
  const isEntree = m.type === 'Entrée';
  const isAjustement = m.type === 'Ajustement';
  const leftBorder = isEntree ? '#22c55e' : isAjustement ? '#D4A843' : '#ef4444';
  const typeColor = isEntree ? T.success : isAjustement ? T.amber : T.danger;
  const TypeIcon = isEntree ? ArrowUp : ArrowDown;
  const qtyColor = isEntree ? '#22c55e' : '#ef4444';

  const displayRef = m.ref || '—';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 350ms ease-out',
        background: isFirst ? 'rgba(212,168,67,0.04)' : hov ? T.amberSubtle : 'transparent',
        border: `1px solid ${hov ? T.cardBorder : 'transparent'}`,
        borderLeft: `2px solid ${leftBorder}`,
        borderRadius: 8, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        position: 'relative',
      }}
    >
      {/* NOUVEAU badge */}
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
        padding: '3px 10px', borderRadius: 999,
        background: isEntree ? 'rgba(16, 185, 129, 0.15)' : isAjustement ? 'rgba(212,168,67,0.15)' : 'rgba(239, 68, 68, 0.15)',
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

      {/* Qty with colored arrow */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: qtyColor, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {isEntree ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
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
// LAST UPDATE TIMER
// ─────────────────────────────────────────────────────
function LastUpdateTimer() {
  const [mounted] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  const mins = Math.floor((now - mounted) / 60000);
  const label = mins < 1 ? "à l'instant" : `il y a ${mins}m`;
  return <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'JetBrains Mono, monospace' }}>dernière mise à jour: {label}</span>;
}

// ─────────────────────────────────────────────────────
// CRITIQUE COUNTDOWN
// ─────────────────────────────────────────────────────
function CritiqueCountdown({ daysRemaining }: { daysRemaining: number }) {
  const targetMs = useRef(Date.now() + daysRemaining * 86400000);
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs.current - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, targetMs.current - Date.now()));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const totalMin = Math.floor(remaining / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
          animation: 'critique-blink 1s step-end infinite', flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          fontWeight: 200, fontSize: 24, lineHeight: 1, color: '#ef4444',
          WebkitFontSmoothing: 'antialiased' as any,
        }}>
          Rupture dans {d}j {h}h {m}m
        </span>
      </div>
      <p style={{
        fontSize: 11, color: '#f87171', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginTop: 4,
      }}>
        Commande urgente requise
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function WorldClassStocks() {
  const [activeTab, setActiveTab] = useState('overview');
  const { STOCKS, MOVEMENT_DATA, ALERTS, MOVEMENTS, VALUE_BREAKDOWN, AUTONOMY, SPARKLINES, STOCK_ALERTS_DB, REORDER_RECS, loading } = useStocksLiveData();
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
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes urgentGlow { 0%,100%{box-shadow:0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 20px rgba(239,68,68,0.15)} }
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

      {/* ── HERO SECTION ── */}
      {(() => {
        const weights: Record<string, number> = { ciment: 0.30, gravette: 0.25, sable: 0.20, eau: 0.15, adjuvant: 0.10 };
        const tierScore = (d: number) => d >= 7 ? 100 : d >= 5 ? 75 : d >= 3 ? 50 : d >= 1 ? 25 : 0;
        let tw = 0, ws = 0;
        for (const [mat, w] of Object.entries(weights)) {
          const auto = AUTONOMY[mat];
          if (auto?.days != null) { ws += tierScore(auto.days) * w; tw += w; }
        }
        const heroScore = tw > 0 ? Math.round(ws / tw) : 0;
        const heroScoreColor = heroScore >= 80 ? '#D4A843' : heroScore >= 50 ? '#f97316' : '#ef4444';

        const criticalCount = STOCK_ALERTS_DB.filter(a => a.severity === 'critical').length;
        const suggestedCount = REORDER_RECS.length;

        const allAutonomyDays = Object.values(AUTONOMY).map(a => a?.days).filter((d): d is number => d != null);
        const minAutonomy = allAutonomyDays.length > 0 ? Math.min(...allAutonomyDays) : 0;

        const severityRank: Record<string, number> = { critical: 3, warning: 2, info: 1 };
        const topRec = [...REORDER_RECS].sort((a, b) => {
          const urgRank: Record<string, number> = { CRITIQUE: 3, URGENT: 3, 'MODÉRÉ': 2, OK: 1 };
          return (urgRank[b.urgency] || 0) - (urgRank[a.urgency] || 0);
        })[0];
        const verdictText = topRec
          ? `${topRec.materiau} — commander ${Number(topRec.recommended_qty).toLocaleString('fr-FR')} ${topRec.unite} (${topRec.urgency})`
          : 'Tous les stocks sont à niveau optimal';

        const pillStyle: React.CSSProperties = {
          border: '1px solid rgba(212,168,67,0.3)', padding: '12px 20px', borderRadius: 999,
          fontSize: 13, color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        };
        const dot = (color: string): React.CSSProperties => ({
          width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
        });

        return (
          <div style={{
            background: 'rgba(212,168,67,0.04)',
            borderBottom: '1px solid rgba(212,168,67,0.12)',
            padding: '32px 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ color: '#D4A843', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                ÉTAT GÉNÉRAL DES STOCKS
              </p>
              <p style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                fontSize: 96, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.02em', color: heroScoreColor,
                WebkitFontSmoothing: 'antialiased' as any,
              }}>
                {heroScore}
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>
                ⚡ {verdictText}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={pillStyle}><span style={dot('#ef4444')} />{criticalCount} matériaux critiques</div>
              <div style={pillStyle}><span style={dot('#D4A843')} />{suggestedCount} commandes suggérées</div>
              <div style={pillStyle}><span style={dot('#f97316')} />Autonomie min: {minAutonomy}j</div>
            </div>
          </div>
        );
      })()}

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── SECTION 1: KPIs ── */}
        <section>
          <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <KPICard label="Valeur Totale Stock"      value={2.4}  suffix="M DH" color={T.amber}   icon={Package}      trend="+5% vs mois dernier" trendPositive decimals={1} delay={0} />
            <KPICard label="Articles en Alerte"       value={3}    suffix=""     color={T.danger}  icon={AlertTriangle} trend=""                    trendPositive={false} delay={80} isAlert />
            <KPICard label="Mouvements Aujourd'hui"   value={12}   suffix=""     color={T.amber}   icon={ArrowUpDown}  trend="+4 vs hier"          trendPositive delay={160} />
          </div>
        </section>

        {/* ── INTELLIGENCE COMMAND CARD ── */}
        {(() => {
          // Santé Stock score
          const weights: Record<string, number> = { ciment: 0.30, gravette: 0.25, sable: 0.20, eau: 0.15, adjuvant: 0.10 };
          const tierScore = (d: number) => d >= 7 ? 100 : d >= 5 ? 75 : d >= 3 ? 50 : d >= 1 ? 25 : 0;
          let totalWeight = 0;
          let weightedSum = 0;
          for (const [mat, w] of Object.entries(weights)) {
            const auto = AUTONOMY[mat];
            if (auto?.days != null) {
              weightedSum += tierScore(auto.days) * w;
              totalWeight += w;
            }
          }
          const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
          const scoreColor = score >= 80 ? '#D4A843' : score >= 50 ? '#f59e0b' : '#ef4444';

          // Top alert
          const severityRank: Record<string, number> = { critical: 3, warning: 2, info: 1 };
          const topAlert = [...STOCK_ALERTS_DB].sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))[0] || null;
          const alertColor = topAlert?.severity === 'critical' ? '#ef4444' : topAlert?.severity === 'warning' ? '#f59e0b' : '#22c55e';

          const dividerStyle: React.CSSProperties = { width: 1, background: 'rgba(212,168,67,0.12)', alignSelf: 'stretch' };

          return (
            <div style={{
              background: 'rgba(212,168,67,0.06)',
              border: '1px solid rgba(212,168,67,0.15)',
              borderLeft: '4px solid #D4A843',
              borderRadius: 12,
              padding: '28px 32px',
              marginBottom: 24,
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr auto 1fr',
              gap: 0,
            }}>
              {/* LEFT — Intelligence IA */}
              <div style={{ paddingRight: 24 }}>
                <p style={{ color: '#D4A843', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>INTELLIGENCE IA</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {REORDER_RECS.slice(0, 3).map((rec) => (
                    <div key={rec.id} style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)' }}>
                      <span style={{ color: '#D4A843' }}>⚡</span>{' '}
                      <span style={{ color: '#fff', fontWeight: 600 }}>{rec.materiau}</span>{' '}
                      — commander {Number(rec.recommended_qty).toLocaleString('fr-FR')} {rec.unite} ({rec.urgency})
                    </div>
                  ))}
                  {REORDER_RECS.length === 0 && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Aucune recommandation active</p>
                  )}
                </div>
              </div>

              <div style={dividerStyle} />

              {/* CENTER — Santé Stock */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
                <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>SANTÉ STOCK</p>
                <p style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                  fontSize: 72, fontWeight: 200, letterSpacing: '-0.02em', lineHeight: 1, color: scoreColor,
                  WebkitFontSmoothing: 'antialiased' as any,
                }}>
                  {score}
                </p>
                <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Score IA temps réel</span>
              </div>

              <div style={dividerStyle} />

              {/* RIGHT — Alerte Prioritaire */}
              <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column' }}>
                <p style={{ color: topAlert ? alertColor : '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>ALERTE PRIORITAIRE</p>
                {topAlert ? (
                  <>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{topAlert.materiau}</p>
                    <span style={{
                      display: 'inline-block', width: 'fit-content',
                      padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                      background: `${alertColor}22`, color: alertColor, border: `1px solid ${alertColor}55`,
                      marginBottom: 8,
                    }}>
                      {topAlert.alert_type}
                    </span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 12 }}>
                      {topAlert.message.length > 100 ? topAlert.message.slice(0, 100) + '…' : topAlert.message}
                    </p>
                    <button style={{
                      marginTop: 'auto', padding: '10px 0', borderRadius: 8, width: '100%',
                      background: 'transparent', border: '1px solid rgba(212,168,67,0.4)',
                      color: '#D4A843', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#D4A843'; e.currentTarget.style.color = '#0F1629'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D4A843'; }}
                    >
                      → Agir maintenant
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Aucune alerte active</p>
                )}
              </div>
            </div>
          );
        })()}



        {/* ── PLAN DE RÉAPPROVISIONNEMENT + ALERTES — Two-column layout ── */}
        <div style={{ display: 'flex', gap: 24 }}>
          {/* LEFT — 60% Plan de Réapprovisionnement IA */}
          <div style={{ flex: '0 0 60%', minWidth: 0 }}>
            <SectionHeader icon={ShoppingCart} label="Plan de Réapprovisionnement IA" />
            {(() => {
              const items = REORDER_RECS;
              if (items.length === 0) {
                return (
                  <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ color: T.textDim, fontSize: 13 }}>Tous les stocks sont à niveau optimal</p>
                  </Card>
                );
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {items.map((item, idx) => {
                    const isCritique = item.urgency === 'critique' || item.urgency === 'urgent';
                    const isModere = item.urgency === 'modéré';
                    const leftBorderColor = isCritique ? '#ef4444' : isModere ? '#D4A843' : '#22c55e';
                    const urgColor = isCritique ? '#ef4444' : isModere ? '#f59e0b' : '#22c55e';
                    const urgBg = isCritique ? 'rgba(239,68,68,0.15)' : isModere ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)';
                    const urgBorder = isCritique ? 'rgba(239,68,68,0.4)' : isModere ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.4)';
                    const days = item.days_remaining;
                    return (
                      <div key={item.id} style={{
                        background: isCritique ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderLeft: `3px solid ${leftBorderColor}`,
                        borderRadius: 14, padding: '18px 16px',
                        display: 'flex', flexDirection: 'column', height: '100%',
                        position: 'relative',
                        opacity: 0, animation: `fadeSlideIn 500ms ${idx * 80}ms forwards`,
                      }}>
                        {/* Header with absolute badge */}
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontWeight: 600, fontSize: 18, color: '#fff' }}>{item.materiau}</span>
                          <span style={{
                            position: 'absolute', top: 16, right: 16,
                            padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                            background: urgBg, color: urgColor, border: `1px solid ${urgBorder}`,
                            animation: isCritique ? 'tbos-pulse 2s infinite' : 'none',
                          }}>
                            {item.urgency.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: T.textDim }}>Qté recommandée</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 15, color: '#fff' }}>
                              {Number(item.recommended_qty).toLocaleString('fr-FR')} {item.unite}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                            <span style={{ color: T.textDim, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Package size={11} style={{ opacity: 0.5 }} />Fournisseur
                            </span>
                            <span style={{ color: T.textSec, fontWeight: 500 }}>{item.fournisseur || 'À définir'}</span>
                          </div>
                          {days !== null && !isCritique && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: T.textDim }}>Autonomie</span>
                              <span style={{
                                fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                                color: Number(days) <= 5 ? '#f59e0b' : '#22c55e',
                              }}>
                                {Math.round(Number(days) * 10) / 10}j
                              </span>
                            </div>
                          )}
                          {isCritique && days !== null && (
                            <CritiqueCountdown daysRemaining={Number(days)} />
                          )}
                        </div>
                        <button style={{
                          marginTop: 'auto', padding: '10px 0', borderRadius: 8, width: '100%',
                          background: '#D4A843', border: 'none',
                          color: '#0F1629', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                          transition: 'all 150ms',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#D4A843'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          Créer Commande
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* RIGHT — 40% Alertes Stock */}
          <div style={{ flex: '0 0 calc(40% - 24px)', position: 'sticky', top: 16, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            {(() => {
              const dbAlerts = STOCK_ALERTS_DB;
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <AlertTriangle size={14} color={T.danger} />
                    <span style={{ color: T.danger, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Alertes Stock</span>
                    <Badge label={`${dbAlerts.length} actives`} color={dbAlerts.length > 0 ? T.danger : T.success} bg={dbAlerts.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'} pulse={dbAlerts.length > 0} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {dbAlerts.length === 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '24px 16px', textAlign: 'center' }}>
                        <p style={{ color: T.textDim, fontSize: 12 }}>Aucune alerte — stocks à niveau</p>
                      </div>
                    ) : (
                      dbAlerts.map((a, i) => {
                        const sevColor = a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#22c55e';
                        const sevBg = a.severity === 'critical' ? 'rgba(239,68,68,0.15)' : a.severity === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)';
                        const sevBorder = a.severity === 'critical' ? 'rgba(239,68,68,0.3)' : a.severity === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)';
                        return (
                          <div key={a.id} style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderLeft: `3px solid ${sevColor}`,
                            borderRadius: 10, padding: '12px 14px',
                            opacity: 0, animation: `fadeSlideIn 400ms ${i * 80}ms forwards`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: sevColor,
                                boxShadow: `0 0 8px ${sevColor}80`,
                                animation: a.severity === 'critical' ? 'tbos-pulse 2s infinite' : 'none',
                              }} />
                              <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{a.materiau}</span>
                              <span style={{
                                marginLeft: 'auto',
                                padding: '2px 8px', borderRadius: 999,
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                                background: sevBg, color: sevColor, border: `1px solid ${sevBorder}`,
                              }}>
                                {a.alert_type}
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: `${sevColor}cc`, marginBottom: 4 }}>
                              {a.message}
                            </p>
                            <p style={{ fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono, monospace' }}>
                              {a.severity.toUpperCase()} • {new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── MOUVEMENTS CHART ── */}
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
        </section>

        {/* ── SECTION 5: RECENT MOVEMENTS ── */}
        <section>
          <SectionHeader icon={ArrowUpDown} label="Derniers Mouvements" right={<LastUpdateTimer />} />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header row */}
              <div style={{ display: 'flex', gap: 14, padding: '0 14px 10px', borderBottom: `1px solid ${T.cardBorder}` }}>
                {['Type', 'Date', 'Matériau', 'Quantité', 'Référence', 'Responsable'].map(h => (
                  <span key={h} style={{ color: T.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{h}</span>
                ))}
              </div>
              {MOVEMENTS.map((m, i) => <MovementRow key={i} m={m} delay={i * 60} isFirst={i === 0} />)}
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
