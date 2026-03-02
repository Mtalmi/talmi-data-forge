import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

const SEGMENT_COLORS: Record<string, string> = {
  Enterprise: T.gold, 'Mid-Market': T.info, PME: T.success, Startup: T.purple, Autre: T.textSec,
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
function Card({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div className={className} onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setPress(false); }} onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{ background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`, borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.995)' : hov ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: 'none',
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'transparent', opacity: 0 }} />
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
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
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out', height: '100%' }}>
      <Card style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: 30, fontWeight: 200, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {animated}<span style={{ fontSize: 20, fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>{suffix}</span>
            </p>
            {trend && <p style={{ fontSize: 12, color: trendPositive ? '#10B981' : '#EF4444', marginTop: 6, fontWeight: 500 }}>{trendPositive ? '↑' : '↓'} {trend}</p>}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#F59E0B" />
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ClientDisplay { name: string; segment: string; ca: string; lastOrder: string; status: string; solde: number; clientId?: string }

function ClientRow({ client, delay = 0 }: { client: ClientDisplay; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const { triggerWorkflow } = useN8nWorkflow();
  const segColor = SEGMENT_COLORS[client.segment] || T.gold;
  const initial = client.name.charAt(0).toUpperCase();
  const isInactif = client.status === 'Inactif';

  const fetchBrief = useCallback(async () => {
    if (!client.clientId) return;
    setLoadingBrief(true);
    try {
      const { data } = await supabase.from('ai_client_briefs')
        .select('*')
        .eq('client_id', client.clientId)
        .order('generated_at', { ascending: false })
        .limit(1);
      if (data?.length) setBrief(data[0]);
    } catch (e) { console.error(e); }
    finally { setLoadingBrief(false); }
  }, [client.clientId]);

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded && !brief) fetchBrief();
  };

  const handleGenerate = async () => {
    try {
      await triggerWorkflow('client_intelligence', { client_id: client.clientId });
      toast.success('Génération du brief en cours...');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={handleExpand}
        style={{ opacity: visible ? 1 : 0, transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(20px)', transition: 'all 380ms ease-out', background: hov ? 'rgba(255,215,0,0.04)' : 'transparent', border: `1px solid ${hov ? T.cardBorder : 'transparent'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${segColor}, ${segColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: T.navy, boxShadow: `0 0 10px ${segColor}40` }}>{initial}</div>
        <div style={{ minWidth: 170, flexShrink: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 3 }}>{client.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                <span title={risk.detail} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                  background: `${rc}15`, color: rc, border: `1px solid ${rc}30`,
                  cursor: 'help',
                }}>
                  {emoji} {risk.label}
                </span>
              );
            })()}
          </div>
        </div>
        <div style={{ minWidth: 90, flexShrink: 0 }}>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>CA YTD</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: T.gold }}>{client.ca}</p>
        </div>
        <div style={{ minWidth: 100, flexShrink: 0 }}>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Dernière cmd</p>
          <p style={{ color: T.textSec, fontSize: 12 }}>{client.lastOrder}</p>
        </div>
        <div style={{ minWidth: 80, flexShrink: 0 }}>
          <Badge label={client.status} color={isInactif ? T.warning : T.success} bg={isInactif ? `${T.warning}18` : `${T.success}18`} pulse={isInactif} />
        </div>
        <div style={{ minWidth: 90, flexShrink: 0 }}>
          <p style={{ color: T.textDim, fontSize: 10, marginBottom: 2 }}>Solde</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: client.solde === 0 ? T.success : T.danger }}>
            {client.solde === 0 ? '0 DH' : `${(client.solde / 1000).toFixed(0)}K DH`}
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <ChevronRight size={18} color={T.textDim} style={{ transition: 'transform 200ms', transform: expanded ? 'rotate(90deg)' : hov ? 'translateX(4px)' : 'none', flexShrink: 0 }} />
      </div>

      {/* AI Intelligence Brief */}
      {expanded && (() => {
        const MOCK_BRIEFS: Record<string, any> = {
          'TGCC': { summary: "Client Enterprise stratégique. Volume en hausse constante, +12% ce trimestre. Aucun impayé. Potentiel d'upsell sur formules spéciales.", patterns: { avg_order_frequency_days: 7, preferred_formula: 'F-B30', avg_volume_per_order: 350 }, risk_level: 'low' },
          'Constructions Modernes SA': { summary: "Client fidèle Mid-Market. Commandes régulières bi-hebdomadaires. Sensible aux délais de livraison. Marge stable.", patterns: { avg_order_frequency_days: 14, preferred_formula: 'F-B25', avg_volume_per_order: 80 }, risk_level: 'low' },
          'BTP Maroc SARL': { summary: "Client actif avec 3 devis en cours. Historique de paiement excellent. Volume moyen en croissance.", patterns: { avg_order_frequency_days: 14, preferred_formula: 'F-B25', avg_volume_per_order: 30 }, risk_level: 'low' },
          'Ciments & Béton du Sud': { summary: "Nouveau client en phase de croissance. 2 premières commandes livrées sans incident. Surveiller fidélisation.", patterns: { avg_order_frequency_days: 21, preferred_formula: 'F-B20', avg_volume_per_order: 25 }, risk_level: 'medium' },
          'Saudi Readymix Co.': { summary: "Client export à fort potentiel. Commande volumineuse unique (50m³). Paiement en attente de validation.", patterns: { avg_order_frequency_days: 30, preferred_formula: 'F-B35', avg_volume_per_order: 50 }, risk_level: 'medium' },
        };
        const displayBrief = brief || MOCK_BRIEFS[client.name] || {
          summary: "Client fidèle avec commandes régulières. Volume en hausse de 15% sur les 3 derniers mois.",
          patterns: { avg_order_frequency_days: 7, preferred_formula: 'B25/B30', avg_volume_per_order: 45 },
          risk_level: 'low',
        };
        return (
        <div style={{ background: 'rgba(30,45,74,0.5)', borderLeft: '2px solid #FFD700', borderRadius: '0 10px 10px 0', padding: 16, margin: '4px 16px 8px 16px' }}>
          {loadingBrief ? (
            <p style={{ color: T.textDim, fontSize: 12 }}>Chargement...</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ color: T.gold, fontWeight: 700, fontSize: 13 }}>🧠 Intelligence Brief</p>
                <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                  background: displayBrief.risk_level === 'low' ? `${T.success}22` : displayBrief.risk_level === 'medium' ? `${T.warning}22` : `${T.danger}22`,
                  color: displayBrief.risk_level === 'low' ? T.success : displayBrief.risk_level === 'medium' ? T.warning : T.danger,
                  border: `1px solid ${displayBrief.risk_level === 'low' ? T.success : displayBrief.risk_level === 'medium' ? T.warning : T.danger}44`,
                }}>{displayBrief.risk_level === 'low' ? 'Risque Faible' : displayBrief.risk_level === 'medium' ? 'Risque Modéré' : 'Risque Élevé'}</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <p style={{ color: T.gold, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>Résumé</p>
                <p style={{ color: '#d1d5db', fontSize: 13, lineHeight: 1.5 }}>{displayBrief.summary}</p>
              </div>
              {displayBrief.patterns && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ color: T.gold, fontWeight: 700, fontSize: 11, marginBottom: 6 }}>Tendances</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    {displayBrief.patterns.avg_order_frequency_days != null && (
                      <span style={{ padding: '3px 10px', borderRadius: 999, background: '#1a1a1a', border: '1px solid #333', color: T.textSec, fontSize: 11 }}>📦 Fréq: {displayBrief.patterns.avg_order_frequency_days}j</span>
                    )}
                    {displayBrief.patterns.preferred_formula && (
                      <span style={{ padding: '3px 10px', borderRadius: 999, background: '#1a1a1a', border: '1px solid #333', color: T.textSec, fontSize: 11 }}>🧪 {displayBrief.patterns.preferred_formula}</span>
                    )}
                    {displayBrief.patterns.avg_volume_per_order != null && (
                      <span style={{ padding: '3px 10px', borderRadius: 999, background: '#1a1a1a', border: '1px solid #333', color: T.textSec, fontSize: 11 }}>💰 Vol moy: {displayBrief.patterns.avg_volume_per_order}m³</span>
                    )}
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: 11, lineHeight: 1.5 }}>Commande préférée: {displayBrief.patterns.preferred_formula || 'B25'}. Cycle moyen: {displayBrief.patterns.avg_order_frequency_days || 7} jours.</p>
                </div>
              )}
              {!brief && <p style={{ color: T.textDim, fontSize: 10, fontStyle: 'italic', marginBottom: 6 }}>Données de démonstration — cliquez Actualiser pour générer un vrai brief</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                <span style={{ color: '#6B7280', fontSize: 10 }}>Dernière analyse: 01/03/2026 05:45</span>
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
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>{animated}</p>
            <p style={{ fontWeight: 700, fontSize: 13, color: T.textPri, marginTop: 4 }}>{label}</p>
            <p style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>{desc}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
export default function WorldClassClients() {
  const [activeTab, setActiveTab] = useState('tous');
  const [search, setSearch] = useState('');
  const tabs = [{ id: 'tous', label: 'Tous' }, { id: 'actifs', label: 'Actifs' }, { id: 'inactifs', label: 'Inactifs' }];

  const { clients, factures, loading } = useClientsLiveData();

  // Derived data
  const totalClients = clients.length;
  const activeClients = clients.filter(c => !c.credit_bloque).length;

  // CA per client
  const caByClient = useMemo(() => {
    const map: Record<string, number> = {};
    factures.forEach(f => { map[f.client_id] = (map[f.client_id] || 0) + (f.total_ttc || 0); });
    return map;
  }, [factures]);

  const totalCA = useMemo(() => Object.values(caByClient).reduce((s, v) => s + v, 0), [caByClient]);
  const avgCA = totalClients > 0 ? Math.round(totalCA / totalClients / 1000) : 0;

  // Top clients
  const topClients = useMemo(() => {
    return Object.entries(caByClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, ca]) => {
        const cl = clients.find(c => c.client_id === id);
        return { client: cl?.nom_client || id, ca: Math.round(ca / 1000) };
      });
  }, [caByClient, clients]);

  // Segments
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

  // Monthly trend
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

  // Client list for table
  const clientList: ClientDisplay[] = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
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

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: 'transparent', minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
        input::placeholder { color: #64748B; }
        input { outline: none; }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <PageHeader
        icon={Users}
        title="Clients"
        subtitle="Données en temps réel"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={loading}
        actions={
          <>
            <button
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #C4933B, #FDB913)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#0F172A',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 200ms',
              }}
            >
              <Plus size={13} />
              Add new client
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#6B7280" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ padding: '6px 12px 6px 30px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', color: T.textPri, fontSize: 13, fontFamily: 'DM Sans, sans-serif', width: 180 }} onFocus={e => e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.1)'} />
            </div>
          </>
        }
      />

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

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

        {/* Top clients + Segments */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>Top Clients par CA</p>
                <Badge label={`Top ${topClients.length}`} color={T.gold} bg={`${T.gold}18`} />
              </div>
              {topClients.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topClients} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={v => `${v}K`} />
                    <YAxis dataKey="client" type="category" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 11 }} width={120} />
                    <RechartsTooltip content={<DarkTooltip suffix=" K DH" />} cursor={{ fill: `${T.gold}08` }} />
                    <Bar dataKey="ca" name="CA" fill={T.gold} radius={[0, 6, 6, 0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ minHeight: 180, maxHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim }}>Aucune donnée</div>
              )}
            </Card>

            <Card>
              <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 16 }}>Segmentation</p>
              {segments.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={segments} cx="50%" cy="50%" innerRadius={52} outerRadius={72} dataKey="value" animationDuration={600} label={false}>
                        {segments.map((seg, i) => <Cell key={i} fill={seg.color} />)}
                      </Pie>
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 800, fill: T.gold }}>{totalClients}</text>
                      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: T.textSec }}>clients</text>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                    {segments.map(seg => (
                      <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                        <span style={{ color: T.textSec, fontSize: 11 }}>{seg.name}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: seg.color, marginLeft: 'auto' }}>{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ minHeight: 180, maxHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textDim }}>Aucune donnée</div>
              )}
            </Card>
          </div>
        </section>

        {/* Revenue Trend */}
        <section>
          <SectionHeader icon={Banknote} label="Évolution CA Clients" right={
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: T.gold }}>{totalNewCA}K DH</span>
          } />
          <Card>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(245, 158, 11, 0.08)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={v => `${v}K`} />
                <RechartsTooltip content={<DarkTooltip suffix="K DH" />} cursor={{ stroke: `${T.gold}40` }} />
                <Area dataKey="ca" name="CA" type="monotone" stroke="#F59E0B" strokeWidth={2.5} fill="url(#caGrad)" animationDuration={1200} dot={{ fill: '#F59E0B', r: 4 }} />
                <Bar dataKey="nouveaux" name="Nouveaux clients" fill={T.info} radius={[3, 3, 0, 0]} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* Client List */}
        <section>
          <SectionHeader icon={Users} label="Liste des Clients" right={<span style={{ color: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{filteredClients.length} résultats</span>} />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredClients.slice(0, 20).map((c, i) => <ClientRow key={c.name + i} client={c} delay={i * 40} />)}
              {filteredClients.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#6B7280', fontSize: 14, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Aucun client trouvé</div>}
            </div>
          </Card>
        </section>

        {/* Health */}
        <section>
          <SectionHeader icon={Heart} label="Santé du Portefeuille" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <HealthCard label="Clients Fidèles" value={loyal} color={T.gold} desc="Commande dans les 30 derniers jours" icon={Heart} delay={0} />
            <HealthCard label="À Risque" value={atRisk - lost} color={T.warning} desc="Pas de commande depuis >30j" icon={AlertTriangle} delay={100} />
            <HealthCard label="Clients Perdus" value={lost} color={T.danger} desc="Pas de commande depuis >90j" icon={UserX} delay={200} />
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid rgba(245, 158, 11, 0.08)', paddingTop: 24, paddingBottom: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: '#4B5563', fontSize: 12 }}>TBOS Clients v2.0 — Données live • {format(new Date(), 'dd/MM/yyyy')}</span>
        </footer>
      </div>
    </div>
  );
}
