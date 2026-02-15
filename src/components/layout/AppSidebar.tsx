import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
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

// Nav items use i18n keys - labels resolved in component
const mainNavKeys = [
  { titleKey: 'nav.home', url: '/', icon: LayoutDashboard },
  { titleKey: 'nav.production', url: '/production', icon: Factory },
  { titleKey: 'nav.planning', url: '/planning', icon: CalendarClock },
  { titleKey: 'nav.deliveries', url: '/bons', icon: Truck },
];

const managementNavKeys = [
  { titleKey: 'nav.finance', url: '/ventes', icon: DollarSign },
  { titleKey: 'nav.stocks', url: '/stocks', icon: Warehouse },
  { titleKey: 'nav.clients', url: '/clients', icon: Users },
  { titleKey: 'nav.reports', url: '/rapports', icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof mainNavKeys) =>
    items.map((item) => {
      const title = t(item.titleKey);
      return (
        <SidebarMenuItem key={item.titleKey}>
          <SidebarMenuButton
            onClick={() => navigate(item.url)}
            tooltip={title}
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
            {!collapsed && <span className="truncate">{title}</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar
      className="border-r border-border bg-background"
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
            {t('nav.principal')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNavKeys)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">
            {t('nav.management')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(managementNavKeys)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/user_profile')}
              tooltip={t('nav.settings')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{t('nav.settings')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              tooltip={t('nav.logout')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{t('nav.logout')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
