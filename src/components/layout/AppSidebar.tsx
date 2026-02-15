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
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useI18n();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const mainNav = [
    { title: t.nav.dashboard, url: '/', icon: LayoutDashboard },
    { title: t.nav.production, url: '/production', icon: Factory },
    { title: t.nav.planning, url: '/planning', icon: CalendarClock },
    { title: t.nav.deliveries, url: '/bons', icon: Truck },
  ];

  const managementNav = [
    { title: t.nav.sales, url: '/ventes', icon: DollarSign },
    { title: t.nav.stocks, url: '/stocks', icon: Warehouse },
    { title: t.nav.clients, url: '/clients', icon: Users },
    { title: t.nav.reports, url: '/rapports', icon: BarChart3 },
  ];

  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          onClick={() => navigate(item.url)}
          tooltip={item.title}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            isActive(item.url)
              ? 'bg-primary/15 text-primary border border-primary/25 font-semibold shadow-[0_0_12px_hsl(var(--primary)/0.1)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <item.icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              isActive(item.url) ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  const { isRTL } = useI18n();

  return (
    <Sidebar
      side={isRTL ? 'right' : 'left'}
      className={cn(
        'bg-background',
        isRTL ? 'border-l border-border' : 'border-r border-border'
      )}
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        {/* Brand */}
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-border/30">
            <span className="text-sm font-bold tracking-wide text-primary">
              TBOS
            </span>
            <span className="text-xs text-muted-foreground ml-1">Suite</span>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">
            {t.nav.main}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">
            {t.nav.management}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(managementNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/user_profile')}
              tooltip={t.nav.settings}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{t.nav.settings}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              tooltip={t.nav.logout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{t.nav.logout}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
