import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import {
  Home, Factory, Truck, CheckCircle2, User, Plus, ChevronRight,
  Wifi, WifiOff, RefreshCw, Camera, MapPin, Bell, BellOff,
  LogOut, Globe, Package, AlertTriangle, Clock, Fuel, X,
  ChevronDown, ChevronUp, Minus, ArrowRight, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── counter hook ─── */
function useCounter(end: number, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      start = Math.round(end * p);
      setV(start);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, dur]);
  return v;
}

/* ─── haptic helper ─── */
function haptic(ms = 50) {
  try { navigator.vibrate?.(ms); } catch {}
}

/* ─── types ─── */
type Tab = 'home' | 'batches' | 'fleet' | 'quality' | 'profile';

/* ─── mock data ─── */
const BATCHES = [
  { id: 'B-2847', mix: 'C30', volume: 8.0, plant: 'Nord', status: 'mixing' as const, operator: 'Ahmed K.', started: '14 min ago', progress: 78 },
  { id: 'B-2846', mix: 'C25', volume: 6.0, plant: 'Nord', status: 'completed' as const, operator: 'Ahmed K.', started: '37 min ago', progress: 100 },
  { id: 'B-2845', mix: 'C35', volume: 10.0, plant: 'Nord', status: 'completed' as const, operator: 'Youssef M.', started: '1h ago', progress: 100 },
  { id: 'B-2844', mix: 'C30', volume: 7.5, plant: 'Sud', status: 'completed' as const, operator: 'Hassan R.', started: '1h 20m ago', progress: 100 },
  { id: 'B-2843', mix: 'C40', volume: 9.0, plant: 'Nord', status: 'failed' as const, operator: 'Ahmed K.', started: '2h ago', progress: 100 },
  { id: 'B-2842', mix: 'C25', volume: 5.5, plant: 'Sud', status: 'completed' as const, operator: 'Youssef M.', started: '2h 30m ago', progress: 100 },
  { id: 'B-2841', mix: 'C30', volume: 8.0, plant: 'Nord', status: 'pending' as const, operator: 'Unassigned', started: '—', progress: 0 },
  { id: 'B-2840', mix: 'C35', volume: 12.0, plant: 'Nord', status: 'pending' as const, operator: 'Unassigned', started: '—', progress: 0 },
];

const QUALITY_TESTS = [
  { id: 'QT-0412', batch: 'B-2846', slump: 145, temp: 28, result: 'pass' as const, time: '23m ago', photo: true },
  { id: 'QT-0411', batch: 'B-2845', slump: 152, temp: 30, result: 'pass' as const, time: '1h ago', photo: false },
  { id: 'QT-0410', batch: 'B-2844', slump: 148, temp: 27, result: 'pass' as const, time: '1h 20m ago', photo: true },
  { id: 'QT-0409', batch: 'B-2843', slump: 125, temp: 36, result: 'fail' as const, time: '2h ago', photo: true },
  { id: 'QT-0408', batch: 'B-2842', slump: 155, temp: 29, result: 'pass' as const, time: '2h 30m ago', photo: false },
];

const DELIVERIES = [
  { id: 'DEL-0441', mix: 'C30', volume: 8, customer: 'Al Omrane', address: 'Hay Riad, Rabat', eta: 23, distance: 18.4, status: 'in_progress' as const },
  { id: 'DEL-0442', mix: 'C25', volume: 6, customer: 'Addoha Group', address: 'Ain Sebaa, Casablanca', eta: null, distance: 12.0, status: 'pending' as const },
  { id: 'DEL-0443', mix: 'C35', volume: 10, customer: 'ONCF', address: 'Rabat Agdal', eta: null, distance: 22.5, status: 'pending' as const },
];

const ACTIVITIES = [
  { icon: '✅', text: 'Batch #B-2846 completed — C25 / 6m³', time: '23m ago' },
  { icon: '📦', text: 'Material restocked — Cement +2000kg', time: '1h ago' },
  { icon: '✅', text: 'Quality test passed — Slump 145mm', time: '1h ago' },
  { icon: '🚛', text: 'Delivery completed — Al Omrane site', time: '2h ago' },
  { icon: '⚠️', text: 'Mixer MX-002 alert — Reviewed', time: '3h ago' },
];

/* ─── Status badge component ─── */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    mixing: 'bg-[#FFD700]/20 text-[#FFD700]',
    completed: 'bg-[#10B981]/20 text-[#10B981]',
    pending: 'bg-[#B0B8C1]/20 text-[#B0B8C1]',
    failed: 'bg-[#EF4444]/20 text-[#EF4444]',
    pass: 'bg-[#10B981]/20 text-[#10B981]',
    fail: 'bg-[#EF4444]/20 text-[#EF4444]',
    in_progress: 'bg-[#FFD700]/20 text-[#FFD700]',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide', colors[status] || colors.pending)}>
      {status.replace('_', ' ')}
    </span>
  );
}

/* ─── Bottom Sheet component ─── */
function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50" onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#161D26', borderTop: '1px solid #2A3545' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#2A3545]" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h2>
              <button onClick={onClose} className="p-2 rounded-lg active:bg-white/10"><X className="w-5 h-5 text-[#B0B8C1]" /></button>
            </div>
            <div className="px-5 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Number Stepper ─── */
function Stepper({ value, onChange, min = 0.5, max = 20, step = 0.5, label, reference }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string; reference?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-[#B0B8C1]">{label}</label>
      <div className="flex items-center gap-3">
        <button
          onClick={() => { haptic(); onChange(Math.max(min, value - step)); }}
          className="w-14 h-14 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: '#1C2533', border: '1px solid #2A3545' }}
        >
          <Minus className="w-5 h-5 text-[#B0B8C1]" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-3xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
        </div>
        <button
          onClick={() => { haptic(); onChange(Math.min(max, value + step)); }}
          className="w-14 h-14 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: '#1C2533', border: '1px solid #2A3545' }}
        >
          <Plus className="w-5 h-5 text-[#B0B8C1]" />
        </button>
      </div>
      {reference && <p className="text-xs text-[#FFD700] text-center">{reference}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function MobileField() {
  const [tab, setTab] = useState<Tab>('home');
  const { isOnline } = useOfflineSync();
  const { lang, setLang, t } = useI18n();
  const isRTL = lang === 'ar';

  // Batch filter
  const [batchFilter, setBatchFilter] = useState('all');
  // Sheets
  const [newBatchOpen, setNewBatchOpen] = useState(false);
  const [newTestOpen, setNewTestOpen] = useState(false);
  // New batch form
  const [batchMix, setBatchMix] = useState('C30');
  const [batchVolume, setBatchVolume] = useState(8.0);
  // Quality test form
  const [testSlump, setTestSlump] = useState(150);
  const [testTemp, setTestTemp] = useState(28);
  const [testAir, setTestAir] = useState(5.5);
  const [testInspection, setTestInspection] = useState<'pass' | 'marginal' | 'fail' | null>(null);

  // Counters
  const batchCount = useCounter(47);
  const deliveryCount = useCounter(8);
  const qualityCount = useCounter(12);

  const filteredBatches = BATCHES.filter(b => {
    if (batchFilter === 'all') return true;
    if (batchFilter === 'mine') return b.operator === 'Ahmed K.';
    if (batchFilter === 'progress') return b.status === 'mixing';
    if (batchFilter === 'completed') return b.status === 'completed';
    if (batchFilter === 'today') return true;
    return true;
  });

  const handleStartBatch = () => {
    haptic(100);
    setNewBatchOpen(false);
    toast.success(`✅ Batch #B-2848 Started — ${batchMix} / ${batchVolume}m³`, { duration: 3000 });
  };

  const handleSubmitTest = () => {
    haptic(100);
    setNewTestOpen(false);
    if (testInspection === 'fail') {
      toast.error('❌ FAILED — Supervisor notified', { duration: 4000 });
    } else {
      toast.success('✅ PASSED — Quality test recorded', { duration: 3000 });
    }
  };

  const handleMarkDelivered = () => {
    haptic(200);
    toast.success('✅ Delivery DEL-0441 Confirmed', { duration: 3000 });
  };

  /* ─── TAB CONTENT ─── */
  const renderHome = () => (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Good morning, <span className="text-[#FFD700]">Ahmed</span> 👋
        </h1>
        <p className="text-sm text-[#B0B8C1]">Casablanca North · Shift starts 06:00</p>
      </div>

      {/* Summary cards - horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
        {[
          { label: 'Batches Today', value: `${batchCount} / 60`, color: '#FFD700' },
          { label: 'My Deliveries', value: `${deliveryCount} completed`, color: '#10B981' },
          { label: 'Quality Tests', value: `${qualityCount} passed`, color: '#10B981' },
          { label: 'Alerts', value: '2 pending', color: '#EF4444' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="snap-start shrink-0 w-40 rounded-xl p-3"
            style={{ background: '#161D26', border: '1px solid #2A3545' }}
          >
            <p className="text-xs text-[#B0B8C1] mb-1">{card.label}</p>
            <p className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: card.color }}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { haptic(); setNewBatchOpen(true); }}
          className="h-16 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-black active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)' }}
        >
          <Plus className="w-5 h-5" /> New Batch
        </button>
        <button
          onClick={() => { haptic(); setNewTestOpen(true); }}
          className="h-16 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: '#161D26', border: '1px solid #FFD700' }}
        >
          <CheckCircle2 className="w-5 h-5 text-[#FFD700]" /> Quality Test
        </button>
        <button
          onClick={() => { haptic(); setTab('fleet'); }}
          className="h-16 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: '#161D26', border: '1px solid #FFD700' }}
        >
          <Truck className="w-5 h-5 text-[#FFD700]" /> Start Delivery
        </button>
        <button
          onClick={() => haptic()}
          className="h-16 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: '#161D26', border: '1px solid #EF4444' }}
        >
          <Bell className="w-5 h-5 text-[#EF4444]" /> Report Issue
        </button>
      </div>

      {/* Active Batch */}
      {BATCHES.find(b => b.status === 'mixing') && (() => {
        const batch = BATCHES.find(b => b.status === 'mixing')!;
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={{ background: '#161D26', border: '1px solid #2A3545', borderLeft: '4px solid #FFD700' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#FFD700] text-xs font-bold uppercase tracking-wider">🟡 Batch In Progress</span>
            </div>
            <p className="text-white font-bold">Batch #{batch.id} · {batch.mix} · {batch.volume} m³</p>
            <p className="text-sm text-[#B0B8C1] mb-3">Started: {batch.started}</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-[#B0B8C1]">MIXING</span>
              <div className="flex-1 h-2 rounded-full bg-[#1C2533] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${batch.progress}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-[#FFD700]"
                />
              </div>
              <span className="text-sm font-bold text-[#FFD700]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{batch.progress}%</span>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 h-14 rounded-xl text-sm font-bold text-white active:scale-95" style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
                View Details
              </button>
              <button
                onClick={() => { haptic(100); toast.success('✅ Batch #B-2847 Completed'); }}
                className="flex-1 h-14 rounded-xl text-sm font-bold text-black active:scale-95"
                style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)' }}
              >
                Complete
              </button>
            </div>
          </motion.div>
        );
      })()}

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-bold text-[#B0B8C1] uppercase tracking-wider mb-3">Recent Activity</h2>
        <div className="space-y-1">
          {ACTIVITIES.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="flex items-start gap-3 py-3 px-3 rounded-lg"
              style={{ background: i === 0 ? '#161D2680' : 'transparent' }}
            >
              <span className="text-lg mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{a.text}</p>
                <p className="text-xs text-[#B0B8C1]">{a.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBatches = () => (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {['all', 'mine', 'progress', 'completed', 'today'].map(f => (
          <button
            key={f}
            onClick={() => { haptic(); setBatchFilter(f); }}
            className={cn(
              'shrink-0 px-4 h-10 rounded-full text-sm font-medium transition-colors capitalize',
              batchFilter === f ? 'bg-[#FFD700] text-black' : 'bg-[#1C2533] text-[#B0B8C1]'
            )}
          >
            {f === 'mine' ? 'My Batches' : f === 'progress' ? 'In Progress' : f}
          </button>
        ))}
      </div>

      {/* Batch cards */}
      <div className="space-y-3">
        {filteredBatches.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-4 active:scale-[0.98] transition-transform"
            style={{ background: '#161D26', border: '1px solid #2A3545' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.id}</span>
              <StatusBadge status={b.status} />
            </div>
            <p className="text-sm text-[#B0B8C1]">{b.mix} Mix · {b.volume} m³ · Plant: {b.plant}</p>
            <p className="text-xs text-[#B0B8C1] mt-1">{b.status !== 'pending' ? `Started ${b.started}` : 'Pending'} · {b.operator}</p>
            {b.status === 'mixing' && (
              <div className="mt-2 h-1.5 rounded-full bg-[#1C2533] overflow-hidden">
                <div className="h-full rounded-full bg-[#FFD700]" style={{ width: `${b.progress}%` }} />
              </div>
            )}
          </motion.div>
        ))}
        {filteredBatches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#B0B8C1] mb-2">No batches found 👷</p>
            <button onClick={() => setNewBatchOpen(true)} className="text-[#FFD700] text-sm font-bold">Start your first batch →</button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { haptic(); setNewBatchOpen(true); }}
        className="fixed bottom-24 right-4 w-16 h-16 rounded-full flex items-center justify-center z-40 active:scale-90 transition-transform"
        style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)', boxShadow: '0 4px 16px rgba(255,215,0,0.3)' }}
      >
        <Plus className="w-7 h-7 text-black" />
      </button>
    </div>
  );

  const renderFleet = () => (
    <div className="space-y-4">
      {/* My Truck */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4"
        style={{ background: '#161D26', border: '1px solid #2A3545', borderTop: '3px solid #FFD700' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-6 h-6 text-[#FFD700]" />
          <div>
            <p className="text-white font-bold">TRK-007 · <span className="text-[#B0B8C1] font-normal">Your Truck</span></p>
            <p className="text-sm text-[#10B981] flex items-center gap-1">🟢 AVAILABLE</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 rounded-lg" style={{ background: '#1C2533' }}>
            <p className="text-xs text-[#B0B8C1]">Today</p>
            <p className="font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>8 deliveries · 240 km</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: '#1C2533' }}>
            <p className="text-xs text-[#B0B8C1]">Fuel</p>
            <div className="flex items-center gap-2 justify-center">
              <div className="flex-1 h-2 rounded-full bg-[#2A3545] max-w-[80px]">
                <div className="h-full rounded-full bg-[#10B981]" style={{ width: '78%' }} />
              </div>
              <span className="text-sm font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>78%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Delivery */}
      {DELIVERIES.filter(d => d.status === 'in_progress').map(d => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-4"
          style={{ background: '#161D26', border: '1px solid #FFD700', borderLeft: '4px solid #FFD700' }}
        >
          <span className="text-[#FFD700] text-xs font-bold uppercase tracking-wider">🟡 Delivery In Progress</span>
          <p className="text-white font-bold mt-1">{d.id} · {d.mix} · {d.volume}m³</p>
          <p className="text-sm text-[#B0B8C1] flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {d.address}</p>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xs text-[#B0B8C1]">ETA</p>
              <p className="text-3xl font-bold text-[#FFD700]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.eta} min</p>
            </div>
            <div>
              <p className="text-xs text-[#B0B8C1]">Distance</p>
              <p className="text-lg font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.distance} km</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="flex-1 h-14 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white active:scale-95"
              style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
              <MapPin className="w-5 h-5" /> Open Maps
            </button>
            <button
              onClick={handleMarkDelivered}
              className="flex-1 h-14 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-black active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)' }}
            >
              <CheckCircle2 className="w-5 h-5" /> Mark Delivered
            </button>
          </div>
        </motion.div>
      ))}

      {/* Delivery Queue */}
      <div>
        <h2 className="text-sm font-bold text-[#B0B8C1] uppercase tracking-wider mb-3">Remaining Deliveries</h2>
        <div className="space-y-3">
          {DELIVERIES.filter(d => d.status === 'pending').map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="rounded-xl p-4"
              style={{ background: '#161D26', border: '1px solid #2A3545' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.id}</span>
                <StatusBadge status="pending" />
              </div>
              <p className="text-sm text-[#B0B8C1]">{d.customer} · {d.mix} · {d.volume}m³</p>
              <p className="text-xs text-[#B0B8C1] mt-1"><MapPin className="w-3 h-3 inline" /> {d.address}</p>
              <button
                onClick={() => { haptic(); toast.success(`🚛 Delivery ${d.id} Started`); }}
                className="w-full h-14 mt-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: '#1C2533', border: '1px solid #FFD700' }}
              >
                Start Delivery
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuality = () => (
    <div className="space-y-4">
      {/* Today's Strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {[
          { label: 'Tests Done', value: '12 / 15', color: '#FFD700' },
          { label: 'Passed', value: '12 / 100%', color: '#10B981' },
          { label: 'Failed', value: '0 🟢', color: '#10B981' },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="shrink-0 w-36 rounded-xl p-3"
            style={{ background: '#161D26', border: '1px solid #2A3545' }}
          >
            <p className="text-xs text-[#B0B8C1]">{c.label}</p>
            <p className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: c.color }}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* New Quality Test Button */}
      <button
        onClick={() => { haptic(); setNewTestOpen(true); }}
        className="w-full h-20 rounded-xl flex items-center justify-center gap-2 text-base font-bold text-black active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)' }}
      >
        <Plus className="w-6 h-6" /> New Quality Test
      </button>

      {/* Test History */}
      <div>
        <h2 className="text-sm font-bold text-[#B0B8C1] uppercase tracking-wider mb-3">Recent Tests</h2>
        <div className="space-y-3">
          {QUALITY_TESTS.map((qt, i) => (
            <motion.div
              key={qt.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-xl p-4"
              style={{ background: '#161D26', border: '1px solid #2A3545' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{qt.id}</span>
                <StatusBadge status={qt.result} />
              </div>
              <p className="text-sm text-[#B0B8C1]">Batch {qt.batch} · {qt.time}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-[#B0B8C1]">Slump: <strong className="text-white">{qt.slump}mm</strong></span>
                <span className="text-xs text-[#B0B8C1]">Temp: <strong className="text-white">{qt.temp}°C</strong></span>
                {qt.photo && <span className="text-xs text-[#FFD700]">📷</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-5">
      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{ background: '#161D26', border: '1px solid #2A3545' }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-black" style={{ background: '#FFD700' }}>AK</div>
        <div>
          <p className="text-white font-bold text-lg">Ahmed Karimi</p>
          <p className="text-sm text-[#B0B8C1]">Plant Operator</p>
          <p className="text-xs text-[#FFD700]">Casablanca North</p>
        </div>
      </motion.div>

      {/* Language Selector */}
      <div>
        <h3 className="text-sm font-bold text-[#B0B8C1] uppercase tracking-wider mb-2">Language / اللغة / Langue</h3>
        <div className="space-y-2">
          {([
            { code: 'en' as const, flag: '🇬🇧', label: 'English' },
            { code: 'fr' as const, flag: '🇫🇷', label: 'Français' },
            { code: 'ar' as const, flag: '🇲🇦', label: 'العربية' },
          ]).map(l => (
            <button
              key={l.code}
              onClick={() => { haptic(); setLang(l.code); }}
              className={cn(
                'w-full h-16 rounded-xl flex items-center justify-center gap-3 text-base font-bold active:scale-95 transition-all',
                lang === l.code
                  ? 'bg-[#FFD700] text-black'
                  : 'text-white'
              )}
              style={lang !== l.code ? { background: '#1C2533', border: '1px solid #2A3545' } : undefined}
            >
              <span className="text-xl">{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-sm font-bold text-[#B0B8C1] uppercase tracking-wider mb-2">My Stats This Month</h3>
        <div className="rounded-xl overflow-hidden" style={{ background: '#161D26', border: '1px solid #2A3545' }}>
          {[
            { label: 'Batches Supervised', value: '284' },
            { label: 'Quality Tests', value: '156' },
            { label: 'Deliveries', value: '48' },
            { label: 'Issues Reported', value: '3' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center justify-between px-4 py-3" style={i < 3 ? { borderBottom: '1px solid #2A3545' } : undefined}>
              <span className="text-sm text-[#B0B8C1]">{s.label}</span>
              <span className="font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Status */}
      <div className="rounded-xl p-4" style={{ background: '#161D26', border: '1px solid #2A3545' }}>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">📡 Sync Status</h3>
        <div className="space-y-2 text-sm text-[#B0B8C1]">
          <p>Last synced: <strong className="text-white">2 min ago</strong></p>
          <p>Pending uploads: <strong className="text-white">0</strong></p>
          <p>Cached data: <strong className="text-white">4.2 MB</strong></p>
        </div>
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => { haptic(); toast.success('✅ All synced!'); }}
            className="flex-1 h-12 rounded-xl text-sm font-bold text-white active:scale-95"
            style={{ background: '#1C2533', border: '1px solid #FFD700' }}
          >
            🔄 Sync Now
          </button>
          <button className="flex-1 h-12 rounded-xl text-sm font-bold text-[#B0B8C1] active:scale-95" style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
            Clear Cache
          </button>
        </div>
      </div>

      {/* Offline Ready */}
      <div className="rounded-xl p-4" style={{ background: '#10B98110', border: '1px solid #10B98130' }}>
        <h3 className="text-sm font-bold text-[#10B981] mb-2">📦 Offline Mode Ready</h3>
        <div className="space-y-1.5 text-sm text-[#B0B8C1]">
          {['Batch data (last 7 days)', 'Quality test forms', 'Delivery information', 'Equipment status', 'Profile and settings'].map(item => (
            <p key={item}>✅ {item}</p>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-sm font-bold text-[#B0B8C1] uppercase tracking-wider mb-2">Notifications</h3>
        <div className="rounded-xl overflow-hidden" style={{ background: '#161D26', border: '1px solid #2A3545' }}>
          {[
            { label: '🔔 New batch assignments', on: true, locked: false },
            { label: '🚨 Quality failures', on: true, locked: true },
            { label: '🚛 Delivery alerts', on: true, locked: false },
            { label: '🔧 Maintenance reminders', on: false, locked: false },
          ].map((n, i) => (
            <div key={n.label} className="flex items-center justify-between px-4 py-3.5" style={i < 3 ? { borderBottom: '1px solid #2A3545' } : undefined}>
              <span className="text-sm text-white">{n.label}</span>
              <div className={cn(
                'w-12 h-7 rounded-full flex items-center p-0.5 transition-colors',
                n.on ? 'bg-[#10B981] justify-end' : 'bg-[#2A3545] justify-start',
                n.locked && 'opacity-60'
              )}>
                <div className="w-6 h-6 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <button className="w-full h-14 rounded-xl text-sm font-bold text-[#EF4444] active:scale-95 transition-transform"
        style={{ border: '1px solid #EF4444' }}>
        <LogOut className="w-4 h-4 inline mr-2" /> Sign Out
      </button>
    </div>
  );

  const TABS: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'batches', icon: Factory, label: 'Batches' },
    { id: 'fleet', icon: Truck, label: 'Fleet' },
    { id: 'quality', icon: CheckCircle2, label: 'Quality' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: '#0F1419' }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Gold shimmer bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #FFD700, transparent 30%, transparent 70%, #FFD700)' }} />

      {/* Status Bar */}
      <header className="flex items-center justify-between px-4 h-11 shrink-0" style={{ background: '#161D26', borderBottom: '1px solid #2A3545' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-black" style={{ background: '#FFD700' }}>T</div>
          <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest" style={{ fontFamily: "'Poppins', sans-serif" }}>Field</span>
        </div>
        <span className="text-xs text-[#B0B8C1]">Casablanca North</span>
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-xs text-[#10B981]">Synced</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-xs text-[#EF4444]">Offline</span>
            </>
          )}
        </div>
      </header>

      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 text-xs overflow-hidden"
            style={{ background: '#EF444415', borderBottom: '1px solid #EF444440', color: '#F59E0B' }}
          >
            📡 Offline — showing data from last sync (2 min ago). Actions will sync when connected.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {tab === 'home' && renderHome()}
            {tab === 'batches' && renderBatches()}
            {tab === 'fleet' && renderFleet()}
            {tab === 'quality' && renderQuality()}
            {tab === 'profile' && renderProfile()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 flex items-stretch z-50" style={{ background: '#161D26', borderTop: '1px solid #2A3545' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { haptic(); setTab(t.id); }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative active:scale-95 transition-transform"
            >
              {active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b-full bg-[#FFD700]" />}
              <Icon className={cn('w-6 h-6 transition-colors', active ? 'text-[#FFD700]' : 'text-[#B0B8C1]')} />
              <span className={cn('text-[11px] font-medium transition-colors', active ? 'text-[#FFD700]' : 'text-[#B0B8C1]')}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ─── Bottom Sheets ─── */}
      <BottomSheet open={newBatchOpen} onClose={() => setNewBatchOpen(false)} title="New Batch">
        <div className="space-y-5">
          <div>
            <label className="text-sm text-[#B0B8C1] block mb-1">Mix Type</label>
            <div className="grid grid-cols-4 gap-2">
              {['C25', 'C30', 'C35', 'C40'].map(m => (
                <button
                  key={m}
                  onClick={() => { haptic(); setBatchMix(m); }}
                  className={cn(
                    'h-14 rounded-xl text-sm font-bold transition-colors',
                    batchMix === m ? 'bg-[#FFD700] text-black' : 'text-white'
                  )}
                  style={batchMix !== m ? { background: '#1C2533', border: '1px solid #2A3545' } : undefined}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Stepper label="Volume (m³)" value={batchVolume} onChange={setBatchVolume} min={0.5} max={20} step={0.5} />
          <div>
            <label className="text-sm text-[#B0B8C1] block mb-1">Plant</label>
            <div className="h-14 rounded-xl flex items-center px-4 text-sm text-[#B0B8C1]" style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
              Casablanca North (auto)
            </div>
          </div>
          <div>
            <label className="text-sm text-[#B0B8C1] block mb-1">Customer</label>
            <input className="w-full h-14 rounded-xl px-4 text-sm text-white outline-none placeholder:text-[#B0B8C1]/50 focus:border-[#FFD700] transition-colors"
              style={{ background: '#1C2533', border: '1px solid #2A3545' }} placeholder="Search customer..." />
          </div>
          <div>
            <label className="text-sm text-[#B0B8C1] block mb-1">Notes (optional)</label>
            <textarea className="w-full h-20 rounded-xl p-3 text-sm text-white outline-none resize-none placeholder:text-[#B0B8C1]/50 focus:border-[#FFD700] transition-colors"
              style={{ background: '#1C2533', border: '1px solid #2A3545' }} placeholder="Add notes..." />
          </div>
          {!isOnline && <p className="text-xs text-[#F59E0B] text-center">📡 Will sync when connected</p>}
          <button onClick={handleStartBatch} className="w-full h-16 rounded-xl text-base font-bold text-black active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)' }}>
            Start Batch
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={newTestOpen} onClose={() => setNewTestOpen(false)} title="New Quality Test">
        <div className="space-y-5">
          <div>
            <label className="text-sm text-[#B0B8C1] block mb-1">Batch ID</label>
            <div className="flex gap-2">
              <input className="flex-1 h-14 rounded-xl px-4 text-sm text-white outline-none placeholder:text-[#B0B8C1]/50 focus:border-[#FFD700] transition-colors"
                style={{ background: '#1C2533', border: '1px solid #2A3545' }} placeholder="Enter or scan batch ID" defaultValue="B-2847" />
              <button className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
                <Camera className="w-5 h-5 text-[#FFD700]" />
              </button>
            </div>
          </div>
          <Stepper label="Slump (mm)" value={testSlump} onChange={setTestSlump} min={50} max={250} step={5} reference="Target: 140–160mm" />
          <Stepper label="Temperature (°C)" value={testTemp} onChange={setTestTemp} min={10} max={50} step={1} reference="Max: 35°C" />
          <Stepper label="Air Content (%)" value={testAir} onChange={setTestAir} min={0} max={12} step={0.5} reference="Target: 4–7%" />

          <div>
            <label className="text-sm text-[#B0B8C1] block mb-2">Visual Inspection</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'pass' as const, label: '✅ PASS', active: 'bg-[#10B981] text-white' },
                { v: 'marginal' as const, label: '⚠️ MARGINAL', active: 'bg-[#F59E0B] text-black' },
                { v: 'fail' as const, label: '❌ FAIL', active: 'bg-[#EF4444] text-white' },
              ]).map(opt => (
                <button
                  key={opt.v}
                  onClick={() => { haptic(); setTestInspection(opt.v); }}
                  className={cn(
                    'h-16 rounded-xl text-xs font-bold transition-colors',
                    testInspection === opt.v ? opt.active : 'text-white'
                  )}
                  style={testInspection !== opt.v ? { background: '#1C2533', border: '1px solid #2A3545' } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full h-16 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#B0B8C1] active:scale-95"
            style={{ background: '#1C2533', border: '2px dashed #2A3545' }}>
            <Camera className="w-5 h-5" /> Add Photo
          </button>

          {!isOnline && <p className="text-xs text-[#F59E0B] text-center">📡 Test saved — will sync when connected</p>}
          <button onClick={handleSubmitTest} className="w-full h-16 rounded-xl text-base font-bold text-black active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)' }}>
            Submit Test
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
