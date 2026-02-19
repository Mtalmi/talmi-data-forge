import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Star, Trophy, BookOpen, Users, Lock,
  ChevronRight, Play, CheckCircle, Flame, Award,
  Download, Linkedin, TrendingUp, Target, Medal,
  ArrowLeft, X, Check,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const T = {
  base: '#0F1419', card: '#161D26', elevated: '#1C2533',
  gold: '#FFD700', goldDim: '#B8960C', goldGlow: '#FFD70015',
  text1: '#FFFFFF', text2: '#B0B8C1',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  border: '#2A3545',
  certBronze: '#CD7F32', certSilver: '#C0C0C0', certGold: '#FFD700',
  linkedin: '#0077B5',
};

// ============================================================================
// ANIMATION HELPERS
// ============================================================================
const stagger = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.3 } });

function CountUp({ end, duration = 1.2, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useState(() => {
    let start = 0;
    const step = end / (duration * 60);
    const id = setInterval(() => { start += step; if (start >= end) { setVal(end); clearInterval(id); } else setVal(Math.floor(start)); }, 1000 / 60);
    return () => clearInterval(id);
  });
  return <span style={{ fontFamily: 'JetBrains Mono' }}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ============================================================================
// DATA
// ============================================================================
type CourseCategory = 'getting-started' | 'operations' | 'quality' | 'fleet' | 'finance' | 'advanced';
interface Course {
  id: number; icon: string; title: string; desc: string; duration: string; modules: number; difficulty: number;
  enrolled: number; progress: number; completed: boolean; category: CourseCategory; catLabel: string; catColor: string;
  thumbGrad: string;
}

const COURSES: Course[] = [
  { id: 1, icon: '🚀', title: 'TBOS Fundamentals', desc: 'Your complete introduction to the platform', duration: '45 min', modules: 5, difficulty: 1, enrolled: 312, progress: 100, completed: true, category: 'getting-started', catLabel: 'Getting Started', catColor: T.success, thumbGrad: 'from-emerald-600 to-emerald-800' },
  { id: 2, icon: '📱', title: 'Mobile App Essentials', desc: 'Master field operations on mobile', duration: '30 min', modules: 4, difficulty: 1, enrolled: 198, progress: 45, completed: false, category: 'getting-started', catLabel: 'Getting Started', catColor: T.success, thumbGrad: 'from-emerald-500 to-teal-700' },
  { id: 3, icon: '🏗️', title: 'Batch Operations Mastery', desc: 'From basic batching to advanced mix design', duration: '2h', modules: 8, difficulty: 2, enrolled: 267, progress: 67, completed: false, category: 'operations', catLabel: 'Operations', catColor: T.gold, thumbGrad: 'from-amber-500 to-amber-800' },
  { id: 4, icon: '📦', title: 'Supply Chain Management', desc: 'Optimize materials, reduce waste by 20%', duration: '1.5h', modules: 6, difficulty: 2, enrolled: 145, progress: 0, completed: false, category: 'operations', catLabel: 'Operations', catColor: T.gold, thumbGrad: 'from-amber-600 to-yellow-800' },
  { id: 5, icon: '🔧', title: 'Equipment & Maintenance', desc: 'Keep your plant running at peak performance', duration: '1h', modules: 5, difficulty: 2, enrolled: 189, progress: 0, completed: false, category: 'operations', catLabel: 'Operations', catColor: T.gold, thumbGrad: 'from-orange-500 to-amber-800' },
  { id: 6, icon: '✅', title: 'Quality Control Fundamentals', desc: 'ISO standards, testing protocols, compliance', duration: '1.5h', modules: 7, difficulty: 2, enrolled: 234, progress: 100, completed: true, category: 'quality', catLabel: 'Quality', catColor: '#3B82F6', thumbGrad: 'from-blue-500 to-blue-800' },
  { id: 7, icon: '🔬', title: 'Advanced Quality Analytics', desc: 'Statistical process control for concrete', duration: '2h', modules: 8, difficulty: 3, enrolled: 98, progress: 0, completed: false, category: 'quality', catLabel: 'Quality', catColor: '#3B82F6', thumbGrad: 'from-blue-600 to-indigo-800' },
  { id: 8, icon: '🚛', title: 'Fleet Management Pro', desc: 'GPS tracking, route optimization, driver management', duration: '2h', modules: 7, difficulty: 2, enrolled: 176, progress: 34, completed: false, category: 'fleet', catLabel: 'Fleet', catColor: '#F97316', thumbGrad: 'from-orange-500 to-red-700' },
  { id: 9, icon: '⛽', title: 'Fuel Efficiency & Cost Reduction', desc: 'Cut fleet costs by 15-20%', duration: '1h', modules: 4, difficulty: 2, enrolled: 134, progress: 0, completed: false, category: 'fleet', catLabel: 'Fleet', catColor: '#F97316', thumbGrad: 'from-orange-600 to-orange-900' },
  { id: 10, icon: '💰', title: 'Financial Reporting Mastery', desc: 'P&L, cost analysis, budget management', duration: '2h', modules: 6, difficulty: 2, enrolled: 112, progress: 0, completed: false, category: 'finance', catLabel: 'Finance', catColor: '#8B5CF6', thumbGrad: 'from-violet-500 to-purple-800' },
  { id: 11, icon: '📊', title: 'Analytics for Executives', desc: 'KPIs, dashboards, data-driven decisions', duration: '2.5h', modules: 8, difficulty: 3, enrolled: 156, progress: 12, completed: false, category: 'finance', catLabel: 'Finance', catColor: '#8B5CF6', thumbGrad: 'from-purple-500 to-violet-800' },
  { id: 12, icon: '📈', title: 'Industry Benchmarking Guide', desc: 'How to read and act on benchmark data', duration: '45 min', modules: 3, difficulty: 1, enrolled: 203, progress: 0, completed: false, category: 'finance', catLabel: 'Finance', catColor: '#8B5CF6', thumbGrad: 'from-purple-600 to-fuchsia-800' },
  { id: 13, icon: '🤖', title: 'AI & Predictive Maintenance', desc: 'Machine learning for equipment management', duration: '3h', modules: 10, difficulty: 3, enrolled: 87, progress: 0, completed: false, category: 'advanced', catLabel: 'Advanced', catColor: T.danger, thumbGrad: 'from-red-500 to-rose-800' },
  { id: 14, icon: '⚡', title: 'Workflow Automation Expert', desc: 'Build powerful automations — no coding needed', duration: '2.5h', modules: 9, difficulty: 3, enrolled: 94, progress: 0, completed: false, category: 'advanced', catLabel: 'Advanced', catColor: T.danger, thumbGrad: 'from-red-600 to-red-900' },
];

const ACHIEVEMENTS = [
  { icon: '🏆', title: 'Quality Champion', desc: 'Completed Quality Control Fundamentals with 98% score', time: '2d ago', color: T.gold },
  { icon: '⭐', title: '+200 XP', desc: 'Completed Module 3 of Batch Operations', time: '3d ago', color: T.gold },
  { icon: '🎯', title: 'Perfect Score', desc: 'Scored 100% on Safety Assessment', time: '1w ago', color: T.gold },
  { icon: '📚', title: 'Fast Learner', desc: 'Completed 3 modules in one day', time: '1w ago', color: '#3B82F6' },
  { icon: '🔥', title: '7-Day Streak', desc: 'Learned 7 days in a row', time: '2w ago', color: '#F97316' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Ahmed S.', company: 'Saudi Ready Mix', xp: 4820, certs: 4, badge: '🏆 Master', emoji: '🥇' },
  { rank: 2, name: 'Fatima K.', company: 'Gulf Concrete', xp: 4340, certs: 3, badge: '⭐ Expert', emoji: '🥈' },
  { rank: 3, name: 'Omar B.', company: 'Maroc Béton', xp: 4120, certs: 3, badge: '⭐ Expert', emoji: '🥉' },
  { rank: 4, name: 'Layla M.', company: 'CIH Construction', xp: 3890, certs: 3, badge: '⭐ Expert', emoji: '' },
  { rank: 5, name: 'Youssef A.', company: 'Atlas Group', xp: 3640, certs: 2, badge: '📚 Pro', emoji: '' },
  { rank: 6, name: 'Sara H.', company: 'Addoha', xp: 3420, certs: 2, badge: '📚 Pro', emoji: '' },
  { rank: 7, name: 'Hassan A-R.', company: 'Atlas Concrete', xp: 2840, certs: 2, badge: '📚 Pro', emoji: '' },
  { rank: 8, name: 'Karim N.', company: 'Rabat Béton', xp: 2610, certs: 2, badge: '📚 Pro', emoji: '' },
  { rank: 9, name: 'Nadia T.', company: 'Tanger Mix', xp: 2380, certs: 1, badge: '🌱 Learner', emoji: '' },
  { rank: 10, name: 'Said M.', company: 'Casablanca Const.', xp: 2140, certs: 1, badge: '🌱 Learner', emoji: '' },
];

const XP_CHART = [
  { month: 'Sep', xp: 320 }, { month: 'Oct', xp: 680 }, { month: 'Nov', xp: 1100 },
  { month: 'Dec', xp: 1560 }, { month: 'Jan', xp: 2200, cert: 'Fundamentals' },
  { month: 'Feb', xp: 2840, cert: 'Quality Pro' },
];

const QUIZ_QUESTIONS = [
  { q: 'What is the standard slump range for C30 concrete?', opts: ['80-100mm', '100-150mm', '140-160mm', '180-200mm'], correct: 2 },
  { q: 'Maximum water-to-cement ratio for high-strength concrete?', opts: ['0.55', '0.45', '0.35', '0.65'], correct: 1 },
  { q: 'Which test verifies concrete compressive strength?', opts: ['Slump test', 'Cube test', 'Flow test', 'Permeability test'], correct: 1 },
  { q: 'Minimum curing time for structural concrete (days)?', opts: ['3 days', '7 days', '14 days', '28 days'], correct: 1 },
  { q: 'What admixture reduces water content?', opts: ['Retarder', 'Superplasticizer', 'Air entrainer', 'Accelerator'], correct: 1 },
];

const COURSE_MODULES = [
  { id: 1, title: 'Introduction', done: true },
  { id: 2, title: 'Basic Operations', done: true },
  { id: 3, title: 'Mix Calculations', done: true },
  { id: 4, title: 'Advanced Mix Design', done: false, current: true },
  { id: 5, title: 'Quality Integration', done: false },
  { id: 6, title: 'Troubleshooting', done: false },
  { id: 7, title: 'Case Studies', done: false },
  { id: 8, title: 'Final Assessment', done: false },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TrainingAcademy() {
  const [activeTab, setActiveTab] = useState<'learning' | 'courses' | 'certifications' | 'leaderboard'>('learning');
  const [courseFilter, setCourseFilter] = useState('All');
  const [openCourse, setOpenCourse] = useState<Course | null>(null);
  const [courseView, setCourseView] = useState<'Video' | 'Reading' | 'Quiz'>('Video');
  const [quizStep, setQuizStep] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [xpAnim, setXpAnim] = useState<string | null>(null);
  const [lbFilter, setLbFilter] = useState('All Time');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const TABS = [
    { id: 'learning' as const, label: 'My Learning', icon: BookOpen },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'certifications' as const, label: 'Certifications', icon: Award },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Users },
  ];

  const CAT_FILTERS = ['All', 'Operations', 'Finance', 'Fleet', 'Quality', 'Executive', 'Developer'];

  const filteredCourses = useMemo(() => {
    if (courseFilter === 'All') return COURSES;
    return COURSES.filter(c => c.catLabel.toLowerCase() === courseFilter.toLowerCase() || (courseFilter === 'Executive' && c.category === 'finance') || (courseFilter === 'Developer' && c.category === 'advanced'));
  }, [courseFilter]);

  const showXP = (amount: string) => { setXpAnim(amount); setTimeout(() => setXpAnim(null), 1500); };

  const handleQuizSubmit = () => {
    if (quizSelected === null) return;
    setQuizSubmitted(true);
    if (quizSelected === QUIZ_QUESTIONS[quizStep].correct) setQuizCorrect(prev => prev + 1);
  };

  const handleQuizNext = () => {
    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(prev => prev + 1);
      setQuizSelected(null);
      setQuizSubmitted(false);
    }
  };

  // ============================================================================
  // COURSE PLAYER
  // ============================================================================
  if (openCourse) {
    const q = QUIZ_QUESTIONS[quizStep];
    const quizDone = quizStep === QUIZ_QUESTIONS.length - 1 && quizSubmitted;
    const score = Math.round(((quizCorrect + (quizSubmitted && quizSelected === q.correct ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100);

    return (
      <div style={{ background: T.base, minHeight: '100vh', color: T.text1 }}>
        {/* Header */}
        <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => { setOpenCourse(null); setQuizStep(0); setQuizSelected(null); setQuizSubmitted(false); setQuizCorrect(0); setCourseView('Video'); }}
            className="flex items-center gap-2 text-sm" style={{ color: T.text2 }}>
            <ArrowLeft size={18} /> Back
          </button>
          <span style={{ color: T.text2 }}>|</span>
          <span className="font-semibold" style={{ fontFamily: 'Poppins' }}>{openCourse.title}</span>
          <span style={{ color: T.text2, fontSize: 14 }}>Module 4 of {openCourse.modules}</span>
        </div>

        <div className="flex" style={{ minHeight: 'calc(100vh - 52px)' }}>
          {/* Content */}
          <div className="flex-1 p-6">
            {/* Tabs */}
            <div className="flex gap-1 mb-6" style={{ background: T.elevated, borderRadius: 8, padding: 4, width: 'fit-content' }}>
              {(['Video', 'Reading', 'Quiz'] as const).map(t => (
                <button key={t} onClick={() => setCourseView(t)} className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                  style={{ background: courseView === t ? T.card : 'transparent', color: courseView === t ? T.gold : T.text2, border: courseView === t ? `1px solid ${T.border}` : '1px solid transparent' }}>
                  {t}
                </button>
              ))}
            </div>

            {courseView === 'Video' && (
              <div>
                <div className="relative rounded-xl overflow-hidden mb-4" style={{ background: T.elevated, aspectRatio: '16/9', maxHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button className="rounded-full flex items-center justify-center" style={{ width: 72, height: 72, background: T.gold }}>
                    <Play size={32} fill="#000" color="#000" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>4.2 — Advanced Mix Design Ratios</h3>
                <p style={{ color: T.text2, fontSize: 14 }}>Learn how to calculate optimal mix ratios for C30-C50 concrete using TBOS formulation engine. This module covers water-cement ratios, aggregate proportioning, and admixture calculations for high-performance concrete.</p>
              </div>
            )}

            {courseView === 'Reading' && (
              <div>
                <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Poppins', color: T.gold }}>Advanced Mix Design Ratios</h2>
                <div style={{ color: T.text2, fontSize: 16, lineHeight: 1.8 }} className="space-y-4">
                  <p>Concrete mix design is a systematic process of selecting suitable ingredients and determining their relative quantities. The objective is to produce concrete of required strength, durability, and workability at the minimum cost.</p>
                  <div className="p-4 rounded-lg" style={{ border: `1px solid ${T.gold}40`, background: `${T.gold}08` }}>
                    <p style={{ color: T.gold, fontWeight: 600 }}>💡 Key Principle</p>
                    <p className="mt-1">The water-cement ratio is the single most important factor affecting concrete strength. For every 1% increase in w/c ratio, compressive strength decreases by approximately 5%.</p>
                  </div>
                  <p>TBOS automates mix design calculations using the ACI 211.1 method, with modifications for local aggregate properties and climate conditions across MENA.</p>
                  <div className="rounded-lg" style={{ background: T.elevated, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2 }}>📊 Mix design calculation diagram</div>
                </div>
              </div>
            )}

            {courseView === 'Quiz' && (
              <div>
                {!quizDone ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span style={{ color: T.text2, fontSize: 14 }}>Question {quizStep + 1} of {QUIZ_QUESTIONS.length}</span>
                      <span style={{ color: T.gold, fontSize: 14, fontFamily: 'JetBrains Mono' }}>{Math.round(((quizStep + (quizSubmitted ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full mb-6" style={{ background: T.elevated }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${((quizStep + (quizSubmitted ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDim})` }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Poppins' }}>{q.q}</h3>
                    <div className="space-y-3">
                      {q.opts.map((opt, oi) => {
                        let bg = T.elevated; let border = T.border; let extraStyle = {};
                        if (quizSubmitted) {
                          if (oi === q.correct) { bg = `${T.success}20`; border = T.success; }
                          else if (oi === quizSelected) { bg = `${T.danger}20`; border = T.danger; }
                        } else if (oi === quizSelected) { bg = `${T.gold}15`; border = T.gold; }
                        return (
                          <button key={oi} onClick={() => !quizSubmitted && setQuizSelected(oi)} className="w-full text-left p-4 rounded-xl transition-all text-sm"
                            style={{ background: bg, border: `1px solid ${border}`, minHeight: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
                            {quizSubmitted && oi === q.correct && <Check size={18} color={T.success} />}
                            {quizSubmitted && oi === quizSelected && oi !== q.correct && <X size={18} color={T.danger} />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-6 flex gap-3">
                      {!quizSubmitted ? (
                        <button onClick={handleQuizSubmit} disabled={quizSelected === null} className="px-6 py-3 rounded-xl font-medium text-sm"
                          style={{ background: quizSelected !== null ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.elevated, color: quizSelected !== null ? '#000' : T.text2, opacity: quizSelected === null ? 0.5 : 1 }}>
                          Submit Answer
                        </button>
                      ) : (
                        <button onClick={handleQuizNext} className="px-6 py-3 rounded-xl font-medium text-sm"
                          style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: '#000' }}>
                          {quizStep < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'See Results'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                    <div className="text-6xl mb-4">{score >= 80 ? '🎉' : '📚'}</div>
                    <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins', color: score >= 80 ? T.success : T.warning }}>
                      {score >= 80 ? 'Passed!' : 'Review and retry'}
                    </h2>
                    <p className="text-4xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>{score}%</p>
                    <p style={{ color: T.text2 }}>{score >= 80 ? 'Great work! +50 XP earned' : 'You need 80% to pass. Review the material and try again.'}</p>
                    <button onClick={() => { setQuizStep(0); setQuizSelected(null); setQuizSubmitted(false); setQuizCorrect(0); if (score >= 80) showXP('+50 XP'); }}
                      className="mt-6 px-6 py-3 rounded-xl font-medium" style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: '#000' }}>
                      {score >= 80 ? 'Continue →' : 'Retry Quiz'}
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 p-4 border-l" style={{ background: T.card, borderColor: T.border }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: T.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Outline</h4>
            <div className="space-y-1">
              {COURSE_MODULES.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg text-sm" style={{
                  background: m.current ? `${T.gold}10` : 'transparent',
                  border: m.current ? `1px solid ${T.gold}30` : '1px solid transparent',
                  color: m.done ? T.success : m.current ? T.text1 : T.text2, opacity: !m.done && !m.current ? 0.5 : 1,
                }}>
                  {m.done ? <CheckCircle size={16} color={T.success} /> : m.current ? <span style={{ color: T.gold }}>🔵</span> : <Lock size={14} />}
                  <span>Module {m.id}: {m.title}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t" style={{ borderColor: T.border }}>
              <button onClick={() => showXP('+50 XP')} className="w-full py-3 rounded-xl font-medium text-sm"
                style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: '#000' }}>
                Mark Complete & Continue →
              </button>
            </div>
          </div>
        </div>

        {/* XP Animation */}
        <AnimatePresence>
          {xpAnim && (
            <motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -80 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }} className="fixed bottom-20 left-1/2 -translate-x-1/2 text-2xl font-bold z-50"
              style={{ fontFamily: 'JetBrains Mono', color: T.gold, textShadow: `0 0 20px ${T.gold}60` }}>
              {xpAnim}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ============================================================================
  // MAIN ACADEMY VIEW
  // ============================================================================
  return (
    <div style={{ background: T.base, minHeight: '100vh', color: T.text1 }}>
      {/* Gold shimmer bar */}
      <div className="w-full h-0.5" style={{ background: `linear-gradient(90deg, ${T.gold}, transparent 30%, transparent 70%, ${T.gold})` }} />

      {/* Dot grid bg */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(255,215,0,0.02) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

      {/* Top Bar */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between" style={{ background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <GraduationCap size={24} color={T.gold} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: T.gold, fontFamily: 'Poppins' }}>ACADEMY</span>
        </div>

        <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.elevated }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{ background: activeTab === t.id ? T.card : 'transparent', color: activeTab === t.id ? T.gold : T.text2, border: activeTab === t.id ? `1px solid ${T.border}` : '1px solid transparent' }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>⭐ 2,840 XP</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${T.gold}15`, color: T.gold, border: `1px solid ${T.gold}30` }}>Level 3 — Professional</span>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* ============ MY LEARNING ============ */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
            {/* Hero Progress */}
            <motion.div {...stagger(0)} className="p-6 rounded-xl" style={{ background: T.card, border: `1px solid ${T.gold}40`, boxShadow: `0 4px 24px rgba(0,0,0,0.5)` }}>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins' }}>Hassan's Learning Journey</h2>
              <p style={{ color: T.text2, fontSize: 14 }} className="mb-4">TBOS Professional · Level 3</p>
              <div className="flex items-center gap-4 mb-2">
                <span style={{ color: T.text2, fontSize: 14 }}>Overall Progress</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: T.gold, fontSize: 14 }}>72%</span>
              </div>
              <div className="h-3 rounded-full mb-4" style={{ background: T.elevated }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${T.gold}, ${T.goldDim})` }} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontFamily: 'JetBrains Mono', color: T.gold, fontSize: 14 }}>XP: 2,840 / 4,000</span>
                <span style={{ color: T.text2, fontSize: 13 }}>to next level</span>
              </div>
              <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: T.border }}>
                <span className="flex items-center gap-2 text-sm"><Trophy size={16} color={T.gold} /> 2 Certifications</span>
                <span className="flex items-center gap-2 text-sm"><BookOpen size={16} color={T.gold} /> 8 Courses</span>
                <span className="flex items-center gap-2 text-sm"><Star size={16} color={T.gold} /> 2,840 XP</span>
              </div>
              <p className="mt-3 text-sm" style={{ color: T.text2 }}>Next milestone: <span style={{ color: T.gold }}>TBOS Expert Certification</span> (1,160 XP away)</p>
            </motion.div>

            {/* Continue Learning */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Continue Where You Left Off</h3>
              <div className="space-y-3">
                {COURSES.filter(c => c.progress > 0 && !c.completed).map((c, i) => (
                  <motion.div key={c.id} {...stagger(i + 1)} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                    style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
                    onClick={() => setOpenCourse(c)}>
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${c.thumbGrad} flex items-center justify-center text-2xl shrink-0`}>{c.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>{c.title}</h4>
                      <p className="text-xs mt-0.5" style={{ color: T.text2 }}>Module 4: Advanced Mix Design</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: T.elevated }}>
                          <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDim})` }} />
                        </div>
                        <span className="text-xs shrink-0" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>{c.progress}%</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium shrink-0" style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: '#000' }}>
                      Continue →
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Recent Achievements</h3>
              <div className="space-y-2">
                {ACHIEVEMENTS.map((a, i) => (
                  <motion.div key={i} {...stagger(i + 4)} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${a.color}` }}>
                    <span className="text-xl">{a.icon}</span>
                    <div className="flex-1">
                      <span className="text-sm font-semibold">{a.title}</span>
                      <span className="text-xs ml-2" style={{ color: T.text2 }}>{a.desc}</span>
                    </div>
                    <span className="text-xs" style={{ color: T.text2 }}>{a.time}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommended */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Recommended For You</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '📈', title: 'Advanced Analytics Deep Dive', reason: 'Based on your Operations Manager role', dur: '2.5h', grad: 'from-purple-500 to-violet-800' },
                  { icon: '🔧', title: 'Predictive Maintenance Basics', reason: 'New module — be first in your company', dur: '1h', grad: 'from-red-500 to-rose-800' },
                ].map((r, i) => (
                  <motion.div key={i} {...stagger(i + 9)} className="p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                    style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                    <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${r.grad} flex items-center justify-center text-4xl mb-3`}>{r.icon}</div>
                    <h4 className="font-semibold text-sm mb-1" style={{ fontFamily: 'Poppins' }}>{r.title}</h4>
                    <p className="text-xs mb-3" style={{ color: T.text2 }}>{r.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: T.text2 }}>⏱️ {r.dur}</span>
                      <button className="text-xs font-medium" style={{ color: T.gold }}>Start Course →</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ COURSES ============ */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <input placeholder="Search courses..." className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text1 }}
                onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} />
              <div className="flex gap-1.5">
                {CAT_FILTERS.map(f => (
                  <button key={f} onClick={() => setCourseFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: courseFilter === f ? T.gold : T.elevated, color: courseFilter === f ? '#000' : T.text2, border: `1px solid ${courseFilter === f ? T.gold : T.border}` }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredCourses.map((c, i) => (
                <motion.div key={c.id} {...stagger(i)} className="rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
                  onClick={() => setOpenCourse(c)}>
                  <div className={`relative h-28 bg-gradient-to-br ${c.thumbGrad} flex items-center justify-center text-4xl`}>
                    {c.icon}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: c.catColor, color: '#000' }}>{c.catLabel}</span>
                    {c.completed && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: T.success, color: '#000' }}>✅ COMPLETED</span>}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm mb-1" style={{ fontFamily: 'Poppins' }}>{c.title}</h4>
                    <p className="text-xs mb-3 line-clamp-1" style={{ color: T.text2 }}>{c.desc}</p>
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: T.text2 }}>
                      <span>⏱️ {c.duration}</span>
                      <span>📚 {c.modules} modules</span>
                      <span>{'⭐'.repeat(c.difficulty)}</span>
                    </div>
                    {c.progress > 0 && !c.completed && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: T.elevated }}>
                          <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDim})` }} />
                        </div>
                        <span className="text-xs" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>{c.progress}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: T.text2 }}>👥 {c.enrolled} enrolled</span>
                      {!c.completed && c.progress === 0 && <button className="text-xs font-medium" style={{ color: T.gold }}>Start Course →</button>}
                      {!c.completed && c.progress > 0 && <button className="text-xs font-medium" style={{ color: T.gold }}>Continue →</button>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ============ CERTIFICATIONS ============ */}
        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Poppins' }}>Your Certificates</h3>

            {/* Earned */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'FUNDAMENTALS', level: 'Level 1', name: 'Hassan Al-Rashid', company: 'Atlas Concrete Morocco', date: 'January 15, 2025', id: 'TBOS-CERT-F-2847', score: 94, color: T.certBronze },
                { title: 'QUALITY PROFESSIONAL', level: '', name: 'Hassan Al-Rashid', company: 'Atlas Concrete Morocco', date: 'February 3, 2025', id: 'TBOS-CERT-Q-2848', score: 98, color: '#3B82F6' },
              ].map((cert, i) => (
                <motion.div key={i} {...stagger(i)} className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                  <div className="p-6" style={{ borderTop: `3px solid ${T.gold}`, background: `linear-gradient(135deg, ${T.card}, ${T.elevated})` }}>
                    <div className="text-center p-6 rounded-xl" style={{ border: `2px solid ${T.gold}40`, background: `${T.gold}05` }}>
                      <div className="text-3xl mb-2">🏆</div>
                      <p className="text-xs font-bold tracking-[0.15em] mb-1" style={{ color: T.gold }}>TBOS CERTIFIED</p>
                      <div className="w-16 h-px mx-auto mb-2" style={{ background: T.gold }} />
                      <h3 className="text-lg font-bold mb-0.5" style={{ fontFamily: 'Poppins' }}>{cert.title}</h3>
                      {cert.level && <p className="text-xs mb-3" style={{ color: T.text2 }}>{cert.level}</p>}
                      <p className="text-sm font-medium mb-0.5">{cert.name}</p>
                      <p className="text-xs" style={{ color: T.text2 }}>{cert.company}</p>
                      <p className="text-xs mt-2" style={{ color: T.text2 }}>Issued: {cert.date}</p>
                      <p className="text-xs mt-0.5" style={{ fontFamily: 'JetBrains Mono', color: T.text2 }}>ID: {cert.id}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text1 }}>
                        <Download size={14} /> Download PDF
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium"
                        style={{ background: T.linkedin, color: '#fff' }}>
                        <Linkedin size={14} /> Share LinkedIn
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Available Certs */}
            <h3 className="text-lg font-semibold pt-4" style={{ fontFamily: 'Poppins' }}>Certification Paths</h3>
            <div className="space-y-4">
              {[
                { emoji: '🥈', title: 'TBOS Professional', level: 'Level 2', status: 'IN PROGRESS', progress: 67, courses: '4/6 completed', time: '~4 hours', desc: '2 courses remaining', locked: false, color: T.certSilver },
                { emoji: '🥇', title: 'TBOS Expert', level: 'Level 3', status: 'LOCKED', progress: 0, courses: '0/10 completed', time: '~20 hours', desc: 'Most sought-after certification in MENA concrete industry', locked: true, color: T.certGold },
                { emoji: '🏆', title: 'TBOS Master', level: 'Level 4', status: 'LOCKED', progress: 0, courses: 'Requires Level 3 + 1 year', time: '', desc: 'Less than 50 people worldwide hold this certification', locked: true, color: T.gold },
              ].map((cp, i) => (
                <motion.div key={i} {...stagger(i + 2)} className="p-5 rounded-xl relative overflow-hidden"
                  style={{ background: T.card, border: `1px solid ${cp.locked ? T.border : `${cp.color}40`}`, boxShadow: '0 4px 24px rgba(0,0,0,0.5)', opacity: cp.locked ? 0.7 : 1 }}>
                  {cp.title === 'TBOS Master' && !cp.locked && (
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(45deg, transparent 40%, ${T.gold}08 50%, transparent 60%)`, animation: 'shimmer 3s infinite' }} />
                  )}
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{cp.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold" style={{ fontFamily: 'Poppins' }}>{cp.title}</h4>
                        <span className="text-xs" style={{ color: T.text2 }}>{cp.level}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: cp.status === 'IN PROGRESS' ? `${T.warning}20` : T.elevated, color: cp.status === 'IN PROGRESS' ? T.warning : T.text2, border: `1px solid ${cp.status === 'IN PROGRESS' ? `${T.warning}40` : T.border}` }}>
                          {cp.locked && <Lock size={10} className="inline mr-1" />}{cp.status}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: T.text2 }}>{cp.desc}</p>
                      {!cp.locked && (
                        <>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs" style={{ color: T.text2 }}>{cp.courses}</span>
                            {cp.time && <span className="text-xs" style={{ color: T.text2 }}>⏱️ {cp.time}</span>}
                          </div>
                          <div className="h-2 rounded-full mt-2" style={{ background: T.elevated }}>
                            <div className="h-full rounded-full" style={{ width: `${cp.progress}%`, background: `linear-gradient(90deg, ${cp.color}, ${T.goldDim})` }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Why certs matter */}
            <motion.div {...stagger(5)} className="p-5 rounded-xl" style={{ background: T.card, border: `1px solid ${T.gold}40` }}>
              <h4 className="font-bold mb-3" style={{ fontFamily: 'Poppins', color: T.gold }}>Why TBOS Certification Matters</h4>
              <div className="space-y-2">
                {[
                  'Recognized by 50+ concrete producers across MENA',
                  'Average 18% salary increase for certified professionals',
                  'Priority hiring at TBOS customer companies',
                  'Listed on your TBOS public profile',
                  'Verifiable certificate ID for LinkedIn',
                ].map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle size={16} color={T.success} /><span>{v}</span></div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ============ LEADERBOARD ============ */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* My Rank */}
            <motion.div {...stagger(0)} className="p-6 rounded-xl text-center" style={{ background: T.card, border: `1px solid ${T.gold}40`, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>#7</p>
              <p className="text-sm" style={{ color: T.text2 }}>of 1,247 TBOS users globally</p>
              <p className="text-sm mt-2 font-medium" style={{ color: T.gold }}>Top 1% — Elite Learner 🏆</p>
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: T.border }}>
                <div><p className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono' }}>840</p><p className="text-xs" style={{ color: T.text2 }}>XP this month</p></div>
                <div><p className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>2,840</p><p className="text-xs" style={{ color: T.text2 }}>All time</p></div>
              </div>
            </motion.div>

            {/* Filter */}
            <div className="flex gap-1.5">
              {['This Month', 'All Time', 'My Company', 'MENA Region'].map(f => (
                <button key={f} onClick={() => setLbFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: lbFilter === f ? T.gold : T.elevated, color: lbFilter === f ? '#000' : T.text2 }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="grid grid-cols-6 gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: T.text2, borderBottom: `1px solid ${T.border}` }}>
                <span>Rank</span><span>User</span><span>Company</span><span>XP</span><span>Certs</span><span>Badge</span>
              </div>
              {LEADERBOARD.map((u, i) => (
                <motion.div key={i} {...stagger(i)} className="grid grid-cols-6 gap-4 px-4 py-3 items-center text-sm transition-colors"
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    borderLeft: u.rank === 7 ? `3px solid ${T.gold}` : '3px solid transparent',
                    background: u.rank === 7 ? `${T.gold}08` : 'transparent',
                  }}>
                  <span className="font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{u.emoji || ''} {u.rank}</span>
                  <span className="font-medium">{u.name}</span>
                  <span style={{ color: T.text2, fontSize: 13 }}>{u.company}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>{u.xp.toLocaleString()}</span>
                  <span>{u.certs}</span>
                  <span className="text-xs">{u.badge}</span>
                </motion.div>
              ))}
            </div>

            {/* XP Chart */}
            <motion.div {...stagger(11)} className="p-5 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              <h4 className="font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Your XP Over Time — Last 6 Months</h4>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={XP_CHART}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fill: T.text2, fontSize: 12 }} axisLine={{ stroke: T.border }} />
                  <YAxis tick={{ fill: T.text2, fontSize: 12 }} axisLine={{ stroke: T.border }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text1 }} />
                  <Area type="monotone" dataKey="xp" stroke={T.gold} fill="url(#xpGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* CTA */}
            <motion.div {...stagger(12)} className="p-5 rounded-xl text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-sm" style={{ color: T.text2 }}>Learning is contagious — invite your team</p>
              <button className="mt-3 px-6 py-2.5 rounded-xl text-sm font-medium" style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: '#000' }}>
                Invite Your Team →
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* XP Animation */}
      <AnimatePresence>
        {xpAnim && (
          <motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -80 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }} className="fixed bottom-20 left-1/2 -translate-x-1/2 text-2xl font-bold z-50"
            style={{ fontFamily: 'JetBrains Mono', color: T.gold, textShadow: `0 0 20px ${T.gold}60` }}>
            {xpAnim}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
