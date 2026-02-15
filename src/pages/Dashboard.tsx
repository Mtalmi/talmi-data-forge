import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Truck, DollarSign, Settings, Bell, Search, Sun, MapPin, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, Clock, LogOut, Menu, BarChart3, Users, Package, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const productionData = [{ day: 'Lun', value: 85 }, { day: 'Mar', value: 92 }, { day: 'Mer', value: 78 }, { day: 'Jeu', value: 95 }, { day: 'Ven', value: 88 }, { day: 'Sam', value: 65 }, { day: 'Dim', value: 45 }];
const recentActivity = [{ id: 1, action: 'Livraison complétée', details: 'Camion #124 - Client: BTP Maroc', time: 'Il y a 5 min', status: 'success' }, { id: 2, action: 'Nouvelle commande', details: '120m³ - Formule C25/30', time: 'Il y a 12 min', status: 'info' }, { id: 3, action: 'Alerte qualité', details: 'Test de consistance - Lot #4582', time: 'Il y a 28 min', status: 'warning' }, { id: 4, action: 'Maintenance planifiée', details: 'Malaxeur #3 - Demain 06:00', time: 'Il y a 1h', status: 'info' }];
const alerts = [{ id: 1, type: 'warning', message: 'Stock de ciment faible', detail: 'Restant: 45 tonnes' }, { id: 2, type: 'success', message: 'Objectif journalier atteint', detail: 'Production: 120m³/120m³' }, { id: 3, type: 'info', message: '3 livraisons en cours', detail: 'Dernière ETA: 14:30' }];

function StatCard({ title, value, change, changeType, icon: Icon, subtitle }: any) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-foreground mt-1">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3">
        {changeType === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
        {changeType === 'down' && <ArrowDownRight className="w-4 h-4 text-red-400" />}
        {changeType === 'neutral' && <Activity className="w-4 h-4 text-muted-foreground" />}
        <span className={`text-xs font-medium ${changeType === 'up' ? 'text-emerald-400' : changeType === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>{change}</span>
        <span className="text-xs text-muted-foreground ml-1">vs hier</span>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('accueil');

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-border transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-lg">TB</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">TBOS</span>
              <span className="block text-[10px] font-mono text-muted-foreground tracking-widest">ENTERPRISE SUITE</span>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Accueil" active={activeTab === 'accueil'} onClick={() => setActiveTab('accueil')} />
          <SidebarItem icon={TrendingUp} label="Production" active={activeTab === 'production'} onClick={() => setActiveTab('production')} />
          <SidebarItem icon={Truck} label="Livraisons" active={activeTab === 'livraisons'} onClick={() => setActiveTab('livraisons')} />
          <SidebarItem icon={DollarSign} label="Finance" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
          <SidebarItem icon={Package} label="Stocks" active={activeTab === 'stocks'} onClick={() => setActiveTab('stocks')} />
          <SidebarItem icon={Users} label="Clients" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <SidebarItem icon={BarChart3} label="Rapports" active={activeTab === 'rapports'} onClick={() => setActiveTab('rapports')} />
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <SidebarItem icon={Settings} label="Paramètres" onClick={() => toast.info('Paramètres - à venir')} />
          <button onClick={() => toast.info('Déconnexion...')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-1">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-foreground">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Bonjour, Master 👋</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Casablanca</span>
                  <span className="text-border">•</span>
                  <Sun className="w-3.5 h-3.5" />
                  <span>24°C</span>
                  <span className="text-border">•</span>
                  <span className="text-primary">L'usine tourne à 100% d'efficacité</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-card/60 border border-border rounded-lg">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Recherche rapide..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48" />
              </div>
              <button onClick={() => toast.info('3 notifications non lues')} className="relative p-2.5 rounded-lg hover:bg-white/5 text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary-foreground text-sm">M</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">Master</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Production" value="120 m³/h" change="+12%" changeType="up" icon={TrendingUp} subtitle="Objectif: 115 m³/h" />
            <StatCard title="Livraisons" value="24" change="+3" changeType="up" icon={Truck} subtitle="Camions en route" />
            <StatCard title="Qualité" value="98%" change="+2%" changeType="up" icon={CheckCircle} subtitle="Tests conformes" />
            <StatCard title="Profit Net" value="45,230 DH" change="-5%" changeType="down" icon={DollarSign} subtitle="Ce mois-ci" />
          </div>

          {/* Charts + Alerts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Production Chart */}
            <div className="lg:col-span-2 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">Production Hebdomadaire</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Volume produit par jour (m³)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">Semaine</Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">Mois</Button>
                </div>
              </div>
              <div className="h-48 flex items-end justify-between gap-3">
                {productionData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-primary/20 rounded-t-lg relative group cursor-pointer hover:bg-primary/30 transition-colors" style={{ height: `${(item.value / 100) * 160}px` }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-500" style={{ height: `${(item.value / 100) * 100}%` }} />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.value}m³</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Alertes</h3>
                <span className="text-xs text-muted-foreground">{alerts.length} actives</span>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                    <div className="flex items-start gap-2">
                      {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />}
                      {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />}
                      {alert.type === 'info' && <Clock className="w-4 h-4 text-blue-500 mt-0.5" />}
                      <div>
                        <p className={`text-sm font-medium ${alert.type === 'warning' ? 'text-amber-500' : alert.type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`}>{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity + Quick Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Activité Récente</h3>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">Voir tout</Button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.status === 'success' ? 'bg-emerald-500/10' : activity.status === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                      {activity.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {activity.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {activity.status === 'info' && <Clock className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Actions Rapides</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:border-primary/30 hover:bg-primary/5" onClick={() => toast.info('Nouvelle commande - à venir')}>
                  <Package className="w-6 h-6 text-primary" />
                  <span className="text-sm">Nouvelle Commande</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:border-primary/30 hover:bg-primary/5" onClick={() => toast.info('Planifier livraison - à venir')}>
                  <Truck className="w-6 h-6 text-primary" />
                  <span className="text-sm">Planifier Livraison</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:border-primary/30 hover:bg-primary/5" onClick={() => toast.info('Ajouter client - à venir')}>
                  <Users className="w-6 h-6 text-primary" />
                  <span className="text-sm">Ajouter Client</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:border-primary/30 hover:bg-primary/5" onClick={() => toast.info('Générer rapport - à venir')}>
                  <BarChart3 className="w-6 h-6 text-primary" />
                  <span className="text-sm">Rapport PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
