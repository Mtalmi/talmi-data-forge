import { useState, useEffect, useRef } from 'react';
import {
  FileText, Package, Calendar, Zap, Settings, TrendingUp, Banknote,
  Truck, Shield, Eye, Clock, Heart, Search, Printer, ChevronDown,
  ChevronRight, Phone, MessageSquare, AlertCircle, CheckCircle,
  Play, Star, Download, Trash2, BookOpen,
} from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BG     = '#0B1120';
const CARD   = 'rgba(17,27,46,0.92)';
const BORDER = 'rgba(255,215,0,0.10)';
const FIELD  = '#0F172A';
const GOLD   = '#FFD700';
const GOLD_D = 'rgba(255,215,0,0.10)';
const GREEN  = '#10B981';
const GREEN_D= 'rgba(16,185,129,0.12)';
const BLUE   = '#3B82F6';
const BLUE_D = 'rgba(59,130,246,0.12)';
const YELLOW = '#F59E0B';
const YELLOW_D='rgba(245,158,11,0.12)';
const CYAN   = '#06B6D4';
const CYAN_D = 'rgba(6,182,212,0.12)';
const PURPLE = '#8B5CF6';
const PURPLE_D='rgba(139,92,246,0.12)';
const RED    = '#EF4444';
const RED_D  = 'rgba(239,68,68,0.12)';
const ORANGE = '#F97316';
const ORANGE_D='rgba(249,115,22,0.12)';
const TEXT1  = '#F1F5F9';
const TEXT2  = '#94A3B8';
const TEXT3  = '#64748B';
const MONO   = "'JetBrains Mono', monospace";
const SANS   = "'DM Sans', sans-serif";

// ─── useFadeIn ────────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return v;
}

// ─── useCountUp ───────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const start = Date.now();
    const step = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(e * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ─── AnimatedBar ─────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 9999, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'demarrage',      name: 'Démarrage',       count: 5,  desc: 'Installation, configuration initiale, premier pas',              icon: Zap,         color: GOLD,   colorD: GOLD_D,   pct: 80  },
  { id: 'production',     name: 'Production',      count: 8,  desc: 'Batches, formules, planning, qualité',                           icon: Settings,    color: BLUE,   colorD: BLUE_D,   pct: 60  },
  { id: 'commercial',     name: 'Commercial',      count: 7,  desc: 'Devis, bons de commande, pipeline ventes',                       icon: TrendingUp,  color: GREEN,  colorD: GREEN_D,  pct: 45  },
  { id: 'finance',        name: 'Finance',         count: 6,  desc: 'Paiements, dépenses, contrats, rapprochement',                   icon: Banknote,    color: PURPLE, colorD: PURPLE_D, pct: 30  },
  { id: 'logistique',     name: 'Logistique',      count: 5,  desc: 'Livraisons, flotte, itinéraires',                                icon: Truck,       color: YELLOW, colorD: YELLOW_D, pct: 50  },
  { id: 'stocks',         name: 'Stocks',          count: 4,  desc: 'Inventaire, mouvements, alertes, fournisseurs',                  icon: Package,     color: CYAN,   colorD: CYAN_D,   pct: 40  },
  { id: 'administration', name: 'Administration',  count: 4,  desc: 'Utilisateurs, rôles, permissions, paramètres',                   icon: Shield,      color: RED,    colorD: RED_D,    pct: 70  },
  { id: 'securite',       name: 'Sécurité HSE',   count: 3,  desc: 'Incidents, EPI, formations, procédures',                         icon: Shield,      color: ORANGE, colorD: ORANGE_D, pct: 90  },
];

const ARTICLES = [
  { rank: 1, title: 'Comment créer un devis de A à Z',             category: 'Commercial',    catColor: GREEN,  views: 234, time: '5 min', updated: '10 Fév' },
  { rank: 2, title: 'Lancer et suivre un batch de production',      category: 'Production',    catColor: BLUE,   views: 198, time: '4 min', updated: '12 Fév' },
  { rank: 3, title: 'Comprendre le tableau de bord',               category: 'Démarrage',     catColor: GOLD,   views: 187, time: '3 min', updated: '15 Fév' },
  { rank: 4, title: 'Gérer les paiements et encaissements',        category: 'Finance',       catColor: PURPLE, views: 156, time: '6 min', updated: '08 Fév' },
  { rank: 5, title: 'Suivre une livraison en temps réel',          category: 'Logistique',    catColor: YELLOW, views: 142, time: '3 min', updated: '05 Fév' },
  { rank: 6, title: 'Configurer les alertes de stock',             category: 'Stocks',        catColor: CYAN,   views: 128, time: '4 min', updated: '01 Fév' },
  { rank: 7, title: 'Gérer les rôles et permissions',              category: 'Administration',catColor: RED,    views: 115, time: '5 min', updated: '28 Jan' },
  { rank: 8, title: 'Déclarer un incident de sécurité',            category: 'Sécurité HSE', catColor: ORANGE, views: 98,  time: '3 min', updated: '20 Jan' },
];

const TIMELINE = [
  { date: '15 Fév', article: 'Comprendre le tableau de bord',   category: 'Démarrage',     catColor: GOLD,   change: 'Ajout section Cash-Flow',          author: 'Admin'    },
  { date: '12 Fév', article: 'Lancer et suivre un batch',       category: 'Production',    catColor: BLUE,   change: "Mise à jour captures d'écran",     author: 'Admin'    },
  { date: '10 Fév', article: 'Créer un devis de A à Z',         category: 'Commercial',    catColor: GREEN,  change: 'Ajout étapes validation',           author: 'Karim B.' },
  { date: '08 Fév', article: 'Gérer les paiements',             category: 'Finance',       catColor: PURPLE, change: 'Nouvelles méthodes paiement',       author: 'Nadia F.' },
  { date: '05 Fév', article: 'Suivre une livraison',            category: 'Logistique',    catColor: YELLOW, change: 'Ajout suivi GPS',                   author: 'Admin'    },
];

const VIDEOS = [
  { title: 'Prise en main TBOS',        duration: '12 min', category: 'Démarrage',  catColor: GOLD  },
  { title: 'Gestion de production',     duration: '18 min', category: 'Production', catColor: BLUE  },
  { title: 'Suivi commercial',          duration: '15 min', category: 'Commercial', catColor: GREEN },
];

const FAQ = [
  { q: 'Comment réinitialiser mon mot de passe?',     a: 'Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié". Un email de réinitialisation vous sera envoyé sur votre adresse professionnelle.'    },
  { q: 'Comment exporter mes données?',               a: 'Dans la page Paramètres > Système > Gestion des données, cliquez sur "Exporter les données" pour télécharger un fichier CSV/Excel complet.'   },
  { q: 'Comment ajouter un nouvel utilisateur?',      a: 'Seul le CEO et le Superviseur peuvent ajouter des utilisateurs. Rendez-vous dans la page Utilisateurs et cliquez sur "Nouvel Utilisateur".'   },
  { q: 'Comment contacter le support technique?',     a: 'Envoyez un email à support@tbos.ma ou appelez le +212 5 22 XX XX XX du lundi au vendredi de 08h à 18h et le samedi de 09h à 13h.'   },
];

const BAR_COLOR = (pct: number) => pct >= 70 ? GREEN : pct >= 40 ? YELLOW : RED;

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Crd({ children, style, visible = true }: { children: React.ReactNode; style?: React.CSSProperties; visible?: boolean }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.25s ease, border-color 0.25s ease',
      ...style,
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(255,215,0,0.08), 0 0 0 1px rgba(255,215,0,0.12)`;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = style?.transform ?? 'translateY(0)';
      }}
    >
      {children}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SHead({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 4, height: 28, borderRadius: 99, background: `linear-gradient(180deg,${GOLD},rgba(255,215,0,0.2))` }} />
      <div style={{ padding: '6px 10px', borderRadius: 8, background: GOLD_D, border: `1px solid rgba(255,215,0,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={GOLD} />
      </div>
      <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: TEXT1 }}>{label}</span>
      {sub && <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT3, marginLeft: 4 }}>{sub}</span>}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function WorldClassManual() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const v0 = useFadeIn(0);
  const v1 = useFadeIn(80);
  const v2 = useFadeIn(160);
  const v3 = useFadeIn(240);
  const v4 = useFadeIn(320);
  const v5 = useFadeIn(400);
  const v6 = useFadeIn(480);
  const v7 = useFadeIn(560);

  const stat1 = useCountUp(42);
  const stat2 = useCountUp(8);

  return (
    <div style={{ fontFamily: SANS, color: TEXT1, minHeight: '100vh' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(11,17,32,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`, padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        opacity: v0 ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: GOLD_D, border: `1px solid rgba(255,215,0,0.2)` }}>
              <BookOpen size={20} color={GOLD} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT1, margin: 0 }}>Manuel Système</h1>
              <p style={{ fontSize: 12, color: TEXT3, margin: 0 }}>Documentation et guide d'utilisation TBOS</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color={TEXT3} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans la documentation..."
              style={{
                background: FIELD, border: `1px solid #1E293B`, borderRadius: 10, padding: '8px 12px 8px 32px',
                color: TEXT1, fontSize: 13, fontFamily: SANS, outline: 'none', width: 260,
              }}
              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(255,215,0,0.12)`; }}
              onBlur={e => { e.target.style.borderColor = '#1E293B'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {/* Print button */}
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'transparent', border: `1px solid rgba(255,215,0,0.35)`, borderRadius: 10,
              color: GOLD, fontSize: 13, fontWeight: 600, fontFamily: SANS, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GOLD_D; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <FileText size={14} />
            Imprimer
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── SECTION 1: QUICK STATS ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          opacity: v1 ? 1 : 0, transform: v1 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          {[
            { label: 'Articles', value: stat1, color: GOLD, colorD: GOLD_D, icon: FileText },
            { label: 'Catégories', value: stat2, color: BLUE, colorD: BLUE_D, icon: Package },
            { label: 'Dernière MAJ', value: '15 Fév', color: GREEN, colorD: GREEN_D, icon: Calendar, isStr: true },
          ].map((s, i) => (
            <Crd key={i} visible={v1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.colorD, border: `1px solid ${s.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {s.isStr ? s.value : s.value}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                </div>
              </div>
            </Crd>
          ))}
        </div>

        {/* ── SECTION 2: GETTING STARTED HERO ─────────────────────────────── */}
        <div style={{
          opacity: v2 ? 1 : 0, transform: v2 ? 'none' : 'translateY(16px)', transition: 'all 0.5s 0.08s ease',
          background: `linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(17,27,46,0.9) 100%)`,
          border: `1px solid rgba(255,215,0,0.25)`, borderLeft: `4px solid ${GOLD}`,
          borderRadius: 16, padding: 28,
          boxShadow: '0 0 0 1px rgba(255,215,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flex: 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: GOLD_D, border: `1px solid rgba(255,215,0,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={24} color={GOLD} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: TEXT1 }}>Démarrage Rapide</div>
                <div style={{ fontSize: 14, color: TEXT2, marginTop: 4 }}>Nouveau sur TBOS? Commencez ici pour maîtriser l'essentiel en 15 minutes.</div>
              </div>
            </div>
            <button style={{
              padding: '10px 20px', background: GOLD, color: BG, borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: 13, fontFamily: SANS, cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFE44D'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = GOLD; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
            >Commencer le Guide</button>
          </div>

          {/* 4 steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 24, overflowX: 'auto' }}>
            {[
              { n: 1, text: 'Créer votre premier devis',     icon: FileText, time: '2 min' },
              { n: 2, text: 'Lancer un batch de production', icon: Settings, time: '3 min' },
              { n: 3, text: 'Suivre une livraison',          icon: Truck,    time: '2 min' },
              { n: 4, text: 'Générer un rapport',            icon: TrendingUp,time: '2 min'},
            ].map((step, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 8px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD, color: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{step.n}</div>
                    <step.icon size={15} color={GOLD} style={{ flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT1, textAlign: 'center', lineHeight: 1.3 }}>{step.text}</div>
                  <div style={{ padding: '2px 8px', background: BLUE_D, border: `1px solid ${BLUE}33`, borderRadius: 99, fontSize: 11, color: BLUE, fontWeight: 600 }}>{step.time}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ height: 1, flex: '0 0 20px', borderTop: `1px dashed rgba(255,215,0,0.3)` }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 3: DOCUMENTATION CATEGORIES ─────────────────────────── */}
        <div style={{ opacity: v3 ? 1 : 0, transform: v3 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead icon={Package} label="Catégories" sub="— 8 sections" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {CATEGORIES.map((cat, i) => {
              const CatIcon = cat.icon;
              const barColor = BAR_COLOR(cat.pct);
              return (
                <div key={cat.id} style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20,
                  cursor: 'pointer',
                  opacity: v3 ? 1 : 0, transform: v3 ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ${i * 80}ms ease, transform 0.5s ${i * 80}ms ease, box-shadow 0.25s ease, border-color 0.25s ease`,
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px rgba(255,215,0,0.08)`;
                    (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(255,215,0,0.25)`;
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: cat.colorD, border: `1px solid ${cat.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CatIcon size={22} color={cat.color} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: GOLD }}>{cat.count}</span>
                      <span style={{ fontSize: 11, color: TEXT3, marginLeft: 4 }}>articles</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1, marginBottom: 6 }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.desc}</div>
                  <AnimatedBar pct={cat.pct} color={barColor} />
                  <div style={{ fontSize: 10, color: TEXT3, marginTop: 4 }}>{cat.pct}% lu</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 4: POPULAR ARTICLES ──────────────────────────────────── */}
        <div style={{ opacity: v4 ? 1 : 0, transform: v4 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead icon={Heart} label="Articles Populaires" sub="— les plus consultés" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ARTICLES.map((a, i) => {
              const isTop3 = a.rank <= 3;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderRadius: 12, background: isTop3 ? 'rgba(255,215,0,0.04)' : CARD,
                  border: `1px solid ${isTop3 ? 'rgba(255,215,0,0.14)' : BORDER}`,
                  cursor: 'pointer',
                  opacity: v4 ? 1 : 0, transform: v4 ? 'translateX(0)' : 'translateX(-10px)',
                  transition: `opacity 0.5s ${i * 50}ms ease, transform 0.5s ${i * 50}ms ease, background 0.2s ease`,
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = isTop3 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = isTop3 ? 'rgba(255,215,0,0.04)' : CARD;
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                  }}
                >
                  {/* Rank */}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: isTop3 ? GOLD : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isTop3 ? BG : TEXT3, fontFamily: MONO }}>{a.rank}</span>
                  </div>
                  {/* Title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                  </div>
                  {/* Category */}
                  <div style={{ padding: '3px 10px', borderRadius: 99, background: `${a.catColor}18`, border: `1px solid ${a.catColor}33`, fontSize: 11, fontWeight: 600, color: a.catColor, flexShrink: 0, display: 'none' }} className="cat-badge">{a.category}</div>
                  <span style={{ padding: '3px 10px', borderRadius: 99, background: `${a.catColor}18`, border: `1px solid ${a.catColor}33`, fontSize: 11, fontWeight: 600, color: a.catColor, flexShrink: 0 }}>{a.category}</span>
                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: MONO, color: TEXT3 }}>
                      <Eye size={12} />{a.views} vues
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TEXT3 }}>
                      <Clock size={12} />{a.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TEXT3 }}>
                      <Calendar size={12} />{a.updated}
                    </span>
                  </div>
                  <ChevronRight size={16} color={TEXT3} style={{ transition: 'transform 0.2s' }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 5: RECENTLY UPDATED (TIMELINE) ───────────────────────── */}
        <div style={{ opacity: v5 ? 1 : 0, transform: v5 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead icon={Clock} label="Récemment Mis à Jour" />
          <Crd visible={v5}>
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {/* Vertical gold line */}
              <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg,${GOLD},rgba(255,215,0,0.1))`, borderRadius: 99 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TIMELINE.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 12px',
                    borderRadius: 10, cursor: 'pointer',
                    position: 'relative',
                    opacity: v5 ? 1 : 0, transform: v5 ? 'none' : 'translateX(-10px)',
                    transition: `opacity 0.5s ${i * 80}ms ease, transform 0.5s ${i * 80}ms ease, background 0.2s ease`,
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      (e.currentTarget as HTMLDivElement).style.transform = 'none';
                    }}
                  >
                    {/* Dot */}
                    <div style={{ position: 'absolute', left: -28, width: 10, height: 10, borderRadius: '50%', background: BLUE, border: `2px solid rgba(59,130,246,0.4)`, boxShadow: `0 0 8px ${BLUE}66` }} />
                    {/* Date */}
                    <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT3, flexShrink: 0, width: 50 }}>{item.date}</span>
                    {/* Article */}
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.article}</span>
                    {/* Category */}
                    <span style={{ padding: '2px 8px', borderRadius: 99, background: `${item.catColor}18`, border: `1px solid ${item.catColor}33`, fontSize: 10, fontWeight: 600, color: item.catColor, flexShrink: 0 }}>{item.category}</span>
                    {/* Change */}
                    <span style={{ fontSize: 12, color: TEXT2, flexShrink: 0, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.change}</span>
                    {/* Author */}
                    <span style={{ fontSize: 11, color: TEXT3, flexShrink: 0 }}>{item.author}</span>
                  </div>
                ))}
              </div>
            </div>
          </Crd>
        </div>

        {/* ── SECTION 6: VIDEO TUTORIALS ───────────────────────────────────── */}
        <div style={{ opacity: v6 ? 1 : 0, transform: v6 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 28, borderRadius: 99, background: `linear-gradient(180deg,${GOLD},rgba(255,215,0,0.2))` }} />
            <div style={{ padding: '6px 10px', borderRadius: 8, background: GOLD_D, border: `1px solid rgba(255,215,0,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={16} color={GOLD} />
            </div>
            <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: TEXT1 }}>Tutoriels Vidéo</span>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: GOLD_D, border: `1px solid rgba(255,215,0,0.25)`, fontSize: 11, fontWeight: 700, color: GOLD }}>à venir</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {VIDEOS.map((vid, i) => (
              <div key={i} style={{
                background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20,
                opacity: v6 ? 1 : 0, transform: v6 ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ${i * 100}ms ease, transform 0.5s ${i * 100}ms ease, box-shadow 0.25s ease`,
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(255,215,0,0.08)`;
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  const playIcon = (e.currentTarget as HTMLDivElement).querySelector('.play-icon') as HTMLElement;
                  if (playIcon) playIcon.style.transform = 'scale(1.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  const playIcon = (e.currentTarget as HTMLDivElement).querySelector('.play-icon') as HTMLElement;
                  if (playIcon) playIcon.style.transform = 'scale(1)';
                }}
              >
                {/* Video placeholder */}
                <div style={{
                  height: 140, borderRadius: 10, border: `2px dashed rgba(255,215,0,0.3)`,
                  background: 'rgba(255,215,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <div className="play-icon" style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,215,0,0.15)', border: `2px solid rgba(255,215,0,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.25s ease' }}>
                    <Play size={22} color={GOLD} />
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, marginBottom: 8 }}>{vid.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: MONO, color: TEXT3 }}><Clock size={12} />{vid.duration}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 99, background: `${vid.catColor}18`, border: `1px solid ${vid.catColor}33`, fontSize: 10, fontWeight: 600, color: vid.catColor }}>{vid.category}</span>
                </div>
                <div style={{ marginTop: 10, padding: '4px 10px', borderRadius: 99, border: `1px solid rgba(255,215,0,0.3)`, display: 'inline-block', fontSize: 11, fontWeight: 600, color: GOLD }}>Bientôt Disponible</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 7: HELP & SUPPORT ─────────────────────────────────────── */}
        <div style={{ opacity: v7 ? 1 : 0, transform: v7 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead icon={Phone} label="Aide & Support" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Left: Contact */}
            <Crd visible={v7}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: GOLD_D, border: `1px solid rgba(255,215,0,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={22} color={GOLD} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT1 }}>Besoin d'Aide?</div>
                  <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>Notre équipe est disponible pour vous accompagner</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <a href="mailto:support@tbos.ma" style={{ fontFamily: MONO, fontSize: 14, color: GOLD, textDecoration: 'none', fontWeight: 600 }}>support@tbos.ma</a>
                <span style={{ fontFamily: MONO, fontSize: 14, color: GOLD, fontWeight: 600 }}>+212 5 22 XX XX XX</span>
                <span style={{ fontSize: 12, color: TEXT3 }}>Lun-Ven: 08h-18h | Sam: 09h-13h</span>
              </div>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: GOLD, color: BG, borderRadius: 10, border: 'none',
                fontWeight: 700, fontSize: 13, fontFamily: SANS, cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFE44D'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = GOLD; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
              >
                <MessageSquare size={15} />
                Envoyer un Message
              </button>
            </Crd>

            {/* Right: FAQ */}
            <Crd visible={v7}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: BLUE_D, border: `1px solid ${BLUE}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={22} color={BLUE} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT1 }}>Questions Fréquentes</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {FAQ.map((item, i) => (
                  <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
                        textAlign: 'left', gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT1 }}>{item.q}</span>
                      <ChevronDown size={16} color={GOLD} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
                    </button>
                    <div style={{
                      maxHeight: openFaq === i ? 200 : 0, overflow: 'hidden',
                      transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                      <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, padding: '0 4px 12px' }}>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Crd>
          </div>
        </div>

      </div>
    </div>
  );
}
