import { useState } from 'react';
import {
  Home, Factory, Truck, DollarSign, Settings, Bell, Search,
  TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle,
  ChevronRight, BarChart3, Users, Gauge, ArrowUpRight, ArrowDownRight,
  Clock, Zap, Shield, Eye, MoreHorizontal, Calendar, MapPin, Cloud,
  Sun, Thermometer, LogOut
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Tooltip,
} from 'recharts';

/* ── mock data ── */
const productionData = [
  { hour: '06h', volume: 42, target: 50 },
  { hour: '07h', volume: 68, target: 50 },
  { hour: '08h', volume: 85, target: 50 },
  { hour: '09h', volume: 92, target: 50 },
  { hour: '10h', volume: 78, target: 50 },
  { hour: '11h', volume: 95, target: 50 },
  { hour: '12h', volume: 55, target: 50 },
  { hour: '13h', volume: 72, target: 50 },
  { hour: '14h', volume: 88, target: 50 },
  { hour: '15h', volume: 102, target: 50 },
  { hour: '16h', volume: 76, target: 50 },
  { hour: '17h', volume: 45, target: 50 },
];

const weeklyData = [
  { day: 'Lun', value: 420 },
  { day: 'Mar', value: 380 },
  { day: 'Mer', value: 510 },
  { day: 'Jeu', value: 470 },
  { day: 'Ven', value: 530 },
  { day: 'Sam', value: 290 },
  { day: 'Dim', value: 0 },
];

const recentActivity = [
  { id: 1, type: 'delivery', message: 'BL-2026-0842 livré à Chantier Casablanca', time: 'Il y a 3 min', status: 'success' },
  { id: 2, type: 'production', message: 'Lot #1247 — B25 CPJ45 produit (8m³)', time: 'Il y a 8 min', status: 'success' },
  { id: 3, type: 'alert', message: 'Taux E/C lot #1245 hors tolérance (0.58)', time: 'Il y a 15 min', status: 'warning' },
  { id: 4, type: 'payment', message: 'Paiement reçu — Client Bouygues (45,000 DH)', time: 'Il y a 22 min', status: 'success' },
  { id: 5, type: 'maintenance', message: 'Maintenance préventive — Malaxeur #2 planifiée', time: 'Il y a 35 min', status: 'info' },
  { id: 6, type: 'alert', message: 'Stock ciment < seuil (12T restants)', time: 'Il y a 1h', status: 'warning' },
];

const alerts = [
  { id: 1, level: 'critical', title: 'Stock Ciment Critique', message: 'Seuil minimum atteint — commande urgente requise', time: 'Il y a 45 min' },
  { id: 2, level: 'warning', title: 'Retard Paiement', message: 'Client GAMMA — 120,000 DH en retard de 30 jours', time: 'Il y a 2h' },
  { id: 3, level: 'info', title: 'Maintenance Planifiée', message: 'Arrêt préventif centrale #2 prévu demain 06h', time: 'Il y a 3h' },
];

const navItems = [
  { icon: Home, label: 'Accueil', active: true },
  { icon: Factory, label: 'Production', active: false },
  { icon: Truck, label: 'Livraisons', active: false },
  { icon: DollarSign, label: 'Finance', active: false },
  { icon: Settings, label: 'Paramètres', active: false },
];

const chartConfig = {
  volume: { label: 'Volume (m³)', color: 'hsl(45 87% 62%)' },
  target: { label: 'Objectif', color: 'hsl(220 9% 46%)' },
};

const barConfig = {
  value: { label: 'Volume (m³)', color: 'hsl(45 87% 62%)' },
};

/* ── stat card ── */
function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, accentColor = 'primary' }: {
  title: string; value: string; subtitle: string;
  icon: any; trend: 'up' | 'down' | 'neutral';
  trendValue: string; accentColor?: string;
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">{value}</p>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
              <TrendIcon size={12} /> {trendValue}
            </span>
            <span className="text-[10px] text-muted-foreground">{subtitle}</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon size={18} className="text-primary" />
        </div>
      </div>
    </div>
  );
}

/* ── main component ── */
export default function DashboardShowcase() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('Accueil');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-card/50 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="font-bold text-primary-foreground text-sm">TB</span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="font-semibold text-foreground text-sm">TBOS</span>
              <span className="block text-[9px] font-mono text-muted-foreground tracking-widest">ENTERPRISE</span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeNav === label
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <Eye size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Réduire</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Header ── */}
        <header className="h-16 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-base lg:text-lg font-semibold text-foreground">
                Bonjour, <span className="text-primary">Mohamed</span>
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Weather Widget */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
              <Sun size={14} className="text-primary" />
              <span className="text-xs text-foreground font-semibold">28°C</span>
              <span className="text-[10px] text-muted-foreground">Casablanca</span>
            </div>

            {/* Search */}
            <button className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
              <Search size={16} />
            </button>

            {/* Notifications */}
            <button className="relative h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">3</span>
            </button>

            {/* Avatar */}
            <Avatar className="h-9 w-9 border-2 border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">MT</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Production" value="92 m³/h" subtitle="vs hier" icon={Gauge} trend="up" trendValue="+12%" />
            <StatCard title="Livraisons" value="24" subtitle="camions en route" icon={Truck} trend="up" trendValue="+4" />
            <StatCard title="Qualité" value="98.2%" subtitle="conformité" icon={Shield} trend="up" trendValue="+0.5%" />
            <StatCard title="Profit Net" value="127K DH" subtitle="ce mois" icon={TrendingUp} trend="down" trendValue="-3%" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Main Production Chart */}
            <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Production Aujourd'hui</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Volume horaire (m³)</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Volume</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Objectif</span>
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <AreaChart data={productionData}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45 87% 62%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(45 87% 62%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 18%)" vertical={false} />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="target" stroke="hsl(220 9% 36%)" strokeWidth={1} strokeDasharray="5 5" fill="none" />
                  <Area type="monotone" dataKey="volume" stroke="hsl(45 87% 62%)" strokeWidth={2} fill="url(#volumeGradient)" />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Weekly Bar Chart */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Volume Hebdomadaire</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Total: 2,600 m³</p>
                </div>
              </div>
              <ChartContainer config={barConfig} className="h-[280px] w-full">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 18%)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(45 87% 62%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Bottom Row: Activity + Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Activité Récente</h3>
                <button className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors">Voir tout</button>
              </div>
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      item.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {item.status === 'success' ? <CheckCircle size={14} /> :
                       item.status === 'warning' ? <AlertTriangle size={14} /> :
                       <Zap size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground leading-relaxed">{item.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Alertes Système</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {alerts.length} actives
                </span>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${
                    alert.level === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                    alert.level === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-blue-500/5 border-blue-500/20'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          alert.level === 'critical' ? 'bg-red-500 animate-pulse' :
                          alert.level === 'warning' ? 'bg-amber-500' :
                          'bg-blue-500'
                        }`} />
                        <span className="text-xs font-semibold text-foreground">{alert.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 ml-4">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
