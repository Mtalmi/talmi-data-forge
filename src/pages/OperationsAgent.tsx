import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useN8nWorkflow } from "@/hooks/useN8nWorkflow";
import {
  Brain, Zap, Shield, Truck, FileText, Package,
  CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw,
  ChevronRight, ArrowLeft, Wrench, FlaskConical, Moon, Sun,
  Activity, Terminal, Copy, ExternalLink, Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AiBriefing {
  id: string;
  date: string;
  type: "morning_briefing" | "end_of_day_report";
  content: string;
  plant_name: string;
  generated_at: string;
}
interface MaintenanceOrder {
  id: string;
  equipment_name: string;
  risk_level: string;
  failure_type: string;
  predicted_failure_days: number;
  confidence_percent: number;
  recommended_action: string;
  estimated_cost: number;
  ai_analysis: string | null;
  status: string;
  created_at: string;
}
interface PurchaseOrder {
  id: string;
  material_name: string;
  quantity_tons: number;
  estimated_cost: number;
  current_stock_tons: number;
  daily_consumption_tons: number;
  days_remaining: number;
  urgency: string;
  status: string;
  ai_reasoning: string | null;
  created_at: string;
}
interface QualityTicket {
  id: string;
  batch_id: string;
  plant_name: string;
  mix_type: string;
  slump_value: number;
  slump_target: number;
  severity: string;
  ai_analysis: string;
  status: string;
  created_at: string;
}

// ─── Workflow definitions ──────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

const WORKFLOWS = [
  {
    id: "morning_briefing",
    name: "Morning Intelligence Briefing",
    description: "AI analyzes overnight data, generates daily battle plan at 05:45",
    schedule: "Daily 05:45",
    icon: Sun,
    color: "text-yellow-400",
    borderColor: "border-yellow-400/30",
    bgColor: "bg-yellow-400/5",
    webhookPath: "n8n-save-briefing",
    taskType: "morning_brief",
  },
  {
    id: "quality_failure",
    name: "Quality Failure Agent",
    description: "Real-time AI triage on quality failures — root cause + escalation",
    schedule: "On trigger",
    icon: FlaskConical,
    color: "text-blue-400",
    borderColor: "border-blue-400/30",
    bgColor: "bg-blue-400/5",
    webhookPath: "n8n-quality-failure",
    taskType: "quality",
  },
  {
    id: "predictive_maintenance",
    name: "Predictive Maintenance Agent",
    description: "Equipment health scan every 4 hours — predicts failures before they happen",
    schedule: "Every 4h",
    icon: Wrench,
    color: "text-orange-400",
    borderColor: "border-orange-400/30",
    bgColor: "bg-orange-400/5",
    webhookPath: "n8n-maintenance-alert",
    taskType: "maintenance",
  },
  {
    id: "delivery_orchestrator",
    name: "Delivery Orchestrator Agent",
    description: "AI-optimized routes on every delivery — driver instructions via WhatsApp",
    schedule: "On trigger",
    icon: Truck,
    color: "text-green-400",
    borderColor: "border-green-400/30",
    bgColor: "bg-green-400/5",
    webhookPath: "n8n-delivery-event",
    taskType: "supply_chain",
  },
  {
    id: "daily_report",
    name: "End-of-Day Report Agent",
    description: "Full AI operational report at 18:00 — zero human effort",
    schedule: "Daily 18:00",
    icon: Moon,
    color: "text-purple-400",
    borderColor: "border-purple-400/30",
    bgColor: "bg-purple-400/5",
    webhookPath: "n8n-save-briefing",
    taskType: "daily_report",
  },
  {
    id: "reorder_agent",
    name: "Smart Reorder Agent",
    description: "Auto-generates POs when stock drops below threshold — emails supplier",
    schedule: "On trigger",
    icon: Package,
    color: "text-red-400",
    borderColor: "border-red-400/30",
    bgColor: "bg-red-400/5",
    webhookPath: "n8n-inventory-alert",
    taskType: "supply_chain",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    completed: { label: "Completed", cls: "text-green-400 border-green-400/40 bg-green-400/10", icon: CheckCircle2 },
    processing: { label: "Processing", cls: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10", icon: Clock },
    pending: { label: "Pending", cls: "text-blue-400 border-blue-400/40 bg-blue-400/10", icon: Activity },
    failed: { label: "Failed", cls: "text-red-400 border-red-400/40 bg-red-400/10", icon: XCircle },
    open: { label: "Open", cls: "text-orange-400 border-orange-400/40 bg-orange-400/10", icon: AlertTriangle },
    in_progress: { label: "In Progress", cls: "text-blue-400 border-blue-400/40 bg-blue-400/10", icon: Clock },
    pending_approval: { label: "Pending Approval", cls: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10", icon: Clock },
  };
  const s = map[status] || { label: status, cls: "text-muted-foreground border-border bg-muted/10", icon: Activity };
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono font-semibold", s.cls)}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    critical: "text-red-400 border-red-400/40 bg-red-400/10",
    high: "text-orange-400 border-orange-400/40 bg-orange-400/10",
    medium: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
    low: "text-green-400 border-green-400/40 bg-green-400/10",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold uppercase", map[level] || map.medium)}>
      {level}
    </span>
  );
}

function copyWebhookUrl(path: string) {
  const url = `${SUPABASE_URL}/functions/v1/${path}`;
  navigator.clipboard.writeText(url);
  toast.success("Webhook URL copied to clipboard");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OperationsAgent() {
  const navigate = useNavigate();
  const { results: workflowResults, isSubmitting, triggerWorkflow } = useN8nWorkflow();

  const [briefings, setBriefings] = useState<AiBriefing[]>([]);
  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [qualityTickets, setQualityTickets] = useState<QualityTicket[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "briefings" | "maintenance" | "procurement" | "quality" | "setup">("overview");
  const [expandedBriefing, setExpandedBriefing] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);

  // Fetch all agent data
  useEffect(() => {
    async function fetchAll() {
      const [
        { data: b },
        { data: m },
        { data: p },
        { data: q },
      ] = await Promise.all([
        supabase.from("ai_briefings").select("*").order("generated_at", { ascending: false }).limit(20),
        supabase.from("maintenance_orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("quality_failure_tickets").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      if (b) setBriefings(b as AiBriefing[]);
      if (m) setMaintenanceOrders(m as MaintenanceOrder[]);
      if (p) setPurchaseOrders(p as PurchaseOrder[]);
      if (q) setQualityTickets(q as QualityTicket[]);
    }
    fetchAll();

    // Realtime subscriptions
    const briefingCh = supabase.channel("agent-briefings")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_briefings" }, (payload) => {
        setBriefings((prev) => [payload.new as AiBriefing, ...prev]);
      }).subscribe();

    const maintenanceCh = supabase.channel("agent-maintenance")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "maintenance_orders" }, (payload) => {
        setMaintenanceOrders((prev) => [payload.new as MaintenanceOrder, ...prev]);
      }).subscribe();

    const poCh = supabase.channel("agent-po")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchase_orders" }, (payload) => {
        setPurchaseOrders((prev) => [payload.new as PurchaseOrder, ...prev]);
      }).subscribe();

    return () => {
      supabase.removeChannel(briefingCh);
      supabase.removeChannel(maintenanceCh);
      supabase.removeChannel(poCh);
    };
  }, []);

  async function handleTrigger(workflow: typeof WORKFLOWS[0]) {
    setTriggering(workflow.id);
    try {
      await triggerWorkflow(
        workflow.taskType,
        { triggered_from: "tbos_dashboard", workflow_id: workflow.id, timestamp: new Date().toISOString() },
        "CEO",
        "medium"
      );
      toast.success(`🚀 ${workflow.name} triggered`);
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setTriggering(null);
    }
  }

  // Stats
  const pendingMaintenance = maintenanceOrders.filter((o) => o.status === "pending").length;
  const criticalMaintenance = maintenanceOrders.filter((o) => o.risk_level === "critical").length;
  const pendingPOs = purchaseOrders.filter((o) => o.status === "pending_approval").length;
  const openQuality = qualityTickets.filter((t) => t.status === "open").length;
  const latestBriefing = briefings[0];

  const TABS = [
    { id: "overview", label: "Overview", icon: Brain },
    { id: "briefings", label: `Briefings ${briefings.length > 0 ? `(${briefings.length})` : ""}`, icon: FileText },
    { id: "maintenance", label: `Maintenance ${pendingMaintenance > 0 ? `(${pendingMaintenance})` : ""}`, icon: Wrench },
    { id: "procurement", label: `Procurement ${pendingPOs > 0 ? `(${pendingPOs})` : ""}`, icon: Package },
    { id: "quality", label: `Quality ${openQuality > 0 ? `(${openQuality})` : ""}`, icon: FlaskConical },
    { id: "setup", label: "n8n Setup", icon: Terminal },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{
      backgroundImage: "radial-gradient(rgba(255,215,0,0.015) 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    }}>
      {/* Gold shimmer top bar */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD700, #B8960C)" }}>
              <Brain className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                TBOS <span style={{ color: "#FFD700" }}>OPERATIONS AGENT</span>
              </h1>
              <p className="text-xs text-muted-foreground">6 autonomous AI workflows · n8n orchestration</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-400/30 bg-green-400/5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-mono">AGENT ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "AI Briefings", value: briefings.length, icon: FileText, color: "text-yellow-400" },
                  { label: "Maintenance Alerts", value: pendingMaintenance, icon: Wrench, color: criticalMaintenance > 0 ? "text-red-400" : "text-orange-400", sub: criticalMaintenance > 0 ? `${criticalMaintenance} critical` : undefined },
                  { label: "Pending POs", value: pendingPOs, icon: Package, color: "text-blue-400" },
                  { label: "Quality Tickets", value: openQuality, icon: FlaskConical, color: openQuality > 0 ? "text-red-400" : "text-green-400" },
                ].map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-xl p-4 border border-border bg-card"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={cn("w-5 h-5", kpi.color)} />
                      </div>
                      <div className={cn("text-3xl font-bold font-mono", kpi.color)}>{kpi.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                      {kpi.sub && <div className="text-xs text-red-400 mt-0.5">{kpi.sub}</div>}
                    </motion.div>
                  );
                })}
              </div>

              {/* Latest briefing preview */}
              {latestBriefing && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-400">Latest AI Briefing</span>
                    <span className="text-xs text-muted-foreground ml-auto font-mono">{timeAgo(latestBriefing.generated_at)}</span>
                    <Badge variant="outline" className="text-xs">
                      {latestBriefing.type === "morning_briefing" ? "🌅 Morning" : "🌙 End of Day"}
                    </Badge>
                  </div>
                  <pre className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed line-clamp-6" style={{ fontFamily: "Inter, sans-serif" }}>
                    {latestBriefing.content}
                  </pre>
                  <Button variant="ghost" size="sm" className="mt-2 text-yellow-400" onClick={() => setActiveTab("briefings")}>
                    View all briefings <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              )}

              {/* Workflow grid */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Autonomous Workflows</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {WORKFLOWS.map((wf, i) => {
                    const Icon = wf.icon;
                    const isTriggering = triggering === wf.id;
                    const lastRun = workflowResults.find((r) => r.agent_type === wf.taskType);
                    return (
                      <motion.div
                        key={wf.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className={cn("rounded-xl border p-4 flex flex-col gap-3", wf.borderColor, wf.bgColor)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-background/50")}>
                            <Icon className={cn("w-4 h-4", wf.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm leading-tight">{wf.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{wf.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-mono">{wf.schedule}</span>
                          </div>
                          {lastRun && <StatusBadge status={lastRun.status} />}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn("flex-1 h-8 text-xs border-current", wf.color)}
                            onClick={() => handleTrigger(wf)}
                            disabled={isTriggering || isSubmitting}
                          >
                            {isTriggering ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3 mr-1" />
                            )}
                            Test Run
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={() => copyWebhookUrl(wf.webhookPath)}
                            title="Copy webhook URL"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Recent workflow runs */}
              {workflowResults.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Agent Runs</h2>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {workflowResults.slice(0, 8).map((run, i) => (
                      <div key={run.id} className={cn("flex items-center gap-3 px-4 py-3 text-sm", i > 0 && "border-t border-border/50")}>
                        <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-xs text-muted-foreground w-24 flex-shrink-0">{run.agent_type}</span>
                        <StatusBadge status={run.status} />
                        <span className="text-xs text-muted-foreground ml-auto font-mono">{timeAgo(run.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── BRIEFINGS ────────────────────────────────────────────────── */}
          {activeTab === "briefings" && (
            <motion.div key="briefings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">AI-Generated Briefings</h2>
                <p className="text-xs text-muted-foreground">Auto-saved from n8n workflows 1 & 5</p>
              </div>
              {briefings.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No briefings yet — n8n will send them here at 05:45 and 18:00</p>
                </div>
              ) : (
                briefings.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
                      onClick={() => setExpandedBriefing(expandedBriefing === b.id ? null : b.id)}
                    >
                      <div className="text-xl">{b.type === "morning_briefing" ? "🌅" : "🌙"}</div>
                      <div>
                        <div className="font-semibold text-sm">
                          {b.type === "morning_briefing" ? "Morning Intelligence Brief" : "End-of-Day Operations Report"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{b.plant_name} · {timeAgo(b.generated_at)}</div>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground ml-auto transition-transform", expandedBriefing === b.id && "rotate-90")} />
                    </button>
                    {expandedBriefing === b.id && (
                      <div className="px-5 pb-5 border-t border-border/50">
                        <pre className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mt-4" style={{ fontFamily: "Inter, sans-serif" }}>
                          {b.content}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── MAINTENANCE ──────────────────────────────────────────────── */}
          {activeTab === "maintenance" && (
            <motion.div key="maintenance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">AI Maintenance Work Orders</h2>
                <p className="text-xs text-muted-foreground">Generated by Predictive Maintenance Agent (every 4h)</p>
              </div>
              {maintenanceOrders.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                  <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No maintenance orders — n8n scans equipment every 4 hours</p>
                </div>
              ) : (
                maintenanceOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("rounded-xl border bg-card p-5", order.risk_level === "critical" ? "border-red-400/30" : order.risk_level === "high" ? "border-orange-400/30" : "border-border")}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-semibold">{order.equipment_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{timeAgo(order.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RiskBadge level={order.risk_level} />
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {[
                        { label: "Failure Type", value: order.failure_type },
                        { label: "Days Remaining", value: order.predicted_failure_days ? `${order.predicted_failure_days} days` : "—" },
                        { label: "Confidence", value: order.confidence_percent ? `${order.confidence_percent}%` : "—" },
                        { label: "Est. Cost", value: order.estimated_cost > 0 ? `$${order.estimated_cost.toLocaleString()}` : "—" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="text-sm font-mono font-semibold">{item.value || "—"}</div>
                        </div>
                      ))}
                    </div>
                    {order.recommended_action && (
                      <div className="rounded-lg bg-muted/30 p-3 text-sm">
                        <span className="text-yellow-400 font-semibold text-xs">ACTION: </span>
                        {order.recommended_action}
                      </div>
                    )}
                    {order.ai_analysis && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">AI Analysis</summary>
                        <pre className="text-xs mt-2 text-foreground/80 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                          {order.ai_analysis}
                        </pre>
                      </details>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── PROCUREMENT ──────────────────────────────────────────────── */}
          {activeTab === "procurement" && (
            <motion.div key="procurement" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">AI Purchase Orders</h2>
                <p className="text-xs text-muted-foreground">Auto-generated by Smart Reorder Agent</p>
              </div>
              {purchaseOrders.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No purchase orders — n8n triggers when stock drops below thresholds</p>
                </div>
              ) : (
                purchaseOrders.map((po) => (
                  <motion.div
                    key={po.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-semibold">{po.material_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{timeAgo(po.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded border font-mono uppercase",
                          po.urgency === "immediate" ? "text-red-400 border-red-400/40 bg-red-400/10" :
                          po.urgency === "this_week" ? "text-orange-400 border-orange-400/40 bg-orange-400/10" :
                          "text-blue-400 border-blue-400/40 bg-blue-400/10"
                        )}>
                          {po.urgency?.replace("_", " ")}
                        </span>
                        <StatusBadge status={po.status} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {[
                        { label: "Order Qty", value: `${po.quantity_tons}t` },
                        { label: "Current Stock", value: `${po.current_stock_tons}t` },
                        { label: "Days Left", value: `${po.days_remaining} days` },
                        { label: "Est. Cost", value: po.estimated_cost > 0 ? `$${po.estimated_cost.toLocaleString()}` : "—" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="text-sm font-mono font-semibold">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {po.ai_reasoning && (
                      <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                        <span className="text-yellow-400 font-semibold">AI Reasoning: </span>{po.ai_reasoning}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── QUALITY ──────────────────────────────────────────────────── */}
          {activeTab === "quality" && (
            <motion.div key="quality" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Quality Failure Tickets</h2>
                <p className="text-xs text-muted-foreground">AI root-cause analysis from Quality Failure Agent</p>
              </div>
              {qualityTickets.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No quality failures — all tests passing 🎉</p>
                </div>
              ) : (
                qualityTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-semibold">Batch {ticket.batch_id} · {ticket.mix_type}</div>
                        <div className="text-xs text-muted-foreground font-mono">{ticket.plant_name} · {timeAgo(ticket.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RiskBadge level={ticket.severity} />
                        <StatusBadge status={ticket.status} />
                      </div>
                    </div>
                    {ticket.slump_value != null && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Slump (measured)</div>
                          <div className="text-sm font-mono font-semibold text-red-400">{ticket.slump_value} mm</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Slump (target)</div>
                          <div className="text-sm font-mono font-semibold">{ticket.slump_target} mm</div>
                        </div>
                      </div>
                    )}
                    {ticket.ai_analysis && (
                      <div className="rounded-lg bg-muted/30 p-3 text-sm">
                        <div className="text-yellow-400 font-semibold text-xs mb-1">AI Analysis:</div>
                        <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                          {ticket.ai_analysis}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── SETUP ────────────────────────────────────────────────────── */}
          {activeTab === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <h2 className="font-semibold mb-1">n8n Integration Setup Guide</h2>
                <p className="text-sm text-muted-foreground">Connect your n8n self-hosted instance to TBOS. Each workflow calls a TBOS webhook to save results.</p>
              </div>

              {/* Architecture diagram */}
              <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">Architecture</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  {[
                    { label: "MONITOR", items: ["Supabase data", "Webhooks", "Schedules", "Sensors"], color: "text-blue-400 border-blue-400/30 bg-blue-400/5" },
                    { label: "DECIDE", items: ["Claude AI", "Rule engine", "Thresholds", "Pattern match"], color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5" },
                    { label: "ACT", items: ["Send alerts", "Create tasks", "Email/WhatsApp", "Update TBOS DB"], color: "text-green-400 border-green-400/30 bg-green-400/5" },
                  ].map((layer) => (
                    <div key={layer.label} className={cn("rounded-lg border p-3", layer.color)}>
                      <div className="font-bold mb-2">{layer.label}</div>
                      {layer.items.map((item) => <div key={item} className="text-muted-foreground">{item}</div>)}
                    </div>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground mt-3">n8n → Claude AI → TBOS</div>
              </div>

              {/* Webhook URLs */}
              <div>
                <h3 className="text-sm font-semibold mb-3">TBOS Webhook URLs <span className="text-muted-foreground font-normal">(paste into n8n workflows)</span></h3>
                <div className="space-y-2">
                  {[
                    { label: "Workflow 2 — Quality Failure Agent", path: "n8n-quality-failure", desc: "n8n calls this after AI root-cause analysis" },
                    { label: "Workflow 3 — Predictive Maintenance Agent", path: "n8n-maintenance-alert", desc: "n8n calls this with equipment failure predictions" },
                    { label: "Workflow 4 — Delivery Orchestrator", path: "n8n-delivery-event", desc: "n8n calls this for delivery_created / delivery_delayed events" },
                    { label: "Workflow 6 — Smart Reorder Agent", path: "n8n-inventory-alert", desc: "n8n calls this with AI reorder recommendations" },
                    { label: "Workflows 1 & 5 — Save Briefing", path: "n8n-save-briefing", desc: "n8n calls this to store AI-generated briefings in TBOS" },
                    { label: "Master Orchestrator (trigger from TBOS)", path: "n8n-orchestrator", desc: "TBOS uses this to trigger any n8n workflow manually" },
                  ].map((item) => (
                    <div key={item.path} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.desc}</div>
                        <div className="text-xs font-mono text-yellow-400/80 truncate mt-1">
                          {SUPABASE_URL}/functions/v1/{item.path}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="flex-shrink-0 h-8 text-xs" onClick={() => copyWebhookUrl(item.path)}>
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required n8n env vars */}
              <div>
                <h3 className="text-sm font-semibold mb-3">n8n Environment Variables <span className="text-muted-foreground font-normal">(set in n8n settings)</span></h3>
                <div className="rounded-xl border border-border bg-card p-4">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto">{`# AI
ANTHROPIC_API_KEY=sk-ant-...

# TBOS Callback URLs (paste from above)
TBOS_QUALITY_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-quality-failure
TBOS_MAINTENANCE_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-maintenance-alert
TBOS_DELIVERY_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-delivery-event
TBOS_REORDER_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-inventory-alert
TBOS_BRIEFING_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-save-briefing

# Communications
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_NUMBER=+212...
SENDGRID_API_KEY=SG...
WHATSAPP_PHONE_ID=...
WHATSAPP_TOKEN=...

# Team contacts
MANAGEMENT_EMAIL=management@atlasconcrete.ma
PLANT_MANAGER_PHONE=+212...
PLANT_MANAGER_WHATSAPP=+212...
MAINTENANCE_MANAGER_PHONE=+212...
QUALITY_TEAM_WHATSAPP=+212...
SUPPLIER_EMAIL=supplier@vendor.ma`}</pre>
                  <Button size="sm" variant="ghost" className="mt-3 text-xs" onClick={() => {
                    navigator.clipboard.writeText(`ANTHROPIC_API_KEY=sk-ant-...\nTBOS_QUALITY_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-quality-failure\nTBOS_MAINTENANCE_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-maintenance-alert\nTBOS_DELIVERY_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-delivery-event\nTBOS_REORDER_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-inventory-alert\nTBOS_BRIEFING_WEBHOOK=${SUPABASE_URL}/functions/v1/n8n-save-briefing`);
                    toast.success("Environment variables copied");
                  }}>
                    <Copy className="w-3 h-3 mr-1" /> Copy all vars
                  </Button>
                </div>
              </div>

              {/* Deployment order */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Deployment Order</h3>
                <div className="space-y-2">
                  {[
                    "Set all environment variables in n8n",
                    "Import Workflow 1 (Morning Brief) → test manually → activate",
                    "Import Workflow 2 (Quality Failure) → paste TBOS_QUALITY_WEBHOOK URL → activate",
                    "Import Workflow 3 (Predictive Maintenance) → paste TBOS_MAINTENANCE_WEBHOOK → activate",
                    "Import Workflow 4 (Delivery Orchestrator) → paste TBOS_DELIVERY_WEBHOOK → activate",
                    "Import Workflow 5 (Daily Report) → paste TBOS_BRIEFING_WEBHOOK → activate",
                    "Import Workflow 6 (Smart Reorder) → paste TBOS_REORDER_WEBHOOK → activate",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-mono text-xs flex-shrink-0">{i + 1}</span>
                      <span className="text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-4 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                <strong>TBOS side is ready.</strong> All webhook endpoints are deployed and database tables are created. Import the n8n workflow JSONs from your architecture doc to complete the setup.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
