import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, UserCheck, Banknote, Heart, Bell,
  AlertTriangle, UserX, ChevronRight, Search,
} from 'lucide-react';
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
        supabase.from('clients').select('client_id, nom, telephone, email, ville, created_at, statut_client, categorie_client, solde_courant').limit(200),
        supabase.from('factures').select('facture_id, client_id, montant_ttc, date_facture, statut').gte('date_facture', sixMonthsAgo),
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
      style={{ background: 'linear-gradient(to bottom right, #1a1f2e, #141824)', border: `1px solid ${hov ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)'}`, borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
        transform: press ? 'translateY(-1px) scale(0.995)' : hov ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.25), 0 0 20px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 200ms' }} />
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
      <span style={{ color: T.gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</span>
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
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 600ms ease-out' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
              {animated}<span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginLeft: 5 }}>{suffix}</span>
            </p>
            {trend && <p style={{ fontSize: 11, color: trendPositive ? T.success : T.danger, marginTop: 6, fontWeight: 600 }}>{trendPositive ? '↑' : '↓'} {trend}</p>}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color="#F59E0B" />
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ClientDisplay { name: string; segment: string; ca: string; lastOrder: string; status: string; solde: number }

function ClientRow({ client, delay = 0 }: { client: ClientDisplay; delay?: number }) {
  const visible = useFadeIn(delay);
  const [hov, setHov] = useState(false);
  const segColor = SEGMENT_COLORS[client.segment] || T.gold;
  const initial = client.name.charAt(0).toUpperCase();
  const isInactif = client.status === 'Inactif';

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? (hov ? 'translateX(4px)' : 'translateY(0)') : 'translateY(20px)', transition: 'all 380ms ease-out', background: hov ? `${T.cardBorder}50` : 'transparent', border: `1px solid ${hov ? T.cardBorder : 'transparent'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${segColor}, ${segColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: T.navy, boxShadow: `0 0 10px ${segColor}40` }}>{initial}</div>
      <div style={{ minWidth: 170, flexShrink: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri, marginBottom: 3 }}>{client.name}</p>
        <Badge label={client.segment} color={segColor} bg={`${segColor}18`} />
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
      <ChevronRight size={18} color={T.textDim} style={{ transition: 'transform 200ms', transform: hov ? 'translateX(4px)' : 'none', flexShrink: 0 }} />
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
  const activeClients = clients.filter(c => c.statut_client === 'actif').length;

  // CA per client
  const caByClient = useMemo(() => {
    const map: Record<string, number> = {};
    factures.forEach(f => { map[f.client_id] = (map[f.client_id] || 0) + (f.montant_ttc || 0); });
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
        return { client: cl?.nom || id, ca: Math.round(ca / 1000) };
      });
  }, [caByClient, clients]);

  // Segments
  const segments = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach(c => {
      const cat = c.categorie_client || 'Autre';
      map[cat] = (map[cat] || 0) + 1;
    });
    const colors = [T.gold, T.info, T.success, T.purple, T.textSec];
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: SEGMENT_COLORS[name] || colors[i % colors.length] }));
  }, [clients]);

  // Monthly trend
  const trendData = useMemo(() => {
    const months: { month: string; ca: number; nouveaux: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const m = format(d, 'MMM');
      const yy = format(d, 'yyyy-MM');
      const ca = factures
        .filter(f => f.date_facture?.startsWith(yy))
        .reduce((s, f) => s + (f.montant_ttc || 0), 0);
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
      const isActive = c.statut_client === 'actif';
      return {
        name: c.nom || 'N/A',
        segment: c.categorie_client || 'Autre',
        ca: ca > 1000 ? `${Math.round(ca / 1000)}K DH` : `${Math.round(ca)} DH`,
        lastOrder: lastDate ? format(new Date(lastDate), 'dd MMM') : '—',
        status: isActive ? 'Actif' : 'Inactif',
        solde: c.solde_courant || 0,
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
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.navy, minHeight: '100vh', color: T.textPri }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.8} }
        input::placeholder { color: #64748B; }
        input { outline: none; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, #B8860B)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color={T.navy} />
            </div>
            <div>
              <span style={{ color: T.textSec, fontWeight: 700, fontSize: 13 }}>TBOS </span>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>Clients</span>
              <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1, marginTop: 1 }}>Données en temps réel</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '6px 16px', borderRadius: 8, cursor: 'pointer', background: activeTab === tab.id ? `${T.gold}18` : 'transparent', border: activeTab === tab.id ? `1px solid ${T.goldBorder}` : '1px solid transparent', color: activeTab === tab.id ? T.gold : T.textSec, fontWeight: 600, fontSize: 13, transition: 'all 200ms' }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color={T.textDim} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ padding: '7px 12px 7px 30px', borderRadius: 8, background: `${T.cardBorder}60`, border: `1px solid ${T.cardBorder}`, color: T.textPri, fontSize: 12, width: 200 }} />
            </div>
            {loading && <div style={{ width: 14, height: 14, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'tbos-spin 0.6s linear infinite' }} />}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* KPIs */}
        <section>
          <SectionHeader icon={Users} label="Indicateurs CRM" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard label="Total Clients" value={totalClients} suffix="" color="#F59E0B" icon={Users} trend={`${activeClients} actifs`} trendPositive delay={0} />
            <KPICard label="Clients Actifs" value={activeClients} suffix="" color="#F59E0B" icon={UserCheck} trend={`${totalClients - activeClients} inactifs`} trendPositive delay={80} />
            <KPICard label="CA Moyen / Client" value={avgCA} suffix="K DH" color="#F59E0B" icon={Banknote} trend={`Total: ${Math.round(totalCA / 1000)}K`} trendPositive delay={160} />
            <KPICard label="Taux de Rétention" value={totalClients > 0 ? Math.round((loyal / totalClients) * 100) : 0} suffix="%" color="#F59E0B" icon={Heart} trend={`${atRisk} à risque`} trendPositive={atRisk < 5} delay={240} />
          </div>
        </section>

        {/* Top clients + Segments */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 24 }}>
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
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: T.textSec, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={v => `${v}K`} />
                <RechartsTooltip content={<DarkTooltip suffix="K DH" />} cursor={{ stroke: `${T.gold}40` }} />
                <Area dataKey="ca" name="CA" type="monotone" stroke="#F59E0B" strokeWidth={2.5} fill="url(#caGrad)" animationDuration={1200} dot={{ fill: '#F59E0B', r: 4 }} />
                <Bar dataKey="nouveaux" name="Nouveaux clients" fill={T.info} radius={[3, 3, 0, 0]} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* Client List */}
        <section>
          <SectionHeader icon={Users} label="Liste des Clients" right={<span style={{ color: T.textDim, fontSize: 11 }}>{filteredClients.length} résultats</span>} />
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredClients.slice(0, 20).map((c, i) => <ClientRow key={c.name + i} client={c} delay={i * 40} />)}
              {filteredClients.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 14 }}>Aucun client trouvé</div>}
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
        <footer style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.textDim, fontSize: 11 }}>TBOS Clients v2.0 — Données live • {new Date().toLocaleString('fr-FR')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, animation: 'tbos-pulse 2.5s infinite' }} />
            <span style={{ color: T.success, fontSize: 11, fontWeight: 600 }}>Connecté</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
