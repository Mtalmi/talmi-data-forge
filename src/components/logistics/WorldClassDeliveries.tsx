import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart,
  ComposedChart, Line, Cell,
} from 'recharts';
import {
  Truck, Package, Clock, MapPin, CheckCircle, ClipboardCheck,
  TrendingUp, Zap, ChevronDown, Brain, Fuel, Route,
  Activity, AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import WorldClassDeliveryArchive from '@/components/archive/WorldClassDeliveryArchive';
import { FleetPredatorPage } from '@/components/fleet/FleetPredatorPage';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────
const T = {
  gold: '#D4A843', goldGlow: 'rgba(212,168,67,0.16)', goldBorder: 'rgba(212,168,67,0.28)',
  navy: '#0B1120', cardBg: 'linear-gradient(145deg, #111B2E 0%, #162036 100%)', cardBorder: '#1E2D4A',
  success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6',
  textPri: '#F1F5F9', textSec: '#94A3B8', textDim: '#9CA3AF',
};
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

// ─────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target * 10) / 10);
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

function useDeliveriesLiveData() {
  const [todayBons, setTodayBons] = useState<any[]>([]);
  const [weekBons, setWeekBons] = useState<any[]>([]);
  const [allBons, setAllBons] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const last7Start = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  const fetchAll = useCallback(async () => {
    try {
      const [bonsRes, weekRes, allRes, fleetRes] = await Promise.all([
        supabase.from('bons_livraison_reels').select('bl_id, client_id, volume_m3, workflow_status, heure_prevue, camion_assigne, chauffeur_nom, formule_id, date_livraison, heure_depart_centrale, heure_arrivee_chantier, prix_vente_m3').eq('date_livraison', today),
        supabase.from('bons_livraison_reels').select('bl_id, volume_m3, date_livraison, workflow_status').gte('date_livraison', weekStart).lte('date_livraison', weekEnd),
        supabase.from('bons_livraison_reels').select('bl_id, volume_m3, date_livraison, workflow_status').gte('date_livraison', last7Start).order('date_livraison', { ascending: true }),
        supabase.from('flotte').select('id_camion, immatriculation, statut, chauffeur_actuel').limit(20),
      ]);
      setTodayBons(bonsRes.data || []);
      setWeekBons(weekRes.data || []);
      setAllBons(allRes.data || []);
      setFleet(fleetRes.data || []);
    } catch (e) { console.error('Deliveries fetch error:', e); }
    finally { setLoading(false); }
  }, [today, weekStart, weekEnd, last7Start]);

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel('wc-deliveries-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bons_livraison_reels' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flotte' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  return { todayBons, weekBons, allBons, fleet, loading };
}

// ─────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.cardBg, border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.25), 0 0 16px ${T.goldGlow}` : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`, opacity: hov ? 1 : 0.4, transition: 'opacity 250ms' }} />
      {children}
    </div>
  );
}

function Bdg({ label, color, bg, pulse }: { label: string; color: string; bg: string; pulse?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: bg, border: `1px solid ${color}40`, color, fontSize: 11, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, animation: pulse ? 'tbos-pulse 1.5s ease-in-out infinite' : 'none' }} />
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <Icon size={16} color={T.gold} />
      <span style={{ color: T.gold, fontFamily: MONO, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>{label}</span>
      <div style={{ flex: 1, height: 0, borderTop: `1px dotted ${T.gold}40` }} />
      {right}
    </div>
  );
}

function IABadge({ small }: { small?: boolean } = {}) {
  return (
    <span style={{ fontFamily: MONO, fontSize: small ? 10 : 11, color: '#D4A843', padding: small ? '3px 6px' : '4px 8px', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 4, background: 'rgba(212,168,67,0.06)' }}>
      Généré par IA · Claude Opus
    </span>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: T.gold }}>{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>;
}

// ─────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────
function KPICard({ label, value, color, subtitle, delay = 0 }: { label: string; value: string; color: string; subtitle?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 500ms ease-out' }}>
      <div style={{
        background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '18px 16px',
        borderTop: `2px solid ${T.gold}`,
      }}>
        <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>{label}</p>
        <p style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
        {subtitle && <p style={{ fontSize: 11, color: subtitle.includes('↑') || subtitle.includes('+') || subtitle.includes('marge') || subtitle.includes('livrée') ? T.success : subtitle.includes('maintenance') ? T.warning : T.textDim, marginTop: 6 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SCORE RING
// ─────────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? T.gold : score >= 60 ? T.warning : T.danger;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────
// FLEET HEALTH DATA
// ─────────────────────────────────────────────────────
const FLEET_HEALTH_DATA = [
  { name: 'T-04 Toupie 8m³', score: 92, insight: 'RAS — véhicule optimal', fullDiag: 'Moteur: optimal · Pneus: 85% · Vidange: OK (il y a 12j) · Batterie: 98% · Freins: 90%', revenue: '18,200 DH', driver: 'Youssef Benali', driverStats: '3 livr. · 127 km · score 92', maintenance: { text: 'Prochaine maintenance: vidange dans 1,200 km (estimé 18 mars)', color: T.textDim } },
  { name: 'T-07 Toupie 10m³', score: 74, insight: 'Vidange recommandée dans 5j', fullDiag: 'Moteur: bon · Pneus: 72% · Vidange: URGENT (dans 5j / 800km) · Batterie: 91% · Freins: 78%', revenue: '12,460 DH', driver: 'Karim Idrissi', driverStats: '2 livr. · 98 km · score 87', maintenance: { text: 'Prochaine maintenance: vidange dans 400 km (estimé 16 mars) ⚠', color: T.warning } },
  { name: 'T-09 Toupie 8m³', score: 58, insight: '⚠ Pneus à vérifier — usure détectée', fullDiag: 'Moteur: attention · Pneus: 35% CRITIQUE · Vidange: OK · Batterie: 84% · Freins: 65% — vibrations détectées', revenue: '0 DH', driver: '—', driverStats: 'En maintenance depuis 10/03', maintenance: { text: 'En maintenance: pneus en remplacement — retour estimé 15 mars 08:00', color: T.danger } },
  { name: 'T-12 Toupie 8m³', score: 86, insight: 'Visite technique dans 3 semaines', fullDiag: 'Moteur: optimal · Pneus: 80% · Vidange: OK · Batterie: 95% · Freins: 88% · VT prévue 28/03', revenue: '8,300 DH', driver: 'Mehdi Tazi', driverStats: '1 livr. · 45 km · score 94', maintenance: { text: 'Prochaine maintenance: visite technique dans 3 semaines ✓', color: T.textDim } },
];

function FleetHealthCard({ v, delay = 0 }: { v: typeof FLEET_HEALTH_DATA[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const borderColor = v.score >= 80 ? T.gold : v.score >= 60 ? T.warning : T.danger;
  const isLow = v.score < 60;

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 500ms ease-out' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{
        background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '20px 16px',
        borderTop: `2px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'all 250ms ease', transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.25), 0 0 12px ${borderColor}30` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: T.textPri }}>{v.name}</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: borderColor, boxShadow: `0 0 8px ${borderColor}60` }} />
            {isLow && <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.danger}`, animation: 'tbos-pulse 2s infinite', opacity: 0.5 }} />}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '4px 0' }}>
          <ScoreRing score={v.score} size={72} />
          <span style={{ position: 'absolute', fontFamily: MONO, fontSize: 32, fontWeight: 200, letterSpacing: '-0.02em', lineHeight: 1, color: v.score >= 80 ? T.gold : v.score >= 60 ? T.warning : T.danger }}>
            {v.score}
          </span>
        </div>
        <span style={{ fontSize: 11, color: isLow ? T.danger : T.textSec, textAlign: 'center', lineHeight: 1.4 }}>{v.insight}</span>
        <div style={{ maxHeight: hov ? 60 : 0, opacity: hov ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease, opacity 0.2s ease' }}>
          <div style={{ fontSize: 10, color: T.textDim, textAlign: 'center', lineHeight: 1.6, paddingTop: 6, borderTop: `1px solid ${T.cardBorder}` }}>{v.fullDiag}</div>
        </div>
        <IABadge small />
        <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textAlign: 'center', margin: 0 }}>Revenu/jour: {v.revenue}</p>
        {/* Driver info */}
        <div style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: 8, marginTop: 4 }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: T.textPri, textAlign: 'center', margin: '0 0 2px' }}>{v.driver}</p>
          <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textAlign: 'center', margin: 0 }}>{v.driverStats}</p>
        </div>
        {/* Maintenance prédictive */}
        {(v as any).maintenance && (
          <p style={{ fontFamily: MONO, fontSize: 10, color: (v as any).maintenance.color, textAlign: 'center', margin: '6px 0 0', lineHeight: 1.4 }}>{(v as any).maintenance.text}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SEEDED DELIVERIES
// ─────────────────────────────────────────────────────
const SEEDED_DELIVERIES = [
  { bl_id: 'BL-2024-A8F3', client_id: 'Résidences Atlas', formule_id: 'B30', volume_m3: 12, camion_assigne: 'T-04', chauffeur_nom: 'Youssef Benali', workflow_status: 'production', heure_prevue: '10:30', _destination: 'Chantier Maarif — Casablanca', _eta: '≈ 14 min', _delay: '+14 min', _freshness: { min: 47, max: 90, mixTime: '09:15', label: '⏱ 47 min' }, _weather: { text: '☀ 34°C', color: T.warning }, _freshAlert: '⚠ Chaleur + retard — risque qualité béton', _pnl: { type: 'estimé', revenu: '6,200', matiere: '3,100', fuel: '480', chauffeur: '350', net: '2,270', pct: '36.6' } },
  { bl_id: 'BL-2024-C1D7', client_id: 'Groupe Addoha', formule_id: 'B25', volume_m3: 8, camion_assigne: 'T-07', chauffeur_nom: 'Karim Idrissi', workflow_status: 'validation_technique', heure_prevue: '08:15', _destination: 'Résidence Rabat Center', _eta: 'Livré à 09:02', _freshness: { min: 52, max: 90, mixTime: '', label: '✓ Livré à 52 min', done: true }, _weather: { text: '☀ 30°C', color: T.textSec }, _feedback: { stars: 4, attente: '12 min', conforme: true }, _pnl: { type: 'réel', revenu: '4,800', matiere: '2,400', fuel: '320', chauffeur: '280', net: '1,800', pct: '37.5' } },
  { bl_id: 'BL-2024-E5B2', client_id: 'Saham Immobilier', formule_id: 'B35', volume_m3: 10, camion_assigne: 'T-12', chauffeur_nom: 'Mehdi Tazi', workflow_status: 'planification', heure_prevue: '14:00', _destination: 'Marina Kénitra — Lot 7', _eta: 'Départ prévu 13:45', _freshness: { min: 90, max: 90, mixTime: '13:30', label: '⏱ 90 min', planned: true }, _weather: { text: '☀ 38°C', color: T.danger, tooltip: 'Température élevée — temps de prise réduit. Adjuvant retardateur recommandé.' }, _pnl: { type: 'estimé', revenu: '5,500', matiere: '2,750', fuel: '400', chauffeur: '300', net: '2,050', pct: '37.3' } },
];

function getStatusDisplay(ws: string | null) {
  if (ws === 'validation_technique') return { label: 'Livré', color: T.success, style: 'outline' as const };
  if (ws === 'production') return { label: 'En route', color: T.gold, style: 'pulse' as const };
  if (ws === 'planification') return { label: 'Planifié', color: T.textDim, style: 'outline' as const };
  return { label: ws || 'N/A', color: T.textDim, style: 'outline' as const };
}

function FreshnessRing({ min, max, done, planned }: { min: number; max: number; done?: boolean; planned?: boolean }) {
  const pct = Math.min(min / max, 1);
  const remaining = max - min;
  const ringColor = done ? T.success : planned ? T.textDim : remaining > 45 ? T.success : remaining > 20 ? T.warning : T.danger;
  const pulseAnim = !done && !planned && (remaining < 10 || (remaining <= 45 && remaining > 20)) ? 'tbos-pulse 1.5s ease-in-out infinite' : 'none';
  const r = 16, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0, animation: pulseAnim }}>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <circle cx={20} cy={20} r={r} fill="none" stroke={ringColor} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          transform="rotate(-90 20 20)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      {done && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.success, fontSize: 14 }}>✓</span>}
    </div>
  );
}

function DeliveryCard({ d, index }: { d: any; index: number }) {
  const [hov, setHov] = useState(false);
  const status = getStatusDisplay(d.workflow_status);
  const isOdd = index % 2 !== 0;
  const formulaColor: Record<string, string> = { B25: T.gold, B30: '#3B82F6', B35: T.success, B40: '#8B5CF6' };
  const fColor = formulaColor[d.formule_id] || T.gold;
  const fr = d._freshness;
  const wx = d._weather;
  const fb = d._feedback;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: isOdd ? 'rgba(212,168,67,0.03)' : T.cardBg,
        border: `1px solid ${hov ? T.goldBorder : T.cardBorder}`,
        borderLeft: `4px solid ${status.color}`, borderRadius: 10, padding: '14px 18px',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.2), 0 0 12px ${T.goldGlow}` : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 250ms', transform: hov ? 'translateX(4px)' : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 160 }}>
          <p style={{ fontFamily: MONO, color: T.gold, fontSize: 12, marginBottom: 2 }}>{d.bl_id}</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: T.textPri }}>{d.client_id?.substring(0, 20) || 'N/A'}</p>
          {d._destination && <p style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{d._destination}</p>}
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: MONO, fontWeight: 700, background: `${fColor}18`, color: fColor, border: `1px solid ${fColor}40` }}>{d.formule_id || '—'}</span>
        <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 200, color: T.gold }}>{d.volume_m3} m³</p>
        {d.camion_assigne && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: MONO, fontWeight: 700, background: 'transparent', border: `1px solid ${T.gold}40`, color: T.gold }}>{d.camion_assigne}</span>}
        {d.chauffeur_nom && <span style={{ color: T.textDim, fontSize: 11 }}>{d.chauffeur_nom}</span>}
        {d.heure_prevue && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} color={T.textDim} /><span style={{ color: T.textDim, fontSize: 11 }}>{d.heure_prevue}</span></div>}
        {/* Weather */}
        {wx && (
          <span style={{ fontFamily: MONO, fontSize: 11, color: wx.color }} title={wx.tooltip || ''}>
            {wx.text}
          </span>
        )}
        {d._delay && <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: T.danger, border: `1px solid ${T.danger}40` }}>{d._delay}</span>}

        {/* Freshness countdown */}
        {fr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', marginRight: 12 }}>
            <FreshnessRing min={fr.min} max={fr.max} done={fr.done} planned={fr.planned} />
            <div>
              <p style={{ fontFamily: MONO, fontWeight: 200, fontSize: 14, color: fr.done ? T.success : fr.planned ? T.textDim : (fr.max - fr.min) > 45 ? T.success : (fr.max - fr.min) > 20 ? T.warning : T.danger, margin: 0 }}>{fr.label}</p>
              <p style={{ fontFamily: MONO, fontSize: 10, color: T.textDim, margin: 0 }}>
                {fr.done ? 'Dans les temps' : fr.mixTime ? `Mélangé à ${fr.mixTime}` : ''}
                {fr.planned && fr.mixTime ? `Mélange prévu ${fr.mixTime}` : ''}
              </p>
              {/* Freshness + weather alert */}
              {d._freshAlert && <p style={{ fontFamily: MONO, fontSize: 10, color: T.danger, margin: '2px 0 0' }}>{d._freshAlert}</p>}
            </div>
          </div>
        )}

        {!fr && <div style={{ marginLeft: 'auto' }} />}
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4,
            background: status.style === 'pulse' ? `${status.color}18` : 'transparent',
            border: `1px solid ${status.color}40`, color: status.color, fontSize: 11, fontFamily: MONO, fontWeight: 700,
            animation: status.style === 'pulse' ? 'tbos-pulse 2.5s infinite' : 'none',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.color }} />
            {status.label}
          </span>
        </div>
      </div>
      {/* Client feedback row for delivered */}
      {fb && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11, color: T.textDim }}>
          <span>Réception chantier: {Array.from({ length: 5 }, (_, i) => <span key={i} style={{ color: i < fb.stars ? T.gold : T.textDim }}>★</span>)}</span>
          <span>·</span>
          <span>Temps d'attente: {fb.attente}</span>
          <span>·</span>
          <span>Conformité béton: {fb.conforme ? <span style={{ color: T.success }}>✓</span> : <span style={{ color: T.danger }}>✗</span>}</span>
        </div>
      )}
      {/* P&L micro-row */}
      {d._pnl && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${T.cardBorder}`, fontFamily: MONO, fontSize: 10, color: T.textDim, lineHeight: 1.6 }}>
          P&L {d._pnl.type}: {d._pnl.revenu} DH revenu − {d._pnl.matiere} matière − {d._pnl.fuel} fuel − {d._pnl.chauffeur} chauffeur = <span style={{ color: T.success }}>{d._pnl.net} DH net</span> (<span style={{ color: T.success }}>{d._pnl.pct}%</span>)
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PIPELINE CARD
// ─────────────────────────────────────────────────────
function PipelineCard({ label, count, color, aiRisk, delay = 0 }: { label: string; count: number; color: string; aiRisk: { label: string; pct: number }; delay?: number }) {
  const animated = useAnimatedCounter(count, 800);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const riskColor = aiRisk.pct > 60 ? T.danger : aiRisk.pct > 30 ? T.warning : T.success;
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.9)', transition: 'all 500ms ease-out', flex: 1 }}>
      <Card style={{ textAlign: 'center', padding: '24px 16px' }}>
        <p style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color, lineHeight: 1 }}>{Math.round(animated)}</p>
        <p style={{ fontFamily: MONO, fontSize: 11, color: T.textSec, fontWeight: 600, marginTop: 8, letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>{label}</p>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'transparent', color: riskColor, border: `1px solid ${riskColor}` }}>
            {aiRisk.label} {aiRisk.pct}%
          </span>
          <IABadge />
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PROFIT DATA
// ─────────────────────────────────────────────────────
const PROFIT_DATA = [
  { toupie: 'T-04', chauffeur: 'Youssef Benali', livraisons: 3, km: 127, revenu: 18200, carburant: -2400, maintenance: -800, tempsMort: '15 min', profit: 15000, dhKm: 118, badge: 'TOP', badgeColor: T.success, retourVide: '48%', retourVideColor: T.warning },
  { toupie: 'T-07', chauffeur: 'Karim Idrissi', livraisons: 2, km: 98, revenu: 12460, carburant: -1850, maintenance: -600, tempsMort: '22 min', profit: 10010, dhKm: 102, badge: '', badgeColor: T.success, retourVide: '31%', retourVideColor: T.warning },
  { toupie: 'T-12', chauffeur: 'Mehdi Tazi', livraisons: 1, km: 45, revenu: 8300, carburant: -950, maintenance: -400, tempsMort: '0 min', profit: 6950, dhKm: 154, badge: 'EFFICACE', badgeColor: T.gold, retourVide: '0%', retourVideColor: T.success },
  { toupie: 'T-09', chauffeur: '—', livraisons: 0, km: 0, revenu: 0, carburant: 0, maintenance: -1200, tempsMort: 'MAINTENANCE', profit: -1200, dhKm: 0, badge: 'ARRÊT', badgeColor: T.danger, retourVide: '—', retourVideColor: T.textDim },
];
const PROFIT_TOTALS = { toupie: 'TOTAL FLOTTE', chauffeur: '—', livraisons: 6, km: 270, revenu: 38960, carburant: -5200, maintenance: -3000, tempsMort: '—', profit: 30760, dhKm: 114, retourVide: '38%', retourVideColor: T.warning };

// ─────────────────────────────────────────────────────
// WEEKLY PERFORMANCE DATA
// ─────────────────────────────────────────────────────
function buildSeededWeeklyData() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dayLabel = format(d, 'EEE dd/MM', { locale: fr });
    const counts = [5, 7, 4, 8, 6, 3, 2];
    const volumes = [42, 58, 35, 68, 50, 24, 16];
    const revenue = [6300, 8700, 5250, 10200, 7500, 3600, 2400];
    data.push({ day: dayLabel, livraisons: counts[6 - i], volume: volumes[6 - i], revenue: revenue[6 - i] });
  }
  return data;
}

// ─────────────────────────────────────────────────────
// FORECAST DATA
// ─────────────────────────────────────────────────────
const FORECAST_14J = [
  { jour: 'J1', réel: 12, prévu: 11, upper: 14, lowerInv: -8 },
  { jour: 'J2', réel: 10, prévu: 12, upper: 15, lowerInv: -9 },
  { jour: 'J3', réel: 14, prévu: 13, upper: 16, lowerInv: -10 },
  { jour: 'J4', réel: 11, prévu: 12, upper: 15, lowerInv: -9 },
  { jour: 'J5', réel: 13, prévu: 14, upper: 17, lowerInv: -11 },
  { jour: 'J6', réel: 9, prévu: 10, upper: 13, lowerInv: -7 },
  { jour: 'J7', réel: 8, prévu: 9, upper: 12, lowerInv: -6 },
  { jour: 'J8', réel: null, prévu: 13, upper: 16, lowerInv: -10 },
  { jour: 'J9', réel: null, prévu: 14, upper: 18, lowerInv: -10 },
  { jour: 'J10', réel: null, prévu: 12, upper: 16, lowerInv: -8 },
  { jour: 'J11', réel: null, prévu: 15, upper: 19, lowerInv: -11 },
  { jour: 'J12', réel: null, prévu: 11, upper: 14, lowerInv: -8 },
  { jour: 'J13', réel: null, prévu: 10, upper: 13, lowerInv: -7 },
  { jour: 'J14', réel: null, prévu: 12, upper: 15, lowerInv: -9 },
];

// ─────────────────────────────────────────────────────
// TOOLTIPS
// ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6, fontFamily: MONO }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>{p.name}: <strong style={{ fontFamily: MONO }}>{p.value}</strong></p>
      ))}
    </div>
  );
}

function ForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A2540', border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: T.gold, fontWeight: 700, marginBottom: 6, fontFamily: MONO }}>{label}</p>
      {payload.filter((p: any) => p.dataKey === 'réel' || p.dataKey === 'prévu').map((p: any) => (
        <p key={p.dataKey} style={{ color: p.dataKey === 'réel' ? T.gold : T.textDim, fontSize: 12, margin: '2px 0' }}>
          {p.name}: <strong style={{ fontFamily: MONO }}>{p.value ?? '—'}</strong>
        </p>
      ))}
    </div>
  );
}

// Pulse dot for latest data point
function LinePulseDot(color: string, total: number) {
  return (props: any) => {
    if (props.index !== total - 1) return null;
    return (
      <g>
        <circle cx={props.cx} cy={props.cy} r={5} fill={color} />
        <circle cx={props.cx} cy={props.cy} r={8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5}>
          <animate attributeName="r" from="5" to="14" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>
    );
  };
}

// ─────────────────────────────────────────────────────
// BRIEFING LOGISTIQUE IA
// ─────────────────────────────────────────────────────
function LogisticsBriefingBanner({ totalDeliveries, enRoute, planned }: { totalDeliveries: number; enRoute: number; planned: number }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section>
      <div style={{
        background: 'rgba(212,168,67,0.03)', border: '1px solid rgba(212,168,67,0.2)',
        borderLeft: '4px solid #D4A843', borderTop: '2px solid #D4A843',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <button onClick={() => setExpanded(e => !e)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
          background: 'transparent', border: 'none', cursor: 'pointer', color: T.textPri,
        }}>
          <Brain size={16} color={T.gold} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: T.gold, flex: 1, textAlign: 'left' }}>
            BRIEFING LOGISTIQUE IA
          </span>
          <IABadge />
          <ChevronDown size={16} color={T.textSec} style={{ transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
        <div style={{ maxHeight: expanded ? 300 : 0, opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease, opacity 0.3s ease', padding: expanded ? '0 18px 16px' : '0 18px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 8px' }}>
              📋 <strong style={{ color: T.textPri }}>{totalDeliveries} livraisons planifiées</strong> aujourd'hui — {enRoute} en route, {planned} en préparation.
            </p>
            <p style={{ margin: '0 0 8px', color: T.warning }}>
              ⚠️ <strong>Risque élevé :</strong> Livraison <strong style={{ color: T.gold }}>BL-2024-A8F3</strong> — <strong style={{ color: T.gold }}>retard estimé 45 min</strong> dû au trafic sur l'axe A3. Recommandation : <strong style={{ color: T.gold }}>réaffecter toupie T-09</strong>.
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>
              🚛 <strong style={{ color: T.textPri }}>Déploiement optimal :</strong> 3 toupies actives suffisent pour le volume prévu ({totalDeliveries * 10} m³). Garder T-09 en réserve après maintenance.
            </p>
          </div>
          <div style={{ marginTop: 14 }}>
            <button style={{ background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold, fontSize: 11, fontWeight: 700, padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: MONO }}>
              Voir Recommandations
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────
// GPS TAB CONTENT
// ─────────────────────────────────────────────────────
function CarteGPSTab() {
  const [subTab, setSubTab] = useState('carte');
  const subTabs = [
    { id: 'carte', label: 'CARTE LIVE' },
    { id: 'historique', label: 'HISTORIQUE TRAJETS' },
    { id: 'zones', label: 'ZONES & PERFORMANCE' },
  ];
  
  const fleetSidebar = [
    { truck: 'T-04', driver: 'Youssef Benali', status: 'En route', location: 'A3 Casablanca → Maarif', eta: '10:44', speed: '45 km/h', color: T.gold, distLeft: '12 km', tripPct: 72, etaColor: T.danger },
    { truck: 'T-07', driver: 'Karim Idrissi', status: 'Livré', location: 'Rabat Center', eta: '—', speed: '0 km/h', color: T.success, distLeft: '—', tripPct: 100, etaColor: T.success },
    { truck: 'T-12', driver: 'Mehdi Tazi', status: 'Planifié', location: 'Centrale BPE', eta: 'Départ 13:45', speed: '0 km/h', color: T.textDim, distLeft: '45 km', tripPct: 0, etaColor: T.textDim },
    { truck: 'T-09', driver: '—', status: 'Maintenance', location: 'Garage', eta: '—', speed: '—', color: T.danger, distLeft: '—', tripPct: 0, etaColor: T.danger },
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.cardBorder}` }}>
        {subTabs.map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
            padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: MONO, fontSize: 11, letterSpacing: '1.5px', fontWeight: 700,
            color: subTab === tab.id ? T.gold : T.textDim,
            borderBottom: subTab === tab.id ? `2px solid ${T.gold}` : '2px solid transparent',
            transition: 'all 200ms',
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Map */}
        <div style={{ position: 'relative' }}>
          {subTab === 'carte' && (
            <>
              <FleetPredatorPage />
              {/* Bottom map overlay strip */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(15,22,41,0.92)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderTop: `1px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.gold }}>3 véhicules actifs</span>
                <span style={{ color: `${T.gold}40` }}>·</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>Distance totale: <span style={{ color: T.gold }}>270 km</span></span>
                <span style={{ color: `${T.gold}40` }}>·</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>Prochain arrêt: <span style={{ color: T.gold }}>T-04 à Résidences Atlas</span> (ETA <span style={{ color: T.danger }}>10:44</span>)</span>
              </div>
            </>
          )}
          {subTab === 'historique' && <div style={{ padding: 60, textAlign: 'center', color: T.textDim }}>Historique des trajets — Contenu en cours de déploiement...</div>}
          {subTab === 'zones' && <div style={{ padding: 60, textAlign: 'center', color: T.textDim }}>Zones & Performance — Contenu en cours de déploiement...</div>}
        </div>

        {/* Fleet sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ borderTop: `2px solid ${T.gold}`, background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: '16px 14px' }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', marginBottom: 14, textTransform: 'uppercase' as const }}>Flotte GPS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fleetSidebar.map(f => (
                <div key={f.truck} style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${f.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.textPri }}>{f.truck}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${f.color}18`, color: f.color, border: `1px solid ${f.color}40` }}>{f.status}</span>
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 11, color: T.textSec, margin: '0 0 2px' }}>{f.driver}</p>
                  <p style={{ fontSize: 10, color: T.textDim, margin: '0 0 2px' }}><MapPin size={9} style={{ display: 'inline', marginRight: 4 }} />{f.location}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>Vit: <span style={{ color: T.textPri }}>{f.speed}</span></span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>ETA: <span style={{ color: f.etaColor }}>{f.eta}</span></span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>Dist: <span style={{ color: T.textPri }}>{f.distLeft}</span></span>
                  </div>
                  {/* Trip progress bar */}
                  <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${f.tripPct}%`, height: '100%', background: f.color, borderRadius: 2, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EMPTY TAB PLACEHOLDER
// ─────────────────────────────────────────────────────
function EmptyTabPlaceholder({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color={T.gold} />
      </div>
      <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '2px' }}>{title}</p>
      <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center' }}>Contenu en cours de déploiement...</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// INTELLIGENCE IA TAB
// ─────────────────────────────────────────────────────
const FUEL_DATA = [
  { toupie: 'T-04', theo: 38, reel: 39, ecart: '+2.6%', trend: '→', alerte: 'ok' },
  { toupie: 'T-07', theo: 40, reel: 41, ecart: '+2.5%', trend: '→', alerte: 'ok' },
  { toupie: 'T-09', theo: 38, reel: 48, ecart: '+26.3%', trend: '↗', alerte: 'anomalie' },
  { toupie: 'T-12', theo: 36, reel: 37, ecart: '+2.8%', trend: '→', alerte: 'ok' },
];

const DEMAND_FORECAST_DATA = [
  { jour: 'J1', demande: 6, capacite: 10 },
  { jour: 'J2', demande: 7, capacite: 10 },
  { jour: 'J3', demande: 8, capacite: 10 },
  { jour: 'Mar 18', demande: 12, capacite: 10 },
  { jour: 'J5', demande: 9, capacite: 10 },
  { jour: 'J6', demande: 7, capacite: 10 },
  { jour: 'Ven 21', demande: 5, capacite: 10 },
  { jour: 'J8', demande: 6, capacite: 10 },
  { jour: 'J9', demande: 8, capacite: 10 },
  { jour: 'J10', demande: 7, capacite: 10 },
  { jour: 'J11', demande: 9, capacite: 10 },
  { jour: 'J12', demande: 6, capacite: 10 },
  { jour: 'J13', demande: 5, capacite: 10 },
  { jour: 'J14', demande: 7, capacite: 10 },
];

function IAKPICard({ label, value, color, subtitle, borderColor }: { label: string; value: string; color: string; subtitle?: string; borderColor?: string }) {
  return (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '16px 14px',
      borderTop: `2px solid ${borderColor || T.gold}`, flex: 1,
    }}>
      <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color, margin: 0, lineHeight: 1 }}>{value}</p>
      {subtitle && <p style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

function RecommendationBox({ text, borderColor = T.gold }: { text: React.ReactNode; borderColor?: string }) {
  return (
    <div style={{ borderLeft: `4px solid ${borderColor}`, background: borderColor === T.danger ? 'rgba(239,68,68,0.05)' : 'rgba(212,168,67,0.03)', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginTop: 16 }}>
      <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.8, margin: 0 }}>{text}</p>
    </div>
  );
}

function MiniSparkline({ trend, color }: { trend: string; color: string }) {
  if (trend === '↗') return (
    <svg width={40} height={16} viewBox="0 0 40 16"><path d="M2 14 L10 12 L20 10 L30 6 L38 2" fill="none" stroke={color} strokeWidth={1.5} /></svg>
  );
  return (
    <svg width={40} height={16} viewBox="0 0 40 16"><path d="M2 8 L10 9 L20 7 L30 8 L38 8" fill="none" stroke={color} strokeWidth={1.5} /></svg>
  );
}

// ─────────────────────────────────────────────────────
// ANALYTIQUE TAB
// ─────────────────────────────────────────────────────
const PERF_30J_DATA = (() => {
  const d = [];
  let cumRev = 0;
  const livr = [5,7,4,8,6,3,2,6,8,5,9,7,4,3,7,8,6,5,9,7,3,2,6,8,7,5,4,8,6,7];
  for (let i = 0; i < 30; i++) {
    const rev = livr[i] * 1500 + Math.round(Math.random() * 2000);
    cumRev += rev;
    d.push({ jour: `J${i + 1}`, livraisons: livr[i], revenu: rev, revenuCumule: cumRev });
  }
  return d;
})();

const HEATMAP_DATA = (() => {
  const weeks = [];
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  for (let w = 0; w < 4; w++) {
    const row: { day: string; pct: number }[] = [];
    for (let d = 0; d < 7; d++) {
      let pct = 90 + Math.round(Math.random() * 10);
      if (d === 4) pct = 70 + Math.round(Math.random() * 20); // Fridays worse
      if (d >= 5) pct = 0; // weekend — no deliveries
      row.push({ day: days[d], pct });
    }
    weeks.push(row);
  }
  return { weeks, days };
})();

function MiniGauge({ pct, label, size = 52 }: { pct: number; label: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 85 ? T.success : pct >= 70 ? T.gold : pct >= 50 ? T.warning : T.danger;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 13, fontWeight: 200, color }}>{pct}%</span>
      </div>
      <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{label}</span>
    </div>
  );
}

function AnalytiqueTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ROW 1 — HEADLINE */}
      <section>
        <SectionHeader icon={TrendingUp} label="✦ Performance Flotte — 30 Jours" />
        <Card style={{ borderTop: `2px solid ${T.gold}` }}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={PERF_30J_DATA} margin={{ top: 10, right: 50, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A843" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#C49A3C" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="revArea30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
              <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 9, fontFamily: MONO }} interval={4} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v/1000)}k`} />
              <RechartsTooltip content={<CustomTooltip />} />
              {/* Capacity threshold */}
              <Line yAxisId="left" dataKey={() => 10} name="Capacité" stroke={T.gold} strokeWidth={1} strokeDasharray="6 4" dot={false} />
              <Bar yAxisId="left" dataKey="livraisons" name="Livraisons" fill="url(#barGrad30)" radius={[3,3,0,0]} />
              <Area yAxisId="right" type="monotone" dataKey="revenuCumule" name="Revenu cumulé (DH)" stroke="#D4A843" fill="url(#revArea30)" strokeWidth={2} dot={LinePulseDot('#D4A843', PERF_30J_DATA.length)} />
            </ComposedChart>
          </ResponsiveContainer>
          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.cardBorder}`, flexWrap: 'wrap' }}>
            {[
              { label: 'TOTAL LIVR.', value: '172', color: T.textPri },
              { label: 'VOLUME TOTAL', value: '1,480 m³', color: T.gold },
              { label: 'REVENU TOTAL', value: '714,000 DH', color: T.gold },
              { label: 'PONCTUALITÉ', value: '91%', color: T.success },
              { label: 'VS MOIS DERN.', value: '+12%', color: T.gold },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: T.textDim, letterSpacing: '0.05em' }}>{s.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ROW 2 — BREAKDOWN */}
      <section>
        <SectionHeader icon={TrendingUp} label="✦ Décomposition" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

          {/* Card 1: Revenu par Toupie */}
          <Card style={{ borderTop: `2px solid ${T.gold}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', marginBottom: 16, textTransform: 'uppercase' as const }}>REVENU PAR TOUPIE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'T-04', rev: 285000, maint: 0 },
                { name: 'T-07', rev: 198000, maint: 0 },
                { name: 'T-12', rev: 142000, maint: 0 },
                { name: 'T-09', rev: 89000, maint: 36000 },
              ].map(t => {
                const maxRev = 285000;
                return (
                  <div key={t.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T.textPri }}>{t.name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T.gold }}>{t.rev.toLocaleString('fr-MA')} DH</span>
                    </div>
                    <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ width: `${((t.rev - t.maint) / maxRev) * 100}%`, background: `linear-gradient(90deg, #C49A3C, #D4A843)`, transition: 'width 0.8s ease' }} />
                      {t.maint > 0 && <div style={{ width: `${(t.maint / maxRev) * 100}%`, background: T.danger, transition: 'width 0.8s ease' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card 2: Livraisons par Client - Donut */}
          <Card style={{ borderTop: `2px solid ${T.gold}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', marginBottom: 16, textTransform: 'uppercase' as const }}>LIVRAISONS PAR CLIENT</p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '10px 0' }}>
              <svg width={140} height={140} viewBox="0 0 140 140">
                {(() => {
                  const slices = [
                    { pct: 35, color: '#D4A843' },
                    { pct: 25, color: '#E8C96A' },
                    { pct: 20, color: '#A07C2E' },
                    { pct: 20, color: '#6B7280' },
                  ];
                  const r = 55, cx = 70, cy = 70;
                  const circ = 2 * Math.PI * r;
                  let offset = 0;
                  return slices.map((s, i) => {
                    const len = (s.pct / 100) * circ;
                    const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={18}
                      strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />;
                    offset += len;
                    return el;
                  });
                })()}
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 200, color: T.textPri, margin: 0 }}>35</p>
                <p style={{ fontFamily: MONO, fontSize: 9, color: T.textDim, margin: 0 }}>livraisons</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {[
                { label: 'Résidences Atlas', pct: '35%', color: '#D4A843' },
                { label: 'Groupe A', pct: '25%', color: '#E8C96A' },
                { label: 'Saham Im', pct: '20%', color: '#A07C2E' },
                { label: 'Autres', pct: '20%', color: '#6B7280' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.textSec, flex: 1 }}>{l.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T.textPri }}>{l.pct}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 3: Performance Chauffeurs */}
          <Card style={{ borderTop: `2px solid ${T.gold}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', marginBottom: 16, textTransform: 'uppercase' as const }}>PERFORMANCE CHAUFFEURS</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO }}>
                <thead>
                  <tr>
                    {['RANG', 'CHAUFFEUR', 'LIVR./MOIS', 'PONCTUALITÉ', 'SÉCURITÉ', 'DH/KM', 'SCORE'].map(h => (
                      <th key={h} style={{ fontSize: 9, fontWeight: 600, color: T.textDim, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '6px 8px', textAlign: h === 'CHAUFFEUR' ? 'left' : 'center', borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: 1, name: 'Mehdi Tazi', livr: 28, ponct: '98%', secu: 96, dhkm: '154', score: 95, badge: '★', badgeColor: T.gold },
                    { rank: 2, name: 'Youssef Benali', livr: 42, ponct: '94%', secu: 91, dhkm: '118', score: 92, badge: '●', badgeColor: T.success },
                    { rank: 3, name: 'Karim Idrissi', livr: 35, ponct: '89%', secu: 88, dhkm: '102', score: 86, badge: '●', badgeColor: T.success },
                  ].map(d => (
                    <tr key={d.rank} style={{ borderBottom: `1px solid ${T.cardBorder}`, transition: 'background 150ms' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.04)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, color: T.textDim }}>#{d.rank}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, color: T.textPri, fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 200, color: T.textPri }}>{d.livr}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 200, color: T.textPri }}>{d.ponct}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 200, color: T.textPri }}>{d.secu}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 200, color: T.textPri }}>{d.dhkm}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 24, color: T.success }}>{d.score}</span>
                          <span style={{ fontSize: 14, color: d.badgeColor }}>{d.badge}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontFamily: MONO, fontSize: 12, color: T.textDim, marginTop: 14, lineHeight: 1.6 }}>
              Mehdi Tazi — meilleur ratio profit/km du mois. Recommandation : affecter les livraisons premium et longue distance.
            </p>
          </Card>
        </div>
      </section>

      {/* ROW 3 — EFFICIENCY */}
      <section>
        <SectionHeader icon={Activity} label="✦ Efficacité Opérationnelle" />
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>

          {/* Coût par Livraison */}
          <Card style={{ borderTop: `2px solid ${T.gold}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', marginBottom: 16, textTransform: 'uppercase' as const }}>COÛT PAR LIVRAISON</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: T.gold }}>1,420 DH</span>
              <span style={{ fontSize: 12, color: T.textDim }}>coût moyen/livraison</span>
              <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: T.success, border: `1px solid rgba(34,197,94,0.3)` }}>−8% vs mois dernier</span>
            </div>
            {/* Breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Carburant', pct: 42, color: T.danger },
                { label: 'Chauffeur', pct: 35, color: T.info },
                { label: 'Maintenance', pct: 15, color: T.warning },
                { label: 'Autre', pct: 8, color: '#6B7280' },
              ].map(b => (
                <div key={b.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: T.textSec }}>{b.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{b.pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', background: b.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px dashed ${T.gold}40`, paddingTop: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>Objectif: <span style={{ color: T.gold }}>1,300 DH/livraison</span></span>
            </div>
          </Card>

          {/* Utilisation Flotte */}
          <Card style={{ borderTop: `2px solid ${T.warning}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', marginBottom: 16, textTransform: 'uppercase' as const }}>UTILISATION FLOTTE</p>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, color: T.warning }}>72%</span>
              <p style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>taux d'utilisation moyen</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
              <MiniGauge pct={88} label="T-04" />
              <MiniGauge pct={79} label="T-07" />
              <MiniGauge pct={71} label="T-12" />
              <MiniGauge pct={42} label="T-09" />
            </div>
            <p style={{ fontFamily: MONO, fontSize: 11, color: T.danger, marginBottom: 8 }}>Temps mort total flotte: 4.2h/jour</p>
            <div style={{ borderTop: `1px dashed ${T.gold}40`, paddingTop: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>Objectif: <span style={{ color: T.gold }}>&gt;85%</span></span>
            </div>
          </Card>
        </div>
      </section>

      {/* Freshness Indicator — 30 days */}
      <Card style={{ borderTop: `2px solid ${T.success}` }}>
        <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', marginBottom: 16, textTransform: 'uppercase' as const }}>✦ INDICATEUR FRAÎCHEUR — 30 JOURS</p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'LIVRAISONS <60min:', value: '82%', color: T.success },
            { label: 'LIVRAISONS 60-80min:', value: '14%', color: T.warning },
            { label: 'LIVRAISONS >80min:', value: '4%', color: T.danger },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: T.textDim }}>{m.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: MONO, fontSize: 13, color: T.textDim, margin: '0 0 8px' }}>Temps moyen mélange→livraison: <span style={{ fontFamily: MONO, fontWeight: 200, fontSize: 24, color: T.gold }}>54 min</span></p>
        <p style={{ fontFamily: MONO, fontSize: 12, color: T.success, margin: '0 0 12px' }}>0 livraisons hors délai 90 min ce mois ✓</p>
        {/* Mini sparkline */}
        <svg width="100%" height={40} viewBox="0 0 300 40" preserveAspectRatio="none" style={{ display: 'block' }}>
          <polyline
            fill="none" stroke={T.gold} strokeWidth={1.5}
            points={[58,55,52,56,54,50,53,57,54,51,49,53,56,54,52,55,53,50,54,56,58,55,52,51,53,54,55,52,54,53].map((v, i) => `${i * 10},${40 - ((v - 45) / 15) * 36}`).join(' ')}
          />
        </svg>
      </Card>

      {/* ROW 4 — ACTION */}
      <section>
        <SectionHeader icon={Brain} label="✦ Insight IA — Analyse Flotte" right={<IABadge />} />
        <div style={{ borderTop: `2px solid ${T.gold}`, background: 'rgba(212,168,67,0.03)', border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: 20 }}>
          <p style={{ fontFamily: MONO, fontSize: 13, color: T.textDim, lineHeight: 2, margin: 0 }}>
            Analyse 30 jours : La flotte a généré <strong style={{ color: T.gold }}>714,000 DH</strong> de revenu avec un coût moyen de <strong style={{ color: T.gold }}>1,420 DH/livraison</strong> (−8% vs février). Points d'attention : (1) Le taux d'utilisation de <strong style={{ color: T.warning }}>72%</strong> est sous l'objectif de 85% — cause principale : T-09 en maintenance 12 jours sur 30. (2) Les vendredis concentrent <strong style={{ color: T.danger }}>60% des retards</strong> — lié au trafic Casablanca fin de semaine. Recommandation : planifier les livraisons vendredi avant 9h ou après 15h. (3) T-04 et T-07 sont en surcapacité les mardis/mercredis — opportunité de prospecter 2 livraisons supplémentaires ces jours. Impact estimé : <strong style={{ color: T.success }}>+28,000 DH/mois</strong>.
          </p>
        </div>
      </section>
    </div>
  );
}

function IntelligenceIATab() {
  const tblHdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '10px 12px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'left' };
  const tblCell: React.CSSProperties = { padding: '10px 12px', fontSize: 12, borderBottom: `1px solid rgba(30,45,74,0.5)` };
  const monoCell: React.CSSProperties = { ...tblCell, fontFamily: MONO, fontWeight: 200 };

  const profitBars = [
    { name: 'T-04', revenu: 15000, carburant: 2400, maintenance: 800, tempsMort: 500, total: 18200 },
    { name: 'T-07', revenu: 10010, carburant: 1850, maintenance: 600, tempsMort: 700, total: 12460 },
    { name: 'T-12', revenu: 6950, carburant: 950, maintenance: 400, tempsMort: 0, total: 8300 },
    { name: 'T-09', revenu: 0, carburant: 0, maintenance: 1200, tempsMort: 0, total: 0 },
  ];
  const maxBar = Math.max(...profitBars.map(b => b.total || b.maintenance));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* HEADER */}
      <div>
        <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: T.gold, letterSpacing: '2px', margin: '0 0 4px' }}>✦ CENTRE D'INTELLIGENCE LOGISTIQUE</p>
        <p style={{ fontFamily: MONO, fontSize: 12, color: T.gold, margin: 0 }}>4 agents actifs · Surveillance continue · Claude Opus</p>
      </div>

      {/* TOP SUMMARY STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <IAKPICard label="ÉCONOMIES ROUTES" value="+52,000 MAD/an" color={T.success} borderColor={T.success} />
        <IAKPICard label="ANOMALIES CARBURANT" value="1" color={T.danger} borderColor={T.danger} />
        <IAKPICard label="PROFIT FLOTTE/JOUR" value="30,760 DH" color={T.gold} borderColor={T.gold} />
      </div>

      {/* ─── AGENT 1: PROFIT-PER-TRUCK ─── */}
      <Card style={{ borderTop: `2px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.gold, letterSpacing: '2px' }}>✦ AGENT IA: RENTABILITÉ PAR TOUPIE</span>
            <Bdg label="● LIVE" color={T.success} bg="rgba(34,197,94,0.12)" pulse />
          </div>
          <IABadge />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <IAKPICard label="PROFIT FLOTTE JOUR" value="30,760 DH" color={T.gold} />
          <IAKPICard label="MEILLEUR RATIO" value="T-12 · 154 DH/km" color={T.success} borderColor={T.success} />
          <IAKPICard label="PIRE RATIO" value="T-09 · ARRÊT" color={T.danger} borderColor={T.danger} />
        </div>

        {/* Horizontal stacked bar chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {profitBars.map(b => {
            const total = b.revenu + b.carburant + b.maintenance + b.tempsMort;
            const w = (v: number) => total > 0 ? `${(v / maxBar) * 100}%` : '0%';
            return (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.gold, width: 40 }}>{b.name}</span>
                <div style={{ flex: 1, display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                  {b.revenu > 0 && <div style={{ width: w(b.revenu), background: T.success, transition: 'width 0.8s ease' }} />}
                  {b.carburant > 0 && <div style={{ width: w(b.carburant), background: T.danger, transition: 'width 0.8s ease' }} />}
                  {b.maintenance > 0 && <div style={{ width: w(b.maintenance), background: b.name === 'T-09' ? T.danger : T.warning, transition: 'width 0.8s ease' }} />}
                  {b.tempsMort > 0 && <div style={{ width: w(b.tempsMort), background: '#6B7280', transition: 'width 0.8s ease' }} />}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 200, color: b.revenu > 0 ? T.success : T.danger, width: 80, textAlign: 'right' }}>
                  {b.revenu > 0 ? `${(b.revenu).toLocaleString('fr-MA')} DH` : `−${b.maintenance.toLocaleString('fr-MA')} DH`}
                </span>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
            {[{ label: 'Revenu net', color: T.success }, { label: 'Carburant', color: T.danger }, { label: 'Maintenance', color: T.warning }, { label: 'Temps mort', color: '#6B7280' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                <span style={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <RecommendationBox text={
          <>T-09 en arrêt maintenance génère une perte sèche de <strong style={{ color: T.danger }}>1,200 DH/jour</strong>. Retour en service estimé demain 08:00. Impact : les 3 livraisons prévues demain pour T-09 sont réaffectées à T-04 et T-12. Le ratio profit/km de la flotte peut atteindre <strong style={{ color: T.gold }}>135 DH/km</strong> si T-09 revient en service et que les livraisons longue distance sont affectées à T-12. Revenus non-réclamés détectés : <strong style={{ color: T.danger }}>12,400 DH</strong> de surestaries + <strong style={{ color: T.danger }}>4,200 DH</strong> retour béton Sigma Bâtiment non-facturé = <strong style={{ color: T.gold }}>16,600 DH de manque à gagner</strong>. Action immédiate recommandée.</>
        } />
      </Card>

      {/* ─── AGENT 2: OPTIMISEUR DE ROUTES ─── */}
      <Card style={{ borderTop: `2px solid ${T.success}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.gold, letterSpacing: '2px' }}>✦ AGENT IA: OPTIMISEUR DE ROUTES</span>
          <IABadge />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <IAKPICard label="KM ÉCONOMISÉS/JOUR" value="34 km" color={T.success} subtitle="−12% vs non-optimisé" borderColor={T.success} />
          <IAKPICard label="CARBURANT ÉCONOMISÉ" value="12 L/jour" color={T.success} borderColor={T.success} />
          <IAKPICard label="GAIN ANNUEL" value="+52,000 MAD" color={T.gold} borderColor={T.success} />
        </div>

        {/* Route comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 16, borderTop: `2px solid ${T.textDim}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: '1.5px', marginBottom: 10, textTransform: 'uppercase' as const }}>ROUTE ACTUELLE</p>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: 8, lineHeight: 1.5 }}>T-04: Atlas Concrete → Résidences Atlas (Chantier Maarif) → Retour</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>Distance: <span style={{ color: T.textPri }}>67 km</span> · Temps: <span style={{ color: T.textPri }}>1h45</span> · Carburant: <span style={{ color: T.textPri }}>28L</span></p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              {[T.gold, T.info, T.textDim].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  {i < 2 && <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, ${c}, ${[T.info, T.textDim][i]})` }} />}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.03)', border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 16, borderTop: `2px solid ${T.success}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.success, letterSpacing: '1.5px', marginBottom: 10, textTransform: 'uppercase' as const }}>ROUTE OPTIMISÉE IA</p>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: 8, lineHeight: 1.5 }}>T-04: Atlas Concrete → Résidences Atlas → Groupe A (Rabat Center) → Retour</p>
            <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>Distance: <span style={{ color: T.textPri }}>52 km</span> · Temps: <span style={{ color: T.textPri }}>1h20</span> · Carburant: <span style={{ color: T.textPri }}>22L</span></p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              {[T.gold, T.gold, T.gold, T.gold].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  {i < 3 && <div style={{ width: 30, height: 2, background: T.gold }} />}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <Bdg label="−15 km · −25 min · −6L" color={T.success} bg="rgba(34,197,94,0.12)" />
            </div>
          </div>
        </div>

        <RecommendationBox borderColor={T.success} text={
           <>En regroupant les livraisons par zone géographique (Casablanca Est le matin, axe Rabat l'après-midi), réduction estimée de <strong style={{ color: T.success }}>22% des km parcourus</strong>. Économie carburant : <strong style={{ color: T.gold }}>52,000 MAD/an</strong>. Bonus : réduction temps d'attente de 35% en évitant les créneaux de trafic 10h-12h sur l'axe A3. Opportunité retour chargé : T-04 peut récupérer <strong style={{ color: T.gold }}>20T de gravette</strong> chez Carrières du Sud (à 8 km du chantier Résidences Atlas) sur le trajet retour. Élimination complète du retour à vide + économie transport matière première de <strong style={{ color: T.gold }}>1,200 DH</strong>.</>
         } />
      </Card>

      {/* ─── AGENT 3: SURVEILLANCE CARBURANT ─── */}
      <Card style={{ borderTop: `2px solid ${T.danger}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.gold, letterSpacing: '2px' }}>✦ AGENT IA: SURVEILLANCE CARBURANT</span>
            <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'transparent', border: `1px solid ${T.danger}40`, color: T.danger }}>FORENSIQUE</span>
          </div>
          <IABadge />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <IAKPICard label="CONSO MOY./100KM" value="42 L" color={T.gold} subtitle="flotte complète" />
          <IAKPICard label="ANOMALIES" value="1" color={T.danger} subtitle="T-09 avant arrêt" borderColor={T.danger} />
          <IAKPICard label="SURCOÛT ESTIMÉ" value="3,200 MAD/mois" color={T.danger} borderColor={T.danger} />
        </div>

        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['TOUPIE', 'CONSO THÉORIQUE', 'CONSO RÉELLE', 'ÉCART', 'TENDANCE 30J', 'ALERTE'].map(h => <th key={h} style={tblHdr}>{h}</th>)}
            </tr></thead>
            <tbody>
              {FUEL_DATA.map((r, i) => (
                <tr key={r.toupie} style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.03)',
                  borderLeft: r.alerte === 'anomalie' ? `3px solid ${T.danger}` : 'none',
                }}>
                  <td style={{ ...monoCell, color: T.gold, fontWeight: 700 }}>{r.toupie}</td>
                  <td style={monoCell}>{r.theo} L/100km</td>
                  <td style={{ ...monoCell, color: r.alerte === 'anomalie' ? T.danger : T.textPri }}>{r.reel} L/100km</td>
                  <td style={{ ...monoCell, color: r.alerte === 'anomalie' ? T.danger : T.textDim, fontWeight: r.alerte === 'anomalie' ? 700 : 200 }}>{r.ecart}</td>
                  <td style={tblCell}><MiniSparkline trend={r.trend} color={r.alerte === 'anomalie' ? T.danger : T.textDim} /></td>
                  <td style={tblCell}>
                    {r.alerte === 'ok'
                      ? <Bdg label="✓ OK" color={T.success} bg="rgba(34,197,94,0.12)" />
                      : <Bdg label="⚠ ANOMALIE" color={T.danger} bg="rgba(239,68,68,0.12)" />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <RecommendationBox borderColor={T.danger} text={
          <>T-09 : consommation <strong style={{ color: T.danger }}>+26% au-dessus de la norme</strong> sur 30 jours. Tendance croissante avant mise en maintenance. Corrélation identifiée : usure pneus détectée le 10/03 augmente la résistance au roulement. Coût supplémentaire estimé : <strong style={{ color: T.danger }}>3,200 MAD/mois</strong> si non-traité. Vérification en cours pendant maintenance actuelle.</>
        } />
      </Card>

      {/* ─── AGENT 4: PRÉDICTEUR DE DEMANDE ─── */}
      <Card style={{ borderTop: `2px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.gold, letterSpacing: '2px' }}>✦ AGENT IA: PRÉDICTEUR DE DEMANDE</span>
          <IABadge />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <IAKPICard label="DEMANDE PRÉVUE J+7" value="42 livraisons" color={T.gold} borderColor={T.gold} />
          <IAKPICard label="CAPACITÉ DISPONIBLE" value="89%" color={T.success} borderColor={T.gold} />
          <IAKPICard label="RISQUE SATURATION" value="Mardi 18/03" color={T.warning} subtitle="pic 12 livraisons" borderColor={T.gold} />
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={DEMAND_FORECAST_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="demandOkArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
            <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10, fontFamily: MONO }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} domain={[0, 14]} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area dataKey="capacite" name="Capacité" fill="rgba(212,168,67,0.04)" stroke="none" />
            <Line dataKey="capacite" name="Capacité max" type="monotone" stroke={T.gold} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
            <Line dataKey="demande" name="Demande prévue" type="monotone" stroke={T.gold} strokeWidth={2.5}
              dot={(props: any) => {
                const isOver = props.payload.demande > props.payload.capacite;
                const isToday = props.index === 0;
                return (
                  <g key={props.index}>
                    <circle cx={props.cx} cy={props.cy} r={isOver ? 5 : 4} fill={isOver ? T.danger : T.gold} />
                    {isToday && <>
                      <circle cx={props.cx} cy={props.cy} r={8} fill="none" stroke={T.gold} strokeWidth={1.5} opacity={0.5}>
                        <animate attributeName="r" from="5" to="14" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    </>}
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 11, padding: '3px 10px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', color: T.warning, border: `1px solid ${T.warning}40` }}>
            Mar 18: PIC 12 livr.
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, padding: '3px 10px', borderRadius: 4, background: 'rgba(212,168,67,0.08)', color: T.gold, border: `1px solid ${T.gold}40` }}>
            Ven 21: Ramadan début — ralentissement
          </span>
        </div>

        <RecommendationBox text={
          <>Pic de demande prévu <strong style={{ color: T.warning }}>mardi 18 mars : 12 livraisons</strong>, dépassant la capacité nominale de 10 livraisons/jour (3 toupies actives). Options : (1) Rappeler T-09 de maintenance lundi soir — faisable si pneus remplacés d'ici là. (2) Sous-traiter 2 livraisons à prestataire externe (coût estimé : <strong style={{ color: T.gold }}>2,400 DH</strong>, marge préservée à 28%). (3) Décaler 2 livraisons non-urgentes à mercredi. <strong style={{ color: T.success }}>Recommandation : option 1 + option 3 pour coût zéro.</strong></>
        } />
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════
export default function WorldClassDeliveries() {
  const [activeTab, setActiveTab] = useState('flotte');
  const { todayBons, weekBons, allBons, fleet, loading } = useDeliveriesLiveData();

  const activePipeline = todayBons.length > 0 ? todayBons : SEEDED_DELIVERIES;
  const totalDeliveries = activePipeline.length;
  const totalVolume = Math.round(activePipeline.reduce((s, b) => s + (b.volume_m3 || 0), 0));
  const delivered = activePipeline.filter(b => ['validation_technique', 'livre', 'livré', 'termine'].includes(b.workflow_status)).length;
  const enRoute = activePipeline.filter(b => b.workflow_status === 'production').length;
  const planned = activePipeline.filter(b => b.workflow_status === 'planification').length;

  const hoursLeft = Math.max(1, 18 - new Date().getHours());
  const enRouteRisk = Math.min(100, Math.round((45 / (hoursLeft * 60)) * 100));
  const planRisk = Math.round(planned * 5);
  const deliveredRisk = totalDeliveries > 0 ? Math.max(0, 100 - Math.round((delivered / totalDeliveries) * 100)) : 0;

  const pipeline = [
    { label: 'Planifié', count: planned, color: T.warning, aiRisk: { label: 'Risque Saturation', pct: planRisk } },
    { label: 'En Route', count: enRoute, color: T.info, aiRisk: { label: 'Risque Retard', pct: enRouteRisk } },
    { label: 'Livré', count: delivered, color: T.success, aiRisk: { label: 'Non-Livré', pct: deliveredRisk } },
  ];

  const perfData = useMemo(() => {
    if (allBons.length === 0) return buildSeededWeeklyData();
    const map: Record<string, { livraisons: number; volume: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      map[key] = { livraisons: 0, volume: 0, revenue: 0 };
    }
    allBons.forEach(b => {
      if (map[b.date_livraison]) {
        map[b.date_livraison].livraisons++;
        map[b.date_livraison].volume += b.volume_m3 || 0;
      }
    });
    return Object.entries(map).map(([key]) => {
      const d = new Date(key + 'T00:00:00');
      const val = map[key];
      return { day: format(d, 'EEE dd/MM', { locale: fr }), livraisons: val.livraisons, volume: Math.round(val.volume), revenue: Math.round(val.volume * 1500) };
    });
  }, [allBons]);

  const tblHdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '10px 12px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'left' };
  const tblCell: React.CSSProperties = { padding: '10px 12px', fontSize: 12, borderBottom: `1px solid rgba(30,45,74,0.5)` };
  const monoCell: React.CSSProperties = { ...tblCell, fontFamily: MONO, fontWeight: 200 };
  const altRow = (i: number): React.CSSProperties => ({ background: i % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.03)' });

  const TABS = [
    { id: 'flotte', label: 'FLOTTE & LIVRAISONS' },
    { id: 'gps', label: 'CARTE GPS' },
    { id: 'analytique', label: 'ANALYTIQUE' },
    { id: 'ia', label: 'INTELLIGENCE IA', badge: '4' },
  ];

  const revenuTotal = activePipeline.reduce((s, b) => s + ((b.volume_m3 || 0) * (b.prix_vente_m3 || 1510)), 0);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.textPri, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes tbos-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes tab-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* PAGE HEADER */}
      <div style={{ padding: '24px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FFD700, #D4A843)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={18} color="#0F1629" />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', margin: 0 }}>TBOS Logistique</p>
            <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>Gestion de flotte, livraisons & performance</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: T.gold, border: 'none', borderRadius: 9, color: '#0F1629', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            <Route size={13} /> Optimiser Routes
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'transparent', border: `1px solid ${T.gold}`, borderRadius: 9, color: T.gold, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            <Truck size={13} /> Nouveau Véhicule
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'transparent', border: `1px solid ${T.gold}`, borderRadius: 9, color: T.gold, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            <Fuel size={13} /> Relevé Carburant
          </button>
          <LiveClock />
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ padding: '20px 32px 0', borderBottom: `1px solid ${T.cardBorder}` }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: MONO, fontSize: 12, letterSpacing: '1.5px', fontWeight: 700,
              color: activeTab === tab.id ? T.gold : T.textDim,
              borderBottom: activeTab === tab.id ? `2px solid ${T.gold}` : '2px solid transparent',
              transition: 'all 200ms',
            }}>
              {tab.label}
              {tab.badge && (
                <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(212,168,67,0.15)', color: T.gold, border: `1px solid ${T.gold}40` }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: '32px 32px 0', animation: 'tab-fade 0.35s ease-out' }} key={activeTab}>

        {/* ════════════════════════════════════════════ */}
        {/* FLOTTE & LIVRAISONS TAB                      */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'flotte' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* 3a. LIVE STATUS STRIP */}
            <div style={{ background: 'rgba(212,168,67,0.03)', borderLeft: '4px solid #D4A843', padding: '12px 20px', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', fontFamily: MONO, fontSize: 12, color: T.textDim }}>
                <Bdg label="● EN DIRECT" color={T.success} bg="rgba(34,197,94,0.12)" pulse />
                <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span><span style={{ color: '#FFFFFF' }}>3</span> livraisons planifiées · <span style={{ color: '#FFFFFF' }}>1</span> en route · <span style={{ color: '#FFFFFF' }}>1</span> livrée</span>
                <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span>Prochaine: <span style={{ color: '#FFFFFF' }}>BL-2024-A8F3</span> départ <span style={{ color: '#FFFFFF' }}>10:30</span></span>
                <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span><span style={{ color: '#FFFFFF' }}>T-04</span> disponible</span>
              </div>
            </div>

            {/* 3b. KPI CARDS */}
            <section>
              <SectionHeader icon={TrendingUp} label="✦ Indicateurs Clés" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                <KPICard label="Livraisons Aujourd'hui" value={String(totalDeliveries)} color="#FFFFFF" subtitle={`↑ ${delivered} livrée`} delay={0} />
                <KPICard label="Volume Livré" value={`${totalVolume}.0 m³`} color={T.gold} subtitle={`${enRoute} en route`} delay={80} />
                <KPICard label="Revenu Journée" value={`${Math.round(revenuTotal).toLocaleString('fr-MA')} DH`} color={T.gold} subtitle="marge moy: 36%" delay={160} />
                <KPICard label="Taux Ponctualité" value="94%" color={T.success} subtitle="+2% vs sem." delay={240} />
                {/* Custom split-color card for Flotte Active */}
                <div style={{ opacity: 1, transform: 'translateY(0)', transition: 'all 500ms ease-out' }}>
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '18px 16px', borderTop: `2px solid ${T.gold}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>FLOTTE ACTIVE</p>
                    <p style={{ fontFamily: MONO, fontSize: 36, fontWeight: 200, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}><span style={{ color: '#FFFFFF' }}>3</span><span style={{ color: '#9CA3AF' }}>/4</span></p>
                    <p style={{ fontSize: 11, color: T.warning, marginTop: 6 }}>1 maintenance</p>
                  </div>
                </div>
              </div>
            </section>

            {/* FLEET STATUS STRIP */}
            <div style={{ background: 'rgba(212,168,67,0.03)', borderRadius: 8, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontFamily: MONO, fontSize: 11 }}>
                {[
                  { label: 'DISPONIBLES: 1', color: T.success, pulse: false },
                  { label: 'EN LIVRAISON: 2', color: T.gold, pulse: true },
                  { label: 'EN RETOUR: 1', color: T.textDim, pulse: false },
                  { label: 'MAINTENANCE: 1', color: T.danger, pulse: false },
                ].map((s, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: s.color }}>
                    {i > 0 && <span style={{ margin: '0 10px', color: `${T.gold}40` }}>·</span>}
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0, animation: s.pulse ? 'tbos-pulse 1.5s ease-in-out infinite' : 'none' }} />
                    {s.label}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 11 }}>
                <span style={{ color: T.textDim }}>🍃 ÉMISSIONS CO₂: <span style={{ color: T.textPri }}>0.8 T</span></span>
                <span style={{ color: T.success }}>↓ −15% vs mois dernier grâce à l'optimisation IA</span>
              </div>
            </div>

            {/* 3c. SANTÉ FLOTTE */}
            <section>
              <SectionHeader icon={Truck} label="✦ Santé Flotte IA" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {FLEET_HEALTH_DATA.map((v, i) => <FleetHealthCard key={v.name} v={v} delay={i * 100} />)}
              </div>
            </section>

            {/* 3d. BRIEFING IA */}
            <LogisticsBriefingBanner totalDeliveries={totalDeliveries} enRoute={enRoute} planned={planned} />

            {/* 3e. PIPELINE */}
            <section>
              <SectionHeader icon={Truck} label="✦ Pipeline de Livraison" />
              <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                {pipeline.map((stage, i) => (
                  <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 12 }}>
                    <PipelineCard label={stage.label} count={stage.count} color={stage.color} delay={i * 100} aiRisk={stage.aiRisk} />
                    {i < pipeline.length - 1 && <span style={{ fontFamily: MONO, color: T.gold, fontSize: 18, opacity: 0.4 }}>→</span>}
                  </div>
                ))}
              </div>
            </section>

            {/* 3f. LIVRAISONS AUJOURD'HUI */}
            <section>
              <SectionHeader icon={Package} label="✦ Livraisons Aujourd'hui" right={
                <Bdg label="● LIVE" color={T.success} bg="rgba(34,197,94,0.12)" pulse />
              } />
              {/* Fraîcheur béton label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '1.5px', color: T.textDim, textTransform: 'uppercase' as const }}>FRAÎCHEUR BÉTON</span>
                <span title="Le béton doit être livré dans les 90 minutes suivant le mélange pour garantir la conformité NM." style={{ cursor: 'help', fontFamily: MONO, fontSize: 10, color: T.textDim, border: `1px solid ${T.textDim}40`, borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>?</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(todayBons.length > 0 ? todayBons : SEEDED_DELIVERIES).map((d: any, i: number) => (
                  <DeliveryCard key={d.bl_id} d={d} index={i} />
                ))}
              </div>
            </section>

            {/* 3g. PROFIT PAR TOUPIE */}
            <section>
              <SectionHeader icon={TrendingUp} label="✦ Rentabilité par Toupie — Aujourd'hui" right={<IABadge />} />
              <Card style={{ borderTop: `2px solid ${T.gold}` }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['TOUPIE','CHAUFFEUR','LIVRAISONS','KM','REVENU','CARBURANT','MAINTENANCE','TEMPS MORT','PROFIT NET','DH/KM','RETOUR VIDE',''].map(h => <th key={h} style={tblHdr}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {PROFIT_DATA.map((r, i) => (
                        <tr key={r.toupie} style={{ ...altRow(i), transition: 'background 150ms' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.03)')}>
                          <td style={{ ...monoCell, color: T.gold, fontWeight: 700 }}>{r.toupie}</td>
                          <td style={{ ...tblCell, color: T.textSec }}>{r.chauffeur}</td>
                          <td style={monoCell}>{r.livraisons}</td>
                          <td style={monoCell}>{r.km} km</td>
                          <td style={{ ...monoCell, color: r.revenu > 0 ? T.gold : T.textDim }}>{r.revenu.toLocaleString('fr-MA')} DH</td>
                          <td style={{ ...monoCell, color: T.danger }}>{r.carburant.toLocaleString('fr-MA')} DH</td>
                          <td style={{ ...monoCell, color: T.danger }}>{r.maintenance.toLocaleString('fr-MA')} DH</td>
                          <td style={{ ...monoCell, color: r.tempsMort === 'MAINTENANCE' ? T.danger : T.textDim }}>{r.tempsMort}</td>
                          <td style={{ ...monoCell, color: r.profit >= 0 ? T.success : T.danger, fontWeight: 700 }}>{r.profit.toLocaleString('fr-MA')} DH</td>
                          <td style={{ ...monoCell, color: T.gold, fontWeight: 700 }}>{r.dhKm > 0 ? `${r.dhKm} DH/km` : '—'}</td>
                          <td style={{ ...monoCell, color: r.retourVideColor }}>{r.retourVide}</td>
                          <td style={tblCell}>
                            {r.badge && <span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${r.badgeColor}18`, color: r.badgeColor, border: `1px solid ${r.badgeColor}40` }}>{r.badge}</span>}
                          </td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr style={{ background: 'rgba(212,168,67,0.05)', borderTop: `2px solid ${T.gold}` }}>
                        <td style={{ ...monoCell, color: T.gold, fontWeight: 700 }}>{PROFIT_TOTALS.toupie}</td>
                        <td style={tblCell}>—</td>
                        <td style={{ ...monoCell, fontWeight: 700 }}>{PROFIT_TOTALS.livraisons}</td>
                        <td style={{ ...monoCell, fontWeight: 700 }}>{PROFIT_TOTALS.km} km</td>
                        <td style={{ ...monoCell, fontWeight: 700, color: T.gold }}>{PROFIT_TOTALS.revenu.toLocaleString('fr-MA')} DH</td>
                        <td style={{ ...monoCell, color: T.danger, fontWeight: 700 }}>{PROFIT_TOTALS.carburant.toLocaleString('fr-MA')} DH</td>
                        <td style={{ ...monoCell, color: T.danger, fontWeight: 700 }}>{PROFIT_TOTALS.maintenance.toLocaleString('fr-MA')} DH</td>
                        <td style={monoCell}>—</td>
                        <td style={{ ...monoCell, color: T.success, fontWeight: 700 }}>{PROFIT_TOTALS.profit.toLocaleString('fr-MA')} DH</td>
                         <td style={{ ...monoCell, color: T.gold, fontWeight: 700 }}>{PROFIT_TOTALS.dhKm} DH/km</td>
                         <td style={{ ...monoCell, color: PROFIT_TOTALS.retourVideColor }}>{PROFIT_TOTALS.retourVide}</td>
                         <td style={tblCell}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* AI insight */}
                <div style={{ borderLeft: '4px solid #D4A843', background: 'rgba(212,168,67,0.03)', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginTop: 16 }}>
                   <p style={{ fontFamily: MONO, fontSize: 12, color: T.textSec, lineHeight: 1.7, margin: 0 }}>
                     T-12 affiche le meilleur ratio profit/km (<strong style={{ color: T.gold }}>154 DH/km</strong>) grâce à zéro temps mort. T-04 génère le plus de revenu brut mais perd 15 min en attente chantier. T-09 en maintenance coûte <strong style={{ color: T.danger }}>1,200 DH/jour</strong> — planifier retour en service demain matin. Recommandation : affecter les livraisons longue distance à T-12 pour maximiser la rentabilité. Taux retour à vide flotte : <strong style={{ color: T.warning }}>38%</strong> (objectif &lt;25%). En combinant livraison Résidences Atlas + chargement retour matériaux Saham Im, élimination de <strong style={{ color: T.success }}>23 km à vide</strong>. Économie estimée : <strong style={{ color: T.gold }}>8,400 MAD/mois</strong>.
                   </p>
                </div>
              </Card>
            </section>

            {/* ═══ RETOUR BÉTON TRACKER ═══ */}
            <section>
              <SectionHeader icon={AlertTriangle} label="✦ Suivi Retours Béton — Pertes Évitables" />
              <Card style={{ borderTop: `2px solid ${T.success}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '16px 14px', borderTop: `2px solid ${T.success}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>RETOURS CE MOIS</p>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.success, margin: 0, lineHeight: 1 }}>0</p>
                    <p style={{ fontSize: 11, color: T.success, marginTop: 6 }}>objectif: 0</p>
                  </div>
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '16px 14px', borderTop: `2px solid ${T.success}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>PERTES ÉVITÉES</p>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.success, margin: 0, lineHeight: 1 }}>0 DH</p>
                    <p style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>vs 4,200 DH mois dernier</p>
                  </div>
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '16px 14px', borderTop: `2px solid ${T.success}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>TAUX RETOUR</p>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.success, margin: 0, lineHeight: 1 }}>0%</p>
                    <p style={{ fontSize: 11, color: T.success, marginTop: 6 }}>−100% vs M-1 ✓</p>
                  </div>
                </div>

                <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', textTransform: 'uppercase' as const, marginBottom: 12 }}>HISTORIQUE RETOURS (6 DERNIERS MOIS)</p>
                <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['DATE', 'CLIENT', 'VOLUME', 'CAUSE', 'PERTE', 'FACTURABLE'].map(h => <th key={h} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.15em', padding: '10px 12px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'left' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[
                        { date: '06/03', client: 'Sigma Bâtiment', volume: '8 m³ F-B25', cause: 'Chantier non-prêt', perte: '4,200 DH', facturable: 'Non-facturé', fColor: T.danger },
                        { date: '14/02', client: 'BTP Maroc', volume: '6 m³ F-B20', cause: 'Accès bloqué', perte: '2,800 DH', facturable: 'Facturé', fColor: T.success },
                        { date: '22/01', client: 'Saudi Readymix', volume: '10 m³ F-B30', cause: 'Client absent', perte: '6,100 DH', facturable: 'Non-facturé', fColor: T.danger },
                      ].map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.03)', borderBottom: `1px solid rgba(30,45,74,0.5)` }}>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, color: T.textSec }}>{r.date}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: T.textPri }}>{r.client}</td>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, color: T.gold }}>{r.volume}</td>
                          <td style={{ padding: '10px 12px', fontSize: 11, color: T.textSec }}>{r.cause}</td>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, fontWeight: 200, color: T.danger }}>{r.perte}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: r.fColor === T.success ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: r.fColor, border: `1px solid ${r.fColor}40` }}>{r.facturable}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <RecommendationBox text={
                  <>Tendance positive : <strong style={{ color: T.success }}>0 retour ce mois</strong> vs 1 en février et 1 en janvier. Le retour Sigma Bâtiment du 06/03 (<strong style={{ color: T.danger }}>4,200 DH</strong>) n'a pas été facturé — relance recommandée. Sur 6 mois, <strong style={{ color: T.gold }}>62% des retours</strong> sont causés par "chantier non-prêt". Solution : activer la confirmation chantier avant départ (voir ci-dessous).</>
                } />
                <div style={{ marginTop: 10 }}><IABadge /></div>
              </Card>
            </section>

            {/* ═══ CONFIRMATION CHANTIER ═══ */}
            <section>
              <SectionHeader icon={CheckCircle} label="✦ Confirmation Chantier — Pré-Livraison" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Card 1 — Résidences Atlas: none confirmed */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${T.danger}`, borderRadius: 10, padding: '16px 20px' }}>
                  <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.textPri, marginBottom: 10 }}>BL-2024-A8F3 — Résidences Atlas</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, fontFamily: MONO, fontSize: 11 }}>
                    <span style={{ color: T.warning }}>☐ Pompe sur site — <span style={{ color: T.warning }}>Non confirmé</span></span>
                    <span style={{ color: T.warning }}>☐ Accès chantier dégagé — <span style={{ color: T.warning }}>Non confirmé</span></span>
                    <span style={{ color: T.warning }}>☐ Responsable présent — <span style={{ color: T.warning }}>Non confirmé</span></span>
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: T.danger, lineHeight: 1.5, marginBottom: 10 }}>⚠ RISQUE: Aucune confirmation reçue — retard départ recommandé jusqu'à confirmation. Coût potentiel retour: 4,800 DH</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: '7px 14px', background: T.gold, border: 'none', borderRadius: 6, color: '#0F1629', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: MONO }}>Envoyer Rappel SMS</button>
                    <button style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${T.gold}`, borderRadius: 6, color: T.gold, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: MONO }}>Appeler Chantier</button>
                  </div>
                </div>

                {/* Card 2 — Groupe A: fully confirmed */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${T.success}`, borderRadius: 10, padding: '16px 20px' }}>
                  <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.textPri, marginBottom: 10 }}>BL-2024-C1D7 — Groupe Addoha</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, fontFamily: MONO, fontSize: 11 }}>
                    <span style={{ color: T.success }}>✓ Pompe sur site</span>
                    <span style={{ color: T.success }}>✓ Accès dégagé</span>
                    <span style={{ color: T.success }}>✓ Responsable: M. Idrissi confirmé à 06:45</span>
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: T.success }}>✓ CONFIRMÉ — Chantier prêt</p>
                </div>

                {/* Card 3 — Saham Im: partial */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${T.warning}`, borderRadius: 10, padding: '16px 20px' }}>
                  <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.textPri, marginBottom: 10 }}>BL-2024-E5B2 — Saham Immobilier</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, fontFamily: MONO, fontSize: 11 }}>
                    <span style={{ color: T.warning }}>☐ Pompe sur site</span>
                    <span style={{ color: T.success }}>✓ Accès dégagé</span>
                    <span style={{ color: T.warning }}>☐ Responsable présent</span>
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: T.warning }}>⚠ Confirmation partielle — départ prévu 14:00, relance envoyée à 12:00</p>
                </div>
              </div>
            </section>

            {/* ═══ SURESTARIES ═══ */}
            <section>
              <SectionHeader icon={Clock} label="✦ Surestaries — Temps d'Attente Facturable" />
              <Card style={{ borderTop: `2px solid ${T.gold}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '16px 14px', borderTop: `2px solid ${T.gold}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>ATTENTE TOTALE JOUR</p>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.warning, margin: 0, lineHeight: 1 }}>47 min</p>
                    <p style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>seuil: 20 min/livraison</p>
                  </div>
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '16px 14px', borderTop: `2px solid ${T.danger}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>FACTURABLE NON-RÉCLAMÉ</p>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.danger, margin: 0, lineHeight: 1 }}>2,800 DH</p>
                    <p style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>ce mois</p>
                  </div>
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: '16px 14px', borderTop: `2px solid ${T.success}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 8 }}>FACTURÉ CE MOIS</p>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 200, color: T.success, margin: 0, lineHeight: 1 }}>1,200 DH</p>
                    <p style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>3 surestaries</p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['LIVRAISON', 'CLIENT', 'ATTENTE', 'SEUIL', 'DÉPASSEMENT', 'MONTANT', 'STATUT'].map(h => <th key={h} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase' as const, letterSpacing: '0.15em', padding: '10px 12px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'left' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[
                        { bl: 'BL-2024-C1D7', client: 'Groupe A', attente: '12 min', seuil: '20 min', depassement: '—', montant: '0 DH', statut: 'Sous seuil', sColor: T.success, flagged: false },
                        { bl: 'BL-2024-A8F3', client: 'Résidences Atlas', attente: '22 min', seuil: '20 min', depassement: '+2 min', montant: '400 DH', statut: 'À facturer', sColor: T.warning, flagged: false },
                        { bl: '13/03 BL', client: 'TGCC', attente: '35 min', seuil: '20 min', depassement: '+15 min', montant: '1,500 DH', statut: 'Facturé', sColor: T.success, flagged: false },
                        { bl: '10/03 BL', client: 'Saudi Readymix', attente: '28 min', seuil: '20 min', depassement: '+8 min', montant: '800 DH', statut: 'Non-facturé', sColor: T.danger, flagged: true },
                        { bl: '09/03 BL', client: 'Sigma Bâtiment', attente: '45 min', seuil: '20 min', depassement: '+25 min', montant: '2,500 DH', statut: 'Non-facturé', sColor: T.danger, flagged: true },
                      ].map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.03)', borderBottom: `1px solid rgba(30,45,74,0.5)`, borderLeft: r.flagged ? `3px solid ${T.danger}` : 'none', transition: 'background 150ms' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(212,168,67,0.03)')}>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, color: T.gold }}>{r.bl}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: T.textPri }}>{r.client}</td>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, color: T.textSec }}>{r.attente}</td>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, color: T.textDim }}>{r.seuil}</td>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, color: r.depassement === '—' ? T.textDim : T.warning }}>{r.depassement}</td>
                          <td style={{ padding: '10px 12px', fontFamily: MONO, fontSize: 11, fontWeight: 200, color: r.montant === '0 DH' ? T.textDim : T.gold }}>{r.montant}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ fontFamily: MONO, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: r.sColor === T.success ? 'rgba(34,197,94,0.12)' : r.sColor === T.warning ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: r.sColor, border: `1px solid ${r.sColor}40` }}>{r.statut}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button style={{ padding: '9px 20px', background: T.gold, border: 'none', borderRadius: 8, color: '#0F1629', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: MONO, marginBottom: 16 }}>
                  Facturer Tout
                </button>

                <RecommendationBox text={
                  <><strong style={{ color: T.gold }}>12,400 DH</strong> de surestaries non-facturées sur 30 jours. Sigma Bâtiment concentre <strong style={{ color: T.danger }}>45% du temps d'attente excessif</strong> (2 occurrences, 73 min total). Recommandation : (1) Facturer immédiatement les <strong style={{ color: T.gold }}>3,300 DH</strong> de surestaries Sigma Bâtiment et Saudi Readymix. (2) Instaurer confirmation chantier obligatoire pour réduire les temps d'attente de 40%.</>
                } />
                <div style={{ marginTop: 10 }}><IABadge /></div>
              </Card>
            </section>

            {/* 3h. PERFORMANCE HEBDOMADAIRE */}
            <section>
              <SectionHeader icon={TrendingUp} label="✦ Performance Hebdomadaire" />
              <Card style={{ borderTop: `2px solid ${T.gold}` }}>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={perfData} margin={{ top: 10, right: 50, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradLog" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A843" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#C49A3C" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="revenueAreaLog" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A843" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 10 }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey="livraisons" name="Livraisons" fill="url(#barGradLog)" radius={[4, 4, 0, 0]} />
                    <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenu (DH)" stroke="#D4A843" fill="url(#revenueAreaLog)" strokeWidth={3} dot={LinePulseDot('#D4A843', perfData.length)} />
                  </ComposedChart>
                </ResponsiveContainer>
                {/* Summary strip */}
                <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.cardBorder}`, flexWrap: 'wrap' }}>
                  {[
                    { label: 'PIC', value: '8', color: T.success },
                    { label: 'CREUX', value: '2', color: T.warning },
                    { label: 'MOY.', value: '5', color: T.gold },
                    { label: 'VS SEM. DERN.', value: '+12%', color: T.success },
                    { label: 'REVENU TOTAL', value: '43,950 DH', color: T.gold },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.textDim, letterSpacing: '0.05em' }}>{s.label}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                {/* Summary strip */}
                <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.cardBorder}`, flexWrap: 'wrap' }}>
                  {[
                    { label: 'DEMANDE J+7:', value: '42 livr.', color: T.gold },
                    { label: 'PIC PRÉVU:', value: 'Mar 18 (12 livr.)', color: T.warning },
                    { label: 'CAPACITÉ:', value: '10/jour', color: T.textPri },
                    { label: 'RISQUE:', value: '⚠ Saturation mardi', color: T.warning },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.textDim }}>{s.label}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* PASSATION LOGISTIQUE */}
            <section>
              <SectionHeader icon={ClipboardCheck} label="✦ Passation Logistique — Fin de Journée" />
              <Card style={{ borderTop: `2px solid ${T.gold}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {[
                     { color: T.success, text: '1 livraison complétée — Groupe A, 8 m³ F-B25, livré à 09:02 ✓', pulse: false },
                     { color: T.gold, text: '1 livraison en cours — Résidences Atlas, 12 m³ F-B30, T-04 en route (ETA 10:44, +14 min retard trafic)', pulse: true },
                     { color: T.warning, text: '1 livraison planifiée — Saham Im, 10 m³ F-B35, T-12 départ prévu 14:00', pulse: false },
                     { color: T.warning, text: 'Fraîcheur béton: livraison Résidences Atlas à 47 min/90 min — surveiller. Si retard dépasse 25 min supplémentaires, préparer batch de remplacement.', pulse: false },
                     { color: T.danger, text: 'T-09 en maintenance — pneus à remplacer. Retour prévu demain 08:00. 3 livraisons T-09 réaffectées.', pulse: false },
                     { color: T.success, text: 'Carburant flotte : T-04 34% (ravitaillement ce soir), T-07 62% ✓, T-12 78% ✓', pulse: false },
                     { color: T.danger, text: 'Surestaries non-facturées: 3,300 DH (Sigma Bâtiment 2,500 DH + Saudi Readymix 800 DH) — facturer avant fin de semaine', pulse: false },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, marginTop: 4, flexShrink: 0, animation: item.pulse ? 'tbos-pulse 1.5s ease-in-out infinite' : 'none' }} />
                      <span style={{ fontFamily: MONO, fontSize: 13, color: item.color === T.danger ? T.danger : T.textSec, lineHeight: 1.5 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: MONO, fontSize: 12, color: T.textDim, marginTop: 16, lineHeight: 1.6 }}>
                  Demain: 5 livraisons planifiées · 891 DH revenu prévu · T-09 retour maintenance 08:00 · Pic mardi 18/03 (12 livr.)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                  <button style={{ padding: '9px 20px', background: T.gold, border: 'none', borderRadius: 8, color: '#0F1629', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: MONO }}>
                    Valider Passation
                  </button>
                  <IABadge />
                </div>
                <p style={{ fontFamily: MONO, fontSize: 12, color: T.textDim, marginTop: 12 }}>
                  Prochain shift: demain 06:00 — Youssef B., Mehdi T., + T-09 si maintenance terminée
                </p>
              </Card>
            </section>
            {/* 3i. PRÉVISION DEMANDE IA */}
            <section>
              <SectionHeader icon={TrendingUp} label="Prévision Demande IA — 14 Jours" right={
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: T.gold, background: 'transparent', border: `1px solid ${T.gold}40`, borderRadius: 4, padding: '2px 8px' }}>Prévision IA</span>
              } />
              <Card style={{ borderTop: `2px solid ${T.gold}` }}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={FORECAST_14J} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A843" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} vertical={false} />
                    <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: T.textDim, fontSize: 11 }} />
                    <RechartsTooltip content={<ForecastTooltip />} />
                    <Area dataKey="upper" stackId="band" fill="rgba(212,168,67,0.08)" stroke="none" />
                    <Area dataKey="lowerInv" stackId="band" fill="rgba(11,17,32,1)" stroke="none" />
                    <Line dataKey="réel" name="Réel" type="monotone" stroke="#D4A843" strokeWidth={2} dot={LinePulseDot('#D4A843', 7)} activeDot={{ r: 5 }} />
                    <Line dataKey="prévu" name="Prévu IA" type="monotone" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </section>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* CARTE GPS TAB                                */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'gps' && <CarteGPSTab />}

        {/* ════════════════════════════════════════════ */}
        {/* ANALYTIQUE & INTELLIGENCE IA PLACEHOLDERS    */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === 'analytique' && <AnalytiqueTab />}
        {activeTab === 'ia' && <IntelligenceIATab />}

      </div>
    </div>
  );
}
