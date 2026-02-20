import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import type { Language } from '@/i18n/I18nContext';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, Menu, X, Check, Zap, Play, Loader2, Shield, Clock, Lock, Star } from 'lucide-react';

/* ─── DESIGN TOKENS ─────────────────────────────────────── */
const NAVY   = '#0F1419';
const CARD   = '#161D26';
const BORDER = '#2A3545';
const GOLD   = '#FFD700';
const GRAY   = '#B0B8C1';

/* ─── GLOBAL CSS ────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    background: ${NAVY};
    color: #fff;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }

  /* ── FONTS ── */
  .font-display { font-family: 'Bebas Neue', cursive; }
  .font-heading  { font-family: 'Poppins', sans-serif; }
  .font-body     { font-family: 'Inter', sans-serif; }
  .font-data     { font-family: 'JetBrains Mono', monospace; }

  /* ── SHIMMER TOP BAR ── */
  .shimmer-bar {
    height: 2px; width: 100%;
    background: linear-gradient(90deg, transparent 0%, ${GOLD} 30%, transparent 50%, ${GOLD} 70%, transparent 100%);
    background-size: 300% 100%;
    animation: shimmerMove 3s linear infinite;
  }
  @keyframes shimmerMove { 0% { background-position: 100% 0% } 100% { background-position: -100% 0% } }

  /* ── DOT GRID ── */
  .dot-grid {
    background-image: radial-gradient(circle, rgba(255,215,0,0.028) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  /* ── NOISE GRAIN ── */
  .grain::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  /* ── CARDS ── */
  .lp-card {
    background: ${CARD};
    border: 1px solid ${BORDER};
    border-radius: 12px;
  }
  .lp-card-hover {
    transition: transform 250ms cubic-bezier(.2,.8,.2,1), border-color 250ms ease, box-shadow 250ms ease;
    will-change: transform;
  }
  .lp-card-hover:hover {
    transform: translateY(-6px);
    border-color: rgba(255,215,0,0.5);
    box-shadow: 0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,215,0,0.1), 0 0 40px rgba(255,215,0,0.08);
  }

  /* ── BUTTONS ── */
  .btn-gold {
    background: linear-gradient(135deg, #FFD700 0%, #FFC200 50%, #FFA500 100%);
    color: #000;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease, filter 220ms ease;
    will-change: transform;
    position: relative;
    overflow: hidden;
  }
  .btn-gold::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .btn-gold:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 32px rgba(255,215,0,0.45), 0 2px 8px rgba(255,215,0,0.3);
    filter: brightness(1.08);
  }
  .btn-gold:active { transform: scale(0.98); }

  .btn-ghost {
    background: transparent;
    color: ${GOLD};
    border: 1px solid ${GOLD};
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: background 220ms ease, transform 220ms ease, box-shadow 220ms ease;
    will-change: transform;
    position: relative;
    overflow: hidden;
  }
  .btn-ghost::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,215,0,0);
    transition: background 300ms ease;
  }
  .btn-ghost:hover {
    background: rgba(255,215,0,0.08);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 0 24px rgba(255,215,0,0.15), inset 0 0 24px rgba(255,215,0,0.03);
  }
  .btn-ghost:active { transform: scale(0.98); }

  /* ── METRIC CARDS ── */
  .metric-card {
    border-top: 3px solid ${GOLD};
    transition: transform 250ms cubic-bezier(.2,.8,.2,1), box-shadow 250ms ease;
    will-change: transform;
  }
  .metric-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 0 40px rgba(255,215,0,0.18), 0 20px 40px rgba(0,0,0,0.3);
  }

  /* ── HERO FLOAT ── */
  @keyframes float {
    0%, 100% { transform: translateY(-10px) rotateY(-8deg) rotateX(4deg); }
    50%       { transform: translateY(10px)  rotateY(-8deg) rotateX(4deg); }
  }
  .hero-float { animation: float 5s ease-in-out infinite; }

  /* ── MARQUEE ── */
  @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
  .marquee-track { display: flex; width: max-content; animation: marquee 32s linear infinite; }

  /* ── PULSE GLOW ── */
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 24px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.25); }
    50%       { box-shadow: 0 0 48px rgba(255,215,0,0.85), 0 0 100px rgba(255,215,0,0.4); }
  }
  .pulse-glow { animation: pulseGlow 2.5s ease-in-out infinite; }

  /* ── BLINK DOT ── */
  @keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
  .dot-live {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    background: #10B981;
    animation: blink 1.8s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(16,185,129,0.8);
  }

  /* ── ACCORDION ── */
  .faq-content { max-height: 0; overflow: hidden; transition: max-height 0.38s cubic-bezier(.4,0,.2,1); }
  .faq-content.open { max-height: 300px; }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 2px; left: 0; right: 0; z-index: 100;
    height: 72px;
    background: rgba(15,20,25,0.88);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid rgba(42,53,69,0.7);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px;
    transition: background 300ms ease;
  }
  @media(max-width:768px) { .lp-nav { padding: 0 20px; } }

  /* ── NAV LINK ── */
  .nav-link {
    background: none; border: none; cursor: pointer;
    color: ${GRAY}; font-family: 'Inter', sans-serif; font-size: 14px;
    padding: 6px 4px; position: relative; transition: color 0.2s ease;
  }
  .nav-link::after {
    content: '';
    position: absolute; bottom: -2px; left: 0; right: 0; height: 2px;
    background: ${GOLD}; transform: scaleX(0); transform-origin: center;
    transition: transform 0.25s ease;
  }
  .nav-link:hover { color: #fff; }
  .nav-link:hover::after { transform: scaleX(1); }

  /* ── SECTION PADDING ── */
  .section-pad { padding: 120px 0; }
  @media(max-width:768px) { .section-pad { padding: 80px 0; } }

  .container-max { max-width: 1280px; margin: 0 auto; padding: 0 40px; }
  @media(max-width:768px) { .container-max { padding: 0 20px; } }

  /* ── SCROLL REVEAL ── */
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.65s cubic-bezier(.2,.8,.2,1), transform 0.65s cubic-bezier(.2,.8,.2,1);
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }

  /* ── FEATURE PILL ── */
  .pill {
    display: inline-block; padding: 4px 12px; border-radius: 20px;
    border: 1px solid rgba(255,215,0,0.25);
    font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 500;
    color: ${GOLD};
    background: rgba(255,215,0,0.06);
    margin: 3px 3px 3px 0;
    transition: background 200ms ease, border-color 200ms ease;
  }
  .pill:hover { background: rgba(255,215,0,0.12); border-color: rgba(255,215,0,0.5); }

  /* ── PRICING TOGGLE ── */
  .toggle-track {
    width: 52px; height: 28px; background: ${BORDER};
    border-radius: 14px; position: relative; cursor: pointer;
    transition: background 250ms ease;
  }
  .toggle-track.on { background: ${GOLD}; }
  .toggle-thumb {
    position: absolute; top: 4px; left: 4px;
    width: 20px; height: 20px; border-radius: 50%;
    background: #fff; transition: left 250ms cubic-bezier(.2,.8,.2,1);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  .toggle-track.on .toggle-thumb { left: 28px; }

  /* ── MOBILE MENU ── */
  .mobile-menu {
    position: fixed; inset: 0; background: rgba(10,14,20,0.97);
    backdrop-filter: blur(20px);
    z-index: 200; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 32px;
  }

  /* ── NL INPUT ── */
  .nl-input {
    background: ${CARD}; border: 1px solid ${BORDER};
    border-radius: 6px; padding: 10px 16px;
    color: #fff; font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 250ms ease, box-shadow 250ms ease;
  }
  .nl-input:focus { border-color: ${GOLD}; box-shadow: 0 0 0 3px rgba(255,215,0,0.1); }

  /* ── GLASS CARD ── */
  .glass-card {
    background: rgba(22,29,38,0.85);
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    border: 1px solid rgba(255,215,0,0.35);
    border-radius: 16px;
  }

  /* ── HERO PARTICLES ── */
  .particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,215,0,0.6);
    pointer-events: none;
    animation: particleFloat linear infinite;
  }
  @keyframes particleFloat {
    0%   { transform: translateY(100vh) scale(0); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-20px) scale(1); opacity: 0; }
  }

  /* ── GOLD TEXT ── */
  .text-gold { color: ${GOLD}; }
  .text-gray  { color: ${GRAY}; }

  /* ── GRADIENT HEADLINE ── */
  .headline-gradient {
    background: linear-gradient(135deg, #FFD700 0%, #FFC200 40%, #FFE566 70%, #FFD700 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── AGENT NODE ── */
  .agent-node {
    transition: transform 250ms ease, border-color 250ms ease, box-shadow 250ms ease;
    cursor: default;
  }
  .agent-node:hover {
    transform: scale(1.08);
    border-color: ${GOLD} !important;
    box-shadow: 0 0 20px rgba(255,215,0,0.3);
    z-index: 10;
  }

  /* ── SPIN (for loader) ── */
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── ORBIT RING PULSE ── */
  @keyframes orbitRingPulse {
    0%, 100% { opacity: 0.15; }
    50%       { opacity: 0.4; }
  }
  .orbit-ring { animation: orbitRingPulse 4s ease-in-out infinite; }

  /* ── COUNTER BOUNCE ── */
  @keyframes counterBounce {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.12); }
    100% { transform: scale(1); }
  }
  .counter-done { animation: counterBounce 0.4s cubic-bezier(.2,.8,.2,1) 1; }

  /* ── FOOTER LINK ── */
  .footer-link {
    display: block; color: ${GRAY}; font-size: 13px; text-decoration: none;
    margin-bottom: 10px;
    transition: color 0.2s ease, transform 0.2s ease;
  }
  .footer-link:hover { color: ${GOLD}; transform: translateX(3px); }

  /* ── RESPONSIVE ── */
  @media(max-width:900px) {
    .hero-grid { grid-template-columns: 1fr !important; }
    .roi-grid  { grid-template-columns: 1fr !important; }
  }
  @media(max-width:768px) {
    #desktop-links { display: none !important; }
    #hamburger { display: block !important; }
    .orbit-container { transform: scale(0.72); transform-origin: center top; }
  }
  @media(max-width:480px) {
    .orbit-container { transform: scale(0.52); }
  }

  /* ── GRADIENT SECTION SEPARATORS ── */
  .section-glow-top    { background: linear-gradient(180deg, rgba(255,215,0,0.04) 0%, transparent 30%); }
  .section-glow-bottom { background: linear-gradient(0deg,   rgba(255,215,0,0.04) 0%, transparent 30%); }
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
  { icon:'📣', label:'Marketing',  desc:'Generates content, qualifies leads, sends campaigns',      angle:60 },
  { icon:'💼', label:'Sales',      desc:'Qualifies prospects, books demos, sends follow-ups',       angle:120 },
  { icon:'🎧', label:'Support',    desc:'Answers tickets 24/7, resolves issues, escalates when needed', angle:180 },
  { icon:'🔧', label:'Maintenance',desc:'Predicts equipment failures before they happen',           angle:240 },
  { icon:'📊', label:'Analytics',  desc:'Surfaces insights, generates reports, flags anomalies',   angle:300 },
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
  { flag:'🇲🇦', company:'Talmi Beton',       role:'Ready-Mix Production',    quote:'TBOS transformed how we operate. We went from reactive management to predictive optimization.', author:'Mohamed Talmi, CEO',             results:'847% ROI · $840K saved · 1.4mo payback' },
  { flag:'🇲🇦', company:'Atlas Concrete Group', role:'Multi-Plant Operations', quote:'The predictive maintenance alone paid for the entire platform in the first quarter.',           author:'Hassan Benali, COO',             results:'94x ROI on maintenance module alone' },
  { flag:'🇸🇦', company:'Gulf Ready Mix',      role:'Fleet & Logistics',       quote:'Finally, an ERP that understands Arabic operations. The RTL support is flawless.',             author:'Ahmed Al-Rashid, Operations Dir.', results:'38% fuel cost reduction · 22% faster deliveries' },
];

/* ─── NAV LINKS ──────────────────────────────────────── */
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

/* ─── COUNTER HOOK ───────────────────────────────────── */
function useCounter(target: number, decimals = 0, suffix = '', prefix = '') {
  const [val, setVal] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 4);
          setVal(ease * target);
          if (t < 1) requestAnimationFrame(step);
          else { setVal(target); setDone(true); setTimeout(()=>setDone(false), 500); }
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return { ref, display: `${prefix}${val.toFixed(decimals)}${suffix}`, done };
}

/* ─── REVEAL HOOK ────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDelay = `${delay}ms`;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

/* ─── PARTICLES ──────────────────────────────────────── */
function Particles() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const size  = 1.5 + Math.random() * 3;
        const left  = Math.random() * 100;
        const delay = Math.random() * 12;
        const dur   = 10 + Math.random() * 14;
        return (
          <div key={i} className="particle" style={{
            width: size, height: size,
            left: `${left}%`, bottom: 0,
            animationDuration: `${dur}s`,
            animationDelay: `${delay}s`,
          }} />
        );
      })}
    </div>
  );
}

/* ─── FAQ ITEM ───────────────────────────────────────── */
function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderBottom: `1px solid ${BORDER}`, padding: '20px 0',
      transition: 'background 200ms ease',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer', color: open ? GOLD : '#fff',
          fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: 16, textAlign: 'left',
          transition: 'color 200ms ease',
        }}
      >
        {q}
        <ChevronDown size={18} color={GOLD} style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.32s cubic-bezier(.2,.8,.2,1)',
          flexShrink: 0, marginLeft: 12,
        }} />
      </button>
      <div className={`faq-content ${open ? 'open' : ''}`}>
        <p style={{ color: GRAY, fontFamily: 'Inter,sans-serif', fontSize: 15, lineHeight: 1.75, paddingTop: 14, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─── PRICING PLAN ───────────────────────────────────── */
function PricingPlan({ annual }: { annual: boolean }) {
  const navigate = useNavigate();
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
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
      {plans.map(p => (
        <div key={p.name} className="lp-card" style={{
          padding:36, position:'relative', display:'flex', flexDirection:'column',
          border: p.highlight ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
          background: p.highlight ? '#1C2533' : CARD,
          boxShadow: p.highlight ? `0 0 60px rgba(255,215,0,0.1), 0 20px 60px rgba(0,0,0,0.3)` : undefined,
          transform: p.highlight ? 'scale(1.02)' : undefined,
          transition: 'transform 250ms ease, box-shadow 250ms ease',
        }}>
          {p.highlight && (
            <div style={{
              position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)',
              background:`linear-gradient(135deg, ${GOLD}, #FFA500)`,
              color:'#000', padding:'5px 20px', borderRadius:20,
              fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:12,
              whiteSpace:'nowrap',
              boxShadow:`0 4px 20px rgba(255,215,0,0.4)`,
            }}>
              ⭐ MOST POPULAR
            </div>
          )}
          <p className="font-heading" style={{ fontWeight:700, fontSize:20, marginBottom:4 }}>{p.name}</p>
          <p style={{ color:GRAY, fontSize:13, marginBottom:16 }}>{p.tag}</p>
          {p.price ? (
            <>
              <p className="font-data text-gold" style={{ fontSize:p.highlight?56:48, lineHeight:1 }}>
                ${p.price}<span style={{ fontSize:18, color:GRAY }}>/mo</span>
              </p>
              <p style={{ color:GRAY, fontSize:13, marginBottom:24 }}>${p.yearly?.toLocaleString()}/year</p>
            </>
          ) : (
            <p className="font-display text-gold" style={{ fontSize:56, lineHeight:1, marginBottom:24 }}>Custom</p>
          )}
          <div style={{ flexGrow:1 }}>
            {p.features.map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={11} color="#10B981" />
                </div>
                <span style={{ fontSize:14, color:'#e0e0e0' }}>{f}</span>
              </div>
            ))}
            {p.missing.map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, opacity:.4 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(176,184,193,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <X size={11} color={GRAY} />
                </div>
                <span style={{ fontSize:14, color:GRAY }}>{f}</span>
              </div>
            ))}
          </div>
          <button
            className={p.highlight ? 'btn-gold' : 'btn-ghost'}
            style={{ marginTop:24, height:50, fontSize:15, width:'100%' }}
            onClick={() => navigate('/auth')}
          >
            {p.name==='Enterprise' ? 'Contact Sales →' : p.highlight ? 'Start Free Trial →' : 'Get Started →'}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const { lang: i18nLang, setLang: setI18nLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual]     = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [scrollY, setScrollY]   = useState(0);

  const langDisplay = i18nLang === 'ar' ? 'AR' : i18nLang === 'fr' ? 'FR' : 'EN';
  const switchLang = (code: 'EN'|'FR'|'AR') => {
    const map: Record<string, Language> = { EN:'en', FR:'fr', AR:'ar' };
    setI18nLang(map[code]);
  };

  // Parallax scroll tracking
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hero entrance refs
  const heroBadge = useRef<HTMLDivElement>(null);
  const heroLine1  = useRef<HTMLSpanElement>(null);
  const heroLine2  = useRef<HTMLSpanElement>(null);
  const heroLine3  = useRef<HTMLSpanElement>(null);
  const heroSub   = useRef<HTMLParagraphElement>(null);
  const heroMetrics = useRef<HTMLDivElement>(null);
  const heroCta   = useRef<HTMLDivElement>(null);
  const heroCard  = useRef<HTMLDivElement>(null);

  // Counters
  const c1 = useCounter(6, 0, '', '');
  const c2 = useCounter(99.9, 1, '%', '');
  const c3 = useCounter(256, 0, '', 'AES-');
  const c4 = useCounter(3, 0, 's', '<');

  // Section reveals
  const r1 = useReveal(0);
  const r2 = useReveal(0);
  const r3 = useReveal(0);
  const r4 = useReveal(0);
  const r5 = useReveal(0);
  const r6 = useReveal(0);
  const r7 = useReveal(0);
  const r8 = useReveal(0);

  // Staggered hero entrance
  useEffect(() => {
    const items = [
      { el: heroBadge.current,  delay: 200 },
      { el: heroLine1.current,  delay: 380 },
      { el: heroLine2.current,  delay: 500 },
      { el: heroLine3.current,  delay: 620 },
      { el: heroSub.current,    delay: 780 },
      { el: heroMetrics.current,delay: 940 },
      { el: heroCta.current,    delay: 1080 },
      { el: heroCard.current,   delay: 600 },
    ];
    items.forEach(({ el, delay }) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(32px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(.2,.8,.2,1), transform 0.6s cubic-bezier(.2,.8,.2,1)';
      setTimeout(() => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
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
        "aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9","ratingCount":"50"},
      })}} />

      <div className="lp-root">

        {/* ── SHIMMER BAR ── */}
        <div className="shimmer-bar" />

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
            <span className="font-display text-gold" style={{ fontSize:30, lineHeight:1, letterSpacing:1 }}>TBOS</span>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <span style={{ color:GRAY, fontSize:10, fontFamily:'Inter,sans-serif', letterSpacing:1 }}>by Talmi Beton</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:36, alignItems:'center' }} id="desktop-links">
            {NAV_LINKS.map(link => (
              <button key={link.id} className="nav-link" onClick={()=>smoothScrollTo(link.id)}>
                {link.label[langDisplay as keyof typeof link.label]}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Language switcher */}
            <div style={{ display:'flex', gap:2, background:'rgba(22,29,38,0.8)', border:`1px solid ${BORDER}`, borderRadius:8, padding:'3px 4px' }}>
              {(['EN','FR','AR'] as const).map(c => (
                <button key={c} onClick={()=>switchLang(c)} style={{
                  padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer', fontSize:11,
                  fontFamily:'Poppins,sans-serif', fontWeight:700, letterSpacing:.5,
                  background: langDisplay===c ? GOLD : 'transparent',
                  color: langDisplay===c ? '#000' : GRAY,
                  transition:'all 0.2s ease',
                }}>{c}</button>
              ))}
            </div>
            <button className="btn-gold" style={{ height:44, padding:'0 22px', fontSize:14 }} onClick={()=>navigate('/auth')}>
              Request Demo
            </button>
            <button style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:'#fff', padding:4 }} id="hamburger" onClick={()=>setMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </nav>

        {/* ── MOBILE MENU ── */}
        {menuOpen && (
          <div className="mobile-menu">
            <button style={{ position:'absolute', top:24, right:24, background:'none', border:'none', cursor:'pointer', color:'#fff' }} onClick={()=>setMenuOpen(false)}>
              <X size={28}/>
            </button>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {(['EN','FR','AR'] as const).map(c => (
                <button key={c} onClick={()=>switchLang(c)} style={{
                  background: langDisplay===c ? GOLD : 'transparent',
                  color: langDisplay===c ? '#000' : GRAY,
                  border:`1px solid ${langDisplay===c ? GOLD : BORDER}`,
                  borderRadius:6, padding:'6px 14px', fontSize:12, cursor:'pointer',
                  fontFamily:'Poppins,sans-serif', fontWeight:700,
                }}>{c}</button>
              ))}
            </div>
            {NAV_LINKS.map(link => (
              <button key={link.id} onClick={()=>{ setMenuOpen(false); smoothScrollTo(link.id); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#fff', fontFamily:'Poppins,sans-serif', fontSize:28, fontWeight:700 }}>
                {link.label[langDisplay as keyof typeof link.label]}
              </button>
            ))}
            <button className="btn-gold" style={{ height:56, padding:'0 40px', fontSize:17, marginTop:8 }} onClick={()=>{ setMenuOpen(false); navigate('/auth'); }}>
              Request Demo
            </button>
          </div>
        )}

        {/* ── SECTION 2: HERO ── */}
        <section className="dot-grid" style={{
          minHeight:'100vh', paddingTop:72, display:'flex', alignItems:'center',
          position:'relative', overflow:'hidden',
        }}>
          {/* Animated particles */}
          <Particles />

          {/* Deep glow orbs */}
          <div style={{
            position:'absolute', right:'5%', top:'30%',
            width:700, height:700, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 70%)',
            filter:'blur(60px)', pointerEvents:'none',
            transform:`translateY(${scrollY * 0.15}px)`,
            transition:'transform 0.1s linear',
          }} />
          <div style={{
            position:'absolute', left:'-10%', bottom:'10%',
            width:500, height:500, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(255,160,0,0.04) 0%, transparent 70%)',
            filter:'blur(80px)', pointerEvents:'none',
          }} />

          <div className="container-max hero-grid" style={{
            display:'grid', gridTemplateColumns:'55fr 45fr', gap:60,
            alignItems:'center', paddingTop:60, paddingBottom:60, width:'100%',
          }}>
            {/* LEFT */}
            <div>
              {/* Badge */}
              <div ref={heroBadge} style={{
                display:'inline-flex', alignItems:'center', gap:8,
                border:`1px solid rgba(255,215,0,0.5)`, borderRadius:24,
                padding:'7px 18px', marginBottom:32,
                background:'rgba(255,215,0,0.05)',
                backdropFilter:'blur(8px)',
              }}>
                <Zap size={14} color={GOLD} />
                <span style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:11, color:GOLD, letterSpacing:2, textTransform:'uppercase' }}>
                  Now with 6 Autonomous AI Agents
                </span>
              </div>

              {/* Headline — word by word */}
              <h1 className="font-display" style={{ fontSize:'clamp(56px,8vw,96px)', lineHeight:.92, marginBottom:28, letterSpacing:1 }}>
                <span ref={heroLine1} style={{ display:'block' }}>THE OPERATING</span>
                <span ref={heroLine2} style={{ display:'block' }}>SYSTEM FOR</span>
                <span ref={heroLine3} className="headline-gradient" style={{ display:'block' }}>CONCRETE TITANS</span>
              </h1>

              {/* Subheadline */}
              <p ref={heroSub} style={{
                fontFamily:'Inter,sans-serif', fontSize:18, color:GRAY,
                maxWidth:520, lineHeight:1.75, marginBottom:36,
              }}>
                Unify production, logistics, finance, quality, and fleet management into one
                military-grade platform. Built exclusively for ready-mix concrete operations in MENA.
              </p>

              {/* Inline metrics */}
              <div ref={heroMetrics} style={{ display:'flex', gap:0, marginBottom:40, flexWrap:'wrap' }}>
                {[
                  { num:'6',       label:'AI Agents',  icon:<Zap size={12} color={GOLD}/> },
                  { num:'99.9%',   label:'Uptime SLA', icon:<Shield size={12} color={GOLD}/> },
                  { num:'AES-256', label:'Encryption',  icon:<Lock size={12} color={GOLD}/> },
                  { num:'<3s',     label:'Load Time',   icon:<Clock size={12} color={GOLD}/> },
                ].map((m, i) => (
                  <div key={m.label} style={{ display:'flex', alignItems:'center' }}>
                    <div style={{ textAlign:'center', padding:'0 22px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:4 }}>
                        {m.icon}
                      </div>
                      <p className="font-data text-gold" style={{ fontSize:22, margin:0, lineHeight:1, fontWeight:600 }}>{m.num}</p>
                      <p style={{ fontSize:11, color:GRAY, margin:'4px 0 0', fontFamily:'Inter,sans-serif', letterSpacing:.5 }}>{m.label}</p>
                    </div>
                    {i < 3 && <div style={{ width:1, height:40, background:`linear-gradient(180deg, transparent, ${GOLD}, transparent)`, opacity:.3 }} />}
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div ref={heroCta} style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:28 }}>
                <button className="btn-gold" style={{ height:64, padding:'0 36px', fontSize:16 }} onClick={()=>navigate('/auth')}>
                  Access Platform →
                </button>
                <button className="btn-ghost" style={{ height:64, padding:'0 28px', fontSize:15, display:'flex', alignItems:'center', gap:10 }} onClick={handleDemoLogin} disabled={demoLoading}>
                  {demoLoading
                    ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} />
                    : <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,215,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Play size={13} color={GOLD} style={{ marginLeft:2 }} />
                      </div>
                  }
                  Watch 2-min Demo
                </button>
              </div>

              {/* Social proof */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex' }}>
                  {['🇲🇦','🇸🇦','🇦🇪'].map((f,i)=>(
                    <span key={i} style={{ fontSize:20, marginLeft: i>0 ? -6 : 0, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>{f}</span>
                  ))}
                </div>
                <p style={{ color:GRAY, fontSize:13, fontFamily:'Inter,sans-serif' }}>
                  Trusted by concrete producers across Morocco, Saudi Arabia &amp; UAE
                </p>
              </div>
            </div>

            {/* RIGHT — Glassmorphism Dashboard Card */}
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', perspective:1000 }}>
              <div ref={heroCard} className="hero-float glass-card" style={{
                width:'100%', maxWidth:440, padding:28,
                boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.2)',
              }}>
                {/* Card header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div>
                    <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:13, margin:0 }}>TBOS Operations Center</p>
                    <p style={{ color:GRAY, fontSize:10, margin:'2px 0 0', fontFamily:'Inter,sans-serif' }}>Real-time dashboard</p>
                  </div>
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#10B981', fontFamily:'Inter,sans-serif', fontWeight:600,
                    background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:20, padding:'4px 10px' }}>
                    <span className="dot-live" style={{ width:6, height:6 }} /> LIVE
                  </span>
                </div>

                {/* Mini KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:18 }}>
                  {[
                    { v:'284', l:'Batches', up: true },
                    { v:'99.8%', l:'Quality', up: true },
                    { v:'38', l:'Trucks', up: false },
                  ].map(k => (
                    <div key={k.l} style={{
                      padding:'12px 8px', textAlign:'center',
                      background:'rgba(15,20,25,0.6)', borderRadius:10,
                      border:`1px solid rgba(42,53,69,0.8)`,
                    }}>
                      <p className="font-data text-gold" style={{ fontSize:17, margin:0, fontWeight:600 }}>{k.v}</p>
                      <p style={{ fontSize:10, color:GRAY, margin:'3px 0 0', fontFamily:'Inter,sans-serif' }}>{k.l}</p>
                      <p style={{ fontSize:9, color: k.up ? '#10B981' : '#EF4444', margin:'2px 0 0' }}>{k.up ? '↑ +2.4%' : '→ stable'}</p>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div style={{ height:90, marginBottom:14, borderRadius:8, overflow:'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top:4, right:0, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={GOLD} stopOpacity={0.45}/>
                          <stop offset="95%" stopColor={GOLD} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" dot={false} />
                      <Tooltip
                        contentStyle={{ background:'rgba(22,29,38,0.95)', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:11, backdropFilter:'blur(8px)' }}
                        itemStyle={{ color:GOLD }}
                        labelStyle={{ color:GRAY, fontSize:10 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Status row */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(16,185,129,0.07)', borderRadius:8, border:'1px solid rgba(16,185,129,0.2)' }}>
                  <span className="dot-live" style={{ width:7, height:7 }} />
                  <span style={{ fontSize:12, color:'#10B981', fontFamily:'Inter,sans-serif', fontWeight:500 }}>All systems operational</span>
                  <span style={{ marginLeft:'auto', fontSize:10, color:GRAY }}>Updated just now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:.5 }}>
            <span style={{ fontSize:11, color:GRAY, fontFamily:'Inter,sans-serif', letterSpacing:2, textTransform:'uppercase' }}>Scroll</span>
            <div style={{ width:1, height:40, background:`linear-gradient(180deg, ${GOLD}, transparent)` }} />
          </div>
        </section>

        {/* ── SECTION 3: TRUST MARQUEE ── */}
        <section style={{
          borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`,
          height:52, overflow:'hidden', display:'flex', alignItems:'center', background: NAVY,
        }}>
          <div className="marquee-track">
            {[...trustItems, ...trustItems].map((t, i) => (
              <span key={i} style={{
                display:'inline-flex', alignItems:'center', gap:8, padding:'0 36px',
                fontFamily:'Inter,sans-serif', fontSize:13, color:GRAY, whiteSpace:'nowrap',
              }}>
                <Check size={13} color={GOLD} />
                {t}
                <span style={{ color:GOLD, marginLeft:8, opacity:.4 }}>◆</span>
              </span>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: PLATFORM METRICS ── */}
        <section id="roi" className="section-pad dot-grid section-glow-top">
          <div className="container-max">
            <div ref={r1} className="reveal" style={{ textAlign:'center', marginBottom:64 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:11, color:GOLD, letterSpacing:5, textTransform:'uppercase', marginBottom:14 }}>PLATFORM PERFORMANCE</p>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,52px)', margin:0 }}>Built for Industrial Scale</h2>
              <p style={{ color:GRAY, fontSize:16, marginTop:12, fontFamily:'Inter,sans-serif' }}>Four pillars of enterprise-grade performance</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:24 }}>
              {[
                { counter:c1, icon:'🤖', title:'Autonomous AI Agents',    desc:'Operations, Marketing, Sales, Support, Maintenance, and Quality agents working 24/7 without human intervention', bigFont:80 },
                { counter:c2, icon:'🛡️', title:'Uptime SLA Guarantee',    desc:'Enterprise-grade infrastructure with redundant systems, automatic failover, and real-time monitoring',         bigFont:72 },
                { counter:c3, icon:'🔒', title:'Military-Grade Security', desc:"Bank-level encryption protecting all data in transit and at rest. Your production data stays yours.",          bigFont:52 },
                { counter:c4, icon:'⚡', title:'Global Load Time',        desc:'Optimized for real-time decision making. Every millisecond counts when concrete is curing on site.',          bigFont:72 },
              ].map((m) => (
                <div
                  ref={m.counter.ref as React.RefObject<HTMLDivElement>}
                  key={m.title}
                  className="lp-card metric-card"
                  style={{ padding:40, textAlign:'center', cursor:'default' }}
                >
                  <div style={{
                    fontSize:48, marginBottom:20,
                    filter:'drop-shadow(0 4px 12px rgba(255,215,0,0.3))',
                    display:'inline-block',
                  }}>{m.icon}</div>
                  <p className={`font-display text-gold ${m.counter.done ? 'counter-done' : ''}`}
                     style={{ fontSize:m.bigFont, lineHeight:1, margin:'0 0 10px' }}>
                    {m.counter.display}
                  </p>
                  <p className="font-heading" style={{ fontWeight:700, fontSize:16, margin:'0 0 12px' }}>{m.title}</p>
                  <p style={{ color:GRAY, fontSize:13, lineHeight:1.65, margin:0 }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FEATURES ── */}
        <section id="features" className="section-pad" style={{ background:'#0C1118' }}>
          <div className="container-max">
            <div ref={r2} className="reveal" style={{ textAlign:'center', marginBottom:64 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:11, color:GOLD, letterSpacing:5, textTransform:'uppercase', marginBottom:14 }}>PLATFORM CAPABILITIES</p>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,52px)', margin:'0 0 14px' }}>Everything Your Plant Needs</h2>
              <p style={{ color:GRAY, fontSize:17, fontFamily:'Inter,sans-serif', margin:0 }}>Six integrated modules that replace 12 separate software tools</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="lp-card lp-card-hover"
                  style={{ padding:36, position:'relative', animationDelay:`${i*80}ms` }}
                >
                  {f.badge && (
                    <div style={{
                      position:'absolute', top:16, right:16,
                      background:`linear-gradient(135deg, ${GOLD}, #FFA500)`,
                      color:'#000', padding:'4px 12px', borderRadius:12,
                      fontSize:10, fontFamily:'Poppins,sans-serif', fontWeight:700,
                      boxShadow:`0 4px 12px rgba(255,215,0,0.3)`,
                    }}>{f.badge}</div>
                  )}
                  <div style={{
                    width:60, height:60, borderRadius:'50%',
                    background:'rgba(255,215,0,0.08)',
                    border:'1px solid rgba(255,215,0,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:28, marginBottom:22,
                    transition:'background 250ms ease, transform 250ms ease',
                  }}
                    onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,215,0,0.15)'; e.currentTarget.style.transform='rotate(-8deg) scale(1.1)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,215,0,0.08)'; e.currentTarget.style.transform='rotate(0deg) scale(1)'; }}
                  >{f.icon}</div>
                  <h3 className="font-heading" style={{ fontWeight:700, fontSize:19, margin:'0 0 10px' }}>{f.title}</h3>
                  <p style={{ color:GRAY, fontSize:14, lineHeight:1.72, margin:'0 0 16px' }}>{f.desc}</p>
                  <div style={{ marginBottom:14 }}>{f.pills.map(p => <span key={p} className="pill">{p}</span>)}</div>
                  <button style={{
                    background:'none', border:'none', cursor:'pointer', color:GOLD,
                    fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:13, padding:0,
                    display:'inline-flex', alignItems:'center', gap:4,
                    transition:'gap 200ms ease',
                  }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.gap='8px'; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.gap='4px'; }}
                  >
                    Learn More →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: ROI ── */}
        <section className="section-pad dot-grid section-glow-top">
          <div className="container-max">
            <div ref={r3} className="reveal" style={{ textAlign:'center', marginBottom:64 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:11, color:GOLD, letterSpacing:5, textTransform:'uppercase', marginBottom:14 }}>PROVEN RESULTS</p>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,80px)', margin:0 }}>Real Numbers. Real Plants.</h2>
            </div>
            <div className="roi-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start' }}>
              {/* Case Study */}
              <div className="lp-card" style={{ padding:44, borderLeft:`4px solid ${GOLD}`, boxShadow:`-4px 0 24px rgba(255,215,0,0.08)` }}>
                <div style={{
                  display:'inline-block', background:'rgba(255,215,0,0.1)',
                  border:`1px solid rgba(255,215,0,0.3)`,
                  borderRadius:6, padding:'4px 12px', fontSize:10, color:GOLD,
                  fontFamily:'Poppins,sans-serif', fontWeight:700, letterSpacing:2,
                  textTransform:'uppercase', marginBottom:16,
                }}>CASE STUDY</div>
                <h3 className="font-heading" style={{ fontWeight:700, fontSize:24, margin:'0 0 6px' }}>Talmi Beton — Morocco 🇲🇦</h3>
                <p style={{ color:GRAY, fontSize:13, marginBottom:24 }}>Ready-Mix Concrete Production</p>
                <p style={{ color:GRAY, fontSize:14, marginBottom:10, lineHeight:1.6 }}>
                  <strong style={{ color:'#fff' }}>Challenge:</strong> 67% defect rate, 4-6 monthly equipment failures, fragmented operations across 4 plants
                </p>
                <p style={{ color:GRAY, fontSize:14, marginBottom:28, lineHeight:1.6 }}>
                  <strong style={{ color:'#fff' }}>Solution:</strong> Deployed TBOS with Predictive Quality AI, Maintenance Agent, and Supply Chain Optimizer
                </p>
                {/* Results grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:28 }}>
                  {[
                    ['67%','Defect Reduction'],['42%','Downtime Reduction'],['38%','Supply Chain Eff.'],
                    ['24%','Production Increase'],['$840K','Annual Savings'],['847%','ROI Return'],
                  ].map(([n,l]) => (
                    <div key={l} style={{ textAlign:'center' }}>
                      <p className="font-data text-gold" style={{ fontSize:26, margin:0, fontWeight:600 }}>{n}</p>
                      <p style={{ fontSize:10, color:GRAY, margin:'5px 0 0', lineHeight:1.3 }}>{l}</p>
                    </div>
                  ))}
                </div>
                <div style={{
                  background:`linear-gradient(135deg, ${GOLD}, #FFA500)`,
                  color:'#000', padding:'10px 18px', borderRadius:8,
                  display:'inline-flex', alignItems:'center', gap:6,
                  fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:13, marginBottom:24,
                  boxShadow:`0 4px 20px rgba(255,215,0,0.35)`,
                }}>⚡ 1.4 Month Payback Period</div>
                <blockquote style={{ borderLeft:`2px solid rgba(255,215,0,0.4)`, paddingLeft:18, margin:0 }}>
                  <p style={{ color:GRAY, fontSize:14, fontStyle:'italic', lineHeight:1.75, margin:'0 0 10px' }}>
                    "TBOS transformed how we operate. We went from reactive management to predictive optimization. It's a game-changer for the concrete industry."
                  </p>
                  <cite style={{ color:GOLD, fontSize:13, fontFamily:'Poppins,sans-serif', fontWeight:600 }}>— Mohamed Talmi, CEO, Talmi Beton 🇲🇦</cite>
                </blockquote>
              </div>

              {/* Aggregate */}
              <div>
                <p className="font-heading" style={{ fontWeight:700, fontSize:24, marginBottom:28 }}>Across All Customers</p>
                {[
                  { n:'$2.4M', l:'Total Annual Savings Generated' },
                  { n:'847%',  l:'Average Customer ROI' },
                  { n:'1.4mo', l:'Average Payback Period' },
                ].map(({ n, l }) => (
                  <div key={l} className="lp-card lp-card-hover" style={{ padding:28, marginBottom:18, textAlign:'center' }}>
                    <p className="font-display text-gold" style={{ fontSize:80, lineHeight:1, margin:'0 0 6px' }}>{n}</p>
                    <p style={{ color:GRAY, fontSize:14, margin:0 }}>{l}</p>
                  </div>
                ))}
                <div style={{ textAlign:'center', marginBottom:24, padding:'16px 0' }}>
                  <div style={{ display:'flex', justifyContent:'center', gap:2, marginBottom:6 }}>
                    {Array.from({length:5}).map((_,i)=>(
                      <Star key={i} size={18} color={GOLD} fill={GOLD} />
                    ))}
                  </div>
                  <span style={{ color:GRAY, fontSize:14 }}>4.9/5.0 Customer Satisfaction</span>
                </div>
                <button className="btn-gold" style={{ width:'100%', height:54, fontSize:15 }} onClick={()=>navigate('/success-stories')}>
                  See Full Case Study →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: AI AGENTS ── */}
        <section className="section-pad" style={{ background:'#0C1118', overflow:'hidden' }}>
          <div className="container-max">
            <div ref={r4} className="reveal" style={{ textAlign:'center', marginBottom:80 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:11, color:GOLD, letterSpacing:5, textTransform:'uppercase', marginBottom:14 }}>AUTONOMOUS OPERATIONS</p>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,80px)', margin:'0 0 14px' }}>Your Plant Runs Itself</h2>
              <p style={{ color:GRAY, fontSize:17, fontFamily:'Inter,sans-serif' }}>6 AI agents work 24/7 so your team focuses on what matters</p>
            </div>

            {/* Orbit diagram */}
            <div className="orbit-container" style={{ position:'relative', width:480, height:480, margin:'0 auto 60px' }}>
              {/* Background glow */}
              <div style={{
                position:'absolute', inset:0, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)',
                filter:'blur(30px)',
              }} />
              {/* Orbit ring */}
              <div className="orbit-ring" style={{
                position:'absolute', inset:30, borderRadius:'50%',
                border:`1px dashed rgba(255,215,0,0.25)`,
              }} />
              {/* Outer orbit ring */}
              <div style={{
                position:'absolute', inset:10, borderRadius:'50%',
                border:`1px solid rgba(255,215,0,0.06)`,
              }} />
              {/* Center hub */}
              <div className="pulse-glow" style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:110, height:110, borderRadius:'50%',
                background:`linear-gradient(135deg, ${GOLD} 0%, #FFC200 50%, #FFA500 100%)`,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                zIndex:10,
              }}>
                <span className="font-display" style={{ fontSize:30, color:'#000', lineHeight:1 }}>TBOS</span>
                <span style={{ fontSize:9, color:'rgba(0,0,0,0.6)', fontFamily:'Poppins,sans-serif', fontWeight:700, letterSpacing:1, marginTop:2 }}>BRAIN</span>
              </div>

              {/* Agent nodes */}
              {agents.map((a) => {
                const angle = (a.angle - 90) * (Math.PI / 180);
                const r = 185;
                const x = 240 + r * Math.cos(angle) - 52;
                const y = 240 + r * Math.sin(angle) - 52;
                return (
                  <div key={a.label} className="agent-node lp-card" style={{
                    position:'absolute', left:x, top:y, width:104, height:104,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    padding:8, textAlign:'center',
                  }}>
                    <div style={{ fontSize:26, marginBottom:5, filter:'drop-shadow(0 2px 6px rgba(255,215,0,0.25))' }}>{a.icon}</div>
                    <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:10, margin:0, color:'#fff' }}>{a.label}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:4 }}>
                      <span className="dot-live" style={{ width:5, height:5 }} />
                      <span style={{ fontSize:8, color:'#10B981', fontFamily:'Inter,sans-serif', fontWeight:500 }}>ACTIVE</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="font-display" style={{ fontSize:'clamp(32px,5vw,56px)', textAlign:'center', color:GRAY, letterSpacing:1 }}>
              While you sleep, <span className="text-gold">TBOS works.</span>
            </p>
          </div>
        </section>

        {/* ── SECTION 8: LEAD SCORE CTA ── */}
        <section style={{
          background:`linear-gradient(135deg, #161D26 0%, ${NAVY} 100%)`,
          borderTop:`2px solid rgba(255,215,0,0.4)`,
          borderBottom:`2px solid rgba(255,215,0,0.4)`,
        }} className="section-pad">
          <div className="container-max" style={{ textAlign:'center' }}>
            <div ref={r5} className="reveal">
              <div style={{ fontSize:72, marginBottom:24, filter:'drop-shadow(0 8px 24px rgba(255,215,0,0.3))', display:'inline-block' }}>🎯</div>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,80px)', margin:'0 0 18px' }}>Discover Your TBOS Score</h2>
              <p style={{ color:GRAY, fontSize:17, fontFamily:'Inter,sans-serif', maxWidth:580, margin:'0 auto 36px', lineHeight:1.75 }}>
                Answer 5 quick questions about your operation and get an instant AI-powered score. See exactly how much TBOS can save your company — in dollars, per year.
              </p>
              <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap', marginBottom:40 }}>
                {['⏱️ Takes 2 Minutes','🔒 No Email Required','💰 See Your Savings'].map(p => (
                  <span key={p} style={{
                    background:'rgba(255,215,0,0.07)', border:`1px solid rgba(255,215,0,0.25)`,
                    borderRadius:24, padding:'10px 22px',
                    fontFamily:'Inter,sans-serif', fontSize:14, color:GOLD, fontWeight:500,
                  }}>{p}</span>
                ))}
              </div>
              <button className="btn-gold" style={{ height:72, width:'min(380px,100%)', fontSize:19, letterSpacing:.5 }} onClick={()=>navigate('/lead-scoring')}>
                Calculate Your Score →
              </button>
              <p style={{ color:GRAY, fontSize:13, marginTop:18, fontFamily:'Inter,sans-serif' }}>
                Join 50+ concrete producers who've already calculated their score
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 9: TESTIMONIALS ── */}
        <section id="case-studies" className="section-pad dot-grid">
          <div className="container-max">
            <div ref={r6} className="reveal" style={{ textAlign:'center', marginBottom:64 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:11, color:GOLD, letterSpacing:5, textTransform:'uppercase', marginBottom:14 }}>CUSTOMER STORIES</p>
              <h2 className="font-display" style={{ fontSize:'clamp(48px,7vw,80px)', margin:0 }}>Concrete Proof</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
              {testimonials.map(t => (
                <div key={t.company} className="lp-card lp-card-hover" style={{ padding:36 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
                    <div>
                      <span style={{ fontSize:28, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>{t.flag}</span>
                      <p className="font-heading" style={{ fontWeight:700, fontSize:17, margin:'8px 0 3px' }}>{t.company}</p>
                      <p style={{ color:GRAY, fontSize:12, margin:0 }}>{t.role}</p>
                    </div>
                    <div style={{ display:'flex', gap:1 }}>
                      {Array.from({length:5}).map((_,i)=>(
                        <Star key={i} size={14} color={GOLD} fill={GOLD} />
                      ))}
                    </div>
                  </div>
                  <blockquote style={{ margin:'0 0 18px', padding:0 }}>
                    <p style={{ color:'#e0e0e0', fontSize:14, lineHeight:1.75, fontStyle:'italic', margin:'0 0 10px' }}>"{t.quote}"</p>
                    <cite style={{ color:GOLD, fontSize:12, fontFamily:'Poppins,sans-serif', fontWeight:600 }}>— {t.author}</cite>
                  </blockquote>
                  <p style={{
                    color:GOLD, fontSize:12, fontFamily:'JetBrains Mono,monospace',
                    background:'rgba(255,215,0,0.06)', borderRadius:8, padding:'10px 14px',
                    margin:'0 0 14px', border:'1px solid rgba(255,215,0,0.12)',
                  }}>{t.results}</p>
                  <button
                    onClick={()=>navigate('/success-stories')}
                    style={{ background:'none', border:'none', cursor:'pointer', color:GOLD, fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:13, padding:0 }}
                  >Read Full Case Study →</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 10: PRICING ── */}
        <section id="pricing" className="section-pad" style={{ background:'#0C1118' }}>
          <div className="container-max">
            <div ref={r7} className="reveal" style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:11, color:GOLD, letterSpacing:5, textTransform:'uppercase', marginBottom:14 }}>TRANSPARENT PRICING</p>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,52px)', margin:'0 0 36px' }}>Built for Every Stage of Growth</h2>
              {/* Toggle */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:14, background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:'10px 24px' }}>
                <span style={{ fontFamily:'Poppins,sans-serif', fontSize:14, fontWeight:500, color: !annual ? GOLD : GRAY }}>Monthly</span>
                <div className={`toggle-track ${annual ? 'on' : ''}`} onClick={()=>setAnnual(!annual)}>
                  <div className="toggle-thumb" />
                </div>
                <span style={{ fontFamily:'Poppins,sans-serif', fontSize:14, fontWeight:500, color: annual ? GOLD : GRAY }}>Annual</span>
                {annual && (
                  <span style={{
                    background:`linear-gradient(135deg, ${GOLD}, #FFA500)`,
                    color:'#000', borderRadius:12, padding:'3px 12px', fontSize:11, fontWeight:700,
                  }}>2 months FREE</span>
                )}
              </div>
            </div>
            <PricingPlan annual={annual} />
            <p style={{ textAlign:'center', color:GRAY, fontSize:13, marginTop:36, fontFamily:'Inter,sans-serif' }}>
              🔒 30-day money-back guarantee · No setup fees · Cancel anytime
            </p>
          </div>
        </section>

        {/* ── SECTION 11: FAQ ── */}
        <section className="section-pad dot-grid section-glow-bottom">
          <div className="container-max" style={{ maxWidth:820, margin:'0 auto' }}>
            <div ref={r8} className="reveal" style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:11, color:GOLD, letterSpacing:5, textTransform:'uppercase', marginBottom:14 }}>FAQ</p>
              <h2 className="font-heading" style={{ fontWeight:700, fontSize:'clamp(32px,5vw,52px)' }}>Common Questions</h2>
            </div>
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:'8px 36px' }}>
              {faqs.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i===0} />)}
            </div>
          </div>
        </section>

        {/* ── SECTION 12: FINAL CTA ── */}
        <section style={{
          background:`linear-gradient(135deg, #1C2533 0%, ${NAVY} 100%)`,
          borderTop:`2px solid rgba(255,215,0,0.25)`,
          position:'relative', overflow:'hidden',
        }} className="section-pad">
          {/* Decorative glow */}
          <div style={{
            position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width:600, height:600, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 70%)',
            pointerEvents:'none',
          }} />
          <div className="container-max" style={{ textAlign:'center', position:'relative', zIndex:1 }}>
            <h2 className="font-display" style={{ fontSize:'clamp(48px,8vw,86px)', margin:'0 0 18px', lineHeight:.95 }}>
              Ready to Run Your Plant{' '}
              <span className="headline-gradient">on Autopilot?</span>
            </h2>
            <p style={{ color:GRAY, fontSize:18, fontFamily:'Inter,sans-serif', maxWidth:560, margin:'0 auto 48px', lineHeight:1.7 }}>
              Join concrete producers across MENA who've automated their operations with TBOS.
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap', marginBottom:28 }}>
              <button className="btn-gold" style={{ height:64, padding:'0 44px', fontSize:16 }} onClick={()=>navigate('/auth')}>
                Start Free Trial →
              </button>
              <button className="btn-ghost" style={{ height:64, padding:'0 40px', fontSize:15 }} onClick={()=>navigate('/auth')}>
                Schedule Demo
              </button>
            </div>
            <p style={{ color:GRAY, fontSize:13, fontFamily:'Inter,sans-serif' }}>No credit card required · Setup in 5 minutes · Cancel anytime</p>
          </div>
        </section>

        {/* ── SECTION 13: FOOTER ── */}
        <footer style={{ background:'#0A0F14', borderTop:`2px solid ${BORDER}`, padding:'72px 0 32px' }}>
          <div className="container-max">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:48, marginBottom:56 }}>
              {/* Brand */}
              <div style={{ maxWidth:280 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
                  <span className="font-display text-gold" style={{ fontSize:34 }}>TBOS</span>
                  <span style={{ color:GRAY, fontSize:12 }}>by Talmi Beton</span>
                </div>
                <p style={{ color:GRAY, fontSize:13, lineHeight:1.65, marginBottom:24 }}>The Operating System for Concrete Titans</p>
                {/* Newsletter */}
                <p style={{ fontSize:12, color:GRAY, marginBottom:10, fontFamily:'Poppins,sans-serif', fontWeight:600, letterSpacing:.5 }}>STAY UPDATED</p>
                <div style={{ display:'flex', gap:8 }}>
                  <input className="nl-input" type="email" placeholder="your@email.com" style={{ flex:1, fontSize:13 }} />
                  <button className="btn-gold" style={{ height:42, padding:'0 16px', fontSize:13 }}>Subscribe</button>
                </div>
              </div>

              {/* Link columns */}
              {[
                { title:'Product',   links:['Features','Pricing','Security','Roadmap','API Docs'] },
                { title:'Company',   links:['About','Blog','Careers','Press','Partners'] },
                { title:'Resources', links:['Documentation','Video Tutorials','Community','Support','Status Page'] },
                { title:'Legal',     links:['Privacy Policy','Terms of Service','Security Policy','Cookie Policy'] },
              ].map(col => (
                <div key={col.title}>
                  <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:13, marginBottom:18, color:'#fff', letterSpacing:.5 }}>{col.title}</p>
                  {col.links.map(l => (
                    <a key={l} href="#" className="footer-link">{l}</a>
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom */}
            <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:28, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
              <p style={{ color:GRAY, fontSize:12, margin:0 }}>© 2025 TBOS by Talmi Beton. All rights reserved.</p>
              <div style={{ display:'flex', gap:10, fontSize:22 }}>🇲🇦 🇸🇦 🇦🇪 🇪🇬</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {(['EN','FR','AR'] as const).map(c => (
                  <button key={c} onClick={()=>switchLang(c)} style={{
                    background: langDisplay===c ? GOLD : 'transparent',
                    color: langDisplay===c ? '#000' : GRAY,
                    border: `1px solid ${langDisplay===c ? GOLD : BORDER}`,
                    borderRadius:6, padding:'5px 12px', fontSize:12,
                    cursor:'pointer', fontFamily:'Poppins,sans-serif', fontWeight:700,
                    transition:'all 0.2s ease',
                  }}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
