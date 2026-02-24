import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import {
  LayoutDashboard,
  Factory,
  CalendarClock,
  Truck,
  DollarSign,
  Warehouse,
  Users,
  BarChart3,
  Settings,
  LogOut,
  FlaskConical,
  TruckIcon,
  CreditCard,
  Landmark,
  Building2,
  RefreshCcw,
  Wrench,
  HardHat,
  Package,
  Clock,
  Bot,
  TrendingUp,
  Bell,
  FileText,
  Shield,
  BookOpen,
  CheckSquare,
  Search,
  User,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { t, isRTL } = useI18n();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';

  const nav = t.nav as Record<string, string>;

  const sections: NavSection[] = [
    {
      label: nav.sectionOperations || 'Opérations',
      items: [
        { title: nav.dashboard, url: '/', icon: LayoutDashboard },
        { title: nav.production, url: '/production', icon: Factory },
        { title: nav.planning, url: '/planning', icon: CalendarClock },
        { title: nav.stocks, url: '/stocks', icon: Warehouse },
        { title: nav.laboratory, url: '/laboratoire', icon: FlaskConical },
        { title: nav.logistics, url: '/logistique', icon: TruckIcon },
      ],
    },
    {
      label: nav.sectionCommercial || 'Commercial',
      items: [
        { title: nav.sales, url: '/ventes', icon: DollarSign },
        { title: nav.clients, url: '/clients', icon: Users },
        { title: nav.deliveries, url: '/bons', icon: Truck },
        { title: nav.receivables || 'Créances', url: '/creances', icon: FileText },
      ],
    },
    {
      label: nav.sectionFinance || 'Finance',
      items: [
        { title: nav.expenses, url: '/depenses', icon: CreditCard },
        { title: nav.payments, url: '/paiements', icon: Landmark },
        { title: nav.debts || 'Dettes', url: '/dettes', icon: Building2 },
        { title: nav.fixedAssets || 'Immobilisations', url: '/immobilisations', icon: Package },
        { title: nav.reconciliation, url: '/rapprochement', icon: RefreshCcw },
      ],
    },
    {
      label: nav.sectionResources || 'Ressources',
      items: [
        { title: nav.contractors, url: '/prestataires', icon: HardHat },
        { title: nav.maintenance, url: '/maintenance', icon: Wrench },
        { title: nav.suppliers, url: '/fournisseurs', icon: Package },
        { title: nav.attendance, url: '/pointage', icon: Clock },
      ],
    },
    {
      label: nav.sectionIntelligence || 'Intelligence',
      items: [
        { title: nav.aiAgent || 'Agent IA', url: '/operations-agent', icon: Bot },
        { title: nav.analytics || 'Analytics', url: '/analytics', icon: TrendingUp },
        { title: nav.alerts || 'Alertes', url: '/alertes', icon: Bell },
        { title: nav.reports, url: '/rapports', icon: BarChart3 },
      ],
    },
    {
      label: nav.sectionAdmin || 'Administration',
      items: [
        { title: nav.profile || 'Profil', url: '/user_profile', icon: User },
        { title: nav.security, url: '/securite', icon: Shield },
        { title: nav.auditLog || 'Journal', url: '/journal', icon: BookOpen },
        { title: nav.approvals || 'Approbations', url: '/approbations', icon: CheckSquare },
        { title: nav.supervisorAudit || 'Audit Superviseur', url: '/audit-superviseur', icon: Search },
        { title: nav.settings, url: '/settings', icon: Settings },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  const handleNav = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  // User display
  const userEmail = user?.email || '';
  const rawUserName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Utilisateur';
  const userName = rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1);
  const userInitials = userName.slice(0, 2).toUpperCase();
  const roleLabel = (role || 'user').toUpperCase();

  return (
    <Sidebar
      side={isRTL ? 'right' : 'left'}
      className="!border-0 relative"
      collapsible="icon"
      style={{
        background: '#070B12',
        borderRight: 'none',
      } as React.CSSProperties}
    >
      {/* Golden spine — right edge gradient border */}
      <div className="absolute top-0 right-0 bottom-0 w-[1px] z-50" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(232,184,75,0.2) 30%, rgba(232,184,75,0.15) 70%, transparent 100%)' }} />

      <SidebarContent className="flex flex-col h-full relative overflow-hidden" style={{ background: 'transparent' }}>
        {/* Aggregate texture — concrete materiality */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.008,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='30' r='8' fill='white' opacity='0.3'/%3E%3Ccircle cx='70' cy='15' r='5' fill='white' opacity='0.2'/%3E%3Ccircle cx='45' cy='65' r='10' fill='white' opacity='0.25'/%3E%3Ccircle cx='85' cy='75' r='6' fill='white' opacity='0.2'/%3E%3Ccircle cx='15' cy='85' r='4' fill='white' opacity='0.15'/%3E%3Ccircle cx='60' cy='45' r='7' fill='white' opacity='0.2'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Brand — Architectural treatment with golden halo */}
        {!collapsed && (
          <div className="px-6 pt-7 pb-6 shrink-0 relative z-[1]">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.5) 0%, transparent 70%)' }} />
              <div className="relative text-[13px] font-semibold tracking-[0.3em] uppercase" style={{ color: '#E8B84B' }}>TBOS</div>
            </div>
            <div className="text-[9px] tracking-[0.4em] uppercase text-slate-600 mt-0.5">Suite</div>
          </div>
        )}

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          {sections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-6 pt-8 pb-2">
                  <span className="text-[8px] font-medium uppercase tracking-[0.35em] text-slate-700">
                    {section.label}
                  </span>
                </div>
              )}
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        onClick={() => handleNav(item.url)}
                        tooltip={item.title}
                        className={cn(
                          'relative flex items-center gap-3 px-6 py-2 mx-3 rounded-lg transition-all duration-300 cursor-pointer',
                          active
                            ? 'text-white/90 font-medium'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                        )}
                        style={active ? { background: 'rgba(232,184,75,0.06)', borderLeft: '2px solid #E8B84B' } : undefined}
                      >
                        <item.icon
                          className={cn(
                            'w-[15px] h-[15px] shrink-0',
                            active ? 'opacity-60' : 'opacity-30'
                          )}
                        />
                        {!collapsed && <span className="truncate text-[12.5px]">{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: 'transparent' }}>
        {/* User info */}
        {!collapsed && (
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.1))' }}>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(234,179,8,0.7)' }}>{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-white/70 truncate">{userName}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 truncate">{roleLabel}</p>
              </div>
            </div>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                signOut();
                if (isMobile) setOpenMobile(false);
              }}
              tooltip={nav.logout}
              className="px-6 py-3 text-[10px] text-slate-700 hover:text-slate-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-[15px] h-[15px] opacity-30 shrink-0" />
              {!collapsed && <span>{nav.logout}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
