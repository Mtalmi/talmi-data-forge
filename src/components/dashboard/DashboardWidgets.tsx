import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  TruckIcon, 
  Package, 
  AlertTriangle,
  ArrowRight,
  FileText,
  ShoppingCart,
  Wallet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/i18n/I18nContext';

// Pending Approvals Widget
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
      className="card-industrial p-4 w-full text-left hover:border-primary/50 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${count > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
            <CheckCircle2 className={`h-5 w-5 ${count > 0 ? 'text-warning' : 'text-success'}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.widgets.approvals.title}</p>
            <p className="text-xl font-bold">
              {loading ? '...' : count}
              <span className="text-sm font-normal text-muted-foreground ml-1">{t.widgets.approvals.pending}</span>
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

// Today's Pipeline Widget
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
    <div className="card-industrial p-4">
      <div className="flex items-center gap-2 mb-3">
        <TruckIcon className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.pipeline.title}</h4>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-2 bg-muted rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-2xl font-bold mb-2">
            <span>{data.totalVolume.toFixed(0)} m³</span>
            <Badge variant={total > 0 ? 'default' : 'secondary'}>
              {total} BL
            </Badge>
          </div>
          
          <Progress value={progressPct} className="h-2 mb-3" />
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 rounded bg-muted/30">
              <p className="font-semibold">{data.plannedDeliveries}</p>
              <p className="text-muted-foreground">{t.widgets.pipeline.planned}</p>
            </div>
            <div className="text-center p-2 rounded bg-warning/10">
              <p className="font-semibold text-warning">{data.inProgress}</p>
              <p className="text-muted-foreground">{t.widgets.pipeline.inProgress}</p>
            </div>
            <div className="text-center p-2 rounded bg-success/10">
              <p className="font-semibold text-success">{data.delivered}</p>
              <p className="text-muted-foreground">{t.widgets.pipeline.delivered}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Accounts Receivable Aging Widget
export function ARAgingWidget() {
  const { t } = useI18n();
  const [data, setData] = useState({
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    total: 0,
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
          const invoiceDate = new Date(f.date_facture);
          const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          
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

  return (
    <button
      onClick={() => navigate('/paiements')}
      className="card-industrial p-4 w-full text-left hover:border-primary/50 transition-all group"
    >
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.arAging.title}</h4>
        <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
      </div>

      {loading ? (
        <div className="animate-pulse h-16 bg-muted rounded"></div>
      ) : (
        <>
          <p className="text-2xl font-bold mb-3">
            {(data.total / 1000).toFixed(0)}K <span className="text-sm font-normal">DH</span>
          </p>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">0-30j</span>
              <span className="font-medium">{(data.current / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">31-60j</span>
              <span className={`font-medium ${data.days30 > 0 ? 'text-warning' : ''}`}>
                {(data.days30 / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">61-90j</span>
              <span className={`font-medium ${data.days60 > 0 ? 'text-warning' : ''}`}>
                {(data.days60 / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">&gt;90j</span>
              <span className={`font-medium ${data.days90 > 0 ? 'text-destructive' : ''}`}>
                {(data.days90 / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </>
      )}
    </button>
  );
}

// Stock Levels Mini Widget
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
        const seenMaterials = new Set<string>();
        
        mouvements.forEach(m => {
          if (!seenMaterials.has(m.materiau)) {
            latestStocks[m.materiau] = m.quantite_apres;
            seenMaterials.add(m.materiau);
          }
        });

        const thresholds: Record<string, number> = {};
        alertes.forEach(a => {
          thresholds[a.materiau] = a.seuil_alerte;
        });

        const stockData = Object.entries(latestStocks).map(([materiau, niveau]) => ({
          materiau,
          niveau,
          seuil: thresholds[materiau] || 0,
        })).slice(0, 4);

        setStocks(stockData);
      }
      setLoading(false);
    };
    fetchStocks();

    const channel = supabase
      .channel('dashboard-stocks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, () => fetchStocks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mouvements_stock' }, () => fetchStocks())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getStockColor = (niveau: number, seuil: number) => {
    if (seuil === 0) return 'bg-primary';
    const ratio = niveau / seuil;
    if (ratio < 1) return 'bg-destructive';
    if (ratio < 1.5) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <button
      onClick={() => navigate('/stocks')}
      className="card-industrial p-4 w-full text-left hover:border-primary/50 transition-all group"
    >
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.stockLevels.title}</h4>
        <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-muted rounded"></div>
          ))}
        </div>
      ) : stocks.length > 0 ? (
        <div className="space-y-2">
          {stocks.map((s) => (
            <div key={s.materiau} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16 truncate">{s.materiau}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStockColor(s.niveau, s.seuil)} transition-all`}
                  style={{ width: `${Math.min((s.niveau / (s.seuil * 2)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono">{s.niveau.toFixed(0)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t.widgets.stockLevels.noStock}</p>
      )}
    </button>
  );
}

// Sales Funnel Widget
export function SalesFunnelWidget() {
  const { t } = useI18n();
  const [data, setData] = useState({
    devisEnAttente: 0,
    devisAccepte: 0,
    bcActifs: 0,
    conversionRate: 0,
    totalDevisValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFunnel = async () => {
      const { data: devis } = await supabase
        .from('devis')
        .select('statut, total_ht');

      const { data: bcs } = await supabase
        .from('bons_commande')
        .select('statut')
        .in('statut', ['confirme', 'en_cours', 'planifie']);

      if (devis) {
        const enAttente = devis.filter(d => d.statut === 'en_attente').length;
        const accepte = devis.filter(d => d.statut === 'accepte' || d.statut === 'converti').length;
        const total = devis.length;
        const conversionRate = total > 0 ? (accepte / total) * 100 : 0;
        const totalValue = devis
          .filter(d => d.statut === 'en_attente')
          .reduce((sum, d) => sum + (d.total_ht || 0), 0);

        setData({
          devisEnAttente: enAttente,
          devisAccepte: accepte,
          bcActifs: bcs?.length || 0,
          conversionRate,
          totalDevisValue: totalValue,
        });
      }
      setLoading(false);
    };
    fetchFunnel();
  }, []);

  return (
    <button
      onClick={() => navigate('/ventes')}
      className="card-industrial p-4 w-full text-left hover:border-primary/50 transition-all group"
    >
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t.widgets.salesFunnel.title}</h4>
        <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
      </div>

      {loading ? (
        <div className="animate-pulse h-20 bg-muted rounded"></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded bg-muted/30">
              <p className="text-lg font-bold">{data.devisEnAttente}</p>
              <p className="text-xs text-muted-foreground">{t.widgets.salesFunnel.quotes}</p>
            </div>
            <div className="text-center p-2 rounded bg-primary/10">
              <p className="text-lg font-bold text-primary">{data.bcActifs}</p>
              <p className="text-xs text-muted-foreground">{t.widgets.salesFunnel.activePOs}</p>
            </div>
            <div className="text-center p-2 rounded bg-success/10">
              <p className="text-lg font-bold text-success">{data.conversionRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">{t.widgets.salesFunnel.conversion}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t.widgets.salesFunnel.pendingQuoteValue}</span>
            <span className="font-semibold">{(data.totalDevisValue / 1000).toFixed(0)}K DH</span>
          </div>
        </>
      )}
    </button>
  );
}
