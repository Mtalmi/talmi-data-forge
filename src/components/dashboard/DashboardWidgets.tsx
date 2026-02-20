import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  TruckIcon,
  Package,
  ArrowRight,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/i18n/I18nContext';
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
  PieChart, Pie,
} from 'recharts';

// ─── Pending Approvals Widget ────────────────────────────────────────────────
export function PendingApprovalsWidget() {
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from('approbations_ceo')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'en_attente');
      setCount(count || 0);
      setLoading(false);
    };
    fetchPending();
  }, []);

  return (
    <button
      onClick={() => navigate('/approbations')}
      className="god-tier-card p-4 w-full text-left group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${count > 0 ? 'bg-warning/10' : 'bg-success/10'}`}
            style={{ border: `1px solid hsl(${count > 0 ? 'var(--warning)' : 'var(--success)'} / 0.2)` }}>
            <CheckCircle2 className={`h-5 w-5 ${count > 0 ? 'text-warning' : 'text-success'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.widgets.approvals.title}</p>
            {loading ? (
              <div className="skeleton-god h-6 w-16 mt-1 rounded" />
            ) : (
              <p className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(51 100% 50%)' }}>
                {count}
                <span className="text-sm font-normal text-muted-foreground ml-1">{t.widgets.approvals.pending}</span>
              </p>
            )}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

// ─── Today's Pipeline Widget ─────────────────────────────────────────────────
export function TodaysPipelineWidget() {
  const { t } = useI18n();
  const [data, setData] = useState({
    plannedDeliveries: 0,
    inProgress: 0,
    delivered: 0,
    totalVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToday = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: bls } = await supabase
        .from('bons_livraison_reels')
        .select('volume_m3, workflow_status')
        .eq('date_livraison', today);

      if (bls) {
        const planned = bls.filter(b => b.workflow_status === 'planifie' || b.workflow_status === 'en_production').length;
        const inProgress = bls.filter(b => b.workflow_status === 'en_livraison').length;
        const delivered = bls.filter(b => b.workflow_status === 'livre' || b.workflow_status === 'facture').length;
        const totalVolume = bls.reduce((sum, b) => sum + (b.volume_m3 || 0), 0);
        setData({ plannedDeliveries: planned, inProgress, delivered, totalVolume });
      }
      setLoading(false);
    };
    fetchToday();
  }, []);

  const total = data.plannedDeliveries + data.inProgress + data.delivered;
  const progressPct = total > 0 ? (data.delivered / total) * 100 : 0;

  return (
    <div className="god-tier-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TruckIcon className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.pipeline.title}</h4>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton-god h-7 w-3/4 rounded" />
          <div className="skeleton-god h-2 w-full rounded-full" />
          <div className="skeleton-god h-12 w-full rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(51 100% 50%)' }}>
              {data.totalVolume.toFixed(0)} m³
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary)/0.2)' }}>
              {total} BL
            </span>
          </div>

          <Progress value={progressPct} className="h-1.5 mb-3" />

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[
              { label: t.widgets.pipeline.planned, value: data.plannedDeliveries, color: 'hsl(var(--muted-foreground))' },
              { label: t.widgets.pipeline.inProgress, value: data.inProgress, color: 'hsl(var(--warning))' },
              { label: t.widgets.pipeline.delivered, value: data.delivered, color: 'hsl(var(--success))' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-1.5 rounded-lg" style={{ background: 'hsl(var(--muted)/0.4)' }}>
                <p className="font-bold text-sm" style={{ fontFamily: 'JetBrains Mono, monospace', color }}>{value}</p>
                <p className="text-muted-foreground" style={{ fontSize: '10px' }}>{label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── AR Aging Widget — Recharts BarChart ─────────────────────────────────────
const AR_TOOLTIP = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#1E293B',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '8px 12px',
      }}>
        <p style={{ color: '#94A3B8', fontSize: 12 }}>{label}</p>
        <p style={{ color: '#FFD700', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          {payload[0].value.toLocaleString('fr-MA')} DH
        </p>
      </div>
    );
  }
  return null;
};

export function ARAgingWidget() {
  const { t } = useI18n();
  const [data, setData] = useState({
    current: 0, days30: 0, days60: 0, days90: 0, total: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAR = async () => {
      const { data: factures } = await supabase
        .from('factures')
        .select('total_ttc, date_facture, statut')
        .in('statut', ['emise', 'envoyee', 'partiel']);

      if (factures) {
        const now = new Date();
        let current = 0, days30 = 0, days60 = 0, days90 = 0;
        factures.forEach(f => {
          const daysDiff = Math.floor((now.getTime() - new Date(f.date_facture).getTime()) / 86400000);
          if (daysDiff <= 30) current += f.total_ttc;
          else if (daysDiff <= 60) days30 += f.total_ttc;
          else if (daysDiff <= 90) days60 += f.total_ttc;
          else days90 += f.total_ttc;
        });
        setData({ current, days30, days60, days90, total: current + days30 + days60 + days90 });
      }
      setLoading(false);
    };
    fetchAR();
  }, []);

  const chartData = [
    { label: '0-30j', value: data.current, fill: '#10B981' },
    { label: '31-60j', value: data.days30, fill: '#F59E0B' },
    { label: '61-90j', value: data.days60, fill: '#F97316' },
    { label: '>90j', value: data.days90, fill: '#EF4444' },
  ];

  return (
    <button
      onClick={() => navigate('/paiements')}
      className="god-tier-card p-4 w-full text-left group"
    >
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.arAging.title}</h4>
        <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
      </div>

      {loading ? (
        <div className="skeleton-god h-24 w-full rounded" />
      ) : (
        <>
          <p className="text-xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(51 100% 50%)' }}>
            {data.total.toLocaleString('fr-MA')} <span className="text-sm font-normal text-muted-foreground">DH</span>
          </p>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<AR_TOOLTIP />} cursor={{ fill: 'rgba(255,215,0,0.05)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} animationEasing="ease-out">
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </button>
  );
}

// ─── Stock Levels Widget — horizontal bars ────────────────────────────────────
export function StockLevelsWidget() {
  const { t } = useI18n();
  const [stocks, setStocks] = useState<{ materiau: string; niveau: number; seuil: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStocks = async () => {
      const { data: mouvements } = await supabase
        .from('mouvements_stock')
        .select('materiau, quantite_apres')
        .order('created_at', { ascending: false });
      const { data: alertes } = await supabase
        .from('alertes_reapprovisionnement')
        .select('materiau, seuil_alerte');

      if (mouvements && alertes) {
        const latestStocks: Record<string, number> = {};
        const seen = new Set<string>();
        mouvements.forEach(m => {
          if (!seen.has(m.materiau)) {
            latestStocks[m.materiau] = m.quantite_apres;
            seen.add(m.materiau);
          }
        });
        const thresholds: Record<string, number> = {};
        alertes.forEach(a => { thresholds[a.materiau] = a.seuil_alerte; });
        const stockData = Object.entries(latestStocks).map(([materiau, niveau]) => ({
          materiau, niveau, seuil: thresholds[materiau] || 0,
        })).slice(0, 4);
        setStocks(stockData);
      }
      setLoading(false);
    };
    fetchStocks();

    const channel = supabase
      .channel('dashboard-stocks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mouvements_stock' }, fetchStocks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getColor = (niveau: number, seuil: number) => {
    if (seuil === 0) return '#FFD700';
    const max = seuil * 2;
    const pct = niveau / max;
    if (pct < 0.2) return '#EF4444';
    if (pct < 0.4) return '#F59E0B';
    return '#10B981';
  };

  const STOCK_TOOLTIP = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px' }}>
          <p style={{ color: '#94A3B8', fontSize: 12 }}>{label}</p>
          <p style={{ color: payload[0]?.fill, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            {Number(payload[0]?.value).toLocaleString('fr-MA')}
          </p>
        </div>
      );
    }
    return null;
  };

  const chartData = stocks.map(s => ({
    name: s.materiau,
    value: s.niveau,
    max: s.seuil > 0 ? s.seuil * 2 : s.niveau * 2,
    color: getColor(s.niveau, s.seuil),
  }));

  return (
    <button
      onClick={() => navigate('/stocks')}
      className="god-tier-card p-4 w-full text-left group"
    >
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.stockLevels.title}</h4>
        <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-god h-5 w-full rounded" />)}
        </div>
      ) : chartData.length > 0 ? (
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barSize={12} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<STOCK_TOOLTIP />} cursor={{ fill: 'rgba(255,215,0,0.05)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1200} animationEasing="ease-out">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t.widgets.stockLevels.noStock}</p>
      )}
    </button>
  );
}

// ─── Sales Funnel Widget — DonutChart ─────────────────────────────────────────
const DONUT_TOOLTIP = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(51 100% 50% / 0.3)',
        borderRadius: '8px',
        padding: '8px 12px',
      }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: payload[0]?.fill }}>
          {payload[0]?.name}: {payload[0]?.value}
        </p>
      </div>
    );
  }
  return null;
};

export function SalesFunnelWidget() {
  const { t } = useI18n();
  const [data, setData] = useState({
    devisEnAttente: 0, devisAccepte: 0, bcActifs: 0, conversionRate: 0, totalDevisValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFunnel = async () => {
      const { data: devis } = await supabase.from('devis').select('statut, total_ht');
      const { data: bcs } = await supabase
        .from('bons_commande').select('statut').in('statut', ['confirme', 'en_cours', 'planifie']);

      if (devis) {
        const enAttente = devis.filter(d => d.statut === 'en_attente').length;
        const accepte = devis.filter(d => d.statut === 'accepte' || d.statut === 'converti').length;
        const total = devis.length;
        const conversionRate = total > 0 ? (accepte / total) * 100 : 0;
        const totalValue = devis.filter(d => d.statut === 'en_attente').reduce((sum, d) => sum + (d.total_ht || 0), 0);
        setData({ devisEnAttente: enAttente, devisAccepte: accepte, bcActifs: bcs?.length || 0, conversionRate, totalDevisValue: totalValue });
      }
      setLoading(false);
    };
    fetchFunnel();
  }, []);

  const pieData = [
    { name: t.widgets.salesFunnel.quotes, value: Math.max(data.devisEnAttente, 1), fill: '#FFD700' },
    { name: t.widgets.salesFunnel.activePOs, value: Math.max(data.bcActifs, 1), fill: '#3B82F6' },
  ];

  return (
    <button
      onClick={() => navigate('/ventes')}
      className="god-tier-card p-4 w-full text-left group"
    >
      <div className="flex items-center gap-2 mb-2">
        <ShoppingCart className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.salesFunnel.title}</h4>
        <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
      </div>

      {loading ? (
        <div className="skeleton-god h-24 w-full rounded" />
      ) : (
        <div className="flex items-center gap-3">
          {/* Donut */}
          <div className="relative flex-shrink-0">
            <PieChart width={72} height={72}>
              <Pie
                data={pieData}
                cx={31}
                cy={31}
                innerRadius={22}
                outerRadius={32}
                dataKey="value"
                strokeWidth={0}
                isAnimationActive
                animationDuration={800}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.9} />)}
              </Pie>
              <Tooltip content={<DONUT_TOOLTIP />} />
            </PieChart>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: 'hsl(51 100% 50%)' }}>
                {data.conversionRate.toFixed(0)}%
              </span>
            </div>
          </div>
          {/* Stats */}
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{t.widgets.salesFunnel.quotes}</span>
              <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FFD700' }}>{data.devisEnAttente}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{t.widgets.salesFunnel.activePOs}</span>
              <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#3B82F6' }}>{data.bcActifs}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{t.widgets.salesFunnel.pendingQuoteValue}</span>
              <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}>
                {(data.totalDevisValue / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
