import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  Package, AlertTriangle, ArrowUpDown, ShoppingCart,
  Droplets, Bell, ArrowUp, ArrowDown, TrendingUp, Zap,
} from 'lucide-react';
// PageHeader removed — using custom sticky tab bar
import { supabase } from '@/integrations/supabase/client';
import { MaterialPriceTracker } from '@/components/stocks/MaterialPriceTracker';
import { CostImpactSimulator } from '@/components/stocks/CostImpactSimulator';
import { SmartReorderQueue } from '@/components/stocks/SmartReorderQueue';
import { SurveillanceIATab } from '@/components/stocks/SurveillanceIATab';
import { MouvementsTab } from '@/components/stocks/MouvementsTab';
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
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
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
  const animated = useAnimatedCounter(value, 2000, decimals);
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const iconColor = isAlert && value > 0 ? T.danger : '#D4A843';
  const iconBg = isAlert && value > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212,168,67,0.15)';
  const valueColor = isAlert && value > 0 ? '#EF4444' : '#D4A843';

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (hov ? 'translateY(-1px)' : 'translateY(0)') : 'translateY(20px)',
        transition: 'all 200ms ease-out',
        height: '100%',
        background: hov ? 'rgba(212,168,67,0.03)' : 'transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderTop: '2px solid #D4A843',
        borderRadius: 9,
        border: '1px solid rgba(245,158,11,0.15)',
        borderTopWidth: 2,
        borderTopColor: '#D4A843',
        padding: '20px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        height: '100%',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
          <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 42, fontWeight: 100, color: valueColor, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString('fr-FR')}
            <span style={{ fontSize: 18, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>
          </p>
          {trend ? (
            trend.startsWith('Score') || trend.startsWith('score') ? (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, fontWeight: 500 }}>
                {trend}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: trendPositive ? '#22C55E' : '#EF4444', marginTop: 6, fontWeight: 500 }}>
                {trendPositive ? '↑' : '↓'} {trend}
              </p>
            )
          ) : (
            <p style={{ fontSize: 12, color: value > 0 ? '#EF4444' : '#22C55E', marginTop: 6, fontWeight: 500 }}>
              {value > 0 ? `⚠ ${value} critique${value > 1 ? 's' : ''}` : '✓ Aucune alerte'}
            </p>
          )}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={iconColor} />
        </div>
      </div>
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
      <button
        onClick={() => toast.info(`Réapprovisionnement ${alert.name} — consultez le Plan de Réapprovisionnement IA dans l'onglet Vue d'ensemble.`)}
        style={{
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
          fontWeight: 600, fontSize: 16, lineHeight: 1, color: '#ef4444',
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
// HERO SCORE COUNTER — count-up with easeOutExpo
// ─────────────────────────────────────────────────────
function HeroScoreCounter({ target }: { target: number }) {
  const value = useAnimatedCounter(target, 2000);
  return (
    <span style={{
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      fontSize: 64, fontWeight: 100, lineHeight: 1, letterSpacing: '-0.02em', color: '#D4A843',
      textShadow: '0 0 20px rgba(212,168,67,0.2)',
    }}>
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function WorldClassStocks({ silosContent, onNewMovement }: { silosContent?: React.ReactNode; onNewMovement?: () => void }) {
  const [activeTab, setActiveTab] = useState('silos');
  const { STOCKS, MOVEMENT_DATA, ALERTS, MOVEMENTS, VALUE_BREAKDOWN, AUTONOMY, SPARKLINES, STOCK_ALERTS_DB, REORDER_RECS, loading } = useStocksLiveData();
  const tabs = [
    { id: 'silos', label: 'SILOS' },
    { id: 'overview', label: "VUE D'ENSEMBLE" },
    { id: 'mouvements', label: 'MOUVEMENTS' },
    { id: 'alertes', label: 'SURVEILLANCE IA', hasPulse: true },
  ] as const;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes urgentGlow { 0%,100%{box-shadow:0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 20px rgba(239,68,68,0.15)} }
        @keyframes critiqueBorderPulse { 0%,100%{border-color:rgba(239,68,68,0.3);box-shadow:0 0 0 rgba(239,68,68,0)} 50%{border-color:rgba(239,68,68,0.7);box-shadow:0 0 16px rgba(239,68,68,0.12)} }
        @keyframes gaugeArc { from{stroke-dashoffset:${2 * Math.PI * 85}} to{stroke-dashoffset:var(--gauge-offset)} }
        @keyframes critiqueGlow { 0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.3)} 50%{box-shadow:0 0 20px rgba(239,68,68,0.6)} }
        @keyframes kpiShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes goldBtnGlow { 0%,100%{box-shadow:0 0 6px rgba(212,168,67,0.3)} 50%{box-shadow:0 0 20px rgba(212,168,67,0.6)} }
        @keyframes heroCountUp { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
        @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.5} }
        @keyframes sparkPulse { 0%,100%{r:3;opacity:1} 50%{r:5;opacity:0.6} }
        @keyframes survPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.4} }
        .kpi-shimmer { position:relative; border-radius:10px; padding:1px; background:linear-gradient(90deg, transparent 0%, rgba(212,168,67,0.4) 50%, transparent 100%); background-size:200% 100%; animation:kpiShimmer 3s linear infinite; }
        .kpi-shimmer > * { border-radius:9px; }
      `}</style>

      {/* ── STICKY TAB BAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'linear-gradient(145deg, #11182E, #162036)',
        borderBottom: '1px solid rgba(212,168,67,0.12)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                  color: isActive ? '#D4A843' : T.textDim,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {'hasPulse' in tab && tab.hasPulse && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'survPulse 2s infinite', flexShrink: 0 }} />
                  )}
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <button style={{
          padding: '8px 24px', borderRadius: 8, background: '#D4A843', color: '#0F1629',
          fontWeight: 600, fontSize: 14,
          border: 'none', cursor: 'pointer',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          transition: 'filter 150ms',
        }}
          onClick={() => onNewMovement ? onNewMovement() : toast.info('Utilisez les boutons d\'action dans l\'en-tête pour créer un mouvement.')}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          + Nouveau Mouvement
        </button>
      </div>

      {/* ── TAB: SILOS ── */}
      {activeTab === 'silos' && silosContent && (
        <div style={{ width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {silosContent}
        </div>
      )}

      {/* ── HERO SECTION (VUE D'ENSEMBLE only) ── */}
      {activeTab === 'overview' && (() => {
        const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
        const weights: Record<string, number> = { ciment: 0.30, gravette: 0.25, sable: 0.20, eau: 0.15, adjuvant: 0.10 };
        const tierScore = (d: number) => d >= 7 ? 100 : d >= 5 ? 75 : d >= 3 ? 50 : d >= 1 ? 25 : 0;
        let tw = 0, ws = 0;
        for (const [mat, w] of Object.entries(weights)) {
          const auto = AUTONOMY[mat];
          if (auto?.days != null) { ws += tierScore(auto.days) * w; tw += w; }
        }
        const heroScore = tw > 0 ? Math.round(ws / tw) : 0;

        const criticalCount = STOCK_ALERTS_DB.filter(a => a.severity === 'critical').length;
        const suggestedCount = REORDER_RECS.length;

        const allAutonomyDays = Object.values(AUTONOMY).map(a => a?.days).filter((d): d is number => d != null);
        const minAutonomy = allAutonomyDays.length > 0 ? Math.min(...allAutonomyDays) : 0;

        const topRec = [...REORDER_RECS].sort((a, b) => {
          const urgRank: Record<string, number> = { CRITIQUE: 3, URGENT: 3, critique: 3, urgent: 3, 'MODÉRÉ': 2, 'modéré': 2, OK: 1 };
          return (urgRank[b.urgency] || 0) - (urgRank[a.urgency] || 0);
        })[0];

        return (
          <div style={{
            background: 'rgba(212,168,67,0.04)',
            borderBottom: '1px solid rgba(212,168,67,0.12)',
            padding: '32px 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {(() => {
                const size = 180;
                const strokeW = 6;
                const r = (size - strokeW) / 2;
                const circ = 2 * Math.PI * r;
                const pct = Math.min(heroScore, 100) / 100;
                const offset = circ * (1 - pct);
                return (
                  <div style={{ position: 'relative', width: size, height: size }}>
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(15,22,41,0.8)" strokeWidth={strokeW} />
                      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D4A843" strokeWidth={strokeW}
                        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                        style={{
                          animation: 'gaugeArc 2s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
                          ['--gauge-offset' as any]: offset,
                        }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <HeroScoreCounter target={heroScore} />
                    </div>
                  </div>
                );
              })()}
              <p style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF', marginTop: 10 }}>État Général des Stocks</p>
              {topRec && (
                <p style={{ fontFamily: MONO, fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                  ⚡ {topRec.materiau} — commander{' '}
                  <span style={{ color: '#D4A843', fontWeight: 600 }}>{Number(topRec.recommended_qty).toLocaleString('fr-FR')} {topRec.unite}</span>{' '}
                  <span style={{ color: '#F59E0B' }}>({topRec.urgency})</span>
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Critical badge */}
              <div style={{
                border: '1px solid #EF4444', padding: '12px 20px', borderRadius: 999,
                fontSize: 13, color: '#EF4444', fontWeight: 500, fontFamily: MONO,
                background: 'rgba(239,68,68,0.08)',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0, animation: 'pulseDot 2s infinite' }} />
                {criticalCount} matériaux critiques
              </div>
              {/* Suggested badge */}
              <div style={{
                border: '1px solid #F59E0B', padding: '12px 20px', borderRadius: 999,
                fontSize: 13, color: '#F59E0B', fontWeight: 500, fontFamily: MONO,
                background: 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                {suggestedCount} commandes suggérées
              </div>
              {/* Autonomy badge */}
              <div style={{
                border: '1px solid #D4A843', padding: '12px 20px', borderRadius: 999,
                fontSize: 13, color: '#D4A843', fontWeight: 500, fontFamily: MONO,
                background: 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A843', flexShrink: 0 }} />
                Autonomie min: {minAutonomy}j
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CONTENT ── */}
      <div style={{ width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {activeTab === 'overview' && (<>
        {/* ── SECTION 1: KPIs ── */}
        {(() => {
          const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
          const hsWeights: Record<string, number> = { ciment: 0.30, gravette: 0.25, sable: 0.20, eau: 0.15, adjuvant: 0.10 };
          const hsTierScore = (d: number) => d >= 7 ? 100 : d >= 5 ? 75 : d >= 3 ? 50 : d >= 1 ? 25 : 0;
          let hsTotalW = 0, hsWSum = 0;
          for (const [mat, w] of Object.entries(hsWeights)) {
            const auto = AUTONOMY[mat];
            if (auto?.days != null) { hsWSum += hsTierScore(auto.days) * w; hsTotalW += w; }
          }
          const hsScore = hsTotalW > 0 ? Math.round(hsWSum / hsTotalW) : 0;
          const hsColor = hsScore >= 80 ? '#D4A843' : hsScore >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <section>
              <SectionHeader icon={TrendingUp} label="Indicateurs Clés" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
                <div className="kpi-shimmer"><KPICard label="Valeur Totale Stock" value={2.4} suffix="M DH" color={T.amber} icon={Package} trend="+5% vs mois dernier" trendPositive decimals={1} delay={0} /></div>
                <div className="kpi-shimmer"><KPICard label="Articles en Alerte" value={3} suffix="" color={T.danger} icon={AlertTriangle} trend="" trendPositive={false} delay={80} isAlert /></div>
                <div className="kpi-shimmer"><KPICard label="Mouvements Aujourd'hui" value={12} suffix="" color={T.amber} icon={ArrowUpDown} trend="+4 vs hier" trendPositive delay={160} /></div>
                <div className="kpi-shimmer"><KPICard label="Santé Stock IA" value={hsScore} suffix="" color={T.amber} icon={Zap} trend="Score IA temps réel" trendPositive={false} delay={240} /></div>
              </div>
            </section>
          );
        })()}

        {/* ── INTELLIGENCE COMMAND CARD ── */}
        {(() => {
          const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
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

          const severityRank: Record<string, number> = { critical: 3, warning: 2, info: 1 };
          const topAlert = [...STOCK_ALERTS_DB].sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))[0] || null;
          const alertColor = topAlert?.severity === 'critical' ? '#ef4444' : topAlert?.severity === 'warning' ? '#f59e0b' : '#22c55e';

          const dividerStyle: React.CSSProperties = { width: 1, background: 'rgba(212,168,67,0.12)', alignSelf: 'stretch' };

          return (
            <div style={{
              background: 'rgba(212,168,67,0.06)',
              borderTop: '2px solid #D4A843',
              border: '1px solid rgba(212,168,67,0.15)',
              borderTopWidth: 2,
              borderTopColor: '#D4A843',
              borderRadius: 12,
              padding: '28px 32px',
              marginBottom: 24,
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr auto 1fr',
              gap: 0,
            }}>
              {/* LEFT — Intelligence IA */}
              <div style={{ paddingRight: 24 }}>
                <p style={{ fontFamily: MONO, color: '#D4A843', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>✦ INTELLIGENCE IA</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {REORDER_RECS.slice(0, 3).map((rec) => {
                    const urgColor = (rec.urgency === 'critique' || rec.urgency === 'urgent') ? '#EF4444' : '#F59E0B';
                    return (
                      <div key={rec.id} style={{
                        borderLeft: '3px solid #F59E0B',
                        padding: '8px 12px',
                        background: 'rgba(245,158,11,0.03)',
                        marginBottom: 0,
                        fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)',
                      }}>
                        <span style={{ color: '#D4A843' }}>⚡</span>{' '}
                        <span style={{ color: '#fff', fontWeight: 500 }}>{rec.materiau}</span>{' '}
                        — commander{' '}
                        <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>{Number(rec.recommended_qty).toLocaleString('fr-FR')} {rec.unite}</span>{' '}
                        <span style={{ color: urgColor }}>({rec.urgency})</span>
                      </div>
                    );
                  })}
                  {REORDER_RECS.length === 0 && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Aucune recommandation active</p>
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, color: '#D4A843',
                    padding: '3px 10px', borderRadius: 999,
                    border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(212,168,67,0.06)',
                  }}>
                    Généré par IA · Claude Opus
                  </span>
                </div>
              </div>

              <div style={dividerStyle} />

              {/* CENTER — Tendance Santé Stock Sparkline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
                <p style={{ fontFamily: MONO, color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>TENDANCE SANTÉ STOCK</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
                  {(() => {
                    const trendData = [72, 75, 78, 81, 85, 87, score];
                    const w = 160, h = 120;
                    const pad = 10;
                    const minV = Math.min(...trendData) - 5;
                    const maxV = Math.max(...trendData) + 5;
                    const pts = trendData.map((v, i) => ({
                      x: pad + (i / (trendData.length - 1)) * (w - pad * 2),
                      y: pad + (1 - (v - minV) / (maxV - minV)) * (h - pad * 2),
                    }));
                    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaPath = `${linePath} L${pts[pts.length - 1].x} ${h} L${pts[0].x} ${h} Z`;
                    const lastPt = pts[pts.length - 1];
                    return (
                      <svg width={w} height={h} style={{ flexShrink: 0, minHeight: 120 }}>
                        <defs>
                          <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D4A843" stopOpacity={0.1} />
                            <stop offset="100%" stopColor="#D4A843" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#trendAreaFill)" />
                        <path d={linePath} fill="none" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={lastPt.x} cy={lastPt.y} r={3} fill="#D4A843" style={{ animation: 'sparkPulse 2s infinite' }} />
                      </svg>
                    );
                  })()}
                  <p style={{
                    fontFamily: MONO,
                    fontSize: 24, fontWeight: 200, letterSpacing: '-0.02em', lineHeight: 1, color: scoreColor,
                  }}>
                    {score}
                  </p>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>7 derniers jours</span>
              </div>

              <div style={dividerStyle} />

              {/* RIGHT — Alerte Prioritaire */}
              <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', borderTop: topAlert ? '2px solid #EF4444' : undefined, background: topAlert ? 'rgba(239,68,68,0.03)' : undefined, borderRadius: 8, padding: topAlert ? '16px 24px' : '0 0 0 24px' }}>
                <p style={{ fontFamily: MONO, color: topAlert ? alertColor : '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>ALERTE PRIORITAIRE</p>
                {topAlert ? (
                  <>
                    <p style={{ fontFamily: MONO, fontSize: 20, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{topAlert.materiau}</p>
                    <span style={{
                      display: 'inline-block', width: 'fit-content', fontFamily: MONO,
                      padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                      background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid #EF4444',
                      marginBottom: 8,
                    }}>
                      {topAlert.alert_type}
                    </span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 12 }}>
                      {topAlert.message.length > 100 ? topAlert.message.slice(0, 100) + '…' : topAlert.message}
                    </p>
                    <button
                      onClick={() => setActiveTab('alertes')}
                      style={{
                        marginTop: 'auto', padding: '10px 0', borderRadius: 8, width: '100%',
                        background: '#D4A843', border: 'none',
                        color: '#0F1629', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        fontFamily: MONO,
                        animation: 'goldBtnGlow 2s ease-in-out infinite',
                      }}
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

        {/* ── MATERIAL PRICE TRACKER ── */}
        <MaterialPriceTracker />

        {/* ── COST IMPACT SIMULATOR ── */}
        <CostImpactSimulator />

        {/* ── SMART REORDER QUEUE + ALERTES ── */}
        <div style={{ display: 'flex', gap: 24 }}>
          {/* LEFT — 65% Smart Reorder Queue */}
          <div style={{ flex: '0 0 65%', minWidth: 0 }}>
            <SmartReorderQueue />
          </div>

          {/* RIGHT — 35% Alertes Stock */}
          <div style={{ flex: '0 0 calc(35% - 24px)', position: 'sticky', top: 16, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            {(() => {
              const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
              const dbAlerts = STOCK_ALERTS_DB;
              return (
                <div>
                  <div style={{ borderTop: '2px solid #EF4444', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <AlertTriangle size={14} color="#EF4444" />
                    <span style={{ fontFamily: MONO, color: '#D4A843', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>ALERTES STOCK</span>
                    <Badge label={`${dbAlerts.length} actives`} color={dbAlerts.length > 0 ? '#EF4444' : T.success} bg={dbAlerts.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'} pulse={dbAlerts.length > 0} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {dbAlerts.length === 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '24px 16px', textAlign: 'center' }}>
                        <p style={{ color: T.textDim, fontSize: 12 }}>Aucune alerte — stocks à niveau</p>
                      </div>
                    ) : (
                      dbAlerts.map((a, i) => {
                        const sevColor = a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#D4A843';
                        const leftBorder = a.alert_type === 'seuil_bas' ? '#ef4444' : a.alert_type === 'consommation_élevée' ? '#f59e0b' : '#D4A843';
                        return (
                          <div key={a.id} style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: leftBorder,
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
                              <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: '#fff' }}>{a.materiau}</span>
                              <span style={{
                                marginLeft: 'auto',
                                padding: '2px 8px', borderRadius: 999,
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: MONO,
                                background: a.alert_type === 'seuil_bas' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                                color: a.alert_type === 'seuil_bas' ? '#EF4444' : '#F59E0B',
                                border: `1px solid ${a.alert_type === 'seuil_bas' ? '#EF4444' : '#F59E0B'}`,
                              }}>
                                {a.alert_type}
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                              {a.message}
                            </p>
                            <p style={{ fontFamily: MONO, fontSize: 10, color: a.severity === 'critical' ? '#EF4444' : T.textDim }}>
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
        </>)}

        {/* ── TAB: MOUVEMENTS ── */}
        {activeTab === 'mouvements' && (
          <MouvementsTab MOVEMENT_DATA={MOVEMENT_DATA} MOVEMENTS={MOVEMENTS} VALUE_BREAKDOWN={VALUE_BREAKDOWN} />
        )}

        {/* ── TAB: SURVEILLANCE IA ── */}
        {activeTab === 'alertes' && (
          <SurveillanceIATab />
        )}

        {/* footer removed */}
      </div>
    </div>
  );
}
