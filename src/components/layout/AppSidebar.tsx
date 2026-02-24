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
      className={cn(
        'bg-background',
        isRTL ? 'border-l border-border' : 'border-r border-border'
      )}
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col h-full">
        {/* Brand */}
        {!collapsed && (
          <div className="px-4 py-4 shrink-0 border-b border-border/30">
            <span className="text-sm font-bold tracking-wide text-primary">
              TBOS
            </span>
            <span className="text-xs text-muted-foreground ml-1">Suite</span>
          </div>
        )}

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          {sections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-4 pt-5 pb-1.5">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/50">
                    {section.label}
                  </span>
                </div>
              )}
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      onClick={() => handleNav(item.url)}
                      tooltip={item.title}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-all duration-200 active:scale-[0.98]',
                        isActive(item.url)
                          ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive(item.url) ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      {!collapsed && <span className="truncate text-sm">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 py-3 shrink-0">
        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 pb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
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
              className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm">{nav.logout}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
