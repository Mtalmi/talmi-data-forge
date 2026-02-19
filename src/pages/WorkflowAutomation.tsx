import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Zap, RefreshCw, Clock, CheckCircle, Search, Plus, Play, Save,
  MoreHorizontal, ChevronDown, X, Settings2, FileText, Mail, MessageSquare,
  Phone, AlertTriangle, Truck, Package, DollarSign, Users, Link2, Filter as FilterIcon,
  Bell, Calendar, ClipboardList, Upload, ArrowRight, Copy, ZoomIn, ZoomOut, Maximize2,
  ToggleLeft, ToggleRight, Share2
} from 'lucide-react';

/* ─── Animated Counter ─── */
function AnimNum({ target, decimals = 0, duration = 1200 }: { target: number; decimals?: number; duration?: number }) {
  const [val, setVal] = useState('0');
  const raf = useRef<number>();
  useEffect(() => {
    if (!target) { setVal(target.toFixed(decimals)); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal((e * target).toFixed(decimals));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, decimals]);
  return <>{val}</>;
}

/* ─── Toast ─── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border-l-4 border-[#FFD700] shadow-2xl"
      style={{ background: '#161D26', border: '1px solid #2A3545', borderLeft: '4px solid #FFD700' }}>
      <span className="text-white text-sm font-medium">{message}</span>
    </motion.div>
  );
}

/* ─── Data ─── */
const workflows = [
  { id: 1, name: 'Daily Production Report', status: 'active', bar: 'gold', desc: 'Sends comprehensive production summary to management team every morning', trigger: '⏰ Schedule', actions: ['📊 Generate Report', '📧 Email Team', '💬 Slack Notify'], lastRun: 'Today 06:00', nextRun: 'Tomorrow 06:00', runs: 847, success: 100 },
  { id: 2, name: 'Quality Failure Escalation', status: 'active', bar: 'blue', desc: 'Instantly alerts supervisors when batch quality falls below threshold', trigger: '🔴 Quality Alert', actions: ['📱 SMS Manager', '🎫 Create Ticket', '📋 Log Incident'], lastRun: '2h ago', nextRun: 'On trigger', runs: 23, success: 100 },
  { id: 3, name: 'Equipment Maintenance Alert', status: 'active', bar: 'blue', desc: 'Schedules maintenance when equipment performance degrades', trigger: '⚡ Performance Drop', actions: ['📅 Schedule Service', '🔧 Order Parts', '📧 Notify Tech'], lastRun: '1d ago', nextRun: 'On trigger', runs: 156, success: 98.7 },
  { id: 4, name: 'Low Material Reorder', status: 'active', bar: 'blue', desc: 'Automatically creates purchase orders when raw materials hit reorder point', trigger: '📦 Stock Alert', actions: ['📋 Create PO', '📧 Email Supplier', '💬 Notify Procurement'], lastRun: '3h ago', nextRun: 'On trigger', runs: 89, success: 100 },
  { id: 5, name: 'Weekly KPI Digest', status: 'active', bar: 'gold', desc: 'Monday morning executive summary with week-over-week performance', trigger: '⏰ Monday 07:00', actions: ['📊 Compile KPIs', '📄 Generate PDF', '📧 Email Executives'], lastRun: 'Mon 07:00', nextRun: 'Mon 07:00', runs: 52, success: 100 },
  { id: 6, name: 'Delivery Delay Notification', status: 'active', bar: 'blue', desc: 'Alerts customers and dispatchers when delivery will be late', trigger: '🚛 ETA Exceeded', actions: ['📱 SMS Customer', '📧 Email Dispatcher', '📋 Update CRM'], lastRun: '45m ago', nextRun: 'On trigger', runs: 312, success: 99.4 },
  { id: 7, name: 'End of Day Plant Summary', status: 'active', bar: 'gold', desc: 'Plant manager receives full shift summary at end of each working day', trigger: '⏰ 18:00 Daily', actions: ['📊 Batch Summary', '🔍 Flag Issues', '📧 Email Plant Mgr'], lastRun: 'Yesterday 18:00', nextRun: 'Today 18:00', runs: 284, success: 100 },
  { id: 8, name: 'Compliance Check', status: 'active', bar: 'gold', desc: 'Weekly compliance and certification status check across all plants', trigger: '⏰ Friday 16:00', actions: ['🔍 Audit Check', '📋 Generate Report', '📧 Email Compliance'], lastRun: 'Fri 16:00', nextRun: 'Fri 16:00', runs: 48, success: 100 },
  { id: 9, name: 'New Customer Onboarding', status: 'active', bar: 'green', desc: 'Automated welcome sequence when new customer account is created', trigger: '👤 New Customer', actions: ['📧 Welcome Email', '📚 Send Guides', '🎫 Assign CSM'], lastRun: '2d ago', nextRun: 'On trigger', runs: 54, success: 100 },
  { id: 10, name: 'High-Value Order Alert', status: 'active', bar: 'green', desc: 'Notifies sales team instantly when order exceeds $50,000', trigger: '💰 Order >$50K', actions: ['📱 SMS Sales Lead', '📧 Email Director', '📋 Priority Flag'], lastRun: '5d ago', nextRun: 'On trigger', runs: 12, success: 100 },
  { id: 11, name: 'Monthly Cost Analysis', status: 'paused', bar: 'gold', desc: 'Deep cost breakdown report — paused pending finance review', trigger: '⏰ 1st of Month', actions: ['📊 Cost Analysis', '📄 Excel Export', '📧 Email Finance'], lastRun: 'Mar 1', nextRun: 'Paused', runs: 8, success: 87.5 },
  { id: 12, name: 'Custom API Integration', status: 'draft', bar: 'green', desc: 'Webhook to external ERP system — in development', trigger: '🔗 Webhook', actions: ['🔄 Transform Data', '📤 POST to API', '📋 Log Response'], lastRun: 'Never', nextRun: 'Draft', runs: 0, success: 0 },
];

const executionData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  executions: Math.floor(600 + Math.random() * 300),
}));

const execLog = [
  { status: 'success', workflow: 'Daily Production Report', trigger: 'Scheduled', duration: '2.1s', time: 'Today 06:00' },
  { status: 'success', workflow: 'Delivery Delay Notification', trigger: 'ETA Exceeded', duration: '0.8s', time: 'Today 09:47' },
  { status: 'failed', workflow: 'Custom API Integration', trigger: 'Webhook', duration: '30s', time: 'Today 08:23' },
  { status: 'running', workflow: 'Quality Failure Escalation', trigger: 'Quality Alert', duration: '—', time: 'Now' },
  { status: 'success', workflow: 'Low Material Reorder', trigger: 'Stock Alert', duration: '1.2s', time: 'Yesterday 14:32' },
  { status: 'success', workflow: 'End of Day Plant Summary', trigger: 'Scheduled', duration: '3.4s', time: 'Yesterday 18:00' },
  { status: 'success', workflow: 'Weekly KPI Digest', trigger: 'Scheduled', duration: '4.8s', time: 'Mon 07:00' },
  { status: 'success', workflow: 'Equipment Maintenance Alert', trigger: 'Performance Drop', duration: '1.1s', time: 'Mon 14:20' },
  { status: 'success', workflow: 'High-Value Order Alert', trigger: 'Order Created', duration: '0.6s', time: 'Sun 11:05' },
  { status: 'success', workflow: 'New Customer Onboarding', trigger: 'New Customer', duration: '2.9s', time: 'Sat 09:15' },
  { status: 'success', workflow: 'Compliance Check', trigger: 'Scheduled', duration: '5.2s', time: 'Fri 16:00' },
  { status: 'failed', workflow: 'Monthly Cost Analysis', trigger: 'Scheduled', duration: '12s', time: 'Mar 1 00:05' },
  { status: 'success', workflow: 'Daily Production Report', trigger: 'Scheduled', duration: '2.3s', time: 'Yesterday 06:00' },
  { status: 'success', workflow: 'Delivery Delay Notification', trigger: 'ETA Exceeded', duration: '0.9s', time: 'Yesterday 11:18' },
  { status: 'success', workflow: 'Low Material Reorder', trigger: 'Stock Alert', duration: '1.0s', time: '2d ago' },
  { status: 'success', workflow: 'Quality Failure Escalation', trigger: 'Quality Alert', duration: '0.7s', time: '2d ago' },
  { status: 'success', workflow: 'End of Day Plant Summary', trigger: 'Scheduled', duration: '3.1s', time: '2d ago 18:00' },
  { status: 'success', workflow: 'Daily Production Report', trigger: 'Scheduled', duration: '2.0s', time: '3d ago 06:00' },
  { status: 'success', workflow: 'Equipment Maintenance Alert', trigger: 'Performance Drop', duration: '1.3s', time: '3d ago' },
  { status: 'success', workflow: 'Delivery Delay Notification', trigger: 'ETA Exceeded', duration: '0.8s', time: '3d ago' },
];

const triggerNodes = [
  { icon: '⏰', label: 'Schedule', sub: 'Runs at set time' },
  { icon: '🔴', label: 'Quality Alert', sub: 'When test fails' },
  { icon: '📦', label: 'Stock Low', sub: 'Inventory threshold' },
  { icon: '⚡', label: 'Equipment Alert', sub: 'Performance drop' },
  { icon: '🚛', label: 'Delivery Event', sub: 'Status change' },
  { icon: '💰', label: 'Order Created', sub: 'New order' },
  { icon: '👤', label: 'User Action', sub: 'Manual trigger' },
  { icon: '🔗', label: 'Webhook', sub: 'External system' },
];
const conditionNodes = [
  { icon: '🔀', label: 'If / Else', sub: 'Branch logic' },
  { icon: '🔢', label: 'Value Check', sub: 'Compare numbers' },
  { icon: '⏱️', label: 'Time Window', sub: 'Only run between hours' },
  { icon: '🏭', label: 'Plant Filter', sub: 'Specific plant only' },
];
const actionNodes = [
  { icon: '📧', label: 'Send Email' },
  { icon: '📱', label: 'Send SMS' },
  { icon: '💬', label: 'Slack Message' },
  { icon: '📊', label: 'Generate Report' },
  { icon: '📋', label: 'Create Ticket' },
  { icon: '📅', label: 'Schedule Task' },
  { icon: '📤', label: 'Call Webhook' },
  { icon: '📄', label: 'Export Data' },
  { icon: '🔔', label: 'Push Notification' },
  { icon: '📦', label: 'Create Purchase Order' },
];
const templates = [
  { icon: '⚡', label: 'Quality Escalation', popular: true },
  { icon: '📊', label: 'Daily Report' },
  { icon: '🔧', label: 'Maintenance Alert' },
  { icon: '📦', label: 'Auto Reorder' },
  { icon: '🚛', label: 'Delivery Notification' },
  { icon: '💰', label: 'Executive Summary' },
];

/* ─── Custom Tooltip ─── */
const GoldTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-4 py-2 shadow-xl" style={{ background: '#161D26', border: '1px solid #FFD700', borderRadius: 8 }}>
      <p className="text-xs mb-1" style={{ color: '#B0B8C1' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono font-semibold" style={{ color: '#FFD700', fontSize: 14 }}>{p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

/* ─── Stagger Wrapper ─── */
const Stagger = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className={className}>
    {children}
  </motion.div>
);
const FadeItem = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } }} className={className}>
    {children}
  </motion.div>
);

/* ═══════════════════════════════════════════════ */
/*                MAIN COMPONENT                  */
/* ═══════════════════════════════════════════════ */
export default function WorkflowAutomation() {
  const [tab, setTab] = useState<'workflows' | 'builder' | 'history'>('workflows');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wfStates, setWfStates] = useState<Record<number, string>>({});
  const [toast, setToast] = useState('');
  const [selectedExec, setSelectedExec] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testStep, setTestStep] = useState(-1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [exportState, setExportState] = useState<'idle' | 'generating' | 'done'>('idle');
  const [execStatusFilter, setExecStatusFilter] = useState('all');
  const [execSearch, setExecSearch] = useState('');

  const getStatus = (wf: typeof workflows[0]) => wfStates[wf.id] || wf.status;
  const toggleWf = (id: number, current: string) => {
    const next = current === 'active' ? 'paused' : 'active';
    setWfStates(prev => ({ ...prev, [id]: next }));
    setToast(next === 'active' ? '⚡ Workflow activated' : '⏸️ Workflow paused');
  };

  const barColor = (b: string) => b === 'gold' ? '#FFD700' : b === 'blue' ? '#3B82F6' : '#10B981';
  const statusBadge = (s: string) => {
    if (s === 'active') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: '#10B98120', color: '#10B981' }}>● Active</span>;
    if (s === 'paused') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: '#F59E0B20', color: '#F59E0B' }}>⏸ Paused</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: '#B0B8C120', color: '#B0B8C1' }}>Draft</span>;
  };

  const filtered = workflows.filter(w => {
    const s = getStatus(w);
    if (statusFilter !== 'all' && s !== statusFilter) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredExec = execLog.filter(e => {
    if (execStatusFilter !== 'all' && e.status !== execStatusFilter) return false;
    if (execSearch && !e.workflow.toLowerCase().includes(execSearch.toLowerCase())) return false;
    return true;
  });

  const runTest = () => {
    setTestRunning(true);
    setTestStep(0);
    const steps = 5;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTestStep(i);
      if (i >= steps) { clearInterval(iv); setTimeout(() => { setTestRunning(false); setTestStep(-1); setToast('✅ Test Completed — 3 actions would execute'); }, 400); }
    }, 400);
  };

  const handleExport = () => {
    setExportState('generating');
    setTimeout(() => { setExportState('done'); setTimeout(() => setExportState('idle'), 2000); }, 1500);
  };

  /* ─── Canvas Nodes ─── */
  const canvasNodes = [
    { id: 0, label: 'Quality Test Failed', type: 'trigger', icon: '🔴', x: 50, y: 0 },
    { id: 1, label: 'Severity > High?', type: 'condition', icon: '🔀', x: 50, y: 1 },
    { id: 2, label: 'SMS Manager', type: 'action', icon: '📱', x: 25, y: 2 },
    { id: 3, label: 'Email Supervisor', type: 'action', icon: '📧', x: 75, y: 2 },
    { id: 4, label: 'Create Ticket', type: 'action', icon: '🎫', x: 25, y: 3 },
    { id: 5, label: 'Log to Compliance', type: 'action', icon: '📋', x: 25, y: 4 },
  ];
  const nodeColor = (t: string) => t === 'trigger' ? '#3B82F6' : t === 'condition' ? '#F59E0B' : '#8B5CF6';

  return (
    <div className="min-h-screen text-white relative" style={{
      background: '#0F1419',
      backgroundImage: 'radial-gradient(rgba(255,215,0,0.02) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Gold shimmer bar */}
      <div className="w-full h-[2px]" style={{ background: 'linear-gradient(90deg, #FFD700, transparent 40%, transparent 60%, #FFD700)' }} />

      {/* Top Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#2A3545' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs" style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)', color: '#0F1419' }}>T</div>
          <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#FFD700', fontFamily: "'Poppins', sans-serif" }}>AUTOMATION</span>
        </div>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#1C2533' }}>
          {([['workflows', 'My Workflows'], ['builder', 'Workflow Builder'], ['history', 'Execution History']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              style={{ background: tab === k ? '#161D26' : 'transparent', color: tab === k ? '#FFD700' : '#B0B8C1', borderBottom: tab === k ? '2px solid #FFD700' : '2px solid transparent' }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => setTab('builder')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)', color: '#0F1419' }}>
          <Plus size={16} /> New Workflow
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════ VIEW 1: MY WORKFLOWS ═══════ */}
        {tab === 'workflows' && (
          <motion.div key="wf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-[1400px] mx-auto">
            {/* Stats */}
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Active Workflows', value: 12, sub: 'Running now', icon: <Zap size={18} />, delta: '' },
                { label: 'Executions Today', value: 847, sub: '▲ 12%', icon: <RefreshCw size={18} />, delta: '+12%' },
                { label: 'Hours Saved This Week', value: 47.3, sub: '▲ 8.2 hrs', icon: <Clock size={18} />, delta: '+8.2', decimals: 1 },
                { label: 'Success Rate', value: 99.2, sub: '▲ 0.3%', icon: <CheckCircle size={18} />, delta: '+0.3%', decimals: 1 },
              ].map((s, i) => (
                <FadeItem key={i}>
                  <div className="rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 group cursor-default"
                    style={{ background: '#161D26', border: '1px solid #2A3545', borderTop: '3px solid #FFD700', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#B0B8C1' }}>{s.label}</span>
                      <span style={{ color: '#FFD700' }}>{s.icon}</span>
                    </div>
                    <div className="font-mono text-3xl font-semibold" style={{ color: '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}>
                      <AnimNum target={s.value} decimals={(s as any).decimals || 0} />
                      {s.label === 'Success Rate' ? '%' : ''}
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#10B981' }}>{s.sub}</p>
                  </div>
                </FadeItem>
              ))}
            </Stagger>

            {/* Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B0B8C1' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workflows..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                  style={{ background: '#1C2533', border: '1px solid #2A3545', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#FFD700'} onBlur={e => e.target.style.borderColor = '#2A3545'} />
              </div>
              <div className="flex gap-1">
                {['all', 'active', 'paused', 'draft'].map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                    style={{ background: statusFilter === f ? '#FFD700' : '#1C2533', color: statusFilter === f ? '#0F1419' : '#B0B8C1' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg mb-2" style={{ color: '#B0B8C1' }}>No workflows found</p>
                <button onClick={() => setTab('builder')} className="text-sm font-semibold" style={{ color: '#FFD700' }}>Create your first workflow →</button>
              </div>
            ) : (
              <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map(w => {
                  const s = getStatus(w);
                  return (
                    <FadeItem key={w.id}>
                      <div className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group"
                        style={{ background: '#161D26', border: '1px solid #2A3545', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', display: 'flex' }}>
                        <div className="w-1 flex-shrink-0" style={{ background: barColor(w.bar) }} />
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>{w.name}</h3>
                                {statusBadge(s)}
                              </div>
                              <p className="text-sm" style={{ color: '#B0B8C1' }}>{w.desc}</p>
                            </div>
                            <button onClick={() => toggleWf(w.id, s)} className="flex-shrink-0 ml-3">
                              {s === 'active' ? (
                                <div className="w-10 h-6 rounded-full flex items-center px-0.5 transition-all" style={{ background: '#10B981', boxShadow: '0 0 12px #10B98140' }}>
                                  <div className="w-5 h-5 rounded-full bg-white ml-auto" />
                                </div>
                              ) : (
                                <div className="w-10 h-6 rounded-full flex items-center px-0.5" style={{ background: '#2A3545' }}>
                                  <div className="w-5 h-5 rounded-full bg-white/50" />
                                </div>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap my-3">
                            <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: '#3B82F610', color: '#3B82F6', border: '1px solid #3B82F630' }}>{w.trigger}</span>
                            {w.actions.map((a, i) => (
                              <React.Fragment key={i}>
                                <ArrowRight size={12} style={{ color: '#FFD700' }} />
                                <span className="px-2 py-1 rounded text-xs" style={{ background: '#8B5CF610', color: '#8B5CF6', border: '1px solid #8B5CF630' }}>{a}</span>
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs" style={{ color: '#B0B8C1' }}>
                            <span>Last: <b className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{w.lastRun}</b></span>
                            <span>Next: <b className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{w.nextRun}</b></span>
                            <span>Runs: <b className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{w.runs.toLocaleString()}</b></span>
                            <span>Success: <b className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace", color: w.success >= 99 ? '#10B981' : w.success >= 95 ? '#F59E0B' : '#EF4444' }}>{w.success ? w.success + '%' : '—'}</b></span>
                          </div>
                        </div>
                      </div>
                    </FadeItem>
                  );
                })}
              </Stagger>
            )}

            {/* Impact Widget */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 rounded-xl p-6"
              style={{ background: '#161D26', border: '2px solid #FFD700', boxShadow: '0 0 40px #FFD70010, 0 4px 24px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} style={{ color: '#FFD700' }} />
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#FFD700', fontFamily: "'Poppins', sans-serif" }}>Automation Impact</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#B0B8C1' }}>Hours saved this week</p>
                  <p className="text-3xl font-mono font-semibold" style={{ color: '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}><AnimNum target={47.3} decimals={1} /> hrs</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#B0B8C1' }}>At $35/hr avg labor cost</p>
                  <p className="text-3xl font-mono font-semibold" style={{ color: '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}>$<AnimNum target={1655} /></p>
                  <p className="text-xs" style={{ color: '#B0B8C1' }}>saved this week</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#B0B8C1' }}>Projected annual savings</p>
                  <p className="text-3xl font-mono font-semibold" style={{ color: '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}>$<AnimNum target={86060} /></p>
                  <p className="text-xs" style={{ color: '#B0B8C1' }}>saved this year</p>
                </div>
              </div>
              <button onClick={() => { navigator.clipboard?.writeText('TBOS Automation: 47.3hrs saved this week'); setToast('Link copied! 📋'); }}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)', color: '#0F1419' }}>
                <Share2 size={14} /> Share This Report
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════ VIEW 2: BUILDER ═══════ */}
        {tab === 'builder' && (
          <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="flex h-[calc(100vh-65px)]">
            {/* Left Panel */}
            <div className="w-[280px] flex-shrink-0 overflow-y-auto p-4 border-r" style={{ background: '#161D26', borderColor: '#2A3545' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Building Blocks</h3>

              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#3B82F6' }}>Triggers</p>
              <div className="space-y-1.5 mb-4">
                {triggerNodes.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-grab transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
                    <span>{n.icon}</span><span className="font-medium text-xs">{n.label}</span>
                    <span className="ml-auto text-[10px]" style={{ color: '#B0B8C1' }}>{n.sub}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>Conditions</p>
              <div className="space-y-1.5 mb-4">
                {conditionNodes.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-grab transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
                    <span>{n.icon}</span><span className="font-medium text-xs">{n.label}</span>
                    <span className="ml-auto text-[10px]" style={{ color: '#B0B8C1' }}>{n.sub}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#8B5CF6' }}>Actions</p>
              <div className="space-y-1.5 mb-4">
                {actionNodes.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-grab transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
                    <span>{n.icon}</span><span className="font-medium text-xs">{n.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 mt-6" style={{ color: '#FFD700' }}>Templates</p>
              <div className="space-y-2">
                {templates.map((t, i) => (
                  <div key={i} className="px-3 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                    style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{t.icon}</span><span className="text-xs font-semibold">{t.label}</span>
                      {t.popular && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#FFD70020', color: '#FFD700' }}>★ Popular</span>}
                    </div>
                    <button className="text-[10px] font-semibold" style={{ color: '#FFD700' }}>Use Template →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden" style={{
              backgroundImage: 'radial-gradient(rgba(255,215,0,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}>
              {/* Canvas toolbar */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10" style={{ background: '#0F1419E0', borderBottom: '1px solid #2A3545' }}>
                <input defaultValue="Quality Failure Escalation" className="bg-transparent text-sm font-semibold outline-none px-2 py-1 rounded transition-all"
                  style={{ border: '1px solid transparent', color: '#fff' }} onFocus={e => e.target.style.borderColor = '#FFD700'} onBlur={e => e.target.style.borderColor = 'transparent'} />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: '#10B98120', color: '#10B981' }}>Active</span>
                  <button onClick={runTest} disabled={testRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                    style={{ border: '1px solid #10B981', color: '#10B981' }}>
                    <Play size={12} /> {testRunning ? 'Running...' : 'Test Run'}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)', color: '#0F1419' }}>
                    <Save size={12} /> Save
                  </button>
                </div>
              </div>

              {/* Nodes */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 60 }}>
                <div className="relative" style={{ width: 500, height: 520 }}>
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFD700" />
                      </marker>
                    </defs>
                    {/* Trigger → Condition */}
                    <line x1="250" y1="68" x2="250" y2="100" stroke="#FFD700" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrow)">
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                    </line>
                    {/* Condition → SMS (YES) */}
                    <line x1="200" y1="168" x2="125" y2="200" stroke="#10B981" strokeWidth="2" strokeDasharray="6 4">
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                    </line>
                    {/* Condition → Email (NO) */}
                    <line x1="300" y1="168" x2="375" y2="200" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6 4">
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                    </line>
                    {/* SMS → Ticket */}
                    <line x1="125" y1="268" x2="125" y2="300" stroke="#FFD700" strokeWidth="2" strokeDasharray="6 4">
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                    </line>
                    {/* Ticket → Log */}
                    <line x1="125" y1="368" x2="125" y2="400" stroke="#FFD700" strokeWidth="2" strokeDasharray="6 4">
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                    </line>
                  </svg>

                  {/* YES / NO labels */}
                  <span className="absolute text-[10px] font-bold" style={{ left: 145, top: 178, color: '#10B981' }}>YES</span>
                  <span className="absolute text-[10px] font-bold" style={{ left: 320, top: 178, color: '#EF4444' }}>NO</span>

                  {/* Node cards */}
                  {canvasNodes.map((n, idx) => {
                    const left = n.x === 50 ? 150 : n.x === 25 ? 25 : 275;
                    const top = n.y * 100;
                    const glowing = testRunning && testStep === idx;
                    return (
                      <motion.div key={n.id}
                        onClick={() => setSelectedNode(n.label)}
                        animate={glowing ? { boxShadow: ['0 0 0px #FFD700', '0 0 24px #FFD700', '0 0 0px #FFD700'] } : {}}
                        transition={glowing ? { duration: 0.4 } : {}}
                        className="absolute cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          left, top, width: 200,
                          background: '#1E2A3A', border: '1px solid #2E3F55', borderRadius: 10,
                          borderTop: `3px solid ${nodeColor(n.type)}`,
                          boxShadow: glowing ? '0 0 24px #FFD70060' : '0 2px 12px rgba(0,0,0,0.4)',
                        }}>
                        <div className="px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm">{n.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: nodeColor(n.type) }}>
                              {n.type}
                            </span>
                          </div>
                          <p className="text-xs font-medium">{n.label}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex gap-1.5">
                {[{ icon: <ZoomIn size={14} /> }, { icon: <ZoomOut size={14} /> }, { icon: <Maximize2 size={14} /> }].map((b, i) => (
                  <button key={i} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ background: '#2A3545', color: '#B0B8C1' }}>{b.icon}</button>
                ))}
              </div>
            </div>

            {/* Right Panel - Config */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="w-[320px] flex-shrink-0 overflow-y-auto p-5 border-l" style={{ background: '#161D26', borderColor: '#2A3545' }}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>Configure: {selectedNode}</h3>
                    <button onClick={() => setSelectedNode(null)} className="p-1 rounded" style={{ color: '#B0B8C1' }}><X size={16} /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#B0B8C1' }}>To</label>
                      <div className="flex flex-wrap gap-1 p-2 rounded-lg" style={{ background: '#1C2533', border: '1px solid #2A3545' }}>
                        {['Quality Manager', 'Plant Supervisor'].map(t => (
                          <span key={t} className="px-2 py-1 rounded text-[10px] font-medium" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#B0B8C1' }}>Subject</label>
                      <input defaultValue="⚠️ Quality Failure Alert — {{plant_name}}" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: '#1C2533', border: '1px solid #2A3545', color: '#fff' }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#B0B8C1' }}>Template</label>
                      <select className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none"
                        style={{ background: '#1C2533', border: '1px solid #2A3545', color: '#fff' }}>
                        <option>Quality Alert Email</option>
                        <option>Custom Template</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#B0B8C1' }}>Include</label>
                      <div className="space-y-2">
                        {[['Batch Details', true], ['Quality Scores', true], ['Recommended Actions', true], ['Full Report PDF', false]].map(([l, c]) => (
                          <label key={l as string} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" defaultChecked={c as boolean} className="accent-[#FFD700]" />
                            <span>{l as string}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#B0B8C1' }}>Priority</label>
                      <div className="flex gap-2">
                        {['Normal', 'High', 'Urgent'].map(p => (
                          <label key={p} className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input type="radio" name="priority" defaultChecked={p === 'Urgent'} className="accent-[#EF4444]" />
                            <span style={{ color: p === 'Urgent' ? '#EF4444' : '#fff' }}>{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#B0B8C1' }}>Send immediately</span>
                      <div className="w-10 h-6 rounded-full flex items-center px-0.5" style={{ background: '#10B981' }}>
                        <div className="w-5 h-5 rounded-full bg-white ml-auto" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button className="flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)', color: '#0F1419' }}>Apply Changes</button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{ border: '1px solid #EF4444', color: '#EF4444' }}>Delete</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══════ VIEW 3: EXECUTION HISTORY ═══════ */}
        {tab === 'history' && (
          <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-[1400px] mx-auto">
            <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Executions (30d)', value: 24847, fmt: (v: number) => v.toLocaleString() },
                { label: 'Avg Duration', value: 1.4, suffix: 's', sub: 'Fast' },
                { label: 'Failed', value: 198, sub: '0.8% failure rate', color: '#EF4444' },
              ].map((s, i) => (
                <FadeItem key={i}>
                  <div className="rounded-xl p-5" style={{ background: '#161D26', border: '1px solid #2A3545', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                    <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#B0B8C1' }}>{s.label}</p>
                    <p className="text-3xl font-mono font-semibold" style={{ color: s.color || '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}>
                      <AnimNum target={s.value} decimals={s.suffix ? 1 : 0} />{s.suffix || ''}
                    </p>
                    {s.sub && <p className="text-xs mt-1" style={{ color: s.color || '#10B981' }}>{s.sub}</p>}
                  </div>
                </FadeItem>
              ))}
            </Stagger>

            {/* Chart */}
            <div className="rounded-xl p-5 mb-6" style={{ background: '#161D26', border: '1px solid #2A3545', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Execution Timeline — Last 30 Days</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={executionData}>
                  <defs>
                    <linearGradient id="exGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3545" />
                  <XAxis dataKey="day" tick={{ fill: '#B0B8C1', fontSize: 10 }} axisLine={{ stroke: '#2A3545' }} />
                  <YAxis tick={{ fill: '#B0B8C1', fontSize: 10 }} axisLine={{ stroke: '#2A3545' }} />
                  <Tooltip content={<GoldTooltip />} />
                  <Area type="monotone" dataKey="executions" stroke="#FFD700" strokeWidth={2} fill="url(#exGold)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Filter + Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#161D26', border: '1px solid #2A3545', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#2A3545' }}>
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B0B8C1' }} />
                  <input value={execSearch} onChange={e => setExecSearch(e.target.value)} placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none" style={{ background: '#1C2533', border: '1px solid #2A3545', color: '#fff' }} />
                </div>
                <div className="flex gap-1">
                  {['all', 'success', 'failed', 'running'].map(f => (
                    <button key={f} onClick={() => setExecStatusFilter(f)}
                      className="px-2.5 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all"
                      style={{ background: execStatusFilter === f ? '#FFD700' : '#1C2533', color: execStatusFilter === f ? '#0F1419' : '#B0B8C1' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2A3545' }}>
                      {['Status', 'Workflow', 'Trigger', 'Duration', 'Timestamp', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.06em]" style={{ color: '#B0B8C1' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExec.map((e, i) => (
                      <tr key={i} className="transition-all duration-200 hover:bg-[#1C2533]" style={{ borderBottom: '1px solid #2A354530' }}>
                        <td className="px-5 py-3">
                          {e.status === 'success' && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />}
                          {e.status === 'failed' && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} />}
                          {e.status === 'running' && (
                            <span className="inline-block w-2.5 h-2.5 rounded-full animate-spin" style={{ border: '2px solid #FFD700', borderTopColor: 'transparent' }} />
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium text-xs">{e.workflow}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#B0B8C1' }}>{e.trigger}</td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}>{e.duration}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#B0B8C1' }}>{e.time}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => setSelectedExec(i)}
                            className="text-xs font-semibold transition-all" style={{ color: '#FFD700' }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exec Detail Panel */}
            <AnimatePresence>
              {selectedExec !== null && (
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="fixed top-0 right-0 h-full w-[400px] z-50 overflow-y-auto p-6 border-l"
                  style={{ background: '#161D26', borderColor: '#2A3545', boxShadow: '-8px 0 40px rgba(0,0,0,0.6)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>Execution Details</h3>
                    <button onClick={() => setSelectedExec(null)} className="p-1 rounded" style={{ color: '#B0B8C1' }}><X size={18} /></button>
                  </div>

                  {filteredExec[selectedExec]?.status === 'failed' ? (
                    <div className="space-y-3">
                      {[
                        { step: 'Receive Webhook', status: '✅', time: '0.1s' },
                        { step: 'Transform Data', status: '✅', time: '0.3s' },
                        { step: 'POST to External API', status: '❌', time: '29.6s' },
                        { step: 'Log Response', status: '⏭️', time: 'Skipped' },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#1C2533' }}>
                          <span>{s.status}</span>
                          <span className="text-xs flex-1">{s.step}</span>
                          <span className="font-mono text-[10px]" style={{ color: s.status === '❌' ? '#EF4444' : '#B0B8C1', fontFamily: "'JetBrains Mono', monospace" }}>{s.time}</span>
                        </div>
                      ))}
                      <div className="p-3 rounded-lg mt-3" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
                        <p className="font-mono text-xs" style={{ color: '#EF4444', fontFamily: "'JetBrains Mono', monospace" }}>
                          Error: ECONNREFUSED api.external-erp.ma:443
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: '#B0B8C1' }}>Retry attempts: 3/3</p>
                      </div>
                      <button onClick={() => { setRetrying(true); setTimeout(() => { setRetrying(false); setToast('✅ Retried Successfully'); setSelectedExec(null); }, 1000); }}
                        disabled={retrying}
                        className="w-full py-2.5 rounded-lg text-sm font-bold mt-4 flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'linear-gradient(135deg, #FFD700, #B8960C)', color: '#0F1419' }}>
                        {retrying ? <RefreshCw size={14} className="animate-spin" /> : null}
                        {retrying ? 'Retrying...' : 'Retry Now'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs" style={{ color: '#B0B8C1' }}>Workflow: <b className="text-white">{filteredExec[selectedExec]?.workflow}</b></p>
                      <p className="text-xs" style={{ color: '#B0B8C1' }}>Trigger: <b className="text-white">{filteredExec[selectedExec]?.trigger}</b></p>
                      <p className="text-xs" style={{ color: '#B0B8C1' }}>Duration: <b className="font-mono" style={{ color: '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}>{filteredExec[selectedExec]?.duration}</b></p>
                      <p className="text-xs" style={{ color: '#B0B8C1' }}>Time: <b className="text-white">{filteredExec[selectedExec]?.time}</b></p>
                      <div className="mt-4 space-y-2">
                        {['Trigger received', 'Process data', 'Execute actions', 'Complete'].map((s, i) => (
                          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#1C2533' }}>
                            <span>✅</span><span className="text-xs">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast('')} />}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center py-6 text-[10px]" style={{ color: '#B0B8C130' }}>
        TBOS Workflow Automation Engine · All automation data is processed securely
      </div>
    </div>
  );
}
