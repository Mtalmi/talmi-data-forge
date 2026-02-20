import { useState, useEffect, useRef } from 'react';
import {
  Package, Users, Bell, Settings, Banknote, Zap, Shield,
  Save, Download, Trash2, Mail, Phone, Eye, EyeOff,
  CheckCircle, XCircle, AlertTriangle, Calendar, Upload,
  Pencil, Code, MessageSquare, Award,
} from 'lucide-react';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const BG     = '#0B1120';
const CARD   = 'rgba(17,27,46,0.92)';
const BORDER = 'rgba(255,215,0,0.10)';
const FIELD  = '#0F172A';
const FIELD_B= '#1E293B';
const GOLD   = '#FFD700';
const GOLD_D = 'rgba(255,215,0,0.12)';
const GOLD_D2= 'rgba(255,215,0,0.07)';
const GREEN  = '#10B981';
const GREEN_D= 'rgba(16,185,129,0.12)';
const RED    = '#EF4444';
const RED_D  = 'rgba(239,68,68,0.12)';
const YELLOW = '#FBBF24';
const YELLOW_D='rgba(251,191,36,0.12)';
const BLUE   = '#3B82F6';
const BLUE_D = 'rgba(59,130,246,0.12)';
const GRAY   = '#94A3B8';
const PURPLE = '#A855F7';
const TEXT1  = '#F1F5F9';
const TEXT2  = '#94A3B8';
const TEXT3  = '#64748B';
const MONO   = "'JetBrains Mono', monospace";
const SANS   = "'DM Sans', sans-serif";

// ─── Nav items ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'entreprise',   label: 'Entreprise',    icon: Package   },
  { id: 'utilisateurs', label: 'Utilisateurs',  icon: Users     },
  { id: 'notifications',label: 'Notifications', icon: Bell      },
  { id: 'production',   label: 'Production',    icon: Settings  },
  { id: 'finance',      label: 'Finance',       icon: Banknote  },
  { id: 'integrations', label: 'Intégrations',  icon: Zap       },
  { id: 'securite',     label: 'Sécurité',      icon: Shield    },
  { id: 'systeme',      label: 'Système',       icon: Settings  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return v;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: on ? GOLD : FIELD_B,
        position: 'relative', transition: 'background 0.2s ease',
        boxShadow: on ? `0 0 8px ${GOLD}44` : 'none',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: 8,
        background: on ? '#0B1120' : GRAY,
        transition: 'left 0.2s ease',
        display: 'block',
      }} />
    </button>
  );
}

// ─── Styled Input ─────────────────────────────────────────────────────────────
function FieldInput({
  label, value, onChange, mono = false, suffix = '',
  type = 'text', readOnly = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  mono?: boolean; suffix?: string; type?: string; readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: SANS }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: FIELD, border: `1px solid ${focused ? GOLD : FIELD_B}`,
            borderRadius: 8, padding: '8px 12px', color: TEXT1, fontSize: 14,
            fontFamily: mono ? MONO : SANS, outline: 'none',
            boxShadow: focused ? `0 0 0 4px rgba(255,215,0,0.15)` : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
        {suffix && (
          <span style={{ color: TEXT3, fontSize: 12, fontFamily: MONO, whiteSpace: 'nowrap' }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ─── Select Input ─────────────────────────────────────────────────────────────
function FieldSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange?: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: SANS }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: FIELD, border: `1px solid ${focused ? GOLD : FIELD_B}`,
          borderRadius: 8, padding: '8px 12px', color: TEXT1, fontSize: 14,
          fontFamily: SANS, outline: 'none', cursor: 'pointer',
          boxShadow: focused ? `0 0 0 4px rgba(255,215,0,0.15)` : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, title, badge }: {
  icon: React.ElementType; title: string; badge?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: GOLD_D,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={GOLD} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT1, fontFamily: SANS, margin: 0 }}>{title}</h2>
      {badge}
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: CARD, borderRadius: 16, padding: 24,
        border: `1px solid ${hov ? 'rgba(255,215,0,0.2)' : BORDER}`,
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,215,0,0.1)` : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Row with label + control ─────────────────────────────────────────────────
function SettingRow({ label, children, desc = '' }: { label: string; children: React.ReactNode; desc?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: `1px solid ${FIELD_B}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT1, fontFamily: SANS }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: TEXT3, marginTop: 2, fontFamily: SANS }}>{desc}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────
function NotifRow({
  label, email, push, sms,
  onEmail, onPush, onSms,
}: {
  label: string; email: boolean; push: boolean; sms: boolean;
  onEmail: () => void; onPush: () => void; onSms: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
        alignItems: 'center', padding: '12px 16px', gap: 8,
        background: hov ? 'rgba(255,215,0,0.03)' : 'transparent',
        borderBottom: `1px solid ${FIELD_B}`,
        transition: 'background 0.2s',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT1, fontFamily: SANS }}>{label}</span>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle on={email} onChange={onEmail} /></div>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle on={push} onChange={onPush} /></div>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle on={sms} onChange={onSms} /></div>
    </div>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────
function IntegCard({ icon: Icon, name, desc, status, actionLabel, actionColor, iconBg, delay = 0 }: {
  icon: React.ElementType; name: string; desc: string;
  status: 'connected' | 'active' | 'disconnected';
  actionLabel: string; actionColor: string; iconBg: string;
  delay?: number;
}) {
  const [hov, setHov] = useState(false);
  const fade = useFadeIn(delay);
  const statusCfg = {
    connected:    { c: GREEN,  bg: GREEN_D,  icon: CheckCircle, label: 'Connecté' },
    active:       { c: GREEN,  bg: GREEN_D,  icon: CheckCircle, label: 'Actif' },
    disconnected: { c: YELLOW, bg: YELLOW_D, icon: AlertTriangle, label: 'Non connecté' },
  }[status];
  const SIcon = statusCfg.icon;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: CARD, borderRadius: 16, padding: 20,
        border: `1px solid ${hov ? 'rgba(255,215,0,0.2)' : BORDER}`,
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4)` : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        opacity: fade ? 1 : 0,
        animation: fade ? `fadeUp 0.5s ease forwards` : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={20} color={actionColor === 'blue' ? BLUE : actionColor === 'green' ? GREEN : GOLD} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS }}>{name}</div>
          <div style={{ fontSize: 12, color: TEXT2, marginTop: 2, fontFamily: SANS }}>{desc}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          borderRadius: 20, background: statusCfg.bg, flexShrink: 0,
        }}>
          <SIcon size={12} color={statusCfg.c} />
          <span style={{ fontSize: 11, fontWeight: 600, color: statusCfg.c, fontFamily: SANS }}>{statusCfg.label}</span>
        </div>
      </div>
      <button style={{
        alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 8,
        border: `1px solid ${status === 'disconnected' ? GOLD : (actionColor === 'blue' ? BLUE : GOLD)}`,
        background: status === 'disconnected' ? GOLD : 'transparent',
        color: status === 'disconnected' ? '#0B1120' : (actionColor === 'blue' ? BLUE : GOLD),
        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
        transition: 'all 0.2s ease',
      }}>
        {actionLabel}
      </button>
    </div>
  );
}

// ─── Permission check row ─────────────────────────────────────────────────────
function PermCheck({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${FIELD_B}` }}>
      <CheckCircle size={16} color={GREEN} />
      <span style={{ fontSize: 13, color: TEXT1, fontFamily: SANS }}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function WorldClassSettings() {
  const [activeSection, setActiveSection] = useState('entreprise');
  const [hasChanges, setHasChanges] = useState(false);
  const [showRIB, setShowRIB] = useState(false);

  // Notify changes when any field is touched
  const markChanged = () => setHasChanges(true);

  // ── Company fields ────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('TBOS Enterprise Suite');
  const [raisonSociale, setRaisonSociale] = useState('TBOS SARL');
  const [ice, setIce] = useState('001234567000089');
  const [rc, setRc] = useState('123456 — Casablanca');
  const [ifNum, setIfNum] = useState('12345678');
  const [patente, setPatente] = useState('12345678');
  const [cnss, setCnss] = useState('1234567');
  const [adresse, setAdresse] = useState('Zone Industrielle, Lot 45, Casablanca');
  const [ville, setVille] = useState('Casablanca');
  const [codePostal, setCodePostal] = useState('20250');
  const [pays, setPays] = useState('Maroc 🇲🇦');
  const [telephone, setTelephone] = useState('+212 5 22 XX XX XX');
  const [email, setEmail] = useState('contact@tbos.ma');
  const [siteWeb, setSiteWeb] = useState('www.tbos.ma');

  // ── Notifications ─────────────────────────────────────────────────
  const [notifs, setNotifs] = useState([
    { label: 'Nouveau devis créé',     email: true,  push: true,  sms: false },
    { label: 'Paiement reçu',          email: true,  push: true,  sms: true  },
    { label: 'Stock en alerte',        email: true,  push: true,  sms: true  },
    { label: 'Batch terminé',          email: false, push: true,  sms: false },
    { label: 'Incident sécurité',      email: true,  push: true,  sms: true  },
    { label: 'Maintenance planifiée',  email: true,  push: false, sms: false },
    { label: 'Contrat expire bientôt', email: true,  push: true,  sms: false },
    { label: 'Rapport généré',         email: true,  push: false, sms: false },
  ]);
  const toggleNotif = (i: number, ch: 'email' | 'push' | 'sms') => {
    setNotifs(p => p.map((n, idx) => idx === i ? { ...n, [ch]: !n[ch] } : n));
    markChanged();
  };

  // ── Production ────────────────────────────────────────────────────
  const [activeDays, setActiveDays] = useState([true, true, true, true, true, true, false]);
  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const toggleDay = (i: number) => {
    setActiveDays(p => p.map((d, idx) => idx === i ? !d : d));
    markChanged();
  };

  // ── Security toggles ──────────────────────────────────────────────
  const [tfa, setTfa] = useState(true);
  const [langue, setLangue] = useState('Français 🇫🇷');
  const [theme, setTheme] = useState('Sombre');

  // ── Scrollspy ─────────────────────────────────────────────────────
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    Object.values(sectionRefs.current).forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  const setRef = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SANS }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stgs-nav-item:hover { transform: translateX(4px); }
        .stgs-input:hover { border-color: rgba(255,215,0,0.3) !important; }
        .stgs-save:hover { filter: brightness(1.15); }
        .stgs-save:active { transform: scale(0.97); }
        .stgs-day:hover { opacity: 0.85; }
      `}</style>

      {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,17,32,0.95)',
        backdropFilter: 'blur(16px)', borderBottom: `1px solid ${BORDER}`,
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT1, fontFamily: SANS, margin: 0, lineHeight: 1.2 }}>Paramètres</h1>
            <p style={{ fontSize: 13, color: TEXT2, margin: 0, fontFamily: SANS }}>Configuration du système TBOS</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px',
              borderRadius: 10, border: `1px solid ${BORDER}`,
              background: 'transparent', color: TEXT2, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: SANS,
            }}>
              <Download size={16} />
              Exporter
            </button>
            <button
              className="stgs-save"
              disabled={!hasChanges}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px',
                borderRadius: 10, border: 'none',
                background: hasChanges ? GOLD : 'rgba(255,215,0,0.2)',
                color: hasChanges ? '#0B1120' : 'rgba(255,215,0,0.4)',
                fontSize: 13, fontWeight: 700,
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                fontFamily: SANS, transition: 'all 0.2s ease',
              }}
            >
              <Save size={16} />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 0, padding: '32px 32px' }}>

        {/* ── LEFT SIDEBAR NAV ─────────────────────────────────────── */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 104, height: 'fit-content', paddingRight: 24 }}>
          <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '8px 0', overflow: 'hidden' }}>
            {NAV_ITEMS.map(item => {
              const active = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className="stgs-nav-item"
                  onClick={() => scrollTo(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', background: active ? GOLD_D2 : 'transparent',
                    border: 'none', borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
                    cursor: 'pointer', fontFamily: SANS, textAlign: 'left',
                    color: active ? GOLD : TEXT2,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={16} color={active ? GOLD : TEXT3} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT CONTENT ───────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 48 }}>

          {/* ══════════════ SECTION 1: ENTREPRISE ══════════════════════ */}
          <section id="entreprise" ref={setRef('entreprise')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Package} title="Informations de l'Entreprise" />

            {/* Company Info */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Identité de l'Entreprise</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldInput label="Nom de l'entreprise" value={companyName} onChange={v => { setCompanyName(v); markChanged(); }} />
                <FieldInput label="Raison sociale" value={raisonSociale} onChange={v => { setRaisonSociale(v); markChanged(); }} />
                <FieldInput label="ICE" value={ice} onChange={v => { setIce(v); markChanged(); }} mono />
                <FieldInput label="RC" value={rc} onChange={v => { setRc(v); markChanged(); }} />
                <FieldInput label="IF" value={ifNum} onChange={v => { setIfNum(v); markChanged(); }} mono />
                <FieldInput label="Patente" value={patente} onChange={v => { setPatente(v); markChanged(); }} mono />
                <FieldInput label="CNSS" value={cnss} onChange={v => { setCnss(v); markChanged(); }} mono />
              </div>
            </Card>

            {/* Address */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Adresse & Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldInput label="Adresse" value={adresse} onChange={v => { setAdresse(v); markChanged(); }} />
                </div>
                <FieldInput label="Ville" value={ville} onChange={v => { setVille(v); markChanged(); }} />
                <FieldInput label="Code Postal" value={codePostal} onChange={v => { setCodePostal(v); markChanged(); }} mono />
                <FieldInput label="Pays" value={pays} onChange={v => { setPays(v); markChanged(); }} />
                <FieldInput label="Téléphone" value={telephone} onChange={v => { setTelephone(v); markChanged(); }} mono />
                <FieldInput label="Email" value={email} onChange={v => { setEmail(v); markChanged(); }} mono />
                <FieldInput label="Site Web" value={siteWeb} onChange={v => { setSiteWeb(v); markChanged(); }} mono />
              </div>
            </Card>

            {/* Logo Upload */}
            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Logo de l'Entreprise</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                {/* Logo placeholder */}
                <div style={{
                  width: 120, height: 120, border: `2px solid ${GOLD}`,
                  borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: GOLD_D, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: GOLD, fontFamily: SANS }}>TBOS</span>
                </div>
                {/* Upload zone */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    border: `2px dashed ${GOLD}44`, borderRadius: 12, padding: 24,
                    textAlign: 'center', cursor: 'pointer',
                  }}>
                    <Upload size={24} color={GOLD} style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, color: TEXT2, fontFamily: SANS }}>Glissez votre logo ici ou</div>
                    <button style={{
                      marginTop: 10, padding: '6px 16px', borderRadius: 8,
                      border: `1px solid ${GOLD}`, background: 'transparent',
                      color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                      <Upload size={14} /> Changer le Logo
                    </button>
                    <div style={{ fontSize: 11, color: TEXT3, marginTop: 8, fontFamily: SANS }}>Formats acceptés: PNG, JPG — Max 2MB</div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* ══════════════ SECTION 2: UTILISATEURS (placeholder) ══════ */}
          <section id="utilisateurs" ref={setRef('utilisateurs')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Users} title="Utilisateurs" />
            <Card>
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Users size={40} color={TEXT3} style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, color: TEXT2, fontFamily: SANS }}>Gestion des utilisateurs disponible dans la page</div>
                <a href="/users" style={{ color: GOLD, fontSize: 13, fontFamily: MONO, marginTop: 8, display: 'block' }}>/users</a>
              </div>
            </Card>
          </section>

          {/* ══════════════ SECTION 3: NOTIFICATIONS ═══════════════════ */}
          <section id="notifications" ref={setRef('notifications')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Bell} title="Notifications" />

            {/* Notification Preferences */}
            <Card style={{ marginBottom: 16, padding: 0 }}>
              {/* Header row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
                padding: '12px 16px', borderBottom: `1px solid ${FIELD_B}`,
                background: 'rgba(255,215,0,0.03)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT3, fontFamily: SANS, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notification</span>
                {[
                  { icon: Mail, label: 'Email' },
                  { icon: Bell, label: 'Push' },
                  { icon: Phone, label: 'SMS' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Icon size={14} color={TEXT3} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, fontFamily: SANS, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  </div>
                ))}
              </div>
              {notifs.map((n, i) => (
                <NotifRow
                  key={i} label={n.label}
                  email={n.email} push={n.push} sms={n.sms}
                  onEmail={() => toggleNotif(i, 'email')}
                  onPush={() => toggleNotif(i, 'push')}
                  onSms={() => toggleNotif(i, 'sms')}
                />
              ))}
            </Card>

            {/* Alert Thresholds */}
            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Seuils d'Alerte</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Stock minimum',          value: '20',  suffix: '%'     },
                  { label: 'Paiement en retard',      value: '30',  suffix: 'jours' },
                  { label: 'Contrat expire dans',     value: '30',  suffix: 'jours' },
                  { label: 'Consommation contrat',    value: '80',  suffix: '%'     },
                  { label: 'Budget dépassé',          value: '90',  suffix: '%'     },
                ].map((row, i) => {
                  const [val, setVal] = useState(row.value);
                  return (
                    <SettingRow key={i} label={row.label}>
                      <FieldInput label="" value={val} onChange={v => { setVal(v); markChanged(); }} mono suffix={row.suffix} type="number" />
                    </SettingRow>
                  );
                })}
              </div>
            </Card>
          </section>

          {/* ══════════════ SECTION 4: PRODUCTION ══════════════════════ */}
          <section id="production" ref={setRef('production')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Settings} title="Configuration Production" />

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Paramètres Généraux</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <SettingRow label="Capacité journalière max">
                  <FieldInput label="" value="1200" onChange={markChanged} mono suffix="m³" />
                </SettingRow>
                <SettingRow label="Heures de production">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="time" defaultValue="06:00" onChange={markChanged} style={{ background: FIELD, border: `1px solid ${FIELD_B}`, borderRadius: 8, padding: '6px 10px', color: TEXT1, fontSize: 13, fontFamily: MONO, outline: 'none' }} />
                    <span style={{ color: TEXT3 }}>—</span>
                    <input type="time" defaultValue="18:00" onChange={markChanged} style={{ background: FIELD, border: `1px solid ${FIELD_B}`, borderRadius: 8, padding: '6px 10px', color: TEXT1, fontSize: 13, fontFamily: MONO, outline: 'none' }} />
                  </div>
                </SettingRow>
                <SettingRow label="Jours de production">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {dayLabels.map((d, i) => (
                      <button
                        key={d}
                        className="stgs-day"
                        onClick={() => toggleDay(i)}
                        style={{
                          padding: '4px 10px', borderRadius: 8, border: 'none',
                          background: activeDays[i] ? GOLD : FIELD_B,
                          color: activeDays[i] ? '#0B1120' : TEXT3,
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                          transition: 'all 0.2s ease',
                        }}
                      >{d}</button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Tolérance slump">
                  <FieldInput label="" value="2" onChange={markChanged} mono suffix="±cm" />
                </SettingRow>
                <SettingRow label="Température max béton">
                  <FieldInput label="" value="32" onChange={markChanged} mono suffix="°C" />
                </SettingRow>
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Paramètres Formule</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldSelect label="Formule par défaut" value="B25-STD" options={['B25-STD', 'B30-STD', 'B35-HPC', 'C35/45']} />
                <FieldInput label="Ratio Eau/Ciment max" value="0.55" onChange={markChanged} mono />
                <FieldInput label="Volume batch standard" value="1.0" onChange={markChanged} mono suffix="m³" />
                <FieldInput label="Marge de sécurité dosage" value="2" onChange={markChanged} mono suffix="%" />
              </div>
            </Card>
          </section>

          {/* ══════════════ SECTION 5: FINANCE ═════════════════════════ */}
          <section id="finance" ref={setRef('finance')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Banknote} title="Configuration Finance" />

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Devise & Taxes</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldSelect label="Devise" value="MAD (DH)" options={['MAD (DH)', 'EUR (€)', 'USD ($)']} />
                <FieldInput label="TVA Standard" value="20" onChange={markChanged} mono suffix="%" />
                <FieldInput label="TVA Réduite" value="10" onChange={markChanged} mono suffix="%" />
                <FieldInput label="Délai paiement par défaut" value="30" onChange={markChanged} mono suffix="jours" />
                <FieldInput label="Objectif encaissement mensuel" value="85" onChange={markChanged} mono suffix="%" />
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS }}>Coordonnées Bancaires</div>
                <button
                  onClick={() => setShowRIB(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS }}
                >
                  {showRIB ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showRIB ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldInput label="Banque" value="Banque Populaire" onChange={markChanged} />
                <FieldInput label="RIB" value={showRIB ? '101 XXX XXXXXXXXXX XX' : '101 ••• •••••••••• ••'} readOnly mono />
                <FieldInput label="IBAN" value={showRIB ? 'MA64 101 XXX XXXXXXXXXX XX' : 'MA64 ••• •••••••••• ••'} readOnly mono />
                <FieldInput label="SWIFT" value={showRIB ? 'BCPOMAMC' : '••••••••'} readOnly mono />
              </div>
            </Card>
          </section>

          {/* ══════════════ SECTION 6: INTÉGRATIONS ════════════════════ */}
          <section id="integrations" ref={setRef('integrations')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Zap} title="Intégrations" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <IntegCard icon={Banknote} name="Comptabilité" desc="Sage, QuickBooks, ou export CSV" status="disconnected" actionLabel="Configurer" actionColor="gold" iconBg={GOLD_D} delay={0} />
              <IntegCard icon={MessageSquare} name="Email" desc="SMTP pour notifications et rapports" status="connected" actionLabel="Modifier" actionColor="green" iconBg={GREEN_D} delay={80} />
              <IntegCard icon={Phone} name="SMS" desc="Service SMS pour alertes urgentes" status="disconnected" actionLabel="Configurer" actionColor="gold" iconBg={YELLOW_D} delay={160} />
              <IntegCard icon={Zap} name="API" desc="Accès API pour intégrations tierces" status="active" actionLabel="Gérer Clés" actionColor="blue" iconBg={BLUE_D} delay={240} />
            </div>
          </section>

          {/* ══════════════ SECTION 7: SÉCURITÉ ════════════════════════ */}
          <section id="securite" ref={setRef('securite')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Shield} title="Sécurité" />

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Authentification</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <SettingRow label="Authentification 2FA" desc="Recommandé — protège tous les comptes">
                  <Toggle on={tfa} onChange={() => { setTfa(p => !p); markChanged(); }} />
                  <span style={{ fontSize: 12, color: tfa ? GREEN : TEXT3, fontFamily: SANS, fontWeight: 600 }}>{tfa ? 'Activée' : 'Désactivée'}</span>
                </SettingRow>
                <SettingRow label="Expiration session">
                  <FieldInput label="" value="8" onChange={markChanged} mono suffix="heures" />
                </SettingRow>
                <SettingRow label="Tentatives max connexion">
                  <FieldInput label="" value="5" onChange={markChanged} mono />
                </SettingRow>
                <SettingRow label="Verrouillage après échec">
                  <FieldInput label="" value="15" onChange={markChanged} mono suffix="minutes" />
                </SettingRow>
                <SettingRow label="Politique mots de passe">
                  <FieldSelect label="" value="Fort" options={['Faible', 'Moyen', 'Fort']} onChange={markChanged} />
                </SettingRow>
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 16 }}>
                Politique de Mot de Passe — <span style={{ color: GREEN }}>Fort</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  'Minimum 12 caractères',
                  'Majuscules requises',
                  'Chiffres requis',
                  'Caractères spéciaux',
                  'Expiration: 90 jours',
                ].map((rule, i) => <PermCheck key={i} label={rule} />)}
              </div>
            </Card>
          </section>

          {/* ══════════════ SECTION 8: SYSTÈME ═════════════════════════ */}
          <section id="systeme" ref={setRef('systeme')} style={{ scrollMarginTop: 120 }}>
            <SectionHead icon={Settings} title="Système" />

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Paramètres Généraux</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldSelect label="Langue" value={langue} options={['Français 🇫🇷', 'العربية 🇲🇦', 'English 🇬🇧']} onChange={setLangue} />
                <FieldSelect label="Fuseau horaire" value="Africa/Casablanca (GMT+1)" options={['Africa/Casablanca (GMT+1)', 'Europe/Paris (GMT+2)', 'UTC']} />
                <FieldSelect label="Format date" value="DD/MM/YYYY" options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
                <FieldSelect label="Format nombre" value="1 234,56" options={['1 234,56', '1,234.56', '1.234,56']} />
                <FieldSelect label="Thème" value={theme} options={['Sombre', 'Clair']} onChange={setTheme} />
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 8 }}>Gestion des Données</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <SettingRow label="Exporter les données" desc="Export complet en CSV/Excel">
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                    borderRadius: 8, border: 'none', background: GOLD,
                    color: '#0B1120', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                  }}>
                    <Download size={14} /> Exporter
                  </button>
                </SettingRow>
                <SettingRow label="Sauvegarder la base" desc="Dernière: 19 Fév 22:00">
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                    borderRadius: 8, border: `1px solid ${GOLD}`, background: 'transparent',
                    color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                  }}>
                    <Save size={14} /> Sauvegarder
                  </button>
                </SettingRow>
                <SettingRow label="Purger les archives" desc="Supprimer les données >2 ans — irréversible">
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                    borderRadius: 8, border: `1px solid ${RED}`, background: RED_D,
                    color: RED, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
                  }}>
                    <Trash2 size={14} /> Purger
                  </button>
                </SettingRow>
              </div>
            </Card>

            {/* System Info */}
            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, fontFamily: SANS, marginBottom: 20 }}>Informations Système</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Version', value: 'TBOS v2.4.1', mono: true, color: GOLD },
                  { label: 'Build', value: '2024.02.15', mono: true, color: TEXT2 },
                  { label: 'Licence', value: 'Enterprise — Valide jusqu\'au 31 Déc 2024', mono: false, color: GREEN, badge: true },
                  { label: 'Support', value: 'support@tbos.ma', mono: true, color: TEXT2 },
                  { label: 'Uptime serveur', value: '45 jours 12h 35min', mono: true, color: GREEN },
                ].map((row, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: FIELD, borderRadius: 10, border: `1px solid ${FIELD_B}` }}>
                    <div style={{ fontSize: 11, color: TEXT3, fontFamily: SANS, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{row.label}</div>
                    {row.badge ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: GREEN_D, borderRadius: 20, padding: '2px 10px' }}>
                        <CheckCircle size={12} color={GREEN} />
                        <span style={{ fontSize: 13, color: GREEN, fontFamily: SANS, fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, fontWeight: 700, color: row.color, fontFamily: row.mono ? MONO : SANS }}>{row.value}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <div style={{ height: 80 }} />
        </div>
      </div>
    </div>
  );
}
