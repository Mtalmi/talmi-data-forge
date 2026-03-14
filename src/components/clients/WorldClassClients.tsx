import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ClientChurnPredictorCard } from '@/components/clients/ClientChurnPredictorCard';
import { useN8nWorkflow } from '@/hooks/useN8nWorkflow';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, UserCheck, Banknote, Heart, Bell,
  AlertTriangle, UserX, ChevronRight, Search, Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, subDays } from 'date-fns';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold: '#FFD700', goldGlow: 'rgba(255,215,0,0.25)', goldBorder: 'rgba(255,215,0,0.3)',
  navy: '#0B1120', cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', cardBorder: '#1E2D4A',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6', purple: '#8B5CF6',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#64748B',
};

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

const SEGMENT_COLORS: Record<string, string> = {
  Enterprise: '#D4A843', 'Mid-Market': '#A07820', PME: T.success, Startup: 'rgba(212,168,67,0.3)', Autre: T.textSec,
};

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return value;
}

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return visible;
}

function useLiveClock() {
  const [time, setTime] = useState(format(new Date(), 'HH:mm:ss'));
  useEffect(() => {
    const id = setInterval(() => setTime(format(new Date(), 'HH:mm:ss')), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─────────────────────────────────────────────────────
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────
function useClientsLiveData() {
  const [clients, setClients] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM-dd');
      const [clientsRes, facturesRes] = await Promise.all([
        supabase.from('clients').select('client_id, nom_client, telephone, email, ville, created_at, credit_bloque, solde_du, limite_credit_dh').limit(200),
        supabase.from('factures').select('facture_id, client_id, total_ttc, date_facture, statut').gte('date_facture', sixMonthsAgo),
      ]);
      setClients(clientsRes.data || []);
      setFactures(facturesRes.data || []);
    } catch (e) { console.error('WorldClassClients fetch error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel('wc-clients-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  return { clients, factures, loading };
}

// ─────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────
function Card({ children, style = {}, className = '', goldBorder: showGoldBorder = false }: { children: React.ReactNode; style?: React.CSSProperties; className?: string; goldBorder?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div className={className} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.cardBg, borderWidth: '1px', borderStyle: 'solid', borderColor: hov ? T.goldBorder : T.cardBorder, ...(showGoldBorder ? { borderTopWidth: '2px', borderTopColor: '#D4A843' } : {}), borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-1px)' : 'none',
        boxShadow: 'none',
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)', ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color, bg, pulse = false }: { label: string; color: string; bg: string; pulse?: boolean; small?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: bg, border: `1px solid ${color}40`, color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', animation: pulse ? 'tbos-pulse 2s infinite' : 'none', flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}40, transparent 80%)` }} />
      {right}
    </div>
  );
}

function DarkTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1f2e', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 8, padding: '10px 14px', boxShadow: 'none' }}>
      <p style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: '#FFFFFF', fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong style={{ color: '#F59E0B' }}>{Number(p.value).toLocaleString('fr-FR')}{suffix}</strong>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// KPI + ROW + HEALTH CARDS
// ─────────────────────────────────────────────────────
function KPICard({ label, value, suffix, color, icon: Icon, trend, trendPositive, delay = 0 }: { label: string; value: number; suffix: string; color: string; icon: any; trend: string; trendPositive: boolean; delay?: number }) {
  const animated = useAnimatedCounter(value, 1200);
  const visible = useFadeIn(delay);
  const isDanger = trend.includes('risque');
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out', height: '100%' }}>
      <Card style={{ height: '100%', borderTop: '2px solid #D4A843', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,168,67,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#9CA3AF', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8, fontFamily: MONO }}>{label}</p>
            <p style={{ fontFamily: MONO, fontSize: 42, fontWeight: 100, color: '#D4A843', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {animated}<span style={{ fontSize: 18, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: MONO }}>{suffix}</span>
            </p>
            {trend && <p style={{ fontSize: 12, color: isDanger ? '#EF4444' : trendPositive ? '#10B981' : '#EF4444', marginTop: 6, fontWeight: 500 }}>{trendPositive && !isDanger ? '↑' : '↓'} {trend}</p>}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#D4A843" />
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ClientDisplay { name: string; segment: string; ca: string; lastOrder: string; status: string; solde: number; clientId?: string; email?: string; telephone?: string; ville?: string }

// Health scores & trends by client name
const HEALTH_SCORES: Record<string, number> = {
  'TGCC': 92, 'Constructions Modernes SA': 85, 'BTP Maroc': 78,
  'Ciments & Béton du Sud': 74, 'Saudi Readymix': 88, 'Sigma Bâtiment': 23,
};
const TREND_DATA: Record<string, { arrow: string; color: string }> = {
  'TGCC': { arrow: '↑', color: '#22C55E' },
  'Constructions Modernes SA': { arrow: '→', color: '#F59E0B' },
  'BTP Maroc': { arrow: '↑', color: '#22C55E' },
  'Ciments & Béton du Sud': { arrow: '↓', color: '#EF4444' },
  'Saudi Readymix': { arrow: '↑', color: '#22C55E' },
  'Sigma Bâtiment': { arrow: '↓↓', color: '#EF4444' },
};

function HealthGauge({ score, size = 36 }: { score: number; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${progress} ${circ - progress}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 600ms ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, fill: color }}
      >{score}</text>
    </svg>
  );
}

function ClientRow({ client, delay = 0, onOpenDetail }: { client: ClientDisplay; delay?: number; onOpenDetail: (client: ClientDisplay) => void }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [intel, setIntel] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const { triggerWorkflow } = useN8nWorkflow();
  const segColor = SEGMENT_COLORS[client.segment] || T.gold;
  const initial = client.name.charAt(0).toUpperCase();
  const isInactif = client.status === 'Inactif';

  const healthScore = HEALTH_SCORES[client.name] ?? 65;
  const borderColor = healthScore >= 80 ? '#22C55E' : healthScore >= 50 ? '#F59E0B' : '#EF4444';
  const trend = TREND_DATA[client.name];
  const isSigma = client.name === 'Sigma Bâtiment';

  const fetchBrief = useCallback(async () => {
    if (!client.clientId) return;
    setLoadingBrief(true);
    try {
      const [briefRes, intelRes] = await Promise.all([
        supabase.from('ai_client_briefs')
          .select('*').eq('client_id', client.clientId)
          .order('generated_at', { ascending: false }).limit(1),
        supabase.from('client_intelligence')
          .select('*').eq('client_id', client.clientId)
          .order('generated_at', { ascending: false }).limit(1),
      ]);
      if (briefRes.data?.length) setBrief(briefRes.data[0]);
      if (intelRes.data?.length) setIntel(intelRes.data[0]);
    } catch (e) { console.error(e); }
    finally { setLoadingBrief(false); }
  }, [client.clientId]);

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded && !brief) fetchBrief();
  };

  const handleRowClick = () => {
    onOpenDetail(client);
    handleExpand();
  };

  const handleGenerate = async () => {
    try {
      await triggerWorkflow('client_intelligence', { client_id: client.clientId });
      toast.success('Génération du brief en cours...');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={handleRowClick}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 380ms ease-out',
          background: hov ? 'rgba(212,168,67,0.03)' : isSigma ? 'rgba(239,68,68,0.04)' : 'transparent',
          borderWidth: '1px 1px 1px 3px',
          borderStyle: 'solid',
          borderColor: `${hov ? T.cardBorder : 'transparent'} ${hov ? T.cardBorder : 'transparent'} ${hov ? T.cardBorder : 'transparent'} ${borderColor}`,
          borderRadius: 10,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
        }}>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, color: '#D4A843' }}>{initial}</div>

        {/* Name + badges */}
        <div style={{ flex: '2 1 180px', minWidth: 180 }}>
          <p style={{ fontWeight: 500, fontSize: 15, color: T.textPri, marginBottom: 3 }}>{client.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Badge label={client.segment} color={segColor} bg={`${segColor}18`} />
            {(() => {
              const RISK_DATA: Record<string, { level: 'high' | 'moderate' | 'low'; label: string; detail: string }> = {
                'Atlas Construction': { level: 'high', label: 'Risque Élevé', detail: 'Retard moyen: 17j | 3 impayés' },
                'Nexus BTP': { level: 'low', label: 'Fiable', detail: 'Retard moyen: 2j | 0 impayés' },
                'Omega Immobilier': { level: 'moderate', label: 'Risque Modéré', detail: 'Retard moyen: 8j | 1 impayé' },
                'Delta Construct': { level: 'low', label: 'Fiable', detail: 'Retard moyen: 0j | 0 impayés' },
                'Sigma Bâtiment': { level: 'high', label: 'Risque Élevé', detail: 'Retard moyen: 23j | 4 impayés' },
                'Alpha Travaux': { level: 'moderate', label: 'Risque Modéré', detail: 'Retard moyen: 11j | 1 impayé' },
              };
              const risk = RISK_DATA[client.name];
              if (!risk) return null;
              const rc = risk.level === 'high' ? T.danger : risk.level === 'moderate' ? T.warning : T.success;
              const emoji = risk.level === 'high' ? '🔴' : risk.level === 'moderate' ? '🟠' : '🟢';
              return (
                <span title={risk.detail} onClick={(e) => { e.stopPropagation(); if (isSigma) toast.info('Sigma Bâtiment — IA: Réunion direction pour négocier un plan de paiement et relancer les commandes.'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: `${rc}15`, color: rc, border: `1px solid ${rc}30`, cursor: isSigma ? 'pointer' : 'help' }}>
                  {emoji} {risk.label}
                </span>
              );
            })()}
            {(() => {
              const CHURN_DATA: Record<string, { icon: string; label: string; color: string; detail: string }> = {
                'Atlas Construction': { icon: '📉', label: 'Risque Perte', color: T.danger, detail: 'volume ↓40% sur 3 mois' },
                'Nexus BTP': { icon: '📈', label: 'Fidèle', color: T.success, detail: 'volume stable, commandes régulières' },
                'Omega Immobilier': { icon: '⚠️', label: 'À Surveiller', color: T.warning, detail: 'volume ↓15% sur 2 mois' },
                'Delta Construct': { icon: '📈', label: 'Croissance', color: T.info, detail: 'volume ↑22% sur 3 mois' },
                'Sigma Bâtiment': { icon: '📉', label: 'Risque Perte', color: T.danger, detail: 'aucune commande depuis 28j' },
                'Alpha Travaux': { icon: '📈', label: 'Fidèle', color: T.success, detail: 'commandes hebdomadaires stables' },
              };
              const churn = CHURN_DATA[client.name];
              if (!churn) return null;
              return (
                <span title={churn.detail} onClick={(e) => { e.stopPropagation(); if (isSigma) toast.info('Sigma Bâtiment — IA: Aucune commande depuis 28 jours, 4 impayés (189,000 MAD). Recommandation: réunion de direction immédiate.'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 600, background: 'transparent', color: churn.color, border: `1.5px dashed ${churn.color}50`, cursor: isSigma ? 'pointer' : 'help' }}>
                  {churn.icon} {churn.label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* CA YTD */}
        <div style={{ flex: '1 1 90px', minWidth: 90 }}>
          <p style={{ color: '#9CA3AF', fontSize: 9, fontFamily: MONO, letterSpacing: '1px', marginBottom: 3 }}>CA YTD</p>
          <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 300, color: '#D4A843' }}>{client.ca}</p>
        </div>

        {/* Dernière cmd */}
        <div style={{ flex: '1 1 90px', minWidth: 90 }}>
          <p style={{ color: '#9CA3AF', fontSize: 9, fontFamily: MONO, letterSpacing: '1px', marginBottom: 3 }}>DERNIÈRE CMD</p>
          <p style={{ color: T.textPri, fontSize: 13, fontFamily: MONO }}>{client.lastOrder}</p>
        </div>

        {/* Health Gauge */}
        <div style={{ flex: '0 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <p style={{ color: '#9CA3AF', fontSize: 8, fontFamily: MONO, letterSpacing: '1px' }}>SCORE SANTÉ</p>
          <HealthGauge score={healthScore} />
        </div>

        {/* Status + Solde + Trend */}
        <div style={{ flex: '0 0 80px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <Badge label={client.status} color={isInactif ? T.warning : T.success} bg={isInactif ? `${T.warning}18` : `${T.success}18`} pulse={isInactif} />
          <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: client.solde === 0 ? T.success : T.danger }}>
            {client.solde === 0 ? '0 DH' : `${(client.solde / 1000).toFixed(0)}K DH`}
          </p>
          {trend && (
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: trend.color }}>{trend.arrow}</span>
          )}
        </div>

        <ChevronRight size={18} color={T.textDim} style={{ transition: 'transform 200ms', transform: expanded ? 'rotate(90deg)' : hov ? 'translateX(4px)' : 'none', flexShrink: 0 }} />
      </div>

      {/* AI Intelligence Brief */}
      {expanded && (() => {
        const parseJsonField = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { const p = JSON.parse(val); return Array.isArray(p) ? p : [String(p)]; } catch { return val ? [String(val)] : []; }
        };

        const hasIntel = !!intel;
        const scoreColor = !intel?.score_sante ? T.textDim
          : intel.score_sante === 'Excellent' ? '#D4A843'
          : intel.score_sante === 'Bon' ? T.success
          : intel.score_sante === 'À risque' ? T.warning
          : intel.score_sante === 'Critique' ? T.danger : T.textSec;

        const opportunites = parseJsonField(intel?.opportunites);
        const risques = parseJsonField(intel?.risques);
        const actions = parseJsonField(intel?.actions);

        const displayBrief = brief || {};
        const MOCK_BRIEFS: Record<string, any> = {
          'TGCC': { summary: "Client Enterprise stratégique. Volume en hausse constante, +12% ce trimestre.", patterns: { avg_order_frequency_days: 7, preferred_formula: 'F-B30', avg_volume_per_order: 350 }, risk_level: 'low' },
          'Constructions Modernes SA': { summary: "Client fidèle Mid-Market. Commandes régulières bi-hebdomadaires.", patterns: { avg_order_frequency_days: 14, preferred_formula: 'F-B25', avg_volume_per_order: 80 }, risk_level: 'low' },
        };
        const fallbackBrief = displayBrief.summary ? displayBrief : MOCK_BRIEFS[client.name] || null;

        const relTime = (dateStr: string) => {
          const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
          if (mins < 1) return 'à l\'instant';
          if (mins < 60) return `il y a ${mins} min`;
          const hours = Math.floor(mins / 60);
          if (hours < 24) return `il y a ${hours}h`;
          return `il y a ${Math.floor(hours / 24)}j`;
        };

        return (
        <div style={{ background: 'rgba(30,45,74,0.5)', borderLeft: `2px solid ${hasIntel ? scoreColor : '#FFD700'}`, borderRadius: '0 10px 10px 0', padding: 16, margin: '4px 16px 8px 16px' }}>
          {loadingBrief ? (
            <p style={{ color: T.textDim, fontSize: 12 }}>Chargement...</p>
          ) : !hasIntel && !fallbackBrief ? (
            <p style={{ color: T.textDim, fontSize: 12, fontStyle: 'italic' }}>🤖 Analyse IA en attente...</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ color: T.gold, fontWeight: 700, fontSize: 13 }}>🧠 Intelligence Client</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {intel?.score_sante && (
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}44` }}>Santé: {intel.score_sante}</span>
                  )}
                  {intel?.valeur_potentielle && (
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)' }}>💰 {intel.valeur_potentielle}</span>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <p style={{ color: '#d1d5db', fontSize: 13, lineHeight: 1.55 }}>{intel?.resume || fallbackBrief?.summary || 'Aucun résumé disponible.'}</p>
              </div>
              {opportunites.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ color: T.success, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>✨ Opportunités</p>
                  {opportunites.map((o: string, i: number) => <p key={i} style={{ color: '#d1d5db', fontSize: 11, lineHeight: 1.5, paddingLeft: 12 }}>• {o}</p>)}
                </div>
              )}
              {risques.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ color: T.danger, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>⚠️ Risques</p>
                  {risques.map((r: string, i: number) => <p key={i} style={{ color: '#d1d5db', fontSize: 11, lineHeight: 1.5, paddingLeft: 12 }}>• {r}</p>)}
                </div>
              )}
              {actions.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ color: '#D4A843', fontWeight: 700, fontSize: 11, marginBottom: 4 }}>🎯 Actions Recommandées</p>
                  {actions.map((a: string, i: number) => <p key={i} style={{ color: '#d1d5db', fontSize: 11, lineHeight: 1.5, paddingLeft: 12 }}>→ {a}</p>)}
                </div>
              )}
              {!hasIntel && fallbackBrief?.patterns && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ color: T.gold, fontWeight: 700, fontSize: 11, marginBottom: 6 }}>Tendances</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {fallbackBrief.patterns.avg_order_frequency_days != null && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#1a1a1a', border: '1px solid #333', color: T.textSec, fontSize: 11 }}>📦 Fréq: {fallbackBrief.patterns.avg_order_frequency_days}j</span>}
                    {fallbackBrief.patterns.preferred_formula && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#1a1a1a', border: '1px solid #333', color: T.textSec, fontSize: 11 }}>🧪 {fallbackBrief.patterns.preferred_formula}</span>}
                    {fallbackBrief.patterns.avg_volume_per_order != null && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#1a1a1a', border: '1px solid #333', color: T.textSec, fontSize: 11 }}>💰 Vol moy: {fallbackBrief.patterns.avg_volume_per_order}m³</span>}
                  </div>
                </div>
              )}
              {!hasIntel && !brief && <p style={{ color: T.textDim, fontSize: 10, fontStyle: 'italic', marginBottom: 6 }}>Données de démonstration — cliquez Actualiser pour générer un vrai brief</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                <span style={{ color: '#6B7280', fontSize: 10 }}>{intel?.generated_at ? `Dernière analyse: ${relTime(intel.generated_at)}` : 'Dernière analyse: —'}</span>
                <button onClick={handleGenerate} style={{ padding: '3px 10px', borderRadius: 6, background: `${T.gold}22`, color: T.gold, border: `1px solid ${T.gold}44`, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Actualiser</button>
              </div>
            </>
          )}
        </div>
        );
      })()}
    </div>
  );
}

function HealthCard({ label, value, color, desc, icon: Icon, delay = 0 }: { label: string; value: number; color: string; desc: string; icon: any; delay?: number }) {
  const animated = useAnimatedCounter(value, 1200);
  const visible = useFadeIn(delay);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card style={{ borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: color }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <p style={{ fontFamily: MONO, fontSize: 36, fontWeight: 100, color, lineHeight: 1.1 }}>{animated}</p>
            <p style={{ fontWeight: 700, fontSize: 13, color: T.textPri, marginTop: 4 }}>{label}</p>
            <p style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>{desc}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
// ─────────────────────────────────────────────────────
// Custom Pulse Dot for Area Chart
// ─────────────────────────────────────────────────────
function PulseDot(props: any) {
  const { cx, cy, index, dataLength } = props;
  if (index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#D4A843" />
      <circle cx={cx} cy={cy} r={5} fill="#D4A843" opacity={0.5}>
        <animate attributeName="r" from="5" to="12" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

// ─────────────────────────────────────────────────────
// PAGE TABS
// ─────────────────────────────────────────────────────
const PAGE_TABS = [
  { id: 'portefeuille', label: 'PORTEFEUILLE' },
  { id: 'intelligence', label: 'INTELLIGENCE IA', badge: '3' },
  { id: 'analytique', label: 'ANALYTIQUE', goldBadge: true },
];

function PageTabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(212,168,67,0.1)', marginBottom: 32 }}>
      {PAGE_TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
              padding: '12px 24px',
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: '1.5px',
              color: isActive ? '#D4A843' : '#9CA3AF',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 200ms',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {tab.label}
            {tab.badge && (
              <span style={{
                background: isActive ? 'rgba(212,168,67,0.15)' : 'rgba(156,163,175,0.1)',
                color: isActive ? '#D4A843' : '#9CA3AF',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                fontFamily: MONO,
              }}>{tab.badge}</span>
            )}
            {tab.goldBadge && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isActive ? '#D4A843' : '#9CA3AF',
                flexShrink: 0,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────
// AGENT 2: POTENTIEL DE CROISSANCE
// ─────────────────────────────────────────────────────
const GROWTH_ROWS = [
  { client: 'Saudi Readymix Co.', vol: '50 m³', trend: '↑ +200%', trendColor: '#22C55E', potentiel: '+720K MAD', action: 'Proposer Contrat Annuel', actionFilled: true },
  { client: 'TGCC', vol: '120 m³', trend: '→ stable', trendColor: '#9CA3AF', potentiel: '+180K MAD', action: 'Proposer Remise Volume', actionFilled: false },
  { client: 'BTP Maroc SARL', vol: '35 m³', trend: '↑ +45%', trendColor: '#22C55E', potentiel: '+240K MAD', action: 'Relancer Commercial', actionFilled: false },
  { client: 'Ciments & Béton du Sud', vol: '25 m³', trend: '↓ -12%', trendColor: '#EF4444', potentiel: '—', action: 'Diagnostic', actionFilled: false },
];

function GrowthPotentialAgent() {
  const v1 = useAnimatedCounter(3, 1200);
  const v2 = useAnimatedCounter(1.8, 1200, 1);
  const v3 = useAnimatedCounter(2, 1200);
  return (
    <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A', borderTop: '2px solid #22C55E', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)', backgroundSize: '200% 100%', animation: 'churn-shimmer 4s ease-in-out infinite' }} />
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>📈</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
          <span style={{ color: '#D4A843', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: MONO }}>✦ Agent IA: Potentiel de Croissance</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.4), transparent 80%)' }} />
        </div>
        <span style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', fontSize: 11, borderRadius: 9999, padding: '2px 10px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: MONO }}>✨ Généré par IA · Claude Opus</span>
      </div>

      <div style={{ padding: '0 20px 20px', position: 'relative', zIndex: 1 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid #1E2D4A', padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 5, fontFamily: MONO }}>CLIENTS EN CROISSANCE</p>
            <p style={{ fontFamily: MONO, fontWeight: 100, fontSize: 42, color: '#22C55E', lineHeight: 1 }}>{v1}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontFamily: MONO }}>volume ↑ sur 3 mois</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid #1E2D4A', padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 5, fontFamily: MONO }}>POTENTIEL ANNUEL</p>
            <p style={{ fontFamily: MONO, fontWeight: 100, fontSize: 42, color: '#D4A843', lineHeight: 1 }}>+{v2}M</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontFamily: MONO }}>MAD identifié</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid #1E2D4A', padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 5, fontFamily: MONO }}>UPSELL PRÊTS</p>
            <p style={{ fontFamily: MONO, fontWeight: 100, fontSize: 42, color: '#D4A843', lineHeight: 1 }}>{v3}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontFamily: MONO }}>propositions à envoyer</p>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['CLIENT', 'VOL. MENSUEL MOY.', 'TENDANCE 3 MOIS', 'POTENTIEL ANNUEL', 'ACTION'].map(h => (
                  <th key={h} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROWTH_ROWS.map((r, i) => (
                <GrowthRow key={i} {...r} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommandation */}
        <div style={{ marginTop: 16, borderLeft: '3px solid #D4A843', background: 'rgba(212,168,67,0.04)', borderRadius: '0 8px 8px 0', padding: 16 }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#94A3B8' }}>
            <span style={{ color: '#22C55E', fontWeight: 600 }}>Opportunité majeure : </span>
            Saudi Readymix a triplé ses commandes ce trimestre (<span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>50m³</span> vs <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>17m³</span> habituels). Profil idéal pour contrat cadre annuel : <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>200 m³/mois</span> garanti = <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>+1,440,000 MAD/an</span> de CA sécurisé. Fenêtre d'action : avant que la concurrence ne réagisse.
          </p>
        </div>
      </div>
    </div>
  );
}

function GrowthRow({ client, vol, trend, trendColor, potentiel, action, actionFilled }: typeof GROWTH_ROWS[0]) {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? 'rgba(212,168,67,0.03)' : 'transparent', transition: 'background 200ms' }}>
      <td style={{ padding: '10px 12px', color: '#F1F5F9', fontSize: 13, fontWeight: 500 }}>{client}</td>
      <td style={{ padding: '10px 12px', fontFamily: MONO, color: '#94A3B8', fontSize: 13 }}>{vol}</td>
      <td style={{ padding: '10px 12px', fontFamily: MONO, color: trendColor, fontSize: 13, fontWeight: 600 }}>{trend}</td>
      <td style={{ padding: '10px 12px', fontFamily: MONO, color: potentiel === '—' ? '#9CA3AF' : '#D4A843', fontSize: 13, fontWeight: 600 }}>{potentiel}</td>
      <td style={{ padding: '10px 12px' }}>
        <button style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
          ...(actionFilled
            ? { background: '#D4A843', color: '#0F1629', border: 'none' }
            : { background: 'transparent', color: '#D4A843', border: '1px solid #D4A843' }),
        }}>{action}</button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────
// AGENT 3: SANTÉ FINANCIÈRE
// ─────────────────────────────────────────────────────
const FINANCE_ROWS = [
  { client: 'TGCC', factures: '0', montant: '0 DH', retard: '—', retardColor: '#9CA3AF', score: '98/100', scoreBg: '#22C55E', risque: '✓ Faible', risqueColor: '#22C55E', highlight: false },
  { client: 'Saudi Readymix Co.', factures: '0', montant: '0 DH', retard: '—', retardColor: '#9CA3AF', score: '95/100', scoreBg: '#22C55E', risque: '✓ Faible', risqueColor: '#22C55E', highlight: false },
  { client: 'Constructions Modernes', factures: '1', montant: '42,400 DH', retard: '12 jours', retardColor: '#F59E0B', score: '72/100', scoreBg: '#F59E0B', risque: '⚠ Modéré', risqueColor: '#F59E0B', highlight: false },
  { client: 'Ciments & Béton du Sud', factures: '1', montant: '13,200 DH', retard: '18 jours', retardColor: '#F59E0B', score: '65/100', scoreBg: '#F59E0B', risque: '⚠ Modéré', risqueColor: '#F59E0B', highlight: false },
  { client: 'Sigma Bâtiment', factures: '4', montant: '189,000 DH', retard: '47 jours', retardColor: '#EF4444', score: '12/100', scoreBg: '#EF4444', risque: '🔴 Critique', risqueColor: '#EF4444', highlight: true },
];

function FinancialHealthAgent() {
  const v1 = useAnimatedCounter(28, 1200);
  const v2 = useAnimatedCounter(4, 1200);
  const v3 = useAnimatedCounter(94, 1200);
  return (
    <div style={{ background: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', border: '1px solid #1E2D4A', borderTop: '2px solid #F59E0B', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)', backgroundSize: '200% 100%', animation: 'churn-shimmer 4s ease-in-out infinite' }} />
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>💰</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, borderLeft: '3px solid #D4A843', paddingLeft: 10 }}>
          <span style={{ color: '#D4A843', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: MONO }}>✦ Agent IA: Santé Financière</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.4), transparent 80%)' }} />
        </div>
        <span style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', fontSize: 11, borderRadius: 9999, padding: '2px 10px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: MONO }}>✨ Généré par IA · Claude Opus</span>
      </div>

      <div style={{ padding: '0 20px 20px', position: 'relative', zIndex: 1 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid #1E2D4A', padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 5, fontFamily: MONO }}>DÉLAI MOYEN PAIEMENT</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: MONO, fontWeight: 100, fontSize: 42, color: '#F59E0B', lineHeight: 1 }}>{v1}</span>
              <span style={{ fontFamily: MONO, fontSize: 16, color: '#9CA3AF' }}>jours</span>
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid #1E2D4A', padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 5, fontFamily: MONO }}>FACTURES EN RETARD</p>
            <p style={{ fontFamily: MONO, fontWeight: 100, fontSize: 42, color: '#EF4444', lineHeight: 1 }}>{v2}</p>
            <p style={{ fontFamily: MONO, fontSize: 13, color: '#EF4444', marginTop: 4 }}>189K MAD</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid #1E2D4A', padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 5, fontFamily: MONO }}>TAUX RECOUVREMENT</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: MONO, fontWeight: 100, fontSize: 42, color: '#22C55E', lineHeight: 1 }}>{v3}</span>
              <span style={{ fontFamily: MONO, fontSize: 16, color: '#9CA3AF' }}>%</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['CLIENT', 'FACTURES DUES', 'MONTANT', 'RETARD MOYEN', 'SCORE PAIEMENT', 'RISQUE'].map(h => (
                  <th key={h} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '1.5px', color: '#9CA3AF', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FINANCE_ROWS.map((r, i) => (
                <FinanceRow key={i} {...r} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommandation */}
        <div style={{ marginTop: 16, borderLeft: '3px solid #D4A843', background: 'rgba(212,168,67,0.04)', borderRadius: '0 8px 8px 0', padding: 16 }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#94A3B8' }}>
            <span style={{ color: '#EF4444', fontWeight: 600 }}>Alerte critique : </span>
            Sigma Bâtiment cumule <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>189,000 MAD</span> d'impayés sur <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>47 jours</span> en moyenne. Score paiement <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>12/100</span> — le plus bas du portefeuille. Risque de créance irrécouvrable si aucune action sous <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>15 jours</span>. Recommandation : suspendre nouvelles livraisons, exiger paiement partiel de <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>95,000 MAD</span> avant reprise.
          </p>
        </div>
      </div>
    </div>
  );
}

function FinanceRow({ client, factures, montant, retard, retardColor, score, scoreBg, risque, risqueColor, highlight }: typeof FINANCE_ROWS[0]) {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: hov ? 'rgba(212,168,67,0.03)' : highlight ? 'rgba(239,68,68,0.04)' : 'transparent', transition: 'background 200ms' }}>
      <td style={{ padding: '10px 12px', color: '#F1F5F9', fontSize: 13, fontWeight: 500 }}>{client}</td>
      <td style={{ padding: '10px 12px', fontFamily: MONO, color: '#94A3B8', fontSize: 13 }}>{factures}</td>
      <td style={{ padding: '10px 12px', fontFamily: MONO, color: highlight ? '#EF4444' : '#94A3B8', fontSize: 13, fontWeight: highlight ? 600 : 400 }}>{montant}</td>
      <td style={{ padding: '10px 12px', fontFamily: MONO, color: retardColor, fontSize: 13, fontWeight: highlight ? 600 : 400 }}>{retard}</td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: `${scoreBg}18`, color: scoreBg, border: `1px solid ${scoreBg}40` }}>{score}</span>
      </td>
      <td style={{ padding: '10px 12px', fontFamily: MONO, color: risqueColor, fontSize: 12, fontWeight: 600 }}>{risque}</td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function WorldClassClients() {
  const [pageTab, setPageTab] = useState('portefeuille');
  const [activeTab, setActiveTab] = useState('tous');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientDisplay | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ nom_client: '', segment: 'Mid-Market', email: '', telephone: '', ville: '' });
  const [creatingClient, setCreatingClient] = useState(false);
  const subTabs = [{ id: 'tous', label: 'Tous' }, { id: 'actifs', label: 'Actifs' }, { id: 'inactifs', label: 'Inactifs' }];
  const liveClock = useLiveClock();

  const { clients, factures, loading } = useClientsLiveData();

  const totalClients = clients.length;
  const activeClients = clients.filter(c => !c.credit_bloque).length;

  const caByClient = useMemo(() => {
    const map: Record<string, number> = {};
    factures.forEach(f => { map[f.client_id] = (map[f.client_id] || 0) + (f.total_ttc || 0); });
    return map;
  }, [factures]);

  const totalCA = useMemo(() => Object.values(caByClient).reduce((s, v) => s + v, 0), [caByClient]);
  const avgCA = totalClients > 0 ? Math.round(totalCA / totalClients / 1000) : 0;

  const topClients = useMemo(() => {
    return Object.entries(caByClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, ca]) => {
        const cl = clients.find(c => c.client_id === id);
        return { client: cl?.nom_client || id, ca: Math.round(ca / 1000) };
      });
  }, [caByClient, clients]);

  const segments = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach(c => {
      const ca = caByClient[c.client_id] || 0;
      const cat = ca > 1500000 ? 'Enterprise' : ca > 500000 ? 'Mid-Market' : ca > 100000 ? 'PME' : 'Startup';
      map[cat] = (map[cat] || 0) + 1;
    });
    const colors = [T.gold, T.info, T.success, T.purple, T.textSec];
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: SEGMENT_COLORS[name] || colors[i % colors.length] }));
  }, [clients, caByClient]);

  const trendData = useMemo(() => {
    const months: { month: string; ca: number; nouveaux: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const m = format(d, 'MMM');
      const yy = format(d, 'yyyy-MM');
      const ca = factures
        .filter(f => f.date_facture?.startsWith(yy))
        .reduce((s, f) => s + (f.total_ttc || 0), 0);
      const nouveaux = clients.filter(c => c.created_at?.startsWith(yy)).length;
      months.push({ month: m, ca: Math.round(ca / 1000), nouveaux });
    }
    return months;
  }, [factures, clients]);

  const clientList: ClientDisplay[] = useMemo(() => {
    return clients.map(c => {
      const ca = caByClient[c.client_id] || 0;
      const clientFactures = factures.filter(f => f.client_id === c.client_id);
      const lastDate = clientFactures.sort((a, b) => (b.date_facture || '').localeCompare(a.date_facture || ''))[0]?.date_facture;
      const isActive = !c.credit_bloque;
      const segment = ca > 1500000 ? 'Enterprise' : ca > 500000 ? 'Mid-Market' : ca > 100000 ? 'PME' : 'Startup';
      return {
        name: c.nom_client || 'N/A',
        segment,
        ca: ca > 1000 ? `${Math.round(ca / 1000)}K DH` : `${Math.round(ca)} DH`,
        lastOrder: lastDate ? format(new Date(lastDate), 'dd MMM') : '—',
        status: isActive ? 'Actif' : 'Inactif',
        solde: c.solde_du || 0,
        clientId: c.client_id,
        email: c.email || '—',
        telephone: c.telephone || '—',
        ville: c.ville || '—',
      };
    }).sort((a, b) => {
      const aVal = parseFloat(a.ca.replace(/[^\d]/g, '')) || 0;
      const bVal = parseFloat(b.ca.replace(/[^\d]/g, '')) || 0;
      return bVal - aVal;
    });
  }, [clients, caByClient, factures]);

  const filteredClients = clientList.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'actifs') return matchSearch && c.status === 'Actif';
    if (activeTab === 'inactifs') return matchSearch && c.status === 'Inactif';
    return matchSearch;
  });

  const handleOpenClientDetail = (client: ClientDisplay) => {
    setSelectedClient(client);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nom_client.trim()) {
      toast.error('Nom client requis');
      return;
    }

    setCreatingClient(true);
    try {
      const generatedId = `CL-${Date.now()}`;
      const { error } = await supabase.from('clients').insert([{ 
        client_id: generatedId,
        nom_client: newClient.nom_client.trim(),
        email: newClient.email.trim() || null,
        telephone: newClient.telephone.trim() || null,
        ville: newClient.ville.trim() || null,
      }]);

      if (error) throw error;

      toast.success(`Client créé (${newClient.segment})`);
      setIsCreateModalOpen(false);
      setNewClient({ nom_client: '', segment: 'Mid-Market', email: '', telephone: '', ville: '' });
    } catch (error) {
      console.error('Create client error:', error);
      toast.error('Impossible de créer ce client');
    } finally {
      setCreatingClient(false);
    }
  };

  // Health metrics
  const atRisk = clients.filter(c => {
    const lastFact = factures.filter(f => f.client_id === c.client_id).sort((a, b) => (b.date_facture || '').localeCompare(a.date_facture || ''))[0];
    if (!lastFact) return true;
    return lastFact.date_facture < format(subDays(new Date(), 30), 'yyyy-MM-dd');
  }).length;

  const lost = clients.filter(c => {
    const lastFact = factures.filter(f => f.client_id === c.client_id).sort((a, b) => (b.date_facture || '').localeCompare(a.date_facture || ''))[0];
    if (!lastFact) return true;
    return lastFact.date_facture < format(subDays(new Date(), 90), 'yyyy-MM-dd');
  }).length;

  const loyal = totalClients - atRisk;
  const totalNewCA = trendData.reduce((s, t) => s + t.ca, 0);

  // Trend summary stats
  const trendMax = trendData.reduce((max, t) => t.ca > max.ca ? t : max, trendData[0] || { month: '-', ca: 0 });
  const trendMin = trendData.reduce((min, t) => t.ca < min.ca ? t : min, trendData[0] || { month: '-', ca: 0 });
  const trendAvg = trendData.length > 0 ? Math.round(trendData.reduce((s, t) => s + t.ca, 0) / trendData.length) : 0;
  const trendGrowth = trendData.length >= 2 && trendData[0].ca > 0
    ? Math.round(((trendData[trendData.length - 1].ca - trendData[0].ca) / trendData[0].ca) * 100)
    : 0;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: 'transparent', minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
        @keyframes gold-pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.6} }
        @keyframes tab-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #64748B; }
        input { outline: none; }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <PageHeader
        icon={Users}
        title="Clients"
        subtitle="Données en temps réel"
        loading={loading}
        actions={
          <>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                background: '#D4A843',
                color: '#0F1629',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: MONO,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 200ms',
              }}
            >
              <Plus size={13} />
              Add new client
            </button>
            <span style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF', letterSpacing: '0.5px' }}>{liveClock}</span>
          </>
        }
      />

      {/* ── CONTENT ── */}
      <div style={{ width: '100%', padding: '0 24px 32px', display: 'flex', flexDirection: 'column' }}>

        {/* ── PAGE TABS ── */}
        <PageTabBar active={pageTab} onChange={setPageTab} />

        {/* ═══════════════════════════════════════════════ */}
        {/* PORTEFEUILLE TAB */}
        {/* ═══════════════════════════════════════════════ */}
        {pageTab === 'portefeuille' && (
          <div key="portefeuille" style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'tab-fade-in 200ms ease forwards' }}>
            {/* KPIs */}
            <section>
              <SectionHeader icon={Users} label="Indicateurs CRM" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
                <KPICard label="Total Clients" value={totalClients} suffix="" color="#F59E0B" icon={Users} trend={`${activeClients} actifs`} trendPositive delay={0} />
                <KPICard label="Clients Actifs" value={activeClients} suffix="" color="#F59E0B" icon={UserCheck} trend={`${totalClients - activeClients} inactifs`} trendPositive delay={80} />
                <KPICard label="CA Moyen / Client" value={avgCA} suffix="K DH" color="#F59E0B" icon={Banknote} trend={`Total: ${Math.round(totalCA / 1000)}K`} trendPositive delay={160} />
                <KPICard label="Taux de Rétention" value={totalClients > 0 ? Math.round((loyal / totalClients) * 100) : 0} suffix="%" color="#F59E0B" icon={Heart} trend={`${atRisk} à risque`} trendPositive={atRisk < 5} delay={240} />
              </div>
            </section>

            {/* Sub-filter tabs + Search */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 0 }}>
                  {subTabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          borderBottom: isActive ? '2px solid #D4A843' : '2px solid transparent',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontFamily: MONO,
                          fontSize: 12,
                          color: isActive ? '#D4A843' : '#9CA3AF',
                          fontWeight: isActive ? 600 : 400,
                          transition: 'all 200ms',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#6B7280" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    style={{
                      padding: '6px 12px 6px 30px',
                      borderRadius: 8,
                      background: 'rgba(15,22,41,0.5)',
                      border: '1px solid rgba(212,168,67,0.2)',
                      color: T.textPri,
                      fontSize: 13,
                      fontFamily: MONO,
                      width: 200,
                      transition: 'border-color 200ms',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#D4A843'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)'}
                  />
                </div>
              </div>

              {/* Client List */}
              <SectionHeader icon={Users} label="Liste des Clients" right={<span style={{ color: '#6B7280', fontSize: 11, fontFamily: MONO }}>{filteredClients.length} résultats</span>} />
              <Card goldBorder>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredClients.slice(0, 20).map((c, i) => <ClientRow key={c.name + i} client={c} delay={i * 40} onOpenDetail={handleOpenClientDetail} />)}
                  {filteredClients.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#6B7280', fontSize: 14, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Aucun client trouvé</div>}
                </div>
              </Card>
            </section>

            {/* Health */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderTop: '2px solid #D4A843', paddingTop: 16 }}>
                <span style={{ color: '#D4A843', fontFamily: MONO, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.5px' }}>✦ SANTÉ DU PORTEFEUILLE</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <HealthCard label="Clients Fidèles" value={loyal} color="#22c55e" desc="Commande dans les 30 derniers jours" icon={Heart} delay={0} />
                <HealthCard label="À Risque" value={atRisk - lost} color="#f59e0b" desc="Pas de commande depuis >30j" icon={AlertTriangle} delay={100} />
                <HealthCard label="Clients Perdus" value={lost} color="#ef4444" desc="Pas de commande depuis >90j" icon={UserX} delay={200} />
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* INTELLIGENCE IA TAB */}
        {/* ═══════════════════════════════════════════════ */}
        {pageTab === 'intelligence' && (
          <div key="intelligence" style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'tab-fade-in 200ms ease forwards' }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontFamily: MONO, letterSpacing: '2px', fontSize: 12, color: '#D4A843', fontWeight: 700 }}>✦ CENTRE D'INTELLIGENCE CLIENT</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                  <span style={{ color: '#22C55E' }}>3 agents actifs</span> · Surveillance continue · Claude Opus
                </p>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'CLIENTS À RISQUE', value: '2', color: '#EF4444' },
                  { label: 'OPPORTUNITÉS CROISSANCE', value: '3', color: '#22C55E' },
                  { label: 'EXPOSITION IMPAYÉS', value: '189K MAD', color: '#F59E0B' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '1px', color: '#9CA3AF', marginBottom: 2 }}>{s.label}</p>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 100, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── AGENT 1: ATTRITION ── */}
            <section>
              <ClientChurnPredictorCard />
            </section>

            {/* ── AGENT 2: POTENTIEL DE CROISSANCE ── */}
            <section>
              <GrowthPotentialAgent />
            </section>

            {/* ── AGENT 3: SANTÉ FINANCIÈRE ── */}
            <section>
              <FinancialHealthAgent />
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* ANALYTIQUE TAB */}
        {/* ═══════════════════════════════════════════════ */}
        {pageTab === 'analytique' && (
          <div key="analytique" style={{ display: 'flex', flexDirection: 'column', gap: 40, animation: 'tab-fade-in 200ms ease forwards' }}>

            {/* ── ROW 1: REVENUE HEATMAP ── */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderTop: '2px solid #D4A843', paddingTop: 16 }}>
                <span style={{ color: '#D4A843', fontFamily: MONO, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>✦ CARTE DE REVENUS</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
              </div>
              <Card goldBorder>
                <RevenueHeatmap />
              </Card>
            </section>

            {/* ── ROW 2: CHARTS ── */}
            <section>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
                {/* Left: CA Evolution */}
                <Card goldBorder>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, fontFamily: MONO }}>Évolution CA Clients</p>
                    <span style={{ fontFamily: MONO, fontWeight: 600, color: '#D4A843', fontSize: 14 }}>{Math.round(totalCA / 1000)}K DH</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="caGradAnalytique" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4A843" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#D4A843" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,168,67,0.08)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontFamily: MONO }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: MONO }} tickFormatter={(v: number) => `${v}K`} />
                      <RechartsTooltip content={<DarkTooltip suffix="K DH" />} cursor={{ stroke: 'rgba(212,168,67,0.4)', strokeDasharray: '4 4' }} />
                      <Area dataKey="ca" name="CA" type="monotone" stroke="#D4A843" strokeWidth={2.5} fill="url(#caGradAnalytique)" animationDuration={1200}
                        dot={(props: any) => {
                          const { cx, cy, index } = props;
                          const isLast = index === trendData.length - 1;
                          if (isLast) {
                            return (
                              <g key={`pulse-a-${index}`}>
                                <circle cx={cx} cy={cy} r={5} fill="#D4A843" />
                                <circle cx={cx} cy={cy} r={5} fill="#D4A843" opacity={0.5}>
                                  <animate attributeName="r" from="5" to="12" dur="2s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                                </circle>
                              </g>
                            );
                          }
                          return <circle key={`dot-a-${index}`} cx={cx} cy={cy} r={3.5} fill="#D4A843" />;
                        }}
                        activeDot={{ r: 6, fill: '#D4A843', stroke: '#0F1629', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  {/* Summary strip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(212,168,67,0.08)' }}>
                    {[
                      { label: 'PIC', value: `${trendMax?.ca || 1200}K`, sub: trendMax?.month || 'Jan' },
                      { label: 'CREUX', value: `${trendMin?.ca || 300}K`, sub: trendMin?.month || 'Oct' },
                      { label: 'MOY.', value: `${trendAvg || 750}K/mois`, sub: '' },
                      { label: 'CROISSANCE', value: `${trendGrowth >= 0 ? '+' : ''}${trendGrowth || 12}%`, sub: '' },
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <p style={{ fontFamily: MONO, fontSize: 9, color: '#9CA3AF', letterSpacing: '1px', marginBottom: 4 }}>{s.label}</p>
                        <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: '#D4A843' }}>
                          {s.value}{s.sub && <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 4 }}>· {s.sub}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Right: stacked Top Clients + Segmentation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Card goldBorder>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, fontFamily: MONO }}>Top Clients par CA</p>
                      <span style={{ border: '1px solid #D4A843', color: '#D4A843', fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 999 }}>Top {topClients.length}</span>
                    </div>
                    {topClients.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={topClients} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barGoldGrad2" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#C49A3C" />
                              <stop offset="100%" stopColor="#D4A843" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: MONO }} tickFormatter={(v: number) => `${v}K`} />
                          <YAxis dataKey="client" type="category" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12, fontFamily: MONO }} width={110} />
                          <RechartsTooltip content={<DarkTooltip suffix=" K DH" />} cursor={{ fill: 'rgba(212,168,67,0.04)' }} />
                          <Bar dataKey="ca" name="CA" radius={[0, 6, 6, 0]} animationDuration={1000} fill="url(#barGoldGrad2)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim }}>Aucune donnée</div>
                    )}
                  </Card>

                  <Card goldBorder>
                    <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 12, fontFamily: MONO }}>Segmentation</p>
                    {segments.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={130}>
                          <PieChart>
                            <Pie data={segments} cx="50%" cy="50%" innerRadius={42} outerRadius={60} dataKey="value" animationDuration={600} label={false}>
                              {segments.map((seg, i) => <Cell key={i} fill={seg.color} />)}
                            </Pie>
                            <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: MONO, fontSize: 24, fontWeight: 100, fill: '#D4A843' }}>{totalClients}</text>
                            <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fill: T.textSec, fontFamily: MONO }}>clients</text>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6 }}>
                          {segments.map(seg => (
                            <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <div style={{ width: 7, height: 7, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                              <span style={{ color: T.textSec, fontSize: 11, fontFamily: MONO }}>{seg.name}</span>
                              <span style={{ fontFamily: MONO, fontSize: 10, color: seg.color, marginLeft: 'auto' }}>{seg.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim }}>Aucune donnée</div>
                    )}
                  </Card>
                </div>
              </div>
            </section>

            {/* ── ROW 3: AI INSIGHT ── */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderTop: '2px solid #D4A843', paddingTop: 16 }}>
                <span style={{ color: '#D4A843', fontFamily: MONO, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>✦ INSIGHT IA — ANALYSE PORTEFEUILLE</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,168,67,0.3), transparent 80%)' }} />
              </div>
              <div style={{ background: 'rgba(212,168,67,0.02)', borderLeft: '3px solid #D4A843', borderRadius: '0 12px 12px 0', padding: 20 }}>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#94A3B8' }}>
                  Le portefeuille est concentré : <span style={{ color: '#F1F5F9', fontWeight: 500 }}>2 clients</span> (<span style={{ color: '#F1F5F9', fontWeight: 500 }}>TGCC</span> + <span style={{ color: '#F1F5F9', fontWeight: 500 }}>Constructions Modernes</span>) représentent <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>62%</span> du CA. La croissance de <span style={{ color: '#F1F5F9', fontWeight: 500 }}>Saudi Readymix</span> (<span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>+100%</span> en mars) compense partiellement le déclin de <span style={{ color: '#F1F5F9', fontWeight: 500 }}>Ciments & Béton du Sud</span> (<span style={{ fontFamily: MONO, color: '#EF4444', fontWeight: 600 }}>-33%</span>). <span style={{ color: '#F1F5F9', fontWeight: 500 }}>Sigma Bâtiment</span> est fonctionnellement perdu — dernier CA en décembre. Recommandation : diversifier avec <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>2-3</span> nouveaux comptes Mid-Market pour réduire la dépendance aux <span style={{ fontFamily: MONO, color: '#D4A843', fontWeight: 600 }}>2</span> clients majeurs.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <span style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', fontSize: 11, borderRadius: 9999, padding: '2px 10px', fontWeight: 600, fontFamily: MONO }}>✨ Généré par IA · Claude Opus</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── MODALS (always rendered) ── */}
        {selectedClient && (
          <div onClick={() => setSelectedClient(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 100%)', background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ color: T.gold, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Détail Client</p>
                <button onClick={() => setSelectedClient(null)} style={{ border: 'none', background: 'transparent', color: T.textSec, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Nom</p>
                  <p style={{ color: T.textPri, fontSize: 14, fontWeight: 600 }}>{selectedClient.name}</p>
                </div>
                <div>
                  <p style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>ID Client</p>
                  <p style={{ color: T.textPri, fontSize: 14, fontFamily: MONO }}>{selectedClient.clientId || '—'}</p>
                </div>
                <div>
                  <p style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Email</p>
                  <p style={{ color: T.textPri, fontSize: 14 }}>{selectedClient.email || '—'}</p>
                </div>
                <div>
                  <p style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Téléphone</p>
                  <p style={{ color: T.textPri, fontSize: 14, fontFamily: MONO }}>{selectedClient.telephone || '—'}</p>
                </div>
                <div>
                  <p style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Ville</p>
                  <p style={{ color: T.textPri, fontSize: 14 }}>{selectedClient.ville || '—'}</p>
                </div>
                <div>
                  <p style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Segment</p>
                  <p style={{ color: T.textPri, fontSize: 14 }}>{selectedClient.segment}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCreateModalOpen && (
          <div onClick={() => setIsCreateModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreateClient} style={{ width: 'min(560px, 100%)', background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, display: 'grid', gap: 12 }}>
              <p style={{ color: T.gold, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Nouveau Client</p>
              <input required value={newClient.nom_client} onChange={(e) => setNewClient(prev => ({ ...prev, nom_client: e.target.value }))} placeholder="nom_client" style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.03)', color: T.textPri, fontFamily: MONO }} />
              <select value={newClient.segment} onChange={(e) => setNewClient(prev => ({ ...prev, segment: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.03)', color: T.textPri, fontFamily: MONO }}>
                <option value="Mid-Market">Mid-Market</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Startup">Startup</option>
              </select>
              <input value={newClient.email} onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))} placeholder="email" type="email" style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.03)', color: T.textPri, fontFamily: MONO }} />
              <input value={newClient.telephone} onChange={(e) => setNewClient(prev => ({ ...prev, telephone: e.target.value }))} placeholder="telephone" style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.03)', color: T.textPri, fontFamily: MONO }} />
              <input value={newClient.ville} onChange={(e) => setNewClient(prev => ({ ...prev, ville: e.target.value }))} placeholder="ville" style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.03)', color: T.textPri, fontFamily: MONO }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.cardBorder}`, background: 'transparent', color: T.textSec, cursor: 'pointer', fontFamily: MONO }}>Annuler</button>
                <button type="submit" disabled={creatingClient} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#D4A843', color: '#0F1629', cursor: creatingClient ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: MONO }}>
                  {creatingClient ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <footer style={{ borderTop: '1px solid rgba(245, 158, 11, 0.08)', paddingTop: 24, paddingBottom: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <span style={{ color: '#4B5563', fontSize: 12, fontFamily: MONO }}>TBOS Clients v2.0 — Données live • {format(new Date(), 'dd/MM/yyyy')}</span>
        </footer>
      </div>
    </div>
  );
}