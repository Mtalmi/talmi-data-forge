import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import type { Language } from '@/i18n/I18nContext';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  ChevronDown, Menu, X, Check, Zap, Play, Loader2,
} from 'lucide-react';

/* ─── DESIGN TOKENS ─────────────────────────────────────── */
const NAVY   = '#0F1419';
const CARD   = '#161D26';
const BORDER = '#2A3545';
const GOLD   = '#FFD700';
const GRAY   = '#B0B8C1';

/* ─── STYLES injected once ──────────────────────────────── */
const CSS = `
  .lp-root { background:${NAVY}; color:#fff; font-family:'Inter',sans-serif; }
  .lp-root * { box-sizing:border-box; }

  /* Fonts */
  .font-display { font-family:'Bebas Neue',cursive; }
  .font-heading  { font-family:'Poppins',sans-serif; }
  .font-body     { font-family:'Inter',sans-serif; }
  .font-data     { font-family:'JetBrains Mono',monospace; }

  /* Shimmer top bar */
  .shimmer-bar {
    height:2px; width:100%;
    background: linear-gradient(90deg, transparent, ${GOLD}, transparent, ${GOLD}, transparent);
    background-size:400% 100%;
    animation: shimmerMove 3s linear infinite;
  }
  @keyframes shimmerMove { 0%{background-position:0% 0%} 100%{background-position:400% 0%} }

  /* Dot grid texture */
  .dot-grid {
    background-image: radial-gradient(circle, rgba(255,215,0,0.025) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  /* Gold gradient text */
  .text-gold { color:${GOLD}; }
  .text-gray  { color:${GRAY}; }

  /* Cards */
  .lp-card {
    background:${CARD}; border:1px solid ${BORDER};
    border-radius:12px;
  }
  .lp-card-hover {
    transition:transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
  }
  .lp-card-hover:hover {
    transform:translateY(-4px);
    border-color:${GOLD};
    box-shadow:0 20px 40px rgba(255,215,0,0.1);
  }

  /* Buttons */
  .btn-gold {
    background:linear-gradient(135deg,#FFD700,#FFA500);
    color:#000; font-family:'Poppins',sans-serif; font-weight:700;
    border-radius:8px; border:none; cursor:pointer;
    transition:transform 200ms, box-shadow 200ms;
  }
  .btn-gold:hover {
    transform:scale(1.03);
    box-shadow:0 8px 32px rgba(255,215,0,0.4);
  }
  .btn-ghost {
    background:transparent; color:${GOLD};
    border:1px solid ${GOLD}; font-family:'Poppins',sans-serif;
    font-weight:600; border-radius:8px; cursor:pointer;
    transition:background 200ms, transform 200ms;
  }
  .btn-ghost:hover { background:rgba(255,215,0,0.08); transform:scale(1.02); }

  /* Metric top border */
  .metric-card { border-top:3px solid ${GOLD}; }
  .metric-card:hover { transform:translateY(-4px); box-shadow:0 0 30px rgba(255,215,0,0.15); }

  /* Float animation for hero card */
  @keyframes float { 0%,100%{transform:translateY(-8px) rotateY(-8deg) rotateX(4deg)} 50%{transform:translateY(8px) rotateY(-8deg) rotateX(4deg)} }
  .hero-float { animation:float 4s ease-in-out infinite; }

  /* Marquee */
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .marquee-track { display:flex; width:max-content; animation:marquee 30s linear infinite; }

  /* Orbit */
  @keyframes orbit { 0%{transform:rotate(0deg) translateX(180px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(180px) rotate(-360deg)} }
  @keyframes orbitSelf { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .orbit-center { position:relative; }
  @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.4)} 50%{box-shadow:0 0 50px rgba(255,215,0,0.8)} }
  .pulse-glow { animation:pulse-glow 2s ease-in-out infinite; }

  /* Accordion */
  .faq-content { max-height:0; overflow:hidden; transition:max-height 0.35s ease; }
  .faq-content.open { max-height:200px; }

  /* Nav */
  .lp-nav { position:fixed; top:0; left:0; right:0; z-index:100; height:72px;
    background:rgba(15,20,25,0.92); backdrop-filter:blur(20px);
    border-bottom:1px solid ${BORDER};
    display:flex; align-items:center; justify-content:space-between; padding:0 40px;
  }
  @media(max-width:768px){ .lp-nav{padding:0 20px;} }

  /* Section padding */
  .section-pad { padding:120px 0; }
  @media(max-width:768px){ .section-pad{padding:80px 0;} }

  .container-max { max-width:1280px; margin:0 auto; padding:0 40px; }
  @media(max-width:768px){ .container-max{padding:0 20px;} }

  /* Fade in on scroll */
  .reveal { opacity:0; transform:translateY(20px); transition:opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity:1; transform:translateY(0); }

  /* Feature pill */
  .pill {
    display:inline-block; padding:3px 10px; border-radius:20px;
    border:1px solid ${BORDER}; font-size:11px; font-family:'Inter',sans-serif;
    color:${GOLD}; background:rgba(255,215,0,0.06); margin:3px 2px;
  }

  /* Pulsing dot */
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .dot-live { display:inline-block; width:8px; height:8px; border-radius:50%;
    background:#10B981; animation:blink 1.5s ease-in-out infinite; }

  /* Pricing toggle */
  .toggle-track { width:52px; height:28px; background:${BORDER}; border-radius:14px; position:relative; cursor:pointer; transition:background 200ms; }
  .toggle-track.on { background:${GOLD}; }
  .toggle-thumb { position:absolute; top:4px; left:4px; width:20px; height:20px; border-radius:50%; background:#fff; transition:left 200ms; }
  .toggle-track.on .toggle-thumb { left:28px; }

  /* Mobile menu overlay */
  .mobile-menu { position:fixed; inset:0; background:${NAVY}; z-index:200; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:32px; }

  /* Newsletter input */
  .nl-input { background:${CARD}; border:1px solid ${BORDER}; border-radius:6px; padding:10px 16px; color:#fff; font-family:'Inter',sans-serif; outline:none; }
  .nl-input:focus { border-color:${GOLD}; }
`;

/* ─── MINI CHART DATA ─────────────────────────────────── */
const chartData = [
  { day:'Mon', v:210 }, { day:'Tue', v:265 }, { day:'Wed', v:240 },
  { day:'Thu', v:290 }, { day:'Fri', v:310 }, { day:'Sat', v:284 }, { day:'Sun', v:320 },
];

/* ─── TRUST ITEMS ─────────────────────────────────────── */
const trustItems = [
  'SOC 2 Type II Certified','ISO 27001 Compliant','GDPR Ready','Trusted Across MENA',
  '99.9% Uptime Guarantee','AES-256 Military Encryption','Arabic RTL Native Support',
  'Offline-First Architecture','Real-Time Sync','White-Glove Onboarding',
];

/* ─── FEATURES ────────────────────────────────────────── */
const features = [
  { icon:'🏗️', title:'Production Intelligence', desc:'Real-time batch monitoring, AI quality control, and automated deviation alerts. Every cubic meter tracked from silo to site.', pills:['AI-Powered','Real-Time','Auto-Alerts'] },
  { icon:'🚛', title:'Fleet Command Center', desc:'Live GPS tracking, geofence alerts, fuel theft detection, and driver rotation optimization across your entire fleet.', pills:['GPS Live','Fuel Analytics','Driver Scores'] },
  { icon:'💰', title:'Financial Fortress', desc:'Treasury management, AR/AP reconciliation, tax compliance calendar, and cash flow forecasting with forensic audit trails.', pills:['Multi-Currency','Auto-Reconcile','Audit Trail'] },
  { icon:'🔬', title:'Laboratory & Quality', desc:'Digital test certificates, humidity photo verification, slump tracking, and automated QC departure gates that stop bad batches.', pills:['ISO Standards','Photo Verify','Auto-Gates'] },
  { icon:'👑', title:'CEO God Mode', desc:'Executive command center with real-time profit tickers, anomaly detection, emergency overrides, and midnight transaction alerts.', pills:['Real-Time P&L','Anomaly AI','Override Control'], badge:'Most Loved Feature' },
  { icon:'🔐', title:'Role-Based Access', desc:'50+ distinct roles from CEO to truck driver. Every action logged, every modification traced, every decision accountable.', pills:['50+ Roles','Full Audit','Arabic RTL'] },
];

/* ─── AGENTS ─────────────────────────────────────────── */
const agents = [
  { icon:'🤖', label:'Operations', desc:'Monitors batches, triggers alerts, manages quality gates', angle:0 },
  { icon:'📣', label:'Marketing', desc:'Generates content, qualifies leads, sends campaigns', angle:60 },
  { icon:'💼', label:'Sales', desc:'Qualifies prospects, books demos, sends follow-ups', angle:120 },
  { icon:'🎧', label:'Support', desc:'Answers tickets 24/7, resolves issues, escalates when needed', angle:180 },
  { icon:'🔧', label:'Maintenance', desc:'Predicts equipment failures before they happen', angle:240 },
  { icon:'📊', label:'Analytics', desc:'Surfaces insights, generates reports, flags anomalies', angle:300 },
];

/* ─── FAQ ─────────────────────────────────────────────── */
const faqs = [
  { q:'How long does implementation take?', a:'Most customers are live within 5-7 business days. Our white-glove onboarding team handles data migration, user training, and system configuration. No IT department required.' },
  { q:'Is TBOS compatible with my existing systems?', a:'Yes. TBOS connects to accounting software (QuickBooks, SAP), weighbridge systems, lab equipment, and GPS trackers via our REST API and 40+ pre-built integrations.' },
  { q:'Does it work in Arabic?', a:'Natively. TBOS was built from day one with Arabic RTL support — not an afterthought add-on. Full right-to-left layouts, Arabic typography, and localized date/number formats across every module.' },
  { q:'What happens to my data if I cancel?', a:'You own your data. Export everything in standard formats (CSV, Excel, JSON) at any time. We hold your data for 90 days post-cancellation for recovery, then permanently delete it.' },
  { q:'Does it work offline?', a:'Yes. The mobile app is offline-first — field workers can record batches, quality tests, and deliveries without internet. Everything syncs automatically when connection returns.' },
  { q:"What's the ROI timeline?", a:'Our average customer sees positive ROI within 6 weeks. The Predictive Maintenance module alone typically saves 10-20x its cost in prevented downtime.' },
  { q:'How is my data secured?', a:'AES-256 encryption at rest and in transit, SOC 2 Type II controls, role-based access control, full audit logs, and data residency options for MENA compliance requirements.' },
  { q:'Can I customize TBOS for my specific workflows?', a:'Yes. The Workflow Automation module lets you build custom automations without code. For enterprise customers, our team can build custom modules and integrations.' },
];

/* ─── TESTIMONIALS ───────────────────────────────────── */
const testimonials = [
  { flag:'🇲🇦', company:'Talmi Beton', role:'Ready-Mix Production', quote:'TBOS transformed how we operate. We went from reactive management to predictive optimization.', author:'Mohamed Talmi, CEO', results:'847% ROI · $840K saved · 1.4mo payback' },
  { flag:'🇲🇦', company:'Atlas Concrete Group', role:'Multi-Plant Operations', quote:'The predictive maintenance alone paid for the entire platform in the first quarter.', author:'Hassan Benali, COO', results:'94x ROI on maintenance module alone' },
  { flag:'🇸🇦', company:'Gulf Ready Mix', role:'Fleet & Logistics', quote:'Finally, an ERP that understands Arabic operations. The RTL support is flawless.', author:'Ahmed Al-Rashid, Operations Director', results:'38% fuel cost reduction · 22% faster deliveries' },
];

/* ─── COUNTER HOOK ───────────────────────────────────── */
function useCounter(target: number, decimals = 0, suffix = '', prefix = '') {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setVal(ease * target);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return { ref, display: `${prefix}${val.toFixed(decimals)}${suffix}` };
}

/* ─── REVEAL HOOK ────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── FAQ ITEM ───────────────────────────────────────── */
function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '20px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: 16, textAlign: 'left' }}
      >
        {q}
        <ChevronDown size={18} color={GOLD} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
      </button>
      <div className={`faq-content ${open ? 'open' : ''}`}>
        <p style={{ color: GRAY, fontFamily: 'Inter,sans-serif', fontSize: 15, lineHeight: 1.7, paddingTop: 12, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─── PRICING PLAN ───────────────────────────────────── */
function PricingPlan({ annual }: { annual: boolean }) {
  const plans = [
    {
      name: 'Starter', price: annual ? 249 : 299, yearly: annual ? 2988 : 3588,
      tag: 'Perfect for single-plant operations',
      features: ['3 core modules','Up to 10 users','Basic analytics','Email support','Arabic + French + English'],
      missing: ['AI Agents','Predictive Maintenance'], highlight: false,
    },
    {
      name: 'Professional', price: annual ? 499 : 599, yearly: annual ? 5988 : 7188,
      tag: 'For growing multi-plant operations',
      features: ['All 8 modules','Up to 25 users','Advanced analytics + benchmarking','Priority support (4hr response)','3 AI Agents','Mobile PWA (unlimited seats)','API access'],
      missing: ['Custom AI training'], highlight: true,
    },
    {
      name: 'Enterprise', price: null, yearly: null,
      tag: 'For large operations across multiple sites',
      features: ['Everything in Professional','Unlimited users','All 6 AI Agents','Custom AI training on your data','Dedicated account manager','99.9% SLA guarantee','On-premise option','White-label available'],
      missing: [], highlight: false,
    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
      {plans.map(p => (
        <div key={p.name} className="lp-card" style={{
          padding: 36, position: 'relative', display: 'flex', flexDirection: 'column',
          border: p.highlight ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
          background: p.highlight ? '#1C2533' : CARD,
        }}>
          {p.highlight && (
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: '#000', padding: '4px 16px', borderRadius: 20, fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
              MOST POPULAR
            </div>
          )}
          <p className="font-heading" style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{p.name}</p>
          <p style={{ color: GRAY, fontSize: 13, marginBottom: 16 }}>{p.tag}</p>
          {p.price ? (
            <>
              <p className="font-data text-gold" style={{ fontSize: p.highlight ? 56 : 48, lineHeight: 1 }}>${p.price}<span style={{ fontSize: 18, color: GRAY }}>/mo</span></p>
              <p style={{ color: GRAY, fontSize: 13, marginBottom: 24 }}>${p.yearly?.toLocaleString()}/year</p>
            </>
          ) : (
            <p className="font-display text-gold" style={{ fontSize: 56, lineHeight: 1, marginBottom: 24 }}>Custom</p>
          )}
          <div style={{ flexGrow: 1 }}>
            {p.features.map(f => <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}><Check size={14} color="#10B981" /><span style={{ fontSize:14, color:'#e0e0e0' }}>{f}</span></div>)}
            {p.missing.map(f => <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, opacity:.5 }}><X size={14} color={GRAY} /><span style={{ fontSize:14, color:GRAY }}>{f}</span></div>)}
          </div>
          <button className={p.highlight ? 'btn-gold' : 'btn-ghost'} style={{ marginTop: 24, height: 48, fontSize: 15, width: '100%' }}>
            {p.name === 'Enterprise' ? 'Contact Sales →' : p.highlight ? 'Start Free Trial →' : 'Get Started →'}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── NAV LINKS with section targets ─────────────────── */
const NAV_LINKS = [
  { label: { EN:'Features', FR:'Fonctionnalités', AR:'المميزات' }, id:'features' },
  { label: { EN:'ROI',      FR:'ROI',             AR:'العائد'  }, id:'roi' },
  { label: { EN:'Pricing',  FR:'Tarifs',           AR:'الأسعار' }, id:'pricing' },
  { label: { EN:'Reviews',  FR:'Témoignages',      AR:'آراء'   }, id:'case-studies' },
];

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ─── MAIN COMPONENT ─────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const { lang: i18nLang, setLang: setI18nLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  // Map i18n lang code → display code for this page
  const langDisplay = i18nLang === 'ar' ? 'AR' : i18nLang === 'fr' ? 'FR' : 'EN';
  const switchLang = (code: 'EN'|'FR'|'AR') => {
    const map: Record<string, Language> = { EN:'en', FR:'fr', AR:'ar' };
    setI18nLang(map[code]);
  };
  const [demoLoading, setDemoLoading] = useState(false);

  // Hero entrance refs
  const heroBadge = useRef<HTMLDivElement>(null);
  const heroH1 = useRef<HTMLHeadingElement>(null);
  const heroSub = useRef<HTMLParagraphElement>(null);
  const heroCta = useRef<HTMLDivElement>(null);

  // Counters
  const c1 = useCounter(6, 0, '', '');
  const c2 = useCounter(99.9, 1, '%', '');
  const c3 = useCounter(256, 0, '', 'AES-');
  const c4 = useCounter(3, 0, 's', '<');

  // Reveal refs
  const r1 = useReveal(); const r2 = useReveal(); const r3 = useReveal();
  const r4 = useReveal(); const r5 = useReveal(); const r6 = useReveal();
  const r7 = useReveal(); const r8 = useReveal();

  // Hero stagger entrance
  useEffect(() => {
    const els = [heroBadge.current, heroH1.current, heroSub.current, heroCta.current];
    els.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        if (!el) return;
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 300 + i * 150);
    });
    document.title = 'TBOS — The Operating System for Concrete Titans';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'TBOS: Enterprise ERP for concrete production. Unify production, logistics, finance, quality and fleet in one AI-powered platform. Built for MENA concrete operators.');
    return () => { document.title = 'TBOS Suite'; };
  }, []);

  const handleDemoLogin = useCallback(async () => {
    setDemoLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) { toast.error('Demo login error'); return; }
      await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      toast.success('Welcome to TBOS Demo!');
      navigate('/');
    } catch { toast.error('Server connection error'); }
    finally { setDemoLoading(false); }
  }, [navigate]);

  return (
    <>
      <style>{CSS}</style>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"SoftwareApplication","name":"TBOS Suite",
        "applicationCategory":"BusinessApplication","operatingSystem":"Web",
        "description":"Enterprise ERP for ready-mix concrete operations in MENA.",
        "offers":{"@type":"Offer","price":"299","priceCurrency":"USD"},
        "aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9","ratingCount":"50"}
      })}} />

      <div className="lp-root">

        {/* ── SHIMMER BAR ── */}
        <div className="shimmer-bar" />

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="font-display text-gold" style={{ fontSize:28, lineHeight:1 }}>TBOS</span>
            <span style={{ color:GRAY, fontSize:11, fontFamily:'Inter,sans-serif' }}>by Talmi Beton</span>
          </div>
          <div style={{ display:'flex', gap:32, alignItems:'center' }} className="desktop-nav" id="desktop-links">
            {NAV_LINKS.map(link => (
              <button key={link.id} onClick={()=>smoothScrollTo(link.id)}
                style={{ background:'none', border:'none', cursor:'pointer', color:GRAY, fontFamily:'Inter,sans-serif', fontSize:14, transition:'color 0.2s', padding:0 }}
                onMouseEnter={e=>(e.currentTarget.style.color=GOLD)} onMouseLeave={e=>(e.currentTarget.style.color=GRAY)}>
                {link.label[langDisplay as keyof typeof link.label]}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Language switcher */}
            <div style={{ display:'flex', gap:6, background: CARD, border:`1px solid ${BORDER}`, borderRadius:8, padding:'4px 8px' }}>
              {(['EN','FR','AR'] as const).map(c => (
                <button key={c} onClick={()=>switchLang(c)} style={{
                  padding:'4px 8px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12,
                  fontFamily:'Poppins,sans-serif', fontWeight:600,
                  background: langDisplay===c ? GOLD : 'transparent',
                  color: langDisplay===c ? '#000' : GRAY,
                  transition:'all 0.2s',
                }}>{c}</button>
              ))}
            </div>
            <button className="btn-gold" style={{ height:44, padding:'0 20px', fontSize:14 }} onClick={()=>navigate('/auth')}>
              Request Demo
            </button>
            <button style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:'#fff' }} id="hamburger" onClick={()=>setMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </nav>

        {/* ── MOBILE MENU ── */}
        {menuOpen && (
          <div className="mobile-menu">
            <button style={{ position:'absolute', top:24, right:24, background:'none', border:'none', cursor:'pointer', color:'#fff' }} onClick={()=>setMenuOpen(false)}><X size={28}/></button>
            {NAV_LINKS.map(link => (
              <button key={link.id} onClick={()=>{ setMenuOpen(false); smoothScrollTo(link.id); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#fff', fontFamily:'Poppins,sans-serif', fontSize:24, fontWeight:700 }}>
                {link.label[langDisplay as keyof typeof link.label]}
              </button>
            ))}
            <button className="btn-gold" style={{ height:52, padding:'0 32px', fontSize:16 }} onClick={()=>{ setMenuOpen(false); navigate('/auth'); }}>Request Demo</button>
          </div>
        )}

        {/* ── SECTION 2: HERO ── */}
        <section className="dot-grid" style={{ minHeight:'100vh', paddingTop:72, display:'flex', alignItems:'center', position:'relative', overflow:'hidden' }}>
          {/* Gold glow */}
          <div style={{ position:'absolute', right:'10%', top:'50%', transform:'translateY(-50%)', width:600, height:600, borderRadius:'50%', background:'rgba(255,215,0,0.05)', filter:'blur(80px)', pointerEvents:'none' }} />

          <div className="container-max" style={{ display:'grid', gridTemplateColumns:'55fr 45fr', gap:60, alignItems:'center', paddingTop:60, paddingBottom:60, width:'100%' }}>
            {/* LEFT */}
            <div>
              <div ref={heroBadge} style={{ display:'inline-flex', alignItems:'center', gap:8, border:`1px solid ${GOLD}`, borderRadius:24, padding:'6px 16px', marginBottom:28 }}>
                <Zap size={14} color={GOLD} />
                <span style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:12, color:GOLD, letterSpacing:2, textTransform:'uppercase' }}>Now with 6 Autonomous AI Agents</span>
              </div>
              <h1 ref={heroH1} className="font-display" style={{ fontSize:'clamp(56px,8vw,96px)', lineHeight:.95, marginBottom:24 }}>
                THE OPERATING<br/>
                SYSTEM FOR<br/>
                <span className="text-gold">CONCRETE TITANS</span>
              </h1>
              <p ref={heroSub} style={{ fontFamily:'Inter,sans-serif', fontSize:18, color:GRAY, maxWidth:500, lineHeight:1.7, marginBottom:32 }}>
                Unify production, logistics, finance, quality, and fleet management into one military-grade platform. Built exclusively for ready-mix concrete operations in MENA.
              </p>
              {/* Inline metrics */}
              <div style={{ display:'flex', gap:0, marginBottom:36, flexWrap:'wrap' }}>
                {[
                  { num:'6', label:'AI Agents' },
                  { num:'99.9%', label:'Uptime SLA' },
                  { num:'AES-256', label:'Encryption' },
                  { num:'<3s', label:'Load Time' },
                ].map((m, i) => (
                  <div key={m.label} style={{ display:'flex', alignItems:'center' }}>
                    <div style={{ textAlign:'center', padding:'0 20px' }}>
                      <p className="font-data text-gold" style={{ fontSize:24, margin:0, lineHeight:1 }}>{m.num}</p>
                      <p style={{ fontSize:12, color:GRAY, margin:'4px 0 0', fontFamily:'Inter,sans-serif' }}>{m.label}</p>
                    </div>
                    {i < 3 && <div style={{ width:1, height:36, background:GOLD, opacity:.3 }} />}
                  </div>
                ))}
              </div>
              {/* CTAs */}
              <div ref={heroCta} style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
                <button className="btn-gold" style={{ height:64, padding:'0 32px', fontSize:16 }} onClick={()=>navigate('/auth')}>
                  Access Platform →
                </button>
                <button className="btn-ghost" style={{ height:64, padding:'0 28px', fontSize:15, display:'flex', alignItems:'center', gap:8 }} onClick={handleDemoLogin} disabled={demoLoading}>
                  {demoLoading ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> : <Play size={16} />}
                  Watch 2-min Demo
                </button>
              </div>
              <p style={{ color:GRAY, fontSize:13, fontFamily:'Inter,sans-serif' }}>
                Trusted by concrete producers across 🇲🇦 Morocco, 🇸🇦 Saudi Arabia &amp; 🇦🇪 UAE
              </p>
            </div>

            {/* RIGHT — Dashboard Card */}
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
              <div className="hero-float lp-card" style={{
                width:'100%', maxWidth:420, padding:24,
                border:`1px solid ${GOLD}`, borderRadius:16,
                boxShadow:'0 40px 80px rgba(0,0,0,0.6)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <span style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:14 }}>TBOS Operations Center</span>
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#10B981', fontFamily:'Inter,sans-serif' }}>
                    <span className="dot-live" /> LIVE
                  </span>
                </div>
                {/* Mini KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                  {[{ v:'284', l:'Batches' }, { v:'99.8%', l:'Quality' }, { v:'38', l:'Trucks' }].map(k => (
                    <div key={k.l} className="lp-card" style={{ padding:'10px 8px', textAlign:'center', border:`1px solid ${BORDER}` }}>
                      <p className="font-data text-gold" style={{ fontSize:18, margin:0 }}>{k.v}</p>
                      <p style={{ fontSize:11, color:GRAY, margin:'2px 0 0', fontFamily:'Inter,sans-serif' }}>{k.l}</p>
                    </div>
                  ))}
                </div>
                {/* Chart */}
                <div style={{ height:80, marginBottom:12 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top:4, right:0, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={GOLD} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" dot={false} />
                      <Tooltip contentStyle={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:6, fontSize:11 }} itemStyle={{ color:GOLD }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'rgba(16,185,129,0.08)', borderRadius:8, border:'1px solid rgba(16,185,129,0.2)' }}>
                  <span style={{ fontSize:10 }}>🟢</span>
                  <span style={{ fontSize:12, color:'#10B981', fontFamily:'Inter,sans-serif' }}>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: TRUST MARQUEE ── */}
        <section style={{ borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, height:48, overflow:'hidden', display:'flex', alignItems:'center', background: NAVY }}>
          <div className="marquee-track">
            {[...trustItems, ...trustItems].map((t, i) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'0 32px', fontFamily:'Inter,sans-serif', fontSize:13, color:GRAY, whiteSpace:'nowrap' }}>
                <Check size={13} color={GOLD} />
                {t}
                <span style={{ color:GOLD, marginLeft:8 }}>·</span>
              </span>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: METRICS ── */}
        <section id="roi" className="section-pad dot-grid">
          <div className="container-max">
            <div ref={r1} className="reveal" style={{ textAlign:'center', marginBottom:60 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:12, color:GOLD, letterSpacing:4, textTransform:'uppercase', marginBottom:12 }}>PLATFORM PERFORMANCE</p>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,48px)', margin:0 }}>Built for Industrial Scale</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:24 }}>
              {[
                { ref:c1, icon:'🤖', title:'Autonomous AI Agents', desc:'Operations, Marketing, Sales, Support, Maintenance, and Quality agents working 24/7 without human intervention' },
                { ref:c2, icon:'🛡️', title:'Uptime SLA Guarantee', desc:'Enterprise-grade infrastructure with redundant systems, automatic failover, and real-time monitoring' },
                { ref:c3, icon:'🔒', title:'Military-Grade Security', desc:"Bank-level encryption protecting all data in transit and at rest. Your production data stays yours." },
                { ref:c4, icon:'⚡', title:'Global Load Time', desc:'Optimized for real-time decision making. Every millisecond counts when concrete is curing on site.' },
              ].map((m, i) => (
                <div ref={m.ref.ref as React.RefObject<HTMLDivElement>} key={m.title} className="lp-card metric-card" style={{ padding:40, textAlign:'center', transition:'transform 200ms, box-shadow 200ms', cursor:'default' }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-4px)')} onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                  <div style={{ fontSize:48, marginBottom:16 }}>{m.icon}</div>
                  <p className="font-display text-gold" style={{ fontSize: i===2 ? 48 : 72, lineHeight:1, margin:'0 0 8px' }}>{m.ref.display}</p>
                  <p className="font-heading" style={{ fontWeight:700, fontSize:16, margin:'0 0 12px' }}>{m.title}</p>
                  <p style={{ color:GRAY, fontSize:13, lineHeight:1.6, margin:0 }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FEATURES ── */}
        <section id="features" className="section-pad" style={{ background:'#0C1118' }}>
          <div className="container-max">
            <div ref={r2} className="reveal" style={{ textAlign:'center', marginBottom:60 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:12, color:GOLD, letterSpacing:4, textTransform:'uppercase', marginBottom:12 }}>PLATFORM CAPABILITIES</p>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,48px)', margin:'0 0 12px' }}>Everything Your Plant Needs</h2>
              <p style={{ color:GRAY, fontSize:18, fontFamily:'Inter,sans-serif', margin:0 }}>Six integrated modules that replace 12 separate software tools</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
              {features.map(f => (
                <div key={f.title} className="lp-card lp-card-hover" style={{ padding:36, position:'relative' }}>
                  {f.badge && (
                    <div style={{ position:'absolute', top:16, right:16, background:GOLD, color:'#000', padding:'3px 10px', borderRadius:12, fontSize:10, fontFamily:'Poppins,sans-serif', fontWeight:700 }}>{f.badge}</div>
                  )}
                  <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,215,0,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:20 }}>{f.icon}</div>
                  <h3 className="font-heading" style={{ fontWeight:700, fontSize:20, margin:'0 0 10px' }}>{f.title}</h3>
                  <p style={{ color:GRAY, fontSize:14, lineHeight:1.7, margin:'0 0 16px' }}>{f.desc}</p>
                  <div>{f.pills.map(p => <span key={p} className="pill">{p}</span>)}</div>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:GOLD, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:14, padding:'12px 0 0', display:'block' }}>Learn More →</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: ROI ── */}
        <section className="section-pad dot-grid" style={{ background:`linear-gradient(180deg, rgba(255,215,0,0.03) 0%, transparent 20%)` }}>
          <div className="container-max">
            <div ref={r3} className="reveal" style={{ textAlign:'center', marginBottom:60 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:12, color:GOLD, letterSpacing:4, textTransform:'uppercase', marginBottom:12 }}>PROVEN RESULTS</p>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,72px)', margin:0 }}>Real Numbers. Real Plants.</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'start' }}>
              {/* Case Study */}
              <div className="lp-card" style={{ padding:40, borderLeft:`4px solid ${GOLD}` }}>
                <div style={{ display:'inline-block', background:'rgba(255,215,0,0.1)', border:`1px solid ${GOLD}`, borderRadius:6, padding:'3px 10px', fontSize:11, color:GOLD, fontFamily:'Poppins,sans-serif', fontWeight:700, marginBottom:12 }}>CASE STUDY</div>
                <h3 className="font-heading" style={{ fontWeight:700, fontSize:22, margin:'0 0 4px' }}>Talmi Beton — Morocco 🇲🇦</h3>
                <p style={{ color:GRAY, fontSize:13, marginBottom:20 }}>Ready-Mix Concrete Production</p>
                <p style={{ color:GRAY, fontSize:14, marginBottom:8 }}><strong style={{ color:'#fff' }}>Challenge:</strong> 67% defect rate, 4-6 monthly equipment failures, fragmented operations across 4 plants</p>
                <p style={{ color:GRAY, fontSize:14, marginBottom:20 }}><strong style={{ color:'#fff' }}>Solution:</strong> Deployed TBOS with Predictive Quality AI, Maintenance Agent, and Supply Chain Optimizer</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24 }}>
                  {[['67%','Defect Reduction'],['42%','Downtime Reduction'],['38%','Supply Chain Efficiency'],['24%','Production Increase'],['$840K','Annual Savings'],['847%','ROI Return']].map(([n,l]) => (
                    <div key={l} style={{ textAlign:'center' }}>
                      <p className="font-data text-gold" style={{ fontSize:24, margin:0 }}>{n}</p>
                      <p style={{ fontSize:11, color:GRAY, margin:'4px 0 0' }}>{l}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background:GOLD, color:'#000', padding:'8px 16px', borderRadius:8, display:'inline-block', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:13, marginBottom:20 }}>⚡ 1.4 Month Payback Period</div>
                <blockquote style={{ borderLeft:`2px solid ${GOLD}`, paddingLeft:16, margin:'0 0 0' }}>
                  <p style={{ color:GRAY, fontSize:14, fontStyle:'italic', lineHeight:1.7, margin:'0 0 8px' }}>"TBOS transformed how we operate. We went from reactive management to predictive optimization. It's a game-changer for the concrete industry."</p>
                  <cite style={{ color:GOLD, fontSize:13, fontFamily:'Poppins,sans-serif', fontWeight:600 }}>— Mohamed Talmi, CEO, Talmi Beton 🇲🇦</cite>
                </blockquote>
              </div>
              {/* Aggregate */}
              <div>
                <p className="font-heading" style={{ fontWeight:700, fontSize:22, marginBottom:24 }}>Across All Customers</p>
                {[['$2.4M','Total Annual Savings Generated'],['847%','Average Customer ROI'],['1.4mo','Average Payback Period']].map(([n,l]) => (
                  <div key={l} className="lp-card" style={{ padding:28, marginBottom:16, textAlign:'center' }}>
                    <p className="font-display text-gold" style={{ fontSize:72, lineHeight:1, margin:'0 0 4px' }}>{n}</p>
                    <p style={{ color:GRAY, fontSize:14, margin:0 }}>{l}</p>
                  </div>
                ))}
                <div style={{ textAlign:'center', marginBottom:20 }}>
                  <span style={{ color:GOLD, fontSize:18, marginRight:8 }}>{'⭐'.repeat(5)}</span>
                  <span style={{ color:GRAY, fontSize:14 }}>4.9/5.0 Customer Satisfaction</span>
                </div>
                <button className="btn-gold" style={{ width:'100%', height:52, fontSize:15 }} onClick={()=>navigate('/success-stories')}>See Full Case Study →</button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: AI AGENTS ── */}
        <section className="section-pad" style={{ background:'#0C1118' }}>
          <div className="container-max">
            <div ref={r4} className="reveal" style={{ textAlign:'center', marginBottom:80 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:12, color:GOLD, letterSpacing:4, textTransform:'uppercase', marginBottom:12 }}>AUTONOMOUS OPERATIONS</p>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,72px)', margin:'0 0 12px' }}>Your Plant Runs Itself</h2>
              <p style={{ color:GRAY, fontSize:18, fontFamily:'Inter,sans-serif' }}>6 AI agents work 24/7 so your team focuses on what matters</p>
            </div>
            {/* Orbit diagram */}
            <div style={{ position:'relative', width:420, height:420, margin:'0 auto 60px' }}>
              {/* Glow bg */}
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(255,215,0,0.04)', filter:'blur(40px)' }} />
              {/* Center */}
              <div className="pulse-glow" style={{
                position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                width:100, height:100, borderRadius:'50%',
                background:`linear-gradient(135deg, ${GOLD}, #FFA500)`,
                display:'flex', alignItems:'center', justifyContent:'center', zIndex:10,
              }}>
                <span className="font-display" style={{ fontSize:28, color:'#000' }}>TBOS</span>
              </div>
              {/* Orbit ring */}
              <div style={{ position:'absolute', inset:20, borderRadius:'50%', border:`1px dashed rgba(255,215,0,0.2)` }} />
              {/* Agents */}
              {agents.map((a, i) => {
                const angle = (a.angle - 90) * (Math.PI / 180);
                const r = 170;
                const x = 210 + r * Math.cos(angle) - 50;
                const y = 210 + r * Math.sin(angle) - 50;
                return (
                  <div key={a.label} style={{
                    position:'absolute', left:x, top:y, width:100, height:100,
                    background:CARD, border:`1px solid ${BORDER}`, borderRadius:12,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    padding:8, textAlign:'center', cursor:'default',
                    transition:'border-color 0.2s',
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor=GOLD)}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor=BORDER)}
                  >
                    <div style={{ fontSize:24, marginBottom:4 }}>{a.icon}</div>
                    <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:10, margin:0, color:'#fff' }}>{a.label}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:3 }}>
                      <span className="dot-live" style={{ width:5, height:5 }} />
                      <span style={{ fontSize:9, color:'#10B981', fontFamily:'Inter,sans-serif' }}>ACTIVE</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="font-display" style={{ fontSize:'clamp(32px,5vw,48px)', textAlign:'center', color:GRAY }}>
              While you sleep, <span className="text-gold">TBOS works.</span>
            </p>
          </div>
        </section>

        {/* ── SECTION 8: LEAD SCORE CTA ── */}
        <section style={{ background:`linear-gradient(135deg, #161D26 0%, ${NAVY} 100%)`, borderTop:`2px solid ${GOLD}`, borderBottom:`2px solid ${GOLD}` }} className="section-pad">
          <div className="container-max" style={{ textAlign:'center' }}>
            <div ref={r5} className="reveal">
              <div style={{ fontSize:64, marginBottom:24 }}>🎯</div>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,72px)', margin:'0 0 16px' }}>Discover Your TBOS Score</h2>
              <p style={{ color:GRAY, fontSize:18, fontFamily:'Inter,sans-serif', maxWidth:560, margin:'0 auto 32px', lineHeight:1.7 }}>
                Answer 5 quick questions about your operation and get an instant AI-powered score. See exactly how much TBOS can save your company — in dollars, per year.
              </p>
              <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap', marginBottom:36 }}>
                {['⏱️ Takes 2 Minutes','🔒 No Email Required','💰 See Your Savings'].map(p => (
                  <span key={p} style={{ background:'rgba(255,215,0,0.08)', border:`1px solid rgba(255,215,0,0.2)`, borderRadius:20, padding:'8px 20px', fontFamily:'Inter,sans-serif', fontSize:14, color:GOLD }}>{p}</span>
                ))}
              </div>
              <button className="btn-gold" style={{ height:72, width:'min(360px,100%)', fontSize:20 }} onClick={()=>navigate('/lead-scoring')}>
                Calculate Your Score →
              </button>
              <p style={{ color:GRAY, fontSize:13, marginTop:16, fontFamily:'Inter,sans-serif' }}>Join 50+ concrete producers who've already calculated their score</p>
            </div>
          </div>
        </section>

        {/* ── SECTION 9: TESTIMONIALS ── */}
        <section id="case-studies" className="section-pad dot-grid">
          <div className="container-max">
            <div ref={r6} className="reveal" style={{ textAlign:'center', marginBottom:60 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:12, color:GOLD, letterSpacing:4, textTransform:'uppercase', marginBottom:12 }}>CUSTOMER STORIES</p>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,72px)', margin:0 }}>Concrete Proof</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
              {testimonials.map(t => (
                <div key={t.company} className="lp-card lp-card-hover" style={{ padding:36 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                    <div>
                      <span style={{ fontSize:24 }}>{t.flag}</span>
                      <p className="font-heading" style={{ fontWeight:700, fontSize:16, margin:'4px 0 2px' }}>{t.company}</p>
                      <p style={{ color:GRAY, fontSize:12, margin:0 }}>{t.role}</p>
                    </div>
                    <div style={{ color:GOLD, fontSize:16 }}>{'⭐'.repeat(5)}</div>
                  </div>
                  <blockquote style={{ margin:'0 0 16px', padding:0 }}>
                    <p style={{ color:'#e0e0e0', fontSize:14, lineHeight:1.7, fontStyle:'italic', margin:'0 0 8px' }}>"{t.quote}"</p>
                    <cite style={{ color:GOLD, fontSize:12, fontFamily:'Poppins,sans-serif', fontWeight:600 }}>— {t.author}</cite>
                  </blockquote>
                  <p style={{ color:GOLD, fontSize:12, fontFamily:'JetBrains Mono,monospace', background:'rgba(255,215,0,0.06)', borderRadius:8, padding:'8px 12px', margin:'0 0 12px' }}>{t.results}</p>
                  <button onClick={()=>navigate('/success-stories')} style={{ background:'none', border:'none', cursor:'pointer', color:GOLD, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:13, padding:0, textDecoration:'underline' }}>Read Full Case Study →</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 10: PRICING ── */}
        <section id="pricing" className="section-pad" style={{ background:'#0C1118' }}>
          <div className="container-max">
            <div ref={r7} className="reveal" style={{ textAlign:'center', marginBottom:48 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:12, color:GOLD, letterSpacing:4, textTransform:'uppercase', marginBottom:12 }}>TRANSPARENT PRICING</p>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,48px)', margin:'0 0 32px' }}>Built for Every Stage of Growth</h2>
              {/* Toggle */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:12, background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, padding:'8px 20px' }}>
                <span style={{ fontFamily:'Poppins,sans-serif', fontSize:14, color: !annual ? GOLD : GRAY }}>Monthly</span>
                <div className={`toggle-track ${annual ? 'on' : ''}`} onClick={()=>setAnnual(!annual)}>
                  <div className="toggle-thumb" />
                </div>
                <span style={{ fontFamily:'Poppins,sans-serif', fontSize:14, color: annual ? GOLD : GRAY }}>Annual</span>
                {annual && <span style={{ background:GOLD, color:'#000', borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:700 }}>2 months FREE</span>}
              </div>
            </div>
            <PricingPlan annual={annual} />
            <p style={{ textAlign:'center', color:GRAY, fontSize:13, marginTop:32, fontFamily:'Inter,sans-serif' }}>
              🔒 30-day money-back guarantee · No setup fees · Cancel anytime
            </p>
          </div>
        </section>

        {/* ── SECTION 11: FAQ ── */}
        <section className="section-pad dot-grid">
          <div className="container-max" style={{ maxWidth:800, margin:'0 auto' }}>
            <div ref={r8} className="reveal" style={{ textAlign:'center', marginBottom:48 }}>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,48px)' }}>Common Questions</h2>
            </div>
            {faqs.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i===0} />)}
          </div>
        </section>

        {/* ── SECTION 12: FINAL CTA ── */}
        <section style={{ background:`linear-gradient(135deg, #1C2533, ${NAVY})`, borderTop:`2px solid rgba(255,215,0,0.3)` }} className="section-pad">
          <div className="container-max" style={{ textAlign:'center' }}>
            <h2 className="font-display" style={{ fontSize:'clamp(48px,8vw,80px)', margin:'0 0 16px' }}>
              Ready to Run Your Plant <span className="text-gold">on Autopilot?</span>
            </h2>
            <p style={{ color:GRAY, fontSize:18, fontFamily:'Inter,sans-serif', maxWidth:560, margin:'0 auto 40px' }}>
              Join concrete producers across MENA who've automated their operations with TBOS.
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap', marginBottom:24 }}>
              <button className="btn-gold" style={{ height:64, padding:'0 40px', fontSize:16 }} onClick={()=>navigate('/auth')}>
                Start Free Trial →
              </button>
              <button className="btn-ghost" style={{ height:64, padding:'0 36px', fontSize:15 }} onClick={()=>navigate('/auth')}>
                Schedule Demo
              </button>
            </div>
            <p style={{ color:GRAY, fontSize:13, fontFamily:'Inter,sans-serif' }}>No credit card required · Setup in 5 minutes · Cancel anytime</p>
          </div>
        </section>

        {/* ── SECTION 13: FOOTER ── */}
        <footer style={{ background:'#0A0F14', borderTop:`2px solid ${BORDER}`, padding:'64px 0 32px' }}>
          <div className="container-max">
            {/* Top row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:40, marginBottom:48 }}>
              <div style={{ maxWidth:300 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:8 }}>
                  <span className="font-display text-gold" style={{ fontSize:32 }}>TBOS</span>
                  <span style={{ color:GRAY, fontSize:12 }}>by Talmi Beton</span>
                </div>
                <p style={{ color:GRAY, fontSize:13, lineHeight:1.6, marginBottom:20 }}>The Operating System for Concrete Titans</p>
                {/* Newsletter */}
                <div style={{ display:'flex', gap:8 }}>
                  <input className="nl-input" type="email" placeholder="your@email.com" style={{ flex:1, fontSize:13 }} />
                  <button className="btn-gold" style={{ height:40, padding:'0 16px', fontSize:13 }}>Subscribe</button>
                </div>
              </div>
              {/* Link columns */}
              {[
                { title:'Product', links:['Features','Pricing','Security','Roadmap','API Docs'] },
                { title:'Company', links:['About','Blog','Careers','Press','Partners'] },
                { title:'Resources', links:['Documentation','Video Tutorials','Community','Support','Status Page'] },
                { title:'Legal', links:['Privacy Policy','Terms of Service','Security Policy','Cookie Policy'] },
              ].map(col => (
                <div key={col.title}>
                  <p className="font-heading" style={{ fontWeight:700, fontSize:14, marginBottom:16, color:'#fff' }}>{col.title}</p>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ display:'block', color:GRAY, fontSize:13, textDecoration:'none', marginBottom:10, transition:'color 0.2s' }}
                      onMouseEnter={e=>(e.currentTarget.style.color=GOLD)} onMouseLeave={e=>(e.currentTarget.style.color=GRAY)}>{l}</a>
                  ))}
                </div>
              ))}
            </div>
            {/* Bottom row */}
            <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
              <p style={{ color:GRAY, fontSize:12, margin:0 }}>© 2025 TBOS by Talmi Beton. All rights reserved.</p>
              <div style={{ display:'flex', gap:12, fontSize:20 }}>🇲🇦 🇸🇦 🇦🇪 🇪🇬</div>
              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                {(['EN','FR','AR'] as const).map(c => (
                  <button key={c} onClick={()=>switchLang(c)} style={{
                    background: langDisplay===c ? GOLD : 'transparent', color: langDisplay===c ? '#000' : GRAY,
                    border: `1px solid ${langDisplay===c ? GOLD : BORDER}`, borderRadius:6,
                    padding:'4px 10px', fontSize:12, cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:600,
                  }}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* Responsive overrides */}
      <style>{`
        @media(max-width:900px){
          .lp-root [style*="grid-template-columns: 55fr 45fr"] { grid-template-columns:1fr !important; }
          .lp-root [style*="grid-template-columns: 1fr 1fr"]:not([class*="metric"]) { grid-template-columns:1fr !important; }
        }
        @media(max-width:768px){
          #desktop-links { display:none !important; }
          #hamburger { display:block !important; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}
