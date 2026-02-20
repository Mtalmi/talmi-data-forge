import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, AlertCircle, Package, FileText, Settings, Truck,
  TrendingUp, RefreshCw, Shield, Clock, Star, AlertTriangle,
  CheckCircle, ChevronRight,
} from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BG      = '#0B1120';
const CARD    = 'rgba(17,27,46,0.92)';
const BORDER  = 'rgba(255,215,0,0.10)';
const FIELD   = '#0F172A';
const DARK    = '#1E293B';
const GOLD    = '#FFD700';
const GOLD_D  = 'rgba(255,215,0,0.10)';
const GOLD_D2 = 'rgba(255,215,0,0.06)';
const GREEN   = '#10B981';
const GREEN_D = 'rgba(16,185,129,0.12)';
const BLUE    = '#3B82F6';
const BLUE_D  = 'rgba(59,130,246,0.12)';
const YELLOW  = '#F59E0B';
const YELLOW_D= 'rgba(245,158,11,0.12)';
const CYAN    = '#06B6D4';
const CYAN_D  = 'rgba(6,182,212,0.12)';
const PURPLE  = '#8B5CF6';
const PURPLE_D= 'rgba(139,92,246,0.12)';
const RED     = '#EF4444';
const RED_D   = 'rgba(239,68,68,0.12)';
const TEXT1   = '#F1F5F9';
const TEXT2   = '#94A3B8';
const TEXT3   = '#64748B';
const MONO    = "'JetBrains Mono', monospace";
const SANS    = "'DM Sans', sans-serif";

// ─── useFadeIn ────────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return v;
}

// ─── AnimatedBar ─────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 400);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 99, transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Crd({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: CARD, border: `1px solid ${hovered ? 'rgba(255,215,0,0.22)' : BORDER}`,
        borderRadius: 16, padding: 24, cursor: onClick ? 'pointer' : 'default',
        boxShadow: hovered ? '0 8px 32px rgba(255,215,0,0.07)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SHead({ icon: Icon, label, sub, badge }: { icon: React.ElementType; label: string; sub?: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 4, height: 28, borderRadius: 99, background: `linear-gradient(180deg,${GOLD},rgba(255,215,0,0.2))` }} />
      <div style={{ padding: '6px 10px', borderRadius: 8, background: GOLD_D, border: `1px solid rgba(255,215,0,0.2)` }}>
        <Icon size={16} color={GOLD} />
      </div>
      <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: TEXT1 }}>{label}</span>
      {sub && <span style={{ fontSize: 12, color: TEXT3 }}>{sub}</span>}
      {badge}
    </div>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { name: 'Données Simulées',      desc: "Toutes les données sont des exemples. Rien n'est enregistré en base réelle.",               icon: Package,    color: BLUE,   colorD: BLUE_D   },
  { name: 'Devis et Commandes',    desc: "Créez des devis et commandes fictifs pour vous entraîner sans impact réel.",                icon: FileText,   color: GOLD,   colorD: GOLD_D   },
  { name: 'Production Fictive',    desc: "Lancez des batches d'entraînement. Les stocks ne sont pas affectés.",                       icon: Settings,   color: GREEN,  colorD: GREEN_D  },
  { name: 'Livraisons Simulées',   desc: "Simulez des livraisons complètes sans affecter la flotte réelle.",                         icon: Truck,      color: YELLOW, colorD: YELLOW_D },
  { name: 'Rapports de Test',      desc: 'Générez des rapports d\'entraînement marqués "FORMATION".',                                 icon: TrendingUp, color: PURPLE, colorD: PURPLE_D },
  { name: 'Réinitialisation Auto', desc: "Les données de formation sont réinitialisées chaque nuit à minuit automatiquement.",        icon: RefreshCw,  color: CYAN,   colorD: CYAN_D   },
];

const MODULES = [
  { name: 'Dashboard',                done: 3, total: 3  },
  { name: 'Créer un Devis',           done: 2, total: 3  },
  { name: 'Lancer un Batch',          done: 1, total: 4  },
  { name: 'Enregistrer un Paiement',  done: 0, total: 3  },
  { name: 'Générer un Rapport',       done: 1, total: 2  },
  { name: 'Gérer les Stocks',         done: 0, total: 3  },
];

const SCENARIOS = [
  {
    name: 'Parcours Commercial',
    desc: 'Créer un devis → Valider BC → Suivre paiement',
    steps: 5, done: 2,
    duration: '15 min',
    difficulty: 'Débutant',
    diffColor: GREEN,
    diffColorD: GREEN_D,
    status: 'in_progress',
  },
  {
    name: 'Parcours Production',
    desc: 'Planifier batch → Lancer production → Contrôle qualité',
    steps: 6, done: 1,
    duration: '20 min',
    difficulty: 'Intermédiaire',
    diffColor: YELLOW,
    diffColorD: YELLOW_D,
    status: 'in_progress',
  },
  {
    name: 'Parcours Complet',
    desc: 'Cycle complet: devis → production → livraison → facturation',
    steps: 12, done: 0,
    duration: '45 min',
    difficulty: 'Avancé',
    diffColor: GOLD,
    diffColorD: GOLD_D,
    status: 'not_started',
  },
];

const HISTORY = [
  { date: '20 Fév', user: 'Karim Benani',   init: 'K', initColor: BLUE,   scenario: 'Parcours Commercial', diff: 'Débutant',      diffColor: GREEN,  duration: '18 min', done: 2, total: 5,  result: 'in_progress' },
  { date: '19 Fév', user: 'Fatima Zahra',   init: 'F', initColor: GREEN,  scenario: 'Parcours Commercial', diff: 'Débutant',      diffColor: GREEN,  duration: '22 min', done: 5, total: 5,  result: 'completed'   },
  { date: '18 Fév', user: 'Karim Benani',   init: 'K', initColor: BLUE,   scenario: 'Parcours Production', diff: 'Intermédiaire', diffColor: YELLOW, duration: '12 min', done: 1, total: 6,  result: 'in_progress' },
  { date: '15 Fév', user: 'Amina Lakhdar',  init: 'A', initColor: PURPLE, scenario: 'Parcours Commercial', diff: 'Débutant',      diffColor: GREEN,  duration: '16 min', done: 5, total: 5,  result: 'completed'   },
  { date: '12 Fév', user: 'Nadia Filali',   init: 'N', initColor: YELLOW, scenario: 'Parcours Complet',    diff: 'Avancé',        diffColor: GOLD,   duration: '35 min', done: 8, total: 12, result: 'in_progress' },
];

const WARNINGS = [
  {
    title: 'Données Non Sauvegardées',
    desc: 'Les actions effectuées en mode formation ne sont PAS sauvegardées. Tout est réinitialisé à minuit.',
    color: YELLOW, colorD: YELLOW_D, icon: AlertTriangle,
  },
  {
    title: 'Marquage Formation',
    desc: 'Tous les documents générés en mode formation portent le filigrane "FORMATION — DOCUMENT NON VALIDE".',
    color: BLUE, colorD: BLUE_D, icon: FileText,
  },
  {
    title: 'Retour en Production',
    desc: 'Quand vous désactivez le mode formation, vous retrouvez immédiatement vos données réelles intactes.',
    color: GREEN, colorD: GREEN_D, icon: Shield,
  },
];

function getModuleBadge(pct: number): { label: string; color: string; colorD: string } {
  if (pct === 100) return { label: 'Complété ✅', color: GREEN,  colorD: GREEN_D  };
  if (pct >= 50)   return { label: 'En cours',    color: YELLOW, colorD: YELLOW_D };
  if (pct >= 1)    return { label: 'Commencé',    color: GOLD,   colorD: GOLD_D   };
  return              { label: 'Non commencé', color: TEXT3,  colorD: 'rgba(100,116,139,0.12)' };
}

function getBarColor(pct: number): string {
  if (pct === 100) return GREEN;
  if (pct >= 50)   return YELLOW;
  if (pct >= 1)    return GOLD;
  return TEXT3;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function WorldClassTraining() {
  const [trainingOn, setTrainingOn] = useState(false);

  const v0 = useFadeIn(0);
  const v1 = useFadeIn(80);
  const v2 = useFadeIn(160);
  const v3 = useFadeIn(240);
  const v4 = useFadeIn(320);
  const v5 = useFadeIn(400);
  const v6 = useFadeIn(480);

  const totalDone  = MODULES.reduce((s, m) => s + m.done, 0);
  const totalTasks = MODULES.reduce((s, m) => s + m.total, 0);
  const overallPct = Math.round((totalDone / totalTasks) * 100);

  // Circular progress arc (SVG)
  const R = 54, CIRC = 2 * Math.PI * R;
  const [arcPct, setArcPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setArcPct(overallPct), 500);
    return () => clearTimeout(t);
  }, [overallPct]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, borderRadius: 10, background: GOLD_D, border: `1px solid rgba(255,215,0,0.2)` }}>
            <BookOpen size={20} color={GOLD} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT1, margin: 0 }}>Mode Formation</h1>
            <p style={{ fontSize: 12, color: TEXT3, margin: 0 }}>Environnement de pratique et d'apprentissage</p>
          </div>
        </div>
        {/* Mode badge */}
        <div style={{
          padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
          background: trainingOn ? YELLOW_D : GREEN_D,
          border: `1px solid ${trainingOn ? `${YELLOW}44` : `${GREEN}44`}`,
          color: trainingOn ? YELLOW : GREEN,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.3s ease',
        }}>
          {trainingOn ? <BookOpen size={12} /> : <Shield size={12} />}
          {trainingOn ? 'Formation' : 'Production'}
        </div>
      </div>

      <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── SECTION 1: HERO TOGGLE ───────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          opacity: v1 ? 1 : 0, transform: v1 ? 'none' : 'translateY(20px)', transition: 'all 0.5s ease',
        }}>
          <div style={{
            background: CARD, border: `1px solid ${trainingOn ? 'rgba(255,215,0,0.25)' : BORDER}`,
            borderRadius: 24, padding: 48, maxWidth: 700, width: '100%', textAlign: 'center',
            boxShadow: trainingOn ? `0 0 60px rgba(255,215,0,0.08), 0 0 0 1px rgba(255,215,0,0.12)` : 'none',
            transition: 'all 0.4s ease',
          }}>
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: trainingOn ? GOLD_D : 'rgba(255,255,255,0.04)',
                border: `1px solid ${trainingOn ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: trainingOn ? `0 0 30px rgba(255,215,0,0.25)` : 'none',
                transition: 'all 0.4s ease',
              }}>
                <BookOpen size={32} color={trainingOn ? GOLD : TEXT3} style={{ transition: 'color 0.3s' }} />
              </div>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT1, marginBottom: 10 }}>Mode Formation</h2>
            <p style={{ fontSize: 14, color: TEXT2, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              Activez le mode formation pour pratiquer sans affecter les données réelles
            </p>

            {/* Premium Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 28 }}>
              <div style={{ position: 'relative' }}>
                {/* Pulse glow behind toggle when ON */}
                {trainingOn && (
                  <div style={{
                    position: 'absolute', inset: -8, borderRadius: 99,
                    background: 'rgba(255,215,0,0.15)',
                    animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                  }} />
                )}
                <button
                  onClick={() => setTrainingOn(v => !v)}
                  aria-checked={trainingOn}
                  role="switch"
                  style={{
                    position: 'relative', width: 80, height: 40, borderRadius: 99,
                    background: trainingOn ? GOLD : DARK,
                    border: `1px solid ${trainingOn ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: trainingOn ? `0 0 20px rgba(255,215,0,0.3)` : 'none',
                    cursor: 'pointer', outline: 'none', padding: 0,
                    transition: 'background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 4, left: trainingOn ? 44 : 4,
                    width: 30, height: 30, borderRadius: '50%',
                    background: trainingOn ? '#fff' : 'rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                </button>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 700, fontFamily: MONO,
                color: trainingOn ? GOLD : TEXT3,
                transition: 'color 0.3s ease',
              }}>
                {trainingOn ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
              </span>
            </div>

            {/* Status text */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              background: trainingOn ? YELLOW_D : GREEN_D,
              border: `1px solid ${trainingOn ? `${YELLOW}33` : `${GREEN}33`}`,
              transition: 'all 0.3s ease',
            }}>
              {trainingOn
                ? <BookOpen size={15} color={YELLOW} />
                : <Shield size={15} color={GREEN} />}
              <span style={{ fontSize: 13, color: trainingOn ? YELLOW : GREEN, fontWeight: 600 }}>
                {trainingOn
                  ? 'Vous êtes en mode Formation — les données sont simulées et réinitialisées chaque jour'
                  : 'Vous êtes en mode Production — toutes les actions affectent les données réelles'}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: WHAT TRAINING MODE DOES ──────────────────────────── */}
        <div style={{ opacity: v2 ? 1 : 0, transform: v2 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead icon={AlertCircle} label="Que fait le Mode Formation?" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => {
              const FIcon = f.icon;
              return (
                <div key={i} style={{
                  background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20,
                  opacity: v2 ? (trainingOn ? 1 : 0.55) : 0,
                  transform: v2 ? 'translateY(0)' : 'translateY(18px)',
                  transition: `opacity 0.4s ${i * 80}ms ease, transform 0.5s ${i * 80}ms ease, box-shadow 0.25s ease, border-color 0.25s ease`,
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(255,215,0,0.07)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,215,0,0.22)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: f.colorD, border: `1px solid ${f.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <FIcon size={22} color={f.color} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, marginBottom: 6 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: TRAINING PROGRESS ────────────────────────────────── */}
        <div style={{ opacity: v3 ? 1 : 0, transform: v3 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead
            icon={TrendingUp}
            label="Progression de Formation"
            badge={
              <span style={{ padding: '3px 10px', borderRadius: 99, background: GOLD_D, border: `1px solid rgba(255,215,0,0.25)`, fontSize: 11, fontWeight: 700, color: GOLD, marginLeft: 4 }}>nouveau</span>
            }
          />
          <Crd>
            {/* Circular progress + module list side-by-side */}
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Arc */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
                  <circle
                    cx="70" cy="70" r={R} fill="none"
                    stroke={overallPct === 100 ? GREEN : GOLD}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC - (CIRC * arcPct) / 100}
                    style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1), stroke 0.4s' }}
                  />
                </svg>
                <div style={{ textAlign: 'center', marginTop: -12 }}>
                  <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: overallPct === 100 ? GREEN : GOLD, lineHeight: 1 }}>
                    {overallPct}%
                  </div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 4 }}>{totalDone} tâches complétées sur {totalTasks}</div>
                  {overallPct === 100 && (
                    <div style={{ marginTop: 8, padding: '4px 12px', borderRadius: 99, background: GREEN_D, border: `1px solid ${GREEN}44`, fontSize: 12, fontWeight: 700, color: GREEN }}>
                      Formation Terminée! 🎓
                    </div>
                  )}
                </div>
              </div>

              {/* Module list */}
              <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MODULES.map((m, i) => {
                  const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
                  const badge = getModuleBadge(pct);
                  const barColor = getBarColor(pct);
                  return (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 10,
                      opacity: v3 ? 1 : 0, transform: v3 ? 'none' : 'translateX(-10px)',
                      transition: `opacity 0.5s ${i * 60}ms ease, transform 0.5s ${i * 60}ms ease, background 0.2s ease`,
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT1 }}>{m.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 99, background: badge.colorD, border: `1px solid ${badge.color}33`, fontSize: 10, fontWeight: 700, color: badge.color }}>{badge.label}</span>
                          <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT3 }}>{m.done}/{m.total}</span>
                        </div>
                      </div>
                      <AnimatedBar pct={pct} color={barColor} height={5} />
                    </div>
                  );
                })}
              </div>
            </div>
          </Crd>
        </div>

        {/* ── SECTION 4: TRAINING SCENARIOS ───────────────────────────────── */}
        <div style={{ opacity: v4 ? 1 : 0, transform: v4 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead icon={BookOpen} label="Scénarios Guidés" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {SCENARIOS.map((sc, i) => (
              <div key={i} style={{
                background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24,
                opacity: v4 ? 1 : 0, transform: v4 ? 'none' : 'translateY(20px)',
                transition: `opacity 0.5s ${i * 100}ms ease, transform 0.5s ${i * 100}ms ease, box-shadow 0.25s ease, border-color 0.25s ease`,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 32px rgba(255,215,0,0.08)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,215,0,0.2)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                }}
              >
                {/* Difficulty badge */}
                <div>
                  <span style={{ padding: '4px 12px', borderRadius: 99, background: sc.diffColorD, border: `1px solid ${sc.diffColor}33`, fontSize: 11, fontWeight: 700, color: sc.diffColor }}>
                    {sc.difficulty}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: TEXT1, marginBottom: 4 }}>{sc.name}</div>
                  <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>{sc.desc}</div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: GOLD, fontWeight: 700 }}>{sc.steps}</span>
                  <span style={{ fontSize: 13, color: TEXT3 }}>étapes</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: TEXT3 }}>
                    <Clock size={13} />
                    <span style={{ fontFamily: MONO }}>{sc.duration}</span>
                  </span>
                </div>

                {/* Step dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  {Array.from({ length: sc.steps }).map((_, di) => (
                    <div key={di} style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: di < sc.done ? GOLD : 'rgba(255,255,255,0.1)',
                      border: di < sc.done ? 'none' : '1px solid rgba(255,255,255,0.15)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                  {sc.done > 0 && (
                    <span style={{ fontSize: 11, color: TEXT3, marginLeft: 4 }}>{sc.done}/{sc.steps}</span>
                  )}
                </div>

                {/* CTA Button */}
                <div title={!trainingOn ? 'Activez le mode formation' : undefined}>
                  <button
                    disabled={!trainingOn}
                    style={{
                      width: '100%', padding: '10px 20px', borderRadius: 10, border: 'none',
                      background: trainingOn ? GOLD : 'rgba(255,255,255,0.06)',
                      color: trainingOn ? BG : TEXT3,
                      fontWeight: 700, fontSize: 13, fontFamily: SANS, cursor: trainingOn ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease', opacity: trainingOn ? 1 : 0.55,
                    }}
                    onMouseEnter={e => trainingOn && ((e.currentTarget as HTMLButtonElement).style.background = '#FFE44D')}
                    onMouseLeave={e => trainingOn && ((e.currentTarget as HTMLButtonElement).style.background = GOLD)}
                  >
                    {sc.status === 'not_started' ? 'Commencer' : `Continuer — Étape ${sc.done + 1}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 5: TRAINING HISTORY ─────────────────────────────────── */}
        <div style={{ opacity: v5 ? 1 : 0, transform: v5 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <SHead icon={Clock} label="Historique Formation" />
          <Crd>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {HISTORY.map((h, i) => {
                const isCompleted = h.result === 'completed';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 10px',
                    borderRadius: 10, position: 'relative', overflow: 'hidden',
                    opacity: v5 ? 1 : 0, transform: v5 ? 'none' : 'translateX(-10px)',
                    transition: `opacity 0.5s ${i * 60}ms ease, transform 0.5s ${i * 60}ms ease, background 0.2s ease`,
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
                    {/* Left status bar */}
                    <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 4, borderRadius: 99, background: isCompleted ? GREEN : YELLOW }} />

                    {/* Date */}
                    <span style={{ fontSize: 11, fontFamily: MONO, color: TEXT3, flexShrink: 0, width: 48, marginLeft: 8 }}>{h.date}</span>

                    {/* User avatar */}
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${h.initColor}22`, border: `1px solid ${h.initColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: h.initColor }}>{h.init}</span>
                    </div>

                    {/* User name */}
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT1, flexShrink: 0, minWidth: 110 }}>{h.user}</span>

                    {/* Scenario + diff */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: TEXT2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.scenario}</span>
                      <span style={{ padding: '1px 7px', borderRadius: 99, background: `${h.diffColor}18`, border: `1px solid ${h.diffColor}33`, fontSize: 10, fontWeight: 600, color: h.diffColor, flexShrink: 0 }}>{h.diff}</span>
                    </div>

                    {/* Duration */}
                    <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT3, flexShrink: 0 }}>{h.duration}</span>

                    {/* Tasks progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: GOLD }}>{h.done}/{h.total}</span>
                      <div style={{ width: 50 }}>
                        <AnimatedBar pct={Math.round((h.done / h.total) * 100)} color={isCompleted ? GREEN : GOLD} height={4} />
                      </div>
                    </div>

                    {/* Result badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: isCompleted ? GREEN_D : YELLOW_D, border: `1px solid ${isCompleted ? GREEN : YELLOW}33`, flexShrink: 0 }}>
                      {isCompleted
                        ? <><CheckCircle size={11} color={GREEN} /><Star size={11} color={GREEN} /></>
                        : <Clock size={11} color={YELLOW} />}
                      <span style={{ fontSize: 11, fontWeight: 700, color: isCompleted ? GREEN : YELLOW }}>{isCompleted ? 'Complété' : 'En cours'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Crd>
        </div>

        {/* ── SECTION 6: WARNINGS ─────────────────────────────────────────── */}
        <div style={{ opacity: v6 ? 1 : 0, transform: v6 ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 28, borderRadius: 99, background: `linear-gradient(180deg,${GOLD},rgba(255,215,0,0.2))` }} />
            <div style={{ padding: '6px 10px', borderRadius: 8, background: GOLD_D, border: `1px solid rgba(255,215,0,0.2)` }}>
              <AlertTriangle size={16} color={GOLD} />
            </div>
            <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: TEXT1 }}>Important</span>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: RED_D, border: `1px solid ${RED}33`, fontSize: 11, fontWeight: 700, color: RED }}>à lire</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {WARNINGS.map((w, i) => {
              const WIcon = w.icon;
              return (
                <div key={i} style={{
                  background: CARD, borderRadius: 14,
                  border: `1px solid ${BORDER}`, borderLeft: `4px solid ${w.color}`,
                  padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16,
                  opacity: v6 ? 1 : 0, transform: v6 ? 'none' : 'translateY(10px)',
                  transition: `opacity 0.4s ${i * 80}ms ease, transform 0.4s ${i * 80}ms ease, box-shadow 0.25s ease`,
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px ${w.color}18`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: w.colorD, border: `1px solid ${w.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WIcon size={20} color={w.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, marginBottom: 5 }}>{w.title}</div>
                    <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{w.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
