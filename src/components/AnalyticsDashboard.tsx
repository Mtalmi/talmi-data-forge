import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { TrendingUp, Activity, Users, Zap } from "lucide-react";

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Simulated real-time data
  const agentPerformanceData = [
    { agent: "Predictive Quality", uptime: 99.99, efficiency: 95 },
    { agent: "Maintenance", uptime: 99.98, efficiency: 94 },
    { agent: "Supply Chain", uptime: 99.97, efficiency: 93 },
    { agent: "Compliance", uptime: 99.99, efficiency: 96 },
    { agent: "Analytics", uptime: 99.96, efficiency: 92 },
    { agent: "Optimization", uptime: 99.95, efficiency: 91 },
  ];

  const uptimeData = [
    { time: "00:00", uptime: 99.99 },
    { time: "04:00", uptime: 99.98 },
    { time: "08:00", uptime: 99.99 },
    { time: "12:00", uptime: 99.97 },
    { time: "16:00", uptime: 99.99 },
    { time: "20:00", uptime: 99.98 },
    { time: "24:00", uptime: 99.99 },
  ];

  const customerMetricsData = [
    { month: "Jan", customers: 45, revenue: 2.1 },
    { month: "Feb", customers: 52, revenue: 2.4 },
    { month: "Mar", customers: 68, revenue: 3.1 },
    { month: "Apr", customers: 85, revenue: 3.9 },
    { month: "May", customers: 110, revenue: 5.0 },
    { month: "Jun", customers: 145, revenue: 6.7 },
  ];

  const agentDistribution = [
    { name: "Phase 1 Core", value: 12, color: "#D4A843" },
    { name: "Phase B Growth", value: 20, color: "#E8C96A" },
    { name: "Phase C Strategic", value: 4, color: "#C49A3C" },
    { name: "Phase 2 Advanced", value: 12, color: "#F59E0B" },
    { name: "Marketing", value: 10, color: "#22C55E" },
  ];

  const stats = [
    {
      icon: <Activity className="w-6 h-6 text-accent" />,
      label: "System Uptime",
      value: "99.99%",
      change: "+0.02%",
      positive: true,
    },
    {
      icon: <Zap className="w-6 h-6 text-accent" />,
      label: "Avg Response Time",
      value: "47ms",
      change: "-12ms",
      positive: true,
    },
    {
      icon: <Users className="w-6 h-6 text-accent" />,
      label: "Active Customers",
      value: "145",
      change: "+35",
      positive: true,
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-accent" />,
      label: "Monthly Revenue",
      value: "$6.7M",
      change: "+33%",
      positive: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Real-Time Analytics Dashboard
        </h2>
        <p className="text-muted-foreground">
          Live system performance, agent metrics, and business intelligence
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>{stat.icon}</div>
                <div className={`text-sm font-semibold ${stat.positive ? "text-green-500" : "text-red-500"}`}>
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {["overview", "agents", "customers", "distribution"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm transition ${
              activeTab === tab
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Uptime Trend */}
        {activeTab === "overview" && (
          <>
            <Card className="bg-card border-border md:col-span-2">
              <CardHeader>
                <CardTitle>Tendance Disponibilité Système (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={uptimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={[99.9, 100]} tickFormatter={v => `${v}%`} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1A1F35", border: "1px solid #D4A843", borderRadius: 8, color: "#FFFFFF" }}
                      formatter={(value) => `${value}%`}
                    />
                    <Line
                      type="monotone"
                      dataKey="uptime"
                      stroke="#D4A843"
                      strokeWidth={2}
                      dot={{ fill: "#D4A843", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent Performance */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Performance Disponibilité par Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="agent" angle={-45} textAnchor="end" height={100} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={[99, 100]} tickFormatter={v => `${v}%`} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1A1F35", border: "1px solid #D4A843", borderRadius: 8, color: "#FFFFFF" }}
                      formatter={(value) => `${value}%`}
                    />
                    <Bar dataKey="uptime" fill="#D4A843" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Efficiency Metrics */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Score d'Efficacité par Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="agent" angle={-45} textAnchor="end" height={100} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={[85, 100]} tickFormatter={v => `${v}%`} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1A1F35", border: "1px solid #D4A843", borderRadius: 8, color: "#FFFFFF" }}
                      formatter={(value) => `${value}%`}
                    />
                    <Bar dataKey="efficiency" fill="#E8C96A" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader>
              <CardTitle>Agent Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformanceData.map((agent, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{agent.agent}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-accent">Uptime: {agent.uptime}%</span>
                        <span className="text-orange-500">Efficiency: {agent.efficiency}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 h-2 bg-card rounded-full overflow-hidden">
                      <div
                        className="bg-accent rounded-full"
                        style={{ width: `${agent.uptime}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <Card className="bg-card border-border md:col-span-2">
              <CardHeader>
                <CardTitle>Croissance Clients & Chiffre d'Affaires</CardTitle>
              </CardHeader>
              <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={customerMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis yAxisId="left" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1F35", border: "1px solid #D4A843", borderRadius: 8, color: "#FFFFFF" }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="customers"
                    stroke="#D4A843"
                    strokeWidth={2}
                    name="Clients Actifs"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#E8C96A"
                    strokeWidth={2}
                    name="CA (M$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribution Tab */}
        {activeTab === "distribution" && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader>
              <CardTitle>Agent Distribution by Phase</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={agentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#D4A843"
                    dataKey="value"
                  >
                    {agentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1F35", border: "1px solid #D4A843", color: "#FFFFFF" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>System Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Total Agents</div>
              <div className="text-2xl font-bold text-accent">58</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Avg Response Time</div>
              <div className="text-2xl font-bold text-accent">47ms</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">System Reliability</div>
              <div className="text-2xl font-bold text-accent">99.99%</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Customer Satisfaction</div>
              <div className="text-2xl font-bold text-accent">4.8/5</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
