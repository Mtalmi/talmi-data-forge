import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";

/* ─── tiny counter hook ─── */
function useCounter(end: number, dur = 1200, prefix = "", suffix = "") {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      start = Math.round(end * (1 - Math.pow(1 - p, 3)));
      setV(start);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, dur]);
  return `${prefix}${v.toLocaleString()}${suffix}`;
}

/* ─── sparkline component ─── */
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const d = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={d}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── custom tooltip ─── */
function GoldTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#FFD700]/30 bg-[#161D26] px-3 py-2 text-xs shadow-xl">
      <p className="text-[#B0B8C1] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-semibold">{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
}

/* ─── data ─── */
const plants = ["All Plants", "Casablanca North", "Rabat Central", "Marrakech", "Tangier"];

const equipmentData: Record<string, { name: string; overall: number; units: { id: string; type: string; health: number; status: string; nextService: string }[] }> = {
  "Casablanca North": {
    name: "Casablanca North", overall: 82,
    units: [
      { id: "MX-001", type: "Concrete Mixer", health: 91, status: "Operational", nextService: "45 days" },
      { id: "MX-002", type: "Concrete Mixer", health: 88, status: "Operational", nextService: "38 days" },
      { id: "MX-003", type: "Concrete Mixer", health: 23, status: "CRITICAL", nextService: "Immediate" },
      { id: "PMP-001", type: "Water Pump", health: 76, status: "Monitor", nextService: "12 days" },
      { id: "CNV-001", type: "Conveyor Belt", health: 94, status: "Operational", nextService: "60 days" },
      { id: "WGH-001", type: "Weighbridge", health: 89, status: "Operational", nextService: "55 days" },
    ],
  },
  "Rabat Central": {
    name: "Rabat Central", overall: 94,
    units: [
      { id: "MX-004", type: "Concrete Mixer", health: 95, status: "Operational", nextService: "52 days" },
      { id: "MX-005", type: "Concrete Mixer", health: 92, status: "Operational", nextService: "40 days" },
      { id: "PMP-002", type: "Water Pump", health: 96, status: "Operational", nextService: "58 days" },
      { id: "CNV-003", type: "Conveyor Belt", health: 91, status: "Operational", nextService: "47 days" },
      { id: "WGH-002", type: "Weighbridge", health: 93, status: "Operational", nextService: "50 days" },
      { id: "SLO-001", type: "Silo System", health: 97, status: "Operational", nextService: "65 days" },
    ],
  },
  "Marrakech": {
    name: "Marrakech", overall: 78,
    units: [
      { id: "MX-007", type: "Concrete Mixer", health: 85, status: "Operational", nextService: "30 days" },
      { id: "MX-008", type: "Concrete Mixer", health: 68, status: "Monitor", nextService: "8 days" },
      { id: "CNV-002", type: "Conveyor Belt", health: 71, status: "Monitor", nextService: "15 days" },
      { id: "PMP-003", type: "Water Pump", health: 88, status: "Operational", nextService: "42 days" },
      { id: "WGH-003", type: "Weighbridge", health: 82, status: "Operational", nextService: "35 days" },
    ],
  },
  "Tangier": {
    name: "Tangier", overall: 91,
    units: [
      { id: "MX-011", type: "Concrete Mixer", health: 90, status: "Operational", nextService: "48 days" },
      { id: "MX-012", type: "Concrete Mixer", health: 93, status: "Operational", nextService: "55 days" },
      { id: "PMP-004", type: "Water Pump", health: 89, status: "Operational", nextService: "40 days" },
      { id: "CNV-004", type: "Conveyor Belt", health: 92, status: "Operational", nextService: "50 days" },
    ],
  },
};

const predictions = [
  { risk: "critical", unit: "MX-003", type: "Concrete Mixer", plant: "Casablanca North", days: 3, failure: "Bearing Seizure", confidence: 94, downtime: 8, cost: 85000 },
  { risk: "high", unit: "PMP-001", type: "Water Pump", plant: "Casablanca North", days: 12, failure: "Seal Degradation", confidence: 78, downtime: 3, cost: 22000 },
  { risk: "medium", unit: "CNV-002", type: "Conveyor Belt", plant: "Marrakech Plant", days: 28, failure: "Belt Tension Loss", confidence: 71, downtime: 2, cost: 14000 },
];

const sensors = [
  { name: "Vibration", unit: "mm/s", value: 12.4, status: "HIGH", normal: "<6.0", color: "#EF4444", data: [3.8, 4.0, 4.2, 4.1, 4.5, 4.8, 5.0, 5.2, 5.1, 5.5, 5.8, 6.0, 6.2, 6.8, 7.2, 7.8, 8.5, 9.2, 10.0, 12.4] },
  { name: "Temperature", unit: "°C", value: 87, status: "ELEVATED", normal: "<65", color: "#F59E0B", data: [58, 59, 60, 60, 61, 62, 63, 63, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 85, 87] },
  { name: "Current Draw", unit: "A", value: 48.2, status: "HIGH", normal: "<42", color: "#F59E0B", data: [38, 38, 39, 39, 40, 40, 41, 41, 42, 42, 43, 43, 44, 44, 45, 46, 47, 47, 48, 48.2] },
  { name: "Oil Pressure", unit: "bar", value: 2.1, status: "CRITICAL", normal: ">3.5", color: "#FF2D2D", data: [4.2, 4.1, 4.0, 4.0, 3.9, 3.8, 3.7, 3.6, 3.5, 3.4, 3.3, 3.1, 3.0, 2.9, 2.8, 2.6, 2.5, 2.3, 2.2, 2.1] },
  { name: "Noise Level", unit: "dB", value: 78, status: "ELEVATED", normal: "<65", color: "#F59E0B", data: [60, 61, 61, 62, 62, 63, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76, 78] },
  { name: "Rotation Speed", unit: "RPM", value: 1847, status: "NORMAL", normal: "1800-1900", color: "#10B981", data: [1850, 1848, 1852, 1847, 1849, 1851, 1848, 1850, 1847, 1849, 1851, 1848, 1850, 1847, 1849, 1851, 1848, 1850, 1847, 1847] },
];

const vibTempData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  vibration: i < 22 ? 4.2 + i * 0.12 + Math.random() * 0.3 : 6.5 + (i - 22) * 0.8 + Math.random() * 0.5,
  temperature: 58 + i * 1.0 + Math.random() * 1.5,
}));

const scheduleData = [
  { unit: "MX-003", plant: "Casablanca N.", type: "Emergency Repair", date: "ASAP 🔴", assigned: "Unassigned", parts: "⏳ Pending", status: "CRITICAL" },
  { unit: "PMP-001", plant: "Casablanca N.", type: "Preventive", date: "Mar 8, 2025", assigned: "Ahmed K.", parts: "✅ Ordered", status: "Scheduled" },
  { unit: "MX-007", plant: "Marrakech", type: "Routine Service", date: "Mar 12, 2025", assigned: "Hassan M.", parts: "✅ In Stock", status: "Scheduled" },
  { unit: "CNV-002", plant: "Marrakech", type: "Belt Inspection", date: "Mar 18, 2025", assigned: "TBD", parts: "—", status: "AI Recommended" },
  { unit: "WGH-002", plant: "Rabat", type: "Calibration", date: "Mar 20, 2025", assigned: "Said A.", parts: "—", status: "Scheduled" },
  { unit: "MX-011", plant: "Tangier", type: "Routine Service", date: "Mar 25, 2025", assigned: "TBD", parts: "—", status: "Due" },
  { unit: "PMP-003", plant: "Rabat", type: "Filter Replace", date: "Mar 28, 2025", assigned: "Hassan M.", parts: "✅ In Stock", status: "Scheduled" },
  { unit: "CNV-001", plant: "Casablanca N.", type: "Annual Inspect", date: "Apr 2, 2025", assigned: "TBD", parts: "—", status: "Upcoming" },
];

const roiQuarters = [
  { q: "Q2 2024", savings: 180, cost: 3 },
  { q: "Q3 2024", savings: 220, cost: 3 },
  { q: "Q4 2024", savings: 195, cost: 3 },
  { q: "Q1 2025", savings: 284, cost: 3 },
];

const maintenanceHistory = [
  { time: "87 days ago", type: "Routine Service", tech: "Ahmed K.", note: "All checks passed", color: "#10B981" },
  { time: "180 days ago", type: "Belt Replacement", tech: "Hassan M.", note: "Belt replaced, bearings checked OK", color: "#10B981" },
  { time: "290 days ago", type: "Emergency Repair", tech: "Said A.", note: "Cooling system flush", color: "#F59E0B" },
  { time: "365 days ago", type: "Annual Service", tech: "Full inspection", note: "All systems operational", color: "#10B981" },
];

/* ─── animation helpers ─── */
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function PredictiveMaintenance() {
  const [activePlant, setActivePlant] = useState("All Plants");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>("MX-003");
  const [reportState, setReportState] = useState<"idle" | "loading" | "done">("idle");
  const [exportState, setExportState] = useState<"idle" | "loading" | "done">("idle");
  const [scheduleModal, setScheduleModal] = useState<string | null>(null);
  const [stockTooltip, setStockTooltip] = useState<string | null>(null);

  const handleReport = () => {
    setReportState("loading");
    setTimeout(() => { setReportState("done"); setTimeout(() => setReportState("idle"), 2000); }, 1500);
  };
  const handleExport = () => {
    setExportState("loading");
    setTimeout(() => { setExportState("done"); setTimeout(() => setExportState("idle"), 2000); }, 1500);
  };

  const filteredPlants = activePlant === "All Plants"
    ? Object.values(equipmentData)
    : [equipmentData[activePlant]].filter(Boolean);

  const healthColor = (h: number) => h > 80 ? "#10B981" : h > 50 ? "#F59E0B" : "#EF4444";
  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      CRITICAL: "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30",
      "AI Recommended": "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30",
      Scheduled: "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30",
      Due: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
      Upcoming: "bg-[#B0B8C1]/10 text-[#B0B8C1] border-[#B0B8C1]/30",
    };
    return map[s] || "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30";
  };

  return (
    <div className="min-h-screen text-white relative" style={{ background: "#0F1419", backgroundImage: "radial-gradient(rgba(255,215,0,0.02) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      {/* Gold shimmer bar */}
      <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, #FFD700, transparent 40%, transparent 60%, #FFD700)" }} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3545]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFD700] flex items-center justify-center font-bold text-black text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>T</div>
          <span className="text-[#FFD700] text-sm font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: "Poppins, sans-serif" }}>Predictive Maintenance</span>
        </div>
        <div className="flex items-center gap-1">
          {plants.map(p => (
            <button key={p} onClick={() => setActivePlant(p)} className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${activePlant === p ? "text-[#FFD700] border-b-2 border-[#FFD700]" : "text-[#B0B8C1] hover:text-white"}`}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!alertDismissed && (
            <button className="px-3 py-1.5 text-xs rounded-lg bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 animate-pulse">🔴 2 Critical Alerts</button>
          )}
          <button onClick={handleExport} className="px-4 py-1.5 text-xs rounded-lg font-semibold text-black" style={{ background: "linear-gradient(135deg, #FFD700, #B8960C)" }}>
            {exportState === "loading" ? "Generating..." : exportState === "done" ? "✅ Exported!" : "Export Schedule"}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Critical alert banner */}
        {!alertDismissed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-5 py-4 flex items-center justify-between" style={{ animation: "pulse 2s ease-in-out infinite" }}>
            <p className="text-sm"><span className="font-semibold text-[#EF4444]">🚨 CRITICAL:</span> <span className="text-[#B0B8C1]">Mixer Unit MX-003 (Casablanca North) — Bearing failure predicted in 3 days. Immediate inspection required.</span></p>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedEquipment("MX-003")} className="px-3 py-1 text-xs rounded-lg bg-[#EF4444] text-white">View Details →</button>
              <button onClick={() => setAlertDismissed(true)} className="text-[#B0B8C1] hover:text-white text-lg">×</button>
            </div>
          </motion.div>
        )}

        {/* KPI Strip */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-5 gap-4">
          {[
            { label: "Equipment Monitored", val: 38, suffix: " units", sub: "Across 4 plants", icon: "🏭", border: "#FFD700" },
            { label: "Health Score", val: 87, suffix: "/100", sub: "▲ 3pts this month", icon: "💚", border: "#10B981" },
            { label: "Predicted Failures (30d)", val: 3, suffix: "", sub: "Action required", icon: "⚠️", border: "#F59E0B" },
            { label: "Downtime Prevented", val: 284, prefix: "$", suffix: "K", sub: "This quarter", icon: "💰", border: "#FFD700" },
            { label: "Maintenance Due", val: 7, suffix: " units", sub: "Next 14 days", icon: "🔧", border: "#3B82F6" },
          ].map((k, i) => (
            <motion.div key={i} variants={fadeUp} className="rounded-xl border border-[#2A3545] bg-[#161D26] p-4 hover:border-[#FFD700]/50 hover:-translate-y-0.5 transition-all duration-200" style={{ borderTop: `3px solid ${k.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#B0B8C1] text-xs">{k.label}</span>
                <span className="text-lg">{k.icon}</span>
              </div>
              <p className="text-2xl font-semibold text-white" style={{ fontFamily: "JetBrains Mono, monospace" }}>{useCounter(k.val, 1200, k.prefix || "", k.suffix)}</p>
              <p className="text-xs text-[#B0B8C1] mt-1">{k.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Equipment Health Map */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border border-[#2A3545] bg-[#161D26] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Equipment Health — Live Overview</h2>
              <p className="text-xs text-[#B0B8C1] mt-1">AI-monitored across all plants · Updated 2 min ago <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] ml-1 animate-pulse" /></p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {filteredPlants.map((plant, pi) => (
              <motion.div key={plant.name} variants={fadeUp} className="rounded-xl border border-[#2A3545] bg-[#1C2533] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{plant.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#B0B8C1]">Overall:</span>
                    <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: healthColor(plant.overall), color: healthColor(plant.overall), fontFamily: "JetBrains Mono, monospace" }}>{plant.overall}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-5 text-[10px] text-[#B0B8C1] uppercase tracking-wider pb-1 border-b border-[#2A3545]">
                    <span>Unit</span><span>Type</span><span>Health</span><span>Status</span><span>Next Service</span>
                  </div>
                  {plant.units.map(u => (
                    <div key={u.id} onClick={() => setSelectedEquipment(u.id)} className="grid grid-cols-5 items-center text-xs py-1.5 hover:bg-[#FFD700]/5 rounded cursor-pointer transition-colors">
                      <span className="font-mono text-[#FFD700]">{u.id}</span>
                      <span className="text-[#B0B8C1]">{u.type}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#1C2533] overflow-hidden">
                          <div className={`h-full rounded-full ${u.health < 30 ? "animate-pulse" : ""}`} style={{ width: `${u.health}%`, backgroundColor: healthColor(u.health) }} />
                        </div>
                        <span className="font-mono text-[10px] w-8 text-right" style={{ color: healthColor(u.health) }}>{u.health}%</span>
                      </div>
                      <span className={`text-[10px] ${u.status === "CRITICAL" ? "text-[#EF4444] font-bold animate-pulse" : u.status === "Monitor" ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                        {u.status === "CRITICAL" ? "🔴" : u.status === "Monitor" ? "🟡" : "🟢"} {u.status}
                      </span>
                      <span className="text-[#B0B8C1]">{u.nextService}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Failure Predictions */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border border-[#2A3545] bg-[#161D26] p-5" style={{ borderTop: "3px solid #FFD700", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>AI Failure Predictions</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" /> AI
            </span>
            <span className="text-xs text-[#B0B8C1] ml-auto">ML models trained on 2.3M equipment data points across MENA</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {predictions.map((p, i) => {
              const riskColors = { critical: { border: "#EF4444", bg: "rgba(239,68,68,0.06)", text: "#EF4444", label: "🔴 CRITICAL RISK" }, high: { border: "#F59E0B", bg: "rgba(245,158,11,0.04)", text: "#F59E0B", label: "🟠 HIGH RISK" }, medium: { border: "#F59E0B", bg: "rgba(245,158,11,0.03)", text: "#F59E0B", label: "🟡 MEDIUM RISK" } };
              const rc = riskColors[p.risk as keyof typeof riskColors];
              return (
                <motion.div key={i} variants={fadeUp} className="rounded-xl border border-[#2A3545] p-5 hover:border-[#FFD700]/40 transition-all duration-200" style={{ borderTop: `3px solid ${rc.border}`, background: rc.bg, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
                  <p className="text-xs font-bold mb-3" style={{ color: rc.text }}>{rc.label}</p>
                  <p className="font-semibold text-sm">{p.unit} — {p.type}</p>
                  <p className="text-xs text-[#B0B8C1] mb-4">{p.plant}</p>
                  <p className="text-xs text-[#B0B8C1] uppercase tracking-wider mb-1">Failure Predicted In:</p>
                  <p className={`text-5xl font-bold mb-4 ${p.risk === "critical" ? "animate-pulse" : ""}`} style={{ fontFamily: "JetBrains Mono, monospace", color: rc.text, textShadow: p.risk === "critical" ? `0 0 30px ${rc.text}40` : "none" }}>
                    {p.days} <span className="text-lg">DAYS</span>
                  </p>
                  <div className="space-y-1.5 text-xs text-[#B0B8C1]">
                    <p>Failure Type: <span className="text-white">{p.failure}</span></p>
                    <p>Confidence: <span className="text-white font-mono">{p.confidence}%</span></p>
                    <p>Est. Downtime if ignored: <span className="text-[#EF4444] font-mono">{p.downtime} days</span></p>
                    <p>Est. Cost if ignored: <span className="text-[#EF4444] font-mono">${p.cost.toLocaleString()}</span></p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setScheduleModal(p.unit)} className="px-3 py-1.5 text-xs rounded-lg bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 hover:bg-[#FFD700]/20 transition-colors">🔧 Schedule Repair</button>
                    <button onClick={() => setSelectedEquipment(p.unit)} className="px-3 py-1.5 text-xs rounded-lg bg-[#1C2533] text-[#B0B8C1] border border-[#2A3545] hover:text-white transition-colors">📋 Details</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Total Impact */}
          <div className="mt-5 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 p-4 flex items-center justify-between">
            <p className="text-sm">By acting on these 3 predictions now, you prevent an estimated <span className="font-bold text-[#FFD700] font-mono">$121,000</span> in downtime costs and <span className="font-bold text-[#FFD700] font-mono">13 days</span> of lost production.</p>
            <button className="px-5 py-2 text-xs rounded-lg font-semibold text-black whitespace-nowrap" style={{ background: "linear-gradient(135deg, #FFD700, #B8960C)" }}>Schedule All Repairs →</button>
          </div>
        </motion.div>

        {/* Equipment Deep Dive */}
        {selectedEquipment === "MX-003" && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border border-[#2A3545] bg-[#161D26] p-5 space-y-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>MX-003 — Concrete Mixer · Casablanca North</h2>
                <p className="text-xs text-[#B0B8C1] mt-1">Unit age: 4.2 years · Total batches: 18,420 · Last service: 87 days ago</p>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 animate-pulse">🔴 CRITICAL</span>
            </div>

            {/* Info strip */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Health Score", val: "23/100", color: "#EF4444" },
                { label: "Days Since Service", val: "87", color: "#F59E0B" },
                { label: "Operating Hours", val: "6,847 hrs", color: "#B0B8C1" },
                { label: "Batches Since Service", val: "2,340", color: "#B0B8C1" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-[#1C2533] border border-[#2A3545] p-3 text-center">
                  <p className="text-xs text-[#B0B8C1] mb-1">{s.label}</p>
                  <p className="text-xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Sensor readings */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Sensor Readings — Vital Signs</h3>
              <div className="grid grid-cols-3 gap-3">
                {sensors.map((s, i) => (
                  <div key={i} className="rounded-lg bg-[#1C2533] border border-[#2A3545] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#B0B8C1]">{s.name} ({s.unit})</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.status === "NORMAL" ? "bg-[#10B981]/15 text-[#10B981]" : s.status === "CRITICAL" ? "bg-[#FF2D2D]/15 text-[#FF2D2D]" : "bg-[#F59E0B]/15 text-[#F59E0B]"}`}>
                        {s.status === "CRITICAL" ? "🔴" : s.status === "NORMAL" ? "✅" : "⚠️"} {s.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold mb-1" style={{ fontFamily: "JetBrains Mono, monospace", color: s.color }}>{s.value.toLocaleString()}</p>
                    <Sparkline data={s.data} color={s.color} />
                    <p className="text-[10px] text-[#B0B8C1] mt-1">Normal: {s.normal}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vibration & Temperature trend chart */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Vibration & Temperature — 30 Day Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vibTempData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3545" />
                  <XAxis dataKey="day" tick={{ fill: "#B0B8C1", fontSize: 10 }} interval={4} />
                  <YAxis yAxisId="left" tick={{ fill: "#B0B8C1", fontSize: 10 }} label={{ value: "Vibration (mm/s)", angle: -90, position: "insideLeft", fill: "#B0B8C1", fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#B0B8C1", fontSize: 10 }} label={{ value: "Temperature (°C)", angle: 90, position: "insideRight", fill: "#B0B8C1", fontSize: 10 }} />
                  <Tooltip content={<GoldTooltip />} />
                  <ReferenceArea yAxisId="left" y1={0} y2={6} fill="#10B981" fillOpacity={0.06} />
                  <ReferenceLine yAxisId="left" y={6} stroke="#EF4444" strokeDasharray="5 5" label={{ value: "Threshold", fill: "#EF4444", fontSize: 10 }} />
                  <ReferenceLine x="Day 22" stroke="#FFD700" strokeDasharray="3 3" label={{ value: "AI Alert", fill: "#FFD700", fontSize: 10, position: "top" }} />
                  <Line yAxisId="left" type="monotone" dataKey="vibration" stroke="#EF4444" strokeWidth={2} dot={false} name="Vibration" />
                  <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#F59E0B" strokeWidth={2} dot={false} name="Temperature" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* AI Diagnosis */}
            <div className="rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 p-5">
              <h3 className="text-sm font-bold text-[#FFD700] mb-3">🤖 AI DIAGNOSIS</h3>
              <div className="space-y-3 text-sm text-[#B0B8C1]">
                <div>
                  <p className="font-semibold text-white mb-1">Root Cause:</p>
                  <p>Bearing wear pattern consistent with inadequate lubrication combined with overload operation (detected 23% above rated capacity in last 14 days).</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Recommended Action:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Stop unit immediately for inspection</li>
                    <li>Replace main drive bearing (Part #BRG-7842)</li>
                    <li>Check lubrication system — likely blocked feed line</li>
                    <li>Reduce batch load to 85% capacity for 2 weeks post-repair</li>
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Spare Parts Required:</p>
                  <div className="space-y-1">
                    <p>• Main Drive Bearing (BRG-7842) — <button onMouseEnter={() => setStockTooltip("BRG-7842")} onMouseLeave={() => setStockTooltip(null)} className="text-[#FFD700] hover:underline relative">
                      Check stock →
                      {stockTooltip === "BRG-7842" && <span className="absolute bottom-full left-0 mb-1 px-2 py-1 rounded bg-[#1C2533] border border-[#2A3545] text-[10px] text-[#10B981] whitespace-nowrap">2 in stock at Casablanca warehouse ✅</span>}
                    </button></p>
                    <p>• Lubrication Feed Kit (LUB-221) — <button onMouseEnter={() => setStockTooltip("LUB-221")} onMouseLeave={() => setStockTooltip(null)} className="text-[#FFD700] hover:underline relative">
                      Check stock →
                      {stockTooltip === "LUB-221" && <span className="absolute bottom-full left-0 mb-1 px-2 py-1 rounded bg-[#1C2533] border border-[#2A3545] text-[10px] text-[#10B981] whitespace-nowrap">1 in stock at Casablanca warehouse ✅</span>}
                    </button></p>
                  </div>
                </div>
                <div className="flex gap-8 text-xs pt-2 border-t border-[#2A3545]">
                  <p>Estimated Repair Time: <span className="text-white font-mono">6-8 hours</span></p>
                  <p>Estimated Cost: <span className="text-[#10B981] font-mono">$3,200</span></p>
                  <p>Cost if ignored: <span className="text-[#EF4444] font-mono">$85,000+</span></p>
                </div>
              </div>
            </div>

            {/* Maintenance History */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Maintenance History — MX-003</h3>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-[#2A3545]" />
                {maintenanceHistory.map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2" style={{ borderColor: h.color, backgroundColor: `${h.color}30` }} />
                    <div className="ml-2">
                      <p className="text-xs text-[#B0B8C1]">{h.time}</p>
                      <p className="text-sm font-semibold">{h.type} <span className="text-xs text-[#B0B8C1] font-normal">— by {h.tech}</span></p>
                      <p className="text-xs text-[#B0B8C1]">"{h.note}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Maintenance Schedule */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border border-[#2A3545] bg-[#161D26] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Upcoming Maintenance Schedule</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#B0B8C1] text-[10px] uppercase tracking-wider border-b border-[#2A3545]">
                  <th className="text-left py-2 px-3">Unit</th>
                  <th className="text-left py-2 px-3">Plant</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Assigned To</th>
                  <th className="text-left py-2 px-3">Parts</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((s, i) => (
                  <tr key={i} className="border-b border-[#2A3545]/50 hover:bg-[#FFD700]/5 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#FFD700]">{s.unit}</td>
                    <td className="py-2.5 px-3 text-[#B0B8C1]">{s.plant}</td>
                    <td className="py-2.5 px-3">{s.type}</td>
                    <td className="py-2.5 px-3 font-mono">{s.date}</td>
                    <td className="py-2.5 px-3 text-[#B0B8C1]">{s.assigned}</td>
                    <td className="py-2.5 px-3">{s.parts}</td>
                    <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => setScheduleModal(s.unit)} className={`px-2 py-1 rounded text-[10px] border ${s.status === "CRITICAL" ? "border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10" : "border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"} transition-colors`}>
                        {s.status === "CRITICAL" ? "Assign" : s.assigned === "TBD" ? "Schedule" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ROI Tracker */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border border-[#FFD700]/30 bg-[#161D26] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Predictive Maintenance ROI — This Quarter</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Savings breakdown */}
            <div className="rounded-lg bg-[#1C2533] border border-[#2A3545] p-5 font-mono text-sm" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              <div className="space-y-2 text-[#B0B8C1]">
                <p>Failures Prevented: <span className="text-white float-right">4</span></p>
                <p>Downtime Days Avoided: <span className="text-white float-right">18 days</span></p>
                <div className="border-t border-[#2A3545] my-3" />
                <p className="text-white font-semibold">Cost Savings Breakdown:</p>
                <p className="pl-3">Labor (avoided): <span className="text-white float-right">$48,000</span></p>
                <p className="pl-3">Parts (emergency): <span className="text-white float-right">$82,000</span></p>
                <p className="pl-3">Lost Production: <span className="text-white float-right">$124,000</span></p>
                <p className="pl-3">Customer Penalties: <span className="text-white float-right">$30,000</span></p>
                <div className="border-t border-[#2A3545] my-3" />
                <p className="text-lg font-bold text-[#FFD700]">TOTAL SAVED: <span className="float-right">$284,000</span></p>
                <div className="border-t border-[#2A3545] my-3" />
                <p>Module Cost (Q1): <span className="float-right text-white">$3,000</span></p>
                <p className="text-2xl font-bold text-[#FFD700] mt-2">ROI: <span className="float-right">94.7x</span></p>
              </div>
            </div>

            {/* Chart */}
            <div>
              <p className="text-xs text-[#B0B8C1] mb-3">Savings vs Module Cost (Quarterly)</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={roiQuarters} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3545" />
                  <XAxis dataKey="q" tick={{ fill: "#B0B8C1", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#B0B8C1", fontSize: 11 }} tickFormatter={v => `$${v}K`} />
                  <Tooltip content={<GoldTooltip />} />
                  <Bar dataKey="savings" fill="#FFD700" radius={[4, 4, 0, 0]} name="Savings ($K)" />
                  <Bar dataKey="cost" fill="#B0B8C1" radius={[4, 4, 0, 0]} name="Cost ($K)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button onClick={handleReport} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-black" style={{ background: "linear-gradient(135deg, #FFD700, #B8960C)" }}>
            {reportState === "loading" ? "📊 Generating..." : reportState === "done" ? "✅ Report ready — link copied!" : "📊 Generate Board Report — Show your CFO the ROI"}
          </button>
        </motion.div>

        {/* Testimonial */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl border-l-4 border-[#FFD700] bg-[#161D26] border border-t-[#2A3545] border-r-[#2A3545] border-b-[#2A3545] p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <p className="text-sm italic text-[#B0B8C1] leading-relaxed">
            "TBOS predicted a bearing failure in MX-003 eleven days before it happened. We avoided 8 days of downtime and $85,000 in losses. The module paid for itself <span className="text-[#FFD700] font-semibold">28 times over</span> in Q1 alone."
          </p>
          <p className="text-sm font-semibold text-[#FFD700] mt-3">— Hassan Al-Rashid, Atlas Concrete Morocco</p>
        </motion.div>
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setScheduleModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-[#2A3545] bg-[#161D26] p-6 w-[420px] space-y-4" onClick={e => e.stopPropagation()} style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
            <h3 className="font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>Schedule Repair — {scheduleModal}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#B0B8C1] block mb-1">Urgency</label>
                <select className="w-full bg-[#1C2533] border border-[#2A3545] rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none">
                  <option>🔴 Critical — Immediate</option>
                  <option>🟠 High — Within 48h</option>
                  <option>🟡 Medium — This Week</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#B0B8C1] block mb-1">Technician</label>
                <select className="w-full bg-[#1C2533] border border-[#2A3545] rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none">
                  <option>Ahmed K.</option>
                  <option>Hassan M.</option>
                  <option>Said A.</option>
                  <option>External Contractor</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#B0B8C1] block mb-1">Scheduled Date</label>
                <input type="date" className="w-full bg-[#1C2533] border border-[#2A3545] rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setScheduleModal(null); }} className="flex-1 py-2 rounded-lg text-xs font-semibold text-black" style={{ background: "linear-gradient(135deg, #FFD700, #B8960C)" }}>Confirm & Create Work Order</button>
              <button onClick={() => setScheduleModal(null)} className="px-4 py-2 rounded-lg text-xs text-[#B0B8C1] border border-[#2A3545] hover:text-white transition-colors">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600&family=Poppins:wght@700&family=Inter:wght@400;500&display=swap');
      `}</style>
    </div>
  );
}
